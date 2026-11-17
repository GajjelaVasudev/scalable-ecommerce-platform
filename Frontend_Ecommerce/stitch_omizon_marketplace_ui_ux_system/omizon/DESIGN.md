---
name: OMIZON
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded6f2'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f1ff'
  surface-container: '#f2ebff'
  surface-container-high: '#ece4ff'
  surface-container-highest: '#e6defa'
  on-surface: '#1d192d'
  on-surface-variant: '#4a4456'
  inverse-surface: '#322e42'
  inverse-on-surface: '#f5eeff'
  outline: '#7b7487'
  outline-variant: '#ccc3d9'
  surface-tint: '#7228ee'
  primary: '#5c00d2'
  on-primary: '#ffffff'
  primary-container: '#762ff2'
  on-primary-container: '#e7d9ff'
  inverse-primary: '#d1bcff'
  secondary: '#5b3eda'
  on-secondary: '#ffffff'
  secondary-container: '#745af4'
  on-secondary-container: '#fffbff'
  tertiary: '#4d427c'
  on-tertiary: '#ffffff'
  tertiary-container: '#655a96'
  on-tertiary-container: '#e3daff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d1bcff'
  on-primary-fixed: '#24005b'
  on-primary-fixed-variant: '#5800c8'
  secondary-fixed: '#e5deff'
  secondary-fixed-dim: '#c9bfff'
  on-secondary-fixed: '#1a0063'
  on-secondary-fixed-variant: '#451fc4'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#cbbeff'
  on-tertiary-fixed: '#1d104a'
  on-tertiary-fixed-variant: '#493e78'
  background: '#fdf7ff'
  on-background: '#1d192d'
  surface-variant: '#e6defa'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  price-hero:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  price-card:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-tier multi-category marketplace aesthetic, balancing vast catalog density with luxury restraint. It shifts away from generic discount-driven commerce through deep structural violet tones, razor-sharp editorial clarity, and rigorous visual rhythm. The emotional posture conveys unwavering operational reliability, curated breadth, and swift precision.

The design movement combines **Modern High-End Utility** with **Subtle Structural Architecture**:
- Content-forward, clutter-free layouts that elevate diverse product categories (from precision consumer electronics to editorial beauty and high-turnover grocery essentials).
- Deep midnight architectural containers acting as anchors for navigation, persistent checkout bars, and discovery filters.
- Disciplined typographic scale featuring balanced hierarchy, dedicated editorial product title treatments, and monospace-aligned tabular numerals optimized for global commerce and INR (`₹`) currency readouts.
- High-contrast, tactile micro-affordances that ensure accessible, fast-paced purchasing and multi-item basket management.

## Colors

The color system operates across two tuned surface systems—a bright, airy Porcelain light mode and an immersive Obsidian Violet dark mode—tied together by a deep violet brand spine.

### Light Palette (Default)
- **Primary Interactive (Electric Violet):** `#762FF2` — High-intent primary buttons, active category pills, focused form outlines, checkout progress indicators.
- **Secondary / Hover (Royal Purple):** `#4C2ACB` — Interactive hover states, active pagination, secondary link text, active sorting criteria.
- **Brand Dominant / Anchor (Midnight Violet):** `#190B46` — Global navigation banners, mega-menu backgrounds, dense transactional footer, and contrast accents.
- **Base Canvas (Porcelain):** `#F7F7FB` — Background canvas providing separation against card surfaces without eye strain.
- **Primary Surface (Pure White):** `#FFFFFF` — Product cards, modal dialogs, drawers, and elevated table containers.
- **Dividers & Structural Borders (Lavender Mist):** `#E8E6F0` — 1px hairpins on cards, header dividers, and filter accordions.
- **Text & Content (Ink):** `#211D31` — Primary typography; secondary typography relies on `#655E7A`; muted timestamps and disclaimers use `#928B9F`.

### Dark Palette (Commerce Mode)
- **Base Canvas (Obsidian Violet):** `#100A25`
- **Elevated Surface (Container Tier 1):** `#1D1537`
- **Secondary Elevated Surface (Container Tier 2 / Flyouts):** `#211735`
- **Structural Borders:** `#382B54`
- **Primary Text:** `#F7F5FF`
- **Secondary Text:** `#C3BCD7`
- **Muted Text:** `#A49ABF`

