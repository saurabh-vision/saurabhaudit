import assert from "node:assert/strict";
import test from "node:test";
import {
  checkDeployWorkflow,
  checkDistHygiene,
  checkDomainAndCname,
  checkRequiredDistFiles,
  checkSitemapsAndContent,
  checkTrackedFilesAndLeaks,
  checkWarnings,
} from "../scripts/preflight.mjs";

test("preflight: checkDomainAndCname validates https, non-www, and CNAME matching", () => {
  // 1. Invalid www domain
  const wwwRes = checkDomainAndCname({ website: "https://www.example.com" }, ".");
  assert.equal(wwwRes.status, "BLOCKER");
  assert.match(wwwRes.detail, /must be https and non-www/i);

  // 2. Invalid http domain
  const httpRes = checkDomainAndCname({ website: "http://example.com" }, ".");
  assert.equal(httpRes.status, "BLOCKER");

  // 3. Valid domain with matching mock CNAME
  const validRes = checkDomainAndCname({ website: "https://saurabhaudit.com/" }, ".");
  assert.equal(validRes.status, "PASS");
});

test("preflight: checkRequiredDistFiles flags missing files or invalid robots.txt", () => {
  // Non-existent directory
  const missingRes = checkRequiredDistFiles("non-existent-dist-dir");
  assert.equal(missingRes.status, "BLOCKER");
  assert.match(missingRes.detail, /Missing required build artifacts/i);

  // Real dist directory
  const realRes = checkRequiredDistFiles("dist");
  assert.equal(realRes.status, "PASS");
});

test("preflight: checkSitemapsAndContent validates canonical host and noindex", () => {
  const realRes = checkSitemapsAndContent("dist", "saurabhaudit.com");
  assert.equal(realRes.status, "PASS");
});

test("preflight: checkDistHygiene passes on clean dist output", () => {
  const realRes = checkDistHygiene("dist");
  assert.equal(realRes.status, "PASS");
});

test("preflight: checkDeployWorkflow validates permissions and build commands", () => {
  const res = checkDeployWorkflow(".");
  assert.equal(res.status, "PASS");
});

test("preflight: checkTrackedFilesAndLeaks confirms no sensitive tracked files", () => {
  const res = checkTrackedFilesAndLeaks(".");
  assert.equal(res.status, "PASS");
});

test("preflight: checkWarnings detects missing bio, tagline, or article minimums", () => {
  // Empty config produces warnings
  const emptyWarnings = checkWarnings({}, ".");
  assert.ok(emptyWarnings.length >= 3);
  assert.ok(emptyWarnings.some((w) => w.issue.includes("tagline")));
  assert.ok(emptyWarnings.some((w) => w.issue.includes("desc")));
  assert.ok(emptyWarnings.some((w) => w.issue.includes("bio")));

  // Real config warnings (email is unconfigured)
  const realWarnings = checkWarnings(
    {
      tagline: "Android apps",
      desc: "Description",
      bio: "Bio",
      email: "",
    },
    ".",
  );
  assert.ok(realWarnings.some((w) => w.issue.includes("email")));
});
