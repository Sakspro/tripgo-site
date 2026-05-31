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
  carsSub: "rentals",       // rentals | transfers
  transferDir: "pickup",    // pickup | dropoff
  carDiffDrop: false,
  carLicense: "United States",
  carAge: "30–60",
  carPickTime: "10:00",
  carDropTime: "10:00",
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
  return `<div class="cell cell--grow cell--input"><span class="cell__label">${label}</span>
    <input class="cell__value js-text" value="${value}" placeholder="${ph}" /></div>`;
}
function cellPlace(label, cls, value, ph) {
  return `<div class="cell cell--input"><span class="cell__label">${label}</span>
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
  cars: () => state.carsSub === "transfers" ? carTransfersForm() : carRentalsForm(),
  transfers: () => { state.carsSub = "transfers"; state.tab = "cars"; return carTransfersForm(); },
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
  var extra = $("#formExtra");
  if (extra) extra.innerHTML = def.extra || "";
  updateDateLabels();
  if (window.TGinitDestSearch) {
    window.TGinitDestSearch($("#formFields"));
    var extra = $("#formExtra");
    if (extra) window.TGinitDestSearch(extra);
  }
}

function setActiveTab(tab) {
  if (tab === "transfers") { state.carsSub = "transfers"; tab = "cars"; }
  if (!FORMS[tab]) tab = "hotels";
  if (tab === "cars" && state.carsSub !== "transfers") state.carsSub = state.carsSub || "rentals";
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
const CAR_TIMES = ["00:00", "00:30", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const CAR_LICENSES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "Kenya", "Singapore", "United Arab Emirates"];
const CAR_AGES = ["18–29", "30–60", "61+"];

function carSubTabs() {
  var s = state.carsSub;
  return '<div class="triptype carsub">' +
    '<button type="button" data-carsub="rentals" class="' + (s === "rentals" ? "is-active" : "") + '">Car Rentals</button>' +
    '<button type="button" data-carsub="transfers" class="' + (s === "transfers" ? "is-active" : "") + '">Airport Transfers</button>' +
    '</div>';
}

function transferDirTabs() {
  var t = state.transferDir;
  return '<div class="triptype">' +
    '<button type="button" data-xferdir="pickup" class="' + (t === "pickup" ? "is-active" : "") + '">Airport Pick-up</button>' +
    '<button type="button" data-xferdir="dropoff" class="' + (t === "dropoff" ? "is-active" : "") + '">Airport Drop-off</button>' +
    '</div>';
}

function cellDateTime(label, which) {
  var id = which === "in" ? "dateInVal" : "dateOutVal";
  var val = which === "in" ? fmtDate(state.dates.in) : fmtDate(state.dates.out);
  var timeKey = which === "in" ? "carPickTime" : "carDropTime";
  var opts = CAR_TIMES.map(function (t) {
    return '<option value="' + t + '"' + (state[timeKey] === t ? " selected" : "") + '>' + t + '</option>';
  }).join("");
  return '<div class="cell" data-dd="ddCal" data-calmode="range"><span class="cell__label">' + label + '</span>' +
    '<div class="cell__dt"><span class="cell__value" id="' + id + '">' + val + '</span>' +
    '<select class="cell__time" data-cartime="' + which + '">' + opts + '</select></div></div>';
}

function carMetaExtra() {
  var lic = CAR_LICENSES.map(function (l) {
    return '<option' + (state.carLicense === l ? " selected" : "") + '>' + l + '</option>';
  }).join("");
  var ages = CAR_AGES.map(function (a) {
    return '<option' + (state.carAge === a ? " selected" : "") + '>' + a + '</option>';
  }).join("");
  return '<div class="car-meta">' +
    '<label class="car-meta__field"><span class="car-meta__label">Driver\'s license issuing country/region</span>' +
    '<select class="car-meta__select" id="carLicense">' + lic + '</select></label>' +
    '<label class="car-meta__field"><span class="car-meta__label">Age</span>' +
    '<select class="car-meta__select" id="carAge">' + ages + '</select></label>' +
    '</div>';
}

function carRentalsForm() {
  var diff = state.carDiffDrop
    ? cellDestination("Drop-off location", "", "Airport, city, station, region, district...")
    : "";
  return {
    top: carSubTabs() +
      '<label class="carcheck"><input type="checkbox" id="carDiffDrop"' + (state.carDiffDrop ? " checked" : "") + '> Drop off at a different location</label>',
    fields: cellDestination("Pick-up location", "Los Angeles Airport (LAX)", "Airport, city, station, region, district...")
      + diff
      + cellDateTime("Pick-up date", "in")
      + cellDateTime("Drop-off date", "out")
      + searchBtnCell,
    extra: carMetaExtra(),
  };
}

function carTransfersForm() {
  var pickup = state.transferDir === "pickup";
  var fromLabel = pickup ? "Arrival airport" : "From";
  var toLabel = pickup ? "Destination" : "Airport";
  var fromPh = pickup ? "Arrival airport" : "Hotel, address or area";
  var toPh = pickup ? "Enter a destination" : "Departure airport";
  return {
    top: carSubTabs() + transferDirTabs(),
    fields: cellPlace(fromLabel, "js-from", "", fromPh) + swapCell
      + cellPlace(toLabel, "js-to", "", toPh)
      + cellPax() + searchBtnCell,
    extra: "",
  };
}

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
  { id: "welcome", off: "Welcome", txt: "New users get more discounts on travel!", cta: "Sign in & claim", dd: "ddSignin" },
  { id: "hotel10", off: "10% off", txt: "Hotels & Homes for first-time bookings", cta: "Claim all", coupon: "TG-HOTEL10" },
  { id: "train5", off: "5% off", txt: "EU train tickets, limited time only", cta: "Claim all", coupon: "TG-TRAIN5" },
  { id: "xfer10", off: "10% off", txt: "Airport Transfers worldwide", cta: "Claim all", coupon: "TG-XFER10" },
];
const PROMOS = [
  { img: "photo-1542051841857-5f90071e7989", t: "GO JAPAN", s: "Hotels up to 20% off" },
  { img: "photo-1528181304800-259b08848526", t: "GO CHINA", s: "Spring gems & must-visit cities" },
  { img: "photo-1537996194471-e657df975ab4", t: "SOUTHEAST ASIA", s: "Up to 50% off hotels" },
];
const CHIPS_FALLBACK = ["Anywhere", "Tokyo", "Seoul", "Bangkok", "Singapore", "Istanbul", "Dubai", "Hanoi", "Doha", "Bali"];
let CHIPS = CHIPS_FALLBACK.slice();
const FLIGHTS_FALLBACK = [
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
let FLIGHTS = FLIGHTS_FALLBACK.slice();
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
  return "results.html?tab=flights&to=" + encodeURIComponent(dest);
}
function hotelHref(city) {
  return "results.html?tab=hotels&dest=" + encodeURIComponent(city);
}

function flightImg(f) {
  if (f.img && (f.img.indexOf("http") === 0 || f.img.indexOf("//") === 0)) {
    return f.img.indexOf("//") === 0 ? "https:" + f.img : f.img;
  }
  return IMG(f.img);
}
function flightCardHTML(f) {
  var sub = f.country || "One-way";
  if (f.tripType && sub.indexOf("One-way") === -1 && sub.indexOf("Round") === -1) sub += " · " + f.tripType;
  var priceHtml = (f.browseOnly || !f.price)
    ? '<div class="flight-card__price">Explore <b>flights</b></div>'
    : '<div class="flight-card__price">from <b>US$' + f.price + '</b></div>';
  var href = f.deeplink || flightHref(f.dest);
  return '<a class="flight-card" href="' + href + '"' + (f.deeplink ? ' target="_blank" rel="noopener"' : '') + '>' +
    '<div class="flight-card__img"><img loading="lazy" src="' + flightImg(f) + '" alt="' + f.dest + '" /></div>' +
    '<div class="flight-card__body">' +
      '<div class="flight-card__city">' + f.dest + '</div>' +
      '<div class="flight-card__sub">' + sub + '</div>' +
      priceHtml +
    '</div></a>';
}
function renderChips() {
  var wrap = $("#destChips");
  if (!wrap) return;
  wrap.innerHTML = CHIPS.map(function (c) {
    return '<button type="button" class="chip ' + (c === inspireChip ? "is-active" : "") + '" data-dest="' + c + '">' + c + '</button>';
  }).join("");
}
function applySidebarCars(data) {
  if (!data || !data.cars) return;
  var cars = data.cars;
  var iconEl = document.getElementById("carsNavIcon");
  var labelEl = document.getElementById("carsNavLabel");
  var flyout = document.getElementById("carsFlyout");
  var navLink = document.getElementById("carsNavLink");
  if (iconEl && cars.icon) iconEl.textContent = cars.icon;
  if (labelEl && cars.title) labelEl.textContent = cars.title;
  if (navLink) {
    navLink.href = cars.href || "cars.html";
    navLink.removeAttribute("data-tab");
  }
  TAB_LABEL.cars = cars.title || TAB_LABEL.cars;
  if (flyout && cars.items && cars.items.length) {
    flyout.innerHTML = cars.items.map(function (item) {
      var href = item.href || (item.tab === "transfers" ? "cars.html?sub=transfers" : "cars.html");
      return '<a href="' + href + '">' + item.label + '</a>';
    }).join("");
  }
}
function applyInspiredData(data) {
  if (!data) return;
  if (data.chips && data.chips.length) CHIPS = data.chips;
  if (data.flights && data.flights.length) FLIGHTS = data.flights;
  var inspired = document.getElementById("inspired");
  if (inspired) {
    var titleEl = inspired.querySelector(".block__title");
    var subEl = inspired.querySelector(".block__sub");
    if (data.title && titleEl) titleEl.textContent = data.title;
    if (data.subtitle && subEl) subEl.textContent = data.subtitle;
  }
  if (CHIPS.indexOf(inspireChip) === -1) inspireChip = "Anywhere";
  renderChips();
  renderFlights();
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

function buildSearchUrl() {
  var p = new URLSearchParams();
  var tab = state.tab;
  if (tab === "cars" && state.carsSub === "transfers") tab = "transfers";
  p.set("tab", tab);
  var dest = $(".js-text");
  var from = $(".js-from");
  var to = $(".js-to");
  if (dest && dest.value.trim()) p.set("dest", dest.value.trim());
  if (from && from.value.trim()) p.set("from", from.value.trim());
  if (to && to.value.trim()) p.set("to", to.value.trim());
  if (state.dates.in) p.set("in", state.dates.in.toISOString().split("T")[0]);
  if (state.dates.out) p.set("out", state.dates.out.toISOString().split("T")[0]);
  p.set("trip", state.tripType);
  p.set("rooms", state.guests.rooms);
  p.set("adults", state.guests.adults);
  p.set("cabin", state.cabin);
  if (state.tab === "cars") {
    p.set("carsSub", state.carsSub);
    if (state.carsSub === "rentals") {
      p.set("license", state.carLicense);
      p.set("age", state.carAge);
      p.set("pickTime", state.carPickTime);
      p.set("dropTime", state.carDropTime);
    } else {
      p.set("xferdir", state.transferDir);
    }
  }
  return "results.html?" + p.toString();
}

function renderContent() {
  var claimed = window.TGgetClaimed ? window.TGgetClaimed() : [];
  $("#claimRow").innerHTML = CLAIMS.map(function (c) {
    var isClaimed = claimed.indexOf(c.id) >= 0;
    var btn = c.dd
      ? '<button class="btn btn--primary btn--sm dd-trigger" data-dd="' + c.dd + '">' + c.cta + '</button>'
      : '<button class="btn btn--primary btn--sm js-claim" data-claim="' + c.id + '" data-coupon="' + (c.coupon || "") + '"' + (isClaimed ? ' disabled' : '') + '>' + (isClaimed ? "Claimed ✓" : c.cta) + '</button>';
    return '<div class="claim"><div class="claim__off">' + c.off + '</div><div class="claim__txt">' + c.txt + '</div>' + btn + '</div>';
  }).join("");

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
  if (window.TGtoast) { window.TGtoast(msg); return; }
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
  var carsSub = params.get("carsSub") || params.get("sub");
  if (carsSub === "transfers" || carsSub === "rentals") state.carsSub = carsSub;
  var xferDir = params.get("xferdir");
  if (xferDir === "pickup" || xferDir === "dropoff") state.transferDir = xferDir;
  if (tab) setActiveTab(tab);
  if (carsSub && !tab) setActiveTab("cars");
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
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  var isCarPage = document.body.dataset.carPage !== undefined;
  if (isCarPage) {
    var pickOut = new Date(today);
    pickOut.setDate(pickOut.getDate() + 3);
    state.dates.in = new Date(today);
    state.dates.out = pickOut;
  }
  if (!isCarPage) renderContent();
  setActiveTab(isCarPage ? "cars" : "hotels");
  applyDeepLink();

  if (window.TGinspiredReady) {
    window.TGinspiredReady.then(applyInspiredData);
  }
  document.addEventListener("tg-inspired", function (e) { applyInspiredData(e.detail); });

  if (window.TGsidebarReady) {
    window.TGsidebarReady.then(applySidebarCars);
  }
  document.addEventListener("tg-sidebar", function (e) { applySidebarCars(e.detail); });

  /* Re-sync when user returns to tab (picks up Trip.com changes within cache TTL) */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (window.TGinspiredReady) {
      fetch("/api/inspired", { credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(applyInspiredData)
        .catch(function () {});
    }
    if (window.TGsidebarReady) {
      fetch("/api/sidebar", { credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(applySidebarCars)
        .catch(function () {});
    }
  });

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
    /* Mobile: tap sidebar row with flyout to expand submenu */
    var flyoutRow = e.target.closest(".has-flyout > .sidenav__item");
    if (flyoutRow && !e.target.closest(".flyout") && window.matchMedia("(max-width: 960px)").matches) {
      var parent = flyoutRow.closest(".has-flyout");
      if (parent) {
        e.preventDefault();
        parent.classList.toggle("is-open");
        $$(".has-flyout").forEach(function (li) { if (li !== parent) li.classList.remove("is-open"); });
        return;
      }
    }

    const tabEl = e.target.closest("[data-tab]");
    if (tabEl) {
      e.preventDefault();
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

    /* Cars sub-tab: Car Rentals | Airport Transfers */
    const cs = e.target.closest("[data-carsub]");
    if (cs) { state.carsSub = cs.dataset.carsub; renderForm(); return; }

    /* Airport transfer direction */
    const xd = e.target.closest("[data-xferdir]");
    if (xd) { state.transferDir = xd.dataset.xferdir; renderForm(); return; }

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

    /* Coupon claims */
    const claimBtn = e.target.closest(".js-claim");
    if (claimBtn && !claimBtn.disabled) {
      var cid = claimBtn.dataset.claim, code = claimBtn.dataset.coupon;
      if (window.TGclaimCoupon) window.TGclaimCoupon(cid, code);
      claimBtn.textContent = "Claimed ✓";
      claimBtn.disabled = true;
      toast("Coupon " + (code || cid) + " added to your account — use at checkout.");
      return;
    }

    /* Save handled by common.js */
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
    location.href = buildSearchUrl();
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "carDiffDrop") { state.carDiffDrop = e.target.checked; renderForm(); return; }
    if (e.target.id === "carLicense") { state.carLicense = e.target.value; return; }
    if (e.target.id === "carAge") { state.carAge = e.target.value; return; }
    var ct = e.target.closest("[data-cartime]");
    if (ct) {
      state[ct.dataset.cartime === "in" ? "carPickTime" : "carDropTime"] = e.target.value;
    }
  });

  /* Sidebar (mobile) */
  $("#sidebarToggle").addEventListener("click", () => $("#sidebar").classList.toggle("is-open"));
  function closeSidebar() { $("#sidebar").classList.remove("is-open"); }
  window.closeSidebar = closeSidebar;

  /* Reposition / close popovers on resize & scroll */
  window.addEventListener("resize", closePop);
  window.addEventListener("scroll", () => { if (activePop && activeTrigger) positionPopover(activePop, activeTrigger); }, { passive: true });
});
