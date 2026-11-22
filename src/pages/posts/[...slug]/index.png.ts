import { publishedPostFilter } from "@/utils/postFilter";
import { type CollectionEntry, getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { SITE } from "@/config";
import { generateOgImage } from "@/utils/generateOgImages";
import { getPath } from "@/utils/getPath";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection(
    "blog",
    (post) => publishedPostFilter(post) && !post.data.ogImage,
  );

  return posts.map((post) => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const post = props as CollectionEntry<"blog">;
  const dateStr = post.data.pubDatetime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const png = await generateOgImage({
    label: "Article",
    title: post.data.title,
    subtitle: dateStr,
  });

  return new Response(png as any, {
    headers: { "Content-Type": "image/png" },
  });
};
