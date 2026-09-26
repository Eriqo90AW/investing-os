import type { StoredSetup } from "./setups-store";
import { replaceSetups, setups } from "./setups-store";
import type { TradeRecord } from "./investing-types";
import { replaceTrades, trades } from "./trades-store";

interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  setups: StoredSetup[];
  trades: TradeRecord[];
}

export function downloadBackup(): void {
  const payload: BackupFile = { schemaVersion: 1, exportedAt: new Date().toISOString(), setups: setups(), trades: trades() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `investing-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ setups: number; trades: number }> {
  const parsed: unknown = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== "object") throw new Error("This file is not an Investing OS backup.");
  const value = parsed as Record<string, unknown>;
  if (value.schemaVersion !== 1 || !Array.isArray(value.setups) || !Array.isArray(value.trades)) throw new Error("Unsupported backup schema.");
  const importedSetups = value.setups.filter(item => item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") as StoredSetup[];
  const importedTrades = value.trades.filter(item => item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") as TradeRecord[];
  replaceSetups(importedSetups);
  replaceTrades(importedTrades);
  return { setups: importedSetups.length, trades: importedTrades.length };
}
