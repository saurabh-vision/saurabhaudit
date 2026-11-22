import { SITE } from "./config.ts";

/**
 * Single place for social profiles.
 *
 * To add a new profile:
 * 1. Add an entry to the `SOCIALS` array below with `name`, `href`, `linkTitle`, `icon`, and `active: true`.
 * 2. If it introduces a new icon, add the SVG to `src/assets/icons/` and map it in `src/components/Socials.astro`.
 *
 * Entries with empty or TODO href values are automatically filtered out at render time
 * and excluded from `SOCIAL_PROFILE_URLS`.
 */
export interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: string;
  active: boolean;
}

export const SOCIALS: readonly Social[] = [
  {
    name: "Github",
    href: "https://github.com/saurabh-vision",
    linkTitle: `${SITE.title} on Github`,
    icon: "github",
    active: true,
  },
  {
    name: "X",
    href: "https://x.com/saurabhvsn",
    linkTitle: `${SITE.title} on X`,
    icon: "twitter",
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/saurabhvsn/",
    linkTitle: `${SITE.title} on LinkedIn`,
    icon: "linkedin",
    active: true,
  },
  {
    name: "ProductHunt",
    href: "https://www.producthunt.com/@saurabhvsn",
    linkTitle: `${SITE.title} on Product Hunt`,
    icon: "producthunt",
    active: true,
  },
  {
    name: "Mail",
    href: SITE.email && !SITE.email.includes("TODO") ? `mailto:${SITE.email}` : "",
    linkTitle: `Send an email to ${SITE.title}`,
    icon: "mail",
    active: false,
  },
];

export const SOCIAL_PROFILE_URLS: string[] = SOCIALS.filter(
  (social) =>
    social.active &&
    Boolean(social.href) &&
    !social.href.includes("TODO") &&
    !social.href.startsWith("mailto:"),
).map((social) => social.href);

export const SHARE_LINKS = [
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: "twitter",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/sharing/share-offsite/?url=",
    linkTitle: `Share this post on LinkedIn`,
    icon: "linkedin",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Share this post via WhatsApp`,
    icon: "whatsapp",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Share this post on Facebook`,
    icon: "facebook",
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Share this post via Telegram`,
    icon: "telegram",
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Share this post on Pinterest`,
    icon: "pinterest",
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: "mail",
  },
] as const;
