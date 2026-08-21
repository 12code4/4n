/* v4.0 — Omens: pre-run mutators. At outfitting you may accept up to two,
 * trading risk for reward. They last the whole expedition. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  /*
   * omen fx (read in expedition.js / combat.js):
   *   loot:        ×run loot value
   *   enemyDmg:    +flat enemy damage
   *   enemyHp:     ×enemy hp
   *   burnStrike:  party Strikes/Skills apply Burn (bool)
   *   fireEnemies: encounters skew to fire-tagged / fireLoot ×2 (bool)
   *   noGuardian:  no guardian & no guardian rewards this run (bool)
   *   gritStart:   +party start grit
   *   noRest:      no rest nodes (bool)
   *   healBonus:   ×in-run healing
   *   wardStart:   party begins each fight Warded (bool)
   *   marks:       +flat marks found modifier per fight
   */
  D.omens = [
    { id: 'open_hand', name: 'Omen of the Open Hand', kind: 'mixed',
      desc: '+30% loot, but every enemy hits for +1.', fx: { loot: 1.3, enemyDmg: 1 } },
    { id: 'ash', name: 'Omen of Ash', kind: 'mixed',
      desc: 'The deep runs to fire — fire loot doubled, but the flames run hot (+8% enemy HP).',
      fx: { fireEnemies: true, enemyHp: 1.08 } },
    { id: 'quiet_stair', name: 'Omen of the Quiet Stair', kind: 'cursed',
      desc: 'No guardian bars the way this run — but there are no guardian rewards either.',
      fx: { noGuardian: true } },
    { id: 'salt', name: 'Omen of Salt', kind: 'mixed',
      desc: 'No resting hollows — but the team starts every fight with +2 Grit.',
      fx: { noRest: true, gritStart: 2 } },
    { id: 'ember_blessing', name: 'Omen of the Ember', kind: 'blessed',
      desc: 'The team’s weapons take the comet-fire: Strikes and Skills set enemies Burning.',
      fx: { burnStrike: true } },
    { id: 'ward', name: 'Omen of the Ward', kind: 'blessed',
      desc: 'Old wards wake: the team begins each fight Warded against the first blow.',
      fx: { wardStart: true } },
    { id: 'glut', name: 'Omen of the Glut', kind: 'cursed',
      desc: 'The Maw over-pays and over-defends: +45% loot, but enemies have +15% HP.',
      fx: { loot: 1.45, enemyHp: 1.15 } },
    { id: 'mercy', name: 'Omen of Mercy', kind: 'blessed',
      desc: 'A kinder descent: +40% healing from all sources this run.',
      fx: { healBonus: 1.4 } }
  ];
  D.omenById = function (id) { return G.U.byId(D.omens, id); };
})();
