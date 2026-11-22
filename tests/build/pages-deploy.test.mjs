import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

test("production build has proper GitHub Pages deployment artifacts and security headers", async () => {
  // 1. CNAME artifact
  const cname = (await readFile("dist/CNAME", "utf8")).trim();
  assert.equal(
    cname,
    "saurabhaudit.com",
    "dist/CNAME must specify canonical domain saurabhaudit.com",
  );

  // 2. 404 page exists for GitHub Pages client-side fallback
  const notFoundHtml = await readFile("dist/404.html", "utf8");
  assert.ok(notFoundHtml.length > 0, "dist/404.html must exist and have content");

  // 3. Index HTML contains exactly one meta CSP tag and referrer meta
  const indexHtml = await readFile("dist/index.html", "utf8");
  const cspMatches = [
    ...indexHtml.matchAll(/<meta\b[^>]*\bhttp-equiv=["']Content-Security-Policy["'][^>]*>/gi),
  ];
  assert.equal(cspMatches.length, 1, "dist/index.html must have exactly one meta CSP tag");

  assert.match(
    indexHtml,
    /<meta\b[^>]*\bname=["']referrer["'][^>]*\bcontent=["']strict-origin-when-cross-origin["']/i,
    "dist/index.html must have referrer policy meta tag",
  );

  // 4. Content license link
  assert.match(
    indexHtml,
    /<link\b[^>]*\brel=["']license["'][^>]*\bhref=["']https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/["']/i,
    "dist/index.html must have CC BY 4.0 license link",
  );

  // 5. GitHub Actions workflow verification
  const workflowYaml = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.match(workflowYaml, /actions\/checkout@v4/);
  assert.match(workflowYaml, /actions\/setup-node@v4/);
  assert.match(workflowYaml, /actions\/configure-pages@v5/);
  assert.match(workflowYaml, /actions\/upload-pages-artifact@v3/);
  assert.match(workflowYaml, /actions\/deploy-pages@v4/);
  assert.match(workflowYaml, /pages:\s*write/);
  assert.match(workflowYaml, /id-token:\s*write/);

  // 6. No Vercel references in dist build output
  async function scanDirForVercel(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirForVercel(fullPath);
      } else if (entry.name.endsWith(".html") || entry.name.endsWith(".js")) {
        const content = await readFile(fullPath, "utf8");
        assert.doesNotMatch(
          content,
          /\bvercel\b/i,
          `Found unexpected 'vercel' reference in ${fullPath}`,
        );
      }
    }
  }

  await scanDirForVercel("dist");
});
