/* v2.0 — The Forge: crafting, the company armory, equipping delvers. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var F = (G.Forge = {});

  F.tier = function () { return G.bldFx('forge', 'tier', 0); };
  F.hasDeepForge = function () { return !!(G.state.flags && G.state.flags.deepForge); };
  /* tier IV needs Forge L3 AND the Deep Forge upgrade (bought below the Heart's materials) */
  F.DEEP_COST = { marks: 260, mat: 'gilt_marrow', qty: 2 };
  F.canDeepForge = function () {
    var st = G.state;
    if (F.hasDeepForge()) return 'The Deep Forge already burns.';
    if (F.tier() < 3) return 'The Forge must reach L3 first.';
    if (st.marks < F.DEEP_COST.marks) return 'Not enough marks.';
    if ((st.inventory[F.DEEP_COST.mat] || 0) < F.DEEP_COST.qty) return 'Missing ' + G.DATA.materials[F.DEEP_COST.mat].name + '.';
    return null;
  };
  F.upgradeDeepForge = function () {
    var err = F.canDeepForge();
    if (err) return { ok: false, msg: err };
    var st = G.state;
    st.marks -= F.DEEP_COST.marks; st.stats.spent += F.DEEP_COST.marks;
    st.inventory[F.DEEP_COST.mat] -= F.DEEP_COST.qty;
    if (st.inventory[F.DEEP_COST.mat] <= 0) delete st.inventory[F.DEEP_COST.mat];
    st.flags.deepForge = true;
    G.log('The Deep Forge is stoked on gilt-marrow. Tier IV patterns are yours to work.', 'story');
    G.emit('armory');
    return { ok: true };
  };
  /* the effective craftable tier: 4 once the Deep Forge is lit, else the building tier */
  F.craftTier = function () { return F.hasDeepForge() ? 4 : F.tier(); };

  F.canCraft = function (gearId) {
    var st = G.state;
    var def = G.DATA.gear[gearId];
    if (!def) return 'Unknown pattern.';
    if (def.tier >= 4 && !F.hasDeepForge()) return 'The Deep Forge isn’t lit yet.';
    if (def.tier > F.craftTier()) return 'The forge can’t work tier ' + def.tier + ' yet.';
    if (st.marks < def.cost.marks) return 'Not enough marks.';
    for (var id in (def.cost.mats || {})) {
      if ((st.inventory[id] || 0) < def.cost.mats[id]) return 'Missing ' + G.DATA.materials[id].name + '.';
    }
    return null;
  };

  F.craft = function (gearId) {
    var err = F.canCraft(gearId);
    if (err) return { ok: false, msg: err };
    var st = G.state;
    var def = G.DATA.gear[gearId];
    st.marks -= def.cost.marks;
    st.stats.spent += def.cost.marks;
    for (var id in (def.cost.mats || {})) {
      st.inventory[id] -= def.cost.mats[id];
      if (st.inventory[id] <= 0) delete st.inventory[id];
    }
    st.armory.push({ uid: G.U.uid('gr'), gid: gearId, by: null });
    st.stats.crafted = (st.stats.crafted || 0) + 1;
    if (G.Achieve) G.Achieve.check();
    G.log('The forge rings: ' + def.name + ' is finished.', 'good');
    G.emit('armory');
    return { ok: true };
  };

  F.sell = function (uid) {
    var st = G.state;
    var idx = -1;
    st.armory.forEach(function (it, i) { if (it.uid === uid) idx = i; });
    if (idx < 0) return { ok: false, msg: 'No such piece.' };
    var it = st.armory[idx];
    var def = G.DATA.gear[it.gid];
    var val = G.DATA.gearValue(def);
    st.armory.splice(idx, 1);
    st.marks += val;
    st.stats.earned += val;
    G.log(def.name + ' sold for ' + val + 'ᵯ.', 'good');
    G.emit('armory');
    return { ok: true };
  };

  /* equip a piece to a delver (unequips whatever held the slot) */
  F.equip = function (uid, delverId) {
    var st = G.state;
    var it = null;
    st.armory.forEach(function (x) { if (x.uid === uid) it = x; });
    var d = G.Delvers.get(delverId);
    if (!it || !d || !d.alive) return { ok: false, msg: 'Can’t equip that.' };
    var ex = st.expedition;
    if (ex && ex.team.indexOf(delverId) >= 0) return { ok: false, msg: 'They’re below — gear changes happen at home.' };
    var def = G.DATA.gear[it.gid];
    // clear that slot on the delver
    st.armory.forEach(function (x) {
      if (x.by === delverId && G.DATA.gear[x.gid].slot === def.slot) x.by = null;
    });
    it.by = delverId;
    G.emit('armory');
    return { ok: true };
  };

  F.unequip = function (uid) {
    var st = G.state;
    st.armory.forEach(function (x) { if (x.uid === uid) x.by = null; });
    G.emit('armory');
  };

  F.gearOf = function (d) {
    var st = G.state;
    var out = [];
    if (!st.armory) return out;
    st.armory.forEach(function (x) { if (x.by === d.id) out.push(G.DATA.gear[x.gid]); });
    return out;
  };
  F.atk = function (d) {
    var a = 0;
    F.gearOf(d).forEach(function (g) { a += g.atk || 0; });
    return a;
  };
  F.def = function (d) {
    var v = 0;
    F.gearOf(d).forEach(function (g) { v += g.def || 0; });
    return v;
  };
  F.fx = function (d, key) {
    var v = 0;
    F.gearOf(d).forEach(function (g) { if (g.fx && g.fx[key]) v += g.fx[key]; });
    return v;
  };
})();
