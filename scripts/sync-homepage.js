/* CLI — sync Trip.com homepage data to data/homepage-cache.json */
const fs = require("fs");
const path = require("path");
const { fetchHomepageFromTrip, contentHash } = require("../server/lib/trip-home");

async function main() {
  console.log("Syncing homepage from Trip.com...");
  var data = await fetchHomepageFromTrip();
  var out = path.join(__dirname, "../data/homepage-cache.json");
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log("Saved", out);
  console.log("Hash:", contentHash(data));
  console.log("Claims:", data.claims.length, "| Promos:", data.promos.length);
  console.log("Inspired chips:", data.inspired.chips.length, "| Flights:", data.inspired.flights.length);
  console.log("Attractions:", data.attractions.items.length, "| Hotels:", data.hotels.items.length);
  console.log("Inspiration:", data.inspiration.items.length);
  if (data.nav) {
    console.log("Sidebar items:", data.nav.sidebar.length, "| Search tabs:", data.nav.searchTabs.length);
    console.log("Flyouts:", Object.keys(data.nav.flyouts || {}).join(", "));
    console.log("Footer cols:", (data.nav.footer && data.nav.footer.cols || []).length);
    console.log("SEO tabs:", (data.nav.footer && data.nav.footer.seo && data.nav.footer.seo.tabs || []).length);
  }
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
