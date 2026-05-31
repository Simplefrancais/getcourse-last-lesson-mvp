(function () {
  window.GC_LAST_LESSON_API_BASE = window.GC_LAST_LESSON_API_BASE || "https://getcourse-last-lesson-mvp.onrender.com";
  window.GC_CHOOSE_LEVEL_URL = window.GC_CHOOSE_LEVEL_URL || "https://simplefrancais.getcourse.ru";

  const root = document.querySelector("#sf-dashboard") || document.querySelector("#gc-continue-learning");
  if (!root) return;

  const style = document.createElement("style");
  style.textContent = `
    #sf-dashboard, #gc-continue-learning { --sf-ink:#111a32; --sf-muted:#65708a; --sf-line:#dbe3ef; --sf-blue:#385eea; --sf-deep:#061324; --sf-panel:#ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--sf-ink); }
    .sf-shell { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:28px; max-width:1480px; margin:0 auto; padding:24px 18px 36px; background:#f7f9fd; }
    .sf-main, .sf-side { min-width:0; }
    .sf-top { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:24px; }
    .sf-hello h1 { margin:0 0 6px; font-size:32px; line-height:1.08; letter-spacing:0; color:var(--sf-ink); }
    .sf-hello p { margin:0; color:var(--sf-muted); font-size:15px; }
    .sf-search { width:min(420px, 42vw); min-height:46px; padding:0 16px; border:1px solid var(--sf-line); border-radius:8px; display:flex; align-items:center; color:var(--sf-muted); background:#fff; box-shadow:0 8px 22px rgba(19,35,68,.04); }
    .sf-section { margin-bottom:24px; }
    .sf-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px; }
    .sf-heading h2 { margin:0; font-size:20px; line-height:1.2; color:var(--sf-ink); }
    .sf-link { color:#344bd8 !important; text-decoration:none !important; font-weight:700; font-size:14px; }
    .sf-hero { min-height:276px; border-radius:8px; overflow:hidden; display:flex; align-items:stretch; background:linear-gradient(90deg, rgba(5,17,34,.98) 0%, rgba(12,28,48,.88) 42%, rgba(12,28,48,.2) 100%), url("https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1800&q=85"); background-size:cover; background-position:center; box-shadow:0 18px 48px rgba(20,35,70,.18); }
    .sf-hero-content { width:min(560px,100%); padding:30px; color:#fff; display:flex; flex-direction:column; justify-content:space-between; gap:26px; }
    .sf-pill { display:inline-flex; width:max-content; align-items:center; min-height:24px; padding:0 10px; border-radius:7px; background:#168d79; color:#fff; font-size:12px; font-weight:800; }
    .sf-hero h3 { margin:14px 0 8px; font-size:30px; line-height:1.12; color:#fff; letter-spacing:0; }
    .sf-hero p { margin:0; color:rgba(255,255,255,.82); font-size:15px; }
    .sf-big-percent { margin-top:18px; font-size:25px; font-weight:900; color:#fff; }
    .sf-progress { height:7px; border-radius:99px; background:rgba(220,230,242,.26); overflow:hidden; }
    .sf-progress span { display:block; height:100%; width:var(--value,0%); background:linear-gradient(90deg,#86df7a,#75d0e8); border-radius:inherit; }
    .sf-meta { margin-top:10px; color:rgba(255,255,255,.78); font-size:14px; }
    .sf-actions { display:flex; align-items:center; gap:12px; }
    .sf-primary { display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:0 24px; border:0; border-radius:8px; background:#5b4eea; color:#fff !important; text-decoration:none !important; font-weight:850; cursor:pointer; }
    .sf-play { width:46px; height:46px; border-radius:999px; border:1px solid rgba(255,255,255,.32); background:rgba(255,255,255,.08); color:#fff !important; display:inline-flex; align-items:center; justify-content:center; text-decoration:none !important; font-weight:900; }
    .sf-recent { display:flex; gap:14px; overflow-x:auto; padding:0 0 4px; scroll-snap-type:x proximity; }
    .sf-recent-card, .sf-level-card { min-height:92px; border-radius:8px; padding:16px; background:linear-gradient(135deg,#08172a,#10243a); color:#fff; box-shadow:0 12px 28px rgba(17,34,63,.12); }
    .sf-recent-card { display:grid; grid-template-columns:56px minmax(0,1fr); gap:14px; align-items:center; flex:0 0 min(360px, 86vw); scroll-snap-align:start; }
    .sf-icon { width:50px; height:50px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.08); color:var(--accent,#75d56f); font-weight:900; font-size:18px; }
    .sf-recent-card h3, .sf-level-card h3 { margin:0 0 5px; color:#fff; font-size:16px; line-height:1.2; }
    .sf-recent-card p, .sf-level-card p { margin:0 0 10px; color:rgba(255,255,255,.72); font-size:13px; }
    .sf-mini-row { display:grid; grid-template-columns:minmax(0,1fr) 44px; gap:10px; align-items:center; }
    .sf-mini-percent { color:#fff; font-weight:850; text-align:right; font-size:13px; }
    .sf-path-section { padding:18px; border:1px solid #dbe3ef; border-radius:8px; background:#fff; box-shadow:0 14px 35px rgba(17,34,63,.07); }
    .sf-path-section .sf-heading h2 { font-size:23px; }
    .sf-level-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .sf-level-card { min-height:205px; position:relative; overflow:hidden; }
    .sf-level-card strong { display:block; color:var(--accent,#75d56f); font-size:36px; line-height:1; margin-bottom:8px; }
    .sf-circle { position:absolute; right:18px; top:48px; width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:conic-gradient(var(--accent,#75d56f) calc(var(--value,0) * 1%), rgba(255,255,255,.14) 0); color:#fff; font-weight:900; }
    .sf-circle:before { content:""; position:absolute; inset:7px; border-radius:inherit; background:#10243a; }
    .sf-circle span { position:relative; z-index:1; font-size:14px; }
    .sf-open { position:absolute; right:14px; bottom:14px; min-height:34px; padding:0 18px; border:1px solid rgba(255,255,255,.18); border-radius:8px; color:#fff !important; text-decoration:none !important; display:inline-flex; align-items:center; font-size:13px; font-weight:800; }
    .sf-recs { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
    .sf-rec { min-height:158px; border:1px solid var(--sf-line); border-radius:8px; background:#fff; padding:14px; box-shadow:0 10px 25px rgba(17,34,63,.06); display:flex; flex-direction:column; justify-content:space-between; }
    .sf-rec h3 { margin:0 0 8px; font-size:15px; line-height:1.22; color:var(--sf-ink); }
    .sf-rec p { margin:0; color:var(--sf-muted); font-size:12px; }
    .sf-tag { display:inline-flex; width:max-content; min-height:20px; align-items:center; padding:0 8px; border-radius:6px; background:#eaf7ef; color:#17744d; font-size:11px; font-weight:900; }
    .sf-archive { min-height:74px; border:1px solid var(--sf-line); border-radius:8px; background:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 18px; }
    .sf-archive h3 { margin:0 0 4px; font-size:16px; }
    .sf-archive p { margin:0; color:var(--sf-muted); font-size:13px; }
    .sf-secondary { display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 18px; border:1px solid #c9d4e5; border-radius:8px; color:var(--sf-ink) !important; background:#fff; text-decoration:none !important; font-weight:850; }
    .sf-box { border:1px solid var(--sf-line); border-radius:8px; background:#fff; box-shadow:0 12px 30px rgba(17,34,63,.06); padding:14px; margin-bottom:14px; }
    .sf-box h2 { margin:0 0 12px; font-size:17px; }
    .sf-news { display:flex; align-items:center; gap:12px; min-height:58px; padding:10px; border:1px solid #e9eef7; border-radius:8px; margin-bottom:9px; }
    .sf-news:last-child { margin-bottom:0; }
    .sf-news b { display:block; font-size:13px; color:var(--sf-ink); }
    .sf-news small { color:var(--sf-muted); }
    .sf-action-grid { display:grid; grid-template-columns:1fr; gap:9px; }
    .sf-action { min-height:42px; border:1px solid #e0e7f2; border-radius:8px; background:#fff; color:var(--sf-ink) !important; text-decoration:none !important; display:flex; align-items:center; justify-content:flex-start; padding:0 12px; text-align:left; font-size:13px; font-weight:850; }
    .sf-catalog-box { opacity:.82; }
    .sf-catalog-box h2 { font-size:15px; }
    .sf-catalog-row { display:flex; justify-content:space-between; align-items:center; min-height:30px; border-bottom:1px solid #edf1f7; font-size:12px; color:var(--sf-muted); }
    .sf-catalog-row:last-child { border-bottom:0; }
    .sf-empty { border:1px solid var(--sf-line); border-radius:8px; background:#fff; padding:22px; }
    @media (max-width: 1050px) { .sf-shell { grid-template-columns:1fr; } .sf-search { width:100%; } .sf-top { flex-direction:column; } .sf-recs { grid-template-columns:repeat(2,minmax(0,1fr)); } .sf-level-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (max-width: 680px) { .sf-shell { padding:16px 10px 28px; } .sf-hello h1 { font-size:28px; } .sf-hero-content { padding:22px; } .sf-hero h3 { font-size:24px; } .sf-recs, .sf-level-grid { grid-template-columns:1fr; } .sf-archive { align-items:flex-start; flex-direction:column; } }
  `;
  document.head.appendChild(style);

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

  function progressBar(percent) {
    return '<div class="sf-progress" style="--value:' + Number(percent || 0) + '%"><span></span></div>';
  }

  function renderEmpty() {
    root.innerHTML = '<div class="sf-empty"><h2>Выберите свой уровень</h2><p>Когда вы откроете первый урок, здесь появится продолжение обучения.</p><p style="margin-top:16px"><a class="sf-secondary" href="' + escapeHtml(window.GC_CHOOSE_LEVEL_URL) + '">Выбрать уровень</a></p></div>';
  }

  function renderHero(activity, stat) {
    if (!activity) {
      return '<section class="sf-section"><div class="sf-empty"><h2>Продолжить обучение</h2><p>Пока нет открытых уроков.</p><p style="margin-top:16px"><a class="sf-primary" href="' + escapeHtml(window.GC_CHOOSE_LEVEL_URL) + '">Выбрать уровень</a></p></div></section>';
    }

    const percent = stat ? stat.lesson_progress_percent : 0;
    const opened = stat ? stat.opened_lessons : 0;
    const total = stat ? stat.total_lessons : 0;

    return '<section class="sf-section">' +
      '<div class="sf-heading"><h2>Продолжить обучение</h2></div>' +
      '<article class="sf-hero"><div class="sf-hero-content">' +
        '<div><span class="sf-pill">' + escapeHtml(activity.level || "FR") + '</span>' +
        '<h3>' + escapeHtml(activity.course_title || activity.training_title) + '</h3>' +
        '<p>' + escapeHtml(activity.lesson_title) + '</p>' +
        '<div class="sf-big-percent">' + percent + '%</div>' +
        progressBar(percent) +
        '<div class="sf-meta">' + opened + (total ? ' из ' + total : '') + ' уроков</div></div>' +
        '<div class="sf-actions"><a class="sf-primary" href="' + escapeHtml(activity.lesson_url) + '">Продолжить урок</a><a class="sf-play" href="' + escapeHtml(activity.lesson_url) + '">›</a></div>' +
      '</div></article></section>';
  }

  function renderRecent(courses) {
    const items = (courses || []).slice(0, 3).map((course) => {
      return '<article class="sf-recent-card">' +
        '<div class="sf-icon" style="--accent:' + escapeHtml(course.accent) + '">' + escapeHtml(course.icon || course.level || "FR") + '</div>' +
        '<div><h3>' + escapeHtml(course.title) + '</h3><p>' + escapeHtml(course.level || "Курс") + '</p>' +
        '<div class="sf-mini-row">' + progressBar(course.lesson_progress_percent) + '<span class="sf-mini-percent">' + course.lesson_progress_percent + '%</span></div></div>' +
      '</article>';
    }).join("");

    return '<section class="sf-section"><div class="sf-heading"><h2>Недавно открывали</h2><a class="sf-link" href="#">Смотреть все</a></div><div class="sf-recent">' + (items || '<div class="sf-empty">Пока нет недавно открытых курсов.</div>') + '</div></section>';
  }

  function renderLevels(levels) {
    const cards = levels.map((level) => {
      return '<article class="sf-level-card" style="--accent:' + escapeHtml(level.accent) + '">' +
        '<strong>' + escapeHtml(level.level) + '</strong><h3>' + escapeHtml(level.title) + '</h3>' +
        '<p>' + level.opened_lessons + (level.total_lessons ? ' из ' + level.total_lessons : '') + ' уроков</p>' +
        '<div class="sf-circle" style="--value:' + Number(level.progress_percent || 0) + '"><span>' + level.progress_percent + '%</span></div>' +
        '<a class="sf-open" href="#">Открыть</a>' +
      '</article>';
    }).join("");

    return '<section class="sf-section sf-path-section"><div class="sf-heading"><h2>Мой путь</h2><a class="sf-link" href="#">Подробнее</a></div><div class="sf-level-grid">' + cards + '</div></section>';
  }

  function renderRecommendations(items) {
    const cards = items.slice(0, 5).map((item) => {
      return '<article class="sf-rec"><div><span class="sf-tag">' + escapeHtml(item.level) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.subtitle || item.type) + '</p></div><p>' + (item.total_lessons ? item.total_lessons + ' уроков' : 'Скоро') + '</p></article>';
    }).join("");

    return '<section class="sf-section"><div class="sf-heading"><h2>Для вас сейчас полезно</h2><a class="sf-link" href="#">Подобрать ещё</a></div><div class="sf-recs">' + cards + '</div></section>';
  }

  function renderSide(dashboard) {
    const platform = dashboard.platform_progress || {};
    return '<aside class="sf-side">' +
      '<div class="sf-box"><h2>Что нового?</h2>' +
        '<div class="sf-news"><div class="sf-icon">A2</div><div><b>Новый диктант</b><small>Диктант A2 N15</small></div></div>' +
        '<div class="sf-news"><div class="sf-icon">PQ</div><div><b>Новый марафон</b><small>Plus-que-parfait</small></div></div>' +
        '<div class="sf-news"><div class="sf-icon">FR</div><div><b>Новый урок</b><small>Отрицательные местоимения</small></div></div>' +
      '</div>' +
      '<div class="sf-box"><h2>Мои достижения</h2>' +
        '<div class="sf-news"><div class="sf-icon">' + platform.percent + '%</div><div><b>Прогресс платформы</b><small>' + platform.opened_lessons + ' из ' + platform.total_lessons + ' уроков открыто</small></div></div>' +
        '<div class="sf-news"><div class="sf-icon">100</div><div><b>Цель</b><small>Следующая отметка: 100 уроков</small></div></div>' +
      '</div>' +
      '<div class="sf-box"><h2>Полезное</h2><div class="sf-action-grid">' +
        '<a class="sf-action" href="#">Задать вопрос</a><a class="sf-action" href="#">Навигатор по платформе</a><a class="sf-action" href="#">Предложить тему курса</a>' +
      '</div></div>' +
      '<div class="sf-box sf-catalog-box"><h2>Каталог</h2>' +
        '<div class="sf-catalog-row"><span>Основные курсы</span><b>2</b></div>' +
        '<div class="sf-catalog-row"><span>Практика и закрепление</span><b>3</b></div>' +
        '<div class="sf-catalog-row"><span>Марафоны</span><b>2</b></div>' +
        '<div class="sf-catalog-row"><span>Архив курсов</span><b>позже</b></div>' +
      '</div>' +
    '</aside>';
  }

  function renderDashboard(dashboard) {
    const last = dashboard.last_activity;
    const lastStat = last ? dashboard.course_stats[last.course_id] : null;

    root.innerHTML = '<div class="sf-shell">' +
      '<main class="sf-main">' +
        '<header class="sf-top"><div class="sf-hello"><h1>Bonjour, Julie!</h1><p>Продолжайте учиться и достигайте новых целей</p></div><div class="sf-search">Поиск курсов, уроков, тем...</div></header>' +
        renderHero(last, lastStat) +
        renderRecent(dashboard.recent_courses || []) +
        renderRecommendations(dashboard.recommendations || []) +
        renderLevels(dashboard.levels || []) +
        '<section class="sf-section"><div class="sf-archive"><div><h3>Архив прошлых версий курсов (2017-2023)</h3><p>Старые версии курсов будут добавлены позже.</p></div><a class="sf-secondary" href="#">Перейти в архив</a></div></section>' +
      '</main>' +
      renderSide(dashboard) +
    '</div>';
  }

  async function init() {
    const key = userKey();
    if (!key) {
      console.warn("[SF Dashboard] Не найден user_id/email на главной странице.");
      renderEmpty();
      return;
    }

    const response = await fetch(window.GC_LAST_LESSON_API_BASE + "/api/dashboard?user_key=" + encodeURIComponent(key));
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || "Dashboard API error");
    }
    renderDashboard(data.dashboard);
  }

  init().catch(function (error) {
    console.error("[SF Dashboard] Ошибка виджета:", error);
    renderEmpty();
  });
})();
