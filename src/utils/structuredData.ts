import { SITE } from "../config.ts";
import { SOCIAL_PROFILE_URLS } from "../constants.ts";
import { getBreadcrumbItems } from "./breadcrumbs.ts";

export interface ProductTypeMapping {
  applicationCategory: string;
  operatingSystem: string;
}

export const PRODUCT_TYPE_MAP: Record<string, ProductTypeMapping> = {
  "chrome-extension": {
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
  },
  "firefox-addon": {
    applicationCategory: "BrowserApplication",
    operatingSystem: "Firefox",
  },
  "android-app": {
    applicationCategory: "MobileApplication",
    operatingSystem: "Android",
  },
  "ios-app": {
    applicationCategory: "MobileApplication",
    operatingSystem: "iOS",
  },
  "web-app": {
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
  },
  "desktop-app": {
    applicationCategory: "DesktopApplication",
    operatingSystem: "Windows, macOS, Linux",
  },
  tool: {
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
  },
  library: {
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
  },
  "open-source": {
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
  },
  other: {
    applicationCategory: "Application",
    operatingSystem: "Cross-platform",
  },
};

export function getPersonNode(siteOrigin: string) {
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${siteOrigin}/#person`,
    name: SITE.author,
    url: siteOrigin,
    sameAs: SOCIAL_PROFILE_URLS,
  };
  if (SITE.email && !SITE.email.includes("TODO") && SITE.email.trim() !== "") {
    person.email = `mailto:${SITE.email.trim()}`;
  }
  return person;
}

export function getWebSiteNode(siteOrigin: string) {
  return {
    "@type": "WebSite",
    "@id": `${siteOrigin}/#website`,
    name: SITE.title,
    url: siteOrigin,
    description: SITE.desc,
    publisher: { "@id": `${siteOrigin}/#person` },
  };
}

