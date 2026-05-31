/* TripGo destination autocomplete — synced from Trip.com htls APIs */
(function () {
  var TYPE_ICON = {
    CT: "🏙", A: "✈", LM: "📍", D: "🗺", H: "🏨", T: "🚄", MT: "🚇", N: "🏘", Z: "📌", P: "🏠",
  };

  var active = null;
  var debounce = null;
  var seq = 0;

  function icon(type) { return TYPE_ICON[type] || "📍"; }

  function anchor(input) {
    return input.closest(".cell") || input.closest(".globalsearch") || input.parentElement;
  }

  function closeDropdown() {
    if (!active) return;
    if (active.dropdown && active.dropdown.parentNode) active.dropdown.parentNode.removeChild(active.dropdown);
    active = null;
  }

  function itemHTML(it, idx) {
    return '<button type="button" class="dest-item" data-idx="' + idx + '" role="option">' +
      '<span class="dest-item__icon">' + icon(it.type) + '</span>' +
      '<span class="dest-item__body">' +
        '<span class="dest-item__label">' + esc(it.label) + '</span>' +
        (it.subtitle ? '<span class="dest-item__sub">' + esc(it.subtitle) + '</span>' : '') +
      '</span>' +
      '<span class="dest-item__type">' + esc(it.typeLabel || it.type || "") + '</span>' +
    '</button>';
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function renderDropdown(input, data, mode) {
    var host = anchor(input);
    if (!host) return;
    host.classList.add("dest-host");

    var dd = host.querySelector(".dest-dropdown");
    if (!dd) {
      dd = document.createElement("div");
      dd.className = "dest-dropdown";
      dd.setAttribute("role", "listbox");
      host.appendChild(dd);
    }

    var html = "";
    var flat = [];
    if (mode === "hot" && data.groups && data.groups.length) {
      html += '<div class="dest-dropdown__title">' + esc(data.title || "Places you may like") + '</div>';
      data.groups.forEach(function (g) {
        if (!g.items || !g.items.length) return;
        html += '<div class="dest-dropdown__group">' + esc(g.name) + '</div>';
        g.items.forEach(function (it) {
          html += itemHTML(it, flat.length);
          flat.push(it);
        });
      });
      active = { input: input, dropdown: dd, items: flat, mode: "hot" };
    } else {
      var items = data.items || [];
      if (!items.length) {
        html = '<div class="dest-dropdown__empty">No matches — try a city, airport, or landmark</div>';
        active = { input: input, dropdown: dd, items: [], mode: "search" };
      } else {
        items.forEach(function (it, i) { html += itemHTML(it, i); });
        active = { input: input, dropdown: dd, items: items, mode: "search" };
      }
    }

    dd.innerHTML = html;
    dd.classList.add("is-open");
    highlight(-1);
  }

  function highlight(idx) {
    if (!active || !active.dropdown) return;
    active.idx = idx;
    active.dropdown.querySelectorAll(".dest-item").forEach(function (el) {
      el.classList.toggle("is-active", Number(el.dataset.idx) === idx);
    });
    var cur = active.dropdown.querySelector('.dest-item[data-idx="' + idx + '"]');
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }

  function selectItem(item) {
    if (!active || !item) return;
    var input = active.input;
    input.value = item.value || item.label || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    closeDropdown();

    if (input.closest(".globalsearch")) {
      var q = input.value.trim();
      if (q) location.href = "results.html?q=" + encodeURIComponent(q);
    }
  }

  function fetchHot(input) {
    var mySeq = ++seq;
    fetch("/api/destinations?hot=1", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (mySeq !== seq || document.activeElement !== input) return;
        if (data) renderDropdown(input, data, "hot");
      })
      .catch(function () {});
  }

  function fetchSearch(input, q) {
    var mySeq = ++seq;
    fetch("/api/destinations?q=" + encodeURIComponent(q), { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (mySeq !== seq || document.activeElement !== input) return;
        renderDropdown(input, data || { items: [] }, "search");
      })
      .catch(function () {});
  }

  function bindInput(input) {
    if (input.dataset.destBound) return;
    input.dataset.destBound = "1";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    input.addEventListener("focus", function () {
      if (!input.value.trim()) fetchHot(input);
      else input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      var q = input.value.trim();
      if (!q) {
        fetchHot(input);
        return;
      }
      debounce = setTimeout(function () { fetchSearch(input, q); }, 220);
    });

    input.addEventListener("keydown", function (e) {
      if (!active || active.input !== input) {
        if (e.key === "ArrowDown" && !input.value.trim()) {
          e.preventDefault();
          fetchHot(input);
        }
        return;
      }
      var items = active.items || [];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = active.idx == null || active.idx >= items.length - 1 ? 0 : active.idx + 1;
        highlight(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var prev = active.idx == null || active.idx <= 0 ? items.length - 1 : active.idx - 1;
        highlight(prev);
      } else if (e.key === "Enter") {
        if (active.idx != null && active.idx >= 0 && items[active.idx]) {
          e.preventDefault();
          e.stopPropagation();
          selectItem(items[active.idx]);
        } else {
          closeDropdown();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      }
    });

    input.addEventListener("blur", function () {
      setTimeout(function () {
        if (active && active.input === input) closeDropdown();
      }, 160);
    });
  }

  document.addEventListener("mousedown", function (e) {
    var item = e.target.closest(".dest-item");
    if (item && active) {
      e.preventDefault();
      var idx = Number(item.dataset.idx);
      if (active.items[idx]) selectItem(active.items[idx]);
      return;
    }
    if (!e.target.closest(".dest-host") && !e.target.closest(".globalsearch")) closeDropdown();
  });

  window.TGinitDestSearch = function (root) {
    (root || document).querySelectorAll(".js-text, .js-from, .js-to, .globalsearch input").forEach(bindInput);
  };

  document.addEventListener("DOMContentLoaded", function () {
    window.TGinitDestSearch();
  });
})();
