/* ===========================================================
   TripGo — Trip.com-style home page (vanilla JS, no deps)
   Handles: tab switching, per-tab search forms, popover system
   (language/currency, sign-in, rooms & guests, passengers &
   cabin class), a 2-month date-range calendar, and all content.
   =========================================================== */

/* ---------- State ---------- */
const today = new Date(); today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

const state = {
  tab: "hotels",
  tripType: "round",          // round | oneway | multi
  guests: { rooms: 1, adults: 2, children: 0 },
  pax: { adults: 1, children: 0, infants: 0 },
  cabin: "Economy",
  currency: "USD",
  language: "English (XX)",
  dates: { in: new Date(today), out: new Date(tomorrow) },
  calMode: "range",
};

const MIN = { rooms: 1, adults: 1, children: 0, infants: 0 };

/* ---------- Helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmtDate = (d) => d ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Select date";
const nightsBetween = (a, b) => (a && b) ? Math.round((b - a) / 864e5) : 0;

const TAB_LABEL = {
  hotels: "Hotels & Homes", flights: "Flights", trains: "Trains",
  cars: "Cars", transfers: "Airport Transfers", tours: "Attractions & Tours", package: "Flight + Hotel",
};

/* ---------- Label builders ---------- */
function guestsLabel() {
  const g = state.guests;
  return `${g.rooms} room, ${g.adults} adult${g.adults > 1 ? "s" : ""}, ${g.children} child${g.children !== 1 ? "ren" : ""}`;
}
function paxLabel() {
  const p = state.pax, t = p.adults + p.children + p.infants;
  return `${t} passenger${t > 1 ? "s" : ""} · ${state.cabin}`;
}

/* ===========================================================
   SEARCH FORMS (per tab)
   =========================================================== */
function cellDestination(label, value, ph) {
  return `<div class="cell cell--grow"><span class="cell__label">${label}</span>
    <input class="cell__value js-text" value="${value}" placeholder="${ph}" /></div>`;
}
function cellPlace(label, cls, value, ph) {
  return `<div class="cell"><span class="cell__label">${label}</span>
    <input class="cell__value ${cls}" value="${value}" placeholder="${ph}" /></div>`;
}
const swapCell = `<div class="swapcell"><button type="button" class="swapbtn" id="swapBtn" title="Swap" aria-label="Swap">⇄</button></div>`;

function cellDate(label, which, mode) {
  const id = which === "in" ? "dateInVal" : "dateOutVal";
  const val = which === "in" ? fmtDate(state.dates.in) : fmtDate(state.dates.out);
  const sub = which === "out" ? `<span class="cell__sub" id="nightSub"></span>` : "";
  return `<div class="cell" data-dd="ddCal" data-calmode="${mode}"><span class="cell__label">${label}</span>
    <span class="cell__value" id="${id}">${val}</span>${sub}</div>`;
}
function cellGuests() {
  return `<div class="cell" data-dd="ddGuests"><span class="cell__label">Rooms &amp; guests</span>
    <span class="cell__value" id="guestsVal">${guestsLabel()}</span></div>`;
}
function cellPax() {
  return `<div class="cell" data-dd="ddPax"><span class="cell__label">Passengers &amp; class</span>
    <span class="cell__value" id="paxVal">${paxLabel()}</span></div>`;
}
const searchBtnCell = `<div class="cell cell--btn"><button type="submit" class="btn btn--primary">🔍 Search</button></div>`;

function tripTypeTop() {
  const t = state.tripType;
  return `<div class="triptype">
    <button type="button" data-trip="round" class="${t === "round" ? "is-active" : ""}">Round-trip</button>
    <button type="button" data-trip="oneway" class="${t === "oneway" ? "is-active" : ""}">One-way</button>
    <button type="button" data-trip="multi" class="${t === "multi" ? "is-active" : ""}">Multi-city</button>
  </div>`;
}

