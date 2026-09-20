# Investing OS — Design System

Derived from **CoinMarketCap** (coinmarketcap.com), reverse-engineered from the live
`:root` token block in their shipped CSS bundles (`_next/static/css/*.css`), captured
2026-09-19.

CMC's token namespace is `--c-*`. This document keeps their original names as the source
of truth and layers a Tailwind v4 `@theme` mapping on top, so utilities like
`bg-surface-1`, `text-secondary` and `rounded-200` resolve through the same variables.

**Stack:** SolidStart 2 (Vite 8, SSR) · TypeScript · Tailwind CSS v4 · TradingView
Lightweight Charts v5. See §10 for how to run it and where things live.

---

## 1. Design principles

The system is built for **dense, numeric, scannable** screens. Six rules explain almost
every decision in it:

1. **The data is the design.** Chrome is near-invisible: 1px hairlines, no card shadows
   in the main table, no fills except where state must be read. Color is spent almost
   entirely on price direction.
2. **Green and red are reserved.** `positive` / `negative` never appear as decoration.
   If something is green in this system, it went up.
3. **There is exactly one accent.** One hue carries every interactive affordance — links,
   primary buttons, the active tab underline, focus rings, chart slot 1 — and nothing else
   competes. *Which* hue is the accent axis (§2.6); the default is a deep burnt orange
   `#C2410C`, deliberately deep because it is the only hue that ever sits under `on-accent`
   text and has to clear 4.5:1 there (5.2:1). Every other hue is data-only, so nothing that
   isn't the accent is clickable.
4. **Gray is positional, not absolute.** `gray-100` always means "closest to the
   background" and `gray-600` always means "closest to the text", in *both* themes. The
   ramp physically inverts between light and dark (see §2.2).
5. **Two densities, one scale.** Type and radius step up at `≥768px`; spacing does not.
6. **Charts are on the same token set as everything else.** Canvas can't read CSS
   variables, so one module samples them and hands them over (§7.2). No chart color is
   written twice, and flipping the theme re-themes every plot.

---

## 2. Color

### 2.1 Palette ramps

Each hue runs `100 → 800`, light to dark. `500` is the "original" brand step; `400` is
`-light`, `600` is `-dark`, `700` is `-black`, `800` is a dark-theme surface tint.

| Step | Brand | Blue | Green | Red | Purple | Teal | Beige |
|------|--------|------|-------|-----|--------|------|-------|
| 100 | `#FFF4EC` | `#F0F6FF` | `#DEFBF0` | `#FCE6E8` | `#F6F0FF` | `#E8FAFD` | `#FDF4EA` |
| 200 | `#FED7AA` | `#DDE4FD` | `#C3F8E4` | `#F8BABD` | `#E7D7FE` | `#B9EFF9` | `#FCEDDE` |
| 300 | `#FDBA74` | `#ACBDFB` | `#8CF2CC` | `#F8BABD` | `#C8A5FE` | `#7CE1F3` | `#FBE0C6` |
| 400 | `#F97316` | `#6188FF` | `#67E4B5` | `#EE626A` | `#A972FD` | `#3BD1ED` | `#F9D3AF` |
| **500** | **`#C2410C`** | **`#3861FB`** | **`#16C784`** | **`#EA3943`** | **`#8A3FFC`** | **`#13B2CF`** | **`#F5B97F`** |
| 600 | `#9A3412` | `#2444D4` | `#119C68` | `#CB1620` | `#6312DE` | `#0F91A8` | `#EE8B2A` |
| 700 | `#7C2D12` | `#0728A1` | `#0D734C` | `#981018` | `#4103A1` | `#0C7487` | `#BD650F` |
| 800 | `#3A2118` | `#1E274F` | `#173C37` | `#411F2A` | `#25015A` | `#084854` | `#433936` |

The brand ramp breaks the usual "500 is the mid step" reading on purpose. `500` is the
accent as a **ground** (`on-accent` text on it), `400` is the accent as **ink** on a dark
ground, and `100`/`800` are the light and dark badge tints. The table shows Ember's
values; the ramp holds whatever the palette and accent axes resolve to (§2.5, §2.6).

Two one-off brand colors sit outside the ramps: `--c-color-azure: #486DF7` and
`--c-color-teal: #23DCF5`.

### 2.2 The gray ramp inverts per theme

This is the single most important structural detail in the system. Do **not** hardcode a
gray hex — always use the token.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `gray-100` | `#FCF9F7` | `#2D231D` | Subtle surface / zebra row |
| `gray-200` | `#F4F1EF` | `#41332A` | Hairline borders, dividers |
| `gray-300` | `#DBD4D0` | `#5F5853` | Disabled borders, skeletons |
| `gray-400` | `#B7AEA8` | `#736A63` | Caption text, placeholder |
| `gray-500` | `#918882` | `#948A84` | Icon default (near-identical in both themes) |
| `gray-600` | `#766B64` | `#AFA6A0` | Secondary text |

