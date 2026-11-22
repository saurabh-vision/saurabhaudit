import assert from "node:assert/strict";
import test from "node:test";
import { isAboutThinPage } from "../src/utils/aboutPage.ts";

test("isAboutThinPage correctly identifies thin pages vs indexable pages", () => {
  // 1. bio empty + body empty -> thin (noindex = true)
  assert.equal(isAboutThinPage("", ""), true);
  assert.equal(isAboutThinPage(null, null), true);
  assert.equal(isAboutThinPage(undefined, undefined), true);
  assert.equal(isAboutThinPage("TODO", "   "), true);
  assert.equal(
    isAboutThinPage("", "<!-- Write your About text here, or set SITE.bio in src/config.ts. -->"),
    true,
  );
  assert.equal(
    isAboutThinPage("", "{/* Write your About text here, or set SITE.bio in src/config.ts. */}"),
    true,
  );
  assert.equal(
    isAboutThinPage(
      "TODO",
      `---
title: "About"
---

{/* Write your About text here */}`,
    ),
    true,
  );

  // 2. bio set + body empty -> indexable (noindex = false)
  assert.equal(
    isAboutThinPage("Software engineer and SEO auditor.", "{/* Write your About text here */}"),
    false,
  );
  assert.equal(isAboutThinPage("Bio content here", ""), false);

  // 3. bio empty + body set -> indexable (noindex = false)
  assert.equal(
    isAboutThinPage(
      "",
      `---
title: "About"
---

Hello, I am a web engineer based in California.`,
    ),
    false,
  );
  assert.equal(isAboutThinPage("TODO", "<p>Real bio content inside the MDX body.</p>"), false);

  // 4. bio set + body set -> indexable (noindex = false)
  assert.equal(
    isAboutThinPage("Configured bio text", "Additional paragraphs from MDX body."),
    false,
  );
});
