/* Probe Trip.com homepage content APIs */
const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36";

function parseCookies(h) {
  const jar = {};
  if (!h) return jar;
  for (const c of h) {
    const part = c.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return jar;
}

async function main() {
  const res = await fetch(TRIP_HOME, { headers: { "User-Agent": UA }, redirect: "follow" });
  const jar = parseCookies(res.headers.getSetCookie ? res.headers.getSetCookie() : []);
  const cookie = Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
  const vid = jar.UBT_VID || jar.GUID || "";
  const html = await res.text();

  const head = { locale: "en-XX", currency: "USD", site: "EN", group: "trip", source: "Online", vid };
  const hdrs = {
    "Content-Type": "application/json", "User-Agent": UA, Origin: "https://www.trip.com",
    Referer: TRIP_HOME, Cookie: cookie, Accept: "application/json",
  };
  async function post(url, body) {
    const r = await fetch(url, { method: "POST", headers: hdrs, body: JSON.stringify(body) });
    const t = await r.text();
    try { return JSON.parse(t); } catch (e) { return { _raw: t.slice(0, 300) }; }
  }

  // SSR promos
  const suspend = html.match(/__SUSPEND_DATA__\s*=\s*(\{[\s\S]*?\});/);
  if (suspend) {
    try {
      const sd = JSON.parse(suspend[1]);
      const ads = sd.advertizeData?.dealsData?.adsWidgetDataTypes?.[0]?.adsDisplayDataTypes;
      console.log("SSR promos:", ads?.length, ads?.slice(0, 2).map(a => a.title));
    } catch (e) { console.log("SSR parse err"); }
  }

  // City by IP
  const geo = await post("https://www.trip.com/restapi/soa2/14571/getCityByIp", { head });
  console.log("\ngetCityByIp:", JSON.stringify(geo).slice(0, 400));

  const cityId = geo?.cityList?.[0]?.cityId || geo?.cityId || 0;
  const districtId = geo?.cityList?.[0]?.districtId || geo?.districtId || 0;

  const geoBody = {
    head: { locale: "en-XX", currency: "USD", source: "Online", vid },
    anywhere: false,
    cityId, districtId,
    districtName: geo?.cityList?.[0]?.cityName || "",
    districtEnName: geo?.cityList?.[0]?.cityEnName || geo?.cityList?.[0]?.cityName || "",
  };

  // Coupons
  const coupons = await post("https://www.trip.com/restapi/soa2/18417/RecommendPropertyGeneral", {
    head: { source: "Online", locale: "en-XX", currency: "USD", group: "trip", vid },
    requestModule: "OnlineHomeBanner",
  });
  console.log("\nCoupons:", coupons?.propertyDTO?.length, coupons?.propertyDTO?.slice(0, 2));

  // Promos API
  const promos = await post("https://www.trip.com/restapi/soa2/19816/bjjson/queryAdsDisplayData", {
    head: { group: "trip", locale: "en-XX", currency: "USD", source: "ONLINE", clientID: vid },
    moduleNames: ["ONLINE_INDEX_TOP_DEAL"],
  });
  const promoItems = promos?.adsWidgetDataTypes?.[0]?.adsDisplayDataTypes;
  console.log("\nPromos API:", promoItems?.length, promoItems?.slice(0, 2)?.map(p => p.title));

  // Attractions
  const att = await post("https://www.trip.com/restapi/soa2/18814/json/getRecommendedAttraction", geoBody);
  console.log("\nAttractions:", att?.title, att?.productsList?.length, att?.productsList?.[0]);

  // Hotels
  const hot = await post("https://www.trip.com/restapi/soa2/18814/getRecommendHotel", geoBody);
  console.log("\nHotels:", hot?.title, hot?.productsList?.length, hot?.productsList?.[0]);

  // Moments
  const mom = await post("https://www.trip.com/restapi/soa2/18814/getRecommendMoments", geoBody);
  console.log("\nMoments:", mom?.title, mom?.productsList?.length, mom?.productsList?.[0]);

  // USP
  const usp = await post("https://www.trip.com/restapi/soa2/13909/getUspInfo", { head: { locale: "en-XX", currency: "USD", group: "trip" } });
  console.log("\nUSP:", JSON.stringify(usp).slice(0, 400));
}

main().catch(console.error);
