    <script> 
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("SW registered"))
    .catch(err => console.error("SW error", err));
}
</script>
<script type="module">
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

        // FEEDBACK FUNCTIONS
        window.openFeedback = () => {
            document.getElementById('feedback-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
            document.getElementById('sidebar').classList.remove('active');
        };

        window.closeFeedback = () => {
            document.getElementById('feedback-modal').classList.remove('active');
            document.body.style.overflow = '';
        };

        // FORMSPIRE FORM HANDLER
        var form = document.getElementById("my-form");
        async function handleSubmit(event) {
            event.preventDefault();
            var status = document.getElementById("my-form-status");
            var data = new FormData(event.target);
            fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            }).then(response => {
                if (response.ok) {
                    status.innerHTML = "Thanks for your submission! 🎉";
                    status.style.color = "var(--primary)";
                    form.reset();
                    setTimeout(() => closeFeedback(), 2000);
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                        } else {
                            status.innerHTML = "Oops! There was a problem submitting your form";
                        }
                        status.style.color = "#ff4444";
                    });
                }
            }).catch(error => {
                status.innerHTML = "Oops! There was a problem submitting your form";
                status.style.color = "#ff4444";
            });
        }
        form.addEventListener("submit", handleSubmit);

    // Optimized Video handling
const video = document.getElementById('bg-video');
const fallback = document.getElementById('bg-video-fallback');

// If the video plays, make sure fallback is hidden
video.onplay = () => {
    fallback.style.display = 'none';
    video.style.opacity = '1';
};

// If the video fails, show the fallback image immediately
video.onerror = () => {
    console.error("Video failed to load.");
    video.style.display = 'none';
    fallback.style.display = 'block';
};

        window.toggleMenu = () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        };

        window.enterAsGuest = () => {
            document.getElementById('landing-page').classList.add('hide-page');
            document.getElementById('dashboard').classList.add('show-page');
            document.getElementById('bg-video').classList.add('blurred');
            document.getElementById('sidebar').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.signIn = async () => {
            try { 
                await signInWithPopup(auth, provider); 
                document.getElementById('sidebar').classList.remove('active');
                document.body.style.overflow = '';
            } catch(e) { 
                console.error('Sign in error:', e); 
                alert('Sign in failed. Please try again.');
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

        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.querySelector('.menu-toggle');
            if (window.innerWidth <= 1024 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        onAuthStateChanged(auth, (user) => {
            const mainAuthUI = document.getElementById('main-auth-ui');
            const authHeader = document.getElementById('auth-header-area');
            const addAccountSide = document.getElementById('add-account-container');

            if (user) {
                enterAsGuest();
                authHeader.innerHTML = `
                    <div class="auth-profile-wrap">
                        <img src="${user.photoURL || 'https://via.placeholder.com/38?text=👤'}" alt="Profile" class="user-img" width="38" height="38" onerror="this.src='https://via.placeholder.com/38?text=👤'">
                        <span style="font-weight:600; max-width:150px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${user.displayName || 'User'}</span>
                        <button class="btn btn-logout" onclick="logout()">Sign Out</button>
                    </div>
                `;
                addAccountSide.style.display = 'block'; 
            } else {
                authHeader.innerHTML = `<button class="btn btn-primary" onclick="signIn()">Sign In</button>`;
                mainAuthUI.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:16px; max-width:300px; margin:0 auto;">
                        <button class="btn btn-primary" onclick="signIn()">Sign In with Google</button>
                        <button class="btn btn-guest" onclick="enterAsGuest()">Continue as Guest</button>
                    </div>
                `;
                addAccountSide.style.display = 'none';
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                document.getElementById('sidebar').classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    </script>
