/**
 * Shared content rules, enums, and limits used across schemas and content sync.
 */

export const PRODUCT_TYPES = [
  "web-app",
  "chrome-extension",
  "firefox-addon",
  "android-app",
  "ios-app",
  "desktop-app",
  "tool",
  "library",
  "open-source",
  "other",
];

export const PRODUCT_STATUSES = ["live", "beta", "building", "coming-soon", "archived"];

export const LIMITS = {
  article: {
    titleMax: 70,
    titleWarn: 60,
    descMin: 50,
    descMax: 160,
    derivedDescMax: 155,
  },
  project: {
    titleMax: 100,
    descMax: 160,
    derivedDescMax: 155,
  },
  note: {
    titleMax: 100,
    descMax: 160,
    sourceTitleMax: 100,
  },
};

export const PRODUCT_LINK_KEYS = [
  "websiteUrl",
  "appStoreUrl",
  "playStoreUrl",
  "chromeWebStoreUrl",
  "firefoxAddonUrl",
  "githubUrl",
  "productHuntUrl",
  "docsUrl",
];

export const LINK_ALIASES = {
  website: "websiteUrl",
  site: "websiteUrl",
  websiteurl: "websiteUrl",
  github: "githubUrl",
  githuburl: "githubUrl",
  chrome: "chromeWebStoreUrl",
  chromewebstore: "chromeWebStoreUrl",
  chromewebstoreurl: "chromeWebStoreUrl",
  firefox: "firefoxAddonUrl",
  firefoxaddon: "firefoxAddonUrl",
  firefoxaddonurl: "firefoxAddonUrl",
  playstore: "playStoreUrl",
  playstoreurl: "playStoreUrl",
  android: "playStoreUrl",
  appstore: "appStoreUrl",
  appstoreurl: "appStoreUrl",
  ios: "appStoreUrl",
  producthunt: "productHuntUrl",
  producthunturl: "productHuntUrl",
  docs: "docsUrl",
  docsurl: "docsUrl",
};

export function isValidHttpsUrl(urlString) {
  if (typeof urlString !== "string" || !urlString.trim()) return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
