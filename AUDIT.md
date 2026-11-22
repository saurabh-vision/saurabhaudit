# Comprehensive Technical & SEO Audit: saurabhaudit.com

> **Audit Context**: Forked from `steipete.me` codebase.  
> **Target Vision**: Personal site, product/apps/extensions directory with store backlinks, SEO-friendly long-form articles, micro-notes/TILs, clean Substack subscribe embeds, and lightweight static output.  
> **Audit Status**: READ-ONLY inspection complete.

---

## 1. Stack and Tooling

### Core Framework & Runtime
- **Framework**: Astro `v7.4.11` (Static Site Generation / Content Collections)
- **Language**: TypeScript `v6.0.3` (Strict mode configured in `tsconfig.json`)
- **Package Manager**: pnpm (Configured as `pnpm@12.14.0` in `package.json#packageManager`, installed via Corepack / pnpm `v12.21.0`; lockfile `pnpm-lock.yaml` format `9.0`)
- **Styling**: Tailwind CSS `v4.3.5` via `@tailwindcss/vite` `v4.3.5`
- **Markdown Processing**: `@astrojs/markdown-remark` `v7.3.8`, `@astrojs/mdx` `v8.1.5`, unified remark pipeline (`remark-toc`, `remark-collapse`, custom embeds and image lazy loading)
- **Search Engine**: Pagefind `v1.6.0` (`@pagefind/default-ui` `v1.6.0`), static client-side indexing post-build
- **Hosting & Edge**: Vercel (`vercel.json` with `@vercel/functions` `v3.11.1` middleware, `@vercel/analytics` `v2.0.1`, `@vercel/speed-insights` `v2.1.0`)

### Node.js Engine Verification
- **Required by `package.json`**: `engines.node: ">=24.0.0"`
- **Required by `.github/workflows/ci.yml`**: Node `24` and `26` matrix
- **Astro Runtime Floor**: Astro `7.4.11` enforces `node >= 22.23.4` (in `node_modules/astro/bin/astro.mjs:31`)
- **Host Machine Node Version**: Node `v22.14.0`
- **Build Execution Check**:
  - Command: `npm run build` (`astro build && pagefind --site dist`)
  - **Exit Code**: `1` (Failed)
  - **Error Output**: `Node.js v22.14.0 is not supported by Astro! Please upgrade Node.js to a supported version: ">=22.23.4"`
  - **Verdict**: Critical mismatch between local machine Node (`22.14.0`) and Astro/project requirement (`>=24.0.0`).

### Package.json Scripts
| Script Name | Command | Purpose |
|---|---|---|
| `dev` | `astro dev` | Starts local Astro dev server |
| `build` | `astro build && pagefind --site dist` | Production SSG build followed by Pagefind search indexing |
| `build:check` | `astro check && pnpm run test && pnpm run build && pnpm run test:build` | Full CI verification pipeline |
| `preview` | `astro preview` | Local preview of production `dist/` build |
| `astro` | `astro` | Astro CLI pass-through |
| `sync` | `astro sync` | Generates `.astro/` content collection type declarations |
| `lint` | `oxlint --deny-warnings --import-plugin src astro.config.mjs public/toggle-theme.js` | Fast Oxlint code analysis |
| `lint:fix` | `oxlint --fix --deny-warnings --import-plugin src astro.config.mjs public/toggle-theme.js` | Automated lint auto-fixes |
| `format` | `git ls-files '*.js' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.json' \| xargs oxfmt --write` | Code formatting with oxfmt |
| `format:check` | `git ls-files '*.js' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.json' \| xargs oxfmt --check` | Formatting validation |
| `check` | `pnpm run format:check && pnpm run lint` | Pre-commit quality check |
| `check:fix` | `pnpm run format && pnpm run lint:fix` | Pre-commit fix script |
| `prepare` | `husky` | Installs Husky git hooks |
| `test` | `node --test tests/*.test.mjs` | Node native test runner for unit tests |
| `test:build` | `node --test tests/build/*.test.mjs` | Tests verifying production build artifacts |

