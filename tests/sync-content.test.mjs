import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseFrontmatter } from "../scripts/lib/frontmatter.mjs";
import { syncContent } from "../scripts/sync-content.mjs";

test("sync-content: minimal article with only # Title and paragraphs", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-minimal-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Article"), { recursive: true });

  const rawArticle = `# Scaling Realtime WebSockets

First paragraph explaining architecture in simple words. This paragraph forms the description.

Second paragraph goes deeper into connection pooling and memory limits.
`;
  writeFileSync(join(contentDir, "Article", "scaling-websockets.md"), rawArticle, "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const generatedPath = join(root, "src/content/blog/scaling-websockets.md");
  assert.ok(existsSync(generatedPath), "Generated file must exist");

  const output = readFileSync(generatedPath, "utf8");
  const { frontmatter, body } = parseFrontmatter(output);

  assert.equal(frontmatter.title, "Scaling Realtime WebSockets");
  assert.ok(frontmatter.description.includes("First paragraph explaining architecture"));
  assert.ok(frontmatter.pubDatetime);
  assert.deepEqual(frontmatter.tags, ["others"]);
  assert.equal(frontmatter.draft, false);
  assert.doesNotMatch(body, /^#\s+/m, "Consumable H1 must be stripped from body");
  assert.ok(body.includes("First paragraph explaining architecture"));
});

test("sync-content: YAML header and plain header produce identical output", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-headers-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Article"), { recursive: true });

  const yamlArticle = `---
title: "Article A"
description: "Identical description between fifty and one hundred sixty characters in length."
tags: ["distributed-systems"]
date: 2026-05-01
---

## Body Header
Paragraph content for testing.
`;

  const plainArticle = `title: Article A
description: Identical description between fifty and one hundred sixty characters in length.
tags: distributed-systems
date: 2026-05-01

## Body Header
Paragraph content for testing.
`;

  writeFileSync(join(contentDir, "Article", "art-yaml.md"), yamlArticle, "utf8");
  writeFileSync(join(contentDir, "Article", "art-plain.md"), plainArticle, "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const outYaml = readFileSync(join(root, "src/content/blog/art-yaml.md"), "utf8");
  const outPlain = readFileSync(join(root, "src/content/blog/art-plain.md"), "utf8");

  const parsedYaml = parseFrontmatter(outYaml);
  const parsedPlain = parseFrontmatter(outPlain);

  assert.equal(parsedYaml.frontmatter.title, parsedPlain.frontmatter.title);
  assert.equal(parsedYaml.frontmatter.description, parsedPlain.frontmatter.description);
  assert.deepEqual(parsedYaml.frontmatter.tags, parsedPlain.frontmatter.tags);
  assert.equal(parsedYaml.body.trim(), parsedPlain.body.trim());
});

test("sync-content: aliases, tag normalization, and folder defaults", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-aliases-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Projects"), { recursive: true });
  mkdirSync(join(contentDir, "Opensource"), { recursive: true });

  // Projects file using aliases
  const projectDoc = `github: https://github.com/example/tool
website: https://tool.example.com
tags: Rust, High Performance, Tooling
date: 2026-02-15
updated: 2026-03-01

# Fast Tool

Fast tool description that is well within the acceptable character limits for documentation.
`;
  writeFileSync(join(contentDir, "Projects", "fast-tool.md"), projectDoc, "utf8");

  // Opensource default type and status
  const opensourceDoc = `github: https://github.com/example/open
# Open Utility

An open source utility library built for resilient network protocols.
`;
  writeFileSync(join(contentDir, "Opensource", "open-utility.md"), opensourceDoc, "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const outProject = readFileSync(join(root, "src/content/products/fast-tool.md"), "utf8");
  const { frontmatter: fmProj } = parseFrontmatter(outProject);

  assert.equal(fmProj.title, "Fast Tool");
  assert.equal(fmProj.type, "other", "Projects defaults type to other");
  assert.equal(fmProj.status, "building", "Projects defaults status to building");
  assert.equal(fmProj.links.githubUrl, "https://github.com/example/tool");
  assert.equal(fmProj.links.websiteUrl, "https://tool.example.com");
  assert.deepEqual(fmProj.tags, ["rust", "high-performance", "tooling"]);
  assert.ok(fmProj.modDatetime);

  const outOpen = readFileSync(join(root, "src/content/products/open-utility.md"), "utf8");
  const { frontmatter: fmOpen } = parseFrontmatter(outOpen);

  assert.equal(fmOpen.title, "Open Utility");
  assert.equal(fmOpen.type, "open-source", "Opensource defaults type to open-source");
  assert.equal(fmOpen.status, "live", "Opensource defaults status to live");
});

test("sync-content: explicit type and status override folder defaults", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-explicit-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Projects"), { recursive: true });

  const customDoc = `type: android-app
status: live
playstore: https://play.google.com/store/apps/details?id=com.example.app

# Custom App

A native Android application built with Kotlin and Jetpack Compose.
`;
  writeFileSync(join(contentDir, "Projects", "custom-app.md"), customDoc, "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const out = readFileSync(join(root, "src/content/products/custom-app.md"), "utf8");
  const { frontmatter } = parseFrontmatter(out);
  assert.equal(frontmatter.type, "android-app");
  assert.equal(frontmatter.status, "live");
  assert.equal(
    frontmatter.links.playStoreUrl,
    "https://play.google.com/store/apps/details?id=com.example.app",
  );
});

test("sync-content: draft and '_' prefixed files and nested subfolders", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-skip-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Article", "2026", "deep"), { recursive: true });
  mkdirSync(join(contentDir, "Article", "_drafts"), { recursive: true });

  // Nested article with date prefix in slug
  const nested = `# Nested Story

Opening description for a nested story residing inside a year subfolder.
`;
  writeFileSync(
    join(contentDir, "Article", "2026", "deep", "2026-11-22-nested-story.md"),
    nested,
    "utf8",
  );

  // Underscore file
  writeFileSync(join(contentDir, "Article", "_ignore-me.md"), "# Ignored\nText", "utf8");
  // Underscore folder
  writeFileSync(join(contentDir, "Article", "_drafts", "wip.md"), "# WIP\nText", "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  // Slug should strip YYYY-MM-DD- prefix and be flattened to src/content/blog/nested-story.md
  assert.ok(existsSync(join(root, "src/content/blog/nested-story.md")));
  assert.equal(existsSync(join(root, "src/content/blog/_ignore-me.md")), false);
  assert.equal(existsSync(join(root, "src/content/blog/wip.md")), false);
});

test("sync-content: validates slug collision between Projects and Opensource", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-collision-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Projects"), { recursive: true });
  mkdirSync(join(contentDir, "Opensource"), { recursive: true });

  writeFileSync(
    join(contentDir, "Projects", "duplicate-app.md"),
    `# Duplicate App\nDescription paragraph for testing.`,
    "utf8",
  );
  writeFileSync(
    join(contentDir, "Opensource", "duplicate-app.md"),
    `# Duplicate App\ngithub: https://github.com/example/dup\nDescription paragraph for testing.`,
    "utf8",
  );

  await assert.rejects(
    async () => {
      await syncContent({
        cwd: root,
        contentDir: "content",
        targetDir: "src/content",
        manifestFile: "src/content/.generated.json",
        silent: true,
      });
    },
    (err) => {
      return err.errors.some((e) => e.includes("collides with"));
    },
  );
});

