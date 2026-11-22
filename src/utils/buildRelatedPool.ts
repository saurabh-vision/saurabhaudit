import { getCollection } from "astro:content";
import type { PoolItem } from "./getRelatedContent";
import postFilter from "./postFilter";
import productFilter from "./productFilter";
import { publishedNoteFilter } from "./noteFilter";
import { getPath } from "./getPath";
import { getProductPath } from "./getProductPath";
import { getNotePath } from "./getNotePath";
import { getNoteExcerpt } from "./getNoteExcerpt";
import { checkThinNote } from "./isThinNote";
import { slugifyStr } from "./slugify";

export async function getRelatedPool(): Promise<PoolItem[]> {
  const [posts, products, notes] = await Promise.all([
    getCollection("blog", postFilter),
    getCollection("products", productFilter),
    getCollection("notes", publishedNoteFilter),
  ]);

  const pool: PoolItem[] = [];

  for (const post of posts) {
    pool.push({
      type: "Article",
      slug: post.id,
      title: post.data.title,
      href: getPath(post.id, post.filePath, true),
      description: post.data.description,
      pubDatetime: post.data.pubDatetime,
      tags: post.data.tags,
      draft: post.data.draft,
    });
  }

  for (const product of products) {
    const hasContent = Boolean(product.body && product.body.trim().length > 0);
    const isThin =
      (product.data.status === "building" || product.data.status === "coming-soon") && !hasContent;
    const slug = slugifyStr(
      product.id
        .split("/")
        .at(-1)
        ?.replace(/\.(md|mdx)$/, "") ?? product.id,
    );

    pool.push({
      type: "Product",
      slug,
      title: product.data.title,
      href: getProductPath(product.id),
      description: product.data.description,
      pubDatetime: product.data.pubDatetime,
      tags: product.data.tags,
      draft: product.data.draft,
      isThin,
    });
  }

  for (const note of notes) {
    const thinCheck = checkThinNote(note);
    const slug = slugifyStr(
      note.id
        .split("/")
        .at(-1)
        ?.replace(/\.(md|mdx)$/, "") ?? note.id,
    );
    const description = getNoteExcerpt({
      title: note.data.title,
      description: note.data.description,
      body: note.body,
    });

    pool.push({
      type: "Note",
      slug,
      title: note.data.title,
      href: getNotePath(note.id),
      description,
      pubDatetime: note.data.pubDatetime,
      tags: note.data.tags,
      draft: note.data.draft,
      unlisted: note.data.unlisted,
      isThin: thinCheck.isThin,
    });
  }

  return pool;
}
