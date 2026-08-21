/* v2.0 — The Emberdeep (depths 4–6): materials, biome, enemies, encounters,
 * events, journal pages. Appends into the existing data structures. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* ---------- materials ---------- */
  D.materials.slag_iron = { id: 'slag_iron', name: 'Slag-Iron', base: 11, tier: 2, biome: 'emberdeep',
    desc: 'Iron that has been through something. Forges hot and holds a grudge.', hue: 10 };
  D.materials.cinderbloom = { id: 'cinderbloom', name: 'Cinderbloom', base: 8, tier: 1, biome: 'emberdeep',
    desc: 'A flower of ash that blooms in heat. Apothecaries burn them back to seed.', hue: 18 };
  D.materials.forge_salt = { id: 'forge_salt', name: 'Forge-Salt', base: 14, tier: 2, biome: 'emberdeep',
    desc: 'Crystals raked from deep kilns nobody stokes. Tempers any alloy.', hue: 45 };
  D.materials.kings_solder = { id: 'kings_solder', name: 'King’s Solder', base: 42, tier: 3, biome: 'emberdeep',
    desc: 'Royal solder from the Smelted King’s court. Joins anything to anything, once.', hue: 50 };

  /* ---------- biome ---------- */
  D.biomes.push({
    id: 'emberdeep', name: 'The Emberdeep', depths: [4, 6],
    tagline: 'Slag flows and cinder pits. The Maw’s furnace, still lit.',
    guardian: 'smelted_king',
    pal: { bg0: '#160805', bg1: '#331008', ink: '#f0a070', glow: '#ff5a2d', rock: '#40150a', deep: '#0d0402' },
    nodeW: { fight: 38, event: 22, cache: 13, hazard: 13, rest: 8, peddler: 6 },
    mats: ['slag_iron', 'cinderbloom', 'forge_salt', 'ember_glass', 'wisp_resin', 'kings_solder', 'vel_shard'],
    hazards: [
      { name: 'Slag flow', stat: 'might', text: 'A tongue of molten slag licks across the gallery!' },
      { name: 'Ash storm', stat: 'wits', text: 'The air fills with hot, blinding ash!' },
      { name: 'Heat sink', stat: 'luck', text: 'The floor ahead shimmers — some flags are stone, some are crust!' }
    ]
  });

  /* ---------- enemies ---------- */
  D.enemies.ember_tick = {
    id: 'ember_tick', name: 'Ember Tick', tags: ['beast', 'fire'], hp: 10, dmg: [3, 5], spd: 8, crit: 0.08,
    loot: [{ id: 'cinderbloom', p: 0.4, q: [1, 1] }], marks: [1, 3],
    look: { form: 'blob', hue: 15, size: 0.6 },
    desc: 'Drinks heat instead of blood. Your torch is soup to it.'
  };
  D.enemies.cinder_hound = {
    id: 'cinder_hound', name: 'Cinder Hound', tags: ['beast', 'fire'], hp: 18, dmg: [5, 8], spd: 9, crit: 0.12,
    loot: [{ id: 'cinderbloom', p: 0.5, q: [1, 2] }], marks: [2, 5],
    look: { form: 'hound', hue: 18, size: 1.0 },
    desc: 'A greyhound of embers. Fetches delvers.'
  };
  D.enemies.slag_golem = {
    id: 'slag_golem', name: 'Slag Golem', tags: ['construct', 'fire'], hp: 34, dmg: [8, 13], spd: 2, crit: 0.05,
    special: 'slow',
    loot: [{ id: 'slag_iron', p: 0.75, q: [1, 3] }], marks: [3, 7],
    look: { form: 'mass', hue: 8, size: 1.35 },
    desc: 'Furnace leavings that decided to keep working. Union rates.'
  };
  D.enemies.ashwake_chorister = {
    id: 'ashwake_chorister', name: 'Ashwake Chorister', tags: ['undead', 'fire'], hp: 16, dmg: [4, 6], spd: 5, crit: 0.05,
    special: 'chorus', // its verse raises every ally's damage while it stands
    loot: [{ id: 'forge_salt', p: 0.45, q: [1, 1] }], marks: [2, 6],
    look: { form: 'tall', hue: 25, size: 0.95 },
    desc: 'Sings the furnace hymn. Everything nearby burns a little brighter.'
  };
  D.enemies.bellows_wight = {
    id: 'bellows_wight', name: 'Bellows Wight', tags: ['undead'], hp: 20, dmg: [4, 7], spd: 4, crit: 0.05,
    special: 'gust', // every third round it blasts the whole line
    loot: [{ id: 'wisp_resin', p: 0.5, q: [1, 2] }, { id: 'forge_salt', p: 0.3, q: [1, 1] }], marks: [2, 5],
    look: { form: 'tall', hue: 200, size: 1.1 },
    desc: 'Lungs like cathedral bellows and no better use for them.'
  };
  D.enemies.molten_weaver = {
    id: 'molten_weaver', name: 'Molten Weaver', tags: ['beast', 'fire'], hp: 15, dmg: [5, 9], spd: 7, crit: 0.1,
    special: 'lowest',
    loot: [{ id: 'slag_iron', p: 0.4, q: [1, 2] }, { id: 'kings_solder', p: 0.08, q: [1, 1] }], marks: [2, 6],
    look: { form: 'winged', hue: 12, size: 0.85 },
    desc: 'Spins glass from slag and picks at whatever is fraying.'
  };
  D.enemies.smelted_king = {
    id: 'smelted_king', name: 'The Smelted King', tags: ['construct', 'fire', 'guardian'], hp: 120, dmg: [9, 13], spd: 5, crit: 0.1,
    boss: true, rotation: ['strike', 'aoe', 'strike', 'reforge'],
    loot: [{ id: 'kings_solder', p: 1.0, q: [1, 2] }, { id: 'forge_salt', p: 1.0, q: [2, 3] }, { id: 'vel_shard', p: 0.6, q: [1, 1] }],
    marks: [40, 60],
    look: { form: 'king', hue: 40, size: 1.7 },
    desc: 'They fed the first kings to the furnace to end a war. The furnace kept the crowns and the opinions.'
  };

  D.encounters.emberdeep = [
    { w: 26, minD: 4, group: ['ember_tick', 'ember_tick'] },
    { w: 20, minD: 4, group: ['ember_tick', 'ember_tick', 'ember_tick'] },
    { w: 26, minD: 4, group: ['cinder_hound'] },
    { w: 18, minD: 4, group: ['ashwake_chorister', 'ember_tick'] },
    { w: 16, minD: 4, group: ['bellows_wight'] },
    { w: 16, minD: 5, group: ['cinder_hound', 'cinder_hound'] },
    { w: 16, minD: 5, group: ['slag_golem'] },
    { w: 14, minD: 5, group: ['molten_weaver', 'ember_tick'] },
    { w: 14, minD: 6, group: ['ashwake_chorister', 'cinder_hound'] },
    { w: 12, minD: 6, group: ['slag_golem', 'ember_tick', 'ember_tick'] },
    { w: 12, minD: 6, group: ['bellows_wight', 'molten_weaver'] },
    { w: 10, minD: 6, group: ['ashwake_chorister', 'ashwake_chorister', 'ember_tick'] }
  ];

  /* ---------- events ---------- */
  D.events.push(
    {
      id: 'cooling_crown', name: 'The Cooling Crown', biome: 'emberdeep', minD: 4, maxD: 99, w: 9,
      text: 'In a dead kiln sits a crown of slag, still faintly orange at the points. It would cool into a fortune — or it would cool into a hand that misses it.',
      choices: [
        { label: 'Quench it (2 torches doused)', cost: { torches: 2 },
          outcomes: [
            { p: 0.7, text: 'The crown hisses, hardens, and becomes merely priceless.', fx: { mats: { kings_solder: 1, slag_iron: 2 } } },
            { p: 0.3, text: 'The crown shrieks as it cools. The court hears.', fx: { mats: { kings_solder: 1 }, fight: 'encounter' } }
          ] },
        { label: 'Leave royalty be', outcomes: [{ p: 1, text: 'You bow, out of habit, to an empty kiln. It feels right.', fx: { xp: 3 } }] }
      ]
    },
    {
      id: 'bloom_field', name: 'A Field of Cinderbloom', biome: 'emberdeep', minD: 4, maxD: 99, w: 11,
      text: 'A gallery of grey flowers, blooming from old ash. Walking through will scatter seed-sparks onto everything flammable — for instance, you.',
      choices: [
        { label: 'Harvest carefully', check: { stat: 'wits', dc: 10 },
          outcomes: {
            success: [{ p: 1, text: 'Cut low, bagged wet. A season of apothecary stock in an hour.', fx: { mats: { cinderbloom: 4 }, xp: 5 } }],
            fail: [{ p: 1, text: 'One bloom pops. Then the field applauds. You leave singed, clutching what you grabbed.', fx: { mats: { cinderbloom: 2 }, hp: -7 } }]
          } },
        { label: 'Wade straight through', outcomes: [
          { p: 0.5, text: 'You jog it, swatting sparks. Quick, warm, profitable enough.', fx: { mats: { cinderbloom: 2 }, hpAll: -2 } },
          { p: 0.5, text: 'The field lights like a festival. Something comes to watch.', fx: { hpAll: -4, fight: 'encounter' } }
        ] }
      ]
    },
    {
      id: 'quenched_forge', name: 'The Quenched Forge', biome: 'emberdeep', minD: 4, maxD: 99, w: 8,
      text: 'A delver-built field forge, cold and neat. Tools racked, ingots stacked, a kettle mid-pour — the crew stepped away years ago and forgot to exist.',
      choices: [
        { label: 'Take the stock', outcomes: [
          { p: 0.75, text: 'Good iron doesn’t hold grudges. Probably.', fx: { mats: { slag_iron: 3, forge_salt: 1 } } },
          { p: 0.25, text: 'The kettle finishes its pour as you lift the ingots. The crew remembers it exists.', fx: { mats: { slag_iron: 2 }, fight: ['bellows_wight'] } }
        ] },
        { label: 'Bank the coals and move on', outcomes: [{ p: 1, text: 'You leave it ready to light. Somewhere below, something warm approves.', fx: { healAll: 4, xp: 4 } }] }
      ]
    },
    {
      id: 'hymn_gallery', name: 'The Hymn Gallery', biome: 'emberdeep', minD: 5, maxD: 99, w: 8,
      text: 'The gallery walls are flues, and the flues are singing — the furnace hymn, in parts. Joining in is said to be lucky. Said by whom is the question.',
      choices: [
        { label: 'Sing along', check: { stat: 'luck', dc: 9 },
          outcomes: {
            success: [{ p: 1, text: 'Your part fits. The gallery pays its chorus in salt and warmth.', fx: { mats: { forge_salt: 2 }, healAll: 5 } }],
            fail: [{ p: 1, text: 'You sing the wrong verse. The choir arrives to correct you.', fx: { fight: ['ashwake_chorister', 'ember_tick'] } }]
          } },
        { label: 'Pass in silence', outcomes: [{ p: 1, text: 'The hymn swells behind you, pointedly.', fx: {} }] }
      ]
    },
    {
      id: 'slag_ferry', name: 'The Slag Ferry', biome: 'emberdeep', minD: 5, maxD: 99, w: 7,
      text: 'A river of slow slag, and a ferry-plate of cold iron chained to a gantry. The plate holds one passage’s worth of weight — delvers, or cargo.',
      choices: [
        { label: 'Ferry the team across', check: { stat: 'might', dc: 11 },
          outcomes: {
            success: [{ p: 1, text: 'Hand over hand, hot as regret. The far bank has a cache in plain view.', fx: { lootValue: 26, skipRank: true } }],
            fail: [{ p: 1, text: 'The chain skips. The plate dips. Boots cook.', fx: { hpAll: -5 } }]
          } },
        { label: 'Take the long ledge', outcomes: [{ p: 1, text: 'Long, hot, and survivable. Business expense: two torches.', fx: { supplies: { torches: -2 } } }] }
      ]
    },
    {
      id: 'maren_ledger_page', name: 'A Burnt Ledger Page', biome: 'emberdeep', minD: 4, maxD: 99, w: 6,
      text: 'Wedged in a flue: a page of company ledger, edges burnt, in Maren’s hand. Prices, tallies — and one line circled twice: "The King buys back his own coin. Ask what he sells."',
      choices: [
        { label: 'File it', outcomes: [{ p: 1, text: 'Another page for the company records. The circled line itches.', fx: { xp: 8 } }] },
        { label: 'Search the flue', check: { stat: 'luck', dc: 10 },
          outcomes: {
            success: [{ p: 1, text: 'Deeper in: a purse of coin fused to a lump of solder. The King’s change.', fx: { marks: 25, mats: { kings_solder: 1 } } }],
            fail: [{ p: 1, text: 'The flue exhales soot and something’s opinion of you.', fx: { hp: -6 } }]
          } }
      ]
    }
  );

  /* ---------- journal ---------- */
  D.journal.push(
    {
      id: 'page4', title: 'Maren’s Log — Day 9, the Emberdeep', unlock: 'depth4',
      body: 'The furnace levels. Nobody stokes them and they have never gone out. The crews mine the slag rivers at arm’s length and the Maw sells us the heat we work by — I have started counting torches as wages paid to the dark. The exchange rate is honest here too. It is always honest. That is what frightens me.'
    },
    {
      id: 'page5', title: 'Maren’s Log — Day 11', unlock: 'depth5',
      body: 'Met the court today. Choristers, a wight with cathedral lungs, hounds of ember — all of it liveried, all of it working. The Emberdeep is not a wilderness. It is an industry, and we are a rival concern poaching its stock. I have begun leaving payment for what we take. The attacks have grown — politer.'
    },
    {
      id: 'page6', title: 'Maren’s Log — Day 12, margin note', unlock: 'guardian_emberdeep',
      body: 'The Smelted King granted an audience. It sat the whole fight out on its throne and let its crown do the arguing. When the crown broke it thanked us — second time something down here has thanked me for killing it — and the heat below the throne room door changed pitch. The Maw is not a mine, not a market. It is a NEGOTIATION, floor by floor. What in the world did the first charter offer it?'
    }
  );

  /* ---------- barks ---------- */
  D.barks.push(
    { who: 'Petra Kiln', flag: 'depth4', text: 'Slag-iron? You’ve been past the third stair. Forge that hot enough and it works like it’s grateful.' },
    { who: 'Dov Harrow', flag: 'depth4', text: 'Emberdeep crews drink cold ale and don’t sit near the hearth. You’ll see.' },
    { who: 'The Silent Priest', flag: 'guardian_emberdeep', text: '(He sets a second bone bell beside the first, and does not ring it.)' }
  );
})();
