/* v7.0 — The Undervault: the endless strata below the Heart. Unlocked by the
 * Trade ending or Ascension III+. Reuses the expedition machinery; this module
 * owns the stratum ladder, per-stratum affixes, the Court-guardian cadence, and
 * the deep-record. Combat/loot read affixes via V.has(). */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var V = (G.Vault = {});

  V.GUARD_EVERY = 4; // a Court guardian bars every 4th stratum

  V.unlocked = function () {
    var st = G.state; if (!st) return false;
    return !!(st.questPerks && st.questPerks.heart_trade) || (st.ascMax || 0) >= 3;
  };
  V.active = function () { var ex = G.state.expedition; return !!(ex && ex.vault); };
  V.stratum = function () { var ex = G.state.expedition; return ex && ex.vault ? (ex.stratum || 1) : 0; };
  V.affixes = function () { var ex = G.state.expedition; return (ex && ex.vault && ex.affixes) || []; };
  V.has = function (id) { return V.active() && V.affixes().indexOf(id) >= 0; };
  V.giltActive = function () { return V.has('gilt'); };

  V.isGuardianStratum = function (s) { return s > 0 && s % V.GUARD_EVERY === 0; };
  V.guardianFor = function (s) {
    var list = G.DATA.undervaultGuardians;
    var idx = Math.floor(s / V.GUARD_EVERY - 1) % list.length;
    return list[(idx + list.length) % list.length];
  };

  /* affix count grows with depth: 1 early, 2 by stratum 4, 3 by stratum 8 */
  function affixCount(s) { return s >= 8 ? 3 : s >= 4 ? 2 : 1; }
  V.rollAffixes = function (stratum) {
    var pool = G.DATA.affixes.map(function (a) { return a.id; });
    var bag = G.rshuffle(pool);
    var n = Math.min(affixCount(stratum), bag.length);
    return bag.slice(0, n);
  };

  V.deepRecord = function () { return (G.state && G.state.deepRecord) || 0; };
  V.bankRecord = function (stratum) {
    var st = G.state;
    if (stratum > (st.deepRecord || 0)) {
      st.deepRecord = stratum;
      st.stats.deepestStratum = Math.max(st.stats.deepestStratum || 0, stratum);
      // persist the deep-record across charters, alongside the legacy store
      if (G.Prestige) { var leg = G.Prestige.loadLegacy(); leg.vaultRecord = Math.max(leg.vaultRecord || 0, stratum); G.Prestige.saveLegacy(leg); }
      return true;
    }
    return false;
  };

  /* launch a Vault run: start at stratum 1 (depth 14) with the vault flag set. */
  V.launch = function (teamIds, rows) {
    if (!V.unlocked()) return { ok: false, msg: 'The Vault stair is not open. Reach the Trade ending, or Ascension III.' };
    return G.Exp.launch(teamIds, 14, { vault: true, rows: rows || null });
  };

  /* descend one stratum deeper: reroll affixes, advance the guardian cadence. */
  V.onDescend = function () {
    var ex = G.state.expedition;
    if (!ex || !ex.vault) return;
    ex.stratum = (ex.stratum || 1) + 1;
    ex.affixes = V.rollAffixes(ex.stratum);
    ex.vaultFights = 0;
    if (V.bankRecord(ex.stratum)) {
      G.Exp.unlockJournal('undervault_deep');
      G.log('A new deep-record: stratum ' + ex.stratum + ' of the Undervault.', 'story');
    }
    V.announce();
  };

  /* set the affixes for the very first stratum (called from Exp.launch on vault runs). */
  V.onLaunch = function () {
    var ex = G.state.expedition;
    if (!ex || !ex.vault) return;
    ex.stratum = 1; ex.affixes = V.rollAffixes(1); ex.ledgerStacks = 0; ex.vaultFights = 0;
    G.Exp.unlockJournal('undervault');
    V.bankRecord(1);
    V.announce();
  };

  V.announce = function () {
    var ex = G.state.expedition;
    var names = V.affixes().map(function (id) { var a = G.DATA.affixDef(id); return a ? a.name : id; });
    var g = V.isGuardianStratum(ex.stratum) ? ' The Court holds this stratum.' : '';
    G.Exp.elog('— Undervault, stratum ' + ex.stratum + ' — ' + (names.length ? '[' + names.join(', ') + ']' : '[no terms]') + g, 'story');
    G.emit('vault', { stratum: ex.stratum, affixes: V.affixes() });
  };

  /* is this the fight where the Audit affix seats a Court noble? (every 3rd) */
  V.auditThisFight = function () {
    var ex = G.state.expedition;
    if (!V.has('audit')) return false;
    ex.vaultFights = (ex.vaultFights || 0) + 1;
    return ex.vaultFights % 3 === 0;
  };
  V.auditNoble = function () {
    var nobles = ['court_auditor', 'court_usurer', 'court_assessor', 'court_chamberlain', 'court_collector', 'court_notary'];
    return G.rpick(nobles);
  };
})();
