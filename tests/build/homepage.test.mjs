import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE } from "../../src/config.ts";

test("homepage renders single h1, latest posts, newsletter iframe, and clean metadata", async () => {
  const html = await readFile("dist/index.html", "utf8");

  // 1. Exactly one <h1>
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gi)];
  assert.equal(h1Matches.length, 1, "Homepage must have exactly one <h1>");
  assert.match(h1Matches[0][1], new RegExp(SITE.title, "i"), "h1 contains site title");

  // 2. Canonical link equals SITE.website
  const canonicalMatch = html.match(
    /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i,
  );
  assert.ok(canonicalMatch, "Canonical link must be present");
  assert.equal(canonicalMatch[1], SITE.website, "Canonical link must equal site URL");

  // 3. Latest posts section links to published posts
  assert.match(
    html,
    /href=["']\/posts\/how-clipvault-saves-clipboard-on-android-10(?:\/)?["']/,
    "Latest posts section must link to /posts/how-clipvault-saves-clipboard-on-android-10",
  );

  // 4. Substack iframe is present
  if (SITE.substackUrl) {
    assert.match(
      html,
      /<iframe\b[^>]*\bsrc=["']https:\/\/howsystemsscale\.substack\.com\/embed["']/i,
      "Substack embed iframe must be present on homepage",
    );
  }

  // 5. No steipete or peter strings on homepage (case-insensitive) except permitted MIT theme license
  const strippedThemeNotice = html.replace(
    /<a\b[^>]*https:\/\/github\.com\/steipete\/steipete\.me[^>]*>.*?<\/a>/gis,
    "",
  );
  assert.doesNotMatch(
    strippedThemeNotice,
    /\b(?:steipete|peter|steinberger)\b/i,
    "Homepage HTML content must not contain steipete or Peter Steinberger",
  );

  // 6. When tagline/bio are empty or TODO, no empty elements or TODO placeholders are rendered
  assert.doesNotMatch(html, />TODO</, "Homepage must not contain raw TODO placeholder text");
  assert.doesNotMatch(html, /<p\b[^>]*>\s*<\/p>/, "No empty paragraph element rendered");

  // 7. Structured data has no steipete values
  const jsonLdMatches = [
    ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ];
  for (const match of jsonLdMatches) {
    assert.doesNotMatch(
      match[1],
      /\b(?:steipete|steinberger)\b/i,
      "Structured data must not contain steipete or steinberger",
    );
  }
});
