/* Fetch & normalize Trip.com sidebar Cars navigation from homepage config */
const { parseNavFromHtml, TRIP_HOME } = require("./trip-nav");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchSidebarFromTrip() {
  var res = await fetch(TRIP_HOME, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  var html = await res.text();
  var nav = parseNavFromHtml(html);
  return nav.sidebarCars;
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
