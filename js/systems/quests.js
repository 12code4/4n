/* v3.0 — Townsfolk questlines: Petra's coin mystery, Dov's tab, the Priest's list.
 * Each is a small state machine advanced by delivering goods or hitting milestones. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var Q = (G.Quests = {});

  /* stage 0 = not started/available, rising to `done`. */
  Q.defs = {
    petra: {
      name: 'The Minted Coin', who: 'Petra Kiln',
      stages: [
        { text: 'Petra is convinced the pale coins are minted, not found. "Bring me ten and I’ll prove it."',
          need: { pale_coin: 10 }, action: 'Hand over 10 Pale Coins',
          done: 'Petra weighs them, scores them, tastes one. "Identical wear. Both faces. These were struck, not spent."' },
        { text: 'She wants a coin from below the Gullet to compare — "a deeper mint."',
          need: { a_sentence: 1 }, deepReq: 4, action: 'Give her a deep sample',
          done: 'She sets the deep sample beside a pale coin and goes very still. "Same hand. The Maw runs a mint. It’s been paying us in its own currency to keep us digging."' }
      ],
      reward: { renown: 20, perk: 'coin_intel' },
      rewardText: 'Petra shares her assay ledger: you now see which good sells best each day (market “★”). (+20 renown)'
    },
    dov: {
      name: 'Maren’s Tab', who: 'Dov Harrow',
      stages: [
        { text: 'Dov keeps Maren’s tavern tab open "for when she’s back." It has grown. He won’t close it — but he’d let you honor it.',
          need: { marks: 120 }, action: 'Settle the tab (120ᵯ)',
          done: 'Dov pours two and leaves one untouched on the bar. "For her. Word’s out you’re good people. The good ones’ll drink here now."' }
      ],
      reward: { renown: 25, perk: 'veterans_welcome' },
      rewardText: 'The valley’s veterans favor your tavern: the hire pool skews stronger. (+25 renown)'
    },
    priest: {
      name: 'The Priest’s List', who: 'The Silent Priest',
      stages: [
        { text: 'The Silent Priest hands you a bone card listing three things the Maw undervalues: hollow pearls. "Bring three," it seems to say.',
          need: { hollow_pearl: 3 }, action: 'Bring 3 Hollow Pearls',
          done: 'He rings a bell for each pearl and pockets them. The bells keep ringing after he stops.' },
        { text: 'The card grows a second line: a Complete Sentence, from the Archive.',
          need: { a_sentence: 1 }, deepReq: 7, action: 'Bring a Complete Sentence',
          done: 'He reads it, nods once, and for the first time makes a sound — a single held note. The chapel’s cold lifts a degree.' }
      ],
      reward: { renown: 30, perk: 'grave_blessing' },
      rewardText: 'The bone-chapel blesses your fallen: when a delver dies, a share of their experience returns as company renown. (+30 renown)'
    }
  };

  Q.stage = function (id) { return (G.state.quests && G.state.quests[id]) || 0; };
  Q.isDone = function (id) { return Q.stage(id) >= Q.defs[id].stages.length; };
  Q.current = function (id) {
    var def = Q.defs[id], s = Q.stage(id);
    return s < def.stages.length ? def.stages[s] : null;
  };
  Q.available = function (id) {
    // quests appear once the Charter Hall is up (the town's social hub)
    return G.bld('charterhall') > 0 || (G.state.stats.deepest || 1) >= 3;
  };
  Q.canAdvance = function (id) {
    var cur = Q.current(id);
    if (!cur) return false;
    var st = G.state;
    if (cur.deepReq && (st.stats.deepest || 1) < cur.deepReq) return false;
    for (var k in cur.need) {
      if (k === 'marks') { if (st.marks < cur.need[k]) return false; }
      else if ((st.inventory[k] || 0) < cur.need[k]) return false;
    }
    return true;
  };
  Q.advance = function (id) {
    if (!Q.canAdvance(id)) return { ok: false, msg: 'You don’t have what they’re asking for.' };
    var st = G.state, def = Q.defs[id], cur = Q.current(id);
    for (var k in cur.need) {
      if (k === 'marks') { st.marks -= cur.need[k]; st.stats.spent += cur.need[k]; }
      else { st.inventory[k] -= cur.need[k]; if (st.inventory[k] <= 0) delete st.inventory[k]; }
    }
    st.quests[id] = Q.stage(id) + 1;
    G.log(def.who + ': ' + cur.done, 'story');
    if (Q.isDone(id)) {
      if (def.reward.renown) G.Renown.award('quest', def.reward.renown);
      if (def.reward.perk) { st.questPerks = st.questPerks || {}; st.questPerks[def.reward.perk] = true; }
      G.log('Questline complete — ' + def.name + '. ' + def.rewardText, 'good');
    }
    G.emit('quests');
    return { ok: true };
  };
  Q.hasPerk = function (p) { return G.state.questPerks && G.state.questPerks[p]; };
})();
