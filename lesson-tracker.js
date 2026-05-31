(function () {
  const API_BASE = window.GC_LAST_LESSON_API_BASE || "http://localhost:8787";
  const TEST_TRAINING_TITLE = "Фонетика и чтение A1-A2+";
  const DEDUPE_MINUTES = 10;

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

  function getLessonTitle() {
    return firstValue([
      text("h1"),
      text(".lesson-title"),
      text(".page-header h1"),
      document.title
    ]) || "Урок";
  }

  function getTrainingTitle() {
    return firstValue([
      window.GC_TRAINING_TITLE,
      TEST_TRAINING_TITLE,
      text(".breadcrumbs a[href*='/teach/control/stream/view']"),
      text(".breadcrumb a[href*='/teach/control/stream/view']"),
      text("a[href*='/teach/control/stream/view/id/934655104']"),
      text(".stream-title")
    ]) || TEST_TRAINING_TITLE;
  }

  function shouldTrack(trainingTitle) {
    const pageText = document.body ? document.body.textContent : "";
    const isTestCourse =
      trainingTitle.includes(TEST_TRAINING_TITLE) ||
      pageText.includes(TEST_TRAINING_TITLE) ||
      location.href.includes("343702614");

    if (!isTestCourse) {
      console.info("[GC Last Lesson] Страница не похожа на тестовый курс, событие не отправлено.", { trainingTitle });
    }

    return isTestCourse;
  }

  function dedupeKey(payload) {
    return [
      "gc-last-lesson",
      payload.user_id || payload.email,
      payload.lesson_url
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
    const payload = {
      user_id: String(user.user_id || "").trim(),
      email: String(user.email || "").trim(),
      lesson_url: location.href,
      lesson_title: getLessonTitle(),
      training_title: getTrainingTitle(),
      timestamp: new Date().toISOString()
    };

    console.info("[GC Last Lesson] Диагностика страницы урока:", payload);

    if (!payload.user_id && !payload.email) {
      console.warn("[GC Last Lesson] Не найден user_id/email. Отправка отменена.");
      return;
    }

    if (!shouldTrack(payload.training_title) || recentlySent(payload)) {
      return;
    }

    const response = await fetch(`${API_BASE}/api/last-lesson`, {
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
