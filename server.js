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

const ALLOWED_ORIGINS = [
  "https://simplefrancais.getcourse.ru",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, "{}\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw || "{}");
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

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeActivity(payload) {
  const userKey = normalizeKey(payload.user_id || payload.email || payload.user_key);
  const lessonUrl = String(payload.lesson_url || "").trim();
  const lessonTitle = String(payload.lesson_title || "").trim();
  const trainingTitle = String(payload.training_title || "").trim();
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
      lesson_url: lessonUrl,
      lesson_title: lessonTitle || "Последний урок",
      training_title: trainingTitle || "Курс",
      timestamp: timestamp.toISOString()
    }
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
    if (req.method === "POST" && url.pathname === "/api/last-lesson") {
      const payload = await readJsonBody(req);
      const result = sanitizeActivity(payload);

      if (result.error) {
        sendJson(res, 400, { ok: false, error: result.error }, origin);
        return;
      }

      const store = await readStore();
      store[result.activity.user_key] = result.activity;
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
      sendJson(res, 200, { ok: true, activity: store[userKey] || null }, origin);
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
