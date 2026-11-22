import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { generateOgImage } from "@/utils/generateOgImages";
import { publishedNoteFilter } from "@/utils/noteFilter";
import { slugifyStr } from "@/utils/slugify";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const notes = await getCollection(
    "notes",
    (note) => publishedNoteFilter(note) && !note.data.ogImage,
  );

  return notes.map((note) => {
    const slug = slugifyStr(
      note.id
        .split("/")
        .at(-1)
        ?.replace(/\.(md|mdx)$/, "") ?? note.id,
    );
    return {
      params: { slug },
      props: note,
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const note = props as CollectionEntry<"notes">;
  const dateStr = note.data.pubDatetime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const png = await generateOgImage({
    label: "Note",
    title: note.data.title,
    subtitle: dateStr,
  });

  return new Response(png as any, {
    headers: { "Content-Type": "image/png" },
  });
};
