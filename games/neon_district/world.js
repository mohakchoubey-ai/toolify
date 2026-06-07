/**
 * NEON DISTRICT - engine/world.js
 * Core game loop, world generation, chunk system, game orchestration
 */

import { Renderer }      from './renderer.js';
import { Camera }        from './camera.js';
import { Physics }       from './physics.js';
import { ParticleSystem} from './particles.js';
import { LightingEngine } from './lighting.js';
import { Player }        from '../entities/player.js';
import { Enemy }         from '../entities/enemy.js';
import { Boss }          from '../entities/boss.js';
import { NPC }           from '../entities/npc.js';
import { Vehicle }       from '../entities/vehicle.js';
import { Loot }          from '../entities/loot.js';
import { InventorySystem}from '../systems/inventory.js';
import { QuestManager }  from '../systems/quests.js';
import { Economy }       from '../systems/economy.js';
import { CombatSystem }  from '../systems/combat.js';
import { WeatherSystem } from '../systems/weather.js';
import { DayNight }      from '../systems/daynight.js';
import { AISystem }      from '../systems/ai.js';
import { HUD }           from '../ui/hud.js';
import { Minimap }       from '../ui/minimap.js';
import { Notifications } from '../ui/notifications.js';
import { MobileControls} from '../ui/mobileControls.js';
import { SaveSystem }    from '../systems/save.js';

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────
const CHUNK_SIZE   = 800;
const WORLD_CHUNKS = 8;   // 8x8 grid of chunks
const WORLD_SIZE   = CHUNK_SIZE * WORLD_CHUNKS;
const TILE_SIZE    = 40;
const LOAD_RADIUS  = 2;   // chunks around player to load

// District zone definitions
const DISTRICT_TYPES = [
  { name: 'Neon District',      color: '#ff00aa', accent: '#00f5ff', density: 0.8 },
  { name: 'Industrial Sector',  color: '#ff6600', accent: '#ffcc00', density: 0.6 },
  { name: 'Corporate Zone',     color: '#00aaff', accent: '#ffffff', density: 0.7 },
  { name: 'Slum Quarter',       color: '#aa00ff', accent: '#ff4400', density: 0.9 },
  { name: 'Harbor District',    color: '#00ff88', accent: '#0055ff', density: 0.5 },
  { name: 'Old Town',           color: '#ffcc00', accent: '#ff8800', density: 0.7 },
  { name: 'Tech Quarter',       color: '#00f5ff', accent: '#aa00ff', density: 0.6 },
  { name: 'Black Market',       color: '#ff0055', accent: '#ff00aa', density: 1.0 },
];

// ────────────────────────────────────────────────
// Pseudo-random seeded generator
// ────────────────────────────────────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ────────────────────────────────────────────────
// Chunk data structure
// ────────────────────────────────────────────────
class Chunk {
  constructor(cx, cy, district, rng) {
    this.cx = cx;
    this.cy = cy;
    this.x  = cx * CHUNK_SIZE;
    this.y  = cy * CHUNK_SIZE;
    this.district = district;
    this.buildings = [];
    this.roads     = [];
    this.props     = [];
    this.lights    = [];
    this.spawns    = [];
    this.loaded    = false;
    this.offscreenCanvas = null;
    this.generate(rng);
  }

