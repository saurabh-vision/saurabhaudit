import assert from "node:assert/strict";
import test from "node:test";
import { formatOgTitle } from "../src/utils/og-templates/formatOgTitle.ts";

test("formatOgTitle handles short titles unchanged", () => {
  const title = "Simple Article Title";
  assert.equal(formatOgTitle(title), "Simple Article Title");
});

test("formatOgTitle truncates long titles cleanly at word boundary", () => {
  const longTitle =
    "This is an extremely long article title designed to exceed the normal threshold of one hundred and ten characters for Open Graph image display";
  const result = formatOgTitle(longTitle, 110);
  assert.ok(result.length <= 113, "Truncated title must be within length limits");
  assert.ok(result.endsWith("..."), "Truncated title must end with ellipsis");
  assert.doesNotMatch(result, /\s\.\.\.$/, "Ellipsis should not have leading dangling space");
});

test("formatOgTitle handles extremely long single words without crashing", () => {
  const longWord =
    "SupercalifragilisticexpialidociousPneumonoultramicroscopicsilicovolcanoconiosisAntidisestablishmentarianism";
  const result = formatOgTitle(longWord, 80);
  assert.ok(result.includes("\u200B") || result.endsWith("..."));
  assert.ok(result.length > 0);
});

test("formatOgTitle handles emojis and non-Latin unicode characters without corruption", () => {
  const emojiTitle = "🚀 High Performance Architecture with SQLite & Rust 🦀 (2026 Guide) ✨";
  const result = formatOgTitle(emojiTitle);
  assert.equal(result, emojiTitle);

  const cjkTitle = "分散システムのコンセンサスアルゴリズム入門 (Distributed Consensus)";
  const cjkResult = formatOgTitle(cjkTitle);
  assert.equal(cjkResult, cjkTitle);
});
