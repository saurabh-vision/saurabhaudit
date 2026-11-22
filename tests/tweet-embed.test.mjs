import assert from "node:assert/strict";
import test from "node:test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { remarkEmbeds } from "../src/utils/remarkEmbeds.mjs";
import { hasTweetEmbed } from "../src/utils/tweetEmbed.ts";

test("hasTweetEmbed accurately detects tweet shortcodes and rendered markup", async () => {
  // Raw shortcode in markdown (used in post.body)
  const rawTweetMarkdown =
    "Check out this update:\n\n{% twitter https://x.com/saurabhvsn/status/1234567890 %}\n";
  assert.equal(hasTweetEmbed(rawTweetMarkdown), true);

  // Legacy <TwitterEmbed id="..." /> tag
  const legacyEmbedMarkdown = 'Old format:\n\n<TwitterEmbed id="1234567890" />\n';
  assert.equal(hasTweetEmbed(legacyEmbedMarkdown), true);

  // Rendered blockquote output from remarkEmbeds
  const renderer = createMarkdownProcessor({
    remarkPlugins: [remarkEmbeds],
    syntaxHighlight: false,
  });
  const renderedHtml = (await (await renderer).render(rawTweetMarkdown)).code;
  assert.match(renderedHtml, /blockquote class="twitter-tweet"/);
  assert.equal(hasTweetEmbed(renderedHtml), true);

  // Regular post without tweet
  const standardPost = "# Just a Title\n\nSome standard prose and a [link](https://example.com).";
  assert.equal(hasTweetEmbed(standardPost), false);

  // YouTube embed only
  const youtubeMarkdown = "{% youtube https://www.youtube.com/watch?v=2OuQarA0a7I %}";
  assert.equal(hasTweetEmbed(youtubeMarkdown), false);

  // Edge cases
  assert.equal(hasTweetEmbed(""), false);
  assert.equal(hasTweetEmbed(undefined), false);
});
