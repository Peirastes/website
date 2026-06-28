/* ============================================================
   Peirastes — shared site-wide auth (window.PeirAuth)
   ------------------------------------------------------------
   One login across the homepage + in-world apps (Thermofluidic
   sim, ETM later). Talks to the self-hosted Server we built
   (POST /api/login|register|logout|password, GET /api/me).

   Same-origin localStorage gives real SSO: this and the apps
   share the keys below, so a login here flows into the apps.

   Graceful degradation is a hard requirement: if no Server is
   configured or it's unreachable, the chip silently stays
   "Visitor" — never a broken UI, never a thrown error.

   Self-mounts on any page that has a .profile chip. No build
   step, no module system — matches the site's plain-script style.
   ============================================================ */
(function () {
  "use strict";

  // Shared identity keys (peir_*) — the apps read these too, so SSO is automatic.
  var TKEY = "peir_token", UKEY = "peir_user", AKEY = "peir_api";
  // Self-hosted Server on the Pi, public via Tailscale Funnel. Public endpoint
  // (not a secret) — fine to ship in client JS. So nobody has to type a URL.
  var DEFAULT_API = "https://peirastes-pi.tail6fdfc3.ts.net";

  function ls(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function lset(k, v) { try { localStorage.setItem(k, v == null ? "" : v); } catch (e) {} }

  var A = {
    token: "", user: "", role: "", api: "",
    isLoggedIn: function () { return !!(A.token && A.user); },
    setApi: function (url) { A.api = String(url || "").trim().replace(/\/+$/, ""); lset(AKEY, A.api); },
    login: function (u, pw) { return req("POST", "/api/login", { username: u, password: pw }).then(adopt); },
    register: function (u, pw, invite) { return req("POST", "/api/register", { username: u, password: pw, invite: invite }).then(adopt); },
    changePassword: function (oldp, newp) { return req("POST", "/api/password", { oldPassword: oldp, newPassword: newp }); },
    me: function () { return req("GET", "/api/me"); },
    logout: function () { return req("POST", "/api/logout").then(function (r) { clearState(); render(); return r; }); }
  };

  // fetch helper → always resolves {ok,status,j}; never throws (network error => status 0).
  function req(method, path, body) {
    if (!A.api) return Promise.resolve({ ok: false, status: 0, j: { error: "no server configured" } });
    return fetch(A.api + path, {
      method: method,
      headers: Object.assign({ "Content-Type": "application/json" }, A.token ? { "Authorization": "Bearer " + A.token } : {}),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).catch(function () { return { ok: false, status: 0, j: { error: "cannot reach Server" } }; });
  }

  // On a successful login/register response, adopt the session.
  function adopt(r) {
    if (r.ok && r.j && r.j.token) {
      A.token = r.j.token; A.user = r.j.username || ""; A.role = r.j.role || "member";
      lset(TKEY, A.token); lset(UKEY, A.user);
      render();
    }
    return r;
  }
  function clearState() { A.token = ""; A.user = ""; A.role = ""; lset(TKEY, ""); lset(UKEY, ""); }

  window.PeirAuth = A;

  // ---------- chip + dropdown panel ----------
  var chip, panel, mode = "login"; // login | register | account | changepw

  function mount() {
    chip = document.querySelector(".profile");
    if (!chip) return;
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    panel = document.createElement("div");
    panel.className = "profile-panel";
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.body.appendChild(panel);

    chip.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    chip.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    document.addEventListener("click", function () { close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // restore state (conservative: show Visitor until /api/me confirms a live session)
    A.token = ls(TKEY); A.user = ls(UKEY);
    A.api = (ls(AKEY) || DEFAULT_API).replace(/\/+$/, "");
    if (A.api && !ls(AKEY)) lset(AKEY, A.api); // seed shared api so the in-world apps don't re-prompt
    render();
    if (A.token && A.api) {
      A.me().then(function (r) {
        if (r.ok) { A.user = r.j.username || A.user; A.role = r.j.role || "member"; }
        else if (r.status === 401) { clearState(); } // token expired/revoked → drop it
        // network error (status 0): leave token in place, just stay Visitor this load
        render();
      });
    }
  }

  function toggle() { panel.classList.contains("is-open") ? close() : open(); }
  function open() { mode = A.isLoggedIn() ? "account" : "login"; render(); panel.classList.add("is-open"); }
  function close() { panel.classList.remove("is-open"); }

  function setChip(name, sub, mark, authed) {
    var n = chip.querySelector(".profile__name"), s = chip.querySelector(".profile__sub"), m = chip.querySelector(".profile__mark");
    if (n) n.textContent = name;
    if (s) s.textContent = sub;
    if (m) m.textContent = mark;
    chip.classList.toggle("is-auth", !!authed);
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function render() {
    if (!chip) return;
    if (A.isLoggedIn()) {
      setChip(A.user, A.role && A.role !== "member" ? A.role : "Signed in", (A.user[0] || "?").toUpperCase(), true);
    } else {
      setChip("Peirastes", "Visitor", "P", false);
    }
    if (panel.classList.contains("is-open")) renderPanel();
  }

  function renderPanel() {
    var h = "";
    if (A.isLoggedIn()) {
      if (mode === "changepw") h = accountChangePw();
      else h = accountMain();
    } else {
      h = (mode === "register") ? authForm(true) : authForm(false);
    }
    panel.innerHTML = h;
    wirePanel();
  }

  function serverField() {
    if (A.api) return "";
    return '<input id="pa-api" placeholder="Server URL (e.g. https://…ts.net)" autocomplete="off">';
  }

  function authForm(isRegister) {
    return ''
      + '<div class="profile-panel__title">' + (isRegister ? "Create Account" : "Sign In") + '</div>'
      + serverField()
      + '<input id="pa-u" placeholder="username" autocomplete="username">'
      + '<input id="pa-p" type="password" placeholder="password" autocomplete="current-password">'
      + (isRegister ? '<input id="pa-i" placeholder="invite code" autocomplete="off">' : '')
      + '<div class="profile-panel__row">'
      + '<button class="pa-btn pa-btn--primary" id="pa-go">' + (isRegister ? "Register" : "Log In") + '</button>'
      + '</div>'
      + '<div class="profile-panel__msg" id="pa-msg"></div>'
      + '<div class="profile-panel__foot">'
      + (isRegister
          ? '<a id="pa-tologin">have an account? sign in</a>'
          : '<a id="pa-toreg">have an invite? create account</a>')
      + (A.api ? ' &middot; <a id="pa-srv">change server</a>' : '')
      + '</div>';
  }

  function accountMain() {
    return ''
      + '<div class="profile-panel__title">Account</div>'
      + '<div class="profile-panel__who">Signed in as <strong>' + esc(A.user) + '</strong>'
      + (A.role && A.role !== "member" ? ' <span class="profile-panel__role">' + esc(A.role) + '</span>' : '') + '</div>'
      + '<div class="profile-panel__apps">'
      + '<div class="profile-panel__title" style="margin-top:.7rem">Your Apps</div>'
      + '<a class="profile-panel__link" href="/projects/cash-bubble.html">Thermofluidic Finance →</a>'
      + '</div>'
      + '<div class="profile-panel__row" style="margin-top:.8rem">'
      + '<button class="pa-btn" id="pa-chpw">Change Password</button>'
      + '<button class="pa-btn" id="pa-out">Log Out</button>'
      + '</div>'
      + '<div class="profile-panel__msg" id="pa-msg"></div>';
  }

  function accountChangePw() {
    return ''
      + '<div class="profile-panel__title">Change Password</div>'
      + '<input id="pa-old" type="password" placeholder="current password" autocomplete="current-password">'
      + '<input id="pa-new" type="password" placeholder="new password (6+ chars)" autocomplete="new-password">'
      + '<div class="profile-panel__row">'
      + '<button class="pa-btn pa-btn--primary" id="pa-save">Save</button>'
      + '<button class="pa-btn" id="pa-cancel">Cancel</button>'
      + '</div>'
      + '<div class="profile-panel__msg" id="pa-msg"></div>';
  }

  function $(id) { return panel.querySelector("#" + id); }
  function msg(text, isErr) { var m = $("pa-msg"); if (m) { m.textContent = text || ""; m.classList.toggle("is-err", !!isErr); } }
  function busy(b) { panel.classList.toggle("is-busy", !!b); }

  function wirePanel() {
    var go = $("pa-go");
    if (go) {
      var sub = function () {
        var apiEl = $("pa-api"); if (apiEl && apiEl.value.trim()) A.setApi(apiEl.value);
        if (!A.api) { msg("Enter the Server URL first.", true); return; }
        var u = ($("pa-u").value || "").trim(), p = $("pa-p").value || "";
        if (!u || !p) { msg("Username and password required.", true); return; }
        busy(true); msg("…");
        var pr = (mode === "register")
          ? A.register(u, p, (($("pa-i") || {}).value || "").trim())
          : A.login(u, p);
        pr.then(function (r) {
          busy(false);
          if (r.ok) { mode = "account"; renderPanel(); }
          else { msg((r.j && r.j.error) || (r.status === 0 ? "Can't reach the Server." : "Failed."), true); }
        });
      };
      go.onclick = sub;
      panel.addEventListener("keydown", function (e) { if (e.key === "Enter") sub(); });
    }
    if ($("pa-toreg")) $("pa-toreg").onclick = function () { mode = "register"; renderPanel(); };
    if ($("pa-tologin")) $("pa-tologin").onclick = function () { mode = "login"; renderPanel(); };
    if ($("pa-srv")) $("pa-srv").onclick = function () { A.setApi(""); mode = (A.isLoggedIn() ? "account" : "login"); renderPanel(); };
    if ($("pa-chpw")) $("pa-chpw").onclick = function () { mode = "changepw"; renderPanel(); };
    if ($("pa-cancel")) $("pa-cancel").onclick = function () { mode = "account"; renderPanel(); };
    if ($("pa-out")) $("pa-out").onclick = function () { busy(true); A.logout().then(function () { busy(false); close(); }); };
    if ($("pa-save")) $("pa-save").onclick = function () {
      var o = $("pa-old").value || "", n = $("pa-new").value || "";
      if (!o || n.length < 6) { msg("New password must be 6+ chars.", true); return; }
      busy(true); msg("…");
      A.changePassword(o, n).then(function (r) {
        busy(false);
        if (r.ok) { mode = "account"; renderPanel(); msg("Password changed. Other devices were signed out."); }
        else { msg((r.j && r.j.error) || "Failed.", true); }
      });
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { try { mount(); } catch (e) {} });
  else { try { mount(); } catch (e) {} }
})();
