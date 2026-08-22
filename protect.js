// ══════════════════════════════════════════
//  PROTECT.JS — Enhanced Auth Protection
// ══════════════════════════════════════════

import {
    auth,
    onAuthStateChanged
} from "./firebase-auth.js";

// ─── 1. INSTANT HIDE ───
document.documentElement.style.display = "none";
let isPageAllowed = false;

// ─── 2. AUTH CHECK ───
onAuthStateChanged(auth, (user) => {
    if (!user) {
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
        return;
    }
    
    // User exists — restore display (empty string restores CSS default)
    isPageAllowed = true;
    document.documentElement.style.display = "";
    document.body.style.visibility = "visible";
});

// ─── 3. BUTTON-LEVEL PROTECTION ───
document.addEventListener("click", (e) => {
    if (!isPageAllowed) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
    }
}, true);

// ─── 4. KEY PRESS PROTECTION ───
document.addEventListener("keydown", (e) => {
    if (!isPageAllowed && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
    }
}, true);

// ─── 5. FORM SUBMISSION PROTECTION ───
document.addEventListener("submit", (e) => {
    if (!isPageAllowed) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
    }
}, true);

// ─── 6. PREVENT PAGE CACHING ───
window.addEventListener("pageshow", (e) => {
    if (e.persisted && !isPageAllowed) {
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
    }
});

export { isPageAllowed };
