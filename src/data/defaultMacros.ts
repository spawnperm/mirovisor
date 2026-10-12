import { VoiceMacro } from '../types/macros';

export const DEFAULT_VOICE_MACROS: VoiceMacro[] = [
  {
    id: 'macro_deploy_nightly',
    keyword: 'Deploy Nightly',
    name: 'Ночной деплой (Deploy Nightly)',
    description: 'Комплексный конвейер: триггер CI/CD сборки, сканирование безопасности RLS и публикация отчета в Community Feed.',
    isPredefined: true,
    executionCount: 7,
    color: 'from-amber-500 to-rose-500',
    actions: [
      {
        id: 'act_1',
        type: 'trigger_build',
        title: 'Запустить CI/CD сборку ветки main',
        description: 'Инициация сборки с SAST Semgrep, SCA и интеграционными тестами',
        target: 'main',
      },
      {
        id: 'act_2',
        type: 'security_audit',
        title: 'Провести экспресс-аудит безопасности и RLS',
        description: 'Проверка OWASP ASVS 5.0 L2 и политик изоляции PostgreSQL',
      },
      {
        id: 'act_3',
        type: 'post_social',
        title: 'Опубликовать сводку в ленту Community Feed',
        description: 'Автоматический пост для команды о статусе ночного развертывания',
      },
      {
        id: 'act_4',
        type: 'navigate_tab',
        title: 'Перейти в мониторинг пайплайнов',
        description: 'Открытие вкладки с текущим статусом сборки',
        target: 'pipelines',
      },
    ],
  },
  {
    id: 'macro_full_audit',
    keyword: 'Full System Audit',
    name: 'Глубокий аудит системы (Full Audit)',
    description: 'Запуск статического анализа CodeQL, проверка RLS-изоляции всех тенантов и создание отчета безопасности.',
    isPredefined: true,
    executionCount: 4,
    color: 'from-emerald-500 to-teal-500',
    actions: [
      {
        id: 'act_audit_1',
        type: 'security_audit',
        title: 'Запустить CodeQL & ASVS аудит',
        description: 'Сканирование кодовой базы на уязвимости и валидация FORCE RLS',
      },
      {
        id: 'act_audit_2',
        type: 'post_social',
        title: 'Опубликовать результаты проверки безопасности',
        description: 'Уведомление в Community Feed о соблюдении стандартов ИБ',
      },
      {
        id: 'act_audit_3',
        type: 'navigate_tab',
        title: 'Открыть Security Center',
        description: 'Переход в центр безопасности для анализа отчета',
        target: 'security',
      },
    ],
  },
  {
    id: 'macro_scaffold_announce_plugin',
    keyword: 'Scaffold Plugin',
    name: 'Сгенерировать и анонсировать плагин',
    description: 'Голосовое создание Backstage-микрофронтенда с последующим постом в корпоративную ленту и переходом в Studio.',
    isPredefined: true,
    executionCount: 2,
    color: 'from-cyan-500 to-blue-500',
    actions: [
      {
        id: 'act_scaffold_1',
        type: 'scaffold_plugin',
        title: 'Создать микрофронтенд-виджет',
        description: 'Генерация Typescript плагина с точкой расширения ui-dashboard-card',
      },
      {
        id: 'act_scaffold_2',
        type: 'post_social',
        title: 'Анонсировать новый плагин в Community Feed',
        description: 'Пост с тегами #plugin #backstage #microfrontends',
      },
      {
        id: 'act_scaffold_3',
        type: 'navigate_tab',
        title: 'Перейти в Plugin Studio',
        description: 'Открытие студии плагинов для тестирования виджета',
        target: 'pluginstudio',
      },
    ],
  },
];
