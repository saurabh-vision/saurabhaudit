import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { generateOgImage } from "@/utils/generateOgImages";
import { getProductStatusLabel, getProductTypeLabel } from "@/utils/productLabels";
import productFilter from "@/utils/productFilter";
import { slugifyStr } from "@/utils/slugify";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const products = await getCollection(
    "products",
    (product) => productFilter(product) && !product.data.ogImage,
  );

  return products.map((product) => {
    const slug = slugifyStr(
      product.id
        .split("/")
        .at(-1)
        ?.replace(/\.(md|mdx)$/, "") ?? product.id,
    );
    return {
      params: { slug },
      props: product,
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const product = props as CollectionEntry<"products">;
  const typeLabel = getProductTypeLabel(product.data.type);
  const statusLabel = getProductStatusLabel(product.data.status);

  const png = await generateOgImage({
    label: "Product",
    title: product.data.title,
    subtitle: `${typeLabel} • ${statusLabel}`,
  });

  return new Response(png as any, {
    headers: { "Content-Type": "image/png" },
  });
};
