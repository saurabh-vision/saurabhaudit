# saurabhaudit.com Go-Live Launch Checklist

Follow these step-by-step launch procedures to take **saurabhaudit.com** live safely and securely.

---

### Step A: Run Local Pre-flight Verification
- [ ] Run the automated go-live verification command:
  ```bash
  pnpm run preflight
  ```
- **Where to click / run**: Terminal root.
- **Success Criteria**: All checks report `PASS`. Any `BLOCKER` or `WARN` must be resolved before proceeding.

---

### Step B: Clean Git History (Crucial Privacy Protection)
- [ ] Because this project originated from an upstream template codebase, the initial commit contained legacy references. Before making the repository public or deploying:
  - **Option 1 (Simplest & Recommended)**: Initialize a brand-new repository containing only the clean working tree:
    ```bash
    git checkout --orphan main
    git add -A
    git commit -m "feat: initial release of saurabhaudit.com"
    ```
  - **Option 2 (Fresh Remote Repo)**: Push this tree to a newly created empty GitHub repository without the legacy upstream history.
- **Success Criteria**: `git log --all` contains only the clean initial release commit.

---

### Step C: Create & Push to GitHub Repository
- [ ] Create repository `saurabh-vision/saurabhaudit.com` (or your chosen repo name) on GitHub.
- [ ] Set git remote and push `main`:
  ```bash
  git remote add origin https://github.com/saurabh-vision/saurabhaudit.com.git
  git push -u origin main
  ```
- **Success Criteria**: Repository is visible on GitHub with `content/`, `src/`, and `.github/workflows/` present.

---

### Step D: Configure GitHub Pages Source
- [ ] On GitHub, navigate to: **Settings > Pages**.
- [ ] Under **Build and deployment > Source**, select:
  - **GitHub Actions**
- [ ] Navigate to the **Actions** tab and verify the `Deploy GitHub Pages` workflow runs and finishes with a green checkmark.
- **Success Criteria**: Workflow job `build` succeeds, and `deploy` reports a live GitHub Pages deployment URL.

---

### Step E: Configure Custom Domain & HTTPS
- [ ] Under **Settings > Pages > Custom domain**, enter: `saurabhaudit.com` and click **Save**.
- [ ] Wait for GitHub to verify the DNS and issue the TLS/SSL certificate (typically 5–15 minutes).
- [ ] Check the box: **Enforce HTTPS**.
- **Success Criteria**: The custom domain displays a green checkmark reading *"DNS check successful"* and *"Enforce HTTPS is enabled"*.

---

### Step F: Configure Registrar DNS Records
- [ ] Log in to your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy).
- [ ] Configure Apex (root `@`) A records and `www` CNAME record according to the official documentation:
  - **Reference**: Follow the current [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) documentation on GitHub Docs.
  - Add the 4 apex `A` records pointing to GitHub's official Pages IP addresses.
  - Add a `CNAME` record for host `www` pointing to `<username>.github.io.`.
- **Success Criteria**: Running `nslookup saurabhaudit.com` and `nslookup www.saurabhaudit.com` returns the GitHub Pages endpoints.

---

### Step G: Run Post-Deployment Smoke Test
- [ ] Execute the automated smoke test suite against the live production domain:
  ```bash
  pnpm run smoke -- https://saurabhaudit.com
  ```
  *(Or trigger the manual GitHub Actions workflow: **Actions > Smoke Test > Run workflow**).*
- **Success Criteria**: Smoke tests exit with code 0:
  - Root `/` returns 200 with canonical URL, CSP headers, single `<h1>`.
  - `/robots.txt`, `/sitemap-index.xml`, `/rss.xml`, `/notes/rss.xml` return 200.
  - Core sections (`/about`, `/posts/`, `/products/`, `/notes/`) return 200.
  - HTTP redirects to HTTPS, and `www` redirects to non-www apex host.
  - Non-existent route returns custom 404 page.

---

### Step H: Visual & Responsive Manual Verification
- [ ] Open [https://saurabhaudit.com](https://saurabhaudit.com) on a mobile device and a desktop browser.
- [ ] Use [`docs/DESIGN-QA.md`](file:///d:/Opensource%20Project/Saurabhaudit.com/docs/DESIGN-QA.md) to test:
  - Header sticky navigation and hamburger menu.
  - Theme switcher (Sun/Moon): verify both Light and Dark themes look crisp.
  - Search page (`/search`): perform a test search for "ClipVault" or "Android".
  - Substack newsletter card: verify iframe loads and renders cleanly.
  - Browser developer tools Console: verify 0 Content-Security-Policy (CSP) errors or blocked scripts.

---

### Step I: Google Search Console & Bing Webmaster Setup
- [ ] Open [Google Search Console](https://search.google.com/search-console).
- [ ] Add a **Domain property**: `saurabhaudit.com`.
- [ ] Add the DNS TXT verification record at your registrar.
- [ ] Once verified, navigate to **Sitemaps** and submit: `https://saurabhaudit.com/sitemap-index.xml`.
- [ ] Use **URL Inspection** on:
  - Homepage (`/`)
  - One article (e.g. `/posts/how-clipvault-saves-clipboard-on-android-10/`)
  - One product (e.g. `/products/clipvault/`)
  - One note (e.g. `/notes/android-10-clipboard-keyboard-only/`)
  and click **Request Indexing**.
- [ ] Optionally open [Bing Webmaster Tools](https://www.bing.com/webmasters) and choose **Import from Google Search Console**.
- **Success Criteria**: Sitemap shows status *"Success"* with discovered URLs.

---

### Step J: PageSpeed & Web Vitals
- [ ] Run [Google PageSpeed Insights](https://pagespeed.web.dev/) for:
  - Homepage (`https://saurabhaudit.com/`)
  - An article page
  - A product page
- **Success Criteria**: Performance score 95–100, LCP < 1.5s, CLS 0, FID/INP good.

---

### Step K: Structured Data & Rich Results Validation
- [ ] Test in [Schema.org Validator](https://validator.schema.org/) and [Google Rich Results Test](https://search.google.com/test/rich-results):
  - Homepage (`WebSite` and `Person` schema)
  - An article (`BlogPosting` schema)
  - A product (`SoftwareApplication` schema)
- **Success Criteria**: 0 errors, valid JSON-LD graphs.

---

### Step L: Social Preview Cards Verification
- [ ] Test OpenGraph and Twitter card rendering:
  - [Twitter / X Card Validator](https://cards-dev.twitter.com/validator)
  - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- **Success Criteria**: 1200x630 card image displays with title, description, and author attribution.

---

### Step M: Canonical Backlink Profile
- [ ] Update profile URLs to point to `https://saurabhaudit.com`:
  - GitHub profile website field
  - ClipVault GitHub repository homepage link (`https://github.com/saurabh-vision/clipvault`)
  - Substack publication about page (`https://howsystemsscale.substack.com`)
  - X profile bio link
  - LinkedIn profile link
  - Google Play Console store listing website field for ScanXpert
- **Success Criteria**: Authoritative backlinks established from day one.

---

### Step N: Content Finalization
- [ ] When ready to receive inquiries, set `email` in `src/config.ts`.
- [ ] Review any remaining draft entries in `content/` and set `draft: false`.
- [ ] Re-run `pnpm run preflight` to confirm a 100% clean launch posture.
