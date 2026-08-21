/* v3.0 — Renown, its tier perks, and the achievements engine. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var R = (G.Renown = {});

  R.total = function () { return G.state.renown || 0; };
  R.tier = function () {
    var t = G.DATA.renownTiers[0];
    var r = R.total();
    G.DATA.renownTiers.forEach(function (x) { if (r >= x.at) t = x; });
    return t;
  };
  R.nextTier = function () {
    var r = R.total();
    for (var i = 0; i < G.DATA.renownTiers.length; i++) if (G.DATA.renownTiers[i].at > r) return G.DATA.renownTiers[i];
    return null;
  };
  R.perks = function () {
    var r = R.total(), out = {};
    G.DATA.renownTiers.forEach(function (x) { if (r >= x.at && x.perk) out[x.perk] = true; });
    return out;
  };
  R.hasPerk = function (p) { return !!R.perks()[p]; };

  R.award = function (kind, amount) {
    var st = G.state;
    var amt = amount || G.DATA.renownAward[kind] || 0;
    if (!amt) return;
    var before = R.tier().id;
    st.renown = (st.renown || 0) + amt;
    var after = R.tier();
    if (after.id !== before) {
      G.log('Renown risen: the company is now ' + after.name + '. ' + (after.blurb || ''), 'story');
      G.emit('renown', after);
    }
    G.Achieve.check();
  };

  /* Honor a fallen delver at the memorial: a cost that buys lasting renown. */
  R.honorCost = function () { return 15; };
  R.honor = function (graveIdx) {
    var st = G.state;
    var gv = st.graveyard[graveIdx];
    if (!gv || gv.honored) return { ok: false, msg: 'Already honored, or no such grave.' };
    var cost = R.honorCost();
    if (st.marks < cost) return { ok: false, msg: 'Not enough marks to honor them properly.' };
    st.marks -= cost; st.stats.spent += cost;
    gv.honored = true;
    st.stats.honored = (st.stats.honored || 0) + 1;
    R.award('honor');
    G.Achieve.check();
    G.log('You lay a stone for ' + gv.name + '. “' + gv.epitaph + '” The company remembers.', 'story');
    G.emit('roster');
    return { ok: true };
  };

  /* ---------- achievements ---------- */
  var A = (G.Achieve = {});
  A.check = function () {
    var st = G.state;
    if (!st.achievements) st.achievements = [];
    G.DATA.achievements.forEach(function (a) {
      if (!a.check) return;
      if (st.achievements.indexOf(a.id) >= 0) return;
      if (a.check(st)) A.grant(a.id);
    });
  };
  A.grant = function (id) {
    var st = G.state;
    if (!st.achievements) st.achievements = [];
    if (st.achievements.indexOf(id) >= 0) return;
    var a = G.U.byId(G.DATA.achievements, id);
    if (!a) return;
    st.achievements.push(id);
    G.log('Achievement: “' + a.name + '” — ' + a.desc, 'good');
    G.emit('achievement', a);
  };
  A.has = function (id) { return G.state.achievements && G.state.achievements.indexOf(id) >= 0; };
})();
