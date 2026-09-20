/**
 * Snapshot the rendered design-system page into a flat, self-contained bundle.
 *
 *   pnpm build:static     # SSR build with a relative asset base
 *   pnpm preview          # serve it
 *   node scripts/export-artifact.mjs http://localhost:5182 [/design]
 *
 * Output lands in dist/artifact/: an index.html plus the app's own asset chunks,
 * re-rooted from `_build/` to `build/` because some static hosts reserve names
 * beginning with an underscore. Chunks only import siblings by bare filename,
 * so renaming the directory needs no rewriting inside the JS itself.
 *
 * The HTML is stripped of its <html>/<head>/<body> wrapper so it can also be
 * dropped into a host that supplies its own document shell.
 */

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const origin = process.argv[2] ?? "http://localhost:5182";
/** The spec page is the app's only real route; `/` merely redirects to it. */
const page = process.argv[3] ?? "/design";
const root = path.resolve(import.meta.dirname, "..");
const clientDir = path.join(root, "dist", "client");
const outDir = path.join(root, "dist", "artifact");

if (!existsSync(path.join(clientDir, "_build"))) {
  console.error("dist/client/_build is missing — run `pnpm build:static` first.");
  process.exit(1);
}

const res = await fetch(origin + page);
if (!res.ok) {
  console.error(`GET ${origin}${page} returned ${res.status}. Is the preview server running?`);
  process.exit(1);
}
const html = await res.text();

const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!headMatch || !bodyMatch) {
  console.error("Could not find <head> and <body> in the rendered page.");
  process.exit(1);
}

// The host shell supplies charset and viewport; keep everything else verbatim.
const head = headMatch[1]
  .replace(/<meta\s+charset=[^>]*>/gi, "")
  .replace(/<meta\s+name=["']viewport["'][^>]*>/gi, "")
  .trim();

const body = bodyMatch[1].trim();

/** `_build` -> `build`, in the HTML only; chunk-to-chunk imports are relative. */
const rebase = (s) => s.replaceAll("_build/", "build/");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(path.join(clientDir, "_build"), path.join(outDir, "build"), { recursive: true });
await writeFile(path.join(outDir, "index.html"), `${rebase(head)}\n${rebase(body)}\n`, "utf8");

const source = await readFile(path.join(outDir, "index.html"), "utf8");
const absolute = source.match(/(?:src|href)="\/[^"]*"/g) ?? [];
if (absolute.length) {
  console.warn(`Warning: ${absolute.length} absolute asset URL(s) remain:`, absolute.slice(0, 5));
}

console.log(`Wrote ${path.relative(root, outDir)}/index.html (${(source.length / 1024).toFixed(1)} kB)`);