  generate(rng) {
    const x0 = this.x;
    const y0 = this.y;
    const cs = CHUNK_SIZE;
    const d  = this.district;

    // Road grid — every 200px a road
    const roadSpacing = 200;
    for (let rx = x0; rx < x0 + cs; rx += roadSpacing) {
      this.roads.push({ x: rx, y: y0, w: 40, h: cs, vertical: true });
    }
    for (let ry = y0; ry < y0 + cs; ry += roadSpacing) {
      this.roads.push({ x: x0, y: ry, w: cs, h: 40, vertical: false });
    }

    // Buildings between roads
    for (let bx = x0 + 50; bx < x0 + cs - 100; bx += roadSpacing) {
      for (let by = y0 + 50; by < y0 + cs - 100; by += roadSpacing) {
        const count = Math.floor(rng() * 4) + 1;
        for (let bi = 0; bi < count; bi++) {
          const bw = 30 + Math.floor(rng() * 100);
          const bh = 30 + Math.floor(rng() * 120);
          const px = bx + Math.floor(rng() * 130);
          const py = by + Math.floor(rng() * 130);
          if (px + bw < x0 + cs - 50 && py + bh < y0 + cs - 50) {
            const floors = Math.floor(rng() * 8) + 1;
            this.buildings.push({
              x: px, y: py, w: bw, h: bh, floors,
              color: d.color,
              hasNeon: rng() > 0.5,
              neonColor: rng() > 0.5 ? d.color : d.accent,
              interactable: rng() > 0.7,
              type: ['shop','apartment','office','warehouse'][Math.floor(rng()*4)]
            });
          }
        }
      }
    }

    // Neon light poles along roads
    const lightFreq = d.density;
    for (let lx = x0 + 20; lx < x0 + cs; lx += 80 + Math.floor(rng()*60)) {
      for (let ly = y0 + 20; ly < y0 + cs; ly += 80 + Math.floor(rng()*60)) {
        if (rng() < lightFreq) {
          this.lights.push({
            x: lx, y: ly,
            color: rng() > 0.5 ? d.color : d.accent,
            radius: 80 + Math.floor(rng() * 60),
            intensity: 0.4 + rng() * 0.4,
            flickerRate: rng() > 0.7 ? rng() * 0.05 : 0
          });
        }
      }
    }

    // Props (crates, barrels, dumpsters, etc.)
    const propTypes = ['crate','barrel','dumpster','car','bench','tree'];
    for (let i = 0; i < Math.floor(rng() * 15) + 5; i++) {
      const px = x0 + Math.floor(rng() * cs);
      const py = y0 + Math.floor(rng() * cs);
      this.props.push({
        x: px, y: py,
        type: propTypes[Math.floor(rng() * propTypes.length)],
        solid: true, w: 20, h: 20
      });
    }

    // Enemy/NPC spawn points
    for (let i = 0; i < Math.floor(rng() * 6) + 2; i++) {
      this.spawns.push({
        x: x0 + 60 + Math.floor(rng() * (cs - 120)),
        y: y0 + 60 + Math.floor(rng() * (cs - 120)),
        type: rng() > 0.8 ? 'boss' : rng() > 0.4 ? 'enemy' : 'npc',
        faction: ['gang','corp','police','civilian'][Math.floor(rng() * 4)]
      });
    }
  }
}

// ────────────────────────────────────────────────
// World — manages all chunks
// ────────────────────────────────────────────────
class World {
  constructor(seed = 12345) {
    this.seed   = seed;
    this.rng    = mulberry32(seed);
    this.chunks = new Map();
    this.districts = this._assignDistricts();
  }

  _districtKey(cx, cy) { return `${cx},${cy}`; }

  _assignDistricts() {
    const map = new Map();
    for (let cy = 0; cy < WORLD_CHUNKS; cy++) {
      for (let cx = 0; cx < WORLD_CHUNKS; cx++) {
        const idx = Math.floor(this.rng() * DISTRICT_TYPES.length);
        map.set(this._districtKey(cx, cy), DISTRICT_TYPES[idx]);
      }
    }
    return map;
  }

  getChunk(cx, cy) {
    const key = this._districtKey(cx, cy);
    if (cx < 0 || cy < 0 || cx >= WORLD_CHUNKS || cy >= WORLD_CHUNKS) return null;
    if (!this.chunks.has(key)) {
      const district = this.districts.get(key);
      const chunkRng = mulberry32(this.seed ^ (cx * 73856093) ^ (cy * 19349663));
      this.chunks.set(key, new Chunk(cx, cy, district, chunkRng));
    }
    return this.chunks.get(key);
  }

