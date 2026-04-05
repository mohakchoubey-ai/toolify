import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyAeHDhdiTRwftUGYgrb1m19v7hm2R5rb-Y",
    authDomain: "toolbox-hub-98c03.firebaseapp.com",
    projectId: "toolbox-hub-98c03",
    appId: "1:321020105472:web:356e7c2903def7b9d859e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- UI EXPOSED FUNCTIONS ---

window.signIn = async () => {
    try { 
        await signInWithPopup(auth, provider); 
    } catch(e) { 
        console.error('Sign in error:', e); 
    }
};

window.logout = async () => {
    try { 
        await signOut(auth); 
        location.reload(); 
    } catch(e) { 
        console.error('Logout error:', e); 
    }
};

window.openFeedback = () => {
    document.getElementById('feedback-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeFeedback = () => {
    document.getElementById('feedback-modal').classList.remove('active');
    document.body.style.overflow = '';
};

// --- AUTH STATE OBSERVER ---
onAuthStateChanged(auth, (user) => {
    const mainAuthUI = document.getElementById('main-auth-ui');
    const authHeader = document.getElementById('auth-header-area');
    const landingPage = document.getElementById('landing-page');
    const dashboard = document.getElementById('dashboard');
    const bgVideo = document.getElementById('bg-video');

    if (user) {
        // Update Header with Profile Info
        authHeader.innerHTML = `
            <div class="auth-profile-wrap" style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right; line-height: 1.2;">
                    <div style="font-weight: 800; font-size: 0.85rem; color: var(--primary);">${user.displayName || 'User'}</div>
                    <span onclick="logout()" style="font-size: 0.7rem; cursor: pointer; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">Sign Out</span>
                </div>
                <img src="${user.photoURL || ''}" alt="Profile" class="user-img" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary);">
            </div>
        `;
        
        // Navigation Logic
        landingPage.classList.add('hide-page');
        dashboard.classList.add('show-page');
        if(bgVideo) bgVideo.classList.add('blurred');
        
    } else {
        // Show Sign In Button if Logged Out
        authHeader.innerHTML = `<button class="btn btn-primary" onclick="signIn()">Sign In</button>`;
        mainAuthUI.innerHTML = `<button class="btn btn-primary" onclick="signIn()" style="padding: 15px 40px; font-size: 1.1rem;">Get Started with Google</button>`;
        
        landingPage.classList.remove('hide-page');
        dashboard.classList.remove('show-page');
        if(bgVideo) bgVideo.classList.remove('blurred');
    }
});

// --- FEEDBACK FORM HANDLING ---
const form = document.getElementById("my-form");
if(form) {
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
                status.innerHTML = "Thanks for your feedback! 🎉";
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
}

// --- VIDEO INITIALIZATION ---
const video = document.getElementById('bg-video');
const fallback = document.getElementById('bg-video-fallback');
if(video) {
    video.onplay = () => { 
        if(fallback) fallback.style.display = 'none'; 
        video.style.opacity = '0.5'; 
    };
    video.onerror = () => { 
        video.style.display = 'none'; 
        if(fallback) fallback.style.display = 'block'; 
    };
}
