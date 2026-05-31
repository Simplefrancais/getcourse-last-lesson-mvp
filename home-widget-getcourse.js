(function () {
  window.GC_LAST_LESSON_API_BASE = window.GC_LAST_LESSON_API_BASE || "http://localhost:8787";
  window.GC_CHOOSE_LEVEL_URL = window.GC_CHOOSE_LEVEL_URL || "https://simplefrancais.getcourse.ru";

  const style = document.createElement("style");
  style.textContent = `
    #gc-continue-learning { margin: 24px 0; }
    #gc-continue-learning .gc-title { margin: 0 0 14px; font-size: 24px; line-height: 1.2; color: #101a33; }
    #gc-continue-learning .gc-card { min-height: 220px; padding: 26px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(90deg, rgba(4, 16, 34, .98), rgba(16, 38, 59, .84)), url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80"); background-size: cover; background-position: center; color: #fff; }
    #gc-continue-learning .gc-card h3 { margin: 0 0 8px; color: #fff; font-size: 28px; line-height: 1.15; }
    #gc-continue-learning .gc-card p { margin: 0; color: rgba(255,255,255,.8); }
    #gc-continue-learning .gc-button { display: inline-flex; width: max-content; min-height: 44px; align-items: center; justify-content: center; padding: 0 22px; border-radius: 8px; background: linear-gradient(90deg, #9adf9f, #6ec6df); color: #10213a !important; font-weight: 800; text-decoration: none !important; }
    #gc-continue-learning .gc-empty { padding: 22px; border: 1px solid #d9e1ee; border-radius: 8px; background: #fff; color: #101a33; }
  `;
  document.head.appendChild(style);

  const root = document.querySelector("#gc-continue-learning");
  if (!root) return;

  function text(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function userKey() {
    return String(
      window.accountUserId ||
      window.accountUserEmail ||
      (window.gcUser && (window.gcUser.id || window.gcUser.email)) ||
      (window.userInfo && (window.userInfo.id || window.userInfo.email)) ||
      (document.body && document.body.dataset && (document.body.dataset.userId || document.body.dataset.email)) ||
      text(".gc-user-email") ||
      root.dataset.userKey ||
      ""
    ).trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function renderEmpty() {
    root.innerHTML = '<div class="gc-empty"><h3 class="gc-title">Выберите свой уровень</h3><a class="gc-button" href="' + escapeHtml(window.GC_CHOOSE_LEVEL_URL) + '">Выбрать уровень</a></div>';
  }

  function renderActivity(activity) {
    root.innerHTML =
      '<h2 class="gc-title">Продолжить обучение</h2>' +
      '<div class="gc-card">' +
        '<div><h3>' + escapeHtml(activity.training_title) + '</h3><p>' + escapeHtml(activity.lesson_title) + '</p></div>' +
        '<a class="gc-button" href="' + escapeHtml(activity.lesson_url) + '">Продолжить</a>' +
      '</div>';
  }

  async function init() {
    const key = userKey();

    if (!key) {
      console.warn("[GC Last Lesson] Не найден user_id/email на главной странице.");
      renderEmpty();
      return;
    }

    const response = await fetch(window.GC_LAST_LESSON_API_BASE + "/api/last-lesson?user_key=" + encodeURIComponent(key));
    const data = await response.json();

    if (data.ok && data.activity) {
      renderActivity(data.activity);
    } else {
      renderEmpty();
    }
  }

  init().catch(function (error) {
    console.error("[GC Last Lesson] Ошибка виджета:", error);
    renderEmpty();
  });
})();