test("sync-content: friendly validation collects all problems at once", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-multi-err-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Projects"), { recursive: true });

  // Invalid: missing title, invalid type, non-https url, live without links
  const badDoc = `type: invalid-type-name
status: live
website: http://insecure.com
date: not-a-date

<!-- missing title and no description -->
`;
  writeFileSync(join(contentDir, "Projects", "bad-doc.md"), badDoc, "utf8");

  await assert.rejects(
    async () => {
      await syncContent({
        cwd: root,
        contentDir: "content",
        targetDir: "src/content",
        manifestFile: "src/content/.generated.json",
        silent: true,
      });
    },
    (err) => {
      const msgs = err.errors.join("\n");
      assert.ok(msgs.includes("Missing title"), "Must report missing title");
      assert.ok(msgs.includes("Unknown product type"), "Must report unknown type");
      assert.ok(msgs.includes("not https"), "Must report non-https URL");
      assert.ok(msgs.includes("Invalid date"), "Must report invalid date");
      return true;
    },
  );
});

test("sync-content: stale generated file removed while non-generated file stays", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-manifest-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Article"), { recursive: true });

  writeFileSync(
    join(contentDir, "Article", "first-post.md"),
    `# First Post\nDescription text for first post.`,
    "utf8",
  );

  // Initial sync
  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const generatedFirst = join(root, "src/content/blog/first-post.md");
  assert.ok(existsSync(generatedFirst));

  // Add an unmanaged manual file directly to src/content/blog
  const manualFile = join(root, "src/content/blog/manual.md");
  writeFileSync(manualFile, "# Manual\nManual content.", "utf8");

  // Remove first-post from content/Article
  rmSync(join(contentDir, "Article", "first-post.md"));

  // Add second-post
  writeFileSync(
    join(contentDir, "Article", "second-post.md"),
    `# Second Post\nDescription text for second post.`,
    "utf8",
  );

  // Sync again
  const result = await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  // Stale file removed
  assert.equal(existsSync(generatedFirst), false, "Stale file must be removed");
  // New file present
  assert.ok(existsSync(join(root, "src/content/blog/second-post.md")), "New file must exist");
  // Unmanaged file remains
  assert.ok(existsSync(manualFile), "Manual file not in manifest must remain untouched");
  // Unmanaged file generates a warning
  assert.ok(result.warnings.some((w) => w.includes("Non-generated file found")));
});

test("sync-content: running twice is completely idempotent", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-test-idempotent-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const contentDir = join(root, "content");
  mkdirSync(join(contentDir, "Article"), { recursive: true });

  writeFileSync(
    join(contentDir, "Article", "steady.md"),
    `# Steady Post\nSteady description text for testing.`,
    "utf8",
  );

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const path = join(root, "src/content/blog/steady.md");
  const firstContent = readFileSync(path, "utf8");

  await syncContent({
    cwd: root,
    contentDir: "content",
    targetDir: "src/content",
    manifestFile: "src/content/.generated.json",
    silent: true,
  });

  const secondContent = readFileSync(path, "utf8");
  assert.equal(firstContent, secondContent, "Second sync run must produce identical content");
});
