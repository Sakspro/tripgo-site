/* Parse Trip.com sidebar, search tabs, and footer from homepage HTML */
const { absUrl } = require("./trip-session");
const { toCloneUrl } = require("../../clone-routes");

const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";

const ICON_EMOJI = {
  "fi-hotel_new": "🏨",
  "fi-flight": "✈️",
  "fi-train": "🚄",
  "fi-ic_tnt": "🎟️",
  "fi-tnt": "🎟️",
  "fi-ic_carrental": "🚗",
  "fi-ic_car_rentals_new": "🚗",
  "fi-car": "🚗",
  "fi-airport-transfer": "🚐",
  "fi-ic_bundle": "🧳",
  "fi-bundle": "🧳",
  "fi-a-ic_deal21x": "🏷️",
  "fi-a-TripCoins": "🎁",
  "fi-ic_giftcard": "🎁",
  "fi-ic_BU_cruises": "🛳️",
  "fi-a-ic_BU_customtrips": "✨",
  "fi-ic_insurance": "🛡️",
  "fi-destination": "💡",
};

const SIDEBAR_ORDER = [
  "Hotels", "Flights", "Trains", "TNT", "Cars", "Bundle",
  "Private Tours", "Group Tours", "Custom Trips",
  "TripPlanner", "TravelInspiration", "Map", "Deals",
  "Trip Rewards", "GiftCard", "Cruises", "Insurance",
];

const SEARCH_TAB_ORDER = ["hotels", "flights", "trains", "cars", "ttd", "bundle"];

const SEARCH_TAB_LABEL = {
  hotels: "Hotels & Homes",
  flights: "Flights",
  trains: "Trains",
  cars: "Cars",
  carhire: "Cars",
  transfer: "Airport Transfers",
  ttd: "Attractions & Tours",
  bundle: "Flight + Hotel",
};

const FLYOUT_PARENTS = {
  cars: "cars",
  ttd: "ttd",
  travelinspiration: "travelinspiration",
};

