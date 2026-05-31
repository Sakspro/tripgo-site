/* Client loader — fetches /api/inspired and drives Get inspired UI */
(function () {
  var DEFAULT = {
    title: "Get inspired for your next trip",
    subtitle: "Explore one-way flights from your area",
    chips: ["Anywhere", "Tokyo", "Seoul", "Bangkok", "Singapore", "Istanbul", "Dubai", "Hanoi", "Doha", "Bali"],
    flights: [],
  };

  window.TGinspired = DEFAULT;
  window.TGinspiredReady = fetch("/api/inspired", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.chips && data.flights) {
        window.TGinspired = data;
        document.dispatchEvent(new CustomEvent("tg-inspired", { detail: data }));
      }
      return window.TGinspired;
    })
    .catch(function () { return window.TGinspired; });

  window.TGapplyInspired = function (opts) {
    opts = opts || {};
    var data = window.TGinspired || DEFAULT;
    if (opts.onChips && data.chips) opts.onChips(data.chips, data);
    if (opts.onFlights && data.flights) opts.onFlights(data.flights, data);
    if (opts.onMeta && data.title) opts.onMeta(data);
    return data;
  };
})();
