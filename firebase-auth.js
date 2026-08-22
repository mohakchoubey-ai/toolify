// ══════════════════════════════════════════════════════════════
//  FIREBASE-AUTH.JS — Unified auth for Toolify + CheckMate
//  Place at: /toolify/js/firebase-auth.js
//  Both Toolify and Chess import from this single file.
// ══════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  update,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── CONFIG ────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
  authDomain:        "toolbox-hub-98c03.firebaseapp.com",
  projectId:         "toolbox-hub-98c03",
  storageBucket:     "toolbox-hub-98c03.firebasestorage.app",
  messagingSenderId: "321020105472",
  appId:             "1:321020105472:web:356e7c2903def7b9d859e5",
  databaseURL:       "https://toolbox-hub-98c03-default-rtdb.firebaseio.com"
};

// ─── INIT (guard against double-init across navigations) ───────
const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const DB   = getDatabase(app);
const FS   = getFirestore(app);

// Force LOCAL persistence so sign-in survives cross-page navigation
setPersistence(auth, browserLocalPersistence)
  .catch(err => console.warn("[auth] persistence:", err.message));

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

// ─── CURRENT USER (module-level, updated by listener) ──────────
export let currentUser = null;

// Queue for auth-ready callbacks (handles race conditions)
let authReadyCallbacks = [];
export function onAuthReady(cb) {
  if (currentUser !== null) {
    // Already initialized, fire immediately
    cb(currentUser);
  } else {
    authReadyCallbacks.push(cb);
  }
}

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user && !user.isAnonymous) _ensureUserDoc(user);
  // Fire all registered callbacks
  authReadyCallbacks.forEach(cb => {
    try { cb(user); } catch (e) { console.error("[auth] callback error:", e); }
  });
  // Also fire legacy window.onAuthReady if it exists
  if (typeof window.onAuthReady === "function") {
    try { window.onAuthReady(user); } catch (e) { console.error("[auth] window.onAuthReady error:", e); }
  }
});

// ─── AUTH HELPERS ──────────────────────────────────────────────
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function fbSignOut() {
  return signOut(auth);
}

// Don't double-export signOut — fbSignOut above is the export

export function requireGoogleAuth(cb) {
  if (currentUser && !currentUser.isAnonymous) { cb(currentUser); return; }
  signInWithGoogle()
    .then(r => cb(r.user))
    .catch(e => showToast(e.message, "error"));
}

export function getDisplayName(u) {
  return u?.displayName || u?.email?.split("@")[0] || "Player";
}

// ─── FIRESTORE + RTDB USER DOC ─────────────────────────────────
async function _ensureUserDoc(user) {
  const docRef = doc(FS, "users", user.uid);
  const snap   = await getDoc(docRef);

  if (!snap.exists()) {
    await setDoc(docRef, {
      uid:           user.uid,
      displayName:   user.displayName || "Player",
      email:         user.email || "",
      photoURL:      user.photoURL || "",
      rating:        1200,
      gamesPlayed:   0, wins: 0, losses: 0, draws: 0,
      puzzlesSolved: 0, puzzlesFailed: 0, bestStreak: 0,
      joinedAt:      serverTimestamp(),
      lastSeen:      serverTimestamp()
    });
  } else {
    await updateDoc(docRef, {
      displayName: user.displayName || snap.data().displayName || "Player",
      email:       user.email       || snap.data().email       || "",
      photoURL:    user.photoURL    || snap.data().photoURL    || "",
      lastSeen:    serverTimestamp()
    });
  }

  // Mirror basics to Realtime DB (leaderboard)
  const d = snap.data() || {};
  await update(ref(DB, "users/" + user.uid), {
    uid:         user.uid,
    displayName: user.displayName || "Player",
    email:       user.email || "",
    photoURL:    user.photoURL || "",
    rating:      d.rating      || 1200,
    gamesPlayed: d.gamesPlayed || 0,
    wins:        d.wins        || 0,
    losses:      d.losses      || 0,
    draws:       d.draws       || 0
  });
}

