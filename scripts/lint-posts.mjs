import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./lib/frontmatter.mjs";

export { parseFrontmatter };

export function lintPost({ filePath, frontmatter, body, allPosts = [] }) {
  const errors = [];
  const warnings = [];

  // 1. Skip draft posts
  if (frontmatter?.draft === true) {
    return { skipped: true, errors, warnings };
  }

  // 2. Check frontmatter presence
  if (!frontmatter) {
    errors.push("Missing YAML frontmatter block delimited by '---'.");
    return { skipped: false, errors, warnings };
  }

  // 3. Description rules (FAIL if missing, < 50 chars, or > 160 chars)
  const description =
    typeof frontmatter.description === "string" ? frontmatter.description.trim() : "";
  if (!description) {
    errors.push("Missing or empty 'description' in frontmatter.");
  } else if (description.length < 50) {
    errors.push(`Description is too short (${description.length} chars, minimum is 50).`);
  } else if (description.length > 160) {
    errors.push(`Description is too long (${description.length} chars, maximum is 160).`);
  }

  // 4. Title rules (FAIL if missing or > 70 chars; WARN between 61 and 70 chars)
  const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
  if (!title) {
    errors.push("Missing or empty 'title' in frontmatter.");
  } else if (title.length > 70) {
    errors.push(`Title is too long (${title.length} chars, maximum is 70).`);
  } else if (title.length > 60) {
    warnings.push(
      `Title is ${title.length} chars long (recommended <= 60 chars for search snippets).`,
    );
  }

  // 5. Duplicate titles and descriptions across other published posts
  for (const other of allPosts) {
    if (other.filePath === filePath || other.frontmatter?.draft === true) continue;
    const otherTitle =
      typeof other.frontmatter?.title === "string" ? other.frontmatter.title.trim() : "";
    const otherDesc =
      typeof other.frontmatter?.description === "string"
        ? other.frontmatter.description.trim()
        : "";

    if (title && otherTitle && title.toLowerCase() === otherTitle.toLowerCase()) {
      errors.push(`Duplicate title: identical to title in "${other.filePath}".`);
    }
    if (description && otherDesc && description.toLowerCase() === otherDesc.toLowerCase()) {
      errors.push(`Duplicate description: identical to description in "${other.filePath}".`);
    }
  }

  // 6. Heading rule: No H1 in body (Layout provides the single H1)
  // Strip code blocks before checking heading lines
  const bodyWithoutCode = body.replace(/```[\s\S]*?```/g, "");
  if (/(?:^|\r?\n)#\s+[^\r\n]+/.test(bodyWithoutCode)) {
    errors.push(
      "Body contains an H1 heading ('# '). PostDetails layout provides H1; body must start at H2 ('## ').",
    );
  }

  // 7. Image alt text rules: FAIL on empty alt text
  // Markdown images: ![alt](url)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let mdImgMatch;
  while ((mdImgMatch = mdImageRegex.exec(bodyWithoutCode)) !== null) {
    if (mdImgMatch[1].trim() === "") {
      errors.push(
        `Markdown image (${mdImgMatch[2]}) has empty alt text. Non-empty alt text is required.`,
      );
    }
  }

  // HTML images: <img ...>
  const htmlImgRegex = /<img\b([^>]*)>/gi;
  let htmlImgMatch;
  while ((htmlImgMatch = htmlImgRegex.exec(bodyWithoutCode)) !== null) {
    const attrs = htmlImgMatch[1];
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    if (!altMatch || altMatch[1].trim() === "") {
      errors.push(
        "HTML <img> tag has missing or empty alt attribute. Non-empty alt text is required.",
      );
    }
  }

  // 8. Tag rules (WARNINGS)
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const kebabRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  for (const tag of tags) {
    if (!kebabRegex.test(tag)) {
      warnings.push(`Tag "${tag}" is not kebab-case.`);
    }
  }
  if (tags.length === 1 && tags[0] === "others") {
    warnings.push('Tags equal to only default "others". Prefer 1-4 specific kebab-case tags.');
  }

  // 9. Body length check (WARNING)
  const prose = bodyWithoutCode
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`_~\[\]()>-]/g, " ")
    .trim();
  const wordCount = prose ? prose.split(/\s+/).filter(Boolean).length : 0;
  if (wordCount < 50) {
    warnings.push(
      `Body contains only ${wordCount} words (minimum ~50 words recommended for an article).`,
    );
  }

  return {
    skipped: false,
    errors,
    warnings,
  };
}

export async function lintAllPosts(contentDir = "src/content/blog") {
  const entries = await readdir(contentDir, { recursive: true, withFileTypes: true });
  const postFiles = entries
    .filter(
      (entry) => entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")),
    )
    .map((entry) => join(entry.parentPath || entry.path, entry.name))
    .filter((fullPath) => {
      const rel = relative(contentDir, fullPath).replace(/\\/g, "/");
      // Skip files or folders starting with "_"
      return !rel.split("/").some((part) => part.startsWith("_"));
    });

  const parsedPosts = [];
  for (const filePath of postFiles) {
    const content = await readFile(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    parsedPosts.push({ filePath, frontmatter, body });
  }

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const post of parsedPosts) {
    const result = lintPost({
      filePath: post.filePath,
      frontmatter: post.frontmatter,
      body: post.body,
      allPosts: parsedPosts,
    });
    if (!result.skipped) {
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      if (result.errors.length > 0 || result.warnings.length > 0) {
        results.push({ filePath: post.filePath, ...result });
      }
    }
  }

  return {
    scanned: parsedPosts.length,
    results,
    totalErrors,
    totalWarnings,
  };
}

// Direct execution CLI
const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, "/") === process.argv[1].replace(/\\/g, "/");
if (isDirectRun) {
  try {
    const { scanned, results, totalErrors, totalWarnings } = await lintAllPosts("src/content/blog");
    if (results.length === 0) {
      console.log(
        `[lint:posts] Checked ${scanned} post(s). All published posts passed frontmatter and SEO rules!`,
      );
      process.exit(0);
    }

    console.log(
      `\n[lint:posts] Scanned ${scanned} post(s): ${totalErrors} error(s), ${totalWarnings} warning(s)\n`,
    );
    for (const r of results) {
      console.log(`File: ${r.filePath}`);
      for (const err of r.errors) {
        console.log(`  ERROR: ${err}`);
      }
      for (const warn of r.warnings) {
        console.log(`  WARN:  ${warn}`);
      }
      console.log("");
    }

    if (totalErrors > 0) {
      console.error(`[lint:posts] FAILED with ${totalErrors} error(s).\n`);
      process.exit(1);
    } else {
      console.log(`[lint:posts] PASSED with ${totalWarnings} warning(s).\n`);
      process.exit(0);
    }
  } catch (err) {
    console.error("[lint:posts] Unexpected error:", err);
    process.exit(1);
  }
}
