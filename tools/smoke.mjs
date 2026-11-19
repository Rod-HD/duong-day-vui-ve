// Headless smoke test for the web hotline via raw Chrome DevTools Protocol (no deps).
// Run: start `.venv\Scripts\python -m http.server 8000 -d web`, then
//   D:\Programs\nodejs\node.exe tools\smoke.mjs [url] [screenshot dir]
// Needs the Playwright Chromium already on this machine (CHROME below).
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "D:\\Programs\\ms-playwright\\chromium-1148\\chrome-win\\chrome.exe";
const URL = process.argv[2] || "http://127.0.0.1:8000/";
const OUT = process.argv[3] || ".";
const PROFILE = mkdtempSync(join(tmpdir(), "smoke-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Port 0 = Chrome picks a free port and writes it to DevToolsActivePort (no clash with stale runs).
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${PROFILE}`,
  "--autoplay-policy=no-user-gesture-required", "--mute-audio", "--no-first-run", "about:blank",
], { stdio: "ignore" });
const killChrome = () => { try { execSync(`taskkill /pid ${chrome.pid} /T /F`, { stdio: "ignore" }); } catch {} };

let page;
for (let i = 0; i < 75 && !page; i++) {
  await sleep(200);
  try {
    const port = readFileSync(join(PROFILE, "DevToolsActivePort"), "utf8").split("\n")[0];
    page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
  } catch {}
}
if (!page) { killChrome(); throw new Error("Chromium did not start: " + CHROME); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push(JSON.stringify(msg.params.args));
  if (msg.method === "Network.loadingFailed") errors.push("netfail " + msg.params.errorText);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(expr + " -> " + r.result.exceptionDetails.exception?.description); return r.result.result.value; };
const key = async (k) => { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, text: type === "keyDown" ? k : undefined }); };
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, "base64")); };

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); };

await send("Runtime.enable"); await send("Page.enable"); await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 780, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: URL });
await sleep(2000);

const c = await ev(`fetch("content.json").then(r => r.json())`);
check("brand + title", (await ev(`document.getElementById("brand").textContent`)) === c.brand && (await ev("document.title")) === c.brand);
check("menu has 8 items (1-7,0)", (await ev(`document.querySelectorAll("#menu li").length`)) === 8);
check("keypad 12 buttons", (await ev(`[...document.querySelectorAll("#keypad button")].map(b=>b.textContent).join("")`)) === "123456789*0#");
check("keys have aria-label", await ev(`[...document.querySelectorAll("#keypad button")].every(b => b.getAttribute("aria-label")?.startsWith("Phím "))`));
check("no phone numbers on page", (await ev(`document.querySelectorAll('a[href^="tel:"]').length`)) === 0 && !/\b1[01]\d\b|\d{3}\s?\d{3}\s?\d{4}/.test(await ev("document.body.innerText")));
check("screen aria-live polite", (await ev(`document.getElementById("screen").getAttribute("aria-live")`)) === "polite");
const keyH = await ev(`Math.min(...[...document.querySelectorAll("#keypad button")].map(b => Math.min(b.offsetWidth, b.offsetHeight)))`);
check("touch target >= 48px", keyH >= 48, `min side ${keyH}px`);
check("no horizontal scroll at 360px", await ev(`document.documentElement.scrollWidth <= innerWidth`), await ev(`document.documentElement.scrollWidth + " vs " + innerWidth`));
check("no external resources", await ev(`performance.getEntriesByType("resource").every(e => e.name.startsWith(location.origin))`));
await shot("light-360.png");

// Each key via real keyboard events: caption is one of its messages and its mp3 actually plays.
for (const k of "12345670") {
  await key(k); await sleep(1500);
  const s = await ev(`({ text: document.getElementById("screen").textContent, src: audio.src, t: audio.currentTime, err: !!audio.error })`);
  const msgs = c.options[k].messages.map((m) => m.replaceAll("{brand}", c.brand));
  const idx = msgs.findIndex((m) => s.text.startsWith(m));
  check(`key ${k}: caption + mp3 plays`, idx >= 0 && s.src.endsWith(`/audio/${k}/${idx + 1}.mp3`) && s.t > 0 && !s.err, `${s.src.split("/audio/")[1]} t=${s.t.toFixed(2)}`);
}
check("key 0 shows donate info", (await ev(`document.getElementById("screen").textContent`)).includes(c.options["0"].info));

// No immediate repeat on the same key.
let rep = 0; let prev = null;
for (let i = 0; i < 10; i++) { await key("3"); await sleep(50); const t = await ev(`document.getElementById("screen").textContent`); if (t === prev) rep++; prev = t; }
check("same key twice never repeats", rep === 0, `${rep} repeats in 10 presses`);

for (const k of "89*#") { await key(k); await sleep(50); }
check("empty keys show hint", (await ev(`document.getElementById("screen").textContent`)).startsWith("Phím này chưa có nội dung"));

await ev(`document.getElementById("call").click()`); await sleep(1500);
check("call plays greeting", await ev(`audio.src.endsWith("/audio/greeting.mp3") && audio.currentTime > 0`));

// Fallback: missing mp3 -> speak() is called with the text.
await ev(`window.__spoken = null; window.speak = (t, l) => { window.__spoken = t + "|" + l; }; play("audio/missing.mp3", "thử dự phòng", "vi-VN"); 1`);
await sleep(1000);
check("missing mp3 falls back to TTS", (await ev("window.__spoken")) === "thử dự phòng|vi-VN");

await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await sleep(300);
check("dark mode changes background", (await ev(`getComputedStyle(document.body).backgroundColor`)) === "rgb(23, 18, 29)");
await shot("dark-360.png");

check("no console errors / exceptions", errors.filter((e) => !e.includes("missing.mp3") && !e.includes("ERR_ABORTED")).length === 0, errors.join(" | "));

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
ws.close(); killChrome();
process.exit(results.every((r) => r.ok) ? 0 : 1);
