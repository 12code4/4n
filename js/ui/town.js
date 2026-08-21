/* Town screen: Company / Tavern / Market / Build tabs, and expedition outfitting. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  UI.townTab = 'company';
  UI.sel = { team: [], depth: 1 };

  function tabs(panel) {
    var names = [['company', 'Company'], ['tavern', 'Tavern'], ['market', 'Market'], ['build', 'Build']];
    if (G.bld('forge')) names.push(['forge', 'Forge']);
    if (G.bld('contracts')) names.push(['contracts', 'Contracts']);
    var row = h('div.tabs');
    names.forEach(function (n) {
      row.appendChild(h('button' + (UI.townTab === n[0] ? '.active' : ''), {
        text: n[1],
        onclick: function () { UI.townTab = n[0]; UI.refresh(); }
      }));
    });
    panel.appendChild(row);
  }

  function delverCard(d, opts) {
    opts = opts || {};
    var cls = G.Delvers.cls(d);
    var trait = G.Delvers.trait(d);
    var fear = G.Delvers.fear(d);
    var mhp = G.Delvers.maxHp(d);
    var card = h('div.card' + (opts.selected ? '.selected' : ''), opts.onclick ? { onclick: opts.onclick, style: 'cursor:pointer' } : {});
    card.appendChild(h('div.row', {}, [
      h('span.name', { text: d.name }),
      h('span.sub', { text: cls.name + ' L' + d.lvl })
    ]));
    card.appendChild(h('div.statline', { html: 'VIG <b>' + d.stats.vig + '</b> · MGT <b>' + d.stats.might + '</b> · WIT <b>' + d.stats.wits + '</b> · LCK <b>' + d.stats.luck + '</b>' }));
    var bar = h('div.bar.hp');
    bar.appendChild(h('i', { style: 'width:' + Math.round(100 * d.hp / mhp) + '%' }));
    card.appendChild(bar);
    card.appendChild(h('div.sub', { text: d.hp + '/' + mhp + ' hp — ' + trait.name + ' · ' + fear.name.toLowerCase() }));
    // XP bar
    var xpb = h('div.bar.xp');
    xpb.appendChild(h('i', { style: 'width:' + Math.round(100 * d.xp / G.Delvers.xpNeed(d)) + '%' }));
    card.appendChild(xpb);
    // gear glyphs
    if (G.Forge) {
      var gear = G.Forge.gearOf(d);
      if (gear.length) {
        card.appendChild(h('div.sub', { html: gear.map(function (g) { return '<span class="pill">' + g.name + '</span>'; }).join(' ') }));
      }
    }
    // injury flag
    if (d.injury) {
      var inj = G.U.byId(G.DATA.injuries, d.injury.id);
      card.appendChild(h('div.sub', { html: '<span class="down">✚ ' + (inj ? inj.name : 'Injured') + ' (' + Math.max(0, d.injury.healDay - G.state.day) + 'd)</span>' }));
    }
    if (opts.extra) card.appendChild(opts.extra);
    return card;
  }
  UI.delverCard = delverCard;

  /* ================= COMPANY ================= */
  function renderCompany(panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Vale & Co.' }));

    var bark = G.DATA.barks.filter(function (b) { return !b.flag || st.flags[b.flag]; })[st.ui.bark % G.DATA.barks.length] || G.DATA.barks[0];
    panel.appendChild(h('div.bark', { html: '<b>' + bark.who + ':</b> ' + UI.esc(bark.text) }));

    var roster = G.Delvers.roster();
    panel.appendChild(h('h3', { text: 'Roster (' + roster.length + ')' }));
    if (!roster.length) panel.appendChild(h('p.sub', { text: 'Nobody on the payroll. The tavern has people who want to change that.' }));
    roster.forEach(function (d) {
      var extra = h('div.row', { style: 'margin-top:5px' }, [
        h('span.sub', { text: 'wage ' + G.Delvers.wage(d) + 'ᵯ/day' + (d.freeDays ? ' (free ' + d.freeDays + 'd)' : '') }),
        h('button.small', { text: 'Dismiss', onclick: function (ev) { ev.stopPropagation(); G.Delvers.dismiss(d.id); UI.refresh(); } })
      ]);
      panel.appendChild(delverCard(d, { extra: extra }));
    });

    panel.appendChild(h('h3', { text: 'Supplies' }));
    var s = st.supplies;
    ['rations', 'torches', 'bandages'].forEach(function (k) {
      var cost = G.BAL.supplyCost[k];
      panel.appendChild(h('div.card', {}, [
        h('div.row', {}, [
          h('span', { text: G.U.cap(k) + ': ' + s[k] }),
          h('span', {}, [
            h('button.small', { text: 'Buy 1 (' + cost + 'ᵯ)', onclick: function () { var r = G.Economy.buySupply(k, 1); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } }),
            h('button.small', { text: '×5', style: 'margin-left:4px', onclick: function () { var r = G.Economy.buySupply(k, 5); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } })
          ])
        ])
      ]));
    });

    panel.appendChild(h('hr.divider'));
    var canGo = roster.length > 0;
    panel.appendChild(h('button.primary', {
      text: '⛏ Outfit an Expedition',
      style: 'width:100%;padding:12px;font-size:15px',
      disabled: !canGo,
      onclick: function () { UI.sel.team = []; UI.sel.depth = Math.min(st.unlockedStart, UI.sel.depth || 1); UI.screen = 'outfit'; UI.refresh(); }
    }));
    if (!canGo) panel.appendChild(h('p.sub', { text: 'You need at least one delver.', style: 'margin-top:4px' }));

    if (st.graveyard.length) {
      panel.appendChild(h('h3', { text: 'Graveyard (' + st.graveyard.length + ')' }));
      st.graveyard.slice(-4).reverse().forEach(function (gv) {
        panel.appendChild(h('p.sub', { text: '✝ ' + gv.name + ', ' + G.DATA.classes[gv.cls].name + ' L' + gv.lvl + ' — d' + gv.day + '. “' + gv.epitaph + '”' }));
      });
    }
  }

  /* ================= TAVERN ================= */
  function renderTavern(panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'The Lamplit Cellar' }));
    if (!st.buildings.tavern) {
      panel.appendChild(h('p', { text: 'Dov runs hiring out of the cellar doorway for now. Build the tavern proper and better delvers will come.' }));
    }
    var bark = G.DATA.barks[1 + (st.day % 3)];
    panel.appendChild(h('div.bark', { html: '<b>Dov Harrow:</b> ' + UI.esc('Looking to hire? These are today’s faces.') }));
    if (!st.tavernPool.length) panel.appendChild(h('p.sub', { text: 'Nobody drinking today. Come back tomorrow.' }));
    st.tavernPool.forEach(function (d, i) {
      var cost = G.Delvers.hireCost(d);
      var extra = h('div.row', { style: 'margin-top:5px' }, [
        h('span.sub', { text: 'wage ' + G.Delvers.wage(d) + 'ᵯ/day' }),
        h('button.small.primary', { text: 'Hire — ' + cost + 'ᵯ', disabled: st.marks < cost, onclick: function () { var r = G.Delvers.hire(i); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); } })
      ]);
      panel.appendChild(delverCard(d, { extra: extra }));
    });
    panel.appendChild(h('p.sub', { text: 'The pool turns over each day. Tavern level raises how many come, and how good.' }));
  }

  /* ================= MARKET ================= */
  function renderMarket(panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Market & Stores' }));
    // active news ticker
    if (st.marketEvents && st.marketEvents.length) {
      st.marketEvents.forEach(function (ev) {
        panel.appendChild(h('div.bark', { html: '📰 ' + UI.esc(ev.head) + ' <span class="sub">(' + (ev.until - st.day + 1) + 'd left)</span>' }));
      });
    }
    var inv = st.inventory;
    var table = h('table.mkt');
    table.appendChild(h('tr', {}, [
      h('th', { text: 'Good' }), h('th.r', { text: 'Held' }), h('th.r', { text: 'Price' }), h('th.r', { text: '' })
    ]));
    var anyRow = false;
    G.DATA.materialList().forEach(function (m) {
      var qty = inv[m.id] || 0;
      var price = G.Economy.sellPrice(m.id);
      var cur = G.Economy.price(m.id);
      var prev = (st.marketPrev && st.marketPrev[m.id]) || cur;
      var dir = cur > prev ? '<span class="up">▲</span>' : (cur < prev ? '<span class="down">▼</span>' : '·');
      if (qty === 0 && m.tier > 1) return; // keep list short until goods appear
      anyRow = true;
      var shocked = Math.abs(G.Economy.shockMult(m.id) - 1) > 0.01;
      var tr = h('tr', { title: m.desc });
      tr.appendChild(h('td', { html: m.name + ' <span class="sub">' + dir + '</span>' + (shocked ? ' <span class="pill">news</span>' : '') }));
      tr.appendChild(h('td.r', { text: qty ? qty : '—' }));
      tr.appendChild(h('td.r', { html: '<b>' + price + '</b>ᵯ' }));
      var td = h('td.r');
      if (qty > 0) {
        td.appendChild(h('button.small', { text: 'Sell', onclick: function () { G.Economy.sell(m.id, 1); UI.refresh(); } }));
        if (qty > 1) td.appendChild(h('button.small', { text: 'All', style: 'margin-left:3px', onclick: function () { G.Economy.sell(m.id, qty); UI.refresh(); } }));
      }
      tr.appendChild(td);
      table.appendChild(tr);
    });
    panel.appendChild(table);
    if (!anyRow) panel.appendChild(h('p.sub', { text: 'Nothing in the storehouse yet. The Maw has plenty.' }));
    panel.appendChild(h('p.sub', { style: 'margin-top:8px', text: 'Prices drift daily and sag if you flood the market. The shopfront also sells a few goods on its own each day — at a premium.' }));
    var totVal = 0;
    for (var id in inv) totVal += G.Economy.price(id) * inv[id];
    panel.appendChild(h('p', { html: 'Stock value at market: <b>' + G.U.fmt(totVal) + 'ᵯ</b>' }));
  }

  /* ================= BUILD ================= */
  function renderBuild(panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Company Grounds' }));
    G.DATA.buildingList().forEach(function (b) {
      var lvl = st.buildings[b.id] || 0;
      var maxed = lvl >= b.costs.length;
      var cost = maxed ? null : b.costs[lvl];
      var card = h('div.card');
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: b.name }),
        h('span.sub', { text: lvl ? 'L' + lvl : 'not built' })
      ]));
      card.appendChild(h('p.sub', { text: b.desc, style: 'margin:4px 0' }));
      card.appendChild(h('p.sub', { html: (lvl ? '<b>Now:</b> ' + b.levels[lvl - 1] + '<br>' : '') + (!maxed ? '<b>Next:</b> ' + b.levels[lvl] : '<b>Fully built.</b>') }));
      if (!maxed) {
        card.appendChild(h('button.primary.small', {
          text: (lvl ? 'Upgrade' : 'Build') + ' — ' + cost + 'ᵯ',
          style: 'margin-top:6px',
          disabled: st.marks < cost,
          onclick: function () { var r = G.Economy.build(b.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
        }));
      }
      panel.appendChild(card);
    });
  }

  UI.renderTown = function (panel) {
    // a tab may vanish (e.g. building not yet built); fall back to Company
    var valid = { company: 1, tavern: 1, market: 1, build: 1 };
    if (G.bld('forge')) valid.forge = 1;
    if (G.bld('contracts')) valid.contracts = 1;
    if (!valid[UI.townTab]) UI.townTab = 'company';
    tabs(panel);
    if (UI.townTab === 'company') renderCompany(panel);
    else if (UI.townTab === 'tavern') renderTavern(panel);
    else if (UI.townTab === 'market') renderMarket(panel);
    else if (UI.townTab === 'forge') UI.renderForge(panel);
    else if (UI.townTab === 'contracts') UI.renderContracts(panel);
    else renderBuild(panel);
  };

  /* ================= OUTFIT ================= */
  UI.renderOutfit = function (panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Outfit the Expedition' }));
    panel.appendChild(h('p.sub', { text: 'Pick up to ' + G.BAL.teamMax + '. The team carries all company supplies; what they don’t burn comes home.' }));

    panel.appendChild(h('h3', { text: 'Team' }));
    G.Delvers.roster().forEach(function (d) {
      var selected = UI.sel.team.indexOf(d.id) >= 0;
      panel.appendChild(UI.delverCard(d, {
        selected: selected,
        onclick: function () {
          var i = UI.sel.team.indexOf(d.id);
          if (i >= 0) UI.sel.team.splice(i, 1);
          else if (UI.sel.team.length < G.BAL.teamMax) UI.sel.team.push(d.id);
          UI.refresh();
        }
      }));
    });

    panel.appendChild(h('h3', { text: 'Starting depth' }));
    var row = h('div.row', { style: 'gap:6px;justify-content:flex-start;flex-wrap:wrap' });
    for (var dep = 1; dep <= st.unlockedStart; dep++) {
      (function (dd) {
        row.appendChild(h('button' + (UI.sel.depth === dd ? '.primary' : ''), {
          text: 'Depth ' + dd + ' — ' + G.DATA.biomeForDepth(dd).name,
          onclick: function () { UI.sel.depth = dd; UI.refresh(); }
        }));
      })(dep);
    }
    panel.appendChild(row);

    panel.appendChild(h('h3', { text: 'Supplies going down' }));
    var s = st.supplies;
    panel.appendChild(h('p', { html: '🔥 ' + s.torches + ' torches · 🍞 ' + s.rations + ' rations · 🩹 ' + s.bandages + ' bandages' }));
    var buyRow = h('div.row', { style: 'gap:4px;justify-content:flex-start;flex-wrap:wrap' });
    ['torches', 'rations', 'bandages'].forEach(function (k) {
      buyRow.appendChild(h('button.small', {
        text: '+1 ' + k.slice(0, -1) + ' (' + G.BAL.supplyCost[k] + 'ᵯ)',
        onclick: function () { var r = G.Economy.buySupply(k, 1); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
      }));
    });
    panel.appendChild(buyRow);
    panel.appendChild(h('p.sub', { text: 'Rule of thumb: a torch per passage, a ration per delver per depth.', style: 'margin-top:4px' }));

    panel.appendChild(h('hr.divider'));
    var err = G.Exp.canLaunch(UI.sel.team, UI.sel.depth);
    panel.appendChild(h('button.primary', {
      text: '▼ Lower the Winch',
      style: 'width:100%;padding:12px;font-size:15px',
      disabled: !!err,
      onclick: function () {
        var r = G.Exp.launch(UI.sel.team, UI.sel.depth);
        if (!r.ok) UI.toast(r.msg, 'bad');
        UI.refresh();
      }
    }));
    if (err) panel.appendChild(h('p.sub', { text: err, style: 'margin-top:4px' }));
    panel.appendChild(h('button', { text: '◂ Back to town', style: 'width:100%;margin-top:8px', onclick: function () { UI.screen = 'town'; UI.refresh(); } }));
  };
})();
