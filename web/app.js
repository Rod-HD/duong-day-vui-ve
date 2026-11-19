// Web hotline: keypad -> random message -> mp3, falling back to browser TTS, then caption only.
// Call card state machine: idle -> playing -> ended (drives every animation through body[data-state]).
const KEYS = "123456789*0#";
const MENU_ORDER = "1234567890";
const SHAPES = ["★", "♥", "✦", "●", "♥", "★", "✿", "✦"];
const $ = (id) => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let content;
let audio;
let playId = 0; // bumps on every stop(); stale onend/onerror callbacks compare against it
let raf = 0;
let fallbackTimer = 0;
const last = {};

const fill = (s) => s.replaceAll("{brand}", content.brand);

function el(tag, text, props = {}) {
  const e = Object.assign(document.createElement(tag), props);
  if (text) e.textContent = text;
  return e;
}

// Remove + re-add a class so its CSS animation plays again.
function restart(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function say(text) {
  const s = $("screen");
  s.textContent = text;
  s.classList.toggle("long", text.length > 140);
  restart(s, "rise");
}

function pick(n, prev) {
  if (n < 2) return 0;
  let i;
  do i = Math.floor(Math.random() * n); while (i === prev);
  return i;
}

const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function setStatus(text) {
  $("status").textContent = text;
  restart($("status"), "flip");
}

function setState(state, key = null, status = "", topic = "") {
  document.body.dataset.state = state;
  for (const b of document.querySelectorAll("[data-key]")) b.classList.toggle("active", state === "playing" && b.dataset.key === key);
  setStatus(status || { idle: "Sẵn sàng", ended: "Đã kết thúc" }[state] || "");
  $("topic").textContent = topic;
  $("end").disabled = state !== "playing";
  cancelAnimationFrame(raf);
  if (state === "playing") {
    const t0 = performance.now();
    const tick = () => { $("timer").textContent = fmt(performance.now() - t0); raf = requestAnimationFrame(tick); };
    tick();
  } else if (state === "idle") {
    $("timer").textContent = "00:00";
  }
}

function stop() {
  playId++;
  clearTimeout(fallbackTimer);
  if (audio) { audio.onerror = audio.onended = null; audio.pause(); }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

function speak(text, lang, done = () => {}) {
  if (!("speechSynthesis" in window)) { fallbackTimer = setTimeout(done, 3000); return; } // caption only (Req 3.3)
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.onend = u.onerror = done;
  speechSynthesis.speak(u);
}

function play(src, text, lang, caption = text, key = null, status = "Đang phát", topic = "") {
  stop();
  const id = playId;
  const done = () => { if (id === playId) setState("ended"); };
  say(caption);
  setState("playing", key, status, topic);
  audio = new Audio(src);
  audio.onended = done;
  audio.onerror = () => speak(text, lang, done); // missing/broken mp3 (Req 3.2)
  audio.play().catch(() => {}); // load errors are handled by onerror
}

// ---- micro-interactions ----
function burst(btn) {
  if (reduce.matches || !btn) return;
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < SHAPES.length; i++) {
    const a = (i / SHAPES.length) * Math.PI * 2 + Math.random() * 0.5;
    const d = 46 + Math.random() * 30;
    const p = el("span", SHAPES[i], { className: `particle c${i % 3}` });
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;` +
      `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;--r:${Math.round(Math.random() * 180 - 90)}deg`;
    // Timer, not animationend: if motion gets disabled mid-flight the animation is cancelled and never "ends".
    setTimeout(() => p.remove(), 800);
    $("fx").append(p);
  }
}

function ripple(e) {
  const btn = e.currentTarget;
  if (reduce.matches || btn.classList.contains("empty")) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.3;
  const s = el("span", "", { className: "ripple" });
  s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  setTimeout(() => s.remove(), 600);
  btn.append(s);
}

// Physical keyboard presses get the same "pushed in" look as a tap.
function flash(btn) {
  if (!btn) return;
  btn.classList.add("pressed");
  setTimeout(() => btn.classList.remove("pressed"), 140);
}

function press(key) {
  const btn = document.querySelector(`#keypad [data-key="${key}"]`);
  document.body.classList.add("touched");
  flash(btn);
  const opt = content?.options[key];
  if (!opt) {
    stop();
    setState("idle");
    say("Phím này chưa có nội dung, mời bạn chọn phím khác.");
    if (btn) restart(btn, "nope");
    return;
  }
  burst(btn);
  const i = pick(opt.messages.length, last[key]);
  last[key] = i;
  const text = fill(opt.messages[i]);
  play(`audio/${key}/${i + 1}.mp3`, text, opt.lang || content.lang,
    opt.info ? `${text}\n\n${opt.info}` : text, key, `Đang nghe · Phím ${key}`, opt.label);
}

function render() {
  $("brand").textContent = content.brand;
  document.title = content.brand;

  let n = 0;
  for (const k of MENU_ORDER) {
    const opt = content.options[k];
    if (!opt) continue;
    const b = el("button", "", { type: "button" });
    b.dataset.key = k;
    const now = el("span", "", { className: "now" });
    now.append(el("i"), el("i"), el("i"), "đang phát");
    b.append(el("span", k, { className: "num" }), el("span", opt.label, { className: "label" }), now);
    b.addEventListener("click", () => press(k));
    const li = el("li");
    li.style.setProperty("--i", n++);
    li.append(b);
    $("menu").append(li);
  }

  [...KEYS].forEach((k, i) => {
    const opt = content.options[k];
    const b = el("button", "", { type: "button", className: opt ? "key" : "key empty" });
    b.dataset.key = k;
    b.style.setProperty("--i", i);
    b.append(el("span", k, { className: "digit" }), el("span", opt?.short || "", { className: "short" }));
    b.setAttribute("aria-label", `Phím ${k}: ${opt ? opt.label : "chưa có nội dung"}`);
    b.addEventListener("pointerdown", ripple);
    b.addEventListener("click", () => press(k));
    $("keypad").append(b);
  });

  $("call").addEventListener("click", () => {
    document.body.classList.add("touched");
    play("audio/greeting.mp3", fill(content.greeting), content.lang, undefined, null, "Đang kết nối…", "Hướng dẫn bấm phím");
    const id = playId;
    setTimeout(() => { if (id === playId) setStatus("Lời chào"); }, 900);
  });
  $("end").addEventListener("click", () => {
    stop();
    setState("ended");
    say("Cảm ơn bạn đã gọi. Chúc bạn một ngày thật vui!");
  });
  document.addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (KEYS.includes(e.key)) press(e.key);
  });

  // Entrance animations run once; after this they are switched off so state changes never replay them.
  setTimeout(() => document.body.classList.add("ready"), 1800);
}

function setupApp() {
  let deferred = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    $("install").hidden = false;
  });
  $("install").addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    $("install").hidden = true;
  });
  addEventListener("appinstalled", () => { $("install").hidden = true; });
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) $("ios-hint").hidden = false;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

async function init() {
  setupApp();
  try {
    const res = await fetch("content.json");
    if (!res.ok) throw new Error(res.status);
    content = await res.json();
  } catch {
    say("Không tải được nội dung — hãy chạy qua http server.");
    return;
  }
  render();
}

init();
