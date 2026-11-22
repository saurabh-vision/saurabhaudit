import { z } from "astro/zod";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "./contentRules.mjs";

export const productTypeEnum = z.enum(PRODUCT_TYPES as [string, ...string[]]);

export const productStatusEnum = z.enum(PRODUCT_STATUSES as [string, ...string[]]);

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

export const productLinksSchema = z
  .object({
    websiteUrl: httpsUrl.optional(),
    appStoreUrl: httpsUrl.optional(),
    playStoreUrl: httpsUrl.optional(),
    chromeWebStoreUrl: httpsUrl.optional(),
    firefoxAddonUrl: httpsUrl.optional(),
    githubUrl: httpsUrl.optional(),
    productHuntUrl: httpsUrl.optional(),
    docsUrl: httpsUrl.optional(),
  })
  .optional()
  .default({});

export const createProductSchema = ({ image }: { image?: any } = {}) => {
  const imageSchema = typeof image === "function" ? image() : z.string();
  return z
    .object({
      title: z.string(),
      description: z.string().max(160, { message: "Description must be 160 characters or less" }),
      type: productTypeEnum,
      status: productStatusEnum,
      links: productLinksSchema,
      icon: imageSchema.or(z.string()).optional(),
      screenshots: z.array(imageSchema.or(z.string())).optional().default([]),
      featured: z.boolean().default(false),
      order: z.number().optional(),
      pubDatetime: z.coerce.date(),
      modDatetime: z.date().optional().nullable(),
      tags: z.array(z.string()).default([]),
      ogImage: imageSchema.or(z.string()).optional(),
      draft: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.status === "live" || data.status === "beta") {
        const links = data.links ?? {};
        const hasAtLeastOneLink = Object.values(links).some(
          (val) => typeof val === "string" && val.trim().length > 0,
        );
        if (!hasAtLeastOneLink) {
          ctx.addIssue({
            code: "custom",
            message: `Product with status '${data.status}' requires at least one valid https: URL in 'links' (product: "${data.title}")`,
            path: ["links"],
          });
        }
      }
    });
};