**The ramp is warm.** CMC's neutrals are blue-cast; this system's are not. Every step was
rotated to **OKLCH hue 55 at its original lightness**, so the whole ramp picked up the
accent's warmth and *not one contrast ratio moved* — the rotation is hue-only. Grounds
(`100`, `200`, the backgrounds and surfaces) keep 85% of the original chroma so the tint
is actually visible; ink steps (`300`–`600`) keep 45%, past which body copy starts
reading brown rather than black.

### 2.3 Semantic tokens

| Token | Light | Dark |
|-------|-------|------|
| `background-1` | `#FEFDFC` | `#211812` |
| `background-2` | `#FFFFFF` | `#1D1109` |
| `surface-1` | `#FFFFFF` | `#2D231D` |
| `surface-2` | `#FCF9F7` | `#392C24` |
| `text-primary` | `#19130F` | `#FFFFFF` |
| `text-secondary` | `#766B64` | `#AFA6A0` |
| `text-caption` | `#B7AEA8` | `#736A63` |
| `text-hyperlink` | `#C2410C` | `#F97316` |
| `accent` (ink) | `brand-500` | `brand-400` |
| `accent-fill` / `on-accent` | `#C2410C` / `#FFF` | `#C2410C` / `#FFF` |
| `positive` | `#16C784` | `#16C784` |
| `negative` | `#EA3943` | `#EA3943` |
| `positive-bg` | `green-100` | `green-800` |
| `negative-bg` | `red-100` | `red-800` |
| `official` / `official-bg` | `#C2410C` / `brand-100` | `#F97316` / `brand-800` |
| `reminder` / `reminder-bg` | `#F5B97F` / `beige-100` | `#F5B97F` / `#433936` |
| `no-access` / `no-access-bg` | `#948A84` / `gray-200` | `#948A84` / `gray-200` |
| `overlay-bg` | `rgba(88,102,126,.6)` | `rgba(23,25,36,.6)` |

**Dark slot 1 is `#EA580C`, not the `accent` ink step.** The dataviz lightness band for a
dark surface tops out at OKLCH L 0.67 and `brand-400` sits at 0.705, so it fails as a
*mark* even though it is correct as *text*. The two jobs have different bands; the tokens
are allowed to differ.

**Note:** `positive` and `negative` are theme-invariant. CMC uses them only on large or
bold numerals, never as body copy — hold to that and the contrast works on both grounds.

### 2.4 Theme switching

CMC stamps dark mode with a `.NIGHT` class on a root element. This port keeps that name
but also honors `prefers-color-scheme` and a `data-theme` attribute, so all three states
resolve correctly:

```css
:root { /* full light palette */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.DAY) { /* dark overrides */ }
}

:root[data-theme="dark"], :root.NIGHT { /* dark overrides */ }
```

### 2.5 Palette switching (the second axis)

Light/dark answers *which ground*. Palette answers *which values that ground uses*. The
two are independent, both stamp `<html>`, and no component is aware of either — a palette
overrides **values only**, never names, so every rule in this document still holds under
each one.

| Palette | Attribute | Where it lives |
|---|---|---|
| **Ember** (default) | *(none — the bare `:root`)* | `src/styles/tokens.css` |
| **Rustic Charm** | `data-palette="rustic"` | `src/styles/palette-rustic.css` |
| **Midnight Sky** | `data-palette="midnight"` | `src/styles/palette-midnight.css` |

`src/lib/palette.ts` holds the signal and the stamp (mirroring `theme.ts`, storage key
`ios-palette`); `PaletteToggle` is the control. Both the canvas bridge and the spec page's
live hex readouts key off `palette()` as well as `resolved()`, so a swap re-samples
everything.

Specificity is load-bearing. Base dark is `(0,3,0)`, so a rustic **light** block at
`(0,2,0)` deliberately loses to it, and the rustic **dark** block is written at `(0,4,0)`
to win. That is why the rustic dark block mirrors the base dark block token for token
rather than overriding only what differs.

#### Rustic Charm

Source: floral white `#FFFCF2` · dust grey `#CCC5B9` · charcoal brown `#403D39` · carbon
black `#252422` · spicy paprika `#EB5E28`.

Five colours do not make a design system. Two gaps had to be covered explicitly:

1. **Ramps.** Paprika is extended into the full 8-step accent ramp (tinting toward floral
   white, shading toward carbon black); the neutrals are interpolated along the
   floral-white → dust-grey → charcoal → carbon axis, each step keeping its predecessor's
   contrast role.
2. **Direction.** The palette has no green and no red. Price direction is not a style
   choice, so `positive` / `negative` and the diverging ramp are untouched — only the
   neutral midpoint moves onto the warm gray. Chart slots 2–4 (blue/teal/purple) also
   stay, because four CVD-separable categoricals cannot come out of one hue family.

The accent ramp keeps the same contract the orange ramp has, with one wrinkle:

| Step | Value | Job |
|---|---|---|
| 400 | `#F2794A` | Accent as **ink** on a dark ground — 5.5:1 on carbon black |
| 500 | `#CA4713` | Accent as **ink** on the light ground (4.6:1) *and* as `accent-fill` under `on-accent` (4.6:1) |
| — | `#EB5E28` | The source swatch, as `--c-color-paprika`. 3.4:1 under white, so it is **fills only**: chart slot 1 in dark, sequential step 2, area gradients. Never under text. |

