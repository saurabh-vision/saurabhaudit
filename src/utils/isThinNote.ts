import { stripMarkdown } from "./getNoteExcerpt.ts";

export const THIN_NOTE_WORDS = 50;

export type ThinNoteReason = "word-count" | "unlisted" | null;

export interface ThinNoteResult {
  isThin: boolean;
  reason: ThinNoteReason;
  wordCount: number;
}

/**
 * Checks whether a note is considered "thin" for indexing purposes.
 * A note is thin if it has fewer than THIN_NOTE_WORDS prose words in the stripped body,
 * or if unlisted is true (for search engine indexing purposes).
 * Returns distinguishable reasons ("word-count" vs "unlisted").
 */
export function checkThinNote(
  note: { body?: string | null; data?: { unlisted?: boolean } },
  threshold = THIN_NOTE_WORDS,
): ThinNoteResult {
  const isUnlisted = Boolean(note.data?.unlisted);
  const stripped = stripMarkdown(note.body ?? "");
  const wordCount = stripped.length > 0 ? stripped.split(/\s+/).filter(Boolean).length : 0;

  if (isUnlisted) {
    return { isThin: true, reason: "unlisted", wordCount };
  }

  if (wordCount < threshold) {
    return { isThin: true, reason: "word-count", wordCount };
  }

  return { isThin: false, reason: null, wordCount };
}

export function isThinNote(
  note: { body?: string | null; data?: { unlisted?: boolean } },
  threshold = THIN_NOTE_WORDS,
): boolean {
  return checkThinNote(note, threshold).isThin;
}

export default isThinNote;
