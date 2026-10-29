import {
  ELEMENT_INFO, SLOT_INFO, fromJulianDay, ganjiOf, julianDay, recommend, relation, todayKST,
} from "./logic.js";

const MAX_REROLLS = 3;
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ───────── 저장소 (사생활 보호 모드 등에서 실패해도 앱은 동작) ─────────
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 무시 */ }
  },
};

// ───────── 상태 ─────────
let data;
let day = "today"; // "today" | "tomorrow"

const todayJDN = () => julianDay(todayKST());
const myElement = () => store.get("myElement", null);

/** 다시 뽑기 횟수는 날짜와 함께 저장 — 다시 열어도 하루 3회 유지, 자정이 지나면 초기화 */
function rerollCount() {
  const r = store.get("reroll", null);
  return r && r.day === todayJDN() ? Math.min(r.count, MAX_REROLLS) : 0;
}

// ───────── 오늘/내일 화면 ─────────
function renderToday({ animate = false } = {}) {
  const jdn = todayJDN() + (day === "tomorrow" ? 1 : 0);
  const ymd = fromJulianDay(jdn);
  const me = myElement();
  const used = rerollCount();
  const rec = recommend(data, ymd, { myElement: me, reroll: day === "today" ? used : 0 });

  $("#title").textContent = day === "today" ? "오늘의 컬러" : "내일의 컬러";
  const btn = $("#reroll");
  btn.disabled = day !== "today" || used >= MAX_REROLLS;
  btn.setAttribute("aria-label", `다시 뽑기, ${MAX_REROLLS - used}회 남음`);

  const weekday = "일월화수목금토"[(jdn + 1) % 7];
  const badge = day === "tomorrow"
    ? "👀 미리보기"
    : used < MAX_REROLLS ? `🎲 ${MAX_REROLLS - used}회 남음` : "🎲 오늘은 모두 사용";
  const reason = me
    ? `<p class="reason">🧭 내 기운 ${ELEMENT_INFO[me].korean} · ${relation(rec.ganji.element, me).summary} → ${ELEMENT_INFO[rec.lucky].energy} 컬러로 균형</p>`
    : "";
  const swatch = (c, label, size) => `
    <div class="swatch">
      <div style="width:${size}px;height:${size}px;background:${esc(c.hex)}"></div>
      ${label} · ${esc(c.name)}
    </div>`;

  const el = $("#today-content");
  el.innerHTML = `
    <div class="meta">
      <span>${ymd.m}월 ${ymd.d}일 (${weekday}) · ${rec.ganji.name}(${rec.ganji.hanja})일</span>
      <span>${badge}</span>
    </div>
    <p class="energy">${ELEMENT_INFO[rec.ganji.element].energy}의 기운이 흐르는 날</p>
    ${reason}
    <p class="message">${esc(rec.message)}</p>
    <p class="advice">💡 ${esc(rec.advice)}</p>

    <div class="card swatches">
      ${swatch(rec.mainColor, "메인", 96)}
      ${swatch(rec.accentColor, "포인트", 64)}
    </div>

    <div class="card">
      <h3>${day === "today" ? "오늘" : "내일"}의 코디</h3>
      ${rec.outfit.map((p) => `
        <div class="outfit-row">
          <span>${SLOT_INFO[p.slot].emoji}</span>
          <span class="slot">${SLOT_INFO[p.slot].korean}</span>
          <span class="dot" style="background:${esc(p.color.hex)}"></span>
          <span>${esc(p.color.name)} ${esc(p.item)}</span>
        </div>`).join("")}
    </div>

    <div class="card">
      <h3>럭키 팁</h3>
      <div class="tips">
        <span class="wide">⏰ ${esc(rec.tip.time)}</span>
        <span>🎁 ${esc(rec.tip.item)}</span>
        <span>📍 ${esc(rec.tip.place)}</span>
        <span>🎨 ${esc(rec.tip.color.name)}</span>
      </div>
    </div>`;

  if (animate) {
    el.classList.remove("flash");
    void el.offsetWidth; // 애니메이션 다시 시작
    el.classList.add("flash");
  }
}

// ───────── 설정 화면 ─────────
function renderSettings() {
  const me = myElement();
  $("#birthday").value = store.get("birthday", "1995-01-01");
  $("#mode-group").innerHTML = me
    ? `<div class="row"><span>내 오행</span><span class="value">${ELEMENT_INFO[me].korean} · ${ELEMENT_INFO[me].energy}의 기운</span></div>
       <button class="row danger" id="reset-mode">오늘의 기운 모드로 되돌리기</button>`
    : `<div class="row text">오늘의 기운 모드: 그날 일진의 오행에 맞춰 추천해요</div>`;
  $("#reset-mode")?.addEventListener("click", () => {
    store.set("myElement", null);
    renderSettings();
  });

  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  $("#install-hint").innerHTML = standalone
    ? "✅ 홈 화면 앱으로 실행 중이에요. 인터넷 없이도 열려요."
    : ios
      ? "Safari 주소창 옆 <b>☰ 메뉴</b>(또는 <b>공유 ⬆︎</b>) → <b>공유</b> → <b>더 보기</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요. 홈 화면에 추가해야 설정이 지워지지 않아요."
      : "브라우저 메뉴에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.";
}

/** 생년월일(기기에서 고른 달력 날짜 그대로) → 일진 천간 오행 */
function applyBirthday() {
  const v = $("#birthday").value;
  if (!v) return;
  const [y, m, d] = v.split("-").map(Number);
  store.set("birthday", v);
  store.set("myElement", ganjiOf({ y, m, d }).element);
  renderSettings();
}

// ───────── 이벤트 ─────────
function showTab(tab) {
  $("#view-today").hidden = tab !== "today";
  $("#view-settings").hidden = tab !== "settings";
  document.querySelectorAll(".tabbar button").forEach((b) => {
    b.toggleAttribute("aria-current", b.dataset.tab === tab);
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
  });
  if (tab === "today") renderToday();
  else renderSettings();
  scrollTo(0, 0);
}

function bindEvents() {
  document.querySelectorAll(".tabbar button").forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.tab)));

  document.querySelectorAll(".segmented button").forEach((b) =>
    b.addEventListener("click", () => {
      day = b.dataset.day;
      document.querySelectorAll(".segmented button").forEach((x) =>
        x.setAttribute("aria-selected", String(x === b)));
      renderToday({ animate: true });
    }));

  $("#reroll").addEventListener("click", () => {
    const used = rerollCount();
    if (day !== "today" || used >= MAX_REROLLS) return;
    store.set("reroll", { day: todayJDN(), count: used + 1 });
    navigator.vibrate?.(15); // 안드로이드 햅틱 (iOS Safari는 미지원)
    renderToday({ animate: true });
  });

  $("#calc").addEventListener("click", applyBirthday);
  // 이미 오행 모드라면 날짜를 바꾸는 즉시 다시 계산
  $("#birthday").addEventListener("change", () => {
    if (myElement()) applyBirthday();
    else store.set("birthday", $("#birthday").value);
  });

  // 앱을 켜 둔 채 자정이 지나거나, 다시 열었을 때 최신 날짜로
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !$("#view-today").hidden) renderToday();
  });
}

// ───────── 시작 ─────────
async function start() {
  data = await (await fetch("data/StyleData.json")).json();
  bindEvents();
  renderToday();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* 오프라인 기능만 빠짐 */ });
  }
}

start();
