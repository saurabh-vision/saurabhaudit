import type { CollectionEntry } from "astro:content";
import getSortedProducts from "./getSortedProducts.ts";

const getFeaturedProducts = (
  products: CollectionEntry<"products">[],
): CollectionEntry<"products">[] => {
  return getSortedProducts(products).filter(({ data }) => data.featured);
};

export default getFeaturedProducts;
