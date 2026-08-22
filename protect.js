// ══════════════════════════════════════════
//  PROTECT.JS — Enhanced Auth Protection
// ══════════════════════════════════════════

import { auth, onAuthStateChanged } from "./firebase-auth.js";

// ─── 1. INSTANT HIDE ───
document.documentElement.style.display = "none";
let isPageAllowed = false;

// ─── HELPER: CENTRALIZED REDIRECT ───
const redirectToLogin = () => {
    const currentPage = encodeURIComponent(
        window.location.pathname + window.location.search
    );
    window.location.replace(`/toolify/login.html?redirect=${currentPage}`);
};

// ─── 2. AUTH CHECK ───
onAuthStateChanged(auth, (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }
    
    // User exists — mark as allowed & show page
    isPageAllowed = true;
    document.documentElement.style.display = "";
    document.body.style.visibility = "visible";
});

// ─── 3. INTERACTION GUARDS (Capture Phase) ───
// Blocks clicks, keyboard triggers, and form submissions if not allowed
document.addEventListener("click", (e) => {
    if (!isPageAllowed) {
        e.preventDefault();
        e.stopPropagation();
        redirectToLogin();
    }
}, true);

document.addEventListener("keydown", (e) => {
    if (!isPageAllowed && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        redirectToLogin();
    }
}, true);

document.addEventListener("submit", (e) => {
    if (!isPageAllowed) {
        e.preventDefault();
        e.stopPropagation();
        redirectToLogin();
    }
}, true);

// ─── 4. BROWSER CACHE (Bfcache) PROTECTION ───
window.addEventListener("pageshow", (e) => {
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
