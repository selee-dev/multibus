/* 캐릭터 보드의 화면 상태, 데이터 렌더링, 편집 및 상호작용을 관리합니다. */
var WORLD_THEME = document.documentElement.getAttribute("data-world-theme") === "space" || document.documentElement.getAttribute("data-world-theme") === "battlefield" ? document.documentElement.getAttribute("data-world-theme") : "office";
var bgm = { context: null, gain: null, timer: null, step: 0, playing: false, enabled: true };
try { bgm.enabled = localStorage.getItem("ops-bgm") !== "off"; } catch (e) {}
function bgmButton() { return document.getElementById("bgm-toggle"); }
function syncBgmButton() {
  var button = bgmButton(); if (!button) return;
  button.setAttribute("aria-pressed", String(bgm.enabled));
  button.textContent = bgm.enabled ? "BGM 켜짐" : "BGM 꺼짐";
}
function bgmTick() {
  if (!bgm.context || !bgm.gain || !bgm.playing) return;
  var battlefield = [196, 247, 294, 330, 247, 220, 262, 330], space = [110, 165, 220, 147, 196, 247, 175, 220];
  var notes = WORLD_THEME === "space" ? space : battlefield, frequency = notes[bgm.step % notes.length], now = bgm.context.currentTime;
  var oscillator = bgm.context.createOscillator(), volume = bgm.context.createGain();
  oscillator.type = WORLD_THEME === "space" ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.035, now + 0.06);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
  oscillator.connect(volume); volume.connect(bgm.gain); oscillator.start(now); oscillator.stop(now + 0.82);
  bgm.step++;
}
function startBgm() {
  if (!bgm.enabled) return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!bgm.context) { bgm.context = new AudioContext(); bgm.gain = bgm.context.createGain(); bgm.gain.gain.value = 0.7; bgm.gain.connect(bgm.context.destination); }
  if (bgm.context.state === "suspended") bgm.context.resume();
  if (bgm.playing) return;
  bgm.playing = true; bgm.step = 0; bgmTick(); bgm.timer = setInterval(bgmTick, 820);
}
function stopBgm() {
  bgm.playing = false;
  if (bgm.timer) { clearInterval(bgm.timer); bgm.timer = null; }
}
function toggleBgm() {
  bgm.enabled = !bgm.enabled;
  try { localStorage.setItem("ops-bgm", bgm.enabled ? "on" : "off"); } catch (e) {}
  if (bgm.enabled) startBgm(); else stopBgm();
  syncBgmButton();
}
function armBgm() { if (bgm.enabled) startBgm(); }
document.addEventListener("pointerdown", armBgm, { once: true });
document.addEventListener("keydown", armBgm, { once: true });
var SIDE = {
  front: { name: "프론트" },
  back:  { name: "백오피스" },
  proj:  { name: "용병단" }
};
var UNI = {
  flead:     { side: "front", name: "프론트 팀장", realm: "프론트 팀장",   color: "var(--lead)", desc: "", hidden: true },
  order:     { side: "front", name: "주문", realm: "프론트 주문",     color: "var(--c-order)",     desc: "주문이 들어와 결제되고, 문의가 풀리는 구역" },
  member:    { side: "front", name: "회원", realm: "프론트 회원",   color: "var(--c-member)",    desc: "가입부터 등급, 마이페이지까지 회원 기록을 지키는 구역" },
  display:   { side: "front", name: "전시", realm: "프론트 전시",     color: "var(--c-display)",   desc: "고객이 처음 마주하는 화면과 상품 정보를 세우는 구역" },
  broadcast: { side: "front", name: "알림", realm: "프론트 알림",   color: "var(--c-broadcast)", desc: "방송 시간에 맞춰 알림과 검색이 제때 닿게 하는 구역" },
  curation:  { side: "front", name: "큐레이션", realm: "프론트 큐레이션", color: "var(--c-curation)",  desc: "기획전과 콘텐츠를 만들고 배포하는 구역" },
  fgen:      { side: "front", name: "프론트", realm: "프론트", color: "var(--muted)", desc: "소분류 없이 프론트에 속한 멤버" },
  blead:     { side: "back",  name: "백오피스 총괄", realm: "백오피스 총괄", color: "var(--lead)", desc: "", hidden: true },
  bord:      { side: "back",  name: "주문", realm: "백오피스 주문",     color: "var(--c-b1)", desc: "주문과 결제, 고객 응대, 제휴 연동을 뒤에서 받치는 구역" },
  bprod:     { side: "back",  name: "상품", realm: "백오피스 상품", color: "var(--c-b2)", desc: "상품 등록부터 방송, 프로모션, 입점사 관리까지 맡는 구역" },
  blog:      { side: "back",  name: "물류", realm: "백오피스 물류",     color: "var(--c-b3)", desc: "상품이 창고에서 고객 문 앞까지 가는 길을 잇는 구역" },
  bsettle:   { side: "back",  name: "정산", realm: "백오피스 정산",     color: "var(--c-b4)", desc: "정산과 매출 집계, 공급망, 공통 API와 보안을 지키는 구역" },
  bgen:      { side: "back",  name: "백오피스", realm: "백오피스", color: "var(--muted)", desc: "소분류 없이 백오피스에 속한 멤버" },
  p1:        { side: "proj",  name: "빈 용병 진영", realm: "빈 용병 진영", color: "var(--c-p1)", desc: "외부에서 합류한 프로젝트 팀의 공간", hidden: true },
  p2:        { side: "proj",  name: "빈 용병 진영", realm: "빈 용병 진영", color: "var(--c-p2)", desc: "외부에서 합류한 프로젝트 팀의 공간", hidden: true },
  p3:        { side: "proj",  name: "빈 용병 진영", realm: "빈 용병 진영", color: "var(--c-p3)", desc: "외부에서 합류한 프로젝트 팀의 공간", hidden: true }
};
var STAT_LABELS = ["장애대응", "쿼리", "소통", "속도", "꼼꼼함"];

/* DATA: 서버에 등록된 캐릭터만 담습니다. */
var DATA = [];

var state = { side: null, uni: null, q: "", sort: "lv" };
var lastFocus = null;
var openIdx = null;
var jobs = {};
var dbRef = null;
var currentUser = null;
var currentCharacterId = null;
var currentRole = null;
var currentCanAnnounce = false;
var mapSet = {}, mapFilt = false;
var moves = {}, leaves = {}, movesLoaded = false;
var canWrite = null;
try { var rawJobs = localStorage.getItem("ops-jobs"); if (rawJobs) jobs = JSON.parse(rawJobs) || {}; } catch (e) { jobs = {}; }

try { var rawMv = localStorage.getItem("ops-moves"); if (rawMv) moves = JSON.parse(rawMv) || {}; } catch (e) { moves = {}; }
try { var rawSt = localStorage.getItem("ops-status"); if (rawSt) leaves = JSON.parse(rawSt) || {}; } catch (e) { leaves = {}; }

var INVCAP = 14;
var PSLOTS = ["p1", "p2", "p3"];
var store = { tasks: {}, meetings: {}, projects: {}, titles: {}, snacks: {}, stats: {}, health: {}, chat: {}, privateChats: {}, pres: {}, skills: {}, nicks: {}, cfg: {}, ot: {}, seats: {}, people: {} };
var intr = [], invCount = {};
Object.keys(store).forEach(function (c) { try { var raw = localStorage.getItem("ops-" + c); if (raw) { var o = JSON.parse(raw); store[c] = o && typeof o === "object" && !Array.isArray(o) ? o : {}; } } catch (e) { store[c] = {}; } });
function makeExt(m, k) {
  var r = rng(hash(m.id)), s = [], j;
  for (j = 0; j < 5; j++) s.push(58 + Math.floor(r() * 30));
  return { n: String(m.n).slice(0, 30), bn: String(m.n).slice(0, 30), g: m.g === "f" ? "f" : "m", t: String(m.t || "프로젝트원").slice(0, 10), u: k, c: "프로젝트 합류 멤버", lv: 18 + Math.floor(r() * 20), s: s, k: "외부 합류", kd: "외부에서 합류해 프로젝트를 함께 끌고 가는 팀원.", q: "프로젝트가 끝날 때까지 함께합니다.", id: m.id, ext: true };
}
function peopleList() {
  var m = store.people && store.people.main, l = m && Array.isArray(m.list) ? m.list : [];
  return l.filter(function (x) { return x && typeof x.id === "string" && typeof x.n === "string" && x.n; });
}
function makeMember(m) {
  var r = rng(hash(m.id)), s = [], j, u = UNI[m.u] && UNI[m.u].side !== "proj" ? m.u : "order";
  for (j = 0; j < 5; j++) s.push(58 + Math.floor(r() * 30));
  return { n: String(m.n).slice(0, 30), bn: String(m.n).slice(0, 30), g: m.g === "f" ? "f" : "m", t: String(m.t || "").slice(0, 8), u: u, c: String(m.c || "팀원").slice(0, 16), lv: 18 + Math.floor(r() * 20), s: s, k: "", kd: "", q: "", id: m.id, seat: typeof m.s === "number" ? m.s : null, mem: true, accountCharacter: !!m.accountCharacter };
}
function extendData() {
  DATA.length = 0;
  peopleList().forEach(function (m) { DATA.push(makeMember(m)); });
  PSLOTS.forEach(function (k) {
    var p = store.projects[k], u = UNI[k];
    if (p && typeof p.name === "string") {
      u.hidden = false; u.name = p.name; u.realm = p.name;
      (Array.isArray(p.members) ? p.members : []).forEach(function (m) { if (m && typeof m.id === "string" && typeof m.n === "string") DATA.push(makeExt(m, k)); });
    } else { u.hidden = true; u.name = "빈 용병 진영"; u.realm = "빈 용병 진영"; }
  });
  DATA.forEach(function (d) {
    var o = store.nicks && store.nicks[jobId(d)], v = o && typeof o.n === "string" ? o.n.trim() : "";
    if (d.bn == null) d.bn = d.n;
    d.n = v ? v.slice(0, 30) : d.bn;
  });
}
extendData();
function newId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1679616).toString(36); }
function tasksOf(d) {
  var t = store.tasks[jobId(d)];
  return t && Array.isArray(t.items) ? t.items.filter(function (x) { return x && typeof x.i === "string" && typeof x.t === "string"; }) : [];
}
function openTasks(d) { return tasksOf(d).filter(function (x) { return !x.d; }); }
function uOf(d) { var m = moves[jobId(d)]; return m && UNI[m] && !UNI[m].hidden ? m : d.u; }
function todayStr() { var t = new Date(); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2); }
function md(x) { var q = String(x).split("-"); return q.length === 3 ? (+q[1]) + "/" + (+q[2]) : x; }
function offLabel(d) { return d.off || "연차"; }
function onLeave(d, today) { if (d.off) return true; var l = leaves[jobId(d)], t = today || todayStr(); return !!(l && l.from <= t && t <= l.to); }
function hmMin(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; }
function cfg() {
  var c = store.cfg.main || {}, o = { ls: "12:00", le: "13:00", oe: "18:00", bossVisit: c.bossVisit === true };
  ["ls", "le", "oe"].forEach(function (k) { if (hmMin(c[k]) !== null) o[k] = c[k]; });
  if (hmMin(o.le) <= hmMin(o.ls)) { o.ls = "12:00"; o.le = "13:00"; }
  return o;
}
function bossVisitOn() { return !!(store.cfg.main && store.cfg.main.bossVisit === true); }
function nowMin(now) { var t = new Date(now || Date.now()); return t.getHours() * 60 + t.getMinutes(); }
function isOT(d) { var o = store.ot[jobId(d)]; return !!(o && o.d === todayStr()); }
function isGone(d, now) { return nowMin(now) >= hmMin(cfg().oe) && !isOT(d); }
function shouldSitAtDesk(d, now) {
  now = now || Date.now();
  if (WORLD_THEME === "office" && bossVisitOn()) return !onLeave(d) && !isGone(d, now) && !presenceOf(d, now) && !inActiveMeeting(d);
  var p = store.pres[jobId(d)], minute = nowMin(now), end = hmMin(cfg().oe);
  var working = d.ext ? !presenceOf(d, now) : p && p.s === "work" && typeof p.at === "number" && now - p.at < 3600000;
  return !!(working && minute >= 540 && (minute < end || isOT(d)));
}
function levelOf(d) { return Math.max(1, Math.min(99, Math.round(power(d) / 13))); }
function presenceOf(d, now) {
  now = now || Date.now();
  var p = store.pres[jobId(d)], al = document.getElementById("autolunch"), c = cfg(), m = nowMin(now);
  if (p && typeof p.at === "number" && now >= p.at - 60000) {
    if (p.s === "work" && now - p.at < 3600000) return "";
    if (p.s === "lunch" && now - p.at < 3600000) return "lunch";
    if (p.s === "break" && now - p.at < 1800000) return "break";
  }
  return al && al.checked && m >= hmMin(c.ls) && m < hmMin(c.le) ? "lunch" : "";
}
function presTag(d) {
  if (isGone(d)) return " · 퇴근";
  var p = presenceOf(d), t = isOT(d) ? " · 야근" : "";
  return t + (p === "lunch" ? " · 점심 중" : p === "break" ? " · 휴식 중" : "");
}
function attText(d) {
  if (d.off) return d.off;
  if (onLeave(d)) return "연차";
  return "출근" + presTag(d);
}
var COMMON = ["장애 해결사", "로그 탐정", "쿼리 마법사", "배포 지휘관", "문서 사서", "야근 수호자", "분위기 메이커", "팀의 방패"];
var REC = {
  flead: ["프론트 총사령관", "전략 참모", "질서의 수호자"],
  blead: ["백오피스 대원로", "전략 결단가", "큰 그림 설계자"],
  order: ["결제 수호기사", "CS 힐러", "PG 통역사", "환불 마법사", "정산 연금술사", "쿠폰 감별사", "주문 추적자"],
  member: ["인증 수호자", "동의 기록관", "회원 사서", "등급 연금술사", "포인트 회계관", "마이페이지 건축가", "탈퇴 정화사"],
  display: ["전시 설계사", "상품상세 화가", "배너 조율사", "캐시 요정", "가격 검수관", "이미지 대장장이", "카테고리 항해사"],
  broadcast: ["편성표 시계공", "알림 전령", "검색 탐험가", "넷메일 조련사", "방송 감시자", "동의어 사전사", "알림톡 포수"],
  curation: ["CMS 장인", "템플릿 마법사", "기획전 연출가", "추천 점성술사", "배포 의식관", "큐레이터"],
  bord: ["주문 추적자", "PG 통역사", "환불 마법사", "ARS 교환수", "제휴 외교관", "고객 사서", "결제 수호기사"],
  bprod: ["상품 감정사", "방송 조율사", "프로모션 설계자", "입점 안내인", "카탈로그 사서", "가격 검수관"],
  blog: ["물류 항해사", "배송 길잡이", "재고 파수꾼", "송장 추적자", "입고 감독관"],
  bsettle: ["정산 연금술사", "매출 분석관", "SCM 공급관", "API 관문지기", "보안 수호자", "마감의 문지기"]
};
function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function jobId(d) { return d.id || (d.id = "u" + hash(d.n).toString(36)); }
function job(d) { return jobs[jobId(d)] || d.c; }
function skl(d) {
  var o = store.skills && store.skills[jobId(d)];
  return o && typeof o === "object" ? { k: String(o.k || ""), kd: String(o.kd || ""), q: String(o.q || "") } : { k: d.k || "", kd: d.kd || "", q: d.q || "" };
}
function nameParts(n) {
  return [String(n)];
}
function nameHtml(n) { var p = nameParts(n); return p.length > 1 ? esc(p[0]) + "<br>" + esc(p[1]) : esc(p[0]); }
function nameLines(d, suffix) { var p = nameParts(d.n); suffix = suffix || ""; return p.length > 1 ? [p[0], p[1] + suffix] : [p[0] + suffix]; }
function tline(d) { var t = ttl(d); return t ? t + " · " : ""; }
function ttl(d) { var t = store.titles[jobId(d)]; return t && typeof t.t === "string" && t.t ? t.t : d.t; }
var RANKS = ["상무", "이사", "팀장", "부장", "차장", "과장", "대리", "주임", "사원"];
function canEditJobs() { return !dbRef || currentRole === "ADMIN"; }
function canManageSharedOperations() { return !dbRef || !!currentUser; }
function canEditCharacter(d) { return !dbRef || currentRole === "ADMIN" || !!(d && d.accountCharacter && d.id === currentCharacterId); }
function syncAnnouncementPermission() {
  var index = currentCharacterId ? indexOfId(currentCharacterId) : -1;
  currentCanAnnounce = currentRole === "ADMIN" || (index >= 0 && ["팀장", "상무"].indexOf(ttl(DATA[index])) >= 0);
}
function jobEditor(d) {
  var seen = {}, chips = "";
  (REC[uOf(d)] || []).concat(COMMON).forEach(function (t) {
    if (seen[t]) return; seen[t] = 1;
    chips += '<button type="button" class="rec">' + t + "</button>";
  });
  return '<div class="jobedit" id="jobpanel" hidden><div class="mlabel">추천 직업명</div><div class="recs">' + chips + "</div>" +
    '<div class="jrow"><input id="jobin" type="text" maxlength="16" placeholder="직접 입력" aria-label="직업 이름">' +
    '<button type="button" class="jsave">저장</button><button type="button" class="jreset">기본값</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function hideEditor() {
  var eds = document.querySelectorAll("#sheet .jobedit"), k;
  for (k = 0; k < eds.length; k++) { eds[k].hidden = true; eds[k].querySelector(".jstatus").textContent = ""; }
}
function showPanel(id) {
  var eds = document.querySelectorAll("#sheet .jobedit"), k, ed = document.getElementById(id);
  for (k = 0; k < eds.length; k++) if (eds[k].id !== id) eds[k].hidden = true;
  ed.hidden = !ed.hidden;
  return ed;
}
function updateJobViews(d) {
  var n = document.querySelector("#sheet .jobname");
  if (n && openIdx !== null && DATA[openIdx] === d) n.textContent = job(d);
  renderGrid();
}
function saveJob(i, val) {
  var d = DATA[i], id = jobId(d), v = (val || "").trim();
  var status = document.querySelector("#jobpanel .jstatus");
  var reset = !v || v === d.c;
  function apply() { if (reset) delete jobs[id]; else jobs[id] = v; }
  if (dbRef) {
    var ref = dbRef.doc("jobs/" + id);
    (reset ? ref.delete() : ref.set({ c: v })).then(function () {
      apply(); updateJobViews(d); hideEditor();
    }, function () {
      if (status) status.textContent = "저장하지 못했어요. 이 페이지를 편집할 수 있는 권한(Contributor 이상)이 필요할 수 있어요.";
    });
  } else {
    apply();
    try { localStorage.setItem("ops-jobs", JSON.stringify(jobs)); } catch (e) {}
    updateJobViews(d); hideEditor();
  }
}

