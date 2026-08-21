/* v5.0 — The Codex: a living record of everything the company discovers. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var C = (G.Codex = {});

  C.ensure = function () {
    var st = G.state;
    if (!st.codex) st.codex = { enemy: {}, material: {}, relic: {}, mood: {}, biome: {}, ending: {}, beast: {} };
    ['enemy', 'material', 'relic', 'mood', 'biome', 'ending', 'beast'].forEach(function (k) { if (!st.codex[k]) st.codex[k] = {}; });
    return st.codex;
  };
  C.discover = function (cat, id) {
    var cx = C.ensure();
    if (!cx[cat]) cx[cat] = {};
    if (!cx[cat][id]) { cx[cat][id] = G.state.day; G.emit('codex', { cat: cat, id: id }); }
  };
  C.seen = function (cat, id) { var cx = C.ensure(); return !!(cx[cat] && cx[cat][id]); };
  C.count = function (cat) { var cx = C.ensure(); return Object.keys(cx[cat] || {}).length; };

  /* totals per category, for the codex header */
  C.total = function (cat) {
    switch (cat) {
      case 'enemy': return Object.keys(G.DATA.enemies).length;
      case 'material': return G.DATA.materialList().length;
      case 'relic': return G.DATA.relicList ? G.DATA.relicList().length : 0;
      case 'mood': return (G.DATA.moods || []).length;
      case 'biome': return (G.DATA.biomes || []).length;
      case 'ending': return Object.keys(G.DATA.endings || {}).length;
      case 'beast': return G.DATA.beastList ? G.DATA.beastList().length : 0;
    }
    return 0;
  };
})();
