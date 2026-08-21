/* v5.0 — The Heart (depth 13): the final descent, the last trade, three endings.
 * A single hand-authored floor gated on the Auricle. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* one material — you don't mine the Heart, but the trials shed a little */
  D.materials.heart_ember = { id: 'heart_ember', name: 'Heart-Ember', base: 90, tier: 3, biome: 'heart',
    desc: 'A coal from the centre of everything. It is not warm. It is the idea of warm.', hue: 45 };

  D.biomes.push({
    id: 'heart', name: 'The Heart', depths: [13, 13],
    tagline: 'Where the beating stops. A chamber, a desk, and a chair pulled out for you.',
    guardian: 'the_heart',
    pal: { bg0: '#0c0a06', bg1: '#2a2416', ink: '#ffe9b0', glow: '#fff2c8', rock: '#2c2618', deep: '#050403' },
    nodeW: {}, // unused — the Heart floor is hand-authored (see Exp.genHeartFloor)
    mats: ['heart_ember', 'held_breath', 'vel_shard', 'a_sentence', 'pulse_gem'],
    hazards: []
  });

  /* Trial enemies: the Heart quotes the biomes you passed, remade in gold-white. */
  D.enemies.echo_warden = {
    id: 'echo_warden', name: 'Echo of the Warden', tags: ['undead'], hp: 60, dmg: [8, 12], spd: 5, crit: 0.08,
    special: 'summon_echo', loot: [{ id: 'heart_ember', p: 0.5, q: [1, 1] }], marks: [10, 20],
    look: { form: 'warden', hue: 48, size: 1.4 },
    desc: 'The First Warden, remembered in gold. It checks your ticket one last time.'
  };
  D.enemies.echo_king = {
    id: 'echo_king', name: 'Echo of the King', tags: ['construct', 'fire'], hp: 70, dmg: [9, 13], spd: 5, crit: 0.1,
    special: 'bleed', loot: [{ id: 'heart_ember', p: 0.5, q: [1, 1] }], marks: [10, 20],
    look: { form: 'king', hue: 46, size: 1.5 },
    desc: 'The Smelted King, its furnace turned to daylight. Still wearing the argument.'
  };
  D.enemies.echo_auricle = {
    id: 'echo_auricle', name: 'Echo of the Auricle', tags: ['beast'], hp: 80, dmg: [10, 14], spd: 7, crit: 0.1,
    special: 'want', loot: [{ id: 'heart_ember', p: 0.5, q: [1, 1] }], marks: [12, 24],
    look: { form: 'auricle', hue: 44, size: 1.6 },
    desc: 'The Auricle, listening in gold. It already knows how this ends. It is curious whether you do.'
  };

  D.enemies.the_heart = {
    id: 'the_heart', name: 'The Heart of the Maw', tags: ['guardian', 'heart'], hp: 320, dmg: [11, 16], spd: 8, crit: 0.1,
    boss: true, rotation: ['strike', 'echo', 'systole', 'strike'],
    loot: [{ id: 'heart_ember', p: 1.0, q: [3, 5] }, { id: 'held_breath', p: 1.0, q: [2, 3] }], marks: [150, 250],
    look: { form: 'heart', hue: 45, size: 2.2 },
    desc: 'Not a monster. A ledger with a pulse. It has been keeping your account since before you signed.'
  };

  /* ---------- the endings ---------- */
  D.endings = {
    seal: {
      id: 'seal', name: 'Seal It', color: 210,
      button: 'Collapse the stair. Let the valley be safe, poor, and quiet.',
      title: 'The Sealing',
      epilogue: [
        'You bring the roof down on the Heart with the last of Maren’s black powder and your own two hands. The beating stops mid-beat. The market, the moods, the strange arithmetic of the deep — all of it goes still, like a held breath finally let out into nothing.',
        'Hollowbrook grows poorer and older and safer. The Lamplit Cellar keeps Maren’s tab open out of habit nobody questions. Petra retires the assay scales; there is nothing left to grade that argues back. The valley forgets, the way valleys do, that it was ever paid in coins minted below.',
        'Vale & Co. becomes a memorial trust. You are its last proprietor and its longest-serving grave-keeper. On clear nights the old rift-scar in the hills gives off no light at all, and you find that is the thing you most wanted, and the thing you cannot quite forgive yourself for wanting.',
        'The Maw doesn’t take. It trades. You are the one who finally refused the deal.'
      ]
    },
    trade: {
      id: 'trade', name: 'Trade With It', color: 45,
      button: 'Sign the charter it offers. Become its licensed counterparty.',
      title: 'The Charter',
      epilogue: [
        'You pull out the chair. You sit. On the desk is a contract in your own handwriting, dated before you were born, and it only wants a countersignature. You give it one.',
        'The partnership is perpetual and the terms are, as ever, scrupulously fair. The Maw supplies; Vale & Co. distributes. Prices stabilise into something almost honest. The moods soften into seasons. Below the Heart a new stair opens — the Vault — and it never runs dry, because you and the Maw are the same balance sheet now, and a balance sheet cannot bankrupt itself.',
        'Hollowbrook prospers past all reason and sense. The delvers grow old and rich and quiet. Nobody asks what the Maw takes in exchange for all it gives, because the answer is written in the ledger everyone signs and nobody reads: a little of the valley, forever, circulating.',
        'The Maw doesn’t take. It trades. And now, so do you — with it, as it, for as long as the account stays open.'
      ]
    },
    become: {
      id: 'become', name: 'Become It', color: 285,
      button: 'Take the keeper’s seat. Finish what Maren started.',
      title: 'The Keeping',
      epilogue: [
        'There is a keeper’s seat, and it has been warm since Maren left it, and you understand at last that she did not fail to come back. She simply took the job. The Heart needs a mind to keep its accounts, and it is patient, and it hires from within.',
        'You descend past the last floor into the place where the beating comes from. Your delvers surface without you and cannot say, ever after, quite what they saw. The company passes to whoever reads your final note — the same note, in the same brown chalk, pinned to the same assay desk.',
        'From inside, the ledger looks different. You feel the whole valley moving through you like blood: every trade, every wage, every small honest exchange. You set the moods now. You mint the coins. When a new proprietor lowers the winch, frightened and broke and hopeful, you find you want, more than anything, to trade fair.',
        'The Maw doesn’t take. It trades. You are what it trades with, now. Find out what they want.'
      ]
    }
  };
})();
