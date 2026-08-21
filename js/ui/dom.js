/* UI plumbing: element builder, toasts, modals, HUD, screen manager. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = (G.UI = {});

  /* element builder: h('div.card', {onclick:fn, html:'..'}, [children|string]) */
  UI.h = function (sel, attrs, children) {
    var parts = sel.split('.');
    var el = document.createElement(parts[0] || 'div');
    for (var i = 1; i < parts.length; i++) el.classList.add(parts[i]);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'disabled') { if (attrs[k]) el.disabled = true; }
      else el.setAttribute(k, attrs[k]);
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c === null || c === undefined) return;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return el;
  };
  var h = UI.h;
  UI.esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* ---------- toasts ---------- */
  UI.toast = function (msg, kind) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = h('div.toast.k-' + (kind || 'info'), { text: msg });
    box.appendChild(t);
    while (box.children.length > 5) box.removeChild(box.firstChild);
    setTimeout(function () { t.classList.add('fade'); }, 3400);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4800);
  };
  G.on('log', function (d) { UI.toast(d.m, d.k); });
  G.on('elog', function (d) { UI.toast(d.m, d.k); });

  /* v6: onboarding hints as a one-time dismissible card */
  G.on('hint', function (d) {
    setTimeout(function () {
      UI.modal(function (m) {
        m.appendChild(h('h2', { text: '💡 A word of advice' }));
        m.appendChild(h('p', { text: d.text }));
        m.appendChild(h('div.btnrow', {}, [h('button.primary', { text: 'Got it', onclick: UI.closeModal })]));
      });
    }, 120);
  });

  /* ---------- modal ---------- */
  UI.modal = function (build, opts) {
    opts = opts || {};
    var wrap = document.getElementById('modal-wrap');
    var m = document.getElementById('modal');
    m.innerHTML = '';
    build(m);
    wrap.classList.remove('hidden');
    UI.modalDismiss = opts.dismiss !== false;
  };
  UI.closeModal = function () {
    document.getElementById('modal-wrap').classList.add('hidden');
  };

  /* ---------- HUD ---------- */
  UI.updateHud = function () {
    var st = G.state;
    if (!st) return;
    document.getElementById('hud-marks').textContent = G.U.fmt(st.marks);
    document.getElementById('hud-day').textContent = st.day;
    var ex = st.expedition;
    var sup = ex
      ? '🔥' + ex.torches + ' 🍞' + ex.rations + ' 🩹' + ex.bandages
      : '🔥' + st.supplies.torches + ' 🍞' + st.supplies.rations + ' 🩹' + st.supplies.bandages;
    document.getElementById('hud-supplies').innerHTML = '<span>' + sup + '</span>';
    var dEl = document.getElementById('hud-depth');
    if (ex) {
      dEl.classList.remove('hidden');
      dEl.innerHTML = '<b>' + ex.depth + '</b><span>depth</span>';
    } else dEl.classList.add('hidden');
    // Maw mood glyph
    var mEl = document.getElementById('hud-mood');
    if (mEl && G.Moods) {
      var mood = G.Moods.current();
      mEl.innerHTML = '<b style="color:hsl(' + mood.hue + ',70%,65%)">' + mood.glyph + '</b><span>' + mood.name + '</span>';
      mEl.title = mood.blurb + (G.Moods.daysLeft() ? ' (' + G.Moods.daysLeft() + 'd)' : '');
    }
    // season (and festival) indicator
    var sEl = document.getElementById('hud-season');
    if (sEl && G.Seasons) {
      var seas = G.Seasons.def(), fest = G.Seasons.festival();
      sEl.innerHTML = '<b style="color:hsl(' + seas.hue + ',55%,62%)">' + (fest ? '✦' : '❃') + '</b><span>' + (fest ? fest.name : seas.name) + '</span>';
      sEl.title = fest ? fest.blurb : (seas.name + ' — ' + seas.blurb);
    }
    // ascension badge
    var aEl = document.getElementById('hud-asc');
    if (aEl && G.Ascension) {
      var at = G.Ascension.tier();
      if (at > 0) { aEl.classList.remove('hidden'); aEl.innerHTML = '<b style="color:hsl(0,60%,62%)">A' + G.Ascension.roman(at) + '</b>'; aEl.title = 'Ascension ' + G.Ascension.roman(at); }
      else aEl.classList.add('hidden');
    }
    document.getElementById('hud-endday').classList.toggle('hidden', !!ex);
    var jbtn = document.getElementById('hud-journal');
    var unread = st.journalSeen.filter(function (p) { return st.journalRead.indexOf(p) < 0; }).length;
    jbtn.innerHTML = 'Journal' + (unread ? ' <span class="badge">' + unread + '</span>' : '');
    // daily descent indicator
    var dl = document.getElementById('hud-daily');
    if (dl) {
      if (st.daily && G.Daily) {
        dl.classList.remove('hidden');
        dl.innerHTML = '<b style="color:var(--brass-hi)">◆ Daily</b><span>' + G.Daily.daysLeft() + 'd · ' + G.U.fmt(G.Daily.score()) + 'pt</span>';
      } else dl.classList.add('hidden');
    }
  };

  /* ---------- screen manager ---------- */
  UI.screen = null;
  UI.show = function (name) {
    UI.screen = name;
    G.GFX.scene = (name === 'town' || name === 'outfit') ? 'town'
      : (name === 'combat' ? 'combat' : 'delve');
    // biome drone follows the scene
    if (G.Audio && G.Audio.setDrone) {
      var ex = G.state && G.state.expedition;
      G.Audio.setDrone(ex ? G.DATA.biomeForDepth(ex.depth).id : 'town');
    }
  };

  /* master refresh: derive screen from state, render panel */
  UI.refresh = function () {
    var st = G.state;
    if (!st) return;
    UI.updateHud();
    var ex = st.expedition;
    var name;
    if (!ex) name = UI.screen === 'outfit' ? 'outfit' : 'town';
    else if (ex.mode === 'combat') name = 'combat';
    else name = 'delve';
    UI.show(name);
    var panel = document.getElementById('panel');
    panel.innerHTML = '';
    panel.classList.remove('hidden');
    if (name === 'town') G.UI.renderTown(panel);
    else if (name === 'outfit') G.UI.renderOutfit(panel);
    else if (name === 'combat') G.UI.renderCombat(panel);
    else G.UI.renderDelve(panel);
  };

  /* ---------- standing modals ---------- */
  UI.showIntro = function () {
    UI.modal(function (m) {
      var intro = G.DATA.intro;
      m.appendChild(h('h2', { text: intro.title }));
      intro.body.forEach(function (p, i) {
        m.appendChild(h(i === 3 ? 'p.quote' : 'p', { text: p }));
      });
      m.appendChild(h('div.btnrow', {}, [
        h('button.primary', { text: 'Sign the deed', onclick: function () { UI.closeModal(); UI.refresh(); } })
      ]));
    }, { dismiss: false });
  };

  UI.showJournal = function () {
    var st = G.state;
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'The Company Journal' }));
      if (!st.journalSeen.length) {
        m.appendChild(h('p', { text: 'Maren’s pages are still down there somewhere. Go deeper.' }));
      }
      G.DATA.journal.forEach(function (p) {
        if (st.journalSeen.indexOf(p.id) < 0) return;
        var unread = st.journalRead.indexOf(p.id) < 0;
        var card = h('div.card', {}, [
          h('div.name', { text: p.title + (unread ? '  •' : '') }),
          h('p', { text: p.body, style: 'margin-top:6px;font-family:Georgia,serif;font-style:italic;color:var(--ink)' })
        ]);
        m.appendChild(card);
        if (unread) st.journalRead.push(p.id);
      });
      m.appendChild(h('div.btnrow', {}, [h('button', { text: 'Close', onclick: function () { UI.closeModal(); UI.updateHud(); } })]));
    });
  };

  UI.showLedger = function () {
    var st = G.state;
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'The Ledger' }));
      var s = st.stats;
      m.appendChild(h('p.sub', { html: 'Day ' + st.day + ' — earned <b>' + G.U.fmt(s.earned) + 'ᵯ</b>, spent <b>' + G.U.fmt(s.spent) + 'ᵯ</b>. ' + s.delves + ' delves, ' + s.kills + ' kills, ' + s.deaths + ' lost, deepest depth ' + s.deepest + '.' }));
      m.appendChild(h('hr.divider'));
      var recent = st.log.slice(-40).reverse();
      recent.forEach(function (L) {
        m.appendChild(h('p', { html: '<span class="sub">d' + L.d + '</span> ' + UI.esc(L.m), style: 'margin-bottom:3px;font-size:13px' }));
      });
      m.appendChild(h('div.btnrow', {}, [h('button', { text: 'Close', onclick: UI.closeModal })]));
    });
  };

  UI.showMenu = function () {
    UI.modal(function (m) {
      m.appendChild(h('h2', { text: 'Menu' }));
      m.appendChild(h('p.sub', { text: 'The Gilded Maw v' + G.VERSION + ' — a delving-company tycoon roguelite. Saves automatically at dusk and on return.' }));
      m.appendChild(h('div.btnrow', { style: 'justify-content:flex-start;flex-wrap:wrap' }, [
        h('button', { text: 'Save now', onclick: function () { G.save(); UI.toast('Saved.', 'good'); } }),
        h('button', { text: 'Export save', onclick: function () {
          UI.modal(function (mm) {
            mm.appendChild(h('h2', { text: 'Export Save' }));
            var ta = h('textarea', { style: 'width:100%;height:120px;background:#0d0805;color:var(--ink);border:1px solid var(--panel-edge);border-radius:6px;padding:8px', text: G.exportSave() });
            mm.appendChild(ta);
            mm.appendChild(h('div.btnrow', {}, [
              h('button', { text: 'Copy', onclick: function () { ta.select(); try { document.execCommand('copy'); UI.toast('Copied.', 'good'); } catch (e) {} } }),
              h('button', { text: 'Close', onclick: UI.closeModal })
            ]));
          });
        } }),
        h('button', { text: 'Import save', onclick: function () {
          UI.modal(function (mm) {
            mm.appendChild(h('h2', { text: 'Import Save' }));
            var ta = h('textarea', { style: 'width:100%;height:120px;background:#0d0805;color:var(--ink);border:1px solid var(--panel-edge);border-radius:6px;padding:8px' });
            mm.appendChild(ta);
            mm.appendChild(h('div.btnrow', {}, [
              h('button.primary', { text: 'Import', onclick: function () {
                try { G.importSave(ta.value); G.save(); UI.closeModal(); UI.refresh(); UI.toast('Save imported.', 'good'); }
                catch (e) { UI.toast('That string is not a valid save.', 'bad'); }
              } }),
              h('button', { text: 'Cancel', onclick: UI.closeModal })
            ]));
          });
        } }),
        h('button.danger', { text: 'Abandon charter (new game)', onclick: function () {
          UI.modal(function (mm) {
            mm.appendChild(h('h2', { text: 'Abandon the charter?' }));
            mm.appendChild(h('p', { text: 'The company, the roster, the graves — all of it stays behind. A new deed, a new seed, a new Maw.' }));
            mm.appendChild(h('div.btnrow', {}, [
              h('button.danger', { text: 'Abandon it', onclick: function () {
                G.wipeSave();
                G.newGame();
                G.save();
                UI.closeModal();
                UI.refresh();
                UI.showIntro();
              } }),
              h('button', { text: 'Keep digging', onclick: UI.closeModal })
            ]));
          });
        } })
      ]));
      m.appendChild(h('div.btnrow', {}, [h('button', { text: 'Close', onclick: UI.closeModal })]));
    });
  };

  /* return-from-expedition summary */
  G.on('returned', function (sum) {
    if (sum && sum.ending) { UI.refresh(); return; } // the epilogue modal handles Heart endings
    setTimeout(function () {
      UI.modal(function (m) {
        if (sum.wiped) {
          m.appendChild(h('h2', { text: 'The Rope Comes Up Light' }));
          m.appendChild(h('p', { text: 'No survivors. The Maw kept the team, the gear, and the haul. Dov pours ' + (sum.days) + ' free rounds and says nothing. The company endures — that is what companies are for.' }));
        } else {
          m.appendChild(h('h2', { text: 'The Winch Turns' }));
          m.appendChild(h('p', { html: 'The team surfaces after <b>' + G.U.plural(sum.days, 'day') + '</b> below. Goods worth ~<b>' + G.U.fmt(sum.haul) + 'ᵯ</b> at market, plus <b>' + sum.marks + 'ᵯ</b> in coin. ' + sum.kills + ' things put down.' }));
        }
        m.appendChild(h('div.btnrow', {}, [h('button.primary', { text: 'Back to business', onclick: function () { UI.closeModal(); UI.refresh(); } })]));
      });
      UI.refresh();
    }, 60);
  });
})();
