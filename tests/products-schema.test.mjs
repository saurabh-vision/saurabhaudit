import assert from "node:assert/strict";
import test from "node:test";
import { createProductSchema } from "../src/utils/productSchema.ts";

const schema = createProductSchema();

const validProduct = {
  title: "AuditPro",
  description: "A fast, privacy-friendly SEO auditing tool for modern web engineering.",
  type: "web-app",
  status: "live",
  links: {
    websiteUrl: "https://auditpro.dev",
    githubUrl: "https://github.com/example/auditpro",
  },
  featured: true,
  order: 1,
  pubDatetime: new Date("2026-01-01"),
  tags: ["seo", "audit"],
  draft: false,
};

test("products schema validation", () => {
  // 1. Valid full product passes
  assert.doesNotThrow(() => schema.parse(validProduct));

  // 2. Missing description fails
  const missingDesc = { ...validProduct };
  delete missingDesc.description;
  assert.throws(() => schema.parse(missingDesc));

  // 3. Description > 160 characters fails
  const longDesc = {
    ...validProduct,
    description: "A".repeat(161),
  };
  assert.throws(() => schema.parse(longDesc));

  // 4. http: URL fails
  const httpUrl = {
    ...validProduct,
    links: { websiteUrl: "http://insecure.example.com" },
  };
  assert.throws(() => schema.parse(httpUrl));

  // 5. javascript: URL fails
  const jsUrl = {
    ...validProduct,
    links: { websiteUrl: "javascript:alert(1)" },
  };
  assert.throws(() => schema.parse(jsUrl));

  // 6. Status "live" without any link fails
  const liveNoLinks = {
    ...validProduct,
    status: "live",
    links: {},
  };
  assert.throws(() => schema.parse(liveNoLinks));

  // Also status "beta" without any link fails
  const betaNoLinks = {
    ...validProduct,
    status: "beta",
    links: {},
  };
  assert.throws(() => schema.parse(betaNoLinks));

  // 7. Status "building" without links passes
  const buildingNoLinks = {
    ...validProduct,
    status: "building",
    links: {},
  };
  assert.doesNotThrow(() => schema.parse(buildingNoLinks));

  // Status "coming-soon" and "archived" without links pass
  assert.doesNotThrow(() => schema.parse({ ...validProduct, status: "coming-soon", links: {} }));
  assert.doesNotThrow(() => schema.parse({ ...validProduct, status: "archived", links: {} }));

  // 8. Unknown type fails
  const unknownType = {
    ...validProduct,
    type: "smart-contract",
  };
  assert.throws(() => schema.parse(unknownType));

  // Unknown status fails
  const unknownStatus = {
    ...validProduct,
    status: "deprecated",
  };
  assert.throws(() => schema.parse(unknownStatus));
});