function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { var a = seed; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function statOf(d) {
  var o = store.stats[jobId(d)];
  return o && Array.isArray(o.s) && o.s.length === 5 ? o.s.map(function (v) { return Math.max(0, Math.min(100, Math.round(+v || 0))); }) : d.s;
}
function healthOf(d) {
  var o = store.health[jobId(d)], value = o ? +o.value : 100;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 100;
}
function batteryOf(d, now) {
  var base = healthOf(d), current = nowMin(now), leave = hmMin(cfg().oe), start = 9 * 60;
  if (current <= start || leave <= start) return base;
  if (current >= leave) return Math.round(base * 0.35);
  return Math.max(0, Math.round(base * (1 - ((current - start) / (leave - start)) * 0.65)));
}
function power(d) { return statOf(d).reduce(function (a, b) { return a + b; }, 0); }
function rarity(lv) { return lv >= 50 ? ["전설", "#f4c95d", "r-legend"] : lv >= 38 ? [WORLD_THEME === "office" ? "직원" : "영웅", "#e6e9f5", ""] : lv >= 26 ? ["희귀", "#8fa3d6", ""] : ["일반", "#6b7399", ""]; }

function spriteRects(d, step) {
  var r = rng(hash(d.bn || d.n)), out = [];
  function pick(a) { return a[Math.floor(r() * a.length)]; }
  function R(x, y, w, h, fill, op) { out.push([x, y, w, h, fill, op || 1]); }
  var f = d.g === "f", OUT = "currentColor", GOLD = "#f4c95d", SH = "#14172b";
  var skin = pick(["#f7d9bf", "#f0c8a4", "#e3b08a"]);
  var hair = pick(["#1c1a24", "#2d2320", "#4a3225"]);
  var style = Math.floor(r() * 3);
  var crown = ["상무", "이사", "팀장"].indexOf(ttl(d)) >= 0;
  var senior = ["상무", "이사", "팀장", "부장"].indexOf(ttl(d)) >= 0;
  var space = WORLD_THEME === "space";
  var suits = ["#32b9db", "#e45d70", "#48b985", "#9a78d1", "#d99e39", "#4d82ce"];
  var suit = suits[hash(d.bn || d.n) % suits.length], suitDark = "#24334e", suitLight = "#d5f7ff";
  var pants = space ? suitDark : (f ? skin : "#2a3050");
  R(3, 19, 8, 1, "#000", 0.3);
  /* 뒷머리 */
  if (f) {
    if (style === 0) R(1, 2, 12, 10, hair);
    else if (style === 1) R(1, 2, 12, 7, hair);
    else { R(2, 2, 10, 4, hair); R(12, 4, 1, 6, hair); R(13, 6, 1, 3, hair); }
  }
  /* 다리 */
  R(4, 16, 2, 2, pants); R(8, 16, 2, 2, pants);
  if (step === 1) { R(4, 17, 3, 1, SH); R(8, 18, 3, 1, SH); }
  else if (step === 2) { R(4, 18, 3, 1, SH); R(8, 17, 3, 1, SH); }
  else { R(4, 18, 3, 1, SH); R(8, 18, 3, 1, SH); }
  /* 몸 */
  if (space) {
    R(2, 12, 10, 4, suitDark); R(3, 12, 8, 4, suit);
    R(2, 13, 1, 2, suitLight); R(11, 13, 1, 2, suitLight);
    R(4, 12, 2, 1, suitLight); R(8, 12, 2, 1, suitLight);
    R(6, 13, 2, 2, "#f3fbff"); R(4, 16, 2, 2, suit); R(8, 16, 2, 2, suit);
    R(4, 18, 2, 1, suitDark); R(8, 18, 2, 1, suitDark);
  } else {
    R(3, 12, 8, 4, OUT); R(2, 12, 1, 3, OUT); R(11, 12, 1, 3, OUT);
    R(10, 12, 1, 4, "#000", 0.18);
    R(2, 15, 1, 1, skin); R(11, 15, 1, 1, skin);
    R(6, 12, 2, 1, "#fff", 0.9);
    if (!f && senior) R(6, 13, 2, 2, "#1e2a4a");
  }
  /* 얼굴 */
  R(2, 2, 10, 9, skin); R(3, 11, 8, 1, skin);
  if (!f) R(2, 10, 10, 1, "#000", 0.06);
  /* 머리카락 */
  R(3, 1, 8, 1, hair); R(2, 2, 10, 3, hair);
  if (!f && style === 2) { R(2, 5, 4, 1, hair); R(11, 5, 1, 1, hair); }
  if (!f && style === 0) { R(2, 5, 1, 3, hair); R(11, 5, 1, 3, hair); }
  if (!f && style === 1 && !crown) { R(4, 0, 1, 1, hair); R(6, 0, 2, 1, hair); R(9, 0, 1, 1, hair); }
  if (f && style < 2) { R(2, 5, 1, 5, hair); R(11, 5, 1, 5, hair); }
  if (f && style === 2) { R(2, 5, 1, 2, hair); }
  if (space) { R(2, 4, 10, 2, suitDark); R(3, 4, 8, 1, suitLight); R(3, 5, 8, 1, suit); }
  /* 눈·눈썹·입 */
  R(4, 5, 2, 1, hair); R(8, 5, 2, 1, hair);
  R(4, 6, 2, 3, "#1a1a2a"); R(8, 6, 2, 3, "#1a1a2a");
  R(4, 6, 1, 1, "#fff"); R(8, 6, 1, 1, "#fff");
  R(6, 10, 2, 1, f ? "#d0606c" : "#b07060");
  if (f) { R(3, 9, 1, 1, "#f29a9a", 0.8); R(10, 9, 1, 1, "#f29a9a", 0.8); }
  else R(3, 9, 1, 1, "#e08a70", 0.35), R(10, 9, 1, 1, "#e08a70", 0.35);
  if (crown) { R(3, 1, 8, 1, GOLD); R(3, 0, 1, 1, GOLD); R(6, 0, 2, 1, GOLD); R(10, 0, 1, 1, GOLD); }
  return out;
}

function sprite(d) {
  var o = "";
  spriteRects(d, 0).forEach(function (q) {
    o += '<rect x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" fill="' + q[4] + '"' + (q[5] < 1 ? ' fill-opacity="' + q[5] + '"' : "") + "/>";
  });
  return '<svg viewBox="0 0 14 20" shape-rendering="crispEdges" aria-hidden="true">' + o + "</svg>";
}

function titleEditor(d) {
  var chips = "";
  RANKS.forEach(function (t) { chips += '<button type="button" class="trec">' + t + "</button>"; });
  return '<div class="jobedit" id="titlepanel" hidden><div class="mlabel">직급</div><div class="recs">' + chips + "</div>" +
    '<div class="jrow"><input id="titin" type="text" maxlength="8" placeholder="직접 입력 (예: 책임, 수석)" aria-label="직급 이름">' +
    '<button type="button" class="jsave tisave">저장</button><button type="button" class="tireset">원래 직급으로</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveTitle(i, val) {
  var d = DATA[i], id = jobId(d), v = String(val || "").trim().slice(0, 8), reset = !v || v === d.t;
  commit("titles", id, reset ? null : { t: v }, function () { syncAnnouncementPermission(); refreshForms(); spr[i] = makeSprites(d); renderGrid(); openSheet(i, null); }, "#titlepanel .jstatus");
}
function nickEditor(d) {
  return '<div class="jobedit" id="nickpanel" hidden><div class="mlabel">닉네임</div>' +
    '<div class="jrow"><input id="nkin" type="text" maxlength="30" placeholder="닉네임 (7자 이상이면 두 줄로 보여요)" aria-label="닉네임" autocomplete="off">' +
    '<button type="button" class="jsave nksave">저장</button><button type="button" class="nkreset">원래 닉네임으로</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveNick(i, val) {
  var d = DATA[i], id = jobId(d), v = String(val || "").trim().slice(0, 30), st = document.querySelector("#nickpanel .jstatus"), reset = !v || v === d.bn;
  if (!reset && DATA.some(function (m, j) { return j !== i && m.n === v; })) { if (st) st.textContent = "이미 있는 닉네임이에요."; return; }
  commit("nicks", id, reset ? null : { n: v }, function () { rebuildExternal(false); renderPick(); renderMeets(); if (state.view === "team") renderTeam(); }, "#nickpanel .jstatus");
}
function skillEditor(d) {
  return '<div class="jobedit" id="skillpanel" hidden><div class="mlabel">고유 스킬</div>' +
    '<div class="jrow"><input id="skk" type="text" maxlength="20" placeholder="스킬 이름 (예: 수신동의 관리)" aria-label="스킬 이름"></div>' +
    '<div class="jrow" style="margin-top:8px"><input id="skkd" type="text" maxlength="80" placeholder="스킬 설명 (선택)" aria-label="스킬 설명"></div>' +
    '<div class="jrow" style="margin-top:8px"><input id="skq" type="text" maxlength="40" placeholder="한마디 (선택)" aria-label="한마디"></div>' +
    '<div class="jrow" style="margin-top:8px"><button type="button" class="jsave sksave">저장</button><button type="button" class="skreset">원래대로</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveSkill(i, reset) {
  var d = DATA[i], id = jobId(d), g = function (x) { return document.getElementById(x).value.trim(); };
  commit("skills", id, reset ? null : { k: g("skk").slice(0, 20), kd: g("skkd").slice(0, 80), q: g("skq").slice(0, 40) }, function () { renderGrid(); openSheet(i, null); }, "#skillpanel .jstatus");
}
function statEditor(d) {
  var h = "";
  statOf(d).forEach(function (v, j) {
    h += '<label class="stl"><span>' + STAT_LABELS[j] + '</span><input type="range" class="strng" min="0" max="100" step="1" data-j="' + j + '" value="' + v + '" aria-label="' + STAT_LABELS[j] + '"><b>' + v + "</b></label>";
  });
  return '<div class="jobedit" id="statpanel" hidden><div class="mlabel">스탯 조정 (0~100)</div>' + h +
    '<div class="jrow"><button type="button" class="jsave stsave">저장</button><button type="button" class="streset">기본값으로</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveStats(i, arr) {
  var d = DATA[i], same = !arr || arr.every(function (v, j) { return v === d.s[j]; });
  commit("stats", jobId(d), same ? null : { s: arr }, function () { renderGrid(); openSheet(i, null); }, "#statpanel .jstatus");
}
function healthEditor(d) {
  return '<div class="jobedit" id="healthpanel" hidden><div class="mlabel">체력 (0~100)</div>' +
    '<div class="jrow"><input id="healthinput" type="number" min="0" max="100" step="1" value="' + healthOf(d) + '" aria-label="캐릭터 체력 (0~100)">' +
    '<button type="button" class="jsave hpsave">저장</button><button type="button" class="hpreset">기본값</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveHealth(i, value) {
  var d = DATA[i], number = Number(value);
  if (value !== null && (!Number.isInteger(number) || number < 0 || number > 100)) {
    var status = document.querySelector("#healthpanel .jstatus");
    if (status) status.textContent = "체력은 0부터 100까지 정수로 입력해 주세요.";
    return;
  }
  commit("health", jobId(d), value === null || number === 100 ? null : { value: number }, function () { renderGrid(); openSheet(i, null); }, "#healthpanel .jstatus");
}
function presEditor(d) {
  return '<div class="jobedit" id="prespanel" hidden><div class="mlabel">상태 (점심 60분, 휴식 30분 뒤 돌아와요 · 야근은 오늘 퇴근 시간이 지나도 남아요)</div>' +
    '<div class="recs"><button type="button" class="pr" data-s="work">업무중</button><button type="button" class="pr" data-s="lunch">🍗 점심</button><button type="button" class="pr" data-s="break">☕ 휴식</button><button type="button" class="otbtn" aria-pressed="' + (isOT(d) ? "true" : "false") + '">🌙 야근' + (isOT(d) ? " ✓" : "") + '</button></div>' +
    '<div class="jrow"><button type="button" class="jcancel panel-close" aria-label="닫기">✕</button></div><div class="jstatus" role="status"></div></div>';
}
function saveOT(i) {
  var d = DATA[i], on = !isOT(d);
  commit("ot", jobId(d), on ? { d: todayStr(), at: Date.now() } : null, function () { syncMeetings(false); renderGrid(); openSheet(i, null); }, "#prespanel .jstatus");
}
function savePres(i, st) {
  commit("pres", jobId(DATA[i]), { s: st, at: Date.now() }, function () { syncMeetings(false); openSheet(i, null); }, "#prespanel .jstatus");
}
function attEditor(d) {
  return '<div class="jobedit" id="attpanel" hidden><div class="mlabel">근태 (연차는 오늘 하루만 적용되고, 내일이면 자동으로 출근으로 돌아와요)</div>' +
    '<div class="recs"><button type="button" class="att" data-a="in" aria-pressed="true">출근</button><button type="button" class="att" data-a="off" aria-pressed="false">연차</button></div>' +
    '<div class="jrow"><button type="button" class="asave">저장</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function moveEditor(d) {
  var cur = uOf(d), h = "";
  ["front", "back", "proj"].forEach(function (sd) {
    var b = "";
    Object.keys(UNI).forEach(function (k) {
      var u = UNI[k];
      if (u.hidden || u.side !== sd) return;
      b += '<button type="button" class="mv' + (k === cur ? " cur" : "") + '" data-u="' + k + '" title="' + esc(u.name) + '"' + (k === cur ? " disabled" : "") + ">" + esc(u.realm) + "</button>";
    });
    if (b) h += '<div class="mlabel">' + SIDE[sd].name + '</div><div class="recs">' + b + "</div>";
  });
  return '<div class="jobedit" id="movepanel" hidden><div class="mlabel">전출할 공간</div>' + h +
    '<div class="jrow"><button type="button" class="mreset">원래 구역으로</button><button type="button" class="jcancel">취소</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function seatEditor(d) {
  var cur = deskFor(d), occ = {}, h = "";
  DATA.forEach(function (m) { var sd = deskFor(m); if (sd) occ[sd.idx] = m; });
  SEATS.forEach(function (s) {
    if (s.kind !== "person") {
      h += '<button type="button" class="sw pc" disabled aria-label="PC 전용 자리 ' + esc(s.n) + '"><span>PC</span><b>' + esc(s.n) + "</b></button>";
      return;
    }
    var o = occ[s.idx], isCur = !!cur && s.idx === cur.idx;
    var pos = (s.row + 1) + "-" + (s.col + 1), spoken = (s.row + 1) + "행 " + (s.col + 1) + "열";
    h += '<button type="button" class="sw' + (isCur ? " cur" : "") + (o ? " occupied" : " vac") + '" data-s="' + s.idx + '"' + (isCur || o ? " disabled" : "") + ' title="' + spoken + '" aria-label="' + (isCur ? "내 좌석, " : o ? "사용 중, " : "빈 자리, ") + spoken + '">' + (isCur ? "내 자리 " : o ? "점유 " : "") + pos + "</button>";
  });
  return '<div class="jobedit" id="seatpanel" hidden><div class="mlabel">좌석 선택 — 빈 자리만 선택할 수 있어요</div><div class="recs">' + h + "</div>" +
    '<div class="jrow"><button type="button" class="sreset">자리 비우기</button><button type="button" class="jcancel panel-close" aria-label="닫기">✕</button></div>' +
    '<div class="jstatus" role="status"></div></div>';
}
function saveSeat(i, tIdx) {
  var d = DATA[i], cur = deskFor(d), target = typeof tIdx === "number" ? SEATS[tIdx] : null, ov = {}, src = store.seats && store.seats.main && store.seats.main.m ? store.seats.main.m : {};
  if (!d || (tIdx !== null && (!target || target.kind !== "person")) || (cur && cur.idx === tIdx)) return;
  if (target && DATA.some(function (m) { var sd = deskFor(m); return m !== d && sd && sd.idx === target.idx; })) {
    var status = document.querySelector("#seatpanel .jstatus");
    if (status) status.textContent = "이미 다른 캐릭터가 선택한 자리예요.";
    return;
  }
  if (target && WORLD_THEME === "office" && !window.confirm((target.row + 1) + "행 " + (target.col + 1) + "열 자리를 지정하시겠습니까?")) return;
  Object.keys(src).forEach(function (k) { ov[k] = src[k]; });
  if (target) ov[jobId(d)] = target.idx; else delete ov[jobId(d)];
  commit("seats", "main", Object.keys(ov).length ? { m: ov } : null, function () { applySeats(false); syncIntruders(false); openSheet(i, null); }, "#seatpanel .jstatus");
}
function resetSeat(i) {
  if (!deskFor(DATA[i])) { hideEditor(); return; }
  saveSeat(i, null);
}
function attMode() { var b = document.querySelector("#attpanel .att[aria-pressed=true]"); return b ? b.dataset.a : "in"; }
function setAtt(a) {
  var bs = document.querySelectorAll("#attpanel .att"), k;
  for (k = 0; k < bs.length; k++) bs[k].setAttribute("aria-pressed", String(bs[k].dataset.a === a));
}
function syncAtt(d) { setAtt(onLeave(d) ? "off" : "in"); }
function denied(sel) {
  var st = document.querySelector(sel);
  if (st) st.textContent = "저장하지 못했어요. 이 페이지를 편집할 수 있는 권한(Contributor 이상)이 필요할 수 있어요.";
}
function saveLeave(i, on) {
  var d = DATA[i], id = jobId(d), from = todayStr(), to = from;
  if (on && leaves[id] && onLeave(d)) { openSheet(i, null); return; }
  function ok() { if (on) leaves[id] = { from: from, to: to }; else delete leaves[id]; renderGrid(); syncMeetings(false); openSheet(i, null); }
  if (dbRef) {
    var ref = dbRef.doc("status/" + id);
    (on ? ref.set({ from: from, to: to }) : ref.delete()).then(ok, function () { denied("#attpanel .jstatus"); });
  } else {
    ok();
    try { localStorage.setItem("ops-status", JSON.stringify(leaves)); } catch (e) {}
  }
}
function saveMove(i, unit) {
  var d = DATA[i], id = jobId(d), reset = !unit || unit === d.u;
  function ok() { if (reset) delete moves[id]; else moves[id] = unit; applyMoves(false); syncIntruders(false); renderPortals(); renderGrid(); openSheet(i, null); }
  if (dbRef) {
    var ref = dbRef.doc("moves/" + id);
    (reset ? ref.delete() : ref.set({ u: unit })).then(ok, function () { denied("#movepanel .jstatus"); });
  } else {
    ok();
    try { localStorage.setItem("ops-moves", JSON.stringify(moves)); } catch (e) {}
  }
}

function commit(col, id, data, ok, errSel) {
  function apply() { if (data == null) delete store[col][id]; else store[col][id] = data; if (ok) ok(); }
  if (dbRef) {
    var ref = dbRef.doc(col + "/" + id);
    (data == null ? ref.delete() : ref.set(data)).then(apply, function () { denied(errSel); });
  } else {
    apply();
    try { localStorage.setItem("ops-" + col, JSON.stringify(store[col])); } catch (e) {}
  }
}
function renderTasks() {
  var box = document.getElementById("tlist");
  if (!box || openIdx === null || !DATA[openIdx]) return;
  var items = tasksOf(DATA[openIdx]), open = items.filter(function (x) { return !x.d; }), done = items.filter(function (x) { return x.d; }), can = canEditCharacter(DATA[openIdx]), h = "";
  open.concat(done).forEach(function (x) {
    h += '<li class="ti' + (x.d ? " done" : "") + '"><label><input type="checkbox" class="tchk" data-t="' + esc(x.i) + '"' + (x.d ? " checked" : "") + (can ? "" : " disabled") + "><span>" + esc(x.t) + "</span></label>" +
      (can ? '<button type="button" class="tdel" data-t="' + esc(x.i) + '" aria-label="업무 삭제">✕</button>' : "") + "</li>";
  });
  box.innerHTML = h || '<li class="tempty">등록된 업무가 없어요.</li>';
  document.getElementById("tcount").textContent = open.length ? "침입자 " + open.length + "마리" : (items.length ? "모두 처리했어요" : "");
}
function saveTasks(d, items, cb) {
  commit("tasks", jobId(d), items.length ? { items: items } : null, function () { renderTasks(); syncIntruders(false); renderGrid(); if (cb) cb(); }, "#tstatus");
}
function addTask(text) {
  var d = DATA[openIdx], t = String(text || "").trim().slice(0, 60), items = tasksOf(d), st = document.getElementById("tstatus");
  if (!t) { st.textContent = "업무 내용을 적어주세요."; return; }
  if (items.length >= 30) { st.textContent = "업무는 한 사람당 30개까지 적을 수 있어요. 끝난 업무를 지워주세요."; return; }
  st.textContent = "";
  saveTasks(d, items.concat([{ i: newId("t"), t: t, d: false }]), function () { var inp = document.getElementById("tin"); if (inp) { inp.value = ""; inp.focus(); } });
}
function toggleTask(tid, done) {
  var d = DATA[openIdx];
  saveTasks(d, tasksOf(d).map(function (x) { return x.i === tid ? { i: x.i, t: x.t, d: !!done } : x; }));
}
function delTask(tid) {
  var d = DATA[openIdx];
  saveTasks(d, tasksOf(d).filter(function (x) { return x.i !== tid; }));
}

function visible() {
  var q = state.q.trim().toLowerCase();
  var list = DATA.filter(function (d) {
    if (state.side && UNI[uOf(d)].side !== state.side) return false;
    if (state.uni && uOf(d) !== state.uni) return false;
    if (!q) return true;
    return (d.n + " " + ttl(d) + " " + job(d) + " " + skl(d).k + " " + skl(d).kd + " " + UNI[uOf(d)].name + " " + SIDE[UNI[uOf(d)].side].name).toLowerCase().indexOf(q) >= 0;
  });
  list.sort(function (a, b) {
    if (state.sort === "name") return a.n.localeCompare(b.n, "ko");
    if (state.sort === "pow") return power(b) - power(a);
    return levelOf(b) - levelOf(a);
  });
  return list;
}

var FOODS = ["과자", "커피", "과일", "빵", "도넛", "아이스크림", "음료수", "김밥", "떡", "초콜릿"];
function snackNow() {
  var t = todayStr(), out = {};
  Object.keys(store.snacks).forEach(function (id) {
    var s = store.snacks[id];
    if (!s || !UNI[s.u] || UNI[s.u].hidden || typeof s.from !== "string" || typeof s.to !== "string" || s.from > t || t > s.to) return;
    var o = out[s.u] || (out[s.u] = { items: [], to: s.to });
    if (s.to > o.to) o.to = s.to;
    (Array.isArray(s.items) ? s.items : []).forEach(function (it) { it = String(it); if (o.items.indexOf(it) < 0 && o.items.length < 6) o.items.push(it); });
  });
  return out;
}

function renderPortals() {
  var html = "", sn = snackNow();
  Object.keys(UNI).forEach(function (k) {
    var u = UNI[k];
    if (u.hidden || (state.side && u.side !== state.side)) return;
    var n = DATA.filter(function (d) { return uOf(d) === k; }).length;
    if (!n && state.uni !== k) return;
    html += '<button type="button" class="portal" data-u="' + k + '" style="--c:' + u.color + '" aria-pressed="' + (state.uni === k) + '">' +
      '<span class="realm">' + esc(SIDE[u.side].name) + '</span><span class="pname">' + esc(u.name) + '</span>' +
      '<span class="pdesc">' + esc(u.desc) + '</span>' + (sn[k] ? '<span class="snk">🍪 간식 당번 · ~' + md(sn[k].to) + " · " + esc(sn[k].items.join(", ")) + "</span>" : "") + '<span class="pcount">' + n + '명' + (invCount[k] ? '<span class="inv">침입 ' + invCount[k] + "</span>" : "") + "</span></button>";
  });
  document.getElementById("portals").innerHTML = html;
  document.getElementById("all").setAttribute("aria-pressed", String(!state.uni));
  renderSides();
  var lg = '<span class="lg"><i style="background:var(--lead);box-shadow:0 0 6px var(--lead)"></i><b class="lead-note">팀장·상무</b></span>';
  Object.keys(UNI).forEach(function (k) { var u = UNI[k]; if (!u.hidden && DATA.some(function (d) { return uOf(d) === k; })) lg += '<span class="lg"><i style="background:' + u.color + '"></i>' + esc(u.realm) + "</span>"; });
  document.getElementById("legend").innerHTML = lg;
}

function renderSides() {
  var opts = [[null, "전체"], ["front", SIDE.front.name], ["back", SIDE.back.name]], html = "";
  if (PSLOTS.some(function (k) { return store.projects[k]; })) opts.push(["proj", SIDE.proj.name]);
  opts.forEach(function (o) {
    var n = o[0] ? DATA.filter(function (d) { return UNI[uOf(d)].side === o[0]; }).length : DATA.length;
    if (o[0] && !n && state.side !== o[0]) return;
    html += '<button type="button" class="side" data-s="' + (o[0] || "") + '" aria-pressed="' + (state.side === o[0]) + '">' + o[1] + "<b>" + n + "명</b></button>";
  });
  document.getElementById("sides").innerHTML = html;
}

function renderGrid() {
  var list = visible(), html = "";
  mapSet = {}; list.forEach(function (d) { mapSet[jobId(d)] = 1; }); mapFilt = list.length !== DATA.length;
  var today = todayStr();
  list.forEach(function (d) {
    var u = UNI[uOf(d)], level = levelOf(d), rr = rarity(level), p = power(d), off = onLeave(d, today), nt = openTasks(d).length;
    html += '<button type="button" class="card ' + rr[2] + (off ? " off" : "") + '" data-i="' + DATA.indexOf(d) + '" style="--c:' + u.color + ";--rar:" + rr[1] + '">' +
      '<div class="art' + (off ? " off" : "") + '" style="color:' + u.color + '">' + sprite(d) + '<span class="lv">Lv.' + level + '</span><span class="rar">' + rr[0] + "</span>" + (off ? '<span class="leavetag">' + esc(offLabel(d)) + "</span>" : "") + (nt ? '<span class="tbadge">침입 ' + nt + "</span>" : "") + "</div>" +
      '<div class="cname">' + nameHtml(d.n) + '</div><div class="cclass">' + esc(tline(d)) + esc(job(d)) + "</div>" +
      '<div class="pow"><span>전투력</span><span class="bar"><i style="width:' + Math.round(p / 5) + '%"></i></span><span>' + p + "</span></div></button>";
  });
  document.getElementById("grid").innerHTML = html || '<div class="empty">' + (WORLD_THEME === "office" ? "찾는 직원이 없어요. 검색어를 바꿔보세요." : "찾는 영웅이 없어요. 검색어를 바꿔보세요.") + "</div>";
  document.getElementById("count").textContent = list.length + " / " + DATA.length + "명";
}

function openSheet(i, opener) {
  var d = DATA[i], u = UNI[uOf(d)], level = levelOf(d), rr = rarity(level), off = onLeave(d), sheet = document.getElementById("sheet"), canEdit = canEditCharacter(d);
  if (opener) lastFocus = opener;
  var stats = "";
  statOf(d).forEach(function (v, j) { stats += '<div class="stat"><span>' + STAT_LABELS[j] + '</span><span class="bar"><i style="width:' + v + '%"></i></span><b>' + v + "</b></div>"; });
  var mates = "";
  DATA.forEach(function (m, j) { if (uOf(m) === uOf(d) && j !== i) mates += '<button type="button" data-i="' + j + '">' + esc(m.n) + "</button>"; });
  sheet.style.setProperty("--c", u.color);
  sheet.innerHTML =
    '<button type="button" class="close" aria-label="닫기">✕</button>' +
    '<div><div class="art' + (off ? " off" : "") + '" style="color:' + u.color + '">' + sprite(d) + '<span class="lv">Lv.' + level + '</span><span class="rar" style="--rar:' + rr[1] + '">' + rr[0] + "</span>" + (off ? '<span class="leavetag">' + esc(offLabel(d)) + "</span>" : "") + "</div></div>" +
    "<div>" +
    '<h2 class="sname" id="sname">' + nameHtml(d.n) + "</h2>" +
    '<div class="smeta"><span>' + esc(tline(d)) + '<b class="jobname">' + esc(job(d)) + "</b> · " + esc(u.realm) + "</span>" +
    "</div>" +
    (canEdit ? '<div class="sedit" role="group" aria-label="캐릭터 편집">' +
      '<div class="eg"><span class="egl">프로필</span><button type="button" class="mini editnick">닉네임</button><button type="button" class="mini editjob">직업</button><button type="button" class="mini edittitle">직급</button><button type="button" class="mini editskill">스킬</button><button type="button" class="mini editstat">스탯</button><button type="button" class="mini edithp">체력</button></div>' +
      '<div class="eg"><span class="egl">근무</span>' + (d.off ? "" : '<button type="button" class="mini editatt">근태</button>') + '<button type="button" class="mini editpres">상태</button><button type="button" class="mini editseat">자리</button></div>' +
      (d.ext ? "" : '<div class="eg"><span class="egl">소속</span><button type="button" class="mini editmove">전출</button></div>') + "</div>" : "") +
    '<div class="attline' + (off ? " off" : "") + '">근태 · ' + esc(attText(d)) + "</div>" +
    (snackNow()[uOf(d)] ? '<div class="snkline">🍪 우리 팀 간식 당번 · ~' + md(snackNow()[uOf(d)].to) + " · " + esc(snackNow()[uOf(d)].items.join(", ")) + "</div>" : "") +
    (canEdit ? jobEditor(d) + nickEditor(d) + titleEditor(d) + skillEditor(d) + statEditor(d) + healthEditor(d) + presEditor(d) + attEditor(d) + (d.ext ? "" : moveEditor(d)) + seatEditor(d) : "") +
    '<div class="tasks"><div class="mlabel">맡은 업무<b id="tcount"></b></div><ul class="tlist" id="tlist"></ul>' +
    (canEdit ? '<div class="jrow"><input id="tin" type="text" maxlength="60" placeholder="업무 추가 (Enter)" aria-label="업무 내용"><button type="button" class="tadd">추가</button></div>' : "") +
    '<div class="jstatus" id="tstatus" role="status"></div></div>' +
    '<div class="stats">' + stats + "</div>" +
    (skl(d).k ? '<div class="skill"><div class="sl">고유 스킬</div><div class="sk">' + esc(skl(d).k) + "</div>" + (skl(d).kd ? "<p>" + esc(skl(d).kd) + "</p>" : "") + "</div>" : "") +
    (skl(d).q ? '<p class="quote">“' + esc(skl(d).q) + "”</p>" : "") +
    (mates ? '<div class="mlabel">같은 유니버스 동료</div><div class="mates">' + mates + "</div>" : "") +
    "</div>";
  var veil = document.getElementById("veil");
  openIdx = i;
  renderTasks();
  veil.hidden = false;
  document.documentElement.style.overflow = "hidden";
  sheet.querySelector(".close").focus();
}
function closeSheet() {
  openIdx = null;
  document.getElementById("veil").hidden = true;
  document.documentElement.style.overflow = "";
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

document.getElementById("portals").addEventListener("click", function (e) {
  var b = e.target.closest(".portal"); if (!b) return;
  state.uni = state.uni === b.dataset.u ? null : b.dataset.u;
  renderPortals(); renderGrid();
});
document.getElementById("sides").addEventListener("click", function (e) {
  var b = e.target.closest(".side"); if (!b) return;
  state.side = b.dataset.s || null;
  if (state.uni && state.side && UNI[state.uni].side !== state.side) state.uni = null;
  renderPortals(); renderGrid();
});
document.getElementById("all").addEventListener("click", function () { state.uni = null; renderPortals(); renderGrid(); });
document.getElementById("q").addEventListener("input", function (e) { state.q = e.target.value; renderGrid(); });
document.getElementById("sort").addEventListener("change", function (e) { state.sort = e.target.value; renderGrid(); });
document.getElementById("grid").addEventListener("click", function (e) {
  var c = e.target.closest(".card"); if (c) openSheet(+c.dataset.i, c);
});
document.getElementById("veil").addEventListener("click", function (e) {
  if (e.target.id === "veil" || e.target.closest(".close")) { closeSheet(); return; }
  var inp = document.getElementById("jobin");
  if (e.target.closest(".editjob")) {
    var ed = showPanel("jobpanel");
    if (!ed.hidden) {
      inp.value = job(DATA[openIdx]);
      ed.querySelector(".jstatus").textContent = dbRef ? "" : "지금은 이 화면에서만 바뀌고, 다른 팀원에게는 보이지 않아요.";
      inp.focus(); inp.select();
    }
    return;
  }
  if (e.target.closest(".edittitle")) { var tp = showPanel("titlepanel"); if (!tp.hidden) { var ti = document.getElementById("titin"); ti.value = ttl(DATA[openIdx]); ti.focus(); ti.select(); } return; }
  var trc = e.target.closest(".trec"); if (trc) { document.getElementById("titin").value = trc.textContent; return; }
  if (e.target.closest(".tisave")) { saveTitle(openIdx, document.getElementById("titin").value); return; }
  if (e.target.closest(".tireset")) { saveTitle(openIdx, ""); return; }
  if (e.target.closest(".editnick")) { var np = showPanel("nickpanel"); if (!np.hidden) { var ni2 = document.getElementById("nkin"); ni2.value = DATA[openIdx].n; ni2.focus(); ni2.select(); } return; }
  if (e.target.closest(".nksave")) { saveNick(openIdx, document.getElementById("nkin").value); return; }
  if (e.target.closest(".nkreset")) { saveNick(openIdx, ""); return; }
  if (e.target.closest(".editskill")) { var sp = showPanel("skillpanel"); if (!sp.hidden) { var sk = skl(DATA[openIdx]); document.getElementById("skk").value = sk.k; document.getElementById("skkd").value = sk.kd; document.getElementById("skq").value = sk.q; document.getElementById("skk").focus(); } return; }
  if (e.target.closest(".sksave")) { saveSkill(openIdx, false); return; }
  if (e.target.closest(".skreset")) { saveSkill(openIdx, true); return; }
  if (e.target.closest(".editstat")) { showPanel("statpanel"); return; }
  if (e.target.closest(".edithp")) { var hp = showPanel("healthpanel"); if (!hp.hidden) { document.getElementById("healthinput").value = healthOf(DATA[openIdx]); document.getElementById("healthinput").focus(); } return; }
  if (e.target.closest(".editpres")) { showPanel("prespanel"); return; }
  if (e.target.closest(".otbtn")) { saveOT(openIdx); return; }
  var prb = e.target.closest(".pr"); if (prb) { savePres(openIdx, prb.dataset.s); return; }
  if (e.target.closest(".stsave")) {
    var rs = document.querySelectorAll("#statpanel .strng"), arr = [], k2;
    for (k2 = 0; k2 < rs.length; k2++) arr.push(+rs[k2].value);
    saveStats(openIdx, arr); return;
  }
  if (e.target.closest(".streset")) { saveStats(openIdx, null); return; }
  if (e.target.closest(".hpsave")) { saveHealth(openIdx, document.getElementById("healthinput").value); return; }
  if (e.target.closest(".hpreset")) { saveHealth(openIdx, null); return; }
  if (e.target.closest(".editatt")) { var ep = showPanel("attpanel"); if (!ep.hidden) syncAtt(DATA[openIdx]); return; }
  if (e.target.closest(".editmove")) { showPanel("movepanel"); return; }
  if (e.target.closest(".editseat")) { showPanel("seatpanel"); return; }
  var swb = e.target.closest(".sw"); if (swb) { if (!swb.disabled) saveSeat(openIdx, +swb.dataset.s); return; }
  if (e.target.closest(".sreset")) { resetSeat(openIdx); return; }
  var ab = e.target.closest(".att");
  if (ab) { setAtt(ab.dataset.a); return; }
  if (e.target.closest(".asave")) { saveLeave(openIdx, attMode() === "off"); return; }
  var mvb = e.target.closest(".mv");
  if (mvb && !mvb.disabled) { saveMove(openIdx, mvb.dataset.u); return; }
  if (e.target.closest(".mreset")) { saveMove(openIdx, ""); return; }
  var rc = e.target.closest(".rec");
  if (rc) { inp.value = rc.textContent; inp.focus(); return; }
  if (e.target.closest(".jsave")) { saveJob(openIdx, inp.value); return; }
  if (e.target.closest(".jreset")) { saveJob(openIdx, ""); return; }
  if (e.target.closest(".jcancel")) { hideEditor(); return; }
  if (e.target.closest(".tadd")) { addTask(document.getElementById("tin").value); return; }
  var tdl = e.target.closest(".tdel"); if (tdl) { delTask(tdl.dataset.t); return; }
  var m = e.target.closest(".mates button"); if (m) openSheet(+m.dataset.i, null);
});
document.getElementById("veil").addEventListener("input", function (e) {
  if (e.target.classList && e.target.classList.contains("strng")) e.target.nextElementSibling.textContent = e.target.value;
});
document.getElementById("veil").addEventListener("change", function (e) {
  if (e.target.classList && e.target.classList.contains("tchk") && openIdx !== null) toggleTask(e.target.dataset.t, e.target.checked);
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target.id === "jobin" && openIdx !== null) { e.preventDefault(); saveJob(openIdx, e.target.value); return; }
  if (e.key === "Enter" && !e.isComposing && e.target.id === "nkin" && openIdx !== null) { e.preventDefault(); saveNick(openIdx, e.target.value); return; }
  if (e.key === "Enter" && !e.isComposing && (e.target.id === "skk" || e.target.id === "skkd" || e.target.id === "skq") && openIdx !== null) { e.preventDefault(); saveSkill(openIdx, false); return; }
  if (e.key === "Enter" && e.target.id === "titin" && openIdx !== null) { e.preventDefault(); saveTitle(openIdx, e.target.value); return; }
  if (e.key === "Enter" && e.target.id === "tin" && openIdx !== null) { e.preventDefault(); addTask(e.target.value); return; }
  if (e.key === "Escape" && !document.getElementById("veil").hidden) closeSheet();
});

document.getElementById("total").textContent = DATA.length;
renderPortals();
renderGrid();

/* ---- world map: 실제 좌석 배치도를 따른 사무실 ---- */
var MAP_W = 1200, MAP_H = 970, CW = 28, CH = 40, IW = 22, IH = 16;
var OX = 40, OY = 56, CELLW = 110, ROWH = 104, LOWER_Y = 700, LANE = 690;
var AX = OX + 3 * CELLW + CELLW / 2 - CW / 2, EDGE = 940;
var mapEl = document.getElementById("map"), mctx = mapEl.getContext("2d");
mctx.imageSmoothingEnabled = false;
var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

var SEATS = [], SEATBY = {};
for (var row = 0; row < 7; row++) for (var col = 0; col < 7; col++) {
  var idx = row * 7 + col, cx = 100 + col * 120, ry = 62 + row * 85;
  var kind = idx === 7 || idx === 8 ? "pc" : "person", nm = idx === 7 ? "ftp" : idx === 8 ? "ER" : "";
  var s = { idx: idx, cx: cx, ry: ry, x: cx - CW / 2, y: ry + 6, kind: kind, n: nm, col: col, row: row };
  SEATS.push(s);
}

/* 좌석 선택: store.seats.main.m = { 사람id: 좌석번호 } */
var LEAD = "#ff2bd6", SEATNOW = {};
function computeSeatNow() {
  var ov = store.seats && store.seats.main && store.seats.main.m && typeof store.seats.main.m === "object" ? store.seats.main.m : {}, taken = {}, visit = WORLD_THEME === "office" && bossVisitOn();
  SEATNOW = {};
  DATA.forEach(function (d) {
    if (visit && !shouldSitAtDesk(d)) return;
    var idx = ov[jobId(d)], s = typeof idx === "number" ? SEATS[idx] : null;
    if (s && s.kind === "person" && !taken[s.idx]) { taken[s.idx] = 1; SEATNOW[jobId(d)] = s; }
  });
  if (visit) DATA.forEach(function (d) {
    if (!shouldSitAtDesk(d) || SEATNOW[jobId(d)]) return;
    var seat = null;
    SEATS.forEach(function (candidate) { if (!seat && candidate.kind === "person" && !taken[candidate.idx]) seat = candidate; });
    if (seat) { taken[seat.idx] = 1; SEATNOW[jobId(d)] = seat; }
  });
}
computeSeatNow();

var REGIONS = {};
PSLOTS.forEach(function (u, i) { REGIONS[u] = { x: 40 + i * 296, y: 742, w: 288, h: 210 }; });
var MEET = { x: 948, y: 10, w: 240, h: 690 };
var TABLES = [0, 1, 2].map(function (i) { return { x: MEET.x + MEET.w / 2, y: 150 + i * 210 }; });
var TH = {
  dark:  { bg: "#0a0d1a", floor: "#10152e", carpet: "#151b3d", line: "#2a3254", muted: "#9299bb", text: "#eaedfb", ls: "#0a0d1a", lf: "#eaedfb", lg: "#a2a8bf", arrow: "#f4c95d", night: 0.42,
    office: { wood1: "#1d2340", wood2: "#20284a", seam: "#0a0d1a", glass: "#141c3a", sky2: "#232d57", win: "#f4c95d", frame: "#3a4470", neon: "#ff5fd2", rug1: "#2a2f63", rug2: "#6f7bd6", rug3: "#3a2a58", leaf1: "#2f8f5b", leaf2: "#4fc17f", sofa1: "#5b6cff", sofa2: "#ff8a5c", tableTop: "#7c86b3", bar1: "#2a3160", bar2: "#4b5599", stool: "#8a94c8" } },
  light: { bg: "#dfe3f3", floor: "#f6f7fd", carpet: "#e9ecf8", line: "#b9c1e0", muted: "#5a6490", text: "#1b2040", ls: "#f6f7fd", lf: "#1b2040", lg: "#5f6890", arrow: "#b87900", night: 0,
    office: { wood1: "#f2e6d4", wood2: "#ecddc6", seam: "#b89a74", glass: "#cfe3f5", sky2: "#a9c5e2", win: "#ffffff", frame: "#8a7b68", neon: "#e0359f", rug1: "#dbe3f7", rug2: "#5d78d6", rug3: "#f5d6cf", leaf1: "#3f9a63", leaf2: "#66c98a", sofa1: "#5b6cff", sofa2: "#ff8a5c", tableTop: "#c9b79b", bar1: "#d9c7a8", bar2: "#b89a74", stool: "#8a7b68" } }
};
var T = TH[document.documentElement.getAttribute("data-ops-theme")] || TH.dark;
var UC = {};
function resolveColor(v) {
  var m = /var\((--[\w-]+)\)/.exec(v);
  return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() : v;
}
function ucol(u) { return UC[u] || (UC[u] = resolveColor(UNI[u].color)); }

function building(c, kind, cx, y, col) {
  var dk = "#0b0e1c", gold = "#f4c95d";
  function R(x, yy, w, h, f, a) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = f; c.fillRect(cx + x, y + yy, w, h); }
  R(-18, 12, 36, 12, col); R(-14, 6, 28, 6, col); R(-2, -2, 2, 8, gold); R(0, -2, 10, 5, gold); R(-4, 16, 8, 8, dk);
  c.globalAlpha = 1;
}
function fit(c, t, w) {
  t = String(t);
  if (c.measureText(t).width <= w) return t;
  while (t.length > 1 && c.measureText(t + "…").width > w) t = t.slice(0, -1);
  return t + "…";
}

