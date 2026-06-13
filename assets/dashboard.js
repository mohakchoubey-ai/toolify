import { auth } from "./firebase-auth.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── SHOW DASHBOARD ───────────────────
function showDashboard(user) {
  landingScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");

  const firstName = (user.displayName || "Creator").split(" ")[0];
  userNameEl.textContent = firstName;
  greetNameEl.textContent = firstName;

  if (user.photoURL) {
    userAvatar.src = user.photoURL;
    userAvatar.style.display = "block";
  } else {
    userAvatar.style.display = "none";
  }

  const hour = new Date().getHours();
  if (hour < 12) timeOfDayEl.textContent = "morning";
  else if (hour < 17) timeOfDayEl.textContent = "afternoon";
  else if (hour < 21) timeOfDayEl.textContent = "evening";
  else timeOfDayEl.textContent = "night";
}

// ─── AUTH LISTENER ───────────────────
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  showDashboard(user);
});
