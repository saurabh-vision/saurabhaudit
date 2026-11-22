import assert from "node:assert/strict";
import test from "node:test";
import { getNoteExcerpt, stripMarkdown } from "../src/utils/getNoteExcerpt.ts";
import { getNotePath } from "../src/utils/getNotePath.ts";
import { filterNotesByTag } from "../src/utils/getNotesByTag.ts";
import { sortNotes } from "../src/utils/getSortedNotes.ts";
import { extractUniqueNoteTags } from "../src/utils/getUniqueNoteTags.ts";
import { isNoteListed, isNotePublished } from "../src/utils/noteVisibility.ts";

test("noteVisibility: draft and future exclusion", () => {
  const now = new Date("2026-01-15T12:00:00Z").getTime();

  // Published note in the past
  const pastNote = {
    pubDatetime: new Date("2026-01-01T00:00:00Z"),
    draft: false,
    unlisted: false,
  };
  assert.equal(isNotePublished(pastNote, { now }), true);
  assert.equal(isNoteListed(pastNote, { now }), true);

  // Draft note
  const draftNote = {
    pubDatetime: new Date("2026-01-01T00:00:00Z"),
    draft: true,
    unlisted: false,
  };
  assert.equal(isNotePublished(draftNote, { now }), false);
  assert.equal(isNoteListed(draftNote, { now }), false);

  // Future scheduled note
  const futureNote = {
    pubDatetime: new Date("2026-02-01T00:00:00Z"),
    draft: false,
    unlisted: false,
  };
  assert.equal(isNotePublished(futureNote, { now }), false);
  assert.equal(isNoteListed(futureNote, { now }), false);

  // Future note in preview mode
  assert.equal(isNotePublished(futureNote, { now, preview: true }), true);
});

test("noteVisibility: unlisted handling", () => {
  const now = new Date("2026-01-15T12:00:00Z").getTime();
  const unlistedNote = {
    pubDatetime: new Date("2026-01-01T00:00:00Z"),
    draft: false,
    unlisted: true,
  };

  // Unlisted note is published (gets a standalone page) but NOT listed (omitted from feeds/lists)
  assert.equal(isNotePublished(unlistedNote, { now }), true);
  assert.equal(isNoteListed(unlistedNote, { now }), false);
});

test("sortNotes: orders pubDatetime descending", () => {
  const note1 = { id: "note-1", data: { pubDatetime: new Date("2026-01-01") } };
  const note2 = { id: "note-2", data: { pubDatetime: new Date("2026-03-01") } };
  const note3 = { id: "note-3", data: { pubDatetime: new Date("2026-02-01") } };

  const sorted = sortNotes([note1, note2, note3]);
  assert.equal(sorted[0].id, "note-2");
  assert.equal(sorted[1].id, "note-3");
  assert.equal(sorted[2].id, "note-1");
});

test("getNotePath: returns /notes/<slug>/", () => {
  assert.equal(getNotePath("my-til-note"), "/notes/my-til-note/");
  assert.equal(getNotePath("my-til-note.md"), "/notes/my-til-note/");
  assert.equal(getNotePath("sub/nested-note.mdx"), "/notes/nested-note/");
});

test("note tags: extractUniqueNoteTags and filterNotesByTag", () => {
  const notes = [
    {
      id: "note-1",
      data: {
        tags: ["TypeScript", "Web Dev"],
        pubDatetime: new Date("2026-01-01"),
      },
    },
    {
      id: "note-2",
      data: {
        tags: ["TypeScript", "Astro"],
        pubDatetime: new Date("2026-01-02"),
      },
    },
    {
      id: "note-3",
      data: {
        tags: ["Astro"],
        pubDatetime: new Date("2026-01-03"),
      },
    },
  ];

  const uniqueTags = extractUniqueNoteTags(notes);
  assert.equal(uniqueTags.length, 3);
  // Alphabetical by slug: astro, type-script, web-dev
  assert.equal(uniqueTags[0].tag, "astro");
  assert.equal(uniqueTags[0].count, 2);
  assert.equal(uniqueTags[1].tag, "type-script");
  assert.equal(uniqueTags[1].count, 2);
  assert.equal(uniqueTags[2].tag, "web-dev");
  assert.equal(uniqueTags[2].count, 1);

  const astroNotes = filterNotesByTag(notes, "astro");
  assert.equal(astroNotes.length, 2);
  // Sorted descending by pubDatetime: note-3 (Jan 3) then note-2 (Jan 2)
  assert.equal(astroNotes[0].id, "note-3");
  assert.equal(astroNotes[1].id, "note-2");
});

test("getNoteExcerpt: description passthrough", () => {
  const excerpt = getNoteExcerpt({
    title: "Sample Note",
    description: "Explicit custom summary description.",
    body: "Long body text that should be ignored when description is set.",
  });
  assert.equal(excerpt, "Explicit custom summary description.");
});

test("getNoteExcerpt: markdown stripping on complex fixture", () => {
  const fixtureBody = `
# Main Heading

Here is some **bold text** and *italic emphasis* along with ~~strikethrough~~.

Check out [this link](https://example.com/target) and inline \`const code = true;\`.

\`\`\`typescript
function ignoredCodeBlock() {
  return "ignore me entirely";
}
\`\`\`

> A wise blockquote here.

<p>HTML paragraph tag</p>

![Alt image text](https://example.com/image.png)
`;

  const stripped = stripMarkdown(fixtureBody);
  assert.ok(!stripped.includes("# Main Heading"));
  assert.ok(stripped.includes("Main Heading"));
  assert.ok(!stripped.includes("**bold text**"));
  assert.ok(stripped.includes("bold text"));
  assert.ok(!stripped.includes("ignoredCodeBlock"));
  assert.ok(!stripped.includes("https://example.com/target"));
  assert.ok(stripped.includes("this link"));
  assert.ok(!stripped.includes("<p>"));
  assert.ok(!stripped.includes("https://example.com/image.png"));
});

test("getNoteExcerpt: word boundary truncation and ellipsis", () => {
  const longBody =
    "In web development, optimizing page load performance requires understanding the critical rendering path, eliminating render blocking resources, and compressing static assets effectively for end users across various mobile networks.";

  // When length > maxLength (e.g. 80 chars)
  const shortExcerpt = getNoteExcerpt({ title: "Performance Tip", body: longBody }, 80);
  assert.ok(shortExcerpt.length <= 81); // 80 chars max + ellipsis
  assert.ok(shortExcerpt.endsWith("…") || shortExcerpt.endsWith("..."));
  // Ensure no word is cut in half
  assert.ok(!shortExcerpt.includes("understa…") && !shortExcerpt.includes("understa..."));

  // Short body: no ellipsis when not truncated
  const shortBody = "Short concise note body.";
  const fullExcerpt = getNoteExcerpt({ title: "Short Tip", body: shortBody }, 155);
  assert.equal(fullExcerpt, "Short concise note body.");
  assert.equal(fullExcerpt.endsWith("…"), false);

  // Empty body fallback to title
  const emptyBodyExcerpt = getNoteExcerpt({
    title: "Fallback Title When Body Empty",
    body: "",
  });
  assert.equal(emptyBodyExcerpt, "Fallback Title When Body Empty");

  const whitespaceOnlyExcerpt = getNoteExcerpt({
    title: "Fallback Title Whitespace Only",
    body: "   \n\n  ```\ncode\n```  \n",
  });
  assert.equal(whitespaceOnlyExcerpt, "Fallback Title Whitespace Only");
});