### Dependencies: Keep / Remove / Upgrade Verdict
| Package | Version | Type | Verdict | Reason |
|---|---|---|---|---|
| `@astrojs/check` | `^0.9.12` | Runtime | **KEEP** | Essential for Astro type validation during builds |
| `@astrojs/markdown-remark` | `^7.3.8` | Runtime | **KEEP** | Core Markdown remark processor |
| `@astrojs/mdx` | `^8.1.5` | Runtime | **KEEP** | Needed for MDX pages (`about.mdx`, rich components) |
| `@astrojs/rss` | `^4.0.19` | Runtime | **KEEP** | Powers `/rss.xml` feed generation |
| `@astrojs/sitemap` | `^3.7.4` | Runtime | **KEEP** | Core sitemap generation |
| `@ibm/plex-mono` | `^2.5.0` | Runtime | **KEEP / EVALUATE** | Monospace typography used across code blocks and Pagefind |
| `@pagefind/default-ui` | `^1.6.0` | Runtime | **KEEP** | UI components for static search modal |
| `@resvg/resvg-js` | `^2.6.2` | Runtime | **KEEP** | High performance SVG-to-PNG renderer for dynamic OG images |
| `@tailwindcss/vite` | `^4.3.5` | Runtime | **KEEP** | Tailwind CSS v4 compiler plugin for Vite |
| `@vercel/analytics` | `^2.0.1` | Runtime | **REMOVE / REPLACE** | Vercel specific analytics; evaluate if needed or replace |
| `@vercel/functions` | `^3.11.1` | Runtime | **KEEP** | Used in `src/proxy.ts` for edge markdown content negotiation |
| `@vercel/speed-insights` | `^2.1.0` | Runtime | **REMOVE / REPLACE** | Vercel performance telemetry component in `Analytics.astro` |
| `@vite-pwa/astro` | `^2.0.2` | Runtime | **REMOVE** | PWA manifest and service worker. Unnecessary overhead for static blog/directory |
| `astro` | `^7.4.11` | Runtime | **KEEP** | Core framework engine |
| `dayjs` | `^1.11.23` | Runtime | **KEEP** | Date formatting for post timestamps and archives |
| `lodash.kebabcase` | `^4.1.1` | Runtime | **REPLACE** | Can be replaced with a small native slugify utility |
| `pagefind` | `^1.6.0` | Runtime | **KEEP** | Static search indexing CLI |
| `reading-time` | `^1.5.0` | Runtime | **KEEP** | Calculates article read times and word counts |
| `remark-collapse` | `^0.1.2` | Runtime | **KEEP** | Collapsible TOC accordion plugin |
| `remark-toc` | `^9.0.0` | Runtime | **KEEP** | Auto-generates markdown table of contents |
| `satori` | `^0.63.2` | Runtime | **KEEP** | SVG generator for automated dynamic OpenGraph cards |
| `sharp` | `^0.35.5` | Runtime | **KEEP** | Image optimization engine for Astro assets |
| `tailwindcss` | `^4.3.5` | Runtime | **KEEP** | Core styling utility |
| `typescript` | `^6.0.3` | Runtime | **KEEP** | Language engine |
| `unist-util-visit` | `^5.2.0` | Runtime | **KEEP** | Used in remark AST plugins (`remarkEmbeds`, `remarkLazyLoadImages`) |
| `@tailwindcss/typography` | `^0.5.20` | Dev | **KEEP** | Prose typography styles for markdown |
| `@types/lodash.kebabcase` | `^4.1.9` | Dev | **REMOVE** | Remove when `lodash.kebabcase` is replaced |
| `commitizen` | `^4.3.2` | Dev | **OPTIONAL** | Commit message standardization |
| `cz-conventional-changelog` | `^3.3.0` | Dev | **OPTIONAL** | Commitizen conventional commits adapter |
| `husky` | `^9.1.7` | Dev | **KEEP** | Git hook manager for pre-commit linting |
| `jsdom` | `^29.1.1` | Dev | **KEEP** | Required for DOM-based unit tests |
| `lint-staged` | `^17.6.0` | Dev | **KEEP** | Runs formatting and linting on staged git files |
| `oxfmt` | `^0.78.0` | Dev | **KEEP** | High-speed Rust-based code formatter |
| `oxlint` | `^1.93.0` | Dev | **KEEP** | High-speed Rust-based linter |

### Vulnerability & Audit Status
- `npm audit`: Skipped natively because npm requires `package-lock.json` and returned `ENOLOCK`.
- Supply Chain Policies: `pnpm-workspace.yaml` explicitly enforces 14 security overrides (`fflate`, `brace-expansion`, `esbuild`, `fast-uri`, `fast-xml-parser`, `glob`, `lodash`, `postcss`, `postcss-selector-parser`, `serialize-javascript`, `source-map-js`, `tmp`, `yaml`, `zod`) and a `minimumReleaseAge: 2880` (48-hour quarantine for new package releases). All 807 dependency tree entries passed pnpm lockfile verification.

---

## 2. Project Tree (Annotated File Map)

