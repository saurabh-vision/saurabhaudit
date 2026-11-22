import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("robots.txt is correctly formed and references canonical sitemap", async () => {
  const robotsTxt = await readFile("dist/robots.txt", "utf8");

  // User-agent: * and Allow: /
  assert.match(robotsTxt, /User-agent:\s*\*/i);
  assert.match(robotsTxt, /Allow:\s*\//i);

  // Absolute Sitemap URL
  assert.match(robotsTxt, /Sitemap:\s*https:\/\/saurabhaudit\.com\/sitemap-index\.xml/i);

  // Absence of legacy or placeholder host strings
  assert.equal(/steipete/i.test(robotsTxt), false, "No steipete references in robots.txt");
  assert.equal(/localhost/i.test(robotsTxt), false, "No localhost references in robots.txt");
  assert.equal(/vercel\.app/i.test(robotsTxt), false, "No vercel.app references in robots.txt");
  assert.equal(/example\.com/i.test(robotsTxt), false, "No example.com references in robots.txt");
});
