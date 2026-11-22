import { SITE } from "../config.ts";

export interface NotePublication {
  pubDatetime: Date;
  draft?: boolean;
  unlisted?: boolean;
}

export interface NotePublicationOptions {
  now?: number;
  preview?: boolean;
}

export function isNotePublished(
  data: NotePublication,
  { now = Date.now(), preview = false }: NotePublicationOptions = {},
): boolean {
  return !data.draft && (preview || now > data.pubDatetime.getTime() - SITE.scheduledPostMargin);
}

export function isNoteListed(data: NotePublication, options?: NotePublicationOptions): boolean {
  return !data.unlisted && isNotePublished(data, options);
}
