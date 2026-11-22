import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE } from "../../src/config.ts";

const schemas = (html) =>
  [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap(
    (match) => {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    },
  );

test("only article pages publish one BlogPosting with an ISO duration", async () => {
  for (const path of ["index.html", "about/index.html", "search/index.html", "posts/index.html"]) {
    const data = schemas(await readFile(`dist/${path}`, "utf8"));
    assert.equal(data.filter((item) => item["@type"] === "BlogPosting").length, 0, path);
  }
  const data = schemas(
    await readFile("dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html", "utf8"),
  );
  const articles = data.filter((item) => item["@type"] === "BlogPosting");
  assert.equal(articles.length, 1);
  assert.match(articles[0].timeRequired, /^PT\d+M$/);
  assert.ok(Number.isFinite(Date.parse(articles[0].datePublished)));
});

test("the Markdown home contact comes from current site configuration", async () => {
  const home = await readFile("dist/index.md", "utf8");
  assert.ok(home.includes(SITE.title));
  assert.ok(home.includes("## Latest Posts"));
  assert.ok(home.includes("/posts/how-clipvault-saves-clipboard-on-android-10"));
  assert.equal(home.includes("@gmail.com"), false);
  assert.doesNotMatch(home, /\b(?:steipete|peter|steinberger)\b/i);
});
