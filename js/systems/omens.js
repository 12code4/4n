/* v4.0 — Omens: per-run mutators chosen at outfitting. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var O = (G.Omens = {});

  /* Offer a fresh pair (or three when Dreaming) of omens to choose among. */
  O.offer = function () {
    var st = G.state;
    var n = (st.mood && st.mood.id === 'dreaming') ? 3 : 2;
    var pool = G.rshuffle(G.DATA.omens.slice());
    st.omenOffer = pool.slice(0, n).map(function (o) { return o.id; });
    st.omenChosen = st.omenChosen || [];
    return st.omenOffer;
  };
  O.reset = function () { G.state.omenOffer = null; G.state.omenChosen = []; };

  O.toggle = function (id) {
    var st = G.state;
    st.omenChosen = st.omenChosen || [];
    var i = st.omenChosen.indexOf(id);
    if (i >= 0) st.omenChosen.splice(i, 1);
    else if (st.omenChosen.length < 2) st.omenChosen.push(id);
    G.emit('omens');
  };

  /* active omens are those chosen and locked onto the running expedition */
  O.active = function () {
    var ex = G.state.expedition;
    return (ex && ex.omens) || [];
  };
  O.has = function (id) { return O.active().indexOf(id) >= 0; };
  O.fx = function (key, base) {
    var v = base;
    O.active().forEach(function (id) {
      var o = G.DATA.omenById(id);
      if (o && o.fx[key] !== undefined) {
        if (typeof o.fx[key] === 'boolean') v = v || o.fx[key];
        else if (key.indexOf('Mult') >= 0 || key === 'loot' || key === 'enemyHp' || key === 'healBonus') v = (v === undefined ? 1 : v) * o.fx[key];
        else v = (v || 0) + o.fx[key];
      }
    });
    return v;
  };
  O.mult = function (k) { return O.fx(k, 1); };
  O.add = function (k) { return O.fx(k, 0); };
  O.flag = function (k) { return O.fx(k, false); };
})();
