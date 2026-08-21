/* v3.0 — Renown tiers and their perks; the Charter Hall building. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* Renown ranks, cumulative thresholds. Each grants a passive perk. */
  D.renownTiers = [
    { id: 'provisional', name: 'Provisional Charter', at: 0, perk: null,
      blurb: 'A signed deed and a leaky roof. Everyone starts here.' },
    { id: 'chartered', name: 'Chartered', at: 30, perk: 'hire10',
      blurb: 'The valley knows your name. Hires cost 10% less.' },
    { id: 'established', name: 'Established', at: 90, perk: 'sell5',
      blurb: 'Buyers trust your assay. +5% on every sale.' },
    { id: 'honored', name: 'Honored', at: 200, perk: 'peddler',
      blurb: 'Even deep peddlers respect the colours. Their goods cost 25% less.' },
    { id: 'gilded', name: 'The Gilded Charter', at: 400, perk: 'contract1',
      blurb: 'The capital sends its best. +1 contract slot, and veterans seek you out.' }
  ];

  /* Renown awards. */
  D.renownAward = {
    guardian: 40,     // first kill of a biome guardian
    contract: 4,
    depthRecord: 8,   // each new deepest depth
    honor: 6,         // honoring a fallen delver
    rivalWin: 10
  };

  D.buildings.charterhall = {
    id: 'charterhall', name: 'Charter Hall', icon: 'banner', v: 3,
    desc: 'A hall for the company’s colours, the standings board, and the rivals’ intel.',
    costs: [120, 300, 600],
    levels: [
      'L1 — Standings & renown perks; relic slots.',
      'L2 — Rival intel: see their depth & renown; mood forecast.',
      'L3 — A second relic slot; the capital’s ear.'
    ],
    relicSlots: [1, 1, 2]
  };
})();
