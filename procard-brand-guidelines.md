# ProCard.gg — Brand Identity & Design System

## Brand Concept

**ProCard.gg** is an esports identity platform — the verified player profile that competitive gamers share everywhere. The brand sits at the intersection of professional esports tooling (Riot client, Valorant UI) and personal identity (a player card, a jersey number). It is sharp, precise, and confident. Never flashy. Never generic.

**Tagline:** Your Esports Identity. One Link.

---

## Logo

### Wordmark
```
PROCARD.GG
```
- Font: Rajdhani 700
- Letter-spacing: 0.06em
- "PROCARD" in `#f0f0f8` (or `#0f0f1c` on light)
- ".GG" in `#7b72d4` (accent-light) always
- Never split the wordmark across lines
- Never change the ".GG" colour

### Icon Mark
The icon combines three visual concepts:
1. **Player card** — a rounded rectangle (identity)
2. **Signal bars** — three ascending bars (rank progression)
3. **Verified checkmark** — green dot with tick (authenticity)

The icon is always used with the wordmark except in app icon / favicon contexts.

### Logo Don'ts
- Do not rotate the logo
- Do not use on backgrounds that make it unreadable
- Do not add drop shadows or glows
- Do not stretch or distort
- Do not use a colour other than white or `#0f0f1c` for "PROCARD"

---

## Colour System

### Core Palette (CSS variables — add to globals.css)

```css
:root {
  /* Backgrounds — layered dark system */
  --bg-base:      #07070f;   /* page background */
  --bg-surface:   #0f0f1c;   /* cards, panels, nav */
  --bg-elevated:  #161625;   /* hover states, inputs, dropdowns */
  --bg-subtle:    #1e1e30;   /* dividers, secondary fills */

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.11);
  --border-strong:  rgba(255, 255, 255, 0.20);

  /* Text */
  --text-primary:   #f0f0f8;
  --text-secondary: #8888a8;
  --text-muted:     #44445a;

  /* Accent — use sparingly, only for primary actions and key highlights */
  --accent:         #534AB7;
  --accent-light:   #7b72d4;
  --accent-dark:    #3a3380;
  --accent-subtle:  rgba(83, 74, 183, 0.12);

  /* Semantic */
  --color-success:  #23a55a;
  --color-danger:   #e05252;
  --color-warning:  #E8B84B;
  --color-info:     #2A7FBF;
}
```

### Rank Tier Colours
Use ONLY for displaying rank tiers. Never for general UI.

```css
--rank-iron:        #8a8a8a;
--rank-bronze:      #BA7517;
--rank-silver:      #888799;
--rank-gold:        #C9A227;
--rank-platinum:    #0F8A6A;
--rank-emerald:     #1AAD8A;
--rank-diamond:     #2A7FBF;
--rank-master:      #9D48E0;
--rank-grandmaster: #C93030;
--rank-challenger:  #E8B84B;
--rank-immortal:    #9D48E0;
--rank-radiant:     #E8B84B;
--rank-global:      #E8B84B;
```

### Rank Card Tinting
Each rank card background should have a subtle tint of its rank colour:
```
Gold card:    background: rgba(201, 162, 39, 0.05); border: rgba(201, 162, 39, 0.18)
Diamond card: background: rgba(42, 127, 191, 0.05); border: rgba(42, 127, 191, 0.18)
Master card:  background: rgba(157, 72, 224, 0.05); border: rgba(157, 72, 224, 0.18)
```
Apply this pattern to all tiers.

---

## Typography

### Font Stack
```css
/* Headings, gamertags, rank names, display text */
font-family: 'Rajdhani', sans-serif;

/* Body, labels, UI copy, descriptions */
font-family: 'Inter', sans-serif;

/* URLs, slugs, LP values, IDs */
font-family: 'JetBrains Mono', monospace;
```

Import in layout.tsx:
```tsx
import { Rajdhani, Inter, JetBrains_Mono } from 'next/font/google'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani'
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono'
})
```

### Type Scale

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Player name (hero) | Rajdhani | 48–64px | 700 | 0.04em |
| Rank display | Rajdhani | 17–28px | 700 | 0.02em |
| Section headings | Rajdhani | 20–24px | 700 | 0.03em |
| UI labels | Inter | 9–11px | 600 | 0.14em + UPPERCASE |
| Body / bio | Inter | 13–14px | 400 | normal |
| Secondary text | Inter | 11–12px | 400 | 0.02em |
| URLs / slugs | JetBrains Mono | 11–13px | 400 | normal |
| LP / rating values | JetBrains Mono | 11px | 400 | normal |

### Typography Rules
- Section labels are ALWAYS uppercase, Inter 600, 9–10px, --text-muted, tracking 0.14em
- Player gamertag uses Rajdhani always — never Inter
- Rank tier names use Rajdhani always — never Inter
- URLs and slugs always use JetBrains Mono
- Never use Inter for anything that represents competitive data (ranks, scores, LP)

---

## Components

### Cards
```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
  transition: border-color 180ms ease;
}
.card:hover {
  border-color: var(--border-default);
}
```

### Buttons

