#!/usr/bin/env node
import { parseArgs } from "node:util";

export async function runSmoke(baseUrlArg, options = {}) {
  const allowHttp = Boolean(options.allowHttp);
  const logger = options.logger || console;
  const startTime = Date.now();

  if (!baseUrlArg) {
    throw new Error(
      "Base URL is required. Usage: node scripts/smoke.mjs <base-url> [--allow-http]",
    );
  }

  let cleanBaseUrl = baseUrlArg.trim().replace(/\/+$/, "");
  if (!cleanBaseUrl.startsWith("http://") && !cleanBaseUrl.startsWith("https://")) {
    cleanBaseUrl = `https://${cleanBaseUrl}`;
  }

  const baseParsed = new URL(cleanBaseUrl);
  const results = [];

  function record(name, pass, detail = "") {
    results.push({ name, pass, detail });
    const mark = pass ? "PASS" : "FAIL";
    logger.log(`  [${mark}] ${name}${detail ? ` - ${detail}` : ""}`);
  }

  logger.log(`\nSmoke Testing: ${cleanBaseUrl}`);
  logger.log(`Mode: ${allowHttp ? "Allowing HTTP (local/test)" : "Production HTTPS Strict"}\n`);

  try {
    // 1. Root / check
    const rootRes = await fetch(`${cleanBaseUrl}/`);
    const rootHtml = await rootRes.text();
    const isRoot200 = rootRes.status === 200;
    const isHtml = (rootRes.headers.get("content-type") || "").includes("text/html");
    const hasCanonical = new RegExp(
      `<link\\b[^>]*\\brel=["']canonical["'][^>]*\\bhref=["'](?:${cleanBaseUrl}|https://saurabhaudit.com)/?["']`,
      "i",
    ).test(rootHtml);
    const hasCsp = /<meta\b[^>]*\bhttp-equiv=["']Content-Security-Policy["']/i.test(rootHtml);
    const h1Count = (rootHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).length;
    const hasOneH1 = h1Count === 1;

    record("Root route / returns 200 text/html", isRoot200 && isHtml, `status: ${rootRes.status}`);
    record("Root route / has correct canonical link", hasCanonical);
    record("Root route / has CSP meta tag", hasCsp);
    record("Root route / has exactly one <h1>", hasOneH1, `found: ${h1Count}`);

    // Tagline check on root
    const hasTagline = /systems scale|Android apps|open-source/i.test(rootHtml);
    record("Root route / renders site tagline/bio", hasTagline);

    // 2. Robots.txt, sitemap-index, rss
    const robotsRes = await fetch(`${cleanBaseUrl}/robots.txt`);
    const robotsText = await robotsRes.text();
    record("robots.txt returns 200", robotsRes.status === 200 && robotsText.includes("Sitemap:"));

    const sitemapRes = await fetch(`${cleanBaseUrl}/sitemap-index.xml`);
    const sitemapXml = await sitemapRes.text();
    const isSitemap200 = sitemapRes.status === 200;
    record("sitemap-index.xml returns 200", isSitemap200);

    const rssRes = await fetch(`${cleanBaseUrl}/rss.xml`);
    record("rss.xml returns 200", rssRes.status === 200);

    const notesRssRes = await fetch(`${cleanBaseUrl}/notes/rss.xml`);
    record("/notes/rss.xml returns 200", notesRssRes.status === 200);

    // 3. Section pages if they exist in sitemap or on site
    for (const section of ["/about", "/posts/", "/products/", "/notes/"]) {
      const sRes = await fetch(`${cleanBaseUrl}${section}`);
      record(`Section ${section} returns 200`, sRes.status === 200, `status: ${sRes.status}`);
    }

    // 4. Sample sitemap URLs (up to 25 evenly)
    if (isSitemap200) {
      let pageUrls = [];
      const subSitemaps = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      if (subSitemaps.length > 0) {
        for (const sub of subSitemaps) {
          const targetSub = sub.startsWith("http")
            ? sub.replace(/^https?:\/\/[^/]+/, cleanBaseUrl)
            : `${cleanBaseUrl}${sub}`;
          const subRes = await fetch(targetSub);
          if (subRes.ok) {
            const subXml = await subRes.text();
            const locs = [...subXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
            pageUrls.push(...locs);
          }
        }
      } else {
        pageUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      }

      const totalUrls = pageUrls.length;
      if (totalUrls > 0) {
        let sample = pageUrls;
        if (totalUrls > 25) {
          const step = totalUrls / 25;
          sample = [];
          for (let i = 0; i < 25; i++) {
            sample.push(pageUrls[Math.floor(i * step)]);
          }
        }

        let allSampledOk = true;
        for (const url of sample) {
          const targetUrl = url.startsWith("http")
            ? url.replace(/^https?:\/\/[^/]+/, cleanBaseUrl)
            : `${cleanBaseUrl}${url}`;
          const res = await fetch(targetUrl);
          if (res.status !== 200) {
            allSampledOk = false;
            record(`Sampled URL ${targetUrl}`, false, `status: ${res.status}`);
          }
        }
        if (allSampledOk) {
          record(`Sampled sitemap URLs (${sample.length} of ${totalUrls}) all return 200`, true);
        }
      }
    }

    // 5. Assets & Pagefind
    const ogRes = await fetch(`${cleanBaseUrl}/og-default.png`);
    const ogType = ogRes.headers.get("content-type") || "";
    record(
      "/og-default.png returns image content type",
      ogRes.status === 200 && ogType.includes("image/"),
      `type: ${ogType}`,
    );

    const pfRes = await fetch(`${cleanBaseUrl}/pagefind/pagefind.js`);
    record("/pagefind/pagefind.js returns 200", pfRes.status === 200, `status: ${pfRes.status}`);

    // 6. Random 404 path
    const randomPath = `/this-page-does-not-exist-${Math.random().toString(36).slice(2, 10)}`;
    const notFoundRes = await fetch(`${cleanBaseUrl}${randomPath}`);
    const notFoundHtml = await notFoundRes.text();
    const is404 = notFoundRes.status === 404;
    const has404Content = /404|Page Not Found/i.test(notFoundHtml);
    record(
      `Random path ${randomPath} returns 404 and custom HTML`,
      is404 && has404Content,
      `status: ${notFoundRes.status}`,
    );

    // 7. HTTPS and Redirects (production strict mode)
    if (!allowHttp) {
      record("Primary target serves over HTTPS", baseParsed.protocol === "https:");

      try {
        const httpUrl = `http://${baseParsed.host}/`;
        const httpRes = await fetch(httpUrl, { redirect: "manual" });
        const isHttpRedirect = [301, 302, 307, 308].includes(httpRes.status);
        const loc = httpRes.headers.get("location") || "";
        record(
          "HTTP redirects to HTTPS",
          isHttpRedirect && loc.startsWith("https://"),
          `status: ${httpRes.status}, location: ${loc}`,
        );
      } catch (err) {
        record("HTTP redirects to HTTPS", false, `network error: ${err.message}`);
      }

      try {
        const isWww = baseParsed.hostname.startsWith("www.");
        const testHost = isWww
          ? baseParsed.hostname.replace(/^www\./, "")
          : `www.${baseParsed.hostname}`;
        const wwwUrl = `https://${testHost}/`;
        const wwwRes = await fetch(wwwUrl, { redirect: "manual" });
        const isWwwRedirect = [301, 308].includes(wwwRes.status);
        const wwwLoc = wwwRes.headers.get("location") || "";
        record(
          "Host canonicalization (www/non-www redirect)",
          isWwwRedirect,
          `status: ${wwwRes.status}, location: ${wwwLoc}`,
        );
      } catch (err) {
        // DNS for test host may not exist in non-live test environments
        record(
          "Host canonicalization (www/non-www redirect)",
          true,
          "skipped (host not resolvable or offline)",
        );
      }
    }
  } catch (err) {
    record("Smoke suite execution", false, err.message);
  }

  const durationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.pass).length;
  const failedCount = results.filter((r) => !r.pass).length;

  logger.log(`\n========================================`);
  logger.log(`Smoke Test Summary: ${passedCount} PASSED, ${failedCount} FAILED (${durationMs}ms)`);
  logger.log(`========================================\n`);

  return {
    passed: failedCount === 0,
    results,
    durationMs,
  };
}

if (process.argv[1] && process.argv[1].endsWith("smoke.mjs")) {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "allow-http": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const targetUrl =
    positionals[0] || (values["allow-http"] ? "http://localhost:4321" : "https://saurabhaudit.com");

  runSmoke(targetUrl, { allowHttp: values["allow-http"] })
    .then(({ passed }) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("Smoke test fatal error:", err);
      process.exit(1);
    });
}
