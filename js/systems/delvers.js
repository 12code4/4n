/* Delver generation, hiring, growth, healing, death. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = (G.Delvers = {});

  D.generate = function (quality) {
    var st = G.state;
    var cls = G.rpick(G.DATA.classList());
    var trait = G.rpick(G.DATA.traits);
    var fear = G.rpick(G.DATA.fears);
    var stats = {};
    for (var k in cls.base) {
      stats[k] = cls.base[k] + G.rint(-2, 2);
    }
    // quality points from tavern level etc.
    var pts = (quality || 0);
    var keys = ['vig', 'might', 'wits', 'luck'];
    while (pts-- > 0) stats[G.rpick(keys)] += 1;
    if (trait.mod) for (var m in trait.mod) stats[m] = Math.max(1, stats[m] + trait.mod[m]);
    var name = G.rpick(G.DATA.names.first) + ' ' + G.rpick(G.DATA.names.last);
    return {
      id: 'dl' + (st.nextDelverN++),
      name: name, cls: cls.id, lvl: 1, xp: 0,
      stats: stats,
      hp: stats.vig, // maxhp == stats.vig
      trait: trait.id, fear: fear.id,
      alive: true, hiredDay: st.day,
      kills: 0, delves: 0,
      freeDays: 0 // wage-free days (rescue recruits)
    };
  };

  D.trait = function (d) { return G.U.byId(G.DATA.traits, d.trait) || {}; };
  D.fear = function (d) { return G.U.byId(G.DATA.fears, d.fear) || {}; };
  D.cls = function (d) { return G.DATA.classes[d.cls]; };
  D.maxHp = function (d) { return d.stats.vig; };
  D.wage = function (d) {
    if (d.freeDays > 0) return 0;
    var w = G.BAL.wageBase + (d.lvl - 1) + (D.trait(d).wageMod || 0);
    return Math.max(1, w);
  };
  D.xpNeed = function (d) { return G.BAL.xpLevel(d.lvl); };

  D.addToRoster = function (d) { G.state.delvers.push(d); return d; };
  D.roster = function () {
    return G.state.delvers.filter(function (d) { return d.alive; });
  };
  D.atHome = function () {
    var ex = G.state.expedition;
    return D.roster().filter(function (d) { return !ex || ex.team.indexOf(d.id) < 0; });
  };
  D.get = function (id) { return G.U.byId(G.state.delvers, id); };

  D.hireCost = function (d) { return G.BAL.hireBase + (d.lvl - 1) * 8 + Math.max(0, G.U.sum(['might', 'wits', 'luck'], function (k) { return d.stats[k]; }) - 16); };

  D.refreshPool = function (force) {
    var st = G.state;
    var lvl = G.bld('tavern');
    var size = G.bldFx('tavern', 'pool', 1);
    var quality = G.bldFx('tavern', 'quality', 0);
    if (!force && st.poolDay === st.day) return;
    st.poolDay = st.day;
    // rotate: drop one, add until full
    if (st.tavernPool.length && G.rchance(0.6)) st.tavernPool.shift();
    while (st.tavernPool.length < size) {
      st.tavernPool.push(D.generate(quality + (G.rchance(0.25) ? 2 : 0)));
    }
    while (st.tavernPool.length > size) st.tavernPool.pop();
  };

  D.hire = function (poolIdx) {
    var st = G.state;
    var d = st.tavernPool[poolIdx];
    if (!d) return { ok: false, msg: 'No such hireling.' };
    var cost = D.hireCost(d);
    if (st.marks < cost) return { ok: false, msg: 'Not enough marks.' };
    st.marks -= cost; st.stats.spent += cost;
    st.tavernPool.splice(poolIdx, 1);
    d.hiredDay = st.day;
    D.addToRoster(d);
    G.log(d.name + ' signs on. (' + G.DATA.classes[d.cls].name + ', ' + cost + 'ᵯ)', 'good');
    G.emit('roster');
    return { ok: true };
  };

  D.dismiss = function (id) {
    var st = G.state;
    var d = D.get(id);
    if (!d || !d.alive) return;
    var ex = st.expedition;
    if (ex && ex.team.indexOf(id) >= 0) return; // not while below
    st.delvers = st.delvers.filter(function (x) { return x.id !== id; });
    delete st.unpaid[id];
    G.log(d.name + ' is let go. Dov pours one at cost.', 'info');
    G.emit('roster');
  };

  D.gainXp = function (d, amount) {
    var t = D.trait(d);
    amount = Math.round(amount * (t.xpMult || 1));
    d.xp += amount;
    var ups = 0;
    while (d.xp >= D.xpNeed(d)) {
      d.xp -= D.xpNeed(d);
      d.lvl++;
      ups++;
      var g = D.cls(d).growth;
      for (var k in g) {
        var whole = Math.floor(g[k]);
        d.stats[k] += whole + (G.rchance(g[k] - whole) ? 1 : 0);
      }
      d.stats.vig += G.BAL.levelHp;
      d.hp = Math.min(D.maxHp(d), d.hp + Math.round(D.maxHp(d) * 0.3));
    }
    if (ups) G.log(d.name + ' reaches level ' + d.lvl + '.', 'good');
    return ups;
  };

  D.kill = function (d, cause) {
    var st = G.state;
    d.alive = false;
    d.hp = 0;
    st.stats.deaths++;
    st.graveyard.push({
      name: d.name, cls: d.cls, lvl: d.lvl, day: st.day,
      cause: cause || 'the Maw',
      epitaph: G.rpick(G.DATA.names.epitaphs)
    });
    G.log(d.name + ' is dead. ' + (cause ? '(' + cause + ')' : ''), 'bad');
    G.emit('death', d);
  };

  /* daily heal for those at home */
  D.dailyHeal = function () {
    var heal = G.bldFx('infirmary', 'heal', 2); // 2/day with no infirmary (bedrolls)
    D.atHome().forEach(function (d) {
      d.hp = Math.min(D.maxHp(d), d.hp + heal);
    });
  };
})();
