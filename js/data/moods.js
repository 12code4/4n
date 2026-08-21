/* v4.0 — The Maw's moods: multi-day "weather" coupling the market and the
 * dungeon. One entity, one mood, felt above and below. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  /*
   * mood fx:
   *   marketMult:  ×market prices (the Maw floods or starves the surface)
   *   loot:        ×run loot value
   *   enemy:       ×enemy hp/dmg scaling
   *   fightW:      +weight added to 'fight' nodes in mapgen (can be negative)
   *   eventW:      +weight added to 'event' nodes
   *   torch:       +extra torch burned per passage
   *   drift:       ×market drift amplitude
   */
  D.moods = [
    { id: 'generous', name: 'Generous', glyph: '◉', hue: 45, w: 16,
      blurb: 'The Maw is open-handed — goods everywhere, and cheap. Easy digging, thin margins.',
      fx: { marketMult: 0.85, loot: 1.25, enemy: 0.92, fightW: -4, eventW: 2 } },
    { id: 'restless', name: 'Restless', glyph: '≈', hue: 20, w: 18,
      blurb: 'Something turns over in its sleep. More trouble below, more to find in the churn.',
      fx: { marketMult: 1.0, loot: 1.1, enemy: 1.05, fightW: 6, drift: 1.4 } },
    { id: 'hungry', name: 'Hungry', glyph: '▼', hue: 0, w: 14,
      blurb: 'It wants. Everything below hits harder — and pays richer, for those who survive it.',
      fx: { marketMult: 1.0, loot: 1.4, enemy: 1.18, fightW: 3, torch: 0 } },
    { id: 'holding', name: 'Holding Its Breath', glyph: '·', hue: 210, w: 14,
      blurb: 'The Maw goes still and tight. Goods grow scarce and dear; the dark drinks torches.',
      fx: { marketMult: 1.2, loot: 0.9, enemy: 1.0, fightW: -3, torch: 1, drift: 0.6 } },
    { id: 'dreaming', name: 'Dreaming', glyph: '✧', hue: 275, w: 12,
      blurb: 'It dreams, and the galleries fill with omens. Stranger events, stranger outcomes.',
      fx: { marketMult: 0.95, loot: 1.0, enemy: 0.98, eventW: 10, fightW: -2 } }
  ];
  D.moodById = function (id) { return G.U.byId(D.moods, id) || D.moods[0]; };
})();
