---
name: Calm Directional Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daeb'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#e2e8f9'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c28'
  on-surface-variant: '#45474b'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ecf1ff'
  outline: '#76777b'
  outline-variant: '#c6c6cb'
  surface-tint: '#5d5e63'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1a1c20'
  on-primary-container: '#828489'
  inverse-primary: '#c6c6cc'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e8'
  primary-fixed-dim: '#c6c6cc'
  on-primary-fixed: '#1a1c20'
  on-primary-fixed-variant: '#45474b'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c28'
  surface-variant: '#dce2f3'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg-medium:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-medium:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
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
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an environment of quiet certainty and deliberate orientation for career discovery and long-term habit formation. The aesthetic draws from high-precision editorial tooling and Swiss modernism: restrained, grounded, and structurally uncluttered. 

### Identity & Mark Governance
- The brandmark consists of a monochrome compass-rose icon—four directional arrow heads converging toward a central void—paired with a geometric, faceted uppercase wordmark.
- **Rule of Invariance:** The logo mark and wordmark must remain in monochrome Ink (`#0F1115`) on light surfaces or white on solid dark surfaces. Never recolor the logo with secondary or tertiary tones. Never apply gradients, glow effects, or decorative drop shadows to the mark.

### Emotional Tone & Voice
- Tone is rational, grounded, and quiet. 
- Copywriting avoids hyperbole, false urgency, and excessive enthusiasm. Exclamation points are strictly prohibited across all interfaces, notifications, badges, and empty states. State facts, provide guidance, and show progress.

## Colors

The palette operates on strict functional segregation. Colors serve structural and analytical roles rather than visual embellishment.

### Palette Roles
- **Primary / Ink (`#0F1115`):** Structural authority. Used for all primary actions, core navigation items, typography headlines, borders under emphasis, and the immutable brandmark. Hover state: `#1C1F26`.
- **Secondary / Guidance (`#1E3A8A`):** Wayfinding and insight. Applied to navigation selection indicators (vertical 3px anchor bars and `#E8EDF9` surface tints), interactive links, analytical fit-score indicators, and informational career tags.
- **Tertiary / Progress Only (`#F59E0B`):** Reserved exclusively for momentum and personal agency. Restricted to habit streaks, XP advancement bars, level badging, difficulty indicators, and assumed profile attributes. Surface fill tint: `#FEF3C7`. **Prohibition:** Must never be used for system alerts, warnings, or neutral badges.
- **Neutral Surfaces & Borders:**
  - Page Canvas: `#FAFAF8` (warm neutral foundation).
  - Component Cards: `#FFFFFF`.
  - Border Substrate: `#E6E7EA` (hairline structural containment).
- **Typography Scale:**
  - Primary Text: `#0F1115`
  - Secondary Text: `#5B6270`
  - Muted / Placeholder Text: `#8A8F98`
- **Semantic Validation:**
  - Success: `#16A34A`
  - Danger / Destructive: `#DC2626`

## Typography

The typography pairs the structured geometry of Space Grotesk for titles with the pragmatic legibility of IBM Plex Sans for long-form data, analytical labels, and guidance steps.

- **Headings (Space Grotesk):** Tight tracking of `-0.02em` counters the wide natural aperture of the font, giving titles a compact, engineered stance.
- **Body & Controls (IBM Plex Sans):** Neutral humanist details ensure maximum comfort across high-density habit grids, assessment surveys, and career match breakdowns.
- **Numbers & Metrics:** Use tabular numerals (`tnum`) for XP counts, match percentages, fit score dials, and streak tallies to prevent visual jitter.

## Layout & Spacing

This design system uses a desktop-first shell architecture optimized for prolonged career planning, structured habit tracking, and deep exploration.

### Structural Frame
- **Left Navigation Rail:** Persistent 240px wide sidebar rendered on `#FFFFFF` with a single 1px `#E6E7EA` right border.
- **Top Bar:** Fixed 56px height on `#FFFFFF` with a 1px `#E6E7EA` bottom border, hosting utility search, user profile indicators, and quiet status markers.
- **Main Canvas:** Background in `#FAFAF8`. Maximum content width is capped at 1280px, centered within the remaining viewport with 24px outer horizontal margins.

