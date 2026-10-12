# ADR-005: Распределенная трассировка на базе OpenTelemetry (OTel) и W3C TraceContext

## Статус
Принято (Accepted) · 2026-10-12

## Контекст
В мультитенантной распределенной среде Mirovisor запрос пользователя проходит через React SPA → Nginx Reverse Proxy → Express Gateway → PostgreSQL / NATS JetStream / Cordis AI-агенты. При возникновении задержек или сбоев критически важно иметь возможность отследить полный путь запроса (end-to-end trace) с привязкой к конкретному тенанту.

## Решение
Внедрить стандарт **OpenTelemetry (OTel)** в качестве основы observability платформы:
1. **Распространение контекста (Context Propagation)**:
   - Использование стандартных заголовков W3C TraceContext: `traceparent` (версия, trace-id, parent-id, trace-flags) и `tracestate`.
   - Автоматическая генерация и проброс `X-Correlation-ID` для сопоставления логов в Grafana Loki.
2. **Экспорт трасс**:
   - Асинхронный экспорт спанов по протоколу OTLP (gRPC / HTTP) в коллектор OpenTelemetry с сохранением в Jaeger / Grafana Tempo.
3. **Метки тенантов (Span Attributes)**:
   - Каждый спан снабжается обязательными семантическими атрибутами: `tenant.id`, `tenant.schema`, `http.status_code`, `user.id`.

## Последствия
### Положительные:
- Полная прозрачность времени выполнения запросов между сервисами.
- Нулевая привязка к конкретному вендору мониторинга (Vendor-neutral OTel).
- Быстрая локализация узких мест в симуляциях D3 и NATS-очередях.
