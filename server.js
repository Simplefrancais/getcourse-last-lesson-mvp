import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "last-activity.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function loadCourseCatalog() {
  const catalogPath = path.join(__dirname, "config", "course-catalog.json");
  const raw = JSON.parse(readFileSync(catalogPath, "utf8"));
  const courses = raw.courses || [];
  return courses.reduce((index, course) => {
    index[course.course_id] = decorateCourse(course);
    return index;
  }, {});
}

function decorateCourse(course) {
  const accents = {
    main: "#4d8cff",
    practice: "#25b981",
    marathon: "#ff8b3d",
    exam: "#8d62ff",
    kids: "#f06292"
  };
  return {
    ...course,
    total_lessons: Number(course.total_lessons || 0),
    total_cycles: Number(course.total_cycles || 0),
    accent: course.accent || accents[course.type] || "#5b5ff0",
    icon: course.icon || course.level || "FR"
  };
}

const COURSE_CATALOG = loadCourseCatalog();

const COURSE_BY_STREAM_ID = Object.values(COURSE_CATALOG).reduce((index, course) => {
  index[course.stream_id] = course;
  return index;
}, {});

const LEVELS = [
  { level: "A1", title: "Начальный", accent: "#75d56f" },
  { level: "A2", title: "Базовый", accent: "#4d8cff" },
  { level: "B1", title: "Средний", accent: "#8d62ff" },
  { level: "B2-C1", title: "Продвинутый", accent: "#ff8b3d" }
];

const NEWS_ITEMS = [
  {
    title: "Новый диктант",
    subtitle: "Диктант A2 N15",
    type: "dictation",
    level: "A2",
    time_label: "Сегодня",
    url: "#",
    icon: "A2",
    accent: "#75d56f"
  },
  {
    title: "Новый марафон",
    subtitle: "Plus-que-parfait",
    type: "marathon",
    level: "A2-B1",
    time_label: "Вчера",
    url: COURSE_CATALOG["plus-que-parfait-marathon"].url,
    icon: "PQ",
    accent: "#ff8b3d"
  },
  {
    title: "Новый урок",
    subtitle: "Отрицательные местоимения",
    type: "lesson",
    level: "A1",
    time_label: "2 дня назад",
    url: "#",
    icon: "FR",
    accent: "#25b981"
  }
];

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

function isCurrentCourse(course) {
  return Boolean(course?.active) && course.status !== "archive";
}

function isDashboardMainCourse(course) {
  return isCurrentCourse(course) && course.type === "main" && course.show_on_dashboard;
}

function levelBucket(level) {
  const normalized = normalizeId(level);
  if (normalized.startsWith("A1")) return "A1";
  if (normalized.startsWith("A2")) return "A2";
  if (normalized.startsWith("B1")) return "B1";
  if (normalized.startsWith("B2") || normalized.startsWith("C1") || normalized.includes("C1")) return "B2-C1";
  return normalized;
}

function levelMatches(courseLevel, currentLevel) {
  const normalized = normalizeId(courseLevel);
  const bucket = levelBucket(normalized);
  return bucket === currentLevel || normalized.includes(currentLevel);
}

function findCourse(payload) {
  const explicitId = normalizeId(payload.course_id);
  if (explicitId && COURSE_CATALOG[explicitId]) {
    return COURSE_CATALOG[explicitId];
  }

  const courseUrl = String(payload.course_url || payload.training_url || "").trim();
  const streamMatch = courseUrl.match(/stream\/view\/id\/(\d+)/) || courseUrl.match(/[?&]id=(\d+)/);
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
    const levelCourses = Object.values(COURSE_CATALOG).filter((course) => {
      return isDashboardMainCourse(course) && levelBucket(course.level) === level.level;
    });
    const levelCourseIds = new Set(levelCourses.map((course) => course.course_id));
    const stats = Object.values(user.course_stats).filter((course) => levelCourseIds.has(course.course_id));
    const openedLessons = stats.reduce((sum, course) => sum + course.opened_lessons, 0);
    const totalLessons = levelCourses.reduce((sum, course) => sum + course.total_lessons, 0);
    const totalCycles = levelCourses.reduce((sum, course) => sum + course.total_cycles, 0);
    const openedCycles = stats.reduce((sum, course) => sum + course.opened_cycles, 0);
    const progress = totalLessons ? Math.min(100, Math.round((openedLessons / totalLessons) * 100)) : 0;

    return {
      ...level,
      total_lessons: totalLessons,
      total_cycles: totalCycles,
      opened_lessons: openedLessons,
      opened_cycles: openedCycles,
      progress_percent: progress
    };
  });
}

function getCurrentLevel(user) {
  const mainLevels = Object.values(user.course_stats)
    .filter((course) => course.type === "main" && course.opened_lessons > 0 && isCurrentCourse(COURSE_CATALOG[course.course_id]))
    .sort((a, b) => b.opened_lessons - a.opened_lessons);

  if (mainLevels[0]?.level) {
    return levelBucket(mainLevels[0].level);
  }

  return levelBucket(user.last_activity?.level || "A1") || "A1";
}

function getRecommendations(currentLevel) {
  const recommended = Object.values(COURSE_CATALOG)
    .filter((course) => isCurrentCourse(course) && course.recommended)
    .filter((course) => levelMatches(course.level, currentLevel))
    .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));

  const fallback = Object.values(COURSE_CATALOG)
    .filter((course) => isCurrentCourse(course) && course.recommended)
    .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));

  return (recommended.length ? recommended : fallback).slice(0, 8).map((course) => ({
    course_id: course.course_id,
    title: course.title,
    subtitle: course.section || course.type,
    level: course.level,
    type: course.type,
    total_lessons: course.total_lessons,
    url: course.url,
    accent: course.accent,
    icon: course.icon
  }));
}

function buildCatalogSummary() {
  const current = Object.values(COURSE_CATALOG).filter(isCurrentCourse);
  const count = (type) => current.filter((course) => course.type === type).length;

  return [
    { title: "Основные курсы", count: count("main") },
    { title: "Практика и закрепление", count: count("practice") },
    { title: "Марафоны", count: count("marathon") },
    { title: "DELF / DALF", count: count("exam") },
    { title: "Архив", count: Object.values(COURSE_CATALOG).filter((course) => course.status === "archive").length }
  ];
}

function buildDashboard(userKey, user = emptyUserRecord()) {
  const allCourses = Object.values(COURSE_CATALOG).filter(isCurrentCourse);
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
    recommendations: getRecommendations(currentLevel),
    news: NEWS_ITEMS,
    catalog: allCourses,
    catalog_summary: buildCatalogSummary()
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

    if (req.method === "GET" && url.pathname === "/api/news") {
      sendJson(res, 200, { ok: true, news: NEWS_ITEMS }, origin);
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
