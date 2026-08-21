/* v6.0 — Ascension: an escalating New-Charter+ difficulty ladder. Each tier adds
 * a modifier on top of all lower tiers; clearing a tier (reaching any ending at
 * it) unlocks the next, banks bonus Legacy Marks, and can award an Ascension relic. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* Each tier's `add` is the NEW modifier it introduces. Effects are cumulative:
   * being at tier N means every mod from 1..N is active. `relic` awards that
   * Ascension relic the first time the tier is cleared. */
  D.ascension = [
    { t: 1, name: 'The Lean Charter', add: 'Wages cost +25%.', fx: { wage: 1.25 } },
    { t: 2, name: 'The Dear Roster', add: 'Hires cost +25%.', fx: { hire: 1.25 } },
    { t: 3, name: 'The Meaner Deep', add: 'Enemies have +10% HP.', fx: { enemyHp: 1.10 }, relic: 'asc_first_seal' },
    { t: 4, name: 'The Hungry Maw', add: 'Every enemy hits for +1.', fx: { enemyDmg: 1 } },
    { t: 5, name: 'The Guttering Dark', add: 'The dark burns +1 torch per passage.', fx: { torch: 1 } },
    { t: 6, name: 'The Standing Guard', add: 'Guardians have +15% HP.', fx: { guardianHp: 1.15 }, relic: 'asc_ledger' },
    { t: 7, name: 'The Dear Market', add: 'Supplies cost +30%.', fx: { supply: 1.30 } },
    { t: 8, name: 'The Deep Wounds', add: 'Survivors are injured more often, and heal slower.', fx: { injury: 0.15, injuryDays: 2 } },
    { t: 9, name: 'The Keen Rivals', add: 'Rival charters push and snipe far more aggressively.', fx: { rival: 1.6 }, relic: 'asc_crown' },
    { t: 10, name: 'The Collapsing Charter', add: 'A total wipe collapses one building by a level.', fx: { wipeBuilding: true } }
  ];
  D.ascTier = function (t) { return D.ascension[t - 1] || null; };

  /* Ascension relics — powerful, no drawback (the drawback is the difficulty). */
  D.relics.asc_first_seal = {
    id: 'asc_first_seal', name: 'The First Seal', from: 'ascension',
    desc: 'Ascension III mastered. The company starts each fight with +1 Grit.',
    fx: { gritStart: 1 }
  };
  D.relics.asc_ledger = {
    id: 'asc_ledger', name: 'The Standing Ledger', from: 'ascension',
    desc: 'Ascension VI mastered. +15% on every sale.',
    fx: { sellMult: 1.15 }
  };
  D.relics.asc_crown = {
    id: 'asc_crown', name: 'The Ascendant Crown', from: 'ascension',
    desc: 'Ascension IX mastered. +25% run loot value.',
    fx: { lootMult: 1.25 }
  };
})();
