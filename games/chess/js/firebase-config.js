// ============================================================
// FIREBASE CONFIGURATION — shared across all pages
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAoj4yHcaRW4wdOPA7SrZhGQZqAobHDdB0",
  authDomain: "toolbox-hub-98c03.firebaseapp.com",
  databaseURL: "https://toolbox-hub-98c03-default-rtdb.firebaseio.com",
  projectId: "toolbox-hub-98c03",
  storageBucket: "toolbox-hub-98c03.firebasestorage.app",
  messagingSenderId: "321020105472",
  appId: "1:321020105472:web:698ba3bf9dfe75add859e5"
};

if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
const DB = firebase.database();
const AUTH = firebase.auth();
const GoogleProvider = new firebase.auth.GoogleAuthProvider();
GoogleProvider.addScope('profile');
GoogleProvider.addScope('email');

let currentUser = null;

AUTH.onAuthStateChanged(user => {
  currentUser = user;
  updateNavUser(user);
  if (typeof onAuthReady === 'function') onAuthReady(user);
});

function signInWithGoogle() {
  return AUTH.signInWithPopup(GoogleProvider);
}
function signOut() {
  return AUTH.signOut().then(() => { showToast('Signed out successfully', 'info'); });
}
function requireGoogleAuth(callback) {
  if (currentUser && !currentUser.isAnonymous) {
    callback(currentUser);
  } else {
    signInWithGoogle()
      .then(result => callback(result.user))
      .catch(err => showToast('Sign in failed. Try again.', 'error'));
  }
}
function getDisplayName(user) {
  if (!user) return 'Guest';
  return user.displayName || user.email?.split('@')[0] || 'Player';
}

function updateNavUser(user) {
  const authBtns = document.getElementById('nav-auth-btns');
  const userMenu = document.getElementById('nav-user-menu');
  const userAvatarWrap = document.getElementById('nav-user-avatar');
  const userName = document.getElementById('nav-user-name');
  if (!authBtns && !userMenu) return;
  if (user && !user.isAnonymous) {
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userAvatarWrap) {
      if (user.photoURL) {
        userAvatarWrap.innerHTML = `<img src="${user.photoURL}" class="nav-avatar" alt="avatar" onclick="window.location.href='profile.html'" title="${getDisplayName(user)}">`;
      } else {
        const initials = getDisplayName(user).slice(0, 2).toUpperCase();
        userAvatarWrap.innerHTML = `<div class="nav-avatar-placeholder" onclick="window.location.href='profile.html'" title="${getDisplayName(user)}">${initials}</div>`;
      }
    }
    if (userName) userName.textContent = getDisplayName(user);
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// ---- TOAST ----
function showToast(msg, type = 'info', duration = 3500) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ---- UTILS ----
function randomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTimeSec(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function squareName(r, c) { return 'abcdefgh'[c] + (8 - r); }
function cloneBoard(bd) { return bd.map(row => row.slice()); }

// Save user profile to Firebase
function saveUserProfile(user) {
  if (!user || user.isAnonymous) return;
  const ref = DB.ref('users/' + user.uid);
  ref.once('value').then(snap => {
    const existing = snap.val() || {};
    ref.update({
      uid: user.uid,
      displayName: user.displayName || 'Player',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastSeen: firebase.database.ServerValue.TIMESTAMP,
      joinedAt: existing.joinedAt || firebase.database.ServerValue.TIMESTAMP,
      gamesPlayed: existing.gamesPlayed || 0,
      wins: existing.wins || 0,
      losses: existing.losses || 0,
      draws: existing.draws || 0,
      rating: existing.rating || 1200,
    });
  });
}

AUTH.onAuthStateChanged(user => {
  if (user && !user.isAnonymous) saveUserProfile(user);
});