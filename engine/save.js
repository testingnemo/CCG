/* ============================================================
   ENGINE · save.js — localStorage persistence (autosave)
   Save format is versioned; unknown/newer versions are ignored.
   v4: DLNA course state + broken trees/lamps persistence.
   ============================================================ */
'use strict';

var SaveSystem = (function () {
  var KEY = 'cool-coding-game-dlna-v8';
  var FORMAT = 4;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.format !== FORMAT) return null;
      return data;
    } catch (e) { return null; }
  }

  function save(state) {
    try {
      var data = {
        format: FORMAT,
        xp: state.xp,
        cleared: state.cleared,                 // array of location ids
        bosses: state.bosses,                   // array of unit ids defeated
        pos: { x: state.x, y: state.y },        // player feet px
        lazy: state.lazy,
        sound: state.sound,
        seenIntro: state.seenIntro,
        visitedRegions: state.visitedRegions,
        clock: DayNight.serialize(),            // game minutes
        weather: Weather.serialize(),
        cars: Vehicles.serialize(),             // parked + stolen car positions
        broken: World.serializeBroken(),        // broken trees & street lamps
        waypoint: state.waypoint || null,
        stamp: Date.now()
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function has() { return load() !== null; }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  return { load: load, save: save, has: has, reset: reset };
})();
