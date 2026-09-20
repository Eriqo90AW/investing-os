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
    }),
  ],
});
