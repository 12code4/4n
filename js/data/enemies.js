/* Enemies of the Gullet. Encounter tables per biome; combat scales hp/dmg slightly by depth. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};
  /*
   * def: { id,name,tags,hp,dmg:[lo,hi],spd,crit, loot:[{id,p,q:[lo,hi]}], marks:[lo,hi],
   *        special, look:{form,hue,size}, desc }
   * specials (combat.js): 'lowest' targets weakest; 'tithe' steals marks; 'slow' acts
   * every other round (double damage); 'summon:<id>' boss call; 'aoe' hits all.
   */
  G.DATA.enemies = {
    gravemite: {
      id: 'gravemite', name: 'Gravemite', tags: ['beast'], hp: 8, dmg: [2, 4], spd: 6, crit: 0.05,
      loot: [{ id: 'grave_iron', p: 0.35, q: [1, 1] }], marks: [1, 2],
      look: { form: 'blob', hue: 220, size: 0.55 },
      desc: 'Knuckle-sized burrower. Eats iron, nests in coffins.'
    },
    hollow_shambler: {
      id: 'hollow_shambler', name: 'Hollow Shambler', tags: ['undead'], hp: 16, dmg: [3, 5], spd: 3, crit: 0.05,
      loot: [{ id: 'pale_coin', p: 0.22, q: [1, 1] }, { id: 'grave_iron', p: 0.3, q: [1, 2] }], marks: [1, 4],
      look: { form: 'tall', hue: 100, size: 1.0 },
      desc: 'A delver-shaped absence wearing a delver-shaped body.'
    },
    glasswing: {
      id: 'glasswing', name: 'Glasswing', tags: ['beast'], hp: 10, dmg: [2, 5], spd: 9, crit: 0.18,
      loot: [{ id: 'ember_glass', p: 0.6, q: [1, 2] }], marks: [1, 3],
      look: { form: 'winged', hue: 28, size: 0.7 },
      desc: 'A moth of ember-glass. Its dust is worth more than your blood, barely.'
    },
    ember_wisp: {
      id: 'ember_wisp', name: 'Ember Wisp', tags: ['fire'], hp: 12, dmg: [4, 6], spd: 7, crit: 0.08,
      special: 'lowest',
      loot: [{ id: 'wisp_resin', p: 0.7, q: [1, 2] }], marks: [1, 3],
      look: { form: 'orb', hue: 20, size: 0.6 },
      desc: 'Burnt air that won’t settle. Seeks the faintest heartbeat.'
    },
    root_maw: {
      id: 'root_maw', name: 'Root Maw', tags: ['beast'], hp: 26, dmg: [7, 11], spd: 2, crit: 0.05,
      special: 'slow',
      loot: [{ id: 'root_amber', p: 0.55, q: [1, 2] }], marks: [2, 5],
      look: { form: 'mass', hue: 40, size: 1.25 },
      desc: 'A stump with opinions. Chews slowly and thoroughly.'
    },
    pale_pilgrim: {
      id: 'pale_pilgrim', name: 'Pale Pilgrim', tags: ['undead'], hp: 14, dmg: [3, 5], spd: 5, crit: 0.05,
      special: 'tithe',
      loot: [{ id: 'pale_coin', p: 0.5, q: [1, 2] }], marks: [3, 8],
      look: { form: 'tall', hue: 0, size: 0.95 },
      desc: 'Walks the galleries collecting. Its bowl is never full.'
    },
    first_warden: {
      id: 'first_warden', name: 'The First Warden', tags: ['undead', 'guardian'], hp: 70, dmg: [6, 9], spd: 5, crit: 0.08,
      boss: true, rotation: ['strike', 'aoe', 'summon:gravemite'],
      loot: [{ id: 'vel_shard', p: 1.0, q: [1, 2] }, { id: 'hollow_pearl', p: 0.8, q: [1, 2] }], marks: [20, 35],
      look: { form: 'warden', hue: 210, size: 1.6 },
      desc: 'It checks tickets at the bottom of the Gullet. Yours are not in order.'
    }
  };

  /* Encounter tables: for a given depth, weighted group templates. */
  G.DATA.encounters = {
    gullet: [
      { w: 30, minD: 1, group: ['gravemite', 'gravemite'] },
      { w: 20, minD: 1, group: ['gravemite', 'gravemite', 'gravemite'] },
      { w: 26, minD: 1, group: ['glasswing'] },
      { w: 20, minD: 1, group: ['hollow_shambler'] },
      { w: 18, minD: 2, group: ['hollow_shambler', 'gravemite'] },
      { w: 16, minD: 2, group: ['ember_wisp', 'glasswing'] },
      { w: 14, minD: 2, group: ['pale_pilgrim'] },
      { w: 12, minD: 2, group: ['root_maw'] },
      { w: 14, minD: 3, group: ['hollow_shambler', 'hollow_shambler'] },
      { w: 12, minD: 3, group: ['pale_pilgrim', 'ember_wisp'] },
      { w: 10, minD: 3, group: ['root_maw', 'gravemite', 'gravemite'] }
    ]
  };
})();
