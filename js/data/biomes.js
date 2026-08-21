/* Biomes: depth bands of the Maw. Node weights drive mapgen; palette drives gfx. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  G.DATA.biomes = [
    {
      id: 'gullet', name: 'The Gullet', depths: [1, 3],
      tagline: 'Ember-glass galleries and grave soil. The Maw’s first manners.',
      guardian: 'first_warden',
      // palette: bg gradient stops, node ink, accent glow
      pal: { bg0: '#120d0a', bg1: '#241610', ink: '#d8b17a', glow: '#ff9a3d', rock: '#3a2418', deep: '#0b0705' },
      nodeW: { fight: 34, event: 22, cache: 14, hazard: 10, rest: 9, peddler: 6 },
      mats: ['ember_glass', 'singing_ore', 'grave_iron', 'wisp_resin', 'root_amber', 'pale_coin', 'hollow_pearl', 'vel_shard']
    }
  ];
  G.DATA.biomeForDepth = function (depth) {
    var bs = G.DATA.biomes;
    for (var i = 0; i < bs.length; i++) if (depth >= bs[i].depths[0] && depth <= bs[i].depths[1]) return bs[i];
    return bs[bs.length - 1];
  };
  G.DATA.maxDepth = function () {
    var bs = G.DATA.biomes; return bs[bs.length - 1].depths[1];
  };
})();