```
Saurabhaudit.com/
├── .github/
│   ├── dependabot.yml           # Automated dependency update configuration with 2-day cooldown
│   └── workflows/ci.yml         # GitHub Actions CI matrix running on Node 24 and 26
├── .husky/
│   └── pre-commit               # Git pre-commit hook triggering pnpm check
├── .vscode/
│   ├── extensions.json          # Recommended VS Code extensions (Astro, Tailwind, Oxlint)
│   └── launch.json              # Debugger configurations for Astro dev
├── docs/
│   └── YOUTUBE.MD               # Documentation on video and tweet embedding syntax
├── public/
│   ├── assets/img/              # ~100MB of historical blog post images (2015-2025)
│   ├── favicon.ico              # Original steipete favicon asset
│   ├── game-audio.mp3           # 943KB unused audio binary asset (dead code)
│   ├── peter-avatar.jpg         # Original author avatar image
│   ├── peter-office.jpg         # Original author office photo (about page)
│   ├── peter-office-2.jpg       # Additional unused office photo
│   ├── site.webmanifest         # PWA web app manifest with Peter Steinberger branding
│   └── toggle-theme.js          # Synchronous inline dark/light mode toggle script
├── src/
│   ├── assets/icons/            # SVG icons (BlueSky, GitHub, LinkedIn, Mail, RSS, etc.)
│   ├── components/
│   │   ├── Analytics.astro      # Vercel Analytics and Speed Insights scripts
│   │   ├── BackButton.astro     # Contextual Back button with session history fallback
│   │   ├── Card.astro           # Blog post card item for listings and homepage
│   │   ├── Datetime.astro       # Accessible datetime display with timezone awareness
│   │   ├── EditPost.astro       # "Edit on GitHub" link pointing to steipete repo
│   │   ├── Footer.astro         # Site footer with CC BY 4.0 / MIT attribution notice
│   │   ├── FormattedDate.astro  # Dead code (unused alternate date formatter)
│   │   ├── Header.astro         # Site navigation bar with mobile hamburger menu and theme toggle
│   │   ├── Hr.astro             # Themed horizontal rule divider
│   │   ├── LinkButton.astro     # Accessible anchor/button wrapper
│   │   ├── NewsletterForm.astro # Subscription form pointing to steipete Buttondown
│   │   ├── Pagination.astro     # Pagination controls for blog listings
│   │   ├── PostArchive.astro    # Dead code (unused archive component)
│   │   ├── ShareLinks.astro     # Social share buttons (X, BlueSky, LinkedIn, WhatsApp, etc.)
│   │   ├── Socials.astro        # Social profile icons configured via constants.ts
│   │   ├── StructuredData.astro # Injects JSON-LD Schema.org scripts
│   │   └── Tag.astro            # Badge component linking to /tags/[tag]
│   ├── content/
│   │   └── blog/                # 109 Markdown/MDX blog posts across years 2012-2026
│   ├── layouts/
│   │   ├── AboutLayout.astro    # Layout wrapper for about.mdx
│   │   ├── Layout.astro         # Core HTML document skeleton, SEO metadata, fonts, theme
│   │   ├── Main.astro           # Main content container with page title and transitions
│   │   └── PostDetails.astro    # Full blog post view layout with TOC, progress bar, footer
│   ├── pages/
│   │   ├── 404.astro            # 404 error page with steipete copy
│   │   ├── about.md.ts          # Plain markdown endpoint for about page
│   │   ├── about.mdx            # About page containing Peter Steinberger bio and imprint
│   │   ├── archives.md.ts       # Plain markdown endpoint for post archives
│   │   ├── index.astro          # Homepage featuring avatar, bio, and 2025+ posts
│   │   ├── index.md.ts          # Plain markdown endpoint for homepage
│   │   ├── posts.md.ts          # Plain markdown endpoint for all posts listing
│   │   ├── robots.txt.ts        # Dynamic robots.txt pointing to sitemap-index.xml
│   │   ├── rss.xml.ts           # Dynamic RSS feed generator for all published blog posts
│   │   ├── search.astro         # Client-side Pagefind search page
│   │   ├── archives/
│   │   │   └── index.astro      # Grouped yearly post archives view
│   │   ├── page/
│   │   │   └── [page].astro     # Paginated homepage post list
│   │   ├── posts/
│   │   │   ├── index.astro      # Posts index redirecting to first paginated page
│   │   │   ├── [...page].astro  # Paginated /posts/ listing
│   │   │   ├── [...slug].astro  # Dynamic route resolving dated post aliases
│   │   │   ├── [...slug].md.ts  # Raw markdown endpoint for individual posts
│   │   │   └── [...slug]/
│   │   │       ├── index.astro  # Canonical post detail page renderer
│   │   │       └── index.png.ts # Dynamic OpenGraph PNG generator via Satori & resvg
│   │   └── tags/
│   │       ├── index.astro      # All tags index view
│   │       └── [tag]/[...page].astro # Tag-filtered paginated post listing
│   ├── scripts/
│   │   ├── navigation.ts        # ClientRouter transition lifecycle handlers
│   │   ├── page.ts              # Page lifecycle and scroll position restoration
│   │   ├── post.ts              # Code block copy button and reading progress indicator
│   │   └── search.ts            # Pagefind UI initialization and autofocus
│   ├── styles/
│   │   ├── global.css           # Global Tailwind v4 theme colors, fonts, and dark mode rules
│   │   └── typography.css       # Prose typography adjustments and code block highlights
│   ├── utils/
│   │   ├── generateOgImages.ts  # OG image generation orchestration
│   │   ├── getPath.ts           # Post URL normalizer resolving /posts/[year]/[slug]
│   │   ├── getPostsByTag.ts     # Post filtering utility by tag name
│   │   ├── getSortedPosts.ts    # Post sorter by publication datetime descending
│   │   ├── getUniqueTags.ts     # Extracts unique tags and post counts
│   │   ├── groupPosts.ts        # Groups posts by calendar year
│   │   ├── loadOgFonts.ts       # Font loader for Satori SVG canvas
│   │   ├── markdownResponse.ts  # HTTP response utility with text/markdown headers and caching
│   │   ├── og-templates/post.js # Satori JSX template for post OG images
│   │   ├── postAliases.ts       # URL aliases resolver for historical date-based links
│   │   ├── postDate.ts          # Timezone-aware Day.js helper for publication dates
│   │   ├── postFilter.ts        # Filters out drafts and scheduled future posts
│   │   ├── postVisibility.ts    # Determines listed/unlisted post status
│   │   ├── readingTime.ts       # Word count and reading time metrics calculator
│   │   ├── remarkEmbeds.mjs     # Custom remark plugin transforming YouTube/Twitter embed tags
│   │   ├── remarkLazyLoadImages.mjs # Custom remark plugin injecting loading="lazy" into markdown
│   │   ├── sitemap.ts           # Custom sitemap integration filtering noindex pages
│   │   ├── slugify.ts           # String kebab-case normalizer
│   │   └── structuredData.ts    # Schema.org JSON-LD generator for WebSite, Person, BlogPosting
│   ├── config.ts                # Core site configuration (URL, author, email, pagination)
│   ├── constants.ts             # Social networks and share link definitions
│   ├── content.config.ts        # Astro content collections schema definition
│   ├── env.d.ts                 # Astro client types reference
│   ├── proxy.ts                 # Vercel Edge proxy for markdown domain/content negotiation
│   └── types.d.ts               # Shared TypeScript interfaces
├── tests/                       # Unit and build verification test suite (13 test files)
├── .gitignore                   # Git ignore specifications
├── .npmrc                       # Engine strict configuration
├── .oxfmtrc.json                # Oxformat configuration
├── AGENTS.md                    # Working rules for AI agents on this repository
├── astro.config.mjs             # Astro project configuration and plugins
├── CHANGELOG.md                 # Upstream release changelog
├── LICENSE                      # MIT code license and CC BY 4.0 content license
├── package.json                 # Project dependencies, engines, and scripts
├── pnpm-lock.yaml               # Pinned dependency lockfile
├── pnpm-workspace.yaml          # Pnpm security overrides and release age policy
├── README.md                    # Upstream repository documentation
├── tsconfig.json                # TypeScript compiler configuration
└── vercel.json                  # Vercel deployment, routing, CSP headers, and redirects
```

