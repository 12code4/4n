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
})();
