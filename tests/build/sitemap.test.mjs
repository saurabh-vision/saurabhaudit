import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

function urlToDistPaths(urlStr) {
  const parsed = new URL(urlStr, "https://saurabhaudit.com");
  let pathname = parsed.pathname;
  if (pathname === "/" || pathname === "") {
    return [path.join("dist", "index.html")];
  }
  const clean = pathname.replace(/^\/|\/$/g, "");
  return [
    path.join("dist", clean, "index.html"),
    path.join("dist", `${clean}.html`),
    path.join("dist", clean),
  ];
}

test("sitemap-index.xml and sitemap-0.xml contain only indexable pages with accurate lastmod", async () => {
  assert.equal(existsSync("dist/sitemap-index.xml"), true, "sitemap-index.xml exists");
  assert.equal(existsSync("dist/sitemap-0.xml"), true, "sitemap-0.xml exists");

  const sitemapXml = await readFile("dist/sitemap-0.xml", "utf8");
  const urlBlocks = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].map((m) => m[1]);

  assert.ok(urlBlocks.length > 0, "sitemap-0.xml contains at least one <url> block");

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/i);
    assert.ok(locMatch, "Each block must have <loc>");
    const loc = locMatch[1].trim();

    // Must be absolute canonical URL
    assert.ok(loc.startsWith("https://saurabhaudit.com"), `loc must use canonical origin: ${loc}`);

    // Must resolve to an actual file in dist/
    const candidatePaths = urlToDistPaths(loc);
    const resolvedPath = candidatePaths.find((p) => existsSync(p));
    assert.ok(resolvedPath, `Sitemap URL ${loc} must resolve to built file in dist/`);

    // Verify resolved HTML does not have noindex
    const html = await readFile(resolvedPath, "utf8");
    const hasNoIndexMeta =
      /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
      /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html);
    assert.equal(hasNoIndexMeta, false, `Sitemap must not contain noindex page: ${loc}`);

    // Check lastmod
    const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/i);
    const pathname = new URL(loc).pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/about" || pathname === "/search") {
      assert.equal(lastmodMatch, null, `URL ${loc} should not have lastmod`);
    } else if (lastmodMatch) {
      const lastmod = lastmodMatch[1].trim();
      assert.match(
        lastmod,
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/,
        `Invalid lastmod format for ${loc}: ${lastmod}`,
      );
    }
  }
});
