export type ProductLinkKind = "store" | "website" | "docs" | "github" | "producthunt" | "other";

export interface ProductLink {
  key: string;
  label: string;
  href: string;
  kind: ProductLinkKind;
}

export interface ProductLinksResult {
  links: ProductLink[];
  primaryLink: ProductLink | null;
}

const LINK_METADATA: Array<{
  key: string;
  label: string;
  kind: ProductLinkKind;
  isStore: boolean;
}> = [
  { key: "appStoreUrl", label: "App Store", kind: "store", isStore: true },
  { key: "playStoreUrl", label: "Google Play", kind: "store", isStore: true },
  { key: "chromeWebStoreUrl", label: "Chrome Web Store", kind: "store", isStore: true },
  { key: "firefoxAddonUrl", label: "Firefox Add-ons", kind: "store", isStore: true },
  { key: "websiteUrl", label: "Website", kind: "website", isStore: false },
  { key: "docsUrl", label: "Docs", kind: "docs", isStore: false },
  { key: "githubUrl", label: "GitHub", kind: "github", isStore: false },
  { key: "productHuntUrl", label: "Product Hunt", kind: "producthunt", isStore: false },
];

export function getProductLinks(
  rawLinks?: Record<string, string | undefined | null> | null,
): ProductLinksResult {
  const links: ProductLink[] = [];
  if (!rawLinks) {
    return { links, primaryLink: null };
  }

  for (const meta of LINK_METADATA) {
    const href = rawLinks[meta.key];
    if (typeof href === "string" && href.trim().length > 0) {
      links.push({
        key: meta.key,
        label: meta.label,
        href: href.trim(),
        kind: meta.kind,
      });
    }
  }

  // Primary link selection priority: first store link, else website, else GitHub, or null
  const firstStore = links.find((l) => l.kind === "store");
  const website = links.find((l) => l.key === "websiteUrl");
  const github = links.find((l) => l.key === "githubUrl");

  const primaryLink = firstStore ?? website ?? github ?? null;

  return { links, primaryLink };
}

export function getPrimaryProductLink(
  rawLinks?: Record<string, string | undefined | null> | null,
): ProductLink | null {
  return getProductLinks(rawLinks).primaryLink;
}

export default getProductLinks;
