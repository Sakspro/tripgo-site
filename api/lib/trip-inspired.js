/* Fetch & normalize Trip.com "Get inspired for your next trip" data */
const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";
const { toCloneUrl } = require("../../clone-routes");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEAD = {
  locale: "en-XX",
  currency: "USD",
  site: "EN",
  group: "trip",
  source: "Online",
};

function parseCookies(setCookieHeaders) {
  const jar = {};
  if (!setCookieHeaders) return jar;
  for (const h of setCookieHeaders) {
    const part = h.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
}

async function bootstrapSession() {
  const res = await fetch(TRIP_HOME, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  const jar = parseCookies(res.headers.getSetCookie ? res.headers.getSetCookie() : []);
  return { jar, vid: jar.UBT_VID || jar.GUID || "" };
}

function tripPost(jar, url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      Accept: "application/json",
      Origin: "https://www.trip.com",
      Referer: TRIP_HOME,
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify(body),
  }).then(function (r) { return r.json(); });
}

function ok(res) {
  return res && res.ResponseStatus && res.ResponseStatus.Ack === "Success";
}

function normalizeChip(p) {
  return {
    title: p.title || "",
    anywhere: !!p.anywhere,
    districtId: p.districtId != null ? String(p.districtId) : "",
    districtName: p.districtName || p.title || "",
    districtEnName: p.districtEnName || p.districtName || p.title || "",
    cityId: p.cityId || 0,
    imageUrl: p.imageUrl || "",
    tagList: p.tagList || [],
  };
}

function normalizeFlight(p, chipTag) {
  var isFlight = p.trafficType === "FLIGHT";
  var dest = p.arrivalCity || p.districtEnName || p.districtName || chipTag || "";
  var img = p.coverImage || "";
  if (img && img.indexOf("//") === 0) img = "https:" + img;
  return {
    dest: dest,
    country: p.departureCity ? (p.departureCity + " → " + dest) : (p.tagList && p.tagList[0]) || "One-way",
    price: typeof p.price === "number" ? Math.round(p.price) : 0,
    img: img,
    tag: chipTag || dest,
    tripType: isFlight ? (p.arrivalCity && p.departureDate ? "One-way" : "Round-trip") : "Train",
    depart: p.departureCity || "",
    dates: [p.departureDate, p.arrivalDate].filter(Boolean).join(" – "),
    deeplink: toCloneUrl(p.deeplink || p.deepLink || "", { dest: dest }),
    trafficType: p.trafficType || "FLIGHT",
  };
}

function chipKey(c) {
  return c.anywhere ? "Anywhere" : (c.districtEnName || c.title);
}

function trafficBody(chip, vid) {
  var head = { locale: "en-XX", currency: "USD", source: "Online", vid: vid };
  if (chip.anywhere) return { anywhere: true, head: head };
  return {
    anywhere: false,
    districtId: chip.districtId,
    districtName: chip.districtName,
    districtEnName: chip.districtEnName,
    cityId: chip.cityId,
    head: head,
  };
}

async function fetchTrafficForChip(jar, vid, chip) {
  try {
    var res = await tripPost(jar, "https://www.trip.com/restapi/soa2/18814/json/getRecommendTraffic", trafficBody(chip, vid));
    if (!ok(res)) return [];
    return (res.productsList || []).map(function (p) {
      return normalizeFlight(p, chipKey(chip));
    });
  } catch (e) {
    return [];
  }
}

async function fetchInspiredFromTrip() {
  var session = await bootstrapSession();
  var jar = session.jar;
  var vid = session.vid;

  var destRes = await tripPost(jar, "https://www.trip.com/restapi/soa2/18814/getRecommendedDestination", {
    head: HEAD,
    locale: "en-XX",
    currency: "USD",
  });

  var chips = ok(destRes) ? (destRes.productsList || []).map(normalizeChip) : [];
  var title = (ok(destRes) && destRes.title) || "Get inspired for your next trip";
  var moreUrl = toCloneUrl(destRes.moreUrl || "", { fallback: "flights.html" });

  var flights = [];
  var seen = {};

  for (var i = 0; i < chips.length; i++) {
    var list = await fetchTrafficForChip(jar, vid, chips[i]);
    for (var j = 0; j < list.length; j++) {
      var f = list[j];
      var key = f.dest + "|" + f.depart + "|" + f.price;
      if (!seen[key]) {
        seen[key] = true;
        flights.push(f);
      }
    }
  }

  /* When Trip.com returns no priced flights, build browse cards from destination chips */
  if (!flights.length) {
    chips.filter(function (c) { return !c.anywhere; }).forEach(function (c) {
      var img = c.imageUrl || "";
      if (img && img.indexOf("//") === 0) img = "https:" + img;
      flights.push({
        dest: c.districtEnName || c.title,
        country: (c.tagList && c.tagList[0]) || "Explore flights",
        price: 0,
        img: img,
        tag: c.districtEnName || c.title,
        tripType: "One-way",
        depart: "",
        dates: "",
        deeplink: "",
        trafficType: "FLIGHT",
        browseOnly: true,
      });
    });
  }

  return {
    title: title,
    subtitle: "Explore one-way flights from your area",
    moreUrl: moreUrl,
    chips: ["Anywhere"].concat(chips.filter(function (c) { return !c.anywhere; }).map(function (c) {
      return c.districtEnName || c.title;
    })),
    chipData: chips,
    flights: flights,
    syncedAt: new Date().toISOString(),
    source: "trip.com",
  };
}

function contentHash(data) {
  var crypto = require("crypto");
  var payload = JSON.stringify({
    chips: data.chips,
    flights: data.flights.map(function (f) {
      return { dest: f.dest, price: f.price, tag: f.tag, depart: f.depart };
    }),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

module.exports = { fetchInspiredFromTrip, contentHash };
