import { clientOnly } from "@solidjs/start";
import { Title } from "@solidjs/meta";
import { initTheme } from "~/lib/theme";
import { ThemeToggle } from "~/components/ThemeToggle";
import { MarketTable } from "~/components/MarketTable";
import {
  BadgesAndInputs,
  Buttons,
  Pagination,
  StatTiles,
  TabsAndChips,
  TickerStrip,
} from "~/components/Catalog";
import { PieShare, DonutShare } from "~/components/charts/svg/PieDonut";
import { MarketShareTreemap } from "~/components/charts/svg/MarketShareTreemap";
import { RankedBars } from "~/components/charts/svg/RankedBars";
import { AllocationStack } from "~/components/charts/svg/AllocationStack";
import { ReturnsHeatmap } from "~/components/charts/svg/ReturnsHeatmap";
import { Waterfall } from "~/components/charts/svg/Waterfall";
import { RiskReturnScatter } from "~/components/charts/svg/RiskReturnScatter";
import { ReturnHistogram } from "~/components/charts/svg/ReturnHistogram";
import {
  ColorFoundations,
  Lede,
  SectionHeading,
  ShapeFoundations,
  SubHeading,
  TypeFoundations,
} from "~/components/Foundations";

/**
 * Lightweight Charts is canvas-only, so the chart components never run on the
 * server. Each fallback reserves the exact height its chart will occupy, which
 * keeps the SSR frame and the hydrated frame the same shape.
 */
const PriceChart = clientOnly(() => import("~/components/charts/PriceChart"));
const PortfolioArea = clientOnly(() => import("~/components/charts/PortfolioArea"));
const PnlBaseline = clientOnly(() => import("~/components/charts/PnlBaseline"));
const ComparisonLines = clientOnly(() => import("~/components/charts/ComparisonLines"));

function ChartSkeleton(props: { height: number; title: string }) {
  return (
    <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
      <div class="px-250 pt-250 pb-150">
        <div class="text-300 font-700">{props.title}</div>
        <div class="mt-50 text-75 text-caption">Loading chart…</div>
      </div>
      <div class="px-250 pb-250">
        <div
          class="w-full rounded-100 bg-surface-2"
          style={{ height: `${props.height}px` }}
        />
      </div>
    </div>
  );
}

const FORM_TABLE: [string, string, string][] = [
  ["Rank things against each other", "Ranked bar, one baseline", "Direction pair, or one hue"],
  ["See share of a whole, at a glance", "Donut (pie if there's no total)", "Categorical, ≤ 4 + Other"],
  ["See share as territory", "Treemap", "Sequential — size already says who"],
  ["Watch a mix drift over time", "100% stacked bar", "Categorical, ≤ 4 + Other"],
  ["Follow how a total was built", "Waterfall bridge", "Direction pair, neutral totals"],
  ["Weigh two variables together", "Scatter", "Emphasis: ≤ 3 named + field"],
  ["Read magnitude across a grid", "Heatmap", "Sequential, or diverging around zero"],
  ["See the shape of a distribution", "Histogram", "One hue — height is the data"],
  ["Read one current number", "Stat tile or hero figure", "None; it isn't a chart"],
];

const NAV = [
  { href: "#foundations", label: "Foundations" },
  { href: "#charts", label: "Charts" },
  { href: "#composition", label: "Composition" },
  { href: "#components", label: "Components" },
  { href: "#table", label: "Market Table" },
  { href: "#usage", label: "Usage" },
];

