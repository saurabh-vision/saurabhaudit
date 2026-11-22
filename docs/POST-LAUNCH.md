# Post-Launch Maintenance Runbook

This guide covers routine operational maintenance, content cadence, quarterly reviews, and failure recovery for [saurabhaudit.com](https://saurabhaudit.com).

---

## 1. Routine Publishing Cadence

### Per Publish (Every New Article, Project, or Note)
1. **Author the Content**:
   - Create a markdown file directly in `content/Article/`, `content/Projects/`, `content/Opensource/`, or `content/Notes/`.
   - Or run the scaffold script:
     ```bash
     pnpm run new -- <Article|Projects|Opensource|Notes> "Post Title"
     ```
2. **Local Verification**:
   - Run `pnpm run check` and `pnpm run build` locally.
   - Run `pnpm run preview` to verify rendering and layout.
3. **Commit & Push**:
   - Push to `main` branch. GitHub Actions deploys the static assets to GitHub Pages automatically.
4. **Request Search Console Indexing**:
   - Open [Google Search Console](https://search.google.com/search-console).
   - Enter the published URL in the top URL Inspection bar.
   - Click **Request Indexing** to expedite crawl discovery.

### Weekly
- **Publish 1 Micro-Note**:
  - Add a short snippet, bug fix, command trick, or engineering lesson learned into `content/Notes/`.
  - Keeps the freshness signal active and maintains index momentum.

### Monthly
- **Publish 1 Long-Form Technical Article**:
  - Add a comprehensive guide into `content/Article/`.
- **Review Search Console Queries**:
  - Review Search Console Performance report for impressions, CTR, and search queries driving impressions.
  - Optimize titles or intros on existing high-impression posts to match real search intent.
- **Update Product Statuses**:
  - Review `content/Projects/` and `content/Opensource/` to verify version numbers, download links, and live URLs.

### Quarterly
- **Dependency Upgrades**:
  - Review automated pull requests from Dependabot.
  - Update lockfile with compatible patch/minor versions:
    ```bash
    pnpm update
    pnpm run build:check
    ```
- **Run Pre-flight Checks**:
  - Run `pnpm run preflight` to confirm zero leaks, healthy sitemap entries, and valid configurations.
- **Run Smoke Tests**:
  - Run `pnpm run smoke -- https://saurabhaudit.com` to confirm live HTTP status, headers, and endpoints.
- **Fact-Check Metrics & Socials**:
  - Review metrics in bio, About page, and product cards (e.g. app download counts, stars, or portfolio highlights) for accuracy.

---

## 2. Failure Recovery & Troubleshooting

### Deployment Workflow Fails on GitHub Actions
The build pipeline is designed to be fail-safe: if a build fails, GitHub Pages does NOT deploy the broken assets; your previous working deployment stays live.

1. **Read the GitHub Actions Run Log**:
   - Open repository **Actions** tab on GitHub.
   - Click the failed run and expand the `Build with pnpm` step.
2. **Diagnose the Error**:
   - **Content Sync Error**: The `sync-content.mjs` script pinpoints the exact file and invalid field. Common causes: missing `# Title`, unclosed quotation mark in YAML frontmatter, or invalid date format.
   - **Typecheck / Astro Check Error**: TypeScript type mismatch or missing import.
   - **Missing Asset / Image**: File reference to non-existent image in `public/`.
3. **Fix and Re-push**:
   - Fix the named file locally.
   - Commit and push to `main`. The pipeline will automatically re-run and deploy upon passing.

### Trailing Slash or 404 Routing Issues
- The site configuration in `astro.config.mjs` sets `trailingSlash: "ignore"` and `build.format: "directory"`.
- Every page is emitted as an `index.html` within its directory structure. Both `/notes/slug` and `/notes/slug/` resolve cleanly.

### Broken Social Cards / Open Graph Previews
- If X (Twitter), LinkedIn, or Facebook show outdated social previews:
  - Verify the static OG card exists at `https://saurabhaudit.com/posts/<slug>/index.png`.
  - Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to clear the CDN cache.
