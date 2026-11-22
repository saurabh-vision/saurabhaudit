import assert from "node:assert/strict";
import test from "node:test";
import { getPrimaryProductLink, getProductLinks } from "../src/utils/getProductLinks.ts";
import { getProductPath } from "../src/utils/getProductPath.ts";
import { sortProducts } from "../src/utils/getSortedProducts.ts";
import { isProductPublished } from "../src/utils/productFilter.ts";

test("getProductPath generates valid product URLs", () => {
  assert.equal(getProductPath("audit-pro"), "/products/audit-pro/");
  assert.equal(getProductPath("audit-pro.md"), "/products/audit-pro/");
  assert.equal(getProductPath("subfolder/my-tool.mdx"), "/products/my-tool/");
});

test("getProductLinks returns defined links in fixed priority order and selects primary link", () => {
  // Store links have top priority, then website, docs, github, producthunt
  const rawLinks = {
    githubUrl: "https://github.com/example/repo",
    websiteUrl: "https://example.com",
    appStoreUrl: "https://apps.apple.com/app/id123",
    productHuntUrl: "https://www.producthunt.com/products/example",
  };

  const { links, primaryLink } = getProductLinks(rawLinks);
  assert.equal(links.length, 4);
  assert.equal(links[0].key, "appStoreUrl");
  assert.equal(links[0].label, "App Store");
  assert.equal(links[0].kind, "store");
  assert.equal(links[1].key, "websiteUrl");
  assert.equal(links[1].label, "Website");
  assert.equal(links[2].key, "githubUrl");
  assert.equal(links[2].label, "GitHub");
  assert.equal(links[3].key, "productHuntUrl");
  assert.equal(links[3].label, "Product Hunt");

  // Primary link: first store link
  assert.equal(primaryLink?.key, "appStoreUrl");
  assert.equal(getPrimaryProductLink(rawLinks)?.key, "appStoreUrl");

  // When no store link: website is primary
  const noStoreLinks = {
    githubUrl: "https://github.com/example/repo",
    websiteUrl: "https://example.com",
  };
  assert.equal(getPrimaryProductLink(noStoreLinks)?.key, "websiteUrl");

  // When no store and no website: github is primary
  const onlyGithub = {
    githubUrl: "https://github.com/example/repo",
  };
  assert.equal(getPrimaryProductLink(onlyGithub)?.key, "githubUrl");

  // When only docs or product hunt: primary is null
  const onlyDocs = {
    docsUrl: "https://docs.example.com",
  };
  assert.equal(getPrimaryProductLink(onlyDocs), null);

  // When links are empty or null: primary is null and links is empty array
  assert.deepEqual(getProductLinks(null), { links: [], primaryLink: null });
  assert.deepEqual(getProductLinks({}), { links: [], primaryLink: null });
  assert.equal(getPrimaryProductLink(null), null);
});

test("isProductPublished correctly handles draft and future dates", () => {
  const past = new Date("2020-01-01");
  const future = new Date("2099-01-01");

  // Published past item
  assert.equal(isProductPublished({ pubDatetime: past, draft: false }), true);

  // Draft item is excluded
  assert.equal(isProductPublished({ pubDatetime: past, draft: true }), false);

  // Future item is excluded in production
  assert.equal(
    isProductPublished({ pubDatetime: future, draft: false }, { now: Date.now(), preview: false }),
    false,
  );

  // Future item is included in preview mode
  assert.equal(
    isProductPublished({ pubDatetime: future, draft: false }, { now: Date.now(), preview: true }),
    true,
  );
});

test("sortProducts sorts by order ascending, then pubDatetime descending", () => {
  const items = [
    {
      id: "c",
      data: { title: "C", order: 2, pubDatetime: new Date("2026-01-01") },
    },
    {
      id: "a",
      data: { title: "A", order: 1, pubDatetime: new Date("2026-01-01") },
    },
    {
      id: "d",
      data: { title: "D", pubDatetime: new Date("2026-03-01") },
    },
    {
      id: "e",
      data: { title: "E", pubDatetime: new Date("2026-02-01") },
    },
    {
      id: "b",
      data: { title: "B", order: 1, pubDatetime: new Date("2026-05-01") },
    },
  ];

  const sorted = sortProducts(items);
  // Expected order:
  // B (order: 1, newer date)
  // A (order: 1, older date)
  // C (order: 2)
  // D (no order, newer date)
  // E (no order, older date)
  assert.deepEqual(
    sorted.map((i) => i.id),
    ["b", "a", "c", "d", "e"],
  );
});
