/* v5.0 UI — the Heart parley & endings, epilogues, the Codex, the title screen,
 * the Daily Descent panel, and the audio toggle. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  /* ---------- the Heart parley (delve mode) ---------- */
  UI.renderHeartParley = function (panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'The Heart of the Maw' }));
    panel.appendChild(h('p', { text: 'The beating stops. A blank card sits on the desk, and beside it your company’s whole account — every mark taken and given, every delver spent, every honor paid. In your own handwriting, the question Maren could not answer:' }));
    panel.appendChild(h('p.quote', { text: '“What is the company FOR?”' }));

    // the ledger — the real lifetime numbers
    var s = st.stats;
    panel.appendChild(h('div.card', {}, [
      h('h3', { text: 'The Ledger', style: 'margin-top:0' }),
      h('p.sub', { html:
        'Days run: <b>' + s.daysRun + '</b> · Earned: <b>' + G.U.fmt(s.earned) + 'ᵯ</b> · Spent: <b>' + G.U.fmt(s.spent) + 'ᵯ</b><br>' +
        'Delves: <b>' + s.delves + '</b> · Kills: <b>' + s.kills + '</b> · Delvers lost: <b>' + s.deaths + '</b> · Honored: <b>' + (s.honored || 0) + '</b><br>' +
        'Deepest: <b>' + s.deepest + '</b> · Renown: <b>' + (st.renown || 0) + '</b> · Contracts kept: <b>' + (s.contractsDone || 0) + '</b>'
      })
    ]));

    panel.appendChild(h('h3', { text: 'Answer it.' }));
    var choices = ['seal', 'trade', 'become'];
    // v8: the true ending, once all three answers have been given (across charters)
    if (G.Exp.trueEndingReady && G.Exp.trueEndingReady()) choices.push('reckoning');
    choices.forEach(function (eid) {
      var end = G.DATA.endings[eid];
      panel.appendChild(h('button.choice', {
        style: eid === 'reckoning' ? 'border-color:hsl(130,60%,45%)' : '',
        onclick: function () { UI.doEnding(eid); },
        html: '<b style="color:hsl(' + end.color + ',70%,68%)">' + (eid === 'reckoning' ? '✦ ' : '') + end.name + '</b><span class="sub">' + UI.esc(end.button) + '</span>'
      }));
    });
    panel.appendChild(h('p.sub', { text: 'There is no going back up from here undecided. Choose.', style: 'margin-top:8px' }));
  };

  UI.doEnding = function (eid) {
    var r = G.Exp.chooseEnding(eid);
    if (!r.ok) return;
    UI.showEpilogue(eid);
  };

  UI.showEpilogue = function (eid) {
    var end = G.DATA.endings[eid];
    var st = G.state;
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: end.title, style: 'color:hsl(' + end.color + ',70%,68%)' }));
      end.epilogue.forEach(function (p, i) {
        m.appendChild(h(i === end.epilogue.length - 1 ? 'p.quote' : 'p', { text: p }));
      });
      var btns = h('div.btnrow', {});
      if (eid === 'become' || eid === 'reckoning') {
        btns.appendChild(h('button.primary', { text: eid === 'reckoning' ? 'Begin again (New Charter++)' : 'Begin a new charter (New Charter+)', onclick: function () {
          G.Prestige.retire(); UI.closeModal(); UI.townTab = 'company'; UI.screen = 'town'; UI.refresh();
        } }));
        btns.appendChild(h('button', { text: 'Linger a while', onclick: function () { UI.closeModal(); UI.refresh(); } }));
      } else {
        btns.appendChild(h('button.primary', { text: 'Back to the surface', onclick: function () { UI.closeModal(); UI.refresh(); } }));
      }
      if (eid === 'reckoning') btns.appendChild(h('button', { text: '✦ Credits', onclick: UI.showCredits }));
      m.appendChild(btns);
      var uniq = {}; (st.endings || []).forEach(function (e) { uniq[e] = 1; });
      var baseCount = ['seal', 'trade', 'become'].filter(function (e) { return uniq[e]; }).length;
      m.appendChild(h('p.sub', { text: 'Endings reached this charter: ' + baseCount + '/3' + (eid === 'reckoning' ? ' + the Reckoning' : '') + '. The Codex remembers each.', style: 'margin-top:10px' }));
    }, { dismiss: false });
  };

  /* ---------- the Codex ---------- */
  UI.showCodex = function () {
    var st = G.state;
    G.Codex.ensure();
    UI.codexCat = UI.codexCat || 'enemy';
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'The Codex' }));
      var cats = [['enemy', 'Enemies'], ['material', 'Materials'], ['biome', 'Biomes'], ['relic', 'Relics'], ['beast', 'Beasts'], ['mood', 'Moods'], ['ending', 'Endings']];
      var nav = h('div.tabs');
      cats.forEach(function (c) {
        nav.appendChild(h('button' + (UI.codexCat === c[0] ? '.active' : ''), { text: c[1] + ' ' + G.Codex.count(c[0]) + '/' + G.Codex.total(c[0]), onclick: function () { UI.codexCat = c[0]; UI.showCodex(); } }));
      });
      m.appendChild(nav);
      renderCodexList(m, UI.codexCat);
      m.appendChild(h('div.btnrow', {}, [h('button', { text: 'Close', onclick: UI.closeModal })]));
    });
  };
  function renderCodexList(m, cat) {
    var entries = codexEntries(cat);
    entries.forEach(function (e) {
      var seen = G.Codex.seen(cat, e.id);
      m.appendChild(h('div.card', seen ? {} : { style: 'opacity:0.5' }, [
        h('div.row', {}, [h('span.name', { text: seen ? e.name : '???' }), h('span.sub', { text: e.tag || '' })]),
        h('p.sub', { text: seen ? e.desc : 'Undiscovered. The Maw keeps its own counsel.', style: 'margin-top:3px;font-style:italic' })
      ]));
    });
  }
  function codexEntries(cat) {
    if (cat === 'enemy') return Object.keys(G.DATA.enemies).map(function (k) { var e = G.DATA.enemies[k]; return { id: k, name: e.name, desc: e.desc, tag: (e.boss ? 'guardian' : (e.tags || []).join('/')) }; });
    if (cat === 'material') return G.DATA.materialList().map(function (x) { return { id: x.id, name: x.name, desc: x.desc, tag: 'T' + x.tier }; });
    if (cat === 'biome') return G.DATA.biomes.map(function (b) { return { id: b.id, name: b.name, desc: b.tagline, tag: 'd' + b.depths[0] + '–' + b.depths[1] }; });
    if (cat === 'relic') return (G.DATA.relicList ? G.DATA.relicList() : []).map(function (r) { return { id: r.id, name: r.name, desc: r.desc }; });
    if (cat === 'beast') return (G.DATA.beastList ? G.DATA.beastList() : []).map(function (b) { return { id: b.id, name: b.name, desc: b.desc }; });
    if (cat === 'mood') return G.DATA.moods.map(function (mo) { return { id: mo.id, name: mo.name, desc: mo.blurb, tag: mo.glyph }; });
    if (cat === 'ending') return Object.keys(G.DATA.endings).map(function (k) { var e = G.DATA.endings[k]; return { id: k, name: e.name, desc: e.title }; });
    return [];
  }

  /* ---------- the Title screen ---------- */
  UI.showTitle = function () {
    G.GFX.scene = 'title';
    document.getElementById('panel').classList.add('hidden');
    var hasSave = false;
    try { hasSave = typeof localStorage !== 'undefined' && !!localStorage.getItem(G.SAVE_KEY); } catch (e) {}
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'THE GILDED MAW', style: 'font-size:30px;letter-spacing:2px;text-align:center' }));
      m.appendChild(h('p.quote', { text: '“The Maw doesn’t take. It trades. Find out what it wants.”', style: 'text-align:center' }));
      var col = h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:14px' });
      if (hasSave) col.appendChild(h('button.primary', { text: '▸ Continue', onclick: function () { if (G.loadSaved()) { UI.closeModal(); UI.boot2(); } } }));
      col.appendChild(h('button' + (hasSave ? '' : '.primary'), { text: (hasSave ? 'New Charter' : '▸ New Charter'), onclick: function () {
        var go = function () { G.wipeSave(); G.newGame(); G.save(); UI.closeModal(); UI.boot2(); G.UI.showIntro(); };
        if (hasSave) UI.confirmNew(go); else go();
      } }));
      col.appendChild(h('button', { text: '◆ Daily Descent — ' + G.Daily.dateLabel(), onclick: function () { UI.startDaily(); } }));
      col.appendChild(h('button', { text: 'Codex', onclick: function () { if (!G.state) G.newGame(); UI.showCodex(); } }));
      m.appendChild(col);
      m.appendChild(h('p.sub', { text: 'A delving-company tycoon × roguelite. v' + G.VERSION + '. All art & sound made in-browser.', style: 'text-align:center;margin-top:14px' }));
    }, { dismiss: hasSave });
  };
  UI.confirmNew = function (go) {
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'Start a new charter?' }));
      m.appendChild(h('p', { text: 'This replaces your current company. (Your Legacy perks from retiring survive; an in-progress career does not.)' }));
      m.appendChild(h('div.btnrow', {}, [
        h('button.danger', { text: 'New charter', onclick: go }),
        h('button', { text: 'Back', onclick: UI.showTitle })
      ]));
    });
  };
  UI.startDaily = function () {
    UI.modal(function (m) {
      var best = G.Daily.best(G.Daily.todaySeed());
      m.appendChild(h('h2', { text: 'Daily Descent' }));
      m.appendChild(h('p', { html: 'The same Maw for everyone today (' + G.Daily.dateLabel() + '). A fixed founding crew, ' + G.Daily.DAYS + ' days, and one question: how high a score can you build?' }));
      m.appendChild(h('p.sub', { html: 'Today’s best: <b>' + best.score + '</b>' }));
      m.appendChild(h('div.btnrow', {}, [
        h('button.primary', { text: 'Descend', onclick: function () { G.Daily.start(); UI.closeModal(); UI.boot2(); } }),
        h('button', { text: 'Back', onclick: UI.showTitle })
      ]));
    });
  };

  /* daily-end summary */
  G.on('dailyEnd', function (d) {
    setTimeout(function () {
      UI.modal(function (m) {
        m.appendChild(h('h2', { text: 'Daily Descent — Complete' }));
        m.appendChild(h('p', { html: 'Final score: <b>' + d.score + '</b>' + (d.score >= d.best ? ' — a new best!' : ' (best ' + d.best + ')') }));
        m.appendChild(h('p.sub', { text: 'Seed ' + G.state.daily.date + '. Share the date — everyone gets the same Maw.' }));
        m.appendChild(h('div.btnrow', {}, [
          h('button.primary', { text: 'Return to career', onclick: function () { if (G.restoreCareer()) { UI.closeModal(); UI.boot2(); } else { UI.closeModal(); UI.showTitle(); } } })
        ]));
      }, { dismiss: false });
    }, 60);
  });

  /* ending toast → achievements already handled in system; refresh */
  G.on('ending', function () { UI.updateHud(); });
})();
