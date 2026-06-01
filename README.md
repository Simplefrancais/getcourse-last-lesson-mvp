# GetCourse Last Lesson MVP

Минимальный MVP для проверки сценария "Продолжить обучение" на одном тестовом курсе GetCourse.

## Что входит

- `server.js` - маленький Node.js API без внешних зависимостей.
- `config/course-catalog.json` - каталог курсов, экспортированный из таблицы "Все курсы 2026.xlsx".
- `snippets/lesson-tracker.js` - JS для страниц уроков тестового курса.
- `snippets/home-widget-getcourse.js` - JS для новой dashboard-страницы GetCourse.
- `scripts/export-course-catalog.py` - локальный скрипт для пересборки каталога из Excel.
- `public/index.html` - локальная тестовая главная.
- `data/last-activity.json` - локальное хранилище появится автоматически после первого запуска.

## Запуск локально

```bash
node server.js
```

Сервер будет доступен на `http://localhost:8787`.

## API

### Сохранить событие урока

`POST /api/track`

```json
{
  "user_id": "487514661",
  "email": "student@example.com",
  "event": "opened",
  "lesson_id": "343702614",
  "lesson_url": "https://simplefrancais.getcourse.ru/pl/teach/control/lesson/view?id=343702614&editMode=0",
  "lesson_title": "Название урока",
  "course_id": "phonetics-50",
  "training_title": "Фонетика 50 миниуроков",
  "level": "A1-A2",
  "timestamp": "2026-05-31T00:00:00.000Z"
}
```

### Получить последний урок

`GET /api/last-lesson?user_key=487514661`

### Получить dashboard

`GET /api/dashboard?user_key=487514661`

### Получить каталог курсов

`GET /api/catalog`

### Получить новости

`GET /api/news`

Новости редактируются вручную в массиве `NEWS_ITEMS` внутри `server.js`.

## Обновить каталог из таблицы

```bash
/Users/julielee/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/export-course-catalog.py "/Users/julielee/Downloads/Все курсы 2026.xlsx" config/course-catalog.json
```

После этого нужно загрузить обновлённый `config/course-catalog.json` на GitHub и задеплоить Render.

Новые курсы подтягиваются через таблицу: если есть стабильный `Course ID`, ссылка GetCourse, тип, уровень и статус, backend сможет учитывать курс без переписывания логики.

## Как вставить на урок тестового курса

В GetCourse на страницах уроков вставить код из `snippets/lesson-tracker.js`.

Трекер сначала пытается определить курс по ссылке на тренинг GetCourse. Если GetCourse не даёт определить курс автоматически, перед трекером можно добавить:

```html
<script>
window.GC_COURSE_ID = "phonetics-50";
window.GC_TRAINING_TITLE = "Фонетика 50 миниуроков";
window.GC_LEVEL = "A1-A2";
</script>
```

## Как вставить на тестовую главную

1. Добавить блок/контейнер:

```html
<div id="sf-dashboard"></div>
```

2. Ниже подключить код из `snippets/home-widget-getcourse.js`.

## Что проверяем в первую очередь

1. Открываем урок под тестовым учеником.
2. Открываем DevTools Console.
3. Ищем сообщение `[GC Last Lesson] Диагностика страницы урока`.
4. Проверяем, нашлись ли `user_id` или `email`, `lesson_url`, `lesson_title`, `training_title`.
5. Если данные сохранились, dashboard должен показать "Продолжить обучение", recent courses и прогресс.

## Важно для продакшена

Для реального GetCourse нужен HTTPS-домен для API. Браузер на странице `https://simplefrancais.getcourse.ru` может блокировать запросы на локальный `http://localhost:8787`.
