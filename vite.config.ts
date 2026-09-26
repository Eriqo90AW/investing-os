import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

const STATIC_EXPORT = process.env.IOS_STATIC === "1";

export default defineConfig({
  // A static export is served from a subpath (or straight off disk), so every
  // asset URL has to be relative. The default build stays on an absolute base.
  base: STATIC_EXPORT ? "./" : "/",
  plugins: [
    tailwindcss(),
    solidStart({
      // SSR by default: it gives the design-system page a real first frame
      // before Lightweight Charts hydrates the canvases on the client.
      //
      // `pnpm build:static` keeps SSR on but switches to a relative asset
      // base, so the rendered HTML can be snapshotted and hosted as flat files.
      ssr: true,
      // SolidStart 2.0.5's dev error viewer imports the browser UMD build of
      // @jridgewell/resolve-uri as a default export. Vite 8 serves that build
      // without a default, so the toolbar crashes before the app mounts.
      // Keep the app's own error handling and disable only the dev overlay.
      devOverlay: false,
      solid: {
        // SolidStart compiles .js files with Babel, and by default that
        // includes Vite's prebundled dep cache (node_modules/.vite/deps) —
        // already-compiled bundles with no JSX in them. lightweight-charts
        // prebundles to >500KB, so Babel re-parsing it on every cold load
        // prints "The code generator has deoptimised the styling of ..."
        // Skip the cache. Real Solid libs (lucide-solid, @solidjs/*) ship
        // JSX but are served from source, not from this cache, so they are
        // unaffected.
        exclude: ["**/node_modules/.vite/**"],
      },
    }),
  ],
});