  getChunksAround(px, py, radius) {
    const cx0 = Math.floor(px / CHUNK_SIZE);
    const cy0 = Math.floor(py / CHUNK_SIZE);
    const result = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const c = this.getChunk(cx0 + dx, cy0 + dy);
        if (c) result.push(c);
      }
    }
    return result;
  }

  getDistrictAt(px, py) {
    const cx = Math.floor(px / CHUNK_SIZE);
    const cy = Math.floor(py / CHUNK_SIZE);
    return this.districts.get(this._districtKey(cx, cy)) || DISTRICT_TYPES[0];
  }

  getAllBuildings(px, py) {
    const chunks = this.getChunksAround(px, py, LOAD_RADIUS);
    const result = [];
    for (const c of chunks) result.push(...c.buildings);
    return result;
  }

  getAllLights(px, py) {
    const chunks = this.getChunksAround(px, py, LOAD_RADIUS);
    const result = [];
    for (const c of chunks) result.push(...c.lights);
    return result;
  }

  getAllProps(px, py) {
    const chunks = this.getChunksAround(px, py, LOAD_RADIUS);
    const result = [];
    for (const c of chunks) result.push(...c.props);
    return result;
  }

  clamp(px, py) {
    return {
      x: Math.max(20, Math.min(WORLD_SIZE - 20, px)),
      y: Math.max(20, Math.min(WORLD_SIZE - 20, py))
    };
  }
}

// ────────────────────────────────────────────────
// Game — top-level orchestrator
// ────────────────────────────────────────────────
export class Game {
  constructor({ canvas, lightingCanvas, audio, onPause }) {
    this.canvas         = canvas;
    this.lightingCanvas = lightingCanvas;
    this.ctx            = canvas.getContext('2d');
    this.audio          = audio;
    this.onPause        = onPause;

    this.running  = false;
    this.paused   = false;
    this.lastTime = 0;
    this.dt       = 0;
    this.frame    = 0;

    this.world    = null;
    this.player   = null;
    this.enemies  = [];
    this.npcs     = [];
    this.vehicles = [];
    this.loots    = [];
    this.bullets  = [];
    this._entityId = 0;

    this._spawnedChunks = new Set();

    // Systems
    this.renderer   = null;
    this.camera     = null;
    this.physics    = null;
    this.particles  = null;
    this.lighting   = null;
    this.inventory  = null;
    this.quests     = null;
    this.economy    = null;
    this.combat     = null;
    this.weather    = null;
    this.daynight   = null;
    this.aiSystem   = null;

    // UI
    this.hud        = null;
    this.minimap    = null;
    this.mobile     = null;

    // Input state
    this.keys       = {};
    this.mouse      = { x: 0, y: 0, worldX: 0, worldY: 0, buttons: 0 };
    this._touchJoystick = { active: false, dx: 0, dy: 0 };

    // Autosave timer
    this._autosaveTimer = 0;
    this._autosaveInterval = 30; // seconds

    this._boundLoop = this._loop.bind(this);
    this._rafId     = null;
  }

  // ── Start ──────────────────────────────────────
  start(saveData) {
    this.world      = new World(saveData?.seed || 12345);
    this.camera     = new Camera(this.canvas);
    this.renderer   = new Renderer(this.ctx, this.camera);
    this.physics    = new Physics();
    this.particles  = new ParticleSystem();
    this.lighting   = new LightingEngine(this.lightingCanvas);
    this.inventory  = new InventorySystem();
    this.quests     = new QuestManager(this);
    this.economy    = new Economy(this);
    this.combat     = new CombatSystem(this);
    this.weather    = new WeatherSystem(this.particles);
    this.daynight   = new DayNight();
    this.aiSystem   = new AISystem();

    this.hud     = new HUD(this);
    this.minimap = new Minimap(document.getElementById('minimapCanvas'), this);
    this.mobile  = new MobileControls(this);

    // Create player
    const startX = saveData?.playerX || WORLD_SIZE / 2;
    const startY = saveData?.playerY || WORLD_SIZE / 2;
    this.player = new Player(startX, startY, this);

    if (saveData) this._loadSaveData(saveData);

    // Initial chunk spawn
    this._spawnEntitiesAround(startX, startY);

    // Input
    this._initInput();

    // Start quests
    this.quests.initDefaultQuests();

    // Start music
    this.audio.playMusic('ambient');

    // Camera follow
    this.camera.target = this.player;

    this.running = true;
    this.lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._boundLoop);

