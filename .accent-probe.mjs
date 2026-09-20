// Repro: pick an accent, switch palettes, hard-reload — read computed tokens.
const CHROME = "C:\\Users\\eriqo\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe";
const { spawn, execFile } = await import("node:child_process");
const { once } = await import("node:events");

const proc = spawn(CHROME, [
  "--headless",
  "--remote-debugging-port=9336",
  "--no-first-run",
  "--user-data-dir=" + process.env.TEMP + "\\accent-probe-profile",
  "about:blank",
], { stdio: "ignore" });

const wait = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
  await wait(250);
  try {
    const res = await fetch("http://127.0.0.1:9336/json/list");
    targets = await res.json();
    if (targets) break;
  } catch {}
}
let page = targets.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await once(ws, "open");

let id = 0;
const pending = new Map();
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
function send(method, params = {}) {
  return new Promise(resolve => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}
async function evaljs(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails, null, 2));
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:5183/" });
await wait(9000);

const readTok = `(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    accentFill: cs.getPropertyValue("--c-color-accent-fill").trim(),
    accent: cs.getPropertyValue("--c-color-accent").trim(),
    brand500: cs.getPropertyValue("--c-color-brand-500").trim(),
    dataAccent: document.documentElement.getAttribute("data-accent"),
    dataPalette: document.documentElement.getAttribute("data-palette"),
    stored: localStorage.getItem("ios-accent"),
  };
})()`;

const greet = await evaljs(readTok);
console.log("fresh load              :", greet);

// Pick an accent through the real module.
await evaljs(`(async () => {
  const m = await import("/src/lib/accent.ts");
  m.setAccentHex("#3861fb");
})()`);
console.log("after pick #3861fb      :", await evaljs(readTok));

// Switch through the real palette module.
await evaljs(`(async () => {
  const m = await import("/src/lib/palette.ts");
  m.setPalette("midnight");
})()`);
console.log("palette=midnight        :", await evaljs(readTok));

await evaljs(`(async () => {
  const m = await import("/src/lib/palette.ts");
  m.setPalette("base");
})()`);
console.log("palette=base            :", await evaljs(readTok));

await evaljs(`(async () => {
  const m = await import("/src/lib/palette.ts");
  m.setPalette("rustic");
})()`);
console.log("palette=rustic          :", await evaljs(readTok));

// Hard reload: hydration path must restore the accent.
await send("Page.navigate", { url: "http://localhost:5183/" });
await wait(9000);
console.log("after hard reload       :", await evaljs(readTok));

ws.close();
proc.kill();
console.log("DONE");
process.exit(0);
