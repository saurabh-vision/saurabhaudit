import type { CollectionEntry } from "astro:content";
import productFilter from "./productFilter.ts";

export function sortProducts(
  products: CollectionEntry<"products">[],
): CollectionEntry<"products">[] {
  return [...products].sort((a, b) => {
    const orderA = a.data.order;
    const orderB = b.data.order;
    const hasOrderA = typeof orderA === "number" && !Number.isNaN(orderA);
    const hasOrderB = typeof orderB === "number" && !Number.isNaN(orderB);

    if (hasOrderA && hasOrderB) {
      if (orderA !== orderB) return orderA - orderB;
    } else if (hasOrderA) {
      return -1;
    } else if (hasOrderB) {
      return 1;
    }

    return (
      Math.floor((b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000) -
      Math.floor((a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000)
    );
  });
}

const getSortedProducts = (
  products: CollectionEntry<"products">[],
): CollectionEntry<"products">[] => {
  return sortProducts(products.filter(productFilter));
};

export default getSortedProducts;
