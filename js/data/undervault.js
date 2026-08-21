/* v7.0 — The Undervault (depths 14+): the endless strata below the Heart, where
 * the Maw keeps its true accounts. Appends materials, a biome, the Deep Court,
 * encounters, stratum affixes, tier IV gear, relic sets, journal & barks. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* ---------- materials ---------- */
  D.materials.deep_leaf = { id: 'deep_leaf', name: 'Ledger-Leaf', base: 30, tier: 3, biome: 'undervault',
    desc: 'A page torn from the Maw’s own accounts. The figures rearrange when unwatched.', hue: 150 };
  D.materials.gilt_marrow = { id: 'gilt_marrow', name: 'Gilt Marrow', base: 55, tier: 4, biome: 'undervault',
    desc: 'Bone the deep gilded from the inside out. Heavy as a debt.', hue: 48 };
  D.materials.null_coin = { id: 'null_coin', name: 'Null Coin', base: 46, tier: 4, biome: 'undervault',
    desc: 'A coin that is worth exactly itself and nothing else. Perfectly, uselessly honest.', hue: 260 };
  D.materials.court_signet = { id: 'court_signet', name: 'Court Signet', base: 82, tier: 4, biome: 'undervault',
    desc: 'The seal of a Deep Court office nobody living can name. Doors open. Doors that should not.', hue: 210 };

  /* ---------- the biome (an unbounded band below the Heart) ---------- */
  D.biomes.push({
    id: 'undervault', name: 'The Undervault', depths: [14, 9999],
    tagline: 'Below the Heart, the Maw keeps its true accounts. There is no bottom — only a deeper page.',
    guardian: 'lord_exchequer', // Court guardians are placed by the strata system, not the biome end
    pal: { bg0: '#0a0a12', bg1: '#171326', ink: '#cdbfe6', glow: '#b48bff', rock: '#241d34', deep: '#060509' },
    nodeW: { fight: 42, event: 16, cache: 16, hazard: 12, rest: 8, pulse: 4 },
    mats: ['deep_leaf', 'gilt_marrow', 'null_coin', 'court_signet', 'vel_shard', 'heart_ember'],
    hazards: [
      { name: 'Arithmetic fault', stat: 'wits', text: 'The gallery’s figures stop adding up — the floor itself disagrees on where it is!' },
      { name: 'Compound collapse', stat: 'might', text: 'A shelf of ledger-stone lets go, each slab dragging the next!' },
      { name: 'Gilt sump', stat: 'luck', text: 'Molten gilt wells up through the flags, seeking the lowest thing — probably a boot.' }
    ]
  });

  /* ---------- the Deep Court (six nobles) ----------
   * New specials handled in combat.js: 'backhunt' (strikes the back row),
   * 'levy' (drains shared Grit on hit). Existing reused: 'drain','lowest','tithe','ward'. */
  D.enemies.court_auditor = {
    id: 'court_auditor', name: 'The Auditor', tags: ['court', 'undead'], hp: 46, dmg: [8, 12], spd: 8, crit: 0.1,
    special: 'backhunt', loot: [{ id: 'deep_leaf', p: 0.5, q: [1, 2] }, { id: 'null_coin', p: 0.14, q: [1, 1] }], marks: [6, 14],
    look: { form: 'noble', hue: 210, size: 1.15 },
    desc: 'It does not strike the shield. It reaches past it, to the columns of figures you keep in back.'
  };
  D.enemies.court_usurer = {
    id: 'court_usurer', name: 'The Usurer', tags: ['court'], hp: 54, dmg: [7, 11], spd: 6, crit: 0.08,
    special: 'drain', loot: [{ id: 'deep_leaf', p: 0.45, q: [1, 2] }, { id: 'gilt_marrow', p: 0.12, q: [1, 1] }], marks: [8, 16],
    look: { form: 'noble', hue: 40, size: 1.2 },
    desc: 'Lends you the wound and charges interest on it, in your own blood.'
  };
  D.enemies.court_assessor = {
    id: 'court_assessor', name: 'The Assessor', tags: ['court'], hp: 44, dmg: [9, 13], spd: 9, crit: 0.12,
    special: 'lowest', loot: [{ id: 'deep_leaf', p: 0.5, q: [1, 2] }], marks: [6, 12],
    look: { form: 'noble', hue: 160, size: 1.1 },
    desc: 'Prices everything at a glance and always buys the cheapest life on the field.'
  };
  D.enemies.court_chamberlain = {
    id: 'court_chamberlain', name: 'The Chamberlain', tags: ['court', 'construct'], hp: 70, dmg: [7, 10], spd: 4, crit: 0.05,
    special: 'ward', loot: [{ id: 'gilt_marrow', p: 0.3, q: [1, 2] }, { id: 'court_signet', p: 0.06, q: [1, 1] }], marks: [8, 15],
    look: { form: 'noble', hue: 280, size: 1.3 },
    desc: 'Keeps the doors, the keys, and a brass composure no blow seems to trouble.'
  };
  D.enemies.court_collector = {
    id: 'court_collector', name: 'The Collector', tags: ['court', 'undead'], hp: 48, dmg: [8, 12], spd: 7, crit: 0.08,
    special: 'tithe', loot: [{ id: 'null_coin', p: 0.4, q: [1, 2] }, { id: 'deep_leaf', p: 0.3, q: [1, 1] }], marks: [10, 20],
    look: { form: 'noble', hue: 0, size: 1.15 },
    desc: 'Walks the strata with a bowl and a list. Your name is on the list. The bowl is never full.'
  };
  D.enemies.court_notary = {
    id: 'court_notary', name: 'The Notary', tags: ['court'], hp: 50, dmg: [7, 11], spd: 8, crit: 0.1,
    special: 'levy', loot: [{ id: 'deep_leaf', p: 0.45, q: [1, 2] }, { id: 'null_coin', p: 0.12, q: [1, 1] }], marks: [7, 14],
    look: { form: 'noble', hue: 100, size: 1.1 },
    desc: 'Notarises your resolve away, stamp by stamp, until there is nothing left to spend.'
  };

  /* Court guardians — mini-bosses placed every few strata by the Undervault system. */
  D.enemies.lord_exchequer = {
    id: 'lord_exchequer', name: 'The Lord Exchequer', tags: ['court', 'guardian'], hp: 190, dmg: [10, 15], spd: 6, crit: 0.1,
    boss: true, rotation: ['strike', 'aoe', 'summon:court_collector', 'strike', 'audit'],
    loot: [{ id: 'gilt_marrow', p: 1.0, q: [2, 3] }, { id: 'court_signet', p: 0.7, q: [1, 1] }, { id: 'deep_leaf', p: 1.0, q: [2, 4] }],
    marks: [60, 110],
    look: { form: 'exchequer', hue: 48, size: 1.8 },
    desc: 'The office that balances the Maw’s books by force. It has audited empires into rounding errors.'
  };
  D.enemies.the_magistrate = {
    id: 'the_magistrate', name: 'The Magistrate', tags: ['court', 'guardian'], hp: 210, dmg: [11, 16], spd: 7, crit: 0.12,
    boss: true, rotation: ['strike', 'levy', 'aoe', 'summon:court_notary', 'strike'],
    loot: [{ id: 'court_signet', p: 0.8, q: [1, 2] }, { id: 'null_coin', p: 1.0, q: [2, 3] }, { id: 'gilt_marrow', p: 1.0, q: [1, 2] }],
    marks: [70, 120],
    look: { form: 'exchequer', hue: 265, size: 1.85 },
    desc: 'It reads the sentence before you have finished the crime. The crime is usually solvency.'
  };
  D.undervaultGuardians = ['lord_exchequer', 'the_magistrate'];

  /* ---------- encounters (depth 14+; the strata system also injects nobles) ---------- */
  D.encounters.undervault = [
    { w: 24, minD: 14, group: ['court_assessor'] },
    { w: 22, minD: 14, group: ['court_collector'] },
    { w: 20, minD: 14, group: ['court_auditor'] },
    { w: 18, minD: 14, group: ['court_notary'] },
    { w: 18, minD: 15, group: ['court_usurer'] },
    { w: 16, minD: 15, group: ['court_assessor', 'court_collector'] },
    { w: 15, minD: 16, group: ['court_chamberlain'] },
    { w: 14, minD: 16, group: ['court_auditor', 'court_notary'] },
    { w: 13, minD: 18, group: ['court_usurer', 'court_assessor'] },
    { w: 12, minD: 18, group: ['court_chamberlain', 'court_collector'] },
    { w: 11, minD: 20, group: ['court_auditor', 'court_usurer', 'court_assessor'] },
    { w: 10, minD: 22, group: ['court_chamberlain', 'court_notary', 'court_collector'] }
  ];

  /* ---------- stratum affixes ----------
   * Each stratum of the Undervault rolls one or more. Effects are read by the
   * Undervault system (loot/rest) and combat.js (per-fight hooks). */
  D.affixes = [
    { id: 'tithe',    name: 'Tithe',    hue: 0,   blurb: 'Every blow the dark lands also takes a mark from the haul.' },
    { id: 'ledger',   name: 'Ledger',   hue: 45,  blurb: 'Each kill compounds this stratum’s loot value.' },
    { id: 'famine',   name: 'Famine',   hue: 30,  blurb: 'No rest, no pulse. The dark offers no mercy here.' },
    { id: 'gilt',     name: 'Gilt',     hue: 50,  blurb: 'Loot is doubled — and the enemies have swollen with it (+HP).' },
    { id: 'echoing',  name: 'Echoing',  hue: 285, blurb: 'The dark rehearses the Heart: one foe charges a heavy blow each round.' },
    { id: 'interest', name: 'Interest', hue: 160, blurb: 'The enemy heals a little every round it stands.' },
    { id: 'audit',    name: 'Audit',    hue: 210, blurb: 'A Court noble joins every third fight, unbidden.' }
  ];
  D.affixDef = function (id) { return G.U.byId(D.affixes, id); };

  /* ---------- tier IV gear (Forge L3 + the Deep Forge upgrade) ---------- */
  D.gear.exchequer_edge = {
    id: 'exchequer_edge', name: 'Exchequer’s Edge', slot: 'weapon', tier: 4, atk: 12,
    cost: { marks: 140, mats: { court_signet: 1, vel_shard: 2, gilt_marrow: 1 } },
    desc: 'A letter-opener the length of an arm, for correspondence that argues back.'
  };
  D.gear.gilt_plate = {
    id: 'gilt_plate', name: 'Gilt-Marrow Plate', slot: 'armor', tier: 4, def: 6,
    cost: { marks: 130, mats: { gilt_marrow: 3, court_signet: 1 } },
    desc: 'Bone-gold plate. Turns blows the way a vault turns questions.'
  };
  D.gear.null_seal = {
    id: 'null_seal', name: 'Null Seal', slot: 'trinket', tier: 4, fx: { gritStart: 2, crit: 0.06 },
    cost: { marks: 120, mats: { null_coin: 2, court_signet: 1 } },
    desc: 'Stamps the fight void of doubt. The team starts resolved and reads the openings.'
  };
  D.gear.deep_ledger_charm = {
    id: 'deep_ledger_charm', name: 'Deep Ledger', slot: 'trinket', tier: 4, fx: { loot: 0.3, xp: 0.15 },
    cost: { marks: 116, mats: { deep_leaf: 4, null_coin: 1 } },
    desc: 'Keeps a running total of everything the dark owes you. It is a large number.'
  };

  /* ---------- relic sets (2-piece / 4-piece) ----------
   * Set pieces are Undervault relics dropped by the Deep Court & its guardians.
   * Bonuses fold into Relics.fx by set-membership count (see relics.js). */
  D.relics.court_mask = { id: 'court_mask', name: 'The Auditor’s Mask', from: 'undervault', set: 'court',
    desc: 'A blank brass face that sees the back row. +1 start Grit.', fx: { gritStart: 1 } };
  D.relics.court_ledger = { id: 'court_ledger', name: 'The Collector’s Ledger', from: 'undervault', set: 'court',
    desc: 'Every find is written up twice, to be safe. +8% sale value.', fx: { sellMult: 1.08 } };
  D.relics.court_seal = { id: 'court_seal', name: 'The Exchequer’s Seal', from: 'undervault', set: 'court',
    desc: 'The office’s own stamp. +10% run loot value.', fx: { lootMult: 1.10 } };
  D.relics.court_scepter = { id: 'court_scepter', name: 'The Magistrate’s Scepter', from: 'undervault', set: 'court',
    desc: 'Passes sentence, and experience. +15% XP.', fx: { xpMult: 1.15 } };

  D.relics.deep_lantern = { id: 'deep_lantern', name: 'The Deep Lantern', from: 'undervault', set: 'delver',
    desc: 'Burns on ledger-oil; the dark reads clearer. Torches last longer.', fx: { torchDrain: -1 } };
  D.relics.deep_charter = { id: 'deep_charter', name: 'The Undercharter', from: 'undervault', set: 'delver',
    desc: 'A charter countersigned below the Heart. +6% sale value.', fx: { sellMult: 1.06 } };

  D.relicSets = {
    court: {
      id: 'court', name: 'Regalia of the Deep Court',
      pieces: ['court_mask', 'court_ledger', 'court_seal', 'court_scepter'],
      bonus2: { desc: '2-piece: +10% sale value.', fx: { sellMult: 1.10 } },
      bonus4: { desc: '4-piece: +20% run loot, +1 start Grit.', fx: { lootMult: 1.20, gritStart: 1 } }
    },
    delver: {
      id: 'delver', name: 'The Underdelver’s Kit',
      pieces: ['deep_lantern', 'deep_charter'],
      bonus2: { desc: '2-piece: +12% XP below the Heart.', fx: { xpMult: 1.12 } }
    }
  };

  /* ---------- journal & barks ---------- */
  D.journal.push(
    {
      id: 'page13', title: 'Maren’s Log — the Undervault', unlock: 'undervault',
      body: 'The Trade opened a stair I did not sanction and cannot close. It goes down past the Heart into the place where the books are actually kept — not the market above, the real accounts, in a hand older than the first charter. There is a Court down here. They have titles. They are expecting us. I think they have always been expecting us; we are simply the first to be solvent enough to audit back.'
    },
    {
      id: 'page14', title: 'Maren’s Log — the deep-record', unlock: 'undervault_deep',
      body: 'There is no bottom. Each stratum is a fresh page and a fresh set of terms — a tithe here, a famine there, a day when the loot doubles and so does the danger of keeping it. The delvers have started calling the deepest anyone has reached "the record", and racing it, which is either the healthiest thing this company has ever done or the last.'
    }
  );
  D.barks.push(
    { who: 'Petra Kiln', flag: 'undervault', text: 'Gilt marrow. Court signets. You’ve been somewhere there isn’t a map for. I’ll grade it, but I won’t ask.' },
    { who: 'Dov Harrow', flag: 'undervault', text: 'The ones who come back up from the Vault order the strong stuff and sit facing the door. I keep a bottle back for them.' }
  );
})();
