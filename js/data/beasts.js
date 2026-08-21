/* v4.0 — Companion beasts. Rescued below, kept at the Menagerie, one taken per
 * expedition. Passive is always on; the active ability fires once per fight. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  D.buildings.menagerie = {
    id: 'menagerie', name: 'The Menagerie', icon: 'paw', v: 4,
    desc: 'Pens, perches, and a patient keeper. A home for the things the Maw orphans.',
    costs: [100, 260, 520],
    levels: [
      'L1 — House 2 beasts; take 1 on each expedition.',
      'L2 — House 4 beasts; beast abilities recharge faster.',
      'L3 — House 6 beasts; a rescued beast heals between runs.'
    ],
    capacity: [2, 4, 6]
  };
  /*
   * beast: { id, name, desc, from, passive:{...}, active:{name, desc, kind, power} }
   * passive keys: loot(×run loot), flee(+party flee), dmg(+party strike dmg),
   *   grit(+start grit), scout(reveal — reduces darkness), heal(+in-run heal ×)
   * active kinds (once per fight): 'bite'(damage one), 'fetch'(loot/marks),
   *   'shriek'(chill all enemies), 'mend'(heal team), 'guardbeast'(ward the party)
   */
  D.beasts = {
    pulse_pup: {
      id: 'pulse_pup', name: 'Pulse Pup', from: 'veins',
      desc: 'A warm, many-eyed thing that beats in time with whoever it likes best.',
      passive: { dmg: 1 },
      active: { name: 'Bite', desc: 'Savage one enemy for a heavy bite.', kind: 'bite', power: 12 }
    },
    glass_fledgling: {
      id: 'glass_fledgling', name: 'Glass Fledgling', from: 'gullet',
      desc: 'A glasswing raised by hand instead of hunted. It fetches shiny things.',
      passive: { loot: 1.12 },
      active: { name: 'Fetch', desc: 'The fledgling returns with loose marks and a small find.', kind: 'fetch', power: 10 }
    },
    cinder_whelp: {
      id: 'cinder_whelp', name: 'Cinder Whelp', from: 'emberdeep',
      desc: 'An orphaned cinder hound, loyal past the point of sense.',
      passive: { dmg: 2 },
      active: { name: 'Scorch', desc: 'Breathe cinders — damage every enemy.', kind: 'scorch', power: 6 }
    },
    ink_familiar: {
      id: 'ink_familiar', name: 'Ink Familiar', from: 'archive',
      desc: 'A page-swarm that decided it liked you. Reads the dark ahead.',
      passive: { scout: true, flee: 0.08 },
      active: { name: 'Shriek', desc: 'A paper scream — Chill every enemy.', kind: 'shriek', power: 0 }
    },
    marrow_moth: {
      id: 'marrow_moth', name: 'Marrow Moth', from: 'veins',
      desc: 'A moth grown in a Marrow Knight’s helm. Mends what it lands on.',
      passive: { heal: 1.2 },
      active: { name: 'Mend', desc: 'Dust the team with healing scales.', kind: 'mend', power: 8 }
    },
    salt_hound: {
      id: 'salt_hound', name: 'Salt Hound', from: 'event',
      desc: 'A grey hound that smells omens coming. Steady in a scrap.',
      passive: { grit: 1 },
      active: { name: 'Stand', desc: 'The hound bristles — Ward the whole team.', kind: 'guardbeast', power: 0 }
    }
  };
  D.beastList = function () { var o = []; for (var k in D.beasts) o.push(D.beasts[k]); return o; };
})();