function parseChannelValues(html) {
  var items = [];
  var re = /"value":"(\{[^"]*(?:\\"[^"]*)*\})"/g;
  var m;
  while ((m = re.exec(html))) {
    try { items.push(JSON.parse(m[1].replace(/\\"/g, '"'))); } catch (e) {}
  }
  return items;
}

function extractJsonAfterMarker(html, marker) {
  var idx = html.indexOf(marker);
  if (idx < 0) return null;
  var start = idx + marker.length;
  var depth = 0;
  var end = start;
  for (var i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    if (html[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  try { return JSON.parse(html.slice(start, end)); } catch (e) { return null; }
}

function parseAppState(html) {
  return extractJsonAfterMarker(html, "__APP_INITIAL_STATE__ = ");
}

function parseFooterLinks(html) {
  var m = html.match(/onlinefooterlinke0\\":\\"(\{[\s\S]*?\})\\"/);
  if (!m) m = html.match(/onlinefooterlinke0":"(\{[\s\S]*?\})"/);
  if (!m) return null;
  try { return JSON.parse(m[1].replace(/\\"/g, '"')); } catch (e) { return null; }
}

function emojiFor(icon) {
  return ICON_EMOJI[icon] || "•";
}

function displayLabel(item) {
  if (!item) return "";
  if (item.displayName === "TNT") return "Attractions & Tours";
  if (item.displayName === "tnt") return "Attractions & Tickets";
  if (item.displayName === "Attractions" && /travel-guide/i.test(item.path || "")) return "Travel Guides";
  if (item.displayName === "Bundle") return "Flight + Hotel";
  if (item.displayName === "TripPlanner") return "Trip.Planner";
  if (item.displayName === "TravelInspiration") return "Travel Inspiration";
  if (item.displayName === "Trip Rewards") return "TripGo Rewards";
  return item.displayName || "";
}

function cloneLink(item) {
  var name = (item.displayName || "").toLowerCase();
  var path = item.path || "";
  var parent = (item.parent || "").toLowerCase();

  if (name === "home" || !item.displayName) return null;
  if (/singapore/i.test(path)) return null;

  if (name === "hotels" || /\/hotels\/?$/i.test(path)) {
    return { href: "#search", tab: "hotels", internal: true };
  }
  if (name === "flights" || /\/flights\/?$/i.test(path)) {
    return { href: "#search", tab: "flights", internal: true };
  }
  if (name === "trains" || /\/trains\/?$/i.test(path)) {
    return { href: "#search", tab: "trains", internal: true };
  }
  if (name === "tnt" || item.displayName === "TNT") {
    return { href: "#search", tab: "tours", internal: true, flyout: "ttd" };
  }
  if (parent === "ttd" && /things-to-do/i.test(path)) {
    return { href: "#search", tab: "tours", internal: true };
  }
  if (name === "bundle" || /packages/i.test(path)) {
    return { href: "#search", tab: "package", internal: true };
  }
  if (name === "cars" && !path) {
    return { href: "cars.html", tab: "cars", internal: true, flyout: "cars" };
  }
  if (/airport-transfers/i.test(path)) {
    return { href: "cars.html?sub=transfers", tab: "transfers", internal: true };
  }
  if (parent === "cars" || /carhire/i.test(path)) {
    return { href: "cars.html", tab: "cars", internal: true };
  }
  if (/private-tours/i.test(path)) {
    return { href: "explore.html?cat=private-tours", internal: true };
  }
  if (/group-tours/i.test(path)) {
    return { href: "explore.html?cat=group-tours", internal: true };
  }
  if (/custom-trips/i.test(path)) {
    return { href: "explore.html?cat=custom-trips", internal: true };
  }
  if (name === "tripplanner" || /tripplanner/i.test(path)) {
    return { href: "explore.html?cat=planner", internal: true, badge: "New" };
  }
  if (name === "travelinspiration" && !path) {
    return { href: "explore.html?cat=inspiration", internal: true, flyout: "travelinspiration" };
  }
  if (parent === "travelinspiration") {
    return { href: "explore.html?cat=inspiration", internal: true };
  }
  if (name === "map" || /tripmap\/travel/i.test(path)) {
    return { href: "map.html", internal: true };
  }
  if (name === "deals" || /\/sale\/deals/i.test(path)) {
    return { href: "explore.html?cat=deals", internal: true };
  }
  if (/trip rewards/i.test(name) || /loyalty/i.test(path)) {
    return { href: "explore.html?cat=rewards", internal: true };
  }
  if (/giftcard/i.test(path)) {
    return { href: "explore.html?cat=giftcard", internal: true };
  }
  if (/cruises/i.test(path)) {
    return { href: "explore.html?cat=cruises", internal: true };
  }
  if (/insurance/i.test(path)) {
    return { href: "explore.html?cat=insurance", internal: true };
  }
  if (/esim/i.test(path)) {
    return { href: toCloneUrl(path), internal: true };
  }

  if (!path) return null;
  return { href: toCloneUrl(path), internal: true };
}

function buildFlyouts(channels) {
  var flyouts = {};
  Object.keys(FLYOUT_PARENTS).forEach(function (key) {
    var children = channels.filter(function (v) { return v.parent === key; });
    if (!children.length) return;
    flyouts[key] = children.map(function (c) {
      var link = cloneLink(c);
      return {
        label: displayLabel(c) || c.displayName,
        href: link ? link.href : toCloneUrl(c.path),
        tab: link && link.tab ? link.tab : "",
        internal: true,
        path: c.path || "",
        tripUrl: absUrl(c.path),
      };
    });
  });
  return flyouts;
}

function buildSidebar(channels) {
  var tops = channels.filter(function (c) { return !c.parent && c.displayName && c.displayName !== "Home"; });
  tops.sort(function (a, b) {
    var ai = SIDEBAR_ORDER.indexOf(a.displayName);
    var bi = SIDEBAR_ORDER.indexOf(b.displayName);
    if (ai < 0) ai = 999;
    if (bi < 0) bi = 999;
    return ai - bi;
  });

  var items = [];
  var lastGroup = null;
  tops.forEach(function (c) {
    var link = cloneLink(c);
    if (!link) return;
    var groupId = c.groupId;
    if (lastGroup != null && groupId != null && groupId !== lastGroup && items.length) {
      items.push({ type: "sep" });
    }
    lastGroup = groupId;

    items.push({
      type: "item",
      label: displayLabel(c),
      icon: emojiFor(c.icon),
      href: link.href,
      tab: link.tab || "",
      internal: true,
      flyout: link.flyout || "",
      badge: link.badge || "",
      tripUrl: absUrl(c.path),
      groupId: groupId,
    });
  });

  items.push({ type: "sep" });
  items.push({
    type: "item",
    label: "App",
    icon: "📲",
    href: "app.html",
    internal: true,
  });

  return items;
}

function buildSearchTabs(state, channels) {
  var appChannels = (state && state.channels) || [];
  var nameById = {};
  channels.forEach(function (c) {
    if (c.displayName === "TNT") nameById.ttd = "Attractions & Tours";
    if (c.displayName === "Bundle") nameById.bundle = "Flight + Hotel";
    if (c.displayName === "Hotels") nameById.hotels = "Hotels & Homes";
    if (c.displayName === "Flights") nameById.flights = "Flights";
    if (c.displayName === "Trains") nameById.trains = "Trains";
    if (c.displayName === "Cars") nameById.cars = "Cars";
  });

  var tabs = [];
  SEARCH_TAB_ORDER.forEach(function (id) {
    var ch = appChannels.find(function (c) { return c.id === id; });
    if (!ch || ch.open_state === false) return;
    var label = nameById[id] || SEARCH_TAB_LABEL[id] || id;
    var tab = id === "ttd" ? "tours" : (id === "bundle" ? "package" : id);
    var icon = emojiFor(ch.icon_class || "");
    tabs.push({ id: id, tab: tab, label: label, icon: icon });
  });

  return tabs;
}

function normalizeFooterSection(title, links) {
  if (!Array.isArray(links)) return null;
  return {
    title: title,
    links: links.filter(function (l) { return l.show !== "0" && l.displayName; }).map(function (l) {
      var raw = l.link || l.url || "";
      var label = (l.displayName || "").replace(/Trip\.com/gi, "TripGo");
      return {
        label: label,
        href: toCloneUrl(raw, { label: label }),
        internal: true,
      };
    }),
  };
}

function buildFooter(html, state) {
  var cargo = parseFooterLinks(html);
  var cols = [];
  if (cargo) {
    if (cargo.contactUs) cols.push(normalizeFooterSection("Contact us", cargo.contactUs));
    if (cargo.about) cols.push(normalizeFooterSection("About", cargo.about));
    if (cargo.otherServices) cols.push(normalizeFooterSection("Other services", cargo.otherServices));
  }

  var seo = null;
  var seoData = state && state.seoLinksContent && state.seoLinksContent.data;
  if (seoData) {
    seo = {
      title: (seoData.title || "Trip.com recommendations").replace(/Trip\.com/gi, "TripGo"),
      tabs: (seoData.tabList || []).map(function (tab) {
        var links = (tab.linkListProps && tab.linkListProps.links) || [];
        return {
          text: tab.text,
          links: links.map(function (l) {
            var text = l.text || l.keyword || "";
            return {
              text: text,
              href: toCloneUrl(l.link || "", { text: text }),
            };
          }),
        };
      }),
    };
  }

  return { cols: cols.filter(Boolean), seo: seo };
}

function parseNavFromHtml(html) {
  var channels = parseChannelValues(html);
  var state = parseAppState(html);
  var flyouts = buildFlyouts(channels);
  var sidebar = buildSidebar(channels);
  var searchTabs = buildSearchTabs(state, channels);
  var footer = buildFooter(html, state);

  /* Legacy cars block for applySidebarCars */
  var carsParent = channels.find(function (v) {
    return v.displayName === "Cars" && (v.path === "" || v.path == null);
  });
  var carsChildren = flyouts.cars || [];
  var sidebarCars = {
    cars: {
      title: carsParent ? displayLabel(carsParent) : "Cars",
      icon: emojiFor(carsParent && carsParent.icon),
      tab: "cars",
      href: "cars.html",
      items: carsChildren.map(function (c) {
        return {
          label: c.label,
          tab: c.tab === "transfers" ? "transfers" : "cars",
          icon: emojiFor(""),
          path: c.path,
          href: c.href,
          tripUrl: c.tripUrl,
        };
      }),
    },
    syncedAt: new Date().toISOString(),
    source: "trip.com",
  };

  return {
    sidebar: sidebar,
    flyouts: flyouts,
    searchTabs: searchTabs,
    footer: footer,
    sidebarCars: sidebarCars,
    channelCount: channels.length,
  };
}

module.exports = {
  parseNavFromHtml,
  parseChannelValues,
  buildFlyouts,
  buildSidebar,
  buildSearchTabs,
  buildFooter,
  displayLabel,
  cloneLink,
  emojiFor,
  TRIP_HOME,
};
