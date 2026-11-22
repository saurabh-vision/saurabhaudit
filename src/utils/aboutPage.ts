/**
 * Thin-page decision helper for the About page.
 * Returns true (noindex) if bio is empty AND the MDX body renders no content.
 * Returns false (indexable) when either bio or MDX body has content.
 */
export function isAboutThinPage(bio?: string | null, mdxContent?: string | null): boolean {
  const hasBio = Boolean(bio && bio.trim() !== "" && !bio.trim().startsWith("TODO"));
  if (hasBio) return false;

  if (!mdxContent) return true;

  // Strip frontmatter, HTML comments, MDX JSX comments, and whitespace
  const stripped = mdxContent
    .replace(/---[\s\S]*?---/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .trim();

  return stripped.length === 0;
}