var SHD = {};
var bg = document.createElement("canvas");
bg.width = MAP_W; bg.height = MAP_H;
function paintFrame(c, g, col, key, empty) {
  var rr = rng(hash(key)), tx, ty, q, k = empty ? 0.45 : 1;
  for (ty = 0; ty < g.h; ty += 16) for (tx = 0; tx < g.w; tx += 16) {
    c.globalAlpha = (((tx + ty) / 16) % 2 ? 0.07 : 0.13) * k; c.fillStyle = col;
    c.fillRect(g.x + tx, g.y + ty, Math.min(16, g.w - tx), Math.min(16, g.h - ty));
  }
  c.globalAlpha = 0.28 * k; c.fillStyle = col; c.fillRect(g.x, g.y, g.w, 22);
  c.globalAlpha = empty ? 0.6 : 0.9; c.strokeStyle = col; c.lineWidth = 2;
  if (empty && c.setLineDash) c.setLineDash([6, 5]);
  c.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
  if (c.setLineDash) c.setLineDash([]);
  if (!empty) for (q = 0; q < 12; q++) { c.globalAlpha = 0.3; c.fillStyle = col; c.fillRect(g.x + 8 + Math.floor(rr() * (g.w - 20)), g.y + 62 + Math.floor(rr() * (g.h - 78)), 2, 2); }
  c.globalAlpha = 1;
}
function seatXY(col, row) { return [OX + col * CELLW + CELLW / 2, OY + row * ROWH]; }
var FIELD = { g1: "#5d9a4a", g2: "#559243", tuft: "#3f7a34", tuft2: "#7fbe66", dirt: "#a98358", dirt2: "#96724a", dirtD: "#6f5236", stone: "#a3a9b1", stoneD: "#6f7680",
  trunk: "#6b4426", pine1: "#2d6b3a", pine2: "#3f8f4f", pineD: "#1f4f2b", mount1: "#7c8fa6", mount2: "#a9bccf", snow: "#f2f6fb",
  wood: "#8b5e3c", woodD: "#5e3e26", woodL: "#b98a5a", thatch: "#cfae5c", thatch2: "#a98a3f", canvas: "#e8dcc0", hide: "#8a5a44", parch: "#ecdca8" };
