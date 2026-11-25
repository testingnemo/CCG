/* ============================================================
   ENGINE · weather.js — rain events, lightning & thunder
   A weather system GTA-style: it can rain, and rain comes
   with lightning flashes + synthesized thunder (audio.js).
   Weather changes every ~4 game-hours; rain wets the HUD.
   ============================================================ */
'use strict';

var Weather = (function () {
  var state = 'clear';            // clear | rain
  var nextChange = 120;           // game-minutes until next roll
  var intensity = 0;              // 0..1 rain strength
  var drops = [];                 // rain drops for the canvas layer
  var flash = 0;                   // lightning brightness 0..1
  var elfx = null;

  function init() {
    elfx = document.getElementById('weatherfx');
  }

  /* rolls new weather as game-time passes; returns game minutes used */
  function update(dt, gameMin) {
    nextChange -= gameMin;
    if (nextChange <= 0) {
      nextChange = 180 + Math.random() * 240;               // 3–7 game hours
      state = Math.random() < 0.42 ? 'rain' : 'clear';
      intensity = state === 'rain' ? 0.35 + Math.random() * 0.65 : 0;
      drops.length = 0;
    }

    /* lightning during strong rain */
    if (state === 'rain' && intensity > 0.5 && Math.random() < 0.0022) {
      flash = 1;
      var dly = 400 + Math.random() * 1600;
      setTimeout(function () { AudioSys.thunder(); }, dly);
    }
    flash = Math.max(0, flash - dt * 2.2);

    /* HUD rain veil (CSS does the visual; JS flips the class) */
    if (elfx) {
      var want = state === 'rain' ? 'rain' : '';
      if (elfx.className !== want) elfx.className = want;
      elfx.style.setProperty('--rint', intensity.toFixed(2));
    }
    return state;
  }

  /* draw rain streaks onto the world canvas (screen space) */
  function draw(ctx, w, h, dt) {
    if (state !== 'rain') { drops.length = 0; return; }
    var want = Math.floor(intensity * 130);
    while (drops.length < want) {
      drops.push({ x: Math.random() * w, y: Math.random() * h, v: 380 + Math.random() * 260, l: 7 + Math.random() * 9 });
    }
    ctx.strokeStyle = 'rgba(190,220,255,0.42)';
    ctx.lineWidth = 1.2;
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x += d.v * 0.18 * dt;
      if (d.y > h) { d.y = -10; d.x = Math.random() * w; }
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2.2, d.y - d.l);
      ctx.stroke();
    }
  }

  function lightning() { return flash; }

  function serialize() { return { s: state, n: Math.round(nextChange), i: Math.round(intensity * 100) / 100 }; }
  function restore(d) {
    if (!d) return;
    if (d.s === 'rain' || d.s === 'clear') { state = d.s; nextChange = d.n || 120; intensity = d.i || 0; }
  }

  return {
    init: init, update: update, draw: draw, lightning: lightning,
    serialize: serialize, restore: restore,
    get state() { return state; }
  };
})();
