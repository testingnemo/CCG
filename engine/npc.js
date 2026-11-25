/* ============================================================
   ENGINE · npc.js — the citizens of the Deep Learning world
   Pedestrians wander the sidewalks/grass near the player,
   hop aside when a horn honks or a car approaches, and share
   bite-sized DLNA tips when talked to.
   ============================================================ */
'use strict';

var NPC = (function () {
  var TS = 32;
  var npcs = [];                  // {x,y,dir,animT,frame,palette,tip,walkAng,walkT,scatterT,fleeAng}
  var TIPS = [
    'Tip: ReLU avoids saturation for positive inputs, unlike Sigmoid and Tanh!',
    'Tip: Always call model.eval() before inference so Dropout and BatchNorm behave properly.',
    'Tip: A 3x3 conv stack in VGG has the same receptive field as 5x5 or 7x7 with fewer weights.',
    'Tip: LSTMs use a cell state highway and forget gate to beat vanishing gradients.',
    'Tip: Self-attention scales Q·Kᵀ by √d_k so softmax gradients do not vanish.',
    'Tip: Adam combines Momentum (first moment) with RMSProp (second moment).',
    'Tip: In Transfer Learning, freeze the early edge-detector layers and fine-tune the head!',
    'Tip: GAN training is a minimax game — Generator fakes data while Discriminator spots fakes.',
    'Tip: Cross-entropy pairs naturally with Softmax for multi-class classification.',
    'Tip: Autoencoders compress inputs into a bottleneck latent vector, then reconstruct them.',
    'Tip: Grid search checks all combinations, so keep the hyperparameter grid tight.',
    'Tip: Save model weights AND preprocessing scalers together so inference never drifts.'
  ];
  var PALETTES = 2;
  var MAXNPC = 14;

  function init() {}

  function canStand(px, py) {
    if (!World.canMove(px, py)) return false;
    if (typeof Vehicles !== 'undefined' && Vehicles.collidesPoint && Vehicles.collidesPoint(px, py, 8)) return false;
    return true;
  }

  /* keep a live population around the player */
  function update(dt, px, py) {
    /* spawn walkers ahead in a ring 6–13 tiles from the hero */
    if (npcs.length < MAXNPC && Math.random() < 0.05) {
      var a = Math.random() * Math.PI * 2;
      var r = (6 + Math.random() * 7) * TS;
      var x = px + Math.cos(a) * r, y = py + Math.sin(a) * r;
      if (canStand(x, y)) {
        npcs.push({
          x: x, y: y, dir: 'down', animT: 0, frame: 0,
          palette: Math.floor(Math.random() * PALETTES),
          tip: TIPS[Math.floor(Math.random() * TIPS.length)],
          walkAng: Math.random() * Math.PI * 2,
          walkT: 0, scatterT: 0, fleeAng: 0
        });
      }
    }

    npcs.forEach(function (n) {
      /* flee timer from a horn or car bump (respects world & vehicle collisions) */
      if (n.scatterT > 0) {
        n.scatterT -= dt;
        var ang = n.fleeAng !== undefined ? n.fleeAng : Math.atan2(n.y - py, n.x - px);
        var sx = n.x + Math.cos(ang) * 125 * dt;
        var sy = n.y + Math.sin(ang) * 125 * dt;
        if (World.canMove(sx, sy)) { n.x = sx; n.y = sy; }
        else if (World.canMove(sx, n.y)) { n.x = sx; }
        else if (World.canMove(n.x, sy)) { n.y = sy; }
        else { n.fleeAng = ang + Math.PI / 2; }
        n.dir = dirFromAng(ang);
        n.animT += dt;
        n.frame = Math.floor(n.animT / 0.14) % 2;
        return;
      }

      /* idle wandering: new heading every 1.5–4 s */
      n.walkT -= dt;
      if (n.walkT <= 0) {
        if (Math.random() < 0.27) {
          n.walkAng = Math.atan2(py - n.y, px - n.x) + (Math.random() - 0.5);
        } else {
          n.walkAng = Math.random() * Math.PI * 2;
        }
        n.walkT = 1.5 + Math.random() * 2.5;
      }
      var sp = 34;
      var nx = n.x + Math.cos(n.walkAng) * sp * dt;
      var ny = n.y + Math.sin(n.walkAng) * sp * dt;
      if (canStand(nx, ny)) { n.x = nx; n.y = ny; }
      else n.walkAng += Math.PI * (0.75 + Math.random() * 0.5);
      n.dir = dirFromAng(n.walkAng);
      n.animT += dt;
      n.frame = Math.floor(n.animT / 0.22) % 2;
    });

    /* despawn far citizens */
    npcs = npcs.filter(function (n) {
      return Math.hypot(n.x - px, n.y - py) < 26 * TS;
    });
  }

  function dirFromAng(a) {
    var deg = ((a * 180 / Math.PI) % 360 + 360) % 360;
    if (deg < 45 || deg >= 315) return 'right';
    if (deg < 135) return 'down';
    if (deg < 225) return 'left';
    return 'up';
  }

  /* horn blast → citizens within radius hop away for 1.2 s */
  function scatter(px, py, radiusPx) {
    npcs.forEach(function (n) {
      if (Math.hypot(n.x - px, n.y - py) < radiusPx) {
        n.scatterT = 1.2;
        n.fleeAng = Math.atan2(n.y - py, n.x - px);
      }
    });
  }

  /* car-vs-NPC collision: push citizen out of car path safely */
  function bumpFromCar(cx, cy, radiusPx, carAng, carSpeed) {
    var hit = false;
    npcs.forEach(function (n) {
      var dx = n.x - cx, dy = n.y - cy;
      var d = Math.hypot(dx, dy);
      if (d < radiusPx) {
        hit = true;
        var pushAng = d > 1 ? Math.atan2(dy, dx) : carAng + Math.PI / 2;
        var push = radiusPx - d + 8;
        var tx = n.x + Math.cos(pushAng) * push;
        var ty = n.y + Math.sin(pushAng) * push;
        if (World.canMove(tx, ty)) { n.x = tx; n.y = ty; }
        else if (World.canMove(tx, n.y)) { n.x = tx; }
        else if (World.canMove(n.x, ty)) { n.y = ty; }
        n.scatterT = Math.abs(carSpeed) > 60 ? 1.4 : 0.9;
        n.fleeAng = pushAng;
      }
    });
    return hit;
  }

  /* is any citizen near enough to chat? (E on foot) */
  function chatterNear(px, py) {
    var best = null, bd = 1.6 * TS * 1.6 * TS;
    npcs.forEach(function (n) {
      var d = (n.x - px) * (n.x - px) + (n.y - py) * (n.y - py);
      if (d < bd) { bd = d; best = n; }
    });
    return best;
  }

  function draw(ctx) {
    npcs.forEach(function (n) {
      var spr = Sprites.getCitizen(n.palette, n.dir, n.frame);
      ctx.drawImage(spr, Math.round(n.x - 16), Math.round(n.y - 26));
    });
  }

  return {
    init: init, update: update, scatter: scatter, bumpFromCar: bumpFromCar,
    chatterNear: chatterNear, draw: draw
  };
})();
