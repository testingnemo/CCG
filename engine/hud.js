/* ============================================================
   ENGINE · hud.js — stats, banner, objective, prompts, toasts
   v6 RULE: every HUD element is pointer-events:none so taps go
   THROUGH to the world. ONLY the top-right button panel clicks.
   ============================================================ */
'use strict';

var HUD = (function () {
  var elStats, elBanner, elObjective, elPrompt, elToast, elPanel;
  var bannerTimer = null, toastTimer = null;

  function init(handlers) {
    elStats = document.getElementById('stats');
    elBanner = document.getElementById('banner');
    elObjective = document.getElementById('objective');
    elPrompt = document.getElementById('prompt');
    elToast = document.getElementById('toast');
    elPanel = document.getElementById('panel');

    var btn = function (id, fn) {
      var b = document.getElementById(id);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        AudioSys.sfx('click');
        fn();
      });
    };
    btn('btn-lazy', handlers.onLazy);
    btn('btn-sound', handlers.onSound);
    btn('btn-help', handlers.onHelp);
    btn('btn-reset', handlers.onReset);
  }

  function update(s) {
    elStats.innerHTML =
      '<span class="s-lv">Lv.' + s.level + '</span>' +
      '<span class="s-bar"><i style="width:' + s.xpPct + '%"></i></span>' +
      '<span class="s-xp">' + s.xp + ' XP</span>' +
      '<span class="s-loc">📍 ' + s.cleared + '/' + s.total + '</span>' +
      '<span class="s-keys">🗝 ' + s.keys + '/5</span>' +
      '<span class="s-car" id="carhud"></span>';
  }

  /* GTA-style MISSION PASSED splash */
  function missionPassed(title, sub) {
    var el = document.getElementById('mission');
    if (!el) return;
    el.querySelector('.m-title').textContent = title;
    el.querySelector('.m-sub').textContent = sub || '';
    el.classList.add('show');
    AudioSys.mission();
    setTimeout(function () { el.classList.remove('show'); }, 3400);
  }

  function banner(text, ms) {
    elBanner.textContent = text;
    elBanner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { elBanner.classList.remove('show'); }, ms || 2600);
  }

  function objective(text) { elObjective.textContent = text; }

  function prompt(text) {
    if (text) {
      elPrompt.innerHTML = text;
      elPrompt.classList.add('show');
    } else {
      elPrompt.classList.remove('show');
    }
  }

  function toast(text, ms) {
    elToast.textContent = text;
    elToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, ms || 1900);
  }

  function setLazy(on) {
    document.getElementById('btn-lazy').classList.toggle('on', on);
    document.getElementById('btn-lazy').textContent = on ? '🌙 LAZY' : '💤 LAZY';
  }
  function setSound(on) {
    document.getElementById('btn-sound').textContent = on ? '🔊' : '🔇';
  }

  return {
    init: init, update: update, banner: banner, objective: objective,
    prompt: prompt, toast: toast, setLazy: setLazy, setSound: setSound,
    missionPassed: missionPassed
  };
})();
