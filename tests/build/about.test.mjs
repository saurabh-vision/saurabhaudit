import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE } from "../../src/config.ts";
import { SOCIAL_PROFILE_URLS } from "../../src/constants.ts";

test("about page renders single h1, verified elsewhere links, valid AboutPage json-ld, and correct thin-page robots meta", async () => {
  const html = await readFile("dist/about/index.html", "utf8");

  // 1. Exactly one <h1>
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gi)];
  assert.equal(h1Matches.length, 1, "About page must have exactly one <h1>");
  assert.match(h1Matches[0][1], /About/i, "h1 must be 'About'");

  // 2. Elsewhere section links match real social URLs and contain no TODO or empty hrefs
  assert.match(html, /<h2\b[^>]*>Elsewhere<\/h2>/i, "Elsewhere section heading present");
  for (const url of SOCIAL_PROFILE_URLS) {
    assert.match(
      html,
      new RegExp(`href=["']${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
      `Elsewhere section must link to ${url}`,
    );
  }
  assert.doesNotMatch(html, /href=["']TODO["']/i, "No href='TODO' allowed");
  assert.doesNotMatch(html, /href=["']["']/i, "No empty href='' allowed");

  // 3. No legacy strings (steipete, peter, siebensterngasse, vienna)
  const stripped = html.replace(
    /<a\b[^>]*https:\/\/github\.com\/steipete\/steipete\.me[^>]*>.*?<\/a>/gis,
    "",
  );
  assert.doesNotMatch(
    stripped,
    /\b(?:steipete|peter|siebensterngasse|vienna)\b/i,
    "About page must contain no legacy author or imprint details",
  );

  // 4. AboutPage JSON-LD present and valid
  const jsonLdMatches = [
    ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ];
  const aboutSchemas = jsonLdMatches
    .map((m) => JSON.parse(m[1]))
    .flatMap((s) => (Array.isArray(s["@graph"]) ? s["@graph"] : [s]))
    .filter((s) => s["@type"] === "AboutPage");
  assert.equal(aboutSchemas.length, 1, "Exactly one AboutPage schema must be present");
  assert.equal(aboutSchemas[0].name, `About | ${SITE.title}`);
  assert.equal(aboutSchemas[0].mainEntity?.["@type"], "Person");
  assert.equal(aboutSchemas[0].mainEntity?.name, SITE.author);
  assert.deepEqual(aboutSchemas[0].mainEntity?.sameAs, SOCIAL_PROFILE_URLS);

  // 5. Substack iframe is present
  if (SITE.substackUrl) {
    assert.match(
      html,
      /<iframe\b[^>]*\bsrc=["']https:\/\/howsystemsscale\.substack\.com\/embed["']/i,
      "Substack embed iframe must be present on About page",
    );
  }

  // 6. Robots meta matches guard state
  // With SITE.bio and about.mdx populated, the page is indexable (not thin)
  const robotsMatch = html.match(
    /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']([^"']+)["']/i,
  );
  if (robotsMatch) {
    assert.doesNotMatch(
      robotsMatch[1],
      /noindex/i,
      "robots meta must not include noindex when bio and body are present",
    );
  }
});
