(function () {
  const API_BASE = window.GC_LAST_LESSON_API_BASE || "https://getcourse-last-lesson-mvp.onrender.com";
  const DEDUPE_MINUTES = 10;

  const COURSE_CATALOG = {
    "194833897": {
      course_id: "french-a1-plus",
      training_title: "A1+ Французский с нуля",
      level: "A1",
      course_url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/194833897"
    },
    "317304947": {
      course_id: "french-a2-1",
      training_title: "A2.1 Французский A2.1",
      level: "A2",
      course_url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/317304947"
    },
    "934655104": {
      course_id: "phonetics-50",
      training_title: "Фонетика 50 миниуроков",
      level: "A1-A2",
      course_url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/934655104"
    },
    "591520903": {
      course_id: "plus-que-parfait-marathon",
      training_title: "Марафон по plus-que-parfait",
      level: "A2-B1",
      course_url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/591520903"
    },
    "386812694": {
      course_id: "articles-marathon",
      training_title: "Марафон по артиклям",
      level: "A1-B1",
      course_url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/386812694"
    }
  };

  function text(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim().replace(/\s+/g, " ") : "";
  }

  function firstValue(values) {
    return values.find((value) => String(value || "").trim());
  }

  function getCurrentUser() {
    return {
      user_id: firstValue([
        window.accountUserId,
        window.gcUser && window.gcUser.id,
        window.userInfo && window.userInfo.id,
        document.body && document.body.dataset && document.body.dataset.userId,
        text("[data-user-id]")
      ]) || "",
      email: firstValue([
        window.accountUserEmail,
        window.gcUser && window.gcUser.email,
        window.userInfo && window.userInfo.email,
        document.body && document.body.dataset && document.body.dataset.email,
        text(".gc-user-email"),
        text("[data-user-email]")
      ]) || ""
    };
  }

  function getLessonId() {
    const url = new URL(location.href);
    return firstValue([
      window.GC_LESSON_ID,
      url.searchParams.get("id"),
      location.href
    ]);
  }

  function getLessonTitle() {
    return firstValue([
      window.GC_LESSON_TITLE,
      text("h1"),
      text(".lesson-title"),
      text(".page-header h1"),
      document.title
    ]) || "Урок";
  }

  function detectCourseFromPage() {
    const links = Array.from(document.querySelectorAll("a[href*='/teach/control/stream/view']"));
    for (const link of links) {
      const match = link.href.match(/stream\/view\/id\/(\d+)/) || link.href.match(/[?&]id=(\d+)/);
      if (match && COURSE_CATALOG[match[1]]) {
        return COURSE_CATALOG[match[1]];
      }
      if (match) {
        return {
          course_id: "",
          training_title: link.textContent.trim().replace(/\s+/g, " ") || "",
          level: "",
          course_url: link.href
        };
      }
    }

    const pageText = document.body ? document.body.textContent : "";
    return Object.values(COURSE_CATALOG).find((course) => pageText.includes(course.training_title)) || null;
  }

  function getCourseMeta() {
    const detected = detectCourseFromPage() || {};
    return {
      course_id: firstValue([window.GC_COURSE_ID, detected.course_id]) || "unknown-course",
      training_title: firstValue([window.GC_TRAINING_TITLE, detected.training_title, text(".stream-title")]) || "Курс",
      level: firstValue([window.GC_LEVEL, detected.level]) || "",
      course_url: firstValue([window.GC_COURSE_URL, detected.course_url]) || ""
    };
  }

  function shouldTrack(meta) {
    const hasCourseSignal = (meta.course_id && meta.course_id !== "unknown-course") || meta.course_url;
    if (!hasCourseSignal) {
      console.info("[GC Last Lesson] Не найден course_id/course_url. Событие не отправлено.", meta);
    }
    return hasCourseSignal;
  }

  function dedupeKey(payload) {
    return [
      "gc-last-lesson",
      payload.user_id || payload.email,
      payload.lesson_id,
      payload.event
    ].join(":");
  }

  function recentlySent(payload) {
    const key = dedupeKey(payload);
    const lastSent = Number(sessionStorage.getItem(key) || 0);
    const now = Date.now();

    if (lastSent && now - lastSent < DEDUPE_MINUTES * 60 * 1000) {
      return true;
    }

    sessionStorage.setItem(key, String(now));
    return false;
  }

  async function sendActivity() {
    const user = getCurrentUser();
    const course = getCourseMeta();
    const payload = {
      user_id: String(user.user_id || "").trim(),
      email: String(user.email || "").trim(),
      event: "opened",
      lesson_id: getLessonId(),
      lesson_url: location.href,
      lesson_title: getLessonTitle(),
      course_id: course.course_id,
      training_title: course.training_title,
      course_title: course.training_title,
      course_url: course.course_url,
      level: course.level,
      timestamp: new Date().toISOString()
    };

    console.info("[GC Last Lesson] Диагностика страницы урока:", payload);

    if (!payload.user_id && !payload.email) {
      console.warn("[GC Last Lesson] Не найден user_id/email. Отправка отменена.");
      return;
    }

    if (!shouldTrack(course) || recentlySent(payload)) {
      return;
    }

    const response = await fetch(`${API_BASE}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Unknown API error");
    }

    console.info("[GC Last Lesson] Последний урок сохранён:", data.activity);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendActivity);
  } else {
    sendActivity();
  }
})();
