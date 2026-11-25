/* ============================================================
   ENGINE · daynight.js — GTA-style 24h clock
   The world lives: dawn warms it, dusk paints it orange,
   night darkens it except around lamps & headlights.
   Game-time runs at ~1 game-hour per 40 real seconds (a full
   day ≈ 16 real minutes) and is saved with the game.
   ============================================================ */
'use strict';

var DayNight = (function () {
  var minutes = 8 * 60;         // game minutes since midnight (start 08:00)
  var RATE = 1.5;               // game-minutes per real-second
  var elClock = null, elDial = null;

  function init() {
    elClock = document.getElementById('clock');
    elDial = document.getElementById('daydial');
  }

  function update(dt) {
    minutes += RATE * dt;
    if (minutes >= 24 * 60) minutes -= 24 * 60;

    /* HUD clock (update inner time span without wiping #daydial) */
    var h = Math.floor(minutes / 60), m = Math.floor(minutes % 60);
    if (elClock) {
      var timeSpan = elClock.firstElementChild;
      if (timeSpan) timeSpan.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    if (elDial) {
      elDial.dataset.phase = phase();
      elDial.textContent = phase() === 'night' ? '🌙' : (phase() === 'dusk' || phase() === 'dawn' ? '🌅' : '☀');
    }
  }

  /* 0..1 darkness: 0 = noon, 1 = midnight */
  function darkness() {
    var h = minutes / 60;
    if (h >= 7 && h <= 17) return 0;                       // full day 07:00–17:00
    if (h > 17 && h < 20) return (h - 17) / 3 * 0.55;      // dusk 17:00–20:00
    if (h >= 20 || h <= 5) return 0.62;                    // night
    if (h > 5 && h < 7) return (7 - h) / 2 * 0.62;         // dawn 05:00–07:00
    return 0;
  }

  function phase() {
    var h = minutes / 60;
    if (h >= 20 || h < 5) return 'night';
    if (h >= 17) return 'dusk';
    if (h < 7) return 'dawn';
    return 'day';
  }

  /* warm tint drawn over the world at dusk/dawn (rgba fill) */
  function tint() {
    var h = minutes / 60;
    if (h > 17 && h < 19.5) return 'rgba(255,132,60,0.20)';   // golden dusk
    if (h >= 5 && h < 7) return 'rgba(255,180,120,0.12)';     // rosy dawn
    return null;
  }

  function isNight() { return darkness() > 0.2; }

  function serialize() { return Math.round(minutes); }
  function restore(v) { if (typeof v === 'number' && v >= 0 && v < 1440) minutes = v; }

  return {
    init: init, update: update, darkness: darkness, tint: tint,
    phase: phase, isNight: isNight, serialize: serialize, restore: restore,
    get minutes() { return minutes; }
  };
})();
