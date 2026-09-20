// Probe 3: drive the real Settings modal UI.
const CHROME = "C:\\Users\\eriqo\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe";
const { spawn } = await import("node:child_process");
const { once } = await import("node:events");

const proc = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=9338", "--no-first-run",
  "--user-data-dir=" + process.env.TEMP + "\\accent-probe3-profile", "about:blank",
], { stdio: "ignore" });

const wait = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) {
  await wait(250);
  try { targets = await (await fetch("http://127.0.0.1:9338/json/list")).json(); break; } catch {}
}
const page = targets.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await once(ws, "open");
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
function send(method, params = {}) {
  return new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}
async function evaljs(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:5183/" });
await wait(9000);

// Open settings via the navbar gear button (aria-haspopup? title?). Find it.
const found = await evaljs(`(() => {
  const btns = [...document.querySelectorAll("button")].map(b => ({ t: b.getAttribute("aria-label"), title: b.title, cls: b.className.slice(0, 60), txt: b.textContent.trim().slice(0, 20) }));
  return btns.filter(b => /settings/i.test(b.t + " " + b.title + " " + b.txt));
})()`);
console.log("settings candidates:", found);

await evaljs(`(() => {
  const b = [...document.querySelectorAll("button")].find(b => /settings/i.test((b.getAttribute("aria-label") || "") + " " + (b.title || "")));
  b.click();
})()`);
await wait(800);

// Pick an accent via the modal's color input.
await evaljs(`(() => {
  const input = document.querySelector('[aria-labelledby="settings-accent"] input[type="color"], input.accent-swatch');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, "#3861fb");
  input.dispatchEvent(new Event("input", { bubbles: true }));
})()`);
await wait(500);

const readState = `(() => {
  const cs = getComputedStyle(document.documentElement);
  const input = document.querySelector('input.accent-swatch');
  const hexLine = [...document.querySelectorAll('[aria-labelledby="settings-accent"] p')].map(p => p.textContent.trim());
  return { accentFill: cs.getPropertyValue("--c-color-accent-fill").trim(), dataPalette: document.documentElement.getAttribute("data-palette"), stored: localStorage.getItem("ios-accent"), inputValue: input?.value, modalText: hexLine[0] };
})()`;
console.log("after pick       :", await evaljs(readState));

// Click the Midnight style radio in the modal.
await evaljs(`(() => {
  const mid = [...document.querySelectorAll('[role="radiogroup"][aria-label="Style"] [role="radio"]')].find(b => b.textContent.includes("Midnight"));
  mid.click();
})()`);
await wait(500);
console.log("click Midnight   :", await evaljs(readState));

// Click Lime.
await evaljs(`(() => {
  const b = [...document.querySelectorAll('[role="radiogroup"][aria-label="Style"] [role="radio"]')].find(b => b.textContent.includes("Lime"));
  b.click();
})()`);
await wait(500);
console.log("click Lime       :", await evaljs(readState));

// Rustic.
await evaljs(`(() => {
  const b = [...document.querySelectorAll('[role="radiogroup"][aria-label="Style"] [role="radio"]')].find(b => b.textContent.includes("Rustic"));
  b.click();
})()`);
await wait(500);
console.log("click Rustic     :", await evaljs(readState));

// Close and hard reload.
await send("Page.navigate", { url: "http://localhost:5183/" });
await wait(9000);
console.log("after reload     :", await evaljs(readState.replace('input?.value', "input?.value") ));

ws.close();
proc.kill();
process.exit(0);

