# Проверка 5 тестовых курсов

Цель: убедиться, что единый трекер уроков корректно определяет курс, уровень, урок и обновляет dashboard.

## Перед проверкой

На уроке должен стоять код из:

```text
snippets/lesson-tracker.js
```

На dashboard-странице должен стоять контейнер:

```html
<div id="sf-dashboard"></div>
```

И JS из:

```text
snippets/home-widget-getcourse.js
```

## Что смотреть в Console

После открытия урока под учеником выполнить:

```js
sessionStorage.clear()
```

Затем обновить страницу урока. В Console должна появиться диагностика:

```text
[GC Last Lesson] Диагностика страницы урока
```

Проверить поля:

- `user_id`
- `event: "opened"`
- `lesson_id`
- `lesson_url`
- `lesson_title`
- `course_id`
- `level`

После этого должна появиться строка:

```text
[GC Last Lesson] Последний урок сохранён
```

## Курсы

### 1. A1+ Французский с нуля

Ссылка:

```text
https://simplefrancais.getcourse.ru/teach/control/stream/view/id/194833897
```

Ожидаемые значения:

```js
course_id: "french-a1-plus"
level: "A1"
```

### 2. A2.1 Французский A2.1

Ссылка:

```text
https://simplefrancais.getcourse.ru/teach/control/stream/view/id/317304947
```

Ожидаемые значения:

```js
course_id: "french-a2-1"
level: "A2"
```

### 3. Фонетика 50 миниуроков

Ссылка:

```text
https://simplefrancais.getcourse.ru/teach/control/stream/view/id/934655104
```

Ожидаемые значения:

```js
course_id: "phonetics-50"
level: "A1-A2"
```

Важно: этот курс считается как `practice`, поэтому не увеличивает основной прогресс A1/A2 в блоке "Мой путь".

### 4. Марафон по plus-que-parfait

Ссылка:

```text
https://simplefrancais.getcourse.ru/teach/control/stream/view/id/591520903
```

Ожидаемые значения:

```js
course_id: "plus-que-parfait-marathon"
level: "A2-B1"
```

### 5. Марафон по артиклям

Ссылка:

```text
https://simplefrancais.getcourse.ru/teach/control/stream/view/id/386812694
```

Ожидаемые значения:

```js
course_id: "articles-marathon"
level: "A1-B1"
```

## Если курс не определяется автоматически

Перед основным трекером на уроке добавить маленький JS-блок с метаданными:

```html
<script>
window.GC_COURSE_ID = "phonetics-50";
window.GC_TRAINING_TITLE = "Фонетика 50 миниуроков";
window.GC_LEVEL = "A1-A2";
window.GC_COURSE_URL = "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/934655104";
</script>
```

Значения заменить под нужный курс.

## Что должно обновляться на dashboard

- "Продолжить обучение" показывает последний открытый урок.
- "Недавно открывали" показывает до 5 последних курсов.
- Practice/A1-A2 курсы отображаются в recent/recommendations, но не увеличивают основной прогресс A1/A2.
- Main-курсы увеличивают прогресс уровня в "Мой путь".
