// Firebase is globally available from the script tags

// ─── DOM ELEMENTS ───────────────────
const landingScreen = document.getElementById("landing-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const userNameEl = document.getElementById("user-name");
const greetNameEl = document.getElementById("greet-name");
const userAvatar = document.getElementById("user-avatar");
const timeOfDayEl = document.getElementById("time-of-day");

// ─── SHOW DASHBOARD ───────────────────
function showDashboard(user) {
  if (!landingScreen || !dashboardScreen) return;
  
  landingScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");

  const firstName = (user.displayName || "Creator").split(" ")[0];
  if (userNameEl) userNameEl.textContent = firstName;
  if (greetNameEl) greetNameEl.textContent = firstName;

  if (user.photoURL && userAvatar) {
    userAvatar.src = user.photoURL;
    userAvatar.style.display = "block";
  } else if (userAvatar) {
    userAvatar.style.display = "none";
  }

  const hour = new Date().getHours();
  if (timeOfDayEl) {
    if (hour < 12) timeOfDayEl.textContent = "morning";
    else if (hour < 17) timeOfDayEl.textContent = "afternoon";
    else if (hour < 21) timeOfDayEl.textContent = "evening";
    else timeOfDayEl.textContent = "night";
  }
}

// ─── AUTH LISTENER ───────────────────
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  showDashboard(user);
});
