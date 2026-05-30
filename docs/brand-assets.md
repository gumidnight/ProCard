# ProCard.gg — Brand Asset System

> **Last updated:** 2026-05-29  
> This document is the single source of truth for ProCard brand assets, visual guidelines, and post creation rules.

---

## Product Context

**Name:** ProCard.gg  
**Tagline:** "Your verified esports identity. One link."  
**Positioning:** Linktree for competitive esports — live Riot API rank data, team history, and verified identity in a single shareable profile.  
**Audience:** Competitive players, coaches, analysts, scouts, casters, and esports orgs.

---

## Logo System

### Mark (Icon)

An angular geometric **shield** with an integrated **"P" monogram** and a sharp
downward tip. Two interlocking halves — a white shield frame and a bold orange
"P" — built from negative space. Conveys: verified identity (shield) + player /
pro (P) + competitive esports badge.

The mark is a raster asset (high-resolution PNG with a transparent background),
exported from the master at [mark-master.png](../public/brand/mark-master.png).

**Mark variants:**

- [mark.png](../public/brand/mark.png) — white + orange, transparent bg (primary, for dark UI)
- [mark-dark.png](../public/brand/mark-dark.png) — white + orange on `#0B0D12`
- [mark-light.png](../public/brand/mark-light.png) — charcoal + orange, transparent bg (for light/print)

Pre-sized exports (favicon → app icon) live in
[public/brand/exports/](../public/brand/exports/): `mark-16/32/64/180/256/512.png`
(dark bg) and `mark-trans-*` (transparent).

**React component:** `<ProCardMark size={28} variant="dark" />` in
`components/ui/ProCardLogo.tsx`. The component renders `mark.png` (or
`mark-light.png` for `variant="light"`).

**Verification seal:** `<VerifiedBadge size={16} />` — a scalloped orange disc
with a check; reinforces the "verified identity" promise beside names/wordmark.

---

### Wordmark

```
PROCARD.GG
```

- `PROCARD` — `#F4F5F9`, Rajdhani 700, `letter-spacing: 0.08–0.10em`
- `.GG` — `#FF5C00` — **non-negotiable, always orange**

The `.GG` color split is the primary brand signal. It must never change.

**React component:** `<ProCardLogo />` — renders mark + wordmark inline.

---

### Logo Lockups

| File                                                 | Use                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| [logo-dark.png](../public/brand/logo-dark.png)       | Horizontal lockup on dark bg (nav, headers, embeds)         |
| [logo-light.png](../public/brand/logo-light.png)     | Horizontal lockup on white bg (print, light UI)             |
| [logo-stacked.png](../public/brand/logo-stacked.png) | Stacked lockup + tagline (square social avatars, app store) |

**Logo rules:**

- Do not rotate, mirror, or recolor the shield mark
- Do not add drop shadows or glows
- Do not change `PROCARD` color (except dark on white bg — use `#0B0D12`)
- Do not change `.GG` color — ever
- Do not stretch or distort proportions; the mark is square — keep its aspect ratio
- Keep clear space around the mark equal to ~25% of its height
- Minimum display size: 16px height for mark only, 24px for full lockup

---

## Color Palette

### Brand Colors

| Role           | Hex                   | Usage                                               |
| -------------- | --------------------- | --------------------------------------------------- |
| **Accent**     | `#FF5C00`             | `.GG` wordmark, CTAs, single accent per composition |
| Accent hover   | `#FF7A33`             | Button hover state                                  |
| Accent active  | `#E04A00`             | Button pressed state                                |
| Accent soft bg | `rgba(255,92,0,0.12)` | Badge backgrounds, subtle highlights                |
| Accent ring    | `rgba(255,92,0,0.40)` | Focus rings                                         |

### Surface Palette (Dark-first)

| Token         | Hex       | Usage                      |
| ------------- | --------- | -------------------------- |
| `--surface-0` | `#0B0D12` | Page background            |
| `--surface-1` | `#14171F` | Primary cards              |
| `--surface-2` | `#1C2029` | Hover states, nested cards |
| `--surface-3` | `#262B36` | Inputs, button backgrounds |

### Border Palette

| Token              | Value                    | Usage                    |
| ------------------ | ------------------------ | ------------------------ |
| `--border-subtle`  | `rgba(255,255,255,0.08)` | Lowest elevation         |
| `--border-default` | `rgba(255,255,255,0.14)` | Standard card border     |
| `--border-strong`  | `rgba(255,255,255,0.24)` | Emphasis, focused states |

### Text Palette

| Token              | Hex       | Usage                                   |
| ------------------ | --------- | --------------------------------------- |
| `--text-primary`   | `#F4F5F9` | Headings, player names, primary content |
| `--text-secondary` | `#A1A6B5` | Descriptions, secondary labels          |
| `--text-muted`     | `#6B7180` | Timestamps, metadata, section labels    |

