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
  'js/data/buildings.js',
  'js/systems/state.js', 'js/systems/delvers.js', 'js/systems/economy.js',
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
