import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { BLOG_PATH, SITE } from "@/config";
import { createProductSchema } from "./utils/productSchema.ts";
import { createNoteSchema } from "./utils/noteSchema.ts";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.coerce.date().default(() => new Date()),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      unlisted: z.boolean().default(false),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      heroImage: z.string().optional(),
      description: z.string().default(""),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      source: z.string().optional(),
      AIDescription: z.boolean().optional(),
    }),
});

const products = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/products" }),
  schema: ({ image }) => createProductSchema({ image }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/notes" }),
  schema: ({ image }) => createNoteSchema({ image }),
});

export const collections = { blog, products, notes };