export default function DesignSystemPage() {
  initTheme();

  return (
    <>
      <Title>Investing OS Design System</Title>

      <TickerStrip />

      <header
        class="sticky z-30 bg-bg-2/95 backdrop-blur border-b border-line"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div class="mx-auto max-w-[1280px] px-200 h-16 flex items-center gap-300">
          <div class="flex items-center gap-100 shrink-0">
            <span class="grid place-items-center w-8 h-8 rounded-full bg-accent-fill text-on-accent font-700 text-100">
              IO
            </span>
            <span class="font-700 text-200 tracking-[-.01em]">Investing OS</span>
          </div>

          <nav class="hidden lg:flex items-center gap-250 text-100 font-600 text-ink">
            {NAV.map(item => (
              <a href={item.href} class="hover:text-accent transition-colors cursor-pointer">
                {item.label}
              </a>
            ))}
          </nav>

          <div class="ml-auto flex items-center gap-100">
            <ThemeToggle />
            <button
              type="button"
              class="hidden sm:inline-flex items-center h-9 px-200 rounded-100 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer"
            >
              Log In
            </button>
            <button
              type="button"
              class="inline-flex items-center h-9 px-200 rounded-100 text-100 font-600 text-on-accent bg-accent-fill hover:bg-accent-fill-hover transition cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-[1280px] px-200 pb-800">
        <section class="pt-500 pb-400 border-b border-line">
          <p class="text-50 font-600 uppercase tracking-[.08em] text-accent mb-100">
            Design system · v1.1 · SolidStart + Tailwind v4 + Lightweight Charts
          </p>
          <h1 class="text-1000 font-700 leading-[130%] text-balance max-w-[18ch]">
            Tokens for a market screen.
          </h1>
          <p class="mt-150 text-200 text-muted max-w-[65ch]">
            Every value here was read out of CoinMarketCap's shipped{" "}
            <code class="text-100 px-[4px] py-[1px] rounded-10 bg-surface-2 border border-line">
              :root
            </code>{" "}
            block, kept under its original{" "}
            <code class="text-100 px-[4px] py-[1px] rounded-10 bg-surface-2 border border-line">
              --c-*
            </code>{" "}
            name, and mapped into Tailwind by reference — so a utility like{" "}
            <code class="text-100 px-[4px] py-[1px] rounded-10 bg-surface-2 border border-line">
              bg-surface-1
            </code>{" "}
            is already correct in both themes without a single{" "}
            <code class="text-100 px-[4px] py-[1px] rounded-10 bg-surface-2 border border-line">
              dark:
            </code>{" "}
            variant. The charts read the same variables at runtime. Flip the theme control
            above and watch the hex labels change.
          </p>
        </section>

        <section id="foundations" class="pt-500 scroll-mt-24">
          <SectionHeading>Foundations</SectionHeading>
          <div class="mt-400">
            <ColorFoundations />
          </div>
          <div class="mt-500">
            <TypeFoundations />
          </div>
          <div class="mt-500">
            <ShapeFoundations />
          </div>
        </section>

        <section id="charts" class="pt-600 scroll-mt-24">
          <SectionHeading>Charts</SectionHeading>
          <Lede>
            TradingView's Lightweight Charts, driven entirely by the tokens above. Canvas
            can't read CSS variables, so{" "}
            <code class="text-75">lib/chart-theme.ts</code> samples them off{" "}
            <code class="text-75">:root</code> and re-samples on every theme flip — no
            color is written twice. Chrome is recessive: horizontal gridlines only, no
            axis borders, labels in the secondary ink token.
          </Lede>

          <div class="mt-250 flex flex-col gap-250">
            <PriceChart fallback={<ChartSkeleton height={380} title="BTC / USD · daily" />} />

            <div class="grid gap-250 lg:grid-cols-2">
              <PortfolioArea
                fallback={<ChartSkeleton height={260} title="Portfolio net asset value" />}
              />
              <PnlBaseline
                fallback={<ChartSkeleton height={260} title="Unrealised P&L vs cost basis" />}
              />
            </div>

            <ComparisonLines
              fallback={
                <ChartSkeleton height={300} title="Relative performance, rebased to 100" />
              }
            />
          </div>

          <div class="mt-300 rounded-200 border border-line bg-surface-1 p-250">
            <SubHeading>Chart rules</SubHeading>
            <ul class="mt-150 flex flex-col gap-100 text-100 text-muted max-w-[70ch]">
              <li>
                <b class="text-ink">One axis, always.</b> Two measures at different scales
                get two panes (price/volume) or get rebased to a common index — never a
                second y-scale on the same plot.
              </li>
              <li>
                <b class="text-ink">Green and red are reserved for direction.</b> They
                never appear as categorical series colors; the four chart slots are orange,
                blue, teal and purple for exactly that reason.
              </li>
              <li>
                <b class="text-ink">Color follows the entity, not the rank.</b> Hiding a
                series in the comparison chart leaves every survivor on its original slot.
              </li>
              <li>
                <b class="text-ink">Identity is never color-alone.</b> Two or more series
                carry a legend, and four or fewer are also labelled on the price axis.
              </li>
              <li>
                <b class="text-ink">Every chart has a table view.</b> It is the non-visual
                path to the same numbers, not an afterthought.
              </li>
              <li>
                <b class="text-ink">The grid recedes.</b> Horizontal hairlines only, in{" "}
                <code class="text-75">gray-200</code>; no vertical lines, no axis borders,
                no chart shadows.
              </li>
            </ul>
          </div>
        </section>

        <section id="composition" class="pt-600 scroll-mt-24">
          <SectionHeading>Composition &amp; distribution</SectionHeading>
          <Lede>
            Everything above is a time series, which is what Lightweight Charts is for.
            These are not, so they are hand-drawn SVG instead — which also means they
            render on the server and have no loading state at all. They read the same{" "}
            <code class="text-75">--c-chart-*</code> variables through plain CSS, so they
            follow the theme without sampling anything.
          </Lede>

          <div class="mt-250 flex flex-col gap-250">
            <div class="grid gap-250 lg:grid-cols-2">
              <MarketShareTreemap />
              <div class="flex flex-col gap-250">
                <DonutShare />
                <PieShare />
              </div>
            </div>

            <RankedBars />
            <AllocationStack />

            <div class="grid gap-250 lg:grid-cols-2">
              <Waterfall />
              <RiskReturnScatter />
            </div>

            <ReturnsHeatmap />
            <ReturnHistogram />
          </div>

          <div class="mt-300 rounded-200 border border-line bg-surface-1 p-250">
            <SubHeading>Picking the form</SubHeading>
            <Lede>
              Colour comes last. The data's job picks the shape first, and sometimes the
              answer is a stat tile rather than a chart at all.
            </Lede>
            <div class="mt-200 overflow-x-auto">
              <table class="w-full text-100 border-collapse min-w-[620px]">
                <thead>
                  <tr class="text-muted border-b border-line text-left">
                    <th scope="col" class="font-500 py-100 pr-200">The reader must…</th>
                    <th scope="col" class="font-500 py-100 pr-200">Form</th>
                    <th scope="col" class="font-500 py-100">Colour's job</th>
                  </tr>
                </thead>
                <tbody class="text-muted">
                  {FORM_TABLE.map(row => (
                    <tr class="border-b border-line last:border-0">
                      <td class="py-100 pr-200 text-ink">{row[0]}</td>
                      <td class="py-100 pr-200">{row[1]}</td>
                      <td class="py-100">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul class="mt-200 flex flex-col gap-100 text-100 text-muted max-w-[70ch]">
              <li>
                <b class="text-ink">Four identities, then a tail.</b> A fifth series is
                never a generated hue — it folds into <code class="text-75">Other</code> in
                the chromaless token. All-pairs forms (scatter) stop at three.
              </li>
              <li>
                <b class="text-ink">Sequential is one hue, light to dark.</b> Four steps,
                never a rainbow. It carries magnitude, which frees position and size to
                carry identity.
              </li>
              <li>
                <b class="text-ink">Diverging gets a neutral midpoint.</b> Two hues and a
                grey pivot — a hue in the middle invents a third category.
              </li>
              <li>
                <b class="text-ink">Pies answer one question.</b> "Is anything dominant."
                Anything finer than that is a bar chart, and the spec says so on the card.
              </li>
              <li>
                <b class="text-ink">White does the separating.</b> A 2px surface gap
                between touching marks and a 2px surface ring on overlapping dots — never
                a stroke drawn around a mark.
              </li>
              <li>
                <b class="text-ink">A label that won't fit isn't drawn.</b> Never clipped,
                never shrunk to nothing; the tooltip and the table view keep it reachable.
              </li>
            </ul>
          </div>
        </section>

        <section id="components" class="pt-600 scroll-mt-24">
          <SectionHeading>Components</SectionHeading>
          <div class="mt-400">
            <Buttons />
          </div>
          <div class="mt-400 grid gap-250 lg:grid-cols-2">
            <TabsAndChips />
            <BadgesAndInputs />
          </div>
          <div class="mt-400">
            <StatTiles />
          </div>
        </section>

        <section id="table" class="pt-600 scroll-mt-24">
          <SectionHeading>Market table</SectionHeading>
          <Lede>
            The component the whole system exists to serve: 60px rows, one hairline between
            them, no elevation, and color spent only on direction. Sparklines stay as SVG —
            at 135×40 a canvas chart per row costs more and reads no better.
          </Lede>
          <div class="mt-250">
            <MarketTable />
          </div>
          <Pagination />
        </section>

        <section id="usage" class="pt-600 scroll-mt-24">
          <SectionHeading>Using the tokens</SectionHeading>
          <div class="mt-250 grid gap-250 lg:grid-cols-2">
            <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
              <div class="px-250 py-150 border-b border-line text-75 font-600 uppercase tracking-[.08em] text-caption">
                src/app.css · Tailwind v4
              </div>
              <pre class="p-250 text-75 leading-[1.7] overflow-x-auto text-ink"><code>{`@import "tailwindcss";
@import "./styles/tokens.css";

@theme inline {
  --color-surface-1: var(--c-color-surface-1);
  --color-ink:       var(--c-color-text-primary);
  --color-pos:       var(--c-color-positive);
  --color-neg:       var(--c-color-negative);
  --color-series-1:  var(--c-chart-series-1);

  --text-100:    var(--c-font-size-100);
  --spacing-200: var(--c-space-200);
  --radius-100:  var(--c-border-radius-100);
}`}</code></pre>
            </div>
            <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
              <div class="px-250 py-150 border-b border-line text-75 font-600 uppercase tracking-[.08em] text-caption">
                src/lib/chart-theme.ts · canvas bridge
              </div>
              <pre class="p-250 text-75 leading-[1.7] overflow-x-auto text-ink"><code>{`// Canvas can't read CSS variables — sample them.
const s = getComputedStyle(document.documentElement);

grid:   s.getPropertyValue("--c-chart-grid").trim(),
up:     s.getPropertyValue("--c-chart-up").trim(),
series: [1, 2, 3, 4].map(n =>
  s.getPropertyValue(\`--c-chart-series-\${n}\`).trim()
),

// createEffect(on(resolved, …)) re-samples on theme flip.`}</code></pre>
            </div>
          </div>

          <div class="mt-250 rounded-200 border border-line bg-surface-1 p-250">
            <SubHeading>Rules worth keeping</SubHeading>
            <ul class="mt-150 flex flex-col gap-100 text-100 text-muted max-w-[70ch]">
              <li>
                <b class="text-ink">Never encode direction with color alone.</b> The ▲ / ▼
                glyph is part of the component, and screen readers get "up" / "down".
              </li>
              <li>
                <b class="text-ink">Orange is the only accent.</b> Links, primary buttons,
                active tab, focus ring, chart slot 1 — nothing else competes.
              </li>
              <li>
                <b class="text-ink">Don't hardcode a gray.</b> The ramp inverts between
                themes; the token already knows which way is up.
              </li>
              <li>
                <b class="text-ink">Elevation is earned.</b> Shadow means the thing floats.
                Rows and charts don't float.
              </li>
              <li>
                <b class="text-ink">text-caption is not load-bearing</b> — 2.2:1 on a
                light ground, 2.9:1 on a dark one. Meta only, by design.
              </li>
            </ul>
          </div>
        </section>

        <footer class="mt-800 pt-400 border-t border-line flex flex-wrap gap-150 justify-between text-75 text-caption">
          <span>
            Investing OS · tokens captured from coinmarketcap.com, 19 Sep 2026 · all market
            figures are deterministic samples
          </span>
          <span class="font-mono">design/DESIGN_SYSTEM.md</span>
        </footer>
      </main>
    </>
  );
}
