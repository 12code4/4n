/* Surface economy: the day tick, market, selling, supplies, construction. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var E = (G.Economy = {});

  E.sellPrice = function (matId) {
    var p = G.state.market[matId] || 1;
    var bonus = G.bldFx('assay', 'sellBonus', 0) + G.bldFx('storehouse', 'priceBonus', 0);
    return Math.max(1, Math.round(p * (1 + bonus)));
  };

  E.sell = function (matId, qty) {
    var st = G.state;
    qty = Math.min(qty, st.inventory[matId] || 0);
    if (qty <= 0) return { ok: false, msg: 'Nothing to sell.' };
    var price = E.sellPrice(matId);
    var earned = price * qty;
    // price impact: each unit sold nudges market down a touch
    var mat = G.DATA.materials[matId];
    st.market[matId] = Math.max(Math.round(mat.base * G.BAL.marketMin),
      Math.round((st.market[matId]) * (1 - G.BAL.sellImpact * qty)));
    st.inventory[matId] -= qty;
    if (st.inventory[matId] <= 0) delete st.inventory[matId];
    st.marks += earned;
    st.stats.earned += earned;
    st.stats.sold += qty;
    G.log('Sold ' + qty + '× ' + mat.name + ' for ' + earned + 'ᵯ.', 'good');
    G.emit('market');
    return { ok: true, earned: earned };
  };

  E.buySupply = function (kind, qty) {
    var st = G.state;
    var cost = (G.BAL.supplyCost[kind] || 1) * qty;
    if (st.marks < cost) return { ok: false, msg: 'Not enough marks.' };
    st.marks -= cost; st.stats.spent += cost;
    st.supplies[kind] = (st.supplies[kind] || 0) + qty;
    G.emit('supplies');
    return { ok: true };
  };

  E.build = function (id) {
    var st = G.state;
    var def = G.DATA.buildings[id];
    var lvl = st.buildings[id] || 0;
    if (lvl >= def.costs.length) return { ok: false, msg: 'Fully built.' };
    var cost = def.costs[lvl];
    if (st.marks < cost) return { ok: false, msg: 'Not enough marks.' };
    st.marks -= cost; st.stats.spent += cost;
    st.buildings[id] = lvl + 1;
    G.log(def.name + (lvl === 0 ? ' built.' : ' improved to L' + (lvl + 1) + '.'), 'good');
    G.emit('buildings');
    return { ok: true };
  };

  E.marketDrift = function () {
    var st = G.state;
    var mats = G.DATA.materialList();
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      var p = st.market[m.id];
      var drift = 1 + (G.rng() * 2 - 1) * G.BAL.marketDrift;
      // gentle pull back toward base so prices don't wander off forever
      var pull = 1 + (m.base - p) / m.base * 0.03;
      p = p * drift * pull;
      p = G.U.clamp(p, m.base * G.BAL.marketMin, m.base * G.BAL.marketMax);
      st.market[m.id] = Math.max(1, Math.round(p));
    }
  };

  /* Walk-in shop: sells a few units of your stock at a premium automatically.
   * Even with bare shelves the shopfront moves sundries — rope-wax, lamp oil,
   * gossip — for a trickle of marks. The Maw always pays something. */
  E.shopSales = function () {
    var st = G.state;
    var n = G.bldFx('storehouse', 'shopSales', 1);
    var sundries = 2 + G.bld('storehouse');
    st.marks += sundries; st.stats.earned += sundries;
    var earned = 0, soldAny = [];
    for (var i = 0; i < n; i++) {
      var ids = Object.keys(st.inventory);
      if (!ids.length) break;
      var id = G.rpick(ids);
      var price = Math.round(E.sellPrice(id) * G.BAL.shopSellMult);
      st.inventory[id]--;
      if (st.inventory[id] <= 0) delete st.inventory[id];
      earned += price;
      soldAny.push(G.DATA.materials[id].name);
    }
    if (earned > 0) {
      st.marks += earned; st.stats.earned += earned; st.stats.sold += soldAny.length;
      G.log('Shopfront: townsfolk bought ' + soldAny.length + ' goods for ' + earned + 'ᵯ.', 'good');
    }
    return earned;
  };

  E.payWages = function () {
    var st = G.state;
    var due = 0, strikers = [];
    G.Delvers.roster().forEach(function (d) {
      if (d.freeDays > 0) { d.freeDays--; return; }
      var w = G.Delvers.wage(d);
      if (st.marks >= w) {
        st.marks -= w; st.stats.spent += w; due += w;
        st.unpaid[d.id] = 0;
      } else {
        st.unpaid[d.id] = (st.unpaid[d.id] || 0) + 1;
        strikers.push(d);
      }
    });
    if (due > 0) G.log('Wages paid: ' + due + 'ᵯ.', 'info');
    var below = st.expedition ? st.expedition.team : [];
    var walked = [];
    strikers.forEach(function (d) {
      if (below.indexOf(d.id) >= 0) return; // nobody quits mid-rope
      if ((st.unpaid[d.id] || 0) >= G.BAL.unpaidStrikes) {
        walked.push(d.name);
        st.delvers = st.delvers.filter(function (x) { return x.id !== d.id; });
        delete st.unpaid[d.id];
      } else {
        G.log(d.name + ' goes unpaid and mutters about it.', 'bad');
      }
    });
    if (walked.length) G.log(walked.join(', ') + ' walked off the payroll. Dov shakes his head.', 'bad');
  };

  /* End the day: the core surface tick. Blocked while an expedition is below. */
  E.endDay = function () {
    var st = G.state;
    if (st.expedition) return { ok: false, msg: 'The team is still below.' };
    st.day++;
    st.stats.daysRun++;
    E.shopSales();
    E.payWages();
    E.marketDrift();
    G.Delvers.dailyHeal();
    G.Delvers.refreshPool();
    st.ui.bark = (st.ui.bark + 1) % G.DATA.barks.length;
    G.emit('day');
    G.save();
    return { ok: true };
  };

  /* advance several days at once while an expedition is out */
  E.expeditionDays = function (n) {
    var st = G.state;
    for (var i = 0; i < n; i++) {
      st.day++;
      st.stats.daysRun++;
      E.shopSales();
      E.payWages();
      E.marketDrift();
      G.Delvers.dailyHeal();
      G.Delvers.refreshPool();
    }
    G.emit('day');
  };
})();
