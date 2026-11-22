// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { indexableSitemap, serializeSitemapItem } from "./src/utils/sitemap";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import { remarkEmbeds } from "./src/utils/remarkEmbeds.mjs";
import { remarkLazyLoadImages } from "./src/utils/remarkLazyLoadImages.mjs";
import { SITE } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  trailingSlash: "ignore",
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
        remarkLazyLoadImages,
        remarkEmbeds,
      ],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      wrap: true,
    },
  },
  integrations: [
    mdx(),
    indexableSitemap({
      filter: (page) => SITE.showArchives || new URL(page).pathname !== "/archives",
      serialize: (item) => serializeSitemapItem(item),
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
});
