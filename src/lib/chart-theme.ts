import { createEffect, on, onCleanup, onMount } from "solid-js";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type ChartOptions,
  type DeepPartial,
  type IChartApi,
} from "lightweight-charts";
import { resolved } from "./theme";

/**
 * Lightweight Charts paints to canvas, so it cannot read CSS variables the way
 * the DOM does. This module is the bridge: it samples the computed token values
 * off :root and hands them over as plain colors, then re-samples whenever the
 * theme changes. Charts therefore stay on the same token set as the rest of the
 * page without any color being written twice.
 */

export interface ChartTokens {
  surface: string;
  grid: string;
  axisText: string;
  crosshair: string;
  up: string;
  down: string;
  upFill: string;
  downFill: string;
  volumeUp: string;
  volumeDown: string;
  areaTop: string;
  areaBottom: string;
  series: [string, string, string, string];
  ink: string;
  muted: string;
  line: string;
}

function read(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = styles.getPropertyValue(name).trim();
  return v || fallback;
}

export function readChartTokens(): ChartTokens {
  const s = getComputedStyle(document.documentElement);
  return {
    surface: read(s, "--c-color-surface-1", "#FFFFFF"),
    grid: read(s, "--c-chart-grid", "#EFF2F5"),
    axisText: read(s, "--c-chart-axis-text", "#616E85"),
    crosshair: read(s, "--c-chart-crosshair", "#A6B0C3"),
    up: read(s, "--c-chart-up", "#16C784"),
    down: read(s, "--c-chart-down", "#EA3943"),
    upFill: read(s, "--c-chart-up-fill", "rgba(22,199,132,0.16)"),
    downFill: read(s, "--c-chart-down-fill", "rgba(234,57,67,0.16)"),
    volumeUp: read(s, "--c-chart-volume-up", "rgba(22,199,132,0.5)"),
    volumeDown: read(s, "--c-chart-volume-down", "rgba(234,57,67,0.5)"),
    areaTop: read(s, "--c-chart-area-top", "rgba(194,65,12,0.24)"),
    areaBottom: read(s, "--c-chart-area-bottom", "rgba(194,65,12,0)"),
    series: [
      read(s, "--c-chart-series-1", "#C2410C"),
      read(s, "--c-chart-series-2", "#3861FB"),
      read(s, "--c-chart-series-3", "#0F91A8"),
      read(s, "--c-chart-series-4", "#8A3FFC"),
    ],
    ink: read(s, "--c-color-text-primary", "#0D1421"),
    muted: read(s, "--c-color-text-secondary", "#616E85"),
    line: read(s, "--c-color-gray-200", "#EFF2F5"),
  };
}

/**
 * Recessive chrome, per the house rules: horizontal gridlines only, hairline
 * weight, axis labels in the secondary ink token, no border boxes. The data is
 * the only thing meant to carry contrast.
 */
export function baseChartOptions(t: ChartTokens): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: t.axisText,
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "segoe ui", Roboto, Helvetica, Arial, sans-serif',
      fontSize: 11,
      attributionLogo: true,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: t.grid, style: LineStyle.Solid },
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.12, bottom: 0.08 },
    },
    timeScale: {
      borderVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        color: t.crosshair,
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: t.muted,
      },
      horzLine: {
        color: t.crosshair,
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: t.muted,
      },
    },
    handleScale: { axisPressedMouseMove: { price: false } },
    localization: {
      locale: "en-US",
    },
  };
}

export interface ChartBuild {
  /** Re-apply token-derived colors to every series after a theme change. */
  retheme: (tokens: ChartTokens) => void;
  /** Optional teardown beyond chart.remove(). */
  dispose?: () => void;
}

export interface ThemedChartConfig {
  container: () => HTMLDivElement | undefined;
  height: number;
  /** Extra options merged over the base set (e.g. a second price scale). */
  options?: (tokens: ChartTokens) => DeepPartial<ChartOptions>;
  build: (chart: IChartApi, tokens: ChartTokens) => ChartBuild;
  /** Called once after the first paint, e.g. to fit content. */
  ready?: (chart: IChartApi) => void;
}

/**
 * Mounts a Lightweight Chart that owns its own resize observer and re-themes
 * itself when the viewer flips light/dark. Charts are client-only — on the
 * server the container renders empty at its reserved height, so SSR output
 * keeps the page's layout stable and nothing jumps on hydration.
 */
export function createThemedChart(config: ThemedChartConfig): void {
  let chart: IChartApi | undefined;
  let built: ChartBuild | undefined;

  onMount(() => {
    const el = config.container();
    if (!el) return;

    const tokens = readChartTokens();
    chart = createChart(el, {
      ...baseChartOptions(tokens),
      ...(config.options?.(tokens) ?? {}),
      width: el.clientWidth,
      height: config.height,
    });
    built = config.build(chart, tokens);
    config.ready?.(chart);

    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (chart && w) chart.applyOptions({ width: Math.floor(w) });
    });
    ro.observe(el);

    onCleanup(() => {
      ro.disconnect();
      built?.dispose?.();
      chart?.remove();
      chart = undefined;
      built = undefined;
    });
  });

  createEffect(
    on(
      resolved,
      () => {
        if (!chart || !built) return;
        const tokens = readChartTokens();
        chart.applyOptions({
          ...baseChartOptions(tokens),
          ...(config.options?.(tokens) ?? {}),
        });
        built.retheme(tokens);
      },
      { defer: true },
    ),
  );
}

/** Compact axis formatting — "$2.18T", "48.2B", "109.5K". */
export function compact(n: number, prefix = ""): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${prefix}${abs.toFixed(2)}`;
}
