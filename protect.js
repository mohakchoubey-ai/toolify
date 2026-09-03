// ══════════════════════════════════════════════════════════════
// PROTECT.JS — TEMPORARILY DISABLED
// Janmashtami 3-day guest access
//
// This file intentionally performs no protection.
// It does not redirect guests.
// It does not hide the page.
// It does not intercept clicks, keyboard events, or forms.
// Firebase authentication remains unchanged.
// ══════════════════════════════════════════════════════════════

let isPageAllowed = true;

// Keep the same export so existing pages importing
// `isPageAllowed` don't break.
export { isPageAllowed };
