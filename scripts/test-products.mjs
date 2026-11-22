import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const FIXTURE_LIVE_PATH = "src/content/products/fixture-extension.md";
const FIXTURE_BUILDING_PATH = "src/content/products/fixture-building.md";

const FIXTURE_LIVE_CONTENT = `---
title: "Fixture Extension"
description: "A test chrome extension fixture for automated verification."
type: "chrome-extension"
status: "live"
featured: true
pubDatetime: 2026-01-01T00:00:00Z
links:
  chromeWebStoreUrl: "https://chromewebstore.google.com/detail/example"
  websiteUrl: "https://example.com"
tags:
  - "productivity"
  - "tools"
---
Detailed description of fixture extension in markdown body.
`;

const FIXTURE_BUILDING_CONTENT = `---
title: "Fixture Building App"
description: "A test building app fixture for automated verification."
type: "web-app"
status: "building"
pubDatetime: 2026-01-01T00:00:00Z
---
`;

function countH1(html) {
  const matches = html.match(/<h1\b[^>]*>/gi);
  return matches ? matches.length : 0;
}

function getScripts(html) {
  const matches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  return matches.map((m) => {
    const srcMatch = m[1].match(/src=["']([^"']+)["']/i);
    return srcMatch ? srcMatch[1] : m[2].trim();
  });
}

function runBuild() {
  const env = {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
  };
  if (existsSync("C:\\Users\\Dell\\AppData\\Roaming\\npm\\node_modules\\node\\bin")) {
    env.PATH = `C:\\Users\\Dell\\AppData\\Roaming\\npm\\node_modules\\node\\bin;${env.PATH}`;
  }
  execSync("pnpm run build", { stdio: "inherit", env });
}

const tempBackupDir = "temp_products_backup";
const realProducts = [];

