/* v3.0 — Rival charters. Two AI companies with their own personalities that
 * race you for depth, snipe contracts, and turn up underground. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* Rival brawl crews — non-lethal combatants (they yield, they don't die). */
  D.enemies.rival_bruiser = {
    id: 'rival_bruiser', name: 'Rival Bruiser', tags: ['rival'], hp: 26, dmg: [5, 8], spd: 5, crit: 0.08,
    loot: [], marks: [3, 8], nonlethal: true,
    look: { form: 'tall', hue: 300, size: 1.05 },
    desc: 'Another company’s muscle. This stair isn’t big enough.'
  };
  D.enemies.rival_scout = {
    id: 'rival_scout', name: 'Rival Scout', tags: ['rival'], hp: 18, dmg: [4, 7], spd: 9, crit: 0.16,
    special: 'lowest', loot: [], marks: [2, 6], nonlethal: true,
    look: { form: 'tall', hue: 175, size: 0.9 },
    desc: 'Quick hands, quicker to pocket what isn’t theirs.'
  };
  D.enemies.rival_mage = {
    id: 'rival_mage', name: 'Rival Adept', tags: ['rival'], hp: 20, dmg: [5, 9], spd: 6, crit: 0.1,
    loot: [], marks: [2, 7], nonlethal: true,
    look: { form: 'orb', hue: 285, size: 0.7 },
    desc: 'Reads the Maw’s grammar for a competing charter. Poorly, in your opinion.'
  };

  D.rivalDefs = [
    {
      id: 'blacklantern', name: 'The Blacklantern Syndicate', hue: 300,
      blurb: 'They delve at night, pay in secrets, and salt the maps behind them.',
      aggression: 0.7,   // likelihood to brawl on encounter / snipe contracts
      pace: 1.15,        // how fast they push depth
      parley: {
        trade: 'A hooded factor offers hard coin for your whole haul, no questions.',
        wager: 'They’ll sell you a map-fragment of this floor — for a price.',
        brawl: 'Steel comes out. The Syndicate doesn’t share stairs.'
      }
    },
    {
      id: 'cartographers', name: 'The Cartographers’ Union', hue: 175,
      blurb: 'Methodical surveyors who claim depth by right of first accurate map.',
      aggression: 0.3,
      pace: 1.0,
      parley: {
        trade: 'A surveyor proposes an even swap: their spare supplies for your surplus loot.',
        wager: 'They wager map intel against marks on a friendly contest of survey.',
        brawl: 'Reluctantly, they defend their claim — this stair is on THEIR chart.'
      }
    }
  ];
})();
