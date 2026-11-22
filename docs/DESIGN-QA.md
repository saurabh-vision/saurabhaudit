# Responsive Design QA Checklist & Manual Test Plan

This checklist outlines the manual QA verification procedures across viewports and interaction scenarios for **saurabhaudit.com**.

---

## 1. Viewport Matrix

| Target Device | Viewport Width | Aspect / Mode | Key Validation Areas |
| :--- | :--- | :--- | :--- |
| **Small Mobile** (iPhone SE, Galaxy A) | **320px – 360px** | Portrait | Zero horizontal page blowout, hamburger menu, header tap targets, table horizontal scroll. |
| **Standard Mobile** (iPhone 13/14/15, Pixel 7/8) | **375px – 390px** | Portrait | Single column layouts, fluid H1 scaling, card padding, tap target hitboxes. |
| **Large Mobile** (iPhone Pro Max, Galaxy Ultra) | **414px – 430px** | Portrait | Action button wrapping, hero photo alignment, tag chip spacing. |
| **Tablet Portrait** (iPad Mini, iPad 10th gen) | **768px – 820px** | Portrait | 2-column product grid, 2-column note grid, related content grid, navigation transition. |
| **Tablet Landscape / Small Laptop** | **1024px** | Landscape | Full desktop horizontal navbar visible, 3-column related content, wide hero layout. |
| **Standard Laptop / Desktop** | **1280px** | Landscape | Max reading container width (44rem) centered, wide container (64rem) centered. |
| **High-DPI / Large Desktop** | **1536px – 1920px** | Landscape | Layout remains centered with clean lateral whitespace; no stretching. |

---

## 2. Interactive Component Checklist

### A. Navigation & Header
- [ ] **Skip-to-Content**: Pressing `Tab` immediately upon page load reveals `#skip-to-content`. Pressing `Enter` jumps directly to `#main-content`.
- [ ] **Sticky Header**: On scrolling down, header stays anchored to the top with subtle backdrop blur and border divider.
- [ ] **Touch Targets**: All header items (Brand link, Nav links, Search button, Theme toggle, Hamburger menu) have an interactive hitbox >= 44x44px.
- [ ] **Mobile Menu**:
  - [ ] Opening menu displays all navigation items in a clean column.
  - [ ] Background body scroll is locked while open.
  - [ ] Pressing `Escape` or tapping the backdrop closes the menu.
  - [ ] Tapping any navigation link navigates and closes the menu.

### B. Theme Switcher (Dark / Light)
- [ ] Tapping the theme toggle smoothly alternates between light and dark modes.
- [ ] Light theme background is `#fcfcfd`, cards `#ffffff`, primary text `#18181b`.
- [ ] Dark theme background is `#090d16`, cards `#111827`, primary text `#f8fafc`.
- [ ] Contrast between text and background passes WCAG AA 4.5:1 in both modes.
- [ ] Code syntax highlighting remains readable in both light and dark modes.
- [ ] Theme preference persists across page reloads via `localStorage`.

### C. Cards & Listings
- [ ] **Product Cards**:
  - [ ] Status pill badges (`Live`, `Beta`, `Building`, `Coming soon`, `Archived`) render with distinct colors, borders, and rounded pill shape.
  - [ ] Descriptions are clamped to 3 lines without text clipping.
  - [ ] Action buttons wrap cleanly without overflowing the card container.
  - [ ] Grid cards maintain equal height per row.
- [ ] **Post Cards**:
  - [ ] Calm row layout with muted metadata (date & reading time).
  - [ ] Article titles change color to `--accent` on hover.
  - [ ] Thumbnails scale gently on hover without layout shifting.
- [ ] **Note Cards**:
  - [ ] Clean elevated card with crisp borders.
  - [ ] Source links and tags wrap cleanly.

### D. Reading Experience & Prose
- [ ] **Reading Container**: Prose content never exceeds 44rem (~70ch), maintaining optimal reading comfort.
- [ ] **Fluid Typography**: Headings resize smoothly from mobile (320px) to desktop (1280px) via `clamp()` without sudden layout jumps.
- [ ] **Code Blocks**: Long code lines trigger internal horizontal scrolling within the `pre` container. The page itself never blows out horizontally.
- [ ] **Tables**: Wide tables scroll horizontally within their container on screens narrower than the table width.
- [ ] **Diagrams**: All `.diagram` SVGs are rendered within a high-contrast container with caption text.

### E. Forms & Footer
- [ ] **Newsletter Form**:
  - [ ] Renders as an elevated card (max-width 32rem / 480px) centered on the page.
  - [ ] Substack iframe is responsive (100% width) and does not cause horizontal overflow.
  - [ ] Fallback link renders properly in `<noscript>`.
- [ ] **Footer**:
  - [ ] Balanced layout on mobile, clean horizontal flex row on tablet/desktop.
  - [ ] Copyright and license notices are legible.
  - [ ] Social links have >= 44x44px hitboxes.

### F. Accessibility & Reduced Motion
- [ ] **Focus Visible**: All interactive elements display a 2px high-contrast outline (`--ring`) when navigated via keyboard.
- [ ] **Reduced Motion**: When `prefers-reduced-motion: reduce` is enabled in OS settings, transitions and smooth scrolling are disabled.
