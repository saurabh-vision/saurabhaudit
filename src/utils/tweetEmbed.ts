/**
 * Detects whether content contains a Twitter/X tweet embed.
 * Checks for the markup produced by remarkEmbeds (<blockquote class="twitter-tweet">)
 * as well as raw tweet shortcodes.
 */
export function hasTweetEmbed(content?: string): boolean {
  if (!content) return false;
  return (
    content.includes("twitter-tweet") ||
    /\{%\s*twitter\b/i.test(content) ||
    /<TwitterEmbed\b/i.test(content)
  );
}