### Semantic Colors

| Role    | Hex       | Usage                                       |
| ------- | --------- | ------------------------------------------- |
| Success | `#28C770` | "Open to offers" badge, positive indicators |
| Danger  | `#F0524F` | Errors, destructive actions                 |
| Warning | `#F5C518` | Caution states                              |
| Info    | `#4DA3FF` | Neutral informational                       |

### Rank Tier Colors

| Tier        | Hex       |
| ----------- | --------- |
| Iron        | `#6B7280` |
| Bronze      | `#92400E` |
| Silver      | `#9CA3AF` |
| Gold        | `#D97706` |
| Platinum    | `#0D9488` |
| Emerald     | `#059669` |
| Diamond     | `#2563EB` |
| Master      | `#7C3AED` |
| Grandmaster | `#DC2626` |
| Challenger  | `#D97706` |
| Immortal    | `#DC2626` |
| Radiant     | `#FBBF24` |

---

## Typography

### Fonts

| Font               | Weights       | Role                                                                     |
| ------------------ | ------------- | ------------------------------------------------------------------------ |
| **Rajdhani**       | 400, 600, 700 | Display: player names, gamertags, rank tiers, section headings, wordmark |
| **Inter**          | 400, 500, 600 | UI: body copy, descriptions, labels, metadata                            |
| **JetBrains Mono** | 400, 500      | Code-like: URLs, slugs, LP/RR values, IDs                                |

Google Fonts import:

```css
@import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");
```

### Usage Rules

| Content type                   | Font               | Notes                                       |
| ------------------------------ | ------------------ | ------------------------------------------- |
| Player gamertag                | Rajdhani 700       | **Always** Rajdhani, never Inter            |
| Rank tier name (CHALLENGER)    | Rajdhani 700       | Uppercase                                   |
| Section heading                | Rajdhani 600       | Can be uppercase                            |
| Body / description             | Inter 400          |                                             |
| Button label                   | Inter 600          |                                             |
| Section label (RANKS, HISTORY) | Inter 600          | 9–10px, uppercase, `letter-spacing: 0.14em` |
| `procard.gg/slug`              | JetBrains Mono 400 |                                             |
| LP / RR values                 | JetBrains Mono 500 | Monospaced for alignment                    |

### Type Scale

| Token        | Size |
| ------------ | ---- |
| `--text-2xs` | 11px |
| `--text-xs`  | 12px |
| `--text-sm`  | 14px |
| `--text-md`  | 16px |
| `--text-lg`  | 20px |
| `--text-xl`  | 28px |
| `--text-2xl` | 44px |

---

## Design Rules

### Elevation

- Border-only elevation — **no drop shadows, no outer glows**
- Card hover: `border-color` transition only, 150ms ease
- Never use `box-shadow` for visual depth

### Geometry

- Card border-radius: **10px** (14px for section containers, 20px for modals/sheets)
- Base spacing unit: **4px** — use multiples: 8, 12, 16, 24, 32, 48, 64px

### Color Application

- **No gradients** — solid colors only
- Accent orange appears **once** per composition (one CTA, one badge, the `.GG` in wordmark)
- Never use emojis as icons — use styled text abbreviations or SVG

### Motion (Framer Motion)

- Max duration: **300ms**
- Easing: `ease-out` only
- Default enter: `opacity: 0→1`, `translateY: 8px→0`
- Default scale: `0.96→1.0`
- No spring physics, no bounce, no infinite loops

---

## Social Media Post System

### Formats

| Format     | Dimensions | Platform                              |
| ---------- | ---------- | ------------------------------------- |
| Square     | 1080×1080  | Twitter/X, Instagram feed             |
| Horizontal | 1200×630   | Twitter card, Open Graph link preview |
| Vertical   | 1080×1920  | Instagram Stories, TikTok             |

### Layout Rules

1. Background: always `#0B0D12` or `#14171F`
2. One accent element per post — orange appears once
3. Logo mark: top-left or bottom-right corner, never centered
4. No stock photography — UI screenshots, data mockups, or type-only layouts
5. Player data shown in the same card style as the product UI

### Post Types

| Type                 | Purpose                         | Key visual                   |
| -------------------- | ------------------------------- | ---------------------------- |
| Player spotlight     | Highlight a profile or use case | Profile card screenshot      |
| Feature announcement | New product capability          | UI mockup + short copy line  |
| Rank graphic         | Rank display for LoL/VAL/CS2    | Rank emblem + tier name + LP |
| Social proof         | Scout or org endorsement        | Discord DM mockup            |
| Brand post           | Identity / awareness            | Wordmark + tagline only      |

---

## Voice & Tone

### Brand Personality

- Confident, not arrogant
- Precise, not robotic
- Competitive, not elitist
- Direct, not cold

