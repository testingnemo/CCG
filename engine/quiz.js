/* ============================================================
   ENGINE · quiz.js — the trial of every location
   Rule (v6): each visit draws 2 RANDOM questions out of the
   5-question bank, options are SHUFFLED every time.
   Both correct -> location cleared. A miss -> retry with a
   fresh pair. Practice mode (revisits) draws 1 question.
   ============================================================ */
'use strict';

var Quiz = (function () {
  var el, qIcon, qTitle, qProg, qText, qOpts, qFeed, qNext;
  var active = false, mode = 'clear';
  var loc = null, picks = [], qIndex = 0, rightCount = 0;
  var shuffled = [], correctText = '';
  var onDone = null, awaiting = false;

  function init() {
    el = document.getElementById('quiz');
    qIcon = el.querySelector('.q-icon');
    qTitle = el.querySelector('.q-title');
    qProg = el.querySelector('.q-prog');
    qText = el.querySelector('.q-text');
    qOpts = el.querySelector('.q-opts');
    qFeed = el.querySelector('.q-feed');
    qNext = el.querySelector('.q-next');
    qNext.addEventListener('click', function () { advance(); });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function start(location, m, done) {
    loc = location;
    mode = m || 'clear';
    onDone = done;
    active = true;
    qIndex = 0; rightCount = 0;
    el.classList.add('show');

    var content = COURSE_CONTENT[loc.id];
    qIcon.textContent = loc.icon;
    qTitle.textContent = content.title;
    qTitle.style.borderColor = unitColor(loc.unit);
    qProg.textContent = mode === 'practice' ? 'PRACTICE RUN' : 'TRIAL 1 / ' + (mode === 'clear' ? 2 : 1);

    picks = shuffle(content.quiz).slice(0, mode === 'practice' ? 1 : 2);
    renderQuestion();
    AudioSys.sfx('open');
  }

  function unitColor(u) {
    return WORLD_MAP.units[u - 1].color;
  }

  function renderQuestion() {
    var q = picks[qIndex];
    correctText = q.a[q.correct];
    shuffled = shuffle(q.a);
    awaiting = true;

    qText.textContent = q.q;
    qFeed.innerHTML = '';
    qFeed.className = 'q-feed';
    qNext.classList.remove('show');

    qOpts.innerHTML = '';
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
      qOpts.appendChild(b);
    });
  }

  function answer(i, btn) {
    if (!active || !awaiting) return;
    awaiting = false;
    var q = picks[qIndex];
    var chosen = shuffled[i];
    var ok = chosen === correctText;

    if (ok) {
      rightCount++;
      btn.classList.add('right');
      AudioSys.sfx('correct');
      qFeed.className = 'q-feed ok';
      qFeed.innerHTML = '';
      var okB = document.createElement('b'); okB.textContent = '✔ Correct! ';
      qFeed.appendChild(okB); qFeed.appendChild(document.createTextNode(q.why));
    } else {
      btn.classList.add('wrong');
      AudioSys.sfx('wrong');
      /* reveal the true answer (dataset = pre-escape safe compare) */
      var opts = qOpts.querySelectorAll('.q-opt');
      for (var k = 0; k < opts.length; k++) {
        if (opts[k].dataset.opt === correctText) opts[k].classList.add('right');
      }
      qFeed.className = 'q-feed no';
      qFeed.innerHTML = '';
      var noB = document.createElement('b'); noB.textContent = '✘ Not this time. ';
      qFeed.appendChild(noB); qFeed.appendChild(document.createTextNode(q.why));
    }

    var last = (qIndex === picks.length - 1);
    qNext.classList.add('show');
    qNext.textContent = last ? 'FINISH' : 'NEXT';
  }

  function advance() {
    if (!active || awaiting) return;
    AudioSys.sfx('click');
    qIndex++;
    if (qIndex < picks.length) {
      qProg.textContent = mode === 'practice' ? 'PRACTICE RUN' : 'TRIAL ' + (qIndex + 1) + ' / ' + picks.length;
      renderQuestion();
    } else {
      finish();
    }
  }

  function finish() {
    var clearedNow = (mode === 'clear' && rightCount === picks.length);
    var gained = 0;
    if (clearedNow) gained = 15;
    else if (mode === 'practice' && rightCount === picks.length) gained = 5;

    if (clearedNow) AudioSys.sfx('clear');
    el.classList.remove('show');
    active = false;
    var cb = onDone; onDone = null;
    if (cb) cb({ cleared: clearedNow, correct: rightCount, total: picks.length, xp: gained });
  }

  /* keyboard: 1..4 */
  function keyAnswer(i) {
    if (!active || !awaiting) return;
    var opts = qOpts.querySelectorAll('.q-opt');
    if (opts[i]) answer(i, opts[i]);
  }

  /* "advance" hook for Space/Enter */
  function advanceIfOpen() {
    if (!active || awaiting) return true;   // consumed but nothing to do
    advance();
    return true;
  }

  function retrySame() { qIndex = 0; rightCount = 0; renderQuestion(); }

  return {
    init: init, start: start, keyAnswer: keyAnswer, advanceIfOpen: advanceIfOpen,
    retrySame: retrySame,
    get isOpen() { return active; }
  };
})();