### Grid Rhythm
- A 12-column layout with 24px (`1.5rem`) gutters governs the dashboard and career modules.
- Standard card padding is fixed to 24px (`space-lg`), creating internal breathing space between dense modular data.
- Small screens reflow the sidebar into an overlay navigation drawer triggered by the top bar, collapsing the 12-column grid to 4 columns with 16px margins.

## Elevation & Depth

Visual order is articulated through structural hairline borders rather than stacked shadows. Surfaces sit flush against the `#FAFAF8` substrate.

- **Flat Container Standard:** Cards, sidebars, headers, and form groupings use solid `#FFFFFF` fills paired with a crisp `1px solid #E6E7EA` border.
- **Zero Shadow Rule:** In-page elements, tables, nested cards, and modals do not cast ambient blur shadows.
- **The Floating Exception:** The single allowed shadow belongs to floating action items that hover continuously above the page plane, specifically the bottom-right conversation trigger:
  - Floating pill shadow: `0 4px 20px -2px rgba(15, 17, 21, 0.12), 0 2px 6px -1px rgba(15, 17, 21, 0.06)`.
- **Interactive Elevation:** Interactive cards do not translate upward or elevate on hover; instead, their border shifts from `#E6E7EA` to `#0F1115` or receives a subtle `#1E3A8A` focus accent.

## Shapes

The interface balances crisp technical edges with accessible containment. 

- **Cards & Data Panels:** Standard border radius is 8px (`0.5rem`).
- **Inputs & Form Controls:** 6px to 8px border radius for ergonomic clarity.
- **Badges & Tags:** 4px radius for dense technical tags; fully rounded pill shape (9999px) for status indicators, streak counters, and the floating conversation prompt.
- **Progress Trackers:** Linear progress tracks use 9999px pill curves to indicate completed momentum fluidly.

## Components

### Buttons
- **Primary:** `#0F1115` background, `#FFFFFF` text, 8px radius, 0 16px padding, height 40px. Hover: `#1C1F26`.
- **Secondary / Subtle:** `#FFFFFF` background, `1px solid #E6E7EA` border, `#0F1115` text. Hover: `#FAFAF8` surface, border `#0F1115`.
- **Guidance Action:** `#1E3A8A` background, `#FFFFFF` text. Used exclusively when triggering AI synthesis or career pathway generation.
- **Floating 'Ask Bosla' Trigger:** Fixed to bottom-right (32px from bottom and right edges). Black `#0F1115` pill button, 48px height, 20px horizontal padding, 9999px radius. Contains a minimalist spark icon preceding the label "Ask Bosla". Elevated with the system's single floating shadow token.

### Navigation Items
- Inactive items: `#5B6270` text, transparent background, 8px padding.
- Active items: `#1E3A8A` text, `#E8EDF9` background tint, accompanied by a solid 3px vertical accent bar on the extreme left edge.

### Chips & Badges
- **Guidance / Career Tags:** `#E8EDF9` fill, `#1E3A8A` label, 4px radius.
- **Progress / Habit Badges:** `#FEF3C7` fill, `#B45309` or `#F59E0B` label, 9999px radius.
- **Assumed Attribute Badge:** `#FFFFFF` fill, `1px solid #F59E0B` dashed or solid border, `#0F1115` label.
- **Neutral / Meta Tags:** `#F4F4F5` fill, `#5B6270` label, 4px radius.

### Cards & Panels
- Background: `#FFFFFF`.
- Border: `1px solid #E6E7EA`.
- Corner Radius: `8px`.
- Padding: `24px` uniform.
- Header sections within cards separate via a 1px border rule or 16px bottom margin.

### Habit & Discovery Modules
- **Habit Streak Tracker:** Features numeric counter in tabular figures with small `#F59E0B` flame glyph. Progress bars are 6px tall with `#F59E0B` active fill and `#E6E7EA` background track.
- **Fit-Score Rings:** Rendered using clean SVG radial meters. Track: `#E6E7EA`; stroke accent: `#1E3A8A`; center metric displayed in bold Space Grotesk.

### Form Inputs
- Height 40px, `#FFFFFF` background, `1px solid #E6E7EA` border, 8px radius, `#0F1115` text.
- Focus state: `1px solid #1E3A8A` border with zero glowing outer ring.
- Placeholder text: `#8A8F98`.