const FORMS = {
  hotels: () => ({
    top: "",
    fields: cellDestination("Destination", "Paris, France", "City, airport, region, landmark or property name")
      + cellDate("Check-in", "in", "range") + cellDate("Check-out", "out", "range")
      + cellGuests() + searchBtnCell,
  }),
  flights: () => ({
    top: tripTypeTop(),
    fields: cellPlace("From", "js-from", "London (LON)", "City or airport") + swapCell
      + cellPlace("To", "js-to", "Tokyo (TYO)", "City or airport")
      + cellDate("Depart", "in", "range")
      + (state.tripType === "oneway" ? "" : cellDate("Return", "out", "range"))
      + cellPax() + searchBtnCell,
  }),
  trains: () => ({
    top: "",
    fields: cellPlace("From", "js-from", "Shanghai", "Departure station") + swapCell
      + cellPlace("To", "js-to", "Beijing", "Arrival station")
      + cellDate("Departure date", "in", "single") + cellPax() + searchBtnCell,
  }),
  cars: () => ({
    top: `<span class="selnote">✓ Return car to same location</span>`,
    fields: cellDestination("Pick-up location", "Los Angeles Airport (LAX)", "Airport or city")
      + cellDate("Pick-up", "in", "range") + cellDate("Drop-off", "out", "range")
      + searchBtnCell,
  }),
  transfers: () => ({
    top: "",
    fields: cellPlace("From", "js-from", "JFK Airport", "Airport / hotel") + swapCell
      + cellPlace("To", "js-to", "Manhattan Hotel", "Airport / hotel")
      + cellDate("Date", "in", "single") + cellPax() + searchBtnCell,
  }),
  tours: () => ({
    top: "",
    fields: cellDestination("Destination", "Bali, Indonesia", "City, attraction or activity")
      + cellDate("Date (optional)", "in", "single") + searchBtnCell,
  }),
  package: () => ({
    top: tripTypeTop(),
    fields: cellPlace("From", "js-from", "New York (NYC)", "City or airport") + swapCell
      + cellPlace("To", "js-to", "Bangkok (BKK)", "City or airport")
      + cellDate("Depart", "in", "range") + cellDate("Return", "out", "range")
      + cellGuests() + searchBtnCell,
  }),
};

function renderForm() {
  const tab = state.tab;
  const def = (FORMS[tab] || FORMS.hotels)();
  $("#formTop").innerHTML = def.top;
  $("#formFields").innerHTML = def.fields;
  updateDateLabels();
}

function setActiveTab(tab) {
  if (!FORMS[tab]) tab = "hotels";
  state.tab = tab;
  $$(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
  $$(".sidenav__item[data-tab]").forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
  renderForm();
}

/* ===========================================================
   POPOVER SYSTEM
   =========================================================== */
let activePop = null, activeTrigger = null;
const backdrop = document.createElement("div");
backdrop.className = "backdrop";
document.body.appendChild(backdrop);

function positionPopover(pop, trigger) {
  pop.style.visibility = "hidden";
  pop.classList.add("is-open");
  const r = trigger.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = r.left + window.scrollX;
  let top = r.bottom + window.scrollY + 8;
  if (trigger.closest(".topbar__links")) left = r.right + window.scrollX - pw;
  const vw = document.documentElement.clientWidth;
  const maxLeft = window.scrollX + vw - pw - 12;
  if (left > maxLeft) left = maxLeft;
  if (left < window.scrollX + 12) left = window.scrollX + 12;
  // flip above if not enough room below
  if (r.bottom + ph + 16 > window.innerHeight && r.top - ph - 8 > 0) {
    top = r.top + window.scrollY - ph - 8;
  }
  pop.style.left = left + "px";
  pop.style.top = top + "px";
  pop.style.visibility = "";
}

function openPop(id, trigger) {
  const pop = document.getElementById(id);
  if (!pop) return;
  if (activePop === pop) { closePop(); return; }
  closePop();
  if (id === "ddGuests") renderStepper("ddGuests", state.guests);
  if (id === "ddPax") renderStepper("ddPax", state.pax);
  if (id === "ddCal") { state.calMode = trigger.dataset.calmode || "range"; renderCalendar(); }
  positionPopover(pop, trigger);
  backdrop.classList.add("is-open");
  trigger.setAttribute && trigger.setAttribute("aria-expanded", "true");
  activePop = pop; activeTrigger = trigger;
}
function closePop() {
  if (activePop) {
    activePop.classList.remove("is-open");
    activeTrigger && activeTrigger.setAttribute && activeTrigger.setAttribute("aria-expanded", "false");
  }
  activePop = null; activeTrigger = null;
  backdrop.classList.remove("is-open");
}
backdrop.addEventListener("click", closePop);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });

