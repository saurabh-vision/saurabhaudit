import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Pagefind build directory exists and contains client scripts", async () => {
  assert.equal(existsSync("dist/pagefind"), true, "dist/pagefind directory exists");
  assert.equal(existsSync("dist/pagefind/pagefind.js"), true, "pagefind.js exists");
});

test("built pages have correct data-pagefind attributes on indexable vs non-indexable content", async () => {
  // 1. Published post: must have data-pagefind-body, type:Article, title meta
  const postHtml = await readFile(
    "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
    "utf8",
  );
  assert.match(
    postHtml,
    /<main\b[^>]*\bdata-pagefind-body\b/i,
    "Post main must have data-pagefind-body",
  );
  assert.match(
    postHtml,
    /data-pagefind-filter=["']type:Article["']/i,
    "Post must have type:Article filter",
  );
  assert.match(
    postHtml,
    /data-pagefind-meta=["']type:Article["']/i,
    "Post must have type:Article meta",
  );
  assert.match(
    postHtml,
    /<h1\b[^>]*\bdata-pagefind-meta=["']title["']/i,
    "Post h1 must have title meta",
  );

  // Breadcrumbs, header, footer, share links, newsletter must have data-pagefind-ignore
  assert.match(postHtml, /<header\b[^>]*\bdata-pagefind-ignore\b/i, "Header must be ignored");
  assert.match(postHtml, /<footer\b[^>]*\bdata-pagefind-ignore\b/i, "Footer must be ignored");
  assert.match(
    postHtml,
    /<nav\b[^>]*aria-label=["']Breadcrumb["'][^>]*\bdata-pagefind-ignore\b/i,
    "Breadcrumb must be ignored",
  );
  assert.match(
    postHtml,
    /<aside\b[^>]*\bdata-pagefind-ignore\b/i,
    "Newsletter form must be ignored",
  );

  // 2. Non-indexable utility & listing pages: must have data-pagefind-ignore and NOT data-pagefind-body
  const ignoredPages = [
    "dist/index.html",
    "dist/about/index.html",
    "dist/posts/index.html",
    "dist/search/index.html",
    "dist/tags/index.html",
  ];

  for (const pagePath of ignoredPages) {
    if (!existsSync(pagePath)) continue;
    const html = await readFile(pagePath, "utf8");
    assert.equal(
      /<main\b[^>]*\bdata-pagefind-body\b/i.test(html),
      false,
      `${pagePath} must NOT have data-pagefind-body`,
    );
    assert.match(
      html,
      /<main\b[^>]*\bdata-pagefind-ignore\b/i,
      `${pagePath} must have data-pagefind-ignore on main`,
    );
  }
});

test("product and note detail templates properly configure data-pagefind attributes", async () => {
  const productTemplate = await readFile("src/pages/products/[slug].astro", "utf8");
  assert.match(
    productTemplate,
    /data-pagefind-body=\{!isThinPage\s*\?\s*""\s*:\s*undefined\}/,
    "Product template must conditionally set data-pagefind-body when not thin",
  );
  assert.match(
    productTemplate,
    /data-pagefind-ignore=\{isThinPage\s*\?\s*""\s*:\s*undefined\}/,
    "Product template must set data-pagefind-ignore when thin",
  );
  assert.match(
    productTemplate,
    /data-pagefind-filter=\{!isThinPage\s*\?\s*"type:Product"\s*:\s*undefined\}/,
    "Product template must set type:Product filter",
  );
  assert.match(
    productTemplate,
    /data-pagefind-meta=\{!isThinPage\s*\?\s*"type:Product"\s*:\s*undefined\}/,
    "Product template must set type:Product meta",
  );
  assert.match(
    productTemplate,
    /data-pagefind-meta="title"/,
    "Product template must set title meta on h1",
  );

  const noteTemplate = await readFile("src/pages/notes/[slug].astro", "utf8");
  assert.match(
    noteTemplate,
    /data-pagefind-body=\{!isThinOrUnlisted\s*\?\s*""\s*:\s*undefined\}/,
    "Note template must conditionally set data-pagefind-body when not thin or unlisted",
  );
  assert.match(
    noteTemplate,
    /data-pagefind-ignore=\{isThinOrUnlisted\s*\?\s*""\s*:\s*undefined\}/,
    "Note template must set data-pagefind-ignore when thin or unlisted",
  );
  assert.match(
    noteTemplate,
    /data-pagefind-filter=\{!isThinOrUnlisted\s*\?\s*"type:Note"\s*:\s*undefined\}/,
    "Note template must set type:Note filter",
  );
  assert.match(
    noteTemplate,
    /data-pagefind-meta=\{!isThinOrUnlisted\s*\?\s*"type:Note"\s*:\s*undefined\}/,
    "Note template must set type:Note meta",
  );
  assert.match(
    noteTemplate,
    /data-pagefind-meta="title"/,
    "Note template must set title meta on h1",
  );

  // Listing templates must have data-pagefind-ignore on main
  const productList = await readFile("src/pages/products/index.astro", "utf8");
  assert.match(productList, /<main\b[^>]*\bdata-pagefind-ignore\b/i);

  const noteList = await readFile("src/pages/notes/[...page].astro", "utf8");
  assert.match(noteList, /<main\b[^>]*\bdata-pagefind-ignore\b/i);
});
