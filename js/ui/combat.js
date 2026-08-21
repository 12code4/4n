/* Combat panel: enemy targets, party status, the action bar. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  UI.combatTarget = null;

  function statusPips(s) {
    if (!s) return '';
    var out = '';
    if (s.burn > 0) out += ' <span class="pip burn" title="Burning">🔥' + s.burn + '</span>';
    if (s.chill > 0) out += ' <span class="pip chill" title="Chilled">❄' + s.chill + '</span>';
    if (s.bleed > 0) out += ' <span class="pip bleed" title="Bleeding">🩸' + s.bleed + '</span>';
    if (s.ward) out += ' <span class="pip ward" title="Warded">◈</span>';
    return out;
  }
  var INTENT = { strike: '⚔', aoe: '↯ sweep', windup: '… winding', silence: '🤫 silence', index: '✎ index', reforge: '⚒ reforge', echo: '↺ echo', systole: '✊ clench' };
  function intentGlyph(intent) {
    if (!intent) return '';
    return '<span class="sub" title="Next move">' + (INTENT[intent] || intent) + '</span>';
  }

  UI.renderCombat = function (panel) {
    var st = G.state;
    var ex = st.expedition;
    var c = ex && ex.combat;
    if (!c) { UI.refresh(); return; }

    panel.appendChild(h('h2', { text: 'Depth ' + ex.depth + ' — Round ' + c.round }));

    // grit meter
    var gritCard = h('div.card');
    gritCard.appendChild(h('div.row', {}, [
      h('span', { html: '<b>Grit</b> <span class="sub">shared resolve — Strikes & Guards earn it, Skills spend it</span>' }),
      h('span.name', { text: c.grit + '/' + G.BAL.gritMax })
    ]));
    var gbar = h('div.bar.grit');
    gbar.appendChild(h('i', { style: 'width:' + Math.round(100 * c.grit / G.BAL.gritMax) + '%' }));
    gritCard.appendChild(gbar);
    panel.appendChild(gritCard);

    // enemies (clickable targets)
    panel.appendChild(h('h3', { text: 'Enemies' }));
    var living = c.enemies.filter(function (e) { return e.hp > 0; });
    if (UI.combatTarget && !living.some(function (e) { return e.uid === UI.combatTarget; })) UI.combatTarget = null;
    if (!UI.combatTarget && living.length) UI.combatTarget = living[0].uid;
    c.enemies.forEach(function (e) {
      var dead = e.hp <= 0;
      var sel = UI.combatTarget === e.uid && !dead;
      var card = h('div.card.enemyrow' + (sel ? '.selected' : '') + (dead ? '.dead' : ''), {
        onclick: dead ? null : function () { UI.combatTarget = e.uid; UI.refresh(); }
      });
      card.appendChild(h('div.row', {}, [
        h('span.name', { html: e.name + statusPips(e.status) }),
        h('span.sub', { html: dead ? 'destroyed' : (intentGlyph(e.intent) + (sel ? ' ◎' : '')) })
      ]));
      if (!dead) {
        var bar = h('div.bar');
        bar.appendChild(h('i', { style: 'width:' + Math.round(100 * e.hp / e.maxHp) + '%;background:linear-gradient(90deg,#a24d42,#e06a5a)' }));
        card.appendChild(bar);
        card.appendChild(h('div.sub', { text: e.hp + '/' + e.maxHp + (e.special === 'slow' ? ' · slow but heavy' : e.special === 'tithe' ? ' · collects marks' : e.special === 'lowest' ? ' · hunts the weak' : e.special === 'drain' ? ' · drinks wounds' : e.special === 'bleed' ? ' · opens wounds' : e.special === 'chill' ? ' · chilling' : e.special === 'want' ? ' · sings longing' : '') }));
      }
      panel.appendChild(card);
    });

    // party
    panel.appendChild(h('h3', { text: 'The Team' }));
    G.Exp.team().forEach(function (d) {
      var mhp = G.Delvers.maxHp(d);
      var active = c.awaiting === d.id;
      var card = h('div.card' + (active ? '.selected' : ''));
      var ds = c.dstat && c.dstat[d.id];
      card.appendChild(h('div.row', {}, [
        h('span.name', { html: (active ? '▶ ' : '') + d.name + statusPips(ds) }),
        h('span.sub', { text: G.Delvers.cls(d).name + (c.shaken[d.id] ? ' · shaken' : '') + (c.guarding[d.id] ? ' · guarding' : '') + (c.taunt[d.id] ? ' · taunting' : '') })
      ]));
      var bar = h('div.bar.hp');
      bar.appendChild(h('i', { style: 'width:' + Math.round(100 * d.hp / mhp) + '%' }));
      card.appendChild(bar);
      card.appendChild(h('div.sub', { text: d.hp + '/' + mhp + ' hp' }));
      panel.appendChild(card);
    });

    // actions for awaiting delver
    var actor = G.Combat.actor();
    if (actor) {
      var skill = G.Delvers.cls(actor).skill;
      panel.appendChild(h('h3', { text: actor.name + ' acts' }));
      var acts = h('div.actions');
      acts.appendChild(h('button', {
        html: '⚔ <b>Strike</b><br><span class="sub">+1 Grit</span>',
        onclick: function () { act({ type: 'strike', target: UI.combatTarget }); }
      }));
      acts.appendChild(h('button', {
        html: '◈ <b>Guard</b><br><span class="sub">halve damage, +1 Grit</span>',
        onclick: function () { act({ type: 'guard' }); }
      }));
      acts.appendChild(h('button', {
        disabled: c.grit < skill.cost,
        html: '✦ <b>' + skill.name + '</b><br><span class="sub">' + skill.cost + ' Grit — ' + UI.esc(skill.desc) + '</span>',
        onclick: function () { act({ type: 'skill', target: UI.combatTarget }); }
      }));
      acts.appendChild(h('button', {
        disabled: ex.bandages <= 0,
        html: '🩹 <b>Bandage</b><br><span class="sub">' + ex.bandages + ' left — heals the worst-hurt</span>',
        onclick: function () {
          var team = G.Exp.team();
          var low = team[0];
          team.forEach(function (d) { if (d.hp / G.Delvers.maxHp(d) < low.hp / G.Delvers.maxHp(low)) low = d; });
          act({ type: 'item', target: low.id });
        }
      }));
      // v4: companion beast ability, once per fight
      var bdef = G.Beasts && G.Beasts.activeDef();
      if (bdef) {
        acts.appendChild(h('button', {
          disabled: c.beastUsed,
          html: '🐾 <b>' + bdef.active.name + '</b><br><span class="sub">' + (c.beastUsed ? 'used' : bdef.name + ' — ' + UI.esc(bdef.active.desc)) + '</span>',
          onclick: function () { act({ type: 'beast', target: UI.combatTarget }); }
        }));
      }
      acts.appendChild(h('button.danger', {
        html: '🏃 <b>Flee</b><br><span class="sub">drop some loot; Scouts flee best</span>',
        style: bdef ? '' : 'grid-column:1/3',
        onclick: function () { act({ type: 'flee' }); }
      }));
      panel.appendChild(acts);
    } else if (!c.over) {
      panel.appendChild(h('p.sub', { text: 'The enemy moves…' }));
    }

    function act(a) {
      var r = G.Combat.act(a);
      if (r && r.msg) UI.toast(r.msg, 'bad');
      UI.refresh();
    }
  };
})();
