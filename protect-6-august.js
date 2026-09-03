// ══════════════════════════════════════════════════════════════
//  PROTECT.JS — Unified auth guard for Toolify + CheckMate
//  Place at: /toolify/js/protect.js
//
//  Chess pages import it as:
//    import "/toolify/js/protect.js";
//
//  Toolify pages import it as before:
//    import "./protect.js";  (or relative path)
//
//  Config options (set BEFORE importing this file via window):
//    window.PROTECT_LOGIN_URL  — override redirect target
//    window.PROTECT_ALLOW_ANON — set true to allow anon users
// ══════════════════════════════════════════════════════════════

import { auth } from "/toolify/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── 1. INSTANT HIDE ───────────────────────────────────────────
document.documentElement.style.display = "none";

let isPageAllowed = false;

// ─── LOGIN URL — Chess redirects back to Chess login, Toolify to its own ───
const LOGIN_URL = window.PROTECT_LOGIN_URL || "/toolify/login.html";

const redirectToLogin = () => {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`${LOGIN_URL}?redirect=${returnTo}`);
};

// ─── 2. AUTH CHECK ─────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  const allowAnon = window.PROTECT_ALLOW_ANON === true;
  const isLoggedIn = user && (!user.isAnonymous || allowAnon);

  if (!isLoggedIn) {
    redirectToLogin();
    return;
  }

  isPageAllowed = true;
  document.documentElement.style.display = "";
  document.body.style.visibility = "visible";
});

// ─── 3. INTERACTION GUARDS (Capture Phase) ─────────────────────
document.addEventListener("click", e => {
  if (!isPageAllowed) { e.preventDefault(); e.stopPropagation(); redirectToLogin(); }
}, true);

document.addEventListener("keydown", e => {
  if (!isPageAllowed && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault(); e.stopPropagation(); redirectToLogin();
  }
}, true);

document.addEventListener("submit", e => {
  if (!isPageAllowed) { e.preventDefault(); e.stopPropagation(); redirectToLogin(); }
}, true);

// ─── 4. BFCACHE PROTECTION ─────────────────────────────────────
window.addEventListener("pageshow", e => {
  if (e.persisted) {
    if (isPageAllowed) {
      document.documentElement.style.display = "";
      document.body.style.visibility = "visible";
    } else {
      redirectToLogin();
    }
  }
});

export { isPageAllowed };
