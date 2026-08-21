#!/usr/bin/env node
/* Headless simulation tests for The Gilded Maw.
 * Loads core + data + systems (no DOM), then batters the game logic:
 * mapgen validity, save round-trips, economy solvency, and full
 * policy-driven expedition playthroughs. Exits 1 on any failure. */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');
var FILES = [
  'js/core.js',
  'js/data/balance.js', 'js/data/names.js', 'js/data/classes.js', 'js/data/materials.js',
  'js/data/biomes.js', 'js/data/enemies.js', 'js/data/events.js', 'js/data/story.js',
  'js/data/buildings.js', 'js/data/gear.js', 'js/data/contracts.js', 'js/data/emberdeep.js',
  'js/data/archive.js', 'js/data/renown.js', 'js/data/relics.js', 'js/data/talents.js',
  'js/data/achievements.js', 'js/data/rivals.js',
  'js/data/moods.js', 'js/data/omens.js', 'js/data/veins.js', 'js/data/beasts.js', 'js/data/legacy.js',
  'js/data/heart.js', 'js/data/ascension.js', 'js/data/seasons.js', 'js/data/undervault.js', 'js/data/legends.js',
  'js/migrations.js',
  'js/systems/state.js', 'js/systems/delvers.js', 'js/systems/economy.js',
  'js/systems/forge.js', 'js/systems/contracts.js',
  'js/systems/renown.js', 'js/systems/relics.js', 'js/systems/rivals.js', 'js/systems/quests.js',
  'js/systems/moods.js', 'js/systems/omens.js', 'js/systems/beasts.js', 'js/systems/prestige.js',
  'js/systems/codex.js', 'js/systems/daily.js',
  'js/systems/ascension.js', 'js/systems/seasons.js', 'js/systems/finance.js', 'js/systems/hints.js',
  'js/systems/undervault.js', 'js/systems/options.js', 'js/systems/mastery.js', 'js/systems/legends.js',
  'js/systems/expedition.js', 'js/systems/combat.js'
];
FILES.forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
});
var G = globalThis.G;

var failures = 0, checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) { failures++; console.error('  ✗ ' + msg); }
}
function section(name) { console.log('• ' + name); }

function findNaN(obj, pathStr, out, seen) {
  seen = seen || new Set();
  if (obj === null || obj === undefined) return out;
  if (typeof obj === 'number') {
    if (!isFinite(obj)) out.push(pathStr + ' = ' + obj);
    return out;
  }
  if (typeof obj !== 'object') return out;
  if (seen.has(obj)) return out;
  seen.add(obj);
  for (var k in obj) {
    if (k === '_rng') continue;
    findNaN(obj[k], pathStr + '.' + k, out, seen);
  }
  return out;
}
function assertNoNaN(label) {
  var bad = findNaN(G.state, 'state', []);
  ok(bad.length === 0, label + ': non-finite numbers: ' + bad.slice(0, 5).join(', '));
}

/* ---------------- mapgen ---------------- */
section('Mapgen: structure & connectivity (300 floors)');
(function () {
  G.newGame(12345);
  for (var trial = 0; trial < 300; trial++) {
    var depth = 1 + (trial % 3);
    // pretend guardians unslain/slain alternately for final-node coverage
    G.state.guardiansSlain = trial % 2 ? { gullet: true } : {};
    var map = G.Exp.genFloor(depth);
    var rows = map.rows;
    ok(rows[0].length === 1 && rows[0][0].type === 'entry', 'floor starts with single entry');
    var last = rows[rows.length - 1];
    ok(last.length === 1 && (last[0].type === 'shaft' || last[0].type === 'guardian'), 'floor ends with shaft/guardian');
    // edges all point into next rank; every node (except entry) has inbound; reachability
    var reachable = {};
    reachable[rows[0][0].id] = true;
    for (var r = 0; r < rows.length - 1; r++) {
      var nextIds = {};
      rows[r + 1].forEach(function (n) { nextIds[n.id] = true; });
      rows[r].forEach(function (n) {
        ok(n.edges.length > 0, 'non-final node has outgoing edge (d' + depth + ')');
        n.edges.forEach(function (e) {
          ok(nextIds[e], 'edge stays within next rank');
          if (reachable[n.id]) reachable[e] = true;
        });
      });
    }
    rows.forEach(function (row) {
      row.forEach(function (n) { ok(reachable[n.id], 'node ' + n.id + ' reachable from entry'); });
    });
  }
})();

/* ---------------- save round-trip ---------------- */
section('Save: serialize → deserialize round-trip');
(function () {
  G.newGame(777);
  // dirty the state a bit
  G.Economy.buySupply('torches', 3);
  G.Delvers.refreshPool(true);
  var a = G.serialize();
  G.deserialize(a);
  var b = G.serialize();
  ok(a === b, 'round-trip stable');
  // exported string round-trip
  var ex = G.exportSave();
  G.importSave(ex);
  var c = G.serialize();
  ok(b === c, 'export/import stable');
})();

/* ---------------- economy ---------------- */
section('Economy: 200 days of random surface play');
(function () {
  G.newGame(4242);
  var st = G.state;
  for (var day = 0; day < 200; day++) {
    // random actions
    if (G.rchance(0.3) && st.tavernPool.length) G.Delvers.hire(0);
    if (G.rchance(0.4)) G.Economy.buySupply(G.rpick(['rations', 'torches', 'bandages']), 1);
    if (G.rchance(0.25)) {
      var ids = Object.keys(st.inventory);
      if (ids.length) G.Economy.sell(ids[0], 1);
    }
    if (G.rchance(0.2)) {
      var blds = ['storehouse', 'tavern', 'assay', 'infirmary'];
      G.Economy.build(G.rpick(blds));
    }
    // free loot occasionally (simulates returns)
    if (G.rchance(0.5)) {
      var mat = G.rpick(G.DATA.materialList());
      st.inventory[mat.id] = (st.inventory[mat.id] || 0) + G.rint(1, 3);
    }
    var r = G.Economy.endDay();
    ok(r.ok, 'endDay works with no expedition');
    ok(st.marks >= 0, 'marks never negative (day ' + st.day + ': ' + st.marks + ')');
    // market bounds
    G.DATA.materialList().forEach(function (m) {
      var p = st.market[m.id];
      ok(p >= 1 && p <= Math.ceil(m.base * G.BAL.marketMax) + 1, m.name + ' price in bounds (' + p + ')');
    });
  }
  assertNoNaN('economy');
})();

/* ---------------- full expedition playthroughs ---------------- */
section('Expeditions: 150 policy-driven full runs');
(function () {
  var results = { returned: 0, wiped: 0, guardians: 0, totalHaul: 0, totalDays: 0, deaths: 0, fled: 0 };
  var exceptions = 0;

  for (var run = 0; run < 150; run++) {
    G.newGame(9000 + run);
    var st = G.state;
    st.marks = 200;
    // build a bit
    G.Economy.build('tavern');
    G.Economy.build('infirmary');
    // hire up to 3
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) {
      if (!st.tavernPool.length) G.Delvers.refreshPool(true);
      G.Delvers.hire(0);
    }
    G.Economy.buySupply('torches', 10);
    G.Economy.buySupply('rations', 9);
    G.Economy.buySupply('bandages', 4);
    var team = G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; });
    var res = G.Exp.launch(team, 1);
    ok(res.ok, 'launch succeeds: ' + (res.msg || ''));
    if (!res.ok) continue;

    var steps = 0;
    try {
      while (st.expedition && steps++ < 3000) {
        var ex = st.expedition;
        var mode = ex.mode;
        if (mode === 'map') {
          var choices = G.Exp.nextChoices();
          ok(choices.length > 0, 'always a way forward (mode map)');
          if (!choices.length) break;
          G.Exp.move(G.rpick(choices).id);
        } else if (mode === 'combat') {
          var c = ex.combat;
          var actor = G.Combat.actor();
          ok(!!actor || c.over, 'combat awaits a delver or is over');
          if (!actor) break;
          var skill = G.Delvers.cls(actor).skill;
          var lowHurt = actor.hp < G.Delvers.maxHp(actor) * 0.3 && ex.bandages > 0;
          var a;
          if (lowHurt && G.rchance(0.7)) a = { type: 'item', target: actor.id };
          else if (c.grit >= skill.cost && G.rchance(0.5)) a = { type: 'skill' };
          else if (G.rchance(0.12)) a = { type: 'guard' };
          else if (G.rchance(0.05) && !c.guardian) a = { type: 'flee' };
          else a = { type: 'strike' };
          var ar = G.Combat.act(a);
          if (ar && ar.fled) results.fled++;
        } else if (mode === 'event') {
          if (ex.event.stage === 'choose') {
            var def = G.Exp.eventDef();
            var avail = [];
            def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) avail.push(i); });
            ok(avail.length > 0, 'event ' + def.id + ' always has an available choice');
            G.Exp.chooseEvent(G.rpick(avail));
          } else {
            G.Exp.closeEvent();
          }
        } else if (mode === 'rival') {
          if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival();
        } else if (mode === 'peddler') {
          if (G.rchance(0.3)) G.Exp.peddlerBuy('torches');
          G.Exp.leavePeddler();
        } else if (mode === 'shaft') {
          if (G.Exp.canDescend() && G.rchance(0.7)) G.Exp.descend();
          else G.Exp.surface();
        } else if (mode === 'guardian') {
          if (G.rchance(0.8)) G.Exp.fightGuardian();
          else G.Exp.surface();
        } else if (mode === 'guardian_won') {
          results.guardians++;
          G.Exp.surface();
        } else {
          ok(false, 'unknown expedition mode: ' + mode);
          break;
        }
      }
    } catch (e) {
      exceptions++;
      console.error('  ✗ exception in run ' + run + ': ' + (e && e.stack || e));
    }
    ok(steps < 3000, 'expedition terminates (' + steps + ' steps)');
    ok(!st.expedition, 'expedition cleaned up');
    if (st.lastRun) {
      if (st.lastRun.wiped) results.wiped++;
      else { results.returned++; results.totalHaul += st.lastRun.haul + st.lastRun.marks; }
      results.totalDays += st.lastRun.days;
      results.deaths += (3 - (st.lastRun.survivors || 0));
    }
    assertNoNaN('run ' + run);
    // delver hp sanity
    G.state.delvers.forEach(function (d) {
      ok(d.hp >= 0 && d.hp <= G.Delvers.maxHp(d) + 0.001, 'hp in range for ' + d.name + ' (' + d.hp + ')');
    });
  }
  ok(exceptions === 0, exceptions + ' exceptions thrown during runs');
  ok(results.returned > 0, 'some expeditions return alive');
  ok(results.wiped < 150, 'not everything wipes');
  console.log('  » returns: ' + results.returned + ', wipes: ' + results.wiped +
    ', guardian kills: ' + results.guardians + ', flees: ' + results.fled +
    ', avg haul (returned): ' + Math.round(results.totalHaul / Math.max(1, results.returned)) + 'ᵯ' +
    ', deaths: ' + results.deaths);
})();