    // Notify
    Notifications.show('NEON DISTRICT — Stay alert, runner.', 'info');
  }

  // ── Main Loop ──────────────────────────────────
  _loop(timestamp) {
    if (!this.running) return;
    this.dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.frame++;

    if (!this.paused) {
      this._update(this.dt);
    }
    this._render();

    this._rafId = requestAnimationFrame(this._boundLoop);
  }

  // ── Update ─────────────────────────────────────
  _update(dt) {
    // Day/Night & Weather
    this.daynight.update(dt);
    this.weather.update(dt);

    // Player input → movement
    const input = this._gatherInput();
    this.player.update(dt, input, this);

    // Camera
    this.camera.update(dt);

    // Spawn entities around player
    this._maybeSpawnEntities();

    // Active enemies
    this.aiSystem.update(dt, this.enemies, this.player, this);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this);
      if (e.dead && e.deathTimer <= 0) {
        this._onEnemyDeath(e);
        this.enemies.splice(i, 1);
      }
    }

    // NPCs
    for (const npc of this.npcs) npc.update(dt, this);

    // Vehicles
    for (const v of this.vehicles) v.update(dt, this);

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this);
      if (b.dead) this.bullets.splice(i, 1);
    }

    // Loot
    for (const l of this.loots) l.update(dt);

    // Particles
    this.particles.update(dt);

    // HUD
    this.hud.update(dt);
    this.minimap.update();

    // Lighting
    this.lighting.update(dt, this.world.getAllLights(this.player.x, this.player.y), this.player, this.daynight);

    // Autosave
    this._autosaveTimer += dt;
    if (this._autosaveTimer >= this._autosaveInterval) {
      this._autosaveTimer = 0;
      const settings = window._settings || {};
      if (settings.autosave !== false) {
        SaveSystem.save(this.getState());
      }
    }

    // Cull distant entities
    this._cullEntities();
  }

  // ── Render ─────────────────────────────────────
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    this.renderer.drawBackground(this.daynight);

    // World
    const visChunks = this.world.getChunksAround(this.player.x, this.player.y, LOAD_RADIUS);
    this.renderer.drawWorld(visChunks, this.daynight);

    // Loot
    for (const l of this.loots) this.renderer.drawLoot(l);

    // Vehicles
    for (const v of this.vehicles) this.renderer.drawVehicle(v);

    // NPCs
    for (const npc of this.npcs) this.renderer.drawNPC(npc);

    // Enemies
    for (const e of this.enemies) this.renderer.drawEnemy(e);

    // Player
    this.renderer.drawPlayer(this.player);

    // Bullets
    for (const b of this.bullets) this.renderer.drawBullet(b);

    // Particles
    this.renderer.drawParticles(this.particles);

    // Lighting overlay
    this.lighting.render(this.camera, this.daynight);

    // Weather (drawn on top)
    this.renderer.drawWeather(this.weather, this.camera);
  }

  // ── Input ──────────────────────────────────────
  _initInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this._handleKeyDown(e);
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
    this.canvas.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.worldX = e.clientX + this.camera.x - this.canvas.width  / 2;
      this.mouse.worldY = e.clientY + this.camera.y - this.canvas.height / 2;
    });
    this.canvas.addEventListener('mousedown', e => {
      this.mouse.buttons |= (1 << e.button);
      if (e.button === 0) this.player.triggerAttack(this);
    });
    this.canvas.addEventListener('mouseup', e => {
      this.mouse.buttons &= ~(1 << e.button);
    });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Prevent scrolling on mobile
    document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  }

  _handleKeyDown(e) {
    switch (e.code) {
      case 'Escape':
        if (!this.paused) this.pause();
        else { this.resume(); document.getElementById('pauseMenu').classList.remove('active'); }
        break;
      case 'Tab':
      case 'KeyI':
        e.preventDefault();
        this.openInventory();
        break;
      case 'KeyQ':
        this.openQuests();
        break;
      case 'KeyE':
        this.player.interact(this);
        break;
      case 'KeyR':
        this.player.reload(this);
        break;
      case 'KeyF':
        this.player.tryEnterExitVehicle(this);
        break;
      case 'Space':
        if (!this.player.inVehicle) this.player.triggerAttack(this);
        break;
    }
  }

  _gatherInput() {
    const kb = this.keys;
    const jx = this._touchJoystick.dx;
    const jy = this._touchJoystick.dy;

    const kbDx = (kb['KeyD'] || kb['ArrowRight'] ? 1 : 0) - (kb['KeyA'] || kb['ArrowLeft'] ? 1 : 0);
    const kbDy = (kb['KeyS'] || kb['ArrowDown']  ? 1 : 0) - (kb['KeyW'] || kb['ArrowUp']   ? 1 : 0);

    const dx = kbDx || jx;
    const dy = kbDy || jy;
    const sprint = kb['ShiftLeft'] || kb['ShiftRight'] || this._touchJoystick.sprint || false;

    return { dx, dy, sprint, mouseX: this.mouse.worldX, mouseY: this.mouse.worldY };
  }

  // ── Entity Management ──────────────────────────
  _maybeSpawnEntities() {
    const cx = Math.floor(this.player.x / CHUNK_SIZE);
    const cy = Math.floor(this.player.y / CHUNK_SIZE);

    for (let dy = -LOAD_RADIUS; dy <= LOAD_RADIUS; dy++) {
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        const key = `${cx+dx},${cy+dy}`;
        if (!this._spawnedChunks.has(key)) {
          this._spawnedChunks.add(key);
          const chunk = this.world.getChunk(cx+dx, cy+dy);
          if (chunk) this._spawnChunkEntities(chunk);
        }
      }
    }
  }

  _spawnEntitiesAround(px, py) {
    const cx = Math.floor(px / CHUNK_SIZE);
    const cy = Math.floor(py / CHUNK_SIZE);
    for (let dy = -LOAD_RADIUS; dy <= LOAD_RADIUS; dy++) {
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        const key = `${cx+dx},${cy+dy}`;
        if (!this._spawnedChunks.has(key)) {
          this._spawnedChunks.add(key);
          const chunk = this.world.getChunk(cx+dx, cy+dy);
          if (chunk) this._spawnChunkEntities(chunk);
        }
      }
    }
  }

  _spawnChunkEntities(chunk) {
    for (const spawn of chunk.spawns) {
      if (spawn.type === 'enemy') {
        const e = new Enemy(spawn.x, spawn.y, spawn.faction || 'gang', this);
        e.id = ++this._entityId;
        e.homeX = spawn.x;
        e.homeY = spawn.y;
        this.enemies.push(e);
      } else if (spawn.type === 'boss') {
        const b = new Boss(spawn.x, spawn.y, spawn.faction || 'corp', this);
        b.id = ++this._entityId;
        b.homeX = spawn.x;
        b.homeY = spawn.y;
        this.enemies.push(b);
      } else if (spawn.type === 'npc') {
        const n = new NPC(spawn.x, spawn.y, spawn.faction || 'civilian', this);
        n.id = ++this._entityId;
        this.npcs.push(n);
      }
    }

    // Spawn some vehicles
    const rng = mulberry32(chunk.cx * 99 + chunk.cy * 77);
    for (let i = 0; i < Math.floor(rng() * 3); i++) {
      const vx = chunk.x + 100 + Math.floor(rng() * (CHUNK_SIZE - 200));
      const vy = chunk.y + 100 + Math.floor(rng() * (CHUNK_SIZE - 200));
      const v = new Vehicle(vx, vy, ['sedan','truck','bike'][Math.floor(rng()*3)]);
      v.id = ++this._entityId;
      this.vehicles.push(v);
    }

    // Spawn some random loot
    for (let i = 0; i < Math.floor(rng() * 4); i++) {
      const lx = chunk.x + 80 + Math.floor(rng() * (CHUNK_SIZE - 160));
      const ly = chunk.y + 80 + Math.floor(rng() * (CHUNK_SIZE - 160));
      const l = Loot.randomLoot(lx, ly);
      l.id = ++this._entityId;
      this.loots.push(l);
    }
  }

  _cullEntities() {
    const MAX_DIST = (LOAD_RADIUS + 1.5) * CHUNK_SIZE;
    const px = this.player.x, py = this.player.y;

    this.enemies = this.enemies.filter(e => {
      const d = Math.hypot(e.x - px, e.y - py);
      return d < MAX_DIST;
    });
    this.npcs = this.npcs.filter(n => {
      return Math.hypot(n.x - px, n.y - py) < MAX_DIST;
    });
  }

  _onEnemyDeath(e) {
    // Drop loot
    const loot = Loot.enemyLoot(e.x, e.y, e.isBoss);
    if (loot) {
      loot.id = ++this._entityId;
      this.loots.push(loot);
    }
    // Give XP
    const xpAmount = e.isBoss ? 200 : (20 + Math.floor(Math.random() * 30));
    this.player.addXP(xpAmount, this);
    // Currency
    const credits = e.isBoss ? 200 + Math.floor(Math.random()*200) : 5 + Math.floor(Math.random()*25);
    this.player.currency += credits;
    this.hud.refresh();
    // Particle death burst
    this.particles.burst(e.x, e.y, '#ff2244', 20);
    // Audio
    this.audio.playSFX('enemyDeath');
    // Quest notify
    this.quests.onEnemyKilled(e, this);
  }

  // ── Public API ─────────────────────────────────
  addBullet(bullet) { this.bullets.push(bullet); }

  spawnLoot(x, y, items) {
    for (const item of items) {
      const l = new Loot(x + (Math.random()-0.5)*30, y + (Math.random()-0.5)*30, item);
      l.id = ++this._entityId;
      this.loots.push(l);
    }
  }

  pickupLoot(loot) {
    const idx = this.loots.indexOf(loot);
    if (idx < 0) return;
    this.loots.splice(idx, 1);
    const added = this.inventory.addItem(loot.item);
    if (added) {
      Notifications.show(`+ ${loot.item.name}`, 'item');
      this.audio.playSFX('pickup');
      this.hud.refresh();
    } else {
      Notifications.show('Inventory full!', 'warning');
    }
  }

  openShop(shopData) {
    this.economy.openShop(shopData, this);
  }

  openInventory() {
    if (document.getElementById('inventoryScreen').classList.contains('hidden')) {
      document.getElementById('inventoryScreen').classList.remove('hidden');
      this.inventory.renderUI(this);
    } else {
      document.getElementById('inventoryScreen').classList.add('hidden');
    }
  }

  openQuests() {
    if (document.getElementById('questScreen').classList.contains('hidden')) {
      document.getElementById('questScreen').classList.remove('hidden');
      this.quests.renderUI();
    } else {
      document.getElementById('questScreen').classList.add('hidden');
    }
  }

  screenShake(intensity, duration) {
    const settings = window._settings || {};
    if (settings.cameraShake === false) return;
    this.camera.shake(intensity, duration);
  }

  getState() {
    return {
      seed:      this.world.seed,
      playerX:   this.player.x,
      playerY:   this.player.y,
      player:    this.player.serialize(),
      inventory: this.inventory.serialize(),
      quests:    this.quests.serialize(),
      currency:  this.player.currency,
      dayTime:   this.daynight.time,
    };
  }

  _loadSaveData(data) {
    if (data.player)    this.player.deserialize(data.player);
    if (data.inventory) this.inventory.deserialize(data.inventory);
    if (data.quests)    this.quests.deserialize(data.quests);
    if (data.currency)  this.player.currency = data.currency;
    if (data.dayTime)   this.daynight.time = data.dayTime;
    this.hud.refresh();
  }

  pause() {
    this.paused = true;
    this.onPause();
  }

  resume() {
    this.paused = false;
    this.lastTime = performance.now();
  }

  onResize() {
    this.camera.onResize(this.canvas);
    this.lighting.onResize(this.lightingCanvas);
  }

  destroy() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('keydown', this._keyDownHandler);
    window.removeEventListener('keyup',   this._keyUpHandler);
  }

  // Expose for modules
  setJoystick(dx, dy, sprint) {
    this._touchJoystick.dx = dx;
    this._touchJoystick.dy = dy;
    this._touchJoystick.sprint = sprint;
  }
}

export { World, CHUNK_SIZE, WORLD_SIZE, WORLD_CHUNKS, DISTRICT_TYPES, mulberry32 };
