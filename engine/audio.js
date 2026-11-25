/* ============================================================
   ENGINE · audio.js — Web Audio synth: SFX + living river
   + GTA-level: car engine hum, horn, thunder, radio drums,
     skid, and the MISSION PASSED sting.
   No audio files. Everything is synthesized at runtime.
   ============================================================ */
'use strict';

var AudioSys = (function () {
  var ctx = null, master = null, muted = false;
  var riverSrc = null, riverGain = null, riverFilter = null;
  var stepPhase = 0, lastStep = 0;

  /* ---- the car engine: a persistent oscillator whose pitch
        follows the speed; created on first engineOn() ---- */
  var engOsc = null, engGain = null, engOsc2 = null;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});   // autoplay-policy noise guard
    }
    return ctx.state !== 'closed';
  }

  function unlock() { ensure(); if (ctx && riverSrc === null) startRiver(); }

  /* one beep helper */
  function tone(freq, dur, type, vol, when, slideTo) {
    if (muted || !ensure()) return;
    var t = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* noise burst helper (thunder, rain hiss, drums) */
  function noise(dur, vol, when, filterHz) {
    if (muted || !ensure()) return;
    var t = ctx.currentTime + (when || 0);
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterHz || 900;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur);
  }

  var SFX = {
    click:    function () { tone(660, 0.06, 'square', 0.10); },
    open:     function () { tone(320, 0.14, 'triangle', 0.14, 0, 640); },
    correct:  function () { tone(523, 0.09, 'sine', 0.2); tone(784, 0.14, 'sine', 0.2, 0.09); },
    wrong:    function () { tone(220, 0.22, 'sawtooth', 0.14, 0, 110); },
    clear:     function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.12, 'triangle', 0.16, i * 0.09); }); },
    key:       function () { [392, 523, 659, 784].forEach(function (f, i) { tone(f, 0.1, 'square', 0.11, i * 0.08); }); },
    hit:       function () { tone(180, 0.1, 'square', 0.22, 0, 90); noise(0.12, 0.1, 0, 500); },
    roar:      function () { tone(90, 0.55, 'sawtooth', 0.25, 0, 55); tone(140, 0.4, 'square', 0.1, 0.1, 80); },
    hurt:      function () { tone(300, 0.18, 'square', 0.16, 0, 150); },
    step:      function () {
      var now = performance.now();
      if (now - lastStep < 170) return;
      lastStep = now; stepPhase = 1 - stepPhase;
      tone(stepPhase ? 340 : 300, 0.03, 'triangle', 0.05);
    },
    victory:  function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.18, i * 0.12); }); },

    /* GTA-level additions */
    skid:      function () { noise(0.4, 0.06, 0, 2400); },
    crash:     function () { noise(0.3, 0.28, 0, 400); tone(120, 0.25, 'square', 0.2, 0, 60); },
    thunder:   function () { noise(1.6, 0.34, 0, 300); noise(2.4, 0.2, 0.25, 140); },
    mission:   function () {                     /* MISSION PASSED sting */
      [392, 523, 659].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.2, i * 0.13); });
      tone(784, 0.5, 'triangle', 0.24, 0.4);
      tone(1046, 0.6, 'sine', 0.2, 0.42);
    },
    horn:      function () {
      tone(392, 0.28, 'square', 0.16);
      tone(494, 0.28, 'square', 0.16);
    }
  };

  function sfx(name) { if (SFX[name]) SFX[name](); }

  /* ---------- car engine ---------- */
  function engineOn() {
    if (!ensure() || engOsc) return;
    engOsc = ctx.createOscillator(); engOsc.type = 'sawtooth';
    engOsc2 = ctx.createOscillator(); engOsc2.type = 'square';
    engGain = ctx.createGain(); engGain.gain.value = 0;
    var flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 700;
    engOsc.frequency.value = 55; engOsc2.frequency.value = 110;
    engOsc.connect(flt); engOsc2.connect(flt); flt.connect(engGain); engGain.connect(master);
    engOsc.start(); engOsc2.start();
  }

  function engineRev(speed01) {                  // 0..1
    if (!engGain || !ctx) return;
    var f = 48 + speed01 * 120;
    engOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
    engOsc2.frequency.setTargetAtTime(f * 2.02, ctx.currentTime, 0.08);
    engGain.gain.setTargetAtTime(muted ? 0 : 0.035 + speed01 * 0.075, ctx.currentTime, 0.09);
  }

  function engineOff() {
    if (!engGain || !ctx) return;
    engGain.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  }

  /* ---------- radio building blocks ---------- */
  function melodyNote(freq, dur, type, vol, when) { tone(freq, dur, type, vol, when); }
  function drum(kind, when) {
    if (kind === 'kick' || kind === 'lofi-kick') { tone(150, 0.12, 'sine', 0.16, when, 40); }
    else if (kind === 'hat') { noise(0.05, 0.05, when, 6000); }
    else if (kind === 'lofi-snare') { noise(0.14, 0.07, when, 1800); tone(180, 0.1, 'triangle', 0.06, when); }
  }

  function horn() { SFX.horn(); }
  function thunder() { SFX.thunder(); }
  function mission() { SFX.mission(); }

  /* ---------- the living river ---------- */
  function startRiver() {
    if (!ctx || riverSrc) return;
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    riverSrc = ctx.createBufferSource();
    riverSrc.buffer = buf; riverSrc.loop = true;

    riverFilter = ctx.createBiquadFilter();
    riverFilter.type = 'lowpass';
    riverFilter.frequency.value = 420;
    riverFilter.Q.value = 0.6;

    riverGain = ctx.createGain();
    riverGain.gain.value = 0;

    riverSrc.connect(riverFilter); riverFilter.connect(riverGain); riverGain.connect(master);
    riverSrc.start();
  }

  /* player px distance from river center, in world pixels */
  function updateRiver(distPx) {
    if (!riverGain || !ctx) return;
    var near = Math.max(0, 1 - distPx / 700);          // 0..1
    var target = muted ? 0 : near * 0.16;
    riverGain.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
    riverFilter.frequency.setTargetAtTime(300 + near * 900, ctx.currentTime, 0.3);
  }

  function setMuted(m) {
    muted = m;
    if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
  }

  return {
    unlock: unlock, sfx: sfx, updateRiver: updateRiver, setMuted: setMuted,
    engineOn: engineOn, engineRev: engineRev, engineOff: engineOff,
    melodyNote: melodyNote, drum: drum, horn: horn, thunder: thunder, mission: mission,
    step: function () { sfx('step'); }        /* Player calls this every move-tick */
  };
})();