One structural difference from Ember: there, cards are pure white lifting off a near-white
ground. Here the ground is the warmer step (`#F9F6EA`) and floral white is the *card*, so
surfaces lift toward the light rather than away from it. Dark-mode ink is floral white
rather than `#FFFFFF`, and secondary text is dust grey at 9.1:1.

#### Midnight Sky

Source: indigo ink `#4329D6` · cornflower blue `#042DFB` · periwinkle `#0320FC` ·
platinum `#636F9C` · princeton orange `#FF8800`.

Three things had to be decided rather than transcribed:

1. **Three blues, one hue.** Indigo ink, cornflower and periwinkle are near-identical in
   hue. Spent as three roles they would collapse into each other, so they are spent as a
   **depth axis**: indigo ink is the dark ground stack, cornflower is the data blue
   (slot 2), periwinkle is folded into the sequential ramp. Nothing collides, nothing is
   wasted.
2. **The button inverts.** Princeton orange is 2.4:1 under white and still only 3.7:1 at
   its 600 step — it is not an ink and it cannot take white text. It *is* 7.5:1 under
   platinum-900, so the primary button becomes a **bright orange ground under near-black
   ink**. That is the palette's signature and the one place a component's ink polarity
   differs from the other two palettes — which is why `on-accent` is a token and not a
   hardcoded `#fff`.
3. **Neutrals change family per theme.** Platinum carries the light ramp; in dark mode the
   neutrals move onto the indigo axis instead. A midnight UI whose greys are actually grey
   throws away the idea.

| Step | Value | Job |
|---|---|---|
| 400 | `#FFA033` | Accent as **ink** on the dark ground — 9.5:1 on indigo. Dark is the hero theme here. |
| 500 | `#995200` | Accent as **ink** on the light ground — 5.9:1 |
| — | `#FF8800` | The source swatch, as `--c-color-princeton`. The `accent-fill`, under `#14161F` ink at 7.5:1 (4.9:1 on hover). |

Chart slot 2 becomes cornflower `#3657FC` (light) / `#6881FD` (dark); slots 3 and 4 are
untouched, because four CVD-separable categoricals cannot be cut out of one blue-violet
family. Warnings move to a muted gold ramp — deliberately desaturated and yellower than
the accent, so "unaudited" never reads as "primary action".

### 2.6 Accent switching (the third axis)

A palette decides what the page is made of. An accent decides only what the page *points
with*, so it changes independently of the palette under it. Unlike the other two axes this
one is **open**: any colour, not a menu. No stored colour means "whatever the palette
chose", which is why the default costs nothing.

**The picked colour is never used raw.** `src/lib/accent-derive.ts` reads it into OKLCH and
solves a complete accent from it; `src/lib/accent.ts` writes the result to `<html>` as
inline custom properties and stamps `data-accent="custom"`. Inline beats every stylesheet,
which is what an override that must work under any palette needs.

**An accent owns six things and nothing else:** the brand ramp; `accent` / `accent-fill` /
`accent-fill-hover` / `on-accent`; `text-hyperlink` and `official`; chart slot 1; the
area-gradient pair; and the slot it displaces. Everything else — grounds, neutrals,
direction colours, the sequential and diverging ramps, warnings — belongs to the palette
and does not move.

#### What gets solved, and against what

| Step | Solved as | Floor |
|---|---|---|
| `brand-500` (ink, light) | the **highest** lightness that still clears the floor | 4.5:1 on `#EFF1F5` |
| `brand-400` (ink, dark) | the **lowest** lightness that still clears the floor | 4.5:1 on `#2F2D2A` |
| `accent-fill` | the picked colour itself, if either label ink clears 4.5:1 on it; otherwise `brand-500` | 4.5:1 |
| `on-accent` | whichever label ink wins on that fill | 4.5:1 |
| chart slot 1 (light) | a *mark*, not text | 3:1 on `#FFFFFF` |
| chart slot 1 (dark) | ditto, capped at OKLCH L 0.67 | 3:1 on `#2F2D2A` |
| `brand-100/200/300/600/700/800` | fixed lightness targets, forced monotonic around the solved pair | — |

Both ink floors are measured against **the worst ground any palette offers**, not a
convenient one, so a derived accent is valid under every palette rather than only the one
on screen. Extremes are solved, not chosen: a colour is darkened only as far as it has to
be, which is why a deep burnt orange comes back essentially unchanged.

**The fill is tried before it is replaced.** If either label ink clears 4.5:1 on the picked
colour, it survives intact — that is how a bright `#FF8800` stays bright instead of being
darkened into a link colour, and it is also why `on-accent` is a token rather than a
hardcoded `#fff`: that fill takes *dark* ink. Only when neither ink works does the fill
fall back to the solved `500` step.

