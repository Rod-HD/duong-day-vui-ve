// Web hotline: keypad -> random message -> mp3, falling back to browser TTS, then caption only.
const KEYS = "123456789*0#";
const MENU_ORDER = "1234567890";
const $ = (id) => document.getElementById(id);
let content;
let audio;
const last = {};

const fill = (s) => s.replaceAll("{brand}", content.brand);
const say = (text) => { $("screen").textContent = text; };

function pick(n, prev) {
  if (n < 2) return 0;
  let i;
  do i = Math.floor(Math.random() * n); while (i === prev);
  return i;
}

function stop() {
  if (audio) { audio.onerror = null; audio.pause(); }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return; // caption already shown (Req 3.3)
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  speechSynthesis.speak(u);
}

function play(src, text, lang, caption = text) {
  stop();
  say(caption);
  audio = new Audio(src);
  audio.onerror = () => speak(text, lang); // missing/broken mp3 (Req 3.2)
  audio.play().catch(() => {}); // load errors are handled by onerror
}

function press(key) {
  const opt = content?.options[key];
  if (!opt) {
    stop();
    say("Phím này chưa có nội dung, mời bạn chọn phím khác.");
    return;
  }
  const i = pick(opt.messages.length, last[key]);
  last[key] = i;
  const text = fill(opt.messages[i]);
  play(`audio/${key}/${i + 1}.mp3`, text, opt.lang || content.lang, opt.info ? `${text}\n\n${opt.info}` : text);
}

function el(tag, text, props = {}) {
  const e = Object.assign(document.createElement(tag), props);
  if (text) e.textContent = text;
  return e;
}

function render() {
  $("brand").textContent = content.brand;
  document.title = content.brand;

  for (const k of MENU_ORDER) {
    const opt = content.options[k];
    if (!opt) continue;
    const li = el("li");
    li.append(el("b", k), ` ${opt.label}`);
    $("menu").append(li);
  }

  for (const k of KEYS) {
    const opt = content.options[k];
    const b = el("button", k, { type: "button" });
    b.setAttribute("aria-label", `Phím ${k}: ${opt ? opt.label : "chưa có nội dung"}`);
    b.addEventListener("click", () => press(k));
    $("keypad").append(b);
  }

  $("call").addEventListener("click", () => play("audio/greeting.mp3", fill(content.greeting), content.lang));
  document.addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (KEYS.includes(e.key)) press(e.key);
  });
}

async function init() {
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
