import satori from "satori";
import { loadOgFonts } from "../loadOgFonts";
import { OG_THEME } from "./theme";
import { formatOgTitle } from "./formatOgTitle";

export async function generateOgSvg({ label, title, subtitle }) {
  const formattedTitle = formatOgTitle(title || OG_THEME.siteWordmark, 110);
  const fonts = await loadOgFonts();

  return satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: OG_THEME.background,
          fontFamily: "IBM Plex Mono",
          position: "relative",
          boxSizing: "border-box",
        },
        children: [
          // Top row: Label chip if provided
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                height: "36px",
              },
              children: label
                ? [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: OG_THEME.labelBg,
                          border: `1px solid ${OG_THEME.border}`,
                          borderRadius: "6px",
                          padding: "6px 16px",
                          fontSize: 16,
                          fontWeight: 700,
                          color: OG_THEME.labelText,
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                        },
                        children: label,
                      },
                    },
                  ]
                : [],
            },
          },
          // Middle row: Title + Subtitle
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                margin: "auto 0",
                maxWidth: "1072px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: formattedTitle.length > 55 ? 46 : 56,
                      fontWeight: 700,
                      lineHeight: 1.25,
                      color: OG_THEME.text,
                      display: "flex",
                      flexWrap: "wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      maxHeight: "220px",
                      overflow: "hidden",
                    },
                    children: formattedTitle,
                  },
                },
                subtitle
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 22,
                          fontWeight: 400,
                          color: OG_THEME.textMuted,
                          marginTop: "20px",
                          display: "flex",
                          alignItems: "center",
                        },
                        children: subtitle,
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },
          // Bottom row: Site wordmark bottom-left, "saurabhaudit.com" bottom-right
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: `1px solid ${OG_THEME.border}`,
                paddingTop: "24px",
                width: "100%",
                boxSizing: "border-box",
              },
              children: [
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 24,
                      fontWeight: 700,
                      color: OG_THEME.text,
                    },
                    children: OG_THEME.siteWordmark,
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 22,
                      fontWeight: 400,
                      color: OG_THEME.accent,
                    },
                    children: OG_THEME.siteDomain,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts,
    },
  );
}

// Backward-compatible export for post argument
export default async function postOgImage(post) {
  const dateStr = post.data.pubDatetime
    ? new Date(post.data.pubDatetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  return generateOgSvg({
    label: "Article",
    title: post.data.title,
    subtitle: dateStr,
  });
}
