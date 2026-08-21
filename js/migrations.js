/* Save migrations. Each key upgrades a save FROM that version to the next.
 * Loaded after core.js (which owns the empty G.migrations map) and after data,
 * so migrations may reference G.DATA defaults. */
(function () {
  var G = (globalThis.G = globalThis.G || {});

  // v1 (1.0 "Founding") → v2 (2.0 "Forge & Fortune")
  G.migrations[1] = function (st) {
    st.buildings.forge = st.buildings.forge || 0;
    st.buildings.contracts = st.buildings.contracts || 0;
    if (!st.armory) st.armory = [];
    if (!st.contracts) st.contracts = { offers: [], active: [] };
    if (!st.marketEvents) st.marketEvents = [];
    if (!st.marketPrev) st.marketPrev = {};
    (st.delvers || []).forEach(function (d) { if (d.injury === undefined) d.injury = null; });
    // seed prices for materials added in 2.0 that an old save never had
    G.DATA.materialList().forEach(function (m) {
      if (st.market[m.id] === undefined) st.market[m.id] = m.base;
    });
    return st;
  };

  // v2 (2.0 "Forge & Fortune") → v3 (3.0 "Rivals & Renown")
  G.migrations[2] = function (st) {
    st.buildings.charterhall = st.buildings.charterhall || 0;
    if (st.renown === undefined) st.renown = 0;
    if (!st.relics) st.relics = { owned: [], slotted: [] };
    if (!st.achievements) st.achievements = [];
    if (!st.quests) st.quests = {};
    if (!st.questPerks) st.questPerks = {};
    if (!st.claims) st.claims = {};
    if (st.rivals === undefined) st.rivals = null;
    ['crafted', 'contractsDone', 'rivalWins', 'honored'].forEach(function (k) {
      if (st.stats[k] === undefined) st.stats[k] = 0;
    });
    (st.delvers || []).forEach(function (d) {
      if (!d.talents) d.talents = [];
      if (!d.pendingTalents) d.pendingTalents = [];
      if (d.face === undefined) d.face = ((d.id ? d.id.length * 2654435761 : 1) >>> 0);
    });
    (st.graveyard || []).forEach(function (g) { if (g.honored === undefined) g.honored = false; });
    // seed prices for 3.0 materials
    G.DATA.materialList().forEach(function (m) {
      if (st.market[m.id] === undefined) st.market[m.id] = m.base;
    });
    return st;
  };

  // v3 (3.0 "Rivals & Renown") → v4 (4.0 "The Living Maw")
  G.migrations[3] = function (st) {
    st.buildings.menagerie = st.buildings.menagerie || 0;
    if (st.mood === undefined) st.mood = null;
    if (st.omenOffer === undefined) st.omenOffer = null;
    if (!st.omenChosen) st.omenChosen = [];
    if (!st.beasts) st.beasts = { owned: [], active: null };
    if (!st.legacy) st.legacy = { marks: 0, perks: [] };
    // a live expedition from v3 gains the new per-run fields
    if (st.expedition) {
      if (!st.expedition.omens) st.expedition.omens = [];
      if (st.expedition.beast === undefined) st.expedition.beast = null;
    }
    G.DATA.materialList().forEach(function (m) {
      if (st.market[m.id] === undefined) st.market[m.id] = m.base;
    });
    return st;
  };
})();