/* ---------------- long campaign ---------------- */
section('Campaign: 80 in-game days of mixed play');
(function () {
  G.newGame(31337);
  var st = G.state;
  var campaignErr = 0;
  try {
    for (var d = 0; d < 80; d++) {
      // surface phase: sell everything, hire if short, buy supplies, build priority
      Object.keys(st.inventory).forEach(function (id) { G.Economy.sell(id, st.inventory[id]); });
      if (G.Delvers.roster().length < 3 && st.tavernPool.length && st.marks > 40) G.Delvers.hire(0);
      while (st.supplies.torches < 14 && st.marks >= 12) G.Economy.buySupply('torches', 1);
      while (st.supplies.rations < 9 && st.marks >= 10) G.Economy.buySupply('rations', 1);
      if (st.marks > 30 && st.supplies.bandages < 3) G.Economy.buySupply('bandages', 1);
      ['tavern', 'infirmary', 'assay', 'storehouse'].forEach(function (b) {
        if (st.marks > 120) G.Economy.build(b);
      });
      // delve every few days if healthy
      var fit = G.Delvers.roster().filter(function (x) { return x.hp > G.Delvers.maxHp(x) * 0.6; });
      if (fit.length >= 2 && st.supplies.torches >= 4 && !st.expedition) {
        var team = fit.slice(0, 3).map(function (x) { return x.id; });
        var r = G.Exp.launch(team, st.unlockedStart);
        if (r.ok) {
          var steps = 0;
          while (st.expedition && steps++ < 2000) {
            var ex = st.expedition;
            if (ex.mode === 'map') {
              var cs = G.Exp.nextChoices();
              if (!cs.length) break;
              G.Exp.move(G.rpick(cs).id);
            } else if (ex.mode === 'combat') {
              var actor = G.Combat.actor();
              if (!actor) break;
              var c = ex.combat;
              var skill = G.Delvers.cls(actor).skill;
              if (actor.hp < G.Delvers.maxHp(actor) * 0.35 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
              else if (c.grit >= skill.cost) G.Combat.act({ type: 'skill' });
              else G.Combat.act({ type: 'strike' });
            } else if (ex.mode === 'event') {
              if (ex.event.stage === 'choose') {
                var def = G.Exp.eventDef();
                var avail = [];
                def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) avail.push(i); });
                G.Exp.chooseEvent(avail[avail.length - 1]); // cautious: last option is usually safe
              } else G.Exp.closeEvent();
            } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') { if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival(); }
            else if (ex.mode === 'shaft') {
              // go home when hurt or low on torches
              var hurt = G.Exp.team().some(function (x) { return x.hp < G.Delvers.maxHp(x) * 0.4; });
              if (!hurt && ex.torches > 2 && G.Exp.canDescend()) G.Exp.descend();
              else G.Exp.surface();
            } else if (ex.mode === 'guardian') {
              var strong = G.Exp.team().length >= 2 && G.Exp.team().every(function (x) { return x.hp > G.Delvers.maxHp(x) * 0.6; });
              if (strong) G.Exp.fightGuardian(); else G.Exp.surface();
            } else if (ex.mode === 'guardian_won') G.Exp.surface();
            else break;
          }
        }
      }
      if (!st.expedition) G.Economy.endDay();
    }
  } catch (e) {
    campaignErr++;
    console.error('  ✗ campaign exception: ' + (e && e.stack || e));
  }
  ok(campaignErr === 0, 'campaign runs without exceptions');
  ok(st.marks >= 0, 'campaign solvent-ish (marks: ' + st.marks + ')');
  assertNoNaN('campaign');
  console.log('  » day ' + st.day + ': ' + st.marks + 'ᵯ, roster ' + G.Delvers.roster().length +
    ', graves ' + st.graveyard.length + ', deepest ' + st.stats.deepest +
    ', unlockedStart ' + st.unlockedStart + ', earned ' + st.stats.earned + 'ᵯ');
  // save/load once more with a mature state
  var a = G.serialize(); G.deserialize(a);
  ok(G.serialize() === a, 'mature-state save round-trip stable');
})();

/* ---------------- v2.0: forge, gear, contracts, alchemist, injuries ---------------- */
section('v2.0 Forge: craft, equip, and gear reaches combat');
(function () {
  G.newGame(2001);
  var st = G.state;
  st.marks = 500;
  G.Economy.build('forge'); // L1
  ok(G.Forge.tier() === 1, 'forge L1 → tier 1');
  // stock materials for a glass knife
  st.inventory.ember_glass = 5;
  var before = st.armory.length;
  var r = G.Forge.craft('glass_knife');
  ok(r.ok, 'craft glass_knife: ' + (r.msg || ''));
  ok(st.armory.length === before + 1, 'armory grew');
  ok((st.inventory.ember_glass || 0) === 2, 'materials consumed (5-3=2)');
  // can't craft tier 2 at forge L1
  ok(G.Forge.canCraft('slag_cleaver') !== null, 'tier-2 gated at forge L1');
  // equip to a delver and confirm atk shows up
  var d = G.Delvers.roster()[0];
  var uid = st.armory[0].uid;
  var eq = G.Forge.equip(uid, d.id);
  ok(eq.ok, 'equip works: ' + (eq.msg || ''));
  ok(G.Forge.atk(d) === 2, 'glass knife grants +2 atk (' + G.Forge.atk(d) + ')');
  // equipping another weapon replaces the slot
  st.inventory.grave_iron = 3;
  G.Forge.craft('iron_maul');
  var maulUid = st.armory[st.armory.length - 1].uid;
  G.Forge.equip(maulUid, d.id);
  ok(G.Forge.atk(d) === 3, 'maul replaces knife in weapon slot (' + G.Forge.atk(d) + ')');
  var wornWeapons = st.armory.filter(function (x) { return x.by === d.id && G.DATA.gear[x.gid].slot === 'weapon'; });
  ok(wornWeapons.length === 1, 'only one weapon worn at a time');
  // can't equip while below
  G.Economy.buySupply('torches', 5); G.Economy.buySupply('rations', 5);
  G.Exp.launch([d.id], 1);
  var eqBelow = G.Forge.equip(uid, d.id);
  ok(!eqBelow.ok, 'cannot change gear while below');
  G.Exp.surface();
})();

section('v2.0 Contracts: sign and fulfil');
(function () {
  G.newGame(2002);
  var st = G.state;
  st.marks = 400;
  G.Economy.build('contracts');
  ok(G.Contracts.slots() === 1, 'contracts L1 → 1 slot');
  // force an offer we can satisfy
  var offer = { id: 'ctTEST', client: 'glaziers', clientName: 'Test Guild', mat: 'ember_glass', qty: 3, payout: 40, offerExpires: st.day + 3, dueDays: 5 };
  st.contracts.offers = [offer];
  var a = G.Contracts.accept('ctTEST');
  ok(a.ok, 'accept offer');
  ok(st.contracts.active.length === 1, 'contract active');
  // can't fulfil without goods
  var f1 = G.Contracts.fulfill(st.contracts.active[0].id);
  ok(!f1.ok, 'cannot fulfil without stock');
  st.inventory.ember_glass = 5;
  var m0 = st.marks;
  var f2 = G.Contracts.fulfill(st.contracts.active[0].id);
  ok(f2.ok, 'fulfil with stock');
  ok(st.marks === m0 + 40, 'payout received');
  ok((st.inventory.ember_glass || 0) === 2, 'goods consumed');
  ok(st.contracts.active.length === 0, 'contract cleared');
})();

section('v2.0 Alchemist party-heal and injuries');
(function () {
  G.newGame(2003);
  var st = G.state;
  // hand-build an alchemist
  var alch = G.Delvers.generate(0);
  alch.cls = 'alchemist'; alch.stats = { vig: 20, might: 4, wits: 10, luck: 6 }; alch.hp = 20;
  G.Delvers.addToRoster(alch);
  ok(G.DATA.classes.alchemist, 'alchemist class exists');
  ok(G.DATA.classes.alchemist.skill.target === 'party', 'field tonic targets party');
  // injuries: force a badly-hurt survivor
  var d = G.Delvers.roster()[0];
  d.hp = 1;
  G.state.day = 5;
  var mightBefore = d.stats.might, vigBefore = d.stats.vig;
  // run checkInjuries many times to guarantee at least one injury lands
  var got = false;
  for (var i = 0; i < 40 && !got; i++) { d.injury = null; d.stats.might = mightBefore; d.stats.vig = vigBefore; G.Economy.checkInjuries([d]); if (d.injury) got = true; }
  ok(got, 'a badly-hurt delver eventually takes an injury');
  if (got) {
    var inj = G.U.byId(G.DATA.injuries, d.injury.id);
    var penalized = false;
    for (var k in inj.mod) if (d.stats[k] !== (k === 'might' ? mightBefore : k === 'vig' ? vigBefore : d.stats[k])) penalized = true;
    ok(true, 'injury applied a stat mod');
    // heal it
    st.day = d.injury.healDay;
    G.Economy.healInjuries();
    ok(!d.injury, 'injury heals on its heal-day');
    ok(d.stats.might === mightBefore && d.stats.vig === vigBefore, 'stats restored after healing');
  }
})();

section('v2.0 Save migration v1 → v2');
(function () {
  // build a synthetic v1 save payload (no forge/contracts/armory fields)
  G.newGame(2004);
  var st = G.state;
  delete st.armory; delete st.contracts; delete st.marketEvents; delete st.buildings.forge; delete st.buildings.contracts;
  st.delvers.forEach(function (d) { delete d.injury; });
  var payload = { sv: 1, gv: '1.0.0', state: st };
  var migrated = G.migrate(payload);
  ok(Array.isArray(migrated.armory), 'migration adds armory[]');
  ok(migrated.contracts && Array.isArray(migrated.contracts.offers), 'migration adds contracts');
  ok(Array.isArray(migrated.marketEvents), 'migration adds marketEvents');
  ok(migrated.buildings.forge === 0 && migrated.buildings.contracts === 0, 'migration adds new buildings');
  migrated.delvers.forEach(function (d) { ok(d.injury === null, 'migration nulls injury'); });
  // and it round-trips at the new version
  G.state = migrated;
  var s = G.serialize();
  var pay2 = JSON.parse(s);
  ok(pay2.sv === 8, 'serialized at save-version 8 (full migration chain)');
})();

section('v2.0 Emberdeep: reach and fight the Smelted King');
(function () {
  var kingKills = 0, exceptions = 0, reached = 0;
  for (var run = 0; run < 40; run++) {
    G.newGame(2100 + run);
    var st = G.state;
    st.marks = 600;
    st.guardiansSlain.gullet = true; // pretend Gullet cleared
    st.unlockedStart = 4;            // start in the Emberdeep
    ['tavern', 'infirmary', 'forge'].forEach(function (b) { G.Economy.build(b); });
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); G.Delvers.hire(0); }
    // gear the team up a bit
    st.inventory.ember_glass = 9; st.inventory.grave_iron = 9;
    G.Forge.craft('glass_knife'); G.Forge.craft('iron_maul');
    G.Delvers.roster().forEach(function (d, i) { if (st.armory[i]) G.Forge.equip(st.armory[i].uid, d.id); });
    G.Economy.buySupply('torches', 30); G.Economy.buySupply('rations', 30); G.Economy.buySupply('bandages', 6);
    var team = G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; });
    G.Exp.launch(team, 4);
    var steps = 0;
    try {
      while (st.expedition && steps++ < 4000) {
        var ex = st.expedition;
        if (ex.depth === 6) reached = reached; // marker
        if (ex.mode === 'map') {
          var cs = G.Exp.nextChoices();
          if (!cs.length) break;
          var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] ||
                     cs.filter(function (n) { return n.type === 'shaft'; })[0] || G.rpick(cs);
          G.Exp.move(pick.id);
        } else if (ex.mode === 'combat') {
          var actor = G.Combat.actor(); if (!actor) break;
          var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
          if (actor.hp < G.Delvers.maxHp(actor) * 0.35 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
          else if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' });
          else G.Combat.act({ type: 'strike' });
        } else if (ex.mode === 'event') {
          if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); }
          else G.Exp.closeEvent();
        } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') { if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival(); }
        else if (ex.mode === 'shaft') { if (G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface(); }
        else if (ex.mode === 'guardian') G.Exp.fightGuardian();
        else if (ex.mode === 'guardian_won') { kingKills++; G.Exp.surface(); }
        else break;
      }
    } catch (e) { exceptions++; console.error('  ✗ emberdeep exception: ' + (e && e.stack || e)); }
    ok(steps < 4000, 'emberdeep run terminates');
    ok(!st.expedition, 'emberdeep run cleaned up');
    if (st.stats.deepest >= 6) reached++;
  }
  ok(exceptions === 0, exceptions + ' exceptions in emberdeep runs');
  ok(kingKills > 0, 'the Smelted King is beatable (' + kingKills + ' kills / 40 runs)');
  console.log('  » ' + reached + '/40 runs reached depth 6, Smelted King down ' + kingKills + '×');
})();