---

## 3. Routing and Content Model

### Route Map
1. **HTML Web Pages**:
   - `/` (`src/pages/index.astro`): Homepage showing avatar, bio, featured posts, and 2025+ posts.
   - `/page/[page]` (`src/pages/page/[page].astro`): Paginated homepage.
   - `/about` (`src/pages/about.mdx` via `src/layouts/AboutLayout.astro`): Author bio, work history, imprint.
   - `/posts` (`src/pages/posts/index.astro`): Redirects to `/posts/1`.
   - `/posts/[...page]` (`src/pages/posts/[...page].astro`): Paginated post listings.
   - `/posts/[...slug]` (`src/pages/posts/[...slug]/index.astro` and `src/pages/posts/[...slug].astro`): Canonical post detail view supporting both `/posts/<slug>` and `/posts/<year>/<slug>`.
   - `/archives` (`src/pages/archives/index.astro`): Year-by-year post listing (currently gated by `SITE.showArchives = false`).
   - `/tags` (`src/pages/tags/index.astro`): Tag directory.
   - `/tags/[tag]/[...page]` (`src/pages/tags/[tag]/[...page].astro`): Posts filtered by tag.
   - `/search` (`src/pages/search.astro`): Pagefind search interface.
   - `/404` (`src/pages/404.astro`): Error page.

2. **Plain Markdown Content-Negotiation Endpoints**:
   - `/index.md` (`src/pages/index.md.ts`): Text/markdown homepage.
   - `/about.md` (`src/pages/about.md.ts`): Raw markdown about page.
   - `/posts.md` (`src/pages/posts.md.ts`): Plain text catalog of all posts.
   - `/archives.md` (`src/pages/archives.md.ts`): Plain text yearly archive.
   - `/posts/[...slug].md` (`src/pages/posts/[...slug].md.ts`): Raw post body.

3. **Dynamic Edge & Media Endpoints**:
   - `/robots.txt` (`src/pages/robots.txt.ts`): Auto-generates robots exclusion file.
   - `/rss.xml` (`src/pages/rss.xml.ts`): RSS 2.0 XML feed.
   - `/sitemap-index.xml` (via `@astrojs/sitemap` & `src/utils/sitemap.ts`): XML sitemap with recency-based priority weighting.
   - `/posts/[...slug]/index.png` (`src/pages/posts/[...slug]/index.png.ts`): On-the-fly OpenGraph image generated via Satori.

4. **Edge Content Negotiation**:
   - `src/proxy.ts` executes as a Vercel Middleware / Edge rewrite. When the incoming request has `Accept: text/markdown` or comes from host `steipete.md`, it transparently rewrites requests to their corresponding `.md` endpoints.

### Content Model (`src/content.config.ts`)
The site currently defines a single content collection: `blog`.
```typescript
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.coerce.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      unlisted: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      heroImage: z.string().optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      source: z.string().optional(),
      AIDescription: z.boolean().optional(),
    }),
});
```

---

## 4. steipete Leftovers (Original Author Audit)

Every instance of original author name, personal bio, links, handles, analytics, images, copy, domains, emails, and assets:

