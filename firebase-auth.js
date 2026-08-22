// ══════════════════════════════════════════
//  FIREBASE-AUTH.JS
//  Firebase Initialization & Auth Exports
// ══════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
    authDomain: "toolbox-hub-98c03.firebaseapp.com",
    projectId: "toolbox-hub-98c03",
    storageBucket: "toolbox-hub-98c03.firebasestorage.app",
    messagingSenderId: "321020105472",
    appId: "1:321020105472:web:356e7c2903def7b9d859e5",
    databaseURL: "https://toolbox-hub-98c03-default-rtdb.firebaseio.com"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export auth instance and helper functions for use in protect.js & login.js
export {
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    googleProvider,
    signInWithPopup
};
