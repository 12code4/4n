/* Delver classes: base stats, skills, flavor. Patches append new classes. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  /*
   * Skill def: { id, name, cost (grit), target: 'enemy'|'allEnemies'|'ally'|'self'|'party',
   *   power: fn(delver)->number (base effect size), desc, kind: 'damage'|'heal'|'ward'|'taunt' }
   * Effects are interpreted by systems/combat.js.
   */
  G.DATA.classes = {
    vanguard: {
      id: 'vanguard', name: 'Vanguard', icon: 'shield',
      desc: 'Holds the line. High vigor; skills protect the party.',
      base: { vig: 30, might: 7, wits: 4, luck: 4 },
      growth: { vig: 4, might: 1.2, wits: 0.5, luck: 0.4 },
      skill: {
        id: 'bulwark', name: 'Bulwark Slam', cost: 2, target: 'enemy', kind: 'damage',
        power: function (d) { return d.stats.might + 4; },
        taunt: 2, // draws attacks for N rounds
        desc: 'Heavy blow; the Vanguard draws enemy attacks for 2 rounds.'
      },
      hue: 210
    },
    scout: {
      id: 'scout', name: 'Scout', icon: 'dagger',
      desc: 'Fast and sharp-eyed. Crits often; best chance to flee clean.',
      base: { vig: 22, might: 5, wits: 7, luck: 8 },
      growth: { vig: 2.5, might: 1, wits: 1.2, luck: 1 },
      skill: {
        id: 'opportunist', name: 'Opportunist Strike', cost: 2, target: 'enemy', kind: 'damage',
        power: function (d) { return d.stats.might + d.stats.luck; },
        critBonus: 0.35,
        desc: 'A precise strike with +35% critical chance.'
      },
      hue: 130
    },
    warden: {
      id: 'warden', name: 'Warden', icon: 'horn', v: 6,
      desc: 'Beast-bond. Fights alongside the Menagerie’s creatures — commands them, amplifies them, and lets a second ride along.',
      base: { vig: 27, might: 6, wits: 5, luck: 5 },
      growth: { vig: 3.4, might: 1.0, wits: 0.7, luck: 0.6 },
      skill: {
        id: 'call_pack', name: 'Call of the Pack', cost: 2, target: 'self', kind: 'command',
        power: function (d) { return 0; },
        desc: 'Command the companion beast to act at once (ignoring its cooldown), and take a ward.'
      },
      passive: 'beastbond', // second beast slot; beast abilities recharge; +50% beast passives
      hue: 160
    },
    alchemist: {
      id: 'alchemist', name: 'Alchemist', icon: 'flask', v: 2,
      desc: 'Brews the Maw into bottles. Mends the whole line; sharpens every bandage.',
      base: { vig: 20, might: 4, wits: 8, luck: 6 },
      growth: { vig: 2.2, might: 0.5, wits: 1.4, luck: 0.8 },
      skill: {
        id: 'field_tonic', name: 'Field Tonic', cost: 2, target: 'party', kind: 'heal',
        power: function (d) { return 4 + Math.round(d.stats.wits * 0.5); },
        desc: 'A shared draught: heals the whole team.'
      },
      passive: 'bandage40', // bandages heal +40% while an Alchemist stands
      hue: 95
    },
    arcanist: {
      id: 'arcanist', name: 'Arcanist', icon: 'orb',
      desc: 'Reads the Maw’s grammar. Area damage and wards.',
      base: { vig: 18, might: 3, wits: 9, luck: 5 },
      growth: { vig: 2, might: 0.4, wits: 1.5, luck: 0.6 },
      skill: {
        id: 'emberlance', name: 'Emberlance', cost: 3, target: 'allEnemies', kind: 'damage',
        power: function (d) { return Math.round(d.stats.wits * 0.9) + 2; },
        desc: 'A lance of comet-fire strikes every enemy.'
      },
      hue: 275
    }
  };
  G.DATA.classList = function () {
    var out = [];
    for (var k in G.DATA.classes) out.push(G.DATA.classes[k]);
    return out;
  };

  /* Traits: one per delver. mod applied at generation or checked by systems. */
  G.DATA.traits = [
    { id: 'greedy', name: 'Greedy', desc: '+15% loot value found, but may pocket a find.', lootMult: 1.15, pocket: 0.06 },
    { id: 'stalwart', name: 'Stalwart', desc: '+4 Vigor.', mod: { vig: 4 } },
    { id: 'keen', name: 'Keen', desc: '+2 Wits.', mod: { wits: 2 } },
    { id: 'lucky', name: 'Lucky', desc: '+2 Luck.', mod: { luck: 2 } },
    { id: 'craven', name: 'Craven', desc: 'Flees well (+15%), -1 Might.', mod: { might: -1 }, fleeBonus: 0.15 },
    { id: 'veteran', name: 'Veteran', desc: '+15% experience earned.', xpMult: 1.15 },
    { id: 'frugal', name: 'Frugal', desc: 'Wage reduced by 1.', wageMod: -1 },
    { id: 'bloodthirsty', name: 'Bloodthirsty', desc: '+2 Might, -1 Luck.', mod: { might: 2, luck: -1 } },
    { id: 'tunnelborn', name: 'Tunnel-born', desc: 'Ignores darkness; never fears the deep.', noDark: true },
    { id: 'superstitious', name: 'Superstitious', desc: 'Reads omens: +2 Luck in events.', eventLuck: 2 }
  ];

  /* Fears: condition key checked by expedition/combat systems. */
  G.DATA.fears = [
    { id: 'dark', name: 'Fears the dark', cond: 'noTorch', desc: 'Shaken when torches run out.' },
    { id: 'beasts', name: 'Fears beasts', cond: 'beast', desc: 'Shaken fighting beasts.' },
    { id: 'ghosts', name: 'Fears the hollow dead', cond: 'undead', desc: 'Shaken fighting the hollow dead.' },
    { id: 'deep', name: 'Fears the deep', cond: 'deep', desc: 'Shaken at depth 3 and below.' },
    { id: 'fire', name: 'Fears fire', cond: 'fire', desc: 'Shaken fighting burning things.' }
  ];
})();
