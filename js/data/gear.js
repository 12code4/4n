/* v2.0 — Gear and forge recipes. Gear lives in the company armory; delvers
 * equip one weapon, one armor, one trinket. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  /*
   * gear def: { id, name, slot: 'weapon'|'armor'|'trinket', tier: 1..3,
   *   atk?, def?, fx?: {crit|flee|xp|loot|luck|gritStart: n},
   *   cost: { marks, mats: {id: qty} }, desc }
   * Forge level gates tier. Value when selling: 60% of marks cost + material value.
   */
  G.DATA.gear = {
    /* --- tier 1 --- */
    glass_knife: {
      id: 'glass_knife', name: 'Glass Knife', slot: 'weapon', tier: 1, atk: 2,
      cost: { marks: 10, mats: { ember_glass: 3 } },
      desc: 'Ember-glass edge. Holds yesterday’s light and a wicked point.'
    },
    iron_maul: {
      id: 'iron_maul', name: 'Grave-Iron Maul', slot: 'weapon', tier: 1, atk: 3,
      cost: { marks: 14, mats: { grave_iron: 3 } },
      desc: 'Heavy, cold, and thoroughly convincing.'
    },
    ore_jack: {
      id: 'ore_jack', name: 'Singing-Ore Jack', slot: 'armor', tier: 1, def: 1,
      cost: { marks: 12, mats: { singing_ore: 3 } },
      desc: 'A quilted jack sewn with humming plates. Blows land a sixth flatter.'
    },
    resin_lamp: {
      id: 'resin_lamp', name: 'Resin Lamp Charm', slot: 'trinket', tier: 1, fx: { flee: 0.08 },
      cost: { marks: 8, mats: { wisp_resin: 2 } },
      desc: 'A never-guttering flame the size of a thumbnail. Exits reveal themselves.'
    },
    luck_knuckle: {
      id: 'luck_knuckle', name: 'Pale Knucklebone', slot: 'trinket', tier: 1, fx: { luck: 2 },
      cost: { marks: 10, mats: { pale_coin: 1, grave_iron: 1 } },
      desc: 'Somebody’s luck, worn smooth. Now it’s yours.'
    },
    /* --- tier 2 --- */
    slag_cleaver: {
      id: 'slag_cleaver', name: 'Slag Cleaver', slot: 'weapon', tier: 2, atk: 5,
      cost: { marks: 30, mats: { slag_iron: 4, ember_glass: 2 } },
      desc: 'Quenched in the Emberdeep. It remembers being molten and resents it.'
    },
    amber_plate: {
      id: 'amber_plate', name: 'Root-Amber Plate', slot: 'armor', tier: 2, def: 2,
      cost: { marks: 28, mats: { root_amber: 3, slag_iron: 2 } },
      desc: 'Amber cuirass. Something inside still moves when you take a hit.'
    },
    salt_band: {
      id: 'salt_band', name: 'Forge-Salt Band', slot: 'trinket', tier: 2, fx: { crit: 0.08 },
      cost: { marks: 24, mats: { forge_salt: 2 } },
      desc: 'Salt of the deep kilns. Sharpens the eye and the edge alike.'
    },
    ledger_charm: {
      id: 'ledger_charm', name: 'Ledger Charm', slot: 'trinket', tier: 2, fx: { loot: 0.15 },
      cost: { marks: 26, mats: { pale_coin: 2, cinderbloom: 2 } },
      desc: 'A tiny brass ledger that always shows a profit. Finds match the entries.'
    },
    /* --- tier 3 --- */
    vel_edge: {
      id: 'vel_edge', name: 'Vel-Edge', slot: 'weapon', tier: 3, atk: 8,
      cost: { marks: 70, mats: { vel_shard: 2, slag_iron: 3 } },
      desc: 'Comet-iron, still falling. Every swing points down.'
    },
    warden_mail: {
      id: 'warden_mail', name: 'Warden’s Mail', slot: 'armor', tier: 3, def: 4,
      cost: { marks: 65, mats: { hollow_pearl: 2, forge_salt: 2, grave_iron: 4 } },
      desc: 'Patterned after the First Warden’s plates. Tolls softly when struck.'
    },
    kings_solder_pin: {
      id: 'kings_solder_pin', name: 'King’s Solder Pin', slot: 'trinket', tier: 3, fx: { gritStart: 2 },
      cost: { marks: 60, mats: { kings_solder: 1 } },
      desc: 'A pin of royal solder. The team starts every fight already resolved.'
    },
    veteran_whetstone: {
      id: 'veteran_whetstone', name: 'Veteran’s Whetstone', slot: 'trinket', tier: 3, fx: { xp: 0.25 },
      cost: { marks: 55, mats: { forge_salt: 2, root_amber: 2 } },
      desc: 'Worn concave by dead experts. Lessons rub off.'
    }
  };
  G.DATA.gearList = function () {
    var out = [];
    for (var k in G.DATA.gear) out.push(G.DATA.gear[k]);
    return out;
  };
  G.DATA.gearValue = function (g) {
    var v = (g.cost.marks || 0) * 0.6;
    for (var id in (g.cost.mats || {})) v += (G.DATA.materials[id] ? G.DATA.materials[id].base : 5) * g.cost.mats[id] * 0.6;
    return Math.round(v);
  };
})();
