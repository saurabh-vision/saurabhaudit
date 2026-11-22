import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import test from "node:test";
import { runSmoke } from "../scripts/smoke.mjs";

const MIME_TYPES = {
  ".html": "text/html",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
};

function createStaticDistServer(distDir = "dist") {
  return http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0].split("#")[0];
    if (reqPath === "/") reqPath = "/index.html";
    const cleanPath = reqPath.replace(/^\/+/, "");

    const candidates = [
      join(distDir, cleanPath),
      join(distDir, `${cleanPath}.html`),
      join(distDir, cleanPath, "index.html"),
    ];

    let foundFile = null;
    for (const c of candidates) {
      if (existsSync(c) && statSync(c).isFile()) {
        foundFile = c;
        break;
      }
    }

    if (foundFile) {
      const ext = foundFile.slice(foundFile.lastIndexOf("."));
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(readFileSync(foundFile));
    } else {
      const notFoundPath = join(distDir, "404.html");
      const notFoundHtml = existsSync(notFoundPath) ? readFileSync(notFoundPath) : "Page Not Found";
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(notFoundHtml);
    }
  });
}

test("smoke test: runs successfully against a local static dist server", async () => {
  const server = createStaticDistServer("dist");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const silentLogger = { log() {}, error() {} };
    const { passed, results } = await runSmoke(baseUrl, {
      allowHttp: true,
      logger: silentLogger,
    });
    assert.equal(passed, true, "Smoke test must pass against valid dist server");
    assert.ok(results.length >= 10, "Smoke test must execute all verification checks");
  } finally {
    server.close();
  }
});

test("smoke test: fails cleanly when server returns 500 error", async () => {
  const brokenServer = http.createServer((_req, res) => {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  });

  await new Promise((resolve) => brokenServer.listen(0, "127.0.0.1", resolve));
  const port = brokenServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const silentLogger = { log() {}, error() {} };
    const { passed } = await runSmoke(baseUrl, {
      allowHttp: true,
      logger: silentLogger,
    });
    assert.equal(passed, false, "Smoke test must fail when server returns 500");
  } finally {
    brokenServer.close();
  }
});
