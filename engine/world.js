/* ============================================================
   ENGINE · world.js — builds the playable map FROM data/world-map.js
   This file knows NOTHING about lesson content. Layout comes
   100% from WORLD_MAP (data/world-map.js) — now with ROADS.
   ============================================================ */
'use strict';

var World = (function () {
  var TS, COLS, ROWS;
  var T = {
    GRASS: 0, WATER: 1, TREE: 2, FL0: 3, FL1: 4, FL2: 5, BRIDGE: 6,
    PAD: 7, ARENA: 8, ROAD: 9, HOUSE: 10, LAMP: 11, STUMP: 12, LAMP_BROKEN: 13
  };
  var tiles = null;
  var protectedPts = [];
  var lamps = [];                       // [{x,y}] tile coords for night glow
  var broken = [];                      // [{x,y,t}] persisted broken trees & lamps

  /* deterministic RNG so the forest is identical every load */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function idx(tx, ty) { return ty * COLS + tx; }

  function build() {
    TS = WORLD_MAP.tileSize; COLS = WORLD_MAP.cols; ROWS = WORLD_MAP.rows;
    var R = WORLD_MAP.river, B = WORLD_MAP.bridge, SP = WORLD_MAP.spawn;
    var ROADS = WORLD_MAP.roads;
    tiles = new Uint8Array(COLS * ROWS);
    lamps = [];
    broken = [];

    /* 1. grass everywhere */
    tiles.fill(T.GRASS);

    /* 2. the great river */
    for (var y = R.top; y <= R.bottom; y++)
      for (var x = 0; x < COLS; x++) tiles[idx(x, y)] = T.WATER;

    /* 3. the wooden bridge (walkable + drivable) */
    for (var by = R.top; by <= R.bottom; by++)
      for (var bx = B.left; bx <= B.right; bx++) tiles[idx(bx, by)] = T.BRIDGE;

    /* 4. ROADS — the city grid. h rows & v cols, roads cross the river
          only via the bridge deck (handled below). */
    ROADS.h.forEach(function (ry) {
      for (var x = 1; x < COLS - 1; x++) {
        /* a road row crossing the river must stop at the bridge edges;
           the bridge itself is already drivable */
        if (ry >= R.top && ry <= R.bottom) {
          if (x < B.left || x > B.right) continue;
          tiles[idx(x, ry)] = T.BRIDGE; continue;
        }
        tiles[idx(x, ry)] = T.ROAD;
      }
    });
    ROADS.v.forEach(function (rx) {
      for (var y = 1; y < ROWS - 1; y++) {
        if (y >= R.top && y <= R.bottom) {
          /* vertical road crossing the river: only on the bridge span */
          if (rx < B.left || rx > B.right) continue;
          tiles[idx(rx, y)] = T.BRIDGE; continue;
        }
        tiles[idx(rx, y)] = T.ROAD;
      }
    });
    /* the bridge deck is a road too (drivable) — mark approach tiles */
    for (var bx2 = B.left; bx2 <= B.right; bx2++)
      for (var by2 = R.top - 1; by2 <= R.bottom + 1; by2++) {
        if (by2 >= R.top && by2 <= R.bottom) continue;   // deck itself stays BRIDGE
        if (by2 < 0 || by2 >= ROWS) continue;
        if (tiles[idx(bx2, by2)] === T.GRASS) tiles[idx(bx2, by2)] = T.ROAD;
      }

    /* 5. protect points: pads, arenas, spawn (no trees/houses here) */
    protectedPts = [{ x: SP.x, y: SP.y, r: 4 }];
    WORLD_MAP.locations.forEach(function (l) { protectedPts.push({ x: l.x, y: l.y, r: 2 }); });
    WORLD_MAP.units.forEach(function (u) { protectedPts.push({ x: u.boss.x, y: u.boss.y, r: 3 }); });

    /* 6. scatter trees + flowers + houses + lamps with a seeded RNG */
    var rnd = mulberry32(WORLD_MAP.decor.seed);
    var nearRoad = function (tx, ty) {
      var best = 99;
      for (var i = 0; i < ROADS.h.length; i++) best = Math.min(best, Math.abs(ty - ROADS.h[i]));
      for (var j = 0; j < ROADS.v.length; j++) best = Math.min(best, Math.abs(tx - ROADS.v[j]));
      return best;
    };

    for (var ty = 2; ty < ROWS - 2; ty++) {
      for (var tx = 2; tx < COLS - 2; tx++) {
        if (tiles[idx(tx, ty)] !== T.GRASS) continue;

        /* keep the riverbanks scenic & the bridge corridor open */
        if (ty >= R.top - 2 && ty <= R.bottom + 2) continue;
        if (tx >= B.left - 3 && tx <= B.right + 3 && ty >= R.top - 6 && ty <= R.bottom + 6) continue;

        var blocked = protectedPts.some(function (p) {
          var dx = tx - p.x, dy = ty - p.y;
          return dx * dx + dy * dy < p.r * p.r;
        });
        if (blocked) continue;

        /* lamps: line the roads at intervals */
        var d = nearRoad(tx, ty);
        var roll = rnd();
        if (d === 1 && roll < WORLD_MAP.decor.lampDensity * 4) {
          tiles[idx(tx, ty)] = T.LAMP; lamps.push({ x: tx, y: ty });
          continue;
        }
        if (d <= 3 && roll < WORLD_MAP.decor.houseDensity * 6) {
          tiles[idx(tx, ty)] = T.HOUSE; continue;      // little houses cluster near roads
        }
        if (roll < WORLD_MAP.decor.treeDensity) tiles[idx(tx, ty)] = T.TREE;
        else if (roll < WORLD_MAP.decor.treeDensity + WORLD_MAP.decor.flowerDensity) {
          var fr = rnd();
          tiles[idx(tx, ty)] = fr < 0.34 ? T.FL0 : (fr < 0.67 ? T.FL1 : T.FL2);
        }
      }
    }

    /* 7. mark pad & arena tiles for the minimap glow */
    WORLD_MAP.locations.forEach(function (l) { tiles[idx(l.x, l.y)] = T.PAD; });
    WORLD_MAP.units.forEach(function (u) { tiles[idx(u.boss.x, u.boss.y)] = T.ARENA; });
  }

  /* ---- collision: a small box around the hero's feet ---- */
  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return T.WATER;
    return tiles[idx(tx, ty)];
  }

  function walkableAt(px, py) {
    var tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    var t = tileAt(tx, ty);
    return t !== T.WATER && t !== T.TREE && t !== T.HOUSE && t !== T.LAMP;
  }

  function canMove(cx, cy) {          // cx,cy = feet center in world px
    var hw = 8, hh = 5;               // half-width / half-height of feet box
    return walkableAt(cx - hw, cy - hh) && walkableAt(cx + hw, cy - hh) &&
           walkableAt(cx - hw, cy + hh) && walkableAt(cx + hw, cy + hh);
  }

  /* roads & bridge are drivable; grass is drivable too (GTA-style offroad) */
  function drivableAt(px, py) {
    var tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    var t = tileAt(tx, ty);
    return t !== T.WATER && t !== T.TREE && t !== T.HOUSE && t !== T.LAMP;
  }

  function canDrive(cx, cy, hw, hh) {
    return drivableAt(cx - hw, cy - hh) && drivableAt(cx + hw, cy - hh) &&
           drivableAt(cx - hw, cy + hh) && drivableAt(cx + hw, cy + hh);
  }

  function isRoad(px, py) {
    var tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    var t = tileAt(tx, ty);
    return t === T.ROAD || t === T.BRIDGE;
  }

  /* attempt to break destructible obstacles (trees & road lights; houses & water stay solid) */
  function hitTile(tx, ty, impactSpeed) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null;
    var t = tiles[idx(tx, ty)];
    if (t === T.LAMP && impactSpeed >= 30) {
      tiles[idx(tx, ty)] = T.LAMP_BROKEN;
      lamps = lamps.filter(function (L) { return L.x !== tx || L.y !== ty; });
      broken.push({ x: tx, y: ty, t: T.LAMP_BROKEN });
      return { broken: 'lamp', tx: tx, ty: ty };
    }
    if (t === T.TREE && impactSpeed >= 65) {
      tiles[idx(tx, ty)] = T.STUMP;
      broken.push({ x: tx, y: ty, t: T.STUMP });
      return { broken: 'tree', tx: tx, ty: ty };
    }
    return null;
  }

  function serializeBroken() { return broken.slice(); }

  function restoreBroken(list) {
    if (!Array.isArray(list)) return;
    list.forEach(function (b) {
      if (!b || b.x < 0 || b.y < 0 || b.x >= COLS || b.y >= ROWS) return;
      if (b.t === T.LAMP_BROKEN && tiles[idx(b.x, b.y)] === T.LAMP) {
        tiles[idx(b.x, b.y)] = T.LAMP_BROKEN;
        lamps = lamps.filter(function (L) { return L.x !== b.x || L.y !== b.y; });
        broken.push({ x: b.x, y: b.y, t: T.LAMP_BROKEN });
      } else if (b.t === T.STUMP && tiles[idx(b.x, b.y)] === T.TREE) {
        tiles[idx(b.x, b.y)] = T.STUMP;
        broken.push({ x: b.x, y: b.y, t: T.STUMP });
      }
    });
  }

  /* ---- what is near the player? ---- */
  function withinRadius(px, py, tx, ty, radiusTiles) {
    var cx = tx * TS + TS / 2, cy = ty * TS + TS / 2;
    var dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy <= (radiusTiles * TS) * (radiusTiles * TS);
  }

  function locationNear(px, py) {
    for (var i = 0; i < WORLD_MAP.locations.length; i++) {
      var l = WORLD_MAP.locations[i];
      if (withinRadius(px, py, l.x, l.y, 1.8)) return l;
    }
    return null;
  }

  function arenaNear(px, py) {
    for (var i = 0; i < WORLD_MAP.units.length; i++) {
      var b = WORLD_MAP.units[i].boss;
      if (withinRadius(px, py, b.x, b.y, 2.1)) return WORLD_MAP.units[i];
    }
    return null;
  }

  function regionAt(ty) {
    return ty > WORLD_MAP.river.bottom ? WORLD_MAP.regions.south : WORLD_MAP.regions.north;
  }

  function unitLocations(unitId) {
    return WORLD_MAP.locations.filter(function (l) { return l.unit === unitId; });
  }

  function pixelSize() { return { w: COLS * TS, h: ROWS * TS }; }

  return {
    T: T, build: build, canMove: canMove, canDrive: canDrive, drivableAt: drivableAt,
    isRoad: isRoad, hitTile: hitTile, serializeBroken: serializeBroken, restoreBroken: restoreBroken,
    tileAt: tileAt,
    locationNear: locationNear, arenaNear: arenaNear,
    regionAt: regionAt, unitLocations: unitLocations,
    pixelSize: pixelSize, lamps: function () { return lamps; }
  };
})();
