# Zieg’s on a Mission Merch — Design System & Branding

Visual direction for the **Zieg’s on a Mission** site and **Zieg’s on a Mission Merch** store, in ministry partnership with **Team Expansion**. Tokens are implemented in `src/app/globals.css` (CSS variables + Tailwind v4 `@theme`).

---

## Brand Attributes

- Warm, mission-minded, approachable  
- Clear hierarchy: ministry story first, merch as a supporting way to partner  
- Strong but calm contrast (sky/ink palette, gold accent, optional deep red for emphasis)  

---

## Color Palette

| Role | Name | Hex (reference) | Usage |
|------|------|-------------------|--------|
| **Primary / header band** | Sky blue | `#83b0da` | Header, brand primary surfaces (`--brand-primary`) |
| **Accent** | Warm gold | `#edb73e` | Buttons, highlights (`--brand-accent`) |
| **Ink** | Deep slate | `#1e3644` | Body text on light surfaces (`--brand-ink`) |
| **Surface** | Warm cream | `#eae5e1` | Page background (`--brand-surface`, `--cream`) |
| **Deep red** | Mission red | `#8b2f31` | Badges, emphasis (`--brand-deep-red`) |

Tailwind-style tokens exposed from `@theme` include `--color-brand-primary`, `--color-brand-accent`, `--color-brand-ink`, `--color-brand-deep-red`, `--color-cream`. Prefer these over hard-coded hex in new UI.

---

## Typography

| Use | Font | Notes |
|-----|------|--------|
| **UI / body** | Geist Sans (Next font) | Default layout font |
| **Mono** | Geist Mono | Code, technical labels |
| **Display** | `font-serif` where used | Section titles, footer name treatment |

---

## Logo & Imagery

- **Header:** `public/logo/team-expansion.png` (Team Expansion wordmark lockup).  
- **Hero / marketing:** `public/images/hero-zieg-mission.png`, `public/images/zieg-hero.png` as needed.  
- **Favicon / OG:** `public/icon.png`, `public/apple-touch-icon.png`, `public/og-image.jpg`.  
- Maintain clear space; do not stretch or clip logos awkwardly on small screens.  

---

## Buttons & CTAs

- **Primary:** `bg-brand-accent` + `text-brand-ink` (gold on dark-friendly ink).  
- **Links on header:** White / near-white on `--brand-primary` header band.  
- **Outline / secondary:** Border using brand primary or zinc in admin dark theme.  

---

## Storefront vs Admin

- **Storefront:** Light mission surface, brand primary header, serif touches for name/footer.  
- **Admin:** Dark shell (`bg-black`, `text-cream`) with brand primary links and gold accent for primary actions.  

---

## shadcn/ui

Base components follow shadcn patterns; map destructive and focus rings to the palette above. Admin forms use dark-friendly input styling via layout wrappers.  
