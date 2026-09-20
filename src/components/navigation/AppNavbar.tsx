import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
  Bell,
  Bot,
  Command,
  LayoutDashboard,
  Menu,
  Search,
  Sparkles,
  Target,
  Telescope,
  X,
} from "lucide-solid";
import { ThemeToggle } from "~/components/ThemeToggle";

const NAV_ITEMS = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Performance", href: "#performance", icon: Telescope },
  { label: "Setups", href: "#setups", icon: Target },
  { label: "Signals", href: "#signals", icon: Sparkles },
] as const;

const COMMANDS = [
  { label: "Go to overview", detail: "Dashboard KPIs", href: "#overview" },
  { label: "Review performance", detail: "Equity curve and risk", href: "#performance" },
  { label: "Open alpha board", detail: "Saved trade setups", href: "#setups" },
  { label: "Read signal radar", detail: "News and catalysts", href: "#signals" },
  { label: "Ask Investing OS", detail: "Open the research agent", href: "#agent" },
] as const;

export function AppNavbar() {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [paletteOpen, setPaletteOpen] = createSignal(false);
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
          <a href="#overview" class="flex items-center gap-100 shrink-0" aria-label="Investing OS dashboard">
            <span class="relative grid place-items-center w-9 h-9 rounded-100 bg-secondary text-on-secondary font-900 text-100 shadow-tiny">
              IO
              <span class="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-accent-fill border-2 border-bg-2" />
            </span>
            <span class="hidden sm:block">
              <span class="block font-700 text-100 tracking-[-.01em] leading-none">Investing OS</span>
              <span class="block mt-50 text-50 text-caption leading-none">Research workspace</span>
            </span>
          </a>

          <nav class="hidden lg:flex items-center gap-50 ml-100" aria-label="Dashboard sections">
            <For each={NAV_ITEMS}>
              {item => (
                <a
                  href={item.href}
                  class="h-9 px-150 inline-flex items-center rounded-100 text-75 font-600 text-muted hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  {item.label}
                </a>
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
              onClick={() => document.querySelector("#agent")?.scrollIntoView({ behavior: "smooth" })}
              class="hidden sm:inline-flex h-9 px-150 items-center gap-100 rounded-100 bg-accent-fill text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer"
            >
              <Bot size={16} />
              Ask AI
            </button>
            <button
              type="button"
              class="relative grid place-items-center w-9 h-9 rounded-100 text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span class="absolute right-[7px] top-[7px] w-1.5 h-1.5 rounded-full bg-neg" />
            </button>
            <div class="hidden 2xl:block"><ThemeToggle /></div>
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
          <nav class="lg:hidden px-200 pb-200 grid grid-cols-2 gap-100 border-t border-line bg-bg-2" aria-label="Mobile dashboard sections">
            <For each={NAV_ITEMS}>
              {item => (
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  class="mt-150 h-10 px-150 flex items-center gap-100 rounded-100 bg-surface-2 text-75 font-600 text-ink"
                >
                  <item.icon size={16} class="text-accent" />
                  {item.label}
                </a>
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
    </>
  );
}
