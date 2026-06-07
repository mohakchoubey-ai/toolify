/**
 * NEON DISTRICT - engine/renderer.js
 * Canvas 2D rendering engine — world, entities, particles, weather
 */

export class Renderer {
  constructor(ctx, camera) {
    this.ctx    = ctx;
    this.camera = camera;
  }

  // ── Coordinate helpers ─────────────────────────
  toScreen(wx, wy) {
    const cam = this.camera;
    return {
      x: wx - cam.x + cam.hw,
      y: wy - cam.y + cam.hh
    };
  }

  isVisible(wx, wy, w, h, margin = 80) {
    const cam = this.camera;
    const sx  = wx - cam.x + cam.hw;
    const sy  = wy - cam.y + cam.hh;
    return sx + w + margin > 0 && sx - margin < cam.w &&
           sy + h + margin > 0 && sy - margin < cam.h;
  }

  // ── Background ─────────────────────────────────
  drawBackground(daynight) {
    const ctx = this.ctx;
    const w   = this.camera.w;
    const h   = this.camera.h;
    const sky = daynight.getSkyColor();
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Subtle noise texture
    if (Math.random() > 0.97) {
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      for (let i = 0; i < 100; i++) {
        ctx.fillRect(
          Math.random() * w, Math.random() * h,
          Math.random() * 2, Math.random() * 2
        );
      }
    }
  }

  // ── World / Chunks ─────────────────────────────
  drawWorld(chunks, daynight) {
    for (const chunk of chunks) {
      this._drawChunk(chunk, daynight);
    }
  }