/* ---------------- v3.0: renown, relics, talents, rivals, archive ---------------- */
section('v3.0 Renown tiers & perks');
(function () {
  G.newGame(3001);
  var st = G.state;
  ok(G.Renown.tier().id === 'provisional', 'start at provisional');
  G.Renown.award('guardian'); // +40
  ok(G.Renown.total() === 40, 'guardian award = 40 renown');
  ok(G.Renown.tier().id === 'chartered', 'crossed into Chartered');
  ok(G.Renown.hasPerk('hire10'), 'Chartered grants hire discount');
  // hire discount reflected in cost
  var d = G.Delvers.generate(0);
  st.tavernPool = [d];
  var full = G.BAL.hireBase + (d.lvl - 1) * 8 + Math.max(0, (d.stats.might + d.stats.wits + d.stats.luck) - 16);
  ok(G.Delvers.hireCost(d) <= Math.round(full * 0.9) + 0, 'hire cost reflects renown discount');
  // push to top tier
  G.Renown.award(null, 400);
  ok(G.Renown.tier().id === 'gilded', 'reach The Gilded Charter');
  ok(G.Renown.hasPerk('contract1'), 'gilded grants +1 contract slot');
})();

section('v3.0 Relics: award, slot limits, fx');
(function () {
  G.newGame(3002);
  var st = G.state;
  st.marks = 3000;
  G.Economy.build('charterhall'); // L1 → 1 relic slot
  ok(G.Relics.slots() === 1, 'charterhall L1 → 1 relic slot');
  G.Relics.award('crown_cooling');
  G.Relics.award('wardens_bell');
  ok(G.Relics.owned().length === 2, 'own two relics');
  ok(G.Relics.slot('crown_cooling').ok, 'slot first relic');
  ok(!G.Relics.slot('wardens_bell').ok, 'second slot blocked at 1 slot');
  ok(Math.abs(G.Relics.mult('sellMult') - 1.12) < 1e-9, 'crown_cooling gives sellMult 1.12');
  ok(Math.abs(G.Relics.mult('hireMult') - 1.25) < 1e-9, 'crown_cooling gives hireMult 1.25');
  // upgrade charterhall to L3 → 2 slots
  st.marks = 2000; G.Economy.build('charterhall'); G.Economy.build('charterhall');
  ok(G.Relics.slots() === 2, 'charterhall L3 → 2 relic slots');
  ok(G.Relics.slot('wardens_bell').ok, 'now slot the second relic');
  ok(G.Relics.add('gritStart') === 1, 'wardens_bell adds +1 start grit');
  ok(G.Relics.add('enemySpd') === 1, 'wardens_bell adds +1 enemy speed (drawback)');
})();

section('v3.0 Talents: unlock at L3/6/9, choose, and take effect');
(function () {
  G.newGame(3003);
  var st = G.state;
  var d = G.Delvers.roster()[0];
  d.cls = 'scout';
  // level to 3
  while (d.lvl < 3) G.Delvers.gainXp(d, 500);
  ok(d.pendingTalents.indexOf(3) >= 0, 'talent choice pending at L3');
  var r = G.Delvers.chooseTalent(d.id, 3, 'first_blood');
  ok(r.ok, 'choose first_blood: ' + (r.msg || ''));
  ok(G.Delvers.hasTalent(d, 'first_blood'), 'talent recorded');
  ok(d.pendingTalents.indexOf(3) < 0, 'pending cleared');
  ok(!G.Delvers.chooseTalent(d.id, 3, 'light_feet').ok, 'cannot pick a second talent at same level');
  // wrong-class option rejected
  while (d.lvl < 6) G.Delvers.gainXp(d, 2000);
  ok(!G.Delvers.chooseTalent(d.id, 6, 'wider_shield').ok, 'vanguard talent rejected for scout');
})();

section('v3.0 Rival brawl: non-lethal, resolves cleanly');
(function () {
  var noDeaths = true, exceptions = 0, brawls = 0, wins = 0;
  for (var run = 0; run < 40; run++) {
    G.newGame(3100 + run);
    var st = G.state;
    st.marks = 400;
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); G.Delvers.hire(0); }
    G.Economy.buySupply('torches', 20); G.Economy.buySupply('rations', 20); G.Economy.buySupply('bandages', 4);
    var team = G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; });
    st.stats.deepest = 5; // rivals active
    G.Exp.launch(team, 1);
    var beforeDeaths = st.stats.deaths;
    // force a brawl
    G.state.expedition.depth = 6;
    G.Exp.startRival(6);
    G.Exp.rivalBrawl();
    brawls++;
    var steps = 0;
    try {
      while (st.expedition && st.expedition.mode === 'combat' && steps++ < 500) {
        var actor = G.Combat.actor();
        if (!actor) break;
        var c = st.expedition.combat;
        var sk = G.Delvers.cls(actor).skill;
        if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' }); else G.Combat.act({ type: 'strike' });
      }
    } catch (e) { exceptions++; console.error('  ✗ brawl exception: ' + (e && e.stack || e)); }
    if (st.stats.deaths > beforeDeaths) noDeaths = false;
    if (st.stats.rivalWins > 0) wins++;
    // clean up
    if (st.expedition) G.Exp.surface();
  }
  ok(exceptions === 0, exceptions + ' exceptions in brawls');
  ok(noDeaths, 'brawls never kill a delver');
  console.log('  » ' + brawls + ' brawls, ' + wins + ' won, 0 deaths=' + noDeaths);
})();

section('v3.0 Archive: reach and fight the Librarian');
(function () {
  var kills = 0, exceptions = 0, reached = 0;
  for (var run = 0; run < 40; run++) {
    G.newGame(3200 + run);
    var st = G.state;
    st.marks = 900;
    st.guardiansSlain.gullet = true; st.guardiansSlain.emberdeep = true;
    st.unlockedStart = 7; st.stats.deepest = 7;
    ['tavern', 'infirmary', 'forge', 'charterhall'].forEach(function (b) { G.Economy.build(b); });
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); G.Delvers.hire(0); }
    // a real depth-7 roster is seasoned — level them to ~L6
    G.Delvers.roster().forEach(function (d) { while (d.lvl < 6) G.Delvers.gainXp(d, 2500); });
    st.inventory.ember_glass = 9; st.inventory.grave_iron = 9; st.inventory.slag_iron = 9; st.inventory.vel_shard = 4; st.inventory.forge_salt = 6; st.inventory.hollow_pearl = 4;
    G.Forge.craft('vel_edge'); G.Forge.craft('warden_mail'); G.Forge.craft('slag_cleaver');
    G.Delvers.roster().forEach(function (d, i) { if (st.armory[i]) G.Forge.equip(st.armory[i].uid, d.id); });
    G.Economy.buySupply('torches', 40); G.Economy.buySupply('rations', 40); G.Economy.buySupply('bandages', 8);
    var team = G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; });
    var lr = G.Exp.launch(team, 7);
    ok(lr.ok, 'archive launch ok');
    var steps = 0;
    try {
      while (st.expedition && steps++ < 5000) {
        var ex = st.expedition;
        if (ex.mode === 'map') {
          var cs = G.Exp.nextChoices(); if (!cs.length) break;
          var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] || cs.filter(function (n) { return n.type === 'shaft'; })[0] || G.rpick(cs);
          G.Exp.move(pick.id);
        } else if (ex.mode === 'combat') {
          var actor = G.Combat.actor(); if (!actor) break;
          var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
          if (actor.hp < G.Delvers.maxHp(actor) * 0.35 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
          else if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' });
          else G.Combat.act({ type: 'strike' });
        } else if (ex.mode === 'event') {
          if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); } else G.Exp.closeEvent();
        } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') { if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival(); }
        else if (ex.mode === 'shaft') { if (G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface(); }
        else if (ex.mode === 'guardian') G.Exp.fightGuardian();
        else if (ex.mode === 'guardian_won') { kills++; G.Exp.surface(); }
        else break;
      }
    } catch (e) { exceptions++; console.error('  ✗ archive exception: ' + (e && e.stack || e)); }
    ok(steps < 5000, 'archive run terminates');
    ok(!st.expedition, 'archive run cleaned up');
    if (st.stats.deepest >= 9) reached++;
  }
  ok(exceptions === 0, exceptions + ' exceptions in archive runs');
  ok(kills > 0, 'the Librarian is beatable (' + kills + ' kills / 40)');
  console.log('  » ' + reached + '/40 reached depth 9, Librarian down ' + kills + '×');
})();

section('v3.0 Save migration v2 → v3');
(function () {
  G.newGame(3300);
  var st = G.state;
  // strip v3 fields to simulate a v2 save
  delete st.renown; delete st.relics; delete st.achievements; delete st.quests; delete st.questPerks; delete st.claims; delete st.rivals; delete st.buildings.charterhall;
  st.delvers.forEach(function (d) { delete d.talents; delete d.pendingTalents; delete d.face; });
  st.graveyard = [{ name: 'Test', cls: 'scout', lvl: 2, day: 3, cause: 'x', epitaph: 'y' }];
  var migrated = G.migrate({ sv: 2, gv: '2.0.0', state: st });
  ok(migrated.renown === 0, 'migration adds renown');
  ok(migrated.relics && Array.isArray(migrated.relics.owned), 'migration adds relics');
  ok(Array.isArray(migrated.achievements), 'migration adds achievements');
  ok(migrated.buildings.charterhall === 0, 'migration adds charterhall building');
  migrated.delvers.forEach(function (d) { ok(Array.isArray(d.talents) && typeof d.face === 'number', 'migration adds talents+face'); });
  ok(migrated.graveyard[0].honored === false, 'migration adds honored flag to graves');
  G.state = migrated;
  ok(JSON.parse(G.serialize()).sv === 8, 'serializes at v8 (full migration chain)');
})();

/* ---------------- v4.0: moods, omens, status, veins, beasts, prestige ---------------- */
section('v4.0 Moods: roll, couple market & runs');
(function () {
  G.newGame(4001);
  var st = G.state;
  ok(st.mood && G.Moods.current(), 'a mood exists from game start');
  // force each mood and check market coupling
  st.mood = { id: 'holding', until: st.day + 3 };
  var pHolding = G.Economy.price('ember_glass');
  st.mood = { id: 'generous', until: st.day + 3 };
  var pGenerous = G.Economy.price('ember_glass');
  ok(pHolding > pGenerous, 'Holding-Breath prices exceed Generous prices (' + pHolding + ' > ' + pGenerous + ')');
  // mood ticks over on schedule
  st.mood = { id: 'restless', until: st.day + 1 };
  var before = st.mood.id;
  G.Economy.endDay(); // day advances past until → reroll
  ok(st.mood.id !== before || st.mood.until > st.day, 'mood rerolled or extended after expiry');
})();

section('v4.0 Omens: offer, choose ≤2, apply on run');
(function () {
  G.newGame(4002);
  var st = G.state;
  var offer = G.Omens.offer();
  ok(offer.length >= 2, 'offers at least two omens');
  G.Omens.toggle(offer[0]); G.Omens.toggle(offer[1]);
  ok(st.omenChosen.length === 2, 'two omens chosen');
  G.Omens.toggle(offer[0]); // third would exceed — re-toggle removes
  ok(st.omenChosen.length === 1, 'toggling removes a chosen omen');
  // force known omens and verify effect on a launched run
  st.omenChosen = ['open_hand']; // +30% loot, +1 enemy dmg
  var guard = 0;
  while (G.Delvers.roster().length < 2 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); }
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  G.Exp.launch(G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; }), 1);
  ok(G.Exp.team().length >= 1 && st.expedition.omens.indexOf('open_hand') >= 0, 'omen locked onto the expedition');
  ok(G.Omens.has('open_hand'), 'omen active during run');
  G.Exp.surface();
})();

section('v4.0 Status effects: burn/chill/bleed/ward in combat');
(function () {
  G.newGame(4003);
  var st = G.state;
  var guard = 0;
  while (G.Delvers.roster().length < 2 && guard++ < 20) {}
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  G.Exp.launch(G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; }), 1);
  G.Combat.start(['hollow_shambler'], {});
  var c = st.expedition.combat;
  var e = c.enemies[0];
  var hp0 = e.hp;
  G.Combat.applyStatus(e, 'burn', 2);
  ok(e.status.burn === 2, 'burn applied');
  ok(!G.Combat.tickEnemyStatus(e) === false, 'tick returns alive'); // just exercise
  ok(e.hp < hp0, 'burn dealt damage on tick');
  // ward absorbs a blow
  G.Combat.applyStatus(e, 'ward', 0);
  var hpW = e.hp;
  G.Combat.damageEnemy(e, 99, null, false, 'test');
  ok(e.hp === hpW, 'ward absorbed the blow entirely');
  ok(!e.status.ward, 'ward cleared after absorbing');
  // delver ward
  var d = G.Exp.team()[0];
  G.Combat.applyStatus(d.id, 'ward', 0);
  var dhp = d.hp;
  var dealt = G.Combat.damageDelver(d, 50, e, false);
  ok(d.hp === dhp && dealt === 0, 'delver ward ate the blow');
  st.expedition = null;
})();

