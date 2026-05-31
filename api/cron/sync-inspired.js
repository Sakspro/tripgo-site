/* Vercel Cron — daily Trip.com sync (inspired + sidebar) */
const { fetchInspiredFromTrip, contentHash: inspiredHash } = require("../lib/trip-inspired");
const { fetchSidebarFromTrip, contentHash: sidebarHash } = require("../lib/trip-sidebar");

module.exports = async function handler(req, res) {
  var auth = process.env.CRON_SECRET;
  if (auth) {
    var hdr = req.headers["authorization"] || "";
    if (hdr !== "Bearer " + auth) return res.status(401).json({ error: "Unauthorized" });
  }

  var out = { ok: true, inspired: null, sidebar: null };

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
    out.ok = false;
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
    out.ok = false;
  }

  return res.status(out.ok ? 200 : 500).json(out);
};
