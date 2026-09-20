// Probe 2: why don't initTheme/initPalette/initAccent stamp on fresh load?
const CHROME = "C:\\Users\\eriqo\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe";
const { spawn } = await import("node:child_process");
const { once } = await import("node:events");

const proc = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=9335",
  "--no-first-run",
  "--user-data-dir=" + process.env.TEMP + "\\accent-probe2-profile",
  "about:blank",
], { stdio: "ignore" });

const wait = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) {
  await wait(250);
  try {
    targets = await (await fetch("http://127.0.0.1:9335/json/list")).json();
    break;
  } catch {}
}
const page = targets.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await once(ws, "open");

let id = 0;
const pending = new Map();
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
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
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");
const logs = [];
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.type + ": " + (m.params.args || []).map(a => a.value ?? a.description ?? "").join(" "));
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === "Log.entryAdded") logs.push("LOG-" + m.params.entry.level + ": " + m.params.entry.text);
});

await send("Page.navigate", { url: "http://localhost:5183/" });
await wait(10000);

const state = await evaljs(`(() => {
  const r = document.documentElement;
  return {
    dataTheme: r.getAttribute("data-theme"),
    DAY: r.classList.contains("DAY"),
    dataPalette: r.getAttribute("data-palette"),
    dataAccent: r.getAttribute("data-accent"),
    storedAccent: localStorage.getItem("ios-accent"),
    storedPalette: localStorage.getItem("ios-palette"),
    storedTheme: localStorage.getItem("ios-theme"),
    bodyChildren: document.body.children.length,
    rootContentLen: (document.getElementById("root")?.innerHTML ?? "").length,
  };
})()`);
console.log("state       :", state);
console.log("console logs:", logs.slice(0, 30));

ws.close();
proc.kill();
process.exit(0);