var FIRES = [], TORCHES = [];
function pine(c, x, by, h) {
  var F = FIELD, w = Math.round(h * 0.62), k;
  c.fillStyle = F.trunk; c.fillRect(x - 2, by - 6, 4, 6);
  for (k = 0; k < 3; k++) {
    var ty = by - 6 - k * h * 0.26, ww = w - k * w * 0.26;
    c.fillStyle = k % 2 ? F.pine2 : F.pine1;
    c.beginPath(); c.moveTo(x, ty - h * 0.42); c.lineTo(x + ww / 2, ty); c.lineTo(x - ww / 2, ty); c.closePath(); c.fill();
  }
  c.fillStyle = F.pineD; c.globalAlpha = 0.35; c.fillRect(x + 1, by - 8, 2, 4); c.globalAlpha = 1;
}
function tent(c, cx, by, w, h, col) {
  var F = FIELD;
  c.fillStyle = col; c.beginPath(); c.moveTo(cx, by - h); c.lineTo(cx + w / 2, by); c.lineTo(cx - w / 2, by); c.closePath(); c.fill();
  c.fillStyle = "#000"; c.globalAlpha = 0.22; c.beginPath(); c.moveTo(cx, by - h); c.lineTo(cx + w / 2, by); c.lineTo(cx + 2, by); c.closePath(); c.fill(); c.globalAlpha = 1;
  c.fillStyle = F.woodD; c.beginPath(); c.moveTo(cx, by - h * 0.55); c.lineTo(cx + w * 0.13, by); c.lineTo(cx - w * 0.13, by); c.closePath(); c.fill();
  c.fillStyle = F.woodD; c.fillRect(cx - 1, by - h - 8, 2, 9);
  c.fillStyle = "#e5283c"; c.fillRect(cx + 1, by - h - 8, 8, 5);
}
function banner(c, x, y, col) {
  var F = FIELD;
  c.fillStyle = F.woodD; c.fillRect(x, y, 3, 48); c.fillStyle = F.woodL; c.fillRect(x - 1, y - 2, 5, 3);
  c.fillStyle = col; c.fillRect(x + 3, y + 2, 20, 18); c.beginPath(); c.moveTo(x + 3, y + 20); c.lineTo(x + 13, y + 26); c.lineTo(x + 23, y + 20); c.closePath(); c.fill();
  c.fillStyle = "#f4c95d"; c.fillRect(x + 10, y + 7, 6, 6);
}
function rock(c, x, y, w, h) {
  var F = FIELD;
  c.fillStyle = F.stoneD; c.fillRect(x, y + h * 0.3, w, h * 0.7); c.fillStyle = F.stone; c.fillRect(x + 2, y, w - 6, h * 0.6); c.fillStyle = "#fff"; c.globalAlpha = 0.25; c.fillRect(x + 4, y + 1, w * 0.3, 2); c.globalAlpha = 1;
}
function crate(c, x, y, s) {
  var F = FIELD;
  c.fillStyle = F.wood; c.fillRect(x, y, s, s); c.strokeStyle = F.woodD; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, s - 2, s - 2);
  c.beginPath(); c.moveTo(x + 2, y + 2); c.lineTo(x + s - 2, y + s - 2); c.moveTo(x + s - 2, y + 2); c.lineTo(x + 2, y + s - 2); c.stroke();
}
function dummy(c, x, y) {
  var F = FIELD;
  c.fillStyle = F.woodD; c.fillRect(x - 2, y - 10, 4, 34); c.fillRect(x - 14, y, 28, 4);
  c.fillStyle = F.thatch; c.fillRect(x - 9, y - 22, 18, 22); c.fillStyle = F.thatch2; c.fillRect(x - 9, y - 12, 18, 3);
  c.fillStyle = F.canvas; c.fillRect(x - 6, y - 32, 12, 10); c.fillStyle = "#e5283c"; c.fillRect(x - 3, y - 29, 6, 2);
  c.fillStyle = F.woodD; c.fillRect(x - 6, y + 24, 12, 3);
}
function campfireBase(c, x, y) {
  var F = FIELD, a;
  for (a = 0; a < 6.28; a += 0.8) { c.fillStyle = F.stoneD; c.fillRect(Math.round(x + Math.cos(a) * 13) - 3, Math.round(y + Math.sin(a) * 6) - 2, 6, 5); c.fillStyle = F.stone; c.fillRect(Math.round(x + Math.cos(a) * 13) - 3, Math.round(y + Math.sin(a) * 6) - 2, 6, 2); }
  c.fillStyle = "#2a1a10"; c.fillRect(x - 10, y - 2, 20, 4); c.fillStyle = F.woodD; c.fillRect(x - 8, y - 4, 16, 3);
  c.fillStyle = F.wood; c.fillRect(x - 24, y + 10, 12, 5); c.fillRect(x + 12, y + 10, 12, 5);
}
function dirtPatch(c, rr, x, y, w, h) {
  var F = FIELD, k;
  c.fillStyle = F.dirt; c.fillRect(x, y, w, h); c.fillStyle = F.dirt2;
  for (k = 0; k < w * h / 240; k++) c.fillRect(x + Math.floor(rr() * (w - 3)), y + Math.floor(rr() * (h - 2)), 3, 2);
  c.fillStyle = F.dirtD; c.globalAlpha = 0.45; c.fillRect(x, y, w, 2); c.fillRect(x, y + h - 2, w, 2); c.globalAlpha = 1;
}
function paintSpaceMap(c) {
  var star = rng(20261001), i, x, y, m = MEET;
  c.fillStyle = "#050917"; c.fillRect(0, 0, MAP_W, MAP_H);
  for (i = 0; i < 300; i++) {
    x = 8 + Math.floor(star() * (MAP_W - 16)); y = 8 + Math.floor(star() * (MAP_H - 16));
    c.fillStyle = star() > 0.78 ? "#8fe8ff" : "#8997c8";
    c.globalAlpha = 0.35 + star() * 0.65; c.fillRect(x, y, star() > 0.86 ? 3 : 2, 2);
  }
  c.globalAlpha = 1;
  c.fillStyle = "#0b1428"; c.fillRect(16, 10, 928, 690);
  c.strokeStyle = "#172949"; c.lineWidth = 1; c.globalAlpha = 0.8;
  for (x = 40; x < 944; x += 48) { c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 700); c.stroke(); }
  for (y = 34; y < 700; y += 48) { c.beginPath(); c.moveTo(16, y); c.lineTo(944, y); c.stroke(); }
  c.globalAlpha = 1;

  c.setLineDash([8, 7]); c.strokeStyle = "#39658b"; c.lineWidth = 2;
  c.beginPath(); c.ellipse(454, 350, 332, 230, -0.2, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(454, 350, 210, 146, 0.35, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);

  c.fillStyle = "#122237"; c.fillRect(300, 246, 302, 31);
  c.fillStyle = "#28465d"; c.fillRect(300, 274, 302, 2);
  c.fillStyle = "#a8efff"; c.font = "700 13px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
  c.fillText("성계 주둔지", 451, 266);

  var stationX = 451, stationY = 365;
  c.save();
  c.fillStyle = "#101c2e"; c.beginPath();
  c.moveTo(278, 346); c.lineTo(313, 320); c.lineTo(371, 316); c.lineTo(410, 329); c.lineTo(451, 306);
  c.lineTo(493, 329); c.lineTo(535, 316); c.lineTo(591, 322); c.lineTo(624, 347);
  c.lineTo(610, 385); c.lineTo(560, 399); c.lineTo(512, 398); c.lineTo(451, 430);
  c.lineTo(392, 398); c.lineTo(342, 400); c.lineTo(294, 384); c.closePath(); c.fill();
  c.strokeStyle = "#527c91"; c.lineWidth = 2; c.stroke();

  c.globalAlpha = 0.6; c.strokeStyle = "#52bfd1"; c.lineWidth = 2;
  c.beginPath(); c.ellipse(stationX, stationY, 151, 52, 0, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 0.32; c.lineWidth = 1;
  c.beginPath(); c.ellipse(stationX, stationY, 133, 43, 0, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 1;

  c.lineCap = "round"; c.lineWidth = 17; c.strokeStyle = "#263f57";
  [[stationX - 34, stationY - 8, 320, 357], [stationX + 34, stationY - 8, 582, 357], [stationX, stationY + 28, stationX, 414]].forEach(function (arm) {
    c.beginPath(); c.moveTo(arm[0], arm[1]); c.lineTo(arm[2], arm[3]); c.stroke();
  });
  c.lineWidth = 3; c.strokeStyle = "#62d3df";
  [[stationX - 34, stationY - 8, 320, 357], [stationX + 34, stationY - 8, 582, 357], [stationX, stationY + 28, stationX, 414]].forEach(function (arm) {
    c.beginPath(); c.moveTo(arm[0], arm[1]); c.lineTo(arm[2], arm[3]); c.stroke();
  });

  [[292, 337], [592, 337], [438, 414]].forEach(function (dock) {
    c.fillStyle = "#172b42"; c.fillRect(dock[0], dock[1], 40, 34);
    c.strokeStyle = "#7fd9e4"; c.lineWidth = 2; c.strokeRect(dock[0] + 1, dock[1] + 1, 38, 32);
    c.fillStyle = "#3f9aae"; c.fillRect(dock[0] + 7, dock[1] + 6, 26, 3);
    c.fillStyle = "#284c65"; c.fillRect(dock[0] + 7, dock[1] + 14, 26, 13);
  });

  c.fillStyle = "#0b1524"; c.beginPath(); c.arc(stationX, stationY, 39, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#94e8ed"; c.lineWidth = 3; c.stroke();
  c.fillStyle = "#1b5368"; c.beginPath(); c.arc(stationX, stationY, 28, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#65d5e2"; c.lineWidth = 2; c.stroke();
  c.fillStyle = "#b9f4f3"; c.beginPath(); c.arc(stationX, stationY, 12, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e5ffff"; c.fillRect(stationX - 2, stationY - 20, 4, 40); c.fillRect(stationX - 20, stationY - 2, 40, 4);
  c.restore();
  c.textAlign = "left";

  c.fillStyle = "#0a1226"; c.fillRect(m.x, m.y, m.w, m.h);
  c.strokeStyle = "#54c7e8"; c.lineWidth = 2; c.strokeRect(m.x + 2, m.y + 2, m.w - 4, m.h - 4);
  c.fillStyle = "#152744"; c.fillRect(m.x + 14, m.y + 14, m.w - 28, 38);
  c.fillStyle = "#23496a"; c.fillRect(m.x + 14, m.y + 50, m.w - 28, 2);
  c.fillStyle = "#a8efff"; c.font = "700 12px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
  c.fillText("우주 관제소", m.x + m.w / 2, m.y + 39);
  c.fillStyle = "#101d36"; c.fillRect(m.x + 18, m.y + 68, m.w - 36, m.h - 88);
  c.strokeStyle = "#284a70"; c.lineWidth = 1; c.strokeRect(m.x + 19, m.y + 69, m.w - 38, m.h - 90);
  c.fillStyle = "#263e64"; c.fillRect(m.x + 32, m.y + 82, m.w - 64, 8);
  c.fillStyle = "#4ac6e5"; c.fillRect(m.x + 32, m.y + 108, 4, 440); c.fillRect(m.x + m.w - 36, m.y + 108, 4, 440);
  c.fillStyle = "#75d8ed"; c.beginPath(); c.moveTo(m.x + 64, m.y + 220); c.lineTo(m.x + 120, m.y + 190); c.lineTo(m.x + 176, m.y + 220); c.lineTo(m.x + 120, m.y + 250); c.closePath(); c.fill();
  c.fillStyle = "#dffaff"; c.fillRect(m.x + 111, m.y + 209, 18, 22);
  c.textAlign = "left";

  c.fillStyle = "#091225"; c.fillRect(16, 716, 928, 242);
  c.strokeStyle = "#284567"; c.strokeRect(16, 716, 928, 242);
  c.fillStyle = "#d8f8ff"; c.font = "700 13px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.fillText("우주항", 32, 740);
  Object.keys(REGIONS).forEach(function (u) {
    var g = REGIONS[u], color = ucol(u), empty = UNI[u].hidden;
    c.fillStyle = empty ? "#111b31" : "#142640"; c.fillRect(g.x, g.y, g.w, g.h);
    c.strokeStyle = empty ? "#64748b" : color; c.lineWidth = 2; c.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
    c.fillStyle = color; c.fillRect(g.x + 8, g.y + 10, g.w - 16, 4);
    c.fillStyle = empty ? "#8391aa" : "#233d5e"; c.fillRect(g.x + 24, g.y + 46, g.w - 48, g.h - 76);
    c.fillStyle = color; c.fillRect(g.x + g.w / 2 - 20, g.y + 84, 40, 24); c.fillRect(g.x + g.w / 2 - 30, g.y + 94, 60, 8);
    c.fillStyle = "#d8f8ff"; c.font = "700 11px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
    c.fillText(empty ? "미개척 행성" : fit(c, UNI[u].realm, g.w - 12), g.x + g.w / 2, g.y + 34);
  });
  c.textAlign = "left"; c.globalAlpha = 1;
}
function paintOfficeMap(c) {
  var x, y, k, m = MEET, rooms = [];
  c.fillStyle = "#211d1a"; c.fillRect(0, 0, MAP_W, MAP_H);
  c.fillStyle = "#34302c"; c.fillRect(16, 10, 928, 690);
  for (y = 10; y < 700; y += 40) {
    c.fillStyle = y % 80 ? "#38332f" : "#3b3632"; c.fillRect(16, y, 928, 39);
    c.strokeStyle = "#302b28"; c.lineWidth = 1; c.beginPath(); c.moveTo(16, y + 39); c.lineTo(944, y + 39); c.stroke();
    for (x = 16 + (y % 80 ? 0 : 58); x < 944; x += 116) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 39); c.stroke(); }
  }
  c.fillStyle = "#242a2a"; c.fillRect(16, 10, 928, 34); c.fillRect(16, 668, 928, 32);
  c.fillStyle = "#586360"; c.fillRect(26, 16, 908, 3); c.fillRect(26, 674, 908, 3);
  for (x = 38; x < 920; x += 112) {
    c.fillStyle = "#1a2425"; c.fillRect(x, 20, 94, 19);
    c.fillStyle = "#5b8586"; c.fillRect(x + 3, 22, 88, 14);
    c.fillStyle = "#d7e5d9"; c.globalAlpha = 0.24; c.fillRect(x + 6, 23, 37, 2); c.globalAlpha = 1;
  }
  c.fillStyle = "#282522"; c.fillRect(30, 48, 900, 606);
  c.fillStyle = "#45403b"; c.fillRect(34, 52, 892, 598);
  c.fillStyle = "#403a35"; c.globalAlpha = 0.65;
  for (x = 34; x < 926; x += 60) c.fillRect(x, 52, 1, 598);
  c.globalAlpha = 1;
  c.fillStyle = "#282522";
  SEATS.forEach(function (s) {
    var left = s.cx - 45, top = s.ry + 4;
    c.fillRect(left, top, 90, 4);
    c.fillRect(left, top, 3, 30);
    c.fillRect(left + 87, top, 3, 30);
    if (s.kind === "person") { c.fillStyle = "#77736d"; c.fillRect(s.cx - 10, s.ry + 65, 20, 6); c.fillRect(s.cx - 2, s.ry + 71, 4, 6); }
    c.fillStyle = "#282522";
  });
  c.fillStyle = "#292d2c"; c.fillRect(m.x, m.y, m.w, m.h);
  c.fillStyle = "#141a1b"; c.fillRect(m.x + 3, m.y + 3, m.w - 6, m.h - 6);
  c.strokeStyle = "#8d9994"; c.lineWidth = 2;
  for (k = 0; k < 3; k++) {
    var room = { x: m.x + 8, y: 64 + k * 210, w: m.w - 16, h: 186 };
    rooms.push(room);
    c.fillStyle = "#4b504e"; c.fillRect(room.x, room.y, room.w, room.h);
    c.strokeRect(room.x + 1, room.y + 1, room.w - 2, room.h - 2);
    c.fillStyle = "#262c2d"; c.fillRect(room.x + 5, room.y + 5, room.w - 10, room.h - 10);
    c.fillStyle = "#78908f"; c.fillRect(room.x + 12, room.y + 8, room.w - 24, 3);
    c.fillStyle = "#192122"; c.fillRect(room.x + room.w - 38, room.y + room.h - 5, 26, 8);
    c.fillStyle = "#d7ded7"; c.font = "700 10px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "left";
    c.fillText("회의실 0" + (k + 1), room.x + 12, room.y + 26);
    var table = TABLES[k];
    c.fillStyle = "#c9c2b7";
    c.fillRect(table.x - 47, table.y - 8, 14, 16); c.fillRect(table.x + 33, table.y - 8, 14, 16);
    c.fillRect(table.x - 8, table.y - 32, 16, 12); c.fillRect(table.x - 8, table.y + 20, 16, 12);
  }
  c.fillStyle = "#201d1a"; c.fillRect(16, 716, 928, 242);
  c.fillStyle = "#3d3732"; c.fillRect(24, 724, 912, 226);
  c.strokeStyle = "#77736d"; c.lineWidth = 2; c.strokeRect(24, 724, 912, 226);
  c.fillStyle = "#e5e1da"; c.font = "700 13px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "left";
  c.fillText("프로젝트 팀 워크존", 34, 744);
  Object.keys(REGIONS).forEach(function (u) {
    var g = REGIONS[u], color = ucol(u), empty = UNI[u].hidden;
    c.fillStyle = empty ? "#33302d" : "#4b4540"; c.fillRect(g.x, g.y, g.w, g.h);
    c.strokeStyle = empty ? "#76736d" : color; c.lineWidth = 2; c.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
    c.fillStyle = color; c.fillRect(g.x + 8, g.y + 10, g.w - 16, 4);
    c.fillStyle = "#e0ddd6"; c.font = "700 11px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
    c.fillText(empty ? "비어 있음" : fit(c, UNI[u].realm, g.w - 12), g.x + g.w / 2, g.y + 34);
  });
  c.fillStyle = "#e5e1da"; c.font = "700 13px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "left";
  c.fillText("사무실", 32, 64); c.textAlign = "left";
}
function paintMap() {
  var c = bg.getContext("2d"), F = FIELD, tx, ty, i, k, rr = rng(7), late = [], m = MEET, fx = 16, fy = 10, fw = 928, fh = 690;
  c.imageSmoothingEnabled = false; c.globalAlpha = 1;
  FIRES = []; TORCHES = [];
  if (WORLD_THEME === "office") { paintOfficeMap(c); return; }
  if (WORLD_THEME === "space") { paintSpaceMap(c); return; }
  c.fillStyle = T.bg; c.fillRect(0, 0, MAP_W, MAP_H);
  /* 전장 바닥: 풀밭 */
  for (ty = fy; ty < fy + fh; ty += 22) for (tx = fx; tx < fx + fw; tx += 22) { c.fillStyle = ((tx - fx) / 22 + (ty - fy) / 22) % 2 ? F.g1 : F.g2; c.fillRect(tx, ty, 22, Math.min(22, fy + fh - ty)); }
  for (i = 0; i < 480; i++) {
    var gx = fx + 6 + Math.floor(rr() * (fw - 12)), gy = fy + 70 + Math.floor(rr() * (fh - 74));
    c.fillStyle = rr() < 0.5 ? F.tuft : F.tuft2; c.fillRect(gx, gy, 2, 4); c.fillRect(gx + 3, gy + 1, 2, 3); c.fillRect(gx - 3, gy + 1, 2, 3);
  }
  /* 흙길: 막사로 가는 길, 야영지로 내려가는 길 */
  dirtPatch(c, rr, 640, 335, 304, 34); dirtPatch(c, rr, 430, 440, 44, 260);
  /* 중앙 결투장 */
  c.fillStyle = F.dirt; c.beginPath(); c.ellipse(450, 330, 200, 115, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = F.dirt2; for (k = 0; k < 160; k++) { var ax = 450 + (rr() - 0.5) * 380, ay = 330 + (rr() - 0.5) * 210; if (Math.pow((ax - 450) / 195, 2) + Math.pow((ay - 330) / 110, 2) < 1) c.fillRect(Math.round(ax), Math.round(ay), 3, 2); }
  for (k = 0; k < 6.28; k += 0.1) { var sx = Math.round(450 + Math.cos(k) * 203), sy = Math.round(330 + Math.sin(k) * 118); c.fillStyle = F.stoneD; c.fillRect(sx - 3, sy - 2, 7, 6); c.fillStyle = F.stone; c.fillRect(sx - 3, sy - 2, 7, 3); }
  c.strokeStyle = F.dirtD; c.globalAlpha = 0.5; c.lineWidth = 2; c.beginPath(); c.ellipse(450, 330, 120, 68, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(450, 262); c.lineTo(450, 398); c.moveTo(330, 330); c.lineTo(570, 330); c.stroke(); c.globalAlpha = 1;
  /* 먼 산과 숲 */
  for (i = 0; i < 14; i++) {
    var mx = fx + i * 68 - 10, mh = 22 + ((i * 5 + 2) % 4) * 6;
    c.fillStyle = F.mount1; c.beginPath(); c.moveTo(mx, fy + 56); c.lineTo(mx + 38, fy + 56 - mh); c.lineTo(mx + 76, fy + 56); c.closePath(); c.fill();
    c.fillStyle = F.snow; c.beginPath(); c.moveTo(mx + 38, fy + 56 - mh); c.lineTo(mx + 47, fy + 56 - mh + 9); c.lineTo(mx + 29, fy + 56 - mh + 9); c.closePath(); c.fill();
  }
  c.fillStyle = F.pineD; c.fillRect(fx, fy + 52, fw, 14);
  for (i = 0; i < 22; i++) pine(c, fx + 20 + i * 42, fy + 66 + (i % 2) * 4, 36 + (i * 7 % 3) * 8);
  for (i = 0; i < 7; i++) { pine(c, fx + 14, 140 + i * 72, 40); pine(c, fx + fw - 108, 130 + i * 78, 38); }
  /* 깃발, 훈련 허수아비, 바위, 보급품 */
  banner(c, 96, 96, "#d33a3a"); banner(c, 800, 96, "#3a7bd5"); banner(c, 292, 232, "#8a5ad6"); banner(c, 640, 232, "#e0a020");
  dummy(c, 52, 250); dummy(c, 52, 340); dummy(c, 52, 430);
  [[120, 500, 22, 16], [780, 480, 26, 18], [610, 570, 18, 12], [170, 150, 20, 14], [860, 250, 22, 16]].forEach(function (q) { rock(c, q[0], q[1], q[2], q[3]); });
  /* 야영지 (아래쪽): 모닥불, 천막, 보급 */
  campfireBase(c, 250, 640); FIRES.push([250, 640, 1.3]);
  tent(c, 110, 690, 96, 64, "#b8452f"); tent(c, 390, 688, 84, 56, "#3f6fb0");
  crate(c, 560, 664, 22); crate(c, 584, 668, 18); crate(c, 566, 646, 16);
  for (k = 0; k < 4; k++) { c.fillStyle = F.woodD; c.fillRect(640 + k * 12, 650, 2, 40); c.fillStyle = F.stone; c.fillRect(639 + k * 12, 646, 4, 6); }
  c.fillStyle = F.wood; c.fillRect(632, 672, 56, 4); c.fillRect(632, 686, 56, 4);
  for (k = 0; k < 3; k++) { c.fillStyle = F.wood; c.fillRect(730 + k * 26, 660, 20, 26); c.fillStyle = F.woodD; c.fillRect(730 + k * 26, 666, 20, 3); c.fillRect(730 + k * 26, 678, 20, 3); }
  c.fillStyle = F.woodD; for (k = 0; k < 18; k++) { c.fillRect(fx + 6 + k * 50, 694, 3, 8); }
  c.fillRect(fx + 4, 696, fw - 8, 3);
  /* 작전 막사 (움막) */
  for (ty = m.y; ty < m.y + m.h; ty += 16) { c.fillStyle = ((ty - m.y) / 16) % 2 ? "#6b4a2e" : "#74512f"; c.fillRect(m.x, ty, m.w, 16); c.fillStyle = "#3f2a1a"; c.fillRect(m.x, ty, m.w, 1); }
  c.fillStyle = F.hide; c.fillRect(m.x + 26, m.y + 116, m.w - 52, m.h - 160);
  c.fillStyle = "#6d4432"; for (k = 0; k < 40; k++) c.fillRect(m.x + 30 + Math.floor(rr() * (m.w - 66)), m.y + 120 + Math.floor(rr() * (m.h - 168)), 4, 2);
  c.strokeStyle = F.woodD; c.lineWidth = 2; if (c.setLineDash) c.setLineDash([5, 4]); c.strokeRect(m.x + 26, m.y + 116, m.w - 52, m.h - 160); if (c.setLineDash) c.setLineDash([]);
  c.fillStyle = F.thatch; c.fillRect(m.x, m.y, m.w, 46);
  for (k = 0; k < m.w; k += 8) { c.fillStyle = F.thatch2; c.fillRect(m.x + k, m.y + 4 + (k % 16 ? 0 : 6), 2, 30); }
  c.fillStyle = F.thatch; for (k = 0; k < m.w; k += 12) { c.beginPath(); c.moveTo(m.x + k, m.y + 46); c.lineTo(m.x + k + 12, m.y + 46); c.lineTo(m.x + k + 6, m.y + 56); c.closePath(); c.fill(); }
  c.fillStyle = F.woodD; c.fillRect(m.x, m.y + 44, m.w, 4);
  c.fillStyle = F.parch; c.fillRect(m.x + 44, m.y + 66, m.w - 88, 46); c.strokeStyle = F.woodD; c.lineWidth = 2; c.strokeRect(m.x + 44, m.y + 66, m.w - 88, 46);
  c.strokeStyle = "#8a2a20"; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x + 58, m.y + 100); c.lineTo(m.x + 90, m.y + 82); c.lineTo(m.x + 120, m.y + 96); c.lineTo(m.x + 170, m.y + 76); c.stroke();
  c.fillStyle = "#8a2a20"; c.fillRect(m.x + 166, m.y + 72, 8, 8); c.fillStyle = "#2a5a9a"; c.fillRect(m.x + 86, m.y + 78, 6, 6);
  [140, 350, 560].forEach(function (ty2) { [m.x + 12, m.x + m.w - 12].forEach(function (tx2) {
    c.fillStyle = F.woodD; c.fillRect(tx2 - 2, ty2, 4, 30); c.fillStyle = F.woodL; c.fillRect(tx2 - 5, ty2 - 3, 10, 4); TORCHES.push([tx2, ty2 - 4]);
  }); });
  c.fillStyle = F.woodD; c.fillRect(m.x, m.y, 8, m.h); c.fillRect(m.x + m.w - 8, m.y, 8, m.h); c.fillRect(m.x, m.y + m.h - 8, m.w, 8);
  c.fillStyle = F.wood; for (k = 0; k < m.h; k += 20) { c.fillRect(m.x + 1, m.y + k + 2, 6, 16); c.fillRect(m.x + m.w - 7, m.y + k + 2, 6, 16); }
  late.push(function () {
    c.font = "700 12px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
    c.fillStyle = "#2a1a10"; c.fillRect(m.x + m.w / 2 - 40, m.y + 14, 80, 20); c.fillStyle = "#f4dfa8"; c.fillText("작전 막사", m.x + m.w / 2, m.y + 28);
    c.textAlign = "left";
  });
  /* 용병 진영 (프로젝트 팀) */
  c.fillStyle = "#5a4630"; c.fillRect(16, 716, 928, 242);
  for (k = 0; k < 200; k++) { c.fillStyle = k % 2 ? F.dirt2 : F.dirt; c.fillRect(20 + Math.floor(rr() * 920), 720 + Math.floor(rr() * 234), 4, 2); }
  Object.keys(REGIONS).forEach(function (u) {
    var g = REGIONS[u], col = ucol(u), empty = UNI[u].hidden, sx;
    c.fillStyle = F.dirt; c.fillRect(g.x, g.y, g.w, g.h);
    for (k = 0; k < 40; k++) { c.fillStyle = F.dirt2; c.fillRect(g.x + 4 + Math.floor(rr() * (g.w - 10)), g.y + 24 + Math.floor(rr() * (g.h - 30)), 4, 2); }
    if (!empty) { c.globalAlpha = 0.2; c.fillStyle = col; c.fillRect(g.x, g.y, g.w, g.h); c.globalAlpha = 1; }
    for (sx = g.x + 2; sx < g.x + g.w - 6; sx += 10) { c.fillStyle = F.woodD; c.fillRect(sx, g.y - 7, 6, 10); c.fillStyle = F.woodL; c.fillRect(sx, g.y - 7, 6, 2); c.fillRect(sx, g.y + g.h - 3, 6, 6); }
    c.fillStyle = F.woodD; c.fillRect(g.x, g.y, g.w, 22); c.fillRect(g.x, g.y + g.h - 3, g.w, 3); c.fillRect(g.x, g.y, 3, g.h); c.fillRect(g.x + g.w - 3, g.y, 3, g.h);
    if (empty) { c.fillStyle = "#000"; c.globalAlpha = 0.18; c.fillRect(g.x, g.y + 22, g.w, g.h - 22); c.globalAlpha = 1; tent(c, g.x + g.w / 2, g.y + g.h / 2 + 14, 70, 46, "#8f8a80"); }
    else { tent(c, g.x + g.w / 2, g.y + 66, 62, 40, col); campfireBase(c, g.x + g.w - 40, g.y + g.h - 24); FIRES.push([g.x + g.w - 40, g.y + g.h - 24, 0.8]); banner(c, g.x + 16, g.y + 24, col); }
    late.push(function () {
      c.font = "700 12px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textAlign = "center";
      if (empty) { c.fillStyle = "#f4dfa8"; c.fillText("빈 용병 진영", g.x + g.w / 2, g.y + 15); c.font = "500 11px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.fillStyle = "#f2e6c8"; c.fillText("‘용병단’ 탭에서", g.x + g.w / 2, g.y + g.h - 44); c.fillText("용병단을 꾸릴 수 있어요", g.x + g.w / 2, g.y + g.h - 28); }
      else { c.fillStyle = "#f4dfa8"; c.fillText(fit(c, UNI[u].realm, g.w - 14), g.x + g.w / 2, g.y + 15); }
      c.textAlign = "left";
    });
  });
  /* 밤 분위기 (다크 모드) */
  if (T.night) { c.globalAlpha = T.night; c.fillStyle = "#0a1233"; c.fillRect(0, 0, MAP_W, MAP_H); c.globalAlpha = 1; }
  /* 글자 */
  c.font = "700 13px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; c.textBaseline = "alphabetic";
  c.fillStyle = F.woodD; c.fillRect(24, 48, 70, 22); c.fillStyle = F.woodL; c.fillRect(24, 48, 70, 3); c.fillStyle = "#f4dfa8"; c.fillText("⚔ 전장", 34, 64);
  c.fillStyle = "#f4dfa8"; c.fillText("용병 진영", 32, 732);
  late.forEach(function (fn) { fn(); });
  c.globalAlpha = 1;
}
function flame(x, y, s) {
  var t = lastT / 110 + x * 0.3, h = 7 * s + Math.sin(t) * 2 * s + Math.sin(t * 2.3) * 1.5 * s;
  mctx.fillStyle = "#ff7a1a"; mctx.fillRect(Math.round(x - 3 * s), Math.round(y - h), Math.round(6 * s), Math.round(h));
  mctx.fillStyle = "#ffc13b"; mctx.fillRect(Math.round(x - 2 * s), Math.round(y - h * 0.7), Math.round(4 * s), Math.round(h * 0.7));
  mctx.fillStyle = "#fff2b0"; mctx.fillRect(Math.round(x - s), Math.round(y - h * 0.35), Math.round(2 * s), Math.round(h * 0.35));
}
function fireGlow(x, y, r, a) {
  var g = mctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, "rgba(255,170,60," + a + ")"); g.addColorStop(1, "rgba(255,170,60,0)");
  mctx.fillStyle = g; mctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function drumstick(x, y) {
  x = Math.round(x); y = Math.round(y);
  mctx.fillStyle = "#6b3410"; mctx.fillRect(x + 2, y, 8, 7); mctx.fillRect(x + 1, y + 1, 10, 5);
  mctx.fillStyle = "#c9782c"; mctx.fillRect(x + 3, y + 1, 6, 4); mctx.fillStyle = "#eaa54e"; mctx.fillRect(x + 4, y + 1, 3, 1);
  mctx.fillStyle = "#f5efe0"; mctx.fillRect(x - 4, y + 4, 6, 2); mctx.fillRect(x - 5, y + 3, 2, 2); mctx.fillRect(x - 5, y + 6, 2, 2);
}
function spaceMeal(x, y) {
  x = Math.round(x); y = Math.round(y);
  var pulse = 0.7 + 0.3 * Math.sin(lastT / 160);
  mctx.save(); mctx.globalAlpha = 0.9;
  mctx.strokeStyle = "#78e7ef"; mctx.lineWidth = 1;
  mctx.beginPath(); mctx.ellipse(x + 4, y + 7, 12 + pulse * 2, 4, 0, 0, Math.PI * 2); mctx.stroke();
  mctx.fillStyle = "#102c46"; mctx.fillRect(x - 3, y + 1, 14, 11);
  mctx.fillStyle = "#a9f6ee"; mctx.fillRect(x - 1, y + 3, 10, 2);
  mctx.fillStyle = "#47c9df"; mctx.fillRect(x, y + 7, 8, 2);
  mctx.fillStyle = "#dffeff"; mctx.fillRect(x + 3, y - 2, 4, 3);
  mctx.restore();
}
function drawFires() {
  if (LUNCH.n > 0 && WORLD_THEME !== "office") {
    var fl0 = 0.85 + 0.15 * Math.sin(lastT / 120), lx = LUNCH.cx, ly = LUNCH.cy;
    mctx.globalAlpha = 1; fireGlow(lx, ly - 6, 120, (T.night ? 0.5 : 0.28) * fl0);
    mctx.fillStyle = "#3a2414"; mctx.fillRect(lx - 16, ly - 3, 32, 6); mctx.fillStyle = "#5e3e26"; mctx.fillRect(lx - 12, ly - 7, 24, 5);
    mctx.fillStyle = "#a3a9b1"; for (var q = 0; q < 8; q++) mctx.fillRect(Math.round(lx + Math.cos(q * 0.785) * 22) - 3, Math.round(ly + Math.sin(q * 0.785) * 10) - 2, 6, 4);
    flame(lx, ly, 2.2);
  }
  var night = T.night ? 1 : 0.35, fl = 0.85 + 0.15 * Math.sin(lastT / 140);
  FIRES.forEach(function (f) { mctx.globalAlpha = 1; fireGlow(f[0], f[1] - 6, 70 * f[2], 0.42 * night * fl); flame(f[0], f[1] - 2, f[2]); });
  TORCHES.forEach(function (t) { mctx.globalAlpha = 1; fireGlow(t[0], t[1] - 4, 46, 0.4 * night * fl); flame(t[0], t[1] + 1, 0.7); });
  mctx.globalAlpha = 1;
}
paintMap();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintMap);

function grayOf(hex) {
  var m = /^#([0-9a-f]{6})$/i.exec(hex), m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (m3) m = [0, m3[1] + m3[1] + m3[2] + m3[2] + m3[3] + m3[3]];
  if (!m) return hex;
  var n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, bl = n & 255;
  var y = Math.round((0.3 * r + 0.59 * g + 0.11 * bl) * 0.82 + 22), h = ("0" + y.toString(16)).slice(-2);
  return "#" + h + h + h;
}
function makeSprites(d) {
  var out = ucol(uOf(d));
  return [false, true].map(function (gray) {
    return [0, 1, 2].map(function (st) {
      var cv = document.createElement("canvas"), x;
      cv.width = CW; cv.height = CH; x = cv.getContext("2d");
      spriteRects(d, st).forEach(function (q) {
        var col = q[4] === "currentColor" ? out : q[4];
        x.globalAlpha = q[5]; x.fillStyle = gray ? grayOf(col) : col; x.fillRect(q[0] * 2, q[1] * 2, q[2] * 2, q[3] * 2);
      });
      return cv;
    });
  });
}
var spr = DATA.map(function (d) { return makeSprites(d); });

/* 빨간 침입자 (11x8 도트를 2배로) */
var INV_A = ["..X.....X..", "...X...X...", "..XXXXXXX..", ".XXoXXXoXX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."];
var INV_B = INV_A.slice(0, 6).concat(["X..X...X..X", ".X..X.X..X."]);
var INVS = [INV_A, INV_B].map(function (rows) {
  var cv = document.createElement("canvas"), x;
  cv.width = IW; cv.height = IH; x = cv.getContext("2d");
  rows.forEach(function (row, ry) {
    for (var cx = 0; cx < 11; cx++) {
      var ch = row.charAt(cx);
      if (ch === ".") continue;
      x.fillStyle = ch === "o" ? "#3a0710" : "#ff2d44";
      x.fillRect(cx * 2, ry * 2, 2, 2);
    }
  });
  return cv;
});

/* 먹을거리 도트 아이콘 (8x8 x2) */
var FOOD_ART = {
  cookie: { p: { b: "#c98b4a", d: "#6b3f1d" }, r: ["..bbbb..", ".bbdbbb.", "bbbbbdbb", "bdbbbbbb", "bbbdbbdb", "bbbbbbbb", ".bbdbbb.", "..bbbb.."] },
  coffee: { p: { w: "#f2f2f2", c: "#5a3a22", s: "#cfd6e6" }, r: ["..s..s..", ".s..s...", "wwwwww..", "wccccww.", "wccccw.w", "wwwwww.w", ".wwww.w.", "........"] },
  apple: { p: { r: "#e5483c", g: "#5fbf5a" }, r: ["....g...", "...g.g..", ".rrrgrr.", "rrrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rr.rr."] },
  bread: { p: { y: "#e6b35c", d: "#a8702e" }, r: ["..dddd..", ".dyyyyd.", "dyyyyyyd", "dyyyyyyd", "dyyyyyyd", "dyyyyyyd", ".dyyyyd.", "..dddd.."] },
  donut: { p: { y: "#e6b35c", p: "#f08ccf" }, r: ["..yyyy..", ".yppppy.", "yppyyppy", "ypy..ypy", "yppyyppy", ".yppppy.", "..yyyy..", "........"] },
  ice: { p: { p: "#f08ccf", w: "#fff4f8", y: "#e6b35c" }, r: ["..pppp..", ".pppppp.", ".pppwpp.", "..pppp..", "..yyyy..", "...yy...", "...yy...", "....y..."] },
  drink: { p: { o: "#ff9f43", w: "#f2f2f2", s: "#cfd6e6" }, r: ["....ss..", "....s...", ".oooooo.", ".owwwwo.", ".owwwwo.", ".oooooo.", ".oooooo.", ".oooooo."] },
  rice: { p: { w: "#f2f2f2", n: "#22242e" }, r: ["...ww...", "..wwww..", ".wwwwww.", "wwwnnwww", "wwwnnwww", "wwwwwwww", ".wwwwww.", "........"] },
  candy: { p: { b: "#6ea8ff", r: "#e5483c" }, r: ["........", "b.rrrr.b", "bbrrrrbb", "b.rrrr.b", "........", "........", "........", "........"] }
};
var FOOD_CV = {};
function foodKind(t) {
  t = String(t);
  if (/커피|라떼|차$|티$|아메/.test(t)) return "coffee";
  if (/도넛|도너츠/.test(t)) return "donut";
  if (/아이스|빙수|젤라/.test(t)) return "ice";
  if (/과자|쿠키|비스킷|초코|칩|스낵/.test(t)) return "cookie";
  if (/과일|사과|귤|바나나|딸기|포도|수박|오렌지|토마토/.test(t)) return "apple";
  if (/빵|케이크|샌드|베이글|마카롱|와플/.test(t)) return "bread";
  if (/음료|주스|콜라|사이다|물|우유/.test(t)) return "drink";
  if (/김밥|주먹밥|떡|밥/.test(t)) return "rice";
  return "candy";
}
function foodIcon(t) {
  var k = foodKind(t);
  if (!FOOD_CV[k]) {
    var a = FOOD_ART[k], cv = document.createElement("canvas"), x;
    cv.width = 16; cv.height = 16; x = cv.getContext("2d");
    a.r.forEach(function (row, ry) { for (var cx = 0; cx < 8; cx++) { var ch = row.charAt(cx); if (ch === ".") continue; x.fillStyle = a.p[ch]; x.fillRect(cx * 2, ry * 2, 2, 2); } });
    FOOD_CV[k] = cv;
  }
  return FOOD_CV[k];
}
function snackHit(ev) {
  var pt = mapPoint(ev), sn = snackNow(), hit = null;
  Object.keys(sn).forEach(function (u) {
    var g = REGIONS[u]; if (!g) return;
    var n = sn[u].items.length;
    if ((pt[0] >= g.x + 6 && pt[0] <= g.x + 40 && pt[1] >= g.y + 25 && pt[1] <= g.y + 40) || (pt[0] >= g.x + 8 && pt[0] <= g.x + 8 + 18 * n && pt[1] >= g.y + g.h - 24 && pt[1] <= g.y + g.h - 4)) hit = { u: u, info: sn[u] };
  });
  return hit;
}

function areaOf(u) { var g = REGIONS[u]; return { x0: g.x + 10, x1: g.x + g.w - 10 - CW, y0: g.y + 62, y1: g.y + g.h - 10 - CH }; }
function iAreaOf(u) { var g = REGIONS[u]; return { x0: g.x + 10, x1: g.x + g.w - 10 - IW, y0: g.y + 62, y1: g.y + g.h - 10 - IH }; }
var OFFICE = { x0: 90, x1: 860, y0: 90, y1: 590 };
function wanderOf(u) { return WORLD_THEME === "office" ? OFFICE : REGIONS[u] ? areaOf(u) : OFFICE; }
function randIn(a) { return [a.x0 + Math.random() * (a.x1 - a.x0), a.y0 + Math.random() * (a.y1 - a.y0)]; }
function deskFor(d) { return SEATNOW[jobId(d)] || null; }
function applySeats(initial) {
  computeSeatNow();
  walkers.forEach(function (w) {
    var d = DATA[w.i], nh = deskFor(d), sp, dest;
    if (nh === w.hd) return;
    w.hd = nh;
    if (w.mode === "leave") { sp = leaveSpot(w); w.route = []; w.moving = false; w.x = sp[0]; w.y = sp[1]; w.tx = w.x; w.ty = w.y; return; }
    if (w.mode === "gone" || w.mode === "away" || w.seat) return;
    dest = homeDest(w);
    if (initial || reduceMotion) jump(w, dest); else goTo(w, dest);
  });
}
var STAND = {};
function newWalker(d, i) {
  var u = uOf(d), hd = deskFor(d), a = wanderOf(u), p = hd && shouldSitAtDesk(d) ? [hd.x, hd.y] : a ? randIn(a) : (STAND[d.n] || [OX, OY]);
  return { i: i, id: jobId(d), u: u, a: a, hd: hd, x: p[0], y: p[1], tx: p[0], ty: p[1], wait: Math.random() * 2, speed: 16 + Math.random() * 12, anim: 0, moving: false, route: [], seat: null, mode: "desk", tag: "", pkey: "" };
}
var walkers = DATA.map(function (d, i) { return newWalker(d, i); });
function homeDest(w) { return w.hd && shouldSitAtDesk(DATA[w.i]) ? [w.hd.x, w.hd.y] : w.a ? randIn(w.a) : (STAND[DATA[w.i].n] || [w.x, w.y]); }
function leaveSpot(w) { return w.hd ? [w.hd.cx - CW / 2, w.hd.ry + 66] : (STAND[DATA[w.i].n] || [w.x, w.y]); }
function isSitting(w) { return !w.route.length && !w.seat && w.mode === "desk" && w.hd && shouldSitAtDesk(DATA[w.i]) && Math.abs(w.x - w.hd.x) < 1.5 && Math.abs(w.y - w.hd.y) < 1.5; }
function rowOfY(y) { return Math.max(0, Math.min(5, Math.floor((y - OY) / ROWH))); }
function wtop(r) { return OY + r * ROWH + 66; }
function zoneOf(x, y) { return x >= EDGE - 10 ? "meet" : (y >= LOWER_Y ? "low" : "off"); }
function goTo(w, dest) {
  var pts = [], zf = zoneOf(w.x, w.y), zt = zoneOf(dest[0], dest[1]), wc, wh;
  if (zf === "off") {
    wc = wtop(rowOfY(w.y)); pts.push([w.x, wc]);
    if (zt === "off") { pts.push([AX, wc]); wh = wtop(rowOfY(dest[1])); if (wh !== wc) pts.push([AX, wh]); pts.push([dest[0], wh]); }
    else if (zt === "meet") pts.push([EDGE, wc]);
    else { pts.push([AX, wc]); pts.push([AX, LANE]); }
  } else if (zf === "low") {
    if (zt === "off") { wh = wtop(rowOfY(dest[1])); pts.push([AX, LANE]); pts.push([AX, wh]); pts.push([dest[0], wh]); }
    else if (zt === "meet") pts.push([EDGE - 20, LANE]);
  } else {
    if (zt === "off") { wh = wtop(rowOfY(dest[1])); pts.push([EDGE, wh]); pts.push([dest[0], wh]); }
    else if (zt === "low") pts.push([EDGE, LANE]);
  }
  pts.push(dest);
  w.route = pts; w.wait = 0; w.moving = true;
}
var LUNCH = { cx: 450, cy: 330, n: 0 };
function lunchSpot(k, n) {
  var rx = Math.min(150, 46 + n * 9), ry = rx * 0.55, a = 2 * Math.PI * k / n - Math.PI / 2;
  return [LUNCH.cx + Math.cos(a) * rx - CW / 2, LUNCH.cy + Math.sin(a) * ry - CH + 14];
}
function awayDest() { return [OX + Math.random() * (8 * CELLW - CW), wtop(Math.floor(Math.random() * 6))]; }
function jump(w, p) { w.x = p[0]; w.y = p[1]; w.tx = w.x; w.ty = w.y; w.route = []; w.moving = false; w.wait = Math.random() * 2; }
function applyMoves(initial) {
  walkers.forEach(function (w) {
    var d = DATA[w.i], nu = uOf(d);
    if (w.u === nu) return;
    w.u = nu; w.a = wanderOf(nu); w.hd = deskFor(d); spr[w.i] = makeSprites(d);
    if (w.seat) return;
    var dest = homeDest(w);
    if (initial || reduceMotion) jump(w, dest); else goTo(w, dest);
  });
}

/* ---- 침입자: 팀원이 맡은 미완료 업무 하나당 한 마리, 담당자 뒤를 졸졸 따라다녀요 ---- */
var pidCount = {};
function boxFor(pid) {
  var i = indexOfId(pid), wk;
  if (i < 0 || !(wk = walkers[i])) return null;
  if (wk.hd) return { x0: wk.hd.cx - 50, x1: wk.hd.cx + 50 - IW, y0: wk.hd.ry + 54, y1: wk.hd.ry + 88 };
  return wk.a ? (REGIONS[wk.u] ? iAreaOf(wk.u) : { x0: wk.a.x0, x1: wk.a.x1 + CW - IW, y0: wk.a.y0, y1: wk.a.y1 + CH - IH }) : null;
}
function syncIntruders(initial) {
  var want = {}, byKey = {}, counts = {}, pc = {};
  DATA.forEach(function (d) {
    var id = jobId(d), u = uOf(d);
    openTasks(d).forEach(function (t) { want[id + ":" + t.i] = { pid: id, u: u, text: t.t }; counts[u] = (counts[u] || 0) + 1; pc[id] = (pc[id] || 0) + 1; });
  });
  intr.forEach(function (o) { byKey[o.key] = o; });
  Object.keys(want).forEach(function (key) {
    var w = want[key], o = byKey[key], bx = boxFor(w.pid), bk = bx ? [bx.x0, bx.x1, bx.y0, bx.y1].join() : "";
    if (!bx) return;
    if (o) {
      o.die = null; o.text = w.text; o.pid = w.pid; o.u = w.u; o.box = bx;
      if (o.bk !== bk) { var q = randIn(bx); o.bk = bk; o.x = q[0]; o.y = q[1]; o.tx = q[0]; o.ty = q[1]; }
    } else {
      var p = randIn(bx);
      intr.push({ key: key, pid: w.pid, text: w.text, u: w.u, box: bx, bk: bk, x: p[0], y: p[1], tx: p[0], ty: p[1], wait: Math.random() * 1.5, speed: 14 + Math.random() * 12, a: initial || reduceMotion ? 1 : 0, die: null, k: Math.random() < 0.5 ? 0 : 1, shown: true });
    }
  });
  intr.forEach(function (o) { if (!want[o.key] && o.die == null) o.die = 0.5; });
  if (reduceMotion) intr = intr.filter(function (o) { return o.die == null; });
  invCount = counts; pidCount = pc;
  renderPortals();
}

/* ---- 회의: 회의실 테이블에 둘러앉기 ---- */
var seatInfo = {};
function meetingList() {
  return Object.keys(store.meetings).map(function (id) {
    var m = store.meetings[id];
    return m && typeof m.t === "string" ? { id: id, t: m.t, m: Array.isArray(m.m) ? m.m.filter(function (x) { return typeof x === "string"; }) : [], on: !!m.on, at: +m.at || 0 } : null;
  }).filter(Boolean).sort(function (a, b) { return a.at - b.at; });
}
function inActiveMeeting(d) {
  var id = jobId(d);
  return meetingList().some(function (m) { return m.on && m.m.indexOf(id) >= 0; });
}
function computeSeats() {
  var byId = {}, taken = {}, out = {}, today = todayStr();
  DATA.forEach(function (d) { byId[jobId(d)] = d; });
  seatInfo = {};
  meetingList().filter(function (m) { return m.on; }).slice(0, 3).forEach(function (m, k) {
    var ids = [];
    m.m.forEach(function (id) { var d = byId[id]; if (d && !taken[id] && !onLeave(d, today) && !isGone(d, Date.now()) && ids.length < 8) { taken[id] = 1; ids.push(id); } });
    var c = TABLES[k], n = ids.length;
    ids.forEach(function (id, j) {
      var th = -Math.PI / 2 + 2 * Math.PI * j / n;
      out[id] = { k: k, x: Math.round(c.x + 46 * Math.cos(th) - CW / 2), y: Math.round(c.y + 34 * Math.sin(th) - 20) };
    });
    seatInfo[k] = { t: m.t, n: n };
  });
  return out;
}
function syncMeetings(initial) {
  var seats = computeSeats(), today = todayStr(), now = Date.now(), lunchers = [];
  if (WORLD_THEME !== "office") walkers.forEach(function (w) { var d0 = DATA[w.i]; if (!seats[w.id] && !onLeave(d0, today) && !isGone(d0, now) && presenceOf(d0, now) === "lunch") lunchers.push(w.id); });
  lunchers.sort(); LUNCH.n = lunchers.length;
  walkers.forEach(function (w) {
    var d = DATA[w.i], s = seats[w.id], mode, tag = "", key, quick = initial || reduceMotion || w.mode === "gone", sp, h, t2;
    if (onLeave(d, today)) mode = "leave";
    else if (isGone(d, now)) mode = "gone";
    else if (s) mode = "meet";
    else { tag = presenceOf(d, now); mode = tag ? "away" : "desk"; }
    key = WORLD_THEME + ":" + mode + ":" + (mode === "meet" ? s.k + ":" + s.x + ":" + s.y : "") + tag + (shouldSitAtDesk(d, now) ? ":working" : ":off-desk") + (mode === "away" && tag === "lunch" ? ":" + lunchers.indexOf(w.id) + "/" + lunchers.length : "");
    if (w.pkey === key) return;
    w.pkey = key; w.mode = mode; w.tag = tag; w.seat = mode === "meet" ? s : null;
    if (mode === "gone") { w.route = []; w.moving = false; w.seat = null; }
    else if (mode === "leave") { sp = leaveSpot(w); w.route = []; w.moving = false; w.x = sp[0]; w.y = sp[1]; w.tx = w.x; w.ty = w.y; }
    else if (mode === "meet") { if (quick) jump(w, [s.x, s.y]); else goTo(w, [s.x, s.y]); }
    else if (mode === "away") { t2 = tag === "lunch" && WORLD_THEME !== "office" ? lunchSpot(lunchers.indexOf(w.id), lunchers.length) : awayDest(); if (quick) jump(w, t2); else goTo(w, t2); }
    else { h = homeDest(w); if (quick) jump(w, h); else goTo(w, h); }
  });
  if (typeof updateOT === "function") updateOT();
}

function update(dt) {
  if (reduceMotion) return;
  walkers.forEach(function (w) {
    if (w.mode === "leave" || w.mode === "gone") { w.moving = false; return; }
    if (w.route.length) {
      var p = w.route[0], rx = p[0] - w.x, ry = p[1] - w.y, rd = Math.hypot(rx, ry), rm = 70 * dt;
      if (rd <= rm) {
        w.x = p[0]; w.y = p[1]; w.route.shift();
        if (!w.route.length) { w.tx = w.x; w.ty = w.y; w.wait = 1.5 + Math.random() * 3; w.moving = false; }
      } else { w.x += rx / rd * rm; w.y += ry / rd * rm; w.moving = true; w.anim += dt; }
      return;
    }
    if (w.mode === "meet" || w.seat) { w.moving = false; return; }
    if (w.mode === "away") {
      w.moving = false;
      if (w.tag === "lunch") return;
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) goTo(w, awayDest()); }
      else goTo(w, awayDest());
      return;
    }
    if (w.hd && shouldSitAtDesk(DATA[w.i])) {
      if (Math.abs(w.x - w.hd.x) > 1.5 || Math.abs(w.y - w.hd.y) > 1.5) goTo(w, [w.hd.x, w.hd.y]);
      else w.moving = false;
      return;
    }
    if (!w.a) { w.moving = false; return; }
    if (w.wait > 0) {
      w.wait -= dt; w.moving = false;
      if (w.wait <= 0) { w.tx = w.a.x0 + Math.random() * (w.a.x1 - w.a.x0); w.ty = w.a.y0 + Math.random() * (w.a.y1 - w.a.y0); }
      return;
    }
    var dx = w.tx - w.x, dy = w.ty - w.y, dist = Math.hypot(dx, dy), mv = w.speed * dt;
    if (dist <= mv) { w.x = w.tx; w.y = w.ty; w.wait = 0.8 + Math.random() * 3.5; w.moving = false; return; }
    w.x += dx / dist * mv; w.y += dy / dist * mv; w.moving = true; w.anim += dt;
  });
  /* 담당자가 움직이는 방향을 기억해 두면, 침입자가 그 뒤를 따라가요 */
  walkers.forEach(function (w) {
    var mx = w.x - (w.lx == null ? w.x : w.lx), my = w.y - (w.ly == null ? w.y : w.ly), ml = Math.hypot(mx, my);
    if (ml > 0.05) { var hx0 = w.hx == null ? 1 : w.hx, hy0 = w.hy == null ? 0 : w.hy; hx0 += (mx / ml - hx0) * Math.min(1, dt * 4); hy0 += (my / ml - hy0) * Math.min(1, dt * 4); var hl = Math.hypot(hx0, hy0) || 1; w.hx = hx0 / hl; w.hy = hy0 / hl; }
    w.lx = w.x; w.ly = w.y;
  });
  var rank = {};
  intr.forEach(function (o) {
    if (o.die != null) { o.die -= dt; o.a = Math.max(0, o.die / 0.5); return; }
    if (o.a < 1) o.a = Math.min(1, o.a + dt * 2);
    var wi = indexOfId(o.pid), w = wi >= 0 ? walkers[wi] : null, r = rank[o.pid] = (rank[o.pid] == null ? 0 : rank[o.pid] + 1);
    if (!w) return;
    var hx = w.hx == null ? 1 : w.hx, hy = w.hy == null ? 0 : w.hy, side = (r % 2 ? 1 : -1) * 5;
    var tx = w.x + CW / 2 - IW / 2 - hx * (30 + r * 20) - hy * side, ty = w.y + CH - IH - 2 - hy * (12 + r * 10) + hx * side;
    var dx = tx - o.x, dy = ty - o.y, dist = Math.hypot(dx, dy), sp = Math.min(150, Math.max(o.speed, dist * 3)) * dt;
    if (dist <= sp) { o.x = tx; o.y = ty; } else { o.x += dx / dist * sp; o.y += dy / dist * sp; }
  });
  intr = intr.filter(function (o) { return o.die == null || o.die > 0; });
}

var hover = null, hoverInv = null;
function label(t, cx, y, gray) {
  var ls = Array.isArray(t) ? t : [t], k;
  mctx.font = "500 11px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; mctx.textAlign = "center";
  for (k = 0; k < ls.length; k++) {
    var yy = y - (ls.length - 1 - k) * 13;
    var text = fit(mctx, ls[k], 120);
    mctx.lineWidth = 3; mctx.strokeStyle = T.ls; mctx.strokeText(text, cx, yy);
    mctx.fillStyle = gray ? T.lg : T.lf; mctx.fillText(text, cx, yy);
  }
  mctx.textAlign = "left";
}
function arrow(ax, ay) {
  mctx.fillStyle = T.arrow;
  mctx.fillRect(ax - 3, ay, 7, 1); mctx.fillRect(ax - 2, ay + 1, 5, 1); mctx.fillRect(ax - 1, ay + 2, 3, 1); mctx.fillRect(ax, ay + 3, 1, 1);
}
function regionDim(u) { return state.side && UNI[u].side !== state.side ? 0.6 : (state.uni && state.uni !== u ? 0.45 : 0); }
function mapOn(d) { return !mapFilt || mapSet[jobId(d)]; }
function shade(hex, k) {
  var key = hex + k, m = /^#([0-9a-f]{6})$/i.exec(hex), n;
  if (SHD[key]) return SHD[key];
  if (!m) return hex;
  n = parseInt(m[1], 16);
  return (SHD[key] = "rgb(" + Math.round((n >> 16 & 255) * k) + "," + Math.round((n >> 8 & 255) * k) + "," + Math.round((n & 255) * k) + ")");
}
function otBadge(x, y) {
  mctx.fillStyle = "#3b2a6b"; mctx.fillRect(x, y, 28, 14);
  mctx.strokeStyle = "#b79cff"; mctx.lineWidth = 1; mctx.strokeRect(x + 0.5, y + 0.5, 27, 13);
  mctx.font = "700 10px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; mctx.textAlign = "left"; mctx.fillStyle = "#e6dcff"; mctx.fillText("야근", x + 4, y + 11);
}
function drawHealthBattery(x, y, d) {
  var value = batteryOf(d), px = Math.round(x + CW / 2 - 10), py = Math.round(y - 23);
  mctx.save();
  mctx.globalAlpha = 0.96;
  mctx.fillStyle = "#111629"; mctx.fillRect(px, py, 20, 8);
  mctx.strokeStyle = "#e7ebfa"; mctx.lineWidth = 1; mctx.strokeRect(px + 0.5, py + 0.5, 19, 7);
  mctx.fillStyle = "#e7ebfa"; mctx.fillRect(px + 20, py + 2, 2, 4);
  mctx.fillStyle = value > 60 ? "#4fc17f" : value > 25 ? "#f4c95d" : "#ff7088";
  if (value) mctx.fillRect(px + 2, py + 2, Math.round(15 * value / 100), 4);
  mctx.restore();
}
function drawSpaceBodies() {
  var t = lastT / 1000, i, x, y, blink;
  for (i = 0; i < 42; i++) {
    x = (47 + i * 173) % MAP_W; y = (31 + i * 97) % MAP_H;
    if ((x >= 244 && x <= 658 && y >= 228 && y <= 468) || (x >= 940 && y <= 710) || (y >= 708 && x <= 950)) continue;
    blink = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.13));
    mctx.globalAlpha = blink; mctx.fillStyle = i % 5 === 0 ? "#b9efff" : "#dbe7ff";
    mctx.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 3 : 2, 2);
    if (i % 9 === 0 && blink > 0.72) {
      mctx.globalAlpha = blink * 0.7; mctx.fillRect(x + 1, y - 2, 1, 6); mctx.fillRect(x - 1, y, 5, 1);
    }
  }
  function planet(ox, oy, orbitX, orbitY, radius, phase, base, band, ring) {
    var angle = t / phase, px = ox + Math.cos(angle) * orbitX, py = oy + Math.sin(angle) * orbitY;
    mctx.globalAlpha = 0.28; mctx.strokeStyle = ring; mctx.lineWidth = 1;
    mctx.beginPath(); mctx.ellipse(ox, oy, orbitX, orbitY, 0, 0, Math.PI * 2); mctx.stroke();
    mctx.save();
    mctx.globalAlpha = 0.9; mctx.fillStyle = ring; mctx.beginPath(); mctx.ellipse(px, py, radius + 5, radius * 0.42, -0.16, 0, Math.PI * 2); mctx.stroke();
    mctx.fillStyle = base; mctx.beginPath(); mctx.arc(px, py, radius, 0, Math.PI * 2); mctx.fill();
    mctx.clip(); mctx.fillStyle = band; mctx.fillRect(px - radius, py - radius * 0.28, radius * 2, Math.max(2, radius * 0.22));
    mctx.fillRect(px - radius, py + radius * 0.38, radius * 2, Math.max(2, radius * 0.14));
    mctx.globalAlpha = 0.65; mctx.fillStyle = "#e9f8ff"; mctx.fillRect(px - radius * 0.52, py - radius * 0.6, radius * 0.42, 2);
    mctx.restore();
  }
  planet(152, 142, 24, 9, 13, 11, "#a84f64", "#dd9473", "#e5c676");
  planet(840, 590, 18, 12, 9, 8, "#327f92", "#6bc6b0", "#91dcec");
  var comet = (t % 24) / 24;
  if (comet < 0.16) {
    x = 660 + comet * 980; y = 90 + comet * 360;
    mctx.globalAlpha = Math.sin(comet / 0.16 * Math.PI) * 0.8;
    mctx.strokeStyle = "#b6efff"; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.moveTo(x - 24, y - 9); mctx.lineTo(x, y); mctx.stroke();
    mctx.fillStyle = "#ffffff"; mctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
  }
  mctx.globalAlpha = 1;
}
function drawMonitor(s, lit) {
  var office = WORLD_THEME === "office";
  mctx.fillStyle = office ? "#22201e" : "#5b638f"; mctx.fillRect(s.cx - 18, s.ry + 12, 36, 21);
  mctx.fillStyle = lit ? (office ? "#4c9b91" : "#2a8ea3") : (office ? "#151819" : "#141830"); mctx.fillRect(s.cx - 16, s.ry + 14, 32, 17);
  mctx.fillStyle = office ? "#4c4944" : "#5b638f"; mctx.fillRect(s.cx - 3, s.ry + 33, 6, 4);
}
function drawDesk(s, tint, lit) {
  var x = s.cx - 42, y = s.ry + 38;
  if (WORLD_THEME === "office") {
    x = s.cx - 34;
    mctx.fillStyle = "#211a16"; mctx.fillRect(x + 3, y + 8, 62, 19);
    mctx.fillStyle = "#f3f1eb"; mctx.fillRect(x, y, 68, 9);
    mctx.fillStyle = "#ffffff"; mctx.fillRect(x + 1, y + 1, 66, 6);
    mctx.fillStyle = "#c8c5be"; mctx.fillRect(x, y + 8, 68, 2);
    mctx.fillStyle = "#8b8176"; mctx.fillRect(x + 5, y + 10, 3, 18); mctx.fillRect(x + 60, y + 10, 3, 18);
    return;
  }
  mctx.fillStyle = shade(tint, 0.45); mctx.fillRect(x, y + 10, 84, 20);
  mctx.fillStyle = shade(tint, 0.82); mctx.fillRect(x, y, 84, 10);
  mctx.fillStyle = tint; mctx.fillRect(x, y, 84, 2); mctx.fillRect(x, y + 28, 84, 2);
  mctx.fillStyle = "#7c86b3"; mctx.fillRect(s.cx - 10, s.ry + 44, 20, 3);
}
function draw() {
  mctx.globalAlpha = 1; mctx.drawImage(bg, 0, 0);
  if (WORLD_THEME === "space") drawSpaceBodies();
  drawFires();
  Object.keys(REGIONS).forEach(function (u) {
    var dim = regionDim(u);
    if (dim) { var g = REGIONS[u]; mctx.globalAlpha = dim; mctx.fillStyle = T.bg; mctx.fillRect(g.x, g.y, g.w, g.h); }
  });
  Object.keys(invCount).forEach(function (u) {
    var g = REGIONS[u], t, w2;
    if (!g || !invCount[u]) return;
    t = "침입 " + invCount[u];
    mctx.font = "700 10px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; mctx.textAlign = "left";
    w2 = Math.ceil(mctx.measureText(t).width) + 12;
    mctx.globalAlpha = regionDim(u) ? 0.4 : 1;
    mctx.fillStyle = "#e5283c"; mctx.fillRect(g.x + g.w - 6 - w2, g.y + 25, w2, 15);
    mctx.fillStyle = "#fff"; mctx.fillText(t, g.x + g.w - 6 - w2 + 6, g.y + 36);
  });
  mctx.globalAlpha = 1;
  var sn = snackNow();
  Object.keys(sn).forEach(function (u) {
    var g = REGIONS[u]; if (!g) return;
    mctx.globalAlpha = regionDim(u) ? 0.4 : 1;
    mctx.font = "700 10px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; mctx.textAlign = "left";
    mctx.fillStyle = "#f4c95d"; mctx.fillRect(g.x + 6, g.y + 25, 34, 15);
    mctx.fillStyle = "#1a1408"; mctx.fillText("간식", g.x + 12, g.y + 36);
    sn[u].items.forEach(function (it, k) { mctx.drawImage(foodIcon(it), g.x + 8 + k * 18, g.y + g.h - 24); });
  });
  mctx.globalAlpha = 1;
  TABLES.forEach(function (tb, k) {
    var info = seatInfo[k];
    mctx.fillStyle = info ? "#a37a4a" : "#5b4530";
    mctx.beginPath(); mctx.ellipse(tb.x, tb.y, 28, 17, 0, 0, Math.PI * 2); mctx.fill();
    mctx.lineWidth = 2; mctx.strokeStyle = info ? "#f4c95d" : "#3a2c1e"; mctx.stroke();
    mctx.font = "500 11px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    label(info ? fit(mctx, info.t, 112) : WORLD_THEME === "office" ? "빈 회의실" : "빈 작전 탁자", tb.x, tb.y + 82, !info);
  });
  var showNames = document.getElementById("names").checked, today = todayStr(), owner = {};
  walkers.forEach(function (w) { if (w.hd) owner[w.hd.idx] = w; });
  SEATS.forEach(function (s) {
    if (!owner[s.idx] && WORLD_THEME !== "office") return;
    var w = owner[s.idx], d = w ? DATA[w.i] : null, sit = w ? isSitting(w) : false, on = d ? mapOn(d) : true, off = d ? onLeave(d, today) : false;
    var tint = d ? ucol(uOf(d)) : "#5b638f", nm = d ? jobId(d) : "";
    mctx.globalAlpha = on ? 1 : 0.28;
    if (d && on && (uOf(d) === "flead" || uOf(d) === "blead")) {
      var pulse = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(lastT / 380);
      mctx.save(); mctx.globalAlpha = (0.35 + 0.45 * pulse) * (off ? 0.5 : 1); mctx.strokeStyle = LEAD; mctx.lineWidth = 2; mctx.shadowColor = LEAD; mctx.shadowBlur = 18;
      mctx.strokeRect(s.cx - 46, s.ry + 4, 92, 68); mctx.restore();
    }
    mctx.fillStyle = WORLD_THEME === "office" ? "#d7d0c4" : "#1e2340"; mctx.fillRect(s.cx - 16, s.ry + 14, 32, 26);
    drawMonitor(s, s.kind === "pc" || sit);
    if (sit) mctx.drawImage(spr[w.i][off ? 1 : 0][0], 0, 0, CW, 32, s.x, s.y, CW, 32);
    drawDesk(s, tint, s.kind === "pc");
    if (d && sn[uOf(d)] && !off) { var its = sn[uOf(d)].items; mctx.drawImage(foodIcon(its[s.idx % its.length]), s.cx + 24, s.ry + 44); }
    if (d && pidCount[nm]) {
      var t = "침입 " + pidCount[nm];
      mctx.font = "700 10px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"; mctx.textAlign = "left";
      mctx.fillStyle = "#e5283c"; mctx.fillRect(s.cx - 40, s.ry + 51, 38, 14);
      mctx.fillStyle = "#fff"; mctx.fillText(t, s.cx - 36, s.ry + 61);
    }
    if (sit && on && d && isOT(d)) otBadge(s.cx + 18, s.ry + 2);
    if (!d) label(s.kind === "person" ? "빈 자리" : s.n, s.cx, s.ry + 9, true);
    else if (WORLD_THEME === "office" && !sit) label(fit(mctx, d.n, 76), s.cx, s.ry + 9, true);
    else if (sit && on && (showNames || hover === w)) label(nameLines(d, off ? " · " + offLabel(d) : ""), s.cx, s.y - 5, off);
    if (sit && on && d) drawHealthBattery(s.x, s.y, d);
    if (sit && on && hover === w) arrow(s.cx, s.y - 27);
  });
  walkers.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (w) {
    if (isSitting(w)) return;
    var d = DATA[w.i], on = mapOn(d), off = onLeave(d, today), gn = w.mode === "gone";
    var ph = Math.floor(w.anim * 5), fr = w.moving ? (ph % 2 ? 1 : 2) : 0, bob = w.moving && ph % 2 ? 2 : 0;
    var x = Math.round(w.x), y = Math.round(w.y) - bob, sitting = w.seat && !w.route.length;
    mctx.globalAlpha = on ? (gn ? 0.4 : 1) : 0.22;
    if (sitting) mctx.drawImage(spr[w.i][off ? 1 : 0][0], 0, 0, CW, 32, x, y, CW, 32);
    else mctx.drawImage(spr[w.i][off ? 1 : 0][fr], x, y);
    if (on) drawHealthBattery(x, y, d);
    if (w.mode === "away" && w.tag === "lunch") {
      if (WORLD_THEME === "office") mctx.drawImage(foodIcon("밥"), x + 6, y - 22);
      else if (!w.route.length) { if (WORLD_THEME === "space") spaceMeal(x + CW - 5, y + 12); else drumstick(x + CW - 5, y + 12 + (Math.sin(lastT / 170 + w.i * 1.7) > 0.3 ? -3 : 0)); }
      else { if (WORLD_THEME === "space") spaceMeal(x + 8, y - 26); else drumstick(x + 8, y - 26); }
    } else if (w.mode === "away" && w.tag) mctx.drawImage(foodIcon("커피"), x + 4, y - 32);
    if (on && (showNames || hover === w || w.mode === "away")) label(nameLines(d, off ? " · " + offLabel(d) : (w.mode === "away" ? (w.tag === "lunch" ? (WORLD_THEME === "space" ? " · 우주식량" : " · 점심") : " · 휴식") : (gn ? " · 퇴근" : ""))), x + CW / 2, y - 5, off || gn);
    if (on && hover === w) arrow(x + CW / 2, y - 27 - (nameParts(d.n).length > 1 ? 13 : 0));
    if (on && isOT(d) && !off) otBadge(x + CW - 2, y - 2);
  });
  var cnt = {};
  intr.forEach(function (o) {
    cnt[o.pid] = (cnt[o.pid] || 0) + 1;
    o.shown = cnt[o.pid] <= INVCAP;
    if (!o.shown) return;
    var x = Math.round(o.x), y = Math.round(o.y);
    mctx.globalAlpha = o.a * (mapFilt && !mapSet[o.pid] ? 0.25 : 1);
    mctx.drawImage(INVS[(Math.floor(lastT / 320) + o.k) % 2], x, y);
    if (hoverInv === o) { mctx.globalAlpha = 1; arrow(x + IW / 2, y - 6); }
  });
  mctx.globalAlpha = 1;
}

