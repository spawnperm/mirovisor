# Руководство по ротации секретов и безопасности токенов GitHub PAT

## 🚨 Срочное уведомление о безопасности (Security Advisory)
Если персональный токен доступа GitHub (PAT) был передан в открытом виде в чате, логах сборки или коммите, он считается скомпрометированным и требует **немедленной ротации**.

---

## 🛠️ Шаги по отзыву и перевыпуску токена

### 1. Отзыв скомпрометированного токена (Revocation)
1. Перейдите в GitHub: **Settings → Developer Settings → Personal access tokens → Tokens (classic)** или **Fine-grained tokens**.
2. Найдите активный токен и нажмите **Revoke**.
3. Проверьте аудит безопасности: **Settings → Security log** на предмет неавторизованных действий.

### 2. Выпуск Fine-Grained Personal Access Token (Принцип наименьших привилегий)
Вместо токена с правами `admin:all` выпустите гранулярный токен:
- **Repository Access**: Only select repositories (`spawnperm/mirovisor`).
- **Permissions**:
  - `Contents`: Read & Write (для коммитов и пушей).
  - `Workflows`: Read & Write (только при изменении `.github/workflows`).
  - `Metadata`: Read-only.
- **Expiration**: Максимум 30–90 дней.

### 3. Автоматизированная защита от утечек (Push Protection)
В проекте Mirovisor активированы следующие уровни защиты:
1. **GitHub Secret Scanning & Push Protection** — блокирует коммиты с паттернами токенов на стороне GitHub.
2. **Gitleaks CI Job** (`.github/workflows/security.yml`) — сканирует всю историю git на наличие регулярных выражений приватных ключей и токенов.
3. **Хранение в переменных окружения**:
   Никогда не хардкодить токены в кодовой базе. Использовать `GITHUB_TOKEN` в Actions или Secret Manager.
