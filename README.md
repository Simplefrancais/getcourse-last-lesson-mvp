# GetCourse Last Lesson MVP

Минимальный MVP для проверки сценария "Продолжить обучение" на одном тестовом курсе GetCourse.

## Что входит

- `server.js` - маленький Node.js API без внешних зависимостей.
- `snippets/lesson-tracker.js` - JS для страниц уроков тестового курса.
- `snippets/home-widget-getcourse.js` - JS для тестовой главной страницы GetCourse.
- `public/index.html` - локальная тестовая главная.
- `data/last-activity.json` - локальное хранилище появится автоматически после первого запуска.

## Запуск локально

```bash
node server.js
```

Сервер будет доступен на `http://localhost:8787`.

## API

### Сохранить последний урок

`POST /api/last-lesson`

```json
{
  "user_id": "487514661",
  "email": "student@example.com",
  "lesson_url": "https://simplefrancais.getcourse.ru/pl/teach/control/lesson/view?id=343702614&editMode=0",
  "lesson_title": "Название урока",
  "training_title": "Фонетика и чтение A1-A2+",
  "timestamp": "2026-05-31T00:00:00.000Z"
}
```

### Получить последний урок

`GET /api/last-lesson?user_key=487514661`

## Как вставить на урок тестового курса

В GetCourse на страницах уроков спецкурса "Фонетика и чтение A1-A2+" вставить код из `snippets/lesson-tracker.js`.

Для локального теста `API_BASE` стоит `http://localhost:8787`. Для реального запуска его нужно заменить на HTTPS-адрес внешнего сервера.

## Как вставить на тестовую главную

1. Добавить блок/контейнер:

```html
<div id="gc-continue-learning"></div>
```

2. Ниже подключить код из `snippets/home-widget-getcourse.js`.

## Что проверяем в первую очередь

1. Открываем урок под тестовым учеником.
2. Открываем DevTools Console.
3. Ищем сообщение `[GC Last Lesson] Диагностика страницы урока`.
4. Проверяем, нашлись ли `user_id` или `email`, `lesson_url`, `lesson_title`, `training_title`.
5. Если данные сохранились, тестовая главная должна показать "Продолжить обучение".

## Важно для продакшена

Для реального GetCourse нужен HTTPS-домен для API. Браузер на странице `https://simplefrancais.getcourse.ru` может блокировать запросы на локальный `http://localhost:8787`.
