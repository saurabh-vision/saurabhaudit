import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE } from "@/config";
import { SOCIALS } from "@/constants";
import { markdownResponse } from "@/utils/markdownResponse";
import type { APIRoute } from "astro";

function isValuePresent(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed !== "" && trimmed !== "TODO" && !trimmed.startsWith("TODO");
}

function getMdxBody(): string {
  try {
    const filePath = join(process.cwd(), "src/pages/about.mdx");
    if (!existsSync(filePath)) return "";
    const raw = readFileSync(filePath, "utf-8");
    return raw
      .replace(/---[\s\S]*?---/, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .trim();
  } catch {
    return "";
  }
}

export const GET: APIRoute = async () => {
  let content = `# About\n\n`;

  if (isValuePresent(SITE.bio)) {
    content += `${SITE.bio}\n\n`;
  }

  const mdxBody = getMdxBody();
  if (mdxBody) {
    content += `${mdxBody}\n\n`;
  }

  const activeSocials = SOCIALS.filter(
    (s) => s.active && Boolean(s.href) && !s.href.includes("TODO") && s.href.startsWith("https:"),
  );
  if (activeSocials.length > 0) {
    content += `## Elsewhere\n\n`;
    for (const s of activeSocials) {
      content += `- [${s.name}](${s.href})\n`;
    }
    content += "\n";
  }

  if (isValuePresent(SITE.email)) {
    content += `## Contact\n\nEmail: [${SITE.email}](mailto:${SITE.email})\n\n`;
  }

  if (SITE.substackUrl) {
    content += `## Newsletter\n\nSubscribe to [${SITE.substackName || "Substack"}](${SITE.substackUrl})\n\n`;
  }

  content += `---\n\n*This is the markdown-only version of About. Visit [${SITE.website}about](${SITE.website}about) for the full experience.*\n`;

  return markdownResponse(content);
};
