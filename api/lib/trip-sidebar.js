/* Fetch & normalize Trip.com sidebar Cars navigation from homepage config */
const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ICON_EMOJI = {
  "fi-car": "🚗",
  "fi-ic_carrental": "🚗",
  "fi-airport-transfer": "🚐",
  "fi-chauffeur": "🤵",
};

function parseChannelValues(html) {
  var items = [];
  var re = /"value":"(\{[^"]*(?:\\"[^"]*)*\})"/g;
  var m;
  while ((m = re.exec(html))) {
    try {
      items.push(JSON.parse(m[1].replace(/\\"/g, '"')));
    } catch (e) { /* skip malformed */ }
  }
  return items;
}

function tabForItem(item) {
  var path = item.path || "";
  if (/airport-transfers/i.test(path)) return "transfers";
  if (/chauffeur/i.test(path)) return "transfers";
  if (/carhire|car-rental|\/car/i.test(path)) return "cars";
  return "cars";
}

function cloneHref(path, tab) {
  var p = path || "";
  if (/airport-transfers|chauffeur/i.test(p)) return "transfers.html";
  if (/carhire|car-rental/i.test(p)) return "cars.html";
  if (tab === "transfers") return "transfers.html";
  return "cars.html";
}

function tripUrl(path) {
  if (!path) return TRIP_HOME + "#search";
  if (path.indexOf("http") === 0) return path;
  return "https://www.trip.com" + (path.charAt(0) === "/" ? path : "/" + path);
}

function emojiFor(icon) {
  return ICON_EMOJI[icon] || "🚗";
}

async function fetchSidebarFromTrip() {
  var res = await fetch(TRIP_HOME, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  var html = await res.text();
  var items = parseChannelValues(html);

  var parent = items.find(function (v) {
    return v.displayName === "Cars" && (v.path === "" || v.path == null);
  }) || { displayName: "Cars", icon: "fi-ic_carrental" };

  var children = items.filter(function (v) { return v.parent === "cars"; });
  if (!children.length) {
    children = [
      { displayName: "Car Rentals", path: "/carhire/?channelid=14409", icon: "fi-car", parent: "cars" },
      { displayName: "Airport Transfers", path: "/airport-transfers/", icon: "fi-airport-transfer", parent: "cars" },
    ];
  }

  var childItems = children.map(function (c) {
    var tab = tabForItem(c);
    return {
      label: c.displayName,
      tab: tab,
      icon: emojiFor(c.icon),
      path: c.path || "",
      href: cloneHref(c.path, tab),
      tripUrl: tripUrl(c.path),
      sharkKey: c.displayNameSharkKey || "",
    };
  });

  return {
    cars: {
      title: parent.displayName || "Cars",
      icon: emojiFor(parent.icon),
      tab: "cars",
      href: childItems.length ? childItems[0].href : "cars.html",
      items: childItems,
    },
    syncedAt: new Date().toISOString(),
    source: "trip.com",
  };
}

function contentHash(data) {
  var crypto = require("crypto");
  var payload = JSON.stringify({
    title: data.cars.title,
    items: (data.cars.items || []).map(function (i) { return i.label + "|" + i.path; }),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

module.exports = { fetchSidebarFromTrip, contentHash };
