import { getCollection } from "astro:content";
import { SITE } from "@/config";
import { SOCIALS } from "@/constants";
import getSortedPosts from "@/utils/getSortedPosts";
import { markdownResponse } from "@/utils/markdownResponse";
import type { APIRoute } from "astro";

function isValuePresent(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed !== "" && trimmed !== "TODO" && !trimmed.startsWith("TODO");
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  const latestPosts = sortedPosts.slice(0, 5);

  const siteOrigin = new URL(SITE.website).origin;

  let markdownContent = `# ${SITE.title}\n\n`;

  if (isValuePresent(SITE.tagline)) {
    markdownContent += `${SITE.tagline}\n\n`;
  }

  if (isValuePresent(SITE.bio)) {
    markdownContent += `${SITE.bio}\n\n`;
  }

  // Active social links
  const activeSocials = SOCIALS.filter(
    (s) => s.active && Boolean(s.href) && !s.href.includes("TODO"),
  );
  if (activeSocials.length > 0) {
    markdownContent += `## Profiles\n\n`;
    for (const s of activeSocials) {
      markdownContent += `- [${s.name}](${s.href})\n`;
    }
    markdownContent += "\n";
  }

  // Substack newsletter link if configured
  if (SITE.substackUrl) {
    markdownContent += `## Newsletter\n\nSubscribe to [${SITE.substackName || "Substack"}](${SITE.substackUrl})\n\n`;
  }

  // Latest posts with absolute URLs
  if (latestPosts.length > 0) {
    markdownContent += `## Latest Posts\n\n`;
    for (const post of latestPosts) {
      const postUrl = `${siteOrigin}/posts/${post.id}`;
      markdownContent += `- [${post.data.title}](${postUrl})\n`;
    }
    markdownContent += "\n";
  }

  markdownContent += `## Navigation\n\n`;
  markdownContent += `- [All Posts](/posts.md)\n`;
  markdownContent += `- [About](/about.md)\n`;
  markdownContent += `- [RSS Feed](/rss.xml)\n\n`;

  markdownContent += `---\n\n*This is the markdown-only version of ${SITE.title}. Visit [${SITE.website}](${SITE.website}) for the full experience.*\n`;

  return markdownResponse(markdownContent);
};
