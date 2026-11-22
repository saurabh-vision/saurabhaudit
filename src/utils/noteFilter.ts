import type { CollectionEntry } from "astro:content";
import { isNoteListed, isNotePublished } from "./noteVisibility.ts";

export const publishedNoteFilter = ({ data }: CollectionEntry<"notes">) =>
  isNotePublished(data, { preview: import.meta.env.DEV });

export const noteFilter = ({ data }: CollectionEntry<"notes">) =>
  isNoteListed(data, { preview: import.meta.env.DEV });

export default noteFilter;
