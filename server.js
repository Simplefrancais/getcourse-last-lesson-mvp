import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "last-activity.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const COURSE_CATALOG = {
  "french-a1-plus": {
    course_id: "french-a1-plus",
    title: "A1+ Французский с нуля",
    url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/194833897",
    stream_id: "194833897",
    type: "main",
    level: "A1",
    total_cycles: 24,
    total_lessons: 440,
    accent: "#75d56f",
    icon: "A1"
  },
  "french-a2-1": {
    course_id: "french-a2-1",
    title: "A2.1 Французский A2.1",
    url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/317304947",
    stream_id: "317304947",
    type: "main",
    level: "A2",
    total_cycles: 12,
    total_lessons: 282,
    accent: "#4d8cff",
    icon: "A2"
  },
  "phonetics-50": {
    course_id: "phonetics-50",
    title: "Фонетика 50 миниуроков",
    url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/934655104",
    stream_id: "934655104",
    type: "practice",
    level: "A1-A2",
    total_cycles: 0,
    total_lessons: 50,
    accent: "#7c55ff",
    icon: "FR"
  },
  "plus-que-parfait-marathon": {
    course_id: "plus-que-parfait-marathon",
    title: "Марафон по plus-que-parfait",
    url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/591520903",
    stream_id: "591520903",
    type: "practice",
    level: "A2-B1",
    total_cycles: 0,
    total_lessons: 18,
    accent: "#ff8b3d",
    icon: "PQ"
  },
  "articles-marathon": {
    course_id: "articles-marathon",
    title: "Марафон по артиклям",
    url: "https://simplefrancais.getcourse.ru/teach/control/stream/view/id/386812694",
    stream_id: "386812694",
    type: "practice",
    level: "A1-B1",
    total_cycles: 0,
    total_lessons: 30,
    accent: "#25b981",
    icon: "AR"
  }
};

const COURSE_BY_STREAM_ID = Object.values(COURSE_CATALOG).reduce((index, course) => {
  index[course.stream_id] = course;
  return index;
}, {});

const LEVELS = [
  { level: "A1", title: "Начальный", total_lessons: 440, total_cycles: 24, accent: "#75d56f" },
  { level: "A2", title: "Базовый", total_lessons: 282, total_cycles: 12, accent: "#4d8cff" },
  { level: "B1", title: "Средний", total_lessons: 0, total_cycles: 0, accent: "#8d62ff" },
  { level: "B2-C1", title: "Продвинутый", total_lessons: 0, total_cycles: 0, accent: "#ff8b3d" }
];

const RECOMMENDATIONS_BY_LEVEL = {
  A1: [
    { title: "Фонетика", subtitle: "Произношение, интонация, ритм", level: "A1-A2", type: "practice", total_lessons: 50, url: COURSE_CATALOG["phonetics-50"].url, accent: "#7c55ff", icon: "FR" },
    { title: "Чтение", subtitle: "Тексты, диалоги, практика чтения", level: "A1", type: "practice", total_lessons: 15, url: "#", accent: "#25b981", icon: "A1" },
    { title: "101 фраза", subtitle: "Фразы для путешествий", level: "A1", type: "practice", total_lessons: 10, url: "#", accent: "#4d8cff", icon: "101" },
    { title: "Диктанты A1", subtitle: "Тренировка аудирования", level: "A1", type: "practice", total_lessons: 20, url: "#", accent: "#ff8b3d", icon: "D" },
    { title: "Неправильные глаголы", subtitle: "Таблицы и упражнения", level: "A1-B1", type: "practice", total_lessons: 12, url: "#", accent: "#25b981", icon: "V" }
  ],
  A2: [
    { title: "Фонетика", subtitle: "Закрепление произношения", level: "A1-A2", type: "practice", total_lessons: 50, url: COURSE_CATALOG["phonetics-50"].url, accent: "#7c55ff", icon: "FR" },
    { title: "Plus-que-parfait", subtitle: "Тематический марафон", level: "A2-B1", type: "marathon", total_lessons: 18, url: COURSE_CATALOG["plus-que-parfait-marathon"].url, accent: "#ff8b3d", icon: "PQ" },
    { title: "Диктанты A2", subtitle: "Аудирование и письмо", level: "A2", type: "practice", total_lessons: 20, url: "#", accent: "#4d8cff", icon: "D" },
    { title: "Артикли", subtitle: "Системное закрепление", level: "A1-B1", type: "marathon", total_lessons: 30, url: COURSE_CATALOG["articles-marathon"].url, accent: "#25b981", icon: "AR" }
  ],
  B1: [
    { title: "Артикли", subtitle: "Тонкие случаи употребления", level: "A1-B1", type: "marathon", total_lessons: 30, url: COURSE_CATALOG["articles-marathon"].url, accent: "#25b981", icon: "AR" },
    { title: "Lexicum et parole", subtitle: "Лексика и речь", level: "B1", type: "practice", total_lessons: 24, url: "#", accent: "#8d62ff", icon: "B1" },
    { title: "Диктанты B1", subtitle: "Продвинутое аудирование", level: "B1", type: "practice", total_lessons: 20, url: "#", accent: "#4d8cff", icon: "D" }
  ],
  "B2-C1": [
    { title: "DELF / DALF", subtitle: "Подготовка к экзаменам", level: "B2-C1", type: "exam", total_lessons: 0, url: "#", accent: "#ff8b3d", icon: "EX" },
    { title: "Разговорный клуб", subtitle: "Практика свободной речи", level: "B2-C1", type: "practice", total_lessons: 0, url: "#", accent: "#8d62ff", icon: "B2" }
  ]
};

