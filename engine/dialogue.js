/* ============================================================
   ENGINE · dialogue.js — PY the snake 🐍 speaks!
   Bottom-sheet dialogue with a 🐍 Python code panel.
   LAZY mode auto-advances lines; SKIP is always available.
   ============================================================ */
'use strict';

var Dialogue = (function () {
  var el, avatarEl, nameEl, textEl, codeEl, hintEl, skipBtn;
  var queue = [], onDone = null, active = false;
  var autoTimer = null, codeMode = false;

  function init() {
    el = document.getElementById('dialogue');
    avatarEl = el.querySelector('.d-avatar');
    nameEl = el.querySelector('.d-name');
    textEl = el.querySelector('.d-text');
    codeEl = el.querySelector('.d-code');
    hintEl = el.querySelector('.d-hint');
    skipBtn = el.querySelector('.d-skip');

    el.querySelector('.d-tap-area').addEventListener('click', function () { advance(); });
    skipBtn.addEventListener('click', function () { skip(); });
    el.querySelector('.d-hint').addEventListener('click', function () { advance(); });
  }

  /* escape + tiny Python highlighter (strings, comments, keywords, numbers) */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pyHighlight(line) {
    var e = esc(line);
    if (/^\s*#/.test(line)) return '<span class="c-com">' + e + '</span>';
    /* stash strings so keywords/numbers inside them stay untouched */
    var strs = [];
    e = e.replace(/"[^"]*"|'[^']*'/g, function (m) {
      strs.push(m);
      return '\u0001' + (strs.length - 1) + '\u0001';
    });
    e = e.replace(/\b(import|from|for|in|def|return|if|else|elif|print|while|with|as|not|and|or|class|True|False|None|lambda)\b/g, '<span class="c-kw">$1</span>');
    e = e.replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>');
    e = e.replace(/\u0001(\d+)\u0001/g, function (m, i) {
      return '<span class="c-str">' + strs[+i] + '</span>';
    });
    return e;
  }

  function show(lines, done, opts) {
    opts = opts || {};
    queue = lines.slice();
    onDone = done;
    active = true;
    codeMode = false;
    avatarEl.textContent = opts.avatar || '🐍';
    nameEl.textContent = opts.speaker || 'PY';
    el.classList.add('show');
    render();
  }

  function render() {
    if (!queue.length) { close(); return; }
    var item = queue[0];
    var isCode = typeof item === 'object' && item.code;

    if (isCode) {
      codeMode = true;
      textEl.textContent = item.caption || 'Behold — real Python:';
      codeEl.innerHTML = item.code.map(pyHighlight).join('\n');
      codeEl.style.display = 'block';
      hintEl.innerHTML = '<span class="kchip" data-key="SPACE">[SPACE]</span> continue';
    } else {
      codeMode = false;
      textEl.textContent = item;
      codeEl.style.display = 'none';
      hintEl.innerHTML = queue.length > 1
        ? '<span class="kchip" data-key="SPACE">[SPACE]</span> next'
        : '<span class="kchip" data-key="ENTER">[ENTER]</span> ok';
    }

    el.querySelector('.d-tap-area').setAttribute('aria-label', textEl.textContent);

    /* LAZY mode: auto-advance */
    clearTimeout(autoTimer);
    if (Game.lazyMode()) {
      skipBtn.classList.add('lazy-on');
      autoTimer = setTimeout(function () { advance(); }, codeMode ? 2400 : 1250);
    } else {
      skipBtn.classList.remove('lazy-on');
    }
  }

  function advance() {
    if (!active) return;
    AudioSys.sfx('click');
    queue.shift();
    if (queue.length) { render(); }
    else { close(false); }
  }

  function skip() {
    if (!active) return;
    AudioSys.sfx('click');
    queue.length = 0;
    close(true);
  }

  function close(skipped) {
    active = false;
    clearTimeout(autoTimer);
    el.classList.remove('show');
    var cb = onDone; onDone = null;
    if (cb) cb(!!skipped);
  }

  return {
    init: init, show: show, advance: advance, skip: skip,
    get isOpen() { return active; }
  };
})();