var lastT = 0, running = false;
function frame(t) {
  if (document.getElementById("world").hidden) { running = false; return; }
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;
  update(dt); draw();
  requestAnimationFrame(frame);
}
function startMap() { if (running) return; running = true; lastT = performance.now(); requestAnimationFrame(frame); }

function mapPoint(ev) {
  var rc = mapEl.getBoundingClientRect(), k = MAP_W / rc.width;
  return [(ev.clientX - rc.left) * k, (ev.clientY - rc.top) * k];
}
function mapCommandAt(point) {
  if (point[0] >= MEET.x && point[0] <= MEET.x + MEET.w && point[1] >= MEET.y && point[1] <= MEET.y + 58) return "meet";
  if (point[0] >= 16 && point[0] <= 944 && point[1] >= 716 && point[1] <= 958) return "proj";
  return null;
}
function hitTest(ev) {
  var pt = mapPoint(ev), px = pt[0], py = pt[1], hit = null;
  walkers.forEach(function (w) {
    var d = DATA[w.i], x0, x1, y0, y1;
    if (!mapOn(d)) return;
    if (isSitting(w)) { x0 = w.hd.cx - 42; x1 = w.hd.cx + 42; y0 = w.y - 14; y1 = w.y + 54; }
    else { x0 = w.x - 2; x1 = w.x + CW + 2; y0 = w.y - 4; y1 = w.y + (w.seat && !w.route.length ? 32 : CH); }
    if (px >= x0 && px <= x1 && py >= y0 && py <= y1 && (!hit || w.y > hit.y)) hit = w;
  });
  if (!hit) hit = seatOwnerAt(px, py);
  return hit;
}
/* 빈 자리(퇴근·점심·회의·연차로 캐릭터가 없는 자리)를 눌러도 그 자리 주인의 시트가 열려요 */
function seatOwnerAt(px, py) {
  var found = null;
  SEATS.forEach(function (s) {
    if (px < s.cx - 42 || px > s.cx + 42 || py < s.ry - 8 || py > s.ry + 66) return;
    walkers.forEach(function (w) { if (w.hd && w.hd.idx === s.idx && mapOn(DATA[w.i])) found = w; });
  });
  return found;
}
function hitInv(ev) {
  var pt = mapPoint(ev), hit = null;
  intr.forEach(function (o) {
    if (o.shown && o.die == null && pt[0] >= o.x - 2 && pt[0] <= o.x + IW + 2 && pt[1] >= o.y - 2 && pt[1] <= o.y + IH + 2) hit = o;
  });
  return hit;
}
function indexOfId(id) { for (var k = 0; k < DATA.length; k++) if (jobId(DATA[k]) === id) return k; return -1; }
mapEl.addEventListener("mousemove", function (ev) {
  var command = mapCommandAt(mapPoint(ev)), hi0 = hitInv(ev), h = hi0 ? null : hitTest(ev), tip = document.getElementById("tip"), br = document.getElementById("worldbox").getBoundingClientRect(), hi = hi0;
  hover = h; hoverInv = hi; mapEl.style.cursor = h || hi ? "pointer" : "default";
  if (command) {
    mapEl.style.cursor = "pointer";
    tip.innerHTML = command === "meet"
      ? (WORLD_THEME === "space" ? "<b>우주 관제소</b> · 눌러서 회의를 만들어요" : WORLD_THEME === "office" ? "<b>회의실</b> · 눌러서 회의를 만들어요" : "<b>작전 막사</b> · 눌러서 회의를 만들어요")
      : (WORLD_THEME === "space" ? "<b>우주항</b> · 눌러서 프로젝트 팀을 만들어요" : WORLD_THEME === "office" ? "<b>프로젝트 구역</b> · 눌러서 팀을 만들어요" : "<b>용병 진영</b> · 눌러서 프로젝트 팀을 만들어요");
  } else if (h) {
    var d = DATA[h.i], sk = snackNow()[uOf(d)];
    tip.innerHTML = "<b>" + nameHtml(d.n) + "</b>" + (ttl(d) ? " · " + esc(ttl(d)) : "") + "<br>" + esc(job(d)) + (onLeave(d) ? "<br>" + esc(offLabel(d)) : "") + (h.seat && !h.route.length ? "<br>회의 중" : "") + (h.mode === "away" ? "<br>" + (h.tag === "lunch" ? (WORLD_THEME === "space" ? "우주식량 중" : "점심 중") : "휴식 중") : "") + (openTasks(d).length ? "<br>맡은 업무 " + openTasks(d).length + "건" : "") + (sk ? "<br>간식 당번 · " + esc(sk.items.join(", ")) : "");
  } else if (hi) {
    var pi = indexOfId(hi.pid);
    tip.innerHTML = "<b>침입자</b> · " + esc(hi.text) + "<br>담당 " + (pi >= 0 ? esc(DATA[pi].n) : "") + " · 누르면 업무 목록이 열려요";
  } else {
    var sh = snackHit(ev);
    if (!sh) { tip.hidden = true; return; }
    mapEl.style.cursor = "pointer";
    tip.innerHTML = "<b>간식 당번</b> · " + esc(UNI[sh.u].realm) + " (~" + md(sh.info.to) + ")<br>" + esc(sh.info.items.join(", "));
  }
  tip.style.left = (ev.clientX - br.left) + "px"; tip.style.top = (ev.clientY - br.top - 10) + "px";
  tip.hidden = false;
});
mapEl.addEventListener("mouseleave", function () { hover = null; hoverInv = null; document.getElementById("tip").hidden = true; });
mapEl.addEventListener("click", function (ev) {
  var command = mapCommandAt(mapPoint(ev));
  if (command) {
    setView(command);
    var input = document.getElementById(command === "meet" ? "mname" : "pname");
    if (input) input.focus();
    return;
  }
  var hi = hitInv(ev), pi = hi ? indexOfId(hi.pid) : -1;
  if (pi >= 0) { openSheet(pi, mapEl); return; }
  var h = hitTest(ev);
  if (h) openSheet(h.i, mapEl);
});

