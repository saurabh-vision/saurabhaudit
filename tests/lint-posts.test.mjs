import assert from "node:assert/strict";
import test from "node:test";
import { lintPost, parseFrontmatter } from "../scripts/lint-posts.mjs";

test("lintPost passes for a valid published article", () => {
  const content = `---
title: "Distributed Systems Consensus and Leader Election"
description: "A comprehensive guide to understanding consensus algorithms, quorum slices, and fault-tolerant leader election."
pubDatetime: 2026-01-01T00:00:00Z
tags:
  - "distributed-systems"
  - "architecture"
---

## Key Takeaways

Understanding leader election requires balancing partition tolerance with availability and latency guarantees.

## Consensus Mechanics

In distributed architectures, consensus ensures nodes agree on state changes even in the presence of network partitions.

![Consensus state machine diagram](/assets/img/diagram.png)

\`\`\`ts
// Code block comment with hash does not trigger H1 check
# comment inside code
function electLeader(): boolean {
  return true;
}
\`\`\`

## Summary

Consensus algorithms form the foundation of scalable distributed databases and coordinator services.
`;

  const { frontmatter, body } = parseFrontmatter(content);
  const result = lintPost({
    filePath: "src/content/blog/distributed-systems.md",
    frontmatter,
    body,
    allPosts: [],
  });

  assert.equal(result.skipped, false);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test("lintPost skips draft posts completely even with errors", () => {
  const content = `---
title: "Draft"
description: "Short"
draft: true
tags:
  - "others"
---

# H1 In Body That Would Normally Fail
![](empty-alt.png)
`;

  const { frontmatter, body } = parseFrontmatter(content);
  const result = lintPost({
    filePath: "src/content/blog/draft.md",
    frontmatter,
    body,
    allPosts: [],
  });

  assert.equal(result.skipped, true);
  assert.deepEqual(result.errors, []);
});

test("lintPost fails on missing, too short, or too long description", () => {
  // Short description (<50 chars)
  const shortContent = `---
title: "Valid Post Title"
description: "Too short description."
tags: ["systems"]
---

## Section
Content with enough words to satisfy word count check across multiple sentences for testing purposes.
`;
  const { frontmatter: fmShort, body: bodyShort } = parseFrontmatter(shortContent);
  const resultShort = lintPost({ filePath: "test.md", frontmatter: fmShort, body: bodyShort });
  assert.ok(resultShort.errors.some((err) => err.includes("Description is too short")));

  // Long description (>160 chars)
  const longDesc = "A".repeat(161);
  const longContent = `---
title: "Valid Post Title"
description: "${longDesc}"
tags: ["systems"]
---

## Section
Content with enough words to satisfy word count check across multiple sentences for testing purposes.
`;
  const { frontmatter: fmLong, body: bodyLong } = parseFrontmatter(longContent);
  const resultLong = lintPost({ filePath: "test.md", frontmatter: fmLong, body: bodyLong });
  assert.ok(resultLong.errors.some((err) => err.includes("Description is too long")));
});

test("lintPost validates title length thresholds (warn 61-70, fail >70)", () => {
  // 65 chars title: warning only
  const warnTitle = "A".repeat(65);
  const warnContent = `---
title: "${warnTitle}"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags: ["systems"]
---

## Section
Content with enough words to satisfy word count check across multiple sentences for testing purposes.
`;
  const { frontmatter: fmWarn, body: bodyWarn } = parseFrontmatter(warnContent);
  const resultWarn = lintPost({ filePath: "test.md", frontmatter: fmWarn, body: bodyWarn });
  assert.equal(resultWarn.errors.length, 0);
  assert.ok(resultWarn.warnings.some((w) => w.includes("recommended <= 60 chars")));

  // 75 chars title: failure
  const failTitle = "A".repeat(75);
  const failContent = `---
title: "${failTitle}"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags: ["systems"]
---

## Section
Content with enough words to satisfy word count check across multiple sentences for testing purposes.
`;
  const { frontmatter: fmFail, body: bodyFail } = parseFrontmatter(failContent);
  const resultFail = lintPost({ filePath: "test.md", frontmatter: fmFail, body: bodyFail });
  assert.ok(resultFail.errors.some((err) => err.includes("Title is too long")));
});

test("lintPost fails on H1 headings in markdown body", () => {
  const content = `---
title: "Valid Post Title"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags: ["systems"]
---

# Extra H1 Heading In Body

## Valid H2
Content with enough words to satisfy word count check across multiple sentences for testing purposes.
`;
  const { frontmatter, body } = parseFrontmatter(content);
  const result = lintPost({ filePath: "test.md", frontmatter, body });
  assert.ok(result.errors.some((err) => err.includes("Body contains an H1 heading")));
});

test("lintPost fails on empty image alt text in markdown or HTML", () => {
  const mdImgContent = `---
title: "Valid Post Title"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags: ["systems"]
---

## Section
![](https://example.com/missing-alt.png)
`;
  const { frontmatter: fmMd, body: bodyMd } = parseFrontmatter(mdImgContent);
  const resultMd = lintPost({ filePath: "test.md", frontmatter: fmMd, body: bodyMd });
  assert.ok(resultMd.errors.some((err) => err.includes("empty alt text")));

  const htmlImgContent = `---
title: "Valid Post Title"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags: ["systems"]
---

## Section
<img src="test.png" alt="" />
`;
  const { frontmatter: fmHtml, body: bodyHtml } = parseFrontmatter(htmlImgContent);
  const resultHtml = lintPost({ filePath: "test.md", frontmatter: fmHtml, body: bodyHtml });
  assert.ok(resultHtml.errors.some((err) => err.includes("missing or empty alt attribute")));
});

test("lintPost detects duplicate titles and descriptions across posts", () => {
  const post1 = {
    filePath: "src/content/blog/post-1.md",
    frontmatter: {
      title: "Shared Title Across Posts",
      description:
        "Shared description that is easily between fifty and one hundred sixty characters in total length.",
      tags: ["systems"],
    },
    body: "## Section\nWords words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words.",
  };

  const post2 = {
    filePath: "src/content/blog/post-2.md",
    frontmatter: {
      title: "shared title across posts",
      description:
        "Shared description that is easily between fifty and one hundred sixty characters in total length.",
      tags: ["systems"],
    },
    body: "## Section\nWords words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words.",
  };

  const result = lintPost({
    filePath: post2.filePath,
    frontmatter: post2.frontmatter,
    body: post2.body,
    allPosts: [post1, post2],
  });

  assert.ok(result.errors.some((err) => err.includes("Duplicate title")));
  assert.ok(result.errors.some((err) => err.includes("Duplicate description")));
});

test("lintPost warns on 'others' tag and non-kebab-case tags", () => {
  const content = `---
title: "Valid Post Title"
description: "This is a valid meta description that is easily between fifty and one hundred sixty characters in total length."
tags:
  - "others"
  - "camelCaseTag"
---

## Section
Words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words words.
`;
  const { frontmatter, body } = parseFrontmatter(content);
  const result = lintPost({ filePath: "test.md", frontmatter, body });
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((w) => w.includes('Tag "camelCaseTag" is not kebab-case')));
  assert.ok(
    result.warnings.some(
      (w) => w.includes('Tags equal to only default "others"') || w.includes("kebab-case"),
    ),
  );
});
