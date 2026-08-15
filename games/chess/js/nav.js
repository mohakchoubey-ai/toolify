// ============================================================
// SHARED NAVIGATION — injected into every page
// ============================================================
(function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  const links = [
    { href:'play.html', label:'Play' },
    { href:'computer.html', label:'vs Computer' },
    { href:'puzzles.html', label:'Puzzles' },
    { href:'analysis.html', label:'Analysis' },
    { href:'leaderboard.html', label:'Leaderboard' },
    { href:'players.html', label:'Players' },
    { href:'games.html', label:'Games' },
  ];

  const linksHTML = links.map(l =>
    `<li><a href="${l.href}" class="${path===l.href?'active':''}">${l.label}</a></li>`
  ).join('');

  document.body.insertAdjacentHTML('afterbegin', `
<nav class="navbar">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">
      <span class="nav-logo-icon">♟</span>
      Check<span>Mate</span>
    </a>
    <ul class="nav-links">${linksHTML}</ul>
    <div class="nav-right">
      <div id="nav-auth-btns" style="display:flex;gap:8px;align-items:center">
        <a href="login.html" class="nav-btn nav-btn-ghost">Sign In</a>
        <a href="signup.html" class="nav-btn nav-btn-primary">Sign Up</a>
      </div>
      <div id="nav-user-menu" style="display:none;gap:8px;align-items:center">
        <span id="nav-user-name" style="font-size:.85rem;color:var(--t-2);font-weight:500"></span>
        <div id="nav-user-avatar"></div>
        <button onclick="signOut().then(()=>window.location.href='index.html')" class="nav-btn nav-btn-ghost" style="font-size:.8rem;padding:5px 12px">Sign Out</button>
      </div>
      <button class="nav-hamburger nav-icon-btn" id="nav-hamburger" onclick="toggleMobileMenu()" title="Menu">☰</button>
    </div>
  </div>
</nav>
<div class="mobile-menu" id="mobile-menu">
  ${links.map(l=>`<a href="${l.href}">${l.label}</a>`).join('')}
  <a href="settings.html">Settings</a>
  <a href="profile.html">Profile</a>
</div>
<div id="toast-container"></div>
  `);
})();

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// Close mobile menu on outside click
document.addEventListener('click', e => {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('nav-hamburger');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});