/* ---- 프로젝트 외부 팀원 반영 ---- */
function rebuildExternal(first) {
  var openId = openIdx !== null && DATA[openIdx] ? jobId(DATA[openIdx]) : null, old = {};
  extendData(); computeSeatNow();
  walkers.forEach(function (w) { old[w.id] = w; });
  walkers = DATA.map(function (d, i) { var w = old[jobId(d)]; if (w) { w.i = i; return w; } return newWalker(d, i); });
  spr = DATA.map(function (d) { return makeSprites(d); });
  if (state.side === "proj" && !PSLOTS.some(function (k) { return store.projects[k]; })) state.side = null;
  if (state.uni && (UNI[state.uni].hidden || !DATA.some(function (d) { return uOf(d) === state.uni; }))) state.uni = null;
  if (state.side && !DATA.some(function (d) { return UNI[uOf(d)].side === state.side; })) state.side = null;
  paintMap(); applyMoves(!!first); applySeats(!!first);
  document.getElementById("total").textContent = DATA.length;
  renderGrid(); syncIntruders(!!first); syncMeetings(!!first);
  if (state.view === "chat") { renderChatWho(); renderChat(); }
  if (openId !== null) { var ni = indexOfId(openId); if (ni < 0) closeSheet(); else openSheet(ni, null); }
}

/* ---- 회의 화면 ---- */
var mSel = {}, mEditId = "", armed = "";
function refreshForms() {
  var canAdmin = canEditJobs(), canShared = canManageSharedOperations(), fs = document.querySelectorAll(".pane .pform"), k, pane, announcementForm;
  for (k = 0; k < fs.length; k++) {
    pane = fs[k].closest(".pane");
    announcementForm = pane && pane.id === "chatpane" && fs[k].classList.contains("cform");
    fs[k].hidden = pane && ["meetpane", "projpane", "snackpane"].indexOf(pane.id) >= 0 ? !canShared : announcementForm ? !currentCanAnnounce : !canAdmin;
  }
}
function updatePickCount() { var n = Object.keys(mSel).length; document.getElementById("mpc").textContent = "(" + n + "명 / 최대 8명)"; }
function renderPick() {
  var h = "", today = todayStr();
  Object.keys(UNI).forEach(function (k) {
    var ms = DATA.filter(function (d) { return uOf(d) === k; });
    if (!ms.length) return;
    h += '<div class="pkgrp"><div class="mlabel">' + esc(UNI[k].realm) + '</div><div class="recs">';
    ms.forEach(function (d) {
      var id = jobId(d);
      h += '<button type="button" class="pk" data-id="' + esc(id) + '" aria-pressed="' + !!mSel[id] + '">' + esc(d.n) + (onLeave(d, today) ? " · " + offLabel(d) : "") + "</button>";
    });
    h += "</div></div>";
  });
  document.getElementById("mpick").innerHTML = h;
  updatePickCount();
}
function renderMeets() {
  var list = meetingList(), can = canManageSharedOperations(), byId = {}, h = "", act = 0;
  DATA.forEach(function (d) { byId[jobId(d)] = d; });
  refreshForms();
  list.forEach(function (m) {
    var names = m.m.filter(function (id) { return byId[id]; }).map(function (id) { return esc(byId[id].n); }), state2 = "대기";
    if (m.on) { act++; state2 = act > 3 ? "자리 없음" : "회의 중"; }
    h += '<article class="mcard' + (m.on && act <= 3 ? " on" : "") + '"><div class="mhead"><b>' + esc(m.t) + '</b><span class="mstate">' + state2 + "</span></div>" +
      '<p class="mnames">' + (names.length ? names.join(", ") : "참석자 없음") + " (" + names.length + "명)</p>" +
      (can ? '<div class="jrow"><button type="button" class="mtoggle" data-id="' + esc(m.id) + '">' + (m.on ? "회의 종료" : "회의 시작") + '</button><button type="button" class="medit" data-id="' + esc(m.id) + '">수정</button><button type="button" class="mdel' + (armed === m.id ? " arm" : "") + '" data-id="' + esc(m.id) + '">' + (armed === m.id ? "정말 삭제?" : "삭제") + "</button></div>" : "") + "</article>";
  });
  document.getElementById("mlist").innerHTML = h || '<p class="tempty">아직 만든 회의가 없어요.</p>';
  if (act > 3) document.getElementById("mstatus").textContent = "회의실 테이블은 3개라서 동시에 3개 회의까지 앉을 수 있어요. 나머지는 자리가 나길 기다려요.";
}
function resetMeetForm() { mSel = {}; mEditId = ""; document.getElementById("mname").value = ""; document.getElementById("msave").textContent = "회의 만들고 시작"; document.getElementById("mcancelbtn").hidden = true; renderPick(); }
function meetDone() { renderMeets(); syncMeetings(false); }
document.getElementById("meetpane").addEventListener("click", function (e) {
  var st = document.getElementById("mstatus"), b;
  if ((b = e.target.closest(".pk"))) {
    var id = b.dataset.id;
    if (mSel[id]) delete mSel[id];
    else if (Object.keys(mSel).length >= 8) { st.textContent = "한 테이블에는 8명까지 앉을 수 있어요."; return; }
    else mSel[id] = 1;
    st.textContent = ""; b.setAttribute("aria-pressed", String(!!mSel[id])); updatePickCount(); return;
  }
  if (e.target.closest("#mcancelbtn")) { resetMeetForm(); st.textContent = ""; return; }
  if (e.target.closest("#msave")) {
    var name = document.getElementById("mname").value.trim().slice(0, 30), ids = Object.keys(mSel);
    if (!name) { st.textContent = "회의 이름을 적어주세요."; return; }
    if (!ids.length) { st.textContent = "참석자를 한 명 이상 골라주세요."; return; }
    var prev = mEditId ? store.meetings[mEditId] : null;
    commit("meetings", mEditId || newId("m"), { t: name, m: ids, on: prev ? !!prev.on : true, at: prev ? (+prev.at || Date.now()) : Date.now() }, function () { st.textContent = ""; resetMeetForm(); meetDone(); }, "#mstatus");
    return;
  }
  if ((b = e.target.closest(".mtoggle"))) {
    var m = store.meetings[b.dataset.id]; if (!m) return;
    commit("meetings", b.dataset.id, { t: m.t, m: m.m, on: !m.on, at: m.at }, meetDone, "#mstatus"); return;
  }
  if ((b = e.target.closest(".medit"))) {
    var mm = store.meetings[b.dataset.id]; if (!mm) return;
    mEditId = b.dataset.id; mSel = {};
    (mm.m || []).forEach(function (x) { if (indexOfId(x) >= 0) mSel[x] = 1; });
    document.getElementById("mname").value = mm.t; document.getElementById("msave").textContent = "수정 저장"; document.getElementById("mcancelbtn").hidden = false;
    renderPick(); document.getElementById("mname").focus(); return;
  }
  if ((b = e.target.closest(".mdel"))) {
    if (armed === b.dataset.id) { armed = ""; if (mEditId === b.dataset.id) resetMeetForm(); commit("meetings", b.dataset.id, null, meetDone, "#mstatus"); }
    else { armed = b.dataset.id; renderMeets(); }
    return;
  }
  if (armed) { armed = ""; renderMeets(); }
});
document.getElementById("mname").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("msave").click(); } });