const ALLOWED_ORIGINS = [
  "https://simplefrancais.getcourse.ru",
  "https://getcourse-last-lesson-mvp.onrender.com",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, "{}\n", "utf8");
  }
}

function emptyUserRecord() {
  return {
    last_activity: null,
    recent_courses: [],
    course_stats: {},
    opened_lessons: {},
    completed_lessons: {}
  };
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

function findCourse(payload) {
  const explicitId = normalizeId(payload.course_id);
  if (explicitId && COURSE_CATALOG[explicitId]) {
    return COURSE_CATALOG[explicitId];
  }

  const courseUrl = String(payload.course_url || payload.training_url || "").trim();
  const streamMatch = courseUrl.match(/stream\/view\/id\/(\d+)/);
  if (streamMatch && COURSE_BY_STREAM_ID[streamMatch[1]]) {
    return COURSE_BY_STREAM_ID[streamMatch[1]];
  }

  const title = String(payload.training_title || payload.course_title || "").trim().toLowerCase();
  return Object.values(COURSE_CATALOG).find((course) => course.title.toLowerCase() === title) || null;
}

function parseLessonId(payload) {
  const explicit = normalizeId(payload.lesson_id);
  if (explicit) return explicit;

  try {
    const lessonUrl = new URL(String(payload.lesson_url || ""));
    return lessonUrl.searchParams.get("id") || String(payload.lesson_url || "").trim();
  } catch {
    return String(payload.lesson_url || "").trim();
  }
}

function buildCourseStats(courseId, openedLessons = [], completedLessons = []) {
  const course = COURSE_CATALOG[courseId] || {
    course_id: courseId,
    title: courseId,
    level: "",
    total_lessons: 0,
    total_cycles: 0,
    type: "custom"
  };
  const opened = unique(openedLessons);
  const completed = unique(completedLessons);
  const lessonProgress = course.total_lessons
    ? Math.min(100, Math.round((opened.length / course.total_lessons) * 100))
    : 0;

  return {
    course_id: course.course_id,
    title: course.title,
    url: course.url || "",
    type: course.type,
    level: course.level,
    total_cycles: course.total_cycles || 0,
    opened_cycles: 0,
    completed_cycles: 0,
    total_lessons: course.total_lessons || 0,
    opened_lessons: opened.length,
    completed_lessons: completed.length,
    lesson_progress_percent: lessonProgress,
    structural_progress_percent: 0,
    accent: course.accent || "#5b5ff0",
    icon: course.icon || "FR"
  };
}

function migrateStore(store) {
  if (store.users) {
    return store;
  }

  const migrated = { users: {} };
  for (const [userKey, activity] of Object.entries(store)) {
    const user = emptyUserRecord();
    const courseId = activity.course_id || "phonetics-50";
    const lessonId = activity.lesson_id || activity.lesson_url;

    user.last_activity = {
      ...activity,
      course_id: courseId,
      course_title: activity.course_title || activity.training_title,
      level: activity.level || COURSE_CATALOG[courseId]?.level || ""
    };
    user.recent_courses = [courseId];
    user.opened_lessons[courseId] = unique([lessonId]);
    user.course_stats[courseId] = buildCourseStats(courseId, user.opened_lessons[courseId], []);
    migrated.users[userKey] = user;
  }
  return migrated;
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf8");
  return migrateStore(JSON.parse(raw || "{}"));
}

async function writeStore(store) {
  await ensureStore();
  await writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function sendJson(res, status, data, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(origin)
  });
  res.end(JSON.stringify(data));
}

function sanitizeActivity(payload) {
  const userKey = normalizeKey(payload.user_id || payload.email || payload.user_key);
  const lessonUrl = String(payload.lesson_url || "").trim();
  const lessonTitle = String(payload.lesson_title || "").trim();
  const course = findCourse(payload);
  const courseId = normalizeId(payload.course_id || course?.course_id || "unknown-course");
  const courseTitle = String(payload.course_title || payload.training_title || course?.title || "Курс").trim();
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

  if (!userKey) {
    return { error: "Missing user_id/email/user_key" };
  }

  if (!lessonUrl) {
    return { error: "Missing lesson_url" };
  }

  if (Number.isNaN(timestamp.getTime())) {
    return { error: "Invalid timestamp" };
  }

  return {
    activity: {
      user_key: userKey,
      user_id: payload.user_id ? String(payload.user_id).trim() : "",
      email: payload.email ? String(payload.email).trim() : "",
      event: String(payload.event || "opened").trim(),
      lesson_id: parseLessonId(payload),
      lesson_url: lessonUrl,
      lesson_title: lessonTitle || "Последний урок",
      course_id: courseId,
      level: normalizeId(payload.level || course?.level || ""),
      training_title: courseTitle,
      course_title: courseTitle,
      course_url: String(payload.course_url || course?.url || "").trim(),
      timestamp: timestamp.toISOString()
    }
  };
}