/* ---------- Steppers ---------- */
function renderStepper(popId, obj) {
  const pop = document.getElementById(popId);
  $$(".stepper", pop).forEach(s => {
    const key = s.dataset.key;
    $(".stepper__val", s).textContent = obj[key];
    $(`.stepper__ctrl button[data-step="-1"]`, s).disabled = obj[key] <= (MIN[key] ?? 0);
  });
}
function updateLabels() {
  const gv = $("#guestsVal"); if (gv) gv.textContent = guestsLabel();
  const pv = $("#paxVal"); if (pv) pv.textContent = paxLabel();
}

/* ===========================================================
   CALENDAR (2-month range / single picker)
   =========================================================== */
let calBase = new Date(today.getFullYear(), today.getMonth(), 1);

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  let cells = "";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => cells += `<div class="cal__dow">${d}</div>`);
  for (let i = 0; i < startDow; i++) cells += `<div></div>`;
  for (let day = 1; day <= daysIn; day++) {
    const d = new Date(year, month, day); d.setHours(0, 0, 0, 0);
    const disabled = d < today;
    const isIn = state.dates.in && d.getTime() === state.dates.in.getTime();
    const isOut = state.dates.out && d.getTime() === state.dates.out.getTime();
    const inRange = state.dates.in && state.dates.out && d > state.dates.in && d < state.dates.out;
    const cls = ["cal__day"];
    if (isIn) cls.push("is-start");
    if (isOut) cls.push("is-end");
    if (inRange) cls.push("in-range");
    cells += `<button type="button" class="${cls.join(" ")}" ${disabled ? "disabled" : ""}
      data-date="${year}-${month}-${day}">${day}</button>`;
  }
  return `<div class="cal__month"><div class="cal__mtitle">${title}</div><div class="cal__grid">${cells}</div></div>`;
}
function renderCalendar() {
  const m1 = calBase;
  const m2 = new Date(calBase.getFullYear(), calBase.getMonth() + 1, 1);
  $("#calMonths").innerHTML = buildMonth(m1.getFullYear(), m1.getMonth()) + buildMonth(m2.getFullYear(), m2.getMonth());
  const sum = $("#calSummary");
  if (state.calMode === "single") {
    sum.textContent = state.dates.in ? fmtDate(state.dates.in) : "Select a date";
  } else {
    const n = nightsBetween(state.dates.in, state.dates.out);
    sum.textContent = state.dates.in
      ? `${fmtDate(state.dates.in)} – ${fmtDate(state.dates.out)}${n ? ` (${n} night${n > 1 ? "s" : ""})` : ""}`
      : "Select dates";
  }
}
function updateDateLabels() {
  const iv = $("#dateInVal"); if (iv) iv.textContent = fmtDate(state.dates.in);
  const ov = $("#dateOutVal"); if (ov) ov.textContent = fmtDate(state.dates.out);
  const ns = $("#nightSub");
  if (ns) { const n = nightsBetween(state.dates.in, state.dates.out); ns.textContent = n ? `${n} night${n > 1 ? "s" : ""}` : ""; }
}
function pickDate(y, m, day) {
  const d = new Date(y, m, day); d.setHours(0, 0, 0, 0);
  if (state.calMode === "single") {
    state.dates.in = d;
    renderCalendar(); updateDateLabels();
    setTimeout(closePop, 120);
    return;
  }
  if (!state.dates.in || state.dates.out) { state.dates.in = d; state.dates.out = null; }
  else if (d < state.dates.in) { state.dates.in = d; }
  else { state.dates.out = d; }
  renderCalendar(); updateDateLabels();
}

/* ===========================================================
   OPTION GRIDS (language / currency / cabin)
   =========================================================== */