### Copy Rules

| Do                               | Don't                               |
| -------------------------------- | ----------------------------------- |
| "Verified rank. One link."       | "Level up your esports game!"       |
| "Connect your Riot account."     | "Supercharge your presence 🔥"      |
| "Open to offers."                | "Unlock your full potential!"       |
| "Ranks refreshed 4 minutes ago." | "Your stats are fresh!"             |
| Numbers over words ("3 games")   | Spelled-out numbers ("three games") |
| Short declarative sentences      | Exclamation marks                   |
| Factual status copy              | Gamer slang (GG, POG, let's gooo)   |

---

## AI Creation Prompt

Use this prompt with Midjourney, DALL-E 3, Adobe Firefly, or as a designer brief:

```
Design a logo for ProCard.gg — a verified esports identity platform for competitive
players, coaches, and esports professionals.

PRODUCT CONTEXT:
ProCard is the verified player profile for competitive esports. Think: Linktree meets
live rank data from Riot Games. Scouts, orgs, and teams use it to find and verify
players. It's precise, authoritative, and esports-native.

LOGO MARK:
An angular geometric shield with an integrated "P" monogram, built from
negative space — communicating verified identity + pro player + esports badge.

- Angular geometric shield emblem with a sharp downward bottom tip
- Two interlocking halves: a white shield frame + a bold blocky orange "P"
- Strong geometric cuts and beveled angles; thick clean vector lines
- Flat construction — no gradients, no glow, no 3D, no mascot styling
- Orange #FF5C00 forms the "P"; white #F4F5F9 forms the frame; on #0B0D12
- Symmetrical, premium SaaS/esports-infrastructure feel
- Must read as a shield badge at 16×16 pixels (favicon scale)

WORDMARK:
"PROCARD.GG" in bold geometric sans-serif (Rajdhani or Barlow Condensed)
- "PROCARD" in #F4F5F9
- ".GG" in #FF5C00 — this split is the core brand signal, non-negotiable
- Letter-spacing: 0.06–0.10em, Weight: bold/black

STYLE REFERENCES:
- Riot Games tournament branding (LCS, VCT) — sharp, dark, competitive
- Faceit platform — data-forward, authoritative
- Premium esports org crests — angular shield badges, monogram-driven
- NOT: flames, dragons, swords, crowns, lightning bolts, mascots, cartoons

DELIVERABLES:
1. Icon mark on #0B0D12
2. Horizontal lockup (icon + wordmark) on #0B0D12
3. Stacked lockup on #0B0D12
4. Both variants on white background

COLORS ONLY:
- Background: #0B0D12
- Mark primary: #F4F5F9
- Accent: #FF5C00
- No other colors permitted

FORMAT: high-resolution PNG (1024×1024+), transparent background

DO NOT: gradients, glow effects, textures, emojis, crowns, swords, lightning, mascots.
```

### For Social Post Generation

Use this as a system prompt when generating individual posts:

```
You are creating social content for ProCard.gg — a verified esports identity platform.

Brand rules:
- Background: #0B0D12 or #14171F always
- Accent: #FF5C00 (orange) — one use per post, sparingly
- Fonts: Rajdhani Bold for player names and titles, Inter for body
- Tone: confident, direct — no exclamation marks, no gamer slang, no emojis in copy
- The ".GG" in the wordmark is always orange (#FF5C00)
- Visuals: product UI or data layouts — no stock photography

Post goal: [DESCRIBE: announcement / player spotlight / feature / brand / social proof]
Copy: [1–2 lines max]
Visual: [rank graphic / profile card / Discord DM mockup / wordmark only]
```

---

## File Reference

```
public/brand/
  mark-master.png       Original master render (source of truth)
  mark.png              Shield mark, white+orange, transparent bg (primary)
  mark-dark.png         Shield mark on #0B0D12
  mark-light.png        Shield mark, charcoal+orange, transparent (light/print)
  logo-dark.png         Horizontal lockup on #0B0D12
  logo-light.png        Horizontal lockup on #FFFFFF
  logo-stacked.png      Stacked lockup + tagline on #0B0D12
  exports/              Pre-sized PNGs: mark-16..512 (dark) + mark-trans-* + mark-light-512
  options/              Archived early logo explorations (not in use)

app/
  icon.png              Favicon (256px, dark) — Next.js auto-serves
  apple-icon.png        Apple touch icon (180px, dark)
  opengraph-image.png   Social share card 1200×630 (logo + tagline)
  twitter-image.png     Twitter/X share card 1200×630

components/ui/
  ProCardLogo.tsx       ProCardMark, VerifiedBadge, ProCardLogo React components
  BrandLogos.tsx        Twitter, YouTube, Instagram, Twitch SVG icons

docs/
  brand-assets.md       This document
```