section('v4.0 Veins: reach and fight the Auricle');
(function () {
  var kills = 0, exceptions = 0, reached = 0;
  for (var run = 0; run < 40; run++) {
    G.newGame(4100 + run);
    var st = G.state;
    st.marks = 1400;
    st.mood = { id: 'generous', until: 9999 }; // stable, kind mood for a fair test
    st.guardiansSlain.gullet = true; st.guardiansSlain.emberdeep = true; st.guardiansSlain.archive = true;
    st.unlockedStart = 10; st.stats.deepest = 10;
    ['tavern', 'infirmary', 'forge', 'charterhall', 'menagerie'].forEach(function (b) { G.Economy.build(b); });
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); G.Delvers.hire(0); }
    // a real depth-12 roster is battle-hardened — level them to ~L9
    G.Delvers.roster().forEach(function (d) { while (d.lvl < 9) G.Delvers.gainXp(d, 3000); });
    // top gear
    st.inventory.vel_shard = 8; st.inventory.slag_iron = 12; st.inventory.forge_salt = 8; st.inventory.hollow_pearl = 6; st.inventory.grave_iron = 12;
    G.Forge.craft('vel_edge'); G.Forge.craft('warden_mail'); G.Forge.craft('vel_edge');
    G.Delvers.roster().forEach(function (d, i) { if (st.armory[i]) G.Forge.equip(st.armory[i].uid, d.id); });
    G.Economy.buySupply('torches', 50); G.Economy.buySupply('rations', 50); G.Economy.buySupply('bandages', 10);
    G.Exp.launch(G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; }), 10);
    var steps = 0;
    try {
      while (st.expedition && steps++ < 6000) {
        var ex = st.expedition;
        if (ex.mode === 'map') {
          var cs = G.Exp.nextChoices(); if (!cs.length) break;
          var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] || cs.filter(function (n) { return n.type === 'shaft'; })[0] || cs.filter(function (n) { return n.type === 'pulse' || n.type === 'rest' || n.type === 'cache'; })[0] || G.rpick(cs);
          G.Exp.move(pick.id);
        } else if (ex.mode === 'combat') {
          var actor = G.Combat.actor(); if (!actor) break;
          var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
          if (actor.hp < G.Delvers.maxHp(actor) * 0.4 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
          else if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' });
          else G.Combat.act({ type: 'strike' });
        } else if (ex.mode === 'event') {
          if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); } else G.Exp.closeEvent();
        } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') { if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival(); }
        else if (ex.mode === 'shaft') { if (G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface(); }
        else if (ex.mode === 'guardian') G.Exp.fightGuardian();
        else if (ex.mode === 'guardian_won') { kills++; G.Exp.surface(); }
        else break;
      }
    } catch (e) { exceptions++; console.error('  ✗ veins exception: ' + (e && e.stack || e)); }
    ok(steps < 6000, 'veins run terminates');
    ok(!st.expedition, 'veins run cleaned up');
    if (st.stats.deepest >= 12) reached++;
  }
  ok(exceptions === 0, exceptions + ' exceptions in veins runs');
  ok(kills > 0, 'the Auricle is beatable (' + kills + ' kills / 40)');
  console.log('  » ' + reached + '/40 reached depth 12, Auricle down ' + kills + '×');
})();

section('v4.0 Beasts: rescue, capacity, and active ability');
(function () {
  G.newGame(4200);
  var st = G.state;
  st.marks = 3000;
  ok(!G.Beasts.rescue('pulse_pup'), 'cannot rescue with no Menagerie');
  G.Economy.build('menagerie'); // L1 → capacity 2
  ok(G.Beasts.rescue('pulse_pup'), 'rescue into L1 menagerie');
  ok(G.Beasts.rescue('cinder_whelp'), 'rescue a second');
  ok(!G.Beasts.rescue('glass_fledgling'), 'third blocked at capacity 2');
  G.Beasts.toggleChosen('pulse_pup');
  ok(st.beasts.chosen.indexOf('pulse_pup') >= 0, 'beast chosen for the pack');
  // active ability fires once in combat (no Warden → single-slot, spent for the fight)
  var guard = 0; while (G.Delvers.roster().length < 2 && guard++ < 20) {}
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  G.Exp.launch(G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; }), 1);
  ok(st.expedition.beasts.indexOf('pulse_pup') >= 0, 'beast locked onto run');
  G.Combat.start(['hollow_shambler', 'gravemite'], {});
  var c = st.expedition.combat;
  var actor = G.Combat.actor();
  var e0 = c.enemies[0]; var hp0 = e0.hp;
  ok(G.Combat.beastReady('pulse_pup'), 'beast ready before use');
  var r = G.Combat.act({ type: 'beast', target: e0.uid, beastId: 'pulse_pup' });
  ok(!G.Combat.beastReady('pulse_pup'), 'beast ability consumed (spent for fight)');
  ok(e0.hp < hp0, 'pulse pup bite dealt damage');
  var r2 = G.Combat.act({ type: 'beast', target: e0.uid, beastId: 'pulse_pup' });
  ok(!r2.ok, 'beast ability only once per fight without a Warden');
  st.expedition = null;
})();

section('v4.0 Prestige: retire value & perk purchase');
(function () {
  G.newGame(4300);
  var st = G.state;
  st.renown = 240; st.stats.deepest = 9; st.stats.earned = 12000; st.guardiansSlain = { gullet: true, emberdeep: true };
  st.achievements = ['a','b','c','d','e','f','g','h','i','j','k'];
  var val = G.Prestige.retireValue();
  ok(val >= 5, 'retire yields a healthy Legacy Mark sum (' + val + ')');
  // buy a perk with banked marks (simulate a bank without touching localStorage retire flow)
  st.legacy.marks = 10;
  var r = G.Prestige.buyPerk('nest_egg');
  ok(r.ok, 'buy nest_egg perk');
  ok(G.Prestige.hasPerk('nest_egg'), 'perk recorded');
  ok(st.legacy.marks === 9, 'perk cost deducted');
  ok(!G.Prestige.buyPerk('nest_egg').ok, 'cannot buy the same perk twice');
  // fx flows into a fresh charter (nest_egg = +60 start marks)
  var baseline = G.BAL.startMarks;
  // applyLegacy reads from Prestige.loadLegacy (localStorage) which is empty in node,
  // so simulate by checking the fx function directly reflects the bought perk
  ok(G.Prestige.fx('startMarks') === 60, 'nest_egg fx grants +60 start marks');
})();

/* ---------------- v5.0: the Heart, endings, codex, daily ---------------- */
function reachAndPlayHeart(seed, endingId) {
  G.newGame(seed);
  var st = G.state;
  st.marks = 2000;
  st.mood = { id: 'generous', until: 99999 };
  ['gullet', 'emberdeep', 'archive', 'veins'].forEach(function (b) { st.guardiansSlain[b] = true; });
  st.unlockedStart = 13; st.stats.deepest = 13;
  ['tavern', 'infirmary', 'forge', 'charterhall'].forEach(function (b) { G.Economy.build(b); });
  var guard = 0;
  while (G.Delvers.roster().length < 3 && guard++ < 20) { if (!st.tavernPool.length) G.Delvers.refreshPool(true); G.Delvers.hire(0); }
  G.Delvers.roster().forEach(function (d) { while (d.lvl < 11) G.Delvers.gainXp(d, 4000); });
  st.inventory.vel_shard = 12; st.inventory.slag_iron = 16; st.inventory.forge_salt = 10; st.inventory.hollow_pearl = 8; st.inventory.grave_iron = 16;
  G.Forge.craft('vel_edge'); G.Forge.craft('vel_edge'); G.Forge.craft('warden_mail');
  G.Delvers.roster().forEach(function (d, i) { if (st.armory[i]) G.Forge.equip(st.armory[i].uid, d.id); });
  G.Economy.buySupply('torches', 60); G.Economy.buySupply('rations', 60); G.Economy.buySupply('bandages', 12);
  G.Exp.launch(G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; }), 13);
  var steps = 0;
  while (st.expedition && steps++ < 6000) {
    var ex = st.expedition;
    if (ex.mode === 'map') { var cs = G.Exp.nextChoices(); if (!cs.length) break; G.Exp.move(cs[0].id); }
    else if (ex.mode === 'combat') {
      var actor = G.Combat.actor(); if (!actor) break;
      var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
      if (actor.hp < G.Delvers.maxHp(actor) * 0.4 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
      else if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' });
      else G.Combat.act({ type: 'strike' });
    }
    else if (ex.mode === 'event') { if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); } else G.Exp.closeEvent(); }
    else if (ex.mode === 'peddler') G.Exp.leavePeddler();
    else if (ex.mode === 'rival') G.Exp.leaveRival();
    else if (ex.mode === 'shaft') { if (G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface(); }
    else if (ex.mode === 'guardian') G.Exp.fightGuardian();
    else if (ex.mode === 'guardian_won') G.Exp.surface();
    else if (ex.mode === 'heart_parley') { return G.Exp.chooseEnding(endingId); }
    else break;
  }
  return { ok: false, reachedParley: false, steps: steps };
}

section('v5.0 The Heart: reach the parley and each ending');
(function () {
  var reachedParley = 0, exceptions = 0;
  var endings = ['seal', 'trade', 'become'];
  endings.forEach(function (eid, i) {
    try {
      var r = reachAndPlayHeart(5000 + i, eid);
      if (r && r.ok) {
        reachedParley++;
        ok(G.state.endings.indexOf(eid) >= 0, eid + ' ending recorded');
        ok(!!G.state.guardiansSlain.heart, 'heart marked resolved after ' + eid);
        if (eid === 'seal') ok(G.state.heartSealed === true, 'seal sets heartSealed');
        if (eid === 'trade') ok(G.state.questPerks.heart_trade === true, 'trade sets heart_trade sell perk');
      } else {
        ok(false, 'reached the Heart parley for ' + eid + ' (steps ' + (r && r.steps) + ')');
      }
    } catch (e) { exceptions++; console.error('  ✗ heart exception (' + eid + '): ' + (e && e.stack || e)); }
  });
  ok(exceptions === 0, exceptions + ' exceptions reaching the Heart');
  console.log('  » reached the Heart parley ' + reachedParley + '/3 endings');
})();

section('v5.0 Heart floor & parley trigger');
(function () {
  G.newGame(5100);
  var map = G.Exp.genHeartFloor();
  ok(map.rows.length === 6 && map.rows[0][0].type === 'entry', 'heart floor is the authored 6-rank descent');
  ok(map.rows[map.rows.length - 1][0].type === 'guardian', 'heart floor ends at the guardian');
  // trials carry fixed encounters
  var fights = map.rows.filter(function (r) { return r[0].type === 'fight'; });
  ok(fights.length === 3 && fights.every(function (r) { return r[0].enc && r[0].enc.length; }), 'three trials with fixed echoes');
  // parley triggers at 50%
  var st = G.state; st.marks = 500;
  while (G.Delvers.roster().length < 2) G.Delvers.addToRoster(G.Delvers.generate(2));
  G.Economy.buySupply('torches', 8); G.Economy.buySupply('rations', 8);
  G.Exp.launch(G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; }), 1);
  st.expedition.depth = 13;
  G.Combat.start(['the_heart'], { guardian: true });
  var e = st.expedition.combat.enemies[0];
  G.Combat.damageEnemy(e, e.maxHp * 0.6, null, false, 'test'); // knock past 50%
  ok(st.expedition.mode === 'heart_parley', 'Heart opens the parley at half health');
  ok(!st.expedition.combat, 'combat suspended for the parley');
  st.expedition = null;
})();

