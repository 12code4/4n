/* v6.0 — Contextual onboarding hints, each shown once. Fired from game events. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var H = (G.Hints = {});

  H.texts = {
    firstHire: 'Tip: delvers draw a wage every dusk. Keep marks in hand — twice unpaid and they walk off the payroll.',
    firstDescent: 'Tip: a Shaft node is always the way home. Every step deeper is a choice — return richer, or push your luck.',
    firstCombat: 'Tip: Grit is shared. Strikes and Guards earn it; Skills spend it. Spend it when it counts.',
    firstDeath: 'Tip: death is permanent. Bandage the badly-hurt, and never be too proud to flee a losing fight.',
    firstContract: 'Tip: contracts pay well over market — fulfil them from your storehouse before they lapse.',
    firstGuardian: 'Tip: a guardian bars the stair to the next biome. Beat it once and the way stays open. Fleeing it is nearly impossible.',
    firstMood: 'Tip: the Maw has moods that move the market AND the dungeon at once. Sell high when it is Holding its Breath; dig when it is Generous.'
  };

  H.fire = function (id) {
    var st = G.state;
    if (!st || (st.daily)) return; // dailies skip tutorial noise
    st.hints = st.hints || {};
    if (st.hints[id]) return;
    var text = H.texts[id];
    if (!text) return;
    st.hints[id] = true;
    G.emit('hint', { id: id, text: text });
  };
})();
