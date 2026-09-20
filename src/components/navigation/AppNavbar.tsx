import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
  Bell,
  Bot,
  Command,
  Filter,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-solid";
import { A, useLocation } from "@solidjs/router";
import { SettingsModal } from "~/components/settings/SettingsModal";
import { agentOpen, toggleAgent } from "~/lib/agent/store";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Setups", href: "/setups", icon: Target },
  { label: "Screener", href: "/screener", icon: Filter },
] as const;

const COMMANDS = [
  { label: "Go to overview", detail: "Dashboard KPIs", href: "/" },
  { label: "Open setup workspace", detail: "Create and edit setups", href: "/setups" },
  { label: "Open quant screener", detail: "Best setups across universes", href: "/screener" },
  { label: "Review performance", detail: "Equity curve and risk", href: "/#performance" },
  { label: "Read signal radar", detail: "News and catalysts", href: "/#signals" },
] as const;

export function AppNavbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [paletteOpen, setPaletteOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  let searchInput: HTMLInputElement | undefined;

  const matches = createMemo(() => {
    const value = query().trim().toLowerCase();
    if (!value) return COMMANDS;
    return COMMANDS.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(value));
  });

  const closePalette = () => {
    setPaletteOpen(false);
    setQuery("");
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(open => !open);
      }
      if (event.key === "Escape") {
        closePalette();
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  const openPalette = () => {
    setPaletteOpen(true);
    queueMicrotask(() => searchInput?.focus());
  };

  return (
    <>
      <header class="sticky top-0 z-40 border-b border-line bg-bg-2/95 backdrop-blur-xl">
        <div class="mx-auto max-w-[1440px] h-16 px-200 flex items-center gap-200">
          <A href="/" class="flex items-center gap-100 shrink-0" aria-label="Investing OS home">
            <span class="relative grid place-items-center w-9 h-9 rounded-100 overflow-hidden shadow-tiny">
              {/* Same mark as the favicon in entry-server.tsx: lime tile, ink spark. */}
              <svg viewBox="0 0 32 32" class="w-9 h-9 block" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#99E50B" />
                <path
                  d="M7 21l5-6 4 3 4-7 5 5"
                  stroke="#14161F"
                  stroke-width="2.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="hidden sm:block">
              <span class="block font-700 text-100 tracking-[-.01em] leading-none">Investing OS</span>
              <span class="block mt-50 text-50 text-caption leading-none">Research workspace</span>
            </span>
          </A>

          <nav class="hidden lg:flex items-center gap-50 ml-100" aria-label="Primary">
            <For each={NAV_ITEMS}>
              {item => (
                <A
                  href={item.href}
                  aria-current={location.pathname === item.href ? "page" : undefined}
                  class="h-9 px-150 inline-flex items-center rounded-100 text-75 font-600 transition-colors cursor-pointer border-b-2 border-transparent"
                  classList={{
                    "text-accent bg-official-bg/60": location.pathname === item.href,
                    "text-muted hover:text-ink hover:bg-surface-2": location.pathname !== item.href,
                  }}
                >
                  {item.label}
                </A>
              )}
            </For>
          </nav>

          <button
            type="button"
            onClick={openPalette}
            class="ml-auto lg:ml-200 xl:ml-auto w-full max-w-[360px] h-10 px-150 hidden md:flex items-center gap-100 rounded-100 border border-line bg-surface-2 text-muted hover:border-hairline transition-colors cursor-pointer"
            aria-label="Open command search"
          >
            <Search size={16} />
            <span class="text-75 truncate">Search markets, setups, or ask AI</span>
            <span class="ml-auto inline-flex items-center gap-[2px] px-100 h-6 rounded-50 border border-line bg-surface-1 text-50 font-600 text-caption">
              <Command size={11} />K
            </span>
          </button>

          <div class="ml-auto md:ml-0 flex items-center gap-100">
            <button
              type="button"
              onClick={toggleAgent}
              aria-pressed={agentOpen()}
              class="inline-flex h-9 px-100 sm:px-150 items-center gap-100 rounded-100 bg-accent-fill text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer"
            >
              <Bot size={16} />
              {agentOpen() ? "Hide AI" : "Ask AI"}
            </button>
            <button
              type="button"
              class="relative grid place-items-center w-9 h-9 rounded-100 text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span class="absolute right-[7px] top-[7px] w-1.5 h-1.5 rounded-full bg-neg" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              class="relative grid place-items-center w-9 h-9 rounded-100 text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Open settings"
            >
              <Settings size={17} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              class="lg:hidden grid place-items-center w-9 h-9 rounded-100 text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen()}
            >
              <Show when={menuOpen()} fallback={<Menu size={19} />}><X size={19} /></Show>
            </button>
            <button
              type="button"
              class="hidden lg:grid place-items-center w-9 h-9 rounded-full bg-surface-2 border border-line text-75 font-700 text-ink"
              aria-label="Open user menu"
            >
              ER
            </button>
          </div>
        </div>

        <Show when={menuOpen()}>
          <nav class="lg:hidden px-200 pb-200 grid grid-cols-2 gap-100 border-t border-line bg-bg-2" aria-label="Primary">
            <For each={NAV_ITEMS}>
              {item => (
                <A
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  class="mt-150 h-10 px-150 flex items-center gap-100 rounded-100 bg-surface-2 text-75 font-600 text-ink"
                >
                  <item.icon size={16} class="text-accent" />
                  {item.label}
                </A>
              )}
            </For>
          </nav>
        </Show>
      </header>

      <Show when={paletteOpen()}>
        <div
          class="fixed inset-0 z-50 bg-[var(--c-color-overlay-bg)] px-200 pt-[12vh]"
          role="presentation"
          onMouseDown={event => event.target === event.currentTarget && closePalette()}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Command search"
            class="mx-auto max-w-[620px] overflow-hidden rounded-300 border border-line bg-surface-1 shadow-overlay"
          >
            <div class="h-14 px-200 flex items-center gap-150 border-b border-line">
              <Search size={18} class="text-muted" />
              <input
                ref={searchInput}
                value={query()}
                onInput={event => setQuery(event.currentTarget.value)}
                placeholder="Search dashboard actions"
                class="min-w-0 flex-1 bg-transparent text-200 text-ink placeholder:text-caption outline-none"
              />
              <button type="button" onClick={closePalette} class="px-100 h-7 rounded-50 border border-line text-50 font-600 text-caption cursor-pointer">
                Esc
              </button>
            </div>
            <div class="p-100 max-h-[360px] overflow-y-auto">
              <p class="px-100 py-100 text-50 font-700 uppercase tracking-[.08em] text-caption">Quick navigation</p>
              <For each={matches()} fallback={<p class="px-150 py-300 text-75 text-muted">No matching action.</p>}>
                {item => (
                  <a
                    href={item.href}
                    onClick={closePalette}
                    class="px-150 py-150 flex items-center gap-150 rounded-100 hover:bg-surface-2 transition-colors"
                  >
                    <span class="grid place-items-center w-8 h-8 rounded-100 bg-official-bg text-official"><Sparkles size={15} /></span>
                    <span>
                      <span class="block text-100 font-600 text-ink">{item.label}</span>
                      <span class="block text-75 text-muted">{item.detail}</span>
                    </span>
                    <span class="ml-auto text-50 text-caption">Open</span>
                  </a>
                )}
              </For>
            </div>
          </section>
        </div>
      </Show>

      <SettingsModal open={settingsOpen()} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
