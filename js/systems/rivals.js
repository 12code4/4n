/* v3.0 — Rival charters: a light simulated economy, contract sniping, depth
 * claims, and underground encounters (parley / wager / brawl). */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var Rv = (G.Rivals = {});

  Rv.init = function () {
    var st = G.state;
    if (st.rivals) return;
    st.rivals = G.DATA.rivalDefs.map(function (r) {
      return { id: r.id, renown: G.rint(10, 30), depth: 1, marks: G.rint(20, 60) };
    });
    st.claims = st.claims || {}; // biomeId -> 'player' | rivalId
  };
  Rv.get = function (id) { return G.U.byId(G.state.rivals || [], id); };
  Rv.def = function (id) { return G.U.byId(G.DATA.rivalDefs, id); };

  /* Do rivals matter yet? They wake once the company is past the Gullet. */
  Rv.active = function () {
    var st = G.state;
    return (st.stats.deepest || 1) >= 3 || G.bld('charterhall') > 0;
  };

  Rv.dailyTick = function () {
    var st = G.state;
    if (!Rv.active()) return;
    Rv.init();
    st.rivals.forEach(function (r) {
      var def = Rv.def(r.id);
      r.marks += G.rint(2, 8);
      r.renown += G.rchance(0.25) ? 1 : 0;
      // push depth toward, but not past, the player's frontier + a little
      var frontier = Math.max(2, (st.stats.deepest || 1) + 1);
      if (G.rchance(0.18 * def.pace) && r.depth < frontier) r.depth++;
      // occasionally a rival loses a crew (keeps them from running away with it)
      if (G.rchance(0.05) && r.depth > 2) { r.depth--; }
    });
    // contract sniping: an aggressive rival may grab an open posting
    if (st.contracts && st.contracts.offers && st.contracts.offers.length && G.rchance(0.2)) {
      var aggressor = st.rivals[0];
      st.rivals.forEach(function (r) { if (Rv.def(r.id).aggression > Rv.def(aggressor.id).aggression) aggressor = r; });
      if (G.rchance(Rv.def(aggressor.id).aggression)) {
        var taken = st.contracts.offers.shift();
        G.log('Posting sniped: ' + Rv.def(aggressor.id).name + ' took the ' + G.DATA.materials[taken.mat].name + ' contract out from under you.', 'bad');
      }
    }
    // depth claims: a rival that pushes past an unclaimed, uncleared biome claims it
    G.DATA.biomes.forEach(function (b) {
      if (st.claims[b.id]) return;
      if (st.guardiansSlain[b.id]) { st.claims[b.id] = 'player'; return; }
      st.rivals.forEach(function (r) {
        if (!st.claims[b.id] && r.depth >= b.depths[1] && G.rchance(0.3)) {
          st.claims[b.id] = r.id;
          G.log(Rv.def(r.id).name + ' plants a claim on ' + b.name + '. Their colours fly over the stair now.', 'bad');
        }
      });
    });
  };

  /* Player claims a biome by clearing its guardian. */
  Rv.claimForPlayer = function (biomeId) {
    var st = G.state;
    if (!st.claims) st.claims = {};
    var prev = st.claims[biomeId];
    st.claims[biomeId] = 'player';
    if (prev && prev !== 'player') {
      G.log('You wrest the claim on ' + G.DATA.biomeForDepth(G.DATA.biomes.filter(function (b) { return b.id === biomeId; })[0].depths[0]).name + ' back from ' + Rv.def(prev).name + '.', 'good');
    }
  };
  /* Sell bonus for player-owned biome materials. */
  Rv.claimSellBonus = function (matId) {
    var st = G.state;
    var mat = G.DATA.materials[matId];
    if (!mat || !st.claims) return 0;
    // material's biome
    var owner = st.claims[mat.biome];
    return owner === 'player' ? 0.05 : 0;
  };

  /* ---------- underground encounter ---------- */
  Rv.pickRival = function () {
    var st = G.state;
    Rv.init();
    return G.rpick(st.rivals);
  };
  Rv.encounterCrew = function (depth) {
    // a rival brawl crew scaled to depth
    var n = depth >= 8 ? 3 : depth >= 5 ? 2 : 2;
    var pool = ['rival_bruiser', 'rival_scout', 'rival_mage'];
    var crew = [];
    for (var i = 0; i < n; i++) crew.push(pool[i % pool.length]);
    return crew;
  };
})();
