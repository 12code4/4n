/* v8.0 — Options & accessibility: difficulty presets (separate from Ascension),
 * game speed, colorblind palette, reduced motion, and combat auto-resolve.
 * Persisted to localStorage; guarded so it's inert under node/tests. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var O = (G.Options = {});

  O.defaults = { difficulty: 'standard', speed: 1, colorblind: false, reducedMotion: false, autoResolve: false };
  O.state = null;

  O.DIFFS = {
    story:    { name: 'Story',    mult: 0.8, blurb: 'A gentler Maw — 20% softer foes. For the tale, not the trial.' },
    standard: { name: 'Standard', mult: 1.0, blurb: 'The Maw as designed.' },
    brutal:   { name: 'Brutal',   mult: 1.3, blurb: 'A meaner Maw — 30% harder foes. Stacks with Ascension.' }
  };

  O.load = function () {
    O.state = {};
    for (var k in O.defaults) O.state[k] = O.defaults[k];
    try {
      if (typeof localStorage !== 'undefined') {
        var s = localStorage.getItem('gilded_maw_options');
        if (s) { var p = JSON.parse(s); for (var k2 in O.defaults) if (p[k2] !== undefined) O.state[k2] = p[k2]; }
      }
    } catch (e) {}
    return O.state;
  };
  O.get = function (k) { if (!O.state) O.load(); return O.state[k]; };
  O.set = function (k, v) {
    if (!O.state) O.load();
    O.state[k] = v;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('gilded_maw_options', JSON.stringify(O.state)); } catch (e) {}
    O.apply();
    G.emit('options', O.state);
  };

  /* global difficulty multiplier on enemy hp & damage (combat reads this) */
  O.diffMult = function () { var d = O.DIFFS[O.get('difficulty')] || O.DIFFS.standard; return d.mult; };
  O.reducedMotion = function () { return !!O.get('reducedMotion'); };
  O.speed = function () { return O.get('speed') || 1; };
  O.autoResolve = function () { return !!O.get('autoResolve'); };

  /* reflect visual options onto the document + the gfx layer */
  O.apply = function () {
    if (!O.state) O.load();
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('cb', !!O.state.colorblind);
      document.body.classList.toggle('reduced-motion', !!O.state.reducedMotion);
    }
    if (G.GFX) G.GFX.reduceMotion = !!O.state.reducedMotion;
  };

  O.load();
})();
