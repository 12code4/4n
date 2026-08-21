/* v4.0 — Companion beasts: the Menagerie, rescue, and expedition companions.
 * v6.0 — the Warden's bond: multiple beasts per run, recharging abilities. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var B = (G.Beasts = {});

  B.capacity = function () { return G.bldFx('menagerie', 'capacity', 0); };
  B.owned = function () { return (G.state.beasts && G.state.beasts.owned) || []; };
  B.has = function (id) { return B.owned().indexOf(id) >= 0; };
  B.chosen = function () { return (G.state.beasts && G.state.beasts.chosen) || []; };

  B.rescue = function (id) {
    var st = G.state;
    if (!st.beasts) st.beasts = { owned: [], chosen: [] };
    if (!G.DATA.beasts[id]) return false;
    if (B.has(id)) { G.log('The Menagerie already keeps a ' + G.DATA.beasts[id].name + '. This one is set loose.', 'info'); return false; }
    if (!G.bld('menagerie')) { G.log('You’ve nowhere to keep a ' + G.DATA.beasts[id].name + ' — build the Menagerie first. It slips away.', 'bad'); return false; }
    if (B.owned().length >= B.capacity()) { G.log('The Menagerie is full. The ' + G.DATA.beasts[id].name + ' is set loose.', 'bad'); return false; }
    st.beasts.owned.push(id);
    if (G.Codex) G.Codex.discover('beast', id);
    G.log('A ' + G.DATA.beasts[id].name + ' is brought home to the Menagerie.', 'good');
    G.emit('beasts');
    return true;
  };
  B.release = function (id) {
    var st = G.state;
    st.beasts.owned = B.owned().filter(function (x) { return x !== id; });
    st.beasts.chosen = B.chosen().filter(function (x) { return x !== id; });
    G.emit('beasts');
  };

  /* how many beasts may ride, given a team (Warden bond + Alpha talent) */
  B.slots = function (team) {
    team = team || (G.state.expedition ? G.Exp.team() : selectedTeam());
    var n = 1;
    var warden = team.some(function (d) { return G.Delvers.cls(d).passive === 'beastbond'; });
    if (warden) {
      n = 2;
      if (team.some(function (d) { return G.Delvers.hasTalent(d, 'alpha'); })) n = 3;
    }
    return n;
  };
  function selectedTeam() {
    // outfit-time: read UI selection if present
    var ids = (G.UI && G.UI.sel && G.UI.sel.team) || [];
    return ids.map(G.Delvers.get).filter(Boolean);
  }

  /* toggle a beast in/out of the chosen party (respecting slots at outfit) */
  B.toggleChosen = function (id) {
    var st = G.state;
    if (!st.beasts.chosen) st.beasts.chosen = [];
    var i = st.beasts.chosen.indexOf(id);
    if (i >= 0) st.beasts.chosen.splice(i, 1);
    else if (B.has(id)) st.beasts.chosen.push(id);
    G.emit('beasts');
  };
  B.isChosen = function (id) { return B.chosen().indexOf(id) >= 0; };
  B.clearChosen = function () { if (G.state.beasts) G.state.beasts.chosen = []; G.emit('beasts'); };

  /* the beast defs actually on the current run (or the outfit preview) */
  B.runList = function () {
    var ex = G.state.expedition;
    var ids = ex ? (ex.beasts || []) : B.chosen().slice(0, B.slots());
    return ids.map(function (id) { return G.DATA.beasts[id]; }).filter(Boolean);
  };
  B.activeDef = function () { var l = B.runList(); return l[0] || null; };

  /* is a Warden bonding the pack this run? amplifies passives & recharges abilities */
  B.wardenBond = function () {
    var team = G.state.expedition ? G.Exp.team() : selectedTeam();
    return team.some(function (d) { return G.Delvers.cls(d).passive === 'beastbond'; });
  };
  B.kindred = function () {
    var team = G.state.expedition ? G.Exp.team() : selectedTeam();
    return team.some(function (d) { return G.Delvers.hasTalent(d, 'kindred'); });
  };

  /* summed passive across every beast on the run, with Warden amplification */
  B.passive = function (key, base) {
    var list = B.runList();
    if (!list.length) return base;
    var mult = 1 + (B.wardenBond() ? 0.5 : 0) + (B.kindred() ? 1 : 0);
    // multiplicative keys (loot, heal) combine as products; flat keys (dmg, grit, flee) sum
    if (key === 'loot' || key === 'heal') {
      var m = 1, any = false;
      list.forEach(function (b) { if (b.passive && b.passive[key] !== undefined) { any = true; m *= (1 + (b.passive[key] - 1) * mult); } });
      return any ? m : base;
    }
    if (key === 'scout') { return list.some(function (b) { return b.passive && b.passive.scout; }) || base; }
    var sum = 0, found = false;
    list.forEach(function (b) { if (b.passive && b.passive[key] !== undefined) { found = true; sum += b.passive[key]; } });
    return found ? Math.round(sum * mult) : base;
  };

  /* between-run heal (Menagerie L3) */
  B.betweenRuns = function () {
    if (G.bld('menagerie') >= 3 && B.chosen().length) {
      G.Delvers.atHome().forEach(function (d) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + 2); });
    }
  };

  /* lock the run's beast list at launch (called from Exp.launch) */
  B.lockRun = function (team) {
    var slots = B.slots(team);
    return B.chosen().slice(0, slots);
  };
})();
