import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE } from "../../src/config.ts";

test("static markdown endpoints exist and are discovered via alternate link tags", async () => {
  const pagesToTest = [
    {
      htmlPath: "dist/index.html",
      mdPath: "dist/index.md",
      expectedHref: "/index.md",
    },
    {
      htmlPath: "dist/about/index.html",
      mdPath: "dist/about.md",
      expectedHref: "/about.md",
    },
    {
      htmlPath: "dist/posts/index.html",
      mdPath: "dist/posts.md",
      expectedHref: "/posts.md",
    },
    ...(SITE.showArchives
      ? [
          {
            htmlPath: "dist/archives/index.html",
            mdPath: "dist/archives.md",
            expectedHref: "/archives.md",
          },
        ]
      : []),
    {
      htmlPath: "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
      mdPath: "dist/posts/how-clipvault-saves-clipboard-on-android-10.md",
      expectedHref: "/posts/how-clipvault-saves-clipboard-on-android-10.md",
    },
  ];

  for (const page of pagesToTest) {
    // 1. Static markdown file exists and has content
    const mdContent = await readFile(page.mdPath, "utf8");
    assert.ok(mdContent.length > 0, `${page.mdPath} must exist and have content`);

    // 2. HTML page contains alternate markdown link tag
    const htmlContent = await readFile(page.htmlPath, "utf8");
    const linkRegex = new RegExp(
      `<link\\b[^>]*\\brel=["']alternate["'][^>]*\\btype=["']text/markdown["'][^>]*\\bhref=["']${page.expectedHref}["']`,
      "i",
    );
    assert.match(
      htmlContent,
      linkRegex,
      `${page.htmlPath} must have alternate markdown link to ${page.expectedHref}`,
    );
  }
});
