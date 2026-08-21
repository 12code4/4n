/* v2.0 UI — Forge tab (crafting + armory + equipping) and Contracts tab. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;
  var h = UI.h;

  var slotGlyph = { weapon: '⚔', armor: '🛡', trinket: '☘' };

  UI.renderForge = function (panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'The Forge' }));
    if (!G.bld('forge')) {
      panel.appendChild(h('p', { text: 'A bare anvil on a cold plot. Build the Forge (Build tab) and the company can turn Maw-stuff into arms.' }));
      return;
    }
    var tier = G.Forge.tier();
    panel.appendChild(h('p.sub', { text: 'Forge level ' + G.bld('forge') + ' — tier ' + tier + ' patterns available. Gear goes to the armory; equip it below.' }));

    /* armory */
    panel.appendChild(h('h3', { text: 'Armory (' + st.armory.length + ')' }));
    if (!st.armory.length) panel.appendChild(h('p.sub', { text: 'Empty racks. The anvil is patient.' }));
    st.armory.forEach(function (it) {
      var def = G.DATA.gear[it.gid];
      var holder = it.by ? G.Delvers.get(it.by) : null;
      var card = h('div.card');
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: slotGlyph[def.slot] + ' ' + def.name }),
        h('span.sub', { text: gearStatText(def) })
      ]));
      card.appendChild(h('p.sub', { text: def.desc, style: 'margin:3px 0' }));
      var row = h('div.row', { style: 'margin-top:4px;flex-wrap:wrap;gap:4px;justify-content:flex-start' });
      if (holder) {
        row.appendChild(h('span.pill', { text: 'worn by ' + holder.name }));
        row.appendChild(h('button.small', { text: 'Unequip', onclick: function () { G.Forge.unequip(it.uid); UI.refresh(); } }));
      } else {
        G.Delvers.atHome().forEach(function (d) {
          row.appendChild(h('button.small', {
            text: '→ ' + d.name.split(' ')[0],
            onclick: function () { var r = G.Forge.equip(it.uid, d.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
          }));
        });
        row.appendChild(h('button.small', { text: 'Sell ' + G.DATA.gearValue(def) + 'ᵯ', onclick: function () { G.Forge.sell(it.uid); UI.refresh(); } }));
      }
      card.appendChild(row);
      panel.appendChild(card);
    });

    /* patterns */
    panel.appendChild(h('h3', { text: 'Patterns' }));
    G.DATA.gearList().forEach(function (def) {
      if (def.tier > tier + 1) return; // show current + next tier as teaser
      var locked = def.tier > tier;
      var err = locked ? null : G.Forge.canCraft(def.id);
      var card = h('div.card', locked ? { style: 'opacity:0.55' } : {});
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: slotGlyph[def.slot] + ' ' + def.name + ' (T' + def.tier + ')' }),
        h('span.sub', { text: gearStatText(def) })
      ]));
      var costBits = [def.cost.marks + 'ᵯ'];
      for (var id in (def.cost.mats || {})) costBits.push(def.cost.mats[id] + '× ' + G.DATA.materials[id].name);
      card.appendChild(h('p.sub', { text: costBits.join(' · '), style: 'margin:3px 0' }));
      if (locked) card.appendChild(h('span.pill', { text: 'needs Forge L' + def.tier }));
      else card.appendChild(h('button.small.primary', {
        text: 'Craft',
        disabled: !!err,
        title: err || '',
        onclick: function () { var r = G.Forge.craft(def.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
      }));
      if (err && !locked) card.appendChild(h('span.sub', { text: '  ' + err, style: 'margin-left:6px' }));
      panel.appendChild(card);
    });
  };

  function gearStatText(def) {
    var bits = [];
    if (def.atk) bits.push('+' + def.atk + ' dmg');
    if (def.def) bits.push('−' + def.def + ' taken');
    if (def.fx) {
      if (def.fx.crit) bits.push('+' + Math.round(def.fx.crit * 100) + '% crit');
      if (def.fx.flee) bits.push('+' + Math.round(def.fx.flee * 100) + '% flee');
      if (def.fx.xp) bits.push('+' + Math.round(def.fx.xp * 100) + '% xp');
      if (def.fx.loot) bits.push('+' + Math.round(def.fx.loot * 100) + '% loot');
      if (def.fx.luck) bits.push('+' + def.fx.luck + ' luck');
      if (def.fx.gritStart) bits.push('+' + def.fx.gritStart + ' start grit');
    }
    return bits.join(', ');
  }
  UI.gearStatText = gearStatText;

  UI.renderContracts = function (panel) {
    var st = G.state;
    panel.appendChild(h('h2', { text: 'Contracts Board' }));
    if (!G.bld('contracts')) {
      panel.appendChild(h('p', { text: 'Buyers in the valley post standing wants — if there’s a board to post them on. Build the Contracts Board (Build tab).' }));
      return;
    }
    var ct = st.contracts;
    panel.appendChild(h('h3', { text: 'Signed (' + ct.active.length + '/' + G.Contracts.slots() + ')' }));
    if (!ct.active.length) panel.appendChild(h('p.sub', { text: 'Nothing signed. The clerk sharpens his pencil at you.' }));
    ct.active.forEach(function (a) {
      var mat = G.DATA.materials[a.mat];
      var have = st.inventory[a.mat] || 0;
      var due = a.dueDay - st.day;
      var card = h('div.card');
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: a.clientName }),
        h('span.sub', { html: due <= 1 ? '<span class="down">due ' + (due <= 0 ? 'today' : 'tomorrow') + '</span>' : 'due in ' + due + 'd' })
      ]));
      card.appendChild(h('p.sub', { html: 'Deliver <b>' + a.qty + '× ' + mat.name + '</b> (holding ' + have + ') → pays <b>' + a.payout + 'ᵯ</b>' }));
      card.appendChild(h('button.small.primary', {
        text: 'Deliver',
        disabled: have < a.qty,
        onclick: function () { var r = G.Contracts.fulfill(a.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
      }));
      panel.appendChild(card);
    });

    panel.appendChild(h('h3', { text: 'Postings' }));
    if (!ct.offers.length) panel.appendChild(h('p.sub', { text: 'The board is bare today. Offers drift in most mornings.' }));
    ct.offers.forEach(function (o) {
      var mat = G.DATA.materials[o.mat];
      var client = G.U.byId(G.DATA.contractClients, o.client) || {};
      var card = h('div.card');
      card.appendChild(h('div.row', {}, [
        h('span.name', { text: o.clientName }),
        h('span.sub', { text: 'posted until d' + o.offerExpires })
      ]));
      card.appendChild(h('p.sub', { text: client.blurb || '', style: 'font-style:italic' }));
      card.appendChild(h('p.sub', { html: '<b>' + o.qty + '× ' + mat.name + '</b> within ' + o.dueDays + ' days of signing → <b>' + o.payout + 'ᵯ</b> (market ~' + (mat.base * o.qty) + 'ᵯ)' }));
      card.appendChild(h('button.small', {
        text: 'Sign',
        onclick: function () { var r = G.Contracts.accept(o.id); if (!r.ok) UI.toast(r.msg, 'bad'); UI.refresh(); }
      }));
      panel.appendChild(card);
    });
  };
})();
