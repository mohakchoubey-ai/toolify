
// ─── 8. SHOW DASHBOARD ───────────────────
function showDashboard(user) {
  landingScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");

  // Populate user info
  const firstName = (user.displayName || "Creator").split(" ")[0];
  userNameEl.textContent  = firstName;
  greetNameEl.textContent = firstName;

  if (user.photoURL) {
    userAvatar.src = user.photoURL;
    userAvatar.style.display = "block";
  } else {
    userAvatar.style.display = "none";
  }

  // Time-of-day greeting
  const hour = new Date().getHours();
  if (hour < 12)       timeOfDayEl.textContent = "morning";
  else if (hour < 17)  timeOfDayEl.textContent = "afternoon";
  else if (hour < 21)  timeOfDayEl.textContent = "evening";
  else                 timeOfDayEl.textContent  = "night";
}
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load user data
  const firstName = (user.displayName || "Creator").split(" ")[0];

  userNameEl.textContent = firstName;
  greetNameEl.textContent = firstName;

  if (user.photoURL) {
    userAvatar.src = user.photoURL;
  }


// ─── 9. TOOL LINK GUARD ──────────────────
// Any card click checks auth before navigating.
// If user is somehow not logged in, redirect to index (this page).
document.querySelectorAll("#dashboard-screen .card").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (!auth.currentUser) {
      e.preventDefault();
      showLanding();
    }
    // Otherwise navigation proceeds naturally
  });