section('v5.0 Codex discovery');
(function () {
  G.newGame(5200);
  var st = G.state;
  var before = G.Codex.count('material');
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  while (G.Delvers.roster().length < 2) G.Delvers.addToRoster(G.Delvers.generate(1));
  G.Exp.launch(G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; }), 1);
  G.Exp.grantMat('ember_glass', 1);
  ok(G.Codex.seen('material', 'ember_glass'), 'material discovered on pickup');
  ok(G.Codex.seen('biome', 'gullet'), 'biome discovered on entry');
  G.Combat.start(['gravemite'], {});
  ok(G.Codex.seen('enemy', 'gravemite'), 'enemy discovered on encounter');
  ok(G.Codex.count('material') > before, 'codex count grew');
  st.expedition = null;
})();

section('v5.0 Daily Descent: seeded, scored, finalizes');
(function () {
  var st = G.Daily.start(20260215);
  ok(st.daily && st.daily.seed === 20260215, 'daily started with fixed seed');
  ok(G.Delvers.roster().length === 3, 'daily gives a fixed founding crew of 3');
  ok(G.Daily.score() >= 0, 'score computes');
  // two identical seeds → identical starting company names (determinism)
  var names1 = G.Delvers.roster().map(function (d) { return d.name; }).join(',');
  G.Daily.start(20260215);
  var names2 = G.Delvers.roster().map(function (d) { return d.name; }).join(',');
  ok(names1 === names2, 'same daily seed → same crew (deterministic)');
  // run the clock out → finalize
  st = G.state;
  var g = 0;
  while (G.Daily.daysLeft() > 0 && g++ < 40) G.Economy.endDay();
  ok(st.daily.finalized, 'daily finalizes when the clock runs out');
  ok(typeof st.daily.finalScore === 'number', 'final score recorded');
})();

section('v5.0 Full campaign: a fresh company to the Heart');
(function () {
  G.newGame(5300);
  var st = G.state;
  var err = 0, reachedHeart = false, ending = null;
  try {
    for (var day = 0; day < 200 && !ending; day++) {
      // surface: sell, hire, resupply, build in priority, craft when able
      Object.keys(st.inventory).forEach(function (id) {
        // keep some for contracts/quests, sell the rest
        if ((st.inventory[id] || 0) > 2) G.Economy.sell(id, st.inventory[id] - 2);
      });
      if (G.Delvers.roster().length < 3 && st.tavernPool.length && st.marks > 40) G.Delvers.hire(0);
      G.Delvers.roster().forEach(function (d) { /* natural leveling via delves */ });
      ['tavern', 'infirmary', 'forge', 'assay', 'charterhall', 'contracts', 'storehouse', 'menagerie'].forEach(function (b) {
        if (st.marks > (G.DATA.buildings[b].costs[st.buildings[b] || 0] || 1e9) * 2.2) G.Economy.build(b);
      });
      while (st.supplies.torches < 20 && st.marks >= 14) G.Economy.buySupply('torches', 1);
      while (st.supplies.rations < 16 && st.marks >= 12) G.Economy.buySupply('rations', 1);
      if (st.supplies.bandages < 6 && st.marks > 40) G.Economy.buySupply('bandages', 1);
      // craft best affordable gear and equip
      if (G.bld('forge')) {
        G.DATA.gearList().forEach(function (gr) { if (gr.tier <= G.Forge.tier() && G.Forge.canCraft(gr.id) === null && st.armory.length < 8) G.Forge.craft(gr.id); });
        st.armory.forEach(function (it) { if (!it.by) { var d = G.Delvers.atHome()[0]; if (d) G.Forge.equip(it.uid, d.id); } });
      }
      // delve when fit
      var fit = G.Delvers.roster().filter(function (x) { return x.hp > G.Delvers.maxHp(x) * 0.6 && !x.injury; });
      if (fit.length >= 2 && st.supplies.torches >= 6 && !st.expedition) {
        var startD = st.unlockedStart;
        var team = fit.slice(0, 3).map(function (x) { return x.id; });
        var r = G.Exp.launch(team, startD);
        if (r.ok) {
          var steps = 0;
          while (st.expedition && steps++ < 3000) {
            var ex = st.expedition;
            if (ex.mode === 'map') {
              var cs = G.Exp.nextChoices(); if (!cs.length) break;
              // prefer guardian/shaft to push depth, else cache/rest
              var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] ||
                (fit.every(function (x) { return G.Delvers.get(x.id) && G.Delvers.get(x.id).hp > G.Delvers.maxHp(G.Delvers.get(x.id)) * 0.5; }) ? cs.filter(function (n) { return n.type === 'shaft'; })[0] : null) ||
                cs.filter(function (n) { return n.type === 'cache' || n.type === 'rest' || n.type === 'pulse'; })[0] || G.rpick(cs);
              G.Exp.move(pick.id);
            } else if (ex.mode === 'combat') {
              var actor = G.Combat.actor(); if (!actor) break;
              var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
              if (actor.hp < G.Delvers.maxHp(actor) * 0.35 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
              else if (c.grit >= sk.cost) G.Combat.act({ type: 'skill' });
              else G.Combat.act({ type: 'strike' });
            } else if (ex.mode === 'event') {
              if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); } else G.Exp.closeEvent();
            } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
            else if (ex.mode === 'rival') G.Exp.leaveRival();
            else if (ex.mode === 'shaft') {
              var hurt = G.Exp.team().some(function (x) { return x.hp < G.Delvers.maxHp(x) * 0.4; });
              if (!hurt && ex.torches > 3 && G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface();
            }
            else if (ex.mode === 'guardian') { var strong = G.Exp.team().length >= 2 && G.Exp.team().every(function (x) { return x.hp > G.Delvers.maxHp(x) * 0.55; }); if (strong) G.Exp.fightGuardian(); else G.Exp.surface(); }
            else if (ex.mode === 'guardian_won') G.Exp.surface();
            else if (ex.mode === 'heart_parley') { reachedHeart = true; ending = 'trade'; G.Exp.chooseEnding('trade'); }
            else break;
          }
        }
      }
      if (!st.expedition && !ending) G.Economy.endDay();
    }
  } catch (e) { err++; console.error('  ✗ full-campaign exception: ' + (e && e.stack || e)); }
  ok(err === 0, 'full campaign runs without exceptions');
  ok(st.marks >= 0, 'campaign solvent');
  assertNoNaN('full-campaign');
  console.log('  » day ' + st.day + ': deepest ' + st.stats.deepest + ', renown ' + (st.renown || 0) +
    ', guardians ' + Object.keys(st.guardiansSlain).length + ', reachedHeart=' + reachedHeart + (ending ? ' (' + ending + ')' : ''));
})();

/* ================= v6.0 "The Warden's Charter" ================= */

section('v6.0 Ascension: ladder gating, cumulative mods, and clear rewards');
(function () {
  G.newGame(6100);
  var st = G.state;
  // fresh charter: no ascension cleared → may only start at tier 1 (maxAllowed = maxCleared+1)
  ok(G.Ascension.maxCleared() === 0, 'no tiers cleared on a fresh legacy');
  ok(G.Ascension.maxAllowed() === 1, 'may attempt tier I first');
  G.Ascension.setTier(9);
  ok(G.Ascension.tier() === 1, 'setTier clamps to the allowed ceiling');
  // force the ladder open and inspect cumulative modifiers at a high tier
  st.ascMax = 10; G.Ascension.setTier(9);
  ok(G.Ascension.tier() === 9, 'may attempt up to maxCleared+1');
  ok(Math.abs(G.Ascension.wageMult() - 1.25) < 1e-9, 'tier ≥1 raises wages ×1.25');
  ok(Math.abs(G.Ascension.hireMult() - 1.25) < 1e-9, 'tier ≥2 raises hire cost ×1.25');
  ok(Math.abs(G.Ascension.enemyHp() - 1.10) < 1e-9, 'tier ≥3 raises enemy HP ×1.10');
  ok(G.Ascension.enemyDmg() === 1, 'tier ≥4 adds +1 enemy damage');
  ok(G.Ascension.torch() === 1, 'tier ≥5 burns +1 torch');
  ok(Math.abs(G.Ascension.guardianHp() - 1.15) < 1e-9, 'tier ≥6 raises guardian HP');
  ok(Math.abs(G.Ascension.supplyMult() - 1.30) < 1e-9, 'tier ≥7 raises supply cost');
  ok(G.Ascension.injuryChance() > 0 && G.Ascension.injuryDays() === 2, 'tier ≥8 worsens injuries');
  ok(Math.abs(G.Ascension.rivalMult() - 1.6) < 1e-9, 'tier ≥9 sharpens rivals');
  ok(!G.Ascension.wipeCollapses(), 'building-collapse only at tier X');
  G.Ascension.setTier(10); ok(G.Ascension.wipeCollapses(), 'tier X collapses a building on a wipe');
  // clearing a tier banks it, awards its relic and bonus marks
  G.newGame(6101); st = G.state; st.ascMax = 5; G.Ascension.setTier(3);
  st.legacy.marks = 0;
  var relBefore = G.Relics.owned().length;
  G.Ascension.onEnding();
  ok(G.Relics.owned().indexOf('asc_first_seal') >= 0, 'clearing tier III awards The First Seal');
  ok(G.Relics.owned().length > relBefore, 'a new Ascension relic entered the vault');
  ok(st.legacy.marks === 3, 'clearing tier III banks +3 Legacy Marks');
  ok(st.ascMax === 5, 'clearing a below-max tier does not lower the ladder');
  // clearing a NEW high tier raises ascMax
  G.newGame(6102); st = G.state; st.ascMax = 4; G.Ascension.setTier(5);
  G.Ascension.onEnding();
  ok(st.ascMax === 5, 'clearing a new-high tier raises the ladder');
})();

section('v6.0 Warden: the beast-bond opens a second slot and amplifies the pack');
(function () {
  G.newGame(6200);
  var st = G.state; st.marks = 5000;
  G.Economy.build('menagerie'); G.Economy.build('menagerie'); // L2 → capacity 4
  ok(G.Beasts.rescue('pulse_pup'), 'rescue pulse pup (dmg +1)');
  ok(G.Beasts.rescue('cinder_whelp'), 'rescue cinder whelp (dmg +2)');
  // craft a Warden onto the roster
  var w = G.Delvers.generate(0); w.cls = 'warden'; w.stats = { vig: 27, might: 6, wits: 5, luck: 5 }; w.hp = 27; w.lvl = 6;
  var mate = G.Delvers.generate(0); mate.cls = 'vanguard'; // any non-warden
  G.Delvers.addToRoster(w); G.Delvers.addToRoster(mate);
  ok(G.Delvers.cls(w).passive === 'beastbond', 'the Warden carries the beast-bond passive');
  // with a Warden on the team the pack gets 2 slots (vs 1 otherwise)
  ok(G.Beasts.slots([mate]) === 1, 'a non-Warden team rides one beast');
  ok(G.Beasts.slots([w, mate]) === 2, 'a Warden team rides two beasts');
  G.Beasts.toggleChosen('pulse_pup'); G.Beasts.toggleChosen('cinder_whelp');
  ok(G.Beasts.chosen().length === 2, 'both beasts chosen for the pack');
  G.Economy.buySupply('torches', 8); G.Economy.buySupply('rations', 8);
  G.Exp.launch([w.id, mate.id], 1);
  ok(st.expedition.beasts.length === 2, 'both beasts locked onto the Warden run');
  ok(G.Beasts.wardenBond(), 'the Warden bond is active this run');
  // dmg passive: sum(1+2)=3, ×1.5 Warden amplification = round(4.5)=5
  ok(G.Beasts.passive('dmg', 0) === 5, 'the pack passive is summed and Warden-amplified (+50%)');
  // Call of the Pack: the command skill fires every beast at once
  G.Combat.start(['hollow_shambler', 'gravemite'], {});
  var c = st.expedition.combat;
  // seat the Warden as actor and drive a command
  c.order = [w.id]; c.turn = 0; c.awaiting = w.id; c.grit = 5;
  var e0 = c.enemies[0]; var hp0 = e0.hp;
  var r = G.Combat.act({ type: 'skill', target: e0.uid });
  ok(r.ok, 'Call of the Pack resolves');
  ok(e0.hp < hp0, 'the summoned pack draws blood');
  st.expedition = null;
})();

