/* ============================================================
   ENGINE · radio.js — GTA-style car radio
   Three fully synthesized stations (no audio files!):
     • GRADIENT FM 101.5 — upbeat synthwave arpeggios
     • TENSOR WAVE 88.3  — dreamy ambient pads
     • LATENT LO-FI 91.0 — lazy lo-fi beats for studying
   Radio plays only while driving. R key / 📻 button cycles stations.
   ============================================================ */
'use strict';

var Radio = (function () {
  var STATIONS = [
    { name: 'GRADIENT FM 101.5', dj: 'DJ Backprop', kind: 'synth' },
    { name: 'TENSOR WAVE 88.3', dj: 'DJ Softmax', kind: 'ambient' },
    { name: 'LATENT LO-FI 91.0', dj: 'DJ AdamW', kind: 'lofi' }
  ];
  var on = false, station = 0;
  var timer = null, noteTimer = null, bar = 0;
  var elBadge = null;

  var SCALE_SYNTH = [220, 246.9, 261.6, 329.6, 392, 440, 523.25];        // A minor-ish
  var SCALE_LOFI = [174.6, 196, 220, 233.1, 261.6, 293.7, 311.1];

  function init() {
    elBadge = document.getElementById('radiobadge');
  }

  function start() {
    if (on) return;
    on = true;
    bar = 0;
    announce();
    loopBar();
  }
  function stop() {
    on = false;
    clearTimeout(timer); clearTimeout(noteTimer);
    if (elBadge) elBadge.classList.remove('show');
  }

  function next() {
    station = (station + 1) % STATIONS.length;
    if (on) { announce(); }
    return station;
  }

  function announce() {
    var s = STATIONS[station];
    HUD.toast('📻 ' + s.name + ' — with ' + s.dj);
    if (elBadge) {
      elBadge.textContent = '📻 ' + s.name;
      elBadge.classList.add('show');
    }
    AudioSys.sfx('click');
  }

  /* one bar ≈ 1.9 s; schedule the next bar of music */
  function loopBar() {
    if (!on) return;
    bar++;
    playBar(bar);
    timer = setTimeout(loopBar, 1900);
  }

  function playBar() {
    var s = STATIONS[station];
    if (s.kind === 'synth') synthBar();
    else if (s.kind === 'ambient') ambientBar();
    else lofiBar();
  }

  /* CODE FM: driving arpeggio + kick + hat */
  function synthBar() {
    var root = SCALE_SYNTH[Math.floor(Math.random() * 3)];
    var pat = [0, 2, 4, 5, 4, 2, 0, 3];
    pat.forEach(function (step, i) {
      AudioSys.melodyNote(SCALE_SYNTH[(step) % SCALE_SYNTH.length] * (Math.random() < 0.3 ? 2 : 1), 0.16, 'square', 0.06, i * 0.22);
    });
    for (var b = 0; b < 4; b++) {
      AudioSys.drum('kick', b * 0.44);
      AudioSys.drum('hat', b * 0.44 + 0.22);
    }
    AudioSys.melodyNote(root / 2, 1.8, 'sawtooth', 0.035);         // bass drone
  }

  /* VECTOR WAVE: slow evolving pad */
  function ambientBar() {
    var base = [110, 164.8, 220, 277.2];
    base.forEach(function (f, i) {
      AudioSys.melodyNote(f, 3.4, 'sine', 0.045, i * 0.02);
    });
    if (Math.random() < 0.5) AudioSys.melodyNote(880, 0.9, 'sine', 0.03, 0.6);
  }

  /* MEADOW LO-FI: swung beat + soft chords */
  function lofiBar() {
    AudioSys.drum('lofi-kick', 0); AudioSys.drum('lofi-kick', 1.15);
    AudioSys.drum('lofi-snare', 0.57); AudioSys.drum('lofi-snare', 1.7);
    [0, 0.44, 0.95, 1.35].forEach(function (t, i) {
      AudioSys.melodyNote(SCALE_LOFI[i % SCALE_LOFI.length], 0.5, 'triangle', 0.05, t);
    });
  }

  function serialize() { return { on: on, st: station }; }
  function restore(d) { if (d) { station = d.st || 0; } }

  return {
    init: init, start: start, stop: stop, next: next,
    serialize: serialize, restore: restore,
    get name() { return STATIONS[station].name; }
  };
})();
