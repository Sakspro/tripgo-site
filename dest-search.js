/* TripGo destination autocomplete — synced from Trip.com htls APIs */
(function () {
  var TYPE_ICON = {
    CT: "🏙", A: "✈", LM: "📍", D: "🗺", H: "🏨", T: "🚄", MT: "🚇", N: "🏘", Z: "📌", P: "🏠",
  };

  var HOT_FALLBACK = {
    title: "Places you may like",
    groups: [{
      name: "Popular Destinations",
      items: [
        { type: "CT", typeLabel: "City", label: "Paris", subtitle: "France", value: "Paris, France" },
        { type: "CT", typeLabel: "City", label: "London", subtitle: "United Kingdom", value: "London, United Kingdom" },
        { type: "CT", typeLabel: "City", label: "Tokyo", subtitle: "Japan", value: "Tokyo, Japan" },
        { type: "CT", typeLabel: "City", label: "Bangkok", subtitle: "Thailand", value: "Bangkok, Thailand" },
        { type: "CT", typeLabel: "City", label: "Singapore", subtitle: "Singapore", value: "Singapore, Singapore" },
        { type: "CT", typeLabel: "City", label: "New York", subtitle: "United States", value: "New York, United States" },
        { type: "CT", typeLabel: "City", label: "Los Angeles", subtitle: "United States", value: "Los Angeles, United States" },
        { type: "CT", typeLabel: "City", label: "Shanghai", subtitle: "China", value: "Shanghai, China" },
      ],
    }],
  };

  var active = null;
  var hotCache = null;
  var hotLive = false;
  var searchCache = Object.create(null);
  var prefetchHotPromise = null;

  function icon(type) { return TYPE_ICON[type] || "📍"; }

  function anchor(input) {
    return input.closest(".cell") || input.closest(".globalsearch") || input.parentElement;
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function closeDropdown() {
    if (!active) return;
    if (active.abort) { try { active.abort.abort(); } catch (e) {} }
    if (active.dropdown && active.dropdown.parentNode) active.dropdown.parentNode.removeChild(active.dropdown);
    if (active.input) active.input.setAttribute("aria-expanded", "false");
    active = null;
  }

  function getDropdown(input) {
    var host = anchor(input);
    if (!host) return null;
    host.classList.add("dest-host");
    var dd = host.querySelector(".dest-dropdown");
    if (!dd) {
      dd = document.createElement("div");
      dd.className = "dest-dropdown";
      dd.setAttribute("role", "listbox");
      host.appendChild(dd);
    }
    return dd;
  }

  function showLoading(input) {
    var dd = getDropdown(input);
    if (!dd) return;
    dd.innerHTML = '<div class="dest-dropdown__loading"><span class="dest-spinner"></span> Searching…</div>';
    dd.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    active = { input: input, dropdown: dd, items: [], mode: "loading", idx: -1 };
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

  function renderDropdown(input, data, mode) {
    var dd = getDropdown(input);
    if (!dd) return;

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
    } else {
      var items = data.items || [];
      if (!items.length) {
        html = '<div class="dest-dropdown__empty">No matches — try a city, airport, or landmark</div>';
      } else {
        items.forEach(function (it, i) {
          html += itemHTML(it, i);
          flat.push(it);
        });
      }
    }

    dd.innerHTML = html;
    dd.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    active = { input: input, dropdown: dd, items: flat, mode: mode, idx: -1 };
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
    input.dataset.destSelecting = "1";
    input.value = item.value || item.label || "";
    closeDropdown();
    delete input.dataset.destSelecting;

    if (input.closest(".globalsearch")) {
      var q = input.value.trim();
      if (q) location.href = "results.html?q=" + encodeURIComponent(q);
    }
  }

  function cacheKey(q) { return q.toLowerCase(); }

  function filterItems(items, q) {
    if (!q) return items;
    var needle = q.toLowerCase();
    return items.filter(function (it) {
      var hay = ((it.label || "") + " " + (it.subtitle || "") + " " + (it.value || "")).toLowerCase();
      return hay.indexOf(needle) !== -1;
    });
  }

  function prefetchHot() {
    if (prefetchHotPromise) return prefetchHotPromise;
    prefetchHotPromise = fetch("/api/destinations?hot=1", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.groups && data.groups.length) {
          hotCache = data;
          hotLive = true;
        }
        return hotCache;
      })
      .catch(function () { return hotCache; });
    return prefetchHotPromise;
  }

  function fetchHot(input, state) {
    renderDropdown(input, hotCache || HOT_FALLBACK, "hot");
    if (hotLive) return;

    var mySeq = ++state.gen;
    if (state.abort) { try { state.abort.abort(); } catch (e) {} }
    state.abort = new AbortController();
    fetch("/api/destinations?hot=1", { credentials: "same-origin", signal: state.abort.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (mySeq !== state.gen) return;
        if (document.activeElement !== input) return;
        if (data && data.groups && data.groups.length) {
          hotCache = data;
          hotLive = true;
          if (active && active.input === input && active.mode === "hot") renderDropdown(input, data, "hot");
        }
      })
      .catch(function () {});
  }

  function fetchSearch(input, q, state) {
    var mySeq = ++state.gen;
    var key = cacheKey(q);
    if (searchCache[key]) {
      renderDropdown(input, searchCache[key], "search");
      return;
    }

    var prefixHit = null;
    for (var len = q.length - 1; len >= 1; len--) {
      var sub = cacheKey(q.slice(0, len));
      if (searchCache[sub] && searchCache[sub].items && searchCache[sub].items.length) {
        prefixHit = searchCache[sub];
        break;
      }
    }
    if (prefixHit) {
      var filtered = filterItems(prefixHit.items, q);
      if (filtered.length) renderDropdown(input, { items: filtered }, "search");
      else showLoading(input);
    } else {
      showLoading(input);
    }

    if (state.abort) { try { state.abort.abort(); } catch (e) {} }
    state.abort = new AbortController();
    fetch("/api/destinations?q=" + encodeURIComponent(q), { credentials: "same-origin", signal: state.abort.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (mySeq !== state.gen) return;
        if (document.activeElement !== input) return;
        var payload = data || { items: [] };
        searchCache[key] = payload;
        renderDropdown(input, payload, "search");
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        if (mySeq !== state.gen) return;
        if (document.activeElement !== input) return;
        if (!prefixHit) renderDropdown(input, { items: [] }, "search");
      });
  }

  function bindInput(input) {
    if (input.dataset.destBound) return;
    input.dataset.destBound = "1";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    var state = { gen: 0, seq: 0, debounce: null, abort: null };

    input.addEventListener("focus", function () {
      var q = input.value.trim();
      if (!q) {
        fetchHot(input, state);
        return;
      }
      if (searchCache[cacheKey(q)]) {
        fetchSearch(input, q, state);
        return;
      }
      input.select();
    });

    input.addEventListener("input", function () {
      if (input.dataset.destSelecting) return;
      clearTimeout(state.debounce);
      if (state.abort) { try { state.abort.abort(); } catch (e) {} }

      var q = input.value.trim();
      if (!q) {
        fetchHot(input, state);
        return;
      }
      state.debounce = setTimeout(function () {
        fetchSearch(input, q, state);
      }, 120);
    });

    input.addEventListener("keydown", function (e) {
      if (!active || active.input !== input) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (!input.value.trim()) fetchHot(input, state);
          else fetchSearch(input, input.value.trim(), state);
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
      }, 220);
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
    hotCache = HOT_FALLBACK;
    prefetchHot();
    window.TGinitDestSearch();
  });
})();