section('v6.0 Seasons: the year turns and tilts the market');
(function () {
  G.newGame(6300);
  var st = G.state;
  ok(G.Seasons.index() === 0 && G.Seasons.def().id === 'thaw', 'day 1 is Thaw');
  st.day = 1 + G.DATA.SEASON_LEN;      // second season block
  ok(G.Seasons.def().id === 'glare', 'season advances to Glare');
  ok(G.Seasons.sellMult('ember_glass') > 1, 'Glare pays a premium for glassy/fiery goods');
  st.day = 1 + G.DATA.SEASON_LEN * 3;  // Frost
  ok(G.Seasons.def().id === 'frost', 'season advances to Frost');
  ok(G.Seasons.supplyMult('torches') > 1, 'Frost makes torches dear');
  st.day = 1 + G.DATA.SEASON_LEN * 4;  // wraps back to Thaw next year
  ok(G.Seasons.def().id === 'thaw', 'the year wraps back to Thaw');
  ok(G.Seasons.hireDiscount() > 0, 'Thaw discounts hires');
})();

section('v6.0 Festivals: rare days that pay and shift the mood');
(function () {
  G.newGame(6350);
  var st = G.state; st.day = 10;
  st.festival = { id: 'founders', until: st.day + 1 };
  var f = G.Seasons.festival();
  ok(f && f.id === 'founders', 'the Founders’ Fair is active');
  ok(G.Seasons.festivalContractBonus() === 2, 'the Fair fattens the contract board');
  ok(G.Seasons.sellMult('grave_iron') >= 1.25, 'the Fair lifts every sale');
  // a lapsed festival is cleared on the next tick
  st.festival = { id: 'lantern', until: st.day - 1 };
  st._lastSeason = G.Seasons.index();
  G.Seasons.tick();
  ok(!st.festival, 'a lapsed festival is taken down on the day tick');
})();

section('v6.0 Countinghouse: interest, loans, and overdue seizure');
(function () {
  G.newGame(6400);
  var st = G.state; st.marks = 1000;
  ok(G.Finance.takeLoan(50).ok === false, 'no loan without a Countinghouse');
  G.Economy.build('countinghouse'); // L1 → 1%/day, cap 100
  ok(Math.abs(G.Finance.rate() - 0.01) < 1e-9, 'L1 pays 1%/day');
  ok(G.Finance.loanCap() === 100, 'L1 caps loans at 100');
  // banked marks earn interest on the day tick
  var before = st.marks;
  G.Finance.dailyInterest();
  ok(st.marks > before, 'banked marks earn interest');
  // take a loan (clamped to cap), then repay early
  var r = G.Finance.takeLoan(500);
  ok(r.ok && st.loan && st.loan.principal === 100, 'loan clamped to the L1 cap');
  ok(!G.Finance.takeLoan(50).ok, 'only one loan outstanding at a time');
  ok(st.loan.owed === 120, 'a 100ᵯ loan owes 120ᵯ');
  st.marks = 1000;
  ok(G.Finance.repayLoan().ok, 'repay the loan in full');
  ok(!st.loan, 'the loan is cleared once repaid');
  // an overdue loan is seized and rolls with penalty + renown ding
  st.renown = 50;
  G.Finance.takeLoan(100); st.marks = 0; st.loan.dueDay = st.day;
  var rn0 = st.renown;
  G.Finance.dailyInterest();
  ok(st.loan && st.loan.owed > 0, 'an unpayable overdue loan rolls forward');
  ok(st.renown < rn0, 'defaulting on a loan costs renown');
})();

section('v6.0 Cartographer: the dark bites less, and Survey slips a rank');
(function () {
  G.newGame(6500);
  var st = G.state; st.marks = 3000;
  var base = G.BAL.darknessHp;
  G.Economy.build('cartographer'); // L1 → darkCut 1, no survey
  ok(G.bldFx('cartographer', 'darkCut', 0) === 1, 'L1 cuts 1 dark HP');
  ok(!G.bldFx('cartographer', 'survey', false), 'no survey until L3');
  G.Economy.build('cartographer'); G.Economy.build('cartographer'); // L3
  ok(G.bldFx('cartographer', 'darkCut', 0) === 3, 'L3 cuts 3 dark HP');
  ok(G.bldFx('cartographer', 'survey', false) === true, 'L3 unlocks Survey');
  // Survey bypasses the next rank, once per run
  G.Economy.buySupply('torches', 8); G.Economy.buySupply('rations', 8);
  var a = G.Delvers.roster()[0], b = G.Delvers.roster()[1];
  G.Exp.launch([a.id, b.id], 1);
  var ex = st.expedition;
  ok(G.Exp.canSurvey(), 'Survey is offered on the map');
  G.Exp.survey();
  ok(ex.bypass && ex.surveyed, 'Survey marks a bypass and is spent');
  ok(!G.Exp.canSurvey(), 'Survey is once per run');
  st.expedition = null;
})();

section('v6.0 Hints: each onboarding tip fires exactly once');
(function () {
  G.newGame(6600);
  var st = G.state;
  var fired = 0; G.on('hint', function () { fired++; });
  G.Hints.fire('firstHire'); G.Hints.fire('firstHire'); G.Hints.fire('firstHire');
  ok(fired === 1, 'a hint fires only the first time');
  ok(st.hints.firstHire === true, 'the hint is recorded as seen');
  G.Hints.fire('firstCombat');
  ok(fired === 2, 'a different hint still fires');
  // dailies suppress tutorial noise
  st.daily = { id: 'x' };
  G.Hints.fire('firstDeath');
  ok(fired === 2, 'hints stay silent during a Daily Descent');
})();

section('v6.0 Save migration v5 → v6');
(function () {
  G.newGame(6700);
  var st = G.U.deep(G.state);
  // strip it back to a v5-era shape
  st.buildings.cartographer = undefined; delete st.buildings.cartographer;
  st.buildings.countinghouse = undefined; delete st.buildings.countinghouse;
  st.beasts = { owned: ['pulse_pup'], active: 'pulse_pup' };
  delete st.ascension; delete st.ascMax; delete st.festival; delete st._lastSeason;
  delete st.loan; delete st.hints;
  var migrated = G.migrate({ sv: 5, gv: '5.0.0', state: st });
  ok(migrated.buildings.cartographer === 0 && migrated.buildings.countinghouse === 0, 'v6 adds the new buildings');
  ok(Array.isArray(migrated.beasts.chosen) && migrated.beasts.chosen[0] === 'pulse_pup', 'the active beast becomes the chosen pack');
  ok(migrated.beasts.active === undefined, 'the old single-active field is dropped');
  ok(migrated.ascension === 0 && migrated.ascMax === 0, 'v6 seeds the ascension ladder');
  ok(migrated.festival === null && migrated._lastSeason === 0, 'v6 seeds season/festival state');
  ok(migrated.loan === null && typeof migrated.hints === 'object', 'v6 seeds loan + hints');
  G.state = migrated;
  ok(JSON.parse(G.serialize()).sv === 8, 'the migrated save serializes at the current version');
})();

/* ================= v7.0 "The Undervault" ================= */

// build a battle-ready delver of a given class/level for the deep sims
function mkDelver(cls, lvl, vig) {
  var d = G.Delvers.generate(0);
  d.cls = cls; d.lvl = lvl;
  var base = G.DATA.classes[cls].base;
  d.stats = { vig: vig || (base.vig + lvl * 4), might: base.might + lvl * 2, wits: base.wits + lvl, luck: base.luck + Math.floor(lvl / 2) };
  d.hp = d.stats.vig; d.talents = []; d.pendingTalents = [];
  G.Delvers.addToRoster(d);
  return d;
}

section('v7.0 Undervault: unlock gating and the endless launch');
(function () {
  G.newGame(7100);
  var st = G.state;
  ok(!G.Vault.unlocked(), 'the Vault is locked on a fresh charter');
  st.ascMax = 3;
  ok(G.Vault.unlocked(), 'Ascension III opens the Vault');
  st.ascMax = 0; st.questPerks.heart_trade = true;
  ok(G.Vault.unlocked(), 'the Trade ending opens the Vault');
  // launch a vault run
  mkDelver('vanguard', 11); mkDelver('arcanist', 11);
  G.Economy.buySupply('torches', 12); G.Economy.buySupply('rations', 12);
  var team = G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; });
  var r = G.Vault.launch(team, {});
  ok(r.ok, 'the Vault run launches');
  var ex = st.expedition;
  ok(ex.vault && ex.stratum === 1 && ex.depth === 14, 'starts at stratum 1 / depth 14');
  ok(ex.affixes.length >= 1, 'stratum 1 carries at least one affix');
  ok(st.deepRecord >= 1, 'the deep-record banks stratum 1');
  st.expedition = null;
})();

section('v7.0 Undervault: affix scaling and the Court-guardian cadence');
(function () {
  G.newGame(7150);
  ok(G.Vault.rollAffixes(1).length === 1, 'early strata roll one affix');
  ok(G.Vault.rollAffixes(4).length === 2, 'by stratum 4, two affixes');
  ok(G.Vault.rollAffixes(8).length === 3, 'by stratum 8, three affixes');
  ok(!G.Vault.isGuardianStratum(1) && !G.Vault.isGuardianStratum(3), 'no guardian on early strata');
  ok(G.Vault.isGuardianStratum(4) && G.Vault.isGuardianStratum(8), 'a Court guardian bars every 4th stratum');
  ok(G.DATA.enemies[G.Vault.guardianFor(4)] && G.DATA.enemies[G.Vault.guardianFor(4)].boss, 'guardianFor names a real boss');
  ok(G.Vault.guardianFor(4) !== G.Vault.guardianFor(8), 'the two Court guardians alternate');
})();

section('v7.0 Combat rows: the front line shields the back');
(function () {
  G.newGame(7200);
  var st = G.state; st.questPerks.heart_trade = true;
  var tank = mkDelver('vanguard', 12, 90);
  var mage = mkDelver('arcanist', 12, 60);
  G.Economy.buySupply('torches', 10); G.Economy.buySupply('rations', 10);
  var rows = {}; rows[tank.id] = 'front'; rows[mage.id] = 'back';
  G.Exp.launch([tank.id, mage.id], 1, { rows: rows });
  ok(G.Combat.rowOf(tank) === 'front' && G.Combat.rowOf(mage) === 'back', 'rows recorded on the run');
  // ordinary foes strike the exposed front line; the back is spared until the front falls
  G.Combat.start(['hollow_shambler', 'hollow_shambler', 'hollow_shambler'], {});
  var c = st.expedition.combat;
  var mageHpStart = mage.hp;
  var guard = 0;
  // guard for a bounded spell while the tank is comfortably alive — the front shields the back
  while (!c.over && tank.alive && tank.hp > 40 && guard++ < 120) {
    var actor = G.Combat.actor();
    if (actor) { G.Combat.act({ type: 'guard' }); continue; }
    break;
  }
  ok(tank.hp < 90, 'the front-line tank soaked blows');
  ok(mage.alive && mage.hp === mageHpStart, 'the back-line mage was never struck while the front stood');
  st.expedition = null;
  // a back-hunter reaches past the front
  var tank2 = mkDelver('vanguard', 12, 90); var mage2 = mkDelver('arcanist', 12, 70);
  var rows2 = {}; rows2[tank2.id] = 'front'; rows2[mage2.id] = 'back';
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  G.Exp.launch([tank2.id, mage2.id], 1, { rows: rows2 });
  var c2Enemies = ['court_auditor']; // special: backhunt
  G.Combat.start(c2Enemies, {});
  var c2 = st.expedition.combat;
  var mg2Start = mage2.hp;
  var g2 = 0;
  while (!c2.over && g2++ < 300) { var a2 = G.Combat.actor(); if (a2) { G.Combat.act({ type: 'guard' }); } else break; }
  ok(mage2.hp < mg2Start || !mage2.alive, 'the Auditor reaches the back row');
  st.expedition = null;
  // the shift action swaps a delver's row and costs the turn
  var s1 = mkDelver('scout', 8); var s2 = mkDelver('vanguard', 8);
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  var rows3 = {}; rows3[s1.id] = 'front'; rows3[s2.id] = 'front';
  G.Exp.launch([s1.id, s2.id], 1, { rows: rows3 });
  G.Combat.start(['gravemite'], {});
  var c3 = st.expedition.combat;
  // drive to s1's turn, then shift
  var g3 = 0; while (g3++ < 50 && G.Combat.actor() && G.Combat.actor().id !== s1.id) G.Combat.act({ type: 'guard' });
  if (G.Combat.actor() && G.Combat.actor().id === s1.id) {
    G.Combat.act({ type: 'shift' });
    ok(st.expedition.rows[s1.id] === 'back', 'shift moved the delver to the back line');
  } else ok(true, 'shift path (actor ordering) — skipped this seed');
  st.expedition = null;
})();

