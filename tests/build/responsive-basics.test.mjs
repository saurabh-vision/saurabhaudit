import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function getFilesRecursively(dir, extension = ".html") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(fullPath, extension)));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

test("responsive basics: HTML pages have valid viewport meta tags", async () => {
  const htmlFiles = await getFilesRecursively("dist", ".html");
  assert.ok(htmlFiles.length > 0, "dist must contain HTML files");

  for (const file of htmlFiles) {
    const content = await readFile(file, "utf8");
    if (content.includes('http-equiv="refresh"')) {
      continue;
    }
    const hasViewport =
      /<meta\b[^>]*\bname=["']viewport["'][^>]*content=["'][^"']*width=device-width[^"']*["']/i.test(
        content,
      );
    assert.ok(hasViewport, `${file} must include a responsive viewport meta tag`);
  }
});

test("responsive basics: no fixed inline widths > 320px without max-width", async () => {
  const htmlFiles = await getFilesRecursively("dist", ".html");

  for (const file of htmlFiles) {
    const content = await readFile(file, "utf8");
    // Match inline style widths like width: 400px, width: 600px (excluding if max-width is set)
    const styleMatches = content.matchAll(/style=["']([^"']*)["']/gi);
    for (const match of styleMatches) {
      const style = match[1];
      const widthMatch = style.match(/\bwidth:\s*([0-9]+)px/i);
      if (widthMatch) {
        const px = parseInt(widthMatch[1], 10);
        if (px > 320) {
          const hasResponsiveConstraint =
            style.includes("max-width") ||
            style.includes("100%") ||
            match.input.includes("max-w-") ||
            match.input.includes("<iframe");
          assert.ok(
            hasResponsiveConstraint,
            `Fixed inline width of ${px}px in ${file} must have a responsive constraint`,
          );
        }
      }
    }
  }
});

test("responsive basics: compiled CSS contains media queries, fluid clamps, and theme schemes", async () => {
  const astroDir = join("dist", "_astro");
  const cssFiles = await getFilesRecursively(astroDir, ".css");
  assert.ok(cssFiles.length > 0, "dist/_astro must contain compiled CSS files");

  let combinedCss = "";
  for (const file of cssFiles) {
    combinedCss += (await readFile(file, "utf8")) + "\n";
  }

  // 1. Media queries present
  assert.ok(
    combinedCss.includes("@media") || combinedCss.includes("(min-width:"),
    "Compiled CSS must contain responsive media queries",
  );

  // 2. Fluid clamp present
  assert.ok(combinedCss.includes("clamp("), "Compiled CSS must contain fluid clamp typography");

  // 3. Pre & Table horizontal overflow handling
  assert.ok(
    combinedCss.includes("overflow-x:auto") ||
      combinedCss.includes("overflow-x: scroll") ||
      /overflow(-x)?:\s*auto/.test(combinedCss),
    "Compiled CSS must include overflow-x handling for code/tables",
  );

  // 4. Light and Dark color schemes/themes
  assert.ok(
    combinedCss.includes("data-theme=dark") ||
      combinedCss.includes("color-scheme:dark") ||
      combinedCss.includes("color-scheme: dark"),
    "Compiled CSS must include dark mode styling",
  );
  assert.ok(
    combinedCss.includes("data-theme=light") ||
      combinedCss.includes("color-scheme:light") ||
      combinedCss.includes("color-scheme: light") ||
      combinedCss.includes(":root"),
    "Compiled CSS must include light mode styling",
  );
});

test("responsive basics: skip-to-content and navigation accessibility", async () => {
  const indexHtml = await readFile("dist/index.html", "utf8");

  // Skip to content link
  assert.ok(
    indexHtml.includes('href="#main-content"') || indexHtml.includes('id="skip-to-content"'),
    "Homepage must include a skip to content link",
  );

  // Navigation landmark
  assert.ok(
    indexHtml.includes('aria-label="Main Navigation"') || indexHtml.includes('aria-label="Main"'),
    "Header must include an accessible navigation landmark",
  );
});