const LANGS = ["English (XX)", "English (UK)", "中文 (简体)", "中文 (繁體)", "日本語", "한국어", "Français", "Deutsch", "Español", "ภาษาไทย"];
const CURRS = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW", "HKD", "SGD", "AUD", "THB"];
const CABINS = ["Economy", "Premium Economy", "Business", "First"];

function buildOptGrid(container, items, activeVal, onPick) {
  container.innerHTML = items.map(i =>
    `<button type="button" data-val="${i}" class="${i === activeVal ? "is-active" : ""}">${i}</button>`).join("");
  container.onclick = (e) => {
    const b = e.target.closest("button[data-val]"); if (!b) return;
    onPick(b.dataset.val);
    $$("button", container).forEach(x => x.classList.toggle("is-active", x === b));
  };
}

/* ===========================================================
   CONTENT DATA + RENDERING
   =========================================================== */
const IMG = (id, w = 500) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CLAIMS = [
  { off: "Welcome", txt: "New users get more discounts on travel!", cta: "Sign in & claim", dd: "ddSignin" },
  { off: "10% off", txt: "Hotels & Homes for first-time bookings", cta: "Claim all" },
  { off: "5% off", txt: "EU train tickets, limited time only", cta: "Claim all" },
  { off: "10% off", txt: "Airport Transfers worldwide", cta: "Claim all" },
];
const PROMOS = [
  { img: "photo-1542051841857-5f90071e7989", t: "GO JAPAN", s: "Hotels up to 20% off" },
  { img: "photo-1528181304800-259b08848526", t: "GO CHINA", s: "Spring gems & must-visit cities" },
  { img: "photo-1537996194471-e657df975ab4", t: "SOUTHEAST ASIA", s: "Up to 50% off hotels" },
];
const CHIPS = ["Anywhere", "Tokyo", "Seoul", "Bangkok", "Singapore", "Istanbul", "Dubai", "Hanoi", "Doha", "Bali"];
const FLIGHTS = [
  { dest: "Tokyo", country: "Japan", price: 489, img: "photo-1540959733332-eab4deab993a", tag: "Tokyo" },
  { dest: "Seoul", country: "South Korea", price: 412, img: "photo-1517154429929-933367bd8490", tag: "Seoul" },
  { dest: "Bangkok", country: "Thailand", price: 378, img: "photo-1563492065593-0444c1d2e0a0", tag: "Bangkok" },
  { dest: "Singapore", country: "Singapore", price: 445, img: "photo-1525625293386-3f8f99389edd", tag: "Singapore" },
  { dest: "Istanbul", country: "Türkiye", price: 356, img: "photo-1527837756880-4a2081e79182", tag: "Istanbul" },
  { dest: "Dubai", country: "UAE", price: 398, img: "photo-1512453979798-5ea266f8880c", tag: "Dubai" },
  { dest: "Hanoi", country: "Vietnam", price: 289, img: "photo-1597003723278-d8a42a6e3661", tag: "Hanoi" },
  { dest: "Doha", country: "Qatar", price: 421, img: "photo-1580844481067-5edc1a8e91c8", tag: "Doha" },
  { dest: "Bali", country: "Indonesia", price: 334, img: "photo-1537996194471-e657df975ab4", tag: "Bali" },
  { dest: "Hong Kong", country: "China", price: 401, img: "photo-1536599018102-cb9629e9bd30", tag: "Hong Kong" },
];
const PROMO_LINKS = {
  "GO JAPAN": "explore.html?cat=private-tours&dest=Tokyo",
  "GO CHINA": "explore.html?cat=private-tours&dest=Beijing",
  "SOUTHEAST ASIA": "explore.html?cat=deals",
};
const ATTRACTIONS = [
  { t: "The Palace Museum (Forbidden City)", m: "Beijing", p: 12, r: 4.8, img: "photo-1584646098378-0874589d76b1", city: "Beijing" },
  { t: "Musée d'Orsay Skip-the-Line Ticket", m: "Paris", p: 18, r: 4.8, img: "photo-1431274172761-fca41d930114", city: "Paris" },
  { t: "Universal Studios Hollywood", m: "Los Angeles", p: 109, r: 4.8, img: "photo-1605723517503-3cadb5818a0c", city: "Los Angeles" },
  { t: "Universal Studios Singapore", m: "Singapore", p: 60, r: 4.7, img: "photo-1525625293386-3f8f99389edd", city: "Singapore" },
  { t: "Sagrada Família Fast Track", m: "Barcelona", p: 39, r: 4.7, img: "photo-1583779457094-ab6f9164a1c8", city: "Barcelona" },
  { t: "Colosseum Guided Tour", m: "Rome", p: 45, r: 4.6, img: "photo-1552832230-c0197dd311b5", city: "Rome" },
];
const HOTELS = [
  { t: "The Fullerton Bay Hotel", m: "Singapore", p: 420, r: 4.9, img: "photo-1566073771259-6a8506099945", city: "Singapore" },
  { t: "Rosewood Hong Kong", m: "Hong Kong", p: 560, r: 4.9, img: "photo-1542314831-068cd1dbfeeb", city: "Hong Kong" },
  { t: "The St. Regis New York", m: "New York", p: 690, r: 4.8, img: "photo-1551882547-ff40c63fe5fa", city: "New York" },
  { t: "Bulgari Hotel Paris", m: "Paris", p: 1200, r: 4.9, img: "photo-1564501049412-61c2a3083791", city: "Paris" },
  { t: "Marina Bay Sands", m: "Singapore", p: 480, r: 4.7, img: "photo-1524230572899-a752b3835840", city: "Singapore" },
  { t: "Capella Bangkok", m: "Bangkok", p: 510, r: 4.9, img: "photo-1551918120-9739cb430c6d", city: "Bangkok" },
];
const INSPO = [
  { t: "The best bathhouse in China right now!", m: "Travel Guide", img: "photo-1545048702-79362596cdc9", slug: "bathhouse-china" },
  { t: "“Sky City” — reality even more stunning than imagination", m: "Trip Moments", img: "photo-1506905925346-21bda4d32df4", slug: "sky-city" },
  { t: "Deep in the jungles of Phuket lies an amazing sanctuary", m: "Travel Guide", img: "photo-1537953773345-d172ccf13cf1", slug: "phuket-sanctuary" },
  { t: "Visa-free island with the world's most beautiful glass sea", m: "Trip.Best", img: "photo-1505228395891-9a51e7e86bf6", slug: "glass-sea-island" },
  { t: "A week in a stunning Maldives paradise", m: "Travel Guide", img: "photo-1514282401047-d79a71a590e8", slug: "maldives-week" },
];

