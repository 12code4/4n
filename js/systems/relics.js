/* v3.0 — Company relics: acquiring, slotting, and reading their combined fx. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var Rel = (G.Relics = {});

  Rel.slots = function () { return G.bldFx('charterhall', 'relicSlots', 0); };
  Rel.owned = function () { return (G.state.relics && G.state.relics.owned) || []; };
  Rel.slotted = function () { return (G.state.relics && G.state.relics.slotted) || []; };

  Rel.award = function (id) {
    var st = G.state;
    if (!st.relics) st.relics = { owned: [], slotted: [] };
    if (!G.DATA.relics[id]) return;
    if (st.relics.owned.indexOf(id) >= 0) return;
    st.relics.owned.push(id);
    if (G.Codex) G.Codex.discover('relic', id);
    var r = G.DATA.relics[id];
    G.log('The company gains a relic: ' + r.name + '. ' + r.desc, 'story');
    G.emit('relic', r);
    G.Achieve.check();
  };

  Rel.slot = function (id) {
    var st = G.state;
    if (st.relics.owned.indexOf(id) < 0) return { ok: false, msg: 'You don’t hold that relic.' };
    if (st.relics.slotted.indexOf(id) >= 0) return { ok: false, msg: 'Already slotted.' };
    if (st.relics.slotted.length >= Rel.slots()) return { ok: false, msg: 'No free relic slot. (Upgrade the Charter Hall.)' };
    st.relics.slotted.push(id);
    G.emit('relic');
    G.Achieve.check();
    return { ok: true };
  };
  Rel.unslot = function (id) {
    var st = G.state;
    st.relics.slotted = st.relics.slotted.filter(function (x) { return x !== id; });
    G.emit('relic');
  };

  /* Combined fx across all slotted relics. */
  Rel.fx = function (key, base) {
    var v = base;
    Rel.slotted().forEach(function (id) {
      var r = G.DATA.relics[id];
      if (r && r.fx && r.fx[key] !== undefined) {
        // multipliers multiply; additive/flags add/or
        if (key.indexOf('Mult') >= 0) v = (v === undefined ? 1 : v) * r.fx[key];
        else if (typeof r.fx[key] === 'boolean') v = v || r.fx[key];
        else v = (v || 0) + r.fx[key];
      }
    });
    return v;
  };
  Rel.flag = function (key) { return Rel.fx(key, false); };
  Rel.mult = function (key) { return Rel.fx(key, 1); };
  Rel.add = function (key) { return Rel.fx(key, 0); };
})();
