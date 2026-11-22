export function formatOgTitle(title: string, maxChars = 110): string {
  if (!title) return "";
  const trimmed = title.trim();

  // If title has extremely long words (> 28 chars without space or hyphen), break them
  const words = trimmed.split(" ");
  const brokenWords = words.map((w) => {
    if (w.length > 28) {
      return w.match(/.{1,24}/g)?.join("\u200B") ?? w;
    }
    return w;
  });
  const processed = brokenWords.join(" ");

  if (processed.length <= maxChars) {
    return processed;
  }

  // Truncate at word boundary
  const sub = processed.slice(0, maxChars);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.65) {
    return `${sub.slice(0, lastSpace)}...`;
  }
  return `${sub}...`;
}
