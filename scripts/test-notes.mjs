import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const FIXTURE_LONG_PATH = "src/content/notes/fixture-long-note.md";
const FIXTURE_SHORT_PATH = "src/content/notes/fixture-short-note.md";
const FIXTURE_UNLISTED_PATH = "src/content/notes/fixture-unlisted-note.md";

// 70 words body (> 50 words)
const LONG_BODY = `
Web performance optimization requires a comprehensive approach to resource management.
First, eliminate render blocking resources by inlining critical styles and deferring secondary scripts.
Next, compress static assets with modern algorithms like Brotli and optimize raster images using WebP or AVIF formats.
Finally, adopt content delivery networks to reduce latency and serve static responses closer to end users.
By measuring Core Web Vitals continuously, teams maintain high responsiveness, visual stability, and seamless interactive experiences across varied network conditions.
`;

const FIXTURE_LONG_CONTENT = `---
title: "Long Comprehensive Note"
pubDatetime: 2026-01-01T00:00:00Z
tags:
  - "a"
  - "b"
sourceUrl: "https://example.com/source"
sourceTitle: "Example Source"
---
${LONG_BODY}
`;

// 20 words body (< 50 words, thin)
const FIXTURE_SHORT_CONTENT = `---
title: "Short Thin Note"
pubDatetime: 2026-01-02T00:00:00Z
tags:
  - "a"
---
This is a very short micro-note with fewer than fifty words in the content body.
`;

// Unlisted note with long body
const FIXTURE_UNLISTED_CONTENT = `---
title: "Unlisted Secret Note"
pubDatetime: 2026-01-03T00:00:00Z
unlisted: true
tags:
  - "b"
---
${LONG_BODY}
`;

function countH1(html) {
  const matches = html.match(/<h1\b[^>]*>/gi);
  return matches ? matches.length : 0;
}

function getScripts(html) {
  const matches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  return matches.map((m) => {
    const srcMatch = m[1].match(/src=["']([^"']+)["']/i);
    return srcMatch ? srcMatch[1] : m[2].trim();
  });
}

function runBuild() {
  const env = {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
  };
  if (existsSync("C:\\Users\\Dell\\AppData\\Roaming\\npm\\node_modules\\node\\bin")) {
    env.PATH = `C:\\Users\\Dell\\AppData\\Roaming\\npm\\node_modules\\node\\bin;${env.PATH}`;
  }
  execSync("pnpm run build", { stdio: "inherit", env });
}

const tempNotesBackupDir = "temp_notes_backup";
const realNotes = [];

