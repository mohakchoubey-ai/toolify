// ============================================================
// FIREBASE CONFIG — Realtime DB (live sync) + Firestore (profiles/history)
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAoj4yHcaRW4wdOPA7SrZhGQZqAobHDdB0",
  authDomain: "toolbox-hub-98c03.firebaseapp.com",
  databaseURL: "https://toolbox-hub-98c03-default-rtdb.firebaseio.com",
  projectId: "toolbox-hub-98c03",
  storageBucket: "toolbox-hub-98c03.firebasestorage.app",
  messagingSenderId: "321020105472",
  appId: "1:321020105472:web:698ba3bf9dfe75add859e5"
};
if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const DB   = firebase.database();
const FS   = firebase.firestore();
const AUTH = firebase.auth();
// Set explicit persistence so auth survives page navigation
AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(err => console.warn('Persistence init:', err.message));
const GoogleProvider = new firebase.auth.GoogleAuthProvider();
GoogleProvider.addScope('profile'); GoogleProvider.addScope('email');
let currentUser = null;
AUTH.onAuthStateChanged(user => {
  currentUser = user;
  updateNavUser(user);
  if (user && !user.isAnonymous) _ensureUserDoc(user);
  if (typeof onAuthReady === 'function') onAuthReady(user);
});
function signInWithGoogle(){ return AUTH.signInWithPopup(GoogleProvider); }
function signOut(){ return AUTH.signOut().then(()=>showToast('Signed out','info')); }
function requireGoogleAuth(cb){
  if(currentUser&&!currentUser.isAnonymous){cb(currentUser);return;}
  signInWithGoogle().then(r=>cb(r.user)).catch(e=>showToast(e.message,'error'));
}
function getDisplayName(u){ return u?.displayName||u?.email?.split('@')[0]||'Player'; }
function _ensureUserDoc(user){
  const ref=FS.collection('users').doc(user.uid);
  ref.get().then(snap=>{
    if(!snap.exists){
      ref.set({uid:user.uid,displayName:user.displayName||'Player',email:user.email||'',photoURL:user.photoURL||'',rating:1200,gamesPlayed:0,wins:0,losses:0,draws:0,puzzlesSolved:0,puzzlesFailed:0,bestStreak:0,joinedAt:firebase.firestore.FieldValue.serverTimestamp(),lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
    } else {
      ref.update({displayName:user.displayName||snap.data().displayName||'Player',email:user.email||snap.data().email||'',photoURL:user.photoURL||snap.data().photoURL||'',lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
    }
    // Mirror to Realtime DB for leaderboard
    const d=snap.data()||{};
    DB.ref('users/'+user.uid).update({uid:user.uid,displayName:user.displayName||'Player',email:user.email||'',photoURL:user.photoURL||'',rating:d.rating||1200,gamesPlayed:d.gamesPlayed||0,wins:d.wins||0,losses:d.losses||0,draws:d.draws||0});
  });
}
function saveGameResult(myColor, result, opponentName, timeControl){
  if(!currentUser||currentUser.isAnonymous) return;
  const uid=currentUser.uid, inc=firebase.firestore.FieldValue.increment;
  const isWin=result.winner===myColor, isDraw=result.winner===null, isLoss=result.winner&&result.winner!==myColor;
  const upd={gamesPlayed:inc(1),lastSeen:firebase.firestore.FieldValue.serverTimestamp()};
  if(isWin) upd.wins=inc(1); if(isLoss) upd.losses=inc(1); if(isDraw) upd.draws=inc(1);
  FS.collection('users').doc(uid).update(upd);
  FS.collection('gameHistory').add({uid,myColor,opponent:opponentName||'Unknown',result:isWin?'win':isDraw?'draw':'loss',reason:result.reason||'normal',timeControl:timeControl||0,ts:firebase.firestore.FieldValue.serverTimestamp()});
  DB.ref('users/'+uid).transaction(u=>{
    if(!u) return u;
    u.gamesPlayed=(u.gamesPlayed||0)+1;
    if(isWin) u.wins=(u.wins||0)+1; if(isLoss) u.losses=(u.losses||0)+1; if(isDraw) u.draws=(u.draws||0)+1;
    return u;
  });
}
function savePuzzleStat(correct, streak){
  // Always save to localStorage
  const ls=JSON.parse(localStorage.getItem('cmPuzzleStats')||'{}');
  if(correct){ls.solved=(ls.solved||0)+1;ls.streak=streak;ls.bestStreak=Math.max(ls.bestStreak||0,streak);}
  else{ls.failed=(ls.failed||0)+1;ls.streak=0;}
  localStorage.setItem('cmPuzzleStats',JSON.stringify(ls));
  // Firestore if signed in
  if(!currentUser||currentUser.isAnonymous) return;
  const inc=firebase.firestore.FieldValue.increment;
  const upd={lastSeen:firebase.firestore.FieldValue.serverTimestamp()};
  if(correct){upd.puzzlesSolved=inc(1);} else{upd.puzzlesFailed=inc(1);}
  // best streak: fetch and update if needed
  FS.collection('users').doc(currentUser.uid).get().then(snap=>{
    const cur=snap.data()?.bestStreak||0;
    if((ls.bestStreak||0)>cur) upd.bestStreak=ls.bestStreak;
    FS.collection('users').doc(currentUser.uid).update(upd);
  });
}
async function getPuzzleStats(){
  const ls=JSON.parse(localStorage.getItem('cmPuzzleStats')||'{}');
  if(!currentUser||currentUser.isAnonymous) return ls;
  try{
    const snap=await FS.collection('users').doc(currentUser.uid).get();
    const d=snap.data()||{};
    return{solved:Math.max(ls.solved||0,d.puzzlesSolved||0),failed:Math.max(ls.failed||0,d.puzzlesFailed||0),bestStreak:Math.max(ls.bestStreak||0,d.bestStreak||0),streak:ls.streak||0};
  } catch(e){return ls;}
}
function updateNavUser(user){
  const authBtns=document.getElementById('nav-auth-btns');
  const userMenu=document.getElementById('nav-user-menu');
  const avatarWrap=document.getElementById('nav-user-avatar');
  const nameEl=document.getElementById('nav-user-name');
  const msmUser=document.getElementById('msm-user-section');
  if(user&&!user.isAnonymous){
    if(authBtns) authBtns.style.display='none';
    if(userMenu) userMenu.style.display='flex';
    if(avatarWrap) avatarWrap.innerHTML=user.photoURL?`<img src="${user.photoURL}" class="nav-avatar" onclick="location.href='profile.html'">`:`<div class="nav-avatar-placeholder" onclick="location.href='profile.html'">${getDisplayName(user).slice(0,2).toUpperCase()}</div>`;
    if(nameEl) nameEl.textContent=getDisplayName(user);
    if(msmUser){
      msmUser.style.display='flex';
      const av=document.getElementById('msm-avatar'); if(av) av.innerHTML=user.photoURL?`<img src="${user.photoURL}" alt="">`:getDisplayName(user).slice(0,2).toUpperCase();
      const mn=document.getElementById('msm-name'); if(mn) mn.textContent=getDisplayName(user);
      const me=document.getElementById('msm-email'); if(me) me.textContent=user.email||'';
    }
  } else {
    if(authBtns) authBtns.style.display='flex';
    if(userMenu) userMenu.style.display='none';
    if(msmUser) msmUser.style.display='none';
    // ✓ NEW: Hide sign out, show sign in in mobile menu
    const msmLogout=document.getElementById('msm-logout-link');
    const msmLogin=document.getElementById('msm-login-link');
    if(msmLogout) msmLogout.style.display='none';
    if(msmLogin) msmLogin.style.display='block';
  }
}
function showToast(msg,type='info',dur=3500){
  let c=document.getElementById('toast-container');
  if(!c){c=document.createElement('div');c.id='toast-container';document.body.appendChild(c);}
  const t=document.createElement('div'); t.className=`toast ${type}`; t.textContent=msg;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),300);},dur);
}
function randomCode(len=6){const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<len;i++)s+=ch[Math.floor(Math.random()*ch.length)];return s;}
function fmtDate(ts){const d=ts?.toDate?ts.toDate():new Date(ts||Date.now());return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
function fmtTimeSec(s){const m=Math.floor(s/60),sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function squareName(r,c){return 'abcdefgh'[c]+(8-r);}
function cloneBoard(bd){return bd.map(r=>r.slice());}