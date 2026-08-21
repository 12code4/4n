/* New-game state factory. G.state is the single serializable source of truth. */
(function () {
  var G = (globalThis.G = globalThis.G || {});

  G.newGame = function (seed) {
    seed = (seed === undefined || seed === null) ? Math.floor(Math.random() * 0xffffffff) : seed >>> 0;
    var st = {
      sv: G.SAVE_VER,
      seed: seed,
      rngS: seed,
      _rng: null,
      day: 1,
      marks: G.BAL.startMarks,
      buildings: { storehouse: 1, tavern: 0, assay: 0, infirmary: 0, forge: 0, contracts: 0 },
      delvers: [],
      nextDelverN: 1,
      tavernPool: [],
      poolDay: 0,
      inventory: {},                       // materialId -> qty
      supplies: G.U.deep(G.BAL.startSupplies),
      market: {},                          // materialId -> price
      marketPrev: {},
      marketEvents: [],                    // active price shocks (v2)
      armory: [],                          // company gear pool (v2)
      contracts: { offers: [], active: [] }, // v2
      unlockedStart: 1,                    // deepest depth an expedition may START at
      guardiansSlain: {},                  // biomeId -> true
      expedition: null,
      graveyard: [],
      journalSeen: [],                     // page ids unlocked
      journalRead: [],
      flags: {},
      stats: { delves: 0, deaths: 0, kills: 0, earned: 0, spent: 0, deepest: 0, daysRun: 1, sold: 0 },
      unpaid: {},                          // delverId -> consecutive unpaid days
      log: [],
      ui: { bark: 0 }
    };
    G.state = st;
    // seed market at base ± a little
    var mats = G.DATA.materialList();
    for (var i = 0; i < mats.length; i++) {
      st.market[mats[i].id] = Math.max(1, Math.round(mats[i].base * (0.9 + G.rng() * 0.2)));
    }
    // founding roster: two green delvers on the porch, and a tavern pool
    G.Delvers.addToRoster(G.Delvers.generate(0));
    G.Delvers.addToRoster(G.Delvers.generate(0));
    G.Delvers.refreshPool(true);
    G.log('The deed is signed. Vale & Co. is yours — storehouse, debts, and all.', 'story');
    return st;
  };
})();
