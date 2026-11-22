import assert from "node:assert/strict";
import test from "node:test";
import { getSubstackEmbedUrl, normalizeSubstackUrl } from "../src/utils/substack.ts";

test("normalizeSubstackUrl normalizes valid URLs and handles edge cases", () => {
  // Empty / missing values
  assert.equal(normalizeSubstackUrl(undefined), null);
  assert.equal(normalizeSubstackUrl(null), null);
  assert.equal(normalizeSubstackUrl(""), null);
  assert.equal(normalizeSubstackUrl("   "), null);

  // Normalization of slashes and spaces
  assert.equal(
    normalizeSubstackUrl("https://howsystemsscale.substack.com/"),
    "https://howsystemsscale.substack.com",
  );
  assert.equal(
    normalizeSubstackUrl("https://howsystemsscale.substack.com///"),
    "https://howsystemsscale.substack.com",
  );
  assert.equal(
    normalizeSubstackUrl("  https://howsystemsscale.substack.com/  "),
    "https://howsystemsscale.substack.com",
  );
  assert.equal(
    normalizeSubstackUrl("https://howsystemsscale.substack.com"),
    "https://howsystemsscale.substack.com",
  );
});

test("getSubstackEmbedUrl builds expected embed endpoint or returns null", () => {
  assert.equal(getSubstackEmbedUrl(undefined), null);
  assert.equal(getSubstackEmbedUrl(null), null);
  assert.equal(getSubstackEmbedUrl(""), null);
  assert.equal(getSubstackEmbedUrl("   "), null);

  assert.equal(
    getSubstackEmbedUrl("https://howsystemsscale.substack.com"),
    "https://howsystemsscale.substack.com/embed",
  );
  assert.equal(
    getSubstackEmbedUrl("https://howsystemsscale.substack.com/"),
    "https://howsystemsscale.substack.com/embed",
  );
  assert.equal(
    getSubstackEmbedUrl("https://howsystemsscale.substack.com///"),
    "https://howsystemsscale.substack.com/embed",
  );
});
