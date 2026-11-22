import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import test from "node:test";

test("rendered blog post contains Substack newsletter iframe and fallbacks", async () => {
  const postHtml = await readFile(
    "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
    "utf8",
  );

  // 1. data-pagefind-ignore attribute on container
  assert.match(
    postHtml,
    /<aside\b[^>]*\bdata-pagefind-ignore\b/i,
    "Newsletter component must include data-pagefind-ignore",
  );

  // 2. iframe with correct embed src, loading="lazy", non-empty title
  const iframeMatch = postHtml.match(/<iframe\b([^>]*)\/?>/i);
  assert.ok(iframeMatch, "Post page must contain an iframe for Substack embed");

  const iframeAttrs = iframeMatch[1];
  assert.match(
    iframeAttrs,
    /src=["']https:\/\/howsystemsscale\.substack\.com\/embed["']/i,
    "iframe src must point to <SUBSTACK_URL>/embed",
  );
  assert.match(iframeAttrs, /loading=["']lazy["']/i, "iframe must have loading='lazy'");
  assert.match(
    iframeAttrs,
    /title=["']Subscribe to [^"']+["']/i,
    "iframe must have a non-empty descriptive title",
  );

  // 3. Fallback link to SUBSTACK_URL with target="_blank" and rel="noopener"
  assert.match(
    postHtml,
    /<a\b[^>]*\bhref=["']https:\/\/howsystemsscale\.substack\.com["'][^>]*\btarget=["']_blank["'][^>]*\brel=["']noopener["'][^>]*>/i,
    "Must include fallback link to SUBSTACK_URL with target='_blank' and rel='noopener'",
  );

  // 4. Fallback link text contains "Prefer to subscribe on Substack?"
  assert.match(
    postHtml,
    /Prefer to subscribe on Substack\?/,
    "Must include 'Prefer to subscribe on Substack?' copy",
  );

  // 5. Assert NO buttondown string anywhere in src/ or dist/
  for await (const file of glob("{src,dist}/**/*.{astro,ts,js,mjs,json,xml,txt,html,md,mdx}")) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(
      content,
      /buttondown/i,
      `File ${file} must not contain any reference to 'buttondown'`,
    );
  }
});