let inspireChip = "Anywhere";

function bookingHref(o, cat, city) {
  return "booking.html?cat=" + cat +
    "&title=" + encodeURIComponent(o.t) +
    "&price=" + encodeURIComponent(o.p) +
    "&img=" + encodeURIComponent(IMG(o.img)) +
    "&rating=" + encodeURIComponent(o.r) +
    "&city=" + encodeURIComponent(city || o.m || o.city || "");
}
function flightHref(dest) {
  return "index.html?tab=flights&to=" + encodeURIComponent(dest) + "#search";
}
function hotelHref(city) {
  return "index.html?tab=hotels&dest=" + encodeURIComponent(city) + "#search";
}

function flightCardHTML(f) {
  return '<a class="flight-card" href="' + flightHref(f.dest) + '">' +
    '<div class="flight-card__img"><img loading="lazy" src="' + IMG(f.img) + '" alt="' + f.dest + '" /></div>' +
    '<div class="flight-card__body">' +
      '<div class="flight-card__city">' + f.dest + '</div>' +
      '<div class="flight-card__sub">' + f.country + ' · One-way</div>' +
      '<div class="flight-card__price">from <b>US$' + f.price + '</b></div>' +
    '</div></a>';
}
function flightsForChip(chip) {
  if (chip === "Anywhere") return FLIGHTS;
  return FLIGHTS.filter(function (f) { return f.tag === chip || f.dest === chip; });
}
function renderFlights() {
  var row = $("#flightRow");
  if (!row) return;
  var list = flightsForChip(inspireChip);
  row.innerHTML = list.length ? list.map(flightCardHTML).join("") : '<div class="flight-empty">No flights found for this destination yet.</div>';
}