function applyActivity(store, activity) {
  const user = store.users[activity.user_key] || emptyUserRecord();
  const courseId = activity.course_id || "unknown-course";
  const lessonId = activity.lesson_id || activity.lesson_url;

  user.last_activity = activity;
  user.recent_courses = [courseId, ...user.recent_courses.filter((id) => id !== courseId)].slice(0, 8);
  user.opened_lessons[courseId] = unique([...(user.opened_lessons[courseId] || []), lessonId]);

  if (activity.event === "completed") {
    user.completed_lessons[courseId] = unique([...(user.completed_lessons[courseId] || []), lessonId]);
  }

  user.course_stats[courseId] = buildCourseStats(
    courseId,
    user.opened_lessons[courseId] || [],
    user.completed_lessons[courseId] || []
  );
  store.users[activity.user_key] = user;
  return user;
}

function summarizeLevels(user) {
  return LEVELS.map((level) => {
    const stats = Object.values(user.course_stats).filter((course) => {
      return course.type === "main" && course.level === level.level;
    });
    const openedLessons = stats.reduce((sum, course) => sum + course.opened_lessons, 0);
    const totalLessons = level.total_lessons || stats.reduce((sum, course) => sum + course.total_lessons, 0);
    const progress = totalLessons ? Math.min(100, Math.round((openedLessons / totalLessons) * 100)) : 0;

    return {
      ...level,
      opened_lessons: openedLessons,
      progress_percent: progress
    };
  });
}

function getCurrentLevel(user) {
  const mainLevels = Object.values(user.course_stats)
    .filter((course) => course.type === "main" && course.opened_lessons > 0)
    .sort((a, b) => b.opened_lessons - a.opened_lessons);

  if (mainLevels[0]?.level) {
    return mainLevels[0].level;
  }

  return user.last_activity?.level?.split("-")[0] || "A1";
}

function buildDashboard(userKey, user = emptyUserRecord()) {
  const allCourses = Object.values(COURSE_CATALOG);
  const currentLevel = getCurrentLevel(user);
  const recentCourses = user.recent_courses
    .map((courseId) => user.course_stats[courseId] || buildCourseStats(courseId))
    .filter(Boolean);
  const totalLessons = allCourses.reduce((sum, course) => sum + course.total_lessons, 0);
  const openedLessons = Object.values(user.opened_lessons).reduce((sum, lessons) => sum + unique(lessons).length, 0);

  return {
    user_key: userKey,
    last_activity: user.last_activity,
    recent_courses: recentCourses,
    course_stats: user.course_stats,
    levels: summarizeLevels(user),
    current_level: currentLevel,
    platform_progress: {
      total_lessons: totalLessons,
      opened_lessons: openedLessons,
      percent: totalLessons ? Math.min(100, Math.round((openedLessons / totalLessons) * 100)) : 0
    },
    recommendations: RECOMMENDATIONS_BY_LEVEL[currentLevel] || RECOMMENDATIONS_BY_LEVEL.A1,
    catalog: allCourses
  };
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 64) {
      throw new Error("Body too large");
    }
  }
  return JSON.parse(raw || "{}");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8"
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  try {
    if (req.method === "POST" && (url.pathname === "/api/last-lesson" || url.pathname === "/api/track")) {
      const payload = await readJsonBody(req);
      const result = sanitizeActivity(payload);

      if (result.error) {
        sendJson(res, 400, { ok: false, error: result.error }, origin);
        return;
      }

      const store = await readStore();
      applyActivity(store, result.activity);
      await writeStore(store);

      sendJson(res, 200, { ok: true, activity: result.activity }, origin);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/last-lesson") {
      const userKey = normalizeKey(url.searchParams.get("user_key") || url.searchParams.get("email") || url.searchParams.get("user_id"));

      if (!userKey) {
        sendJson(res, 400, { ok: false, error: "Missing user_key/email/user_id" }, origin);
        return;
      }

      const store = await readStore();
      sendJson(res, 200, { ok: true, activity: store.users[userKey]?.last_activity || null }, origin);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      const userKey = normalizeKey(url.searchParams.get("user_key") || url.searchParams.get("email") || url.searchParams.get("user_id"));

      if (!userKey) {
        sendJson(res, 400, { ok: false, error: "Missing user_key/email/user_id" }, origin);
        return;
      }

      const store = await readStore();
      sendJson(res, 200, { ok: true, dashboard: buildDashboard(userKey, store.users[userKey]) }, origin);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/catalog") {
      sendJson(res, 200, { ok: true, courses: Object.values(COURSE_CATALOG), levels: LEVELS }, origin);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message }, origin);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Last lesson MVP is running: http://${HOST}:${PORT}`);
});
