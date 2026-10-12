# МИРОВИЗОР · Mirovisor Portal

[![OWASP ASVS 5.0 Level 2](https://img.shields.io/badge/Security-OWASP%20ASVS%205.0%20L2-emerald)](#безопасность)
[![Multi-Tenancy](https://img.shields.io/badge/Architecture-Schema--per--Tenant-blue)](#мультитенантность)
[![Backstage Plugin System](https://img.shields.io/badge/Plugins-Backstage%20SDK-purple)](#плагинная-система)
[![CI/CD Pipelines](https://img.shields.io/badge/CI%2FCD-NATS%20JetStream%20%2B%20Cordis-cyan)](#конвейер-идеи--работа)

**МИРОВИЗОР** — мультитенантная платформа следующего поколения для интерактивной многомерной визуализации данных, кросс-платформенного извлечения информации и управления эволюцией программных систем по циклу **«Наблюдай → Предлагай → Решай → Внедряй»**.

---

## 🌟 Ключевые возможности

### 1. Архитектура «Идеи → Работа»
- Непрерывный цикл эволюции: автоматический сбор телеметрии (`BuildCompleted` в NATS JetStream).
- Мультиагентный анализ **Cordis** (6 специализированных AI-агентов: Security, Architecture, Testing, DevOps, UI/UX, Docs).
- **Канбан-доска идей**:
  - Строгий WIP-лимит ($\le 3$ в колонке «В работу»).
  - Карточка как объект (контекстные действия, чек-листы, diff-патчи).
  - Обучение ИИ-модели при отклонении (выбор причины).
  - Оценка качества кода (1–5 звезд) и механизм **мгновенного отката (Rollback)**.

### 2. CI/CD Пайплайны и Автоматизированный Security Gate
- Пошаговое отслеживание сборок с потоковыми консольными логами.
- **Встроенные сканеры безопасности**:
  - **SAST**: CodeQL / Semgrep (CWE-95, CWE-89, инъекции кода).
  - **SCA**: Snyk Open Source (CVE в зависимостях).
  - **Secret Scanning**: Gitleaks (поиск утекших ключей и токенов).
  - **DAST**: OWASP ZAP (CSRF, заголовки Permissions-Policy).
  - **Container / IaC**: Aqua Trivy (сканирование Dockerfile и базовых образов).
- Прямая передача находок в Канбан-доску и кнопки **Auto-Fix**.

### 3. Мультитенантность (Schema-per-Tenant)
- Изоляция данных на уровне отдельных схем PostgreSQL (`tenant_{id}`) с принудительной аппаратной защитой `FORCE ROW LEVEL SECURITY`.
- Паттерны, вдохновлённые **Ever Gauzy** и **Microsoft WingtipTicketsSaaS**.
- Индивидуальный брендинг тенантов (цвета темы, заголовки, пресеты стиля).
- Фича-флаги и квоты (хранилище Garage S3, лимиты пользователей, rate-limiting).

### 4. Плагинная система (Backstage SDK)
- Жизненный цикл плагина: `Discovered → Validating → Registered → Installing → Active → Rollback`.
- Точки расширения: `ui-dashboard-card`, `mcp-tool-bridge`, `event-pipeline`, `rest-api-route`.
- Студия разработки с WebContainers sandbox-раннером и публикацией в Verdaccio.

### 5. Интегрированные бизнес-модули и экосистема
- **Ever Gauzy ERP/CRM**: воронка сделок, контакты, учет рабочего времени.
- **Univer Office Harness (MCP)**: электронные таблицы с вычислением формул и генерацией отчетов.
- **LMS Университет**: курсы с привязкой к ролям RBAC.
- **Социальный слой**: Fan-out ленты (Redis + NATS) и сообщества.
- **Observability**: дашборды Prometheus и мультитенантные логи Loki (`X-Scope-OrgID`).
- **LLM Wiki**: экспорт `llms.txt` и `llms-full.txt` для AI-ассистентов.

---

## 🚀 Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Запуск dev-сервера
pnpm dev

# Проверка типов и сборка
pnpm lint
pnpm build
```

---

## 📄 Лицензия
Apache-2.0
