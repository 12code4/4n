/* v3.0 — Delver skill choices. At levels 3, 6, 9 a delver picks 1 of 2 talents
 * for their class. Read in combat.js via G.Delvers.hasTalent(d, id).
 * All v3.0 talents are self-contained (no status effects — those arrive in 4.0). */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  D.talents = {
    vanguard: {
      3: [
        { id: 'wider_shield', name: 'Wider Shield', desc: 'While you Guard, a random ally also takes half damage.' },
        { id: 'iron_taunt', name: 'Iron Taunt', desc: 'Bulwark Slam’s taunt lasts 1 round longer.' }
      ],
      6: [
        { id: 'counterweight', name: 'Counterweight', desc: 'When you Guard, the next attacker takes 3 damage.' },
        { id: 'second_wind', name: 'Second Wind', desc: 'Guarding also heals you 3.' }
      ],
      9: [
        { id: 'unbroken', name: 'Unbroken', desc: 'The first killing blow each fight leaves you at 1 HP.' },
        { id: 'stone_skin', name: 'Stone Skin', desc: 'Permanently reduce all damage you take by 2.' }
      ]
    },
    scout: {
      3: [
        { id: 'first_blood', name: 'First Blood', desc: '+50% damage on the first round of every fight.' },
        { id: 'light_feet', name: 'Light Feet', desc: '+15% flee chance for the whole party.' }
      ],
      6: [
        { id: 'exploit', name: 'Exploit', desc: 'A critical Strike or Skill hits a second time for half.' },
        { id: 'pickpocket', name: 'Pickpocket', desc: 'Each enemy you kill drops +1–2 extra marks.' }
      ],
      9: [
        { id: 'assassinate', name: 'Assassinate', desc: 'Your critical hits deal ×2.25 instead of ×1.75.' },
        { id: 'vanish', name: 'Vanish', desc: 'Once per fight a failed Flee still ends your turn without a counter.' }
      ]
    },
    arcanist: {
      3: [
        { id: 'wide_lance', name: 'Wide Lance', desc: 'Emberlance deals +2 to every target.' },
        { id: 'mend_weave', name: 'Mend-Weave', desc: 'Using your Skill also heals the lowest-HP ally 4.' }
      ],
      6: [
        { id: 'overchannel', name: 'Overchannel', desc: 'Emberlance costs 1 less Grit.' },
        { id: 'siphon', name: 'Siphon', desc: 'Emberlance heals you 1 for each enemy it hits.' }
      ],
      9: [
        { id: 'empower', name: 'Empower', desc: 'Your Skill deals +40% damage.' },
        { id: 'still_point', name: 'Still Point', desc: 'Start each fight with +1 Grit.' }
      ]
    },
    warden: {
      3: [
        { id: 'kindred', name: 'Kindred', desc: 'The companion beast’s passive bonuses are doubled.' },
        { id: 'houndmaster', name: 'Houndmaster', desc: 'Call of the Pack also strikes a random enemy for your Might.' }
      ],
      6: [
        { id: 'two_as_one', name: 'Two as One', desc: 'Beast active abilities recharge a round faster.' },
        { id: 'thick_hide', name: 'Thick Hide', desc: 'Reduce all damage you take by 2 (stacks with armor).' }
      ],
      9: [
        { id: 'alpha', name: 'Alpha', desc: 'A third companion beast may ride along on every expedition.' },
        { id: 'wild_fury', name: 'Wild Fury', desc: 'Whenever a beast acts, the whole party deals +2 damage that round.' }
      ]
    },
    alchemist: {
      3: [
        { id: 'stronger_brew', name: 'Stronger Brew', desc: 'Field Tonic heals +3.' },
        { id: 'acid_flask', name: 'Acid Flask', desc: 'Field Tonic also deals 3 damage to every enemy.' }
      ],
      6: [
        { id: 'deep_draught', name: 'Deep Draught', desc: 'Your bandages heal an extra +3.' },
        { id: 'steady_hands', name: 'Steady Hands', desc: 'The party resists Drowned Scholar curses (halved).' }
      ],
      9: [
        { id: 'revivify', name: 'Revivify Draught', desc: 'Once per expedition, Field Tonic revives a teammate who fell this fight at 1 HP.' },
        { id: 'great_tonic', name: 'Great Tonic', desc: 'Field Tonic heals +50%.' }
      ]
    }
  };

  D.talentChoices = function (cls, lvl) { return (D.talents[cls] && D.talents[cls][lvl]) || null; };
  D.talentLevels = [3, 6, 9];
})();
