# Правила разработки проекта «Мировизор» (Mirovisor Development Rules)

> **Критическое и обязательное правило разработки:**  
> **Каждая успешная сборка проекта автоматически фиксируется коммитом в Git и немедленно отправляется (Push) в удаленный репозиторий на GitHub (`spawnperm/mirovisor`).**

---

## 1. Автоматический коммит и отправка на GitHub (Auto-Commit & Push on Build)

1. **Триггер и механизм**:
   - Хук жизненного цикла npm `postbuild` автоматически запускает скрипт `scripts/auto-commit-on-build.mjs`.
   - Скрипт проверяет статус рабочего дерева (`git status --porcelain`).
   - При обнаружении любых изменений, новых или удаленных файлов:
     1. Выполняет индексацию: `git add -A`.
     2. Формирует семантическое сообщение коммита по стандарту Conventional Commits с суффиксом `[auto-build]`.
     3. Создает локальный коммит: `git commit -m "..."`.
     4. **Немедленно пушит изменения на GitHub**: `git push origin <active-branch>` (по умолчанию `main`).
     5. Логирует статус в консоль: `[Auto-Push Success] Successfully pushed changes to GitHub origin/<branch>!`.

2. **Обязательные условия допуска к коммиту и пушу**:
   - ✅ Сборка TypeScript и Vite завершилась с кодом возврата `0` (`npm run build` / `npm run build:all`).
   - ✅ Все unit- и интеграционные тесты завершились успешно (`npm test` — Vitest).
   - ✅ Отсутствуют ошибки статического анализа и линтинга (`npm run lint` / `tsc --noEmit`).
   - ❌ **Строгий запрет:** Ни при каких условиях не создавать коммит и не пушить код, если линтинг, тесты или сборка завершились с ошибкой (код $\ne 0$).

3. **Конфигурация в `package.json`**:
   ```json
   "scripts": {
     "dev": "vite --port=3000 --host=0.0.0.0",
     "build": "vite build",
     "build:server": "esbuild server.ts --bundle --platform=node --target=node20 --format=esm --packages=external --outfile=server.mjs",
     "build:all": "npm run build && npm run build:server",
     "postbuild": "node scripts/auto-commit-on-build.mjs",
     "build:commit": "npm run lint && npm run test && npm run build:all"
   }
   ```

4. **Команда полного проверочного цикла разработчика**:
   ```bash
   npm run build:commit
   ```
   Эта команда последовательно проверяет типы (`lint`), прогоняет тесты (`test`), выполняет сборку (`build:all`) и через хук `postbuild` фиксирует коммит с пушем на GitHub.

---

## 2. Стандарты коммитов (Commit Message Convention)

Все коммиты должны строго следовать стандарту [Conventional Commits](https://www.conventionalcommits.org/):
```
<тип>(<область>): <краткое описание в повелительном наклонении> [auto-build]
```

### Допустимые типы:
* `feat`: Новая функциональность (визуализатор D3.js, модуль CRM, автосохранение черновиков).
* `fix`: Исправление бага, уязвимости или поломки сборки.
* `perf`: Оптимизация производительности (виртуализация списков, кэширование, дебаунсинг).
* `test`: Добавление или обновление тестов (Vitest, Playwright, интеграционные).
* `rules`: Изменение и фиксация правил разработки и автоматизации коммитов/пушей.
* `ci` / `devops`: Конфигурации GitHub Actions, Docker, Prometheus, Grafana, Loki.
* `refactor`: Рефакторинг кода без изменения внешней логики.
* `docs`: Обновление документации, ADR, OpenAPI спецификаций.
* `sec`: Исправление уязвимостей безопасности, ротация ключей, ASVS hardening.

### Примеры семантических коммитов:
* `feat(rules): document mandatory auto-commit and push to GitHub on successful build [auto-build]`
* `feat(visualization): implement real-time D3 force-directed graph for tenant-plugin topology [auto-build]`
* `fix(infra): resolve Dockerfile server.ts, add init-db.sql, prometheus.yml, OpenAPI specs [auto-build]`
* `ci(devops): add GHCR container release workflow, Grafana & Loki in compose, Prometheus alert rules [auto-build]`

---

## 3. Требования к качеству кода и архитектуре

1. **Строгая типизация (TypeScript)**:
   - Включен строгий режим (`noImplicitAny`, строгая проверка нулевых значений).
   - Запрещено использовать тип `any` без веского обоснования и комментариев.
2. **Изоляция мультитенантности**:
   - Любые манипуляции с данными должны учитывать идентификатор активного тенанта (`tenantId`) и контекст схемы (`schema`).
   - На уровне БД действует принцип `FORCE ROW LEVEL SECURITY`.
3. **Сохранность данных пользователя**:
   - Все формы и редакторы (описание Канбан-карточек, заметки, настройки) обязаны поддерживать устойчивость к сбоям через локальные черновики (`localStorage`) или CRDT-провайдер (`yjs`).
4. **Безопасность секретов**:
   - Запрещено коммитить персональные токены доступа (GitHub PAT), приватные ключи или секреты.
   - Использовать переменные окружения (`.env.example`) и серверные прокси (`server.ts`).

---

## 4. Чеклист перед каждым пушем на GitHub
- [ ] `npm run lint` — 0 ошибок типов
- [ ] `npm test` — все 21+ тестов пройдены успешно
- [ ] `npm run build` — сборка успешна, сработал автоматический коммит и пуш на GitHub
- [ ] GitHub Actions пайплайн (`CI Pipeline` и `Security Gate`) окрашен в зеленый цвет (Success)
