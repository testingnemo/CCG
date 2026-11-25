/* ============================================================
   ENGINE · main.js — Game: boot, loop, render, state machine
   Pulls WORLD (data/world-map.js) + CONTENT (data/unit1-5.js)
   together and runs the show. Nothing here is teachable content.

   GTA-LEVEL EDITION integrates: day/night, weather, vehicles,
   NPCs, radio, radar/pause-map, letterbox cinematics, night
   lighting with lamps & headlights, camera shake, and the
   MISSION PASSED splash.
   ============================================================ */
'use strict';

var Game = (function () {
  var cvs, ctx, cw = 0, ch = 0, dpr = 1, zoom = 1.5;
  var mode = 'boot';                 // boot | title | explore | victory
  var state = null;
  var time = 0, lastT = 0, saveTick = 0;
  var currentRegion = '';
  var pendingLoc = null;             // location whose trial is running
  var titlePan = 0;                  // title-screen camera pan angle

  var XP_LEVELS = [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620];

  /* ---------------- state helpers ---------------- */
  function freshState() {
    return {
      xp: 0, cleared: [], bosses: [],
      x: WORLD_MAP.spawn.x * WORLD_MAP.tileSize + WORLD_MAP.tileSize / 2,
      y: WORLD_MAP.spawn.y * WORLD_MAP.tileSize + WORLD_MAP.tileSize / 2,
      lazy: false, sound: true, seenIntro: false, visitedRegions: {},
      waypoint: null
    };
  }

  function level() {
    var lv = 1;
    for (var i = 0; i < XP_LEVELS.length; i++) if (state.xp >= XP_LEVELS[i]) lv = i + 1;
    return Math.min(lv, 10);
  }
  function xpPct() {
    var lv = level();
    if (lv >= 10) return 100;
    var lo = XP_LEVELS[lv - 1], hi = XP_LEVELS[lv];
    return Math.round(((state.xp - lo) / (hi - lo)) * 100);
  }
  function isCleared(id) { return state.cleared.indexOf(id) >= 0; }
  function unitCleared(uid) {
    return World.unitLocations(uid).every(function (l) { return isCleared(l.id); });
  }
  function bossBeaten(uid) { return state.bosses.indexOf(uid) >= 0; }

  function refreshHUD() {
    HUD.update({
      level: level(), xp: state.xp, xpPct: xpPct(),
      cleared: state.cleared.length, total: WORLD_MAP.locations.length,
      keys: state.bosses.length
    });
    HUD.setLazy(state.lazy);
    HUD.setSound(state.sound);
    HUD.objective(computeObjective());
  }

  function computeObjective() {
    for (var i = 0; i < WORLD_MAP.units.length; i++) {
      var u = WORLD_MAP.units[i];
      if (unitCleared(u.id) && !bossBeaten(u.id)) {
        return '⚔ BOSS UNLOCKED: ' + u.boss.name + '! Enter its arena.';
      }
    }
    for (var j = 0; j < WORLD_MAP.units.length; j++) {
      var un = WORLD_MAP.units[j];
      var remaining = World.unitLocations(un.id).filter(function (l) { return !isCleared(l.id); });
      if (remaining.length) {
        return '📘 Unit ' + un.id + ' — clear ' + remaining.length + ' more site' +
               (remaining.length > 1 ? 's' : '') + ' (' + un.name + ')';
      }
    }
    if (state.bosses.length < 5) return '🗝 Defeat the remaining bosses!';
    return '🏆 DLNA MASTER — you conquered Deep Learning & Neural Architectures!';
  }

  function persist() {
    if (state) {                    // the hero's live position is the truth
      state.x = Player.x; state.y = Player.y;
      state.waypoint = Minimap.waypoint;
    }
    SaveSystem.save(state);
  }

  /* ---------------- boot ---------------- */
  function boot() {
    cvs = document.getElementById('game');
    ctx = cvs.getContext('2d');

    World.build();
    Sprites.init(WORLD_MAP.units.map(function (u) { return u.color; }));
    Input.init();
    Dialogue.init();
    Quiz.init();
    Boss.init();
    HUD.init({
      onLazy: toggleLazy,
      onSound: toggleSound,
      onHelp: showHelp,
      onReset: resetGame
    });
    DayNight.init();
    Weather.init();
    Vehicles.init();
    Vehicles.spawn();
    NPC.init();
    Radio.init();
    Minimap.init();

    window.addEventListener('resize', resize);
    resize();

    /* title screen */
    var saved = SaveSystem.load();
    var btnCont = document.getElementById('btn-continue');
    if (saved) btnCont.classList.remove('disabled');
    document.getElementById('btn-new').addEventListener('click', function () { AudioSys.sfx('open'); startGame(true); });
    btnCont.addEventListener('click', function () {
      if (btnCont.classList.contains('disabled')) { HUD.toast('No save found, coder.'); return; }
      AudioSys.sfx('open'); startGame(false);
    });
    document.getElementById('btn-roam').addEventListener('click', function () {
      AudioSys.sfx('click');
      document.getElementById('victory').classList.remove('show');
      mode = 'explore';
    });

    requestAnimationFrame(loop);
  }

  function startGame(isNew) {
    World.build();
    Vehicles.spawn();
    if (isNew) {
      state = freshState();
      SaveSystem.reset();
      DayNight.restore(8 * 60);
      Weather.restore(null);
    } else {
      var s = SaveSystem.load();
      state = freshState();
      state.xp = s.xp; state.cleared = s.cleared; state.bosses = s.bosses;
      state.lazy = s.lazy; state.sound = s.sound;
      state.seenIntro = s.seenIntro; state.visitedRegions = s.visitedRegions || {};
      state.x = s.pos.x; state.y = s.pos.y;
      state.waypoint = s.waypoint || null;
      DayNight.restore(s.clock);
      Weather.restore(s.weather);
      Vehicles.restoreCars(s.cars);
      World.restoreBroken(s.broken);
      Minimap.setWaypoint(state.waypoint);
    }
    AudioSys.setMuted(!state.sound);
    Player.placeAtPx(state.x, state.y);          // sync the hero to the spawn/loaded pos
    Player.setRiding(false);
    Radio.stop();
    document.getElementById('title').classList.remove('show');
    var lbEl = document.getElementById('letterbox');
    if (lbEl) lbEl.classList.remove('on');          // drop the cinematic bars
    mode = 'explore';
    currentRegion = '';
    refreshHUD();

    if (!state.seenIntro) {
      state.seenIntro = true;
      Dialogue.show([
        'Welcome to COOL CODING CITY — 26 UBAI 601: Deep Learning & Neural Architectures!',
        'South of the river lies PERCEPTRON MEADOWS — master the 5 Deep Learning Fundamentals.',
        'Cross the wooden bridge to reach TENSOR METROPOLIS: CNNs, RNNs, Transformers, and Deployment (Units II–V), each ending in a boss arena. 🗿',
        'Walk onto a glowing pad and press E — learn the concept, then clear 2 random trial questions!',
        'Press F near any car to drive (SHIFT fast · G slow · SPACE brake). Smash trees and street lights — homes stay solid! M map · R radio · H horn.'
      ], function () { persist(); }, { speaker: 'PY', avatar: '🐍' });
    }
  }

  /* ---------------- resize / DPR ---------------- */
  function resize() {
    cw = window.innerWidth; ch = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cvs.width = Math.round(cw * dpr);
    cvs.height = Math.round(ch * dpr);
    cvs.style.width = cw + 'px';
    cvs.style.height = ch + 'px';
    zoom = Math.max(1.35, Math.min(2.4, Math.min(cw, ch) / 430));
  }

  var loopDt = 0.016;               // last frame dt, used by render-time FX

  /* ---------------- the loop ---------------- */
  function loop(t) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t; time += dt;
    loopDt = dt;

    var beforeMin = DayNight.minutes;

    if (mode === 'explore' && !Dialogue.isOpen && !Quiz.isOpen && !Boss.isOpen && !Minimap.isOpen()) {
      if (Vehicles.driving) {
        var dv = Input.drive();
        Vehicles.updatePlayerCar(dt, dv);
      } else {
        Player.update(dt, Input.isSprint());
      }
      Player.updateCamera(cw / zoom, ch / zoom, dt);
      Vehicles.updateAI(dt);
      NPC.update(dt, Player.x, Player.y);
      tickExplore();
    }

    /* the city clock & weather run in every mode */
    DayNight.update(dt);
    Weather.update(dt, DayNight.minutes - beforeMin);

    /* river hum follows the hero */
    var rc = ((WORLD_MAP.river.top + WORLD_MAP.river.bottom + 1) / 2) * WORLD_MAP.tileSize;
    AudioSys.updateRiver(Math.abs(Player.y - rc));

    saveTick += dt;
    if (saveTick > 15) { saveTick = 0; if (mode !== 'boot' && mode !== 'title') persist(); }

    render();
  }

  function tickExplore() {
    var TS = WORLD_MAP.tileSize;

    /* region banner on crossing */
    var region = World.regionAt(Player.y / TS);
    if (region.name !== currentRegion) {
      currentRegion = region.name;
      if (!state.visitedRegions[region.name]) {
        state.visitedRegions[region.name] = true;
        HUD.banner(region.name + ' — ' + region.desc, 3200);
        persist();
      }
    }

    /* waypoint arrived check */
    if (Minimap.waypoint && Math.hypot(Player.x - Minimap.waypoint.x, Player.y - Minimap.waypoint.y) < 2.2 * TS) {
      Minimap.clearWaypoint();
      HUD.toast('📍 Waypoint reached');
    }

    /* interaction target */
    var loc = World.locationNear(Player.x, Player.y);
    var arena = loc ? null : World.arenaNear(Player.x, Player.y);
    var car = (loc || arena) ? null : Vehicles.nearestCar(Player.x, Player.y, 2.2);
    var chatter = (loc || arena || car) ? null : NPC.chatterNear(Player.x, Player.y);

    var carHud = document.getElementById('carhud');
    if (Vehicles.driving) {
      if (carHud) {
        var kmh = Math.round(Math.abs(Vehicles.driving.speed) * 0.32);
        carHud.textContent = '🚗 ' + Vehicles.modeLabel + ' ' + kmh + ' km/h';
      }
      HUD.prompt('🚗 <b>DRIVING</b> — <span class="kchip" data-key="F">[F]</span> exit · SHIFT fast · G slow · SPACE brake · <span class="kchip" data-key="H">[H]</span> horn · <span class="kchip" data-key="R">[R]</span> radio');
      return;
    } else if (carHud) {
      carHud.textContent = '';
    }

    if (loc) {
      var done = isCleared(loc.id);
      HUD.prompt((done ? '🔁' : '📗') + ' <b>' + loc.name + '</b> — ' +
        '<span class="kchip" data-key="E">[E]</span> ' + (done ? 'practice (+5 XP)' : 'learn &amp; trial'));
    } else if (arena) {
      var open = unitCleared(arena.id), beaten = bossBeaten(arena.id);
      HUD.prompt((beaten ? '🏅' : open ? '⚔' : '🔒') + ' <b>' + arena.boss.name + '</b> — ' +
        '<span class="kchip" data-key="E">[E]</span> ' + (beaten ? 'revisit the arena' : open ? 'CHALLENGE!' : 'peek'));
    } else if (car) {
      HUD.prompt('🚗 <b>VEHICLE</b> — <span class="kchip" data-key="F">[F]</span> ' +
        (car.ai ? 'hijack it!' : 'get in'));
    } else if (chatter) {
      HUD.prompt('🧑 <b>CITIZEN</b> — <span class="kchip" data-key="E">[E]</span> hear a tip');
    } else {
      HUD.prompt(null);
    }

    /* E pressed near something? */
    if (Input.takeInteract()) {
      if (loc) openLocation(loc);
      else if (arena) openArena(arena);
      else if (chatter) {
        Dialogue.show([chatter.tip, 'The citizens of this world keep learning… keep coding!'], null, { speaker: 'CITIZEN', avatar: '🧑' });
      }
    }
  }

  /* ---------------- locations: learn → trial ---------------- */
  function openLocation(loc) {
    pendingLoc = loc;
    var content = COURSE_CONTENT[loc.id];
    AudioSys.sfx('open');

    if (isCleared(loc.id)) {
      var recapLine = (content.python && content.python.length)
        ? { caption: '🐍 ' + content.title + ' — a quick recap:', code: content.python }
        : ('📘 ' + content.title + ' — ' + content.topic);
      Dialogue.show(
        [recapLine,
         'Ready for a practice question? (+5 XP if you nail it!)'],
        function (skipped) {
          if (skipped) { pendingLoc = null; return; }
          Quiz.start(loc, 'practice', practiceDone);
        }, { speaker: 'PY', avatar: '🐍' });
      return;
    }

    var lines = ['📍 ' + content.title + ' — ' + content.topic].concat(content.learn);
    if (content.python && content.python.length) {
      lines.push({ caption: '🐍 ' + content.title + ', in Python:', code: content.python });
    }
    lines.push('Enough theory — the TRIAL begins! Two random questions. Both right, or we go again!');

    Dialogue.show(lines, function () {
      Quiz.start(loc, 'clear', trialDone);
    }, { speaker: 'PY', avatar: '🐍' });
  }

  function trialDone(res) {
    var loc = pendingLoc;
    if (res.cleared) {
      state.cleared.push(loc.id);
      state.xp += res.xp;
      AudioSys.sfx('clear');
      HUD.missionPassed(loc.name.toUpperCase(), 'SITE CLEARED · +' + res.xp + ' XP');
      pendingLoc = null;
      refreshHUD();
      checkUnlocks(loc.unit);
      persist();
    } else {
      Dialogue.show([
        'Oof — ' + res.correct + '/' + res.total + '. The trial demands PERFECTION (2/2).',
        'PY reshuffles the deck: two fresh questions, same site. Ready?'
      ], function (skipped) {
        if (skipped) { pendingLoc = null; HUD.toast('Come back when ready!'); return; }
        Quiz.start(loc, 'clear', trialDone);   // auto-retry with new random pair
      }, { speaker: 'PY', avatar: '🐍' });
    }
  }

  function practiceDone(res) {
    if (res.xp) {
      state.xp += res.xp;
      HUD.toast('+' + res.xp + ' XP — sharp as ever!');
      refreshHUD();
      persist();
    } else {
      HUD.toast('Rust never sleeps — try again anytime!');
    }
    pendingLoc = null;
  }

  function checkUnlocks(unitId) {
    if (unitCleared(unitId) && !bossBeaten(unitId)) {
      var u = WORLD_MAP.units[unitId - 1];
      setTimeout(function () {
        AudioSys.sfx('key');
        HUD.banner('⚔ BOSS GATE OPENED: ' + u.boss.name + ' ' + u.boss.icon, 3400);
      }, 2600);
      refreshHUD();
    }
  }

  /* ---------------- arenas ---------------- */
  function openArena(unit) {
    var open = unitCleared(unit.id);
    var beaten = bossBeaten(unit.id);
    AudioSys.sfx('open');

    if (beaten) {
      Dialogue.show(['🏅 This arena is silent now. ' + unit.boss.name + ' was defeated by YOU.'], null, { speaker: 'PY', avatar: '🐍' });
      return;
    }
    if (!open) {
      var remaining = World.unitLocations(unit.id).filter(function (l) { return !isCleared(l.id); });
      Dialogue.show([
        '🔒 The gate is chained by ' + unit.boss.name + '.',
        'Clear ALL ' + World.unitLocations(unit.id).length + ' sites of Unit ' + unit.id + ' (' + unit.name + ') first — ' + remaining.length + ' remain' + (remaining.length === 1 ? 's' : '') + '.',
        'Hint: ' + remaining.map(function (l) { return l.icon + ' ' + l.name; }).join(' · ')
      ], null, { speaker: 'PY', avatar: '🐍' });
      return;
    }

    Dialogue.show([
      unit.boss.icon + ' ' + unit.boss.intro,
      'FIVE hearts each. A correct answer strikes; a wrong one bleeds you. Ready, coder?'
    ], function () {
      Boss.start(unit, bossDone);
    }, { speaker: unit.boss.name, avatar: unit.boss.icon });
  }

  function bossDone(res) {
    var u = WORLD_MAP.units[res.unit - 1];
    if (res.victory) {
      state.bosses.push(res.unit);
      state.xp += 60;
      HUD.missionPassed(u.boss.name + ' DEFEATED', '+60 XP · KEY ACQUIRED · ' + state.bosses.length + '/5 BOSSES');
      refreshHUD();
      persist();
      if (state.bosses.length >= 5) showVictory();
      else {
        Dialogue.show(['The ' + u.boss.name + ' bows. ' + (5 - state.bosses.length) + ' bosses remain in TENSOR METROPOLIS.'], null, { speaker: 'PY', avatar: '🐍' });
      }
    } else {
      Dialogue.show(['You fought well! Heal up, study the sites, and strike again — I will hold your XP.'], null, { speaker: 'PY', avatar: '🐍' });
    }
  }

  function showVictory() {
    AudioSys.sfx('victory');
    document.getElementById('v-stats').innerHTML =
      'Level ' + level() + ' · ' + state.xp + ' XP<br>' +
      '26/26 locations cleared · 5/5 bosses defeated';
    document.getElementById('victory').classList.add('show');
    mode = 'victory';
  }

  /* ---------------- GTA actions ---------------- */
  function toggleMap() {
    Minimap.toggle();
  }

  function toggleCar() {
    if (mode !== 'explore') return;
    if (Vehicles.driving) {
      Vehicles.exit();
      Player.setRiding(false);
      Radio.stop();
      HUD.toast('Exited vehicle');
    } else {
      if (Vehicles.tryEnter(Player.x, Player.y)) {
        Player.setRiding(true);
        Radio.start();
      }
    }
  }

  function cycleRadio() {
    if (!Vehicles.driving) { HUD.toast('📻 Radio works in a car — grab a ride first!'); return; }
    var st = Radio.next();
    HUD.toast('📻 ' + Radio.name);
  }

  function honk() {
    if (!Vehicles.driving) return;
    Vehicles.horn();
    HUD.toast('📢 HONK!');
  }

  /* ---------------- panel actions ---------------- */
  function toggleLazy() {
    state.lazy = !state.lazy;
    HUD.setLazy(state.lazy);
    HUD.toast(state.lazy ? '🌙 LAZY ON — auto-advance & skip' : 'LAZY off');
    persist();
  }
  function toggleSound() {
    state.sound = !state.sound;
    AudioSys.setMuted(!state.sound);
    HUD.setSound(state.sound);
    persist();
  }
  function showHelp() {
    Dialogue.show([
      '🎮 CONTROLS — WASD / arrows to walk · SHIFT to sprint · E / ENTER to interact · 1-4 to answer · ESC to skip.',
      '🚗 DRIVING — F enters/exits cars · W/S gas & reverse · A/D steer · SHIFT fast · G/C slow · SPACE brake · H horn · R radio.',
      '💥 COLLISIONS — Cars can smash trees & road lights (extinguishing night lights!), while homes and the river stay solid.',
      '🗺 M — city map; click to set a waypoint. Clear all 26 DLNA sites across 5 units and defeat all 5 bosses!'
    ], null, { speaker: 'PY', avatar: '🎮' });
  }
  function resetGame() {
    if (confirm('Erase this save and start over?')) {
      SaveSystem.reset();
      location.reload();
    }
  }

  /* ---------------- key routing ---------------- */
  function tryOverlayAdvance() {
    if (Dialogue.isOpen) { Dialogue.advance(); return true; }
    if (Quiz.isOpen) return Quiz.advanceIfOpen();
    if (Boss.isOpen) return Boss.advanceIfOpen();
    if (Minimap.isOpen()) { Minimap.toggle(false); return true; }
    if (mode === 'title' || mode === 'victory' || mode === 'boot') return true;
    return false;
  }

  function answerByIndex(i) {
    if (Quiz.isOpen) Quiz.keyAnswer(i);
    else if (Boss.isOpen) Boss.keyAnswer(i);
  }

  function escape() {
    if (Dialogue.isOpen) { Dialogue.skip(); return; }
    if (Minimap.isOpen()) { Minimap.toggle(false); return; }
    HUD.toast('ESC — no place to run here!');
  }

  function onUserGesture() { AudioSys.unlock(); }

  /* ---------------- render ---------------- */
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1c3b2a';
    ctx.fillRect(0, 0, cw, ch);
    if (mode === 'boot' || mode === 'title') { renderTitlePan(); return; }

    var TS = WORLD_MAP.tileSize;
    var camX = Player.camX, camY = Player.camY;

    /* crash camera shake */
    var shake = Vehicles.shake;
    if (shake > 0) {
      camX += (Math.random() - 0.5) * shake * 14;
      camY += (Math.random() - 0.5) * shake * 14;
    }

    var vw = cw / zoom, vh = ch / zoom;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(camX), -Math.round(camY));

    var x0 = Math.max(0, Math.floor(camX / TS) - 1);
    var x1 = Math.min(WORLD_MAP.cols - 1, Math.ceil((camX + vw) / TS) + 1);
    var y0 = Math.max(0, Math.floor(camY / TS) - 2);
    var y1 = Math.min(WORLD_MAP.rows - 1, Math.ceil((camY + vh) / TS) + 2);

    var wf = Math.floor(time * 1.6) % 2;
    var visTrees = [];
    var visTall = [];              // trees + lamps + houses, y-sorted with cars

    /* ground pass */
    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        var t = World.tileAt(tx, ty);
        var px = tx * TS, py = ty * TS;
        if (t === World.T.WATER) {
          ctx.drawImage(Sprites.get('water' + wf), px, py);
        } else if (t === World.T.BRIDGE) {
          ctx.drawImage(Sprites.get('bridge'), px, py);
        } else if (t === World.T.ROAD) {
          ctx.drawImage(Sprites.get('road'), px, py);
        } else {
          ctx.drawImage(Sprites.get('grass' + ((tx * 31 + ty * 17) % 4)), px, py);
          if (t === World.T.FL0) ctx.drawImage(Sprites.get('flower0'), px, py);
          else if (t === World.T.FL1) ctx.drawImage(Sprites.get('flower1'), px, py);
          else if (t === World.T.FL2) ctx.drawImage(Sprites.get('flower2'), px, py);
          else if (t === World.T.STUMP) ctx.drawImage(Sprites.get('stump'), px, py);
          else if (t === World.T.LAMP_BROKEN) ctx.drawImage(Sprites.get('lampbroken'), px, py);
          else if (t === World.T.TREE) visTrees.push({ tx: tx, ty: ty, base: (ty + 1) * TS });
        }
      }
    }

    /* location pads */
    WORLD_MAP.locations.forEach(function (l) {
      var px = l.x * TS, py = l.y * TS;
      if (px < camX - TS || px > camX + vw || py < camY - TS || py > camY + vh) return;
      var u = WORLD_MAP.units[l.unit - 1];
      ctx.drawImage(Sprites.get('pad' + u.color), px, py);
      var done = isCleared(l.id);
      if (!done) {
        ctx.strokeStyle = u.color;
        ctx.globalAlpha = 0.45 + 0.3 * Math.sin(time * 3);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px + 16, py + 16, 14 + Math.sin(time * 3) * 1.5, 0, 7);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = '17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.icon, px + 16, py + 15 - Math.abs(Math.sin(time * 2)) * 3);
      if (done) {
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(px + 26, py + 6, 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px system-ui';
        ctx.fillText('✔', px + 26, py + 6);
      }
    });

    /* arenas */
    WORLD_MAP.units.forEach(function (u) {
      var b = u.boss;
      var px = b.x * TS, py = b.y * TS;
      if (px < camX - TS || px > camX + vw || py < camY - TS || py > camY + vh) return;
      var kind = bossBeaten(u.id) ? 'beaten' : (unitCleared(u.id) ? 'open' : 'locked');
      ctx.drawImage(Sprites.get('arena' + kind), px, py);
      if (kind === 'open') {
        ctx.strokeStyle = '#e74c3c';
        ctx.globalAlpha = 0.4 + 0.35 * Math.sin(time * 4);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px + 16, py + 16, 17, 0, 7); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = (kind === 'locked' ? '13px' : '16px') + ' system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(kind === 'locked' ? '🔒' : b.icon, px + 16, py + 15 - Math.abs(Math.sin(time * 2.5)) * 3);
    });

    /* tall things + hero + cars + citizens, y-sorted together */
    var playerBase = Player.y + 6;
    visTrees.forEach(function (tr) {
      if (tr.base <= playerBase) ctx.drawImage(Sprites.get('tree' + ((tr.tx * 13 + tr.ty * 7) % 2)), tr.tx * TS, (tr.ty + 1) * TS - 64);
    });
    Vehicles.draw(ctx);
    NPC.draw(ctx);
    Player.draw(ctx);
    visTrees.forEach(function (tr) {
      if (tr.base > playerBase) ctx.drawImage(Sprites.get('tree' + ((tr.tx * 13 + tr.ty * 7) % 2)), tr.tx * TS, (tr.ty + 1) * TS - 64);
    });

    /* lamp poles & lit houses (always drawn on top for glow) */
    for (var ly = y0; ly <= y1; ly++) {
      for (var lx = x0; lx <= x1; lx++) {
        var lt = World.tileAt(lx, ly);
        if (lt === World.T.LAMP) ctx.drawImage(Sprites.get('lamp'), lx * TS, ly * TS - 32);
        else if (lt === World.T.HOUSE) ctx.drawImage(Sprites.get('house' + ((lx * 7 + ly * 3) % 2)), lx * TS, ly * TS);
      }
    }

    /* ---- NIGHT: darkness + lamps + headlights ---- */
    var dark = DayNight.darkness();
    if (dark > 0) {
      ctx.fillStyle = 'rgba(10,14,26,' + (dark * WORLD_MAP.city.nightOverlay / 0.62).toFixed(3) + ')';
      ctx.fillRect(camX - TS, camY - TS, vw + 2 * TS, vh + 2 * TS);

      /* punch light around lamps */
      var reach = WORLD_MAP.city.lampReach * TS;
      World.lamps().forEach(function (L) {
        var lx = L.x * TS + 16, ly = L.y * TS + 16;
        if (lx < camX - reach || lx > camX + vw + reach || ly < camY - reach || ly > camY + vh + reach) return;
        var grad = ctx.createRadialGradient(lx, ly - 20, 4, lx, ly - 20, reach);
        grad.addColorStop(0, 'rgba(255,224,138,' + (dark * 0.5).toFixed(2) + ')');
        grad.addColorStop(1, 'rgba(255,224,138,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(lx - reach, ly - reach, reach * 2, reach * 2);
      });

      /* headlight cones */
      Vehicles.drawLights(ctx);
    }

    /* dusk/dawn warm tint */
    var tintC = DayNight.tint();
    if (tintC) {
      ctx.fillStyle = tintC;
      ctx.fillRect(camX - TS, camY - TS, vw + 2 * TS, vh + 2 * TS);
    }

    ctx.restore();

    /* ---- screen-space layers ---- */
    Weather.draw(ctx, cw, ch, Math.min(loopDt, 0.05));

    /* lightning flash */
    var fl = Weather.lightning();
    if (fl > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (fl * 0.35).toFixed(3) + ')';
      ctx.fillRect(0, 0, cw, ch);
    }

    /* radar */
    Minimap.drawRadar(ctx, cw, ch);
  }

  /* the title screen: a slow cinematic pan across the world */
  function renderTitlePan() {
    var TS = WORLD_MAP.tileSize;
    titlePan += 0.00016;
    var t = titlePan % 1;
    /* drift along the river, north to south */
    var cx = (20 + Math.sin(t * Math.PI * 2) * 60) * TS;
    var cy = (30 + t * 60) * TS;
    var vw = cw / (zoom * 0.85), vh = ch / (zoom * 0.85);

    ctx.save();
    ctx.scale(zoom * 0.85, zoom * 0.85);
    ctx.translate(-cx, -cy);

    var x0 = Math.max(0, Math.floor(cx / TS) - 1);
    var x1 = Math.min(WORLD_MAP.cols - 1, Math.ceil((cx + vw) / TS) + 1);
    var y0 = Math.max(0, Math.floor(cy / TS) - 1);
    var y1 = Math.min(WORLD_MAP.rows - 1, Math.ceil((cy + vh) / TS) + 1);
    var wf = Math.floor(time * 1.6) % 2;

    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        var t2 = World.tileAt(tx, ty);
        var px = tx * TS, py = ty * TS;
        if (t2 === World.T.WATER) ctx.drawImage(Sprites.get('water' + wf), px, py);
        else if (t2 === World.T.BRIDGE) ctx.drawImage(Sprites.get('bridge'), px, py);
        else if (t2 === World.T.ROAD) ctx.drawImage(Sprites.get('road'), px, py);
        else {
          ctx.drawImage(Sprites.get('grass' + ((tx * 31 + ty * 17) % 4)), px, py);
          if (t2 === World.T.FL0) ctx.drawImage(Sprites.get('flower0'), px, py);
          else if (t2 === World.T.FL1) ctx.drawImage(Sprites.get('flower1'), px, py);
          else if (t2 === World.T.FL2) ctx.drawImage(Sprites.get('flower2'), px, py);
          else if (t2 === World.T.TREE) ctx.drawImage(Sprites.get('tree' + ((tx * 13 + ty * 7) % 2)), tx * TS, (ty + 1) * TS - 64);
        }
      }
    }
    ctx.restore();

    /* gentle letterbox on title (CSS owns the .on class visuals) */
    var lb = document.getElementById('letterbox');
    if (lb) lb.classList.toggle('on', mode === 'title' || mode === 'boot');
  }

  /* ---------------- public ---------------- */
  window.CCG = {                    /* debug/testing handle */
    player: Player,
    state: function () { return state; },
    mode: function () { return mode; }
  };

  return {
    boot: boot,
    tryOverlayAdvance: tryOverlayAdvance,
    answerByIndex: answerByIndex,
    escape: escape,
    onUserGesture: onUserGesture,
    lazyMode: function () { return state && state.lazy; },
    toggleMap: toggleMap,
    toggleCar: toggleCar,
    cycleRadio: cycleRadio,
    honk: honk,
    isCleared: isCleared,
    unitCleared: unitCleared,
    bossBeaten: bossBeaten
  };
})();

window.addEventListener('DOMContentLoaded', function () { Game.boot(); });
