import assert from "node:assert/strict";
import test from "node:test";
import { getCsp } from "../src/utils/csp.ts";

test("getCsp generates safe, compliant Content-Security-Policy for meta tag", () => {
  const csp = getCsp({ loadTwitterWidgets: false });

  // 1. Required core directives
  assert.match(csp, /default-src\s+'self'/);
  assert.match(csp, /object-src\s+'none'/);
  assert.match(csp, /base-uri\s+'self'/);

  // 2. WebAssembly support for Pagefind
  assert.match(
    csp,
    /'wasm-unsafe-eval'/,
    "script-src must include 'wasm-unsafe-eval' for Pagefind",
  );
  assert.doesNotMatch(csp, /'unsafe-eval'/, "CSP must NEVER include 'unsafe-eval'");

  // 3. Disallowed directives in HTML meta tags
  assert.doesNotMatch(csp, /frame-ancestors/, "frame-ancestors is disallowed in meta CSP");
  assert.doesNotMatch(csp, /report-uri/, "report-uri is disallowed in meta CSP");
  assert.doesNotMatch(csp, /report-to/, "report-to is disallowed in meta CSP");
  assert.doesNotMatch(csp, /sandbox/, "sandbox is disallowed in meta CSP");

  // 4. Substack origins in frame-src and form-action
  assert.match(csp, /frame-src[^;]*https:\/\/\*\.substack\.com/);
  assert.match(csp, /frame-src[^;]*https:\/\/substack\.com/);
  assert.match(csp, /form-action[^;]*https:\/\/\*\.substack\.com/);
  assert.match(csp, /form-action[^;]*https:\/\/substack\.com/);

  // 5. No third-party remnants from steipete.me or vercel
  assert.doesNotMatch(csp, /vercel/i);
  assert.doesNotMatch(csp, /sweetistics/i);
  assert.doesNotMatch(csp, /ghchart/i);

  // 6. When loadTwitterWidgets is false, Twitter origins must not be present
  assert.doesNotMatch(csp, /platform\.twitter\.com/);
  assert.doesNotMatch(csp, /syndication\.twitter\.com/);
});

test("getCsp includes Twitter origins only when loadTwitterWidgets is true", () => {
  const csp = getCsp({ loadTwitterWidgets: true });

  assert.match(csp, /script-src[^;]*https:\/\/platform\.twitter\.com/);
  assert.match(csp, /frame-src[^;]*https:\/\/platform\.twitter\.com/);
  assert.match(csp, /frame-src[^;]*https:\/\/syndication\.twitter\.com/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
  assert.doesNotMatch(csp, /frame-ancestors/);
});
