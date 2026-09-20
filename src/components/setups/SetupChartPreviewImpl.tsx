import { For, createEffect, createMemo, createSignal, type JSX } from "solid-js";
import { CandlestickSeries, LineSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { Minus, MousePointer2, Square, Trash2, Undo2 } from "lucide-solid";
import { ChartFrame, ChartSurface } from "../ChartFrame";
import { createThemedChart } from "~/lib/chart-theme";
import { setupCandles } from "~/lib/setup-generator";

const DEFAULT_HEIGHT = 220;
const RANGES = ["1D", "1W", "1M", "1Y"] as const;
const RANGE_BARS: Record<(typeof RANGES)[number], number> = { "1D": 2, "1W": 6, "1M": 22, "1Y": 260 };
const MA_PERIODS = [20, 50, 200] as const;
type DrawTool = "cursor" | "entry" | "line" | "fib";
type Point = { x: number; y: number };
type Drawing = { id: number; tool: Exclude<DrawTool, "cursor">; start: Point; end: Point };

export interface SetupChartPreviewProps {
  ticker: string;
  height?: number;
}

export default function SetupChartPreview(props: SetupChartPreviewProps) {
  let container: HTMLDivElement | undefined;
  let chartApi: IChartApi | undefined;
  let priceSeries: ISeriesApi<"Candlestick"> | undefined;
  const maSeries = new Map<number, ISeriesApi<"Line">>();
  const height = () => props.height ?? DEFAULT_HEIGHT;
  const [range, setRange] = createSignal<(typeof RANGES)[number]>("1Y");
  const [activeMas, setActiveMas] = createSignal<number[]>([20, 50]);
  const [tool, setTool] = createSignal<DrawTool>("cursor");
  const [drawings, setDrawings] = createSignal<Drawing[]>([]);
  const [draft, setDraft] = createSignal<Drawing | null>(null);
  let drawingId = 0;

  const allData = createMemo(() => setupCandles(props.ticker, 280));
  const data = createMemo(() => allData().slice(-RANGE_BARS[range()]));
  const last = createMemo(() => data()[data().length - 1]);
  const first = createMemo(() => data()[0]);
  const changePct = createMemo(() => {
    const f = first();
    const l = last();
    return f && l ? ((l.close - f.open) / f.open) * 100 : 0;
  });

  const movingAverage = (period: number) => {
    const candles = allData();
    return candles.flatMap((candle, index) => {
      if (index + 1 < period) return [];
      const window = candles.slice(index + 1 - period, index + 1);
      return [{ time: candle.time, value: window.reduce((sum, item) => sum + item.close, 0) / period }];
    });
  };

  const visibleMovingAverage = (period: number) => movingAverage(period).slice(-RANGE_BARS[range()]);

  createThemedChart({
    container: () => container,
    height: props.height ?? DEFAULT_HEIGHT,
    build: (chart, tokens) => {
      chartApi = chart;
      const price = chart.addSeries(CandlestickSeries, {
        upColor: tokens.up,
        downColor: tokens.down,
        borderUpColor: tokens.up,
        borderDownColor: tokens.down,
        wickUpColor: tokens.up,
        wickDownColor: tokens.down,
      });
      priceSeries = price;
      price.setData(data());

      MA_PERIODS.forEach((period, index) => {
        const series = chart.addSeries(LineSeries, {
          color: tokens.series[index + 1],
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          visible: activeMas().includes(period),
        });
        series.setData(visibleMovingAverage(period));
        maSeries.set(period, series);
      });

      chart.priceScale("right").applyOptions({ scaleMargins: { top: 0.12, bottom: 0.12 } });
      return {
        retheme: next => {
          price.applyOptions({
            upColor: next.up,
            downColor: next.down,
            borderUpColor: next.up,
            borderDownColor: next.down,
            wickUpColor: next.up,
            wickDownColor: next.down,
          });
          MA_PERIODS.forEach((period, index) => maSeries.get(period)?.applyOptions({ color: next.series[index + 1] }));
        },
        dispose: () => {
          chartApi = undefined;
          priceSeries = undefined;
          maSeries.clear();
        },
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  createEffect(() => {
    const next = data();
    if (!priceSeries || !chartApi) return;
    priceSeries.setData(next);
    MA_PERIODS.forEach(period => maSeries.get(period)?.setData(visibleMovingAverage(period)));
    chartApi.timeScale().fitContent();
  });

  createEffect(() => {
    const enabled = activeMas();
    MA_PERIODS.forEach(period => maSeries.get(period)?.applyOptions({ visible: enabled.includes(period) }));
  });

  const toggleMa = (period: number) => {
    setActiveMas(current => current.includes(period) ? current.filter(item => item !== period) : [...current, period]);
  };

  type ChartPointerEvent = PointerEvent & { currentTarget: SVGSVGElement };

  const normalizedPoint = (event: ChartPointerEvent): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((event.clientX - bounds.left) / bounds.width) * 1000)),
      y: Math.max(0, Math.min(1000, ((event.clientY - bounds.top) / bounds.height) * 1000)),
    };
  };

  const beginDrawing = (event: ChartPointerEvent) => {
    if (tool() === "cursor") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizedPoint(event);
    setDraft({ id: ++drawingId, tool: tool() as Drawing["tool"], start: point, end: point });
  };

  const moveDrawing = (event: ChartPointerEvent) => {
    if (!draft()) return;
    const point = normalizedPoint(event);
    setDraft(current => current ? { ...current, end: point } : null);
  };

  const finishDrawing = (event: ChartPointerEvent) => {
    const current = draft();
    if (!current) return;
    setDrawings(items => [...items, { ...current, end: normalizedPoint(event) }]);
    setDraft(null);
  };

  const positive = () => changePct() >= 0;

  return (
    <ChartFrame
      title={`${props.ticker.toUpperCase()} chart`}
      note="Select a drawing tool, then drag on the chart. Use Pointer to pan and zoom."
      primaryValue={() => <div class="text-200 font-700 tabular-nums">${last()?.close.toFixed(2) ?? "-"}</div>}
      secondaryValue={() => (
        <div class="text-75 font-600 tabular-nums" classList={{ "text-pos": positive(), "text-neg": !positive() }}>
          {positive() ? "+" : "-"}{Math.abs(changePct()).toFixed(2)}%
        </div>
      )}
    >
      <div class="mb-150 flex flex-wrap items-center justify-between gap-100 border-y border-line py-100">
        <div class="flex flex-wrap items-center gap-50" aria-label="Drawing tools">
          <ToolButton active={tool() === "cursor"} label="Pointer" onClick={() => setTool("cursor")}><MousePointer2 size={14} /></ToolButton>
          <ToolButton active={tool() === "entry"} label="Entry area" onClick={() => setTool("entry")}><Square size={14} /></ToolButton>
          <ToolButton active={tool() === "line"} label="Line" onClick={() => setTool("line")}><Minus size={14} /></ToolButton>
          <ToolButton active={tool() === "fib"} label="Fibonacci" onClick={() => setTool("fib")}><span class="font-700">Fib</span></ToolButton>
          <button type="button" class="grid size-8 place-items-center rounded-100 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40" disabled={!drawings().length} aria-label="Undo drawing" onClick={() => setDrawings(items => items.slice(0, -1))}><Undo2 size={14} /></button>
          <button type="button" class="grid size-8 place-items-center rounded-100 text-muted hover:bg-surface-2 hover:text-neg disabled:opacity-40" disabled={!drawings().length} aria-label="Clear drawings" onClick={() => setDrawings([])}><Trash2 size={14} /></button>
        </div>
        <div class="flex flex-wrap items-center gap-100">
          <div class="flex items-center gap-50" aria-label="Moving averages">
            <span class="mr-50 text-50 font-700 uppercase tracking-[.06em] text-caption">MA</span>
            <For each={MA_PERIODS}>{period => <Chip active={activeMas().includes(period)} label={`${period}`} onClick={() => toggleMa(period)} />}</For>
          </div>
          <div class="flex items-center gap-50" aria-label="Chart range">
            <For each={RANGES}>{item => <Chip active={range() === item} label={item} onClick={() => setRange(item)} />}</For>
          </div>
        </div>
      </div>
      <div class="relative overflow-hidden rounded-100 bg-surface-1">
        <ChartSurface height={height()} ref={el => (container = el)} label={`${props.ticker.toUpperCase()} candlestick chart with drawing tools and moving averages.`} />
        <svg
          class="absolute inset-0 z-10 size-full touch-none select-none"
          classList={{ "pointer-events-none": tool() === "cursor", "cursor-crosshair": tool() !== "cursor" }}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          onPointerDown={beginDrawing}
          onPointerMove={moveDrawing}
          onPointerUp={finishDrawing}
          onPointerCancel={() => setDraft(null)}
          aria-hidden="true"
        >
          <For each={[...drawings(), ...(draft() ? [draft()!] : [])]}>{drawing => <DrawingMark drawing={drawing} />}</For>
        </svg>
      </div>
    </ChartFrame>
  );
}

function ToolButton(props: { active: boolean; label: string; onClick: () => void; children: JSX.Element }) {
  return <button type="button" title={props.label} aria-label={props.label} aria-pressed={props.active} onClick={props.onClick} class="inline-flex h-8 items-center gap-50 rounded-100 border px-100 text-75 font-600 transition-colors" classList={{ "border-transparent bg-official-bg text-accent": props.active, "border-line text-muted hover:text-ink": !props.active }}>{props.children}<span class="hidden xl:inline">{props.label}</span></button>;
}

function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={props.active} onClick={props.onClick} class="h-7 min-w-8 rounded-100 px-100 text-50 font-700 transition-colors" classList={{ "bg-official-bg text-accent": props.active, "text-muted hover:bg-surface-2 hover:text-ink": !props.active }}>{props.label}</button>;
}

