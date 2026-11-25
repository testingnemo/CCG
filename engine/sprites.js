/* ============================================================
   ENGINE · sprites.js — pre-rendered tile & character sprites
   Every tile is drawn ONCE to an offscreen canvas at boot,
   then blitted during the frame loop (fast on mobile).
   GTA-level: roads, houses, lamps, cars, citizens, headlights.
   ============================================================ */
'use strict';

var Sprites = (function () {
  var S = 32;                     // tile pixel size
  var cache = {};                 // name -> canvas

  function make(name, w, h) {
    var c = document.createElement('canvas');
    c.width = w || S; c.height = h || S;
    cache[name] = c;
    return c.getContext('2d');
  }

  function seeded(min, max) { return min + Math.random() * (max - min); }

  /* ---------- ground tiles ---------- */
  function grass(base, fleck) {
    var g = make('grass' + base);
    g.fillStyle = ['#79b851', '#71b14b', '#7fbf57', '#6cab46'][base];
    g.fillRect(0, 0, S, S);
    for (var i = 0; i < 22; i++) {
      g.fillStyle = Math.random() < 0.5 ? fleck : 'rgba(255,255,255,0.10)';
      var x = seeded(0, S), y = seeded(0, S);
      g.fillRect(x, y, 2, 3);
    }
  }

  function water(frame) {
    var g = make('water' + frame);
    var grad = g.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#2e86c1'); grad.addColorStop(1, '#1b6fae');
    g.fillStyle = grad; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.6;
    for (var i = 0; i < 3; i++) {
      var y = 5 + i * 10 + frame * 2;
      g.beginPath();
      for (var x = 0; x <= S; x += 4) {
        g.lineTo(x, y + Math.sin((x + frame * 16 + i * 20) * 0.22) * 2.2);
      }
      g.stroke();
    }
  }

  function bridge() {
    var g = make('bridge');
    g.fillStyle = '#a9743f'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#8f5f33';
    for (var r = 0; r < 4; r++) g.fillRect(0, r * 8 + 6, S, 2);         // plank gaps
    g.strokeStyle = '#6e4a26'; g.lineWidth = 2;
    g.strokeRect(1, 1, S - 2, S - 2);
    g.fillStyle = '#c68a4f';
    g.fillRect(2, 2, S - 4, 2); g.fillRect(2, S - 4, S - 4, 2);        // rails
  }

  /* ---------- ROAD: asphalt with center dashes ---------- */
  function road() {
    var g = make('road');
    g.fillStyle = '#3f3f46'; g.fillRect(0, 0, S, S);
    /* asphalt grain */
    for (var i = 0; i < 30; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
      g.fillRect(seeded(0, S), seeded(0, S), 2, 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(0, S / 2 - 1, S / 2, 2);                                 // center dash
  }

  function flower(color) {
    var g = make('flower' + color);
    var cx = S / 2, cy = S / 2;
    g.strokeStyle = '#2f7d32'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, cy + 3); g.lineTo(cx, cy + 11); g.stroke();
    g.fillStyle = color === 0 ? '#ff8fa3' : (color === 1 ? '#ffd166' : '#c77dff');
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2;
      g.beginPath();
      g.arc(cx + Math.cos(a) * 4.5, cy - 2 + Math.sin(a) * 4.5, 3.2, 0, 7);
      g.fill();
    }
    g.fillStyle = '#fff3b0';
    g.beginPath(); g.arc(cx, cy - 2, 2.6, 0, 7); g.fill();
  }

  /* ---------- tall things ---------- */
  function tree(kind) {
    var g = make('tree' + kind, S, S * 2);
    var cx = S / 2;
    g.fillStyle = '#7a4a21';
    g.fillRect(cx - 4, S + 6, 8, S - 6);                           // trunk
    var layers = [[0.92, '#3e7d3a'], [0.7, '#4c9247'], [0.46, '#5cab55']];
    layers.forEach(function (L, i) {
      g.fillStyle = L[1];
      g.beginPath();
      g.moveTo(cx, S * 2 - 46 - i * 6);
      g.lineTo(cx + S * L[0] / 2, S * 2 - 4 - i * 7);
      g.lineTo(cx - S * L[0] / 2, S * 2 - 4 - i * 7);
      g.closePath(); g.fill();
    });
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath(); g.arc(cx - 5, S * 2 - 34, 3.5, 0, 7); g.fill();
  }

  /* ---------- broken tree stump & shattered lamp base ---------- */
  function stump() {
    var g = make('stump');
    g.fillStyle = '#6b4220';
    g.fillRect(10, 16, 12, 10);
    g.fillStyle = '#c99c6b';
    g.beginPath(); g.ellipse(16, 16, 6, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8b5a2b';
    g.fillRect(6, 22, 5, 3); g.fillRect(21, 20, 6, 2);
  }

  function lampBroken() {
    var g = make('lampbroken');
    g.fillStyle = '#3b3e46';
    g.fillRect(14, 18, 4, 8);
    g.fillStyle = '#636875';
    g.fillRect(15, 16, 11, 3);
    g.fillStyle = 'rgba(255,224,138,0.45)';
    g.fillRect(23, 18, 3, 2);
    g.fillRect(11, 22, 2, 2);
  }

  /* ---------- HOUSE: little city block home ---------- */
  function house(kind) {
    var g = make('house' + kind, S, S);
    g.fillStyle = kind === 0 ? '#d9b382' : '#c4a3a3';           // walls
    g.fillRect(2, 10, S - 4, S - 12);
    g.fillStyle = '#8a2f2f';                                      // roof
    g.beginPath(); g.moveTo(0, 12); g.lineTo(S / 2, 0); g.lineTo(S, 12); g.closePath(); g.fill();
    g.fillStyle = '#5d4037';
    g.fillRect(S / 2 - 4, S - 12, 8, 10);                        // door
    g.fillStyle = '#ffe08a';                                      // lit window
    g.fillRect(6, 16, 6, 6); g.fillRect(S - 12, 16, 6, 6);
  }

  /* ---------- LAMP: street light pole ---------- */
  function lamp() {
    var g = make('lamp', S, S * 2);
    g.fillStyle = '#4b4e57';
    g.fillRect(S / 2 - 1.5, 6, 3, S * 2 - 10);                    // pole
    g.fillStyle = '#c9d1d9';
    g.fillRect(S / 2 - 6, 2, 12, 4);                              // head
    g.fillStyle = '#ffe08a';
    g.fillRect(S / 2 - 4, 4, 8, 3);                               // glowing bulb
  }

  /* ---------- pads & arenas ---------- */
  function pad(unitColor) {
    var key = 'pad' + unitColor;
    if (cache[key]) return;
    var g = make(key);
    g.fillStyle = '#b9b0a0';
    g.beginPath(); g.arc(16, 16, 13, 0, 7); g.fill();
    g.fillStyle = '#8d8578';
    g.beginPath(); g.arc(16, 16, 13, 0, 7); g.stroke();
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      g.fillStyle = i % 2 ? '#a89e8d' : '#c6bdae';
      g.save(); g.translate(16, 16); g.rotate(a);
      g.fillRect(-4, -13, 8, 5); g.restore();
    }
  }

  function arena(kind) {                    // kind: locked | open | beaten
    var g = make('arena' + kind);
    g.fillStyle = '#9aa0a6';
    g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill();
    g.strokeStyle = kind === 'locked' ? '#5b6167' : '#c0392b';
    g.lineWidth = 2.5;
    g.beginPath(); g.arc(16, 16, 15, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1;
    g.beginPath(); g.arc(16, 16, 9, 0, 7); g.stroke();
    if (kind === 'locked') {                                  // chains
      g.strokeStyle = '#3b4045'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(4, 20); g.lineTo(28, 10); g.stroke();
      g.beginPath(); g.moveTo(4, 12); g.lineTo(28, 24); g.stroke();
    }
  }

  /* ---------- CARS: rotated at draw time from a single body sprite ---------- */
  function car(color) {
    var key = 'car:' + color;
    if (cache[key]) return cache[key];
    var W = 44, H = 24;                                 // body px, faces RIGHT
    var g = make(key, W, H);
    g.fillStyle = color;
    g.fillRect(0, 2, W, H - 4);                         // body
    g.fillStyle = 'rgba(0,0,0,.28)';
    g.fillRect(W * 0.28, 4, W * 0.44, H - 8);           // cabin shadow
    g.fillStyle = '#9fd7f7';                             // windshield
    g.fillRect(W * 0.30, 5, W * 0.18, H - 10);
    g.fillRect(W * 0.56, 5, W * 0.16, H - 10);
    g.fillStyle = '#1b1b1b';                            // tires
    g.fillRect(6, 0, 8, 4); g.fillRect(W - 14, 0, 8, 4);
    g.fillRect(6, H - 4, 8, 4); g.fillRect(W - 14, H - 4, 8, 4);
    g.fillStyle = '#ffe9a8';                             // headlights
    g.fillRect(W - 5, 5, 4, 4); g.fillRect(W - 5, H - 9, 4, 4);
    g.fillStyle = '#ff6b6b';                             // taillights
    g.fillRect(1, 5, 3, 4); g.fillRect(1, H - 9, 3, 4);
    return cache[key];
  }

  function getCar(color) {
    if (!cache['car:' + color]) car(color);
    return cache['car:' + color];
  }

  /* ---------- CITIZENS: 2-frame walk in 4 directions ---------- */
  function citizen(palette, dir, f) {
    var key = 'ctz:' + palette + ':' + dir + ':' + f;
    if (cache[key]) return cache[key];
    var g = make(key, S, S);
    var bob = f ? 1 : 0;
    g.fillStyle = palette === 0 ? '#3a5a9f' : '#8d5a3a';            // shirt
    g.fillRect(9, 14 + bob, 14, 11);
    g.fillStyle = '#f4c8a0';
    g.fillRect(11, 6 + bob, 10, 9);                                  // head
    g.fillStyle = '#1b1b1b';
    if (dir === 'down') { g.fillRect(13, 10 + bob, 2, 2); g.fillRect(17, 10 + bob, 2, 2); }
    if (dir === 'left') { g.fillRect(13, 10 + bob, 2, 2); }
    if (dir === 'right') { g.fillRect(17, 10 + bob, 2, 2); }
    g.fillStyle = '#2b2d42';
    g.fillRect(10, 25 + bob, 4, 6); g.fillRect(18, 25 + bob, 4, 6);
    return cache[key];
  }

  function getCitizen(palette, dir, f) {
    var key = 'ctz:' + palette + ':' + dir + ':' + f;
    if (!cache[key]) citizen(palette, dir, f);
    return cache[key];
  }

  /* ---------- the coder (player) ---------- */
  function hero() {
    ['down', 'up', 'left', 'right'].forEach(function (dir) {
      for (var f = 0; f < 2; f++) {
        var g = make('hero-' + dir + '-' + f);
        drawHero(g, dir, f);
      }
    });
  }

  function drawHero(g, dir, f) {
    var bob = f ? 1 : 0;
    g.fillStyle = '#2b2d42';
    g.fillRect(9, 4 + bob, 14, 8);                 // hair
    g.fillStyle = '#f4c8a0';
    g.fillRect(10, 8 + bob, 12, 9);               // face
    g.fillStyle = '#1b1b1b';
    if (dir === 'down') { g.fillRect(12, 12 + bob, 2.6, 2.6); g.fillRect(17.5, 12 + bob, 2.6, 2.6); }
    if (dir === 'left')  { g.fillRect(11.5, 12 + bob, 2.6, 2.6); }
    if (dir === 'right') { g.fillRect(18, 12 + bob, 2.6, 2.6); }
    g.fillStyle = '#ef476f';                        // hoodie
    g.fillRect(8, 17 + bob, 16, 10);
    g.fillStyle = '#ffd166';                        // badge
    g.fillRect(14, 19 + bob, 4, 4);
    g.fillStyle = '#2b2d42';                        // legs (2-frame walk)
    var s = f ? 2 : 0;
    if (dir === 'up' || dir === 'down') {
      g.fillRect(10, 27, 4.5, 5 - bob); g.fillRect(17.5, 27, 4.5, 5 + s - bob);
    } else {
      g.fillRect(11, 27, 5, 5 - bob); g.fillRect(16, 27, 5, 5 + s - bob);
    }
  }

  function init(unitColors) {
    grass(0, '#8fce6e'); grass(1, '#8fce6e'); grass(2, '#8fce6e'); grass(3, '#7fae5f');
    water(0); water(1);
    bridge(); road();
    flower(0); flower(1); flower(2);
    tree(0); tree(1);
    stump(); lampBroken();
    house(0); house(1);
    lamp();
    unitColors.forEach(function (c) { pad(c); });
    ['locked', 'open', 'beaten'].forEach(function (k) { arena(k); });
    hero();
  }

  function get(name) {
    var c = cache[name];
    if (!c) throw new Error('missing sprite: ' + name);
    return c;
  }

  function has(name) { return !!cache[name]; }

  return { init: init, get: get, getCar: getCar, getCitizen: getCitizen, has: has, TILE: S };
})();
