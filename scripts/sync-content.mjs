import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  watch,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, serializeFrontmatter } from "./lib/frontmatter.mjs";
import {
  isValidHttpsUrl,
  LIMITS,
  LINK_ALIASES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
} from "../src/utils/contentRules.mjs";

export function slugify(str) {
  return str
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveDescription(body, maxLen = 155) {
  const paragraphs = body
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith("<!--"));

  for (const para of paragraphs) {
    const cleaned = stripMarkdown(para);
    if (cleaned.length > 0) {
      if (cleaned.length <= maxLen) {
        return cleaned;
      }
      // Cut at word boundary
      const sub = cleaned.slice(0, maxLen);
      const lastSpace = sub.lastIndexOf(" ");
      const cut = lastSpace > 30 ? sub.slice(0, lastSpace) : sub;
      return `${cut.trim()}...`;
    }
  }
  return "";
}

export function getFirstGitCommitDate(filePath, cwd) {
  try {
    const out = execSync(`git log --diff-filter=A --follow --format=%aI -- "${filePath}"`, {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    if (out) {
      const lines = out.split(/\r?\n/).filter(Boolean);
      return lines[lines.length - 1];
    }
  } catch {
    // Git not available or untracked
  }
  return null;
}

export function normalizeTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAllContentFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name === ".gitkeep") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllContentFiles(full));
    } else if (/\.(md|mdx)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

export async function syncContent(options = {}) {
  const rootDir = options.cwd || process.cwd();
  const contentDir = resolve(rootDir, options.contentDir || "content");
  const targetDir = resolve(rootDir, options.targetDir || "src/content");
  const manifestPath = resolve(rootDir, options.manifestFile || "src/content/.generated.json");
  const silent = Boolean(options.silent);

  const errors = [];
  const warnings = [];

  const collections = {
    article: { target: "blog", sourceFolders: ["article"] },
    projects: { target: "products", sourceFolders: ["projects"] },
    opensource: { target: "products", sourceFolders: ["opensource"] },
    notes: { target: "notes", sourceFolders: ["notes"] },
  };

  const rawFiles = getAllContentFiles(contentDir);
  const matchedFiles = [];

  for (const file of rawFiles) {
    const rel = relative(contentDir, file).replace(/\\/g, "/");
    const parts = rel.split("/");
    const topFolder = parts[0].toLowerCase();

    let matchedType = null;
    for (const [type, conf] of Object.entries(collections)) {
      if (conf.sourceFolders.includes(topFolder)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      matchedFiles.push({ file, rel, type: matchedType, topFolder });
    }
  }

  const slugMap = new Map();
  const processedItems = [];

  for (const item of matchedFiles) {
    const { file, rel, type } = item;
    const targetFolder = collections[type].target;
    const ext = item.file.endsWith(".mdx") ? ".mdx" : ".md";
    const rawName = basename(file, ext);
    const slug = slugify(rawName);

    if (!slug) {
      errors.push(
        `${rel}: Invalid filename/slug '${rawName}' -> Use alphanumeric and hyphen characters`,
      );
      continue;
    }

    // Check slug collision across target folder
    const targetKey = `${targetFolder}:${slug}`;
    if (slugMap.has(targetKey)) {
      const prevRel = slugMap.get(targetKey);
      errors.push(
        `${rel}: Slug '${slug}' collides with '${prevRel}' -> Rename the file or adjust the slug to be unique`,
      );
      continue;
    }
    slugMap.set(targetKey, rel);

    const fileContent = readFileSync(file, "utf8");
    const { frontmatter, body } = parseFrontmatter(fileContent);

    // Aliases & normalization
    const data = { ...frontmatter };
    let cleanBody = body;

    // Handle Title
    let title = data.title;
    if (!title) {
      const h1Match = cleanBody.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
        cleanBody = cleanBody.replace(/^#\s+.*$/m, "").trimStart();
      }
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      errors.push(`${rel}: Missing title -> Add a '# Title' heading or 'title: ...' header`);
    } else {
      title = title.trim();
    }

    // Handle Aliases
    if (data.date && !data.pubDatetime) {
      data.pubDatetime = data.date;
      delete data.date;
    }
    if (data.updated && !data.modDatetime) {
      data.modDatetime = data.updated;
      delete data.updated;
    }

    const outRelPath = `src/content/${targetFolder}/${slug}${ext}`;
    const outFullPath = resolve(rootDir, outRelPath);

    // Handle Date
    let pubDatetime = data.pubDatetime;
    if (pubDatetime) {
      const d = new Date(pubDatetime);
      if (isNaN(d.getTime())) {
        errors.push(`${rel}: Invalid date '${pubDatetime}' -> Use YYYY-MM-DD or ISO date format`);
      } else {
        pubDatetime = d;
      }
    } else {
      const gitDate = getFirstGitCommitDate(file, rootDir);
      if (gitDate) {
        pubDatetime = new Date(gitDate);
      } else {
        // If file was already generated, retain its pubDatetime so repeated runs remain strictly idempotent
        if (existsSync(outFullPath)) {
          try {
            const existingContent = readFileSync(outFullPath, "utf8");
            const parsed = parseFrontmatter(existingContent);
            if (parsed.frontmatter?.pubDatetime) {
              pubDatetime = new Date(parsed.frontmatter.pubDatetime);
            }
          } catch {}
        }
        if (!pubDatetime) {
          pubDatetime = new Date();
          warnings.push(
            `${rel}: No date found; defaulting to today -> Add 'date: YYYY-MM-DD' header`,
          );
        }
      }
    }

    // Handle modDatetime if present
    let modDatetime = data.modDatetime ? new Date(data.modDatetime) : undefined;
    if (modDatetime && isNaN(modDatetime.getTime())) {
      errors.push(
        `${rel}: Invalid updated/modDatetime '${data.modDatetime}' -> Use YYYY-MM-DD format`,
      );
      modDatetime = undefined;
    }

    // Handle Description
    let description = data.description ? String(data.description).trim() : "";
    if (!description && type !== "notes") {
      description = deriveDescription(cleanBody, LIMITS[type]?.derivedDescMax || 155);
      if (!description) {
        errors.push(
          `${rel}: Missing description -> Add a description header or write an opening paragraph`,
        );
      }
    }
    if (description && description.length > 160) {
      errors.push(
        `${rel}: Description is too long (${description.length} chars, max is 160) -> Shorten description to 160 chars or less`,
      );
    }

    // Handle Tags
    let tags = [];
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        tags = data.tags.map(normalizeTag).filter(Boolean);
      } else if (typeof data.tags === "string") {
        tags = data.tags.split(",").map(normalizeTag).filter(Boolean);
      }
    } else {
      tags = type === "article" ? ["others"] : [];
    }

    // Handle Product / OpenSource specific fields
    let productType = data.type;
    let productStatus = data.status;
    let links = typeof data.links === "object" && data.links !== null ? { ...data.links } : {};

    // Remap links aliases
    for (const [k, v] of Object.entries(data)) {
      const lowerKey = k.toLowerCase();
      if (LINK_ALIASES[lowerKey]) {
        links[LINK_ALIASES[lowerKey]] = v;
      }
    }

    // Validate link URLs
    for (const [linkKey, urlVal] of Object.entries(links)) {
      if (!urlVal) continue;
      if (!isValidHttpsUrl(urlVal)) {
        errors.push(
          `${rel}: Link '${linkKey}' with URL '${urlVal}' is not https -> Change URL to start with https://`,
        );
      }
    }

    if (type === "projects" || type === "opensource") {
      if (!productType) {
        productType = type === "opensource" ? "open-source" : "other";
      }
      if (!PRODUCT_TYPES.includes(productType)) {
        errors.push(
          `${rel}: Unknown product type '${productType}' -> Use one of: ${PRODUCT_TYPES.join(", ")}`,
        );
      }

      if (!productStatus) {
        productStatus = type === "opensource" ? "live" : "building";
      }
      if (!PRODUCT_STATUSES.includes(productStatus)) {
        errors.push(
          `${rel}: Unknown product status '${productStatus}' -> Use one of: ${PRODUCT_STATUSES.join(", ")}`,
        );
      }

      if (productStatus === "live" || productStatus === "beta") {
        const hasValidLink = Object.values(links).some(
          (val) => typeof val === "string" && val.length > 0,
        );
        if (!hasValidLink) {
          errors.push(
            `${rel}: Product with status '${productStatus}' has no links -> Provide at least one valid https URL in links (e.g. github, website, playstore)`,
          );
        }
      }
    }

    // Check unknown keys
    const knownKeys = new Set([
      "title",
      "pubDatetime",
      "modDatetime",
      "date",
      "updated",
      "description",
      "tags",
      "author",
      "featured",
      "draft",
      "unlisted",
      "ogImage",
      "heroImage",
      "canonicalURL",
      "hideEditPost",
      "timezone",
      "source",
      "AIDescription",
      "type",
      "status",
      "links",
      "order",
      "sourceUrl",
      "sourceTitle",
      ...Object.keys(LINK_ALIASES),
    ]);

    for (const k of Object.keys(data)) {
      if (!knownKeys.has(k)) {
        warnings.push(`${rel}: Unknown key '${k}' -> Ignored`);
      }
    }

    // Assemble final frontmatter
    const finalData = {
      title,
      description: description || undefined,
      pubDatetime,
      modDatetime,
      author: data.author || undefined,
      tags,
      featured: typeof data.featured === "boolean" ? data.featured : false,
      draft: typeof data.draft === "boolean" ? data.draft : false,
      unlisted: typeof data.unlisted === "boolean" ? data.unlisted : false,
      ogImage: data.ogImage || undefined,
      heroImage: data.heroImage || undefined,
    };

    if (type === "projects" || type === "opensource") {
      finalData.type = productType;
      finalData.status = productStatus;
      finalData.links = links;
      if (typeof data.order === "number") finalData.order = data.order;
    }

    if (type === "notes") {
      if (data.sourceUrl) finalData.sourceUrl = data.sourceUrl;
      if (data.sourceTitle) finalData.sourceTitle = data.sourceTitle;
    }

    processedItems.push({
      sourceRel: rel,
      outRelPath,
      outFullPath,
      finalData,
      cleanBody,
      draft: finalData.draft,
    });
  }

  // If there are errors, report them and fail before writing
  if (errors.length > 0) {
    if (!silent) {
      console.error(`\n[sync-content] FAILED with ${errors.length} error(s):`);
      for (const err of errors) {
        console.error(`  ${err}`);
      }
      console.error("");
    }
    const err = new Error(`Sync content failed with ${errors.length} errors`);
    err.errors = errors;
    err.warnings = warnings;
    throw err;
  }

  // Read previous manifest
  let prevManifest = {};
  if (existsSync(manifestPath)) {
    try {
      prevManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      prevManifest = {};
    }
  }

  const nextManifest = {};
  let publishedCount = 0;
  let draftCount = 0;

  // Write processed items
  for (const item of processedItems) {
    mkdirSync(dirname(item.outFullPath), { recursive: true });
    const contentStr = serializeFrontmatter(item.finalData, item.cleanBody);

    // Only write if changed (idempotent)
    let shouldWrite = true;
    if (existsSync(item.outFullPath)) {
      const existing = readFileSync(item.outFullPath, "utf8");
      if (existing === contentStr) {
        shouldWrite = false;
      }
    }
    if (shouldWrite) {
      writeFileSync(item.outFullPath, contentStr, "utf8");
    }

    nextManifest[item.outRelPath] = item.sourceRel;
    if (item.draft) draftCount++;
    else publishedCount++;
  }

  // Clean stale generated files
  for (const oldRelPath of Object.keys(prevManifest)) {
    if (!nextManifest[oldRelPath]) {
      const oldFull = resolve(rootDir, oldRelPath);
      if (existsSync(oldFull)) {
        unlinkSync(oldFull);
      }
    }
  }

  // Check for non-generated files in target folders
  for (const folder of ["blog", "products", "notes"]) {
    const dir = join(targetDir, folder);
    if (!existsSync(dir)) continue;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith("zz-") || entry.startsWith("_") || entry === ".gitkeep") continue;
      const relCheck = `src/content/${folder}/${entry}`;
      if (!nextManifest[relCheck]) {
        warnings.push(
          `${relCheck}: Non-generated file found in generated content directory -> Put source files in content/`,
        );
      }
    }
  }

  // Write new manifest
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2), "utf8");

  if (!silent) {
    console.log(
      `[sync-content] Synced ${processedItems.length} file(s): ${publishedCount} published, ${draftCount} drafts, ${warnings.length} warnings.`,
    );
    for (const warn of warnings) {
      console.warn(`  WARN: ${warn}`);
    }
  }

  return {
    scanned: matchedFiles.length,
    published: publishedCount,
    drafts: draftCount,
    warnings,
    errors: [],
  };
}

// CLI entry point
const isDirectCli =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, "/") === process.argv[1].replace(/\\/g, "/");

if (isDirectCli) {
  const isWatch = process.argv.includes("--watch");

  const runSync = async () => {
    try {
      await syncContent();
    } catch (err) {
      if (!isWatch) {
        process.exit(1);
      }
    }
  };

  await runSync();

  if (isWatch) {
    console.log("[sync-content] Watching content/ for changes...");
    let timer = null;
    watch("content", { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        runSync();
      }, 150);
    });
  }
}
