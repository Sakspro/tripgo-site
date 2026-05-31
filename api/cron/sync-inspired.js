/* Vercel Cron — daily Trip.com inspired refresh (Hobby: once per day) */
const { fetchInspiredFromTrip, contentHash } = require("../lib/trip-inspired");

module.exports = async function handler(req, res) {
  var auth = process.env.CRON_SECRET;
  if (auth) {
    var hdr = req.headers["authorization"] || "";
    if (hdr !== "Bearer " + auth) return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    var data = await fetchInspiredFromTrip();
    var hash = contentHash(data);
    /* Warm the main API route cache by returning payload (cron logs + edge revalidation) */
    return res.status(200).json({
      ok: true,
      hash: hash,
      syncedAt: data.syncedAt,
      chips: data.chips.length,
      flights: data.flights.length,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
};
