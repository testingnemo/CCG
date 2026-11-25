/* ============================================================
   ENGINE · vehicles.js — Stabilized GTA-style driving & collisions
   • Slow / Road / Fast (SHIFT) speed tiers + handbrake (SPACE)
   • Speed-attenuated steering + angular velocity damping + road-lane assist
   • Oriented bounding box (OBB) + sub-stepped collisions
   • Destructible trees (stumps) & road lights (extinguishes night glow)
   • Solid houses & river, car-vs-car separation, car-vs-NPC knockback
   • Safe exit check (World.canMove) so hero never exits into water/walls
   ============================================================ */
'use strict';

var Vehicles = (function () {
  var TS = 32;
  var cars = [];                  // {x,y,ang,angVel,speed,color,ai,parked,route,t,dir,stunT,hitCd}
  var particles = [];             // debris / sparks / leaves when breaking objects
  var driving = null;
  var camShake = 0;
  var currentMode = 'ROAD';

  var SPEED_SLOW = 135;
  var SPEED_ROAD = 245;
  var SPEED_FAST = 385;
  var REVERSE_MAX = 145;
  var ACCEL = 320, ACCEL_FAST = 480, BRAKE = 520, HANDBRAKE = 780, FRICTION = 165;
  var BASE_TURN = 2.9;
  var CAR_HL = 18, CAR_HW = 10;   // OBB half-length & half-width (matches 44x24 sprite)

  function init() {}

  /* ---------- spawn world cars ---------- */
  function spawn() {
    cars.length = 0;
    particles.length = 0;

    addParked(WORLD_MAP.startCar.x, WORLD_MAP.startCar.y, '#e07be0');
    WORLD_MAP.parkedCars.forEach(function (p) {
      addParked(p.x, p.y, p.color);
    });

    WORLD_MAP.trafficRoutes.forEach(function (r, ri) {
      var per = Math.max(2, Math.floor(routeLen(r.route) / r.gap));
      for (var i = 0; i < per; i++) {
        var t = (i + 0.35) / per;
        var pos = pointOnRoute(r.route, t);
        cars.push({
          x: pos.x, y: pos.y,
          ang: pos.ang, angVel: 0,
          speed: 85 + Math.random() * 25,
          baseSpeed: 85 + Math.random() * 25,
          color: r.color, ai: true, ri: ri,
          t: t, dir: 1, route: r.route,
          honkCd: 0, hitCd: 0, stunT: 0, wheel: 0
        });
      }
    });
  }

  function routeLen(route) {
    var L = 0;
    for (var i = 0; i < route.length - 1; i++) {
      L += Math.hypot(route[i + 1][0] - route[i][0], route[i + 1][1] - route[i][1]);
    }
    return L;
  }

  function pointOnRoute(route, t) {
    var total = routeLen(route);
    var dist = ((t % 1) + 1) % 1 * total;
    for (var i = 0; i < route.length - 1; i++) {
      var seg = Math.hypot(route[i + 1][0] - route[i][0], route[i + 1][1] - route[i][1]);
      if (dist <= seg) {
        var f = seg > 0 ? dist / seg : 0;
        var x = (route[i][0] + (route[i + 1][0] - route[i][0]) * f) * TS + TS / 2;
        var y = (route[i][1] + (route[i + 1][1] - route[i][1]) * f) * TS + TS / 2;
        var ang = Math.atan2(route[i + 1][1] - route[i][1], route[i + 1][0] - route[i][0]);
        return { x: x, y: y, ang: ang };
      }
      dist -= seg;
    }
    var last = route[route.length - 1];
    return { x: last[0] * TS + TS / 2, y: last[1] * TS + TS / 2, ang: 0 };
  }

  function addParked(tx, ty, color) {
    cars.push({
      x: tx * TS + TS / 2, y: ty * TS + TS / 2,
      ang: 0, angVel: 0, speed: 0, color: color, ai: false, parked: true,
      route: null, wheel: 0, honkCd: 0, hitCd: 0, stunT: 0
    });
  }

  /* ---------- OBB geometry & world collision helpers ---------- */
  function obbPoints(x, y, ang) {
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var fx = ca * CAR_HL, fy = sa * CAR_HL;
    var rx = -sa * CAR_HW, ry = ca * CAR_HW;
    return [
      [x + fx + rx, y + fy + ry],   // front-right
      [x + fx - rx, y + fy - ry],   // front-left
      [x - fx + rx, y - fy + ry],   // rear-right
      [x - fx - rx, y - fy - ry],   // rear-left
      [x + fx,      y + fy],        // front nose
      [x - fx,      y - fy],        // rear tail
      [x + rx,      y + ry],        // mid-right
      [x - rx,      y - ry]         // mid-left
    ];
  }

  function canCarFit(x, y, ang) {
    var pts = obbPoints(x, y, ang);
    for (var i = 0; i < pts.length; i++) {
      if (!World.drivableAt(pts[i][0], pts[i][1])) return false;
    }
    return true;
  }

  /* check if a point (e.g. hero or NPC feet) touches any car hull */
  function collidesPoint(px, py, pad) {
    var p = pad || 0;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c === driving) continue;
      var dx = px - c.x, dy = py - c.y;
      if (dx * dx + dy * dy > (CAR_HL + p + 6) * (CAR_HL + p + 6)) continue;
      var ca = Math.cos(-c.ang), sa = Math.sin(-c.ang);
      var lx = dx * ca - dy * sa;
      var ly = dx * sa + dy * ca;
      if (Math.abs(lx) < CAR_HL + p && Math.abs(ly) < CAR_HW + p) return true;
    }
    return false;
  }

  /* ---------- debris particles ---------- */
  function spawnDebris(wx, wy, kind, count) {
    var cols = kind === 'lamp'
      ? ['#ffe08a', '#ffffff', '#636875', '#ffd166']
      : (kind === 'tree'
        ? ['#4c9247', '#3e7d3a', '#7a4a21', '#a9743f']
        : ['#ffd166', '#e5e7eb', '#f97316']);
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 140;
      particles.push({
        x: wx, y: wy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.35, maxLife: 0.7,
        size: 2 + Math.random() * 3,
        color: cols[Math.floor(Math.random() * cols.length)]
      });
    }
    if (particles.length > 140) particles.splice(0, particles.length - 140);
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9; p.vy *= 0.9;
    }
  }

  /* ---------- break destructible tiles touched by car OBB ---------- */
  function tryBreakTiles(c, x, y, speed) {
    var pts = obbPoints(x, y, c.ang);
    var seen = {};
    var brokeLamp = 0, brokeTree = 0;
    for (var i = 0; i < pts.length; i++) {
      var tx = Math.floor(pts[i][0] / TS), ty = Math.floor(pts[i][1] / TS);
      var k = tx + ',' + ty;
      if (seen[k]) continue;
      seen[k] = true;
      var res = World.hitTile(tx, ty, Math.abs(speed));
      if (res) {
        var cx = tx * TS + TS / 2, cy = ty * TS + TS / 2;
        if (res.broken === 'lamp') {
          brokeLamp++;
          spawnDebris(cx, cy, 'lamp', 14);
        } else if (res.broken === 'tree') {
          brokeTree++;
          spawnDebris(cx, cy, 'tree', 18);
        }
      }
    }
    if (brokeLamp || brokeTree) {
      if (c.hitCd <= 0) { AudioSys.sfx('crash'); c.hitCd = 0.16; }
      camShake = Math.max(camShake, brokeTree ? 0.55 : 0.35);
      c.speed *= brokeTree ? 0.72 : 0.88;
      if (brokeLamp) HUD.toast('💥 Road light smashed!');
      else if (brokeTree) HUD.toast('🌲 Tree felled!');
    }
  }

  /* ---------- enter / exit car ---------- */
  function nearestCar(px, py, maxTiles) {
    var best = null, bd = (maxTiles * TS) * (maxTiles * TS);
    cars.forEach(function (c) {
      var d = (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }

  function tryEnter(px, py) {
    var c = nearestCar(px, py, 2.2);
    if (!c) { HUD.toast('No car within reach.'); return false; }
    driving = c;
    c.parked = false;
    c.ai = false;         // hijacked AI cars become player-owned parked cars on exit
    c.route = null;
    c.angVel = 0;
    c.stunT = 0;
    if (Input.resetVehicleState) Input.resetVehicleState();
    AudioSys.sfx('open');
    AudioSys.engineOn();
    HUD.banner('🚗 VEHICLE ACQUIRED — W/S drive · SHIFT fast · G slow · SPACE brake · F exit', 3400);
    return true;
  }

  function exit() {
    if (!driving) return;
    var candidates = [
      driving.ang + Math.PI / 2,
      driving.ang - Math.PI / 2,
      driving.ang + Math.PI,
      driving.ang,
      driving.ang + Math.PI * 0.75,
      driving.ang - Math.PI * 0.75
    ];
    var radii = [32, 24, 40];
    var placed = false;
    for (var r = 0; r < radii.length && !placed; r++) {
      for (var i = 0; i < candidates.length; i++) {
        var ex = driving.x + Math.cos(candidates[i]) * radii[r];
        var ey = driving.y + Math.sin(candidates[i]) * radii[r];
        if (World.canMove(ex, ey)) {
          Player.placeAtPx(ex, ey);
          placed = true;
          break;
        }
      }
    }
    if (!placed) Player.placeAtPx(driving.x, driving.y);

    driving.speed = 0;
    driving.angVel = 0;
    driving.parked = true;
    driving = null;
    if (Input.resetVehicleState) Input.resetVehicleState();
    AudioSys.engineOff();
  }

  /* ---------- physics for the driven car ---------- */
  function updatePlayerCar(dt, dv) {
    var c = driving;
    if (!c) return;
    if (c.hitCd > 0) c.hitCd = Math.max(0, c.hitCd - dt);

    var ax = dv.gas || 0;
    var steer = dv.steer || 0;
    var brake = !!dv.brake;
    var onRoad = World.isRoad(c.x, c.y);

    /* speed tier & road grip */
    var cap = dv.fast ? SPEED_FAST : (dv.slow ? SPEED_SLOW : SPEED_ROAD);
    if (!onRoad) cap *= 0.78;
    currentMode = !onRoad ? 'OFFROAD' : (dv.fast ? 'FAST' : (dv.slow ? 'SLOW' : 'ROAD'));

    var target = ax > 0 ? ax * cap : ax * REVERSE_MAX;
    var acc = dv.fast ? ACCEL_FAST : ACCEL;

    if (brake) {
      if (Math.abs(c.speed) > 160 && c.hitCd <= 0) {
        AudioSys.sfx('skid');
        c.hitCd = 0.35;
      }
      if (c.speed > 0) c.speed = Math.max(0, c.speed - HANDBRAKE * dt);
      else if (c.speed < 0) c.speed = Math.min(0, c.speed + HANDBRAKE * dt);
    } else if (ax !== 0) {
      if (target > c.speed) c.speed = Math.min(target, c.speed + (c.speed < 0 ? BRAKE : acc) * dt);
      else if (target < c.speed) c.speed = Math.max(target, c.speed - (c.speed > 0 ? BRAKE : acc) * dt);
    } else {
      var drag = onRoad ? FRICTION : FRICTION * 1.45;
      if (c.speed > 0) c.speed = Math.max(0, c.speed - drag * dt);
      else if (c.speed < 0) c.speed = Math.min(0, c.speed + drag * dt);
    }

    /* speed-stabilized steering + angular velocity damping */
    var speedAbs = Math.abs(c.speed);
    var sf = Math.min(1, speedAbs / 55);
    var speedRatio = Math.min(1, speedAbs / SPEED_FAST);
    var turnCap = BASE_TURN / (1 + 0.85 * speedRatio);
    var wantAngVel = steer * turnCap * sf * (c.speed < -5 ? -1 : 1);

    if (steer !== 0) {
      c.angVel += (wantAngVel - c.angVel) * Math.min(1, dt * 15);
    } else {
      c.angVel *= Math.max(0, 1 - 16 * dt);
      if (Math.abs(c.angVel) < 0.02) c.angVel = 0;
    }

    var nextAng = c.ang + c.angVel * dt;
    /* subtle straight-line road-lane stabilization when coasting straight on road */
    if (steer === 0 && onRoad && speedAbs > 85) {
      var snap = Math.round(nextAng / (Math.PI / 2)) * (Math.PI / 2);
      var diff = angDiff(snap, nextAng);
      if (Math.abs(diff) < 0.14) {
        nextAng += diff * Math.min(1, dt * 3.5);
      }
    }
    if (canCarFit(c.x, c.y, nextAng)) {
      c.ang = nextAng;
    } else {
      c.angVel = 0;
    }

    moveCarSubstepped(c, dt);
    resolveCarCollisions(dt);

    /* hero rides the car; citizens get bumped safely */
    Player.placeAtPx(c.x, c.y);
    Player.setRiding(true);
    NPC.bumpFromCar(c.x, c.y, 24, c.ang, c.speed);
    AudioSys.engineRev(Math.min(1, Math.abs(c.speed) / SPEED_FAST));

    if (c.hitWall) {
      camShake = Math.max(camShake, Math.min(0.85, Math.abs(c.speed) / SPEED_FAST));
      if (Math.abs(c.speed) > 90 && c.hitCd <= 0) {
        AudioSys.sfx('hit');
        c.hitCd = 0.26;
      }
      c.speed *= 0.65;
    }
    camShake = Math.max(0, camShake - dt * 2.2);
    updateParticles(dt);
  }

  function moveCarSubstepped(c, dt) {
    var totalDist = Math.abs(c.speed) * dt;
    var steps = Math.max(1, Math.ceil(totalDist / 7));
    var subDt = dt / steps;
    c.hitWall = false;

    for (var s = 0; s < steps; s++) {
      var nx = c.x + Math.cos(c.ang) * c.speed * subDt;
      var ny = c.y + Math.sin(c.ang) * c.speed * subDt;

      tryBreakTiles(c, nx, ny, c.speed);

      if (canCarFit(nx, ny, c.ang)) {
        c.x = nx; c.y = ny;
      } else {
        tryBreakTiles(c, nx, c.y, c.speed);
        if (canCarFit(nx, c.y, c.ang)) {
          c.x = nx;
          c.hitWall = true;
        } else {
          tryBreakTiles(c, c.x, ny, c.speed);
          if (canCarFit(c.x, ny, c.ang)) {
            c.y = ny;
            c.hitWall = true;
          } else {
            c.hitWall = true;
            c.speed *= -0.15;      // gentle bounce off solid house/water
            break;
          }
        }
      }
    }
  }

  /* ---------- car-vs-car separation & impact ---------- */
  function resolveCarCollisions(dt) {
    var minDist = 29;
    for (var i = 0; i < cars.length; i++) {
      for (var j = i + 1; j < cars.length; j++) {
        var a = cars[i], b = cars[j];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = dx * dx + dy * dy;
        if (d2 >= minDist * minDist) continue;
        var d = Math.sqrt(d2) || 0.01;
        var nx = dx / d, ny = dy / d;
        var overlap = (minDist - d) * 0.55;

        var ax = a.x - nx * overlap, ay = a.y - ny * overlap;
        var bx = b.x + nx * overlap, by = b.y + ny * overlap;
        if (canCarFit(ax, ay, a.ang)) { a.x = ax; a.y = ay; }
        if (canCarFit(bx, by, b.ang)) { b.x = bx; b.y = by; }

        var involvesPlayer = (a === driving || b === driving);
        if (involvesPlayer) {
          var playerCar = (a === driving) ? a : b;
          var otherCar = (a === driving) ? b : a;
          var relSpeed = Math.abs(playerCar.speed);
          if (relSpeed > 75 && playerCar.hitCd <= 0) {
            AudioSys.sfx('crash');
            playerCar.hitCd = 0.28;
            spawnDebris((a.x + b.x) / 2, (a.y + b.y) / 2, 'spark', 10);
            camShake = Math.max(camShake, Math.min(0.8, relSpeed / SPEED_FAST));
          }
          if (otherCar.ai) {
            otherCar.stunT = 2.0;
            otherCar.speed = 0;
          }
          playerCar.speed *= 0.62;
        } else if (a.ai && b.ai) {
          a.speed = Math.min(a.speed, 30);
          b.speed = Math.min(b.speed, 30);
        }
      }
    }
  }

  /* ---------- AI traffic ---------- */
  function aiObstacleAhead(c) {
    var lookX = c.x + Math.cos(c.ang) * 44;
    var lookY = c.y + Math.sin(c.ang) * 44;
    for (var i = 0; i < cars.length; i++) {
      var o = cars[i];
      if (o === c) continue;
      if (Math.hypot(o.x - lookX, o.y - lookY) < 28) return true;
    }
    if (!Player.riding && Math.hypot(Player.x - lookX, Player.y - lookY) < 26) return true;
    return false;
  }

  function updateAI(dt) {
    cars.forEach(function (c) {
      if (c.hitCd > 0) c.hitCd = Math.max(0, c.hitCd - dt);
      if (!c.ai || c === driving || c.parked) return;
      if (c.stunT > 0) { c.stunT = Math.max(0, c.stunT - dt); return; }

      var total = routeLen(c.route);
      var curPos = pointOnRoute(c.route, c.t);
      var aheadPos = pointOnRoute(c.route, c.t + (55 / (total * TS)));
      var corner = Math.abs(angDiff(aheadPos.ang, curPos.ang)) > 0.35;
      var targetSpd = aiObstacleAhead(c) ? 0 : (corner ? 62 : (c.baseSpeed || 95));

      if (c.speed < targetSpd) c.speed = Math.min(targetSpd, c.speed + 140 * dt);
      else if (c.speed > targetSpd) c.speed = Math.max(targetSpd, c.speed - 240 * dt);

      if (c.speed > 1) {
        var nextT = c.t + (c.speed * dt / (total * TS)) * c.dir;
        if (nextT >= 1) nextT -= 1;
        if (nextT < 0) nextT += 1;
        var pos = pointOnRoute(c.route, nextT);
        var diff = angDiff(pos.ang, c.ang);
        var nextAng = c.ang + Math.max(-3.8 * dt, Math.min(3.8 * dt, diff));

        if (canCarFit(pos.x, pos.y, nextAng)) {
          c.t = nextT;
          c.x = pos.x; c.y = pos.y;
          c.ang = nextAng;
        } else {
          c.speed = 0;
        }
        NPC.bumpFromCar(c.x, c.y, 22, c.ang, c.speed);
      }
    });
    resolveCarCollisions(dt);
    if (!driving) updateParticles(dt);
  }

  function angDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /* ---------- horn ---------- */
  function horn() {
    if (!driving) return false;
    AudioSys.horn();
    NPC.scatter(driving.x, driving.y, 6 * TS);
    return true;
  }

  /* ---------- draw (called from main render, world space) ---------- */
  function draw(ctx) {
    cars.forEach(function (c) {
      var spr = Sprites.getCar(c.color);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.ang);
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
    });

    /* debris / spark particles */
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawLights(ctx) {
    if (!DayNight.isNight()) return;
    cars.forEach(function (c) {
      if (c.parked) return;
      var reach = WORLD_MAP.city.carHeadlightReach * TS;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.ang);
      var grad = ctx.createLinearGradient(0, 0, reach, 0);
      grad.addColorStop(0, 'rgba(255,240,190,0.30)');
      grad.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(reach, -reach * 0.38);
      ctx.lineTo(reach, reach * 0.38);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  }

  function restoreCars(saved) {
    if (!saved || !saved.length) return;
    var keepers = cars.filter(function (c) { return c.ai; });
    saved.forEach(function (s) {
      keepers.push({
        x: s.x, y: s.y, ang: s.ang || 0, angVel: 0, speed: 0,
        color: s.color, ai: false, parked: true, route: null, wheel: 0, honkCd: 0, hitCd: 0, stunT: 0
      });
    });
    cars = keepers;
  }

  function serialize() {
    return cars.filter(function (c) { return !c.ai; }).map(function (c) {
      return { x: Math.round(c.x), y: Math.round(c.y), ang: Math.round(c.ang * 100) / 100, color: c.color };
    });
  }

  return {
    init: init, spawn: spawn, updatePlayerCar: updatePlayerCar, updateAI: updateAI,
    tryEnter: tryEnter, exit: exit, horn: horn, draw: draw, drawLights: drawLights,
    serialize: serialize, restoreCars: restoreCars, nearestCar: nearestCar,
    collidesPoint: collidesPoint,
    all: function () { return cars; },
    get driving() { return driving; },
    get shake() { return camShake; },
    get modeLabel() { return currentMode; }
  };
})();
