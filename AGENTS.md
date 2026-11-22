# Working on this site

Use the Node version declared in `package.json` (currently Node 24+) and the pinned pnpm version through Corepack. Run `pnpm run check`, `pnpm exec astro check`, and `pnpm run build` before landing changes. The production build includes the Pagefind search index. Use `pnpm run preview` for browser verification; do not leave a development server running unattended.

Site configuration lives in `src/config.ts`; social and sharing links live in `src/constants.ts`. `src/content.config.ts` defines the blog frontmatter schema. GitHub Actions handles automatic deployments to GitHub Pages on pushes to `main`. Security policies are declared via `<meta http-equiv="Content-Security-Policy">` in `src/layouts/Layout.astro`; custom domain canonicalization is handled by `public/CNAME`.

## Licensing

- **Code**: MIT License (dual copyright: 2026 Saurabh Audit, 2025 Peter Steinberger).
- **Content**: Creative Commons Attribution 4.0 International (CC BY 4.0) with required credit line: `"Saurabh Audit, https://saurabhaudit.com"`.

## Content architecture

Content is authored inside `content/` and automatically synchronized into `src/content/` during build and dev:
- `content/Article/` -> Blog articles (`/posts/<slug>/`)
- `content/Projects/` -> Products and web applications (`/products/<slug>/`)
- `content/Opensource/` -> Open-source projects (`/products/<slug>/`)
- `content/Notes/` -> Micro-notes and snippets (`/notes/<slug>/`)
- `content/_templates/` -> Default scaffolding templates

To add new content:
- Use `pnpm run new -- <Article|Projects|Opensource|Notes> "<Title>"` or directly create a markdown file in the appropriate folder.
- Run `pnpm run check`, `pnpm exec astro check`, and `pnpm run build` to validate.
- Automated tests: `pnpm run test`, `pnpm run test:products`, `pnpm run test:notes`, `pnpm run test:build`.

## Dependencies

Query the registry for current compatible stable versions; never guess versions or downgrade to hide a failure. Use pnpm to update the lockfile, then run the full checks and production build. Follow the task's release-age policy.
