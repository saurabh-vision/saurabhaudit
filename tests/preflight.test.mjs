import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  checkDeployWorkflow,
  checkDistHygiene,
  checkDomainAndCname,
  checkRequiredDistFiles,
  checkSitemapsAndContent,
  checkTrackedFilesAndLeaks,
  checkWarnings,
} from "../scripts/preflight.mjs";

function setupPreflightFixture() {
  const tmpDir = mkdtempSync(join(tmpdir(), "preflight-unit-"));
  const distDir = join(tmpDir, "dist");
  const publicDir = join(tmpDir, "public");
  mkdirSync(distDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(join(distDir, "pagefind"), { recursive: true });
  mkdirSync(join(distDir, "about"), { recursive: true });

  writeFileSync(join(publicDir, "CNAME"), "saurabhaudit.com");
  writeFileSync(join(distDir, "CNAME"), "saurabhaudit.com");
  writeFileSync(join(distDir, "404.html"), "<html><h1>404</h1></html>");
  writeFileSync(
    join(distDir, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: https://saurabhaudit.com/sitemap-index.xml\n",
  );
  writeFileSync(join(distDir, "rss.xml"), "<rss></rss>");
  writeFileSync(join(distDir, "og-default.png"), "mock-png-data");
  writeFileSync(join(distDir, "favicon.svg"), "<svg></svg>");
  writeFileSync(join(distDir, "pagefind", "pagefind.js"), "// pagefind");
  writeFileSync(
    join(distDir, "sitemap-index.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://saurabhaudit.com/sitemap-0.xml</loc></sitemap>
</sitemapindex>`,
  );
  writeFileSync(
    join(distDir, "sitemap-0.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://saurabhaudit.com/</loc></url>
  <url><loc>https://saurabhaudit.com/about/</loc></url>
</urlset>`,
  );
  writeFileSync(join(distDir, "index.html"), "<html><body>Clean content</body></html>");
  writeFileSync(
    join(distDir, "about", "index.html"),
    "<html><body><h1>About</h1><p>Content</p></body></html>",
  );

  return {
    tmpDir,
    distDir,
    cleanup() {
      rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}

test("preflight: checkDomainAndCname validates https, non-www, and CNAME matching", () => {
  const fixture = setupPreflightFixture();
  try {
    // 1. Invalid www domain
    const wwwRes = checkDomainAndCname({ website: "https://www.example.com" }, fixture.tmpDir);
    assert.equal(wwwRes.status, "BLOCKER");
    assert.match(wwwRes.detail, /must be https and non-www/i);

    // 2. Invalid http domain
    const httpRes = checkDomainAndCname({ website: "http://example.com" }, fixture.tmpDir);
    assert.equal(httpRes.status, "BLOCKER");

    // 3. Valid domain with matching mock CNAME
    const validRes = checkDomainAndCname({ website: "https://saurabhaudit.com/" }, fixture.tmpDir);
    assert.equal(validRes.status, "PASS");
  } finally {
    fixture.cleanup();
  }
});

test("preflight: checkRequiredDistFiles flags missing files or invalid robots.txt", () => {
  const fixture = setupPreflightFixture();
  try {
    // Non-existent directory
    const missingRes = checkRequiredDistFiles("non-existent-dist-dir");
    assert.equal(missingRes.status, "BLOCKER");
    assert.match(missingRes.detail, /Missing required build artifacts/i);

    // Valid fixture dist directory
    const realRes = checkRequiredDistFiles(fixture.distDir);
    assert.equal(realRes.status, "PASS");
  } finally {
    fixture.cleanup();
  }
});

test("preflight: checkSitemapsAndContent validates canonical host and noindex", () => {
  const fixture = setupPreflightFixture();
  try {
    const realRes = checkSitemapsAndContent(fixture.distDir, "saurabhaudit.com");
    assert.equal(realRes.status, "PASS");
  } finally {
    fixture.cleanup();
  }
});

test("preflight: checkDistHygiene passes on clean dist output", () => {
  const fixture = setupPreflightFixture();
  try {
    const realRes = checkDistHygiene(fixture.distDir);
    assert.equal(realRes.status, "PASS");
  } finally {
    fixture.cleanup();
  }
});

test("preflight: checkDeployWorkflow validates permissions and build commands", () => {
  const res = checkDeployWorkflow(".");
  assert.equal(res.status, "PASS");
});

test("preflight: checkTrackedFilesAndLeaks confirms no sensitive tracked files", () => {
  const res = checkTrackedFilesAndLeaks(".");
  assert.equal(res.status, "PASS");
});

test("preflight: checkWarnings detects missing bio, tagline, or article minimums", () => {
  // Empty config produces warnings
  const emptyWarnings = checkWarnings({}, ".");
  assert.ok(emptyWarnings.length >= 3);
  assert.ok(emptyWarnings.some((w) => w.issue.includes("tagline")));
  assert.ok(emptyWarnings.some((w) => w.issue.includes("desc")));
  assert.ok(emptyWarnings.some((w) => w.issue.includes("bio")));

  // Real config warnings (email is unconfigured)
  const realWarnings = checkWarnings(
    {
      tagline: "Android apps",
      desc: "Description",
      bio: "Bio",
      email: "",
    },
    ".",
  );
  assert.ok(realWarnings.some((w) => w.issue.includes("email")));
});
