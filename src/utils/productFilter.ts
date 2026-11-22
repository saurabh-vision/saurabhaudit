import type { CollectionEntry } from "astro:content";
import { SITE } from "../config.ts";

export interface ProductVisibilityOptions {
  now?: number;
  preview?: boolean;
}

export function isProductPublished(
  data: { pubDatetime: Date; draft?: boolean },
  { now = Date.now(), preview = false }: ProductVisibilityOptions = {},
): boolean {
  return !data.draft && (preview || now > data.pubDatetime.getTime() - SITE.scheduledPostMargin);
}

const productFilter = ({ data }: CollectionEntry<"products">): boolean =>
  isProductPublished(data, { preview: import.meta.env.DEV });

export default productFilter;
