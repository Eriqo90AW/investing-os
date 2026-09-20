import { createSignal } from "solid-js";

/**
 * Global settings-modal state, shared by the navbar gear and the agent
 * panel's "Connect key" affordance (which lives outside AppNavbar).
 * The modal itself renders once from the app root (app.tsx).
 */

const [settingsOpen, setSettingsOpen] = createSignal(false);

export const settingsOpenSignal = settingsOpen;

export function openSettings(): void {
  setSettingsOpen(true);
}

export function closeSettings(): void {
  setSettingsOpen(false);
}