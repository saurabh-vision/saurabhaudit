import assert from "node:assert/strict";
import test from "node:test";
import { createNoteSchema } from "../src/utils/noteSchema.ts";

const schema = createNoteSchema();

const validNote = {
  title: "Understanding TypeScript Satisfies Operator",
  description:
    "A quick micro-note on how the satisfies operator validates types while preserving exact literal types.",
  pubDatetime: new Date("2026-01-01"),
  tags: ["typescript", "til"],
  sourceUrl: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html",
  sourceTitle: "TypeScript 4.9 Release Notes",
  draft: false,
  unlisted: false,
};

test("notes schema validation", () => {
  // 1. Valid full note passes
  assert.doesNotThrow(() => schema.parse(validNote));

  // 2. Missing title fails
  const missingTitle = { ...validNote };
  delete missingTitle.title;
  assert.throws(() => schema.parse(missingTitle));

  // 3. Title > 100 chars fails
  const longTitle = {
    ...validNote,
    title: "A".repeat(101),
  };
  assert.throws(() => schema.parse(longTitle));

  // Title <= 100 passes
  const maxTitle = {
    ...validNote,
    title: "A".repeat(100),
  };
  assert.doesNotThrow(() => schema.parse(maxTitle));

  // 4. Description > 160 chars fails
  const longDesc = {
    ...validNote,
    description: "A".repeat(161),
  };
  assert.throws(() => schema.parse(longDesc));

  // Description <= 160 passes
  const maxDesc = {
    ...validNote,
    description: "A".repeat(160),
  };
  assert.doesNotThrow(() => schema.parse(maxDesc));

  // 5. http: sourceUrl fails
  const httpSource = {
    ...validNote,
    sourceUrl: "http://insecure.example.com",
  };
  assert.throws(() => schema.parse(httpSource));

  // 6. javascript: sourceUrl fails
  const jsSource = {
    ...validNote,
    sourceUrl: "javascript:alert(1)",
  };
  assert.throws(() => schema.parse(jsSource));

  // 7. sourceTitle without sourceUrl fails
  const sourceTitleOnly = {
    ...validNote,
    sourceUrl: undefined,
    sourceTitle: "Some External Article",
  };
  assert.throws(() => schema.parse(sourceTitleOnly));

  // 8. Defaults apply: tags [], draft false, unlisted false
  const minimalNote = {
    title: "Minimal Note Title",
    pubDatetime: new Date("2026-01-01"),
  };
  const parsed = schema.parse(minimalNote);
  assert.deepEqual(parsed.tags, []);
  assert.equal(parsed.draft, false);
  assert.equal(parsed.unlisted, false);
});