| File Path | Line(s) | Content / Reference Type |
|---|---|---|
| `astro.config.mjs` | 41, 60, 66 | `peter-avatar.jpg` included in PWA assets and icon manifest |
| `astro.config.mjs` | 43-46 | PWA Manifest `name: "Peter Steinberger"`, `short_name: "steipete"`, `description: "AI-powered tools from Swift roots..."` |
| `CHANGELOG.md` | 26-27, 36-39, 48, 89 | Upstream references to `steipete.md`, `steipete.me`, `[REDACTED_UPSTREAM_EMAIL]`, `steipete@gmail.com` |
| `LICENSE` | 27 | `Copyright (c) 2025 Peter Steinberger` |
| `package.json` | 2 | Package name `"steipete-astro"` |
| `README.md` | 1, 3, 54 | Header `"Peter Steinberger's Personal Website"` and links to `steipete.me` / `steipete.md` |
| `vercel.json` | 14, 24 | Redirect rule matching host `"steipete.me"` to `"https://steipete.md/:path*.md"` |
| `vercel.json` | 82, 85 | Wildcard host redirect enforcing `https://steipete.me/` for non-matching domains |
| `vercel.json` | 129 | Content-Security-Policy (CSP) hardcoding `https://steipete.me` in default-src, script-src, style-src, font-src, connect-src |
| `public/site.webmanifest` | 2, 3 | `"name": "Peter Steinberger"`, `"short_name": "Peter Steinberger"` |
| `public/toggle-theme.js` | 2 | Symbol identifier `Symbol.for("steipete.theme")` |
| `public/peter-avatar.jpg` | Binary | Photo of Peter Steinberger (used as default avatar / OG image) |
| `public/peter-office.jpg` | Binary | Photo of Peter Steinberger in office (used in `about.mdx`) |
| `public/peter-office-2.jpg` | Binary | Alternate photo of Peter Steinberger |
| `public/favicon.ico` | Binary | Upstream favicon asset |
| `src/config.ts` | 28 | `website: "https://steipete.me/"` |
| `src/config.ts` | 29 | `author: "Peter Steinberger"` |
| `src/config.ts` | 30 | `email: "[REDACTED_UPSTREAM_EMAIL]"` |
| `src/config.ts` | 31 | `profile: "https://steipete.me/about"` |
| `src/config.ts` | 32 | `desc: "AI-powered tools from Swift roots to web frontiers. Every commit lands on GitHub for you to fork & remix."` |
| `src/config.ts` | 33 | `title: "Peter Steinberger"` |
| `src/config.ts` | 34 | `ogImage: "peter-avatar.jpg"` |
| `src/config.ts` | 44 | `url: "https://github.com/steipete/steipete.me/edit/main/"` |
| `src/constants.ts` | 6 | `href: "https://github.com/steipete"` |
| `src/constants.ts` | 13 | `href: "https://x.com/steipete"` |
| `src/constants.ts` | 20 | `href: "https://bsky.app/profile/steipete.me"` |
| `src/constants.ts` | 27 | `href: "https://www.linkedin.com/in/steipete/"` |
| `src/components/Footer.astro` | 19-21 | Link to `https://github.com/steipete/steipete.me` ("Steal this post ➜ CC BY 4.0 · Code MIT") |
| `src/components/NewsletterForm.astro` | 17 | Action URL `https://[REDACTED_UPSTREAM_API]/steipete` |
| `src/components/NewsletterForm.astro` | 22 | Hidden input `<input type="hidden" name="tag" value="steipete" />` |
| `src/pages/index.astro` | 26 | `<Layout description="Peter Steinberger: AI-powered tools from Swift roots...">` |
| `src/pages/index.astro` | 35-36 | `src="/peter-avatar.jpg"` and `alt="Peter Steinberger"` |
| `src/pages/index.astro` | 43 | Heading text `"Hi, I'm @steipete."` |
| `src/pages/index.md.ts` | 6 | `# Peter Steinberger (@steipete)` |
| `src/pages/index.md.ts` | 19, 20 | Links to `@steipete` on Twitter and GitHub |
| `src/pages/index.md.ts` | 25 | `"This is the markdown-only version of steipete.me. Visit steipete.me..."` |
| `src/pages/about.mdx` | 4 | Frontmatter description: `"Creator of OpenClaw, building personal agents at OpenAI..."` |
| `src/pages/about.mdx` | 11 | Office image `<img src="/peter-office.jpg" alt="Peter in his office setup" />` |
| `src/pages/about.mdx` | 14-19 | Bio text mentioning OpenClaw, OpenAI, PSPDFKit exit, and speaking history |
| `src/pages/about.mdx` | 27 | GitHub activity embed `src="https://ghchart.rshah.org/steipete"` |
| `src/pages/about.mdx` | 37 | Link to `https://github.com/steipete/` |
| `src/pages/about.mdx` | 45 | Copy: `"Tip: Change steipete.me to steipete.md for the markdown version."` |
| `src/pages/about.mdx` | 48 | Physical imprint address: `[REDACTED_UPSTREAM_ADDRESS]` |
| `src/pages/404.astro` | 9 | Description `"Page not found. The requested page doesn't exist on Peter Steinberger's blog."` |
| `src/pages/search.astro` | 11 | Description `"Search through Peter Steinberger's blog posts on iOS development, Swift..."` |
| `src/proxy.ts` | 23 | Markdown domain condition `url.hostname === "steipete.md" \|\| url.hostname === "www.steipete.md"` |
| `src/scripts/page.ts` | 5 | Symbol identifier `Symbol.for("steipete.pageLifecycle")` |
| `src/utils/og-templates/post.js` | 114 | Dynamic OG branding watermark `children: "steipete.me"` |
| `src/content/blog/*` | 109 files | 109 historical blog posts authored by Peter Steinberger |

---

## 5. SEO Audit (Per Page Type)

