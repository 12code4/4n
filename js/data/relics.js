/* v3.0 — Company relics: powerful passives with a real cost. Slotted at the
 * Charter Hall (1–2 slots by level). Awarded by guardian first-kills and rare finds. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  /*
   * relic: { id, name, desc, from, fx:{...} }
   * fx keys read by systems:
   *   gritStart: +grit at fight start
   *   enemySpd:  enemies get +this speed (drawback)
   *   sellMult:  ×sell prices
   *   hireMult:  ×hire cost (drawback if >1)
   *   fleeAlways: bool — flee always succeeds
   *   fleeLoot:  override loot loss fraction on flee
   *   lootMult:  ×run loot value
   *   torchDrain: +extra torch per node (drawback)
   *   xpMult:    ×xp
   *   startInjuryImmune: bool
   */
  D.relics = {
    wardens_bell: {
      id: 'wardens_bell', name: 'The Warden’s Bell', from: 'first_warden',
      desc: 'Start every fight with +1 Grit. But it tolls — enemies are +1 Speed.',
      fx: { gritStart: 1, enemySpd: 1 }
    },
    crown_cooling: {
      id: 'crown_cooling', name: 'A Crown, Cooling', from: 'smelted_king',
      desc: '+12% on all sales — the colours carry weight. But the best delvers charge for it: hires cost +25%.',
      fx: { sellMult: 1.12, hireMult: 1.25 }
    },
    first_rope: {
      id: 'first_rope', name: 'The First Rope', from: 'event',
      desc: 'Flight never fails — the old rope always holds. But you drop half the haul scrambling for it.',
      fx: { fleeAlways: true, fleeLoot: 0.5 }
    },
    blank_card: {
      id: 'blank_card', name: 'The Blank Card', from: 'the_librarian',
      desc: 'The Archive files your finds generously: +25% run loot value. But it reads your torches too — one extra burns per passage.',
      fx: { lootMult: 1.25, torchDrain: 1 }
    },
    veterans_ledger: {
      id: 'veterans_ledger', name: 'The Veteran’s Ledger', from: 'event',
      desc: 'Lessons compound: +30% experience. The margins are grim reading — no starting Grit bonus ever helps morale (purely a boon).',
      fx: { xpMult: 1.3 }
    },
    salt_charm: {
      id: 'salt_charm', name: 'The Salt Charm', from: 'event',
      desc: 'Wards the crew against wounds: survivors never carry injuries home. But salt is heavy — enemies act first more often (+1 Speed).',
      fx: { startInjuryImmune: true, enemySpd: 1 }
    }
  };
  D.relicList = function () { var o = []; for (var k in D.relics) o.push(D.relics[k]); return o; };
})();