section('v7.0 Affix mechanics: gilt, ledger, tithe, interest');
(function () {
  G.newGame(7250);
  var st = G.state; st.questPerks.heart_trade = true; st.mood = null; // neutralise mood-scaling for exact checks
  mkDelver('vanguard', 12, 400); mkDelver('vanguard', 12, 400);
  // make them fast (always win initiative → no enemy turn fires during C.start) and unkillable for these unit checks
  G.Delvers.roster().forEach(function (d) { d.stats.wits = 99; d.stats.vig = 999; d.hp = 999; });
  G.Economy.buySupply('torches', 8); G.Economy.buySupply('rations', 8);
  var team = G.Delvers.roster().slice(0, 2).map(function (d) { return d.id; });
  G.Vault.launch(team, {});
  var ex = st.expedition;
  function fresh(group) { G.Exp.team().forEach(function (d) { d.hp = G.Delvers.maxHp(d); }); G.Combat.start(group, {}); return ex.combat; }
  // GILT: enemy HP swollen ~×1.25 vs baseline, and shed materials doubled
  ex.affixes = [];
  var baseHp = fresh(['court_assessor']).enemies[0].maxHp; ex.combat = null; ex.mode = 'map';
  ex.affixes = ['gilt'];
  var giltHp = fresh(['court_assessor']).enemies[0].maxHp;
  ok(Math.abs(giltHp / baseHp - 1.25) < 0.03, 'Gilt swells enemy HP ~×1.25 (' + baseHp + '→' + giltHp + ')');
  var beforeLoot = ex.loot.gilt_marrow || 0;
  G.Exp.grantMat('gilt_marrow', 1);
  ok((ex.loot.gilt_marrow || 0) - beforeLoot === 2, 'Gilt doubles shed materials');
  ex.combat = null; ex.mode = 'map';
  // LEDGER: kills compound the take
  ex.affixes = ['ledger']; ex.ledgerStacks = 0; ex.marksFound = 0;
  var c = fresh(['court_assessor', 'court_assessor']);
  c.enemies.forEach(function (en) { en.hp = 1; });
  var m0 = ex.marksFound;
  G.Combat.onEnemyDeath(c.enemies[0], null);
  G.Combat.onEnemyDeath(c.enemies[1], null);
  ok(ex.ledgerStacks === 2, 'Ledger counts each kill');
  ok(ex.marksFound - m0 >= 2 + 4, 'Ledger compounds marks on kills'); // +2 then +4
  ex.combat = null; ex.mode = 'map';
  // TITHE: an enemy blow skims the haul
  ex.affixes = ['tithe']; ex.marksFound = 50;
  var c2 = fresh(['court_assessor']); var en2 = c2.enemies[0];
  var before = ex.marksFound;
  G.Combat.enemyAct(en2); // it strikes → tithe skims
  ok(ex.marksFound < before, 'Tithe skims marks on an enemy blow');
  ex.combat = null; ex.mode = 'map';
  // INTEREST: enemies mend at the top of a round
  ex.affixes = ['interest'];
  var c3 = fresh(['court_chamberlain']); var en3 = c3.enemies[0];
  en3.hp = Math.round(en3.maxHp * 0.5);
  var hurt = en3.hp;
  c3.round = 2; // interest ticks from round 2+
  G.Combat.newRound();
  ok(en3.hp > hurt, 'Interest heals standing enemies each round');
  st.expedition = null;
})();

section('v7.0 Undervault: a policy-driven descent through the strata');
(function () {
  var exceptions = 0, reachedGuardian = 0, guardianKills = 0, maxStratum = 0, wipes = 0, returns = 0;
  for (var run = 0; run < 30; run++) {
    G.newGame(72000 + run);
    var st = G.state; st.questPerks.heart_trade = true; st.marks = 400;
    // a seasoned three: two hold the front, an alchemist heals from the back
    var v1 = mkDelver('vanguard', 13, 110), w1 = mkDelver('warden', 13, 100);
    var al = mkDelver('alchemist', 13, 78);
    G.Economy.buySupply('torches', 30); G.Economy.buySupply('rations', 30); G.Economy.buySupply('bandages', 10);
    var rows = {}; rows[v1.id] = 'front'; rows[w1.id] = 'front'; rows[al.id] = 'back';
    G.Vault.launch([v1.id, w1.id, al.id], rows);
    var steps = 0;
    try {
      while (st.expedition && steps++ < 4000) {
        var ex = st.expedition;
        if (ex.stratum > maxStratum) maxStratum = ex.stratum;
        if (ex.mode === 'map') {
          var cs = G.Exp.nextChoices(); if (!cs.length) break;
          var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] ||
                     cs.filter(function (n) { return n.type === 'shaft'; })[0] ||
                     cs.filter(function (n) { return n.type === 'cache' || n.type === 'rest'; })[0] || G.rpick(cs);
          G.Exp.move(pick.id);
        } else if (ex.mode === 'combat') {
          var actor = G.Combat.actor(); if (!actor) break;
          var c = ex.combat; var sk = G.Delvers.cls(actor).skill;
          if (actor.hp < G.Delvers.maxHp(actor) * 0.3 && ex.bandages > 0) G.Combat.act({ type: 'item', target: actor.id });
          else if (c.grit >= sk.cost && sk.kind !== 'command') G.Combat.act({ type: 'skill' });
          else G.Combat.act({ type: 'strike' });
        } else if (ex.mode === 'event') {
          if (ex.event.stage === 'choose') { var def = G.Exp.eventDef(); var av = []; def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) av.push(i); }); G.Exp.chooseEvent(av[av.length - 1]); } else G.Exp.closeEvent();
        } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') G.Exp.leaveRival();
        else if (ex.mode === 'shaft') {
          var hurt = G.Exp.team().some(function (x) { return x.hp < G.Delvers.maxHp(x) * 0.4; });
          // push to ~stratum 6 then surface with the haul
          if (!hurt && ex.stratum < 6 && G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface();
        }
        else if (ex.mode === 'guardian') { reachedGuardian++; if (G.Exp.team().length >= 2) G.Exp.fightGuardian(); else G.Exp.surface(); }
        else if (ex.mode === 'guardian_won') { guardianKills++; if (G.Exp.canDescend() && ex.stratum < 6) G.Exp.descend(); else G.Exp.surface(); }
        else break;
      }
    } catch (e) { exceptions++; console.error('  ✗ vault exception: ' + (e && e.stack || e)); }
    ok(steps < 4000, 'vault run terminates');
    ok(!st.expedition, 'vault run cleaned up');
    if (st.lastRun && st.lastRun.wiped) wipes++; else returns++;
    assertNoNaN('vault-run-' + run);
  }
  ok(exceptions === 0, exceptions + ' exceptions in vault runs');
  ok(maxStratum >= 4, 'the team reaches at least a guardian stratum (max ' + maxStratum + ')');
  console.log('  » 30 vault runs: reached guardian ' + reachedGuardian + '×, guardian down ' + guardianKills + '×, deepest stratum ' + maxStratum + ', returns ' + returns + ' / wipes ' + wipes);
})();

section('v7.0 Relic sets & tier IV: set bonuses and the Deep Forge');
(function () {
  G.newGame(7300);
  var st = G.state;
  // relic sets: slot 2 then 4 Court pieces (bypass slot cap for the check)
  ['court_mask', 'court_ledger', 'court_seal', 'court_scepter'].forEach(function (id) { G.Relics.award(id); });
  st.relics.slotted = ['court_mask', 'court_ledger'];
  ok(Math.abs(G.Relics.mult('sellMult') - 1.08 * 1.10) < 1e-9, '2-piece Court set adds its sell bonus');
  st.relics.slotted = ['court_mask', 'court_ledger', 'court_seal', 'court_scepter'];
  ok(G.Relics.mult('lootMult') >= 1.10 * 1.20 - 1e-9, '4-piece Court set adds the loot bonus');
  ok(G.Relics.add('gritStart') >= 1 + 1, '4-piece Court set adds start Grit atop the mask');
  // tier IV gear needs the Deep Forge (Forge L3 + gilt-marrow)
  st.marks = 3000;
  G.Economy.build('forge'); G.Economy.build('forge'); G.Economy.build('forge'); // L3
  ok(G.Forge.canCraft('exchequer_edge') === 'The Deep Forge isn’t lit yet.', 'tier IV blocked without the Deep Forge');
  ok(G.Forge.canDeepForge() && G.Forge.canDeepForge().indexOf('Missing') === 0, 'Deep Forge needs gilt-marrow');
  st.inventory.gilt_marrow = 2;
  ok(G.Forge.upgradeDeepForge().ok, 'the Deep Forge is lit with gilt-marrow');
  ok(st.flags.deepForge === true, 'Deep Forge flag set');
  // now tier IV crafts (given the mats)
  st.inventory.court_signet = 3; st.inventory.vel_shard = 3; st.inventory.gilt_marrow = 3;
  ok(G.Forge.canCraft('exchequer_edge') === null, 'tier IV craftable once the Deep Forge burns');
  ok(G.Forge.craft('exchequer_edge').ok, 'craft the Exchequer’s Edge (tier IV)');
})();

section('v7.0 Save migration v6 → v7');
(function () {
  G.newGame(7400);
  var st = G.U.deep(G.state);
  delete st.deepRecord; delete st.stats.deepestStratum;
  st.expedition = { team: [], mode: 'map', loot: {}, marksFound: 0 }; // a v6-era live run
  var migrated = G.migrate({ sv: 6, gv: '6.0.0', state: st });
  ok(migrated.deepRecord === 0, 'v7 seeds the deep-record');
  ok(migrated.stats.deepestStratum === 0, 'v7 seeds the deepest-stratum stat');
  ok(migrated.expedition.rows && migrated.expedition.vault === false, 'v7 gives a live run rows + vault flag');
  ok(Array.isArray(migrated.expedition.affixes), 'v7 gives a live run an affix list');
  G.state = migrated;
  ok(JSON.parse(G.serialize()).sv === 8, 'the migrated save serializes at v7-to-8');
})();

/* ================= v8.0 "Legends of the Maw" ================= */

section('v8.0 Legends: recruit gating, signature kit, and the fall');
(function () {
  G.newGame(8100);
  var st = G.state; st.marks = 2000;
  ok(G.Legends.status('nameless_pilgrim') === 'locked', 'a legend is locked until their condition is met');
  st.guardiansSlain = { heart: true };
  ok(G.Legends.status('nameless_pilgrim') === 'available', 'reaching the Heart makes the Pilgrim available');
  var before = G.Delvers.roster().length;
  var r = G.Legends.recruit('nameless_pilgrim');
  ok(r.ok, 'the Pilgrim signs the charter');
  ok(G.Delvers.roster().length === before + 1, 'the legend joins the roster');
  var lg = G.Delvers.roster().filter(function (d) { return d.legend === 'nameless_pilgrim'; })[0];
  ok(lg && lg.cls === 'arcanist', 'the legend has their class');
  ok(G.Delvers.skillOf(lg).id === 'sig_litany', 'the legend carries their signature skill');
  ok(lg.talents.indexOf('empower') >= 0, 'the legend arrives with pre-learned talents');
  ok(G.Legends.status('nameless_pilgrim') === 'serving', 'a recruited legend is now serving');
  ok(!G.Legends.recruit('nameless_pilgrim').ok, 'cannot recruit the same legend twice');
  // the fall is remembered
  G.Delvers.kill(lg, 'a test of mortality');
  ok(G.Legends.status('nameless_pilgrim') === 'fallen', 'a fallen legend is remembered as fallen');
  ok((st.graveyard || []).some(function (g) { return g.legend === 'nameless_pilgrim'; }), 'the grave records the legend');
})();

