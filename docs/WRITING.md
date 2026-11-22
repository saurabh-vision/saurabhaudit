# Publishing & Writing Guide

Publishing on `saurabhaudit.com` is drop-in: add **one markdown file** inside a folder in `content/`, push, and the site builds automatically.

---

## 1. The Three Ways to Publish

### Method A: GitHub Website (Fastest, No Terminal Required)
1. Navigate to the repository on GitHub.
2. Open `content/Article/`, `content/Projects/`, `content/Opensource/`, or `content/Notes/`.
3. Click **Add file** -> **Create new file**.
4. Name the file `<your-slug>.md`.
5. Write your content with a simple `# Title` and commit to `main`. The build syncs and publishes it automatically.

### Method B: Local Editor + Git Push
1. Create a markdown file directly in:
   - `content/Article/<slug>.md` -> Articles (`/posts/<slug>/`)
   - `content/Projects/<slug>.md` -> Products (`/products/<slug>/`)
   - `content/Opensource/<slug>.md` -> Open Source (`/products/<slug>/`)
   - `content/Notes/<slug>.md` -> Micro-notes (`/notes/<slug>/`)
2. Commit and push to `main`.

### Method C: CLI Command
```bash
pnpm run new -- <Article|Projects|Opensource|Notes> "My New Title"
```
This generates `content/<Folder>/my-new-title.md` with today's date from the template.

---

## 2. Minimal File Formats

Header lines can be standard YAML frontmatter (`---`) OR plain `key: value` lines at the very top.

### Article
```markdown
# How I Scale a Flask App

First paragraph explaining architecture in simple words. This paragraph automatically becomes the search snippet and description if not explicitly set.

## Body Section

Continue writing here...
```

### Project (App / Web Tool)
```markdown
type: android-app
status: live
playstore: https://play.google.com/store/apps/details?id=com.example.app

# ScanXpert

High-performance native Android document scanner and PDF viewer.
```

### Open Source Project
```markdown
type: open-source
status: live
github: https://github.com/saurabh-vision/clipvault

# ClipVault

An open-source, 100% offline clipboard manager and encrypted password vault for Android.
```

### Micro-Note
```markdown
# Avoid Pinning Secrets to Home Screen Widgets

Android widget RemoteViews are serialized across IPC boundaries into system server process memory. Storing plaintext encryption keys or credentials in RemoteViews memory violates Android security best practices.
```

---

## 3. Supported Fields & Defaults

| Field | Description | Defaults & Derivations |
| --- | --- | --- |
| `title` | Title of article / product / note | Derived from first `# Title` line |
| `description` | Summary / search snippet | Derived from first paragraph (cut at word boundary <= 155 chars) |
| `date` / `pubDatetime` | Publication timestamp | Derived from first git commit date, or today's date |
| `updated` / `modDatetime` | Last modification timestamp | Optional |
| `tags` | Comma-separated list or array | Article: `["others"]`; Projects/Opensource/Notes: `[]` |
| `type` | Product category | Projects: `"other"`; Opensource: `"open-source"` |
| `status` | Product lifecycle | Projects: `"building"`; Opensource: `"live"` |
| `links` | Product URLs (github, website, playstore, appstore) | Mapped from link aliases (`github:`, `website:`, `playstore:`) |
| `draft` | Exclude from publication | Default: `false` |

---

## 4. Media & Images

1. Place images in `public/images/` (e.g. `public/images/architecture.png`).
2. Reference them in markdown as `![Descriptive Alt Text](/images/architecture.png)`.
3. **Alt text is required**: empty alt text (`![](...)`) will fail the build.

---

## 5. Drafts & Private Writing

- **Public Drafts**: Set `draft: true` in header lines, or prefix the file/folder name with `_` (e.g., `_my-draft.md` or `content/Article/_wip/`). Drafts are completely excluded from the public build, sitemaps, RSS, and Pagefind.
- **Private Scratchpad**: The `/writing/` directory is git-ignored and never committed or published.

---

## 6. Error Cheat Sheet

The build sync validates all content and reports friendly multi-error messages before exiting:

| Error Message | How to Fix |
| --- | --- |
| `Missing title` | Add `# Your Title` at the top or `title: ...` |
| `Missing description` | Add an opening paragraph or `description: ...` |
| `Description is too long` | Keep description to 160 characters or less |
| `URL is not https` | All product links must use secure `https://` protocol |
| `Unknown product type` | Use one of: `android-app`, `web-app`, `tool`, `library`, `open-source`, etc. |
| `Live or beta product has no links` | Add at least one valid link (`github:`, `website:`, `playstore:`) |
| `Slug collides with ...` | Rename the file to ensure unique slugs across categories |