| Page Type | Title | Meta Description | Canonical | OpenGraph | Twitter Card | JSON-LD | Robots.txt | Sitemap | RSS | Headings | Internal Links | Alt Text | Lang Attr | 404 Page |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Home (`/`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | PASS (`WebSite`, `Person`) | PASS | PASS | PASS | PASS (H1, H2) | PASS | PASS | PASS (`lang="en"`) | N/A |
| **About (`/about`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING (`Person`/`AboutPage`) | PASS | PASS | PASS | PASS (H1, H2) | PASS | PASS | PASS | N/A |
| **Posts Listing (`/posts`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING (`CollectionPage`) | PASS | PASS | PASS | PASS (H1) | PASS | N/A | PASS | N/A |
| **Post Detail (`/posts/[...slug]`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | PASS (`BlogPosting`) | PASS | PASS | PASS | PASS (H1, H2, H3) | PASS | FAIL (Historical markdown images lack alt text) | PASS | N/A |
| **Archives (`/archives`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING | PASS (Gated by showArchives) | PASS | PASS | PASS (H1) | PASS | N/A | PASS | N/A |
| **Tags Index (`/tags`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING | PASS | PASS | PASS | PASS (H1) | PASS | N/A | PASS | N/A |
| **Tag Detail (`/tags/[tag]`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING | PASS | PASS | PASS | PASS (H1) | PASS | N/A | PASS | N/A |
| **Search (`/search`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING | PASS | PASS | PASS | PASS (H1) | PASS | N/A | PASS | N/A |
| **404 (`/404`)** | PASS | PASS | PASS | PASS | MISSING (`twitter:site/creator`) | MISSING | PASS (Excluded in sitemap) | PASS (Filtered out) | N/A | PASS (H1) | PASS | N/A | PASS | PASS |

### SEO Deficiencies Identified
1. **Missing Twitter Handle Tags**: `Layout.astro` generates `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, and `twitter:image`, but lacks `<meta name="twitter:site" content="@handle">` and `<meta name="twitter:creator" content="@handle">`.
2. **Missing Structured Data on Non-Post Pages**: Only `/` (`WebSite`, `Person`) and blog posts (`BlogPosting`) have Schema.org structured data. `/about` lacks `AboutPage` / `ProfilePage` schema, and `/posts` lacks `CollectionPage` or `BreadcrumbList`.
3. **No Schema for Products**: No product schema exists in the repository yet.
4. **Historical Blog Image Alt Attributes**: Dozens of legacy posts in `src/content/blog/` have markdown images with empty `![]()` or generic captions that fail accessibility and image SEO.
5. **Universal Twitter Widget Overhead**: `Layout.astro` loads `https://platform.twitter.com/widgets.js` on every page, slowing down Time-to-Interactive (TTI) and First Contentful Paint (FCP).

---

## 6. Performance and Quality

### Client-Side JavaScript Shipped
- **Core Astro Client Router**: `astro:transitions` adds client-side SPA routing (`<ClientRouter />` in `Layout.astro:108`).
- **Inline Scripts**:
  - `public/toggle-theme.js`: ~2.6KB inline script in `<head>` (prevents theme flicker).
  - Page lifecycle: `src/scripts/page.ts` (scroll state management).
  - Post interactions: `src/scripts/post.ts` (code copy button and scroll reading progress bar).
  - Search: `src/scripts/search.ts` (initializes Pagefind UI).
- **Third-Party External Scripts**:
  - `https://platform.twitter.com/widgets.js`: Loaded unconditionally in `Layout.astro:117` across the entire website.
  - Vercel Analytics (`@vercel/analytics`) & Speed Insights (`@vercel/speed-insights`): Loaded in production via `Analytics.astro`.
  - PWA Service Worker: Registered via `@vite-pwa/astro`.

### Image Handling
- Dynamic OpenGraph generation uses Satori and `@resvg/resvg-js`.
- Markdown images are processed with `remarkLazyLoadImages.mjs`, which injects `loading="lazy"`.
- **Lighthouse CLS Risk**: Template images (`src/pages/index.astro:34` and `src/pages/about.mdx:11`) use raw `<img>` tags without explicit `width` and `height` dimensions or responsive `srcset`.

### Font Loading
- Mono font: IBM Plex Mono imported via `@ibm/plex-mono` in `src/styles/global.css`.
- PWA Workbox cache caches Google Fonts, but no Google Fonts are actually imported in CSS (unnecessary cache entry in `astro.config.mjs:78-90`).

### Dead Code / Unused Artifacts
1. `src/components/FormattedDate.astro`: Unused component file.
2. `src/components/PostArchive.astro`: Unused component file.
3. `public/game-audio.mp3`: 943KB unused MP3 binary sitting in `public/`.
4. `public/peter-office-2.jpg`: 351KB unused image file in `public/`.

---

## 7. Security and Repo Hygiene

### Committed Secrets & Environment Variables
- **Status**: **PASS (No Leaked Secrets)**.
- Exhaustive regex search across all files (`src/`, `public/`, `.github/`, root) identified zero committed API keys, tokens, or private secrets.
- Mentions of terms like `token` or `api_key` are exclusively technical discussions inside markdown blog articles.
- No committed `.env` files detected in repository.

### .gitignore Gaps
Current `.gitignore` covers `dist/`, `.astro/`, `node_modules/`, logs, `.env`, `.env.production`, `.DS_Store`, and `.vercel/`.  
**Identified Gaps**:
- Missing: `.env.local`, `.env.*.local`, `.env.development`, `.env.test`.
- Missing: Windows OS thumbnail caches (`Thumbs.db`, `ehthumbs.db`).
- Missing: Test coverage outputs (`coverage/`).

### Git History
- The local repository was initialized fresh with working tree clean; no historical git commit red flags or leaked commits exist in this working copy.

### License & Attribution Requirements
- **License File**: `LICENSE` defines a split licensing model:
  - **Code & Build Scripts**: Licensed under the **MIT License** (`Copyright (c) 2025 Peter Steinberger`).
  - **Documentation & Blog Posts**: Licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
- **Legal Requirements for Reusing Code**:
  - The MIT license requires keeping Peter Steinberger's copyright notice in the repository's `LICENSE` file for the foundational theme code.
  - The CC BY 4.0 license requires proper attribution if any original blog content or documentation is reused, remixed, or retained.

### Safety Verdict for Making Public
**VERDICT**: **SAFE TO MAKE PUBLIC WITH CONDITIONS (CLEANUP REQUIRED)**.
- **Conditions**:
  1. **Personal Imprint Address**: `src/pages/about.mdx:48` contains previous author physical home/office address in Vienna, Austria (`Imprint: [REDACTED_UPSTREAM_ADDRESS]`). This must be removed/replaced immediately before the repository is made public.
  2. **Personal Email**: `src/config.ts:30` contains `[REDACTED_UPSTREAM_EMAIL]`. Must be replaced with Saurabh's public email.
  3. **Live Newsletter Endpoint**: `src/components/NewsletterForm.astro:17` points to previous author live Buttondown subscriber endpoint (`embed-subscribe/steipete`). Making the repo public or deploying it in this state risks sending spam submissions to the original author's subscriber list.
  4. **Domain Hijacking Redirect in `vercel.json`**: Line 85 redirects all unrecognized hosts to `https://steipete.me/`, which would hijack production deployments of `saurabhaudit.com`.

---

## 8. Gap Analysis vs Saurabh Audit Goals

### Goal 1: Products/Apps/Extensions Directory with Store Backlinks
- **What Exists**: Card UI pattern in `src/components/Card.astro`.
- **What is Partially There**: Astro Content Collections (`astro:content`) setup is in place for `blog`, which can be mirrored for `products`.
- **What is Missing**:
  - `products` content collection and zod schema in `src/content.config.ts` (fields: title, description, category, platform, appStoreUrl, chromeWebStoreUrl, githubUrl, websiteUrl, icon, featured, badge).
  - Directory listing route `/products` (`src/pages/products/index.astro`).
  - Dedicated `ProductCard.astro` component displaying external store badges with backlinks.
  - Homepage integration showing featured products.

### Goal 2: SEO-friendly Long-Form Articles + Short Micro-Notes/TILs
- **What Exists**: Markdown/MDX engine with TOC, reading time, code formatting, dynamic OG cards, and `BlogPosting` structured data.
- **What is Partially There**: 109 legacy posts exist, but all content is treated identically as long-form blog articles under `/posts/`.
- **What is Missing**:
  - Separation of content models: long-form articles vs quick micro-notes/TILs (either via a `type: "article" | "note"` discriminator or a distinct `notes` collection).
  - Lightweight layout for micro-notes (no heavy TOC or reading progress, streamlined timestamp, tags, and microformat).
  - Dedicated route `/notes` or `/til` for micro-content, plus filtered RSS feeds.
  - Schema.org distinction between detailed `Article` and concise `SocialMediaPosting` / `BlogPosting`.

### Goal 3: Clean Substack Subscribe Embeds
- **What Exists**: `NewsletterForm.astro` component located in `PostDetails.astro` and `about.mdx`.
- **What is Partially There**: Layout slot for newsletter capture is already integrated.
- **What is Missing**:
  - Substack-specific integration: currently hardcoded to Buttondown API (`https://[REDACTED_UPSTREAM_API]/steipete`).
  - Clean, responsive Substack subscribe widget/embed component (or custom styled form posting to Substack publication endpoint).
  - Configurable Substack publication handle in `src/config.ts`.

### Goal 4: Lightweight, Fast, Static Output
- **What Exists**: Astro SSG producing static HTML and CSS; Tailwind v4; Pagefind offline search.
- **What is Partially There**: Static generation works, but bundle contains unnecessary client JS.
- **What is Missing**:
  - Removal of universal `https://platform.twitter.com/widgets.js` script injection in `Layout.astro`.
  - Removal of `@vite-pwa/astro` and service worker overhead.
  - Image optimization replacement for raw `<img>` tags in templates.
  - Removal of dead components and binary assets (`FormattedDate`, `PostArchive`, `game-audio.mp3`).

---

## 9. Risk Register (Top 10 Risks)

| # | Severity | Risk Description | One-Line Fix |
|---|---|---|---|
| 1 | **HIGH** | Local Node mismatch: Astro 7.4.11 requires Node `>=22.23.4`, package.json requires `>=24.0.0`; local machine has Node 22.14.0, causing `npm run build` to fail. | Upgrade host Node runtime to Node 24 LTS or adjust package engine floor if using Node 22.23.4+. |
| 2 | **HIGH** | Invalid packageManager declaration: `package.json` specifies `"pnpm@12.14.0"`, an invalid future version that causes Corepack module lookup failures. | Standardize `package.json#packageManager` to `"pnpm@10.5.2"` (or current stable release). |
| 3 | **HIGH** | Production lockout redirect: `vercel.json:82-87` redirects any non-steipete domain directly to `https://steipete.me/`. | Update `vercel.json` host patterns to `saurabhaudit.com` and remove upstream redirects. |
| 4 | **HIGH** | Privacy & legal leak: `about.mdx:48` contains original author's physical home imprint address in Vienna; `NewsletterForm` points to steipete Buttondown. | Replace imprint address with Saurabh's information and update newsletter form to Substack. |
| 5 | **MED** | Global third-party script bloat: `Layout.astro:117` loads `platform.twitter.com/widgets.js` on every page, hurting Core Web Vitals and Lighthouse. | Remove Twitter script from global head and dynamically load only when a tweet embed is present. |
| 6 | **MED** | Hardcoded steipete metadata: `src/config.ts`, `src/constants.ts`, `site.webmanifest`, and `index.astro` all hardcode original author information. | Refactor site configuration and social constants for Saurabh Audit branding. |
| 7 | **MED** | 109 legacy posts cluttering site: Historical posts from 2012-2026 contain outdated third-party links and ~100MB of legacy images. | Decouple or archive upstream posts into an isolated folder/branch and establish Saurabh's content baseline. |
| 8 | **MED** | Broken test runner on older Node: Tests fail on Node 22 with `ERR_UNKNOWN_FILE_EXTENSION` when importing `.ts` files directly. | Run tests under Node 24 native type stripping or add test loader script. |
| 9 | **LOW** | CLS on avatar and featured images: Raw `<img>` elements in `index.astro` and `about.mdx` lack explicit width/height attributes. | Use Astro's `<Image />` component or add explicit dimension attributes. |
| 10 | **LOW** | .gitignore gaps: Missing exclusions for `.env.*.local`, `.env.development`, `.env.test`, and OS thumbnail cache files. | Add missing environment variable and OS patterns to `.gitignore`. |

---

## 10. Proposed Build Plan (16 Deployable Prompts)

Every prompt is scoped to be independent, verifiable, and leaves the site in a building and deployable state.

- **Prompt 1: Repository Audit & Baseline Verification (CURRENT)**
  - *Goal*: Complete read-only audit of entire repository and produce `AUDIT.md`.
  - *Files touched*: `AUDIT.md`.
- **Prompt 2: Tooling & Engine Modernization**
  - *Goal*: Fix Node/pnpm engine declarations in `package.json`, expand `.gitignore`, and ensure local build and dev tooling run cleanly.
  - *Files touched*: `package.json`, `.gitignore`, `pnpm-workspace.yaml`.
- **Prompt 3: Core Identity & Site Configuration Rebranding**
  - *Goal*: Update site config, author info, email, social links, and PWA/webmanifest for `saurabhaudit.com`.
  - *Files touched*: `src/config.ts`, `src/constants.ts`, `public/site.webmanifest`, `astro.config.mjs`.
- **Prompt 4: Vercel Routing, Security Headers & Edge Middleware Overhaul**
  - *Goal*: Reconfigure `vercel.json` redirects, Content Security Policy, and update `src/proxy.ts` markdown negotiation for `saurabhaudit.com`.
  - *Files touched*: `vercel.json`, `src/proxy.ts`, `tests/markdown-routing.test.mjs`.
- **Prompt 5: Layout & Chrome Rebranding (Header, Footer, Head)**
  - *Goal*: Rebrand Header, Footer, and Base Layout; remove global Twitter widget script from `<head>` for zero-JS performance.
  - *Files touched*: `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`.
- **Prompt 6: Substack Newsletter Integration**
  - *Goal*: Replace Buttondown form with a responsive, styled Substack subscription embed and publication config.
  - *Files touched*: `src/components/NewsletterForm.astro`, `src/config.ts`.
- **Prompt 7: Homepage Redesign (Saurabh Audit Hub)**
  - *Goal*: Overhaul `src/pages/index.astro` and `src/pages/index.md.ts` to showcase product directory highlights, SEO articles, micro-notes, and Substack CTA.
  - *Files touched*: `src/pages/index.astro`, `src/pages/index.md.ts`.
- **Prompt 8: About Page & Imprint Overhaul**
  - *Goal*: Replace Peter's bio and physical Vienna imprint with Saurabh's bio, technical SEO background, and clean privacy/contact info.
  - *Files touched*: `src/pages/about.mdx`, `src/pages/about.md.ts`, `src/layouts/AboutLayout.astro`.
- **Prompt 9: Products & Apps Content Collection Schema**
  - *Goal*: Define the `products` collection schema in `src/content.config.ts` (with store link schemas) and scaffold initial product entries.
  - *Files touched*: `src/content.config.ts`, `src/content/products/*.md`.
- **Prompt 10: Products Directory UI & Store Backlink Badges**
  - *Goal*: Build `/products` directory listing page and `ProductCard.astro` component featuring backlinks to App Stores, Chrome Web Store, and GitHub.
  - *Files touched*: `src/pages/products/index.astro`, `src/components/ProductCard.astro`, `src/components/Header.astro`.
- **Prompt 11: Micro-Notes & TILs Content Collection Architecture**
  - *Goal*: Define content model and frontmatter schema for short-form micro-notes and TILs.
  - *Files touched*: `src/content.config.ts`, `src/content/notes/*.md`, `src/utils/postFilter.ts`.
- **Prompt 12: Micro-Notes & TILs Views & Feed**
  - *Goal*: Build dedicated `/notes` feed and lightweight detail view optimized for rapid scanning without article overhead.
  - *Files touched*: `src/pages/notes/index.astro`, `src/pages/notes/[...slug].astro`, `src/layouts/NoteDetails.astro`.
- **Prompt 13: Blog Post Content Decoupling & SEO Long-Form Baseline**
  - *Goal*: Decouple steipete's 109 legacy posts into an archived structure and scaffold Saurabh's first technical SEO articles.
  - *Files touched*: `src/content/blog/*`, `src/content.config.ts`, `src/pages/posts/index.astro`.
- **Prompt 14: Dynamic OpenGraph & Social Image Generator Rebranding**
  - *Goal*: Update Satori OG image template and typography for `saurabhaudit.com` branding and product cards.
  - *Files touched*: `src/utils/og-templates/post.js`, `src/utils/loadOgFonts.ts`, `src/pages/posts/[...slug]/index.png.ts`.
- **Prompt 15: Technical SEO, Robots, Sitemap & Schema.org Enhancement**
  - *Goal*: Enrich JSON-LD structured data for `WebSite`, `Person`, `Article`, `Product`, and `BreadcrumbList` across all routes.
  - *Files touched*: `src/utils/structuredData.ts`, `src/components/StructuredData.astro`, `src/pages/robots.txt.ts`, `src/pages/rss.xml.ts`.
- **Prompt 16: Performance, Accessibility & Final Deployment Verification**
  - *Goal*: Purge dead components (`FormattedDate`, `PostArchive`), clean unused media (`game-audio.mp3`), run full test suite, and verify Pagefind search build.
  - *Files touched*: `src/components/FormattedDate.astro`, `src/components/PostArchive.astro`, `public/game-audio.mp3`, `tests/*`.
