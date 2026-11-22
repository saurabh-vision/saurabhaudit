import assert from "node:assert/strict";
import test from "node:test";
import { SITE } from "../src/config.ts";
import {
  PRODUCT_TYPE_MAP,
  getPersonNode,
  getWebSiteNode,
  structuredDataJson,
} from "../src/utils/structuredData.ts";

test("getPersonNode generates stable @id, name, url, sameAs, and handles email", () => {
  const origin = "https://saurabhaudit.com";
  const person = getPersonNode(origin);

  assert.equal(person["@type"], "Person");
  assert.equal(person["@id"], `${origin}/#person`);
  assert.equal(person.name, SITE.author);
  assert.equal(person.url, origin);
  assert.ok(Array.isArray(person.sameAs));

  // Email omitted when TODO or unset
  assert.equal(person.email, undefined);
});

test("getWebSiteNode generates stable @id and publisher reference", () => {
  const origin = "https://saurabhaudit.com";
  const site = getWebSiteNode(origin);

  assert.equal(site["@type"], "WebSite");
  assert.equal(site["@id"], `${origin}/#website`);
  assert.deepEqual(site.publisher, { "@id": `${origin}/#person` });
});

test("PRODUCT_TYPE_MAP contains complete mapping for all supported product types", () => {
  const expectedTypes = [
    "chrome-extension",
    "firefox-addon",
    "android-app",
    "ios-app",
    "web-app",
    "desktop-app",
    "tool",
    "library",
    "open-source",
    "other",
  ];

  for (const type of expectedTypes) {
    const mapping = PRODUCT_TYPE_MAP[type];
    assert.ok(mapping, `Mapping must exist for product type "${type}"`);
    assert.ok(mapping.applicationCategory.length > 0);
    assert.ok(mapping.operatingSystem.length > 0);
  }
});

test("ProductDetail structured data generates valid SoftwareApplication without offers or ratings", () => {
  const origin = "https://saurabhaudit.com";
  const json = structuredDataJson({
    type: "ProductDetail",
    data: {
      title: "Sample App",
      description: "A fast utility tool for developers.",
      url: `${origin}/products/sample-app`,
      type: "chrome-extension",
      pubDatetime: new Date("2026-01-01T00:00:00Z"),
      image: `${origin}/products/sample-app/index.png`,
      sameAs: ["https://github.com/sample/app"],
    },
  });

  const parsed = JSON.parse(json);
  assert.equal(parsed["@context"], "https://schema.org");
  assert.ok(Array.isArray(parsed["@graph"]));

  const app = parsed["@graph"].find((n) => n["@type"] === "SoftwareApplication");
  assert.ok(app);
  assert.equal(app.name, "Sample App");
  assert.equal(app.applicationCategory, "BrowserApplication");
  assert.equal(app.operatingSystem, "Chrome");
  assert.deepEqual(app.author, { "@id": `${origin}/#person` });
  assert.equal(app.datePublished, "2026-01-01T00:00:00.000Z");

  // Strict rule: NO offers, price, aggregateRating or review
  assert.equal(app.offers, undefined);
  assert.equal(app.price, undefined);
  assert.equal(app.aggregateRating, undefined);
  assert.equal(app.review, undefined);

  // BreadcrumbList verified
  const breadcrumbs = parsed["@graph"].find((n) => n["@type"] === "BreadcrumbList");
  assert.ok(breadcrumbs);
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(breadcrumbs.itemListElement[0].position, 1);
  assert.equal(breadcrumbs.itemListElement[1].position, 2);
  assert.equal(breadcrumbs.itemListElement[2].position, 3);
});

test("structuredDataJson safely escapes '<' as \\u003c and returns empty string on noindex", () => {
  const jsonWithAngle = structuredDataJson({
    type: "PostDetail",
    data: {
      title: "Testing <script> Alert </script>",
      description: "Description with <brackets>",
      url: "https://saurabhaudit.com/posts/test",
      pubDatetime: new Date("2026-01-01T00:00:00Z"),
      image: "https://saurabhaudit.com/og-default.png",
    },
  });

  assert.doesNotMatch(jsonWithAngle, /<script>/i);
  assert.match(jsonWithAngle, /\\u003c/);

  // noindex flag suppresses all JSON-LD
  const emptyJson = structuredDataJson({
    type: "PostDetail",
    noindex: true,
    data: {
      title: "Noindex post",
      description: "Should not produce JSON-LD",
      url: "https://saurabhaudit.com/posts/test",
      pubDatetime: new Date("2026-01-01T00:00:00Z"),
      image: "https://saurabhaudit.com/og-default.png",
    },
  });
  assert.equal(emptyJson, "");
});