try {
  // Isolate real products during fixture & empty test suite
  if (!existsSync(tempBackupDir)) mkdirSync(tempBackupDir);
  const existingFiles = readdirSync("src/content/products");
  for (const file of existingFiles) {
    if (file.endsWith(".md") && file !== "_template.md") {
      copyFileSync(join("src/content/products", file), join(tempBackupDir, file));
      rmSync(join("src/content/products", file));
      realProducts.push(file);
    }
  }

  console.log("=== STEP 1: Creating product fixtures ===");
  writeFileSync(FIXTURE_LIVE_PATH, FIXTURE_LIVE_CONTENT, "utf8");
  writeFileSync(FIXTURE_BUILDING_PATH, FIXTURE_BUILDING_CONTENT, "utf8");

  try {
    console.log("=== STEP 2: Running build with fixtures ===");
    runBuild();

    console.log("=== STEP 3: Verifying artifacts with fixtures ===");
    const productsHtml = readFileSync("dist/products/index.html", "utf8");
    const liveHtml = readFileSync("dist/products/fixture-extension/index.html", "utf8");
    const buildingHtml = readFileSync("dist/products/fixture-building/index.html", "utf8");
    const homeHtml = readFileSync("dist/index.html", "utf8");
    const sitemapXml = readFileSync("dist/sitemap-0.xml", "utf8");
    const postHtml = readFileSync(
      "dist/posts/how-clipvault-saves-clipboard-on-android-10/index.html",
      "utf8",
    );

    // Listing assertions
    assert.ok(productsHtml.includes("Fixture Extension"), "Listing must include live fixture");
    assert.ok(
      productsHtml.includes("Fixture Building App"),
      "Listing must include building fixture",
    );
    assert.equal(countH1(productsHtml), 1, "Listing must have exactly one <h1>");
    assert.ok(
      productsHtml.includes("data-pagefind-ignore"),
      "Listing must have data-pagefind-ignore",
    );

    // Live product detail assertions
    assert.equal(countH1(liveHtml), 1, "Live detail must have exactly one <h1>");
    assert.ok(
      !liveHtml.includes('name="robots" content="noindex'),
      "Live detail must NOT have noindex",
    );
    assert.ok(
      liveHtml.includes('href="https://chromewebstore.google.com/detail/example"'),
      "Store button href",
    );
    assert.ok(liveHtml.includes('target="_blank"'), "Store button target");
    assert.ok(liveHtml.includes('rel="noopener"'), "Store button rel");
    assert.ok(
      liveHtml.includes("Detailed description of fixture extension"),
      "Live detail includes body prose",
    );

    // Building product detail assertions (thin-page guard)
    assert.equal(countH1(buildingHtml), 1, "Building detail must have exactly one <h1>");
    assert.ok(
      buildingHtml.includes('name="robots" content="noindex, follow"'),
      "Building detail without body must have noindex, follow",
    );

    // Sitemap assertions
    assert.ok(
      sitemapXml.includes("/products/fixture-extension"),
      "Sitemap must include live product detail URL",
    );
    assert.ok(
      !sitemapXml.includes("/products/fixture-building"),
      "Sitemap must exclude thin building product detail URL",
    );

    // Navigation & Homepage assertions
    assert.ok(
      homeHtml.includes('href="/products"'),
      "Header must include Products nav link when products exist",
    );
    assert.ok(
      homeHtml.includes("Featured products"),
      "Homepage must show Featured products section",
    );
    assert.ok(homeHtml.includes("Fixture Extension"), "Homepage must show featured fixture card");

    // Script tags comparison
    const blogScripts = getScripts(postHtml);
    const productsScripts = getScripts(productsHtml);
    const detailScripts = getScripts(liveHtml);

    // Assert no unexpected new scripts
    for (const script of productsScripts) {
      assert.ok(
        blogScripts.includes(script) || script.includes("astro") || script.includes("schema.org"),
        `Unexpected new script on /products/: ${script}`,
      );
    }
    for (const script of detailScripts) {
      assert.ok(
        blogScripts.includes(script) || script.includes("astro") || script.includes("schema.org"),
        `Unexpected new script on detail page: ${script}`,
      );
    }

    console.log("All fixture assertions passed!");
  } finally {
    console.log("=== STEP 4: Cleaning up fixtures ===");
    if (existsSync(FIXTURE_LIVE_PATH)) rmSync(FIXTURE_LIVE_PATH);
    if (existsSync(FIXTURE_BUILDING_PATH)) rmSync(FIXTURE_BUILDING_PATH);
  }

  console.log("=== STEP 5: Running clean build without products (empty state check) ===");
  runBuild();

  console.log("=== STEP 6: Verifying clean build empty state ===");
  const cleanProductsHtml = readFileSync("dist/products/index.html", "utf8");
  const cleanHomeHtml = readFileSync("dist/index.html", "utf8");
  const cleanSitemapXml = readFileSync("dist/sitemap-0.xml", "utf8");

  assert.equal(countH1(cleanProductsHtml), 1, "Clean /products/ must have exactly one <h1>");
  assert.ok(
    cleanProductsHtml.includes('name="robots" content="noindex, follow"'),
    "Clean /products/ must have noindex, follow when empty",
  );
  assert.ok(
    cleanProductsHtml.includes("New products are on the way."),
    "Clean /products/ must show empty state text",
  );
  assert.ok(
    !cleanSitemapXml.includes("/products"),
    "Clean sitemap must not include /products when empty",
  );
  assert.ok(
    !cleanHomeHtml.includes('href="/products" class="active-nav"') &&
      !cleanHomeHtml.includes(
        'id="menu-items">\n          <li class="col-span-2">\n            <a href="/products"',
      ),
    "Clean Header must not contain Products link",
  );
  assert.ok(
    !cleanHomeHtml.includes("Featured products"),
    "Clean homepage must not contain Featured products section",
  );

  console.log("All clean assertions passed!");
} finally {
  console.log("=== Restoring real products ===");
  for (const file of realProducts) {
    copyFileSync(join(tempBackupDir, file), join("src/content/products", file));
  }
  if (existsSync(tempBackupDir)) {
    rmSync(tempBackupDir, { recursive: true, force: true });
  }
  runBuild();
}
