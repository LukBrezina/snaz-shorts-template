import http from "node:http";
import { promises as fs, createReadStream, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import formidable from "formidable";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const VIDEOS = path.join(REPO_ROOT, "videos");
const PORT = process.env.PORT || 4321;
const HOST = process.env.HOST || "0.0.0.0"; // bind all interfaces so Tailscale peers can reach it
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

const MIME = {
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/x-m4v",
  ".webm": "video/webm", ".mkv": "video/x-matroska",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".heic": "image/heic", ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
};

const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body) });
  res.end(body);
};
const notFound = (res, msg = "Not found") => json(res, 404, { error: msg });

// Guard against path traversal: ensure resolved path stays under base.
const safeJoin = (base, ...parts) => {
  const p = path.resolve(base, ...parts);
  if (p !== base && !p.startsWith(base + path.sep)) return null;
  return p;
};

const slugify = (s) =>
  s.toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    .slice(0, 60) || "short";

// ---- Shorts ----
async function listShorts() {
  let entries = [];
  try { entries = await fs.readdir(VIDEOS, { withFileTypes: true }); }
  catch { return []; }
  const shorts = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const dir = path.join(VIDEOS, e.name);
    const finalMp4 = path.join(dir, "short.mp4");
    const hasVideo = existsSync(finalMp4);
    const processing = !hasVideo && existsSync(path.join(dir, ".create-short.log"));
    let sizeMB = null, mtime = null;
    if (hasVideo) {
      const st = statSync(finalMp4);
      sizeMB = +(st.size / 1024 / 1024).toFixed(1);
      mtime = st.mtimeMs;
    }
    shorts.push({
      name: e.name,
      status: hasVideo ? "ready" : processing ? "processing" : "draft",
      sizeMB, mtime,
      videoUrl: hasVideo ? `/media/${encodeURIComponent(e.name)}/short.mp4` : null,
    });
  }
  shorts.sort((a, b) => (b.mtime || 0) - (a.mtime || 0) || a.name.localeCompare(b.name));
  return shorts;
}

// ---- Serve a file, with Range support for video ----
function serveFile(req, res, filePath) {
  let st;
  try { st = statSync(filePath); } catch { return notFound(res); }
  if (st.isDirectory()) filePath = path.join(filePath, "index.html");
  try { st = statSync(filePath); } catch { return notFound(res); }
  const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= st.size) {
      res.writeHead(416, { "content-range": `bytes */${st.size}` });
      return res.end();
    }
    res.writeHead(206, {
      "content-type": type,
      "content-range": `bytes ${start}-${end}/${st.size}`,
      "accept-ranges": "bytes",
      "content-length": end - start + 1,
    });
    createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "content-type": type, "content-length": st.size, "accept-ranges": "bytes" });
    createReadStream(filePath).pipe(res);
  }
}

// ---- Create a new short ----
async function handleNewShort(req, res) {
  const tmpDir = path.join(VIDEOS, ".uploads_tmp");
  await fs.mkdir(tmpDir, { recursive: true });
  const form = formidable({
    multiples: true,
    uploadDir: tmpDir,
    keepExtensions: true,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2 GB per file
  });
  let fields, files;
  try { [fields, files] = await form.parse(req); }
  catch (err) { return json(res, 400, { error: "Upload failed: " + err.message }); }

  const rawName = Array.isArray(fields.name) ? fields.name[0] : fields.name;
  if (!rawName || !rawName.trim()) return json(res, 400, { error: "Missing short name." });
  const name = slugify(rawName);

  const destDir = safeJoin(VIDEOS, name);
  if (!destDir) return json(res, 400, { error: "Invalid name." });
  if (existsSync(destDir)) return json(res, 409, { error: `Folder "${name}" already exists.` });

  const uploaded = [];
  for (const key of Object.keys(files)) {
    const arr = Array.isArray(files[key]) ? files[key] : [files[key]];
    uploaded.push(...arr);
  }
  if (uploaded.length === 0) return json(res, 400, { error: "Upload at least one file." });

  await fs.mkdir(destDir, { recursive: true });
  for (const f of uploaded) {
    const orig = f.originalFilename || path.basename(f.filepath);
    const target = path.join(destDir, path.basename(orig));
    await fs.rename(f.filepath, target);
  }

  // Fire the create-short skill in the background; log to the folder. cwd is the
  // repo root so Claude Code picks up .claude/skills/create-short.
  const logPath = path.join(destDir, ".create-short.log");
  const log = await fs.open(logPath, "w");
  const child = spawn(CLAUDE_BIN, ["-p", `/create-short ${name}`], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: ["ignore", log.fd, log.fd],
  });
  child.unref();
  await log.close();

  json(res, 200, { ok: true, name, files: uploaded.length });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (req.method === "GET" && pathname === "/") {
      return serveFile(req, res, path.join(__dirname, "index.html"));
    }
    if (req.method === "GET" && pathname === "/api/shorts") {
      return json(res, 200, await listShorts());
    }
    if (req.method === "POST" && pathname === "/api/new-short") {
      return await handleNewShort(req, res);
    }
    if (req.method === "GET" && pathname.startsWith("/media/")) {
      const rel = pathname.slice("/media/".length);
      const fp = safeJoin(VIDEOS, rel);
      if (!fp) return notFound(res);
      return serveFile(req, res, fp);
    }
    notFound(res);
  } catch (err) {
    console.error(err);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Shorts dashboard → http://${HOST}:${PORT}`);
  console.log(`  videos root: ${VIDEOS}`);
  console.log(`  create-short: ${CLAUDE_BIN} -p "/create-short <slug>" (cwd ${REPO_ROOT})\n`);
});
