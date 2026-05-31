/* CLI: sync Trip.com inspired data and write data/inspired-cache.json */
const fs = require("fs");
const path = require("path");
const { fetchInspiredFromTrip, contentHash } = require("../server/lib/trip-inspired");

async function main() {
  console.log("Syncing from Trip.com…");
  var data = await fetchInspiredFromTrip();
  var hash = contentHash(data);
  data.hash = hash;
  var out = path.join(__dirname, "..", "data", "inspired-cache.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log("Saved", out);
  console.log("Hash:", hash);
  console.log("Chips:", data.chips.length, "· Flights:", data.flights.length);
  console.log("Chips:", data.chips.join(", "));
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
