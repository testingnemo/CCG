/* ============================================================
   ENGINE · minimap.js — GTA-style radar + pause map
   • corner radar: live position, location pads, bosses, cars,
     waypoint, and the day/night tint
   • pause map (M): the whole world, click to set a waypoint
   ============================================================ */
'use strict';

var Minimap = (function () {
  var TS = 32;
  var radarCvs = null, radarCtx = null;
  var mapEl = null, mapCvs = null, mapCtx = null;
  var waypoint = null;            // world px {x,y} set from the pause map
  var R = 130;                     // radar radius in screen px

  function init() {
    radarCvs = document.getElementById('radar');
    if (radarCvs) radarCtx = radarCvs.getContext('2d');
    mapEl = document.getElementById('bigmap');
    if (mapEl) {
      mapCvs = mapEl.querySelector('canvas');
      mapCtx = mapCvs.getContext('2d');
      mapCvs.addEventListener('click', onMapClick);
      mapEl.addEventListener('click', function (e) {   /* backdrop = close */
        if (e.target === mapEl) toggle(false);
      });
    }
    document.getElementById('btn-map').addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });
    var closer = mapEl.querySelector('.map-close');
    if (closer) closer.addEventListener('click', function (e) { e.stopPropagation(); toggle(false); });
  }

  function toggle(force) {
    if (!mapEl) return;
    var show = (force === undefined) ? !mapEl.classList.contains('show') : force;
    mapEl.classList.toggle('show', show);
    if (show) drawFull();
    AudioSys.sfx('click');
  }
  function isOpen() { return mapEl && mapEl.classList.contains('show'); }

  /* click on the full map → waypoint in world px */
  function onMapClick(e) {
    var rect = mapCvs.getBoundingClientRect();
    var mx = (e.clientX - rect.left) / rect.width * mapCvs.width;
    var my = (e.clientY - rect.top) / rect.height * mapCvs.height;
    var ps = World.pixelSize();
    waypoint = { x: mx / mapCvs.width * ps.w, y: my / mapCvs.height * ps.h };
    AudioSys.sfx('key');
    HUD.toast('📍 Waypoint set — follow the purple dot');
    drawFull();
  }

  function clearWaypoint() { waypoint = null; }
  function setWaypoint(wp) { waypoint = wp || null; }

  /* ---------- the radar (drawn every frame) ---------- */
  function drawRadar(ctx, cw, ch) {
    if (!radarCtx) return;
    var rs = radarCvs.width;                        // radar sprite size (square)
    var ps = World.pixelSize();
    var px = Player.x, py = Player.y;

    var world = 84 * TS;                            // radar shows ~84 tiles
    var k = rs / world;

    var g = radarCtx;
    g.clearRect(0, 0, rs, rs);
    g.save();
    g.beginPath(); g.arc(rs / 2, rs / 2, rs / 2 - 1, 0, 7); g.clip();

    /* base disc: grass/water tint by region of the CENTER point */
    g.fillStyle = '#234a2e';
    g.fillRect(0, 0, rs, rs);

    /* water rows on the radar */
    var R = WORLD_MAP.river;
    var riverY0 = (R.top * TS - py) * k + rs / 2;
    var riverY1 = ((R.bottom + 1) * TS - py) * k + rs / 2;
    g.fillStyle = '#2e86c1';
    g.fillRect(0, riverY0, rs, riverY1 - riverY0);

    /* roads */
    g.strokeStyle = 'rgba(240,240,240,.5)'; g.lineWidth = 2;
    WORLD_MAP.roads.h.forEach(function (ry) {
      var y = (ry * TS + TS / 2 - py) * k + rs / 2;
      g.beginPath(); g.moveTo(0, y); g.lineTo(rs, y); g.stroke();
    });
    WORLD_MAP.roads.v.forEach(function (rx) {
      var x = (rx * TS + TS / 2 - px) * k + rs / 2;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, rs); g.stroke();
    });

    /* location pads (unit-colored, done = faded) */
    WORLD_MAP.locations.forEach(function (l) {
      var x = (l.x * TS + 16 - px) * k + rs / 2;
      var y = (l.y * TS + 16 - py) * k + rs / 2;
      if (x < -4 || y < -4 || x > rs + 4 || y > rs + 4) return;
      var done = Game.isCleared(l.id);
      g.fillStyle = done ? 'rgba(255,255,255,.35)' : WORLD_MAP.units[l.unit - 1].color;
      g.beginPath(); g.arc(x, y, done ? 3 : 4.5, 0, 7); g.fill();
    });

    /* boss arenas */
    WORLD_MAP.units.forEach(function (u) {
      var x = (u.boss.x * TS + 16 - px) * k + rs / 2;
      var y = (u.boss.y * TS + 16 - py) * k + rs / 2;
      if (x < -4 || y < -4 || x > rs + 4 || y > rs + 4) return;
      var beaten = Game.bossBeaten(u.id);
      var open = Game.unitCleared(u.id);
      g.fillStyle = beaten ? '#8d8578' : open ? '#e74c3c' : '#5b6167';
      g.fillRect(x - 3.5, y - 3.5, 7, 7);
    });

    /* waypoint */
    if (waypoint) {
      var wx = (waypoint.x - px) * k + rs / 2;
      var wy = (waypoint.y - py) * k + rs / 2;
      g.fillStyle = '#c77dff';
      g.beginPath(); g.arc(wx, wy, 5, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    }

    /* nearby cars */
    if (typeof Vehicles !== 'undefined' && Vehicles.all) {
      Vehicles.all().forEach(function (c) {
        var cx = (c.x - px) * k + rs / 2;
        var cy = (c.y - py) * k + rs / 2;
        if (cx < -4 || cy < -4 || cx > rs + 4 || cy > rs + 4) return;
        g.fillStyle = c === Vehicles.driving ? '#fff' : (c.ai ? '#93c5fd' : '#f9a8d4');
        g.fillRect(cx - 2, cy - 2, 4, 4);
      });
    }

    g.restore();

    /* hero arrow at center (points where you face) */
    var ang = Player.facing();
    g.save();
    g.translate(rs / 2, rs / 2);
    g.rotate(ang + Math.PI / 2);
    g.fillStyle = '#ffd166';
    g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5); g.closePath(); g.fill();
    g.restore();

    /* rim */
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3;
    g.beginPath(); g.arc(rs / 2, rs / 2, rs / 2 - 2, 0, 7); g.stroke();
  }

  /* ---------- the full pause map ---------- */
  function drawFull() {
    if (!mapCtx) return;
    var MW = mapCvs.width, MH = mapCvs.height;
    var ps = World.pixelSize();
    var kx = MW / ps.w, ky = MH / ps.h;
    var g = mapCtx;

    g.fillStyle = '#1c3b2a';
    g.fillRect(0, 0, MW, MH);

    /* river band */
    var R = WORLD_MAP.river;
    g.fillStyle = '#2e86c1';
    g.fillRect(0, R.top * TS * ky, MW, (R.bottom - R.top + 1) * TS * ky);

    /* bridge */
    g.fillStyle = '#a9743f';
    g.fillRect(WORLD_MAP.bridge.left * TS * kx, R.top * TS * ky,
               (WORLD_MAP.bridge.right - WORLD_MAP.bridge.left + 1) * TS * kx,
               (R.bottom - R.top + 1) * TS * ky);

    /* roads */
    g.strokeStyle = 'rgba(230,230,230,.65)'; g.lineWidth = Math.max(1.5, TS * ky);
    WORLD_MAP.roads.h.forEach(function (ry) {
      var y = (ry + 0.5) * TS * ky;
      g.beginPath(); g.moveTo(0, y); g.lineTo(MW, y); g.stroke();
    });
    WORLD_MAP.roads.v.forEach(function (rx) {
      var x = (rx + 0.5) * TS * kx;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, MH); g.stroke();
    });

    /* locations with labels */
    WORLD_MAP.locations.forEach(function (l) {
      var x = (l.x + 0.5) * TS * kx, y = (l.y + 0.5) * TS * ky;
      var done = Game.isCleared(l.id);
      g.fillStyle = done ? '#6b7280' : WORLD_MAP.units[l.unit - 1].color;
      g.beginPath(); g.arc(x, y, done ? 3.5 : 5, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#f0fdf4';
      g.font = '10px system-ui';
      var rightEdge = x > MW * 0.76;
      g.textAlign = rightEdge ? 'right' : 'left';
      g.fillText((done ? '✔ ' : '') + l.name, rightEdge ? x - 7 : x + 7, y + 3);
    });

    /* boss arenas */
    WORLD_MAP.units.forEach(function (u) {
      var x = (u.boss.x + 0.5) * TS * kx, y = (u.boss.y + 0.5) * TS * ky;
      var beaten = Game.bossBeaten(u.id);
      g.fillStyle = beaten ? '#8d8578' : '#e74c3c';
      g.fillRect(x - 4.5, y - 4.5, 9, 9);
      g.fillStyle = '#fff'; g.font = 'bold 10px system-ui';
      var rightEdge = x > MW * 0.76;
      g.textAlign = rightEdge ? 'right' : 'left';
      g.fillText(u.boss.icon + ' ' + u.boss.name, rightEdge ? x - 7 : x + 7, y + 3);
    });
    g.textAlign = 'left';

    /* the hero */
    g.fillStyle = '#ffd166';
    g.beginPath(); g.arc(Player.x * kx, Player.y * ky, 4, 0, 7); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();

    /* waypoint */
    if (waypoint) {
      g.fillStyle = '#c77dff';
      g.beginPath(); g.arc(waypoint.x * kx, waypoint.y * ky, 6, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    }
  }

  return {
    init: init, drawRadar: drawRadar, drawFull: drawFull, toggle: toggle,
    isOpen: isOpen, clearWaypoint: clearWaypoint, setWaypoint: setWaypoint,
    get waypoint() { return waypoint; }
  };
})();
