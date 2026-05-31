/* GET /api/sidebar — live-synced Trip.com sidebar (Cars section) */
const { fetchSidebarFromTrip, contentHash } = require("./lib/trip-sidebar");

let cache = { data: null, hash: "", fetchedAt: 0 };
const TTL_MS = 60 * 60 * 1000;

let fallback = null;
try {
  fallback = require("../data/sidebar-cache.json");
} catch (e) {
  fallback = null;
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
    res.setHeader("X-Sidebar-Cache", "hit");
    return res.status(200).json(cache.data);
  }

  try {
    var data = await fetchSidebarFromTrip();
    cache = { data: data, hash: contentHash(data), fetchedAt: now };

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.setHeader("X-Sidebar-Cache", force ? "refresh" : "miss");
    res.setHeader("X-Sidebar-Hash", cache.hash);
    return res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      res.setHeader("X-Sidebar-Cache", "stale-error");
      return res.status(200).json(Object.assign({}, cache.data, { stale: true }));
    }
    if (fallback) {
      res.setHeader("X-Sidebar-Cache", "fallback");
      return res.status(200).json(fallback);
    }
    return res.status(502).json({ error: "Could not sync sidebar from Trip.com" });
  }
};
