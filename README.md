# Investing OS

A **design system for dense, numeric, market-facing screens** — and a running application
that *is* the specification for it.

There is no Storybook, no separate docs site, and no static artifact to keep in sync. The
app serves one page, at [`/design`](http://localhost:5180/design), and that page renders
every token, component and chart in the system using the real components against the real
tokens. If something is not on that page, it is not in the system.

The palette is reverse-engineered from CoinMarketCap's shipped `:root` block (captured
2026-09-19) and keeps their `--c-*` namespace, then departs from it in two deliberate
ways: the accent is a deep burnt orange rather than blue, and the neutral ramp is warm
rather than blue-cast. `design/DESIGN_SYSTEM.md` is the written companion — this README
is how to run it; that file is what every value means.

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5180/design
```

**pnpm only.** `packageManager` pins `pnpm@11.22.0` for corepack and a `preinstall` guard
(`npx only-allow pnpm`) rejects `npm install` and `yarn`, so a stray `package-lock.json`
can't appear beside `pnpm-lock.yaml`.

| Script | What it does |
|---|---|
| `pnpm dev` | Vite dev server on port 5180 |
| `pnpm build` | SSR production build into `dist/` |
| `pnpm build:static` | Same build with a relative asset base, for flat hosting |
| `pnpm preview` | Serve the built output on 5180 |
| `pnpm typecheck` | `tsc --noEmit` |

`/` redirects to `/design`; nothing else is served from this app yet.

**Stack:** SolidStart 2 · Vite 8 · TypeScript (strict, `noUncheckedIndexedAccess`) ·
Tailwind CSS v4 · TradingView Lightweight Charts v5.

---

## The one idea

**Every colour in the app resolves through a CSS custom property, and nothing is written
twice.**

```
src/styles/tokens.css      the --c-* variables, in three theme states
        ↓                  (light · system-dark · explicit toggle)
src/app.css                @theme inline — maps them into Tailwind by reference
        ↓