**Gamut.** Steps are rendered by reducing chroma until the colour fits sRGB, never by
clipping channels — clipping shifts the hue, which is the one thing a ramp cannot afford.

**Displacement.** Slot 1 always follows the accent, so an accent landing within 30° of an
existing chart slot pushes that slot onto the hue the accent just vacated — the warm one.
Blue accent → slot 2 goes warm, teal → slot 3, violet → slot 4. The derivation stamps
`data-accent-displaces`; the backfill is fixed and lives in `accents.css`. The categorical
set stays four CVD-separable hues in every palette × accent combination.

**Reserved hues are flagged, not blocked.** An accent within 12° of `positive` or
`negative` passes every contrast floor but makes a link look like a gain or a loss, so the
spec page says so and lets you decide. The threshold is tighter than the 30° used for slot
collision because the shipped burnt orange sits 15° off `negative` and must not trip it.

**Near-neutral picks are left alone.** Below OKLCH chroma 0.015 the hue angle is rounding
noise; amplifying it would invent a colour nobody chose, so a grey pick yields a grey ramp.

**Naming.** The accent ramp is `--c-color-brand-100…800`. It was called
`--c-color-orange-*` while orange was the only accent; a ramp named *orange* holding teal
would be a lie, so it was renamed when this axis landed.

---

## 3. Typography

- **Body / UI:** `Inter, -apple-system, BlinkMacSystemFont, 'segoe ui', Roboto, Helvetica, Arial, sans-serif`
- **Icons:** `CMC V2` (proprietary icon font — substitute your own icon set)

### 3.1 Scale

Four steps are responsive — they grow at `min-width: 768px`.

| Token | Mobile | ≥768px | Typical use |
|-------|--------|--------|-------------|
| `font-size-50` | 11px | 11px | Micro-labels, rank badges |
| `font-size-75` | 12px | 12px | Table meta, chip text, captions |
| `font-size-100` | 14px | 14px | **Body default**, table cells |
| `font-size-200` | 16px | 16px | Emphasized body, nav links |
| `font-size-300` | 18px | 18px | Card titles |
| `font-size-400` | 18px | **20px** | Section headings |
| `font-size-600` | 20px | **25px** | Sub-page headings |
| `font-size-800` | 25px | **32px** | Page headings |
| `font-size-1000` | 32px | **40px** | Hero price / display |

### 3.2 Weights and line height

`300` · `400` (body) · `500` (UI labels, table headers) · `600` (emphasis, prices) ·
`700` (headings) · `900`

- `--c-line-height-body: 150%`
- `--c-line-height-heading: 130%`

### 3.3 Numeric rules

Every column of figures uses `font-variant-numeric: tabular-nums`. Prices are weight
`600`; percentage deltas are `600` and colored; supply and volume are `400` in
`text-primary`.

---

## 4. Space

A single 4px-based ramp, non-responsive, with a mirrored negative set (`--c-space-n-*`).

| Token | 50 | 100 | 150 | 200 | 250 | 300 | 400 | 500 | 600 | 800 |
|-------|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| px | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 |

---

## 5. Radius, borders, elevation

### 5.1 Radius (two steps are responsive)

| Token | Mobile | ≥768px | Use |
|-------|--------|--------|-----|
| `border-radius-10` | 2px | 4px | Tags, tiny chips |
| `border-radius-50` | 4px | 6px | Inputs, small buttons |
| `border-radius-100` | 8px | 8px | **Buttons, chips — the workhorse** |
| `border-radius-200` | 12px | 14px | Cards, panels |
| `border-radius-300` | 16px | 16px | Modals |
| `border-radius-400` | 20px | 20px | Pills, large sheets |
| `border-radius-500` | 50% | 50% | Avatars, coin logos |

### 5.2 Border width

`--c-border-width-100: 1px` · `200: 2px` · `300: 4px`

The default hairline is `1px solid gray-200`.

### 5.3 Shadows

| Token | Light | Dark |
|-------|-------|------|
| `shadow-tiny` | `0 1px 2px rgba(88,102,126,.12), 0 4px 24px rgba(88,102,126,.06)` | `0 1px 2px rgba(13,20,33,.24), 0 4px 24px rgba(13,20,33,.12)` |
| `shadow-overlay` | `0 8px 32px rgba(128,138,157,.24), 0 1px 2px rgba(128,138,157,.12)` | `0 8px 32px #0D1421, 0 1px 2px #0D1421` |

Elevation is deliberately scarce: the market table has **none**. Shadow is reserved for
things that genuinely float — dropdowns, tooltips, modals, sticky toolbars.

---

## 6. Components

### 6.1 Global ticker strip

Full-bleed bar above the nav. `font-size-75`, `text-secondary` labels with `text-primary`
`600` values, deltas in `positive` / `negative` with a caret glyph. Carries: Cryptos,
Exchanges, Market Cap, 24h Vol, Dominance, ETH Gas, Fear & Greed.

### 6.2 Navigation

Height 64px, `background-2`, bottom hairline `gray-200`. Logo left; nav links at
`font-size-200` / `500` in `text-primary`; search input (`surface-2`, `radius-100`,
`gray-200` border); then theme toggle, "Log In" (ghost) and "Sign Up" (primary orange).

