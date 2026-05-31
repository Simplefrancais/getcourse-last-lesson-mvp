(function () {
  const API_BASE = window.GC_LAST_LESSON_API_BASE || "http://localhost:8787";
  const DEFAULT_LEVEL_URL = window.GC_CHOOSE_LEVEL_URL || "https://simplefrancais.getcourse.ru";
  const root = document.querySelector("#gc-continue-learning");

  if (!root) return;

  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function getCurrentUser() {
    const candidates = [
      window.accountUserId,
      window.accountUserEmail,
      window.gcUser && window.gcUser.id,
      window.gcUser && window.gcUser.email,
      window.userInfo && window.userInfo.id,
      window.userInfo && window.userInfo.email,
      document.body && document.body.dataset && document.body.dataset.userId,
      document.body && document.body.dataset && document.body.dataset.email,
      getText(".gc-user-email"),
      getText("[data-user-email]")
    ].filter(Boolean);

    return String(candidates[0] || root.dataset.userKey || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Выберите свой уровень</h3>
        <p>Когда вы откроете первый урок, здесь появится кнопка для продолжения обучения.</p>
        <div class="button-row" style="margin-top: 18px">
          <a class="secondary-button" href="${escapeHtml(DEFAULT_LEVEL_URL)}">Выбрать уровень</a>
        </div>
      </div>
    `;
  }

  function renderActivity(activity) {
    root.innerHTML = `
      <h2 class="continue-title">Продолжить обучение</h2>
      <article class="continue-card">
        <div>
          <h3>${escapeHtml(activity.training_title)}</h3>
          <p>${escapeHtml(activity.lesson_title)}</p>
        </div>
        <div class="button-row">
          <a class="primary-button" href="${escapeHtml(activity.lesson_url)}">Продолжить</a>
        </div>
      </article>
    `;
  }

  async function init() {
    const userKey = getCurrentUser();

    if (!userKey) {
      console.warn("[GC Last Lesson] Не найден user_id/email на главной странице.");
      renderEmpty();
      return;
    }

    const response = await fetch(`${API_BASE}/api/last-lesson?user_key=${encodeURIComponent(userKey)}`);
    const data = await response.json();

    if (!data.ok || !data.activity) {
      renderEmpty();
      return;
    }

    renderActivity(data.activity);
  }

  init().catch((error) => {
    console.error("[GC Last Lesson] Ошибка загрузки последнего урока:", error);
    root.innerHTML = `
      <div class="error-state">
        <h3>Не удалось загрузить продолжение обучения</h3>
        <p>Попробуйте обновить страницу.</p>
      </div>
    `;
  });
})();
