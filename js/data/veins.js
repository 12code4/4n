/* v4.0 — The Veins (depths 10–12): living tunnels that pulse with light.
 * The Maw stops being a place you're in and becomes a thing you're inside. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* ---------- materials ---------- */
  D.materials.pulse_gem = { id: 'pulse_gem', name: 'Pulse-Gem', base: 22, tier: 3, biome: 'veins',
    desc: 'A gem that keeps a heartbeat. Hold two and they synchronise. Do not hold three.', hue: 340 };
  D.materials.sinew_cord = { id: 'sinew_cord', name: 'Sinew Cord', base: 15, tier: 2, biome: 'veins',
    desc: 'Living rope from the tunnel walls. It flinches. Ropewalkers pay double and sleep poorly.', hue: 355 };
  D.materials.chorus_nectar = { id: 'chorus_nectar', name: 'Chorus Nectar', base: 19, tier: 2, biome: 'veins',
    desc: 'Sap that hums the note you most want to hear. Alchemists distil longing from it.', hue: 320 };
  D.materials.held_breath = { id: 'held_breath', name: 'A Held Breath', base: 60, tier: 3, biome: 'veins',
    desc: 'The Maw’s own inhale, bottled. Warm. Waiting to be let out.', hue: 300 };

  /* ---------- biome ---------- */
  D.biomes.push({
    id: 'veins', name: 'The Veins', depths: [10, 12],
    tagline: 'Living tunnels lit from within, beating slow. You are inside something now.',
    guardian: 'the_auricle',
    pal: { bg0: '#160309', bg1: '#3a0a18', ink: '#ff8fae', glow: '#ff2d6b', rock: '#4a0f1e', deep: '#0c0206' },
    nodeW: { fight: 34, event: 22, cache: 13, hazard: 12, rest: 8, peddler: 5, pulse: 6 },
    mats: ['pulse_gem', 'sinew_cord', 'chorus_nectar', 'held_breath', 'a_sentence', 'vel_shard', 'hollow_pearl'],
    hazards: [
      { name: 'Systole', stat: 'might', text: 'The tunnel contracts around the team like a fist!' },
      { name: 'Wrong note', stat: 'wits', text: 'The walls sing a note that stops thought!' },
      { name: 'Capillary maze', stat: 'luck', text: 'The passage forks into a thousand veins, all wet, all wrong!' }
    ]
  });

  /* ---------- enemies ---------- */
  D.enemies.pulse_leech = {
    id: 'pulse_leech', name: 'Pulse Leech', tags: ['beast'], hp: 20, dmg: [5, 8], spd: 8, crit: 0.1,
    special: 'drain', // heals itself for the damage it deals
    loot: [{ id: 'sinew_cord', p: 0.5, q: [1, 2] }], marks: [2, 6],
    look: { form: 'blob', hue: 350, size: 0.8 },
    desc: 'Fastens to the loudest heartbeat and drinks. Grows warm as you grow cold.'
  };
  D.enemies.marrow_knight = {
    id: 'marrow_knight', name: 'Marrow Knight', tags: ['undead'], hp: 44, dmg: [8, 13], spd: 5, crit: 0.08,
    special: 'bleed', // its cuts leave Bleed
    loot: [{ id: 'pulse_gem', p: 0.35, q: [1, 1] }], marks: [4, 9],
    look: { form: 'warden', hue: 355, size: 1.3 },
    desc: 'Armour grown, not forged. Its blade is one long thorn and it opens what it touches.'
  };
  D.enemies.chorus_of_want = {
    id: 'chorus_of_want', name: 'Chorus of Want', tags: ['undead'], hp: 26, dmg: [4, 7], spd: 6, crit: 0.05,
    special: 'want', // makes a delver skip their next turn (longing)
    loot: [{ id: 'chorus_nectar', p: 0.55, q: [1, 2] }], marks: [3, 8],
    look: { form: 'tall', hue: 320, size: 1.05 },
    desc: 'Sings each delver the life they didn’t take. Some stop to listen. Some never start again.'
  };
  D.enemies.vein_shepherd = {
    id: 'vein_shepherd', name: 'Vein Shepherd', tags: ['beast'], hp: 30, dmg: [6, 10], spd: 4, crit: 0.06,
    special: 'chill', // its touch Chills
    loot: [{ id: 'sinew_cord', p: 0.5, q: [1, 2] }, { id: 'chorus_nectar', p: 0.3, q: [1, 1] }], marks: [3, 8],
    look: { form: 'mass', hue: 345, size: 1.25 },
    desc: 'Herds the smaller wants down the capillaries. Cold as a held breath.'
  };
  D.enemies.clot_golem = {
    id: 'clot_golem', name: 'Clot Golem', tags: ['construct'], hp: 52, dmg: [9, 14], spd: 2, crit: 0.05,
    special: 'slow',
    loot: [{ id: 'pulse_gem', p: 0.5, q: [1, 2] }, { id: 'held_breath', p: 0.06, q: [1, 1] }], marks: [4, 10],
    look: { form: 'mass', hue: 340, size: 1.4 },
    desc: 'A wound the Maw scabbed over and forgot to reabsorb. Slow, vast, and very sore.'
  };
  D.enemies.smaller_wants = {
    id: 'smaller_wants', name: 'The Smaller Wants', tags: ['undead', 'beast'], hp: 14, dmg: [4, 7], spd: 9, crit: 0.14,
    special: 'lowest',
    loot: [{ id: 'chorus_nectar', p: 0.35, q: [1, 1] }], marks: [1, 4],
    look: { form: 'winged', hue: 330, size: 0.65 },
    desc: 'The wants too small to name, travelling in a hungry glitter.'
  };
  D.enemies.the_auricle = {
    id: 'the_auricle', name: 'The Auricle', tags: ['beast', 'guardian'], hp: 185, dmg: [9, 13], spd: 7, crit: 0.1,
    boss: true, rotation: ['strike', 'echo', 'strike', 'systole'],
    loot: [{ id: 'held_breath', p: 1.0, q: [2, 3] }, { id: 'pulse_gem', p: 1.0, q: [2, 4] }, { id: 'vel_shard', p: 0.8, q: [1, 2] }],
    marks: [80, 120],
    look: { form: 'auricle', hue: 340, size: 1.9 },
    desc: 'The Maw’s ear. It has been listening to you delve for years, and it has learned your favourite move.'
  };

  D.encounters.veins = [
    { w: 24, minD: 10, group: ['smaller_wants', 'smaller_wants'] },
    { w: 20, minD: 10, group: ['pulse_leech'] },
    { w: 20, minD: 10, group: ['vein_shepherd', 'smaller_wants'] },
    { w: 16, minD: 10, group: ['chorus_of_want'] },
    { w: 16, minD: 11, group: ['marrow_knight'] },
    { w: 14, minD: 11, group: ['pulse_leech', 'chorus_of_want'] },
    { w: 14, minD: 11, group: ['clot_golem'] },
    { w: 12, minD: 12, group: ['marrow_knight', 'smaller_wants', 'smaller_wants'] },
    { w: 12, minD: 12, group: ['vein_shepherd', 'chorus_of_want'] },
    { w: 10, minD: 12, group: ['clot_golem', 'pulse_leech'] }
  ];

  /* ---------- events (incl. a beast rescue) ---------- */
  D.events.push(
    {
      id: 'orphan_pulse', name: 'A Small, Beating Thing', biome: 'veins', minD: 10, maxD: 99, w: 9,
      text: 'Wedged in a capillary, too small to be a threat and too warm to be stone: a young creature of the Veins, orphaned by whatever the Maw last digested. It watches you with too many eyes and does not run.',
      choices: [
        { label: 'Take it in', outcomes: [{ p: 1, text: 'It clings to a pack-strap and hums. The Menagerie will know what to do with it — if you’ve built one.', fx: { rescueBeast: 'pulse_pup' } }] },
        { label: 'Leave it be', outcomes: [{ p: 1, text: 'You step around it. It keeps watching until the dark takes you both back.', fx: { xp: 4 } }] }
      ]
    },
    {
      id: 'the_listening', name: 'The Listening Wall', biome: 'veins', minD: 10, maxD: 99, w: 9,
      text: 'A wall of shell-pink tissue, cupped like an ear, leaning toward the team. When you speak, it leans closer. It is not hostile. It is *interested*, which is worse.',
      choices: [
        { label: 'Tell it a true thing', check: { stat: 'wits', dc: 12 },
          outcomes: {
            success: [{ p: 1, text: 'You offer it something true and small. It accepts the tithe of honesty and lets a cache well up from the floor.', fx: { lootValue: 34, xp: 8 } }],
            fail: [{ p: 1, text: 'You say too much. The wall repeats your worst secret back in your own voice, and the team’s nerve goes.', fx: { hpAll: -8 } }]
          } },
        { label: 'Keep silent and pass', outcomes: [{ p: 1, text: 'You cross without a word. It leans after you, disappointed, for a long time.', fx: {} }] }
      ]
    },
    {
      id: 'systole_gate', name: 'The Systole Gate', biome: 'veins', minD: 11, maxD: 99, w: 8,
      text: 'The passage ahead is a valve, opening and closing with the Maw’s slow pulse. Time it and you’re through in a heartbeat. Mistime it and you’re part of the wall.',
      choices: [
        { label: 'Time the beat', check: { stat: 'luck', dc: 12 },
          outcomes: {
            success: [{ p: 1, text: 'You go through on the diastole, clean, and shave a long detour.', fx: { skipRank: true, xp: 6 } }],
            fail: [{ p: 1, text: 'The valve closes early. The team scrambles clear with bruised ribs and worse dignity.', fx: { hpAll: -9 } }]
          } },
        { label: 'Wedge it open (2 sinew cords)', cost: {}, require: 'sinew_cord',
          outcomes: [{ p: 1, text: 'You jam living cord into the valve. It holds, resentfully. You walk through its objection.', fx: { skipRank: true } }] }
      ]
    }
  );

  /* ---------- journal ---------- */
  D.journal.push(
    {
      id: 'page10', title: 'Maren’s Log — Day 21, the Veins', unlock: 'depth10',
      body: 'The stone gave way to *this* three days down. It is not a cave. It is an interior. The walls are warm and they beat, slow, and if you press your ear to them you can hear the market — I swear it — the whole valley’s buying and selling, pumped through the Maw like blood. It has been circulating our economy this entire time. We are not trading WITH it. We are a fluid it is running through itself.'
    },
    {
      id: 'page11', title: 'Maren’s Log — Day 23', unlock: 'depth11',
      body: 'The margin of this page is not my handwriting. Something has been answering my notes. Where I wrote "what does it want" it wrote, underneath, in the same brown chalk I use: "the same thing you want. To be paid what it is owed." I have stopped writing questions. It keeps answering them anyway.'
    },
    {
      id: 'page12', title: 'Maren’s Log — Day 24, at the Auricle', unlock: 'guardian_veins',
      body: 'The Auricle is an ear the size of a chapel and it knows my whole delving life by heart — every move I favour, it makes back at me first. To beat it you must fight unlike yourself, and I have never in my life managed to be anyone else. Below it the beating stops. There is a chamber where the Maw keeps its heart, and a desk, and I think my own chair pulled out and waiting. It has been keeping my seat warm. Whoever you are, reading this: it will offer you the same chair. Decide now what the company is FOR, because down there it stops being rhetorical.'
    }
  );

  D.barks.push(
    { who: 'Petra Kiln', flag: 'depth10', text: 'Pulse-gems. I put two on the assay bench and my own heart started keeping their time. Bring me no more than two at once. Promise me.' },
    { who: 'Dov Harrow', flag: 'depth10', text: 'The crews that come up from the Veins don’t talk for a day. Then they talk too much. I keep the back room warm for them.' },
    { who: 'The Silent Priest', flag: 'guardian_veins', text: '(He rings every bell he owns at once, and for the first time looks afraid.)' }
  );
})();
