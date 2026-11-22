import type { APIRoute } from "astro";
import { SITE } from "@/config";

const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const baseSite = site ?? new URL(SITE.website);
  const sitemapURL = new URL("sitemap-index.xml", baseSite);
  return new Response(getRobotsTxt(sitemapURL).trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
