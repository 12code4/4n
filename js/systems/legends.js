/* v8.0 — Legends of the Maw: recruiting the unique heroes, and the Hall of
 * Legends' memory of who served and how they fell (persisted across charters). */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var L = (G.Legends = {});

  L.def = function (id) { return G.DATA.legends[id]; };
  L.list = function () { return G.DATA.legendList(); };

  L.recruited = function (id) { return !!(G.state.legendsRecruited && G.state.legendsRecruited[id]); };
  L.serving = function (id) {
    return G.state.delvers.some(function (d) { return d.legend === id && d.alive; });
  };
  L.fallenThisCharter = function (id) {
    return (G.state.graveyard || []).some(function (g) { return g.legend === id; });
  };
  L.reqMet = function (id) {
    var def = L.def(id); if (!def) return false;
    try { return !!def.req(G.state); } catch (e) { return false; }
  };
  /* status: 'serving' | 'fallen' | 'available' | 'locked' */
  L.status = function (id) {
    if (L.serving(id)) return 'serving';
    if (L.fallenThisCharter(id)) return 'fallen';
    if (!L.recruited(id) && L.reqMet(id)) return 'available';
    return 'locked';
  };

  L.canRecruit = function (id) {
    if (L.status(id) !== 'available') return 'Not available.';
    if (G.state.marks < L.def(id).cost) return 'Not enough marks.';
    return null;
  };

  /* build the legend as a full delver and add them to the roster */
  L.recruit = function (id) {
    var err = L.canRecruit(id);
    if (err) return { ok: false, msg: err };
    var st = G.state, def = L.def(id);
    st.marks -= def.cost; st.stats.spent += def.cost;
    var d = {
      id: 'lg_' + id + '_' + (st.nextDelverN++),
      name: def.name, cls: def.cls, lvl: def.lvl || 6, xp: 0,
      stats: { vig: def.base.vig, might: def.base.might, wits: def.base.wits, luck: def.base.luck },
      hp: def.base.vig,
      trait: 'stalwart', fear: 'none',
      alive: true, hiredDay: st.day, kills: 0, delves: 0, freeDays: 0, injury: null,
      talents: (def.talents || []).slice(), pendingTalents: [],
      face: def.face >>> 0,
      legend: id,            // marks this delver as a legend
      skill: def.skill || null // signature skill (Delvers.skillOf reads it)
    };
    G.Delvers.addToRoster(d);
    st.legendsRecruited = st.legendsRecruited || {};
    st.legendsRecruited[id] = true;
    // remember, across charters, that this legend served your company
    if (G.Prestige) { var leg = G.Prestige.loadLegacy(); leg.legendsServed = leg.legendsServed || {}; leg.legendsServed[id] = (leg.legendsServed[id] || 0) + 1; G.Prestige.saveLegacy(leg); }
    G.log(def.name + ' signs the charter. ' + (def.bark || ''), 'story');
    if (G.Achieve) G.Achieve.check();
    G.emit('roster'); G.emit('legends');
    return { ok: true };
  };

  L.onFall = function (id) {
    if (G.Prestige) { var leg = G.Prestige.loadLegacy(); leg.legendsFallen = leg.legendsFallen || {}; leg.legendsFallen[id] = (leg.legendsFallen[id] || 0) + 1; G.Prestige.saveLegacy(leg); }
    G.emit('legends');
  };

  /* the trait/fear tables don't include 'stalwart'/'none' universally; make them safe */
  L.ensureTraits = function () {
    if (!G.U.byId(G.DATA.traits, 'stalwart')) G.DATA.traits.push({ id: 'stalwart', name: 'Stalwart', mod: {} });
    if (!G.U.byId(G.DATA.fears, 'none')) G.DATA.fears.push({ id: 'none', name: 'Nothing', cond: 'never' });
  };
  L.ensureTraits();
})();
