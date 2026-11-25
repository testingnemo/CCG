/* ============================================================
   ENGINE · boss.js — the 5 arena duels
   Unlock rule: clear EVERY location of a unit to open its gate.
   Battle: quiz duel — 5 hearts each. Correct = you strike.
   Wrong = you bleed. First to zero loses. No penalty for the
   player on defeat — only glory awaits.
   ============================================================ */
'use strict';

var Boss = (function () {
  var el, bEmoji, bName, bHp, yHp, bQ, bOpts, bFeed, bNext, bBanner;
  var active = false;
  var unit = null, pool = [], poolIdx = 0;
  var hpYou = 5, hpBoss = 5;
  var awaiting = false, shuffled = [], correctText = '', onResult = null;

  function init() {
    el = document.getElementById('boss');
    bEmoji = el.querySelector('.b-emoji');
    bName = el.querySelector('.b-name');
    bHp = el.querySelector('.b-hp-boss');
    yHp = el.querySelector('.b-hp-you');
    bQ = el.querySelector('.b-q');
    bOpts = el.querySelector('.b-opts');
    bFeed = el.querySelector('.b-feed');
    bNext = el.querySelector('.b-next');
    bBanner = el.querySelector('.b-banner');
    bNext.addEventListener('click', function () { next(); });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function hearts(n, total) {
    var s = '';
    for (var i = 0; i < total; i++) s += i < n ? '❤' : '🖤';
    return s;
  }

  function start(u, done) {
    unit = u; onResult = done;
    active = true;
    hpYou = 5; hpBoss = 5;
    poolIdx = 0;

    /* the boss draws from its whole unit's question pool */
    pool = [];
    World.unitLocations(u.id).forEach(function (loc) {
      COURSE_CONTENT[loc.id].quiz.forEach(function (q) {
        pool.push({ q: q.q, a: q.a, correct: q.correct, why: q.why, from: loc.name });
      });
    });
    pool = shuffle(pool);

    bEmoji.textContent = u.boss.icon;
    bName.textContent = u.boss.name;
    bName.style.color = u.color;
    el.classList.add('show');
    AudioSys.sfx('roar');

    bBanner.textContent = u.boss.intro;
    bBanner.classList.add('show');
    setTimeout(function () { bBanner.classList.remove('show'); }, 2200);

    render();
  }

  function drawQuestion() {
    if (poolIdx >= pool.length) { pool = shuffle(pool); poolIdx = 0; }
    var q = pool[poolIdx++];
    correctText = q.a[q.correct];
    shuffled = shuffle(q.a);
    awaiting = true;

    bQ.textContent = q.q + '   (from ' + q.from + ')';
    bFeed.textContent = '';
    bFeed.className = 'b-feed';
    bNext.classList.remove('show');
    bOpts.innerHTML = '';
    shuffled.forEach(function (opt, i) {
      var b = document.createElement('button');
      b.className = 'q-opt';
      b.dataset.opt = opt;               /* HTML-safe: never innerHTML user text */
      var key = document.createElement('span');
      key.className = 'q-key kchip'; key.dataset.key = String(i + 1);
      key.textContent = String(i + 1);
      var txt = document.createElement('span');
      txt.textContent = opt;
      b.appendChild(key); b.appendChild(txt);
      b.addEventListener('click', function () { answer(i, b); });
      bOpts.appendChild(b);
    });
  }

  function render() {
    bHp.textContent = 'BOSS ' + hearts(hpBoss, 5);
    yHp.textContent = 'YOU ' + hearts(hpYou, 5);
    drawQuestion();
  }

  function answer(i, btn) {
    if (!active || !awaiting) return;
    awaiting = false;
    var q = pool[poolIdx - 1];
    var ok = shuffled[i] === correctText;

    if (ok) {
      hpBoss--;
      btn.classList.add('right');
      AudioSys.sfx('hit');
      el.classList.add('shake-boss');
      setTimeout(function () { el.classList.remove('shake-boss'); }, 320);
      bFeed.className = 'b-feed ok';
      bFeed.innerHTML = '';
      var okB = document.createElement('b'); okB.textContent = 'STRIKE! ';
      bFeed.appendChild(okB); bFeed.appendChild(document.createTextNode(q.why));
    } else {
      hpYou--;
      btn.classList.add('wrong');
      AudioSys.sfx('hurt');
      el.classList.add('shake-you');
      setTimeout(function () { el.classList.remove('shake-you'); }, 320);
      bFeed.className = 'b-feed no';
      bFeed.innerHTML = '';
      var noB = document.createElement('b'); noB.textContent = 'You bleed! ';
      bFeed.appendChild(noB); bFeed.appendChild(document.createTextNode(q.why));
    }
    bHp.textContent = 'BOSS ' + hearts(hpBoss, 5);
    yHp.textContent = 'YOU ' + hearts(hpYou, 5);

    var over = hpBoss <= 0 || hpYou <= 0;
    bNext.classList.add('show');
    bNext.textContent = over ? (hpBoss <= 0 ? 'VICTORY!' : 'RETREAT…') : 'NEXT';
  }

  function next() {
    if (!active || awaiting) return;
    AudioSys.sfx('click');
    if (hpBoss <= 0 || hpYou <= 0) {
      el.classList.remove('show');
      active = false;
      var victory = hpBoss <= 0;
      if (victory) AudioSys.sfx('victory');
      var cb = onResult; onResult = null;
      if (cb) cb({ victory: victory, unit: unit.id });
    } else {
      drawQuestion();
    }
  }

  function keyAnswer(i) {
    if (!active || !awaiting) return;
    var opts = bOpts.querySelectorAll('.q-opt');
    if (opts[i]) answer(i, opts[i]);
  }

  function advanceIfOpen() {
    if (!active || awaiting) return true;
    next();
    return true;
  }

  return {
    init: init, start: start, keyAnswer: keyAnswer, advanceIfOpen: advanceIfOpen,
    get isOpen() { return active; }
  };
})();
