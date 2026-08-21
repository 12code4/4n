/* Expedition events. Choice-driven, stat-checked, outcome-weighted.
 *
 * Event: { id, name, biome|null, minD, maxD, w, text, choices:[choice] }
 * choice: { label, check:{stat,dc}?, cost:{marks|torches|rations|bandages:n}?,
 *           outcomes:[out] | { success:[out], fail:[out] } }
 * out: { p, text, fx }
 * fx: { marks, mats:{id:qty}, hp, hpAll, xp, supplies:{k:n}, fight:'encounter'|[ids],
 *       heal, healAll, lootValue (random biome mats worth ~n), skipRank, recruit }
 * hp applies to the delver who attempted the check (or a random one).
 */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  G.DATA.events = [
    {
      id: 'humming_vein', name: 'The Humming Vein', biome: 'gullet', minD: 1, maxD: 99, w: 12,
      text: 'A vein of singing ore crosses the gallery wall, humming a low sixth. It would take strong arms and no sense of self-preservation to work it loose without props.',
      choices: [
        { label: 'Mine it', check: { stat: 'might', dc: 7 },
          outcomes: {
            success: [{ p: 1, text: 'The vein comes loose in long ringing bars.', fx: { mats: { singing_ore: 3 }, xp: 6 } }],
            fail: [{ p: 0.7, text: 'The roof groans and drops a knuckle of stone.', fx: { hp: -6, mats: { singing_ore: 1 } } },
                   { p: 0.3, text: 'The vein shears — and the wall behind it exhales dust. You leave quickly.', fx: { hp: -3 } }]
          } },
        { label: 'Chip a sample and move on', outcomes: [{ p: 1, text: 'A polite theft. The Maw doesn’t seem to mind.', fx: { mats: { singing_ore: 1 } } }] }
      ]
    },
    {
      id: 'delvers_cairn', name: 'A Delver’s Cairn', minD: 1, maxD: 99, w: 10,
      text: 'A cairn of ember-glass slabs, stacked by careful hands. A rusted pick stands sentry. Whoever lies here was somebody’s payroll once.',
      choices: [
        { label: 'Pay respects', outcomes: [{ p: 1, text: 'You stack one more slab. The gallery feels warmer for a while.', fx: { xp: 4, healAll: 2 } }] },
        { label: 'Search it', check: { stat: 'luck', dc: 6 },
          outcomes: {
            success: [{ p: 1, text: 'Under the slabs: a purse, and no hard feelings you can detect.', fx: { marks: 12, mats: { pale_coin: 1 } } }],
            fail: [{ p: 1, text: 'Under the slabs: a hand. It objects.', fx: { fight: ['hollow_shambler'] } }]
          } }
      ]
    },
    {
      id: 'whispering_coin', name: 'The Whispering Coin', minD: 1, maxD: 99, w: 8,
      text: 'A pale coin sits alone on a shelf of rock, face up. Both faces are up. It is saying something just under hearing.',
      choices: [
        { label: 'Take it', outcomes: [
          { p: 0.75, text: 'It quiets in your pocket. Money usually does.', fx: { mats: { pale_coin: 2 } } },
          { p: 0.25, text: 'It screams. Everything with ears comes to look.', fx: { mats: { pale_coin: 2 }, fight: 'encounter' } }
        ] },
        { label: 'Leave it', outcomes: [{ p: 1, text: 'You leave it mid-sentence. The whisper follows you a while, offended.', fx: { xp: 2 } }] }
      ]
    },
    {
      id: 'rope_bridge', name: 'The Old Rope Bridge', minD: 1, maxD: 99, w: 9,
      text: 'A rope bridge crosses a dark seam in the floor. Maren’s company built these. That was some years and much rot ago.',
      choices: [
        { label: 'Cross carefully', check: { stat: 'wits', dc: 6 },
          outcomes: {
            success: [{ p: 1, text: 'You cross light-footed and shave a long detour off the map.', fx: { skipRank: true, xp: 4 } }],
            fail: [{ p: 1, text: 'A plank gives. The seam is deeper than it looks and lands harder.', fx: { hp: -8 } }]
          } },
        { label: 'Go around', outcomes: [{ p: 1, text: 'The long way is long. Nothing eats you. Business expense: one torch.', fx: { supplies: { torches: -1 } } }] }
      ]
    },
    {
      id: 'chalk_mark', name: 'Maren’s Chalk Mark', minD: 1, maxD: 99, w: 6,
      text: 'On the wall, in surveyor’s chalk gone brown: V&Co — a company blaze, with an arrow pointing down and two words. "STILL FAIR."',
      choices: [
        { label: 'Copy it into the ledger', outcomes: [{ p: 1, text: 'Whatever she meant, she meant it here first. The team walks taller.', fx: { xp: 8 } }] },
        { label: 'Follow the arrow', check: { stat: 'luck', dc: 7 },
          outcomes: {
            success: [{ p: 1, text: 'The arrow ends at a hollow she cut herself. She left stock behind.', fx: { lootValue: 18 } }],
            fail: [{ p: 1, text: 'The arrow ends at a drop. She could climb. You check that you still can’t.', fx: { hp: -4 } }]
          } }
      ]
    },
    {
      id: 'glow_moths', name: 'Glow Moths', minD: 1, maxD: 99, w: 9,
      text: 'A ribbon of glow moths pours down a side passage — the old delver saying goes that moths know where the Maw keeps its purse.',
      choices: [
        { label: 'Follow them', outcomes: [
          { p: 0.55, text: 'The saying holds. The moths ring a cache like a chandelier.', fx: { lootValue: 14 } },
          { p: 0.45, text: 'The saying omits that something else knows the saying too.', fx: { fight: 'encounter' } }
        ] },
        { label: 'Ignore them', outcomes: [{ p: 1, text: 'You keep to the mapped path. The moths keep their secrets.', fx: {} }] }
      ]
    },
    {
      id: 'sleeping_shambler', name: 'A Sleeping Shambler', minD: 1, maxD: 99, w: 9,
      text: 'A hollow shambler stands dormant in an alcove, hands cupped. In the cup: coins, glass, a pearl. Offerings? Toll? Bait?',
      choices: [
        { label: 'Rob it quietly', check: { stat: 'wits', dc: 7 },
          outcomes: {
            success: [{ p: 1, text: 'You empty the cup coin by coin. It never wakes. You feel briefly immortal.', fx: { marks: 10, mats: { hollow_pearl: 1 } } }],
            fail: [{ p: 1, text: 'The last coin clinks. Its eyes were never closed — just empty.', fx: { fight: ['hollow_shambler', 'gravemite'] } }]
          } },
        { label: 'Strike first', outcomes: [{ p: 1, text: 'You take the argument to it. First swing is yours.', fx: { fight: ['hollow_shambler'], firstStrike: true } }] },
        { label: 'Back away', outcomes: [{ p: 1, text: 'Some tolls you pay by not collecting.', fx: {} }] }
      ]
    },
    {
      id: 'tithe_bowl', name: 'The Tithe Bowl', minD: 1, maxD: 99, w: 8,
      text: 'A stone bowl on a stone plinth, worn smooth by ten thousand small payments. The air around it is respectful.',
      choices: [
        { label: 'Pay 5 marks', cost: { marks: 5 },
          outcomes: [{ p: 1, text: 'The marks settle without a sound. The team’s cuts and bruises settle with them.', fx: { healAll: 6 } }] },
        { label: 'Take from it', outcomes: [
          { p: 0.5, text: 'You scoop a handful before your nerve runs out.', fx: { marks: 14 } },
          { p: 0.5, text: 'The respectful air stops being air. A collector arrives.', fx: { fight: ['pale_pilgrim'] } }
        ] },
        { label: 'Pass by', outcomes: [{ p: 1, text: 'You keep your money and your manners.', fx: {} }] }
      ]
    },
    {
      id: 'collapsed_gallery', name: 'The Collapsed Gallery', minD: 1, maxD: 99, w: 8,
      text: 'A fall of rock chokes a gallery mouth. Through the gaps, torchlight lands on something with facets.',
      choices: [
        { label: 'Dig (burn 2 torches for light)', cost: { torches: 2 },
          outcomes: [
            { p: 0.7, text: 'An hour of dust and knuckle-skin. The facets are worth every torch.', fx: { lootValue: 20 } },
            { p: 0.3, text: 'The facets are ember-glass wedged in the teeth of a root maw. It was digesting.', fx: { fight: ['root_maw'], mats: { ember_glass: 2 } } }
          ] },
        { label: 'Note it on the chart and move on', outcomes: [{ p: 1, text: 'Not every door needs opening today.', fx: { xp: 2 } }] }
      ]
    },
    {
      id: 'lost_delver', name: 'The Lost Delver', minD: 1, maxD: 99, w: 6,
      text: 'A stranger sits against the wall with a bad leg and a worse contract — a delver from a failed charter, three days lost in the dark.',
      choices: [
        { label: 'Bandage them (1 bandage)', cost: { bandages: 1 },
          outcomes: [
            { p: 0.65, text: 'They stand, test the leg, and offer the only thing they have: their name on your roster, first month free.', fx: { recruit: true } },
            { p: 0.35, text: 'They stand, test the leg, and press their whole purse on you before limping for the surface.', fx: { marks: 20 } }
          ] },
        { label: 'Point them to the shaft', outcomes: [{ p: 1, text: 'They nod and hobble off. The dark takes note of what you didn’t do.', fx: {} }] }
      ]
    },
    {
      id: 'echo_game', name: 'The Echo Game', minD: 1, maxD: 99, w: 7,
      text: 'This chamber answers speech a half-beat early. Dov’s tavern rules for the Echo Game: ask it a question you don’t know the answer to. Never ask twice.',
      choices: [
        { label: 'Play', check: { stat: 'wits', dc: 8 },
          outcomes: {
            success: [{ p: 1, text: 'The echo answers before you finish. It knows where the floor keeps its cache.', fx: { lootValue: 12, xp: 6 } }],
            fail: [{ p: 1, text: 'You ask twice. The chamber repeats your heartbeat back louder until your nose bleeds.', fx: { hp: -5 } }]
          } },
        { label: 'Keep quiet', outcomes: [{ p: 1, text: 'You cross the chamber in silence. It sulks.', fx: {} }] }
      ]
    },
    {
      id: 'peddlers_cousin', name: 'The Peddler’s Cousin', minD: 2, maxD: 99, w: 6,
      text: 'A tarpaulin, a lantern, a folding table, and a person who insists they are "the peddler’s cousin, entirely different rates." They offer double-or-nothing on a cup game.',
      choices: [
        { label: 'Stake 10 marks', cost: { marks: 10 }, check: { stat: 'luck', dc: 7 },
          outcomes: {
            success: [{ p: 1, text: 'Your eye is faster than the cousin’s hands. They pay out, delighted to have met talent.', fx: { marks: 22 } }],
            fail: [{ p: 1, text: 'The pea was never under any cup. You pay for the lesson.', fx: {} }]
          } },
        { label: 'Decline politely', outcomes: [{ p: 1, text: '"Sensible! Terrible for business, but sensible." They wave you on.', fx: {} }] }
      ]
    }
  ];
})();
