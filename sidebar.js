/* Client loader — fetches /api/sidebar and updates Cars navigation */
(function () {
  var DEFAULT = {
    cars: {
      title: "Cars",
      icon: "🚗",
      tab: "cars",
      items: [
        { label: "Car Rentals", tab: "cars", icon: "🚗", path: "/carhire/?channelid=14409" },
        { label: "Airport Transfers", tab: "transfers", icon: "🚐", path: "/airport-transfers/" },
      ],
    },
  };

  window.TGsidebar = DEFAULT;
  window.TGsidebarReady = fetch("/api/sidebar", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.cars) {
        window.TGsidebar = data;
        document.dispatchEvent(new CustomEvent("tg-sidebar", { detail: data }));
      }
      return window.TGsidebar;
    })
    .catch(function () { return window.TGsidebar; });
})();
