export type ProductStatus = "live" | "beta" | "building" | "coming-soon" | "archived";

export type ProductType =
  | "web-app"
  | "chrome-extension"
  | "firefox-addon"
  | "android-app"
  | "ios-app"
  | "desktop-app"
  | "tool"
  | "library"
  | "open-source"
  | "other";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  live: "Live",
  beta: "Beta",
  building: "Building",
  "coming-soon": "Coming soon",
  archived: "Archived",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  "web-app": "Web App",
  "chrome-extension": "Chrome Extension",
  "firefox-addon": "Firefox Add-on",
  "android-app": "Android App",
  "ios-app": "iOS App",
  "desktop-app": "Desktop App",
  tool: "Tool",
  library: "Library",
  "open-source": "Open Source",
  other: "Other",
};

export function getProductStatusLabel(status: string): string {
  return PRODUCT_STATUS_LABELS[status as ProductStatus] ?? status;
}

export function getProductTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type as ProductType] ?? type;
}

/**
 * Returns distinct styling classes for status badges.
 * Ensures the badge does not rely on color alone (uses borders, font-style, shape).
 */
export function getProductStatusBadgeClass(status: string): string {
  switch (status) {
    case "live":
      return "border border-solid border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold";
    case "beta":
      return "border border-dashed border-amber-600/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold";
    case "building":
      return "border border-dotted border-sky-600/60 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium";
    case "coming-soon":
      return "border border-solid border-purple-600/40 bg-purple-500/10 text-purple-700 dark:text-purple-400 italic";
    case "archived":
      return "border border-solid border-border bg-muted/40 text-foreground/60 italic";
    default:
      return "border border-solid border-border bg-muted/20 text-foreground/75";
  }
}
