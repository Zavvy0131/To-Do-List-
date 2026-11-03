"use strict";

/**
 * Tiny zero-dependency static server so the to-do app can be opened on a phone
 * (service workers and PWA install need http/https, not file://).
 *
 *   node server.js            -> serve on port 3000 and open the browser
 *   node server.js --no-open  -> serve without opening a browser
 *   PORT=8080 node server.js  -> custom port
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const OPEN_BROWSER = process.env.OPEN !== "0" && !process.argv.includes("--no-open");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const PRIVATE_FILES = new Set(["server.js", "start.cmd", "start.sh", "package.json", "package-lock.json", "README.md"]);
const PRIVATE_DIRS = new Set(["scripts", "node_modules"]);

function isPrivate(relative) {
  const segments = relative.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.some((segment) => segment.startsWith("."))) return true;
  if (PRIVATE_DIRS.has(segments[0].toLowerCase())) return true;
  return segments.length === 1 && PRIVATE_FILES.has(segments[0].toLowerCase());
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
  }

  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad Request");
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

  // Only the app itself is public: no dotfiles, no server internals.
  if (isPrivate(relative)) {
    return send(res, 404, "Not Found");
  }

  const filePath = path.resolve(ROOT, relative);

  // Never serve anything outside the app folder.
  const inside = path.relative(ROOT, filePath);
  if (inside.startsWith("..") || path.isAbsolute(inside)) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return send(res, 404, "Not Found");
    }

    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": stats.size,
      // Always revalidate: small app, keeps updates from getting stuck in caches.
      "Cache-Control": "no-cache",
    });

    if (req.method === "HEAD") return res.end();

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
});

function lanAddresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (!entry || entry.internal) continue;
      const isV4 = entry.family === "IPv4" || entry.family === 4;
      if (isV4) addresses.push(entry.address);
    }
  }
  return addresses;
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use. Try another port, e.g.  PORT=3001 node server.js\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const local = `http://localhost:${PORT}`;
  const lan = lanAddresses();

  console.log(`\n  To-Do List is running\n`);
  console.log(`  This computer   ${local}`);
  for (const ip of lan) console.log(`  Phone / tablet  http://${ip}:${PORT}`);
  if (lan.length === 0) console.log(`  Phone / tablet  (no Wi-Fi network detected)`);
  console.log(`\n  Open the second address on a device on the same Wi-Fi.`);
  console.log(`  Press Ctrl+C to stop.\n`);

  if (OPEN_BROWSER) {
    const opener =
      process.platform === "win32" ? `start "" "${local}"` :
      process.platform === "darwin" ? `open "${local}"` :
      `xdg-open "${local}"`;
    exec(opener, () => {});
  }
});
