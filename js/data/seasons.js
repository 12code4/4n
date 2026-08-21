/* v6.0 — Seasons & festivals: the surface year turns, tilting the market and
 * tinting the town; rare festival days bring special stock and a shift of mood. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  D.SEASON_LEN = 8; // days per season

  /* sky: [dawn, day, dusk] tint hints for the town painter; fx tilt the market. */
  D.seasons = [
    { id: 'thaw', name: 'Thaw', hue: 150,
      blurb: 'The valley softens. Delvers come looking for work; the market steadies.',
      sky: ['#1a2436', '#2a3a4a'], fx: { hireDiscount: 0.1 } },
    { id: 'glare', name: 'Glare', hue: 40,
      blurb: 'High hard light. Glaziers pay top coin for anything that shines.',
      sky: ['#2a2418', '#3a3020'], fx: { sellTag: { fire: 1.12, glass: 1.15 } } },
    { id: 'fall', name: 'Fall', hue: 25,
      blurb: 'Harvest. Rations are cheap and the storehouses are full.',
      sky: ['#2a1c14', '#3a2418'], fx: { supply: { rations: 0.6 } } },
    { id: 'frost', name: 'Frost', hue: 210,
      blurb: 'The long cold. Fuel and food grow dear; the dark comes early.',
      sky: ['#141826', '#20283a'], fx: { supply: { torches: 1.3, rations: 1.2 } } }
  ];

  /* Festivals: rare special days. */
  D.festivals = [
    { id: 'founders', name: 'The Founders’ Fair', mood: 'generous',
      blurb: 'The valley celebrates the charters. Buyers pay dear and the board fills with rich commissions.',
      fx: { sell: 1.25, contracts: 2 } },
    { id: 'belltoll', name: 'The Bell Toll', mood: 'restless',
      blurb: 'The old bells ring for the delved dead. Singing ore and grave-iron fetch a premium.',
      fx: { sellTag: { }, sellMat: { singing_ore: 1.4, grave_iron: 1.3 } } },
    { id: 'lantern', name: 'Lantern Night', mood: 'dreaming',
      blurb: 'Every window bears a lamp. Torches and lamp-oil are cheap; the Maw dreams brighter.',
      fx: { supply: { torches: 0.5 }, sellMat: { wisp_resin: 1.5, ember_glass: 1.3 } } }
  ];
})();
