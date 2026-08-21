/* v2.0 — Contracts: timed delivery deals posted by valley clients. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var C = (G.Contracts = {});

  C.slots = function () { return G.bldFx('contracts', 'slots', 0); };

  /* materials the player can plausibly source: biomes up to the deepest reached/unlocked */
  C.knownMats = function () {
    var st = G.state;
    var maxD = Math.max(st.unlockedStart, st.stats.deepest || 1);
    var out = [];
    G.DATA.biomes.forEach(function (b) {
      if (b.depths[0] <= Math.max(3, maxD)) out = out.concat(b.mats);
    });
    return out;
  };

  C.generateOffer = function () {
    var st = G.state;
    var client = G.rpick(G.DATA.contractClients);
    var known = C.knownMats();
    var likes = client.likes.filter(function (m) { return known.indexOf(m) >= 0; });
    if (!likes.length) return null;
    var matId = G.rpick(likes);
    var mat = G.DATA.materials[matId];
    // target value scales gently with company progress
    var scale = 1 + (st.stats.deepest || 1) * 0.25;
    var targetVal = Math.round((30 + G.rint(0, 40)) * scale);
    var qty = Math.max(2, Math.round(targetVal / mat.base));
    var bonus = G.bldFx('contracts', 'clientBonus', 0);
    var payout = Math.round(qty * mat.base * client.mult * (1 + bonus));
    return {
      id: G.U.uid('ct'),
      client: client.id, clientName: client.name,
      mat: matId, qty: qty, payout: payout,
      offerExpires: st.day + G.rint(2, 4),
      dueDays: G.rint(4, 8)
    };
  };

  C.dailyTick = function () {
    var st = G.state;
    if (!st.contracts) st.contracts = { offers: [], active: [] };
    if (!G.bld('contracts')) return;
    var ct = st.contracts;
    // expire stale offers quietly
    ct.offers = ct.offers.filter(function (o) { return o.offerExpires >= st.day; });
    // overdue active contracts fail loudly
    var failed = [];
    ct.active = ct.active.filter(function (a) {
      if (st.day > a.dueDay) { failed.push(a); return false; }
      return true;
    });
    failed.forEach(function (a) {
      var fee = Math.round(a.payout * 0.15);
      st.marks = Math.max(0, st.marks - fee);
      st.stats.spent += fee;
      G.log('Contract failed: ' + a.clientName + ' wanted ' + a.qty + '× ' + G.DATA.materials[a.mat].name + '. Forfeit fee ' + fee + 'ᵯ.', 'bad');
    });
    // fresh offers drift in
    while (ct.offers.length < 3 && G.rchance(0.55)) {
      var o = C.generateOffer();
      if (!o) break;
      ct.offers.push(o);
      G.log('New posting: ' + o.clientName + ' seeks ' + o.qty + '× ' + G.DATA.materials[o.mat].name + ' — pays ' + o.payout + 'ᵯ.', 'info');
    }
  };

  C.accept = function (offerId) {
    var st = G.state;
    var ct = st.contracts;
    if (ct.active.length >= C.slots()) return { ok: false, msg: 'The board can’t track more contracts. (Upgrade it.)' };
    var idx = -1;
    ct.offers.forEach(function (o, i) { if (o.id === offerId) idx = i; });
    if (idx < 0) return { ok: false, msg: 'That posting is gone.' };
    var o = ct.offers.splice(idx, 1)[0];
    o.dueDay = st.day + o.dueDays;
    ct.active.push(o);
    G.log('Contract signed: ' + o.qty + '× ' + G.DATA.materials[o.mat].name + ' for ' + o.clientName + ' by day ' + o.dueDay + '.', 'good');
    G.emit('contracts');
    return { ok: true };
  };

  C.fulfill = function (activeId) {
    var st = G.state;
    var ct = st.contracts;
    var idx = -1;
    ct.active.forEach(function (a, i) { if (a.id === activeId) idx = i; });
    if (idx < 0) return { ok: false, msg: 'No such contract.' };
    var a = ct.active[idx];
    if ((st.inventory[a.mat] || 0) < a.qty) return { ok: false, msg: 'Not enough ' + G.DATA.materials[a.mat].name + ' in the storehouse.' };
    st.inventory[a.mat] -= a.qty;
    if (st.inventory[a.mat] <= 0) delete st.inventory[a.mat];
    st.marks += a.payout;
    st.stats.earned += a.payout;
    ct.active.splice(idx, 1);
    G.log('Contract delivered: ' + a.clientName + ' pays ' + a.payout + 'ᵯ. Word of the company spreads.', 'good');
    G.emit('contracts');
    return { ok: true };
  };
})();
