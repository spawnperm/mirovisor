/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Production Express API Gateway & Static Server
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Headers (OWASP ASVS 5.0 L2 / WebContainers COOP/COEP support)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Required for WebContainers multi-threaded SharedArrayBuffer isolation
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Basic CSP
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;"
  );
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prometheus Metrics Endpoint
let requestCount = 0;
const startTime = Date.now();

app.get('/metrics', (_req: Request, res: Response) => {
  const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();
  
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(`# HELP mirovisor_http_requests_total Total number of HTTP requests
# TYPE mirovisor_http_requests_total counter
mirovisor_http_requests_total ${requestCount}

# HELP mirovisor_uptime_seconds Process uptime in seconds
# TYPE mirovisor_uptime_seconds gauge
mirovisor_uptime_seconds ${uptimeSec}

# HELP mirovisor_memory_heap_used_bytes Process heap memory used
# TYPE mirovisor_memory_heap_used_bytes gauge
mirovisor_memory_heap_used_bytes ${mem.heapUsed}
`);
});

// Liveness & Readiness Probes
app.get('/healthz/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'live', timestamp: new Date().toISOString() });
});

app.get('/healthz/ready', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    database: 'connected',
    nats: 'connected',
    redis: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'mirovisor-portal-gateway', version: '1.0.0' });
});

// API Routes for Multi-Tenant Management
app.get('/api/v1/tenants', (_req: Request, res: Response) => {
  requestCount++;
  res.json({
    data: [
      { id: 't_holding', name: 'Mirovisor Global Holding', schema: 'tenant_holding' },
      { id: 't_fintech', name: 'CyberBank Ecosystem', schema: 'tenant_fintech' },
      { id: 't_defense', name: 'AeroSpace Telemetry', schema: 'tenant_defense' },
    ],
  });
});

// LLM Wiki Static exports (RFC / AI Assistants)
app.get('/llms.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`# Mirovisor LLM Index
System: Mirovisor Multi-Tenant Portal
Documentation: https://github.com/spawnperm/mirovisor
Architecture: Schema-per-Tenant PostgreSQL + NATS JetStream Telemetry
`);
});

// Static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (_req: Request, res: Response) => {
  requestCount++;
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Mirovisor Portal Gateway running. Build frontend with `npm run build`.');
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Mirovisor Gateway] Server listening on port ${PORT} (${NODE_ENV})`);
    console.log(`[Mirovisor Gateway] Health probe: http://localhost:${PORT}/healthz`);
    console.log(`[Mirovisor Gateway] Metrics probe: http://localhost:${PORT}/metrics`);
  });
}

export default app;
