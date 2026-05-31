/* GET /api/destinations?q=Paris  |  GET /api/destinations?hot=1 */
const { searchDestinations, fetchHotDestinations } = require("./lib/trip-destinations");

let hotCache = { data: null, fetchedAt: 0 };
const HOT_TTL_MS = 6 * 60 * 60 * 1000;

let searchCache = {};
const SEARCH_TTL_MS = 10 * 60 * 1000;
const SEARCH_MAX = 200;

let hotFallback = null;
try {
  hotFallback = require("../data/dest-hot-cache.json");
} catch (e) {
  hotFallback = null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  var q = (req.query && req.query.q) ? String(req.query.q).trim() : "";
  var hot = req.query && (req.query.hot === "1" || req.query.hot === "true");

  if (hot || !q) {
    var now = Date.now();
    if (hotCache.data && now - hotCache.fetchedAt < HOT_TTL_MS) {
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
      res.setHeader("X-Dest-Cache", "hot-hit");
      return res.status(200).json(hotCache.data);
    }
    try {
      var hotData = await fetchHotDestinations();
      hotCache = { data: hotData, fetchedAt: now };
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
      res.setHeader("X-Dest-Cache", "hot-miss");
      return res.status(200).json(hotData);
    } catch (err) {
      if (hotCache.data) {
        res.setHeader("X-Dest-Cache", "hot-stale");
        return res.status(200).json(hotCache.data);
      }
      if (hotFallback) {
        res.setHeader("X-Dest-Cache", "hot-fallback");
        return res.status(200).json(hotFallback);
      }
      return res.status(502).json({ error: "Could not load hot destinations" });
    }
  }

  if (q.length < 1) {
    return res.status(200).json({ items: [], source: "trip.com" });
  }

  var key = q.toLowerCase();
  var cached = searchCache[key];
  if (cached && Date.now() - cached.at < SEARCH_TTL_MS) {
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.setHeader("X-Dest-Cache", "search-hit");
    return res.status(200).json(cached.data);
  }

  try {
    var data = await searchDestinations(q);
    searchCache[key] = { data: data, at: Date.now() };
    var keys = Object.keys(searchCache);
    if (keys.length > SEARCH_MAX) {
      keys.sort(function (a, b) { return searchCache[a].at - searchCache[b].at; });
      keys.slice(0, keys.length - SEARCH_MAX).forEach(function (k) { delete searchCache[k]; });
    }
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.setHeader("X-Dest-Cache", "search-miss");
    return res.status(200).json(data);
  } catch (err) {
    if (cached) {
      res.setHeader("X-Dest-Cache", "search-stale");
      return res.status(200).json(cached.data);
    }
    return res.status(502).json({ error: "Destination search failed", items: [] });
  }
};
