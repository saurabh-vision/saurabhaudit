import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);

function readPngDimensions(buffer) {
  assert.equal(buffer.slice(0, 8).toString("hex"), "89504e470d0a1a0a", "Valid PNG magic bytes");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJsonLdScripts(html) {
  const scripts = [];
  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    scripts.push(JSON.parse(match[1]));
  }
  return scripts;
}

test("production pages have valid JSON-LD, absolute OG images, and 1200x630 dimensions", async () => {
  const pagesToTest = [
    { path: "dist/index.html", expectedTypes: ["WebSite", "Person"] },
    { path: "dist/about/index.html", expectedTypes: ["AboutPage", "Person"] },
    { path: "dist/posts/index.html", expectedTypes: ["CollectionPage"] },
    {
      path: "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
      expectedTypes: ["BlogPosting", "BreadcrumbList"],
    },
    { path: "dist/products/index.html", expectedTypes: ["CollectionPage"] },
    { path: "dist/notes/index.html", expectedTypes: ["CollectionPage"] },
  ];

  let canonicalPersonString = null;

  for (const page of pagesToTest) {
    const html = await readFile(page.path, "utf8");

    // 1. Exactly one canonical link
    const canonicalMatches = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
    assert.equal(canonicalMatches.length, 1, `Exactly one canonical link in ${page.path}`);

    // 2. Absolute og:image and twitter:image
    const ogImgMatch = html.match(
      /<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    );
    const twImgMatch = html.match(
      /<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    );
    assert.ok(ogImgMatch, `og:image present in ${page.path}`);
    assert.ok(twImgMatch, `twitter:image present in ${page.path}`);
    assert.match(ogImgMatch[1], /^https:\/\//, `og:image must be absolute URL in ${page.path}`);
    assert.match(
      twImgMatch[1],
      /^https:\/\//,
      `twitter:image must be absolute URL in ${page.path}`,
    );

    // 3. og:image:width, og:image:height, og:image:alt
    assert.match(html, /<meta\b[^>]*property=["']og:image:width["'][^>]*content=["']1200["']/i);
    assert.match(html, /<meta\b[^>]*property=["']og:image:height["'][^>]*content=["']630["']/i);
    assert.match(html, /<meta\b[^>]*property=["']og:image:alt["']/i);

    // 4. Map URL to dist/ file and check PNG dimensions
    const urlPath = new URL(ogImgMatch[1]).pathname;
    const localImagePath = `dist${urlPath}`;
    assert.ok(existsSync(localImagePath), `Image file ${localImagePath} must exist in dist`);

    const imageBuffer = await readFile(localImagePath);
    const dimensions = readPngDimensions(imageBuffer);
    assert.equal(dimensions.width, 1200, `${localImagePath} width must be 1200`);
    assert.equal(dimensions.height, 630, `${localImagePath} height must be 630`);

    // 5. JSON-LD validation
    const jsonLdBlocks = parseJsonLdScripts(html);
    if (page.expectedTypes.length === 0) {
      assert.equal(jsonLdBlocks.length, 0, `Noindex page ${page.path} must have no JSON-LD`);
    } else {
      assert.ok(jsonLdBlocks.length > 0, `Page ${page.path} must have JSON-LD`);
      const allTypes = jsonLdBlocks.flatMap((block) => {
        if (Array.isArray(block["@graph"])) {
          return block["@graph"].map((n) => n["@type"]);
        }
        return [block["@type"]];
      });

      for (const expected of page.expectedTypes) {
        assert.ok(
          allTypes.includes(expected),
          `Expected @type ${expected} in ${page.path}, got: ${JSON.stringify(allTypes)}`,
        );
      }

      // Check Person consistency
      for (const block of jsonLdBlocks) {
        const graph = Array.isArray(block["@graph"]) ? block["@graph"] : [block];
        const person = graph.find((n) => n["@type"] === "Person");
        if (person) {
          const personStr = JSON.stringify({
            name: person.name,
            url: person.url,
            sameAs: person.sameAs,
          });
          if (!canonicalPersonString) {
            canonicalPersonString = personStr;
          } else {
            assert.equal(
              personStr,
              canonicalPersonString,
              `Person node must be identical across pages (${page.path})`,
            );
          }
        }
      }
    }

    // 6. Zero steipete or peter strings (excluding open-source theme license attribution in footer)
    const stripped = html.replace(
      /<a\b[^>]*https:\/\/github\.com\/steipete\/steipete\.me[^>]*>.*?<\/a>/gis,
      "",
    );
    assert.doesNotMatch(stripped, /steipete/i, `No steipete in ${page.path}`);
    assert.doesNotMatch(stripped, /\bpeter\b/i, `No peter in ${page.path}`);
  }
});

test("product detail and note detail receive valid JSON-LD and 1200x630 OG images", async (t) => {
  const productFixture = "src/content/products/fixture-product.md";
  const noteFixture = "src/content/notes/fixture-note.md";
  const outDir = "dist-seo-fixture";

  const productContent = `---
title: "Fixture Product"
description: "A fast open source tool for developer workflow automation."
pubDatetime: 2026-01-01T00:00:00Z
type: "open-source"
status: "live"
links:
  githubUrl: "https://github.com/saurabh/fixture"
---

Detailed description of the fixture product.
`;

  const noteContent = `---
title: "Fixture Note Title"
description: "A quick technical discovery about SQLite WAL mode and concurrency."
pubDatetime: 2026-01-01T00:00:00Z
tags:
  - "sqlite"
---

Detailed note content discussing database configurations, SQLite write-ahead logging concurrency modes, read-uncommitted isolation levels, and performance implications across high-throughput background worker pipelines. By default, SQLite serializes writers, but with WAL mode enabled, multiple readers can execute concurrently alongside a single dedicated writer process without blocking or acquiring exclusive table-level locks. This architecture significantly improves read throughput for analytical queries while background mutations continue undisturbed.
`;

  await writeFile(productFixture, productContent);
  await writeFile(noteFixture, noteContent);

  t.after(async () => {
    await rm(productFixture, { force: true });
    await rm(noteFixture, { force: true });
    await rm(outDir, { recursive: true, force: true });
  });

  await run("pnpm", ["exec", "astro", "build", "--outDir", outDir], {
    shell: true,
    env: { ...process.env, PATH: process.env.PATH, ASTRO_TELEMETRY_DISABLED: "1" },
  });

  // Verify Product Detail
  const productHtml = await readFile(`${outDir}/products/fixture-product/index.html`, "utf8");
  const productBlocks = parseJsonLdScripts(productHtml);
  assert.ok(productBlocks.length > 0);
  const productGraph = productBlocks[0]["@graph"];
  const app = productGraph.find((n) => n["@type"] === "SoftwareApplication");
  assert.ok(app);
  assert.equal(app.name, "Fixture Product");
  assert.equal(app.applicationCategory, "DeveloperApplication");
  assert.equal(app.operatingSystem, "Cross-platform");
  assert.equal(app.offers, undefined);
  assert.equal(app.price, undefined);

  // Verify Product OG image
  const productOg = await readFile(`${outDir}/products/fixture-product/index.png`);
  const productDims = readPngDimensions(productOg);
  assert.equal(productDims.width, 1200);
  assert.equal(productDims.height, 630);

  // Verify Note Detail
  const noteHtml = await readFile(`${outDir}/notes/fixture-note/index.html`, "utf8");
  const noteBlocks = parseJsonLdScripts(noteHtml);
  assert.ok(noteBlocks.length > 0);
  const noteGraph = noteBlocks[0]["@graph"];
  const notePosting = noteGraph.find((n) => n["@type"] === "BlogPosting");
  assert.ok(notePosting);
  assert.equal(notePosting.headline, "Fixture Note Title");

  // Verify Note OG image
  const noteOg = await readFile(`${outDir}/notes/fixture-note/index.png`);
  const noteDims = readPngDimensions(noteOg);
  assert.equal(noteDims.width, 1200);
  assert.equal(noteDims.height, 630);
});
