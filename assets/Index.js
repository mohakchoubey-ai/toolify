import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
    authDomain: "toolbox-hub-98c03.firebaseapp.com",
    projectId: "toolbox-hub-98c03",
    appId: "1:321020105472:web:356e7c2903def7b9d859e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// EXPOSE FUNCTIONS TO WINDOW
window.openFeedback = () => {
    document.getElementById('feedback-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('sidebar').classList.remove('active');
};

window.closeFeedback = () => {
    document.getElementById('feedback-modal').classList.remove('active');
    document.body.style.overflow = '';
};

window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

window.signIn = async () => {
    try { 
        await signInWithPopup(auth, provider); 
        document.getElementById('sidebar').classList.remove('active');
        document.body.style.overflow = '';
    } catch(e) { console.error('Sign in error:', e); }
};

window.logout = async () => {
    try { await signOut(auth); location.reload(); } catch(e) { console.error('Logout error:', e); }
};

// FORM HANDLING
const form = document.getElementById("my-form");
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("my-form-status");
    const data = new FormData(event.target);
    try {
        const response = await fetch(event.target.action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            status.innerHTML = "Thanks for your submission! 🎉";
            status.style.color = "var(--primary)";
            form.reset();
            setTimeout(() => window.closeFeedback(), 2000);
        } else {
            status.innerHTML = "Oops! Problem submitting form.";
            status.style.color = "#ff4444";
        }
    } catch (error) {
        status.innerHTML = "Connection Error!";
        status.style.color = "#ff4444";
    }
});

// AUTH STATE OBSERVER
onAuthStateChanged(auth, (user) => {
    const mainAuthUI = document.getElementById('main-auth-ui');
    const authHeader = document.getElementById('auth-header-area');
    const addAccountSide = document.getElementById('add-account-container');
    const landingPage = document.getElementById('landing-page');
    const dashboard = document.getElementById('dashboard');
    const bgVideo = document.getElementById('bg-video');

    if (user) {
        authHeader.innerHTML = `
            <div class="auth-profile-wrap">
                <img src="${user.photoURL || ''}" alt="Profile" class="user-img">
                <span style="font-weight:600; margin: 0 10px;">${user.displayName || 'User'}</span>
                <button class="btn btn-logout" onclick="logout()">Sign Out</button>
            </div>
        `;
        landingPage.classList.add('hide-page');
        dashboard.classList.add('show-page');
        if(bgVideo) bgVideo.classList.add('blurred');
        addAccountSide.style.display = 'block'; 
    } else {
        authHeader.innerHTML = `<button class="btn btn-primary" onclick="signIn()">Sign In</button>`;
        mainAuthUI.innerHTML = `<button class="btn btn-primary" onclick="signIn()">Sign In with Google</button>`;
        landingPage.classList.remove('hide-page');
        dashboard.classList.remove('show-page');
        if(bgVideo) bgVideo.classList.remove('blurred');
        addAccountSide.style.display = 'none';
    }
});

// VIDEO HANDLING
const video = document.getElementById('bg-video');
const fallback = document.getElementById('bg-video-fallback');
if(video) {
    video.onplay = () => { fallback.style.display = 'none'; video.style.opacity = '1'; };
    video.onerror = () => { video.style.display = 'none'; fallback.style.display = 'block'; };
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        document.getElementById('sidebar').classList.remove('active');
        document.body.style.overflow = '';
    }
});
