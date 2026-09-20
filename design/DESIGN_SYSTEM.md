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
3. **Orange is the only accent.** `#C2410C` carries every interactive affordance — links,
   primary buttons, the active tab underline, focus rings, chart slot 1. Nothing else
   competes. It is deliberately a *deep* orange: it is the only hue that ever sits under
   white text, and white clears 4.5:1 on it (5.2:1). Blue is demoted to a data-only hue
   (chart slot 2), so nothing blue in this system is clickable.
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

| Step | Orange | Blue | Green | Red | Purple | Teal | Beige |
|------|--------|------|-------|-----|--------|------|-------|
| 100 | `#FFF4EC` | `#F0F6FF` | `#DEFBF0` | `#FCE6E8` | `#F6F0FF` | `#E8FAFD` | `#FDF4EA` |
| 200 | `#FED7AA` | `#DDE4FD` | `#C3F8E4` | `#F8BABD` | `#E7D7FE` | `#B9EFF9` | `#FCEDDE` |
| 300 | `#FDBA74` | `#ACBDFB` | `#8CF2CC` | `#F8BABD` | `#C8A5FE` | `#7CE1F3` | `#FBE0C6` |
| 400 | `#F97316` | `#6188FF` | `#67E4B5` | `#EE626A` | `#A972FD` | `#3BD1ED` | `#F9D3AF` |
| **500** | **`#C2410C`** | **`#3861FB`** | **`#16C784`** | **`#EA3943`** | **`#8A3FFC`** | **`#13B2CF`** | **`#F5B97F`** |
| 600 | `#9A3412` | `#2444D4` | `#119C68` | `#CB1620` | `#6312DE` | `#0F91A8` | `#EE8B2A` |
| 700 | `#7C2D12` | `#0728A1` | `#0D734C` | `#981018` | `#4103A1` | `#0C7487` | `#BD650F` |
| 800 | `#3A2118` | `#1E274F` | `#173C37` | `#411F2A` | `#25015A` | `#084854` | `#433936` |

The orange ramp breaks the usual "500 is the mid step" reading on purpose. `500` is the
accent as a **ground** (white text on it), `400` is the accent as **ink** on a dark
ground, and `100`/`800` are the light and dark badge tints.

Two one-off brand colors sit outside the ramps: `--c-color-azure: #486DF7` and
`--c-color-teal: #23DCF5`.

### 2.2 The gray ramp inverts per theme

This is the single most important structural detail in the system. Do **not** hardcode a
gray hex — always use the token.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `gray-100` | `#F8FAFD` | `#222531` | Subtle surface / zebra row |
| `gray-200` | `#EFF2F5` | `#323546` | Hairline borders, dividers |
| `gray-300` | `#CFD6E4` | `#53596A` | Disabled borders, skeletons |
| `gray-400` | `#A6B0C3` | `#646B80` | Caption text, placeholder |
| `gray-500` | `#808A9D` | `#858CA2` | Icon default (near-identical in both themes) |
| `gray-600` | `#616E85` | `#A1A7BB` | Secondary text |

### 2.3 Semantic tokens

| Token | Light | Dark |
|-------|-------|------|
| `background-1` | `#FCFDFE` | `#171924` |
| `background-2` | `#FFFFFF` | `#0D1421` |
| `surface-1` | `#FFFFFF` | `#222531` |
| `surface-2` | `#F8FAFD` | `#2B2E3D` |
| `text-primary` | `#0D1421` | `#FFFFFF` |
| `text-secondary` | `#616E85` | `#A1A7BB` |
| `text-caption` | `#A6B0C3` | `#646B80` |
| `text-hyperlink` | `#C2410C` | `#F97316` |
| `accent` (ink) | `orange-500` | `orange-400` |
| `accent-fill` / `on-accent` | `#C2410C` / `#FFF` | `#C2410C` / `#FFF` |
| `positive` | `#16C784` | `#16C784` |
| `negative` | `#EA3943` | `#EA3943` |
| `positive-bg` | `green-100` | `green-800` |
| `negative-bg` | `red-100` | `red-800` |
| `official` / `official-bg` | `#C2410C` / `orange-100` | `#F97316` / `orange-800` |
| `reminder` / `reminder-bg` | `#F5B97F` / `beige-100` | `#F5B97F` / `#433936` |
| `no-access` / `no-access-bg` | `#858CA2` / `gray-200` | `#858CA2` / `gray-200` |
| `overlay-bg` | `rgba(88,102,126,.6)` | `rgba(23,25,36,.6)` |

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
| `--c-chart-grid` | `#EFF2F5` | `#323546` | Horizontal gridlines (= `gray-200`) |
| `--c-chart-axis-text` | `#616E85` | `#A1A7BB` | Axis labels (= `text-secondary`) |
| `--c-chart-crosshair` | `#A6B0C3` | `#646B80` | Crosshair rules (= `gray-400`) |
| `--c-chart-up` / `-down` | `#16C784` / `#EA3943` | same | Candle body, baseline poles |
| `--c-chart-volume-up` / `-down` | `rgb(… / .5)` | same | Volume bars, held back from the price pane |
| `--c-chart-area-top` / `-bottom` | orange 24% → 0% | orange 28% → 0% | Area fill under a single series |
| `--c-chart-series-1…4` | see §7.4 | see §7.4 | Categorical slots |

