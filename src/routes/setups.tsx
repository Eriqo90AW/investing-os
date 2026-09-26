import { createSignal } from "solid-js";
import { Title, Meta } from "@solidjs/meta";
import { Plus, Target } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { SetupList } from "~/components/setups/SetupList";
import { SetupFormModal } from "~/components/setups/SetupFormModal";
import { getSetup, initSetupsStore, type StoredSetup } from "~/lib/setups-store";
import { dashboardData } from "~/lib/dashboard-data";
import { initTheme } from "~/lib/theme";
import { initPalette } from "~/lib/palette";
import { initAccent } from "~/lib/accent";

export default function SetupsPage() {
  initTheme();
  initPalette();
  initAccent();
  initSetupsStore();

  const [modalOpen, setModalOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<StoredSetup | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (id: string) => {
    setEditing(getSetup(id) ?? null);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <Title>Investing OS | Setup workspace</Title>
      <Meta
        name="description"
        content="Create, edit and track investment setups across US stocks, crypto and IHSG."
      />

      <AppNavbar />
      <MarketPulseStrip markets={dashboardData.markets} />

      <main class="mx-auto max-w-[1440px] px-200 pb-800">
        <section class="pt-500">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-250">
            <div>
              <div class="flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent">
                <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-official-bg text-official">
                  <Target size={11} /> Setup workspace
                </span>
              </div>
              <h1 class="mt-150 text-800 font-700 leading-[120%] tracking-[-.025em] text-ink">
                Setups
              </h1>
              <p class="mt-100 max-w-[68ch] text-100 text-muted">
                Draft with the agent, then take the pen: thesis, levels, invalidation and the
                chart behind every trade across US stocks, crypto and IHSG.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-100">
              <button
                type="button"
                onClick={openCreate}
                class="h-9 px-150 inline-flex items-center gap-100 rounded-100 bg-accent-fill text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer"
              >
                <Plus size={16} /> New setup
              </button>
            </div>
          </div>
        </section>

        <div class="mt-300">
          <SetupList onEdit={openEdit} onOpen={id => { window.location.href = `/setup/${id}`; }} />
        </div>
      </main>

      <footer class="border-t border-line bg-bg-2">
        <div class="mx-auto max-w-[1440px] px-200 py-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-100 text-50 text-caption">
          <span>Investing OS setup workspace</span>
          <span>All values are deterministic mock data. No live market feed is connected.</span>
        </div>
      </footer>

      <SetupFormModal open={modalOpen()} initial={editing()} onClose={closeModal} />
    </>
  );
}
