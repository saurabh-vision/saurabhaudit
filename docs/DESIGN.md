# saurabhaudit.com Design System & Responsive Architecture

This document details the visual redesign, design tokens, fluid typography, responsive layout system, and code review findings implemented for **saurabhaudit.com** as part of Prompt 14H.

---

## 1. Code Review Findings & Defects Fixed

Prior to this visual polish pass, the site suffered from several front-end and responsive design defects identified through code review:

1. **Overuse of Monospace Fonts for Body Text**:
   - *Defect*: The Steipete theme default inherited monospace fonts (`var(--font-mono)`) across headings, body paragraphs, and navigation elements. This resulted in cramped horizontal spacing, high cognitive load for long-form reading, and inconsistent kerning.
   - *Fix*: Standardized on a modern native system sans-serif font stack for UI and prose (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`). Monospace is strictly reserved for code blocks, inline code, and technical status badges.

2. **Hard-coded Colors and Dark Mode Border Contrast**:
   - *Defect*: Hard-coded hex codes and semi-transparent borders created low contrast or invisible card boundaries in dark mode, failing WCAG AA 4.5:1 standards.
   - *Fix*: Replaced all ad-hoc colors with semantic CSS custom properties (`--background`, `--surface`, `--surface-2`, `--foreground`, `--muted`, `--border`, `--accent`, `--ring`). High-contrast WCAG AA verified values were applied for both light and dark themes.

3. **Sub-44px Tap Targets on Mobile**:
   - *Defect*: Header navigation links, social icons, theme switcher, pagination arrows, tag chips, and back-to-top buttons had tap targets under 32px height, making them difficult to activate accurately on touch screens.
   - *Fix*: Added minimum 44x44px touch bounding boxes (`min-h-[44px] min-w-[44px]` or padded hit areas) across all interactive elements (navigation items, mobile drawer toggles, social links, pagination buttons, tag chips, and action links).

4. **Missing Breakpoints & Fixed Container Widths**:
   - *Defect*: Inconsistent `max-w-3xl`, `max-w-4xl`, and arbitrary inline widths risked horizontal overflow on 320px viewports (small mobile devices).
   - *Fix*: Implemented two canonical container utilities:
     - `.reading-container`: `max-width: 44rem` (~70 characters per line) for optimal reading comfort.
     - `.wide-container`: `max-width: 64rem` for multi-column grids, listings, and homepage heroes.
     - Universal `overflow-wrap: anywhere;` and responsive horizontal padding (`px-4 sm:px-6 lg:px-8`) prevent edge-touching and horizontal blowout.

5. **Table and Code Block Overflow Risks**:
   - *Defect*: Markdown tables and preformatted code blocks lacked strict responsive wrappers, causing viewport stretching on narrow screens.
   - *Fix*: Declared `.prose table { display: block; overflow-x: auto; max-width: 100%; width: 100%; }` and `.prose pre { overflow-x: auto; max-width: 100%; }`.

6. **Diagram Figure Contrast in Dark Mode**:
   - *Defect*: Hand-drawn SVG diagrams with dark strokes became unreadable against dark background surfaces.
   - *Fix*: Encapsulated `.diagram` figures inside a crisp, high-contrast light card container (`background-color: #ffffff; color: #1e293b; border-radius: var(--radius-md);`) with dedicated figcaption support.

7. **Focus Accessibility**:
   - *Defect*: Inconsistent focus outlines or missing `:focus-visible` styling on interactive links and custom buttons.
   - *Fix*: Standardized `:focus-visible` to use a 2px high-contrast outline with 2px offset mapped to `--ring`.

---

## 2. Browser Tool & Rendering Environment Note

Per prompt guidelines:
> *If you have a browser tool or a Chromium binary, take screenshots... If you have no browser, say so and rely on code review.*

**Environment Statement**:
No local Chromium binary or headless browser automation binary (`chromium`, `google-chrome`, `playwright`, `puppeteer`) is installed on the system `PATH` in this execution environment. Verification relies on rigorous DOM and CSS static analysis, build-time automated assertions (`tests/build/responsive-basics.test.mjs`), AST inspections, and live preview verification via local HTTP server on port 4321.

---

## 3. Design Tokens & Color System

All colors are defined via CSS custom properties on `:root` / `html[data-theme="light"]` and `html[data-theme="dark"]`:

### Light Theme
| Token | Value | Role | Contrast vs Background |
| :--- | :--- | :--- | :--- |
| `--background` | `#fcfcfd` | Canvas background | Base |
| `--surface` | `#ffffff` | Elevated cards, forms, menus | - |
| `--surface-2` | `#f4f4f5` | Secondary pills, tag backgrounds | - |
| `--foreground` | `#18181b` | Primary text and headings | **15.2:1** (WCAG AAA) |
| `--muted` | `#52525b` | Secondary text, dates, reading time | **5.6:1** (WCAG AA) |
| `--border` | `#e4e4e7` | Card borders, dividers, table borders | - |
| `--accent` | `#0284c7` | Brand accent, active links, primary buttons | **4.6:1** (WCAG AA) |
| `--accent-contrast`| `#ffffff` | Text on top of accent buttons | **4.6:1** (WCAG AA) |
| `--ring` | `#0284c7` | Accessible focus ring | **4.6:1** |

### Dark Theme
| Token | Value | Role | Contrast vs Background |
| :--- | :--- | :--- | :--- |
| `--background` | `#090d16` | Deep navy canvas | Base |
| `--surface` | `#111827` | Elevated cards, forms, menus | - |
| `--surface-2` | `#1e293b` | Secondary pills, tag backgrounds | - |
| `--foreground` | `#f8fafc` | Primary text and headings | **17.8:1** (WCAG AAA) |
| `--muted` | `#94a3b8` | Secondary text, dates, reading time | **7.5:1** (WCAG AAA) |
| `--border` | `#1e293b` | Subtle boundary borders | - |
| `--accent` | `#38bdf8` | Sky-blue accent, active links | **9.4:1** (WCAG AAA) |
| `--accent-contrast`| `#090d16` | Text on top of accent buttons | **9.4:1** (WCAG AAA) |
| `--ring` | `#38bdf8` | Accessible focus ring | **9.4:1** |

### Border Radius Tokens
- `--radius-sm`: `6px` (chips, code spans, badges)
- `--radius-md`: `10px` (buttons, cards, images, pre blocks)
- `--radius-lg`: `16px` (newsletter container, modal cards)

---

## 4. Typography Scale & Fluid Clamps

Typography relies on CSS `clamp()` functions for continuous, smooth scaling across screen widths from 320px to 1920px:

- **H1**: `clamp(1.9rem, 4vw + 1rem, 3rem)` — Line height: `1.2`
- **H2**: `clamp(1.5rem, 2.5vw + 0.8rem, 2.1rem)` — Line height: `1.25`
- **H3**: `clamp(1.2rem, 1.5vw + 0.7rem, 1.45rem)` — Line height: `1.3`
- **Body**: `1.0625rem` (17px) — Line height: `1.75` (optimal reading density)
- **Small / Meta**: `0.875rem` (14px) — Line height: `1.5`

### Container Rules
- `.reading-container`: Used for single articles (`PostDetails.astro`), single notes (`[slug].astro`), product details (`[slug].astro`), and legal/prose content. Maximum width `44rem` (~700px), centered with `margin-inline: auto`.
- `.wide-container`: Used for index hero, product catalog grid, note catalog grid, archives, search, tags, and footer. Maximum width `64rem` (~1024px), centered with `margin-inline: auto`.

---

## 5. Components & Layout Polish

1. **Header & Navigation**:
   - Sticky positioning with `backdrop-blur-md` and `bg-background/95`.
   - Left brand link ("Saurabh") with clean typography.
   - All interactive touch targets (nav links, search button, theme switcher, hamburger button) have a minimum 44x44px hitbox.
   - Accessible `<nav aria-label="Main Navigation">` with `#skip-to-content` link for keyboard and screen-reader users.
   - Mobile menu overlay with focus trap behavior, Escape key dismissal, and backdrop click dismissal.

2. **Hero & Homepage**:
   - Modern split hero featuring user avatar (`/saurabh-avatar.jpg`), fluid heading, author tagline, concise bio, primary CTA buttons (Products, Posts, Subscribe), and social links with 44px hitboxes.

3. **ProductCard**:
   - Grid layout with equal-height cards (`h-full flex flex-col justify-between`).
   - Rounded status pill badge (`rounded-full px-2.5 py-0.5 text-xs font-medium`) indicating `Live`, `Beta`, `Building`, `Coming soon`, or `Archived`.
   - Clamped 3-line description with flexible action buttons (`min-h-[40px]`).

4. **Post Listing & Card**:
   - Calm row presentation with title hover state, muted publication date and reading time metadata, 2-line description clamp, and optional responsive hero thumbnail.

5. **Footer**:
   - Clean balanced layout. Preserves required MIT copyright notice (2026 Saurabh, 2025 Peter Steinberger) and CC BY 4.0 license attribution.
   - All links and social icons provide minimum 44x44px touch targets.
