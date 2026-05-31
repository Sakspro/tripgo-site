/* Vercel Cron — daily Trip.com homepage sync */
const { fetchHomepageFromTrip, contentHash } = require("../../server/lib/trip-home");
const { fetchInspiredFromTrip, contentHash: inspiredHash } = require("../../server/lib/trip-inspired");
const { fetchSidebarFromTrip, contentHash: sidebarHash } = require("../../server/lib/trip-sidebar");

module.exports = async function handler(req, res) {
  var auth = process.env.CRON_SECRET;
  if (auth) {
    var hdr = req.headers["authorization"] || "";
    if (hdr !== "Bearer " + auth) return res.status(401).json({ error: "Unauthorized" });
  }

  var out = { ok: true, homepage: null, inspired: null, sidebar: null };

  try {
    var homepage = await fetchHomepageFromTrip();
    out.homepage = {
      hash: contentHash(homepage),
      syncedAt: homepage.syncedAt,
      claims: homepage.claims.length,
      promos: homepage.promos.length,
      attractions: homepage.attractions.items.length,
      hotels: homepage.hotels.items.length,
      inspiration: homepage.inspiration.items.length,
      chips: homepage.inspired.chips.length,
      flights: homepage.inspired.flights.length,
    };
  } catch (err) {
    out.homepage = { ok: false, error: String(err.message || err) };
    out.ok = false;
  }

  try {
    var inspired = await fetchInspiredFromTrip();
    out.inspired = {
      hash: inspiredHash(inspired),
      syncedAt: inspired.syncedAt,
      chips: inspired.chips.length,
      flights: inspired.flights.length,
    };
  } catch (err) {
    out.inspired = { ok: false, error: String(err.message || err) };
  }

  try {
    var sidebar = await fetchSidebarFromTrip();
    out.sidebar = {
      hash: sidebarHash(sidebar),
      syncedAt: sidebar.syncedAt,
      title: sidebar.cars.title,
      items: sidebar.cars.items.length,
    };
  } catch (err) {
    out.sidebar = { ok: false, error: String(err.message || err) };
  }

  return res.status(out.ok ? 200 : 500).json(out);
};
