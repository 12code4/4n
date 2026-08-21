/* v8.0 — Legends of the Maw: hand-authored unique heroes recruited through
 * conditions that thread the whole story, gear enchant affixes, class-mastery
 * tiers, and the true ending. Appends into the data structures. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* ---------- legendary delvers ----------
   * A legend is a delver with fixed strong stats, pre-learned talents, a
   * signature skill (d.skill, read by Delvers.skillOf), a portrait seed, a
   * backstory, and an unlock condition. Recruited (signed) at the Hall of
   * Legends once their condition is met. They can fall like anyone. */
  D.legends = {
    corvo: {
      id: 'corvo', name: 'Corvo One-Arm', cls: 'warden', hue: 160, face: 0x51e6a1,
      base: { vig: 40, might: 12, wits: 7, luck: 7 }, lvl: 9,
      talents: ['houndmaster', 'alpha', 'wild_fury'],
      skill: { id: 'sig_pack', name: 'The Whole Pack', cost: 2, target: 'self', kind: 'command',
        power: function () { return 0; }, desc: 'Loose every companion at once and take a ward — Corvo fights through his beasts.' },
      title: 'the Warden who lost an arm to the First Warden',
      story: [
        'He was the first charter’s beast-keeper, and he was in the Gullet the night the First Warden woke. It took his sword-arm at the shoulder and left him the hand that mattered — the one that whistles the pack home.',
        'He has been down here longer than anyone should survive, feral and courteous, and he will sign with you only once you have gone deeper than he ever managed alone — into the Undervault, where the Court keeps its accounts.'
      ],
      bark: 'One arm’s plenty. The teeth do the arguing.',
      req: function (st) { return (st.deepRecord || 0) >= 1 && (st.inventory.court_signet || 0) >= 1; },
      reqText: 'Reach the Undervault and bring back a Court Signet.', cost: 120
    },
    cartographer_daughter: {
      id: 'cartographer_daughter', name: 'Yove Vantry', cls: 'scout', hue: 190, face: 0x2ab7ff,
      base: { vig: 30, might: 9, wits: 14, luck: 10 }, lvl: 8,
      talents: ['light_feet', 'vanish', 'assassinate'],
      skill: { id: 'sig_quarry', name: 'Mark the Quarry', cost: 2, target: 'enemy', kind: 'strike',
        power: function (d) { return 6 + d.stats.wits; }, critBonus: 0.25, taunt: 2,
        desc: 'Reads a foe’s whole geometry and opens it — heavy, high-crit, and it draws the eye.' },
      title: 'the Cartographer’s daughter, who maps the dark by memory',
      story: [
        'The old surveyor never came up from his last descent; his daughter grew up tracing his charts, filling the blank places with what the returning crews muttered in their sleep. She knows the Maw’s galleries better than the Maw does.',
        'She will walk with a company that keeps a proper Cartographer’s Table — L3, the surveyor’s tools — because it is the only place her father’s hand still writes.'
      ],
      bark: 'There’s always a way through. I’ve seen the map. In here.',
      req: function (st) { return (st.buildings.cartographer || 0) >= 3 && (st.inventory.deep_leaf || 0) >= 3; },
      reqText: 'Raise the Cartographer’s Table to L3 and bring 3 Ledger-Leaf.', cost: 100
    },
    petra_apprentice: {
      id: 'petra_apprentice', name: 'Wick Alder', cls: 'alchemist', hue: 90, face: 0x7ad14f,
      base: { vig: 32, might: 8, wits: 13, luck: 8 }, lvl: 8,
      talents: ['great_tonic', 'deep_draught', 'acid_flask'],
      skill: { id: 'sig_tonic', name: 'The Perfect Tonic', cost: 3, target: 'party', kind: 'heal',
        power: function (d) { return 10 + Math.round(d.stats.wits * 0.8); }, desc: 'Petra’s own recipe, finally right — steadies the entire team, deeply.' },
      title: 'Petra Kiln’s apprentice, who learned the assay by taste',
      story: [
        'Petra grades what the Maw gives up; her apprentice grades what it does to people. They mixed the first tonic that could pull a delver back from the brink of the deep-chill, and then spent a year proving it wasn’t luck.',
        'Once you and Petra have settled the matter of the minted coins — once she trusts your company with the truth of the Maw — she will send her best down the winch with you.'
      ],
      bark: 'Hold still. This tastes like a bell sounds. You’ll thank me.',
      req: function (st) { return G.Quests && G.Quests.isDone('petra') && (st.inventory.cinderbloom || 0) >= 6; },
      reqText: 'Finish Petra’s coin questline and bring 6 Cinderbloom.', cost: 90
    },
    nameless_pilgrim: {
      id: 'nameless_pilgrim', name: 'The Nameless Pilgrim', cls: 'arcanist', hue: 275, face: 0x9a5bff,
      base: { vig: 34, might: 8, wits: 15, luck: 9 }, lvl: 10,
      talents: ['empower', 'wide_lance', 'siphon'],
      skill: { id: 'sig_litany', name: 'The Long Litany', cost: 3, target: 'allEnemies', kind: 'skill',
        power: function (d) { return 7 + Math.round(d.stats.wits * 0.7); }, desc: 'Recites the Maw’s own arithmetic back at it — the whole line takes the sum.' },
      title: 'the pilgrim who walked into the Heart and came back without a name',
      story: [
        'They reached the Heart before you did — walked into the parley, heard the question, and could not answer it. The Heart took their name in lieu of a decision and sent them back up to think it over. They have been thinking ever since.',
        'They will only join a company that has stood where they stood — that has reached the Heart of the Maw and looked the ledger in the eye.'
      ],
      bark: '(They gesture: after you. They have all the time there is.)',
      req: function (st) { return !!(st.guardiansSlain && st.guardiansSlain.heart); },
      reqText: 'Reach the Heart of the Maw.', cost: 150
    }
  };
  D.legendList = function () { var o = []; for (var k in D.legends) o.push(D.legends[k]); return o; };

  /* ---------- gear enchant affixes (v8) ----------
   * Applied to an armory piece via Forge.enchant. fx flows through Forge.fx;
   * 'lifesteal' and 'wardHit' are read as special hooks in combat.js. */
  D.enchants = {
    keen: { id: 'keen', name: 'Keen', slot: 'any', fx: { crit: 0.08 }, desc: '+8% crit chance.' },
    heavy: { id: 'heavy', name: 'Heavy', slot: 'weapon', fx: { atk: 3 }, desc: '+3 weapon damage.' },
    bulwark: { id: 'bulwark', name: 'Bulwark', slot: 'armor', fx: { def: 2 }, desc: '+2 damage reduction.' },
    steady: { id: 'steady', name: 'Steady', slot: 'any', fx: { gritStart: 1 }, desc: '+1 start Grit.' },
    vampiric: { id: 'vampiric', name: 'Vampiric', slot: 'weapon', fx: { lifesteal: 0.25 }, desc: 'Heal 25% of the damage you deal.' },
    warding: { id: 'warding', name: 'Warding', slot: 'armor', fx: { wardHit: 0.18 }, desc: '18% chance to gain a ward when struck.' }
  };
  D.enchantList = function () { var o = []; for (var k in D.enchants) o.push(D.enchants[k]); return o; };
  D.ENCHANT_COST = { marks: 80, mat: 'null_coin', qty: 1 };

  /* ---------- class mastery tiers (v8) ----------
   * Total kills by a class across ALL charters (persisted in the legacy store)
   * earn permanent, tiny, class-wide buffs. */
  D.masteryTiers = [
    { at: 0 }, { at: 40 }, { at: 120 }, { at: 300 }
  ];
  D.masteryFx = {
    vanguard: { key: 'def', per: 1, label: 'damage reduction' },
    scout:    { key: 'crit', per: 0.03, label: 'crit chance' },
    warden:   { key: 'beastDmg', per: 1, label: 'beast damage' },
    alchemist:{ key: 'heal', per: 1, label: 'healing' },
    arcanist: { key: 'skillDmg', per: 1, label: 'skill damage' }
  };

  /* ---------- the true ending (v8) ----------
   * Unlocked once all three Heart endings have been reached across charters
   * (tracked in the legacy store). A fourth answer to Maren's question. */
  D.endings.reckoning = {
    id: 'reckoning', name: 'Reckon With It', color: 130,
    button: 'You have sealed it, traded with it, and become it. Now answer for all three.',
    title: 'The Reckoning',
    epilogue: [
      'You have sat in this chair before — three times, three lives, three different answers, each one true and each one a lie of omission. The Heart knows. It slides across the desk not a blank card this time but the whole account, every charter you have ever run, footed and closed.',
      'You do not seal it, or sign it, or climb into it. You audit it. Line by line you read the Maw its own ledger back — every trade fair and unfair, every delver spent, every coin the valley took and never counted the cost of. And when you reach the last line, you write the figure that was always missing: what it owes.',
      'The beating changes. Not louder — truer. For the first time since the first charter, the Maw and the valley are square. No debt, no lien, no perpetual small circulation of a life. Just a deep place that trades, and a town that trades back, and a company that finally knows the difference between a price and a cost.',
      'The Maw doesn’t take. It trades. And you, at the very end, taught it to keep honest books.'
    ]
  };
})();
