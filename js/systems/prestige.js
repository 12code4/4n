/* v4.0 — Charter Renewal (prestige): retire → Legacy Marks → permanent perks. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var P = (G.Prestige = {});

  P.legacy = function () {
    return G.state && G.state.legacy ? G.state.legacy : { marks: 0, perks: [] };
  };
  P.hasPerk = function (id) { return P.legacy().perks.indexOf(id) >= 0; };
  P.fx = function (key) {
    var out = null;
    P.legacy().perks.forEach(function (id) {
      var p = G.DATA.legacyPerkById(id);
      if (p && p.fx[key] !== undefined) {
        var v = p.fx[key];
        if (typeof v === 'boolean') out = out || v;
        else if (Array.isArray(v)) out = (out || []).concat(v);
        else out = (out || 0) + v;
      }
    });
    return out;
  };

  /* how many Legacy Marks retiring the current charter would yield */
  P.retireValue = function () { return G.DATA.legacyValue(G.state); };

  /* the between-charter store carried across new games. We stash legacy in
   * localStorage under a separate key so a fresh charter can read it. */
  P.LEGACY_KEY = 'gilded_maw_legacy';
  P.loadLegacy = function () {
    try {
      if (typeof localStorage === 'undefined') return { marks: 0, perks: [] };
      var s = localStorage.getItem(P.LEGACY_KEY);
      return s ? JSON.parse(s) : { marks: 0, perks: [] };
    } catch (e) { return { marks: 0, perks: [] }; }
  };
  P.saveLegacy = function (leg) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(P.LEGACY_KEY, JSON.stringify(leg)); } catch (e) {}
  };

  /* Retire: bank Legacy Marks, wipe the charter, start a fresh one that inherits
   * the legacy store (marks + already-bought perks). */
  P.retire = function () {
    var earned = P.retireValue();
    var leg = G.state.legacy || { marks: 0, perks: [] };
    leg.marks = (leg.marks || 0) + earned;
    leg.charters = (leg.charters || 0) + 1;
    P.saveLegacy(leg);
    G.wipeSave();
    G.newGame(); // reads legacy back in (see state.js applyLegacy)
    G.save();
    G.log('The charter is retired. ' + earned + ' Legacy Marks banked. A new deed, a new Maw — and the old colours still fly.', 'story');
    G.emit('prestige');
    return earned;
  };

  P.buyPerk = function (id) {
    var st = G.state;
    var p = G.DATA.legacyPerkById(id);
    if (!p) return { ok: false, msg: 'No such perk.' };
    if (P.hasPerk(id)) return { ok: false, msg: 'Already earned.' };
    if (st.legacy.marks < p.cost) return { ok: false, msg: 'Not enough Legacy Marks.' };
    st.legacy.marks -= p.cost;
    st.legacy.perks.push(id);
    P.saveLegacy(st.legacy); // persist immediately
    G.log('Legacy perk earned: ' + p.name + '. ' + p.desc, 'good');
    G.emit('prestige');
    return { ok: true };
  };
})();
