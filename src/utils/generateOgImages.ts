import type { CollectionEntry } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import postOgImage, { generateOgSvg } from "./og-templates/post";

export interface OgImageOptions {
  title: string;
  label?: string;
  subtitle?: string;
}

export function svgBufferToPngBuffer(svg: string): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1200,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

export async function generateOgImage(options: OgImageOptions): Promise<Uint8Array> {
  const svg = await (generateOgSvg as any)(options);
  return svgBufferToPngBuffer(svg);
}

export async function generateOgImageForPost(post: CollectionEntry<"blog">): Promise<Uint8Array> {
  const svg = await postOgImage(post);
  return svgBufferToPngBuffer(svg);
}
