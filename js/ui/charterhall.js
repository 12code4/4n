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
    var subs = [['standings', 'Standings'], ['relics', 'Relics'], ['legends', 'Legends'], ['quests', 'Townsfolk'], ['memorial', 'Memorial'], ['records', 'Records'], ['achieve', 'Deeds']];
    if (G.bld('menagerie')) subs.push(['beasts', 'Menagerie']);
    subs.push(['renewal', 'Renewal']);
    var nav = h('div.tabs');
    subs.forEach(function (s) {
      nav.appendChild(h('button' + (UI.hallSection === s[0] ? '.active' : ''), { text: s[1], onclick: function () { UI.hallSection = s[0]; UI.refresh(); } }));
    });
    panel.appendChild(nav);

    // guard against a vanished section
    var validSec = { standings: 1, relics: 1, legends: 1, quests: 1, memorial: 1, records: 1, achieve: 1, renewal: 1 };
    if (G.bld('menagerie')) validSec.beasts = 1;
    if (!validSec[UI.hallSection]) UI.hallSection = 'standings';

    if (UI.hallSection === 'standings') renderStandings(panel);
    else if (UI.hallSection === 'relics') renderRelics(panel);
    else if (UI.hallSection === 'legends') renderLegends(panel);
    else if (UI.hallSection === 'quests') renderQuests(panel);
    else if (UI.hallSection === 'memorial') renderMemorial(panel);
    else if (UI.hallSection === 'records') renderRecords(panel);
    else if (UI.hallSection === 'beasts') renderBeasts(panel);
    else if (UI.hallSection === 'renewal') renderRenewal(panel);
    else renderAchieve(panel);
  };

  /* v8: the Hall of Legends — unique heroes, their stories, and who has fallen */
  function renderLegends(panel) {
    panel.appendChild(h('p.sub', { text: 'The valley remembers a handful by name. Meet their conditions and they will sign your charter — and if they fall, this hall keeps the tale.' }));
    G.Legends.list().forEach(function (def) {
      var status = G.Legends.status(def.id);
      var tint = { serving: 'var(--good)', fallen: 'var(--bad)', available: 'var(--brass-hi)', locked: 'var(--ink-dim)' }[status];
      var card = h('div.card' + (status === 'serving' ? '.selected' : ''), status === 'locked' ? { style: 'opacity:0.72' } : {});
      card.appendChild(h('div.row', {}, [
        h('span.name', { html: def.name + ' <span class="sub">— ' + UI.esc(def.title) + '</span>' }),
        h('span.sub', { text: status, style: 'color:' + tint })
      ]));
      def.story.forEach(function (para) { card.appendChild(h('p.sub', { text: para, style: 'margin:4px 0' })); });
      if (status === 'available') {
        var err = G.Legends.canRecruit(def.id);
        card.appendChild(h('button.small.primary', { text: 'Sign — ' + def.cost + 'ᵯ', disabled: !!err, title: err || '', onclick: function () { var r = G.Legends.recruit(def.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } }));
        if (err) card.appendChild(h('span.sub', { text: '  ' + err, style: 'margin-left:6px' }));
      } else if (status === 'locked') {
        card.appendChild(h('p.sub', { html: '<b>To find them:</b> ' + UI.esc(def.reqText) + ' — then sign for ' + def.cost + 'ᵯ.', style: 'margin-top:2px' }));
      } else if (status === 'serving') {
        card.appendChild(h('span.pill', { text: 'serving your company' }));
      } else if (status === 'fallen') {
        var g = (G.state.graveyard || []).filter(function (x) { return x.legend === def.id; })[0];
        card.appendChild(h('p.sub', { html: '<b>Fallen</b> — ' + (g ? UI.esc(g.cause) + ', day ' + g.day : 'lost to the Maw') + '.', style: 'margin-top:2px;color:var(--bad)' }));
      }
      panel.appendChild(card);
    });
  }

  /* v8: the Records hall — lifetime numbers, class mastery, and best marks */
  function renderRecords(panel) {
    var st = G.state, s = st.stats;
    panel.appendChild(h('p.sub', { text: 'The company’s whole account, footed and honest.' }));
    var rows = [
      ['Days run', s.daysRun || st.day], ['Expeditions', s.delves || 0], ['Deepest depth', s.deepest || 0],
      ['Deepest Undervault stratum', st.deepRecord || 0], ['Kills', s.kills || 0], ['Delvers lost', s.deaths || 0],
      ['Marks earned', G.U.fmt(s.earned || 0) + 'ᵯ'], ['Marks spent', G.U.fmt(s.spent || 0) + 'ᵯ'],
      ['Contracts filled', s.contractsDone || 0], ['Rival brawls won', s.rivalWins || 0], ['Guardians felled', Object.keys(st.guardiansSlain || {}).length]
    ];
    var grid = h('div', { style: 'display:grid;grid-template-columns:1fr auto;gap:2px 12px;margin:4px 0 10px' });
    rows.forEach(function (r) { grid.appendChild(h('span.sub', { text: r[0] })); grid.appendChild(h('span', { text: '' + r[1], style: 'text-align:right;color:var(--brass-hi)' })); });
    panel.appendChild(grid);
    // class mastery
    if (G.Mastery) {
      panel.appendChild(h('h3', { text: 'Class Mastery' }));
      panel.appendChild(h('p.sub', { text: 'Kills by each class accumulate across every charter, earning permanent, company-wide craft.', style: 'margin-bottom:4px' }));
      ['vanguard', 'scout', 'warden', 'alchemist', 'arcanist'].forEach(function (cls) {
        var tier = G.Mastery.tier(cls), tot = G.Mastery.total(cls), next = G.Mastery.nextAt(cls), lbl = G.Mastery.label(cls);
        var card = h('div.card');
        card.appendChild(h('div.row', {}, [
          h('span.name', { text: G.U.cap(cls) + ' — Mastery ' + tier + '/' + G.Mastery.maxTier() }),
          h('span.sub', { text: lbl || '—' })
        ]));
        card.appendChild(h('p.sub', { text: tot + ' kills' + (next ? ' · next tier at ' + next : ' · mastered'), style: 'margin:2px 0' }));
        panel.appendChild(card);
      });
    }
  }

  function renderBeasts(panel) {
    var st = G.state;
    panel.appendChild(h('p.sub', { text: 'The Menagerie keeps the things the Maw orphans. ' + G.Beasts.owned().length + '/' + G.Beasts.capacity() + ' housed. Pick one to ride along at outfitting.' }));
    if (!G.Beasts.owned().length) { panel.appendChild(h('p', { text: 'No beasts yet. Some deep events let you bring one home — if you have the room.' })); return; }
    G.Beasts.owned().forEach(function (id) {
      var bd = G.DATA.beasts[id];
      var chosen = G.Beasts.isChosen(id);
      var card = h('div.card' + (chosen ? '.selected' : ''));
      card.appendChild(h('div.row', {}, [h('span.name', { text: bd.name }), h('span.sub', { text: chosen ? '◈ in the pack' : '' })]));
      card.appendChild(h('p.sub', { text: bd.desc, style: 'margin:3px 0' }));
      card.appendChild(h('p.sub', { html: '<b>Passive:</b> ' + passiveText(bd.passive) + ' · <b>' + bd.active.name + ':</b> ' + bd.active.desc }));
      var row = h('div.row', { style: 'gap:4px;justify-content:flex-start;margin-top:4px' });
      row.appendChild(h('button.small' + (chosen ? '' : '.primary'), { text: chosen ? 'In pack' : 'Add to pack', onclick: function () { G.Beasts.toggleChosen(id); UI.refresh(); } }));
      row.appendChild(h('button.small', { text: 'Release', onclick: function () { G.Beasts.release(id); UI.refresh(); } }));
      card.appendChild(row);
      panel.appendChild(card);
    });
  }
  function passiveText(p) {
    var b = [];
    if (p.dmg) b.push('+' + p.dmg + ' party damage');
    if (p.loot) b.push('+' + Math.round((p.loot - 1) * 100) + '% loot');
    if (p.flee) b.push('+' + Math.round(p.flee * 100) + '% flee');
    if (p.grit) b.push('+' + p.grit + ' start Grit');
    if (p.heal) b.push('+' + Math.round((p.heal - 1) * 100) + '% healing');
    if (p.scout) b.push('reads the dark ahead');
    return b.join(', ') || 'none';
  }

  function renderRenewal(panel) {
    var st = G.state;
    var leg = st.legacy || { marks: 0, perks: [] };
    panel.appendChild(h('div.card', {}, [
      h('div.row', {}, [h('span.name', { text: 'Legacy Marks' }), h('span.sub', { text: (leg.marks || 0) + ' banked · ' + (leg.charters || 0) + ' charters' })]),
      h('p.sub', { text: 'Retiring the charter banks Legacy Marks and starts a fresh company that inherits the store below — the colours outlive the ledger.' })
    ]));
    // v6: Ascension ladder
    if (G.Ascension) {
      var cur = G.Ascension.tier(), allowed = G.Ascension.maxAllowed();
      var card = h('div.card', { style: 'border-color:hsl(0,50%,45%)' });
      card.appendChild(h('div.row', {}, [h('span.name', { text: 'Ascension' }), h('span.sub', { text: cur > 0 ? 'this charter: ' + G.Ascension.roman(cur) : 'standard charter' })]));
      card.appendChild(h('p.sub', { text: 'Cleared up to Ascension ' + G.Ascension.roman(G.Ascension.maxCleared()) + '. Each renewal may climb one tier higher, stacking a harsh new rule for greater rewards.' }));
      if (cur > 0) {
        var mods = G.Ascension.activeMods();
        card.appendChild(h('p.sub', { html: 'Active: ' + mods.map(function (m) { return '<span class="pill">' + G.Ascension.roman(m.t) + ' ' + UI.esc(m.add) + '</span>'; }).join(' ') }));
      }
      if (allowed >= 1) {
        var next = allowed;
        var nd = G.DATA.ascTier(next);
        card.appendChild(h('p.sub', { html: '<b>Next available: Ascension ' + G.Ascension.roman(next) + ' — ' + nd.name + '.</b> ' + nd.add + (nd.relic ? ' Rewards a relic.' : '') }));
      }
      panel.appendChild(card);
    }
    panel.appendChild(h('div.card', { style: 'border-color:var(--brass)' }, [
      h('p', { html: 'Retiring now would bank <b>' + G.Prestige.retireValue() + '</b> Legacy Marks.' }),
      h('button.danger', {
        text: 'Renew the Charter', style: 'width:100%',
        onclick: function () { UI.showRenewModal(0); }
      })
    ]));
    UI.showRenewModal = function (ascTier) {
      var allowed = G.Ascension ? G.Ascension.maxAllowed() : 0;
      UI.modal(function (m) {
        m.appendChild(h('h2', { text: 'Renew the Charter?' }));
        m.appendChild(h('p', { text: 'The company, roster, buildings and graves stay behind. You bank ' + G.Prestige.retireValue() + ' Legacy Marks and begin a fresh charter — keeping every Legacy perk you have bought.' }));
        if (G.Ascension && allowed >= 1) {
          m.appendChild(h('h3', { text: 'Ascension' }));
          var row = h('div.row', { style: 'gap:4px;justify-content:flex-start;flex-wrap:wrap' });
          for (var t = 0; t <= allowed; t++) {
            (function (tt) {
              row.appendChild(h('button' + (ascTier === tt ? '.primary' : ''), { text: tt === 0 ? 'Standard' : G.Ascension.roman(tt), onclick: function () { UI.showRenewModal(tt); } }));
            })(t);
          }
          m.appendChild(row);
          if (ascTier > 0) { var nd = G.DATA.ascTier(ascTier); m.appendChild(h('p.sub', { html: '<b>' + nd.name + ':</b> every rule up to ' + G.Ascension.roman(ascTier) + ' stacks. Hardest new rule: ' + nd.add })); }
        }
        m.appendChild(h('div.btnrow', {}, [
          h('button.danger', { text: 'Renew' + (ascTier ? ' at Ascension ' + G.Ascension.roman(ascTier) : ''), onclick: function () { G.Prestige.retire(ascTier); UI.closeModal(); UI.townTab = 'company'; UI.screen = 'town'; UI.refresh(); } }),
          h('button', { text: 'Not yet', onclick: UI.closeModal })
        ]));
      });
    };

    panel.appendChild(h('h3', { text: 'Legacy Perks (permanent)' }));
    G.DATA.legacyPerks.forEach(function (p) {
      var owned = G.Prestige.hasPerk(p.id);
      var card = h('div.card' + (owned ? '.selected' : ''));
      card.appendChild(h('div.row', {}, [h('span.name', { text: p.name }), h('span.sub', { text: owned ? 'earned' : p.cost + ' LM' })]));
      card.appendChild(h('p.sub', { text: p.desc, style: 'margin:3px 0' }));
      if (!owned) card.appendChild(h('button.small.primary', { text: 'Buy (' + p.cost + ' LM)', disabled: leg.marks < p.cost, onclick: function () { var r = G.Prestige.buyPerk(p.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } }));
      panel.appendChild(card);
    });
  }

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
      // note set membership on the card
      if (r.set && G.DATA.relicSets && G.DATA.relicSets[r.set]) {
        card.appendChild(h('span.sub', { text: '  · ' + G.DATA.relicSets[r.set].name, style: 'color:hsl(280,55%,72%)' }));
      }
      panel.appendChild(card);
    });

    // v7: relic-set bonuses — show which set tiers are live
    if (G.DATA.relicSets) {
      var anyPiece = G.Relics.owned().some(function (id) { return G.DATA.relics[id] && G.DATA.relics[id].set; });
      if (anyPiece) {
        panel.appendChild(h('h3', { text: 'Set Bonuses' }));
        for (var sid in G.DATA.relicSets) {
          (function (sdef) {
            var slotted = G.Relics.slotted();
            var n = sdef.pieces.filter(function (p) { return slotted.indexOf(p) >= 0; }).length;
            var card = h('div.card' + (n >= 2 ? '.selected' : ''), { style: n >= 2 ? '' : 'opacity:0.7' });
            card.appendChild(h('div.row', {}, [h('span.name', { text: sdef.name }), h('span.sub', { text: n + '/' + sdef.pieces.length + ' slotted' })]));
            if (sdef.bonus2) card.appendChild(h('p.sub', { html: (n >= 2 ? '◈ ' : '○ ') + UI.esc(sdef.bonus2.desc), style: 'margin:2px 0;color:' + (n >= 2 ? 'var(--good)' : 'var(--ink-dim)') }));
            if (sdef.bonus4) card.appendChild(h('p.sub', { html: (n >= 4 ? '◈ ' : '○ ') + UI.esc(sdef.bonus4.desc), style: 'margin:2px 0;color:' + (n >= 4 ? 'var(--good)' : 'var(--ink-dim)') }));
            panel.appendChild(card);
          })(G.DATA.relicSets[sid]);
        }
      }
    }
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