/* ---- 프로젝트 화면 ---- */
var renaming = {}, pArm = "", pNewHeroes = {};
function renderProjectHeroPick() {
  var box = document.getElementById("project-hero-pick");
  if (!box) return;
  var heroes = DATA.filter(function (d) { return !d.ext; });
  box.innerHTML = heroes.map(function (d) {
    var id = jobId(d);
    return '<button type="button" class="pk" data-hero-id="' + esc(id) + '" aria-pressed="' + !!pNewHeroes[id] + '">' + esc(d.n) + '</button>';
  }).join("") || '<span class="tempty">' + (WORLD_THEME === "office" ? "아직 등록된 직원이 없습니다." : "아직 등록된 영웅이 없습니다.") + "</span>";
}
function keepForm(root, fn) {
  var vals = {}, act = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null, els = root.querySelectorAll("[data-k]"), k;
  for (k = 0; k < els.length; k++) vals[els[k].dataset.k] = els[k].value;
  fn();
  els = root.querySelectorAll("[data-k]");
  for (k = 0; k < els.length; k++) if (vals[els[k].dataset.k] != null && els[k].dataset.k.indexOf("rn:") !== 0) els[k].value = vals[els[k].dataset.k];
  if (act) { var e2 = root.querySelector('[data-k="' + act + '"]'); if (e2) e2.focus(); }
}
function renderProjects() {
  var root = document.getElementById("plist"), can = canManageSharedOperations();
  refreshForms();
  renderProjectHeroPick();
  keepForm(root, function () {
    var h = "";
    PSLOTS.forEach(function (k) {
      var p = store.projects[k];
      if (!p || typeof p.name !== "string") return;
      var mem = Array.isArray(p.members) ? p.members : [];
      h += '<article class="pcard" style="--c:' + UNI[k].color + '"><div class="phead">';
      if (renaming[k]) h += '<input class="pin" type="text" data-k="rn:' + k + '" maxlength="16" aria-label="프로젝트 이름" value="' + esc(p.name) + '"><button type="button" class="prensave" data-p="' + k + '">저장</button><button type="button" class="prencancel" data-p="' + k + '">취소</button>';
      else h += "<h3>" + esc(p.name) + "</h3>" + (can ? '<button type="button" class="mini prename" data-p="' + k + '">이름 바꾸기</button>' : "");
      h += '</div><div class="pmem">';
      mem.forEach(function (m) {
        h += '<span class="mchip">' + esc(m.n) + (m.t ? " · " + esc(m.t) : "") + (can ? '<button type="button" class="prm" data-p="' + k + '" data-id="' + esc(m.id) + '" aria-label="' + esc(m.n) + ' 명단에서 빼기">✕</button>' : "") + "</span>";
      });
      h += (mem.length ? "" : '<span class="tempty">아직 명단이 비어 있어요.</span>') + "</div>";
      if (can) h += '<div class="jrow"><input class="pin" type="text" data-k="pn:' + k + '" maxlength="30" placeholder="이름" aria-label="팀원 이름"><input class="pin" type="text" data-k="pt:' + k + '" maxlength="10" placeholder="역할·직함 (선택)" aria-label="팀원 역할"><select class="pin" data-k="pg:' + k + '" aria-label="캐릭터 성별"><option value="m">남</option><option value="f">여</option></select><button type="button" class="pmadd" data-p="' + k + '">명단에 추가</button></div>' +
        '<div class="jrow"><button type="button" class="pdel' + (pArm === k ? " arm" : "") + '" data-p="' + k + '">' + (pArm === k ? "정말 삭제? 공간과 명단이 함께 사라져요" : "프로젝트 삭제") + "</button></div>";
      h += "</article>";
    });
    root.innerHTML = h || '<p class="tempty">아직 프로젝트 팀이 없어요. 위에서 이름을 적고 만들어보세요.</p>';
  });
}
function afterProjects() { rebuildExternal(false); renderProjects(); renderPick(); renderMeets(); }
function projDoc(k, patch) { var p = store.projects[k]; return { name: patch.name != null ? patch.name : p.name, members: patch.members != null ? patch.members : (p.members || []) }; }
function addMember(k) {
  var pn = document.querySelector('[data-k="pn:' + k + '"]'), pt = document.querySelector('[data-k="pt:' + k + '"]'), pg = document.querySelector('[data-k="pg:' + k + '"]');
  var st = document.getElementById("pstatus"), n = pn.value.trim().slice(0, 30), mem = store.projects[k].members || [];
  if (!n) { st.textContent = "팀원 이름을 적어주세요."; pn.focus(); return; }
  if (mem.length >= 20) { st.textContent = "한 프로젝트에는 20명까지 넣을 수 있어요."; return; }
  st.textContent = "";
  commit("projects", k, projDoc(k, { members: mem.concat([{ id: newId("x"), n: n, t: pt.value.trim().slice(0, 10), g: pg.value === "f" ? "f" : "m" }]) }), function () {
    pn.value = ""; pt.value = ""; afterProjects(); var again = document.querySelector('[data-k="pn:' + k + '"]'); if (again) again.focus();
  }, "#pstatus");
}
function renameProject(k) {
  var inp = document.querySelector('[data-k="rn:' + k + '"]'), st = document.getElementById("pstatus"), n = inp ? inp.value.trim().slice(0, 16) : "";
  if (!n) { st.textContent = "프로젝트 이름을 적어주세요."; return; }
  commit("projects", k, projDoc(k, { name: n }), function () { delete renaming[k]; st.textContent = ""; afterProjects(); }, "#pstatus");
}
function createProject() {
  var inp = document.getElementById("pname"), st = document.getElementById("pstatus"), n = inp.value.trim().slice(0, 16), slot = null;
  PSLOTS.forEach(function (k) { if (!slot && !store.projects[k]) slot = k; });
  if (!n) { st.textContent = "프로젝트 이름을 적어주세요."; return; }
  if (!slot) { st.textContent = "프로젝트 팀은 3개까지 만들 수 있어요. 끝난 팀을 삭제하면 자리가 생겨요."; return; }
  var members = Object.keys(pNewHeroes).map(function (id) {
    return DATA.filter(function (d) { return jobId(d) === id; })[0];
  }).filter(Boolean).map(function (d) { return { id: d.id, n: d.n, t: ttl(d), g: d.g }; });
  commit("projects", slot, { name: n, members: members }, function () { inp.value = ""; pNewHeroes = {}; st.textContent = ""; afterProjects(); }, "#pstatus");
}
document.getElementById("projpane").addEventListener("click", function (e) {
  var b, st = document.getElementById("pstatus");
  if (e.target.closest("#padd")) { createProject(); return; }
  if ((b = e.target.closest("[data-hero-id]"))) {
    if (pNewHeroes[b.dataset.heroId]) delete pNewHeroes[b.dataset.heroId]; else pNewHeroes[b.dataset.heroId] = true;
    b.setAttribute("aria-pressed", String(!!pNewHeroes[b.dataset.heroId]));
    return;
  }
  if ((b = e.target.closest(".prename"))) { renaming[b.dataset.p] = true; renderProjects(); var ri = document.querySelector('[data-k="rn:' + b.dataset.p + '"]'); if (ri) { ri.focus(); ri.select(); } return; }
  if ((b = e.target.closest(".prencancel"))) { delete renaming[b.dataset.p]; renderProjects(); return; }
  if ((b = e.target.closest(".prensave"))) { renameProject(b.dataset.p); return; }
  if ((b = e.target.closest(".pmadd"))) { addMember(b.dataset.p); return; }
  if ((b = e.target.closest(".prm"))) {
    var k = b.dataset.p, id = b.dataset.id, mem = (store.projects[k].members || []).filter(function (m) { return m.id !== id; });
    commit("projects", k, projDoc(k, { members: mem }), function () { if (store.tasks[id]) commit("tasks", id, null, null, "#pstatus"); afterProjects(); }, "#pstatus"); return;
  }
  if ((b = e.target.closest(".pdel"))) {
    var pk = b.dataset.p;
    if (pArm === pk) {
      var ids = (store.projects[pk].members || []).map(function (m) { return m.id; });
      pArm = ""; delete renaming[pk];
      commit("projects", pk, null, function () { ids.forEach(function (id) { if (store.tasks[id]) commit("tasks", id, null, null, "#pstatus"); }); afterProjects(); }, "#pstatus");
    } else { pArm = pk; renderProjects(); }
    return;
  }
  if (pArm) { pArm = ""; renderProjects(); }
  st.textContent = st.textContent;
});
document.getElementById("projpane").addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  var k = e.target.dataset ? e.target.dataset.k : "", id = e.target.id;
  if (id === "pname") { e.preventDefault(); createProject(); }
  else if (k && k.indexOf("pn:") === 0) { e.preventDefault(); addMember(k.slice(3)); }
  else if (k && k.indexOf("pt:") === 0) { e.preventDefault(); addMember(k.slice(3)); }
  else if (k && k.indexOf("rn:") === 0) { e.preventDefault(); renameProject(k.slice(3)); }
});

/* ---- 간식 화면 ---- */
var sSel = [], sTeam = "", sEditId = "", sArm = "";
function addDays(s, n) { var p = s.split("-"), t = new Date(+p[0], +p[1] - 1, +p[2] + n); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2); }
function renderSnackForm() {
  var h = "", f = "", seen = {};
  Object.keys(UNI).forEach(function (k) {
    if (UNI[k].hidden) return;
    h += '<button type="button" class="sk-team" style="--c:' + UNI[k].color + '" data-u="' + k + '" aria-pressed="' + (sTeam === k) + '">' + esc(UNI[k].realm) + "</button>";
  });
  document.getElementById("steams").innerHTML = h;
  FOODS.concat(sSel).forEach(function (t) {
    if (seen[t]) return; seen[t] = 1;
    f += '<button type="button" class="sk-item" data-f="' + esc(t) + '" aria-pressed="' + (sSel.indexOf(t) >= 0) + '">' + esc(t) + "</button>";
  });
  document.getElementById("sfoods").innerHTML = f;
  document.getElementById("sfc").textContent = "(" + sSel.length + "개 / 최대 6개)";
}
function renderSnack() {
  var can = canManageSharedOperations(), t = todayStr(), h = "", ids = Object.keys(store.snacks);
  refreshForms();
  ids.sort(function (a, b) { return (store.snacks[a].from || "").localeCompare(store.snacks[b].from || ""); });
  ids.forEach(function (id) {
    var s = store.snacks[id];
    if (!s || !UNI[s.u]) return;
    var st = t < s.from ? "예정" : t > s.to ? "종료" : "진행 중", items = Array.isArray(s.items) ? s.items : [];
    h += '<article class="scard' + (st === "진행 중" ? " on" : "") + (st === "종료" ? " past" : "") + '"><div class="mhead"><b>' + esc(UNI[s.u].realm) + '</b><span class="sst">' + st + '</span></div>' +
      '<p class="mnames">' + md(s.from) + " ~ " + md(s.to) + '</p><div class="pmem">' + items.map(function (x) { return '<span class="mchip" style="padding-right:11px">' + esc(x) + "</span>"; }).join("") + "</div>" +
      (can ? '<div class="jrow"><button type="button" class="sedit" data-id="' + esc(id) + '">수정</button><button type="button" class="sdel' + (sArm === id ? " arm" : "") + '" data-id="' + esc(id) + '">' + (sArm === id ? "정말 삭제?" : "삭제") + "</button></div>" : "") + "</article>";
  });
  document.getElementById("slist").innerHTML = h || '<p class="tempty">아직 등록된 간식 당번이 없어요.</p>';
}
function resetSnackForm() {
  var t = todayStr();
  sSel = []; sTeam = ""; sEditId = "";
  document.getElementById("sfrom").value = t; document.getElementById("sto").value = addDays(t, 4);
  document.getElementById("sfree").value = ""; document.getElementById("ssave").textContent = "간식 당번 등록"; document.getElementById("scancel").hidden = true;
  renderSnackForm();
}
function snackAdd(text) {
  var v = String(text || "").trim().slice(0, 10), st = document.getElementById("sstatus");
  if (!v) return;
  if (sSel.indexOf(v) >= 0) { document.getElementById("sfree").value = ""; return; }
  if (sSel.length >= 6) { st.textContent = "먹을거리는 6개까지 고를 수 있어요."; return; }
  st.textContent = ""; sSel.push(v); document.getElementById("sfree").value = ""; renderSnackForm();
}
document.getElementById("snackpane").addEventListener("click", function (e) {
  var st = document.getElementById("sstatus"), b;
  if ((b = e.target.closest(".sk-team"))) { sTeam = b.dataset.u; renderSnackForm(); return; }
  if ((b = e.target.closest(".sk-item"))) {
    var f = b.dataset.f, k = sSel.indexOf(f);
    if (k >= 0) sSel.splice(k, 1); else snackAdd(f);
    st.textContent = k >= 0 ? "" : st.textContent; renderSnackForm(); return;
  }
  if (e.target.closest("#sfreeadd")) { snackAdd(document.getElementById("sfree").value); return; }
  if (e.target.closest("#scancel")) { resetSnackForm(); st.textContent = ""; return; }
  if (e.target.closest("#ssave")) {
    var from = document.getElementById("sfrom").value, to = document.getElementById("sto").value;
    if (!sTeam) { st.textContent = "담당팀을 골라주세요."; return; }
    if (!from) { st.textContent = "시작일을 정해주세요."; return; }
    if (!to) to = from;
    if (to < from) { var tmp = from; from = to; to = tmp; }
    if (!sSel.length) { st.textContent = "먹을거리를 한 가지 이상 골라주세요."; return; }
    commit("snacks", sEditId || newId("s"), { u: sTeam, from: from, to: to, items: sSel.slice() }, function () { st.textContent = ""; resetSnackForm(); renderSnack(); renderPortals(); }, "#sstatus");
    return;
  }
  if ((b = e.target.closest(".sedit"))) {
    var s = store.snacks[b.dataset.id]; if (!s) return;
    sEditId = b.dataset.id; sTeam = s.u; sSel = (s.items || []).slice();
    document.getElementById("sfrom").value = s.from; document.getElementById("sto").value = s.to;
    document.getElementById("ssave").textContent = "수정 저장"; document.getElementById("scancel").hidden = false; renderSnackForm(); return;
  }
  if ((b = e.target.closest(".sdel"))) {
    if (sArm === b.dataset.id) { sArm = ""; if (sEditId === b.dataset.id) resetSnackForm(); commit("snacks", b.dataset.id, null, function () { renderSnack(); renderPortals(); }, "#sstatus"); }
    else { sArm = b.dataset.id; renderSnack(); }
    return;
  }
  if (sArm) { sArm = ""; renderSnack(); }
});
document.getElementById("sfree").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); snackAdd(e.target.value); } });

/* ---- 공지와 개인·그룹 채팅 ---- */
var chatMe = "", chatSeen = 0, privateSeen = 0, chatMode = "notice", privateContacts = [], activePrivateRoom = "", activePrivateRecipients = [];
try { chatMe = localStorage.getItem("ops-me") || ""; chatSeen = +localStorage.getItem("ops-chat-seen") || 0; privateSeen = +localStorage.getItem("ops-private-seen") || 0; } catch (e) {}
function chatList() {
  return Object.keys(store.chat).map(function (id) {
    var m = store.chat[id];
    return m && typeof m.p === "string" && typeof m.t === "string" ? { id: id, p: m.p, t: m.t.slice(0, 200), at: +m.at || 0 } : null;
  }).filter(Boolean).sort(function (a, b) { return a.at - b.at || a.id.localeCompare(b.id); }).slice(-100);
}
function privateMessageList() {
  return Object.keys(store.privateChats).map(function (id) { return store.privateChats[id]; })
    .filter(function (message) { return message && Array.isArray(message.participants) && typeof message.room === "string"; })
    .sort(function (a, b) { return (+a.at || 0) - (+b.at || 0); });
}
function fmtT(at) { var d = new Date(at); return (d.getMonth() + 1) + "/" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function updateBadge() {
  var b = document.getElementById("cbadge"), n = chatList().filter(function (m) { return m.at > chatSeen && m.p !== chatMe; }).length;
  b.textContent = n > 99 ? "99+" : n; b.hidden = !n || state.view === "chat";
  updatePrivateBadge();
}
function updatePrivateBadge() {
  var badge = document.getElementById("private-badge"), count = privateMessageList().filter(function (m) { return m.sender !== currentUser && (+m.at || 0) > privateSeen; }).length;
  if (!badge) return;
  badge.textContent = count > 99 ? "99+" : count;
  badge.hidden = !count || state.view !== "chat" || chatMode === "private";
}
function markPrivateSeen() {
  var messages = privateMessageList(), last = messages.length ? (+messages[messages.length - 1].at || 0) : 0;
  if (last > privateSeen) { privateSeen = last; try { localStorage.setItem("ops-private-seen", String(privateSeen)); } catch (e) {} }
  updatePrivateBadge();
}
function markSeen() {
  var l = chatList(), last = l.length ? l[l.length - 1].at : 0;
  if (last > chatSeen) { chatSeen = last; try { localStorage.setItem("ops-chat-seen", String(chatSeen)); } catch (e) {} }
  updateBadge();
}
function renderChatWho() {
  var h = '<option value="">공지 작성 캐릭터</option>';
  DATA.forEach(function (d) {
    var id = jobId(d);
    if (currentRole !== "ADMIN" && id !== currentCharacterId) return;
    h += '<option value="' + esc(id) + '"' + (id === chatMe ? " selected" : "") + ">" + esc(d.n) + (ttl(d) ? " · " + esc(ttl(d)) : "") + "</option>";
  });
  document.getElementById("cwho").innerHTML = h;
  if (currentRole !== "ADMIN") chatMe = currentCharacterId || "";
  if (chatMe && indexOfId(chatMe) < 0) chatMe = "";
  document.getElementById("cwho").value = chatMe;
}
function renderChat(forceBottom) {
  var el = document.getElementById("clist"), list = chatList(), byId = {}, h = "", can = currentCanAnnounce;
  var atBottom = forceBottom || el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  DATA.forEach(function (d) { byId[jobId(d)] = d; });
  refreshForms();
  list.forEach(function (m) {
    var d = byId[m.p];
    h += '<div class="cmsg' + (m.p === chatMe ? " me" : "") + '"><div class="cbody"><b>' + (d ? esc(d.n) : "공지") + "</b><time>" + fmtT(m.at) + "</time>" +
      (can && (currentRole === "ADMIN" || m.p === currentCharacterId) ? '<button type="button" class="cdel" data-id="' + esc(m.id) + '">삭제</button>' : "") + "<p>" + esc(m.t) + "</p></div></div>";
  });
  el.innerHTML = h || '<p class="tempty">등록된 공지가 없어요.</p>';
  if (atBottom) el.scrollTop = el.scrollHeight;
}
function sendChat() {
  var inp = document.getElementById("cin"), st = document.getElementById("cstatus"), t = inp.value.trim().slice(0, 200);
  if (!currentCanAnnounce) { st.textContent = "팀장·상무급 캐릭터 또는 관리자만 공지를 등록할 수 있어요."; return; }
  if (!chatMe) { st.textContent = "공지 작성 캐릭터가 없습니다."; return; }
  if (!t) return;
  st.textContent = "";
  commit("chat", newId("c"), { p: chatMe, t: t, at: Date.now() }, function () { inp.value = ""; renderChat(true); markSeen(); inp.focus(); }, "#cstatus");
}
function contactName(username) {
  if (username === currentUser) {
    var mine = DATA.filter(function (d) { return d.id === currentCharacterId; })[0];
    return (mine ? mine.n : currentUser) + " (나)";
  }
  var contact = privateContacts.filter(function (item) { return item.username === username; })[0];
  return contact ? contact.name + " (" + username + ")" : username;
}
function renderPrivateContacts() {
  var list = document.getElementById("private-recipients"), selected = {};
  list.querySelectorAll("input:checked").forEach(function (input) { selected[input.value] = true; });
  list.innerHTML = privateContacts.map(function (contact) {
    return '<label class="private-contact"><input type="checkbox" value="' + esc(contact.username) + '"' + (selected[contact.username] ? " checked" : "") + '><span>' + esc(contact.name) + " · " + esc(contact.username) + "</span></label>";
  }).join("") || '<p class="private-contact-empty">대화할 사용자가 없습니다.</p>';
}
function privateRoomTitle(message) {
  return message.participants.filter(function (username) { return username !== currentUser; }).map(contactName).join(", ");
}
function renderPrivateChat() {
  var messages = privateMessageList(), rooms = {}, roomButtons = "", log = document.getElementById("private-log"), title = document.getElementById("private-title");
  messages.forEach(function (message) { rooms[message.room] = message; });
  Object.keys(rooms).map(function (room) { return rooms[room]; }).sort(function (a, b) { return (+b.at || 0) - (+a.at || 0); }).forEach(function (message) {
    roomButtons += '<button type="button" class="private-room" data-room="' + esc(message.room) + '" aria-current="' + (message.room === activePrivateRoom) + '">' + esc(privateRoomTitle(message)) + "<br><small>" + esc(message.text) + "</small></button>";
  });
  document.getElementById("private-rooms").innerHTML = roomButtons || '<p class="tempty">아직 대화가 없어요.</p>';
  var active = messages.filter(function (message) { return activePrivateRoom && message.room === activePrivateRoom; });
  if (active.length) {
    var last = active[active.length - 1];
    activePrivateRecipients = last.participants.filter(function (username) { return username !== currentUser; });
    title.textContent = privateRoomTitle(last);
  } else if (activePrivateRecipients.length) {
    title.textContent = activePrivateRecipients.map(contactName).join(", ");
  } else title.textContent = "대화 상대를 선택하세요";
  log.innerHTML = active.map(function (message) {
    return '<div class="cmsg' + (message.sender === currentUser ? " me" : "") + '"><div class="cbody"><b>' + esc(contactName(message.sender)) + "</b><time>" + fmtT(message.at) + "</time><p>" + esc(message.text) + "</p></div></div>";
  }).join("") || '<p class="tempty">' + (activePrivateRecipients.length ? "첫 메시지를 보내보세요." : "대화 상대를 선택하세요.") + "</p>";
  log.scrollTop = log.scrollHeight;
  if (state.view === "chat" && chatMode === "private") markPrivateSeen(); else updatePrivateBadge();
}
function openPrivateConversation() {
  var list = document.getElementById("private-recipients"), recipients = [];
  list.querySelectorAll("input:checked").forEach(function (input) { recipients.push(input.value); });
  if (!recipients.length) { document.getElementById("private-status").textContent = "대화 상대를 한 명 이상 선택해 주세요."; return; }
  activePrivateRecipients = recipients;
  activePrivateRoom = "";
  var existing = privateMessageList().filter(function (message) {
    var others = message.participants.filter(function (username) { return username !== currentUser; }).sort();
    return others.join("|") === recipients.slice().sort().join("|");
  });
  if (existing.length) activePrivateRoom = existing[existing.length - 1].room;
  document.getElementById("private-status").textContent = "";
  renderPrivateChat();
  document.getElementById("private-input").focus();
}
function sendPrivateChat() {
  var input = document.getElementById("private-input"), status = document.getElementById("private-status"), text = input.value.trim();
  if (!dbRef || !activePrivateRecipients.length) { status.textContent = "대화 상대를 먼저 선택해 주세요."; return; }
  if (!text) return;
  dbRef.sendPrivateMessage(activePrivateRecipients, text).then(function (message) {
    input.value = ""; activePrivateRoom = message.room; status.textContent = ""; renderPrivateChat(); input.focus();
  }, function () { status.textContent = "메시지를 보내지 못했습니다. 대화 상대와 연결을 확인해 주세요."; });
}
document.getElementById("chat-modes").addEventListener("click", function (event) {
  var button = event.target.closest("[data-chat-mode]");
  if (!button) return;
  chatMode = button.dataset.chatMode;
  document.getElementById("notice-pane").hidden = chatMode !== "notice";
  document.getElementById("private-pane").hidden = chatMode !== "private";
  document.querySelectorAll("#chat-modes .chat-mode").forEach(function (tab) { tab.setAttribute("aria-selected", String(tab === button)); });
  if (chatMode === "private") { renderPrivateChat(); markPrivateSeen(); }
  else { renderChat(); markSeen(); }
});
document.getElementById("private-open").addEventListener("click", openPrivateConversation);
document.getElementById("private-rooms").addEventListener("click", function (event) {
  var button = event.target.closest("[data-room]");
  if (!button) return;
  activePrivateRoom = button.dataset.room; renderPrivateChat(); document.getElementById("private-input").focus();
});
document.getElementById("private-send").addEventListener("click", sendPrivateChat);
document.getElementById("private-input").addEventListener("keydown", function (event) { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); sendPrivateChat(); } });
document.getElementById("cwho").addEventListener("change", function (event) { chatMe = event.target.value; renderChat(); });
document.getElementById("csend").addEventListener("click", sendChat);
document.getElementById("cin").addEventListener("keydown", function (event) { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); sendChat(); } });
document.getElementById("clist").addEventListener("click", function (event) {
  var button = event.target.closest(".cdel");
  if (button) commit("chat", button.dataset.id, null, function () { renderChat(); updateBadge(); }, "#cstatus");
});