### 6.3 Buttons

| Variant | Fill | Text | Border |
|---------|------|------|--------|
| Primary | `accent-fill` (`#C2410C`) | `on-accent` (`#FFF`) | none |
| Primary (hover) | `accent-fill-hover` (`#9A3412`) | `on-accent` (`#FFF`) | none |
| Secondary | `surface-2` | `text-primary` | `1px gray-200` |
| Ghost | transparent | `text-primary` | none |
| Danger | `red-500` | `#FFF` | none |

Sizes: `sm` 28px / `font-size-75` / pad `8px 12px`; `md` 36px / `font-size-100` / pad
`8px 16px`; `lg` 44px / `font-size-200` / pad `12px 24px`. All `radius-100`, weight `600`,
`transition: background .15s ease`.

### 6.4 Chips / filter pills

`surface-2` fill, `radius-100`, `font-size-75` `500`, pad `6px 12px`, 1px `gray-200`.
Active state: `orange-100` fill (`orange-800` in dark), `accent` text, border unchanged.

### 6.5 Tabs

Text-only row, `font-size-100` `600`. Inactive `text-secondary`; active `text-primary`
with a 2px `accent` underline. Overflows horizontally with a fade mask, never wraps.

### 6.6 Badges

Small `radius-10` tags at `font-size-50` `600`, uppercase, `.02em` tracking. Pairs:
`positive`/`positive-bg`, `negative`/`negative-bg`, `official`/`official-bg`,
`reminder`/`reminder-bg`, `no-access`/`no-access-bg`.

### 6.7 Market table

The core component.

- Header row: `font-size-75` `500` `text-secondary`, bottom hairline `gray-200`, sticky.
- Body rows: 60px tall, `font-size-100`, bottom hairline `gray-200`, `surface-2` on hover.
- Sticky left columns: star, rank (`#`), name + logo. Right-aligned numerics after that.
- Coin cell: 24px round logo + name `600` + ticker in `text-caption`.
- Delta cells: `positive` / `negative` with `▲` / `▼`, weight `600`.
- Sparkline: 7-day line, stroke = `positive` / `negative`, ~135×40, plus a faint
  same-hue area fill at ~12% opacity.
- Rank and percentage columns use `tabular-nums`.

### 6.8 Stat tiles

Used in the market-overview strip, not as a generic card. `surface-1`, `radius-200`, 1px
`gray-200`, pad `space-200`. Label `font-size-75` `text-secondary`, value `font-size-600`
`700`, delta chip below.

### 6.9 Inputs

Height 40px, `surface-2` fill, 1px `gray-200`, `radius-100`, `font-size-100`, placeholder
`text-caption`. Focus: border `accent` plus `0 0 0 3px` orange at 15% opacity.

### 6.10 Pagination

Right-aligned. Ghost prev/next arrows; numbered buttons 32px square at `radius-50`; the
current page is `accent-fill` filled, with `on-accent` text.

---

## 7. Data visualization

### 7.1 Library

**TradingView Lightweight Charts v5** (`lightweight-charts`, Apache-2.0, ~50 kB gzipped,
canvas-rendered). Picked over an SVG charting library because the market screen draws
180+ bars with a live crosshair, and because candles, panes and crosshair behaviour
already match what someone reading a price chart expects.

**v5 API note.** Series are created through a series *definition*, not a per-type method:

```ts
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";

const chart = createChart(el, options);
const price = chart.addSeries(CandlestickSeries, colors);      // not addCandlestickSeries()
const volume = chart.addSeries(HistogramSeries, opts, 1);      // 1 = second pane
```

Charts are client-only — they are loaded through `clientOnly()` so the canvas code never
runs during SSR, and each fallback reserves its chart's exact height so the server frame
and the hydrated frame are the same shape.

### 7.2 The canvas bridge

Canvas cannot read CSS custom properties. `src/lib/chart-theme.ts` is the one place that
crosses over: it samples the tokens off `:root` with `getComputedStyle`, hands them to
Lightweight Charts as plain hex, and re-samples on every theme flip.

```ts
const s = getComputedStyle(document.documentElement);
grid:   s.getPropertyValue("--c-chart-grid").trim(),
series: [1, 2, 3, 4].map(n => s.getPropertyValue(`--c-chart-series-${n}`).trim()),
```

A `createEffect(on(resolved, …))` re-reads them and calls each series' `retheme(tokens)`.
The result is that no chart color is ever written twice — the palette lives in
`tokens.css` exactly like every other token.

