# ADR-003: Песочница и жизненный цикл плагинов Backstage SDK

## Статус
Принято (Accepted) · 2026-10-12

## Контекст
Mirovisor предоставляет расширяемую плагинную экосистему на базе стандартов Backstage SDK. Сторонние разработчики тенантов могут загружать плагины через Verdaccio или компилировать их прямо в браузере. Выполнение недоверенного JavaScript кода в основном DOM-дереве несет риск XSS, кражи JWT-токенов тенантов и нарушения изоляции.

## Решение
Внедрить гибридную трехуровневую модель изолированного выполнения (Sandboxing):
1. **Tier 1 (UI Widgets)**: Рендеринг в изолированных `iframe` с атрибутами `sandbox="allow-scripts allow-forms"` и строгим CSP.
2. **Tier 2 (Headless Logic & Transformers)**: Выполнение в Web Workers с изоляцией от `window` и `document`.
3. **Tier 3 (WebContainers Studio)**: Среда запуска Node.js прямо в WebAssembly с изолированным `SharedArrayBuffer` и обязательными заголовками `COOP: same-origin` / `COEP: require-corp`.

## Матрица привилегий плагина (Capabilities-based Security)
Плагины обязаны декларировать разрешения в `plugin.manifest.json`:
- `storage:kv` — доступ только к пространству ключей тенанта
- `net:fetch` — белый список доменов тенанта
- `ui:card` — слот на главной доске.
