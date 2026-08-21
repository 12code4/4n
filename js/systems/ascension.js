/* v6.0 — Ascension system: the current charter's tier, cumulative modifier
 * accessors read by the other systems, and clear/unlock bookkeeping. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var A = (G.Ascension = {});

  A.tier = function () { return (G.state && G.state.ascension) || 0; };
  A.maxCleared = function () { return (G.state && G.state.ascMax) || 0; };
  A.maxAllowed = function () { return Math.min(10, A.maxCleared() + 1); };

  /* accumulate a numeric fx across all active tiers (1..tier) */
  function acc(key, base, combine) {
    var t = A.tier(), v = base;
    for (var i = 1; i <= t; i++) {
      var def = G.DATA.ascTier(i);
      if (def && def.fx[key] !== undefined) v = combine(v, def.fx[key]);
    }
    return v;
  }
  var mul = function (a, b) { return a * b; };
  var add = function (a, b) { return a + b; };

  A.wageMult = function () { return acc('wage', 1, mul); };
  A.hireMult = function () { return acc('hire', 1, mul); };
  A.enemyHp = function () { return acc('enemyHp', 1, mul); };
  A.enemyDmg = function () { return acc('enemyDmg', 0, add); };
  A.torch = function () { return acc('torch', 0, add); };
  A.guardianHp = function () { return acc('guardianHp', 1, mul); };
  A.supplyMult = function () { return acc('supply', 1, mul); };
  A.injuryChance = function () { return acc('injury', 0, add); };
  A.injuryDays = function () { return acc('injuryDays', 0, add); };
  A.rivalMult = function () { return acc('rival', 1, mul); };
  A.wipeCollapses = function () { return A.tier() >= 10; };

  /* start (or restart) the current charter at a chosen tier */
  A.setTier = function (t) {
    t = G.U.clamp(t | 0, 0, A.maxAllowed());
    G.state.ascension = t;
  };

  /* called when an ending is reached: bank the clear, unlock the next tier */
  A.onEnding = function () {
    var st = G.state;
    var t = A.tier();
    if (t <= 0) return;
    if (t > (st.ascMax || 0)) {
      st.ascMax = t;
      // persist the ladder progress across charters (with the legacy store)
      if (G.Prestige) { var leg = G.Prestige.loadLegacy(); leg.ascMax = Math.max(leg.ascMax || 0, t); G.Prestige.saveLegacy(leg); }
      G.log('Ascension ' + roman(t) + ' mastered. The next charter may climb higher.', 'story');
    }
    // award the tier's Ascension relic (and any lower unearned ones)
    for (var i = 1; i <= t; i++) {
      var def = G.DATA.ascTier(i);
      if (def && def.relic && G.Relics && G.Relics.owned().indexOf(def.relic) < 0) G.Relics.award(def.relic);
    }
    // bonus Legacy Marks for the height climbed
    if (G.Prestige) {
      var bonus = t;
      var leg2 = G.Prestige.loadLegacy(); leg2.marks = (leg2.marks || 0) + bonus; G.Prestige.saveLegacy(leg2);
      st.legacy.marks = (st.legacy.marks || 0) + bonus;
      G.log('The climb pays: +' + bonus + ' Legacy Marks banked.', 'good');
    }
  };

  function roman(n) { return ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || ('' + n); }
  A.roman = roman;

  /* human-readable list of the mods active at the current tier */
  A.activeMods = function () {
    var out = [], t = A.tier();
    for (var i = 1; i <= t; i++) { var def = G.DATA.ascTier(i); if (def) out.push({ t: i, name: def.name, add: def.add }); }
    return out;
  };
})();