bg-surface-1               already correct in both themes, no `dark:` variant
```

Because the `@theme` mapping is `inline`, every Tailwind utility emits a `var()` rather
than a resolved hex. That is why this codebase has essentially **no `dark:` variants**:
`bg-surface-1` is a variable lookup, and the variable already knows which theme it is in.

Three consequences worth knowing before you edit anything:

- **The gray ramp inverts.** `gray-100` always means *closest to the background* and
  `gray-600` *closest to the text* — in both themes. The hex values physically swap ends.
  Never hardcode a gray.
- **The theme has three states, not two.** Light, system, and explicit dark, stamped onto
  `<html>` as `data-theme` plus CMC's own `.NIGHT` / `.DAY` classes. The token sheet
  declares its dark block twice on purpose, once under `prefers-color-scheme` and once
  under the attribute, so each wins in its own direction.
- **Dark mode is *selected*, not flipped.** Every dark value is its own chosen step
  validated against the dark surface, never an automatic inversion of the light one.

---

## Two chart layers

| | Canvas | SVG |
|---|---|---|
| Where | `src/components/charts/` | `src/components/charts/svg/` |
| Library | Lightweight Charts v5 | none — hand-drawn |
| Renders on the server | no (`clientOnly`, reserved height) | **yes** |
| Reads tokens by | sampling `:root` at runtime | plain CSS `var()` |
| Forms | candlestick, area, baseline, multi-line | pie, donut, treemap, ranked bar, stacked bar, waterfall, scatter, heatmap, gauge |

Canvas cannot read CSS custom properties, so `src/lib/chart-theme.ts` is the one place
that crosses over: it samples the tokens with `getComputedStyle`, hands them to
Lightweight Charts as plain hex, and re-samples on every theme flip. The SVG charts need
none of that — they reference the same variables directly, which is also why they SSR and
have no loading state at all.

**SVG figures never scale above 1:1.** An SVG set to `width: 100%` scales its whole
coordinate system, so a full-width card stretched a 620-unit viewBox to ~1240px and
rendered every 11px label at 22px. `ChartCanvas` caps each drawing at its own viewBox
width; below that it scales down with the viewport, which is the direction that degrades
gracefully.

**The palette is computed, not eyeballed.** The categorical slots, the sequential ramp and
the label-ink pairings were each run through the dataviz validator (lightness band, chroma
floor, CVD separation, normal-vision floor, contrast vs surface) against both real
surfaces. Re-run it after touching any of them rather than trusting your eye — that check
is what caught the dark accent failing the lightness band as a *mark* while being fine as
*text*, and what fixed the sequential ramp at four steps rather than five.

---

## Rules the code actually enforces

- **Orange is the only accent.** Links, primary buttons, the active tab, the focus ring,
  chart slot 1. Blue exists but is data-only — nothing blue in this system is clickable.
- **Green and red are reserved for direction.** They never appear as decoration or as a
  categorical series. If something is green here, it went up.
- **Never encode direction with colour alone.** The `▲` / `▼` glyph is part of the
  component, and screen readers get "up" / "down".
- **Four categorical identities, then a tail.** A fifth series is never a generated hue —
  it folds into `Other` in a deliberately chromaless token. All-pairs forms (scatter) stop
  at three.
- **One axis.** Two measures at different scales get two panes or get rebased to a common
  index. Never a second y-scale on the same plot.
- **White does the separating.** A 2px surface gap between touching marks and a 2px
  surface ring on overlapping dots — never a stroke drawn around a mark.
- **A label that won't fit is not drawn.** Never clipped, never shrunk away; the tooltip
  keeps it reachable, and where the value is the point of the chart (pie slices, treemap
  tiles) it is pushed outside the mark rather than dropped.
- **Charts carry a full `aria-label`** naming every series and value. There is no table
  view; the label is the non-visual path. A sighted reader who cannot separate two hues
  has no text fallback, which is a known cost of that choice.

---

## Layout

| Path | What it is |
|---|---|
| `src/styles/tokens.css` | **Source of truth.** Every `--c-*` variable, all three theme states. |
| `src/app.css` | The `@theme inline` mapping and base layer. The only Tailwind config. |
| `src/routes/design.tsx` | The spec page — the design system itself. |
| `src/routes/index.tsx` | A three-line redirect from `/` to `/design`. |
| `src/lib/tokens.ts` | Typed mirror of the tokens, used to render the spec tables. |
| `src/lib/theme.ts` | Three-state theme signal and the `.NIGHT` / `.DAY` stamp. |
| `src/lib/chart-theme.ts` | The canvas bridge — samples tokens, builds chart options. |
| `src/lib/market-data.ts` | Seeded random-walk series for the time-series charts. |
| `src/lib/chart-data.ts` | Hand-set fixtures for the SVG charts. |
| `src/components/Foundations.tsx` | Colour, type and shape specimen blocks. |
| `src/components/Catalog.tsx` | Buttons, tabs, chips, badges, inputs, stat tiles. |
| `src/components/MarketTable.tsx` | The component the whole system exists to serve. |
| `src/components/ChartFrame.tsx` | Shared chart anatomy: title, hero readout, legend. |
| `scripts/export-artifact.mjs` | Snapshots the rendered page into a flat static bundle. |
| `design/DESIGN_SYSTEM.md` | The written spec — every value, and why. |

### Sample data is fake, and deterministic on purpose

Nothing here touches a live feed. The time-series charts run on a seeded `mulberry32`
random walk so the SSR pass and the hydration pass produce byte-identical numbers — a
`Math.random()` series would mismatch on hydration and flicker. The composition charts use
hand-set figures instead, because those forms are judged on whether their *shape* is right
(do the slices sum to 100, does the waterfall close on its total, does the treemap square
up) and a random walk can't guarantee that.

### Static export

```bash
pnpm build:static
pnpm preview
node scripts/export-artifact.mjs http://localhost:5180 /design
```

Produces `dist/artifact/` — an `index.html` plus `build/assets/`, hostable as flat files
and strippable into a host that supplies its own document shell.

---

## Known gaps

- **No tests and no linter.** `pnpm typecheck` is the only automated check in the repo.
- **No backend.** Every figure on the page is a fixture; there is no data layer to swap in
  yet.
- **One route.** The design system is the product so far.
