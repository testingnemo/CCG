/* ============================================================
   ENGINE · input.js — keyboard, touch D-pad, keyboard-hint chips
   GTA-level keys:
     M  — pause map / radar waypoint
     F  — enter or exit the nearest car
     R  — cycle the radio station (in car)
     H  — horn (in car)
     G  — toggle SLOW / ROAD gear (in car)
     C  — hold for SLOW cruise (in car)
     SHIFT — sprint on foot / FAST sport boost in car
     SPACE — handbrake in car (or advance overlay)
   Touch: D-pad + ACTION button (E) + on-screen CAR / MAP / RADIO
   buttons in the panel drive the same handlers.
   ============================================================ */
'use strict';

var Input = (function () {
  var keys = { up: false, down: false, left: false, right: false };
  var sprint = false;
  var brake = false;
  var slowHold = false;
  var slowGear = false;
  var interactQueued = false;
  var touchMode = false;

  function canDriveBrake() {
    return typeof Vehicles !== 'undefined' && Vehicles.driving &&
           typeof Dialogue !== 'undefined' && !Dialogue.isOpen &&
           typeof Quiz !== 'undefined' && !Quiz.isOpen &&
           typeof Boss !== 'undefined' && !Boss.isOpen &&
           typeof Minimap !== 'undefined' && !Minimap.isOpen() &&
           typeof CCG !== 'undefined' && CCG.mode() === 'explore';
  }

  /* one-shot action presses routed to Game */
  function fireAction(code) {
    switch (code) {
      case 'KeyM': Game.toggleMap(); return;
      case 'KeyF': Game.toggleCar(); return;
      case 'KeyR': Game.cycleRadio(); return;
      case 'KeyH': Game.honk(); return;
      case 'KeyG':
        if (typeof Vehicles !== 'undefined' && Vehicles.driving) {
          slowGear = !slowGear;
          HUD.toast(slowGear ? '🐢 Gear: SLOW CRUISE' : '🚗 Gear: ROAD NORMAL');
        }
        return;
    }
  }

  var keyDown = function (e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': keys.up = true; break;
      case 'ArrowDown': case 'KeyS': keys.down = true; break;
      case 'ArrowLeft': case 'KeyA': keys.left = true; break;
      case 'ArrowRight': case 'KeyD': keys.right = true; break;
      case 'ShiftLeft': case 'ShiftRight': sprint = true; break;
      case 'KeyC': slowHold = true; break;
      case 'KeyM': if (!e.repeat) fireAction('KeyM'); break;
      case 'KeyF': if (!e.repeat) fireAction('KeyF'); break;
      case 'KeyR': if (!e.repeat) fireAction('KeyR'); break;
      case 'KeyH': if (!e.repeat) fireAction('KeyH'); break;
      case 'KeyG': if (!e.repeat) fireAction('KeyG'); break;
      case 'Space':
        if (canDriveBrake()) {
          brake = true;
          e.preventDefault();
          break;
        }
        /* fall through to interact/advance when not driving */
      case 'KeyE': case 'Enter':
        if (!e.repeat) {
          if (!Game.tryOverlayAdvance()) interactQueued = true;
        }
        if (e.code === 'KeyE') hintPress('E', true);
        if (e.code === 'Enter') hintPress('ENTER', true);
        if (e.code === 'Space') hintPress('SPACE', true);
        e.preventDefault();
        break;
      case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
        Game.answerByIndex(+e.code.slice(-1) - 1);
        break;
      case 'Escape': Game.escape(); break;
    }
    Game.onUserGesture();
  };

  var keyUp = function (e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': keys.up = false; break;
      case 'ArrowDown': case 'KeyS': keys.down = false; break;
      case 'ArrowLeft': case 'KeyA': keys.left = false; break;
      case 'ArrowRight': case 'KeyD': keys.right = false; break;
      case 'ShiftLeft': case 'ShiftRight': sprint = false; break;
      case 'KeyC': slowHold = false; break;
      case 'Space':
        brake = false;
        hintPress('SPACE', false);
        break;
      case 'KeyE': hintPress('E', false); break;
      case 'Enter': hintPress('ENTER', false); break;
    }
  };

  /* ---- hint chips: animate when the physical key is pressed ---- */
  function hintPress(label, on) {
    var el = document.querySelector('.kchip[data-key="' + label + '"]');
    if (el) el.classList.toggle('pressed', on);
  }

  /* ---- touch ---- */
  function bindPad() {
    ['up', 'down', 'left', 'right'].forEach(function (dir) {
      var btn = document.getElementById('dpad-' + dir);
      if (!btn) return;
      ['touchstart', 'pointerdown'].forEach(function (ev) {
        btn.addEventListener(ev, function (e) {
          e.preventDefault(); keys[dir] = true; touchMode = true; Game.onUserGesture();
        }, { passive: false });
      });
      ['touchend', 'touchcancel', 'pointerup', 'pointerleave'].forEach(function (ev) {
        btn.addEventListener(ev, function (e) { e.preventDefault(); keys[dir] = false; }, { passive: false });
      });
    });
    var act = document.getElementById('actionBtn');
    if (act) {
      act.addEventListener('touchstart', function (e) {
        e.preventDefault(); touchMode = true;
        if (!Game.tryOverlayAdvance()) interactQueued = true;
        Game.onUserGesture();
      }, { passive: false });
    }
    /* mobile GTA buttons */
    bindBtn('btn-car', function () { Game.toggleCar(); });
    bindBtn('btn-radio', function () { Game.cycleRadio(); });
    bindBtn('btn-horn', function () { Game.honk(); });
    window.addEventListener('touchstart', function () {
      touchMode = true;
      document.body.classList.add('touch');
    }, { once: true, passive: true });
  }

  function bindBtn(id, fn) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
  }

  function init() {
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', function () {
      keys.up = keys.down = keys.left = keys.right = false;
      sprint = brake = slowHold = false;
    });
    bindPad();
    window.addEventListener('pointerdown', function () { Game.onUserGesture(); });
    window.addEventListener('contextmenu', function (e) {
      if (e.target.tagName === 'CANVAS') e.preventDefault();
    });
  }

  /* consumed by the game loop */
  function takeInteract() {
    var v = interactQueued;
    interactQueued = false;
    return v;
  }

  function axis() {
    return { x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0) };
  }

  /* driving axis: W/S = throttle, A/D = steering, SHIFT = fast, G/C = slow, SPACE = brake */
  function drive() {
    return {
      gas: (keys.up ? 1 : 0) - (keys.down ? 1 : 0),
      steer: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
      brake: brake,
      fast: sprint,
      slow: (slowHold || slowGear) && !sprint
    };
  }

  function resetVehicleState() { brake = false; slowHold = false; }

  return {
    init: init, axis: axis, drive: drive, takeInteract: takeInteract,
    resetVehicleState: resetVehicleState,
    isTouch: function () { return touchMode; },
    isSprint: function () { return sprint; },
    isSlowGear: function () { return slowGear; }
  };
})();
