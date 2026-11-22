import { slugifyStr } from "./slugify.ts";

export const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

export interface PoolItem {
  type: "Article" | "Product" | "Note";
  slug: string;
  title: string;
  href: string;
  description: string;
  pubDatetime: Date;
  tags?: string[];
  draft?: boolean;
  unlisted?: boolean;
  isThin?: boolean;
}

export interface RelatedItem {
  type: "Article" | "Product" | "Note";
  title: string;
  href: string;
  description: string;
  score: number;
}

export function extractKeywords(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function scoreRelated(
  current: {
    type: "Article" | "Product" | "Note";
    title: string;
    tags?: string[];
    slug: string;
  },
  candidate: PoolItem,
): number {
  let score = 0;

  // 1. Same content type (weight 1)
  if (current.type === candidate.type) {
    score += 1;
  }

  // 2. Shared tags (weight 3 each)
  const currentTags = new Set((current.tags ?? []).map((t) => slugifyStr(t)));
  const candidateTags = new Set((candidate.tags ?? []).map((t) => slugifyStr(t)));
  for (const tag of currentTags) {
    if (tag && candidateTags.has(tag)) {
      score += 3;
    }
  }

  // 3. Shared title keywords after removing stop words (weight 0.5 each, max 3 counted)
  const currentKeywords = extractKeywords(current.title);
  const candidateKeywords = extractKeywords(candidate.title);
  let sharedKeywordsCount = 0;
  for (const kw of currentKeywords) {
    if (candidateKeywords.has(kw)) {
      sharedKeywordsCount++;
    }
  }
  const keywordsCount = Math.min(sharedKeywordsCount, 3);
  score += keywordsCount * 0.5;

  return score;
}

export function getRelatedContent(
  current: {
    type: "Article" | "Product" | "Note";
    slug: string;
    title: string;
    tags?: string[];
    pubDatetime?: Date;
  },
  pool: PoolItem[],
  maxCount = 3,
  now = new Date(),
): RelatedItem[] {
  const scoredItems: Array<{ item: PoolItem; score: number }> = [];

  for (const candidate of pool) {
    // Exclude self (same type and slug)
    if (candidate.type === current.type && candidate.slug === current.slug) {
      continue;
    }
    // Exclude drafts
    if (candidate.draft) {
      continue;
    }
    // Exclude unlisted
    if (candidate.unlisted) {
      continue;
    }
    // Exclude thin items
    if (candidate.isThin) {
      continue;
    }
    // Exclude future-dated
    if (candidate.pubDatetime > now) {
      continue;
    }

    const score = scoreRelated(current, candidate);
    if (score >= 1) {
      scoredItems.push({ item: candidate, score });
    }
  }

  // Deterministic sorting:
  // 1. score descending
  // 2. newest pubDatetime descending
  // 3. slug alphabetical ascending
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const timeDiff = b.item.pubDatetime.getTime() - a.item.pubDatetime.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return a.item.slug.localeCompare(b.item.slug);
  });

  return scoredItems.slice(0, maxCount).map(({ item, score }) => ({
    type: item.type,
    title: item.title,
    href: item.href,
    description: item.description,
    score,
  }));
}
