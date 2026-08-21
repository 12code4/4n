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
      buildings: { storehouse: 1, tavern: 0, assay: 0, infirmary: 0, forge: 0, contracts: 0, charterhall: 0 },
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
      renown: 0,                           // v3
      relics: { owned: [], slotted: [] },  // v3
      achievements: [],                    // v3
      quests: {},                          // v3 questline stages
      questPerks: {},                      // v3
      rivals: null,                        // v3 (lazily init'd by Rivals)
      claims: {},                          // v3 biomeId -> owner
      mood: null,                          // v4 the Maw's mood
      omenOffer: null, omenChosen: [],     // v4 per-outfitting omen choice
      beasts: { owned: [], active: null }, // v4 companion beasts
      legacy: { marks: 0, perks: [] },     // v4 prestige (overwritten by applyLegacy)
      unlockedStart: 1,                    // deepest depth an expedition may START at
      guardiansSlain: {},                  // biomeId -> true
      expedition: null,
      graveyard: [],
      journalSeen: [],                     // page ids unlocked
      journalRead: [],
      flags: {},
      stats: { delves: 0, deaths: 0, kills: 0, earned: 0, spent: 0, deepest: 0, daysRun: 1, sold: 0,
        crafted: 0, contractsDone: 0, rivalWins: 0, honored: 0 },
      unpaid: {},                          // delverId -> consecutive unpaid days
      log: [],
      ui: { bark: 0 }
    };
    G.state = st;
    // v4: inherit the Legacy store from any retired charters
    G.applyLegacy(st);
    // seed market at base ± a little
    var mats = G.DATA.materialList();
    for (var i = 0; i < mats.length; i++) {
      st.market[mats[i].id] = Math.max(1, Math.round(mats[i].base * (0.9 + G.rng() * 0.2)));
    }
    // the Maw always has a mood
    if (G.Moods) G.Moods.roll();
    // founding roster: two green delvers on the porch, and a tavern pool
    var fq = st._foundingQuality || 0;
    G.Delvers.addToRoster(G.Delvers.generate(fq));
    G.Delvers.addToRoster(G.Delvers.generate(fq));
    if (st._startBeast && G.Beasts) G.Beasts.rescue(st._startBeast);
    delete st._foundingQuality; delete st._startBeast;
    G.Delvers.refreshPool(true);
    G.log('The deed is signed. Vale & Co. is yours — storehouse, debts, and all.', 'story');
    return st;
  };

  /* v4: apply the persistent Legacy store (Legacy Marks + bought perks) to a
   * fresh charter. Reads the between-charter store from Prestige. */
  G.applyLegacy = function (st) {
    if (!G.Prestige) { st.legacy = st.legacy || { marks: 0, perks: [] }; return; }
    var leg = G.Prestige.loadLegacy();
    st.legacy = { marks: leg.marks || 0, perks: (leg.perks || []).slice(), charters: leg.charters || 0 };
    var fx = function (k) { return G.Prestige.fx(k); };
    // startMarks
    var sm = fx('startMarks'); if (sm) st.marks += sm;
    // pre-built buildings
    var sb = fx('startBuild'); if (sb) sb.forEach(function (b) { if (st.buildings[b] !== undefined) st.buildings[b] = Math.max(st.buildings[b], 1); });
    // founding quality + start beast (consumed in newGame)
    var fqp = fx('foundingQuality'); if (fqp) st._foundingQuality = fqp;
    var sbe = fx('startBeast'); if (sbe) st._startBeast = sbe;
    // start renown
    var sr = fx('startRenown'); if (sr) st.renown = (st.renown || 0) + sr;
  };
})();