function cardHTML(o, withPrice, href) {
  var tag = href ? "a" : "article";
  return "<" + tag + ' class="card"' + (href ? ' href="' + href + '"' : "") + ' data-search="' + o.t + '">' +
    '<div class="card__img"><img loading="lazy" src="' + IMG(o.img) + '" alt="' + o.t + '" />' +
      '<button class="card__save" title="Save" aria-label="Save to list">♡</button></div>' +
    '<div class="card__body">' +
      '<div class="card__title">' + o.t + '</div>' +
      '<div class="card__meta">' + o.m + '</div>' +
      (withPrice ? '<div class="card__foot">' +
        '<span class="card__price"><small>from</small> $' + o.p + '</span>' +
        '<span class="card__rating">★ ' + o.r + '</span></div>' : "") +
    '</div></' + tag + '>';
}

function renderContent() {
  $("#claimRow").innerHTML = CLAIMS.map(c => `
    <div class="claim">
      <div class="claim__off">${c.off}</div>
      <div class="claim__txt">${c.txt}</div>
      <button class="btn btn--primary btn--sm ${c.dd ? "dd-trigger" : "js-toast"}" ${c.dd ? `data-dd="${c.dd}"` : ""}>${c.cta}</button>
    </div>`).join("");

  $("#promoRow").innerHTML = PROMOS.map(p => {
    var href = PROMO_LINKS[p.t] || "explore.html?cat=deals";
    return '<a class="promo" href="' + href + '"><img loading="lazy" src="' + IMG(p.img, 700) + '" alt="' + p.t + '" />' +
      '<div class="promo__cap"><b>' + p.t + '</b><small>' + p.s + '</small></div></a>';
  }).join("");

  $("#destChips").innerHTML = CHIPS.map(function (c, i) {
    return '<button type="button" class="chip ' + (c === inspireChip ? "is-active" : "") + '" data-dest="' + c + '">' + c + '</button>';
  }).join("");
  renderFlights();

  $("#attractionRow").innerHTML = ATTRACTIONS.map(function (a) {
    return cardHTML(a, true, bookingHref(a, "attraction", a.city));
  }).join("");
  $("#hotelRow").innerHTML = HOTELS.map(function (h) {
    return cardHTML(h, true, hotelHref(h.city));
  }).join("");
  $("#inspoRow").innerHTML = INSPO.map(function (i) {
    return cardHTML(i, false, "explore.html?cat=inspiration&post=" + encodeURIComponent(i.slug));
  }).join("");
}

/* ===========================================================
   TOAST
   =========================================================== */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-show"), 2800);
}

/* ===========================================================
   INIT + EVENT WIRING
   =========================================================== */
