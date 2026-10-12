import { describe, it, expect } from 'vitest';
import app from '../../server.ts';

describe('Mirovisor Express Gateway & API Endpoints', () => {
  it('exports a valid Express application instance', () => {
    expect(app).toBeDefined();
    expect(typeof (app as unknown as { handle: unknown }).handle).toBe('function');
  });

  it('contains registered routes for health, metrics and OpenAPI spec', () => {
    // Inspect route stack
    const routerStack = (app as unknown as { _router: { stack: Array<{ route?: { path: string } }> } })._router.stack;
    const routes = routerStack
      .filter((layer) => layer.route)
      .map((layer) => layer.route?.path);

    expect(routes).toContain('/metrics');
    expect(routes).toContain('/healthz/live');
    expect(routes).toContain('/healthz/ready');
    expect(routes).toContain('/healthz');
    expect(routes).toContain('/api/v1/spec');
    expect(routes).toContain('/api/v1/tenants');
    expect(routes).toContain('/api/v1/kanban/cards');
    expect(routes).toContain('/api/v1/security/findings');
    expect(routes).toContain('/llms.txt');
  });
});