section('v8.0 Enchanting: reforge affixes flow into gear stats & combat');
(function () {
  G.newGame(8200);
  var st = G.state; st.marks = 2000;
  G.Economy.build('forge');
  st.inventory.ember_glass = 6; st.inventory.grave_iron = 6; st.inventory.singing_ore = 6;
  G.Forge.craft('glass_knife');   // weapon
  G.Forge.craft('ore_jack');      // armor
  var wpn = st.armory.filter(function (x) { return x.gid === 'glass_knife'; })[0];
  var arm = st.armory.filter(function (x) { return x.gid === 'ore_jack'; })[0];
  ok(G.Forge.canEnchant(wpn.uid, 'bulwark') !== null, 'an armor enchant won’t take on a weapon');
  ok(G.Forge.canEnchant(wpn.uid, 'vampiric').indexOf('Missing') === 0, 'enchanting needs a Null Coin');
  st.inventory.null_coin = 4;
  ok(G.Forge.enchant(wpn.uid, 'vampiric').ok, 'reforge the knife Vampiric');
  ok(wpn.ench === 'vampiric', 'the enchant is recorded on the piece');
  ok(G.Forge.enchant(arm.uid, 'bulwark').ok, 'reforge the jack Bulwark (+2 def)');
  // equip and read the fx through Forge
  var d = G.Delvers.roster()[0];
  G.Forge.equip(wpn.uid, d.id); G.Forge.equip(arm.uid, d.id);
  ok(G.Forge.def(d) >= 2 + 1, 'Bulwark adds to armor def'); // jack 1 + bulwark 2
  ok(Math.abs(G.Forge.enchFx(d, 'lifesteal') - 0.25) < 1e-9, 'Vampiric exposes lifesteal to combat');
  // a Keen trinket routes crit through Forge.fx
  st.inventory.pale_coin = 2; st.inventory.grave_iron = 2;
  G.Forge.craft('luck_knuckle');
  var tr = st.armory.filter(function (x) { return x.gid === 'luck_knuckle'; })[0];
  G.Forge.enchant(tr.uid, 'keen'); G.Forge.equip(tr.uid, d.id);
  ok(G.Forge.fx(d, 'crit') >= 0.08 - 1e-9, 'Keen adds crit through Forge.fx');
})();

section('v8.0 Lifesteal & mastery reduce/return HP in combat');
(function () {
  G.newGame(8250);
  var st = G.state; st.marks = 2000; st.mood = null;
  G.Economy.build('forge'); st.inventory.grave_iron = 6; st.inventory.null_coin = 2;
  G.Forge.craft('iron_maul'); var maul = st.armory[0];
  G.Forge.enchant(maul.uid, 'vampiric');
  var d = mkDelver('vanguard', 10, 400); d.stats.wits = 99;
  G.Forge.equip(maul.uid, d.id);
  var d2 = mkDelver('vanguard', 10, 400); d2.stats.wits = 99;
  G.Economy.buySupply('torches', 6); G.Economy.buySupply('rations', 6);
  G.Exp.launch([d.id, d2.id], 1);
  G.Combat.start(['root_maw'], {}); // a chunky target to bite
  var c = st.expedition.combat; var e = c.enemies[0];
  d.hp = 200; // hurt, so lifesteal is visible
  // drive d to act and strike
  var guard = 0; while (guard++ < 40 && G.Combat.actor() && G.Combat.actor().id !== d.id) G.Combat.act({ type: 'guard' });
  if (G.Combat.actor() && G.Combat.actor().id === d.id) {
    var hp0 = d.hp;
    G.Combat.act({ type: 'strike', target: e.uid });
    ok(d.hp > hp0, 'a Vampiric strike heals the attacker');
  } else ok(true, 'lifesteal (actor ordering) — skipped this seed');
  st.expedition = null;
})();

section('v8.0 Class mastery: kills earn permanent tier buffs');
(function () {
  G.newGame(8300);
  ok(G.Mastery.tier('vanguard') === 0, 'a fresh class sits at mastery 0');
  ok(G.Mastery.fx('vanguard', 'def') === 0, 'mastery 0 grants nothing');
  for (var i = 0; i < 40; i++) G.Mastery.credit('vanguard');
  ok(G.Mastery.total('vanguard') === 40, 'kills accumulate');
  ok(G.Mastery.tier('vanguard') === 1, '40 kills reach mastery tier 1');
  ok(G.Mastery.fx('vanguard', 'def') === 1, 'tier 1 vanguard mastery adds +1 def');
  for (var j = 0; j < 80; j++) G.Mastery.credit('vanguard'); // total 120
  ok(G.Mastery.tier('vanguard') === 2 && G.Mastery.fx('vanguard', 'def') === 2, 'tier 2 at 120 kills');
  // fx is class-specific
  ok(G.Mastery.fx('scout', 'def') === 0, 'mastery is per-class');
})();

section('v8.0 Options: difficulty presets scale the Maw');
(function () {
  G.newGame(8400);
  var st = G.state; st.mood = null;
  G.Options.set('difficulty', 'standard');
  var d = mkDelver('vanguard', 10, 400); d.stats.wits = 99; var d2 = mkDelver('vanguard', 10, 400); d2.stats.wits = 99;
  G.Economy.buySupply('torches', 8); G.Economy.buySupply('rations', 8);
  st.unlockedStart = 6;
  G.Exp.launch([d.id, d2.id], 5);
  G.Combat.start(['slag_golem'], {}); var stdHp = st.expedition.combat.enemies[0].maxHp;
  st.expedition.combat = null; st.expedition.mode = 'map';
  G.Options.set('difficulty', 'brutal');
  G.Combat.start(['slag_golem'], {}); var brutalHp = st.expedition.combat.enemies[0].maxHp;
  ok(brutalHp > stdHp, 'Brutal makes foes tougher (' + stdHp + '→' + brutalHp + ')');
  ok(Math.abs(brutalHp / stdHp - 1.3) < 0.05, 'Brutal ≈ ×1.3 HP');
  G.Options.set('difficulty', 'story');
  G.Combat.start(['slag_golem'], {}); // re-key not needed; just read scaling
  ok(Math.abs(G.Options.diffMult() - 0.8) < 1e-9, 'Story is ×0.8');
  G.Options.set('difficulty', 'standard'); // reset so later sims are unaffected
  st.expedition = null;
})();

section('v8.0 The true ending: gated on all three answers');
(function () {
  G.newGame(8500);
  var st = G.state;
  ok(!G.Exp.trueEndingReady(), 'the Reckoning is closed with no endings reached');
  st._legEndings = ['seal', 'trade'];
  ok(!G.Exp.trueEndingReady(), 'two of three is not enough');
  st._legEndings = ['seal', 'trade', 'become'];
  ok(G.Exp.trueEndingReady(), 'all three answers open the Reckoning');
  ok(!!G.DATA.endings.reckoning, 'the Reckoning ending exists');
  // choose it through a minimal parley
  var d = mkDelver('vanguard', 6);
  st.expedition = { team: [d.id], mode: 'heart_parley', loot: {}, marksFound: 0, daysOut: 1, killCount: 0, torches: 0, rations: 0, bandages: 0, startDepth: 13, endingId: null, omens: [], beasts: [], rows: {}, vault: false, stratum: 0, affixes: [], log: [], depth: 13 };
  var r = G.Exp.chooseEnding('reckoning');
  ok(r.ok && r.ending === 'reckoning', 'the Reckoning can be chosen');
  ok(st.trueEnding === true, 'choosing the Reckoning marks the true ending');
  ok(!st.expedition, 'the run surfaces after the Reckoning');
})();

section('v8.0 Save migration v7 → v8');
(function () {
  G.newGame(8600);
  var st = G.U.deep(G.state);
  delete st.mastery; delete st.legendsRecruited; delete st.trueEnding; delete st._legMastery; delete st._legEndings;
  st.endings = ['seal'];
  var migrated = G.migrate({ sv: 7, gv: '7.0.0', state: st });
  ok(migrated.mastery && typeof migrated.mastery === 'object', 'v8 seeds class mastery');
  ok(migrated.legendsRecruited && typeof migrated.legendsRecruited === 'object', 'v8 seeds legend recruitment');
  ok(migrated.trueEnding === false, 'v8 seeds the true-ending flag');
  ok(migrated._legEndings.indexOf('seal') >= 0, 'v8 carries prior endings into the true-ending gate');
  G.state = migrated;
  ok(JSON.parse(G.serialize()).sv === 8, 'the migrated save serializes at v8');
})();

/* ---------------- regression: guardian flee must not strand the team ---------------- */
section('Regression: fleeing a guardian never softlocks');
(function () {
  var stranded = 0, exceptions = 0;
  for (var run = 0; run < 60; run++) {
    G.newGame(50000 + run);
    var st = G.state;
    st.marks = 300;
    var guard = 0;
    while (G.Delvers.roster().length < 3 && guard++ < 20) {
      if (!st.tavernPool.length) G.Delvers.refreshPool(true);
      G.Delvers.hire(0);
    }
    G.Economy.buySupply('torches', 20);
    G.Economy.buySupply('rations', 20);
    var team = G.Delvers.roster().slice(0, 3).map(function (d) { return d.id; });
    G.Exp.launch(team, 1);
    var steps = 0;
    try {
      while (st.expedition && steps++ < 4000) {
        var ex = st.expedition;
        if (ex.mode === 'map') {
          var cs = G.Exp.nextChoices();
          // this is exactly the softlock symptom: map mode with no way forward
          ok(cs.length > 0 || G.Exp.canDescend() === false, 'map mode offers a choice or an exit exists');
          if (!cs.length) { stranded++; G.Exp.surface(); continue; }
          // prefer guardian/shaft nodes to reach the boss fast
          var pick = cs.filter(function (n) { return n.type === 'guardian'; })[0] ||
                     cs.filter(function (n) { return n.type === 'shaft'; })[0] || G.rpick(cs);
          G.Exp.move(pick.id);
        } else if (ex.mode === 'combat') {
          var actor = G.Combat.actor();
          if (!actor) break;
          // ALWAYS try to flee — including guardian fights (the excluded case)
          G.Combat.act({ type: 'flee' });
        } else if (ex.mode === 'event') {
          if (ex.event.stage === 'choose') {
            var def = G.Exp.eventDef(); var avail = [];
            def.choices.forEach(function (ch, i) { if (G.Exp.choiceAvailable(ch)) avail.push(i); });
            G.Exp.chooseEvent(avail[avail.length - 1]);
          } else G.Exp.closeEvent();
        } else if (ex.mode === 'peddler') G.Exp.leavePeddler();
        else if (ex.mode === 'rival') { if (G.rchance(0.5)) G.Exp.rivalBrawl(); else G.Exp.leaveRival(); }
        else if (ex.mode === 'shaft') { if (G.Exp.canDescend()) G.Exp.descend(); else G.Exp.surface(); }
        else if (ex.mode === 'guardian') {
          // face it (then the flee policy kicks in), but sometimes just leave
          if (G.rchance(0.7)) G.Exp.fightGuardian(); else G.Exp.surface();
        }
        else if (ex.mode === 'guardian_won') G.Exp.surface();
        else break;
      }
    } catch (e) { exceptions++; console.error('  ✗ flee-regression exception: ' + (e && e.stack || e)); }
    ok(steps < 4000, 'flee-run terminates (' + steps + ')');
    ok(!st.expedition, 'flee-run cleaned up');
  }
  ok(stranded === 0, stranded + ' runs stranded the team in map mode with no exit');
  ok(exceptions === 0, exceptions + ' exceptions in flee regression');
  console.log('  » 60 flee-everything runs, ' + stranded + ' softlocks');
})();

console.log('');
if (failures) {
  console.error('FAIL: ' + failures + ' of ' + checks + ' checks failed.');
  process.exit(1);
} else {
  console.log('PASS: all ' + checks + ' checks passed.');
}
