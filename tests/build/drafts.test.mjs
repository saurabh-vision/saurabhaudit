import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);

test("draft posts are excluded from pages, sitemap, rss, and search", async (t) => {
  const fixtureSlug = "temp-draft-post-fixture";
  const fixturePath = `src/content/blog/${fixtureSlug}.md`;
  const outDir = "dist-draft-test";

  const fixtureContent = `---
title: "Temporary Draft Verification Post"
description: "A temporary draft article verifying that unpublished drafts are strictly excluded from output."
pubDatetime: 2026-01-01T00:00:00Z
draft: true
tags:
  - "testing"
---

## Secret Draft Heading

This draft post text must never appear in any HTML pages, sitemap entries, RSS feeds, or Pagefind search indices.
`;

  await writeFile(fixturePath, fixtureContent);
  t.after(async () => {
    await rm(fixturePath, { force: true });
    await rm(outDir, { recursive: true, force: true });
  });

  // Build the site to the isolated directory
  await run("pnpm", ["exec", "astro", "build", "--outDir", outDir], {
    shell: true,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });

  // Run pagefind on the output directory
  await run("pnpm", ["exec", "pagefind", "--site", outDir], {
    shell: true,
  });

  // 1. Direct page does NOT exist in output
  assert.equal(
    existsSync(`${outDir}/posts/${fixtureSlug}/index.html`),
    false,
    `Draft route ${outDir}/posts/${fixtureSlug}/index.html must not be built`,
  );
  assert.equal(
    existsSync(`${outDir}/posts/${fixtureSlug}.md`),
    false,
    `Draft markdown endpoint ${outDir}/posts/${fixtureSlug}.md must not be built`,
  );

  // 2. Draft is absent from RSS feed
  const rssXml = await readFile(`${outDir}/rss.xml`, "utf8");
  assert.doesNotMatch(
    rssXml,
    new RegExp(fixtureSlug, "i"),
    "Draft slug must not be present in rss.xml",
  );

  // 3. Draft is absent from sitemap
  let sitemapContent = "";
  if (existsSync(`${outDir}/sitemap-0.xml`)) {
    sitemapContent += await readFile(`${outDir}/sitemap-0.xml`, "utf8");
  }
  if (existsSync(`${outDir}/sitemap-index.xml`)) {
    sitemapContent += await readFile(`${outDir}/sitemap-index.xml`, "utf8");
  }
  assert.doesNotMatch(
    sitemapContent,
    new RegExp(fixtureSlug, "i"),
    "Draft slug must not be present in sitemap",
  );

  // 4. Draft is absent from Pagefind index files
  const pagefindDir = `${outDir}/pagefind`;
  assert.ok(existsSync(pagefindDir), "Pagefind directory must exist in output");
  // Inspect pagefind entry points
  const pagefindEntry = await readFile(`${outDir}/pagefind/pagefind.js`, "utf8");
  assert.doesNotMatch(pagefindEntry, new RegExp(fixtureSlug, "i"));
});
