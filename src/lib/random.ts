/**
 * mulberry32 — small, fast, fully deterministic PRNG, shared by every fixture
 * module. A Math.random() series would mismatch on hydration and flicker; the
 * seeded stream produces byte-identical numbers on the server and the client.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit string hash — seeds derived from user text (prompts, tickers). */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pick a value without tripping `noUncheckedIndexedAccess`. */
export function pick<T>(rand: () => number, list: readonly T[]): T {
  const index = Math.floor(rand() * list.length) % list.length;
  const value = list[index];
  if (value === undefined) throw new Error("pick() on an empty list");
  return value;
}

/** A float in [min, max). */
export function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}
