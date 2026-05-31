/* CLI: sync Trip.com sidebar Cars nav and write data/sidebar-cache.json */
const fs = require("fs");
const path = require("path");
const { fetchSidebarFromTrip, contentHash } = require("../api/lib/trip-sidebar");

fetchSidebarFromTrip()
  .then(function (data) {
    var out = path.join(__dirname, "..", "data", "sidebar-cache.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2));
    console.log("Synced sidebar:", data.cars.title, "—", data.cars.items.length, "items");
    console.log("Hash:", contentHash(data));
    data.cars.items.forEach(function (i) { console.log(" •", i.label, "→", i.tab); });
  })
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  });
