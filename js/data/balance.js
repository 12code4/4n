/* Tuning constants. Systems read from here so patches can rebalance in one place. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.BAL = {
    startMarks: 40,
    startSupplies: { rations: 4, torches: 6, bandages: 2 },

    // surface economy
    wageBase: 2,            // + level
    unpaidStrikes: 2,       // days unpaid before a delver walks
    shopSellMult: 1.12,     // walk-in customers pay over market
    marketDrift: 0.085,     // daily random walk amplitude
    marketMin: 0.45, marketMax: 1.9, // price bounds ×base
    sellImpact: 0.006,      // per-unit price depression when you dump stock
    hireBase: 12,

    // supplies (buy price, per unit)
    supplyCost: { rations: 2, torches: 2, bandages: 4 },
    bandageHeal: [8, 13],
    rationHungerHp: 4,      // hp lost per missing ration on descent
    darknessHp: 2,          // hp lost per node moved with no torch

    // combat
    gritMax: 6,
    gritStart: 1,
    critBase: 0.05, critPerLuck: 0.012, critMult: 1.75,
    guardReduce: 0.5,
    fleeBase: 0.45, fleePerWits: 0.03, fleeLootLoss: 0.35,
    fearStatPenalty: 2,

    // delver growth
    xpLevel: function (lvl) { return 12 * lvl * lvl; }, // total xp to reach lvl+1
    levelHp: 3,
    infirmaryHeal: [3, 6, 10, 15], // hp/day at infirmary level 0..3

    // expedition
    teamMax: 3,
    daysPerDepth: 1,        // days consumed per depth explored
    ranksPerFloor: [4, 5],  // min,max ranks (excluding entrance & exit)
    nodesPerRank: [2, 3],

    // loot & xp scaling
    xpPerEnemy: function (depth, hp) { return Math.round(3 + depth * 2 + hp / 6); },
    guardianXp: 2.0,        // multiplier
  };
})();