```tsx
// Primary — one per page max
<button className="bg-accent hover:bg-accent-light text-white font-medium text-sm px-4 py-2 rounded-lg transition-all active:scale-[0.97]">
  Create profile
</button>

// Secondary / ghost
<button className="bg-transparent border border-border-default text-text-primary hover:bg-bg-elevated text-sm px-4 py-2 rounded-lg transition-all active:scale-[0.97]">
  Preview
</button>

// Danger
<button className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-2 rounded-lg transition-all active:scale-[0.97]">
  Disconnect
</button>
```

### Inputs
```css
input, textarea, select {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  padding: 9px 12px;
  font-family: var(--font-inter);
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms ease;
  width: 100%;
}
input:focus {
  border-color: rgba(83, 74, 183, 0.5);
}
```

NEVER use white or light backgrounds on inputs. All inputs are dark.

### Status Badges
```tsx
// Open to offers
<span className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded
  bg-success/10 text-success border border-success/20">
  ● Open to offers
</span>

// On a team
<span className="... bg-info/10 text-info border-info/20">● On a team</span>

// Not looking
<span className="... bg-white/4 text-text-muted border-border-subtle">● Not looking</span>
```

### Navigation Bar
- Background: `var(--bg-surface)`
- Border-bottom: `1px solid var(--border-subtle)`
- Height: 52px
- Left: Logo wordmark + divider + breadcrumb
- Right: Profile URL pill (JetBrains Mono, with copy icon) + action buttons
- The profile URL pill is a core brand element — make it prominent and clickable

### Section Labels
Every data section on the profile uses this pattern:
```tsx
<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-text-muted mb-2">
  LIVE RANKS
</p>
```

---

## Motion & Animation

### Principles
- All animations ≤ 300ms
- No bouncing, no spring physics, no particle effects
- Motion should feel precise — like competitive UI, not marketing
- Use `ease-out` for entrances, `ease-in` for exits

### Timing Tokens
```css
--duration-fast:   100ms;  /* button press, instant feedback */
--duration-normal: 180ms;  /* hover states, border transitions */
--duration-slow:   280ms;  /* page transitions, section reveals */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

### Key Animations
```css
/* Page/section entrance */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Live indicator pulse */
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Connection success flash */
@keyframes successFlash {
  0%   { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0.4); }
  70%  { box-shadow: 0 0 0 8px rgba(35, 165, 90, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0); }
}
```

### Framer Motion Variants (for profile page)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }
}
```

---

## Spacing System

Base unit: **4px**. All spacing is a multiple of 4.

```
4px   — icon gaps, tight internal spacing
8px   — component internal gaps  
12px  — default gap between related elements
16px  — card padding (compact)
20px  — card padding (default)
24px  — section internal padding
32px  — between sections (mobile)
40px  — between sections (desktop)
48px  — major section breaks
64px  — page top padding
```

---

## Voice & Tone

### Brand Personality
- **Confident, not arrogant** — we know the product is good, we don't shout about it
- **Precise, not robotic** — short sentences, no padding, no filler words
- **Competitive, not elitist** — for every ranked player, not just pros
- **Direct, not cold** — clear and honest, not corporate

### Copy Rules
- Short sentences. One idea per sentence.
- No exclamation marks in UI copy
- No gamer slang in UI (no "GG", "POG", "let's gooo")
- Numbers over words where possible ("3 games connected" not "three games")
- Status copy is factual: "Ranks refreshed 3 minutes ago" not "Your stats are fresh!"
- Error messages are clear: "Couldn't connect Riot account. Check your username and try again." not "Oops! Something went wrong 😅"

### UI Copy Examples
```
✓ "Your profile is live."
✓ "Connect your Riot account to show verified ranks."  
✓ "Rank data refreshes every 30 minutes."
✓ "Open to offers"
✓ "Updated 4m ago"
✓ "procard.gg/alexg"

✗ "Supercharge your esports presence!"
✗ "Level up your profile 🔥"
✗ "Join thousands of players!"
✗ "Your ranks are looking great!"
✗ "Unlock your full potential"
```

---

## Design Don'ts

- **No white or light backgrounds** anywhere in the app (except the landing page light demo section if needed)
- **No gradients** — solid colours only throughout the UI
- **No drop shadows** — use border colour changes for elevation
- **No Inter for rank/game data** — always Rajdhani
- **No generic card hover shadows** — use border brightening only
- **No purple-on-white** — this is a dark-first product
- **No over-animation** — if it animates for longer than 300ms, it's too long
- **No colour except rank colours and accent** — the palette is intentionally minimal
- **No rounded corners > 12px** on cards — `border-radius: 10px` is the max for cards
- **No placeholder rank badges or fake data** on the landing page — use real profiles

---

## File Reference

This brand system should be implemented as:
- `globals.css` — all CSS custom properties from the colour system
- `fonts.ts` or in `layout.tsx` — Next.js font imports
- `tailwind.config.ts` — extend theme with all tokens
- `components/ui/` — Button, Badge, Input, Card, RankCard, StatusBadge as shared components

Every page and component in ProCard.gg should reference these tokens. No hardcoded hex values in components.
