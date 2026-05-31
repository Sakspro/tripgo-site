/* Fetch & normalize all Trip.com homepage content in one session */
const { bootstrapSession, tripPost, ok, absUrl, HEAD } = require("./trip-session");
const { fetchSidebarFromTrip } = require("./trip-sidebar");

function parseChannelValues(html) {
  var items = [];
  var re = /"value":"(\{[^"]*(?:\\"[^"]*)*\})"/g;
  var m;
  while ((m = re.exec(html))) {
    try { items.push(JSON.parse(m[1].replace(/\\"/g, '"'))); } catch (e) {}
  }
  return items;
}

function parseSsrPromos(html) {
  var m = html.match(/__SUSPEND_DATA__\s*=\s*(\{[\s\S]*?\});/);
  if (!m) return [];
  try {
    var sd = JSON.parse(m[1]);
    var ads = sd.advertizeData && sd.advertizeData.dealsData && sd.advertizeData.dealsData.adsWidgetDataTypes;
    if (!ads || !ads.length) return [];
    return (ads[0].adsDisplayDataTypes || []).map(normalizePromo);
  } catch (e) {
    return [];
  }
}

function parseHeroTrust(html) {
  var m = html.match(/"uspSsrData"\s*:\s*(\{[\s\S]*?\})\s*,/);
  if (m) {
    try {
      var usp = JSON.parse(m[1]);
      if (usp && usp.textList && usp.textList.length) {
        return usp.textList.map(function (t) { return "✓ " + t; }).join("\u00a0\u00a0|\u00a0\u00a0");
      }
    } catch (e) {}
  }
  return "✓ Secure payment\u00a0\u00a0|\u00a0\u00a0✓ Support in approx. 30s";
}

function normalizePromo(p) {
  return {
    t: p.title || "",
    s: p.introduction || p.subTitle || p.description || "",
    img: absUrl(p.coverImageUrl || p.coverImage || ""),
    href: absUrl(p.pageLink || p.deeplink || ""),
    promoId: p.promoId || "",
  };
}

function normalizeClaim(p, index) {
  return {
    id: String(p.propertyBaseId || p.type + "-" + index),
    off: p.title || "Offer",
    txt: p.subTitle || p.title || "",
    cta: "Claim all",
    coupon: p.type === "COUPON" ? (p.title || "").replace(/\s+/g, "").toUpperCase().slice(0, 12) : "",
    type: p.type || "",
    href: absUrl(p.jumpLink || ""),
  };
}

function normalizeChip(p) {
  return {
    title: p.title || "",
    anywhere: !!p.anywhere,
    districtId: p.districtId != null ? String(p.districtId) : "",
    districtName: p.districtName || p.title || "",
    districtEnName: p.districtEnName || p.districtName || p.title || "",
    cityId: p.cityId || 0,
    imageUrl: absUrl(p.imageUrl || ""),
    tagList: p.tagList || [],
  };
}

function chipKey(c) {
  return c.anywhere ? "Anywhere" : (c.districtEnName || c.title);
}

function normalizeFlight(p, chipTag) {
  var dest = p.arrivalCity || p.districtEnName || p.districtName || chipTag || "";
  return {
    dest: dest,
    country: p.departureCity ? (p.departureCity + " → " + dest) : ((p.tagList && p.tagList[0]) || "One-way"),
    price: typeof p.price === "number" ? Math.round(p.price) : 0,
    img: absUrl(p.coverImage || ""),
    tag: chipTag || dest,
    tripType: p.trafficType === "FLIGHT" ? "One-way" : "Train",
    depart: p.departureCity || "",
    dates: [p.departureDate, p.arrivalDate].filter(Boolean).join(" – "),
    deeplink: absUrl(p.deeplink || p.deepLink || ""),
    trafficType: p.trafficType || "FLIGHT",
  };
}

function normalizeRating(r, full) {
  var n = parseFloat(r);
  if (isNaN(n)) return 4.5;
  var max = parseFloat(full) || 5;
  if (max > 5) return Math.round((n / max) * 50) / 10;
  return n;
}

function normalizeAttraction(p) {
  return {
    t: p.title || "",
    m: p.district || "",
    p: 0,
    r: normalizeRating(p.rating, p.fullRating),
    img: absUrl(p.coverImage || ""),
    city: p.district || "",
    deeplink: absUrl(p.deeplink || ""),
    votes: p.votes || 0,
    hotScore: p.hotScore || "",
    tags: p.tagList || [],
  };
}

function normalizeHotel(p) {
  var price = typeof p.price === "number" ? Math.round(p.price) : parseInt(p.priceStr, 10) || 0;
  return {
    t: p.title || "",
    m: p.city || "",
    p: price,
    r: normalizeRating(p.rating, p.fullRating),
    img: absUrl(p.coverImage || ""),
    city: p.city || "",
    deeplink: absUrl(p.deeplink || ""),
    stars: p.starCount || 0,
    marketing: p.marketingText || "",
  };
}

function normalizeInspo(p) {
  return {
    t: p.title || "",
    m: p.authorName ? ("Trip Moments · " + p.authorName) : "Trip Moments",
    img: absUrl(p.coverImage || ""),
    slug: String(p.productId || ""),
    href: absUrl(p.deepLink || p.deeplink || ""),
  };
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

function geoBody(city, vid) {
  return {
    head: { locale: "en-XX", currency: "USD", source: "Online", vid: vid },
    anywhere: false,
    cityId: city.cityId || 0,
    districtId: city.districtId || city.cityId || 0,
    districtName: city.cNName || city.cityName || city.enName || "",
    districtEnName: city.eNName || city.enName || city.cityEnName || city.cNName || city.cityName || "",
  };
}

async function fetchHomepageFromTrip() {
  var session = await bootstrapSession();
  var jar = session.jar;
  var vid = session.vid;
  var html = session.html;

  var headVid = Object.assign({}, HEAD, { vid: vid });
  var geoRes = await tripPost(jar, "https://www.trip.com/restapi/soa2/14571/getCityByIp", { head: headVid });
  var city = (ok(geoRes) && geoRes.cityList && geoRes.cityList[0]) || {};
  var geo = geoBody(city, vid);

  var couponsReq = tripPost(jar, "https://www.trip.com/restapi/soa2/18417/RecommendPropertyGeneral", {
    head: { source: "Online", locale: "en-XX", currency: "USD", group: "trip", vid: vid },
    requestModule: "OnlineHomeBanner",
  });
  var promosReq = tripPost(jar, "https://www.trip.com/restapi/soa2/19816/bjjson/queryAdsDisplayData", {
    head: { group: "trip", locale: "en-XX", currency: "USD", source: "ONLINE", clientID: vid },
    moduleNames: ["ONLINE_INDEX_TOP_DEAL"],
  });
  var attReq = tripPost(jar, "https://www.trip.com/restapi/soa2/18814/json/getRecommendedAttraction", geo);
  var hotReq = tripPost(jar, "https://www.trip.com/restapi/soa2/18814/getRecommendHotel", geo);
  var momReq = tripPost(jar, "https://www.trip.com/restapi/soa2/18814/getRecommendMoments", geo);
  var destReq = tripPost(jar, "https://www.trip.com/restapi/soa2/18814/getRecommendedDestination", {
    head: HEAD, locale: "en-XX", currency: "USD",
  });

  var batch = await Promise.all([couponsReq, promosReq, attReq, hotReq, momReq, destReq]);

  /* Claims */
  var propertyDTO = (ok(batch[0]) && batch[0].propertyDTO) || [];
  var claims = [
    { id: "welcome", off: "Welcome", txt: "New users get more discounts on travel!", cta: "Sign in & claim", dd: "ddSignin" },
  ].concat(propertyDTO.slice(0, 6).map(normalizeClaim));

  /* Promos */
  var promoApi = batch[1];
  var promos = [];
  if (ok(promoApi) && promoApi.adsWidgetDataTypes && promoApi.adsWidgetDataTypes.length) {
    promos = (promoApi.adsWidgetDataTypes[0].adsDisplayDataTypes || []).map(normalizePromo);
  }
  if (!promos.length) promos = parseSsrPromos(html);

  /* Attractions */
  var attRes = batch[2];
  var attractions = {
    title: (ok(attRes) && attRes.title) || "Popular attractions",
    moreUrl: absUrl(attRes && attRes.moreUrl),
    items: ok(attRes) ? (attRes.productsList || []).map(normalizeAttraction) : [],
  };

  /* Hotels */
  var hotRes = batch[3];
  var hotels = {
    title: (ok(hotRes) && hotRes.title) || "Featured hotels & homes",
    moreUrl: absUrl(hotRes && hotRes.moreUrl),
    items: ok(hotRes) ? (hotRes.productsList || []).map(normalizeHotel) : [],
  };

  /* Travel inspiration / moments */
  var momRes = batch[4];
  var inspiration = {
    title: (ok(momRes) && momRes.title) || "Travel inspiration",
    moreUrl: absUrl(momRes && momRes.moreUrl),
    items: ok(momRes) ? (momRes.productsList || []).map(normalizeInspo) : [],
  };

  /* Get inspired */
  var destRes = batch[5];
  var chips = ok(destRes) ? (destRes.productsList || []).map(normalizeChip) : [];
  var flights = [];
  var seen = {};
  for (var i = 0; i < chips.length; i++) {
    try {
      var tr = await tripPost(jar, "https://www.trip.com/restapi/soa2/18814/json/getRecommendTraffic", trafficBody(chips[i], vid));
      if (!ok(tr)) continue;
      (tr.productsList || []).forEach(function (p) {
        var f = normalizeFlight(p, chipKey(chips[i]));
        var key = f.dest + "|" + f.depart + "|" + f.price;
        if (!seen[key]) { seen[key] = true; flights.push(f); }
      });
    } catch (e) {}
  }
  if (!flights.length) {
    chips.filter(function (c) { return !c.anywhere; }).forEach(function (c) {
      flights.push({
        dest: c.districtEnName || c.title,
        country: (c.tagList && c.tagList[0]) || "Explore flights",
        price: 0, img: c.imageUrl, tag: c.districtEnName || c.title,
        tripType: "One-way", depart: "", dates: "", deeplink: "", trafficType: "FLIGHT", browseOnly: true,
      });
    });
  }

  var inspired = {
    title: (ok(destRes) && destRes.title) || "Get inspired for your next trip",
    subtitle: "Explore one-way flights from your area",
    moreUrl: absUrl(destRes && destRes.moreUrl),
    chips: ["Anywhere"].concat(chips.filter(function (c) { return !c.anywhere; }).map(function (c) {
      return c.districtEnName || c.title;
    })),
    chipData: chips,
    flights: flights,
  };

  /* Sidebar cars — reuse existing lib (extra fetch; acceptable for cron) */
  var sidebar = null;
  try {
    sidebar = await fetchSidebarFromTrip();
  } catch (e) {
    sidebar = null;
  }

  /* Flyout nav from channel config */
  var channels = parseChannelValues(html);
  var flyouts = {};
  ["ttd", "travelinspiration"].forEach(function (parent) {
    var children = channels.filter(function (v) { return v.parent === parent; });
    if (children.length) {
      flyouts[parent] = children.map(function (c) {
        return { label: c.displayName, href: absUrl(c.path), path: c.path || "" };
      });
    }
  });

  return {
    heroTrust: parseHeroTrust(html),
    claims: claims,
    promos: promos,
    inspired: inspired,
    attractions: attractions,
    hotels: hotels,
    inspiration: inspiration,
    sidebar: sidebar,
    flyouts: flyouts,
    syncedAt: new Date().toISOString(),
    source: "trip.com",
  };
}

function contentHash(data) {
  var crypto = require("crypto");
  var payload = JSON.stringify({
    claims: (data.claims || []).length,
    promos: (data.promos || []).map(function (p) { return p.t; }),
    inspired: data.inspired && data.inspired.chips,
    attractions: (data.attractions && data.attractions.items || []).map(function (a) { return a.t; }),
    hotels: (data.hotels && data.hotels.items || []).map(function (h) { return h.t; }),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

module.exports = { fetchHomepageFromTrip, contentHash };
