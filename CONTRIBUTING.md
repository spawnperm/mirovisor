# Руководство по разработке и участию в проекте Mirovisor (CONTRIBUTING)

Добро пожаловать в команду разработки **МИРОВИЗОР (Mirovisor)** — мультитенантной платформы интерактивной многомерной визуализации данных, кросс-платформенного извлечения информации и управления эволюцией программных систем.

---

## 🛠️ Быстрый старт (Локальное окружение)

### Требования:
- **Node.js**: v20.x или v22.x LTS
- **Docker & Docker Compose**: v2.20+
- **Git**: 2.40+

### Установка зависимостей и запуск:
```bash
# 1. Клонирование репозитория
git clone https://github.com/spawnperm/mirovisor.git
cd mirovisor

# 2. Установка npm зависимостей
npm install

# 3. Запуск инфраструктурного стека (PostgreSQL 16, NATS JetStream, Redis 7, MinIO, Prometheus, Grafana, Loki, Nginx)
docker compose up -d

# 4. Запуск локального dev-сервера с HMR
npm run dev
```

Портал доступен по адресу: [http://localhost:3000](http://localhost:3000)  
Prometheus метрики: [http://localhost:3000/metrics](http://localhost:3000/metrics)  
Спецификация OpenAPI 3.1: [http://localhost:3000/api/v1/spec](http://localhost:3000/api/v1/spec)  
Grafana дашборды: [http://localhost:3001](http://localhost:3001) (admin / admin)

---

## 🧪 Тестирование и проверка качества

Перед каждым коммитом обязательно выполнение:
```bash
# Проверка строгой типизации TypeScript (tsc --noEmit)
npm run lint

# Прогон полного сьюта Unit & Integration тестов Vitest
npm test

# Полная production сборка сервера и фронтенда
npm run build:all
```

---

## 📜 Стандарты кодовой базы

1. **Безопасность (OWASP ASVS 5.0 L2)**:
   - Все новые API эндпоинты должны быть строго валидированы схемами Zod в `src/schemas/api.schemas.ts`.
   - Запрещен динамический конкатенационный SQL (`search_path`). Используйте `TenantContextManager` из `src/server/tenantContext.ts`.
   - Никогда не передавайте API ключи и токены в клиентский код.
2. **Архитектура**:
   - Любое архитектурное изменение документируется в новом ADR файле `docs/adr/ADR-XXX.md`.
   - Для доставки событий в NATS JetStream использовать `TransactionalOutboxRelay`.
3. **UI/UX & Доступность (WCAG 2.1 AA)**:
   - Все модальные окна обязаны использовать хук `useFocusTrap` и закрываться по нажатию `Esc`.
   - Соблюдение принципа Zero-Pill: избегать декоративных разноцветных капсул вокруг метаданных.
   - Минимальный коэффициент контрастности текста 4.5:1 (в режиме High Contrast > 7:1).
4. **Правило коммитов (Conventional Commits)**:
   - Формат: `feat(scope): краткое описание [auto-build]`
   - Скоупы: `infra`, `architecture`, `security`, `ui-a11y`, `kanban`, `gateway`, `devops`, `docs`.
