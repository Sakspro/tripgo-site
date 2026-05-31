/* TripGo shared utilities — global search, saved items, coupons */
(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("is-show"); }, 2800);
  }
  window.TGtoast = toast;

  document.querySelectorAll(".globalsearch input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var q = inp.value.trim();
      if (!q) return;
      location.href = "results.html?q=" + encodeURIComponent(q);
    });
  });

  window.TGsaveItem = function (item) {
    try {
      var saved = JSON.parse(localStorage.getItem("tg_saved") || "[]");
      if (!saved.some(function (s) { return s.id === item.id; })) saved.unshift(item);
      localStorage.setItem("tg_saved", JSON.stringify(saved.slice(0, 40)));
      return true;
    } catch (e) { return false; }
  };

  window.TGgetSaved = function () {
    try { return JSON.parse(localStorage.getItem("tg_saved") || "[]"); } catch (e) { return []; }
  };

  window.TGclaimCoupon = function (id, code) {
    try {
      var list = JSON.parse(localStorage.getItem("tg_coupons") || "[]");
      if (!list.some(function (c) { return c.id === id; })) {
        list.push({ id: id, code: code || id.toUpperCase(), at: Date.now() });
        localStorage.setItem("tg_coupons", JSON.stringify(list));
      }
      return true;
    } catch (e) { return false; }
  };

  window.TGgetClaimed = function () {
    try { return JSON.parse(localStorage.getItem("tg_coupons") || "[]").map(function (c) { return c.id; }); } catch (e) { return []; }
  };

  document.addEventListener("click", function (e) {
    var save = e.target.closest(".card__save");
    if (save) {
      e.preventDefault(); e.stopPropagation();
      var cardEl = save.closest(".card") || save.closest("a.card");
      if (!cardEl) return;
      var title = (cardEl.querySelector(".card__title") || {}).textContent || "";
      var meta = (cardEl.querySelector(".card__meta") || {}).textContent || "";
      var price = (cardEl.querySelector(".card__price") || {}).textContent || "";
      var img = (cardEl.querySelector("img") || {}).src || "";
      var href = cardEl.href || cardEl.getAttribute("href") || "";
      window.TGsaveItem({ id: title, title: title, meta: meta, price: price, img: img, href: href });
      save.textContent = "♥";
      toast("Saved to your list — view in Saved");
    }
  });
})();