// ─── GAME / PUZZLE STATS (Chess) ───────────────────────────────
export async function saveGameResult(myColor, result, opponentName, timeControl) {
  if (!currentUser || currentUser.isAnonymous) return;
  const uid   = currentUser.uid;
  const isWin = result.winner === myColor;
  const isDraw= result.winner === null;
  const isLoss= result.winner && result.winner !== myColor;

  const upd = { gamesPlayed: increment(1), lastSeen: serverTimestamp() };
  if (isWin)  upd.wins   = increment(1);
  if (isLoss) upd.losses = increment(1);
  if (isDraw) upd.draws  = increment(1);

  await updateDoc(doc(FS, "users", uid), upd);
  await addDoc(collection(FS, "gameHistory"), {
    uid, myColor,
    opponent:    opponentName || "Unknown",
    result:      isWin ? "win" : isDraw ? "draw" : "loss",
    reason:      result.reason || "normal",
    timeControl: timeControl || 0,
    ts:          serverTimestamp()
  });

  // Realtime DB transaction
  await runTransaction(ref(DB, "users/" + uid), u => {
    if (!u) return u;
    u.gamesPlayed = (u.gamesPlayed || 0) + 1;
    if (isWin)  u.wins   = (u.wins   || 0) + 1;
    if (isLoss) u.losses = (u.losses || 0) + 1;
    if (isDraw) u.draws  = (u.draws  || 0) + 1;
    return u;
  });
}

export async function savePuzzleStat(correct, streak) {
  const ls = JSON.parse(localStorage.getItem("cmPuzzleStats") || "{}");
  if (correct) {
    ls.solved      = (ls.solved || 0) + 1;
    ls.streak      = streak;
    ls.bestStreak  = Math.max(ls.bestStreak || 0, streak);
  } else {
    ls.failed = (ls.failed || 0) + 1;
    ls.streak = 0;
  }
  localStorage.setItem("cmPuzzleStats", JSON.stringify(ls));

  if (!currentUser || currentUser.isAnonymous) return;
  const upd = { lastSeen: serverTimestamp() };
  if (correct) upd.puzzlesSolved = increment(1);
  else         upd.puzzlesFailed = increment(1);

  const snap = await getDoc(doc(FS, "users", currentUser.uid));
  if ((ls.bestStreak || 0) > (snap.data()?.bestStreak || 0)) {
    upd.bestStreak = ls.bestStreak;
  }
  await updateDoc(doc(FS, "users", currentUser.uid), upd);
}

export async function getPuzzleStats() {
  const ls = JSON.parse(localStorage.getItem("cmPuzzleStats") || "{}");
  if (!currentUser || currentUser.isAnonymous) return ls;
  try {
    const snap = await getDoc(doc(FS, "users", currentUser.uid));
    const d    = snap.data() || {};
    return {
      solved:      Math.max(ls.solved      || 0, d.puzzlesSolved || 0),
      failed:      Math.max(ls.failed      || 0, d.puzzlesFailed || 0),
      bestStreak:  Math.max(ls.bestStreak  || 0, d.bestStreak    || 0),
      streak:      ls.streak || 0
    };
  } catch { return ls; }
}

// ─── TOAST (shared UI helper) ───────────────────────────────────
export function showToast(msg, type = "info", dur = 3500) {
  let c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity    = "0";
    t.style.transition = "opacity .3s";
    setTimeout(() => t.remove(), 300);
  }, dur);
}

// ─── UTILITY ───────────────────────────────────────────────────
export function randomCode(len = 6) {
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return s;
}
export function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtTimeSec(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
export function squareName(r, c) { return "abcdefgh"[c] + (8 - r); }
export function cloneBoard(bd)   { return bd.map(r => r.slice()); }

// Re-export raw SDK pieces Chess files might import directly
export {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  DB, FS
};
