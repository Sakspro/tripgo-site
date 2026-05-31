/* Trip.com destination search — htls/getKeywordSearch + getHotDestination */
const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEAD_BASE = {
  platform: "PC",
  bu: "ibu",
  group: "TRIP",
  aid: "",
  sid: "",
  ouid: "",
  currency: "USD",
  region: "XX",
  locale: "en-XX",
  timeZone: "3",
  device: "PC",
  deviceID: "PC",
  clientVersion: "0",
  hotelExtension: { webpSupport: true },
  ticket: "",
  hasAidInUrl: "false",
  href: TRIP_HOME,
};

const TYPE_LABEL = {
  CT: "City",
  A: "Airport",
  LM: "Landmark",
  D: "District",
  H: "Hotel",
  T: "Train station",
  MT: "Metro station",
  N: "Area",
  Z: "Zone",
  P: "Property",
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
  const vid = jar.UBT_VID || jar.GUID || "09034104117166574508";
  return { jar, vid };
}

function makeHead(vid) {
  return Object.assign({}, HEAD_BASE, {
    clientId: vid,
    cid: vid,
    frontend: { vid: vid, sessionID: "3", pvid: "2" },
    traceLogID: Math.random().toString(16).slice(2, 14),
    extension: [
      { name: "cityId", value: "" },
      { name: "checkIn", value: "" },
      { name: "checkOut", value: "" },
    ],
  });
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

function geoName(geo) {
  return (geo && (geo.currentLocaleName || geo.enusName)) || "";
}

function buildSubtitle(item) {
  var parts = [];
  var city = geoName(item.city);
  var province = geoName(item.province);
  var country = geoName(item.country);
  if (item.resultType === "CT" && country) return country;
  if (city && item.resultType !== "CT") parts.push(city);
  if (province && province !== city) parts.push(province);
  if (country) parts.push(country);
  return parts.filter(Boolean).join(", ");
}

function buildDisplayValue(item) {
  var word = item.resultWord || "";
  if (item.resultType === "CT") {
    var country = geoName(item.country);
    return country ? word + ", " + country : word;
  }
  if (item.resultType === "A" && word.indexOf("(") === -1) {
    var city = geoName(item.city);
    return city ? word + " · " + city : word;
  }
  return word;
}

function normalizeItem(raw) {
  var type = raw.resultType || "";
  return {
    code: String(raw.code || ""),
    type: type,
    typeLabel: TYPE_LABEL[type] || type || "Place",
    label: raw.resultWord || "",
    subtitle: buildSubtitle(raw),
    value: buildDisplayValue(raw),
    city: geoName(raw.city),
    country: geoName(raw.country),
  };
}

function keywordBody(keyWord, vid) {
  return {
    code: 0,
    codeType: "",
    keyWord: keyWord,
    searchType: "D",
    scenicCode: 0,
    cityCodeOfUser: 0,
    searchConditions: [
      { type: "D_PROVINCE", value: "T" },
      { type: "SupportNormalSearch", value: "T" },
      { type: "DisplayTagIcon", value: "F" },
    ],
    head: makeHead(vid),
  };
}

async function searchDestinations(keyWord) {
  var q = (keyWord || "").trim();
  if (!q || q.length < 1) return { items: [], source: "trip.com" };

  var session = await bootstrapSession();
  var res = await tripPost(session.jar, "https://www.trip.com/htls/getKeywordSearch", keywordBody(q, session.vid));

  if (!ok(res)) return { items: [], source: "trip.com", error: true };

  var items = (res.keyWordSearchResults || []).map(normalizeItem);
  return { items: items, source: "trip.com", syncedAt: new Date().toISOString() };
}

async function fetchHotDestinations() {
  var session = await bootstrapSession();
  var res = await tripPost(session.jar, "https://www.trip.com/htls/getHotDestination", {
    head: { locale: "en-XX", currency: "USD", group: "trip", site: "EN", source: "Online" },
  });

  if (!ok(res)) return { groups: [], items: [], source: "trip.com", error: true };

  var groups = (res.group || []).filter(function (g) {
    return g.hotDestination && g.hotDestination.length;
  }).map(function (g) {
    return {
      name: g.groupName || "Popular",
      items: g.hotDestination.map(function (d) {
        var name = d.displayName || "";
        return {
          code: String(d.id || d.cityId || ""),
          type: "CT",
          typeLabel: "City",
          label: name,
          subtitle: d.countryName || "",
          value: name,
          city: name,
          country: d.countryName || "",
        };
      }),
    };
  });

  var flat = [];
  groups.forEach(function (g) {
    g.items.forEach(function (it) { flat.push(it); });
  });

  return {
    title: "Places you may like",
    groups: groups,
    items: flat,
    source: "trip.com",
    syncedAt: new Date().toISOString(),
  };
}

module.exports = { searchDestinations, fetchHotDestinations, normalizeItem, TYPE_LABEL };
