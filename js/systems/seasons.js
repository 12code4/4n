/* v6.0 — Seasons & festivals system. Season is derived from the day; festivals
 * are rolled on the day tick and last a day or two. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var S = (G.Seasons = {});

  S.index = function () { return Math.floor(((G.state.day || 1) - 1) / G.DATA.SEASON_LEN) % 4; };
  S.def = function () { return G.DATA.seasons[S.index()]; };
  S.dayOfSeason = function () { return ((G.state.day || 1) - 1) % G.DATA.SEASON_LEN + 1; };

  S.festival = function () {
    var st = G.state;
    return (st.festival && st.festival.until >= st.day) ? G.U.byId(G.DATA.festivals, st.festival.id) : null;
  };

  /* per-material sell multiplier from season + festival */
  S.sellMult = function (matId) {
    var m = 1;
    var mat = G.DATA.materials[matId];
    var seas = S.def().fx;
    if (seas.sellTag && mat) { (mat.tags || [mat.biome]).forEach(function () {}); }
    if (seas.sellTag && mat) {
      // tag-based: match material biome/family loosely by hue family isn't ideal;
      // use the 'fire'/'glass' shortcuts against known glassy/fiery mats
      if (seas.sellTag.glass && /glass|pearl/.test(matId)) m *= seas.sellTag.glass;
      if (seas.sellTag.fire && /ember|wisp|cinder|slag|forge/.test(matId)) m *= seas.sellTag.fire;
    }
    var fest = S.festival();
    if (fest) {
      if (fest.fx.sell) m *= fest.fx.sell;
      if (fest.fx.sellMat && fest.fx.sellMat[matId]) m *= fest.fx.sellMat[matId];
    }
    return m;
  };

  /* per-supply buy multiplier from season + festival */
  S.supplyMult = function (kind) {
    var m = 1;
    var seas = S.def().fx;
    if (seas.supply && seas.supply[kind]) m *= seas.supply[kind];
    var fest = S.festival();
    if (fest && fest.fx.supply && fest.fx.supply[kind]) m *= fest.fx.supply[kind];
    return m;
  };

  S.hireDiscount = function () {
    var seas = S.def().fx;
    return (seas.hireDiscount || 0);
  };
  S.festivalContractBonus = function () {
    var fest = S.festival();
    return (fest && fest.fx.contracts) || 0;
  };

  /* called on the day tick: announce season turns, roll and end festivals */
  S.tick = function () {
    var st = G.state;
    // season change announcement
    var idx = S.index();
    if (st._lastSeason === undefined) st._lastSeason = idx;
    if (idx !== st._lastSeason) {
      st._lastSeason = idx;
      var d = S.def();
      G.log('The season turns to ' + d.name + '. ' + d.blurb, 'story');
      G.emit('season', d);
    }
    // festival lifecycle
    if (st.festival && st.festival.until < st.day) {
      G.log('The festival ends; the lanterns come down.', 'info');
      st.festival = null;
    }
    if (!st.festival && !S.festival() && G.rchance(0.05) && st.day > 3) {
      var f = G.rpick(G.DATA.festivals);
      st.festival = { id: f.id, until: st.day + G.rint(1, 2) };
      if (G.Moods) { st.mood = { id: f.mood, until: st.day + 3 }; } // festivals set the mood
      G.log('A festival begins: ' + f.name + '. ' + f.blurb, 'story');
      G.emit('festival', f);
    }
  };
})();
