import { SITE } from "../config.ts";

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function getBreadcrumbItems(
  type:
    | "post"
    | "product"
    | "note"
    | "tag"
    | "note-tag"
    | "posts-list"
    | "products-list"
    | "notes-list"
    | "tags-list"
    | "note-tags-list",
  data: {
    title?: string;
    url?: string;
    tag?: string;
    tagName?: string;
    siteOrigin?: string;
  } = {},
): BreadcrumbItem[] {
  const origin = (data.siteOrigin ?? SITE.website).replace(/\/+$/, "");

  switch (type) {
    case "post":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Posts", url: `${origin}/posts/` },
        { name: data.title ?? "", ...(data.url ? { url: data.url } : {}) },
      ];
    case "product":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Products", url: `${origin}/products/` },
        { name: data.title ?? "", ...(data.url ? { url: data.url } : {}) },
      ];
    case "note":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Notes", url: `${origin}/notes/` },
        { name: data.title ?? "", ...(data.url ? { url: data.url } : {}) },
      ];
    case "tag":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Tags", url: `${origin}/tags/` },
        { name: data.tagName ?? data.tag ?? "", ...(data.url ? { url: data.url } : {}) },
      ];
    case "note-tag":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Notes", url: `${origin}/notes/` },
        { name: "Tags", url: `${origin}/notes/tags/` },
        { name: data.tagName ?? data.tag ?? "", ...(data.url ? { url: data.url } : {}) },
      ];
    case "posts-list":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Posts", ...(data.url ? { url: data.url } : {}) },
      ];
    case "products-list":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Products", ...(data.url ? { url: data.url } : {}) },
      ];
    case "notes-list":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Notes", ...(data.url ? { url: data.url } : {}) },
      ];
    case "tags-list":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Tags", ...(data.url ? { url: data.url } : {}) },
      ];
    case "note-tags-list":
      return [
        { name: "Home", url: `${origin}/` },
        { name: "Notes", url: `${origin}/notes/` },
        { name: "Tags", ...(data.url ? { url: data.url } : {}) },
      ];
  }
}
