import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
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

function setupSmokeDistFixture() {
  const tmpDir = mkdtempSync(join(tmpdir(), "smoke-dist-"));
  const distDir = join(tmpDir, "dist");
  mkdirSync(distDir, { recursive: true });
  mkdirSync(join(distDir, "notes"), { recursive: true });
  mkdirSync(join(distDir, "posts"), { recursive: true });
  mkdirSync(join(distDir, "products"), { recursive: true });
  mkdirSync(join(distDir, "about"), { recursive: true });
  mkdirSync(join(distDir, "pagefind"), { recursive: true });

  writeFileSync(
    join(distDir, "index.html"),
    "<!doctype html><html><head><title>Saurabh</title><link rel='canonical' href='https://saurabhaudit.com/'><meta http-equiv='Content-Security-Policy' content=\"default-src 'self'\"></head><body><h1>Saurabh</h1><p>Android apps, open-source projects and notes on how systems scale.</p></body></html>",
  );
  writeFileSync(join(distDir, "404.html"), "<!doctype html><html><h1>404 Not Found</h1></html>");
  writeFileSync(
    join(distDir, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: http://127.0.0.1/sitemap-index.xml\n",
  );
  writeFileSync(join(distDir, "rss.xml"), "<rss><channel><title>RSS</title></channel></rss>");
  writeFileSync(
    join(distDir, "notes", "rss.xml"),
    "<rss><channel><title>Notes</title></channel></rss>",
  );
  writeFileSync(join(distDir, "about", "index.html"), "<html><body>About</body></html>");
  writeFileSync(join(distDir, "posts", "index.html"), "<html><body>Posts</body></html>");
  writeFileSync(join(distDir, "products", "index.html"), "<html><body>Products</body></html>");
  writeFileSync(join(distDir, "notes", "index.html"), "<html><body>Notes</body></html>");
  writeFileSync(join(distDir, "og-default.png"), "mock-png");
  writeFileSync(join(distDir, "pagefind", "pagefind.js"), "// pagefind");
  writeFileSync(
    join(distDir, "sitemap-index.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>http://127.0.0.1/sitemap-0.xml</loc></sitemap>
</sitemapindex>`,
  );
  writeFileSync(
    join(distDir, "sitemap-0.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://127.0.0.1/</loc></url>
  <url><loc>http://127.0.0.1/about/</loc></url>
</urlset>`,
  );

  return {
    distDir,
    cleanup() {
      rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}

function createStaticDistServer(distDir) {
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
  const fixture = setupSmokeDistFixture();
  const server = createStaticDistServer(fixture.distDir);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const silentLogger = { log() {}, error() {} };
    const { passed, results } = await runSmoke(baseUrl, {
      allowHttp: true,
      logger: silentLogger,
    });
    if (!passed) {
      console.error(
        "Failed checks:",
        results.filter((r) => !r.pass),
      );
    }
    assert.equal(passed, true, "Smoke test must pass against valid dist server");
    assert.ok(results.length >= 10, "Smoke test must execute all verification checks");
  } finally {
    server.close();
    fixture.cleanup();
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
