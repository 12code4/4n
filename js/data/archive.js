/* v3.0 — The Sunken Archive (depths 7–9): a drowned library civilisation.
 * Appends materials, biome, enemies, encounters, events, journal. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* ---------- materials ---------- */
  D.materials.ink_pearl = { id: 'ink_pearl', name: 'Ink-Pearl', base: 16, tier: 2, biome: 'archive',
    desc: 'A pearl grown in an inkwell. Reads your fingerprints and keeps them.', hue: 190 };
  D.materials.deep_vellum = { id: 'deep_vellum', name: 'Vellum of the Deep', base: 13, tier: 2, biome: 'archive',
    desc: 'Page-skin that never rots. The writing on it moves when unwatched.', hue: 160 };
  D.materials.custodian_brass = { id: 'custodian_brass', name: 'Custodian Brass', base: 18, tier: 2, biome: 'archive',
    desc: 'Brass from a Custodian’s joints. Still warm with old diligence.', hue: 45 };
  D.materials.a_sentence = { id: 'a_sentence', name: 'A Complete Sentence', base: 50, tier: 3, biome: 'archive',
    desc: 'The Archive’s true currency: a whole true thing, said once, kept forever.', hue: 280 };

  /* ---------- biome ---------- */
  D.biomes.push({
    id: 'archive', name: 'The Sunken Archive', depths: [7, 9],
    tagline: 'A drowned library in ink-black water. Everything here was written down.',
    guardian: 'the_librarian',
    pal: { bg0: '#04100f', bg1: '#082421', ink: '#8fe0d4', glow: '#39c6b0', rock: '#0e2b28', deep: '#020a09' },
    nodeW: { fight: 34, event: 26, cache: 13, hazard: 10, rest: 9, peddler: 6 },
    mats: ['ink_pearl', 'deep_vellum', 'custodian_brass', 'a_sentence', 'pale_coin', 'hollow_pearl', 'vel_shard'],
    hazards: [
      { name: 'Ink flood', stat: 'might', text: 'A wall of black water pours down the stacks!' },
      { name: 'Silence field', stat: 'wits', text: 'A zone where no sound carries — and no warning.' },
      { name: 'Misfiled floor', stat: 'luck', text: 'The floor tiles are catalogued wrong; some aren’t there.' }
    ]
  });

  /* ---------- enemies ---------- */
  D.enemies.page_swarm = {
    id: 'page_swarm', name: 'Page Swarm', tags: ['construct'], hp: 12, dmg: [3, 5], spd: 9, crit: 0.1,
    loot: [{ id: 'deep_vellum', p: 0.5, q: [1, 2] }], marks: [1, 3],
    look: { form: 'winged', hue: 165, size: 0.7 },
    desc: 'A blizzard of loose pages, each with one very sharp edge and one bad idea.'
  };
  D.enemies.ink_revenant = {
    id: 'ink_revenant', name: 'Ink Revenant', tags: ['undead'], hp: 22, dmg: [4, 7], spd: 5, crit: 0.06,
    special: 'blot', // smears loot: destroys a carried material now and then
    loot: [{ id: 'ink_pearl', p: 0.45, q: [1, 2] }], marks: [2, 6],
    look: { form: 'tall', hue: 200, size: 1.05 },
    desc: 'A reader who drowned mid-sentence and never surfaced. Still turning pages.'
  };
  D.enemies.custodian = {
    id: 'custodian', name: 'Custodian', tags: ['construct'], hp: 40, dmg: [6, 9], spd: 3, crit: 0.05,
    special: 'ward', // shields the enemy struck least; body-blocks for allies
    loot: [{ id: 'custodian_brass', p: 0.7, q: [1, 2] }], marks: [3, 8],
    look: { form: 'warden', hue: 45, size: 1.35 },
    desc: 'Brass librarian. Its whole existence is: nothing leaves without being checked out.'
  };
  D.enemies.drowned_scholar = {
    id: 'drowned_scholar', name: 'Drowned Scholar', tags: ['undead'], hp: 18, dmg: [5, 8], spd: 6, crit: 0.08,
    special: 'curse', // lowers the party's damage while it stands (like a reverse chorus)
    loot: [{ id: 'ink_pearl', p: 0.4, q: [1, 1] }, { id: 'a_sentence', p: 0.06, q: [1, 1] }], marks: [2, 6],
    look: { form: 'tall', hue: 275, size: 0.95 },
    desc: 'Recites your failures in a language you almost understand. It saps the will.'
  };
  D.enemies.lantern_eel = {
    id: 'lantern_eel', name: 'Lantern Eel', tags: ['beast'], hp: 16, dmg: [6, 10], spd: 10, crit: 0.2,
    special: 'lowest',
    loot: [{ id: 'deep_vellum', p: 0.4, q: [1, 2] }], marks: [1, 4],
    look: { form: 'winged', hue: 55, size: 0.85 },
    desc: 'Swims the flooded stacks by its own cold light. Bites the dimmest lamp first.'
  };
  D.enemies.misfiled_thing = {
    id: 'misfiled_thing', name: 'A Misfiled Thing', tags: ['undead', 'beast'], hp: 26, dmg: [4, 11], spd: 6, crit: 0.12,
    special: 'slow',
    loot: [{ id: 'a_sentence', p: 0.12, q: [1, 1] }, { id: 'custodian_brass', p: 0.4, q: [1, 2] }], marks: [3, 9],
    look: { form: 'mass', hue: 300, size: 1.2 },
    desc: 'Filed under a heading that should not have a body. It has a body anyway.'
  };
  D.enemies.the_librarian = {
    id: 'the_librarian', name: 'The Librarian', tags: ['construct', 'undead', 'guardian'], hp: 158, dmg: [8, 12], spd: 6, crit: 0.1,
    boss: true, rotation: ['strike', 'silence', 'aoe', 'index'],
    loot: [{ id: 'a_sentence', p: 1.0, q: [2, 3] }, { id: 'ink_pearl', p: 1.0, q: [2, 3] }, { id: 'vel_shard', p: 0.7, q: [1, 2] }],
    marks: [60, 90],
    look: { form: 'librarian', hue: 190, size: 1.7 },
    desc: 'It has read every ending, including yours. It would like to correct your citation.'
  };

  D.encounters.archive = [
    { w: 26, minD: 7, group: ['page_swarm', 'page_swarm'] },
    { w: 20, minD: 7, group: ['ink_revenant'] },
    { w: 22, minD: 7, group: ['lantern_eel', 'page_swarm'] },
    { w: 16, minD: 7, group: ['drowned_scholar'] },
    { w: 14, minD: 8, group: ['custodian'] },
    { w: 16, minD: 8, group: ['ink_revenant', 'page_swarm'] },
    { w: 14, minD: 8, group: ['drowned_scholar', 'lantern_eel'] },
    { w: 12, minD: 8, group: ['misfiled_thing'] },
    { w: 14, minD: 9, group: ['custodian', 'page_swarm', 'page_swarm'] },
    { w: 12, minD: 9, group: ['drowned_scholar', 'ink_revenant'] },
    { w: 10, minD: 9, group: ['misfiled_thing', 'lantern_eel'] }
  ];

  /* ---------- events ---------- */
  D.events.push(
    {
      id: 'card_catalogue', name: 'The Card Catalogue', biome: 'archive', minD: 7, maxD: 99, w: 10,
      text: 'A catalogue drawer, still dry, floating just above the ink. The cards list where everything in the Archive is filed — including, near the back, a card that reads simply "VALE, M."',
      choices: [
        { label: 'Read Maren’s card', outcomes: [{ p: 1, text: 'The card gives a shelf-mark deeper than you can currently reach — and a date after she went missing.', fx: { xp: 10 } }] },
        { label: 'Pull the treasure listings', check: { stat: 'wits', dc: 11 },
          outcomes: {
            success: [{ p: 1, text: 'You cross-reference three drawers and find a cache filed under the wrong heading.', fx: { lootValue: 30 } }],
            fail: [{ p: 1, text: 'You pull a card and the catalogue reclassifies YOU. Something comes to re-shelve.', fx: { fight: ['custodian'] } }]
          } }
      ]
    },
    {
      id: 'reading_room', name: 'The Flooded Reading Room', biome: 'archive', minD: 7, maxD: 99, w: 10,
      text: 'Rows of desks under black water, each with a lamp still lit and a book still open. Sit, and the Archive will let you read one true thing. Reading is never free here.',
      choices: [
        { label: 'Read (costs 6 hp of concentration)', cost: {}, check: { stat: 'wits', dc: 9 },
          outcomes: {
            success: [{ p: 1, text: 'The page resolves into sense. You come away knowing something worth selling, and worth keeping.', fx: { mats: { a_sentence: 1 }, hpAll: -3, xp: 8 } }],
            fail: [{ p: 1, text: 'The sentence reads you back. You surface gasping with a nosebleed and a fact you didn’t want.', fx: { hpAll: -6 } }]
          } },
        { label: 'Leave the books closed', outcomes: [{ p: 1, text: 'You keep your ignorance, which down here is a kind of armor.', fx: {} }] }
      ]
    },
    {
      id: 'overdue_desk', name: 'The Overdue Desk', biome: 'archive', minD: 7, maxD: 99, w: 8,
      text: 'A Custodian sits dormant at a returns desk, one brass hand extended. A plaque: "ALL LOANS RECALLED." It is waiting to be given something back.',
      choices: [
        { label: 'Return a pale coin', cost: { }, outcomes: [{ p: 1, text: 'You place a coin in its palm. It stamps the air, satisfied, and gifts you a checked-out cache.', fx: { lootValue: 18 } }], require: 'pale_coin' },
        { label: 'Return nothing and pass', outcomes: [
          { p: 0.6, text: 'It lets you by. Diligence, apparently, has limits.', fx: {} },
          { p: 0.4, text: 'It logs you as overdue. The fine is collected in kind.', fx: { fight: ['custodian'] } }
        ] }
      ]
    },
    {
      id: 'the_index', name: 'The Living Index', biome: 'archive', minD: 8, maxD: 99, w: 8,
      text: 'A column of ink hangs in the water, writing and rewriting itself — an index of everything that has died in the Archive. Your delvers’ names are not in it. Yet.',
      choices: [
        { label: 'Add a false entry (misdirect it)', check: { stat: 'luck', dc: 10 },
          outcomes: {
            success: [{ p: 1, text: 'You seed a plausible lie. The index chases it down a dead stack and forgets you entirely.', fx: { xp: 10, healAll: 4 } }],
            fail: [{ p: 1, text: 'The index reads the lie, then reads YOU, and updates accordingly.', fx: { fight: ['drowned_scholar', 'ink_revenant'] } }]
          } },
        { label: 'Bow and back away', outcomes: [{ p: 1, text: 'You give the index no material to work with. It keeps writing.', fx: {} }] }
      ]
    },
    {
      id: 'maren_marginalia', name: 'Maren’s Marginalia', biome: 'archive', minD: 8, maxD: 99, w: 7,
      text: 'A book she was reading, propped above the water, her notes crowding the margins in that same brown chalk-hand. The last note, underlined: "It doesn’t want the treasure. Stop bringing it treasure."',
      choices: [
        { label: 'Copy the marginalia', outcomes: [{ p: 1, text: 'You transcribe every note. The team is very quiet on the walk back.', fx: { xp: 12 } }] },
        { label: 'Take the book to sell', outcomes: [
          { p: 0.5, text: 'A Custodian’s book. It sells for a fortune to the right nervous buyer.', fx: { mats: { a_sentence: 1, deep_vellum: 2 } } },
          { p: 0.5, text: 'You lift the book and the water lifts something in answer.', fx: { fight: ['ink_revenant'] } }
        ] }
      ]
    },
    {
      id: 'quiet_stacks', name: 'The Quiet Stacks', biome: 'archive', minD: 7, maxD: 99, w: 9,
      text: 'A dry aisle, shelves intact, lamps steady. It is the most peaceful place you have found in the Maw, which is exactly why the team keeps checking the exits.',
      choices: [
        { label: 'Rest here', outcomes: [
          { p: 0.7, text: 'Genuine rest. The team breathes and mends. Nothing comes.', fx: { healAll: 10 } },
          { p: 0.3, text: 'The quiet was a held breath. It lets go.', fx: { healAll: 4, fight: 'encounter' } }
        ] },
        { label: 'Search the shelves instead', check: { stat: 'wits', dc: 9 },
          outcomes: {
            success: [{ p: 1, text: 'Between two volumes: a slim cache the last crew hid and never returned for.', fx: { lootValue: 20 } }],
            fail: [{ p: 1, text: 'You knock a volume into the water. The splash is very loud in a quiet room.', fx: { fight: 'encounter' } }]
          } }
      ]
    }
  );

  /* ---------- journal ---------- */
  D.journal.push(
    {
      id: 'page7', title: 'Maren’s Log — Day 15, the Archive', unlock: 'depth7',
      body: 'Everything down here is written down — every trade, every death, every price the Maw has ever set. It is not hoarding treasure. It is keeping RECORDS. The wealth is a side effect of a civilisation that fell downward taking its accounts with it. We have been robbing a library and calling it a mine.'
    },
    {
      id: 'page8', title: 'Maren’s Log — Day 17', unlock: 'depth8',
      body: 'I found my own card in the catalogue. Filed alive, under a shelf-mark below the Archive floor. The Maw expects me. It has been expecting me since before I signed the charter. I keep leaving it payment — glass, coin, pearls — and it keeps filing my offerings as INCOMPLETE. I have been paying in the wrong currency this whole time.'
    },
    {
      id: 'page9', title: 'Maren’s Log — Day 18, torn', unlock: 'guardian_archive',
      body: 'The Librarian let us reach the desk. It does not want the vel-shards. It does not want the coin. It slid a single blank card across the ink and asked — in my own handwriting — what the company is FOR. I did not have an answer it would accept. Below this floor the water stops and something older begins. I am going down to find out what it is buying. If you are reading this, you are the company now. Bring it a better answer than I had.'
    }
  );

  D.barks.push(
    { who: 'Petra Kiln', flag: 'depth7', text: 'A Complete Sentence — I graded one and it graded me back. I do not want to see another. Bring me ten.' },
    { who: 'The Silent Priest', flag: 'depth7', text: '(He writes a single word on a card, shows it to you, and eats it.)' },
    { who: 'Dov Harrow', flag: 'guardian_archive', text: 'You beat the Librarian? Nobody drinks tonight. Everybody drinks tonight. I can’t decide which.' }
  );
})();
