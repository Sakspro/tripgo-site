/* ===========================================================
   TripGo sign-in / register — Trip.com-style auth modal.
   Email/phone → verification code → signed in, plus social
   login. Shared across all pages; persists a demo session.
   =========================================================== */
(function () {
  function getUser() { try { return localStorage.getItem("tg_user") || ""; } catch (e) { return ""; } }
  function setUser(v) { try { v ? localStorage.setItem("tg_user", v) : localStorage.removeItem("tg_user"); } catch (e) {} }
  function shortName(id) {
    if (!id) return "";
    return id.indexOf("@") > -1 ? id.split("@")[0] : id;
  }

  var overlay, bodyEl, state = { step: "id", id: "", token: "", devCode: "", busy: false };

  function build() {
    overlay = document.createElement("div");
    overlay.className = "regm-overlay authm-overlay";
    overlay.id = "authModal";
    overlay.innerHTML =
      '<div class="authm" role="dialog" aria-modal="true" aria-label="Sign in or register">' +
        '<button class="authm__close" aria-label="Close">✕</button>' +
        '<div class="authm__brand notranslate" translate="no">✈ Trip<span>Go</span></div>' +
        '<div id="authBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    bodyEl = overlay.querySelector("#authBody");

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest(".authm__close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
    bodyEl.addEventListener("click", onBodyClick);
    bodyEl.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  function render() {
    var u = getUser();
    if (u && state.step !== "done") { renderAccount(u); return; }
    if (state.step === "code") { renderCode(); return; }
    if (state.step === "done") { renderDone(); return; }
    renderId();
  }

  function renderId() {
    bodyEl.innerHTML =
      '<h2 class="authm__title">Sign in or Register</h2>' +
      '<p class="authm__lead">Enter your email and we\'ll send you a verification code. New here? We\'ll create your account automatically.</p>' +
      '<form class="authm__form"><div class="authm__field">' +
      '<input id="authId" type="email" autocomplete="email" placeholder="Email address" value="' +
        state.id.replace(/"/g, "&quot;") + '"></div>' +
      '<button class="btn btn--primary btn--block" id="authContinue" type="submit">Continue</button></form>' +
      '<div class="authm__or"><span>or continue with</span></div>' +
      '<div class="authm__socials">' +
        '<button type="button" class="socbtn2" data-soc="Google"><b style="color:#4285F4">G</b> Google</button>' +
        '<button type="button" class="socbtn2" data-soc="Facebook"><b style="color:#1877F2">f</b> Facebook</button>' +
        '<button type="button" class="socbtn2" data-soc="Apple"><b></b> Apple</button>' +
      '</div>' +
      '<p class="authm__terms">By continuing, you agree to TripGo\'s <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>';
    setTimeout(function () { var i = document.getElementById("authId"); if (i) i.focus(); }, 60);
  }

  function renderCode() {
    bodyEl.innerHTML =
      '<button class="authm__back" id="authBack" type="button">‹ Back</button>' +
      '<h2 class="authm__title">Enter verification code</h2>' +
      '<p class="authm__lead">We\'ve sent a 6-digit code to <strong class="notranslate" translate="no">' + state.id + '</strong>.</p>' +
      (state.devCode
        ? '<div class="authm__dev">Email isn\'t configured on the server yet, so here\'s your code for testing: <strong class="notranslate" translate="no">' + state.devCode + '</strong></div>'
        : "") +
      '<form class="authm__form"><div class="authm__field">' +
      '<input id="authCode" type="text" inputmode="numeric" maxlength="6" placeholder="6-digit code"></div>' +
      '<button class="btn btn--primary btn--block" id="authVerify" type="submit">Verify &amp; continue</button></form>' +
      '<p class="authm__resend">Didn\'t receive it? <a href="#" id="authResend">Resend code</a></p>';
    setTimeout(function () { var i = document.getElementById("authCode"); if (i) i.focus(); }, 60);
  }

  function renderDone() {
    bodyEl.innerHTML =
      '<div class="authm__success">✅</div>' +
      '<h2 class="authm__title">Welcome to TripGo!</h2>' +
      '<p class="authm__lead">You\'re signed in as <strong class="notranslate" translate="no">' + getUser() + '</strong>.</p>' +
      '<button class="btn btn--primary btn--block" id="authDone" type="button">Start exploring</button>';
  }

  function renderAccount(u) {
    bodyEl.innerHTML =
      '<div class="authm__avatar notranslate" translate="no">' + (shortName(u)[0] || "U").toUpperCase() + '</div>' +
      '<h2 class="authm__title">Hi, <span class="notranslate" translate="no">' + shortName(u) + '</span></h2>' +
      '<p class="authm__lead">Signed in as <strong class="notranslate" translate="no">' + u + '</strong></p>' +
      '<div class="authm__acct">' +
        '<a class="authm__acctlink" href="index.html#search">🧳 My Trips</a>' +
        '<a class="authm__acctlink" href="explore.html?cat=rewards">🎁 TripGo Rewards</a>' +
        '<a class="authm__acctlink" href="support.html">💬 Help &amp; support</a>' +
      '</div>' +
      '<button class="btn btn--outline btn--block" id="authSignout" type="button">Sign out</button>';
  }

  function onBodyClick(e) {
    if (e.target.closest("#authContinue")) {
      var v = (document.getElementById("authId").value || "").trim();
      if (!/.+@.+\..+/.test(v)) {
        flash("Enter a valid email address to receive your code.");
        return;
      }
      state.id = v; sendCode();
    } else if (e.target.closest("#authBack")) {
      state.step = "id"; state.devCode = ""; render();
    } else if (e.target.closest("#authVerify")) {
      verifyCode();
    } else if (e.target.closest("#authResend")) {
      e.preventDefault(); sendCode(true);
    } else if (e.target.closest("[data-soc]")) {
      var soc = e.target.closest("[data-soc]").dataset.soc;
      setUser("user@" + soc.toLowerCase() + ".com"); state.step = "done"; render(); updateTriggers();
    } else if (e.target.closest("#authDone")) {
      close();
    } else if (e.target.closest("#authSignout")) {
      setUser(""); state.step = "id"; updateTriggers(); flash("You've been signed out."); render();
    }
  }

  function setBtn(id, label, disabled) {
    var b = document.getElementById(id);
    if (b) { b.textContent = label; b.disabled = !!disabled; }
  }

  function sendCode(isResend) {
    if (state.busy) return;
    state.busy = true;
    if (isResend) flash("Sending a new code…");
    else setBtn("authContinue", "Sending…", true);
    fetch("/api/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: state.id }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        state.busy = false;
        if (!res.ok) { flash(res.j.error || "Could not send the code. Please try again."); setBtn("authContinue", "Continue", false); return; }
        state.token = res.j.token;
        state.devCode = res.j.sent === false ? (res.j.devCode || "") : "";
        if (state.step === "code") { if (isResend) flash("A new code has been sent."); render(); }
        else { state.step = "code"; render(); }
      })
      .catch(function () {
        state.busy = false;
        flash("Network error. Please check your connection and try again.");
        setBtn("authContinue", "Continue", false);
      });
  }

  function verifyCode() {
    if (state.busy) return;
    var c = (document.getElementById("authCode").value || "").trim();
    if (c.length < 4) { flash("Enter the 6-digit code we sent you."); return; }
    state.busy = true;
    setBtn("authVerify", "Verifying…", true);
    fetch("/api/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token, code: c }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        state.busy = false;
        if (!res.ok || !res.j.ok) { flash(res.j.error || "Incorrect code. Please try again."); setBtn("authVerify", "Verify & continue", false); return; }
        setUser(res.j.email || state.id);
        state.devCode = ""; state.step = "done"; render(); updateTriggers();
      })
      .catch(function () {
        state.busy = false;
        flash("Network error. Please try again.");
        setBtn("authVerify", "Verify & continue", false);
      });
  }

  function flash(msg) {
    var n = overlay.querySelector(".authm__flash");
    if (!n) { n = document.createElement("div"); n.className = "authm__flash"; bodyEl.prepend(n); }
    n.textContent = msg;
  }

  function open() {
    if (!overlay) build();
    if (!getUser()) state.step = "id";
    render();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (state.step === "done") state.step = "id";
  }

  /* ---- Signed-in account dropdown (Trip.com member menu) ---- */
  var acctEl;

  function acctHtml() {
    return (
      '<div class="acctdd__card">' +
        '<div class="acctdd__avatar">🧑</div>' +
        '<div class="acctdd__who">' +
          '<div class="acctdd__name notranslate" translate="no">TripGo Member</div>' +
          '<div class="acctdd__sub">' +
            '<span class="acctdd__tier">🛡 Silver</span>' +
            '<span class="acctdd__coin">🪙 0 <em>(≈ US$0)</em></span>' +
          '</div>' +
        '</div>' +
        '<span class="acctdd__chev">›</span>' +
      '</div>' +
      '<div class="acctdd__list">' +
        '<a class="acctdd__item" href="bookings.html"><span>🗓️</span> My bookings</a>' +
        '<a class="acctdd__item" href="#"><span>👤</span> Manage my account</a>' +
      '</div>' +
      '<div class="acctdd__list">' +
        '<a class="acctdd__item acctdd__item--plain" href="explore.html?cat=deals">Promo codes</a>' +
        '<a class="acctdd__item acctdd__item--plain" href="index.html">Saved</a>' +
        '<a class="acctdd__item acctdd__item--plain" href="explore.html?cat=inspiration">My posts</a>' +
        '<a class="acctdd__item acctdd__item--plain" href="explore.html?cat=deals">Flight price alerts</a>' +
      '</div>' +
      '<div class="acctdd__list">' +
        '<a class="acctdd__item acctdd__item--plain" href="#" id="acctSignout">Sign out</a>' +
      '</div>'
    );
  }

  function buildAcct() {
    acctEl = document.createElement("div");
    acctEl.className = "acctdd";
    document.body.appendChild(acctEl);
    acctEl.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      if (a.id === "acctSignout") { e.preventDefault(); setUser(""); updateTriggers(); closeAccount(); flash2("You've been signed out."); return; }
      if (a.getAttribute("href") === "#") e.preventDefault();
      closeAccount();
    });
  }

  function flash2(msg) {
    var n = document.createElement("div");
    n.className = "tg-toast"; n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function () { n.classList.add("is-on"); }, 10);
    setTimeout(function () { n.classList.remove("is-on"); setTimeout(function () { n.remove(); }, 250); }, 1800);
  }

  function positionAcct(anchor) {
    var r = anchor.getBoundingClientRect();
    acctEl.style.top = (r.bottom + 8) + "px";
    acctEl.style.right = Math.max(12, window.innerWidth - r.right) + "px";
    acctEl.style.left = "auto";
  }

  function onOutsideAcct(e) {
    if (acctEl && !acctEl.contains(e.target) && !e.target.closest("[data-signin], [data-dd='ddSignin']")) closeAccount();
  }
  function onEscAcct(e) { if (e.key === "Escape") closeAccount(); }

  function openAccount(anchor) {
    if (!acctEl) buildAcct();
    acctEl.innerHTML = acctHtml();
    positionAcct(anchor);
    acctEl.classList.add("is-open");
    setTimeout(function () {
      document.addEventListener("click", onOutsideAcct, true);
      document.addEventListener("keydown", onEscAcct);
    }, 0);
  }
  function closeAccount() {
    if (acctEl) acctEl.classList.remove("is-open");
    document.removeEventListener("click", onOutsideAcct, true);
    document.removeEventListener("keydown", onEscAcct);
  }

  /* Reflect signed-in state on every sign-in trigger. */
  function updateTriggers() {
    var u = getUser();
    var label = u ? "👤 " + shortName(u) : "Sign in / register";
    document.querySelectorAll("[data-signin], [data-dd='ddSignin']").forEach(function (el) {
      el.textContent = label;
    });
  }

  function init() {
    build();
    updateTriggers();
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-signin], [data-dd='ddSignin'], #doSignin");
      if (t) {
        e.preventDefault(); e.stopPropagation();
        if (acctEl && acctEl.classList.contains("is-open")) { closeAccount(); return; }
        if (getUser()) openAccount(t); else open();
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
