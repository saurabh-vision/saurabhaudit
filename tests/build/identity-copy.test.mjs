import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { SITE } from "../../src/config.ts";

async function getHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getHtmlFiles(full)));
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

test("identity copy: home and about h1 headings", async () => {
  const homeHtml = await readFile("dist/index.html", "utf8");
  const aboutHtml = await readFile("dist/about/index.html", "utf8");

  const homeH1s = [...homeHtml.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gi)];
  assert.equal(homeH1s.length, 1, "Home page must have exactly one <h1>");
  assert.match(homeH1s[0][1], new RegExp(SITE.title, "i"));

  const aboutH1s = [...aboutHtml.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gi)];
  assert.equal(aboutH1s.length, 1, "About page must have exactly one <h1>");
  assert.match(aboutH1s[0][1], /About/i);
});

test("identity copy: home meta description matches SITE.desc and length constraints", async () => {
  const homeHtml = await readFile("dist/index.html", "utf8");
  const metaDescMatch = homeHtml.match(
    /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']+)["']/i,
  );
  assert.ok(metaDescMatch, "Home page must have meta description tag");
  assert.equal(metaDescMatch[1], SITE.desc, "Home meta description must equal SITE.desc");
  assert.ok(
    SITE.desc.length >= 120 && SITE.desc.length <= 160,
    `SITE.desc length (${SITE.desc.length}) must be between 120 and 160 chars`,
  );
});

test("identity copy: tagline and bio appear on index.html exactly once", async () => {
  const homeHtml = await readFile("dist/index.html", "utf8");
  const taglineMatches = [
    ...homeHtml.matchAll(new RegExp(SITE.tagline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")),
  ];
  assert.equal(taglineMatches.length, 1, "SITE.tagline must appear on index.html exactly once");

  const bioMatches = [
    ...homeHtml.matchAll(new RegExp(SITE.bio.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")),
  ];
  assert.equal(bioMatches.length, 1, "SITE.bio must appear on index.html exactly once");
});

test("identity copy: about page is indexable and present in sitemap-0.xml", async () => {
  const aboutHtml = await readFile("dist/about/index.html", "utf8");
  const robotsMatch = aboutHtml.match(
    /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']([^"']+)["']/i,
  );
  if (robotsMatch) {
    assert.doesNotMatch(robotsMatch[1], /noindex/i, "About page must not have noindex robots meta");
  }

  const sitemapXml = await readFile("dist/sitemap-0.xml", "utf8");
  assert.match(
    sitemapXml,
    /<loc>[^<]*\/about\/?<\/loc>/i,
    "About page must be present in sitemap-0.xml",
  );
});

test("identity copy: no TODO or lorem in any dist HTML file", async () => {
  const htmlFiles = await getHtmlFiles("dist");
  for (const file of htmlFiles) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /\bTODO\b/, `File ${file} must not contain TODO`);
    assert.doesNotMatch(content, /\blorem\b/i, `File ${file} must not contain lorem ipsum`);
  }
});

test("identity copy: no banned buzzwords in home, about, or markdown endpoints", async () => {
  const bannedWords = [
    "passionate",
    "world-class",
    "cutting-edge",
    "best-in-class",
    "leading",
    "guru",
    "ninja",
    "rockstar",
    "innovative",
    "revolutionary",
    "#1",
    "seamless",
    "game-changing",
  ];

  const filesToCheck = [
    "dist/index.html",
    "dist/about/index.html",
    "dist/index.md",
    "dist/about.md",
  ];

  for (const file of filesToCheck) {
    const rawContent = await readFile(file, "utf8");
    // Strip HTML tags so CSS classes (e.g. Tailwind's leading-relaxed) are not inspected as prose
    const textContent = file.endsWith(".html") ? rawContent.replace(/<[^>]+>/g, " ") : rawContent;
    for (const word of bannedWords) {
      const regex = new RegExp(
        `(?<![a-zA-Z0-9_-])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zA-Z0-9_-])`,
        "i",
      );
      assert.doesNotMatch(
        textContent,
        regex,
        `File ${file} must not contain banned buzzword "${word}"`,
      );
    }
  }
});

test("identity copy: no unconfigured email or mailto link when SITE.email is empty", async () => {
  assert.equal(SITE.email, "", "SITE.email should be empty string when unconfigured");
  const homeHtml = await readFile("dist/index.html", "utf8");
  const aboutHtml = await readFile("dist/about/index.html", "utf8");

  assert.doesNotMatch(
    homeHtml,
    /mailto:/i,
    "Home page must not have mailto link when email is empty",
  );
  assert.doesNotMatch(
    aboutHtml,
    /mailto:/i,
    "About page must not have mailto link when email is empty",
  );
  assert.doesNotMatch(
    aboutHtml,
    /<section id="contact">/i,
    "About page must not render contact section when email is empty",
  );
});