### Semantic Functional Roles
- **Success / Stock Affirmation:** `#00875A` (Light) / `#22C55E` (Dark)
- **Warning / Fast-Selling Low Inventory:** `#E27300` (Light) / `#F59E0B` (Dark)
- **Critical / Form Error / Out of Stock:** `#D92D20` (Light) / `#EF4444` (Dark)
- **Badge Accent (Deal / Fast Delivery):** `#5E17EB` with 8% alpha tint on backdrops.

## Typography

The type scale combines **Space Grotesk** for display headers and editorial campaign titles with **Inter** for core UI, faceted filters, metadata, and numerical product metrics.

### Numbers & Pricing Rules
- All price representations use `font-variant-numeric: tabular-nums lining-nums` to guarantee aligned columns in shopping carts, order summaries, and seller payout matrices.
- Currency symbols (`₹`, `$`, `€`) render at identical font-weight to their trailing numerals, with a non-breaking space separation (`U+00A0`) or tighter inline margin (`0.15ch`).

### Editorial Product Titles
- Category and product detail titles prioritize high legibility at multi-line wrappings.
- Card titles clip cleanly with CSS `line-clamp: 2` at `title-sm` or `title-md`, maintaining unified baseline grids across catalog cards.

## Layout & Spacing

The layout is built upon an 8pt base grid with a fluid responsive mechanism maxing out at a 1440px desktop shell.

### Grid Anatomy
- **Desktop (1280px+):** 12-column layout, `gutter: 1.5rem (24px)`, `margin: 2rem (32px)`. Centered container bounded at a maximum of `1440px`.
- **Tablet (768px – 1279px):** 8-column layout, `gutter: 1rem (16px)`, `margin: 1.5rem (24px)`.
- **Mobile (< 768px):** 4-column layout, `gutter: 0.75rem (12px)`, `margin: 1rem (16px)`.

### Catalog Density & Reflow
- **Product Grids:** Desktop standard spans 4 columns (yielding a 4-card row) or 3 columns (for high-density 5-card listing pages). Tablet collapses to 2 or 3 columns. Mobile uses a dual-column layout (`grid-template-columns: repeat(2, 1fr)`) with a dedicated horizontal-scrolling strip option for flash sales.
- **Filter Rail:** Desktop reserves a fixed `280px` left rail, collapsing into an off-canvas drawer on screens under `1024px`.

## Elevation & Depth

Depth relies on low-contrast structural boundaries reinforced by faint ambient shadows tinted with brand violet. Heavy dropshadows are forbidden; surfaces feel machined, planar, and crisp.

### Elevation Hierarchy
- **Level 0 (Flat / Canvas):** Porcelain canvas (`#F7F7FB`). Zero shadow, boundaries enforced via `#E8E6F0` 1px borders.
- **Level 1 (Card Resting):** Background `#FFFFFF`, border `1px solid #E8E6F0`, box shadow `0 1px 3px rgba(25, 11, 70, 0.04), 0 1px 2px rgba(25, 11, 70, 0.02)`.
- **Level 2 (Hover / Card Elevation):** Box shadow `0 8px 24px -4px rgba(25, 11, 70, 0.08), 0 2px 6px -1px rgba(25, 11, 70, 0.04)`. Border shifts slightly toward primary interactive: `1px solid rgba(118, 47, 242, 0.25)`. Subtle `transform: translateY(-2px)` on interactive product listings.
- **Level 3 (Flyout Menus, Category Dropdowns, Autocomplete):** Box shadow `0 16px 36px -8px rgba(25, 11, 70, 0.12), 0 4px 12px -2px rgba(25, 11, 70, 0.06)`. Border `1px solid #E8E6F0`.
- **Level 4 (Modals, Slide-over Cart Drawers):** Box shadow `0 24px 48px -12px rgba(25, 11, 70, 0.22)`. Backdrop utilizes Midnight Violet with blur: `rgba(25, 11, 70, 0.5)` with `backdrop-filter: blur(6px)`.

### Dark Mode Adjustments
In dark mode, shadows convert to ambient glow boundaries with deep ink occlusion:
- Level 1 uses `1px solid #382B54` with zero drop shadow.
- Level 2 leverages `0 8px 24px rgba(0, 0, 0, 0.45)` coupled with a surface shift to `#211735`.

