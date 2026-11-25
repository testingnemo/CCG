/* ============================================================
   ENGINE · player.js — the coder's body: movement, collision,
   camera & walk animation. Feet-first collision via World.canMove.
   GTA-level: sprint (hold SHIFT), riding flag for when the hero
   sits in a car (drawn hidden, position driven by vehicles.js).
   ============================================================ */
'use strict';

var Player = (function () {
  var TS = WORLD_MAP.tileSize;
  var x = 0, y = 0;                 // feet-center in world px
  var dir = 'down', moving = false, frame = 0, animT = 0;
  var speed = 150;                   // walking px/s
  var RUN_SPEED = 260;               // sprinting px/s
  var camX = 0, camY = 0;
  var riding = false;                // true while driving a car

  function placeAt(tx, ty) { x = tx * TS + TS / 2; y = ty * TS + TS / 2; }
  function placeAtPx(px, py) { x = px; y = py; }

  function update(dt, sprint) {
    if (riding) return;                          // the car moves the hero
    var ax = Input.axis();
    moving = (ax.x !== 0 || ax.y !== 0);
    if (!moving) { animT = 0; return; }

    var spd = sprint ? RUN_SPEED : speed;

    if (ax.y < 0) dir = 'up';
    else if (ax.y > 0) dir = 'down';
    if (ax.x < 0) dir = 'left';
    else if (ax.x > 0) dir = 'right';

    /* diagonal stays fair: normalize */
    var len = Math.hypot(ax.x, ax.y) || 1;
    var dx = (ax.x / len) * spd * dt;
    var dy = (ax.y / len) * spd * dt;

    /* slide along walls & parked/moving cars */
    var canStep = function (px, py) {
      return World.canMove(px, py) &&
             !(typeof Vehicles !== 'undefined' && Vehicles.collidesPoint && Vehicles.collidesPoint(px, py, 6));
    };
    if (canStep(x + dx, y + dy)) { x += dx; y += dy; }
    else if (canStep(x + dx, y)) { x += dx; }
    else if (canStep(x, y + dy)) { y += dy; }

    animT += dt;
    frame = Math.floor(animT / (sprint ? 0.11 : 0.16)) % 2;
    AudioSys.step();
  }

  /* camera follows the feet (with subtle smooth look-ahead while driving) */
  function updateCamera(viewW, viewH, dt) {
    var ps = World.pixelSize();
    var lookX = 0, lookY = 0;
    if (riding && typeof Vehicles !== 'undefined' && Vehicles.driving) {
      var c = Vehicles.driving;
      lookX = Math.cos(c.ang) * Math.min(48, Math.abs(c.speed) * 0.12);
      lookY = Math.sin(c.ang) * Math.min(48, Math.abs(c.speed) * 0.12);
    }
    var tx = x + lookX - viewW / 2, ty = y + lookY - viewH / 2;
    var clampedX = ps.w > viewW ? Math.max(0, Math.min(ps.w - viewW, tx)) : (ps.w - viewW) / 2;
    var clampedY = ps.h > viewH ? Math.max(0, Math.min(ps.h - viewH, ty)) : (ps.h - viewH) / 2;
    if (riding && dt) {
      var k = Math.min(1, dt * 10);
      camX += (clampedX - camX) * k;
      camY += (clampedY - camY) * k;
    } else {
      camX = clampedX;
      camY = clampedY;
    }
  }

  function draw(ctx) {
    if (riding) return;                          // hero sits inside the car sprite
    var spr = Sprites.get('hero-' + dir + '-' + (moving ? frame : 0));
    /* sprite canvas is 32×32; feet anchor at (x,y) bottom-ish */
    ctx.drawImage(spr, Math.round(x - 16), Math.round(y - 26));
  }

  function facing() {                             // for the radar arrow
    return { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[dir] || 0;
  }

  return {
    update: update, draw: draw, placeAt: placeAt, placeAtPx: placeAtPx, updateCamera: updateCamera,
    facing: facing,
    setRiding: function (r) { riding = r; },
    get x() { return x; }, get y() { return y; },
    get camX() { return camX; }, get camY() { return camY; },
    get riding() { return riding; }
  };
})();
