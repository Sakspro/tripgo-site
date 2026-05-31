/* Client loader — fetches /api/homepage and applies Trip.com content */
(function () {
  window.TGhomepage = null;
  window.TGhomepageReady = fetch("/api/homepage", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data) {
        window.TGhomepage = data;
        document.dispatchEvent(new CustomEvent("tg-homepage", { detail: data }));
      }
      return window.TGhomepage;
    })
    .catch(function () { return null; });
})();
