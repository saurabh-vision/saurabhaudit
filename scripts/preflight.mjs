#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export function checkDomainAndCname(siteConfig, rootDir = ".") {
  const website = (siteConfig?.website || "").trim();
  const isHttpsNonWww = /^https:\/\/(?!www\.)[a-z0-9.-]+(?:\/.*)?$/i.test(website);
  if (!isHttpsNonWww) {
    return {
      status: "BLOCKER",
      detail: `SITE.website must be https and non-www (got '${website}')`,
      fix: "Set SITE.website in src/config.ts to https://saurabhaudit.com/",
    };
  }

  const host = new URL(website).hostname;
  const cnamePath = join(rootDir, "public", "CNAME");
  if (!existsSync(cnamePath)) {
    return {
      status: "BLOCKER",
      detail: "public/CNAME does not exist",
      fix: "Create public/CNAME containing the canonical domain",
    };
  }

  const cnameContent = readFileSync(cnamePath, "utf8").trim();
  if (cnameContent !== host) {
    return {
      status: "BLOCKER",
      detail: `public/CNAME ('${cnameContent}') does not match SITE.website host ('${host}')`,
      fix: `Update public/CNAME to '${host}'`,
    };
  }

  const distCname = join(rootDir, "dist", "CNAME");
  if (!existsSync(distCname)) {
    return {
      status: "BLOCKER",
      detail: "dist/CNAME does not exist in build output",
      fix: "Ensure build copies public/CNAME into dist/CNAME",
    };
  }

  return { status: "PASS", detail: `Canonical host: ${host}` };
}

export function checkRequiredDistFiles(distDir = "dist") {
  const required = [
    { file: "404.html", name: "404 page" },
    { file: "robots.txt", name: "Robots configuration" },
    { file: "sitemap-index.xml", name: "Sitemap index" },
    { file: "rss.xml", name: "RSS feed" },
    { file: "og-default.png", name: "Default social image" },
    { file: "favicon.svg", name: "Favicon SVG" },
  ];

  const missing = [];
  for (const item of required) {
    if (!existsSync(join(distDir, item.file))) {
      missing.push(item.file);
    }
  }

  const hasPagefind =
    existsSync(join(distDir, "pagefind", "pagefind.js")) ||
    existsSync(join(distDir, "pagefind", "pagefind-entry.json")) ||
    (existsSync(join(distDir, "pagefind")) && readdirSync(join(distDir, "pagefind")).length > 0);

  if (!hasPagefind) {
    missing.push("pagefind/pagefind.js");
  }

  if (missing.length > 0) {
    return {
      status: "BLOCKER",
      detail: `Missing required build artifacts: ${missing.join(", ")}`,
      fix: "Run 'pnpm run build' to generate all required output artifacts",
    };
  }

  const robotsPath = join(distDir, "robots.txt");
  const robotsText = readFileSync(robotsPath, "utf8");
  if (!robotsText.includes("Allow:") || !/Sitemap:\s*https:\/\//i.test(robotsText)) {
    return {
      status: "BLOCKER",
      detail: "dist/robots.txt must contain 'Allow:' and an absolute https 'Sitemap:' URL",
      fix: "Update src/pages/robots.txt.ts to output Allow directives and absolute sitemap URL",
    };
  }

  return { status: "PASS", detail: "All required dist files and Pagefind index exist" };
}

