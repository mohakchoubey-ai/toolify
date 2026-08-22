// ══════════════════════════════════════════
//  FIREBASE-AUTH.JS
//  Firebase initialization and auth exports
// ══════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
  authDomain: "toolbox-hub-98c03.firebaseapp.com",
  projectId: "toolbox-hub-98c03",
  storageBucket: "toolbox-hub-98c03.firebasestorage.app",
  messagingSenderId: "321020105472",
  appId: "1:321020105472:web:356e7c2903def7b9d859e5",
  databaseURL: "https://toolbox-hub-98c03-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, onAuthStateChanged, fbSignOut };
