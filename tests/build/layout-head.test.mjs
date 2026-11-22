import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { SITE } from "../../src/config.ts";

const run = promisify(execFile);

test("layout and head metadata are lean, correct, and avoid unconditional widget scripts", async () => {
  const indexHtml = await readFile("dist/index.html", "utf8");
  const postHtml = await readFile(
    "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
    "utf8",
  );

  for (const [path, html] of [
    ["index.html", indexHtml],
    ["posts/how-clipvault-saves-clipboard-on-android-10/index.html", postHtml],
  ]) {
    // 1. Twitter widgets.js is NOT loaded on pages without a tweet embed
    assert.doesNotMatch(
      html,
      /platform\.twitter\.com\/widgets\.js/,
      `widgets.js must be absent from ${path}`,
    );

    // 2. Exactly one canonical link
    const canonicalMatches = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
    assert.equal(canonicalMatches.length, 1, `exactly one canonical link in ${path}`);

    // 3. twitter:site and twitter:creator present when SITE.twitterHandle is non-empty
    if (SITE.twitterHandle) {
      assert.match(
        html,
        /<meta\b[^>]*\bname=["']twitter:site["'][^>]*content=["']@saurabhvsn["']/i,
      );
      assert.match(
        html,
        /<meta\b[^>]*\bname=["']twitter:creator["'][^>]*content=["']@saurabhvsn["']/i,
      );
    }

    // 4. og:site_name present
    assert.match(html, /<meta\b[^>]*\bproperty=["']og:site_name["'][^>]*content=["']Saurabh["']/i);

    // 5. og:locale present
    assert.match(html, /<meta\b[^>]*\bproperty=["']og:locale["'][^>]*content=["']en_US["']/i);

    // 6. html lang="en"
    assert.match(html, /<html\b[^>]*\blang=["']en["']/i);

    // 7. Footer Subscribe link present when SITE.substackUrl is set
    if (SITE.substackUrl) {
      assert.match(
        html,
        /<a\b[^>]*\bhref=["']https:\/\/howsystemsscale\.substack\.com["'][^>]*rel=["']noopener["'][^>]*>Subscribe<\/a>/i,
      );
    }
  }
});

test("a post containing a tweet embed receives widgets.js when built", async (t) => {
  const fixturePath = "src/content/blog/temp-tweet-fixture.md";
  const fixtureContent = `---
title: "Temp Tweet Fixture"
description: "Verifying widgets.js is injected for posts with tweets"
pubDatetime: 2026-01-01T00:00:00Z
draft: false
tags: ["others"]
---

Check out this tweet:

{% twitter https://x.com/saurabhvsn/status/1234567890 %}
`;
  await writeFile(fixturePath, fixtureContent);
  t.after(async () => {
    await rm(fixturePath, { force: true });
    await rm("dist-test-fixture", { recursive: true, force: true });
  });

  await run("pnpm", ["exec", "astro", "build", "--outDir", "dist-test-fixture"], {
    shell: true,
    env: { ...process.env, PATH: process.env.PATH, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  const html = await readFile("dist-test-fixture/posts/temp-tweet-fixture/index.html", "utf8");
  assert.match(
    html,
    /platform\.twitter\.com\/widgets\.js/,
    "Post with tweet embed must load widgets.js",
  );
});
