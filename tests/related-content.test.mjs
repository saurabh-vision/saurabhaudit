import assert from "node:assert/strict";
import test from "node:test";
import {
  extractKeywords,
  scoreRelated,
  getRelatedContent,
} from "../src/utils/getRelatedContent.ts";

test("extractKeywords removes stop words and punctuation", () => {
  const keywords = extractKeywords("How to Build a Modern Static Site with Astro and SEO!");
  assert.equal(keywords.has("how"), false);
  assert.equal(keywords.has("to"), false);
  assert.equal(keywords.has("a"), false);
  assert.equal(keywords.has("and"), false);
  assert.equal(keywords.has("with"), false);
  assert.equal(keywords.has("build"), true);
  assert.equal(keywords.has("modern"), true);
  assert.equal(keywords.has("static"), true);
  assert.equal(keywords.has("site"), true);
  assert.equal(keywords.has("astro"), true);
  assert.equal(keywords.has("seo"), true);
});

test("scoreRelated computes points correctly: same type = 1, tags = 3, keywords = 0.5 (max 3)", () => {
  const current = {
    type: "Article",
    slug: "post-1",
    title: "Building Scalable Web Architecture",
    tags: ["architecture", "scaling", "web"],
  };

  // Same type (1) + no shared tags (0) + no shared keywords (0) = 1
  const candSameTypeOnly = {
    type: "Article",
    slug: "post-2",
    title: "Learning Rust Basics",
    tags: ["rust"],
    pubDatetime: new Date("2026-01-01"),
    href: "/posts/post-2",
    description: "Rust basics",
  };
  assert.equal(scoreRelated(current, candSameTypeOnly), 1);

  // Different type (0) + 1 shared tag (3) = 3
  const candDiffTypeSharedTag = {
    type: "Product",
    slug: "product-1",
    title: "Rust Toolkit",
    tags: ["architecture"],
    pubDatetime: new Date("2026-01-01"),
    href: "/products/product-1",
    description: "A toolkit",
  };
  assert.equal(scoreRelated(current, candDiffTypeSharedTag), 3);

  // Different type (0) + 2 shared tags (6) + 2 shared keywords ("scalable", "architecture" -> 1.0) = 7
  const candKeywordMatch = {
    type: "Product",
    slug: "product-2",
    title: "Scalable Architecture Tool",
    tags: ["architecture", "scaling"],
    pubDatetime: new Date("2026-01-01"),
    href: "/products/product-2",
    description: "Tool description",
  };
  assert.equal(scoreRelated(current, candKeywordMatch), 7);

  // Keywords capped at 3 (max 1.5)
  const candManyKeywords = {
    type: "Note",
    slug: "note-1",
    title: "Building Scalable Web Architecture Systems",
    tags: [],
    pubDatetime: new Date("2026-01-01"),
    href: "/notes/note-1",
    description: "Note description",
  };
  // 4 shared keywords ("building", "scalable", "web", "architecture"), max 3 counted => 1.5
  assert.equal(scoreRelated(current, candManyKeywords), 1.5);
});

test("getRelatedContent enforces minimum cutoff of 1 and exclusions", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const current = {
    type: "Article",
    slug: "current-post",
    title: "Alpha Article",
    tags: ["alpha"],
    pubDatetime: new Date("2026-05-01"),
  };

  const pool = [
    // 1. Self: same type and slug -> excluded
    {
      type: "Article",
      slug: "current-post",
      title: "Alpha Article",
      tags: ["alpha"],
      pubDatetime: new Date("2026-05-01"),
      href: "/posts/current-post",
      description: "Self",
    },
    // 2. Draft -> excluded
    {
      type: "Article",
      slug: "draft-post",
      title: "Draft Article",
      tags: ["alpha"],
      draft: true,
      pubDatetime: new Date("2026-04-01"),
      href: "/posts/draft-post",
      description: "Draft",
    },
    // 3. Unlisted -> excluded
    {
      type: "Note",
      slug: "unlisted-note",
      title: "Unlisted Note",
      tags: ["alpha"],
      unlisted: true,
      pubDatetime: new Date("2026-04-01"),
      href: "/notes/unlisted-note",
      description: "Unlisted",
    },
    // 4. Thin -> excluded
    {
      type: "Product",
      slug: "thin-product",
      title: "Thin Product",
      tags: ["alpha"],
      isThin: true,
      pubDatetime: new Date("2026-04-01"),
      href: "/products/thin-product",
      description: "Thin",
    },
    // 5. Future dated -> excluded
    {
      type: "Article",
      slug: "future-post",
      title: "Future Article",
      tags: ["alpha"],
      pubDatetime: new Date("2026-07-01"),
      href: "/posts/future-post",
      description: "Future",
    },
    // 6. Score < 1 (diff type, no shared tags, no shared keywords) -> excluded
    {
      type: "Product",
      slug: "unrelated-product",
      title: "Zeta Widget",
      tags: ["zeta"],
      pubDatetime: new Date("2026-04-01"),
      href: "/products/unrelated-product",
      description: "Zero score",
    },
    // 7. Valid candidate
    {
      type: "Article",
      slug: "valid-post",
      title: "Beta Article",
      tags: ["alpha"],
      pubDatetime: new Date("2026-04-01"),
      href: "/posts/valid-post",
      description: "Valid candidate",
    },
  ];

  const results = getRelatedContent(current, pool, 3, now);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "Beta Article");
  assert.equal(results[0].score, 4.5); // same type (1) + shared tag (3) + shared keyword "article" (0.5)
});

test("getRelatedContent sorts by score desc, then pubDatetime desc, then slug asc", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const current = {
    type: "Article",
    slug: "current-post",
    title: "Core Topic",
    tags: ["core"],
    pubDatetime: new Date("2026-05-01"),
  };

  const pool = [
    // Candidate A: score = 1 (same type), older date
    {
      type: "Article",
      slug: "post-a",
      title: "Post A",
      tags: ["other"],
      pubDatetime: new Date("2026-02-01"),
      href: "/posts/post-a",
      description: "Post A",
    },
    // Candidate B: score = 4 (same type + 1 shared tag), date = March
    {
      type: "Article",
      slug: "post-b",
      title: "Post B",
      tags: ["core"],
      pubDatetime: new Date("2026-03-01"),
      href: "/posts/post-b",
      description: "Post B",
    },
    // Candidate C: score = 4 (same type + 1 shared tag), date = April (newer than B)
    {
      type: "Article",
      slug: "post-c",
      title: "Post C",
      tags: ["core"],
      pubDatetime: new Date("2026-04-01"),
      href: "/posts/post-c",
      description: "Post C",
    },
    // Candidate D: score = 4 (same type + 1 shared tag), date = April (same date as C, slug 'post-d' > 'post-c')
    {
      type: "Article",
      slug: "post-d",
      title: "Post D",
      tags: ["core"],
      pubDatetime: new Date("2026-04-01"),
      href: "/posts/post-d",
      description: "Post D",
    },
  ];

  const results = getRelatedContent(current, pool, 3, now);
  assert.equal(results.length, 3);
  // C and D have score 4 and pubDatetime 2026-04-01, C comes before D alphabetically
  assert.equal(results[0].title, "Post C");
  assert.equal(results[1].title, "Post D");
  // B has score 4 but older date 2026-03-01
  assert.equal(results[2].title, "Post B");
});
