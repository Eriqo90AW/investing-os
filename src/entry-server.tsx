// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

/**
 * Applied before hydration so a viewer who picked a theme never sees the other
 * one flash first. Mirrors the three-state resolution in styles/tokens.css.
 * Also stamps the saved style (palette), falling back to rustic — the
 * absolute first-load default alongside auto mode and the shared lime accent
 * (which needs no stamp; it is the stylesheet default).
 */
const THEME_BOOT = `(function(){try{var m=localStorage.getItem("ios-theme")||"system";var r=document.documentElement;r.classList.remove("NIGHT","DAY");if(m==="dark"){r.setAttribute("data-theme","dark");r.classList.add("NIGHT")}else if(m==="light"){r.setAttribute("data-theme","light");r.classList.add("DAY")}else{r.removeAttribute("data-theme")}var p=localStorage.getItem("ios-palette")||"rustic";if(p==="base"){r.removeAttribute("data-palette")}else if(p==="rustic"||p==="midnight"){r.setAttribute("data-palette",p)}else{r.setAttribute("data-palette","rustic")}}catch(e){}})()`;

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" data-palette="rustic">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap"
          />
          <link
            rel="icon"
            href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2399E50B'/%3E%3Cpath d='M7 21l5-6 4 3 4-7 5 5' stroke='%2314161F' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
          />
          {assets}
        </head>
        <body>
          <script>{THEME_BOOT}</script>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