### 7.3 Chart tokens

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--c-chart-grid` | `#F4F1EF` | `#41332A` | Horizontal gridlines (= `gray-200`) |
| `--c-chart-axis-text` | `#766B64` | `#AFA6A0` | Axis labels (= `text-secondary`) |
| `--c-chart-crosshair` | `#B7AEA8` | `#736A63` | Crosshair rules (= `gray-400`) |
| `--c-chart-up` / `-down` | `#16C784` / `#EA3943` | same | Candle body, baseline poles |
| `--c-chart-volume-up` / `-down` | `rgb(… / .5)` | same | Volume bars, held back from the price pane |
| `--c-chart-area-top` / `-bottom` | orange 24% → 0% | orange 28% → 0% | Area fill under a single series |
| `--c-chart-series-1…4` | see §7.4 | see §7.4 | Categorical slots — *which one* |
| `--c-chart-seq-1…4` | `#FA9D6C` → `#924411` | `#8E4210` → `#F58341` | Sequential — *how much* |
| `--c-chart-div-neg-2…pos-2` | see §7.5 | see §7.5 | Diverging — *which way* |
| `--c-chart-other` | `#B7AEA8` | `#736A63` | The de-emphasised tail |
| `--c-chart-on-*` | — | — | Ink for a label set **inside** each fill |

### 7.4 Categorical slots

Four slots, assigned in **fixed order** and never cycled. A fifth series folds into
"Other", becomes small multiples, or the chart gets faceted — it is never a generated
hue.

| Slot | Hue | Light | Dark |
|------|-----|-------|------|
| 1 | orange | `#C2410C` | `#EA580C` |
| 2 | blue | `#3861FB` | `#6188FF` |
| 3 | teal | `#0F91A8` | `#0F91A8` |
| 4 | purple | `#8A3FFC` | `#8A3FFC` |

**Green and red are deliberately absent.** They mean price direction in this system, so
reusing them for "series 3" would make a neutral line read as a gain. Only slot 1
re-steps for dark — the other three already sit in the dark lightness band. Slot 2 is
blue, not amber: with orange in slot 1, an amber slot 2 collapses into it under every
CVD model.

**Validation.** Both columns were run through the six checks against their own surface
(`#FFFFFF` light, `#2D231D` dark): lightness band, chroma floor, CVD separation,
normal-vision floor, contrast vs surface. All pass in both modes. The worst adjacent pair
under deuteranopia is purple ↔ teal at **ΔE 16.2**, well clear of the ΔE 8 target, so no
secondary encoding is strictly required — the charts direct-label anyway.

Re-run after any change to the slots rather than eyeballing them.

### 7.5 Sequential and diverging

Categorical answers *which one*. These answer *how much* and *which way*, and reaching
for the wrong one is the fastest way to misstate the data.

**Sequential** — one hue, light → dark, four steps. Each step is at least 0.06 OKLCH
lightness from its neighbour and the pale end still clears 2:1 on the surface. Used where
position and size already carry identity and hue is free to carry magnitude: treemap
tiles, heat grids of levels.

| Step | Light | Dark |
|------|-------|------|
| 1 | `#FA9D6C` | `#8E4210` |
| 2 | `#E57431` | `#B25418` |
| 3 | `#BD5A1A` | `#D76821` |
| 4 | `#924411` | `#F58341` |

It runs light → dark in light mode and dark → light in dark mode. That is not a flip of
the same list — each is stepped against its own surface so step 1 stays the faint end on
whichever ground it lands.

**Diverging** — the reserved direction pair around a neutral midpoint. Never a hue in the
middle: a third colour at zero invents a third category.

| Step | Light | Dark |
|------|-------|------|
| `div-neg-2` | `#CB1620` | `#EA3943` |
| `div-neg-1` | `#F8BABD` | `#8F2228` |
| `div-mid` | `#F4F1EF` | `#41332A` |
| `div-pos-1` | `#8CF2CC` | `#0F7A52` |
| `div-pos-2` | `#119C68` | `#16C784` |

**`--c-chart-other`** (`#B7AEA8` / `#736A63`) is the tail of a part-to-whole chart, and is
deliberately chromaless. A fifth series is not a fifth identity; it is the absence of one.
It fails the categorical chroma check on purpose — do not "fix" it.

### 7.6 Composition and distribution

Nine forms that are not time series, so Lightweight Charts has nothing to offer them.
They are hand-drawn SVG in `src/components/charts/svg/`, which also means they render on
the **server** — that whole section of the page has no loading state, unlike the canvas
charts above it. They read `--c-chart-*` through plain CSS, so they follow the theme with
no sampling and no re-theme pass.

