/* Surface buildings: costs and per-level effects. Systems read effects via G.bld(). */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  G.DATA.buildings = {
    storehouse: {
      id: 'storehouse', name: 'Storehouse', icon: 'crates',
      desc: 'Walls between your goods and the weather. Bigger walls, bigger ledger.',
      costs: [0, 60, 180],           // cost to reach L1 (start), L2, L3
      levels: [
        'L1 — Shop sells 2 goods/day.',
        'L2 — Shop sells 4 goods/day; +5% sale prices.',
        'L3 — Shop sells 6 goods/day; +10% sale prices.'
      ],
      shopSales: [2, 4, 6], priceBonus: [0, 0.05, 0.10]
    },
    tavern: {
      id: 'tavern', name: 'The Lamplit Cellar', icon: 'mug',
      desc: 'Dov’s place. Where delvers are found, funded, and mourned.',
      costs: [30, 90, 220],
      levels: [
        'L1 — 2 hireables; common stock.',
        'L2 — 3 hireables; better stock, occasional veterans.',
        'L3 — 4 hireables; the valley’s best come looking for YOU.'
      ],
      pool: [2, 3, 4], quality: [0, 2, 4]
    },
    assay: {
      id: 'assay', name: 'Assay Office', icon: 'scale',
      desc: 'Petra grades what you drag up. Graded goods sell honest — which is to say, higher.',
      costs: [40, 120, 260],
      levels: [
        'L1 — Sell at market +8%.',
        'L2 — Sell at market +16%.',
        'L3 — Sell at market +25%; Petra flags the best day to sell.'
      ],
      sellBonus: [0.08, 0.16, 0.25]
    },
    forge: {
      id: 'forge', name: 'The Forge', icon: 'anvil', v: 2,
      desc: 'An anvil, a quench trough, and a furnace fed on Maw-heat. Turn loot into arms.',
      costs: [80, 200, 420],
      levels: [
        'L1 — Craft tier I gear.',
        'L2 — Craft tier II gear.',
        'L3 — Craft tier III gear.'
      ],
      tier: [1, 2, 3]
    },
    contracts: {
      id: 'contracts', name: 'Contracts Board', icon: 'board', v: 2,
      desc: 'A notice board and a clerk’s stool. The valley’s buyers post wants; you post prices.',
      costs: [60, 150, 320],
      levels: [
        'L1 — 1 active contract; local clients.',
        'L2 — 2 active contracts; better clients.',
        'L3 — 3 active contracts; the capital calls.'
      ],
      slots: [1, 2, 3], clientBonus: [0, 0.1, 0.25]
    },
    infirmary: {
      id: 'infirmary', name: 'Infirmary', icon: 'cross',
      desc: 'Cots, splints, and a stubborn refusal to let the Maw finish the job.',
      costs: [50, 140, 300],
      levels: [
        'L1 — Resting delvers heal 6/day.',
        'L2 — Heal 10/day.',
        'L3 — Heal 15/day; brink ward: the first death-blow each expedition leaves 1 HP instead.'
      ],
      heal: [6, 10, 15], brinkWard: [false, false, true]
    }
  };
  G.DATA.buildingList = function () {
    var out = [];
    for (var k in G.DATA.buildings) out.push(G.DATA.buildings[k]);
    return out;
  };
  /* Level accessor: 0 = not built. Effect arrays are indexed [lvl-1]. */
  G.bld = function (id) { return (G.state && G.state.buildings[id]) || 0; };
  G.bldFx = function (id, key, fallback) {
    var lvl = G.bld(id);
    if (!lvl) return fallback;
    var def = G.DATA.buildings[id];
    var arr = def[key];
    return arr ? arr[lvl - 1] : fallback;
  };
})();