### 7.4 Categorical slots

Four slots, assigned in **fixed order** and never cycled. A fifth series folds into
"Other", becomes small multiples, or the chart gets faceted — it is never a generated
hue.

| Slot | Hue | Light | Dark |
|------|-----|-------|------|
| 1 | orange | `#C2410C` | `#F97316` |
| 2 | blue | `#3861FB` | `#6188FF` |
| 3 | teal | `#0F91A8` | `#0F91A8` |
| 4 | purple | `#8A3FFC` | `#8A3FFC` |

**Green and red are deliberately absent.** They mean price direction in this system, so
reusing them for "series 3" would make a neutral line read as a gain. Only slot 1
re-steps for dark — the other three already sit in the dark lightness band. Slot 2 is
blue, not amber: with orange in slot 1, an amber slot 2 collapses into it under every
CVD model.

**Validation.** Both columns were run through the six checks against their own surface
(`#FFFFFF` light, `#222531` dark): lightness band, chroma floor, CVD separation,
normal-vision floor, contrast vs surface. All pass in both modes. The worst adjacent pair
under deuteranopia is purple ↔ teal at **ΔE 16.2**, well clear of the ΔE 8 target, so no
secondary encoding is strictly required — the charts direct-label anyway.

Re-run after any change to the slots rather than eyeballing them.

### 7.5 Picking the form

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

### 7.6 Chrome

The chart chrome is as recessive as the table's:

- Horizontal gridlines only, in `gray-200`. No vertical lines.
- No axis borders (`borderVisible: false` on both scales).
- Axis labels at 11px in `text-secondary`, Inter, tabular by nature.
- Crosshair is a 1px dashed rule in `gray-400`, magnet mode, with the axis label chip in
  `text-secondary`.
- Line weight 2px, matching `--c-border-width-200`.
- Chart cards are flat: `surface-1`, `radius-200`, 1px `gray-200`, **no shadow**.

### 7.7 Anatomy

Every figure goes through `ChartFrame`, so the parts land in the same place each time:

1. **Title** (`font-size-300`/700) and a one-line note in `text-75 text-muted`.
2. **Hero readout**, right-aligned — the last value at rest, the hovered value on hover.
   This is the tooltip; it does not float, so it can never collide with a mark.
3. **Legend** for two or more series, with a 10px swatch. One series gets no legend box —
   the title names it.
4. **The plot.**
5. **Table view**, in a `<details>` — the same numbers, downsampled, as text.

### 7.8 Non-negotiables

- **One axis.** Two measures at different scales get two panes or a common index. Never
  a second y-scale on one plot.
- **Color follows the entity, not the rank.** Hiding a series in the comparison chart
  leaves every survivor on its original slot.
- **Identity is never color-alone.** ≥2 series carry a legend; ≤4 are also labelled on
  the price axis (`title` on the series options).
- **Direction is never color-alone.** ▲ / ▼ glyphs in the table, sign in the P&L readout,
  and `sr-only` "up" / "down" for screen readers.
- **Every chart has a table view.** It is the non-visual path to the numbers.
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

- `text-caption` on `background-1` is roughly 2.9:1 in light mode. CMC uses it only for
  non-essential meta; don't put anything load-bearing in it.
- Never encode price direction with color alone — the `▲` / `▼` glyph is required.
- Focus ring: `0 0 0 3px rgba(56,97,251,.35)` in both themes. Never remove an outline
  without replacing it.
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
the app's index route. Open it and flip Light / Auto / Dark; the hex labels under each
swatch are sampled from `:root` at runtime, so they show what actually paints.

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
| `src/components/charts/` | The four Lightweight Charts figures. |
| `src/routes/index.tsx` | The spec page itself. |
| `scripts/export-artifact.mjs` | Snapshots the rendered page into a flat static bundle. |

### 10.3 Static export

```bash
pnpm build:static                      # SSR build with a relative asset base
pnpm preview                           # serve dist/
node scripts/export-artifact.mjs http://localhost:5180
```

Produces `dist/artifact/` — an `index.html` plus `build/assets/`, hostable as flat files.

### 10.4 Superseded

`design/design-system.html` is the original single-file prototype of this page, kept for
reference only. **The SolidStart app is canonical** — edit `src/`, not that file.