| The reader must… | Form | Colour's job |
|---|---|---|
| Rank things against each other | Ranked bar, one baseline | Direction pair |
| See share of a whole, at a glance | Donut (pie if there's no total) | Categorical, ≤ 4 + Other |
| See share as territory | **Treemap** | Sequential |
| Watch a mix drift over time | 100% stacked bar | Categorical, ≤ 4 + Other |
| Follow how a total was built | Waterfall bridge | Direction pair, neutral totals |
| Weigh two variables together | Scatter | Emphasis: ≤ 3 named + field |
| Read magnitude across a grid | Heatmap | Diverging around zero |
| Place one value on a named scale | **Gauge** | Diverging, four named bands |
| Read one current number | Stat tile / hero figure | None — it isn't a chart |

**The treemap is the market-share form.** Squarified layout (Bruls, Huizing & van Wijk):
tile area is *exactly* proportional to share, and the algorithm only chooses how to cut
the remaining rectangle so tiles come out near-square instead of as slivers. The
degenerate cases fall out of the algorithm rather than being special-cased — one name at
100% fills the square edge to edge, 90/10 splits it 90/10, four equal names give a clean
2×2. Verified against the shipped function, not asserted.

**It carries two variables, on two channels.** Area is share; hue is the one-day change,
on the diverging scale. Colouring the tiles by share as well would double-encode it —
spending the one free channel to restate what the sizes already say, across categories
with no natural order to ramp along. The share label is the last thing dropped as a tile
shrinks, ahead of the ticker and the company name, because it is the value the chart is
about.

**The gauge is for a value's *position on a named scale*.** Four bands — two bearish,
two bullish — with the saturated steps at the extremes so "extremely" reads as further
out in either direction. It is the one case where a dial beats a bar: the bands are named
regions rather than magnitudes, and a needle pointing into a named region is the message.
The reading is never colour-alone; the band's name is printed under the number.

**The pie and donut carry their own caveat, on the card.** They answer exactly one
question — "is anything dominant" — and the spec says so in the note where a reader will
see it. Anything finer (is Financials ahead of Healthcare?) is the ranked bar. Five
segments is the ceiling, and the fifth is `Other`, so it is four identities and a tail.
Prefer the donut whenever a total exists: the hole is where the total goes, which is the
one thing a pie cannot show.

**Shared rules across all nine.**

- **White does the separating.** A 2px surface gap between touching marks — stacked
  segments, adjacent bars, heat cells, treemap tiles — and a 2px surface ring on
  overlapping dots. Never a stroke around a mark; a stroke is ink that isn't data.
- **A label that won't fit is not drawn.** Never clipped, never shrunk away. The treemap
  measures each tile against three thresholds (ticker / share / full name) and drops what
  won't fit; push it outside the mark, or let the tooltip carry it.
- **Direct labels don't stack.** Where two named scatter points sit close, the label
  flips to the other side of its dot rather than being nudged vertically off it.
- **Bars are ≤ 24px with a 4px rounded data-end and a square baseline end.** Rounding
  both ends detaches the mark from its baseline and makes short bars read as pills.
- **Every one has a hover readout and a full `aria-label`.** There is no table view: the
  `aria-label` names every series and value, and the same detail appears on keyboard
  focus as on hover. The trade is real and worth stating — a sighted reader who cannot
  separate two hues no longer has a text fallback to fall back on.
- **No drawing scales above 1:1.** `ChartCanvas` caps each figure at its own viewBox
  width, because an SVG stretched to fill a card scales its type along with everything
  else.

### 7.7 Picking the form

| The data's job | Form | On this page |
|---|---|---|
| OHLC over time | Candlesticks | BTC / USD daily |
| Magnitude beside a price series | Histogram in a **second pane** | Volume |
| One value over time | Area, single series, no legend | Portfolio NAV |
| Polarity around a true zero | Baseline, two poles + neutral midpoint | Unrealised P&L |
| Several series at different scales | Lines **rebased to a common index** | BTC/ETH/SOL/XRP at 100 |
| Trend at row scale | Inline SVG sparkline | Market table, last 7 days |

Sparklines stay SVG on purpose: at 135×40 a chart instance per row costs more and reads
no better, and the SVG picks up `--c-chart-up` / `-down` directly.

### 7.8 Chrome

The chart chrome is as recessive as the table's:

- Horizontal gridlines only, in `gray-200`. No vertical lines.
- No axis borders (`borderVisible: false` on both scales).
- Axis labels at 11px in `text-secondary`, Inter, tabular by nature.
- Crosshair is a 1px dashed rule in `gray-400`, magnet mode, with the axis label chip in
  `text-secondary`.
- Line weight 2px, matching `--c-border-width-200`.
- Chart cards are flat: `surface-1`, `radius-200`, 1px `gray-200`, **no shadow**.

### 7.9 Anatomy

Every figure goes through `ChartFrame`, so the parts land in the same place each time:

1. **Title** (`font-size-300`/700) and a one-line note in `text-75 text-muted`.
2. **Hero readout**, right-aligned — the last value at rest, the hovered value on hover.
   This is the tooltip; it does not float, so it can never collide with a mark.
3. **Legend** for two or more series, with a 10px swatch. One series gets no legend box —
   the title names it.
4. **The plot.**
5. **`aria-label`** on the drawing — every series and value, as text.

### 7.10 Non-negotiables

- **One axis.** Two measures at different scales get two panes or a common index. Never
  a second y-scale on one plot.
- **Color follows the entity, not the rank.** Hiding a series in the comparison chart
  leaves every survivor on its original slot.
- **Identity is never color-alone.** ≥2 series carry a legend; ≤4 are also labelled on
  the price axis (`title` on the series options).
- **Direction is never color-alone.** ▲ / ▼ glyphs in the table, sign in the P&L readout,
  and `sr-only` "up" / "down" for screen readers.
- **Every chart has an `aria-label` naming every series and value.** It is the non-visual
  path to the numbers; there is no table view.
- **Status colors are reserved.** `positive` / `negative` never stand in for a series.

---

## 8. Tailwind v4 mapping

Tokens are declared as plain CSS variables (so theming stays pure CSS), then surfaced to
Tailwind through `@theme inline` by reference:

```css
@theme inline {
  --color-bg-1:      var(--c-color-background-1);
  --color-surface-1: var(--c-color-surface-1);
  --color-primary:   var(--c-color-text-primary);
  --color-secondary: var(--c-color-text-secondary);
  --color-positive:  var(--c-color-positive);
  --color-negative:  var(--c-color-negative);
  --color-brand-500: var(--c-color-orange-500);

  --text-50:  var(--c-font-size-50);
  --text-100: var(--c-font-size-100);

  --spacing-200: var(--c-space-200);
  --radius-100:  var(--c-border-radius-100);
  --shadow-tiny: var(--c-shadow-tiny);
}
```

Because the utilities resolve *through* the variables, `dark:` variants are unnecessary
for color — `bg-surface-1` is already correct in both themes. Reserve `dark:` for the
rare component that needs a genuinely different treatment, not a different value.

---

## 9. Accessibility notes

- `text-caption` measures **2.2:1** on a light ground and **2.9:1** on a dark one. Both
  are below AA, by design — it is meta-only ink. Never put anything load-bearing in it.
  (The old note claiming 2.9:1 in light mode was simply wrong; the ratio has not changed,
  the figure had.)
- Never encode price direction with color alone — the `▲` / `▼` glyph is required.
- Focus ring: 2px solid `accent` at 2px offset, in both themes. Never remove an outline
  without replacing it.
- Every chart ships an `aria-label` naming every series and value, so nothing is
  reachable only by hovering. The `<details>` table views were removed at the owner's
  request; the `aria-label` is now the sole non-visual path, and there is no text
  fallback for a sighted reader who cannot separate two hues.
- A label set inside a filled mark takes its paired `--c-chart-on-*` token. Every fill /
  ink pair in the system clears 4.5:1 — that is what fixed the number of sequential steps
  at four rather than five.
- Table rows need a `:focus-visible` state, not just `:hover`.

---

## 10. Reference

### 10.1 Running it

```bash
pnpm install
pnpm dev          # http://localhost:5180
pnpm build        # SSR build -> dist/
pnpm typecheck    # tsc --noEmit
```

**pnpm only.** `packageManager` pins `pnpm@11.22.0` for corepack, and a `preinstall`
guard (`npx only-allow pnpm`) rejects `npm install` / `yarn` so a stray `package-lock.json`
can't appear beside `pnpm-lock.yaml`. Commit both `pnpm-lock.yaml` and
`pnpm-workspace.yaml`.

The live spec page — every token, component and chart, with a working theme toggle — is
at **`/design`** (`http://localhost:5180/design`). Open it and flip Light / Auto / Dark;
the hex labels under each swatch are sampled from `:root` at runtime, so they show what
actually paints. `/` redirects there, since nothing else is served from this app yet.

**This page is the design system.** There is no second artifact to keep in sync — if a
token, component or chart is not on it, it is not in the system.

### 10.2 Where things live

| Path | What it is |
|---|---|
| `src/styles/tokens.css` | **Source of truth.** Every `--c-*` variable, all three theme states. |
| `src/app.css` | `@theme inline` mapping + base layer. The only Tailwind config. |
| `src/lib/tokens.ts` | Typed mirror of the tokens, used to render the spec tables. |
| `src/lib/chart-theme.ts` | The canvas bridge (§7.2) — samples tokens, builds chart options. |
| `src/lib/theme.ts` | Three-state theme signal and the `.NIGHT` / `.DAY` stamp. |
| `src/lib/market-data.ts` | Deterministic sample series, seeded so SSR and hydration agree. |
| `src/components/ChartFrame.tsx` | Shared chart anatomy (§7.7). |
| `src/components/charts/` | The four Lightweight Charts (canvas) figures. |
| `src/routes/design.tsx` | **The spec page itself** — this document's live counterpart. |
| `src/routes/index.tsx` | A three-line redirect from `/` to `/design`. |
| `src/components/charts/svg/` | The nine SSR'd composition & distribution figures (§7.6). |
| `src/lib/chart-data.ts` | Hand-set fixtures for those nine — shape matters, so nothing is generated. |
| `scripts/export-artifact.mjs` | Snapshots the rendered page into a flat static bundle. |

### 10.3 Static export

```bash
pnpm build:static                      # SSR build with a relative asset base
pnpm preview                           # serve dist/
node scripts/export-artifact.mjs http://localhost:5180 /design
```

Produces `dist/artifact/` — an `index.html` plus `build/assets/`, hostable as flat files.

### 10.4 A note on this document

`design/design-system.html` used to hold a standalone single-file copy of the spec page.
It has been deleted: two artifacts describing one system is one artifact too many, and it
had already drifted. The running app at `/design` is the design system; this markdown file
is the written companion to it, not a duplicate of it.