  _drawChunk(chunk, daynight) {
    const ctx  = this.ctx;
    const cam  = this.camera;
    const brightness = daynight.getBrightness();

    // Roads
    ctx.fillStyle = this._dimColor('#1a1a2e', brightness);
    for (const road of chunk.roads) {
      if (!this.isVisible(road.x, road.y, road.w, road.h)) continue;
      const s = this.toScreen(road.x, road.y);
      ctx.fillRect(s.x, s.y, road.w, road.h);

      // Road markings
      ctx.save();
      ctx.strokeStyle = this._dimColor('rgba(255,255,100,0.3)', brightness);
      ctx.lineWidth = 1;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      if (road.vertical) {
        ctx.moveTo(s.x + road.w/2, s.y);
        ctx.lineTo(s.x + road.w/2, s.y + road.h);
      } else {
        ctx.moveTo(s.x, s.y + road.h/2);
        ctx.lineTo(s.x + road.w, s.y + road.h/2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Ground tiles (between roads)
    ctx.fillStyle = this._dimColor('#0d1117', brightness);
    const s0 = this.toScreen(chunk.x, chunk.y);
    if (this.isVisible(chunk.x, chunk.y, 800, 800)) {
      ctx.fillRect(s0.x, s0.y, 800, 800);
    }

    // Sidewalks
    ctx.fillStyle = this._dimColor('#181825', brightness);
    for (const road of chunk.roads) {
      if (!this.isVisible(road.x, road.y, road.w, road.h, 4)) continue;
      const s = this.toScreen(road.x, road.y);
      if (road.vertical) {
        ctx.fillRect(s.x - 4, s.y, 4, road.h);
        ctx.fillRect(s.x + road.w, s.y, 4, road.h);
      } else {
        ctx.fillRect(s.x, s.y - 4, road.w, 4);
        ctx.fillRect(s.x, s.y + road.h, road.w, 4);
      }
    }

    // Buildings
    for (const b of chunk.buildings) {
      this._drawBuilding(b, brightness);
    }

    // Props
    for (const p of chunk.props) {
      this._drawProp(p, brightness);
    }

    // Neon lights (glow indicators)
    for (const l of chunk.lights) {
      this._drawLightPole(l, brightness);
    }
  }

  _drawBuilding(b, brightness) {
    if (!this.isVisible(b.x, b.y, b.w, b.h)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(b.x, b.y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(s.x + 6, s.y + 6, b.w, b.h);

    // Body
    ctx.fillStyle = this._dimColor(this._buildingColor(b.type), brightness);
    ctx.fillRect(s.x, s.y, b.w, b.h);

    // Border
    ctx.strokeStyle = this._dimColor(b.color + '44', brightness);
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x, s.y, b.w, b.h);

    // Windows
    this._drawWindows(ctx, s.x, s.y, b.w, b.h, b.floors, brightness);

    // Neon sign on top
    if (b.hasNeon && brightness < 0.8) {
      ctx.save();
      ctx.shadowBlur   = 15;
      ctx.shadowColor  = b.neonColor;
      ctx.strokeStyle  = b.neonColor;
      ctx.lineWidth    = 2;
      const signX = s.x + b.w * 0.1;
      const signY = s.y - 8;
      const signW = b.w * 0.8;
      ctx.strokeRect(signX, signY, signW, 6);
      ctx.restore();
    }

    // Interaction indicator
    if (b.interactable) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,245,255,0.6)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('●', s.x + b.w/2, s.y - 2);
      ctx.restore();
    }
  }

  _drawWindows(ctx, bx, by, bw, bh, floors, brightness) {
    if (brightness > 0.9) return; // daytime — less visible windows
    const winW  = 6;
    const winH  = 5;
    const gapX  = 10;
    const gapY  = bh / Math.max(floors, 1);

    for (let fy = 0; fy < floors; fy++) {
      const wy = by + fy * gapY + 4;
      for (let wx = bx + 6; wx < bx + bw - winW - 2; wx += winW + gapX) {
        const lit = Math.random() > 0.3;
        if (!lit) continue;
        const alpha = (1 - brightness) * (0.4 + Math.random() * 0.6);
        const colors = ['#ffeeaa','#aaffee','#ffaaff','#aaeeff'];
        ctx.fillStyle = `rgba(${this._hexToRgb(colors[Math.floor(Math.random()*colors.length)])},${alpha})`;
        ctx.fillRect(wx, wy, winW, winH);
      }
    }
  }

  _drawProp(p, brightness) {
    if (!this.isVisible(p.x, p.y, p.w, p.h)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(p.x, p.y);
    const colors = {
      crate:   '#8B7355', barrel:  '#4A4A6A',
      dumpster:'#3A5A3A', car:     '#334455',
      bench:   '#5A4A3A', tree:    '#2A4A2A'
    };
    ctx.fillStyle = this._dimColor(colors[p.type] || '#555', brightness);
    ctx.fillRect(s.x - p.w/2, s.y - p.h/2, p.w, p.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - p.w/2, s.y - p.h/2, p.w, p.h);

    if (p.type === 'tree') {
      ctx.fillStyle = this._dimColor('#1a5c1a', brightness);
      ctx.beginPath();
      ctx.arc(s.x, s.y - p.h/2, 14, 0, Math.PI*2);
      ctx.fill();
    }
  }

  _drawLightPole(l, brightness) {
    if (!this.isVisible(l.x, l.y, 4, 30)) return;
    if (brightness > 0.85) return;
    const ctx = this.ctx;
    const s   = this.toScreen(l.x, l.y);

    // Pole
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(s.x - 1, s.y - 30, 2, 30);

    // Light bulb glow
    const flicker = l.flickerRate > 0 ? (Math.sin(Date.now() * l.flickerRate * 0.01) > 0 ? 1 : 0.2) : 1;
    ctx.save();
    ctx.globalAlpha = l.intensity * flicker * (1 - brightness);
    ctx.shadowBlur  = 20;
    ctx.shadowColor = l.color;
    ctx.fillStyle   = l.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 32, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ── Player ─────────────────────────────────────
  drawPlayer(player) {
    if (!player) return;
    const ctx = this.ctx;
    const s   = this.toScreen(player.x, player.y);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle   = '#000';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 10, 12, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(player.angle);

    // Player body
    ctx.fillStyle = player.inVehicle ? 'transparent' : '#1a3050';
    if (!player.inVehicle) {
      ctx.fillRect(-8, -10, 16, 20);
    }

    // Neon jacket outline
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = '#00f5ff';
    if (!player.inVehicle) {
      ctx.strokeRect(-8, -10, 16, 20);
    }

    // Head
    ctx.fillStyle   = '#c8956c';
    ctx.shadowBlur  = 0;
    ctx.fillRect(-5, -16, 10, 10);

    // Weapon indicator
    if (player.equippedWeapon && !player.inVehicle) {
      ctx.fillStyle   = '#888';
      ctx.shadowBlur  = 4;
      ctx.shadowColor = '#ffcc00';
      ctx.fillRect(8, -2, 10, 4);
    }

    ctx.restore();

    // Health bar above player
    if (player.health < player.maxHealth) {
      this._drawHealthBar(s.x, s.y - 22, player.health, player.maxHealth, 30, 4);
    }
  }

  // ── Enemy ──────────────────────────────────────
  drawEnemy(enemy) {
    if (!this.isVisible(enemy.x, enemy.y, 20, 20)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(enemy.x, enemy.y);

    ctx.save();
    ctx.translate(s.x, s.y);

    if (enemy.isBoss) {
      this._drawBossSprite(ctx, enemy);
    } else {
      this._drawEnemySprite(ctx, enemy);
    }

    ctx.restore();

    // Health bar
    const hbarW = enemy.isBoss ? 60 : 28;
    this._drawHealthBar(s.x, s.y - (enemy.isBoss ? 36 : 22), enemy.health, enemy.maxHealth, hbarW, enemy.isBoss ? 6 : 4);

    // State indicator
    if (enemy.aiState === 'attack' || enemy.aiState === 'chase') {
      ctx.save();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(s.x, s.y - (enemy.isBoss ? 45 : 30), 3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawEnemySprite(ctx, enemy) {
    const factionColors = {
      gang:     '#cc2244',
      corp:     '#2244cc',
      police:   '#2288cc',
      civilian: '#666'
    };
    const col = factionColors[enemy.faction] || '#cc2244';

    // Body
    ctx.rotate(enemy.angle || 0);
    ctx.fillStyle = col;
    ctx.shadowBlur  = enemy.aiState === 'attack' ? 8 : 0;
    ctx.shadowColor = col;
    ctx.fillRect(-7, -9, 14, 18);

    // Head
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#c8956c';
    ctx.fillRect(-4, -15, 8, 8);

    // Death flash
    if (enemy.dead) {
      ctx.globalAlpha = Math.max(0, enemy.deathTimer / 1.0);
      ctx.fillStyle   = '#ff0000';
      ctx.fillRect(-10, -12, 20, 24);
    }
  }

  _drawBossSprite(ctx, enemy) {
    ctx.rotate(enemy.angle || 0);
    // Larger silhouette
    ctx.fillStyle   = '#660022';
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#ff0066';
    ctx.fillRect(-15, -20, 30, 38);
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#aa0044';
    ctx.fillRect(-11, -16, 22, 30);
    ctx.fillStyle  = '#c8956c';
    ctx.fillRect(-6, -24, 12, 12);
    // Glowing eyes
    ctx.fillStyle  = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.shadowColor= '#ff0000';
    ctx.fillRect(-4, -20, 3, 3);
    ctx.fillRect( 2, -20, 3, 3);
    // Shoulder armor
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#880033';
    ctx.fillRect(-20, -14, 6, 12);
    ctx.fillRect(14,  -14, 6, 12);
  }

  // ── NPC ────────────────────────────────────────
  drawNPC(npc) {
    if (!this.isVisible(npc.x, npc.y, 14, 20)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(npc.x, npc.y);

    ctx.save();
    ctx.translate(s.x, s.y);

    const col = npc.canTrade ? '#00aaff' : '#888855';
    ctx.fillStyle = col;
    ctx.fillRect(-5, -8, 10, 16);
    ctx.fillStyle = '#c8956c';
    ctx.fillRect(-3, -14, 7, 7);

    // Trade icon
    if (npc.canTrade) {
      ctx.save();
      ctx.fillStyle = '#ffcc00';
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, -20);
      ctx.restore();
    }

    // Interact indicator
    if (npc.nearPlayer) {
      ctx.save();
      ctx.fillStyle   = '#00f5ff';
      ctx.shadowBlur  = 8;
      ctx.shadowColor = '#00f5ff';
      ctx.beginPath();
      ctx.arc(0, -22, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // ── Vehicle ────────────────────────────────────
  drawVehicle(vehicle) {
    if (!this.isVisible(vehicle.x, vehicle.y, 50, 30)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(vehicle.x, vehicle.y);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(vehicle.angle);

    const dims = { sedan:{ w:36,h:18 }, truck:{ w:48,h:22 }, bike:{ w:24,h:12 } };
    const d    = dims[vehicle.type] || dims.sedan;
    const vCol = vehicle.color || '#224466';

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle   = '#000';
    ctx.fillRect(-d.w/2+4, -d.h/2+4, d.w, d.h);
    ctx.restore();

    // Body
    ctx.fillStyle   = vCol;
    ctx.shadowBlur  = vehicle.occupied ? 10 : 0;
    ctx.shadowColor = '#00f5ff';
    ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);

    // Windshield
    ctx.fillStyle = 'rgba(100,200,255,0.4)';
    if (vehicle.type !== 'bike') {
      ctx.fillRect(-d.w/2 + 4, -d.h/2 + 3, d.w * 0.35, d.h - 6);
    }

    // Wheels
    ctx.fillStyle = '#111';
    const ww = vehicle.type === 'bike' ? 5 : 8;
    const wh = vehicle.type === 'bike' ? 10 : 6;
    ctx.fillRect(-d.w/2 - ww/2,  -d.h/2 - wh/2, ww, wh);
    ctx.fillRect(-d.w/2 - ww/2,   d.h/2 - wh/2, ww, wh);
    ctx.fillRect( d.w/2 - ww/2,  -d.h/2 - wh/2, ww, wh);
    ctx.fillRect( d.w/2 - ww/2,   d.h/2 - wh/2, ww, wh);

    // Headlights
    ctx.fillStyle   = 'rgba(255,255,200,0.8)';
    ctx.shadowBlur  = 12;
    ctx.shadowColor = '#ffeeaa';
    ctx.fillRect(-d.w/2 - 2, -d.h/4, 3, 4);
    ctx.fillRect(-d.w/2 - 2,  d.h/4 - 4, 3, 4);

    // Tail lights
    ctx.fillStyle   = 'rgba(255,50,50,0.8)';
    ctx.shadowColor = '#ff3333';
    ctx.fillRect(d.w/2,      -d.h/4, 3, 4);
    ctx.fillRect(d.w/2,       d.h/4 - 4, 3, 4);

    ctx.restore();
  }

  // ── Bullet ─────────────────────────────────────
  drawBullet(bullet) {
    const ctx = this.ctx;
    const s   = this.toScreen(bullet.x, bullet.y);

    ctx.save();
    ctx.globalAlpha = bullet.alpha || 1;
    ctx.fillStyle   = bullet.color || '#ffcc00';
    ctx.shadowBlur  = 8;
    ctx.shadowColor = bullet.color || '#ffcc00';
    ctx.beginPath();
    ctx.arc(s.x, s.y, bullet.radius || 3, 0, Math.PI*2);
    ctx.fill();

    // Trail
    if (bullet.trail && bullet.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = (bullet.color || '#ffcc00') + '88';
      ctx.lineWidth   = 1.5;
      ctx.moveTo(s.x, s.y);
      for (const tp of bullet.trail) {
        const ts = this.toScreen(tp.x, tp.y);
        ctx.lineTo(ts.x, ts.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Loot ───────────────────────────────────────
  drawLoot(loot) {
    if (!this.isVisible(loot.x, loot.y, 16, 16)) return;
    const ctx = this.ctx;
    const s   = this.toScreen(loot.x, loot.y);
    const bob = Math.sin(Date.now() * 0.003 + loot.phase) * 3;

    ctx.save();
    ctx.shadowBlur  = 15;
    ctx.shadowColor = loot.item.rarity === 'legendary' ? '#ffcc00' : '#00f5ff';
    ctx.fillStyle   = this._rarityColor(loot.item.rarity);
    ctx.beginPath();
    ctx.arc(s.x, s.y + bob, 7, 0, Math.PI*2);
    ctx.fill();

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font      = '10px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(loot.item.icon || '?', s.x, s.y + bob);

    // Name label (when near player)
    if (loot.showLabel) {
      ctx.fillStyle    = 'rgba(0,0,0,0.6)';
      ctx.fillRect(s.x - 30, s.y + bob - 22, 60, 12);
      ctx.fillStyle    = this._rarityColor(loot.item.rarity);
      ctx.font         = '8px monospace';
      ctx.fillText(loot.item.name, s.x, s.y + bob - 16);
    }

    ctx.restore();
  }

  // ── Particles ──────────────────────────────────
  drawParticles(system) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of system.particles) {
      if (!this.isVisible(p.x, p.y, 4, 4, 20)) continue;
      const s = this.toScreen(p.x, p.y);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      if (p.glow) {
        ctx.shadowBlur  = 8;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Weather ────────────────────────────────────
  drawWeather(weather, camera) {
    if (!weather.active) return;
    const ctx = this.ctx;
    const w   = camera.w;
    const h   = camera.h;

    if (weather.type === 'rain') {
      ctx.save();
      ctx.strokeStyle = 'rgba(180,220,255,0.3)';
      ctx.lineWidth   = 1;
      for (const d of weather.drops) {
        ctx.beginPath();
        ctx.moveTo(d.sx, d.sy);
        ctx.lineTo(d.sx + d.len * Math.sin(weather.angle), d.sy + d.len);
        ctx.stroke();
      }
      ctx.restore();

      // Puddle shimmer overlay
      ctx.save();
      ctx.fillStyle = 'rgba(100,150,255,0.03)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    if (weather.type === 'fog') {
      ctx.save();
      const alpha = weather.density * 0.4;
      ctx.fillStyle = `rgba(150,170,200,${alpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // ── Health bar ─────────────────────────────────
  _drawHealthBar(cx, cy, hp, maxHp, width, height) {
    const ctx = this.ctx;
    const pct = Math.max(0, hp / maxHp);
    const x   = cx - width/2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, cy, width, height);
    ctx.fillStyle = pct > 0.5 ? '#22cc44' : pct > 0.25 ? '#ffcc00' : '#cc2244';
    ctx.fillRect(x, cy, width * pct, height);
    ctx.restore();
  }

  // ── Utility ────────────────────────────────────
  _rarityColor(r) {
    const map = { common:'#aaaaaa', uncommon:'#4caf50', rare:'#2196f3', epic:'#9c27b0', legendary:'#ffcc00' };
    return map[r] || '#aaa';
  }

  _buildingColor(type) {
    const map = { shop:'#1a2535', apartment:'#151e2a', office:'#101820', warehouse:'#151215' };
    return map[type] || '#151e2a';
  }

  _dimColor(hex, brightness) {
    // brightness 0..1
    if (brightness >= 1) return hex;
    // Simple: apply alpha
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    const alpha = 0.3 + brightness * 0.7;
    return hex + Math.round(alpha * 255).toString(16).padStart(2, '0').slice(0, 2);
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
}
