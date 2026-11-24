# Saurabh Audit (saurabhaudit.com)

Live site: [https://saurabhaudit.com](https://saurabhaudit.com)

Personal website, product directory, SEO blog, micro-notes, and Substack newsletter hub (`How Systems Scale`) by Saurabh Audit. Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), deployed as a static site on GitHub Pages.

## Stack & Tooling

- **Framework**: Astro 5 (`^5.4.2`) with `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`
- **Language**: TypeScript 5 (`~5.7.3`)
- **Package Manager**: pnpm (`10.5.2`) managed via Corepack
- **Runtime**: Node.js 24+ (`>=24.0.0`)
- **Search**: Pagefind (`^1.6.0`) static search index
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`)
- **Hosting**: GitHub Pages (custom domain `saurabhaudit.com`, automated via GitHub Actions)

## Development

Use Node 24 or newer and the pinned pnpm version through Corepack:

```bash
corepack enable
pnpm install --frozen-lockfile
```

### Scripts

| Command | Action |
| --- | --- |
| `pnpm run dev` | Start local development server at `localhost:4321` |
| `pnpm run sync` | Synchronize content from `content/` to `src/content/` |
| `pnpm run new` | Scaffold a new content file (`pnpm run new -- <Folder> "<Title>"`) |
| `pnpm run lint:posts` | Validate content schemas, frontmatter, and hygiene |
| `pnpm run check` | Run linter (`oxlint`) and format checks (`oxfmt`) |
| `pnpm run format` | Auto-format files with `oxfmt` |
| `pnpm exec astro check` | Type-check Astro and TypeScript files |
| `pnpm run test` | Run unit test suite |
| `pnpm run test:products` | Test product directory UI lifecycle with temporary fixtures |
| `pnpm run test:notes` | Test notes directory UI lifecycle with temporary fixtures |
| `pnpm run build` | Build static production assets and Pagefind search index into `dist/` |
| `pnpm run test:build` | Verify production build output and artifacts |
| `pnpm run build:check` | Run full check pipeline (types, tests, build, post-build tests) |
| `pnpm run preflight` | Run pre-flight launch readiness checks for blockers and warnings |
| `pnpm run smoke -- <url>` | Run smoke test against preview or live site |
| `pnpm run preview` | Serve the production build locally |

## Project Structure

- `src/pages/`: Static routes, RSS feed (`/rss.xml`), sitemap, and Markdown endpoints.
- `src/layouts/` & `src/components/`: Reusable Astro templates and UI components.
- `src/content/blog/`: Markdown posts managed via Astro Content Collections (`src/content.config.ts`).
- `src/content/products/`: Product and application directory entries.
- `src/config.ts`: Central site configuration (`SITE` metadata, URLs, defaults).
- `src/constants.ts`: Social links and profile URLs (`SOCIALS`, `SOCIAL_PROFILE_URLS`).
- `src/styles/`: Tailwind and typography styling.
- `src/utils/`: Metadata helpers, sitemap generation, structured data, and OG image templates.
- `public/`: Static assets, favicon, early theme toggle script, and custom domain `CNAME`.

### Adding Content

Content lives in `content/` and is synchronized to `src/content/` at build time:
- `content/Article/`: Long-form articles and technical guides (`/posts/<slug>/`).
- `content/Projects/`: Proprietary and commercial projects (`/products/<slug>/`).
- `content/Opensource/`: Open-source repositories and tools (`/products/<slug>/`).
- `content/Notes/`: Micro-notes, tips, and snippets (`/notes/<slug>/`).

You can publish in three ways:
1. **GitHub Website**: Click **Add file** inside any folder in `content/`, write `# Title` and commit.
2. **Local Editor**: Add a `.md` file in `content/<Folder>/` and git push.
3. **CLI**: Run `pnpm run new -- <Article|Projects|Opensource|Notes> "<Title>"`.

See [`docs/WRITING.md`](docs/WRITING.md) for full guidelines, templates, and derivation rules.

### Editing Your Identity Copy

To update your public identity, hero copy, and bio:
- **Site Metadata & Hero**: Edit `src/config.ts`. The `SITE.tagline`, `SITE.desc`, `SITE.bio`, and `SITE.email` fields populate the homepage hero, meta descriptions, JSON-LD schemas, and the About page introduction. Leaving `email` empty cleanly omits contact sections without leaving dead links.
- **About Page Story**: Edit `src/pages/about.mdx`. This file contains the main markdown content rendered on `/about/`. When `SITE.bio` or the MDX body has content, the page automatically marks itself indexable and is included in the sitemap.

## SEO and Social Images

- **OG Image Generation**: Open Graph images (1200x630 static PNGs) are rendered at build time using [Satori](https://github.com/vercel/satori) and [Resvg](https://github.com/RazrFalcon/resvg) with embedded IBM Plex Mono fonts.
  - Site fallback: `/og-default.png` (configured in `src/config.ts`).
  - Articles: `/posts/<slug>/index.png` (label "Article", formatted publish date).
  - Products: `/products/<slug>/index.png` (label "Product", type + status).
  - Notes: `/notes/<slug>/index.png` (label "Note", formatted publish date).
- **Custom Overrides**: Specify `ogImage: "path/or/url"` in post, product, or note frontmatter to override the generated card.
- **Theme Palette**: Colors and typography are managed in `src/utils/og-templates/theme.ts`.
- **Structured Data (JSON-LD)**: Schema.org nodes are injected at build time via `src/utils/structuredData.ts` with a stable `@id` scheme (`https://saurabhaudit.com/#person`, `https://saurabhaudit.com/#website`).
  - Manual verification after deployment: [Schema.org Validator](https://validator.schema.org/) and [Google Rich Results Test](https://search.google.com/test/rich-results) (requires public URL; platform social previews on X and LinkedIn may take time to refresh caches).

## Deployment

The site is hosted on GitHub Pages and automatically deployed on every push to `main` via GitHub Actions (`.github/workflows/deploy.yml`). The custom domain `saurabhaudit.com` is configured through `public/CNAME`. Security headers are enforced at the HTML layer via `<meta http-equiv="Content-Security-Policy">` in `src/layouts/Layout.astro`.

## Use and Attribution

- **Code**: All code snippets, templates, styles, and software logic are licensed under the [MIT License](LICENSE) (Copyright 2026 Saurabh Audit).
- **Content**: All original written content, articles, micro-notes, and product descriptions are licensed under the Creative Commons Attribution 4.0 International License ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). When sharing or adapting content, attribute to:
  > Saurabh Audit, https://saurabhaudit.com
