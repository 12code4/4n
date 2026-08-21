/* Delve screens: map navigation, events, peddler, shaft, guardian approach. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  var nodeNames = {
    fight: 'Trouble', event: 'Something…', cache: 'Cache', hazard: 'Hazard',
    rest: 'Hollow', peddler: 'Lantern-light', shaft: 'The Shaft', guardian: 'The Guardian',
    rival: 'Rival Lanterns'
  };
  var nodeHints = {
    fight: 'Movement in the dark. Steel out.',
    event: 'The Maw offers a choice.',
    cache: 'Goods, unguarded. Probably.',
    hazard: 'The passage itself is the enemy.',
    rest: 'A defensible spot to breathe.',
    peddler: 'A deep peddler trades here.',
    shaft: 'A way down — and a way home.',
    guardian: 'Something large keeps this stair.',
    rival: 'Another charter holds the way.'
  };

  function teamStrip(panel) {
    var ex = G.state.expedition;
    G.Exp.team().forEach(function (d) {
      var mhp = G.Delvers.maxHp(d);
      var card = h('div.card', {}, [
        h('div.row', {}, [
          h('span.name', { text: d.name }),
          h('span.sub', { text: G.Delvers.cls(d).name + ' L' + d.lvl })
        ])
      ]);
      var bar = h('div.bar.hp');
      bar.appendChild(h('i', { style: 'width:' + Math.round(100 * d.hp / mhp) + '%' }));
      card.appendChild(bar);
      card.appendChild(h('div.sub', { text: d.hp + '/' + mhp + ' hp' }));
      panel.appendChild(card);
    });
  }

  UI.renderDelve = function (panel) {
    var st = G.state;
    var ex = st.expedition;
    if (!ex) return;
    var biome = G.DATA.biomeForDepth(ex.depth);

    if (ex.mode === 'event') return renderEvent(panel);
    if (ex.mode === 'rival') return UI.renderRival(panel);
    if (ex.mode === 'peddler') return renderPeddler(panel);
    if (ex.mode === 'shaft') return renderShaft(panel);
    if (ex.mode === 'guardian') return renderGuardianApproach(panel);
    if (ex.mode === 'guardian_won') return renderGuardianWon(panel);

    panel.appendChild(h('h2', { text: 'Depth ' + ex.depth + ' — ' + biome.name }));
    panel.appendChild(h('p.sub', { text: biome.tagline }));
    teamStrip(panel);

    var lootVal = 0;
    for (var id in ex.loot) lootVal += G.Economy.price(id) * ex.loot[id];
    panel.appendChild(h('p', { html: 'Carrying goods ~<b>' + G.U.fmt(lootVal) + 'ᵯ</b> and <b>' + ex.marksFound + 'ᵯ</b> coin.' }));
    if (ex.torches <= 0) panel.appendChild(h('p', { html: '<span class="down">The torches are out. The dark charges for passage.</span>' }));

    panel.appendChild(h('h3', { text: 'Choose the way' }));
    var choices = G.Exp.nextChoices();
    if (!choices.length) {
      // Belt-and-braces: a node with no exits (e.g. a guardian node after a flee)
      // should never strand the team. The rope home is always an option.
      panel.appendChild(h('p.sub', { text: 'The passage ahead is sealed. The winch-rope is not.' }));
      panel.appendChild(h('button.primary', {
        text: '▲ Surface with the haul',
        style: 'width:100%;margin-top:6px',
        onclick: function () { G.Exp.surface(); }
      }));
    }
    choices.forEach(function (n) {
      panel.appendChild(h('button.choice', {
        onclick: function () { G.Exp.move(n.id); UI.refresh(); },
        html: '<b>' + nodeNames[n.type] + '</b><span class="sub">' + nodeHints[n.type] + '</span>'
      }));
    });
  };

  function renderEvent(panel) {
    var ex = G.state.expedition;
    var def = G.Exp.eventDef();
    if (!def) { ex.mode = 'map'; UI.refresh(); return; }
    panel.appendChild(h('h2', { text: def.name }));
    if (ex.event.stage === 'choose') {
      panel.appendChild(h('p', { text: def.text }));
      def.choices.forEach(function (c, i) {
        var bits = [];
        if (c.check) bits.push(G.U.cap(c.check.stat) + ' check');
        if (c.cost) {
          for (var k in c.cost) bits.push(c.cost[k] + ' ' + (k === 'marks' ? 'ᵯ' : k));
        }
        var ok = G.Exp.choiceAvailable(c);
        panel.appendChild(h('button.choice', {
          disabled: !ok,
          onclick: function () { G.Exp.chooseEvent(i); UI.refresh(); },
          html: '<b>' + UI.esc(c.label) + '</b>' + (bits.length ? '<span class="sub">' + bits.join(' · ') + '</span>' : '')
        }));
      });
    } else {
      panel.appendChild(h('p', { text: ex.event.outcomeText }));
      panel.appendChild(h('button.primary', {
        text: ex.event.pendingFight ? '⚔ To arms!' : 'Continue',
        style: 'width:100%;margin-top:8px',
        onclick: function () { G.Exp.closeEvent(); UI.refresh(); }
      }));
    }
  }

  function renderPeddler(panel) {
    var st = G.state;
    var ex = st.expedition;
    panel.appendChild(h('h2', { text: 'The Deep Peddler' }));
    panel.appendChild(h('p', { text: 'A tarpaulin stall, a hooded figure, and a lantern that burns without fuel. “Fair rates for the depth,” it repeats, pleasantly.' }));
    panel.appendChild(h('p', { html: 'Funds: <b>' + (st.marks + ex.marksFound) + 'ᵯ</b>' }));
    ['torches', 'rations', 'bandages'].forEach(function (k) {
      var cost = Math.ceil((G.BAL.supplyCost[k] || 2) * 1.6);
      panel.appendChild(h('div.card', {}, [
        h('div.row', {}, [
          h('span', { text: G.U.cap(k) + ' (' + ex[k] + ' held)' }),
          h('button.small', { text: 'Buy — ' + cost + 'ᵯ', onclick: function () { var r = G.Exp.peddlerBuy(k); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } })
        ])
      ]));
    });
    var lootVal = 0;
    for (var id in ex.loot) lootVal += Math.floor(G.Economy.price(id) * 0.7) * ex.loot[id];
    panel.appendChild(h('button', {
      text: 'Sell the whole haul — ' + lootVal + 'ᵯ (70% of market)',
      style: 'width:100%;margin-top:6px',
      disabled: lootVal <= 0,
      onclick: function () { G.Exp.peddlerSellAll(); UI.refresh(); }
    }));
    panel.appendChild(h('button.primary', { text: 'Walk on', style: 'width:100%;margin-top:8px', onclick: function () { G.Exp.leavePeddler(); UI.refresh(); } }));
  }

  function renderShaft(panel) {
    var st = G.state;
    var ex = st.expedition;
    var biome = G.DATA.biomeForDepth(ex.depth);
    panel.appendChild(h('h2', { text: 'The Shaft' }));
    panel.appendChild(h('p', { text: 'A winch-shaft sunk by the first charter. Rope up to the evening sky — or down, into the next breath of the Maw.' }));
    teamStrip(panel);
    if (G.Exp.canDescend()) {
      var nd = ex.depth + 1;
      panel.appendChild(h('button.primary', {
        text: '▼ Descend to depth ' + nd + ' — ' + G.DATA.biomeForDepth(nd).name,
        style: 'width:100%;margin-top:6px',
        onclick: function () { G.Exp.descend(); UI.refresh(); }
      }));
    } else if (ex.depth === biome.depths[1] && !st.guardiansSlain[biome.id]) {
      panel.appendChild(h('p', { html: '<span class="down">Something below refuses the rope. The stair past ' + biome.name + ' has a keeper — find the Guardian node to face it.</span>' }));
    } else if (ex.depth >= G.DATA.maxDepth()) {
      panel.appendChild(h('p.sub', { text: 'The rope ends here — for now. Deeper galleries exist; later charters will open them.' }));
    }
    panel.appendChild(h('button', {
      text: '▲ Surface with the haul',
      style: 'width:100%;margin-top:8px',
      onclick: function () { G.Exp.surface(); }
    }));
  }

  function renderGuardianApproach(panel) {
    var ex = G.state.expedition;
    var biome = G.DATA.biomeForDepth(ex.depth);
    var gdef = G.DATA.enemies[biome.guardian];
    panel.appendChild(h('h2', { text: gdef.name }));
    panel.appendChild(h('p', { text: gdef.desc }));
    panel.appendChild(h('p.sub', { text: 'Beyond it: the stair down, and everything Maren meant to find. Guardians do not forgive half-measures — fleeing this fight is nearly impossible.' }));
    teamStrip(panel);
    panel.appendChild(h('button.danger', {
      text: '⚔ Face ' + gdef.name,
      style: 'width:100%;margin-top:6px;padding:12px',
      onclick: function () { G.Exp.fightGuardian(); UI.refresh(); }
    }));
    panel.appendChild(h('button', {
      text: '▲ Turn back and surface',
      style: 'width:100%;margin-top:8px',
      onclick: function () { G.Exp.surface(); }
    }));
  }

  function renderGuardianWon(panel) {
    var st = G.state;
    var ex = st.expedition;
    var biome = G.DATA.biomeForDepth(ex.depth);
    panel.appendChild(h('h2', { text: 'The Stair Stands Open' }));
    panel.appendChild(h('p', { text: 'The keeper of the ' + biome.name + ' is down. Its post is vacant; its toll uncollected. The winch crews will talk about this for years.' }));
    teamStrip(panel);
    if (G.Exp.canDescend()) {
      var nd = ex.depth + 1;
      panel.appendChild(h('button.primary', {
        text: '▼ Press on to depth ' + nd + ' — ' + G.DATA.biomeForDepth(nd).name,
        style: 'width:100%;margin-top:6px',
        onclick: function () { G.Exp.descend(); UI.refresh(); }
      }));
    } else {
      panel.appendChild(h('p.sub', { text: 'Below this point the Maw is still holding its breath. (Deeper biomes arrive in future charters.)' }));
    }
    panel.appendChild(h('button', {
      text: '▲ Surface in triumph',
      style: 'width:100%;margin-top:8px',
      onclick: function () { G.Exp.surface(); }
    }));
  }
})();