function DrawingMark(props: { drawing: Drawing }) {
  const d = props.drawing;
  const x = Math.min(d.start.x, d.end.x);
  const y = Math.min(d.start.y, d.end.y);
  const width = Math.abs(d.end.x - d.start.x);
  const markHeight = Math.abs(d.end.y - d.start.y);
  if (d.tool === "entry") return <rect x={x} y={y} width={width} height={markHeight} fill="var(--c-chart-up-fill)" stroke="var(--c-chart-up)" stroke-width="2" vector-effect="non-scaling-stroke" />;
  if (d.tool === "line") return <line x1={d.start.x} y1={d.start.y} x2={d.end.x} y2={d.end.y} stroke="var(--c-chart-series-2)" stroke-width="2" vector-effect="non-scaling-stroke" />;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  return <g><For each={levels}>{level => {
    const lineY = d.start.y + (d.end.y - d.start.y) * level;
    return <g><line x1={d.start.x} y1={lineY} x2={d.end.x} y2={lineY} stroke="var(--c-chart-series-4)" stroke-width="1" vector-effect="non-scaling-stroke" /><text x={x + 8} y={lineY - 6} fill="var(--c-chart-axis-text)" font-size="22">{level.toFixed(3)}</text></g>;
  }}</For></g>;
}
