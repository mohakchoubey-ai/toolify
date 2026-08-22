// ══════════════════════════════════════════
//  LIVE USERS TRACKER
//  Tracks active users, their emails, last tool used
//  Real-time Firebase Realtime DB integration
// ══════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const db = getDatabase(app);

// ─── TRACK CURRENT USER ──────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Skip tracking for mohakchoubey@gmail.com (as requested)
    if (user.email === "mohakchoubey@gmail.com") return;

    const userId = user.uid;
    const userRef = ref(db, `liveUsers/${userId}`);

    // Set user data on auth
    set(userRef, {
      email: user.email,
      displayName: user.displayName || "User",
      avatar: user.photoURL || "",
      lastTool: "dashboard",
      lastActive: serverTimestamp(),
      status: "online"
    });

    // Track tool clicks
    trackToolClicks(userId, userRef);

    // Remove user on disconnect (30s idle = offline)
    setTimeout(() => {
      window.addEventListener("beforeunload", () => {
        remove(userRef);
      });
    }, 100);

    // Soft offline after 5 mins idle
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        set(userRef, {
          email: user.email,
          displayName: user.displayName || "User",
          avatar: user.photoURL || "",
          lastTool: "dashboard",
          lastActive: serverTimestamp(),
          status: "idle"
        });
      }, 5 * 60 * 1000); // 5 minutes
    };

    document.addEventListener("click", resetIdleTimer);
    document.addEventListener("mousemove", resetIdleTimer);
    resetIdleTimer();
  }
});

// ─── TRACK TOOL CLICKS ──────────────────
function trackToolClicks(userId, userRef) {
  const toolCards = document.querySelectorAll(".card");
  toolCards.forEach((card) => {
    card.addEventListener("click", () => {
      const toolName = card.querySelector("h4")?.textContent?.trim() || "Unknown";
      set(userRef, {
        email: auth.currentUser?.email,
        displayName: auth.currentUser?.displayName || "User",
        avatar: auth.currentUser?.photoURL || "",
        lastTool: toolName,
        lastActive: serverTimestamp(),
        status: "online"
      });
    });
  });
}

// ─── LIVE USERS WIDGET ──────────────────
export function initLiveUsersWidget(containerSelector = ".dash-main") {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Create widget HTML
  const widget = document.createElement("div");
  widget.id = "live-users-widget";
  widget.className = "live-users-widget";
  widget.innerHTML = `
    <div class="live-widget-header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="live-dot"></span>
        <span class="live-title">Live Users Now</span>
      </div>
      <span class="live-count">0</span>
    </div>
    <div class="live-users-list" id="liveUsersList">
      <div class="live-empty">No active users</div>
    </div>
  `;

  // Insert after welcome section
  const welcomeSection = container.querySelector(".dash-welcome");
  if (welcomeSection) {
    welcomeSection.parentNode.insertBefore(widget, welcomeSection.nextSibling);
  }

  // Listen to live users
  const liveUsersRef = ref(db, "liveUsers");
  onValue(liveUsersRef, (snapshot) => {
    const users = snapshot.val() || {};
    const userList = document.getElementById("liveUsersList");
    const liveCount = document.querySelector(".live-count");

    // Filter out mohakchoubey@gmail.com
    const filteredUsers = Object.entries(users).filter(
      ([_, userData]) => userData.email !== "mohakchoubey@gmail.com"
    );

    liveCount.textContent = filteredUsers.length;

    if (filteredUsers.length === 0) {
      userList.innerHTML = '<div class="live-empty">No active users</div>';
      return;
    }

    userList.innerHTML = filteredUsers
      .map(([uid, userData]) => {
        const statusClass = userData.status === "idle" ? "status-idle" : "status-online";
        const toolDisplay = userData.lastTool || "dashboard";
        const timeAgo = getTimeAgo(userData.lastActive);

        return `
          <div class="live-user-item">
            <div class="user-avatar" style="background-image: url('${userData.avatar}')">
              ${!userData.avatar ? userData.displayName.charAt(0).toUpperCase() : ""}
            </div>
            <div class="user-info">
              <div class="user-email">${maskEmail(userData.email)}</div>
              <div class="user-tool">Using <strong>${toolDisplay}</strong></div>
              <div class="user-time">${timeAgo}</div>
            </div>
            <div class="user-status ${statusClass}"></div>
          </div>
        `;
      })
      .join("");
  });
}

// ─── HELPERS ─────────────────────────────
function maskEmail(email) {
  const [local, domain] = email.split("@");
  const masked = local.charAt(0) + "*".repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${masked}@${domain}`;
}

function getTimeAgo(timestamp) {
  if (!timestamp) return "now";
  const now = Date.now();
  const then = timestamp;
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Auto-init on dashboard
if (document.getElementById("dashboard-screen")?.classList.contains("hidden") === false) {
  initLiveUsersWidget();
}
