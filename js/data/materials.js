/* Materials: what the Maw bleeds. base = reference price; market drifts around it. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  G.DATA.materials = {
    ember_glass: { id: 'ember_glass', name: 'Ember-Glass', base: 4, tier: 1, biome: 'gullet',
      desc: 'Comet glass that holds yesterday’s light. Glaziers pay for the glow.', hue: 28 },
    singing_ore: { id: 'singing_ore', name: 'Singing Ore', base: 7, tier: 1, biome: 'gullet',
      desc: 'Hums a low sixth when struck. Bellfounders covet it.', hue: 200 },
    grave_iron: { id: 'grave_iron', name: 'Grave-Iron', base: 9, tier: 1, biome: 'gullet',
      desc: 'Iron that remembers being a fence. Cold to the last.', hue: 220 },
    wisp_resin: { id: 'wisp_resin', name: 'Wisp Resin', base: 6, tier: 1, biome: 'gullet',
      desc: 'Sap of burnt air. Lamps made with it never gutter.', hue: 55 },
    root_amber: { id: 'root_amber', name: 'Root Amber', base: 12, tier: 2, biome: 'gullet',
      desc: 'Amber with something still moving in it.', hue: 40 },
    pale_coin: { id: 'pale_coin', name: 'Pale Coin', base: 15, tier: 2, biome: 'gullet',
      desc: 'Coin-shaped stone, faces worn smooth on both sides. Petra swears they are minted.', hue: 0 },
    hollow_pearl: { id: 'hollow_pearl', name: 'Hollow Pearl', base: 20, tier: 3, biome: 'gullet',
      desc: 'A pearl with nothing inside. Lighter than its absence.', hue: 180 },
    vel_shard: { id: 'vel_shard', name: 'Vel-Shard', base: 35, tier: 3, biome: 'gullet',
      desc: 'A sliver of the comet itself. Warm. Facing down.', hue: 285 }
  };
  G.DATA.materialList = function () {
    var out = [];
    for (var k in G.DATA.materials) out.push(G.DATA.materials[k]);
    return out;
  };
})();
