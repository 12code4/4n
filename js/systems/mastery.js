/* v8.0 — Class mastery: kills by each class accumulate across every charter
 * (via the legacy store) and earn permanent, tiny, class-wide buffs. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var M = (G.Mastery = {});

  /* total kills for a class = prior charters (legacy baseline) + this charter */
  M.total = function (cls) {
    var st = G.state; if (!st) return 0;
    var base = (st._legMastery && st._legMastery[cls]) || 0;
    var now = (st.mastery && st.mastery[cls]) || 0;
    return base + now;
  };
  M.tier = function (cls) {
    var t = 0, tot = M.total(cls);
    (G.DATA.masteryTiers || []).forEach(function (mt) { if (tot >= mt.at) t++; });
    return Math.max(0, t - 1); // tier 0 at the base threshold
  };
  M.maxTier = function () { return (G.DATA.masteryTiers || []).length - 1; };
  M.nextAt = function (cls) {
    var tot = M.total(cls), tiers = G.DATA.masteryTiers || [];
    for (var i = 0; i < tiers.length; i++) if (tiers[i].at > tot) return tiers[i].at;
    return null;
  };
  /* the class-wide buff for a given fx key at the current tier */
  M.fx = function (cls, key) {
    var def = (G.DATA.masteryFx || {})[cls];
    if (!def || def.key !== key) return 0;
    return M.tier(cls) * def.per;
  };
  M.label = function (cls) {
    var def = (G.DATA.masteryFx || {})[cls]; if (!def) return '';
    var amt = M.tier(cls) * def.per;
    if (!amt) return '';
    return '+' + (def.key === 'crit' ? Math.round(amt * 100) + '%' : amt) + ' ' + def.label;
  };

  /* credit a kill to a class (this charter). Folded into the legacy store on retire. */
  M.credit = function (cls) {
    var st = G.state; if (!st) return;
    if (!st.mastery) st.mastery = {};
    st.mastery[cls] = (st.mastery[cls] || 0) + 1;
  };

  /* on Renewal: fold this charter's mastery kills into the persistent store */
  M.bankToLegacy = function () {
    var st = G.state;
    if (!G.Prestige || !st.mastery) return;
    var leg = G.Prestige.loadLegacy();
    leg.mastery = leg.mastery || {};
    for (var cls in st.mastery) leg.mastery[cls] = (leg.mastery[cls] || 0) + st.mastery[cls];
    G.Prestige.saveLegacy(leg);
  };
})();
