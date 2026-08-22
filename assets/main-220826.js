// ══════════════════════════════════════════
//  TOOLIFY — Index.js
//  Firebase Auth Gate + Dashboard Logic
// ══════════════════════════════════════════

// ─── 1. FIREBASE CONFIG ──────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
  authDomain: "toolbox-hub-98c03.firebaseapp.com",
  projectId: "toolbox-hub-98c03",
  storageBucket: "toolbox-hub-98c03.firebasestorage.app",
  messagingSenderId: "321020105472",
  appId: "1:321020105472:web:356e7c2903def7b9d859e5"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// ─── 2. DOM REFS ─────────────────────────
const landingScreen   = document.getElementById("landing-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const googleSignInBtn = document.getElementById("googleSignIn");
const dashBtn         = document.getElementById("dashBtn");
const signOutBtn      = document.getElementById("signOutBtn");
const userAvatar      = document.getElementById("userAvatar");
const userNameEl      = document.getElementById("userName");
const greetNameEl     = document.getElementById("greetName");
const timeOfDayEl     = document.getElementById("timeOfDay");
const cursorGlow      = document.getElementById("cursorGlow");

// ─── 3. CURSOR GLOW ──────────────────────
document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top  = `${e.clientY}px`;
});

// ─── 4. AUTH STATE ───────────────────────
// When a user is already signed in on the landing page,
// show the "Go to Dashboard" button instead of redirecting immediately.
// This lets the user see the landing page and choose to proceed.
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in — show the Go to Dashboard button,
    // hide the Google sign-in button, update the hint text.
    showDashboardBtn(user);
  }
});

// ─── 5. SHOW DASHBOARD BUTTON ────────────
function showDashboardBtn(user) {
  // Hide Google sign-in, show dash button
  googleSignInBtn.classList.add("hidden");
  dashBtn.classList.remove("hidden");

  // Update the auth hint copy
  const hint = document.querySelector(".auth-hint");
  if (hint) {
    const first = (user.displayName || "").split(" ")[0];
    hint.textContent = first
      ? `Signed in as ${first} · Click above to continue`
      : "You're signed in · Click above to continue";
  }
}

// ─── 6. SIGN IN ──────────────────────────
googleSignInBtn.addEventListener("click", async () => {
  googleSignInBtn.disabled = true;
  googleSignInBtn.textContent = "Signing in…";

  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged fires → showDashboardBtn
    // Then user can click "Go to Dashboard"
    window.location.href = "dashboard";
  } catch (err) {
    console.error("Sign-in error:", err);
    googleSignInBtn.disabled = false;
    googleSignInBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google`;

    if (err.code !== "auth/popup-closed-by-user") {
      alert("Sign-in failed. Please try again.");
    }
  }
});

// ─── 7. SIGN OUT ─────────────────────────
if (signOutBtn) {
  signOutBtn.addEventListener("click", async () => {
    await signOut(auth);
    // onAuthStateChanged doesn't auto-redirect on sign-out on landing page
    // so reset the UI manually
    dashBtn.classList.add("hidden");
    googleSignInBtn.classList.remove("hidden");
    googleSignInBtn.disabled = false;

    const hint = document.querySelector(".auth-hint");
    if (hint) hint.textContent = "Sign in once — access everything, forever.";
  });
}

// ─── 8. SHOW LANDING ─────────────────────
function showLanding() {
  dashboardScreen.classList.add("hidden");
  landingScreen.classList.remove("hidden");
}
