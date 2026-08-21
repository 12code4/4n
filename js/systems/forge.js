/* v2.0 — The Forge: crafting, the company armory, equipping delvers. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var F = (G.Forge = {});

  F.tier = function () { return G.bldFx('forge', 'tier', 0); };

  F.canCraft = function (gearId) {
    var st = G.state;
    var def = G.DATA.gear[gearId];
    if (!def) return 'Unknown pattern.';
    if (def.tier > F.tier()) return 'The forge can’t work tier ' + def.tier + ' yet.';
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
