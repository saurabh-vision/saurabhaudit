import assert from "node:assert/strict";
import test from "node:test";
import { checkThinNote, isThinNote, THIN_NOTE_WORDS } from "../src/utils/isThinNote.ts";

test("isThinNote: below, at, and above THIN_NOTE_WORDS threshold", () => {
  // Below threshold: 30 words
  const belowBody = Array(30).fill("word").join(" ");
  const belowNote = { body: belowBody, data: { unlisted: false } };
  const belowResult = checkThinNote(belowNote);
  assert.equal(belowResult.isThin, true);
  assert.equal(belowResult.reason, "word-count");
  assert.equal(belowResult.wordCount, 30);
  assert.equal(isThinNote(belowNote), true);

  // Exactly at threshold: 50 words
  const atBody = Array(THIN_NOTE_WORDS).fill("word").join(" ");
  const atNote = { body: atBody, data: { unlisted: false } };
  const atResult = checkThinNote(atNote);
  assert.equal(atResult.isThin, false);
  assert.equal(atResult.reason, null);
  assert.equal(atResult.wordCount, 50);
  assert.equal(isThinNote(atNote), false);

  // Above threshold: 75 words
  const aboveBody = Array(75).fill("word").join(" ");
  const aboveNote = { body: aboveBody, data: { unlisted: false } };
  const aboveResult = checkThinNote(aboveNote);
  assert.equal(aboveResult.isThin, false);
  assert.equal(aboveResult.reason, null);
  assert.equal(aboveResult.wordCount, 75);
  assert.equal(isThinNote(aboveNote), false);
});

test("isThinNote: unlisted flagged with the unlisted reason even with many words", () => {
  const longBody = Array(120).fill("word").join(" ");
  const unlistedNote = { body: longBody, data: { unlisted: true } };
  const result = checkThinNote(unlistedNote);

  assert.equal(result.isThin, true);
  assert.equal(result.reason, "unlisted");
  assert.equal(result.wordCount, 120);
  assert.equal(isThinNote(unlistedNote), true);
});

test("isThinNote: code-block-only body counts only its prose words per strip rules", () => {
  // Fenced code blocks are stripped per getNoteExcerpt markdown strip rules.
  // A body containing only fenced code blocks yields 0 prose words, which is < 50 words.
  const codeOnlyBody = `
\`\`\`typescript
import { z } from "zod";

export function calculateMetrics(input: string): number {
  return input.split(" ").length;
}
\`\`\`
`;
  const codeOnlyNote = { body: codeOnlyBody, data: { unlisted: false } };
  const result = checkThinNote(codeOnlyNote);

  assert.equal(result.isThin, true);
  assert.equal(result.reason, "word-count");
  assert.equal(result.wordCount, 0);
  assert.equal(isThinNote(codeOnlyNote), true);
});
