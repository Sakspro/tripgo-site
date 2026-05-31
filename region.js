/* ===========================================================
   TripGo region modal — Trip.com-style Languages / Currency
   picker with tabbed UI, per-tab search, flags and live apply.
   Shared by the home page and the app download page.
   Depends on i18n.js (TGcurrentLangCode / TGsetLanguageCode).
   =========================================================== */
(function () {
  var LANGS = [
    { label: "English", code: "en", flag: "globe" },
    { label: "简体中文", code: "zh-CN", flag: "cn" },
    { label: "繁體中文", code: "zh-TW", flag: "hk" },
    { label: "日本語", code: "ja", flag: "jp" },
    { label: "한국어", code: "ko", flag: "kr" },
    { label: "ภาษาไทย", code: "th", flag: "th" },
    { label: "Українська", code: "uk", flag: "ua" },
    { label: "العربية", code: "ar", flag: "globe" },
    { label: "Bahasa Indonesia", code: "id", flag: "id" },
    { label: "Bahasa Melayu", code: "ms", flag: "my" },
    { label: "Dansk", code: "da", flag: "dk" },
    { label: "Deutsch", code: "de", flag: "de" },
    { label: "Español", code: "es", flag: "es" },
    { label: "Français", code: "fr", flag: "fr" },
    { label: "Italiano", code: "it", flag: "it" },
    { label: "Nederlands", code: "nl", flag: "nl" },
    { label: "Polski", code: "pl", flag: "pl" },
    { label: "Português (Brasil)", code: "pt", flag: "br" },
    { label: "Suomi", code: "fi", flag: "fi" },
    { label: "Svenska", code: "sv", flag: "se" },
    { label: "Tiếng Việt", code: "vi", flag: "vn" },
    { label: "Türkçe", code: "tr", flag: "tr" },
    { label: "Ελληνικά", code: "el", flag: "gr" },
    { label: "Русский", code: "ru", flag: "ru" }
  ];

  var CURRS = [
    { code: "USD", name: "US Dollar", flag: "us" },
    { code: "EUR", name: "Euro", flag: "eu" },
    { code: "GBP", name: "British Pound", flag: "gb" },
    { code: "JPY", name: "Japanese Yen", flag: "jp" },
    { code: "CNY", name: "Chinese Yuan", flag: "cn" },
    { code: "HKD", name: "Hong Kong Dollar", flag: "hk" },
    { code: "KRW", name: "South Korean Won", flag: "kr" },
    { code: "SGD", name: "Singapore Dollar", flag: "sg" },
    { code: "AUD", name: "Australian Dollar", flag: "au" },
    { code: "THB", name: "Thai Baht", flag: "th" },
    { code: "CAD", name: "Canadian Dollar", flag: "ca" },
    { code: "CHF", name: "Swiss Franc", flag: "ch" },
    { code: "INR", name: "Indian Rupee", flag: "in" },
    { code: "IDR", name: "Indonesian Rupiah", flag: "id" },
    { code: "MYR", name: "Malaysian Ringgit", flag: "my" },
    { code: "PHP", name: "Philippine Peso", flag: "ph" },
    { code: "TWD", name: "New Taiwan Dollar", flag: "tw" },
    { code: "VND", name: "Vietnamese Dong", flag: "vn" },
    { code: "AED", name: "UAE Dirham", flag: "ae" },
    { code: "RUB", name: "Russian Ruble", flag: "ru" },
    { code: "BRL", name: "Brazilian Real", flag: "br" },
    { code: "TRY", name: "Turkish Lira", flag: "tr" },
    { code: "NZD", name: "New Zealand Dollar", flag: "nz" },
    { code: "ZAR", name: "South African Rand", flag: "za" }
  ];

  function flagHtml(f) {
    if (f === "globe") return '<span class="regm__globe">🌐</span>';
    return '<img class="regm__flag" loading="lazy" alt="" src="https://flagcdn.com/w40/' + f + '.png">';
  }
  function esc(s) { return String(s).replace(/"/g, "&quot;"); }

  function currentCurrency() {
    try {
      return localStorage.getItem("tg_curr") ||
        new URLSearchParams(location.search).get("curr") || "USD";
    } catch (e) { return "USD"; }
  }
  function currentLangCode() {
    return window.TGcurrentLangCode ? window.TGcurrentLangCode() : "en";
  }

  var overlay, searchEl, gridEl, titleEl, tab = "lang";

  function build() {
    overlay = document.createElement("div");
    overlay.className = "regm-overlay";
    overlay.id = "regionModal";
    overlay.innerHTML =
      '<div class="regm" role="dialog" aria-modal="true" aria-label="Region settings">' +
        '<div class="regm__head">' +
          '<button class="regm__tab is-active" data-tab="lang">Languages</button>' +
          '<button class="regm__tab" data-tab="curr">Currency</button>' +
          '<button class="regm__close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="regm__search"><span class="regm__searchic">🔍</span>' +
          '<input type="text" id="regmSearch" placeholder="Search languages" autocomplete="off"></div>' +
        '<div class="regm__body">' +
          '<div class="regm__secttl" id="regmTitle">All Languages</div>' +
          '<div class="regm__grid" id="regmGrid"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    searchEl = overlay.querySelector("#regmSearch");
    gridEl = overlay.querySelector("#regmGrid");
    titleEl = overlay.querySelector("#regmTitle");

    overlay.addEventListener("click", onClick);
    searchEl.addEventListener("input", render);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  function render() {
    var q = (searchEl.value || "").trim().toLowerCase();
    if (tab === "lang") {
      titleEl.textContent = "All Languages";
      var lc = currentLangCode();
      gridEl.innerHTML = LANGS
        .filter(function (l) { return !q || l.label.toLowerCase().indexOf(q) > -1; })
        .map(function (l) {
          var active = l.code === lc;
          return '<button class="regm__item' + (active ? " is-active" : "") +
            '" data-kind="lang" data-code="' + l.code + '" data-val="' + esc(l.label) + '">' +
            flagHtml(l.flag) + '<span class="notranslate" translate="no">' + l.label + '</span></button>';
        }).join("") || '<div class="regm__empty">No matches</div>';
    } else {
      titleEl.textContent = "All Currencies";
      var cc = currentCurrency();
      gridEl.innerHTML = CURRS
        .filter(function (c) {
          return !q || c.code.toLowerCase().indexOf(q) > -1 || c.name.toLowerCase().indexOf(q) > -1;
        })
        .map(function (c) {
          var active = c.code === cc;
          return '<button class="regm__item' + (active ? " is-active" : "") +
            '" data-kind="curr" data-val="' + c.code + '">' + flagHtml(c.flag) +
            '<span><span class="regm__cur notranslate" translate="no">' + c.code +
            '</span> <span class="regm__curname">' + c.name + '</span></span></button>';
        }).join("") || '<div class="regm__empty">No matches</div>';
    }
  }

  function setTab(t) {
    tab = t;
    overlay.querySelectorAll(".regm__tab").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.tab === t);
    });
    searchEl.value = "";
    searchEl.placeholder = t === "lang" ? "Search languages" : "Search currencies";
  }

  function open(which) {
    if (!overlay) build();
    setTab(which || "lang");
    render();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { searchEl.focus(); }, 60);
  }
  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function applyCurrency(code) {
    var appLabel = document.getElementById("currLabel");
    if (appLabel) appLabel.textContent = code;
    var homeTrig = document.querySelector(".dd-trigger[data-dd='ddLang']");
    if (homeTrig) homeTrig.innerHTML = '<span>🌐</span> ' + code + ' <span class="caret">▾</span>';
    try { localStorage.setItem("tg_curr", code); } catch (e) {}
    try {
      var p = new URLSearchParams(location.search);
      p.set("curr", code);
      history.replaceState(null, "", location.pathname + "?" + p.toString());
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("tg:currency", { detail: code }));
  }

  function onClick(e) {
    if (e.target === overlay) { close(); return; }
    if (e.target.closest(".regm__close")) { close(); return; }
    var tb = e.target.closest(".regm__tab");
    if (tb) { setTab(tb.dataset.tab); render(); searchEl.focus(); return; }
    var item = e.target.closest(".regm__item");
    if (!item) return;
    if (item.dataset.kind === "lang") {
      var changed = window.TGsetLanguageCode
        ? window.TGsetLanguageCode(item.dataset.code, item.dataset.val)
        : false;
      if (!changed) close();   // already this language → just close (page reloads otherwise)
    } else {
      applyCurrency(item.dataset.val);
      close();
    }
  }

  function init() {
    build();
    /* Intercept the existing topbar triggers (home + app) in the
       capture phase so the old popovers never open. */
    document.addEventListener("click", function (e) {
      var t = e.target.closest("#currTrigger, [data-dd='ddLang']");
      if (t) { e.preventDefault(); e.stopPropagation(); open("lang"); }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
