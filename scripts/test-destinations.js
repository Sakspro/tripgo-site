/* Quick test for trip-destinations lib */
const { searchDestinations, fetchHotDestinations } = require("../server/lib/trip-destinations");

(async function () {
  var hot = await fetchHotDestinations();
  console.log("hot groups:", hot.groups.length, "items:", hot.items.length, hot.items.slice(0, 3).map(function (i) { return i.label; }));

  var paris = await searchDestinations("Paris");
  console.log("Paris:", paris.items.length, paris.items.slice(0, 3).map(function (i) { return i.label + " (" + i.typeLabel + ")"; }));

  var lax = await searchDestinations("LAX");
  console.log("LAX:", lax.items.slice(0, 2).map(function (i) { return i.value; }));
})().catch(function (e) { console.error(e); process.exit(1); });
