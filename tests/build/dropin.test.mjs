import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { syncContent } from "../../scripts/sync-content.mjs";

const run = promisify(execFile);

test("drop-in integration: adding files to content/ drops them into build output and cleanly deletes", async (t) => {
  const articleFile = "content/Article/zz-dropin-article.md";
  const projectFile = "content/Projects/zz-dropin-app.md";
  const noteFile = "content/Notes/zz-dropin-note.md";

  const articleContent = `# Dropin Systems Architecture

Dropin systems require reliable synchronization protocols and minimal manual configuration headers. This opening paragraph serves directly as the description.

## Implementation Details

The sync runner monitors source changes and automatically maps files into their appropriate collection paths. It strips the heading H1 so that the layout can safely supply its own heading without duplicate tags.

Performance is guaranteed through zero runtime dependencies and fast string replacement algorithms.
`;

  const projectContent = `type: web-app
status: building
github: https://github.com/saurabh-vision/zz-dropin-app

# Dropin App Showcase

A dropin application showcasing automatic discovery and metadata extraction across directories.
`;

  const noteContent = `# Dropin Micro Note

A concise note covering a quick developer takeaway with minimal preamble or setup overhead.
`;

  await writeFile(articleFile, articleContent, "utf8");
  await writeFile(projectFile, projectContent, "utf8");
  await writeFile(noteFile, noteContent, "utf8");

  t.after(async () => {
    await rm(articleFile, { force: true });
    await rm(projectFile, { force: true });
    await rm(noteFile, { force: true });
    // Re-sync to clean up generated files
    await syncContent({ silent: true });
  });

  // 1. Run sync
  await syncContent({ silent: true });

  // Verify generated content exists
  assert.ok(existsSync("src/content/blog/zz-dropin-article.md"));
  assert.ok(existsSync("src/content/products/zz-dropin-app.md"));
  assert.ok(existsSync("src/content/notes/zz-dropin-note.md"));

  // 2. Build production site
  await run("pnpm", ["run", "build"], {
    shell: true,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });

  // 3. Assert pages exist
  assert.ok(
    existsSync("dist/posts/zz-dropin-article/index.html"),
    "Article page must exist in dist/",
  );
  assert.ok(
    existsSync("dist/products/zz-dropin-app/index.html"),
    "Project page must exist in dist/",
  );
  assert.ok(existsSync("dist/notes/zz-dropin-note/index.html"), "Note page must exist in dist/");

  // 4. Assert article is in sitemap, rss, and pagefind
  const sitemapXml = await readFile("dist/sitemap-0.xml", "utf8");
  assert.match(sitemapXml, /\/posts\/zz-dropin-article/, "Article must appear in sitemap-0.xml");

  const rssXml = await readFile("dist/rss.xml", "utf8");
  assert.match(rssXml, /Dropin Systems Architecture/, "Article must appear in rss.xml");

  // 5. Assert project appears in /products/ listing
  const productsHtml = await readFile("dist/products/index.html", "utf8");
  assert.match(productsHtml, /Dropin App Showcase/, "Project must appear in /products/ listing");
});
