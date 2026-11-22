import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE } from "@/config";
import { getNoteExcerpt } from "@/utils/getNoteExcerpt";
import { getNotePath } from "@/utils/getNotePath";
import getSortedNotes from "@/utils/getSortedNotes";
import isThinNote from "@/utils/isThinNote";
import noteFilter from "@/utils/noteFilter";

export async function GET(context: { site?: URL; url: URL }) {
  const notes = await getCollection("notes", noteFilter);
  const eligibleNotes = getSortedNotes(notes).filter((n) => !isThinNote(n));

  const siteOrigin = context.site?.origin ?? SITE.website ?? context.url.origin;

  return rss({
    title: `${SITE.title} Notes`,
    description: SITE.desc,
    site: siteOrigin,
    customData: `<language>en</language>`,
    items: eligibleNotes.slice(0, 50).map((note) => ({
      link: new URL(getNotePath(note.id), siteOrigin).href,
      title: note.data.title,
      description: getNoteExcerpt({
        title: note.data.title,
        description: note.data.description,
        body: note.body,
      }),
      pubDate: new Date(note.data.modDatetime ?? note.data.pubDatetime),
    })),
  });
}
