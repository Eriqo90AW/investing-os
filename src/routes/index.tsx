import { Title, Meta } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import { createMemo } from "solid-js";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import {
  AlphaBoard,
  DashboardHero,
  KpiGrid,
  MobileDock,
  PerformanceSummary,
  SignalRadar,
} from "~/components/dashboard/DashboardSections";
import { SetupOutcomes } from "~/components/dashboard/SetupOutcomes";
import { AttentionQueue } from "~/components/dashboard/AttentionQueue";
import { dashboardData } from "~/lib/dashboard-data";
import { initSetupsStore } from "~/lib/setups-store";
import { initTheme } from "~/lib/theme";
import { initPalette } from "~/lib/palette";
import { initAccent } from "~/lib/accent";
import { initTradesStore } from "~/lib/trades-store";
import { trades } from "~/lib/trades-store";
import { resultForTrade } from "~/lib/trade-analytics";

const PortfolioArea = clientOnly(() => import("~/components/charts/PortfolioArea"));

function ChartSkeleton() {
  return (
    <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
      <div class="px-250 pt-250 pb-150">
        <div class="w-44 h-5 rounded-50 bg-surface-2" />
        <div class="mt-100 w-64 max-w-full h-3 rounded-50 bg-surface-2" />
      </div>
      <div class="px-250 pb-200">
        <div class="w-full h-[300px] rounded-100 bg-surface-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  initTheme();
  initPalette();
  initAccent();
  initSetupsStore();
  initTradesStore();

  const equityData = createMemo(() => {
    const closed = trades().filter(trade => trade.status === "closed").sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
    let cumulative = 0;
    const points: Array<{ time: string; value: number }> = [];
    for (const trade of closed) {
      cumulative += resultForTrade(trade).realizedR ?? 0;
      const time = trade.updatedAt.slice(0, 10);
      if (points[points.length - 1]?.time === time) points[points.length - 1] = { time, value: cumulative };
      else points.push({ time, value: cumulative });
    }
    return points.length ? points : [{ time: "2026-09-20", value: 0 }];
  });

  return (
    <>
      <Title>Investing OS | Research dashboard</Title>
      <Meta
        name="description"
        content="Track investment setups, research signals, performance, and agent-assisted analysis in Investing OS."
      />

      <AppNavbar />
      <MarketPulseStrip markets={dashboardData.markets} />

      <main class="mx-auto max-w-[1440px] px-200 pb-800">
        <DashboardHero asOf={dashboardData.asOf} />
        <KpiGrid kpis={dashboardData.kpis} />
        <AttentionQueue />

        <section id="performance" class="mt-400 scroll-mt-28">
          <div class="grid xl:grid-cols-[minmax(0,2fr)_minmax(320px,.82fr)] gap-200">
            <div class="min-w-0">
              <PerformanceSummary />
              <PortfolioArea
                data={equityData()}
                title="Cumulative realized R"
                note="Closed journal trades after fees, measured against each trade's initial risk."
                height={300}
                valueFormatter={(value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`}
                fallback={<ChartSkeleton />}
              />
            </div>
            <SetupOutcomes />
          </div>
        </section>

        <section class="mt-200 grid xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)] gap-200">
          <AlphaBoard />
          <SignalRadar signals={dashboardData.signals} />
        </section>
      </main>

      <footer class="border-t border-line bg-bg-2">
        <div class="mx-auto max-w-[1440px] px-200 py-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-100 text-50 text-caption">
          <span>Investing OS dashboard preview</span>
          <span>All values are deterministic mock data. No live market feed is connected.</span>
        </div>
      </footer>

      <MobileDock />
    </>
  );
}
