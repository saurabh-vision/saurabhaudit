import type { CollectionEntry } from "astro:content";
import noteFilter from "./noteFilter.ts";
import { slugifyStr } from "./slugify.ts";

export interface NoteTag {
  tag: string;
  tagName: string;
  count: number;
}

export function extractUniqueNoteTags<T extends { data: { tags: string[] } }>(
  notes: T[],
): NoteTag[] {
  const tags = new Map<string, NoteTag>();
  for (const note of notes) {
    for (const tagName of note.data.tags) {
      const tag = slugifyStr(tagName);
      const existing = tags.get(tag);
      if (existing) {
        existing.count += 1;
      } else {
        tags.set(tag, { tag, tagName, count: 1 });
      }
    }
  }
  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}

export const getUniqueNoteTags = (notes: CollectionEntry<"notes">[]): NoteTag[] => {
  return extractUniqueNoteTags(notes.filter(noteFilter));
};

export default getUniqueNoteTags;
