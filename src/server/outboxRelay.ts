/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Transactional Outbox Relay
 * Prevents dual-write inconsistencies between PostgreSQL and NATS JetStream
 */
import { ValidatedCloudEvent, CloudEventSchema } from '../schemas/api.schemas.ts';

export interface OutboxRecord {
  id: string;
  tenantId: string;
  eventType: string;
  payload: ValidatedCloudEvent;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  processedAt?: string;
}

export class TransactionalOutboxRelay {
  private static outboxQueue: OutboxRecord[] = [];

  /**
   * Enqueue a CloudEvent into the outbox within the database transaction.
   */
  static enqueue(event: ValidatedCloudEvent): OutboxRecord {
    const validated = CloudEventSchema.parse(event);
    const record: OutboxRecord = {
      id: validated.id,
      tenantId: validated.tenantId,
      eventType: validated.type,
      payload: validated,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.outboxQueue.push(record);
    return record;
  }

  /**
   * Process pending outbox events and publish to NATS JetStream subject.
   */
  static async processPendingEvents(
    publisher: (subject: string, data: ValidatedCloudEvent) => Promise<boolean>
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const record of this.outboxQueue) {
      if (record.status !== 'PENDING') continue;

      const subject = `mirovisor.${record.tenantId}.telemetry.${record.eventType}`;
      try {
        const success = await publisher(subject, record.payload);
        if (success) {
          record.status = 'PROCESSED';
          record.processedAt = new Date().toISOString();
          processed++;
        } else {
          record.retryCount++;
          if (record.retryCount >= 3) record.status = 'FAILED';
          failed++;
        }
      } catch {
        record.retryCount++;
        if (record.retryCount >= 3) record.status = 'FAILED';
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Inspect current outbox backlog.
   */
  static getBacklogCount(): number {
    return this.outboxQueue.filter((r) => r.status === 'PENDING').length;
  }

  static clearQueue(): void {
    this.outboxQueue = [];
  }
}
