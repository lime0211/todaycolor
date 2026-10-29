// 오늘컬러 추천 로직 — iOS DailyStyleKit(Swift)을 그대로 옮긴 것.
// 같은 날짜·같은 입력이면 iOS 앱과 똑같은 결과가 나오도록
// 난수(SplitMix64), 해시(FNV-1a), Swift의 shuffle/randomElement 알고리즘까지 맞췄다.
// 64비트 연산은 BigInt로 처리한다.

const MASK64 = (1n << 64n) - 1n;

// ───────── 오행 ─────────
export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
export const ELEMENT_INFO = {
  wood: { korean: "목(木)", energy: "나무" },
  fire: { korean: "화(火)", energy: "불" },
  earth: { korean: "토(土)", energy: "흙" },
  metal: { korean: "금(金)", energy: "쇠" },
  water: { korean: "수(水)", energy: "물" },
};
const idx = (e) => ELEMENTS.indexOf(e);
const at = (i) => ELEMENTS[((i % 5) + 5) % 5];
export const generates = (e) => at(idx(e) + 1); // 내가 생하는 오행
export const generatedBy = (e) => at(idx(e) + 4); // 나를 생하는 오행
export const controls = (e) => at(idx(e) + 2); // 내가 극하는 오행

/** 오늘(일진)과 나(일간)의 관계 → 설명과 보완 오행 */
export function relation(today, me) {
  if (today === me) return { summary: "같은 기운이 겹치는 날", balance: generates(me) };
  if (generates(today) === me) return { summary: "오늘 기운이 나를 도와주는 날", balance: me };
  if (generates(me) === today) return { summary: "내 기운이 많이 쓰이는 날", balance: generatedBy(me) };
  if (controls(me) === today) return { summary: "내가 오늘 기운을 다스리는 날", balance: me };
  return { summary: "오늘 기운에 눌리기 쉬운 날", balance: generatedBy(me) };
}

// ───────── 날짜 · 60갑자 ─────────
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 그레고리력 → 율리우스 적일 (하루에 1씩 증가하는 정수) */
export function julianDay({ y, m, d }) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** 율리우스 적일 → 그레고리력 */
export function fromJulianDay(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m + 2) / 5) + 1,
    m: m + 3 - 12 * Math.floor(m / 10),
    y: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** 한국 시간 기준 오늘 날짜 (기기 시간대와 무관하게 iOS 앱과 같은 날을 쓰기 위해) */
