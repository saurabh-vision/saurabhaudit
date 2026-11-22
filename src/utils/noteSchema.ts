import { z } from "astro/zod";

const httpsUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must use the https: protocol" },
  );

export const createNoteSchema = ({ image }: { image?: any } = {}) => {
  const imageSchema = typeof image === "function" ? image() : z.string();
  return z
    .object({
      title: z
        .string()
        .min(1, { message: "Title is required" })
        .max(100, { message: "Title must be 100 characters or less" }),
      description: z
        .string()
        .max(160, { message: "Description must be 160 characters or less" })
        .optional(),
      pubDatetime: z.coerce.date(),
      modDatetime: z.date().optional().nullable(),
      tags: z.array(z.string()).default([]),
      sourceUrl: httpsUrl.optional(),
      sourceTitle: z
        .string()
        .max(100, { message: "Source title must be 100 characters or less" })
        .optional(),
      draft: z.boolean().default(false),
      unlisted: z.boolean().default(false),
      ogImage: imageSchema.or(z.string()).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.sourceTitle && !data.sourceUrl) {
        ctx.addIssue({
          code: "custom",
          message: "sourceTitle requires sourceUrl to be specified",
          path: ["sourceUrl"],
        });
      }
    });
};