## Shapes

The design system standardizes on a calibrated corner radius scale to reflect modern consumer hardware and clean retail packaging.

- **Base Radius (`rounded-md`):** `8px (0.5rem)` — Standard buttons, input text fields, select menus, quantity steppers, checkbox/radio hit areas, and category tags.
- **Container Radius (`rounded-lg`):** `12px (0.75rem)` — Primary product cards, filter container cards, modal dialogs, and image preview galleries.
- **Pill Radius (`rounded-full`):** `9999px` — Status badges ("Bestseller", "Only 2 left"), category search chips, discount indicators, and live notification dots.
- **Sharp Rule:** Nested interior thumbnails within 12px cards maintain a 6px or 8px inner radius to preserve optical concentricity.

## Components

### Buttons
- **Primary:** Background `Electric Violet (#762FF2)`, text `#FFFFFF`, border `none`, border-radius `8px`. Hover: `Royal Purple (#4C2ACB)`. Active: scale `0.985`, background `#3E1FB3`. Focus visible: `2px solid #FFFFFF`, `4px solid #762FF2`.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #E8E6F0`, text `Ink (#211D31)`. Hover: Surface `#F7F7FB`, border color `#762FF2`.
- **Ghost / Tertiary:** No fill, text `Royal Purple (#4C2ACB)`. Hover: `rgba(118, 47, 242, 0.08)` surface fill.
- **Sizes:** Compact (`32px` height, `12px` font), Default (`40px` height, `14px` font), Large CTA (`48px` height, `16px` font, full-width checkout ready).

### Chips & Badges
- **Category Filter Chips:** Neutral state has `#FFFFFF` background with `1px solid #E8E6F0` and `Ink` text. Active state uses `#190B46` background with `#FFFFFF` text and zero border, or `Electric Violet` fill with an instant-remove icon.
- **Product Promo Badges:** Compact capsule (`height: 22px`, `padding: 0 8px`, `rounded-full`). Discounts use `rgba(118, 47, 242, 0.1)` tint with `#762FF2` bold label; urgency badges use `rgba(226, 115, 0, 0.12)` with `#E27300` text.

### Product Cards
- **Structure:** White background, `12px` rounded corners, `1px solid #E8E6F0`.
- **Aspect Ratio:** Primary image container set to `1:1` or `3:4` with a neutral `#F7F7FB` backdrop, containing a favorite heart toggle pinned top-right.
- **Data Architecture:** Brand name (`body-sm`, muted), Product Title (`title-sm`, 2-line clamp), Star Rating with aggregate count inline, Price block (`price-card`, bold) accompanied by strike-through MSRP and discount percentage.
- **Hover Reveal:** Optional "Quick Add" button transitions from bottom on desktop pointer hover.

### Form Inputs & Quantity Steppers
- **Text Inputs:** Height `44px`, background `#FFFFFF`, border `1px solid #E8E6F0`, radius `8px`, typography `body-md`. Focus: border `1px solid #762FF2`, ring `3px rgba(118, 47, 242, 0.15)`. Error: border `#D92D20`, ring `3px rgba(217, 45, 32, 0.15)`.
- **Quantity Steppers:** Segmented container (`height: 36px`, border `1px solid #E8E6F0`, radius `8px`). Two `36x36px` icon tap zones (`-` and `+`) sandwiching a tabular-numeral quantity display. Disabled minus button transitions to a trashcan icon when quantity reaches 1.

### Checkboxes & Radios
- Size `18x18px`, `border: 1.5px solid #C3BCD7`, radius `4px` (checkbox) or `rounded-full` (radio).
- Checked: background `#762FF2`, border `#762FF2`, white custom SVG checkmark / inner dot.

### Filter Accordions & Sidebar
- Borderless collapsible drawers separated by `1px solid #E8E6F0` horizontal lines.
- Sticky vertical scroll supporting searchable sub-lists (brands, specifications, rating cutoffs) and price-range dual sliders with real-time numeric inputs.

### Enterprise Data & Order Tables
- Striped or single-surface rows over `#FFFFFF` with `1px solid #E8E6F0` row bottom dividers.
- Sticky header container utilizing `#F7F7FB` with uppercase micro-labels (`label-sm`).
- Tabular figures aligned flush right for prices, quantities, and operational SKUs.