export function checkSitemapsAndContent(distDir = "dist", canonicalHost = "saurabhaudit.com") {
  const sitemapIndexPath = join(distDir, "sitemap-index.xml");
  if (!existsSync(sitemapIndexPath)) {
    return {
      status: "BLOCKER",
      detail: "sitemap-index.xml not found",
      fix: "Run build to generate sitemap",
    };
  }

  const sitemapXml = readFileSync(sitemapIndexPath, "utf8");
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const allPageUrls = [];
  for (const loc of locs) {
    if (loc.endsWith(".xml")) {
      const subPath = join(distDir, new URL(loc).pathname.replace(/^\//, ""));
      if (existsSync(subPath)) {
        const subXml = readFileSync(subPath, "utf8");
        const subLocs = [...subXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        allPageUrls.push(...subLocs);
      }
    } else {
      allPageUrls.push(loc);
    }
  }

  for (const pageUrl of allPageUrls) {
    try {
      const parsed = new URL(pageUrl);
      if (parsed.protocol !== "https:") {
        return {
          status: "BLOCKER",
          detail: `Sitemap URL is not https: ${pageUrl}`,
          fix: "Ensure all sitemap entries use https protocol",
        };
      }
      if (parsed.hostname !== canonicalHost) {
        return {
          status: "BLOCKER",
          detail: `Sitemap URL host '${parsed.hostname}' does not match '${canonicalHost}'`,
          fix: "Ensure all sitemap entries use the canonical host",
        };
      }

      const relPath = parsed.pathname.replace(/^\/|\/$/g, "");
      const htmlCandidates = [
        join(distDir, relPath, "index.html"),
        join(distDir, `${relPath}.html`),
      ];
      const targetHtmlPath = htmlCandidates.find((c) => existsSync(c));
      if (!targetHtmlPath && relPath !== "") {
        return {
          status: "BLOCKER",
          detail: `Sitemap URL does not map to a built page: ${pageUrl}`,
          fix: "Remove unbuilt routes from sitemap",
        };
      }
      if (targetHtmlPath) {
        const html = readFileSync(targetHtmlPath, "utf8");
        if (/<meta\b[^>]*\bname=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
          return {
            status: "BLOCKER",
            detail: `Sitemap contains page with noindex: ${pageUrl}`,
            fix: "Exclude noindex pages from sitemap in src/utils/sitemap.ts",
          };
        }
      }
    } catch (e) {
      return {
        status: "BLOCKER",
        detail: `Invalid sitemap URL '${pageUrl}': ${e.message}`,
        fix: "Fix malformed URL in sitemap",
      };
    }
  }

  return { status: "PASS", detail: `Validated ${allPageUrls.length} sitemap URLs` };
}

export function checkDistHygiene(distDir = "dist") {
  function getHtmlFiles(dir) {
    if (!existsSync(dir)) return [];
    const entries = readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        files.push(...getHtmlFiles(full));
      } else if (e.isFile() && e.name.endsWith(".html")) {
        files.push(full);
      }
    }
    return files;
  }

  const htmlFiles = getHtmlFiles(distDir);
  for (const file of htmlFiles) {
    const content = readFileSync(file, "utf8");
    if (/\b(?:TODO|FACT NEEDED|lorem ipsum)\b/i.test(content)) {
      return {
        status: "BLOCKER",
        detail: `Found forbidden placeholder in ${file}`,
        fix: "Replace TODO, FACT NEEDED, and lorem ipsum placeholders with production copy",
      };
    }
    if (/<h1\b[^>]*>\s*hello\s*world\s*<\/h1>/i.test(content)) {
      return {
        status: "BLOCKER",
        detail: `Found hello-world page in ${file}`,
        fix: "Remove test hello-world pages",
      };
    }
  }

  return {
    status: "PASS",
    detail: `Scanned ${htmlFiles.length} built HTML files for placeholders`,
  };
}

export function checkTrackedFilesAndLeaks(rootDir = ".") {
  let trackedFiles = [];
  try {
    const stdout = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" });
    trackedFiles = stdout.split(/\r?\n/).filter(Boolean);
  } catch {
    return { status: "PASS", detail: "git not available, skipped git tracking check" };
  }

  // 1. writing/ must be untracked
  const trackedWriting = trackedFiles.filter((f) => f.startsWith("writing/"));
  if (trackedWriting.length > 0) {
    return {
      status: "BLOCKER",
      detail: `Private writing/ files tracked in git: ${trackedWriting.slice(0, 3).join(", ")}`,
      fix: "Untrack writing/ and add it to .gitignore",
    };
  }

  // 2. Generated files in src/content must be untracked
  const generatedMatches = trackedFiles.filter(
    (f) =>
      f === "src/content/.generated.json" ||
      f.startsWith("src/content/blog/") ||
      f.startsWith("src/content/products/") ||
      f.startsWith("src/content/notes/"),
  );
  if (generatedMatches.length > 0) {
    return {
      status: "BLOCKER",
      detail: `Generated content tracked in git: ${generatedMatches.join(", ")}`,
      fix: "Run 'git rm --cached' on generated content files",
    };
  }

  // 3. No .env files tracked
  const trackedEnv = trackedFiles.filter((f) => /(^|\/)\.env(\..+)?$/.test(f));
  if (trackedEnv.length > 0) {
    return {
      status: "BLOCKER",
      detail: `Environment file tracked in git: ${trackedEnv.join(", ")}`,
      fix: "Remove .env from git tracking and add to .gitignore",
    };
  }

  // 4. Secret pattern check in tracked files
  const secretPatterns = [
    { type: "Private Key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { type: "AWS Access Key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
    { type: "GitHub Personal Access Token", pattern: /\bghp_[A-Za-z0-9_]{36}\b/ },
    { type: "Stripe Secret Key", pattern: /\bsk_live_[0-9a-zA-Z]{24}\b/ },
  ];

  for (const relFile of trackedFiles) {
    const fullPath = join(rootDir, relFile);
    if (!existsSync(fullPath)) continue;
    try {
      const stats = statSync(fullPath);
      if (stats.size > 200000) continue; // Skip large binary files
      const text = readFileSync(fullPath, "utf8");
      for (const { type, pattern } of secretPatterns) {
        if (pattern.test(text)) {
          return {
            status: "BLOCKER",
            detail: `Potential ${type} detected in tracked file: ${relFile}`,
            fix: "Revoke and remove the exposed credential immediately",
          };
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return {
    status: "PASS",
    detail: `Clean tracking: 0 secrets, 0 .env, 0 generated files in git index`,
  };
}

export function checkGitHistoryLeaks(rootDir = ".") {
  const leakQueries = [
    { pattern: ["Sieben", "sterngasse"].join(""), label: "Address leak" },
    { pattern: ["peter@", "steipete"].join(""), label: "Personal email leak" },
    { pattern: ["buttondown", ".com/api"].join(""), label: "Legacy API leak" },
  ];

  const leaksFound = [];
  for (const { pattern, label } of leakQueries) {
    try {
      const out = execSync(`git log --all -S"${pattern}" --oneline`, {
        cwd: rootDir,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
      if (out.length > 0) {
        leaksFound.push({ label, pattern, count: out.split(/\r?\n/).length });
      }
    } catch {
      // Git command failed or pattern not found
    }
  }

  if (leaksFound.length > 0) {
    return {
      status: "BLOCKER",
      detail: `Found upstream leaks in git history: ${leaksFound.map((l) => `${l.label} ('${l.pattern}')`).join(", ")}`,
      fix: "Create an orphan branch or fresh repository before making the repo public (docs/GO-LIVE.md step B)",
    };
  }

  return { status: "PASS", detail: "Git history clean: 0 upstream leak strings found" };
}

export function checkDeployWorkflow(rootDir = ".") {
  const workflowPath = join(rootDir, ".github", "workflows", "deploy.yml");
  if (!existsSync(workflowPath)) {
    return {
      status: "BLOCKER",
      detail: "deploy.yml does not exist",
      fix: "Create .github/workflows/deploy.yml",
    };
  }

  const text = readFileSync(workflowPath, "utf8");
  const hasPagesWrite = /pages:\s*write/i.test(text);
  const hasIdTokenWrite = /id-token:\s*write/i.test(text);
  const hasPagesConcurrency = /concurrency:\s*[\s\S]*?group:\s*pages/i.test(text);
  const hasFetchDepth0 = /fetch-depth:\s*0/i.test(text);
  const hasPnpmBuild = /run:\s*pnpm run build/i.test(text);

  if (!hasPagesWrite || !hasIdTokenWrite) {
    return {
      status: "BLOCKER",
      detail: "deploy.yml must declare permissions 'pages: write' and 'id-token: write'",
      fix: "Add pages: write and id-token: write permissions to deploy.yml",
    };
  }

  if (!hasPagesConcurrency) {
    return {
      status: "BLOCKER",
      detail: "deploy.yml must configure concurrency group 'pages'",
      fix: "Add concurrency: group: pages, cancel-in-progress: false",
    };
  }

  if (!hasFetchDepth0) {
    return {
      status: "BLOCKER",
      detail: "deploy.yml checkout must have fetch-depth: 0 for git commit date derivation",
      fix: "Add with: fetch-depth: 0 to actions/checkout step",
    };
  }

  if (!hasPnpmBuild) {
    return {
      status: "BLOCKER",
      detail: "deploy.yml must build site with 'pnpm run build'",
      fix: "Set build step command to 'pnpm run build'",
    };
  }

  return {
    status: "PASS",
    detail: "deploy.yml permissions, concurrency, and build steps verified",
  };
}

export function checkWarnings(siteConfig, rootDir = ".") {
  const warnings = [];

  // 1. Tagline, description, bio, email
  if (!siteConfig.tagline || siteConfig.tagline.trim() === "") {
    warnings.push({
      issue: "SITE.tagline is empty",
      fix: "Add a concise site tagline in src/config.ts",
    });
  }
  if (!siteConfig.desc || siteConfig.desc.trim() === "") {
    warnings.push({ issue: "SITE.desc is empty", fix: "Add a site description in src/config.ts" });
  }
  if (!siteConfig.bio || siteConfig.bio.trim() === "") {
    warnings.push({ issue: "SITE.bio is empty", fix: "Add author bio in src/config.ts" });
  }
  if (!siteConfig.email || siteConfig.email.trim() === "") {
    warnings.push({
      issue: "SITE.email is empty (unconfigured)",
      fix: "Set public email in src/config.ts once ready to receive inquiries",
    });
  }

  // 2. Article count check
  const articleDir = join(rootDir, "content", "Article");
  let articleCount = 0;
  if (existsSync(articleDir)) {
    articleCount = readdirSync(articleDir).filter(
      (f) => !f.startsWith("_") && f.endsWith(".md"),
    ).length;
  }
  if (articleCount < 3) {
    warnings.push({
      issue: `Only ${articleCount} article(s) published (recommended >= 3)`,
      fix: "Publish at least 3 articles under content/Article/",
    });
  }

  // 3. Drafts check
  const draftsFound = [];
  for (const sub of ["Article", "Projects", "Opensource", "Notes"]) {
    const dir = join(rootDir, "content", sub);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const f of files) {
      if (f.startsWith("_")) continue;
      const content = readFileSync(join(dir, f), "utf8");
      if (/^draft:\s*true/m.test(content)) {
        draftsFound.push(`${sub}/${f}`);
      }
    }
  }
  if (draftsFound.length > 0) {
    warnings.push({
      issue: `Unpublished drafts detected: ${draftsFound.join(", ")}`,
      fix: "Set 'draft: false' when ready to publish",
    });
  }

  // 4. License and README
  if (!existsSync(join(rootDir, "LICENSE"))) {
    warnings.push({ issue: "Repository has no LICENSE file", fix: "Add LICENSE" });
  }
  if (!existsSync(join(rootDir, "README.md"))) {
    warnings.push({ issue: "Repository has no README.md", fix: "Add README.md" });
  }

  return warnings;
}

export async function runPreflight(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const noBuild = Boolean(options.noBuild);
  const logger = options.logger || console;

  logger.log("\n========================================================");
  logger.log("  saurabhaudit.com Pre-flight Go-Live Readiness Check   ");
  logger.log("========================================================\n");

  if (!noBuild) {
    logger.log("Running fresh sync and build...");
    try {
      execSync("pnpm run build", { cwd: rootDir, stdio: "inherit" });
      logger.log("✓ Build completed.\n");
    } catch (err) {
      logger.error("Build failed during preflight:", err.message);
      return {
        passed: false,
        blockers: [{ name: "Build Execution", detail: "pnpm run build exited with an error" }],
        warnings: [],
      };
    }
  }

  // Read site config
  let siteConfig = {};
  try {
    const configPath = resolve(rootDir, "src/config.ts");
    const configUrl = pathToFileURL(configPath).href;
    const configModule = await import(configUrl);
    siteConfig = configModule.SITE || {};
  } catch (err) {
    logger.error("Could not load src/config.ts:", err.message);
  }

  const checks = [
    { name: "Domain & CNAME", result: checkDomainAndCname(siteConfig, rootDir) },
    { name: "Required Dist Files", result: checkRequiredDistFiles(join(rootDir, "dist")) },
    {
      name: "Sitemaps & URLs",
      result: checkSitemapsAndContent(
        join(rootDir, "dist"),
        new URL(siteConfig.website || "https://saurabhaudit.com").hostname,
      ),
    },
    { name: "Content Hygiene (No Placeholders)", result: checkDistHygiene(join(rootDir, "dist")) },
    { name: "Tracked Files & Secret Leaks", result: checkTrackedFilesAndLeaks(rootDir) },
    { name: "Git History Leaks", result: checkGitHistoryLeaks(rootDir) },
    { name: "Deploy Workflow Integrity", result: checkDeployWorkflow(rootDir) },
  ];

  const warnings = checkWarnings(siteConfig, rootDir);

  // Print results table
  logger.log("| Category | Status | Details |");
  logger.log("| :--- | :---: | :--- |");
  for (const c of checks) {
    const badge = c.result.status === "PASS" ? "PASS" : "BLOCKER";
    logger.log(`| ${c.name} | **${badge}** | ${c.result.detail} |`);
  }
  for (const w of warnings) {
    logger.log(`| Configuration | **WARN** | ${w.issue} |`);
  }

  const blockers = checks.filter((c) => c.result.status === "BLOCKER");

  logger.log("\n--------------------------------------------------------");
  if (blockers.length === 0) {
    logger.log("VERDICT: GO-LIVE READY (0 Blockers, " + warnings.length + " Warnings)");
  } else {
    logger.log(`VERDICT: NOT READY (${blockers.length} BLOCKER(S) found)`);
    logger.log("\nBlockers to resolve before launch:");
    for (const b of blockers) {
      logger.log(`- [BLOCKER] ${b.name}: ${b.result.detail}`);
      if (b.result.fix) logger.log(`  Fix: ${b.result.fix}`);
    }
  }

  if (warnings.length > 0) {
    logger.log("\nAdvisory Warnings (non-blocking):");
    for (const w of warnings) {
      logger.log(`- [WARN] ${w.issue}`);
      if (w.fix) logger.log(`  Fix: ${w.fix}`);
    }
  }
  logger.log("--------------------------------------------------------\n");

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
  };
}

if (process.argv[1] && process.argv[1].endsWith("preflight.mjs")) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "no-build": { type: "boolean", default: false },
    },
  });

  runPreflight({ noBuild: values["no-build"] })
    .then(({ passed }) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("Preflight execution error:", err);
      process.exit(1);
    });
}
