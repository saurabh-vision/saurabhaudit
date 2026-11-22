import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { AstroIntegration } from "astro";
import sitemap, { ChangeFreqEnum, type SitemapItem } from "@astrojs/sitemap";

function getAllFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (entry.endsWith(".md") || entry.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseContentMetadata(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf8");
    const pubMatch = content.match(/pubDatetime:\s*["']?([^"'\r\n]+)["']?/);
    const modMatch = content.match(/modDatetime:\s*["']?([^"'\r\n]+)["']?/);
    const draftMatch = content.match(/draft:\s*true/);
    const unlistedMatch = content.match(/unlisted:\s*true/);

    const tags: string[] = [];
    const bracketTags = content.match(/tags:\s*\[(.*?)\]/);
    if (bracketTags) {
      bracketTags[1].split(",").forEach((t) => {
        const clean = t.trim().replace(/^["']|["']$/g, "");
        if (clean) tags.push(clean.toLowerCase());
      });
    } else {
      const listMatch = content.match(/tags:\s*\r?\n((?:\s*-\s*[^\r\n]+\r?\n?)+)/);
      if (listMatch) {
        listMatch[1].split(/\r?\n/).forEach((line) => {
          const item = line
            .replace(/^\s*-\s*/, "")
            .trim()
            .replace(/^["']|["']$/g, "");
          if (item) tags.push(item.toLowerCase());
        });
      }
    }

    const pub = pubMatch ? new Date(pubMatch[1]) : undefined;
    const mod = modMatch ? new Date(modMatch[1]) : undefined;

    return {
      pub: pub && !isNaN(pub.getTime()) ? pub : undefined,
      mod: mod && !isNaN(mod.getTime()) ? mod : undefined,
      tags,
      draft: Boolean(draftMatch),
      unlisted: Boolean(unlistedMatch),
    };
  } catch {
    return null;
  }
}

export function buildContentDatesMap(): Map<string, string> {
  const map = new Map<string, string>();
  let latestPostDate: Date | null = null;
  let latestProductDate: Date | null = null;
  let latestNoteDate: Date | null = null;
  const tagLatestMap = new Map<string, Date>();
  const noteTagLatestMap = new Map<string, Date>();

  // 1. Blog posts
  const blogFiles = getAllFiles("src/content/blog");
  for (const file of blogFiles) {
    if (file.includes("_template")) continue;
    const meta = parseContentMetadata(file);
    if (!meta || meta.draft) continue;
    const effectiveDate = meta.mod ?? meta.pub;
    if (!effectiveDate) continue;

    if (!latestPostDate || effectiveDate > latestPostDate) {
      latestPostDate = effectiveDate;
    }

    const rel = file
      .replace(/\\/g, "/")
      .replace(/^src\/content\/blog\//, "")
      .replace(/\.(md|mdx)$/, "");
    // Main slug (without year prefix if any)
    const slug = rel.split("/").pop();
    if (slug) {
      map.set(`/posts/${slug}`, effectiveDate.toISOString());
    }
    // Also store full path if different
    map.set(`/posts/${rel}`, effectiveDate.toISOString());

    for (const tag of meta.tags) {
      const existing = tagLatestMap.get(tag);
      if (!existing || effectiveDate > existing) {
        tagLatestMap.set(tag, effectiveDate);
      }
    }
  }

  // 2. Products
  const productFiles = getAllFiles("src/content/products");
  for (const file of productFiles) {
    if (file.includes("_template")) continue;
    const meta = parseContentMetadata(file);
    if (!meta || meta.draft) continue;
    const effectiveDate = meta.mod ?? meta.pub;
    if (!effectiveDate) continue;

    if (!latestProductDate || effectiveDate > latestProductDate) {
      latestProductDate = effectiveDate;
    }

    const slug = file
      .replace(/\\/g, "/")
      .replace(/^src\/content\/products\//, "")
      .replace(/\.(md|mdx)$/, "")
      .split("/")
      .pop();
    if (slug) {
      map.set(`/products/${slug}`, effectiveDate.toISOString());
    }
  }

  // 3. Notes
  const noteFiles = getAllFiles("src/content/notes");
  for (const file of noteFiles) {
    if (file.includes("_template")) continue;
    const meta = parseContentMetadata(file);
    if (!meta || meta.draft || meta.unlisted) continue;
    const effectiveDate = meta.mod ?? meta.pub;
    if (!effectiveDate) continue;

    if (!latestNoteDate || effectiveDate > latestNoteDate) {
      latestNoteDate = effectiveDate;
    }

    const slug = file
      .replace(/\\/g, "/")
      .replace(/^src\/content\/notes\//, "")
      .replace(/\.(md|mdx)$/, "")
      .split("/")
      .pop();
    if (slug) {
      map.set(`/notes/${slug}`, effectiveDate.toISOString());
    }

    for (const tag of meta.tags) {
      const existing = noteTagLatestMap.get(tag);
      if (!existing || effectiveDate > existing) {
        noteTagLatestMap.set(tag, effectiveDate);
      }
    }
  }

  // Listing page dates
  if (latestPostDate) {
    map.set("/posts", latestPostDate.toISOString());
  }
  if (latestProductDate) {
    map.set("/products", latestProductDate.toISOString());
  }
  if (latestNoteDate) {
    map.set("/notes", latestNoteDate.toISOString());
  }

  for (const [tag, d] of tagLatestMap) {
    map.set(`/tags/${tag}`, d.toISOString());
  }
  for (const [tag, d] of noteTagLatestMap) {
    map.set(`/notes/tags/${tag}`, d.toISOString());
  }

  return map;
}

let cachedDatesMap: Map<string, string> | null = null;
function getDatesMap(): Map<string, string> {
  if (!cachedDatesMap) {
    cachedDatesMap = buildContentDatesMap();
  }
  return cachedDatesMap;
}

export function serializeSitemapItem(item: SitemapItem, now = new Date()): SitemapItem {
  const path = new URL(item.url).pathname.replace(/\/+$/, "") || "/";
  const result: SitemapItem = {
    ...item,
    url: path === "/" ? item.url : item.url.replace(/\/+$/, ""),
    changefreq: ChangeFreqEnum.MONTHLY,
    priority: 0.5,
  };

  const datesMap = getDatesMap();
  const mappedDate = datesMap.get(path);

  if (mappedDate) {
    result.lastmod = mappedDate;
  } else if (path === "/") {
    result.lastmod = now.toISOString();
  } else {
    // For /about, /search, or pages without reliable dates, omit lastmod
    delete (result as any).lastmod;
  }

  const postYear = /^\/posts\/(\d{4})(?:\/|$)/.exec(path)?.[1];
  if (path === "/") {
    result.priority = 1;
    result.changefreq = ChangeFreqEnum.DAILY;
  } else if (["/posts", "/about", "/search", "/products", "/notes"].includes(path)) {
    result.priority = 0.9;
    result.changefreq = ChangeFreqEnum.WEEKLY;
  } else if (postYear) {
    const age = now.getUTCFullYear() - Number(postYear);
    result.priority = age <= 1 ? 0.8 : age <= 5 ? 0.6 : 0.4;
    result.changefreq =
      age <= 1 ? ChangeFreqEnum.WEEKLY : age <= 5 ? ChangeFreqEnum.MONTHLY : ChangeFreqEnum.YEARLY;
  } else if (path.startsWith("/tags/")) {
    result.priority = 0.1;
    result.changefreq = ChangeFreqEnum.YEARLY;
  } else if (/\/page\/\d+$/.test(path)) {
    result.priority = 0.4;
    result.changefreq = ChangeFreqEnum.WEEKLY;
  }

  return result;
}

export function hasNoIndex(html: string) {
  return (html.match(/<meta\b[^>]*>/gi) ?? []).some(
    (tag) =>
      /\sname\s*=\s*["']robots["']/i.test(tag) &&
      /\scontent\s*=\s*["'][^"']*\bnoindex\b/i.test(tag),
  );
}

const normalizePath = (path: string) => path.replace(/^\/|\/$/g, "");

// Static redirect documents carry noindex; keep the sitemap consistent with their HTML.
export function indexableSitemap(options: Parameters<typeof sitemap>[0]): AstroIntegration {
  const excludedPaths = new Set<string>();
  const integration = sitemap({
    ...options,
    filter: (url) =>
      !excludedPaths.has(normalizePath(new URL(url).pathname)) && (options?.filter?.(url) ?? true),
  });
  const buildDone = integration.hooks["astro:build:done"]!;
  const configDone = integration.hooks["astro:config:done"]!;
  let base = "";
  return {
    ...integration,
    hooks: {
      ...integration.hooks,
      "astro:config:done": async (context) => {
        base = normalizePath(context.config.base);
        await configDone(context);
      },
      "astro:build:done": async (context) => {
        excludedPaths.clear();
        for (const { pathname } of context.pages) {
          const path = normalizePath(pathname);
          if (/^(404|500)$/.test(path)) continue;
          // Support Astro's directory, file, and preserve output formats.
          const candidates = path ? [`${path}/index.html`, `${path}.html`] : ["index.html"];
          const file = candidates.map((file) => new URL(file, context.dir)).find(existsSync);
          if (!file) throw new Error(`Missing sitemap page output: ${pathname}`);
          if (hasNoIndex(readFileSync(file, "utf8"))) {
            excludedPaths.add([base, path].filter(Boolean).join("/"));
          }
        }
        await buildDone(context);
      },
    },
  };
}
