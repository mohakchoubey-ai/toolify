
// ══════════════════════════════════════════
//  PROTECT.JS — Enhanced Auth Protection
//  Fast redirect + Button-level fallback
// ══════════════════════════════════════════

import {
    auth,
    onAuthStateChanged
} from "./firebase-auth.js";

// ─── 1. INSTANT HIDE (Before Auth Check) ───
document.documentElement.style.display = "none";
let isPageAllowed = false;

// ─── 2. AUTH CHECK ──────────────────────
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Fast redirect — no delay, no crumbs
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
        return;
    }
    
    // User exists — mark as allowed & show page
    isPageAllowed = true;
    document.documentElement.style.display = "auto";
    document.body.style.visibility = "visible";
});

// ─── 3. BUTTON-LEVEL PROTECTION (Fallback) ──
// If user somehow gets to page (browser back button), 
// catch any button/link clicks and redirect
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
}, true); // Capture phase — catch before any handler fires

// ─── 4. KEY PRESS PROTECTION (Secondary Fallback) ──
// Catch keyboard interactions too (Enter, Space, etc.)
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

// ─── 5. FORM SUBMISSION PROTECTION ──────
// Block form submissions if not authenticated
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

// ─── 6. PREVENT PAGE CACHING ────────────
// Ensure page doesn't load from cache on back button
window.addEventListener("pageshow", (e) => {
    if (e.persisted && !isPageAllowed) {
        // Page loaded from bfcache (browser back)
        const currentPage = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.replace(
            `/toolify/login.html?redirect=${currentPage}`
        );
    }
});

// ─── 7. UNLOAD CLEANUP ──────────────────
window.addEventListener("beforeunload", () => {
    // Clear any cached page state
    document.documentElement.style.display = "none";
});

export { isPageAllowed };
