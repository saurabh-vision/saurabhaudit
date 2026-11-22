import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

function urlToDistPaths(href) {
  let pathname = href;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    pathname = new URL(href).pathname;
  }
  // Strip query and hash
  pathname = pathname.split("?")[0].split("#")[0];

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

async function getHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getHtmlFiles(fullPath)));
    } else if (entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

test("every breadcrumb href and related-content href resolves to a file in dist/", async () => {
  const htmlFiles = await getHtmlFiles("dist");

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");

    // 1. Breadcrumbs links
    const breadcrumbNavMatch = html.match(
      /<nav\b[^>]*aria-label=["']Breadcrumb["'][^>]*>([\s\S]*?)<\/nav>/i,
    );
    if (breadcrumbNavMatch) {
      const breadcrumbHtml = breadcrumbNavMatch[1];
      const linkMatches = [...breadcrumbHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
      for (const m of linkMatches) {
        const href = m[1];
        if (href.startsWith("#") || href.startsWith("mailto:")) continue;
        const candidates = urlToDistPaths(href);
        const exists = candidates.some((c) => existsSync(c));
        assert.ok(exists, `Breadcrumb link ${href} in ${file} must resolve to a file in dist/`);
      }
    }

    // 2. RelatedContent links
    const relatedSectionMatch = html.match(
      /<section\b[^>]*data-pagefind-ignore[^>]*>([\s\S]*?You might also like[\s\S]*?)<\/section>/i,
    );
    if (relatedSectionMatch) {
      const relatedHtml = relatedSectionMatch[1];
      const linkMatches = [...relatedHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
      for (const m of linkMatches) {
        const href = m[1];
        if (href.startsWith("#") || href.startsWith("mailto:")) continue;
        const candidates = urlToDistPaths(href);
        const exists = candidates.some((c) => existsSync(c));
        assert.ok(
          exists,
          `Related content link ${href} in ${file} must resolve to a file in dist/`,
        );
      }
    }
  }
});

test("visible breadcrumbs match JSON-LD BreadcrumbList names in exact order", async () => {
  const samplePages = ["dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html"];

  for (const pagePath of samplePages) {
    if (!existsSync(pagePath)) continue;
    const html = await readFile(pagePath, "utf8");

    // Extract visible breadcrumb texts
    const breadcrumbNavMatch = html.match(
      /<nav\b[^>]*aria-label=["']Breadcrumb["'][^>]*>([\s\S]*?)<\/nav>/i,
    );
    assert.ok(breadcrumbNavMatch, `Breadcrumbs nav present on ${pagePath}`);

    const breadcrumbHtml = breadcrumbNavMatch[1];
    const liMatches = [...breadcrumbHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
    const visibleNames = liMatches.map((m) => {
      // Remove html tags
      return m[1].replace(/<[^>]+>/g, "").trim();
    });

    // Extract JSON-LD BreadcrumbList
    const jsonLdRegex =
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let breadcrumbList = null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      const data = JSON.parse(match[1]);
      if (data["@graph"]) {
        const found = data["@graph"].find((node) => node["@type"] === "BreadcrumbList");
        if (found) breadcrumbList = found;
      } else if (data["@type"] === "BreadcrumbList") {
        breadcrumbList = data;
      }
    }

    assert.ok(breadcrumbList, `JSON-LD BreadcrumbList found on ${pagePath}`);
    const jsonLdNames = breadcrumbList.itemListElement.map((item) => item.name);

    assert.deepEqual(
      visibleNames,
      jsonLdNames,
      `Visible breadcrumb names must equal JSON-LD BreadcrumbList names on ${pagePath}`,
    );
  }
});
