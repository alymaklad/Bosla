# bosla-web

The Bosla React web MVP frontend (PRD §12.1, FR-WEB-001). Vite + React 19 + TypeScript + Tailwind v4.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Design system — "Bosla Compass"

Defined in `src/index.css` (`@theme` tokens) and mirrored in the Stitch project
"Bosla — Career & Growth Platform (Web MVP)" (design system `Bosla Compass`).

The logo is monochrome, so the palette is *derived* to let the black mark sit natively:

| Token | Value | Used for |
|---|---|---|
| Ink (primary) | `#0F1115` | buttons, headings, nav, the logo |
| Indigo (secondary / guidance) | `#1E3A8A` | links, active nav, career-recommendation accents — the same blue Masar.ai's PDF report uses |
| Amber (tertiary / progress) | `#F59E0B` | XP bars, streaks, level badges **only** |
| Page | `#FAFAF8` | warm off-white background |
| Line | `#E6E7EA` | 1px borders (borders over shadows) |

Type: Space Grotesk (headlines — geometric, echoes the wordmark's angular glyphs), IBM Plex
Sans (body — has an Arabic companion face; Bosla ships EN + AR). 8px radius throughout.

## Logo usage (`public/brand/`)

| File | Source | Where |
|---|---|---|
| `bosla-horizontal.png` | logo #2 | desktop sidebar header, 36px tall |
| `bosla-mark.png` | logo #4 | favicon, mobile top bar, mobile Discover tab icon, collapsed rail |
| `bosla-stacked.png` | logo #1 | reserved for auth/onboarding hero |
| `bosla-wordmark.png` | logo #3 | reserved |

All four were trimmed to their ink bounding box and converted to ink-on-transparent (the
originals were 2500×2500 canvases with the artwork in a narrow band).

## Structure

```
src/
  components/
    Sidebar.tsx     240px desktop nav + level/XP card (level curve = habit-engine levels.ts)
    TopBar.tsx      search, notifications, avatar; compass mark on mobile
    Dashboard.tsx   stats, today's habits, career matches, roadmap, Ask Bosla FAB
    MobileTabs.tsx  <768px bottom tab bar
    Card.tsx        Card + Chip primitives
```

Data in `Dashboard.tsx` is demo data. It maps onto `bosla-services`: habit rows →
`habit-engine` (`statusOf`, `computeStreaks`, the `assumed` origin badge), career matches
→ `career-discovery` assessment output, roadmap → `goal-planner`. Wiring those is the next
step once the backend exists.
