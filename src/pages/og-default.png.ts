import type { APIRoute } from "astro";
import { SITE } from "@/config";
import { generateOgImage } from "@/utils/generateOgImages";

function isValuePresent(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed !== "" && trimmed !== "TODO" && !trimmed.startsWith("TODO");
}

export const GET: APIRoute = async () => {
  const subtitle = isValuePresent(SITE.tagline) ? SITE.tagline : undefined;
  const png = await generateOgImage({
    title: SITE.title,
    subtitle,
  });

  return new Response(png as any, {
    headers: { "Content-Type": "image/png" },
  });
};
