/* Client loader — fetches /api/sidebar and updates Cars navigation */
(function () {
  var DEFAULT = {
    cars: {
      title: "Cars",
      icon: "🚗",
      tab: "cars",
      href: "cars.html",
      items: [
        { label: "Car Rentals", tab: "cars", icon: "🚗", href: "cars.html", path: "/carhire/?channelid=14409" },
        { label: "Airport Transfers", tab: "transfers", icon: "🚐", href: "cars.html?sub=transfers", path: "/airport-transfers/" },
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
