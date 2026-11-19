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
const MOTION_OK = { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }; // do not inherit the OS setting
await send("Emulation.setEmulatedMedia", MOTION_OK);
await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 780, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: URL });
await sleep(2000);

const c = await ev(`fetch("content.json").then(r => r.json())`);
const $text = (id) => ev(`document.getElementById(${JSON.stringify(id)}).textContent`);
const state = () => ev("document.body.dataset.state");
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 200) { if (await ev(expr)) return true; await sleep(200); } return false; };

// ---- static render ----
check("brand + title", (await $text("brand")) === c.brand && (await ev("document.title")) === c.brand);
check("menu has 8 topic buttons (1-7,0)", (await ev(`[...document.querySelectorAll("#menu li > button")].map(b=>b.dataset.key).join("")`)) === "12345670");
check("keypad 12 keys in phone order", (await ev(`[...document.querySelectorAll("#keypad [data-key]")].map(b=>b.dataset.key).join("")`)) === "123456789*0#");
check("keys show short labels", (await ev(`[...document.querySelectorAll("#keypad [data-key]")].map(b=>b.querySelector(".short").textContent).join("|")`)) ===
  [..."123456789*0#"].map((k) => c.options[k]?.short || "").join("|"));
check("keys have aria-label", await ev(`[...document.querySelectorAll("#keypad button")].every(b => b.getAttribute("aria-label")?.startsWith("Phím "))`));
check("no phone numbers on page", (await ev(`document.querySelectorAll('a[href^="tel:"]').length`)) === 0 && !/\b1[01]\d\b|\d{3}\s?\d{3}\s?\d{4}/.test(await ev("document.body.innerText")));
check("screen aria-live polite", (await ev(`document.getElementById("screen").getAttribute("aria-live")`)) === "polite");
const keyH = await ev(`Math.min(...[...document.querySelectorAll("#keypad button, #call, #end, #menu button")].map(b => Math.min(b.offsetWidth, b.offsetHeight)))`);
check("touch targets >= 48px", keyH >= 48, `min side ${keyH}px`);
check("no horizontal scroll at 360px", await ev(`document.documentElement.scrollWidth <= innerWidth`), await ev(`document.documentElement.scrollWidth + " vs " + innerWidth`));
check("no external resources", await ev(`performance.getEntriesByType("resource").every(e => e.name.startsWith(location.origin))`));
check("idle: end button disabled, timer 00:00", (await ev(`document.getElementById("end").disabled`)) && (await $text("timer")) === "00:00");
check("entrance finished (.ready)", await waitFor(`document.body.classList.contains("ready")`, 4000));
await shot("light-360.png");

// ---- every key via real keyboard events: caption, mp3, call-card state ----
for (const k of "12345670") {
  await key(k); await sleep(1500);
  const s = await ev(`({ text: document.getElementById("screen").textContent, src: audio.src, t: audio.currentTime, err: !!audio.error })`);
  const msgs = c.options[k].messages.map((m) => m.replaceAll("{brand}", c.brand));
  const idx = msgs.findIndex((m) => s.text.startsWith(m));
  check(`key ${k}: caption + mp3 plays`, idx >= 0 && s.src.endsWith(`/audio/${k}/${idx + 1}.mp3`) && s.t > 0 && !s.err, `${s.src.split("/audio/")[1]} t=${s.t.toFixed(2)}`);
}
check("key 0 shows donate info", (await $text("screen")).includes(c.options["0"].info));
await key("6"); await sleep(1300);
check("playing: status + topic + timer running", (await state()) === "playing" && (await $text("status")) === "Đang nghe · Phím 6" &&
  (await $text("topic")) === c.options["6"].label && (await $text("timer")) !== "00:00", `${await $text("status")} | ${await $text("timer")}`);
check("playing: key 6 + its topic row highlighted", (await ev(`[...document.querySelectorAll("[data-key].active")].map(b=>b.dataset.key).join()`)) === "6,6");
check("playing: end button enabled", !(await ev(`document.getElementById("end").disabled`)));
await shot("playing-360.png");

check("audio finishes -> state ended", await waitFor(`document.body.dataset.state === "ended"`, 10000), await state());
check("ended: highlight cleared, timer frozen", (await ev(`document.querySelectorAll("[data-key].active").length`)) === 0 &&
  await (async () => { const a = await $text("timer"); await sleep(1200); return a === (await $text("timer")); })());

// ---- end button ----
await key("1"); await sleep(600);
await ev(`document.getElementById("end").click()`); await sleep(200);
check("end button stops audio -> ended", (await ev("audio.paused")) && (await state()) === "ended" && (await ev(`document.getElementById("end").disabled`)));

// ---- topic list is clickable ----
await ev(`document.querySelector('#menu [data-key="7"]').click()`); await sleep(1200);
check("topic row plays its key", await ev(`audio.src.includes("/audio/7/") && audio.currentTime > 0`));

