/**
 * NEON DISTRICT - main.js
 * Game bootstrap and module orchestration
 */

import { Game } from './engine/world.js';
import { AudioManager } from './engine/audio.js';
import { SaveSystem } from './systems/save.js';
import { SettingsUI } from './ui/settingsUI.js';
import { Notifications } from './ui/notifications.js';

// ────────────────────────────────────────────────
// Global game instance
// ────────────────────────────────────────────────
let game = null;

// ────────────────────────────────────────────────
// Boot sequence
// ────────────────────────────────────────────────
async function boot() {
  const loadingBar  = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');

  const setProgress = (pct, msg) => {
    loadingBar.style.width = pct + '%';
    loadingText.textContent = msg;
  };

  setProgress(5, 'Initializing audio engine...');
  await sleep(80);

  const audio = new AudioManager();
  await audio.init();
  setProgress(15, 'Loading world generator...');
  await sleep(80);

  setProgress(30, 'Building city districts...');
  await sleep(100);

  setProgress(50, 'Spawning entities...');
  await sleep(80);

  setProgress(65, 'Calibrating physics...');
  await sleep(80);

  setProgress(80, 'Wiring UI systems...');
  await sleep(80);

  setProgress(92, 'Patching cybernetics...');
  await sleep(100);

  setProgress(100, 'System online.');
  await sleep(300);

  // Check for existing save
  const hasSave = SaveSystem.hasSave();
  if (hasSave) {
    document.getElementById('btnContinue').disabled = false;
  }

  // Fade loading screen
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add('fade-out');
  await sleep(500);
  loadingScreen.style.display = 'none';

  // Store audio globally
  window._audioManager = audio;

  // Setup menu
  setupMainMenu(audio, hasSave);
}

// ────────────────────────────────────────────────
// Main menu wiring
// ────────────────────────────────────────────────
function setupMainMenu(audio, hasSave) {
  const mainMenu  = document.getElementById('mainMenu');
  const pauseMenu = document.getElementById('pauseMenu');

  document.getElementById('btnNewGame').addEventListener('click', () => {
    audio.playSFX('click');
    mainMenu.classList.remove('active');
    startGame(audio, false);
  });

  document.getElementById('btnContinue').addEventListener('click', () => {
    if (!hasSave) return;
    audio.playSFX('click');
    mainMenu.classList.remove('active');
    startGame(audio, true);
  });

  document.getElementById('btnSettings').addEventListener('click', () => {
    audio.playSFX('click');
    mainMenu.style.display = 'none';
    document.getElementById('settingsScreen').classList.remove('hidden');
    document.getElementById('closeSettings').onclick = () => {
      document.getElementById('settingsScreen').classList.add('hidden');
      mainMenu.style.display = 'flex';
    };
  });

  document.getElementById('btnCredits').addEventListener('click', () => {
    audio.playSFX('click');
    Notifications.show('NEON DISTRICT — Built with pure Canvas & Vanilla JS', 'info');
  });

  // Pause menu
  document.getElementById('btnResume').addEventListener('click', () => {
    audio.playSFX('click');
    if (game) game.resume();
    pauseMenu.classList.remove('active');
  });

  document.getElementById('btnInventoryPause').addEventListener('click', () => {
    audio.playSFX('click');
    pauseMenu.classList.remove('active');
    if (game) { game.resume(); game.openInventory(); }
  });

  document.getElementById('btnQuestsPause').addEventListener('click', () => {
    audio.playSFX('click');
    pauseMenu.classList.remove('active');
    if (game) { game.resume(); game.openQuests(); }
  });

  document.getElementById('btnSettingsPause').addEventListener('click', () => {
    audio.playSFX('click');
    document.getElementById('settingsScreen').classList.remove('hidden');
    document.getElementById('closeSettings').onclick = () => {
      document.getElementById('settingsScreen').classList.add('hidden');
    };
  });

  document.getElementById('btnMainMenu').addEventListener('click', () => {
    audio.playSFX('click');
    if (game) {
      SaveSystem.save(game.getState());
      game.destroy();
      game = null;
    }
    pauseMenu.classList.remove('active');
    mainMenu.classList.add('active');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('mobileControls').classList.add('hidden');
  });

  // Settings UI
  SettingsUI.init(audio);
}

// ────────────────────────────────────────────────
// Start game
// ────────────────────────────────────────────────
function startGame(audio, loadSave) {
  const canvas          = document.getElementById('gameCanvas');
  const lightingCanvas  = document.getElementById('lightingCanvas');

  canvas.width          = window.innerWidth;
  canvas.height         = window.innerHeight;
  lightingCanvas.width  = window.innerWidth;
  lightingCanvas.height = window.innerHeight;

  game = new Game({
    canvas,
    lightingCanvas,
    audio,
    onPause: () => {
      document.getElementById('pauseMenu').classList.add('active');
    }
  });

  game.start(loadSave ? SaveSystem.load() : null);

  document.getElementById('hud').classList.remove('hidden');

  // Mobile detection
  if (isMobile()) {
    document.getElementById('mobileControls').classList.remove('hidden');
    document.getElementById('crosshair').style.display = 'none';
  }

  // Global resize
  window.addEventListener('resize', () => {
    canvas.width         = window.innerWidth;
    canvas.height        = window.innerHeight;
    lightingCanvas.width = window.innerWidth;
    lightingCanvas.height= window.innerHeight;
    if (game) game.onResize();
  });

  // Expose for debugging
  window._game = game;
}

// ────────────────────────────────────────────────
// Utility
// ────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window);
}

// ────────────────────────────────────────────────
// Init
// ────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
