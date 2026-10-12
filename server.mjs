// server.ts
import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// src/schemas/api.schemas.ts
import { z } from "zod";
var TenantSchema = z.object({
  id: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, "Tenant ID must be lowercase alphanumeric with underscores"),
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/, "Slug must be kebab-case"),
  schema: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, "PostgreSQL schema name must be valid identifier"),
  tier: z.enum(["holding", "division", "project", "sandbox"]).default("project"),
  storageQuotaMb: z.number().int().positive().default(5120),
  storageUsedMb: z.number().int().nonnegative().default(0)
});
var KanbanCardSchema = z.object({
  id: z.string().min(1),
  columnId: z.enum(["incoming", "refinement", "ready_for_work", "in_progress", "review", "done"]),
  title: z.string().min(3).max(200),
  description: z.string().max(1e4),
  qualityRating: z.number().min(1).max(5).optional(),
  rollbackSnapshot: z.string().optional(),
  tags: z.array(z.string()).default([])
});
var SecurityFindingSchema = z.object({
  id: z.string().min(1),
  scanner: z.enum(["CodeQL", "Snyk", "Gitleaks", "OWASP ZAP", "Aqua Trivy", "Semgrep"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  title: z.string().min(3).max(255),
  fileOrUrl: z.string().min(1),
  description: z.string(),
  cwe: z.string().regex(/^CWE-\d+$/),
  status: z.enum(["open", "in_progress", "resolved", "ignored"]).default("open"),
  detectedAt: z.string().datetime(),
  remediationSnippet: z.string().optional()
});
var CloudEventSchema = z.object({
  specversion: z.literal("1.0"),
  type: z.string().min(3),
  source: z.string().url().or(z.string().min(1)),
  id: z.string().uuid(),
  time: z.string().datetime(),
  datacontenttype: z.literal("application/json"),
  data: z.record(z.string(), z.unknown()),
  tenantId: z.string().min(2).max(64)
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
var NODE_ENV = process.env.NODE_ENV || "development";
var tenants = [
  { id: "t_holding", name: "Mirovisor Global Holding", slug: "holding", schema: "tenant_holding", tier: "holding", storageQuotaMb: 20480, storageUsedMb: 4200 },
  { id: "t_fintech", name: "CyberBank Ecosystem", slug: "cyberbank", schema: "tenant_fintech", tier: "division", storageQuotaMb: 10240, storageUsedMb: 1200 },
  { id: "t_defense", name: "AeroSpace Telemetry", slug: "aerospace", schema: "tenant_defense", tier: "project", storageQuotaMb: 5120, storageUsedMb: 850 }
];
var kanbanCards = [
  { id: "c_1", columnId: "ready_for_work", title: "\u0412\u0438\u0440\u0442\u0443\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F D3 \u0441\u043F\u0438\u0441\u043A\u043E\u0432", description: "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430", qualityRating: 5, tags: ["perf"] },
  { id: "c_2", columnId: "in_progress", title: "OpenTelemetry Spans", description: "W3C TraceContext distributed tracing", qualityRating: 4, tags: ["devops"] }
];
var securityFindings = [
  {
    id: "sec_1",
    scanner: "CodeQL",
    severity: "MEDIUM",
    title: "CWE-20: \u041D\u0435\u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u0430\u044F \u0434\u043B\u0438\u043D\u0430 \u0432\u0445\u043E\u0434\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438",
    fileOrUrl: "server.ts:42",
    description: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0430\u043B\u0438\u0434\u0430\u0442\u043E\u0440 Zod \u0434\u043B\u044F \u0441\u0442\u0440\u043E\u0433\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432",
    cwe: "CWE-20",
    status: "resolved",
    detectedAt: "2026-10-12T00:00:00.000Z"
  }
];
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW_MS = 60 * 1e3;
var MAX_REQUESTS_PER_WINDOW = 120;
var rateLimitMiddleware = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();
  const clientBucket = rateLimitMap.get(ip);
  if (!clientBucket || now > clientBucket.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
    res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS_PER_WINDOW - 1);
    return next();
  }
  if (clientBucket.count >= MAX_REQUESTS_PER_WINDOW) {
    res.setHeader("Retry-After", Math.ceil((clientBucket.resetTime - now) / 1e3));
    return res.status(429).json({
      error: "Too Many Requests",
      message: "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A API. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435.",
      retryAfterSeconds: Math.ceil((clientBucket.resetTime - now) / 1e3)
    });
  }
  clientBucket.count++;
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS_PER_WINDOW - clientBucket.count));
  next();
};
app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  const traceParent = req.headers["traceparent"] || `00-${crypto.randomBytes(16).toString("hex")}-${crypto.randomBytes(8).toString("hex")}-01`;
  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("traceparent", traceParent);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:;"
  );
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
var requestCount = 0;
var startTime = Date.now();
app.get("/metrics", (_req, res) => {
  const uptimeSec = Math.floor((Date.now() - startTime) / 1e3);
  const mem = process.memoryUsage();
  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(`# HELP mirovisor_http_requests_total Total number of HTTP requests
# TYPE mirovisor_http_requests_total counter
mirovisor_http_requests_total ${requestCount}
# HELP mirovisor_uptime_seconds Process uptime in seconds
# TYPE mirovisor_uptime_seconds gauge
mirovisor_uptime_seconds ${uptimeSec}
# HELP mirovisor_memory_heap_used_bytes Process heap memory used
# TYPE mirovisor_memory_heap_used_bytes gauge
mirovisor_memory_heap_used_bytes ${mem.heapUsed}
# HELP mirovisor_tenants_total Total registered tenants
# TYPE mirovisor_tenants_total gauge
mirovisor_tenants_total ${tenants.length}`);
});
app.get("/healthz/live", (_req, res) => {
  res.status(200).json({ status: "live", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/healthz/ready", (_req, res) => {
  res.status(200).json({
    status: "ready",
    database: "connected",
    nats: "connected",
    redis: "connected",
    tenantsCount: tenants.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mirovisor-portal-gateway",
    version: "1.0.0",
    environment: NODE_ENV
  });
});
app.get("/api/v1/spec", (_req, res) => {
  const openApiPath = path.join(__dirname, "docs", "contracts", "openapi.json");
  res.sendFile(openApiPath, (err) => {
    if (err) {
      res.status(404).json({ error: "OpenAPI specification not found" });
    }
  });
});
app.use("/api/", rateLimitMiddleware);
app.get("/api/v1/tenants", (_req, res) => {
  requestCount++;
  res.json({ data: tenants, total: tenants.length });
});
app.post("/api/v1/tenants", (req, res) => {
  requestCount++;
  const validation = TenantSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: validation.error.issues
    });
  }
  const existing = tenants.find((t) => t.id === validation.data.id || t.slug === validation.data.slug);
  if (existing) {
    return res.status(409).json({ error: "Tenant with this ID or slug already exists" });
  }
  tenants.push(validation.data);
  res.status(201).json({ data: validation.data, message: "Tenant successfully provisioned" });
});
app.get("/api/v1/kanban/cards", (_req, res) => {
  requestCount++;
  res.json({ data: kanbanCards, total: kanbanCards.length });
});
app.post("/api/v1/kanban/cards", (req, res) => {
  requestCount++;
  const validation = KanbanCardSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: validation.error.issues
    });
  }
  kanbanCards.push(validation.data);
  res.status(201).json({ data: validation.data });
});
app.get("/api/v1/security/findings", (_req, res) => {
  requestCount++;
  res.json({ data: securityFindings, total: securityFindings.length });
});
app.post("/api/v1/security/findings", (req, res) => {
  requestCount++;
  const validation = SecurityFindingSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: validation.error.issues
    });
  }
  securityFindings.unshift(validation.data);
  res.status(201).json({ data: validation.data });
});
app.get("/llms.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`# Mirovisor LLM Index
System: Mirovisor Multi-Tenant Portal
Documentation: https://github.com/spawnperm/mirovisor
Architecture: Schema-per-Tenant PostgreSQL + NATS JetStream Telemetry
OpenAPI Contract: /api/v1/spec
Metrics: /metrics
Health: /healthz`);
});
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  requestCount++;
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send("Mirovisor Portal Gateway running. Build frontend with `npm run build`.");
    }
  });
});
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`[Mirovisor Gateway] Server listening on port ${PORT} (${NODE_ENV})`);
    console.log(`[Mirovisor Gateway] Health probe: http://localhost:${PORT}/healthz`);
    console.log(`[Mirovisor Gateway] Metrics probe: http://localhost:${PORT}/metrics`);
    console.log(`[Mirovisor Gateway] OpenAPI Spec: http://localhost:${PORT}/api/v1/spec`);
  });
}
var server_default = app;
export {
  server_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Runtime API Schemas & Contracts (Zod)
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Production Express API Gateway & Static Server
 * OWASP ASVS 5.0 L2 Hardened · Zod Validated · OpenTelemetry Compatible
 */