// ---- no immediate repeat ----
let rep = 0; let prev = null;
for (let i = 0; i < 10; i++) { await key("3"); await sleep(50); const t = await $text("screen"); if (t === prev) rep++; prev = t; }
check("same key twice never repeats", rep === 0, `${rep} repeats in 10 presses`);

for (const k of "89*#") { await key(k); await sleep(50); }
check("empty keys show hint, state idle", (await $text("screen")).startsWith("Phím này chưa có nội dung") && (await state()) === "idle");
check("empty key gets shake class", await ev(`document.querySelector('#keypad [data-key="#"]').classList.contains("nope")`));

// ---- call button ----
await ev(`document.getElementById("call").click()`); await sleep(1500);
check("call plays greeting, status Lời chào", (await ev(`audio.src.endsWith("/audio/greeting.mp3") && audio.currentTime > 0`)) && (await $text("status")) === "Lời chào");

// ---- fallback: missing mp3 -> speak() ----
await ev(`window.__spoken = null; window.speak = (t, l) => { window.__spoken = t + "|" + l; }; play("audio/missing.mp3", "thử dự phòng", "vi-VN"); 1`);
await sleep(1000);
check("missing mp3 falls back to TTS", (await ev("window.__spoken")) === "thử dự phòng|vi-VN");

// ---- animations actually attached (motion allowed) ----
await key("2"); await sleep(400);
check("motion: waveform, rings, mouth animate while playing", await ev(`!reduce.matches && getComputedStyle(document.querySelector(".wave i")).animationName === "bar" &&
  getComputedStyle(document.querySelector(".ring")).animationName === "ring" &&
  getComputedStyle(document.querySelector(".sun .mouth")).animationName === "talk"`));
check("motion: burst particles spawned", (await ev(`document.querySelectorAll("#fx .particle").length`)) > 0 ||
  await (async () => { await key("4"); return (await ev(`document.querySelectorAll("#fx .particle").length`)) > 0; })());

// ---- reduced motion turns everything off ----
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await sleep(900);
await key("5"); await sleep(300);
check("reduced motion: no animations, no particles", await ev(`getComputedStyle(document.querySelector(".wave i")).animationName === "none" &&
  getComputedStyle(document.querySelector(".mascot")).animationName === "none" && document.querySelectorAll("#fx .particle").length === 0`));
check("reduced motion: state colours still shown", (await state()) === "playing" && (await ev(`document.querySelector('#keypad [data-key="5"]').classList.contains("active")`)));
await ev(`document.getElementById("end").click()`);
await send("Emulation.setEmulatedMedia", MOTION_OK);

// ---- PWA + QR + size ----
check("manifest + icons served", await ev(`(async () => {
  const m = await (await fetch(document.querySelector('link[rel=manifest]').href)).json();
  const ok = await Promise.all(m.icons.map(i => fetch(i.src).then(r => r.ok)));
  return m.display === "standalone" && m.icons.length >= 2 && ok.every(Boolean) && (await fetch("icons/apple-touch-icon.png")).ok;
})()`));
check("service worker active", await ev(`Promise.race([navigator.serviceWorker.ready.then(r => !!r.active && r.active.scriptURL.endsWith("sw.js")), new Promise(r => setTimeout(() => r(false), 8000))])`));
check("poster page + qr.svg served", await ev(`(async () => (await fetch("poster.html")).ok && (await (await fetch("qr.svg")).text()).includes("<svg"))()`));
const kb = await ev(`Promise.all(["index.html","style.css","app.js"].map(f => fetch(f).then(r => r.text()).then(t => new Blob([t]).size))).then(a => a.reduce((x, y) => x + y) / 1024)`);
check("html+css+js < 60KB", kb < 60, `${kb.toFixed(1)}KB`);

// ---- dark mode ----
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, ...MOTION_OK.features] });
await sleep(300);
check("dark mode changes background", (await ev(`getComputedStyle(document.body).backgroundColor`)) === "rgb(20, 22, 27)");
await shot("dark-360.png");
await send("Emulation.setEmulatedMedia", MOTION_OK);

// ---- desktop: phone frame + QR sticker ----
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(500);
check("desktop: QR sticker visible", await ev(`(() => { const i = document.querySelector(".sticker img"); return i.offsetWidth > 100 && i.complete && i.naturalWidth > 0; })()`));
check("desktop: no horizontal scroll", await ev(`document.documentElement.scrollWidth <= innerWidth`));
await shot("desktop-1280.png");

check("no console errors / exceptions", errors.filter((e) => !e.includes("missing.mp3") && !e.includes("ERR_ABORTED")).length === 0, errors.join(" | "));

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
ws.close(); killChrome();
process.exit(results.every((r) => r.ok) ? 0 : 1);
