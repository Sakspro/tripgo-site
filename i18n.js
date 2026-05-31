/* ===========================================================
   TripGo i18n — whole-page translation via Google Translate.
   Wires the language selector (home + app pages) to live
   translation. Because the native app loads this same site,
   changing the language here also changes it inside the app.
   =========================================================== */
(function () {
  var MAP = {
    "English (XX)": "en",
    "English (UK)": "en",
    "中文 (简体)": "zh-CN",
    "中文 (繁體)": "zh-TW",
    "日本語": "ja",
    "한국어": "ko",
    "Français": "fr",
    "Deutsch": "de",
    "Español": "es",
    "ภาษาไทย": "th"
  };
  var host = location.hostname || "";

  function setCookie(value) {
    document.cookie = "googtrans=" + value + ";path=/";
    if (host.indexOf(".") > -1) {
      document.cookie = "googtrans=" + value + ";path=/;domain=" + host;
      document.cookie = "googtrans=" + value + ";path=/;domain=." + host;
    }
  }
  function clearCookie() {
    var exp = ";expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "googtrans=" + exp;
    if (host.indexOf(".") > -1) {
      document.cookie = "googtrans=" + exp + ";domain=" + host;
      document.cookie = "googtrans=" + exp + ";domain=." + host;
    }
  }

  window.TG_LANGS = MAP;

  window.TGcurrentLangCode = function () {
    var m = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "en";
  };

  window.TGcurrentLangLabel = function () {
    var code = window.TGcurrentLangCode();
    var stored;
    try { stored = localStorage.getItem("tg_lang"); } catch (e) {}
    if (stored && MAP[stored] === code) return stored;
    for (var k in MAP) { if (MAP[k] === code) return k; }
    return "English (XX)";
  };

  /* Apply a language by label. Reloads so Google Translate
     can re-process the page. Returns true if a change happened. */
  window.TGsetLanguage = function (label) {
    var code = MAP[label] || "en";
    var current = window.TGcurrentLangCode();
    try { localStorage.setItem("tg_lang", label); } catch (e) {}
    if (code === current) return false;
    if (code === "en") clearCookie();
    else setCookie("/en/" + code);
    location.reload();
    return true;
  };

  /* Google Translate widget bootstrap */
  window.googleTranslateElementInit = function () {
    /* eslint-disable no-undef */
    new google.translate.TranslateElement(
      { pageLanguage: "en", autoDisplay: false },
      "google_translate_element"
    );
  };

  /* Inject the hidden host element + loader once DOM is ready */
  function inject() {
    if (!document.getElementById("google_translate_element")) {
      var div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.display = "none";
      document.body.appendChild(div);
    }
    if (!document.getElementById("tg-gtranslate-loader")) {
      var s = document.createElement("script");
      s.id = "tg-gtranslate-loader";
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(s);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
