# Руководство по разработке плагинов Backstage SDK для Mirovisor

Платформа Mirovisor предоставляет расширяемую экосистему плагинов, совместимую со стандартами **Spotify Backstage SDK** и изолированной средой исполнения **WebContainers**.

---

## 🏗️ Структура плагина

Каждый плагин состоит из манифеста `plugin.manifest.json` и точки входа:

```json
{
  "id": "tenant-custom-analytics",
  "name": "Custom Analytics Widget",
  "version": "1.0.0",
  "category": "analytics",
  "author": "Holding Analytics Team",
  "description": "Интерактивный дашборд воронки конверсий тенанта",
  "permissions": [
    "storage:read",
    "telemetry:emit"
  ],
  "entrypoint": "dist/index.js",
  "slot": "dashboard:widget"
}
```

---

## 🔒 Модель безопасности и изоляция (Sandboxing)

В соответствии с `ADR-003`, сторонние плагины выполняются в изолированных слоях:
1. **Песочница UI (Iframe Sandbox)**: Атрибуты `sandbox="allow-scripts allow-forms"` и строгий CSP.
2. **Изоляция хранилища**: Доступ к хранилищу ключей изолирован пространством тенанта: `s3://mirovisor-tenant-{tenant_id}/plugins/{plugin_id}/`.
3. **Декларативные разрешения (Capability-based Security)**: Плагин не может выполнить сетевой запрос без явного указания `net:fetch` в манифесте.

---

## 🚀 Жизненный цикл плагина в SDK

```typescript
import { createPlugin, createRoutableExtension } from '@mirovisor/plugin-sdk';

export const customAnalyticsPlugin = createPlugin({
  id: 'custom-analytics',
  routes: {
    root: rootRouteRef,
  },
});

export const CustomAnalyticsWidget = customAnalyticsPlugin.provide(
  createRoutableExtension({
    name: 'CustomAnalyticsWidget',
    component: () => import('./components/AnalyticsWidget').then(m => m.AnalyticsWidget),
    mountPoint: rootRouteRef,
  })
);
```
