/**
 * Substack URL normalization and embed utilities.
 */

export function normalizeSubstackUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed || null;
}

export function getSubstackEmbedUrl(url?: string | null): string | null {
  const normalized = normalizeSubstackUrl(url);
  if (!normalized) return null;
  return `${normalized}/embed`;
}
