/* ===========================================================
   TripGo region modal — Trip.com-style Languages / Currency
   picker with tabbed UI, per-tab search, flags and live apply.
   Shared by the home page and the app download page.
   Depends on i18n.js (TGcurrentLangCode / TGsetLanguageCode).
   =========================================================== */
(function () {
  /* All languages supported by the translation engine. "globe"
     flag is used for languages without a single representative country. */
  var LANGS = [
    { label: "English", code: "en", flag: "globe" },
    { label: "简体中文 (Chinese Simplified)", code: "zh-CN", flag: "cn" },
    { label: "繁體中文 (Chinese Traditional)", code: "zh-TW", flag: "hk" },
    { label: "Español", code: "es", flag: "es" },
    { label: "Français", code: "fr", flag: "fr" },
    { label: "Deutsch", code: "de", flag: "de" },
    { label: "日本語", code: "ja", flag: "jp" },
    { label: "한국어", code: "ko", flag: "kr" },
    { label: "Português", code: "pt", flag: "pt" },
    { label: "Русский", code: "ru", flag: "ru" },
    { label: "العربية", code: "ar", flag: "globe" },
    { label: "हिन्दी", code: "hi", flag: "in" },
    { label: "Italiano", code: "it", flag: "it" },
    { label: "Afrikaans", code: "af", flag: "za" },
    { label: "Shqip (Albanian)", code: "sq", flag: "al" },
    { label: "አማርኛ (Amharic)", code: "am", flag: "et" },
    { label: "Հայերեն (Armenian)", code: "hy", flag: "am" },
    { label: "Azərbaycan", code: "az", flag: "az" },
    { label: "Euskara (Basque)", code: "eu", flag: "es" },
    { label: "Беларуская", code: "be", flag: "by" },
    { label: "বাংলা (Bengali)", code: "bn", flag: "bd" },
    { label: "Bosanski", code: "bs", flag: "ba" },
    { label: "Български", code: "bg", flag: "bg" },
    { label: "Català", code: "ca", flag: "es" },
    { label: "Cebuano", code: "ceb", flag: "ph" },
    { label: "Corsu (Corsican)", code: "co", flag: "fr" },
    { label: "Hrvatski", code: "hr", flag: "hr" },
    { label: "Čeština", code: "cs", flag: "cz" },
    { label: "Dansk", code: "da", flag: "dk" },
    { label: "Nederlands", code: "nl", flag: "nl" },
    { label: "Esperanto", code: "eo", flag: "globe" },
    { label: "Eesti", code: "et", flag: "ee" },
    { label: "Suomi", code: "fi", flag: "fi" },
    { label: "Frysk (Frisian)", code: "fy", flag: "nl" },
    { label: "Galego", code: "gl", flag: "es" },
    { label: "ქართული (Georgian)", code: "ka", flag: "ge" },
    { label: "Ελληνικά", code: "el", flag: "gr" },
    { label: "ગુજરાતી (Gujarati)", code: "gu", flag: "in" },
    { label: "Kreyòl Ayisyen", code: "ht", flag: "ht" },
    { label: "Hausa", code: "ha", flag: "ng" },
    { label: "ʻŌlelo Hawaiʻi", code: "haw", flag: "us" },
    { label: "עברית (Hebrew)", code: "iw", flag: "il" },
    { label: "Hmoob (Hmong)", code: "hmn", flag: "globe" },
    { label: "Magyar", code: "hu", flag: "hu" },
    { label: "Íslenska", code: "is", flag: "is" },
    { label: "Igbo", code: "ig", flag: "ng" },
    { label: "Bahasa Indonesia", code: "id", flag: "id" },
    { label: "Gaeilge (Irish)", code: "ga", flag: "ie" },
    { label: "Basa Jawa (Javanese)", code: "jw", flag: "id" },
    { label: "ಕನ್ನಡ (Kannada)", code: "kn", flag: "in" },
    { label: "Қазақ", code: "kk", flag: "kz" },
    { label: "ខ្មែរ (Khmer)", code: "km", flag: "kh" },
    { label: "Kinyarwanda", code: "rw", flag: "rw" },
    { label: "Kurdî (Kurdish)", code: "ku", flag: "iq" },
    { label: "Кыргызча", code: "ky", flag: "kg" },
    { label: "ລາວ (Lao)", code: "lo", flag: "la" },
    { label: "Latina", code: "la", flag: "globe" },
    { label: "Latviešu", code: "lv", flag: "lv" },
    { label: "Lietuvių", code: "lt", flag: "lt" },
    { label: "Lëtzebuergesch", code: "lb", flag: "lu" },
    { label: "Македонски", code: "mk", flag: "mk" },
    { label: "Malagasy", code: "mg", flag: "mg" },
    { label: "Bahasa Melayu", code: "ms", flag: "my" },
    { label: "മലയാളം (Malayalam)", code: "ml", flag: "in" },
    { label: "Malti (Maltese)", code: "mt", flag: "mt" },
    { label: "Te Reo Māori", code: "mi", flag: "nz" },
    { label: "मराठी (Marathi)", code: "mr", flag: "in" },
    { label: "Монгол", code: "mn", flag: "mn" },
    { label: "မြန်မာ (Myanmar)", code: "my", flag: "mm" },
    { label: "नेपाली (Nepali)", code: "ne", flag: "np" },
    { label: "Norsk", code: "no", flag: "no" },
    { label: "Chichewa (Nyanja)", code: "ny", flag: "mw" },
    { label: "ଓଡ଼ିଆ (Odia)", code: "or", flag: "in" },
    { label: "پښتو (Pashto)", code: "ps", flag: "af" },
    { label: "فارسی (Persian)", code: "fa", flag: "ir" },
    { label: "Polski", code: "pl", flag: "pl" },
    { label: "ਪੰਜਾਬੀ (Punjabi)", code: "pa", flag: "in" },
    { label: "Română", code: "ro", flag: "ro" },
    { label: "Gagana Sāmoa", code: "sm", flag: "ws" },
    { label: "Gàidhlig (Scots Gaelic)", code: "gd", flag: "gb" },
    { label: "Српски (Serbian)", code: "sr", flag: "rs" },
    { label: "Sesotho", code: "st", flag: "ls" },
    { label: "chiShona", code: "sn", flag: "zw" },
    { label: "سنڌي (Sindhi)", code: "sd", flag: "pk" },
    { label: "සිංහල (Sinhala)", code: "si", flag: "lk" },
    { label: "Slovenčina", code: "sk", flag: "sk" },
    { label: "Slovenščina", code: "sl", flag: "si" },
    { label: "Soomaali", code: "so", flag: "so" },
    { label: "Basa Sunda (Sundanese)", code: "su", flag: "id" },
    { label: "Kiswahili", code: "sw", flag: "ke" },
    { label: "Svenska", code: "sv", flag: "se" },
    { label: "Tagalog (Filipino)", code: "tl", flag: "ph" },
    { label: "Тоҷикӣ (Tajik)", code: "tg", flag: "tj" },
    { label: "தமிழ் (Tamil)", code: "ta", flag: "in" },
    { label: "Татар (Tatar)", code: "tt", flag: "ru" },
    { label: "తెలుగు (Telugu)", code: "te", flag: "in" },
    { label: "ภาษาไทย", code: "th", flag: "th" },
    { label: "Türkçe", code: "tr", flag: "tr" },
    { label: "Türkmen", code: "tk", flag: "tm" },
    { label: "Українська", code: "uk", flag: "ua" },
    { label: "اردو (Urdu)", code: "ur", flag: "pk" },
    { label: "ئۇيغۇرچە (Uyghur)", code: "ug", flag: "cn" },
    { label: "Oʻzbek", code: "uz", flag: "uz" },
    { label: "Tiếng Việt", code: "vi", flag: "vn" },
    { label: "Cymraeg (Welsh)", code: "cy", flag: "gb" },
    { label: "isiXhosa", code: "xh", flag: "za" },
    { label: "ייִדיש (Yiddish)", code: "yi", flag: "globe" },
    { label: "Yorùbá", code: "yo", flag: "ng" },
    { label: "isiZulu", code: "zu", flag: "za" }
  ];

  /* All circulating world currencies (ISO 4217). Popular ones first. */
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
    { code: "CAD", name: "Canadian Dollar", flag: "ca" },
    { code: "CHF", name: "Swiss Franc", flag: "ch" },
    { code: "INR", name: "Indian Rupee", flag: "in" },
    { code: "THB", name: "Thai Baht", flag: "th" },
    { code: "AED", name: "UAE Dirham", flag: "ae" },
    { code: "AFN", name: "Afghan Afghani", flag: "af" },
    { code: "ALL", name: "Albanian Lek", flag: "al" },
    { code: "AMD", name: "Armenian Dram", flag: "am" },
    { code: "ANG", name: "Netherlands Antillean Guilder", flag: "cw" },
    { code: "AOA", name: "Angolan Kwanza", flag: "ao" },
    { code: "ARS", name: "Argentine Peso", flag: "ar" },
    { code: "AWG", name: "Aruban Florin", flag: "aw" },
    { code: "AZN", name: "Azerbaijani Manat", flag: "az" },
    { code: "BAM", name: "Bosnia-Herzegovina Mark", flag: "ba" },
    { code: "BBD", name: "Barbadian Dollar", flag: "bb" },
    { code: "BDT", name: "Bangladeshi Taka", flag: "bd" },
    { code: "BGN", name: "Bulgarian Lev", flag: "bg" },
    { code: "BHD", name: "Bahraini Dinar", flag: "bh" },
    { code: "BIF", name: "Burundian Franc", flag: "bi" },
    { code: "BMD", name: "Bermudan Dollar", flag: "bm" },
    { code: "BND", name: "Brunei Dollar", flag: "bn" },
    { code: "BOB", name: "Bolivian Boliviano", flag: "bo" },
    { code: "BRL", name: "Brazilian Real", flag: "br" },
    { code: "BSD", name: "Bahamian Dollar", flag: "bs" },
    { code: "BTN", name: "Bhutanese Ngultrum", flag: "bt" },
    { code: "BWP", name: "Botswanan Pula", flag: "bw" },
    { code: "BYN", name: "Belarusian Ruble", flag: "by" },
    { code: "BZD", name: "Belize Dollar", flag: "bz" },
    { code: "CDF", name: "Congolese Franc", flag: "cd" },
    { code: "CLP", name: "Chilean Peso", flag: "cl" },
    { code: "COP", name: "Colombian Peso", flag: "co" },
    { code: "CRC", name: "Costa Rican Colón", flag: "cr" },
    { code: "CUP", name: "Cuban Peso", flag: "cu" },
    { code: "CVE", name: "Cape Verdean Escudo", flag: "cv" },
    { code: "CZK", name: "Czech Koruna", flag: "cz" },
    { code: "DJF", name: "Djiboutian Franc", flag: "dj" },
    { code: "DKK", name: "Danish Krone", flag: "dk" },
    { code: "DOP", name: "Dominican Peso", flag: "do" },
    { code: "DZD", name: "Algerian Dinar", flag: "dz" },
    { code: "EGP", name: "Egyptian Pound", flag: "eg" },
    { code: "ERN", name: "Eritrean Nakfa", flag: "er" },
    { code: "ETB", name: "Ethiopian Birr", flag: "et" },
    { code: "FJD", name: "Fijian Dollar", flag: "fj" },
    { code: "FKP", name: "Falkland Islands Pound", flag: "fk" },
    { code: "GEL", name: "Georgian Lari", flag: "ge" },
    { code: "GHS", name: "Ghanaian Cedi", flag: "gh" },
    { code: "GIP", name: "Gibraltar Pound", flag: "gi" },
    { code: "GMD", name: "Gambian Dalasi", flag: "gm" },
    { code: "GNF", name: "Guinean Franc", flag: "gn" },
    { code: "GTQ", name: "Guatemalan Quetzal", flag: "gt" },
    { code: "GYD", name: "Guyanaese Dollar", flag: "gy" },
    { code: "HNL", name: "Honduran Lempira", flag: "hn" },
    { code: "HRK", name: "Croatian Kuna", flag: "hr" },
    { code: "HTG", name: "Haitian Gourde", flag: "ht" },
    { code: "HUF", name: "Hungarian Forint", flag: "hu" },
    { code: "IDR", name: "Indonesian Rupiah", flag: "id" },
    { code: "ILS", name: "Israeli New Shekel", flag: "il" },
    { code: "IQD", name: "Iraqi Dinar", flag: "iq" },
    { code: "IRR", name: "Iranian Rial", flag: "ir" },
    { code: "ISK", name: "Icelandic Króna", flag: "is" },
    { code: "JMD", name: "Jamaican Dollar", flag: "jm" },
    { code: "JOD", name: "Jordanian Dinar", flag: "jo" },
    { code: "KES", name: "Kenyan Shilling", flag: "ke" },
    { code: "KGS", name: "Kyrgystani Som", flag: "kg" },
    { code: "KHR", name: "Cambodian Riel", flag: "kh" },
    { code: "KMF", name: "Comorian Franc", flag: "km" },
    { code: "KPW", name: "North Korean Won", flag: "kp" },
    { code: "KWD", name: "Kuwaiti Dinar", flag: "kw" },
    { code: "KYD", name: "Cayman Islands Dollar", flag: "ky" },
    { code: "KZT", name: "Kazakhstani Tenge", flag: "kz" },
    { code: "LAK", name: "Laotian Kip", flag: "la" },
    { code: "LBP", name: "Lebanese Pound", flag: "lb" },
    { code: "LKR", name: "Sri Lankan Rupee", flag: "lk" },
    { code: "LRD", name: "Liberian Dollar", flag: "lr" },
    { code: "LSL", name: "Lesotho Loti", flag: "ls" },
    { code: "LYD", name: "Libyan Dinar", flag: "ly" },
    { code: "MAD", name: "Moroccan Dirham", flag: "ma" },
    { code: "MDL", name: "Moldovan Leu", flag: "md" },
    { code: "MGA", name: "Malagasy Ariary", flag: "mg" },
    { code: "MKD", name: "Macedonian Denar", flag: "mk" },
    { code: "MMK", name: "Myanmar Kyat", flag: "mm" },
    { code: "MNT", name: "Mongolian Tugrik", flag: "mn" },
    { code: "MOP", name: "Macanese Pataca", flag: "mo" },
    { code: "MRU", name: "Mauritanian Ouguiya", flag: "mr" },
    { code: "MUR", name: "Mauritian Rupee", flag: "mu" },
    { code: "MVR", name: "Maldivian Rufiyaa", flag: "mv" },
    { code: "MWK", name: "Malawian Kwacha", flag: "mw" },
    { code: "MXN", name: "Mexican Peso", flag: "mx" },
    { code: "MYR", name: "Malaysian Ringgit", flag: "my" },
    { code: "MZN", name: "Mozambican Metical", flag: "mz" },
    { code: "NAD", name: "Namibian Dollar", flag: "na" },
    { code: "NGN", name: "Nigerian Naira", flag: "ng" },
    { code: "NIO", name: "Nicaraguan Córdoba", flag: "ni" },
    { code: "NOK", name: "Norwegian Krone", flag: "no" },
    { code: "NPR", name: "Nepalese Rupee", flag: "np" },
    { code: "NZD", name: "New Zealand Dollar", flag: "nz" },
    { code: "OMR", name: "Omani Rial", flag: "om" },
    { code: "PAB", name: "Panamanian Balboa", flag: "pa" },
    { code: "PEN", name: "Peruvian Sol", flag: "pe" },
    { code: "PGK", name: "Papua New Guinean Kina", flag: "pg" },
    { code: "PHP", name: "Philippine Peso", flag: "ph" },
    { code: "PKR", name: "Pakistani Rupee", flag: "pk" },
    { code: "PLN", name: "Polish Złoty", flag: "pl" },
    { code: "PYG", name: "Paraguayan Guarani", flag: "py" },
    { code: "QAR", name: "Qatari Rial", flag: "qa" },
    { code: "RON", name: "Romanian Leu", flag: "ro" },
    { code: "RSD", name: "Serbian Dinar", flag: "rs" },
    { code: "RUB", name: "Russian Ruble", flag: "ru" },
    { code: "RWF", name: "Rwandan Franc", flag: "rw" },
    { code: "SAR", name: "Saudi Riyal", flag: "sa" },
    { code: "SBD", name: "Solomon Islands Dollar", flag: "sb" },
    { code: "SCR", name: "Seychellois Rupee", flag: "sc" },
    { code: "SDG", name: "Sudanese Pound", flag: "sd" },
    { code: "SEK", name: "Swedish Krona", flag: "se" },
    { code: "SHP", name: "Saint Helena Pound", flag: "sh" },
    { code: "SLE", name: "Sierra Leonean Leone", flag: "sl" },
    { code: "SOS", name: "Somali Shilling", flag: "so" },
    { code: "SRD", name: "Surinamese Dollar", flag: "sr" },
    { code: "SSP", name: "South Sudanese Pound", flag: "ss" },
    { code: "STN", name: "São Tomé & Príncipe Dobra", flag: "st" },
    { code: "SYP", name: "Syrian Pound", flag: "sy" },
    { code: "SZL", name: "Swazi Lilangeni", flag: "sz" },
    { code: "TJS", name: "Tajikistani Somoni", flag: "tj" },
    { code: "TMT", name: "Turkmenistani Manat", flag: "tm" },
    { code: "TND", name: "Tunisian Dinar", flag: "tn" },
    { code: "TOP", name: "Tongan Paʻanga", flag: "to" },
    { code: "TRY", name: "Turkish Lira", flag: "tr" },
    { code: "TTD", name: "Trinidad & Tobago Dollar", flag: "tt" },
    { code: "TWD", name: "New Taiwan Dollar", flag: "tw" },
    { code: "TZS", name: "Tanzanian Shilling", flag: "tz" },
    { code: "UAH", name: "Ukrainian Hryvnia", flag: "ua" },
    { code: "UGX", name: "Ugandan Shilling", flag: "ug" },
    { code: "UYU", name: "Uruguayan Peso", flag: "uy" },
    { code: "UZS", name: "Uzbekistani Som", flag: "uz" },
    { code: "VES", name: "Venezuelan Bolívar", flag: "ve" },
    { code: "VND", name: "Vietnamese Dong", flag: "vn" },
    { code: "VUV", name: "Vanuatu Vatu", flag: "vu" },
    { code: "WST", name: "Samoan Tala", flag: "ws" },
    { code: "XAF", name: "Central African CFA Franc", flag: "cf" },
    { code: "XCD", name: "East Caribbean Dollar", flag: "ag" },
    { code: "XOF", name: "West African CFA Franc", flag: "sn" },
    { code: "XPF", name: "CFP Franc", flag: "pf" },
    { code: "YER", name: "Yemeni Rial", flag: "ye" },
    { code: "ZAR", name: "South African Rand", flag: "za" },
    { code: "ZMW", name: "Zambian Kwacha", flag: "zm" },
    { code: "ZWL", name: "Zimbabwean Dollar", flag: "zw" }
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
  function currentLang() {
    var code = currentLangCode();
    for (var i = 0; i < LANGS.length; i++) { if (LANGS[i].code === code) return LANGS[i]; }
    return LANGS[0];
  }

  /* Render the current language flag + currency code into the
     topbar trigger(s) on whichever page is showing. */
  function triggerInner(curCode, withId) {
    var l = currentLang();
    var flag = l.flag === "globe"
      ? '<span class="tb-flag tb-flag--globe">🌐</span>'
      : '<img class="tb-flag" alt="" src="https://flagcdn.com/w40/' + l.flag + '.png">';
    var codeSpan = '<span ' + (withId ? 'id="currLabel" ' : "") +
      'class="cur-code notranslate" translate="no">' + curCode + "</span>";
    return flag + " " + codeSpan + ' <span class="caret">▾</span>';
  }
  function renderTriggers() {
    var cur = currentCurrency();
    var home = document.querySelector(".dd-trigger[data-dd='ddLang']");
    if (home) home.innerHTML = triggerInner(cur, false);
    var app = document.getElementById("currTrigger");
    if (app) app.innerHTML = triggerInner(cur, true);
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
    try { localStorage.setItem("tg_curr", code); } catch (e) {}
    try {
      var p = new URLSearchParams(location.search);
      p.set("curr", code);
      history.replaceState(null, "", location.pathname + "?" + p.toString());
    } catch (e) {}
    renderTriggers();
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
    renderTriggers();
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
