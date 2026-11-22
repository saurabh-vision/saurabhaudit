import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createNewWriting({ folder, title, baseDir = "content" }) {
  if (!folder || !title) {
    throw new Error('Usage: pnpm run new -- <Article|Projects|Opensource|Notes> "<Title>"');
  }

  const normalizedFolder = folder.toLowerCase();
  let canonicalFolder;
  let templateName;
  if (normalizedFolder === "article") {
    canonicalFolder = "Article";
    templateName = "article.md";
  } else if (normalizedFolder === "projects") {
    canonicalFolder = "Projects";
    templateName = "project.md";
  } else if (normalizedFolder === "opensource") {
    canonicalFolder = "Opensource";
    templateName = "opensource.md";
  } else if (normalizedFolder === "notes") {
    canonicalFolder = "Notes";
    templateName = "note.md";
  } else {
    throw new Error(
      `Invalid folder "${folder}". Must be one of: Article, Projects, Opensource, Notes`,
    );
  }

  const slug = slugify(title);
  if (!slug) {
    throw new Error(`Could not generate a valid slug from title: "${title}"`);
  }

  const folderPath = join(baseDir, canonicalFolder);
  mkdirSync(folderPath, { recursive: true });

  const targetPath = join(folderPath, `${slug}.md`);
  if (existsSync(targetPath)) {
    throw new Error(`Target file already exists: "${targetPath}". Refusing to overwrite.`);
  }

  const today = new Date().toISOString().split("T")[0];
  const templatePath = join(baseDir, "_templates", templateName);
  let content = "";

  if (existsSync(templatePath)) {
    content = readFileSync(templatePath, "utf8");
    content = content.replace(/^#\s+.*$/m, `# ${title}`);
    if (!content.includes("date:")) {
      content = `date: ${today}\n${content}`;
    }
  } else {
    content = `date: ${today}\n# ${title}\n\n`;
  }

  writeFileSync(targetPath, content, "utf8");
  return targetPath;
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith("new-writing.mjs")) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: pnpm run new -- <Article|Projects|Opensource|Notes> "<Title>"');
      process.exit(1);
    }
    const [folder, ...titleParts] = args;
    const title = titleParts.join(" ").trim();
    const createdPath = createNewWriting({ folder, title });
    console.log(`Created new file: ${createdPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