function applyDeepLink() {
  var params = new URLSearchParams(location.search);
  var tab = params.get("tab");
  var to = params.get("to");
  var dest = params.get("dest");
  if (tab) setActiveTab(tab);
  if (to) {
    state.tripType = "oneway";
    setActiveTab("flights");
    setTimeout(function () {
      var el = $(".js-to");
      if (el) el.value = to.indexOf("(") > -1 ? to : to + " (City)";
    }, 0);
  }
  if (dest) {
    setActiveTab("hotels");
    setTimeout(function () {
      var el = $(".js-text");
      if (el) el.value = dest;
    }, 0);
  }
  if (location.hash === "#search" || tab || to || dest) {
    setTimeout(function () {
      var s = document.getElementById("search");
      if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  renderContent();
  setActiveTab("hotels");
  applyDeepLink();

  if (window.TGcurrentLangLabel) state.language = window.TGcurrentLangLabel();
  buildOptGrid($("#langGrid"), LANGS, state.language, v => {
    state.language = v;
    if (window.TGsetLanguage) window.TGsetLanguage(v);
  });
  buildOptGrid($("#currGrid"), CURRS, state.currency, v => {
    state.currency = v;
    $(".dd-trigger[data-dd='ddLang']").innerHTML = `<span>🌐</span> ${v} <span class="caret">▾</span>`;
  });
  buildOptGrid($("#cabinGrid"), CABINS, state.cabin, v => { state.cabin = v; updateLabels(); });

  /* Tab clicks (search pills + sidebar items share data-tab) */
  document.addEventListener("click", (e) => {
    const tabEl = e.target.closest("[data-tab]");
    if (tabEl) {
      setActiveTab(tabEl.dataset.tab);
      if (tabEl.closest(".sidenav")) {
        closeSidebar();
        $("#search").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    /* Popover triggers */
    const trig = e.target.closest("[data-dd]");
    if (trig) { e.preventDefault(); openPop(trig.dataset.dd, trig); return; }

    /* Done buttons inside popovers */
    const done = e.target.closest("[data-done]");
    if (done) { updateLabels(); updateDateLabels(); closePop(); return; }

    /* Calendar day */
    const day = e.target.closest(".cal__day[data-date]");
    if (day) { const [y, m, d] = day.dataset.date.split("-").map(Number); pickDate(y, m, d); return; }

    /* Stepper +/- */
    const step = e.target.closest(".stepper__ctrl button[data-step]");
    if (step) {
      const popId = step.closest(".popover").id;
      const key = step.closest(".stepper").dataset.key;
      const obj = popId === "ddGuests" ? state.guests : state.pax;
      const next = obj[key] + Number(step.dataset.step);
      if (next >= (MIN[key] ?? 0)) { obj[key] = next; renderStepper(popId, obj); updateLabels(); }
      return;
    }

    /* Trip type */
    const tt = e.target.closest("[data-trip]");
    if (tt) { state.tripType = tt.dataset.trip; renderForm(); return; }

    /* Swap from/to */
    if (e.target.closest("#swapBtn")) {
      const f = $(".js-from"), t = $(".js-to");
      if (f && t) { const v = f.value; f.value = t.value; t.value = v; }
      return;
    }

    /* Destination chips (Get inspired) */
    const chip = e.target.closest(".chip[data-dest]");
    if (chip) {
      e.preventDefault();
      inspireChip = chip.dataset.dest;
      $$(".chip[data-dest]").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
      renderFlights();
      return;
    }

    /* Save buttons on cards */
    if (e.target.closest(".card__save")) {
      e.preventDefault(); e.stopPropagation();
      toast("Saved to your list ♥");
      return;
    }

    /* Legacy demo items without real links */
    const item = e.target.closest("[data-search]:not(a):not(.chip)");
    if (item) {
      toast('Opening "' + item.dataset.search + '" — demo only');
      return;
    }

    /* generic demo buttons */
    if (e.target.closest(".js-toast")) toast("Demo only — coupon claimed!");
  });

  /* Calendar month navigation */
  $("#calPrev").addEventListener("click", () => {
    const min = new Date(today.getFullYear(), today.getMonth(), 1);
    const prev = new Date(calBase.getFullYear(), calBase.getMonth() - 1, 1);
    if (prev >= min) { calBase = prev; renderCalendar(); }
  });
  $("#calNext").addEventListener("click", () => {
    calBase = new Date(calBase.getFullYear(), calBase.getMonth() + 1, 1);
    renderCalendar();
  });

  /* Chip scroll */
  var chipsNext = document.getElementById("chipsNext");
  if (chipsNext) chipsNext.addEventListener("click", function () {
    var wrap = document.getElementById("destChips");
    if (wrap) wrap.scrollBy({ left: 220, behavior: "smooth" });
  });

  /* Search submit */
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    toast(`Searching ${TAB_LABEL[state.tab]}… (demo — results would load here)`);
  });

  /* Sign in action */
  $("#doSignin").addEventListener("click", () => { closePop(); toast("Welcome! (demo sign-in)"); });

  /* Sidebar (mobile) */
  $("#sidebarToggle").addEventListener("click", () => $("#sidebar").classList.toggle("is-open"));
  function closeSidebar() { $("#sidebar").classList.remove("is-open"); }
  window.closeSidebar = closeSidebar;

  /* Reposition / close popovers on resize & scroll */
  window.addEventListener("resize", closePop);
  window.addEventListener("scroll", () => { if (activePop && activeTrigger) positionPopover(activePop, activeTrigger); }, { passive: true });
});
