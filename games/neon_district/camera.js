/**
 * NEON DISTRICT - engine/camera.js
 * Camera: follow, smoothing, bounds, screen shake
 */

export class Camera {
  constructor(canvas) {
    this.x       = 0;
    this.y       = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.w       = canvas.width;
    this.h       = canvas.height;
    this.hw      = canvas.width  / 2;
    this.hh      = canvas.height / 2;
    this.zoom    = 1;

    // Follow target
    this.target  = null;
    this.lerpSpeed = 8; // smoothing

    // Shake
    this._shakeIntensity = 0;
    this._shakeDuration  = 0;
    this._shakeX         = 0;
    this._shakeY         = 0;

    // Bounds
    this.minX = 0;
    this.minY = 0;
    this.maxX = Infinity;
    this.maxY = Infinity;
  }

  update(dt) {
    if (this.target) {
      this.targetX = this.target.x;
      this.targetY = this.target.y;
    }

    // Smooth follow
    const t = Math.min(1, this.lerpSpeed * dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;

    // Shake
    if (this._shakeDuration > 0) {
      this._shakeDuration -= dt;
      const mag = this._shakeIntensity * (this._shakeDuration > 0 ? 1 : 0);
      this._shakeX = (Math.random() - 0.5) * 2 * mag;
      this._shakeY = (Math.random() - 0.5) * 2 * mag;
      if (this._shakeDuration <= 0) {
        this._shakeX = 0;
        this._shakeY = 0;
        this._shakeIntensity = 0;
      }
    }
  }

  /** Apply camera transform to context */
  begin(ctx) {
    ctx.save();
    ctx.translate(
      -this.x + this.hw + this._shakeX,
      -this.y + this.hh + this._shakeY
    );
    ctx.scale(this.zoom, this.zoom);
  }

  end(ctx) {
    ctx.restore();
  }

  /** World → screen */
  worldToScreen(wx, wy) {
    return {
      x: (wx - this.x) * this.zoom + this.hw + this._shakeX,
      y: (wy - this.y) * this.zoom + this.hh + this._shakeY
    };
  }

  /** Screen → world */
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.hw - this._shakeX) / this.zoom + this.x,
      y: (sy - this.hh - this._shakeY) / this.zoom + this.y
    };
  }

  /** Trigger screen shake */
  shake(intensity, duration) {
    if (intensity > this._shakeIntensity) {
      this._shakeIntensity = intensity;
      this._shakeDuration  = duration;
    }
  }

  /** Set hard position */
  setPosition(x, y) {
    this.x       = x;
    this.y       = y;
    this.targetX = x;
    this.targetY = y;
  }

  /** Move target offset (for cinematic panning) */
  pan(dx, dy, duration) {
    this._panOffsetX  = dx;
    this._panOffsetY  = dy;
    this._panDuration = duration;
    this._panTimer    = 0;
  }

  /** Is a world rectangle visible on screen? */
  isVisible(wx, wy, w, h, margin = 60) {
    const sx = (wx - this.x) * this.zoom + this.hw;
    const sy = (wy - this.y) * this.zoom + this.hh;
    return sx + w + margin > 0 && sx - margin < this.w &&
           sy + h + margin > 0 && sy - margin < this.h;
  }

  onResize(canvas) {
    this.w  = canvas.width;
    this.h  = canvas.height;
    this.hw = canvas.width  / 2;
    this.hh = canvas.height / 2;
  }
}
