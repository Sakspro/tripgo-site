/* TripGo — map Trip.com URLs to internal site routes */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.TGtoCloneUrl = api.toCloneUrl;
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FOOTER_LABELS = {
    "about trip.com": "info.html?p=about",
    "about tripgo": "info.html?p=about",
    news: "info.html?p=news",
    careers: "info.html?p=careers",
    "terms & conditions": "info.html?p=terms",
    "terms and conditions": "info.html?p=terms",
    "privacy statement": "info.html?p=privacy",
    "accessibility statement": "info.html?p=accessibility",
    "customer support": "support.html",
    "service guarantee": "support.html",
    "more service info": "support.html",
    "investor relations": "info.html?p=investors",
    "affiliate program": "info.html?p=affiliate",
    "list your property": "list-property.html",
    "list my hotel": "list-property.html",
    "become a supplier": "list-property.html",
    "all hotels": "results.html?tab=hotels",
    "hotel cities": "results.html?tab=hotels",
    security: "info.html?p=security",
    "trip.com rewards": "explore.html?cat=rewards",
    "tripgo rewards": "explore.html?cat=rewards",
  };

  function parseUrl(raw) {
    if (!raw) return { path: "", host: "" };
    try {
      var base = raw.indexOf("http") === 0 || raw.indexOf("//") === 0
        ? raw.replace(/^\/\//, "https://")
        : "https://www.trip.com" + (raw.charAt(0) === "/" ? raw : "/" + raw);
      var u = new URL(base);
      return { path: u.pathname + u.search, host: (u.hostname || "").toLowerCase() };
    } catch (e) {
      return { path: String(raw), host: "" };
    }
  }

  function titleCaseSlug(slug) {
    return String(slug || "")
      .split("-")
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(" ");
  }

  function cityFromHotelPath(path) {
    var m = String(path || "").match(/\/hotels\/([a-z0-9-]+)-hotels-list/i);
    return m ? titleCaseSlug(m[1]) : "";
  }

  function cityFromText(text) {
    var t = String(text || "");
    var m = t.match(/(?:hotels?|flights?|trains?|cars?|activities?)\s+(?:in|to)\s+(.+)/i);
    return m ? m[1].trim() : "";
  }

  function isTripHost(host) {
    return !host || /(^|\.)trip\.com$/i.test(host) || host === "src.trip.com";
  }

  function isInternal(raw) {
    if (!raw) return true;
    if (/^#/.test(raw)) return true;
    if (/^index\.html|^results\.html|^explore\.html|^cars\.html|^map\.html|^support\.html|^info\.html|^app\.html|^list-property\.html|^booking\.html|^flights\.html/i.test(raw)) return true;
    if (/^\/api\//.test(raw)) return true;
    var parsed = parseUrl(raw);
    return !isTripHost(parsed.host);
  }

  function toCloneUrl(raw, opts) {
    opts = opts || {};
    if (!raw) return opts.fallback || "index.html";
    if (isInternal(raw)) return raw;

    var label = (opts.label || opts.text || "").trim();
    var labelKey = label.toLowerCase();
    if (FOOTER_LABELS[labelKey]) return FOOTER_LABELS[labelKey];

    var parsed = parseUrl(raw);
    var path = parsed.path.toLowerCase();
    var city = opts.city || opts.dest || cityFromHotelPath(parsed.path) || cityFromText(label);

    if (/\/hotels(?:\/|$|\?)/.test(path)) {
      return city
        ? "results.html?tab=hotels&dest=" + encodeURIComponent(city)
        : "results.html?tab=hotels";
    }
    if (/\/flights(?:\/|$|\?)/.test(path)) {
      return city
        ? "results.html?tab=flights&to=" + encodeURIComponent(city)
        : "index.html?tab=flights#search";
    }
    if (/\/trains(?:\/|$|\?)/.test(path)) return "index.html?tab=trains#search";
    if (/airport-transfers/.test(path)) return "cars.html?sub=transfers";
    if (/carhire|\/car\//.test(path)) return "cars.html";
    if (/things-to-do|\/ttd\//.test(path)) {
      return city
        ? "results.html?tab=tours&dest=" + encodeURIComponent(city)
        : "index.html?tab=tours#search";
    }
    if (/packages|\/bundle/.test(path)) return "index.html?tab=package#search";
    if (/\/sale\//.test(path)) return "explore.html?cat=deals";
    if (/travel-guide|tripbest|toplist|moments/.test(path)) return "explore.html?cat=inspiration";
    if (/private-tours/.test(path)) {
      return city
        ? "explore.html?cat=private-tours&dest=" + encodeURIComponent(city)
        : "explore.html?cat=private-tours";
    }
    if (/group-tours/.test(path)) return "explore.html?cat=group-tours";
    if (/custom-trips/.test(path)) return "explore.html?cat=custom-trips";
    if (/tripmap\/travel/.test(path)) return "map.html";
    if (/tripplanner/.test(path)) {
      return city
        ? "explore.html?cat=planner&dest=" + encodeURIComponent(city)
        : "explore.html?cat=planner";
    }
    if (/loyalty|\/customer\/loyalty/.test(path)) return "explore.html?cat=rewards";
    if (/giftcard/.test(path)) return "explore.html?cat=giftcard";
    if (/cruises/.test(path)) return "explore.html?cat=cruises";
    if (/insurance/.test(path)) return "explore.html?cat=insurance";
    if (/esim/.test(path)) return "explore.html?cat=esim";
    if (/list-your-property|list.property/.test(path)) return "list-property.html";
    if (/help\.trip|\/help\//.test(path)) return "support.html";
    if (/bookings|mybooking/.test(path)) return "bookings.html";
    if (/contents\/|\/about|\/news|\/careers|\/terms|\/privacy/.test(path)) {
      if (/privacy/.test(path)) return "info.html?p=privacy";
      if (/terms/.test(path)) return "info.html?p=terms";
      if (/careers/.test(path)) return "info.html?p=careers";
      if (/news/.test(path)) return "info.html?p=news";
      if (/accessibility/.test(path)) return "info.html?p=accessibility";
      return "info.html?p=about";
    }
    if (/investor/.test(path)) return "info.html?p=investors";
    if (/affiliate/.test(path)) return "info.html?p=affiliate";
    if (/security|src\.trip/.test(path)) return "info.html?p=security";
    if (/vbooking|supplier/.test(path)) return "list-property.html";

    if (labelKey.indexOf("hotel") >= 0 && city) {
      return "results.html?tab=hotels&dest=" + encodeURIComponent(city);
    }
    if (labelKey.indexOf("flight") >= 0 && city) {
      return "results.html?tab=flights&to=" + encodeURIComponent(city);
    }

    return opts.fallback || "explore.html?cat=deals";
  }

  return { toCloneUrl: toCloneUrl, isInternal: isInternal };
});
