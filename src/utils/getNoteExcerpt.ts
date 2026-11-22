export function stripMarkdown(text: string): string {
  return (
    text
      // Remove fenced code blocks
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/~~~[\s\S]*?~~~/g, " ")
      // Inline code markers
      .replace(/`([^`]+)`/g, "$1")
      // Images: retain alt text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links: retain link text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Headings
      .replace(/^#{1,6}\s+/gm, "")
      // Blockquotes
      .replace(/^\s*>\s+/gm, "")
      // Bold / italic / strikethrough
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      // HTML tags
      .replace(/<[^>]+>/g, "")
      // Collapse whitespace and newlines
      .replace(/\s+/g, " ")
      .trim()
  );
}

export const EXCERPT_LENGTH = 155;

export function getNoteExcerpt(
  {
    title,
    description,
    body,
  }: {
    title: string;
    description?: string | null;
    body?: string | null;
  },
  maxLength = EXCERPT_LENGTH,
  ellipsis = "…",
): string {
  if (typeof description === "string" && description.trim().length > 0) {
    return description.trim();
  }

  const cleanText = stripMarkdown(body ?? "");
  if (!cleanText) {
    return title;
  }

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  const sub = cleanText.slice(0, maxLength);
  const lastSpace = sub.lastIndexOf(" ");
  const truncated = (lastSpace > 0 ? sub.slice(0, lastSpace) : sub).trim();

  return `${truncated}${ellipsis}`;
}

export default getNoteExcerpt;
