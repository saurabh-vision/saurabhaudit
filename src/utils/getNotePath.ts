import { slugifyStr } from "./slugify.ts";

export function getNotePath(idOrSlug: string): string {
  const slug = idOrSlug.split("/").at(-1) ?? idOrSlug;
  const cleanSlug = slug.replace(/\.(md|mdx)$/, "");
  return `/notes/${slugifyStr(cleanSlug)}/`;
}

export default getNotePath;
