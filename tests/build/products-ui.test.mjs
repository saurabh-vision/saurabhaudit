import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("with real products: /products/ is indexable and lists ClipVault", () => {
  assert.ok(existsSync("dist/products/index.html"), "dist/products/index.html must exist");
  const html = readFileSync("dist/products/index.html", "utf8");

  assert.ok(
    !html.includes('name="robots" content="noindex'),
    "real /products/ must be indexable when products exist",
  );
  assert.ok(html.includes("ClipVault"), "real /products/ must list ClipVault");

  const h1Count = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
  assert.equal(h1Count, 1, "exactly one <h1> on /products/");
});

test("with real products: sitemap includes /products and /products/clipvault", () => {
  assert.ok(existsSync("dist/sitemap-0.xml"), "dist/sitemap-0.xml must exist");
  const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
  assert.ok(sitemap.includes("/products"), "sitemap must include /products");
  assert.ok(sitemap.includes("/products/clipvault"), "sitemap must include /products/clipvault");
});

test("with real products: Header and homepage include Products and Featured section", () => {
  assert.ok(existsSync("dist/index.html"), "dist/index.html must exist");
  const html = readFileSync("dist/index.html", "utf8");

  // Nav menu links to /products
  const menuMatch = html.match(/<ul\s+id="menu-items"[\s\S]*?<\/ul>/i);
  if (menuMatch) {
    assert.ok(
      menuMatch[0].includes('href="/products"'),
      "nav menu must contain /products link when products exist",
    );
  }
  assert.ok(
    html.includes("Featured products"),
    "homepage must show Featured products section when products exist",
  );
  assert.ok(html.includes("ClipVault"), "homepage must show ClipVault");
});

test("page script tags do not add new client JS vs blog post", () => {
  const postHtml = readFileSync(
    "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
    "utf8",
  );
  const productsHtml = readFileSync("dist/products/index.html", "utf8");

  const getScripts = (str) => {
    return [...str.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => {
      const src = m[1].match(/src=["']([^"']+)["']/i);
      return src ? src[1] : m[2].trim();
    });
  };

  const postScripts = getScripts(postHtml);
  const productsScripts = getScripts(productsHtml);

  for (const s of productsScripts) {
    assert.ok(
      postScripts.includes(s) || s.includes("astro") || s.includes("schema.org"),
      `Unexpected new script found on /products/: ${s}`,
    );
  }
});
