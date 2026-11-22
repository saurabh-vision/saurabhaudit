import type { CollectionEntry } from "astro:content";
import noteFilter from "./noteFilter.ts";

export function sortNotes<T extends { data: { pubDatetime: Date } }>(notes: T[]): T[] {
  return [...notes].sort(
    (a, b) =>
      Math.floor(b.data.pubDatetime.getTime() / 1000) -
      Math.floor(a.data.pubDatetime.getTime() / 1000),
  );
}

export const getSortedNotes = (notes: CollectionEntry<"notes">[]) => {
  return sortNotes(notes.filter(noteFilter));
};

export default getSortedNotes;
