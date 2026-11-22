import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductStatusBadgeClass,
  getProductStatusLabel,
  getProductTypeLabel,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "../src/utils/productLabels.ts";

test("product status labels map all defined statuses", () => {
  const statuses = ["live", "beta", "building", "coming-soon", "archived"];
  for (const status of statuses) {
    const label = getProductStatusLabel(status);
    assert.ok(label && label.length > 0, `Expected label for status: ${status}`);
    assert.equal(label, PRODUCT_STATUS_LABELS[status]);
  }
  assert.equal(getProductStatusLabel("live"), "Live");
  assert.equal(getProductStatusLabel("beta"), "Beta");
  assert.equal(getProductStatusLabel("building"), "Building");
  assert.equal(getProductStatusLabel("coming-soon"), "Coming soon");
  assert.equal(getProductStatusLabel("archived"), "Archived");
  assert.equal(getProductStatusLabel("unknown"), "unknown");
});

test("product type labels map all defined types", () => {
  const types = [
    "web-app",
    "chrome-extension",
    "firefox-addon",
    "android-app",
    "ios-app",
    "desktop-app",
    "tool",
    "library",
    "open-source",
    "other",
  ];
  for (const type of types) {
    const label = getProductTypeLabel(type);
    assert.ok(label && label.length > 0, `Expected label for type: ${type}`);
    assert.equal(label, PRODUCT_TYPE_LABELS[type]);
  }
  assert.equal(getProductTypeLabel("web-app"), "Web App");
  assert.equal(getProductTypeLabel("chrome-extension"), "Chrome Extension");
  assert.equal(getProductTypeLabel("other"), "Other");
  assert.equal(getProductTypeLabel("custom"), "custom");
});

test("product status badge classes provide distinct styling and do not rely on color alone", () => {
  const liveClass = getProductStatusBadgeClass("live");
  const betaClass = getProductStatusBadgeClass("beta");
  const buildingClass = getProductStatusBadgeClass("building");
  const comingSoonClass = getProductStatusBadgeClass("coming-soon");
  const archivedClass = getProductStatusBadgeClass("archived");

  // Distinct border styles: solid vs dashed vs dotted
  assert.ok(liveClass.includes("border-solid"));
  assert.ok(betaClass.includes("border-dashed"));
  assert.ok(buildingClass.includes("border-dotted"));
  assert.ok(comingSoonClass.includes("italic"));
  assert.ok(archivedClass.includes("italic"));
});
