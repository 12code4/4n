/* v4.0 — Charter Renewal (prestige): Legacy Marks and the permanent perk tree.
 * Retiring a charter converts lifetime achievement into Legacy Marks that buy
 * perks which persist into every future charter. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  /*
   * perk: { id, name, desc, cost, fx }
   * fx keys (read at newGame / runtime):
   *   startMarks:+n, startBuild:[ids], foundingQuality:+n, contractSlot:+1,
   *   moodForecast:bool, buildDiscount:0..1, eventLuck:+n, startRenown:+n,
   *   startBeast:id, legacySell:+frac
   */
  D.legacyPerks = [
    { id: 'nest_egg', name: 'Nest Egg', cost: 1, fx: { startMarks: 60 },
      desc: 'Every new charter opens with +60 marks in the strongbox.' },
    { id: 'founding_crew', name: 'Founding Crew', cost: 2, fx: { foundingQuality: 3 },
      desc: 'Your two founding delvers arrive seasoned (+3 stat points each).' },
    { id: 'inherited_walls', name: 'Inherited Walls', cost: 2, fx: { startBuild: ['tavern'] },
      desc: 'The tavern comes already built with each new charter.' },
    { id: 'standing_ledger', name: 'Standing Ledger', cost: 3, fx: { contractSlot: 1, startBuild: ['contracts'] },
      desc: 'Start with a Contracts Board and +1 permanent contract slot.' },
    { id: 'weather_eye', name: 'Weather-Eye', cost: 2, fx: { moodForecast: true },
      desc: 'You can read the Maw’s coming mood from day one, no Charter Hall needed.' },
    { id: 'thrift', name: 'Thrift', cost: 3, fx: { buildDiscount: 0.15 },
      desc: 'All construction costs 15% less, forever.' },
    { id: 'marens_chalk', name: 'Maren’s Chalk', cost: 3, fx: { eventLuck: 2 },
      desc: 'Her marks light the way: +2 to every expedition event stat-check.' },
    { id: 'renowned_name', name: 'A Renowned Name', cost: 2, fx: { startRenown: 60 },
      desc: 'Each new charter is born already Chartered (+60 renown).' },
    { id: 'kept_beast', name: 'A Kept Beast', cost: 4, fx: { startBuild: ['menagerie'], startBeast: 'salt_hound' },
      desc: 'Start with a Menagerie and a loyal Salt Hound already in it.' },
    { id: 'old_colours', name: 'Old Colours', cost: 4, fx: { legacySell: 0.06 },
      desc: 'The company name still carries: +6% on every sale, in every charter.' },
    { id: 'deep_charter', name: 'Deep Charter', cost: 5, fx: { startRenown: 200 },
      desc: 'Begin Established, with the sell bonus already earned (+200 renown).' },
    { id: 'forge_heirloom', name: 'Forge Heirloom', cost: 3, fx: { startBuild: ['forge'] },
      desc: 'The Forge is inherited, already standing, tier I ready.' }
  ];
  D.legacyPerkById = function (id) { return G.U.byId(D.legacyPerks, id); };

  /* Legacy Marks earned by retiring: a function of the charter's lifetime. */
  D.legacyValue = function (st) {
    var lm = 0;
    lm += Math.floor((st.renown || 0) / 80);            // renown → LM
    lm += (st.stats.deepest || 0) >= 3 ? 1 : 0;
    lm += (st.stats.deepest || 0) >= 6 ? 1 : 0;
    lm += (st.stats.deepest || 0) >= 9 ? 2 : 0;
    lm += (st.stats.deepest || 0) >= 12 ? 3 : 0;
    lm += Math.floor((st.stats.earned || 0) / 4000);    // lifetime earnings
    lm += (st.achievements || []).length >= 10 ? 2 : 0;
    Object.keys(st.guardiansSlain || {}).forEach(function () { lm += 1; });
    return Math.max(1, lm);
  };
})();