export function getBreadcrumbList(items: Array<{ name: string; url?: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

export interface CollectionItem {
  name: string;
  url: string;
}

export type StructuredDataProps =
  | { type: "Home"; noindex?: boolean; data?: Record<string, never> }
  | { type: "AboutPage"; noindex?: boolean; data?: Record<string, never> }
  | {
      type: "CollectionPage";
      noindex?: boolean;
      data: {
        name: string;
        description: string;
        url: string;
        items: CollectionItem[];
        breadcrumbs?: Array<{ name: string; url?: string }>;
      };
    }
  | {
      type: "PostDetail";
      noindex?: boolean;
      data: {
        title: string;
        description: string;
        url: string;
        pubDatetime: Date;
        modDatetime?: Date | null;
        image: string;
        keywords?: string;
        wordCount?: number;
        readingTimeMinutes?: number;
      };
    }
  | {
      type: "NoteDetail";
      noindex?: boolean;
      data: {
        title: string;
        description: string;
        url: string;
        pubDatetime: Date;
        modDatetime?: Date | null;
        image: string;
        keywords?: string;
      };
    }
  | {
      type: "ProductDetail";
      noindex?: boolean;
      data: {
        title: string;
        description: string;
        url: string;
        type: string;
        pubDatetime: Date;
        image: string;
        sameAs?: string[];
      };
    }
  | {
      type: "TagCollection";
      noindex?: boolean;
      data: {
        tagName: string;
        tag: string;
        url: string;
        items: CollectionItem[];
        section: "blog" | "notes";
      };
    }
  // Backward compatibility
  | { type: "WebSite" | "Person"; noindex?: boolean; data?: Record<string, never> }
  | { type: "BlogPosting"; noindex?: boolean; data: any };

export function structuredDataJson(props: StructuredDataProps): string {
  if (props.noindex) {
    return "";
  }

  const siteOrigin = new URL(SITE.website).origin;

  if (props.type === "Home") {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [getWebSiteNode(siteOrigin), getPersonNode(siteOrigin)],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "AboutPage") {
    const person = getPersonNode(siteOrigin);
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": `${siteOrigin}/about#webpage`,
          name: `About | ${SITE.title}`,
          url: `${siteOrigin}/about`,
          description: SITE.desc,
          isPartOf: { "@id": `${siteOrigin}/#website` },
          mainEntity: person,
        },
        person,
      ],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "CollectionPage") {
    const { name, description, url, items, breadcrumbs } = props.data;
    const graph: any[] = [
      {
        "@type": "CollectionPage",
        name,
        description,
        url,
        isPartOf: { "@id": `${siteOrigin}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: item.url,
            name: item.name,
          })),
        },
      },
    ];
    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push(getBreadcrumbList(breadcrumbs));
    }
    const schema = {
      "@context": "https://schema.org",
      "@graph": graph,
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "BlogPosting") {
    const data = props.data;
    const image = new URL(SITE.ogImage, SITE.website).href;
    const person = { "@type": "Person", name: SITE.author };
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      description: data.description,
      author: {
        "@type": "Person",
        name: data.author,
        ...(data.author === SITE.author && { url: SITE.profile }),
      },
      datePublished:
        data.pubDatetime instanceof Date
          ? data.pubDatetime.toISOString()
          : new Date(data.pubDatetime).toISOString(),
      dateModified:
        (data.modDatetime ?? data.pubDatetime) instanceof Date
          ? (data.modDatetime ?? data.pubDatetime).toISOString()
          : new Date(data.modDatetime ?? data.pubDatetime).toISOString(),
      publisher: { ...person, logo: { "@type": "ImageObject", url: image } },
      mainEntityOfPage: { "@type": "WebPage", "@id": data.url },
      image: data.ogImage || image,
      articleSection: (data.tags && data.tags[0]) || "Technology",
      keywords: Array.isArray(data.tags) ? data.tags.join(", ") : "",
      wordCount: data.wordCount,
      timeRequired: data.readingTimeMinutes ? `PT${data.readingTimeMinutes}M` : undefined,
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "PostDetail") {
    const d = props.data;
    const isIsoDate = (d: any) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());
    const postUrl = d.url;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: d.title,
          description: d.description,
          datePublished: isIsoDate(d.pubDatetime),
          ...(d.modDatetime && {
            dateModified: isIsoDate(d.modDatetime),
          }),
          author: { "@id": `${siteOrigin}/#person` },
          publisher: { "@id": `${siteOrigin}/#person` },
          image: d.image,
          mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
          ...(d.keywords && { keywords: d.keywords }),
          ...(d.wordCount !== undefined && { wordCount: d.wordCount }),
          ...(d.readingTimeMinutes !== undefined && {
            timeRequired: `PT${d.readingTimeMinutes}M`,
          }),
          inLanguage: "en",
        },
        getBreadcrumbList(getBreadcrumbItems("post", { title: d.title, url: postUrl, siteOrigin })),
      ],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "NoteDetail") {
    const d = props.data;
    const isIsoDate = (d: any) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());
    const noteUrl = d.url;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: d.title,
          description: d.description,
          datePublished: isIsoDate(d.pubDatetime),
          ...(d.modDatetime && { dateModified: isIsoDate(d.modDatetime) }),
          author: { "@id": `${siteOrigin}/#person` },
          publisher: { "@id": `${siteOrigin}/#person` },
          image: d.image,
          mainEntityOfPage: { "@type": "WebPage", "@id": noteUrl },
          ...(d.keywords && { keywords: d.keywords }),
          inLanguage: "en",
        },
        getBreadcrumbList(getBreadcrumbItems("note", { title: d.title, url: noteUrl, siteOrigin })),
      ],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "ProductDetail") {
    const d = props.data;
    const mapping = PRODUCT_TYPE_MAP[d.type] ?? PRODUCT_TYPE_MAP.other;
    const productUrl = d.url;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: d.title,
          description: d.description,
          url: productUrl,
          applicationCategory: mapping.applicationCategory,
          operatingSystem: mapping.operatingSystem,
          image: d.image,
          ...(d.sameAs && d.sameAs.length > 0 && { sameAs: d.sameAs }),
          author: { "@id": `${siteOrigin}/#person` },
          datePublished:
            d.pubDatetime instanceof Date
              ? d.pubDatetime.toISOString()
              : new Date(d.pubDatetime).toISOString(),
        },
        getBreadcrumbList(
          getBreadcrumbItems("product", { title: d.title, url: productUrl, siteOrigin }),
        ),
      ],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "TagCollection") {
    const { tagName, url, items, section } = props.data;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: `${tagName} | ${SITE.title}`,
          description: `All ${section} tagged with ${tagName}.`,
          url,
          isPartOf: { "@id": `${siteOrigin}/#website` },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: item.url,
              name: item.name,
            })),
          },
        },
        getBreadcrumbList(
          getBreadcrumbItems(section === "notes" ? "note-tag" : "tag", {
            tagName,
            url,
            siteOrigin,
          }),
        ),
      ],
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  if (props.type === "Person") {
    const schema = {
      "@context": "https://schema.org",
      ...getPersonNode(siteOrigin),
    };
    return JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  // Fallback to WebSite
  const schema = {
    "@context": "https://schema.org",
    ...getWebSiteNode(siteOrigin),
  };
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
