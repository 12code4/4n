/* Turn-based combat: initiative, Strike/Guard/Skill/Item/Flee, shared Grit. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var C = (G.Combat = {});

  C.scale = function (depth) { return 1 + (depth - 1) * 0.07; };

  C.start = function (groupIds, opts) {
    opts = opts || {};
    var st = G.state, ex = st.expedition;
    var depth = ex ? ex.depth : 1;
    var s = C.scale(depth);
    var enemies = groupIds.map(function (id, i) {
      var def = G.DATA.enemies[id];
      var hp = Math.round(def.hp * (def.boss ? 1 : s));
      return {
        uid: 'e' + i + '_' + id, id: id, name: def.name,
        hp: hp, maxHp: hp,
        dmg: [Math.round(def.dmg[0] * s), Math.round(def.dmg[1] * s)],
        spd: def.spd, crit: def.crit || 0.05,
        special: def.special || null, boss: !!def.boss,
        rotIdx: 0, look: def.look, tags: def.tags || []
      };
    });
    ex.mode = 'combat';
    ex.combat = {
      enemies: enemies, grit: G.BAL.gritStart, round: 0,
      queue: [], turn: -1, over: false, result: null,
      guardian: !!opts.guardian, firstStrike: !!opts.firstStrike,
      guarding: {}, taunt: {}, shaken: {}, fledFail: false
    };
    // fear check
    var tags = {};
    enemies.forEach(function (e) { e.tags.forEach(function (t) { tags[t] = true; }); });
    G.Exp.team().forEach(function (d) {
      var fear = G.Delvers.fear(d), trait = G.Delvers.trait(d);
      var shaken = false;
      if (fear.cond === 'noTorch' && ex.torches <= 0 && !trait.noDark) shaken = true;
      if (fear.cond === 'deep' && depth >= 3 && !trait.noDark) shaken = true;
      if (fear.cond === 'beast' && tags.beast) shaken = true;
      if (fear.cond === 'undead' && tags.undead) shaken = true;
      if (fear.cond === 'fire' && tags.fire) shaken = true;
      if (shaken) {
        ex.combat.shaken[d.id] = true;
        G.Exp.elog(d.name + ' is shaken — ' + fear.name.toLowerCase() + '.', 'bad');
      }
    });
    var names = enemies.map(function (e) { return e.name; }).join(', ');
    G.Exp.elog('Ambush! ' + names + '!', 'bad');
    C.newRound();
    C.advance();
    G.emit('combatStart');
  };

  C.cur = function () { return G.state.expedition && G.state.expedition.combat; };

  C.eff = function (d, stat) {
    var c = C.cur();
    var v = d.stats[stat];
    if (c && c.shaken[d.id] && (stat === 'might' || stat === 'wits')) v = Math.max(1, v - G.BAL.fearStatPenalty);
    return v;
  };

  C.newRound = function () {
    var c = C.cur();
    c.round++;
    var q = [];
    G.Exp.team().forEach(function (d) {
      q.push({ kind: 'delver', id: d.id, spd: C.eff(d, 'wits') + G.rint(0, 3) + (c.firstStrike && c.round === 1 ? 100 : 0) });
    });
    c.enemies.forEach(function (e) {
      if (e.hp > 0) q.push({ kind: 'enemy', id: e.uid, spd: e.spd + G.rint(0, 3) });
    });
    q.sort(function (a, b) { return b.spd - a.spd; });
    c.queue = q;
    c.turn = -1;
    // tick taunts
    for (var k in c.taunt) { c.taunt[k]--; if (c.taunt[k] <= 0) delete c.taunt[k]; }
  };

  /* advance until a delver's turn or combat over */
  C.advance = function () {
    var c = C.cur();
    if (!c || c.over) return;
    for (;;) {
      c.turn++;
      if (c.turn >= c.queue.length) { C.newRound(); continue; }
      var t = c.queue[c.turn];
      if (t.kind === 'delver') {
        var d = G.Delvers.get(t.id);
        if (!d || !d.alive) continue;
        delete c.guarding[d.id]; // guard lasts until your next turn
        c.awaiting = t.id;
        G.emit('combat');
        return;
      } else {
        var e = null;
        for (var i = 0; i < c.enemies.length; i++) if (c.enemies[i].uid === t.id) e = c.enemies[i];
        if (!e || e.hp <= 0) continue;
        C.enemyAct(e);
        if (C.checkEnd()) return;
      }
    }
  };

  C.actor = function () {
    var c = C.cur();
    return c && c.awaiting ? G.Delvers.get(c.awaiting) : null;
  };

  /* ---------- delver actions ---------- */
  C.act = function (action) {
    var c = C.cur();
    var d = C.actor();
    if (!c || c.over || !d) return { ok: false };
    var ex = G.state.expedition;
    c.awaiting = null;

    switch (action.type) {
      case 'strike': {
        var e = C.enemyByUid(action.target) || C.firstLivingEnemy();
        if (!e) break;
        var dmg = C.eff(d, 'might') + G.rint(0, 3);
        var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck;
        var crit = G.rchance(critP);
        if (crit) dmg = Math.round(dmg * G.BAL.critMult);
        C.damageEnemy(e, dmg, d, crit);
        c.grit = Math.min(G.BAL.gritMax, c.grit + 1);
        break;
      }
      case 'guard': {
        c.guarding[d.id] = true;
        c.grit = Math.min(G.BAL.gritMax, c.grit + 1);
        G.Exp.elog(d.name + ' guards.', 'info');
        G.emit('fx', { t: 'guard', who: d.id });
        break;
      }
      case 'skill': {
        var skill = G.Delvers.cls(d).skill;
        if (c.grit < skill.cost) { c.awaiting = d.id; return { ok: false, msg: 'Not enough Grit.' }; }
        c.grit -= skill.cost;
        C.useSkill(d, skill, action.target);
        break;
      }
      case 'item': {
        if (ex.bandages <= 0) { c.awaiting = d.id; return { ok: false, msg: 'No bandages left.' }; }
        var ally = action.target ? G.Delvers.get(action.target) : d;
        if (!ally || !ally.alive) ally = d;
        ex.bandages--;
        var heal = G.rint(G.BAL.bandageHeal[0], G.BAL.bandageHeal[1]);
        ally.hp = Math.min(G.Delvers.maxHp(ally), ally.hp + heal);
        G.Exp.elog(d.name + ' bandages ' + (ally === d ? 'their wounds' : ally.name) + ' (+' + heal + ').', 'good');
        G.emit('fx', { t: 'heal', who: ally.id, amt: heal });
        break;
      }
      case 'flee': {
        var p = G.BAL.fleeBase + C.eff(d, 'wits') * G.BAL.fleePerWits + (G.Delvers.trait(d).fleeBonus || 0);
        // scouts are flight experts
        if (d.cls === 'scout') p += 0.1;
        if (c.guardian) p -= 0.15;
        if (G.rchance(G.U.clamp(p, 0.1, 0.9))) {
          C.fleeSucceed();
          return { ok: true, fled: true };
        }
        G.Exp.elog(d.name + ' looks for the way out — there isn’t one yet.', 'bad');
        c.fledFail = true;
        break;
      }
    }
    if (!C.checkEnd()) C.advance();
    return { ok: true };
  };

  C.useSkill = function (d, skill, targetUid) {
    var c = C.cur();
    if (skill.target === 'allEnemies') {
      var base = skill.power(d);
      var living = c.enemies.filter(function (e) { return e.hp > 0; });
      living.forEach(function (e) {
        C.damageEnemy(e, base + G.rint(0, 2), d, false, skill.name);
      });
    } else {
      var e = C.enemyByUid(targetUid) || C.firstLivingEnemy();
      if (!e) return;
      var dmg = skill.power(d) + G.rint(0, 3);
      var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck + (skill.critBonus || 0);
      var crit = G.rchance(critP);
      if (crit) dmg = Math.round(dmg * G.BAL.critMult);
      C.damageEnemy(e, dmg, d, crit, skill.name);
      if (skill.taunt) {
        c.taunt[d.id] = skill.taunt + 1;
        G.Exp.elog(d.name + ' draws every eye in the dark.', 'info');
      }
    }
  };

  C.enemyByUid = function (uid) {
    var c = C.cur();
    for (var i = 0; i < c.enemies.length; i++) if (c.enemies[i].uid === uid && c.enemies[i].hp > 0) return c.enemies[i];
    return null;
  };
  C.firstLivingEnemy = function () {
    var c = C.cur();
    for (var i = 0; i < c.enemies.length; i++) if (c.enemies[i].hp > 0) return c.enemies[i];
    return null;
  };

  C.damageEnemy = function (e, dmg, src, crit, label) {
    var st = G.state, ex = st.expedition;
    e.hp -= dmg;
    G.Exp.elog((label ? label + ': ' : '') + (src ? src.name : '?') + ' hits ' + e.name + ' for ' + dmg + (crit ? ' — critical!' : '.'), crit ? 'crit' : 'info');
    G.emit('fx', { t: 'hit', side: 'enemy', uid: e.uid, amt: dmg, crit: crit });
    if (e.hp <= 0) {
      e.hp = 0;
      C.onEnemyDeath(e, src);
    }
  };

  C.onEnemyDeath = function (e, src) {
    var st = G.state, ex = st.expedition;
    var def = G.DATA.enemies[e.id];
    ex.killCount++;
    st.stats.kills++;
    if (src) src.kills++;
    // loot
    (def.loot || []).forEach(function (L) {
      if (G.rchance(L.p)) G.Exp.grantMat(L.id, G.rint(L.q[0], L.q[1]));
    });
    if (def.marks) {
      var m = G.rint(def.marks[0], def.marks[1]);
      if (m > 0) { ex.marksFound += m; }
    }
    var xp = G.BAL.xpPerEnemy(ex.depth, e.maxHp) * (def.boss ? G.BAL.guardianXp : 1);
    var team = G.Exp.team();
    team.forEach(function (d) { G.Delvers.gainXp(d, Math.ceil(xp / team.length)); });
    G.Exp.elog(e.name + ' is destroyed.', 'good');
    G.emit('fx', { t: 'death', uid: e.uid });
  };

  /* ---------- enemy turns ---------- */
  C.enemyAct = function (e) {
    var c = C.cur();
    var ex = G.state.expedition;
    var team = G.Exp.team();
    if (!team.length) return;

    if (e.special === 'slow' && c.round % 2 === 1 && !e.boss) {
      G.Exp.elog(e.name + ' gathers itself…', 'info');
      G.emit('fx', { t: 'windup', uid: e.uid });
      return;
    }

    var action = 'strike';
    if (e.boss && e.rotIdx !== undefined) {
      var def = G.DATA.enemies[e.id];
      action = def.rotation[e.rotIdx % def.rotation.length];
      e.rotIdx++;
    }

    if (action.indexOf('summon:') === 0) {
      var sid = action.split(':')[1];
      if (c.enemies.filter(function (x) { return x.hp > 0; }).length < 5) {
        var sdef = G.DATA.enemies[sid];
        var s = C.scale(ex.depth);
        var hp = Math.round(sdef.hp * s);
        c.enemies.push({
          uid: 'e' + c.enemies.length + '_' + sid + '_' + c.round, id: sid, name: sdef.name,
          hp: hp, maxHp: hp, dmg: [Math.round(sdef.dmg[0] * s), Math.round(sdef.dmg[1] * s)],
          spd: sdef.spd, crit: sdef.crit || 0.05, special: sdef.special || null,
          boss: false, rotIdx: 0, look: sdef.look, tags: sdef.tags || []
        });
        G.Exp.elog(e.name + ' tolls its bell — a ' + sdef.name + ' answers!', 'bad');
        G.emit('fx', { t: 'summon', uid: e.uid });
      } else {
        action = 'strike';
      }
    }

    if (action === 'aoe') {
      G.Exp.elog(e.name + ' sweeps the whole line!', 'bad');
      team.slice().forEach(function (d) {
        var dmg = G.rint(e.dmg[0], e.dmg[1]);
        C.damageDelver(d, Math.max(1, Math.round(dmg * 0.7)), e);
      });
      return;
    }

    if (action === 'strike') {
      // targeting
      var target = null;
      var taunters = team.filter(function (d) { return c.taunt[d.id]; });
      if (taunters.length) target = G.rpick(taunters);
      else if (e.special === 'lowest') {
        target = team[0];
        team.forEach(function (d) { if (d.hp < target.hp) target = d; });
      } else target = G.rpick(team);

      var dmg = G.rint(e.dmg[0], e.dmg[1]);
      if (e.special === 'slow') dmg = Math.round(dmg * 1.5);
      var crit = G.rchance(e.crit);
      if (crit) dmg = Math.round(dmg * 1.5);
      C.damageDelver(target, dmg, e, crit);

      if (e.special === 'tithe' && ex.marksFound > 0) {
        var steal = Math.min(ex.marksFound, G.rint(1, 3));
        ex.marksFound -= steal;
        G.Exp.elog(e.name + ' collects ' + steal + 'ᵯ into its bowl.', 'bad');
      }
    }
  };

  C.damageDelver = function (d, dmg, e, crit) {
    var c = C.cur();
    var ex = G.state.expedition;
    if (c.guarding[d.id]) dmg = Math.max(1, Math.round(dmg * G.BAL.guardReduce));
    d.hp -= dmg;
    G.Exp.elog(e.name + ' hits ' + d.name + ' for ' + dmg + (crit ? ' — savage!' : '.'), 'bad');
    G.emit('fx', { t: 'hit', side: 'delver', who: d.id, amt: dmg, crit: crit });
    if (d.hp <= 0) {
      // infirmary L3 brink ward
      if (G.bldFx('infirmary', 'brinkWard', false) && !ex.brinkUsed) {
        ex.brinkUsed = true;
        d.hp = 1;
        G.Exp.elog('The infirmary’s brink-charm flares — ' + d.name + ' refuses to fall!', 'good');
        G.emit('fx', { t: 'brink', who: d.id });
        return;
      }
      G.Delvers.kill(d, 'slain by ' + e.name + ' at depth ' + ex.depth);
      G.emit('fx', { t: 'delverDeath', who: d.id });
    }
  };

  /* ---------- resolution ---------- */
  C.fleeSucceed = function () {
    var c = C.cur();
    var ex = G.state.expedition;
    c.over = true; c.result = 'fled';
    // fleeing spills loot
    var loss = G.BAL.fleeLootLoss;
    for (var id in ex.loot) {
      var drop = Math.floor(ex.loot[id] * loss);
      if (drop > 0) ex.loot[id] -= drop;
      if (ex.loot[id] <= 0) delete ex.loot[id];
    }
    G.Exp.elog('The team breaks and runs — packs lightened in the scramble.', 'bad');
    ex.combat = null;
    ex.mode = 'map';
    G.emit('combatEnd', 'fled');
    G.emit('expedition');
  };

  C.checkEnd = function () {
    var c = C.cur();
    if (!c || c.over) return true;
    var ex = G.state.expedition;
    var team = G.Exp.team();
    var living = c.enemies.filter(function (e) { return e.hp > 0; });

    if (!team.length) {
      c.over = true; c.result = 'wiped';
      G.emit('combatEnd', 'wiped');
      G.Exp.wipe();
      return true;
    }
    if (!living.length) {
      c.over = true; c.result = 'won';
      var wasGuardian = c.guardian;
      ex.combat = null;
      if (wasGuardian) {
        var biome = G.DATA.biomeForDepth(ex.depth);
        var st = G.state;
        if (!st.guardiansSlain[biome.id]) {
          st.guardiansSlain[biome.id] = true;
          G.Exp.unlockJournal('guardian_' + biome.id);
          // open the next biome for direct starts
          var nextStart = biome.depths[1] + 1;
          if (nextStart <= G.DATA.maxDepth()) {
            st.unlockedStart = Math.max(st.unlockedStart, nextStart);
            G.log('The stair below the ' + biome.name + ' stands open. Expeditions may now start at depth ' + nextStart + '.', 'story');
          } else {
            G.log('The ' + biome.name + ' guardian is down. For now, the Maw goes no deeper. (More below in future charters.)', 'story');
          }
        }
        ex.mode = 'guardian_won';
      } else {
        ex.mode = 'map';
      }
      G.emit('combatEnd', 'won');
      G.emit('expedition');
      return true;
    }
    return false;
  };
})();