try {
  // Isolate real notes during fixture & empty test suite
  if (!existsSync(tempNotesBackupDir)) mkdirSync(tempNotesBackupDir);
  const existingFiles = readdirSync("src/content/notes");
  for (const file of existingFiles) {
    if (file.endsWith(".md") && file !== "_template.md") {
      copyFileSync(join("src/content/notes", file), join(tempNotesBackupDir, file));
      rmSync(join("src/content/notes", file));
      realNotes.push(file);
    }
  }

  console.log("=== STEP 1: Creating notes fixtures ===");
  writeFileSync(FIXTURE_LONG_PATH, FIXTURE_LONG_CONTENT, "utf8");
  writeFileSync(FIXTURE_SHORT_PATH, FIXTURE_SHORT_CONTENT, "utf8");
  writeFileSync(FIXTURE_UNLISTED_PATH, FIXTURE_UNLISTED_CONTENT, "utf8");

  try {
    console.log("=== STEP 2: Running build with fixtures ===");
    runBuild();

    console.log("=== STEP 3: Verifying artifacts with fixtures ===");
    const notesHtml = readFileSync("dist/notes/index.html", "utf8");
    const longNoteHtml = readFileSync("dist/notes/fixture-long-note/index.html", "utf8");
    const shortNoteHtml = readFileSync("dist/notes/fixture-short-note/index.html", "utf8");
    const unlistedNoteHtml = readFileSync("dist/notes/fixture-unlisted-note/index.html", "utf8");
    const homeHtml = readFileSync("dist/index.html", "utf8");
    const sitemapXml = readFileSync("dist/sitemap-0.xml", "utf8");
    const notesRssXml = readFileSync("dist/notes/rss.xml", "utf8");
    const blogPostHtml = readFileSync(
      "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
      "utf8",
    );

    // Listing assertions: long and short notes listed, unlisted note excluded
    assert.ok(notesHtml.includes("Long Comprehensive Note"), "Listing must include long note");
    assert.ok(notesHtml.includes("Short Thin Note"), "Listing must include short note");
    assert.ok(!notesHtml.includes("Unlisted Secret Note"), "Listing must exclude unlisted note");
    assert.equal(countH1(notesHtml), 1, "Listing must have exactly one <h1>");
    assert.ok(
      notesHtml.includes('rel="alternate" type="application/rss+xml"'),
      "Listing must have notes RSS link",
    );

    // Long note detail assertions (indexable)
    assert.equal(countH1(longNoteHtml), 1, "Long note must have exactly one <h1>");
    assert.ok(
      !longNoteHtml.includes('name="robots" content="noindex'),
      "Long note must NOT be noindex",
    );
    assert.ok(sitemapXml.includes("/notes/fixture-long-note"), "Sitemap must include long note");
    assert.ok(longNoteHtml.includes('href="https://example.com/source"'), "Source link href");
    assert.ok(longNoteHtml.includes('target="_blank"'), "Source link target");
    assert.ok(longNoteHtml.includes('rel="noopener"'), "Source link rel");

    // Thin note detail assertions (noindex guard)
    assert.equal(countH1(shortNoteHtml), 1, "Short note must have exactly one <h1>");
    assert.ok(
      shortNoteHtml.includes('name="robots" content="noindex, follow"'),
      "Short thin note must have noindex, follow",
    );
    assert.ok(!sitemapXml.includes("/notes/fixture-short-note"), "Sitemap must exclude thin note");

    // Unlisted note detail assertions (noindex guard)
    assert.equal(countH1(unlistedNoteHtml), 1, "Unlisted note must have exactly one <h1>");
    assert.ok(
      unlistedNoteHtml.includes('name="robots" content="noindex, follow"'),
      "Unlisted note must have noindex, follow",
    );
    assert.ok(
      !sitemapXml.includes("/notes/fixture-unlisted-note"),
      "Sitemap must exclude unlisted note",
    );

    // RSS Feed assertions: contains long note only
    assert.ok(notesRssXml.includes("Long Comprehensive Note"), "Feed must include long note");
    assert.ok(!notesRssXml.includes("Short Thin Note"), "Feed must exclude thin note");
    assert.ok(!notesRssXml.includes("Unlisted Secret Note"), "Feed must exclude unlisted note");

    // Tag page assertions
    assert.ok(existsSync("dist/notes/tags/a/index.html"), "Tag 'a' page must exist");
    const tagAHtml = readFileSync("dist/notes/tags/a/index.html", "utf8");
    assert.equal(countH1(tagAHtml), 1, "Tag 'a' must have exactly one <h1>");
    assert.ok(
      !tagAHtml.includes('name="robots" content="noindex'),
      "Tag 'a' (2 notes) must be indexable",
    );

    assert.ok(existsSync("dist/notes/tags/b/index.html"), "Tag 'b' page must exist");
    const tagBHtml = readFileSync("dist/notes/tags/b/index.html", "utf8");
    assert.equal(countH1(tagBHtml), 1, "Tag 'b' must have exactly one <h1>");
    assert.ok(
      tagBHtml.includes('name="robots" content="noindex, follow"'),
      "Tag 'b' (1 note) must be noindex",
    );

    // Navigation & Homepage assertions
    assert.ok(homeHtml.includes('href="/notes"'), "Header must include Notes link");
    assert.ok(homeHtml.includes("Latest notes"), "Homepage must show Latest notes section");
    assert.ok(homeHtml.includes("Long Comprehensive Note"), "Homepage must show note card");

    // Script tags comparison
    const blogScripts = getScripts(blogPostHtml);
    const notesScripts = getScripts(notesHtml);
    const detailScripts = getScripts(longNoteHtml);

    for (const s of notesScripts) {
      assert.ok(
        blogScripts.includes(s) || s.includes("astro") || s.includes("schema.org"),
        `Unexpected script on /notes/: ${s}`,
      );
    }
    for (const s of detailScripts) {
      assert.ok(
        blogScripts.includes(s) || s.includes("astro") || s.includes("schema.org"),
        `Unexpected script on note detail: ${s}`,
      );
    }

    console.log("All note fixture assertions passed!");
  } finally {
    console.log("=== STEP 4: Cleaning up fixtures ===");
    if (existsSync(FIXTURE_LONG_PATH)) rmSync(FIXTURE_LONG_PATH);
    if (existsSync(FIXTURE_SHORT_PATH)) rmSync(FIXTURE_SHORT_PATH);
    if (existsSync(FIXTURE_UNLISTED_PATH)) rmSync(FIXTURE_UNLISTED_PATH);
  }

  console.log("=== STEP 5: Running clean build without notes (empty state check) ===");
  runBuild();

  console.log("=== STEP 6: Verifying clean build empty state ===");
  const cleanNotesHtml = readFileSync("dist/notes/index.html", "utf8");
  const cleanHomeHtml = readFileSync("dist/index.html", "utf8");
  const cleanSitemapXml = readFileSync("dist/sitemap-0.xml", "utf8");
  const cleanNotesRss = readFileSync("dist/notes/rss.xml", "utf8");

  assert.equal(countH1(cleanNotesHtml), 1, "Clean /notes/ must have exactly one <h1>");
  assert.ok(
    cleanNotesHtml.includes('name="robots" content="noindex, follow"'),
    "Clean /notes/ must be noindex, follow",
  );
  assert.ok(
    cleanNotesHtml.includes("Notes are on the way."),
    "Clean /notes/ must show empty state text",
  );
  assert.ok(!cleanSitemapXml.includes("/notes"), "Clean sitemap must not include /notes");
  assert.ok(
    !cleanHomeHtml.includes('href="/notes" class="active-nav"') &&
      !cleanHomeHtml.includes('<a href="/notes">Notes</a>') &&
      !cleanHomeHtml.includes('href="/notes" class:list'),
    "Clean Header must not contain Notes link",
  );
  assert.ok(
    !cleanHomeHtml.includes("Latest notes"),
    "Clean homepage must not contain Latest notes section",
  );
  assert.ok(
    cleanNotesRss.includes("<rss") && cleanNotesRss.includes("</rss>"),
    "Clean /notes/rss.xml must be valid XML",
  );
  assert.ok(!cleanNotesRss.includes("<item>"), "Clean /notes/rss.xml must have no items");

  console.log("All clean note assertions passed!");
} finally {
  console.log("=== Restoring real notes ===");
  for (const file of realNotes) {
    copyFileSync(join(tempNotesBackupDir, file), join("src/content/notes", file));
  }
  if (existsSync(tempNotesBackupDir)) {
    rmSync(tempNotesBackupDir, { recursive: true, force: true });
  }
  runBuild();
}
