import { slugifyStr } from "./slugify.ts";

export function getProductPath(idOrSlug: string): string {
  const slug = idOrSlug.split("/").at(-1) ?? idOrSlug;
  const cleanSlug = slug.replace(/\.(md|mdx)$/, "");
  return `/products/${slugifyStr(cleanSlug)}/`;
}

export default getProductPath;
