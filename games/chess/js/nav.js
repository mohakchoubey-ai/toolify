// ============================================================
// SHARED NAV — injected into every page, mobile bottom nav
// ============================================================
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const links = [
    {href:'play.html',label:'Play',icon:'♟'},
    {href:'computer.html',label:'Computer',icon:'🤖'},
    {href:'online.html',label:'Online',icon:'🌐'},
    {href:'puzzles.html',label:'Puzzles',icon:'🧩'},
    {href:'analysis.html',label:'Analysis',icon:'📊'},
    {href:'leaderboard.html',label:'Leaderboard',icon:'🏆'},
    {href:'games.html',label:'Games',icon:'📚'},
    {href:'players.html',label:'Players',icon:'👥'},
  ];
  const navLinks = links.map(l=>`<li><a href="${l.href}" class="${path===l.href?'active':''}">${l.label}</a></li>`).join('');
  // Mobile bottom nav — show 5 most important
  const mbnLinks = [
    {href:'index.html',label:'Home',icon:'🏠'},
    {href:'play.html',label:'Play',icon:'♟'},
    {href:'online.html',label:'Online',icon:'🌐'},
    {href:'puzzles.html',label:'Puzzles',icon:'🧩'},
    {href:'profile.html',label:'Profile',icon:'👤'},
  ].map(l=>`<a href="${l.href}" class="mbn-item${path===l.href?' active':''}"><span class="mbn-icon">${l.icon}</span><span class="mbn-label">${l.label}</span></a>`).join('');

  document.body.insertAdjacentHTML('afterbegin', `
<nav class="navbar">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo"><span class="nav-logo-icon">♟</span>Check<span>Mate</span></a>
    <ul class="nav-links">${navLinks}</ul>
    <div class="nav-right">
      <div id="nav-auth-btns" style="display:flex;gap:6px;align-items:center">
        <a href="login.html" class="nav-btn nav-btn-ghost">Sign In</a>
        <a href="signup.html" class="nav-btn nav-btn-primary">Sign Up</a>
      </div>
      <div id="nav-user-menu" style="display:none;gap:8px;align-items:center">
        <span id="nav-user-name" style="font-size:.82rem;color:var(--t-2);font-weight:500;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
        <div id="nav-user-avatar"></div>
        <button onclick="signOut().then(()=>window.location.href='index.html')" class="nav-btn nav-btn-ghost" style="font-size:.78rem;padding:4px 10px">Sign Out</button>
      </div>
      <button class="nav-hamburger" id="nav-hamburger" onclick="toggleSlideMenu()" title="Menu">☰</button>
    </div>
  </div>
</nav>

<!-- Mobile slide-in menu -->
<div class="slide-menu-overlay" id="slide-overlay" onclick="closeSlideMenu()"></div>
<div class="mobile-slide-menu" id="mobile-slide-menu">
  <div class="msm-user" id="msm-user-section" style="display:none">
    <div class="msm-avatar" id="msm-avatar">?</div>
    <div><div class="msm-name" id="msm-name">Player</div><div class="msm-email" id="msm-email"></div></div>
  </div>
  <div class="msm-section">
    <div class="msm-label">Play</div>
    <div class="msm-links">
      <a href="play.html"><span class="msm-icon">♟</span>Play Chess</a>
      <a href="online.html"><span class="msm-icon">🌐</span>Play Online</a>
      <a href="computer.html"><span class="msm-icon">🤖</span>vs Computer</a>
      <a href="puzzles.html"><span class="msm-icon">🧩</span>Puzzles</a>
      <a href="analysis.html"><span class="msm-icon">📊</span>Analysis</a>
    </div>
  </div>
  <div class="msm-section">
    <div class="msm-label">Community</div>
    <div class="msm-links">
      <a href="leaderboard.html"><span class="msm-icon">🏆</span>Leaderboard</a>
      <a href="games.html"><span class="msm-icon">📚</span>Game History</a>
      <a href="players.html"><span class="msm-icon">👥</span>Players</a>
    </div>
  </div>
  <div class="msm-section">
    <div class="msm-label">Account</div>
    <div class="msm-links">
      <a href="profile.html"><span class="msm-icon">👤</span>Profile</a>
      <a href="settings.html"><span class="msm-icon">⚙️</span>Settings</a>
      <a href="login.html" id="msm-login-link"><span class="msm-icon">🔑</span>Sign In</a>
    </div>
  </div>
   <div class="msm-section">
    <div class="msm-label">Account</div>
    <div class="msm-links">
      <a href="profile.html"><span class="msm-icon">👤</span>Profile</a>
      <a href="settings.html"><span class="msm-icon">⚙️</span>Settings</a>
      <a href="login.html" id="msm-login-link"><span class="msm-icon">🔑</span>Sign In</a>
      <a href="#" id="msm-logout-link" style="display:none" onclick="signOut().then(()=>location.href='index.html');return false"><span class="msm-icon">🚪</span>Sign Out</a>
    </div>
  </div>
  </div>
</div>

<!-- Mobile bottom nav -->
<nav class="mobile-bottom-nav">${mbnLinks}</nav>

<div id="toast-container"></div>
  `);
})();

function toggleSlideMenu(){
  const m=document.getElementById('mobile-slide-menu');
  const o=document.getElementById('slide-overlay');
  const isOpen=m.classList.contains('open');
  m.classList.toggle('open',!isOpen);
  o.classList.toggle('open',!isOpen);
}
function closeSlideMenu(){
  document.getElementById('mobile-slide-menu')?.classList.remove('open');
  document.getElementById('slide-overlay')?.classList.remove('open');
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSlideMenu(); });