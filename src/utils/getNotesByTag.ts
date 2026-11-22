import type { CollectionEntry } from "astro:content";
import getSortedNotes, { sortNotes } from "./getSortedNotes.ts";
import { slugifyAll } from "./slugify.ts";

export function filterNotesByTag<T extends { data: { tags: string[]; pubDatetime: Date } }>(
  notes: T[],
  tag: string,
): T[] {
  return sortNotes(notes.filter((note) => slugifyAll(note.data.tags).includes(tag)));
}

export const getNotesByTag = (notes: CollectionEntry<"notes">[], tag: string) => {
  return getSortedNotes(notes.filter((note) => slugifyAll(note.data.tags).includes(tag)));
};

export default getNotesByTag;