/* ---- 멤버 화면: 편집 권한이 있는 사람이 입력해서 추가해요 ---- */
var SIDES = [["front", "프론트"], ["back", "백오피스"]];
var adminAccountsLoaded = false;
function renderAdminCharacterAccounts() {
  var form = document.getElementById("admin-character-form");
  if (!form || !dbRef || currentRole !== "ADMIN" || adminAccountsLoaded) return;
  adminAccountsLoaded = true;
  dbRef.adminAccounts().then(function (accounts) {
    var select = document.getElementById("admin-character-account");
    select.innerHTML = (accounts || []).map(function (account) {
      return '<option value="' + esc(account.username) + '">' + esc(account.username) + " · 캐릭터 " + account.characterCount + "개</option>";
    }).join("") || '<option value="">계정이 없습니다</option>';
  }, function () {
    adminAccountsLoaded = false;
    document.getElementById("admin-character-status").textContent = "계정 목록을 불러오지 못했습니다.";
  });
}
function createAdminCharacter() {
  var account = document.getElementById("admin-character-account").value;
  var nameInput = document.getElementById("admin-character-name");
  var status = document.getElementById("admin-character-status");
  var name = nameInput.value.trim();
  if (!account) { status.textContent = "계정을 선택해 주세요."; return; }
  if (!name) { status.textContent = "캐릭터 이름을 입력해 주세요."; nameInput.focus(); return; }
  status.textContent = "";
  dbRef.createAdminCharacter({ username: account, n: name, g: "m", u: document.getElementById("admin-character-universe").value }).then(function () {
    nameInput.value = ""; status.textContent = "캐릭터를 계정에 연결했습니다."; adminAccountsLoaded = false; afterPeople();
  }, function () { status.textContent = "캐릭터를 생성하지 못했습니다."; });
}
function subUnis(side) { return Object.keys(UNI).filter(function (k) { var u = UNI[k]; return u.side === side && !u.hidden && k !== "fgen" && k !== "bgen"; }); }
function fillSub() {
  var sd = document.getElementById("tmside").value, sub = document.getElementById("tmsub"), h = '<option value="">소분류 (선택 안 함)</option>';
  subUnis(sd).forEach(function (k) { h += '<option value="' + k + '">' + esc(UNI[k].name) + "</option>"; });
  sub.innerHTML = h;
}
function pickedUni() { var sd = document.getElementById("tmside").value, sub = document.getElementById("tmsub").value; return sub && UNI[sub] && UNI[sub].side === sd ? sub : (sd === "back" ? "bgen" : "fgen"); }
function renderTeam() {
  var can = canEditJobs(), sdEl = document.getElementById("tmside"), ps = sdEl.value, sb = document.getElementById("tmsub").value, h = "";
  refreshForms();
  renderAdminCharacterAccounts();
  document.getElementById("teamnote").hidden = can;
  if (!sdEl.options.length) sdEl.innerHTML = SIDES.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
  if (ps) sdEl.value = ps;
  fillSub();
  if (sb && document.getElementById("tmsub").querySelector('option[value="' + sb + '"]')) document.getElementById("tmsub").value = sb;
  var mems = DATA.filter(function (d) { return !d.ext; });
  mems.forEach(function (d) {
    var id = jobId(d), action = d.accountCharacter ? "캐릭터 삭제" : "명단에서 제외";
    h += '<span class="mchip" style="padding-right:' + (can && d.mem ? 4 : 11) + 'px">' + esc(d.n) + (ttl(d) ? " · " + esc(ttl(d)) : "") + " · " + esc(UNI[uOf(d)].realm) +
      (can && d.mem ? '<button type="button" class="tmdel" data-id="' + esc(id) + '" aria-label="' + esc(d.n) + " " + action + '" title="' + action + '"><span class="icon-x" aria-hidden="true"></span></button>' : "") + "</span>";
  });
  document.getElementById("teamlist").innerHTML = h;
  document.getElementById("teamcount").textContent = "(" + mems.length + "명)";
}
function afterPeople() { rebuildExternal(false); renderTeam(); renderPick(); renderMeets(); }
function addPerson() {
  var st = document.getElementById("teamstatus"), n = document.getElementById("tmname").value.trim().slice(0, 30), list = peopleList();
  if (!n) { st.textContent = "닉네임을 적어주세요."; return; }
  if (DATA.some(function (d) { return d.n === n; })) { st.textContent = "이미 있는 닉네임이에요. 다른 닉네임을 적어주세요."; return; }
  if (list.length >= 40) { st.textContent = "멤버는 40명까지 추가할 수 있어요."; return; }
  st.textContent = "";
  list = list.concat([{ id: newId("p"), n: n, g: document.getElementById("tmg").value === "f" ? "f" : "m", t: document.getElementById("tmtitle").value.trim().slice(0, 8), u: pickedUni(), c: document.getElementById("tmjob").value.trim().slice(0, 16) }]);
  commit("people", "main", { list: list }, function () {
    ["tmname", "tmtitle", "tmjob"].forEach(function (id) { document.getElementById(id).value = ""; });
    afterPeople(); document.getElementById("tmname").focus();
  }, "#teamstatus");
}
function removePerson(id) {
  var member = DATA.find(function (d) { return d.id === id; });
  if (member && member.accountCharacter && dbRef && currentRole === "ADMIN") {
    dbRef.deleteCharacter(id).then(function () { afterPeople(); }, function () {
      var status = document.getElementById("teamstatus");
      if (status) status.textContent = "캐릭터를 삭제하지 못했어요.";
    });
    return;
  }
  var list = peopleList().filter(function (x) { return x.id !== id; });
  commit("people", "main", list.length ? { list: list } : null, function () {
    if (store.tasks[id]) commit("tasks", id, null, null, "#teamstatus");
    afterPeople();
  }, "#teamstatus");
}
document.getElementById("teampane").addEventListener("click", function (e) {
  var b = e.target.closest(".tmdel");
  if (e.target.closest("#admin-character-create")) { createAdminCharacter(); return; }
  if (e.target.closest("#tmadd")) { addPerson(); return; }
  if (b) {
    var member = DATA.find(function (d) { return d.id === b.dataset.id; });
    var message = member && member.accountCharacter
      ? member.n + " 캐릭터를 완전히 삭제할까요?"
      : member.n + " 멤버를 명단에서 제외할까요?";
    if (window.confirm(message)) removePerson(b.dataset.id);
    return;
  }
});
document.getElementById("tmside").addEventListener("change", fillSub);
document.getElementById("tmname").addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); addPerson(); } });

function refreshPanes() {
  if (state.view === "team") renderTeam();
  if (state.view === "meet") renderMeets();
  if (state.view === "proj") renderProjects();
  if (state.view === "snack") renderSnack();
  if (state.view === "chat") { renderChat(); renderPrivateChat(); }
  if (openIdx !== null) renderTasks();
}
function setView(v) {
  state.view = v;
  var isMap = v === "map", isList = v === "list", pane = v === "meet" || v === "proj" || v === "snack" || v === "chat" || v === "team";
  document.getElementById("world").hidden = !isMap;
  document.getElementById("grid").hidden = !isList;
  document.getElementById("sort").hidden = !isList;
  document.getElementById("toolbar").hidden = pane;
  document.getElementById("portals").hidden = pane;
  document.getElementById("sides").hidden = pane;
  document.getElementById("meetpane").hidden = v !== "meet";
  document.getElementById("projpane").hidden = v !== "proj";
  document.getElementById("snackpane").hidden = v !== "snack";
  document.getElementById("chatpane").hidden = v !== "chat";
  document.getElementById("teampane").hidden = v !== "team";
  var bs = document.querySelectorAll("#views .nb"), i;
  for (i = 0; i < bs.length; i++) { bs[i].setAttribute("aria-pressed", String(bs[i].dataset.v === v)); if (bs[i].dataset.v === v && bs[i].scrollIntoView) { try { bs[i].scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} } }
  if (isMap) startMap();
  if (v === "meet") { renderPick(); renderMeets(); }
  if (v === "proj") renderProjects();
  if (v === "team") renderTeam();
  if (v === "chat") {
    chatMode = "notice";
    document.getElementById("notice-pane").hidden = false;
    document.getElementById("private-pane").hidden = true;
    document.querySelectorAll("#chat-modes .chat-mode").forEach(function (tab) { tab.setAttribute("aria-selected", String(tab.dataset.chatMode === chatMode)); });
    renderChatWho(); renderChat(true); renderPrivateChat(); markSeen();
  }
  else updateBadge();
  if (v === "snack") { if (!document.getElementById("sfrom").value) resetSnackForm(); else renderSnackForm(); renderSnack(); }
}
document.getElementById("views").addEventListener("click", function (e) { var b = e.target.closest(".nb"); if (b) setView(b.dataset.v); });
syncIntruders(true); syncMeetings(true);
setInterval(function () { syncMeetings(false); }, 5000);
document.getElementById("autolunch").addEventListener("change", function () { syncMeetings(false); });
function fillCfg() { var c = cfg(); document.getElementById("cfgls").value = c.ls; document.getElementById("cfgle").value = c.le; document.getElementById("cfgoe").value = c.oe; document.getElementById("boss-visit").checked = c.bossVisit; syncBossVisitUI(); }
function saveBossVisit(enabled) {
  var next = cfg(); next.bossVisit = !!enabled;
  commit("cfg", "main", next, function () { fillCfg(); applySeats(false); syncMeetings(false); }, "#cfgst");
}
function updateOT() {
  var n = DATA.filter(function (d) { return isOT(d) && !onLeave(d); }).length, el = document.getElementById("otcount");
  if (el) el.textContent = n ? "🌙 오늘 야근 " + n + "명" : "";
}
["cfgls", "cfgle", "cfgoe"].forEach(function (id) {
  document.getElementById(id).addEventListener("change", function () {
    var current = cfg(), v = { ls: document.getElementById("cfgls").value, le: document.getElementById("cfgle").value, oe: document.getElementById("cfgoe").value, bossVisit: current.bossVisit }, st = document.getElementById("cfgst");
    st.textContent = "";
    if (hmMin(v.ls) === null || hmMin(v.le) === null || hmMin(v.oe) === null || hmMin(v.le) <= hmMin(v.ls)) { st.textContent = "시간을 다시 확인해 주세요 (점심 끝이 시작보다 늦어야 해요)."; fillCfg(); return; }
    commit("cfg", "main", v, function () { fillCfg(); syncMeetings(false); }, "#cfgst");
  });
});
document.getElementById("boss-visit").addEventListener("change", function () { saveBossVisit(this.checked); });
fillCfg();
setView("map");

function setTheme(t, save) {
  t = t === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-ops-theme", t);
  if (save) { try { localStorage.setItem("ops-theme", t); } catch (e) {} }
  T = TH[t]; UC = {};
  var bs = document.querySelectorAll("#themebar .side"), k;
  for (k = 0; k < bs.length; k++) bs[k].setAttribute("aria-pressed", String(bs[k].dataset.t === t));
  spr = DATA.map(function (d) { return makeSprites(d); });
  paintMap();
}
function syncBossVisitUI() {
  var active = bossVisitOn(), control = document.getElementById("boss-visit-control"), checkbox = document.getElementById("boss-visit"), siren = document.getElementById("boss-siren");
  if (control) control.hidden = WORLD_THEME !== "office";
  if (checkbox) checkbox.checked = active;
  if (siren) siren.hidden = WORLD_THEME !== "office" || !active;
}
function syncOfficeCopy() {
  var office = WORLD_THEME === "office", total = document.getElementById("total"), lead = total && total.nextSibling;
  if (lead) lead.textContent = office ? "명의 직원이 서비스를 지킵니다." : "명의 영웅이 서비스를 지킵니다.";
  var groups = document.querySelectorAll("#views .nlab"), group = groups[0], roster = document.querySelector('#views [data-v="list"] span'), team = document.querySelector('#views [data-v="team"] span'), teamTitle = document.querySelector("#teampane h2"), projectLabel = document.querySelector("#projpane .project-hero-label"), picker = document.getElementById("project-hero-pick"), map = document.getElementById("map"), world = document.getElementById("world");
  if (group) group.textContent = office ? "직원" : "영웅";
  if (groups[1]) groups[1].textContent = office ? "업무" : "군영";
  if (roster) roster.textContent = office ? "직원 명단" : "영웅 명부";
  if (team) team.textContent = office ? "직원 관리" : "영웅 모집";
  if (teamTitle) teamTitle.textContent = office ? "직원 관리" : "영웅 모집";
  if (projectLabel) projectLabel.textContent = office ? "기존 직원을 프로젝트팀에 합류시키기 (선택)" : "기존 영웅을 팀에 합류시키기 (선택)";
  if (picker) picker.setAttribute("aria-label", office ? "프로젝트에 합류시킬 기존 직원" : "프로젝트에 합류시킬 기존 영웅");
  var projectNav = document.querySelector('#views [data-v="proj"] span'), meetingNav = document.querySelector('#views [data-v="meet"] span'), snackNav = document.querySelector('#views [data-v="snack"] span'), chatNav = document.querySelector('#views [data-v="chat"] span'), projectTitle = document.querySelector("#projpane h2"), meetingTitle = document.querySelector("#meetpane h2"), snackTitle = document.querySelector("#snackpane h2"), mapGuide = document.getElementById("map-guide"), meetingGuide = document.getElementById("meeting-guide");
  if (projectNav) projectNav.textContent = office ? "프로젝트 팀" : "용병단";
  if (meetingNav) meetingNav.textContent = office ? "회의" : "작전 회의";
  if (snackNav) snackNav.textContent = office ? "간식" : "보급";
  if (chatNav) chatNav.textContent = office ? "공지·채팅" : "전령";
  if (projectTitle) projectTitle.textContent = office ? "프로젝트 팀" : "용병단";
  if (meetingTitle) meetingTitle.textContent = office ? "회의" : "작전 회의";
  if (snackTitle) snackTitle.textContent = office ? "간식 담당" : "보급 담당";
  if (mapGuide) mapGuide.textContent = office ? "49개 자리로 구성된 사무실이에요. 47개 직원 좌석과 두 번째 줄 첫 두 칸의 ftp, ER 전용 PC가 있어요. 직원 시트에서 빈 자리를 선택할 수 있고, 오전 9시부터 퇴근 설정 시간까지 업무중인 직원은 자기 책상에 앉아요. 점심에는 직원들이 모이지 않고 머리 위에 식사 아이콘만 표시돼요." : "캐릭터 시트의 「자리」에서 빈 좌석을 선택할 수 있어요. 다른 캐릭터가 고른 좌석은 선택할 수 없고, 오전 9시부터 퇴근 설정 시간까지 「업무중」 상태인 캐릭터는 자기 책상에 앉아요. 점심·휴식·회의·연차 중에는 자리를 비웁니다.";
  if (meetingGuide) meetingGuide.textContent = office ? "사무실 오른쪽에 분리된 회의실 3개가 있어요. 회의 이름과 참석자를 정하면 지정된 회의실에 표시되고, 회의가 끝나면 각자 자리로 돌아갑니다. 연차인 직원은 참석할 수 없고, 회의실마다 최대 8명까지 참석할 수 있어요." : "회의 이름과 참석자를 정하면 지도 아래쪽 회의실 테이블에 표시돼요. 회의가 끝나면 각자 자리로 돌아가고, 연차인 사람은 참석할 수 없어요. 테이블은 3개이며 각 회의에 최대 8명까지 참석할 수 있어요.";
  if (map) map.setAttribute("aria-label", office ? "49개 자리로 구성된 사무실. 47개 직원 좌석과 두 번째 줄의 ftp, ER 전용 PC가 있습니다." : "멀티버스 지도. 영웅 캐릭터가 움직이고, 회의실과 프로젝트 구역이 있습니다.");
  if (world) world.setAttribute("aria-label", office ? "사무실 지도" : "멀티버스 지도");
  syncBossVisitUI();
}
function setWorldTheme(theme, save) {
  WORLD_THEME = theme === "space" || theme === "battlefield" ? theme : "office";
  document.documentElement.setAttribute("data-world-theme", WORLD_THEME);
  if (save) { try { localStorage.setItem("ops-world-theme", WORLD_THEME); } catch (e) {} }
  var buttons = document.querySelectorAll("#world-themebar .side");
  buttons.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.worldTheme === WORLD_THEME)); });
  syncOfficeCopy();
  spr = DATA.map(function (d) { return makeSprites(d); });
  UC = {};
  paintMap();
  walkers.forEach(function (walker) { walker.a = wanderOf(walker.u); });
  applySeats(false); syncMeetings(false);
  renderGrid();
  if (state.view === "proj") renderProjects();
  if (state.view === "team") renderTeam();
  if (openIdx !== null) openSheet(openIdx, null);
  if (bgm.playing) { stopBgm(); startBgm(); }
}
document.getElementById("themebar").addEventListener("click", function (e) { var b = e.target.closest(".side"); if (b) setTheme(b.dataset.t, true); });
document.getElementById("world-themebar").addEventListener("click", function (e) { var b = e.target.closest("[data-world-theme]"); if (b) setWorldTheme(b.dataset.worldTheme, true); });
document.getElementById("bgm-toggle").addEventListener("click", toggleBgm);
syncBgmButton();
setTheme(document.documentElement.getAttribute("data-ops-theme"), false);
setWorldTheme(document.documentElement.getAttribute("data-world-theme"), false);

if (window.claude && window.claude.use) {
  window.claude.use("user").then(function (u) {
    currentUser = u && u.info ? u.info.user : null;
    currentRole = u && u.info ? u.info.role : null;
    currentCharacterId = u && u.info ? u.info.characterId : null;
    currentCanAnnounce = currentRole === "ADMIN" || !!(u && u.info && u.info.canAnnounce);
    return u && u.can ? u.can("data.write") : null;
  }).then(function (v) { canWrite = v; refreshPanes(); renderGrid(); }, function () {});
  window.claude.use("db").then(function (db) {
    if (!db) return;
    dbRef = db;
    db.privateChatContacts().then(function (contacts) { privateContacts = contacts || []; renderPrivateContacts(); renderPrivateChat(); }, function () {});
    db.collection("privateChats").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (doc) { var value = doc.data(); if (value && Array.isArray(value.participants)) m[doc.id] = value; });
      store.privateChats = m;
      if (state.view === "chat" && chatMode === "private") renderPrivateChat();
      else updatePrivateBadge();
    }, function () {});
    var loaded = { tasks: false, meetings: false, projects: false, chat: false, seats: false, people: false };
    db.collection("people").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && Array.isArray(v.list)) m[x.id] = { list: v.list.slice(0, 60) }; });
      store.people = m;
      var first = !loaded.people; loaded.people = true;
      rebuildExternal(first);
      if (state.view === "team") renderTeam();
      if (state.view === "meet") { renderPick(); renderMeets(); }
    }, function () {});
    db.collection("seats").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && v.m && typeof v.m === "object") m[x.id] = { m: v.m }; });
      store.seats = m;
      var first = !loaded.seats; loaded.seats = true;
      applySeats(first); syncIntruders(first);
      var sp = document.getElementById("seatpanel");
      if (openIdx !== null && (!sp || sp.hidden)) openSheet(openIdx, null);
    }, function () {});
    db.collection("jobs").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.c === "string") m[x.id] = v.c; });
      jobs = m;
      renderGrid();
      var n = document.querySelector("#sheet .jobname");
      if (n && openIdx !== null) n.textContent = job(DATA[openIdx]);
    }, function () { dbRef = null; });
    db.collection("moves").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.u === "string" && UNI[v.u]) m[x.id] = v.u; });
      var first = !movesLoaded;
      movesLoaded = true; moves = m;
      applyMoves(first); syncIntruders(false); renderPortals(); renderGrid();
    }, function () {});
    db.collection("status").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.from === "string" && typeof v.to === "string") m[x.id] = { from: v.from, to: v.to }; });
      leaves = m; renderGrid(); syncMeetings(false);
      var al = document.querySelector("#sheet .attline");
      if (al && openIdx !== null) { al.textContent = "근태 · " + attText(DATA[openIdx]); al.className = "attline" + (onLeave(DATA[openIdx]) ? " off" : ""); }
      if (state.view === "meet") renderPick();
    }, function () {});
    db.collection("tasks").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && Array.isArray(v.items)) m[x.id] = { items: v.items }; });
      store.tasks = m;
      var first = !loaded.tasks; loaded.tasks = true;
      syncIntruders(first); renderGrid(); if (openIdx !== null) renderTasks();
    }, function () {});
    db.collection("chat").orderBy("at", "desc").limit(100).onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.p === "string" && typeof v.t === "string") m[x.id] = { p: v.p, t: v.t.slice(0, 200), at: +v.at || 0 }; });
      store.chat = m; loaded.chat = true;
      if (state.view === "chat") { renderChat(); markSeen(); } else updateBadge();
    }, function () {});
    db.collection("cfg").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.ls === "string") m[x.id] = { ls: v.ls, le: v.le, oe: v.oe, bossVisit: v.bossVisit === true }; });
      store.cfg = m; fillCfg(); applySeats(false); syncMeetings(false);
    }, function () {});
    db.collection("ot").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.d === "string") m[x.id] = { d: v.d, at: +v.at || 0 }; });
      store.ot = m; syncMeetings(false); renderGrid();
    }, function () {});
    db.collection("pres").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && ["work", "lunch", "break"].indexOf(v.s) >= 0 && typeof v.at === "number") m[x.id] = { s: v.s, at: v.at }; });
      store.pres = m; syncMeetings(false);
      var al = document.querySelector("#sheet .attline");
      if (al && openIdx !== null) al.textContent = "근태 · " + attText(DATA[openIdx]);
    }, function () {});
    db.collection("stats").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && Array.isArray(v.s) && v.s.length === 5) m[x.id] = { s: v.s }; });
      store.stats = m; renderGrid();
      var ed = document.getElementById("statpanel");
      if (openIdx !== null && (!ed || ed.hidden)) openSheet(openIdx, null);
    }, function () {});
    db.collection("health").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && Number.isFinite(+v.value)) m[x.id] = { value: Math.max(0, Math.min(100, Math.round(+v.value))) }; });
      store.health = m; renderGrid();
      var ed = document.getElementById("healthpanel");
      if (openIdx !== null && (!ed || ed.hidden)) openSheet(openIdx, null);
    }, function () {});
    db.collection("nicks").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.n === "string") m[x.id] = { n: v.n.slice(0, 30) }; });
      store.nicks = m; rebuildExternal(false); renderPick(); renderMeets();
      if (state.view === "team") renderTeam();
    }, function () {});
    db.collection("skills").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v === "object") m[x.id] = { k: String(v.k || "").slice(0, 20), kd: String(v.kd || "").slice(0, 80), q: String(v.q || "").slice(0, 40) }; });
      store.skills = m; renderGrid();
      var ed = document.getElementById("skillpanel");
      if (openIdx !== null && (!ed || ed.hidden)) openSheet(openIdx, null);
    }, function () {});
    db.collection("titles").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.t === "string") m[x.id] = { t: v.t.slice(0, 8) }; });
      store.titles = m;
      syncAnnouncementPermission();
      spr = DATA.map(function (d) { return makeSprites(d); });
      renderGrid();
      refreshForms();
      if (state.view === "chat") renderChatWho();
      if (openIdx !== null) { var tn = document.querySelector("#sheet .smeta > span"); if (tn) openSheet(openIdx, null); }
    }, function () {});
    db.collection("snacks").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) {
        var v = x.data();
        if (v && typeof v.u === "string" && typeof v.from === "string" && typeof v.to === "string") m[x.id] = { u: v.u, from: v.from, to: v.to, items: Array.isArray(v.items) ? v.items.slice(0, 6).map(String) : [] };
      });
      store.snacks = m; renderPortals();
      if (state.view === "snack") renderSnack();
    }, function () {});
    db.collection("meetings").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) { var v = x.data(); if (v && typeof v.t === "string") m[x.id] = { t: v.t, m: Array.isArray(v.m) ? v.m : [], on: !!v.on, at: +v.at || 0 }; });
      store.meetings = m;
      var first = !loaded.meetings; loaded.meetings = true;
      syncMeetings(first); if (state.view === "meet") renderMeets();
    }, function () {});
    db.collection("projects").onSnapshot(function (snap) {
      var m = {};
      snap.docs.forEach(function (x) {
        var v = x.data();
        if (PSLOTS.indexOf(x.id) >= 0 && v && typeof v.name === "string") m[x.id] = { name: v.name.slice(0, 16), members: Array.isArray(v.members) ? v.members.slice(0, 20) : [] };
      });
      store.projects = m;
      var first = !loaded.projects; loaded.projects = true;
      rebuildExternal(first);
      if (state.view === "proj") renderProjects();
      if (state.view === "meet") { renderPick(); renderMeets(); }
    }, function () {});
  }, function () {});
}
