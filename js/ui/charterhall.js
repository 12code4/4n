/* v3.0 UI — Charter Hall tab: standings, renown, relics, questlines, memorial.
 * Also the talent-choice modal and rival-encounter panel. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  UI.hallSection = 'standings';

  UI.renderCharterHall = function (panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Charter Hall' }));
    if (!G.bld('charterhall')) {
      panel.appendChild(h('p', { text: 'A bare hall. Raise the Charter Hall (Build tab) to hang the company colours, track the rival charters, honor the fallen, and bear relics.' }));
      return;
    }
    // sub-nav
    var subs = [['standings', 'Standings'], ['relics', 'Relics'], ['quests', 'Townsfolk'], ['memorial', 'Memorial'], ['achieve', 'Deeds']];
    var nav = h('div.tabs');
    subs.forEach(function (s) {
      nav.appendChild(h('button' + (UI.hallSection === s[0] ? '.active' : ''), { text: s[1], onclick: function () { UI.hallSection = s[0]; UI.refresh(); } }));
    });
    panel.appendChild(nav);

    if (UI.hallSection === 'standings') renderStandings(panel);
    else if (UI.hallSection === 'relics') renderRelics(panel);
    else if (UI.hallSection === 'quests') renderQuests(panel);
    else if (UI.hallSection === 'memorial') renderMemorial(panel);
    else renderAchieve(panel);
  };

  function renderStandings(panel) {
    var st = G.state;
    var tier = G.Renown.tier(), next = G.Renown.nextTier();
    panel.appendChild(h('div.card', {}, [
      h('div.row', {}, [h('span.name', { text: tier.name }), h('span.sub', { text: G.Renown.total() + ' renown' })]),
      h('p.sub', { text: tier.blurb, style: 'margin-top:4px' }),
      next ? (function () {
        var bar = h('div.bar.xp'); bar.appendChild(h('i', { style: 'width:' + Math.round(100 * (G.Renown.total() - tier.at) / (next.at - tier.at)) + '%' }));
        return bar;
      })() : h('span.sub', { text: 'Highest tier reached.' }),
      next ? h('p.sub', { text: (next.at - G.Renown.total()) + ' to ' + next.name }) : null
    ]));

    panel.appendChild(h('h3', { text: 'The Charters' }));
    G.Rivals.init();
    var intel = G.bld('charterhall') >= 2;
    // player row
    panel.appendChild(chartRow('Vale & Co. (you)', G.Renown.total(), st.stats.deepest || 1, true));
    st.rivals.forEach(function (r) {
      var def = G.Rivals.def(r.id);
      panel.appendChild(chartRow(def.name, intel ? r.renown : '???', intel ? r.depth : '?', false, def.blurb));
    });
    if (!intel) panel.appendChild(h('p.sub', { text: 'Upgrade the Charter Hall (L2) for rival intel — their depth and renown.' }));

    // claims
    var anyClaim = false;
    G.DATA.biomes.forEach(function (b) { if (st.claims[b.id]) anyClaim = true; });
    if (anyClaim) {
      panel.appendChild(h('h3', { text: 'Depth Claims' }));
      G.DATA.biomes.forEach(function (b) {
        var owner = st.claims[b.id];
        if (!owner) return;
        var who = owner === 'player' ? 'Vale & Co.' : G.Rivals.def(owner).name;
        panel.appendChild(h('p.sub', { html: b.name + ' — claimed by <b>' + who + '</b>' + (owner === 'player' ? ' <span class="pill">+5% sell</span>' : '') }));
      });
    }
  }
  function chartRow(name, renown, depth, you, blurb) {
    var card = h('div.card' + (you ? '.selected' : ''));
    card.appendChild(h('div.row', {}, [h('span.name', { text: name }), h('span.sub', { text: 'depth ' + depth + ' · ' + renown + ' rn' })]));
    if (blurb) card.appendChild(h('p.sub', { text: blurb, style: 'font-style:italic;margin-top:2px' }));
    return card;
  }

  function renderRelics(panel) {
    var st = G.state;
    var slots = G.Relics.slots();
    panel.appendChild(h('p.sub', { text: 'Relics are company-wide passives with a real cost. Slotted: ' + G.Relics.slotted().length + '/' + slots + '.' }));
    if (!G.Relics.owned().length) {
      panel.appendChild(h('p', { text: 'No relics yet. Guardians give up their keepsakes when they fall; some deep events do too.' }));
      return;
    }
    G.Relics.owned().forEach(function (id) {
      var r = G.DATA.relics[id];
      var on = G.Relics.slotted().indexOf(id) >= 0;
      var card = h('div.card' + (on ? '.selected' : ''));
      card.appendChild(h('div.row', {}, [h('span.name', { text: r.name }), h('span.sub', { text: on ? '◈ slotted' : '' })]));
      card.appendChild(h('p.sub', { text: r.desc, style: 'margin:4px 0' }));
      card.appendChild(h('button.small' + (on ? '' : '.primary'), {
        text: on ? 'Unslot' : 'Slot',
        onclick: function () {
          if (on) G.Relics.unslot(id);
          else { var res = G.Relics.slot(id); if (!res.ok) UI.toast(res.msg, 'bad'); }
          UI.refresh();
        }
      }));
      panel.appendChild(card);
    });
  }

  function renderQuests(panel) {
    var st = G.state;
    for (var id in G.Quests.defs) {
      (function (id) {
        var def = G.Quests.defs[id];
        var card = h('div.card');
        card.appendChild(h('div.row', {}, [h('span.name', { text: def.name }), h('span.sub', { text: def.who })]));
        if (G.Quests.isDone(id)) {
          card.appendChild(h('p.sub', { html: '<span class="up">✓ Complete.</span> ' + def.rewardText }));
        } else {
          var cur = G.Quests.current(id);
          card.appendChild(h('p.sub', { text: cur.text, style: 'margin:4px 0' }));
          var needBits = [];
          for (var k in cur.need) needBits.push(cur.need[k] + '× ' + (k === 'marks' ? 'marks' : G.DATA.materials[k].name));
          if (cur.deepReq) needBits.push('depth ' + cur.deepReq + '+ reached');
          card.appendChild(h('p.sub', { text: 'Needs: ' + needBits.join(', ') }));
          card.appendChild(h('button.small.primary', {
            text: cur.action, disabled: !G.Quests.canAdvance(id),
            onclick: function () { var r = G.Quests.advance(id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
          }));
        }
        panel.appendChild(card);
      })(id);
    }
  }

  function renderMemorial(panel) {
    var st = G.state;
    panel.appendChild(h('p.sub', { text: 'The wall of names. Honor a fallen delver (' + G.Renown.honorCost() + 'ᵯ) for lasting renown.' }));
    if (!st.graveyard.length) { panel.appendChild(h('p', { text: 'No names yet. Keep it that way as long as you can.' })); return; }
    st.graveyard.slice().reverse().forEach(function (gv) {
      var idx = st.graveyard.indexOf(gv);
      var card = h('div.card');
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: '✝ ' + gv.name }),
        h('span.sub', { text: G.DATA.classes[gv.cls].name + ' L' + gv.lvl + ' · d' + gv.day })
      ]));
      card.appendChild(h('p.sub', { text: '“' + gv.epitaph + '” — ' + gv.cause, style: 'font-style:italic;margin:3px 0' }));
      if (gv.honored) card.appendChild(h('span.pill', { text: 'honored' }));
      else card.appendChild(h('button.small', { text: 'Honor (' + G.Renown.honorCost() + 'ᵯ)', disabled: st.marks < G.Renown.honorCost(), onclick: function () { var r = G.Renown.honor(idx); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } }));
      panel.appendChild(card);
    });
  }

  function renderAchieve(panel) {
    var st = G.state;
    var got = st.achievements || [];
    panel.appendChild(h('p.sub', { text: 'Deeds of the company — ' + got.length + '/' + G.DATA.achievements.length + '.' }));
    G.DATA.achievements.forEach(function (a) {
      var has = got.indexOf(a.id) >= 0;
      panel.appendChild(h('div.card', has ? { style: 'border-color:rgba(155,224,138,0.4)' } : { style: 'opacity:0.6' }, [
        h('div.row', {}, [h('span.name', { text: (has ? '★ ' : '☆ ') + a.name }), h('span.sub', { text: has ? 'earned' : '' })]),
        h('p.sub', { text: a.desc, style: 'margin-top:2px' })
      ]));
    });
  }

  /* ---------- talent choice modal ---------- */
  UI.showTalentChoice = function (delverId) {
    var d = G.Delvers.get(delverId);
    if (!d || !d.pendingTalents || !d.pendingTalents.length) return;
    var lvl = d.pendingTalents[0];
    var choices = G.DATA.talentChoices(d.cls, lvl) || [];
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: d.name + ' — Level ' + lvl + ' Talent' }));
      m.appendChild(h('p.sub', { text: 'Choose one. This is permanent.' }));
      choices.forEach(function (c) {
        m.appendChild(h('button.choice', {
          onclick: function () { G.Delvers.chooseTalent(delverId, lvl, c.id); UI.closeModal(); if (d.pendingTalents.length) UI.showTalentChoice(delverId); else UI.refresh(); },
          html: '<b>' + UI.esc(c.name) + '</b><span class="sub">' + UI.esc(c.desc) + '</span>'
        }));
      });
    }, { dismiss: false });
  };

  /* ---------- rival encounter panel ---------- */
  UI.renderRival = function (panel) {
    var ex = G.state.expedition;
    var def = G.Exp.rivalDef();
    if (!def) { ex.mode = 'map'; UI.refresh(); return; }
    panel.appendChild(h('h2', { text: def.name }));
    panel.appendChild(h('p', { text: def.blurb }));
    panel.appendChild(h('p.sub', { text: 'Their lanterns block the way. How do you handle a rival crew this deep?' }));
    panel.appendChild(h('button.choice', { onclick: function () { G.Exp.rivalTrade(); UI.refresh(); },
      html: '<b>Trade</b><span class="sub">Sell your whole haul to them at 85% of market — better than a peddler.</span>' }));
    panel.appendChild(h('button.choice', { onclick: function () { var r = G.Exp.rivalWager(); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); },
      html: '<b>Wager for map intel</b><span class="sub">Pay ' + (8 + ex.depth * 2) + 'ᵯ to slip past the next stair unseen.</span>' }));
    panel.appendChild(h('button.choice.danger', { onclick: function () { G.Exp.rivalBrawl(); UI.refresh(); },
      html: '<b>Brawl for the stair</b><span class="sub">Non-lethal — winner takes loot & renown, loser drops some haul. Nobody dies.</span>' }));
    panel.appendChild(h('button', { text: 'Back away', style: 'width:100%;margin-top:8px', onclick: function () { G.Exp.leaveRival(); UI.refresh(); } }));
  };
})();
