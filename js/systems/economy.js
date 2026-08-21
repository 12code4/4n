/* Surface economy: the day tick, market, selling, supplies, construction. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var E = (G.Economy = {});

  // E.price() applies market shocks; it's defined below with the market engine.
  E.price = E.price || function (id) { return G.state.market[id] || 1; };
  E.sellPrice = function (matId) {
    var p = E.price(matId);
    var bonus = G.bldFx('assay', 'sellBonus', 0) + G.bldFx('storehouse', 'priceBonus', 0);
    if (G.Renown && G.Renown.hasPerk('sell5')) bonus += 0.05;      // renown tier perk
    if (G.Rivals) bonus += G.Rivals.claimSellBonus(matId);          // player-owned biome claim
    var mult = (1 + bonus) * (G.Relics ? G.Relics.mult('sellMult') : 1); // relic
    return Math.max(1, Math.round(p * mult));
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
    st.marketPrev = {};
    var mats = G.DATA.materialList();
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      st.marketPrev[m.id] = E.price(m.id); // remember effective price for ▲▼ arrows
      var p = st.market[m.id];
      var drift = 1 + (G.rng() * 2 - 1) * G.BAL.marketDrift;
      // gentle pull back toward base so prices don't wander off forever
      var pull = 1 + (m.base - p) / m.base * 0.03;
      p = p * drift * pull;
      p = G.U.clamp(p, m.base * G.BAL.marketMin, m.base * G.BAL.marketMax);
      st.market[m.id] = Math.max(1, Math.round(p));
    }
  };

  /* ---------- market events / news (v2.0) ---------- */
  /* Shocks overlay the drifted price as a transient multiplier; the stored
   * "natural" price keeps drifting underneath so it recovers when they lapse. */
  E.shockMult = function (id) {
    var st = G.state;
    if (!st.marketEvents || !st.marketEvents.length) return 1;
    var m = 1;
    for (var i = 0; i < st.marketEvents.length; i++) {
      if (st.marketEvents[i].mat === id) m *= st.marketEvents[i].mult;
    }
    return m;
  };
  E.price = function (id) {
    var st = G.state;
    return Math.max(1, Math.round((st.market[id] || 1) * E.shockMult(id)));
  };
  E.marketEventsTick = function () {
    var st = G.state;
    if (!st.marketEvents) st.marketEvents = [];
    st.marketEvents = st.marketEvents.filter(function (ev) { return ev.until >= st.day; });
    // a shock every so often, once the company is dealing in more than starter goods
    if (G.rchance(0.22)) {
      var tmpl = G.rpick(G.DATA.marketNews);
      var mat = G.rpick(G.DATA.materialList().filter(function (m) {
        return m.biome === 'gullet' || (G.DATA.biomeForDepth(st.stats.deepest || 1).mats.indexOf(m.id) >= 0) || m.tier <= 2;
      }));
      if (!mat) return;
      var mult = G.U.lerp(tmpl.mult[0], tmpl.mult[1], G.rng());
      var days = G.rint(tmpl.days[0], tmpl.days[1]);
      var client = G.rpick(G.DATA.contractClients).name;
      var head = tmpl.head.replace('{mat}', mat.name).replace('{client}', client);
      st.marketEvents.push({ mat: mat.id, mult: mult, until: st.day + days, head: head });
      st.lastNews = head;
      G.log('News: ' + head, mult >= 1 ? 'good' : 'bad');
      G.emit('news', head);
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

  /* One day passes. Shared by the surface End-Day and by expedition day-burn so
   * the world moves identically whether or not the team is below. */
  E.dayTick = function () {
    var st = G.state;
    st.day++;
    st.stats.daysRun++;
    E.shopSales();
    E.payWages();
    E.marketDrift();
    E.marketEventsTick();
    if (G.Contracts) G.Contracts.dailyTick();
    if (G.Rivals) G.Rivals.dailyTick();
    E.healInjuries();
    G.Delvers.dailyHeal();
    G.Delvers.refreshPool();
    if (G.Achieve) G.Achieve.check();
  };

  /* End the day: the core surface tick. Blocked while an expedition is below. */
  E.endDay = function () {
    var st = G.state;
    if (st.expedition) return { ok: false, msg: 'The team is still below.' };
    E.dayTick();
    st.ui.bark = (st.ui.bark + 1) % G.DATA.barks.length;
    G.emit('day');
    G.save();
    return { ok: true };
  };

  /* advance several days at once while an expedition is out */
  E.expeditionDays = function (n) {
    for (var i = 0; i < n; i++) E.dayTick();
    G.emit('day');
  };

  /* ---------- injuries (v2.0) ---------- */
  E.checkInjuries = function (delvers) {
    var st = G.state;
    if (G.Relics && G.Relics.flag('startInjuryImmune')) return; // salt-charm wards all wounds
    delvers.forEach(function (d) {
      if (!d.alive || d.injury) return;
      if (d.hp / G.Delvers.maxHp(d) > 0.35) return;
      if (!G.rchance(0.5)) return;
      var inj = G.rpick(G.DATA.injuries);
      var days = Math.max(2, inj.days - G.bld('infirmary')); // infirmary shortens
      d.injury = { id: inj.id, healDay: st.day + days };
      for (var k in inj.mod) d.stats[k] = Math.max(1, d.stats[k] + inj.mod[k]);
      d.hp = Math.min(d.hp, G.Delvers.maxHp(d));
      G.log(d.name + ' comes up with ' + inj.name.toLowerCase() + '. ' + inj.desc, 'bad');
    });
  };
  E.healInjuries = function () {
    var st = G.state;
    st.delvers.forEach(function (d) {
      if (!d.injury) return;
      if (st.day < d.injury.healDay) return;
      var inj = G.U.byId(G.DATA.injuries, d.injury.id);
      if (inj) for (var k in inj.mod) d.stats[k] -= inj.mod[k]; // restore
      d.hp = Math.min(d.hp, G.Delvers.maxHp(d));
      d.injury = null;
      G.log(d.name + ' is patched up and back to full strength.', 'good');
    });
  };
})();
