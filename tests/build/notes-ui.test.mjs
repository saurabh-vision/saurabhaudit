import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("with real notes: /notes/ is indexable and lists notes", () => {
  assert.ok(existsSync("dist/notes/index.html"), "dist/notes/index.html must exist");
  const html = readFileSync("dist/notes/index.html", "utf8");

  assert.ok(
    !html.includes('name="robots" content="noindex'),
    "real /notes/ must be indexable when notes exist",
  );
  assert.ok(
    html.includes("Android 10+ lets only the active keyboard read your clipboard") ||
      html.includes("A lost ClipVault passphrase can&#39;t be recovered") ||
      html.includes("A lost ClipVault passphrase can't be recovered"),
    "real /notes/ must list published notes",
  );

  const h1Count = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
  assert.equal(h1Count, 1, "exactly one <h1> on /notes/");
});

test("with real notes: sitemap includes /notes", () => {
  assert.ok(existsSync("dist/sitemap-0.xml"), "dist/sitemap-0.xml must exist");
  const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
  assert.ok(sitemap.includes("/notes"), "sitemap must include /notes");
});

test("with real notes: Header and homepage include Notes and Latest notes section", () => {
  assert.ok(existsSync("dist/index.html"), "dist/index.html must exist");
  const html = readFileSync("dist/index.html", "utf8");

  const menuMatch = html.match(/<ul\s+id="menu-items"[\s\S]*?<\/ul>/i);
  if (menuMatch) {
    assert.ok(
      menuMatch[0].includes('href="/notes"'),
      "nav menu must contain /notes link when notes exist",
    );
  }
  assert.ok(
    html.includes("Latest notes"),
    "homepage must show Latest notes section when notes exist",
  );
});

test("with real notes: /notes/rss.xml is a valid feed containing published items", () => {
  assert.ok(existsSync("dist/notes/rss.xml"), "dist/notes/rss.xml must exist");
  const feed = readFileSync("dist/notes/rss.xml", "utf8");
  assert.ok(feed.includes("<rss") && feed.includes("</rss>"), "must be valid RSS XML");
  assert.ok(feed.includes("<item>"), "feed must contain items when notes exist");
});

test("main /rss.xml is unchanged and separate from /notes/rss.xml", () => {
  assert.ok(existsSync("dist/rss.xml"), "dist/rss.xml must exist");
  const blogRss = readFileSync("dist/rss.xml", "utf8");
  assert.ok(
    blogRss.includes("/posts/how-clipvault-saves-clipboard-on-android-10"),
    "blog feed contains clipvault post",
  );
  assert.ok(!blogRss.includes("/notes/"), "blog feed must not include notes");
});
