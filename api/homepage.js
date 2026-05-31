/* GET /api/homepage — full Trip.com homepage content sync */
const { fetchHomepageFromTrip, contentHash } = require("./lib/trip-home");

let cache = { data: null, hash: "", fetchedAt: 0 };
const TTL_MS = 60 * 60 * 1000;

let fallback = null;
try {
  fallback = require("../data/homepage-cache.json");
} catch (e) {
  fallback = null;
}

if (fallback && !cache.data) {
  cache = { data: fallback, hash: "", fetchedAt: Date.now() };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  var force = req.query && (req.query.refresh === "1" || req.query.refresh === "true");
  var now = Date.now();
  var stale = !cache.data || now - cache.fetchedAt > TTL_MS;

  if (!force && !stale) {
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.setHeader("X-Home-Cache", "hit");
    return res.status(200).json(cache.data);
  }

  try {
    var data = await fetchHomepageFromTrip();
    var hash = contentHash(data);
    cache = { data: data, hash: hash, fetchedAt: now };
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.setHeader("X-Home-Cache", force ? "refresh" : "miss");
    res.setHeader("X-Home-Hash", hash);
    return res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      res.setHeader("X-Home-Cache", "stale-error");
      return res.status(200).json(Object.assign({}, cache.data, { stale: true }));
    }
    if (fallback) {
      res.setHeader("X-Home-Cache", "fallback");
      return res.status(200).json(fallback);
    }
    return res.status(502).json({ error: "Could not sync homepage from Trip.com" });
  }
};