export function todayKST(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function ganjiOf(ymd) {
  // 기준점: 2000-01-01(JDN 2451545)은 무오(戊午, index 54)일
  const i = (((julianDay(ymd) + 49) % 60) + 60) % 60;
  const s = i % 10, b = i % 12;
  return {
    index: i,
    name: STEMS[s] + BRANCHES[b],
    hanja: STEMS_H[s] + BRANCHES_H[b],
    element: ELEMENTS[Math.floor(s / 2)],
  };
}

/** 같은 천간 오행 날끼리의 순번 (10일마다 2씩 증가) */
function elementDayOrdinal(ymd) {
  const n = julianDay(ymd) + 49;
  return Math.floor(n / 10) * 2 + ((n % 10) % 2);
}

function seasonOf({ m }) {
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

// ───────── 난수 (Swift와 동일) ─────────
function fnv1a(str) {
  let h = 0xcbf29ce484222325n;
  for (const b of new TextEncoder().encode(str)) {
    h = ((h ^ BigInt(b)) * 0x100000001b3n) & MASK64;
  }
  return h;
}

class SeededRandom {
  constructor(seed) {
    this.state = seed & MASK64;
  }
  static fromDate({ y, m, d }, reroll = 0, userKey = "") {
    let seed = BigInt(y * 10000 + m * 100 + d);
    seed = (seed * 1000n + BigInt(reroll)) & MASK64;
    return new SeededRandom(seed ^ fnv1a(userKey));
  }
  /** SplitMix64 */
  next() {
    this.state = (this.state + 0x9e3779b97f4a7c15n) & MASK64;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return z ^ (z >> 31n);
  }
  /** Swift RandomNumberGenerator.next(upperBound:) — Lemire 방식 */
  below(n) {
    const ub = BigInt(n);
    let m = this.next() * ub;
    if ((m & MASK64) < ub) {
      const t = ((MASK64 + 1n - ub) & MASK64) % ub;
      while ((m & MASK64) < t) m = this.next() * ub;
    }
    return Number(m >> 64n);
  }
}

/** Swift Array.shuffled(using:) */
function shuffled(list, rng) {
  const a = list.slice();
  let amount = a.length, i = 0;
  while (amount > 1) {
    const j = rng.below(amount);
    amount -= 1;
    [a[i], a[i + j]] = [a[i + j], a[i]];
    i += 1;
  }
  return a;
}

/** Swift Collection.randomElement(using:) */
function randomElement(list, rng) {
  return list.length ? list[rng.below(list.length)] : undefined;
}

/** 섞인 순서대로 한 바퀴씩 도는 선택기 (iOS Rotation.pick) */
function rotationPick(list, ordinal, salt, reroll = 0) {
  const n = list.length;
  const order = shuffled([...Array(n).keys()], new SeededRandom(fnv1a(salt) ^ BigInt(n)));
  const index = ordinal + reroll * Math.max(1, Math.floor(n / 4));
  return list[order[((index % n) + n) % n]];
}

// ───────── 추천 ─────────
const SLOTS = ["outer", "top", "bottom", "shoes", "accessory"];
export const SLOT_INFO = {
  outer: { korean: "아우터", emoji: "🧥" },
  top: { korean: "상의", emoji: "👕" },
  bottom: { korean: "하의", emoji: "👖" },
  shoes: { korean: "신발", emoji: "👟" },
  accessory: { korean: "소품", emoji: "👜" },
};

// ───────── 별자리 ─────────
// 각 별자리의 시작일 (월, 일). 염소자리는 12/22에 시작해 해를 넘긴다.
const ZODIAC_STARTS = [
  ["capricorn", 1, 1], ["aquarius", 1, 20], ["pisces", 2, 19], ["aries", 3, 21],
  ["taurus", 4, 20], ["gemini", 5, 21], ["cancer", 6, 22], ["leo", 7, 23],
  ["virgo", 8, 23], ["libra", 9, 23], ["scorpio", 10, 23], ["sagittarius", 11, 22],
  ["capricorn", 12, 22],
];

/** 생일(월·일) → 별자리 키 ("aries" 등) */
export function zodiacOf({ m, d }) {
  let sign = "capricorn";
  for (const [key, sm, sd] of ZODIAC_STARTS) {
    if (m > sm || (m === sm && d >= sd)) sign = key;
  }
  return sign;
}

/**
 * 오늘의 별자리 운세. 다시 뽑기와 무관하게 하루 동안 고정.
 * 총운은 특성(5개)×문장(73개)을 날짜 순번으로 돌려 365일 동안 같은 조합이 나오지 않는다.
 */
export function horoscope(zodiac, sign, ymd) {
  const s = zodiac.signs[sign];
  const day = julianDay(ymd);
  const pick = (list, key) => rotationPick(list, day, `zodiac.${key}.${sign}`);
  return {
    sign,
    name: s.name,
    symbol: s.symbol,
    overall: `${pick(s.traits, "trait")} ${pick(zodiac.general, "general")}`,
    love: pick(zodiac.love, "love"),
    money: pick(zodiac.money, "money"),
    number: pick([...Array(47).keys()].map((i) => i + 1), "number"),
    color: pick(s.colors, "color"),
  };
}

/**
 * @param data StyleData.json
 * @param ymd  {y, m, d} (한국 날짜)
 * @param myElement 내 오행 ("wood" 등) — 없으면 오늘 일진 기운 모드
 * @param reroll 다시 뽑기 횟수
 * @param sign, zodiac 별자리 키와 Zodiac.json — 있으면 별자리별로 다른 순서로 섞고,
 *        포인트 컬러를 별자리 행운의 색에서 고른다
 */
export function recommend(data, ymd, { myElement = null, reroll = 0, userKey = "", sign = null, zodiac = null } = {}) {
  if (sign && zodiac && !userKey) userKey = sign;
  const ganji = ganjiOf(ymd);
  const day = julianDay(ymd);

  let lucky, lo;
  if (myElement) {
    lucky = relation(ganji.element, myElement).balance;
    lo = day; // 보완 오행은 여러 일진에서 같은 값이 나올 수 있어 날짜 순번 사용
  } else {
    lucky = ganji.element;
    lo = elementDayOrdinal(ymd);
  }
  const d = day;
  const pick = (list, ord, key) => rotationPick(list, ord, `${key}|${userKey}`, reroll);
  const colorOf = (e) => data.colors[e].map((c) => ({ ...c, element: e }));

  const main = pick(colorOf(lucky), lo, `color.${lucky}`);
  const accentEl = generatedBy(lucky);
  const accent = sign && zodiac
    ? { ...pick(zodiac.signs[sign].colors, d, `accent.zodiac.${sign}`), zodiac: sign }
    : pick(colorOf(accentEl), d, `accent.${accentEl}`);

  // 코디: 메인 컬러 1벌 + 무채색 + 포인트 컬러 소품
  const season = seasonOf(ymd);
  const rng = SeededRandom.fromDate(ymd, reroll, userKey);
  const neutrals = shuffled(data.neutrals.filter((c) => c.name !== main.name && c.name !== accent.name), rng);
  const mainSlot = randomElement(season === "summer" ? ["top", "bottom"] : ["outer", "top", "bottom"], rng);
  let ni = 0;
  const outfit = [];
  for (const slot of SLOTS) {
    const items = data.outfits[slot]?.[season] ?? [];
    if (!items.length) continue;
    const item = pick(items, d, `outfit.${slot}.${season}`);
    let color;
    if (slot === mainSlot) color = main;
    else if (slot === "accessory") color = accent;
    else color = neutrals[ni++] ?? main;
    outfit.push({ slot, item, color });
  }

  return {
    ymd,
    ganji,
    lucky,
    mainColor: main,
    accentColor: accent,
    outfit,
    tip: {
      time: pick(data.luckyTimes, d, "time"),
      item: pick(data.luckyItems[lucky], lo, `item.${lucky}`),
      place: pick(data.places, d, "place"),
      color: main,
    },
    message: pick(data.headlines[lucky], lo, `headline.${lucky}`),
    advice: pick(data.advices, d, "advice"),
  };
}
