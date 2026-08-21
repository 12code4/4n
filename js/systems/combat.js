/* Turn-based combat: initiative, Strike/Guard/Skill/Item/Flee, shared Grit. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var C = (G.Combat = {});

  C.scale = function (depth) { return 1 + (depth - 1) * 0.07; };

  /* null-safe gear accessors (Forge system is v2.0; may be absent in old saves/tests) */
  function gAtk(d) { return G.Forge ? G.Forge.atk(d) : 0; }
  function gDef(d) { return G.Forge ? G.Forge.def(d) : 0; }
  function gFx(d, k) { return G.Forge ? G.Forge.fx(d, k) : 0; }
  /* null-safe relic accessors (v3.0) */
  function relAdd(k) { return G.Relics ? G.Relics.add(k) : 0; }
  function relMult(k) { return G.Relics ? G.Relics.mult(k) : 1; }
  function relFlag(k) { return G.Relics ? G.Relics.flag(k) : false; }
  function talent(d, id) { return G.Delvers.hasTalent(d, id); }
  /* does the team field a class with a given passive right now? */
  C.teamPassive = function (name) {
    var team = G.Exp.team();
    for (var i = 0; i < team.length; i++) {
      if (G.Delvers.cls(team[i]).passive === name) return true;
    }
    return false;
  };

  C.start = function (groupIds, opts) {
    opts = opts || {};
    var st = G.state, ex = st.expedition;
    var depth = ex ? ex.depth : 1;
    var s = C.scale(depth);
    var enemies = groupIds.map(function (id, i) {
      var def = G.DATA.enemies[id];
      var hp = Math.round(def.hp * (def.boss ? 1 : s));
      var relSpd = relAdd('enemySpd');
      return {
        uid: 'e' + i + '_' + id, id: id, name: def.name,
        hp: hp, maxHp: hp,
        dmg: [Math.round(def.dmg[0] * s), Math.round(def.dmg[1] * s)],
        spd: def.spd + relSpd, crit: def.crit || 0.05,
        special: def.special || null, boss: !!def.boss,
        rotIdx: 0, look: def.look, tags: def.tags || [], nonlethal: !!def.nonlethal,
        indexed: false
      };
    });
    ex.mode = 'combat';
    // starting grit: base + best gritStart trinket on the team + still_point talent + relic bell
    var startGrit = G.BAL.gritStart + relAdd('gritStart');
    G.Exp.team().forEach(function (d) {
      var g = G.BAL.gritStart + gFx(d, 'gritStart') + relAdd('gritStart') + (talent(d, 'still_point') ? 1 : 0);
      startGrit = Math.max(startGrit, g);
    });
    ex.combat = {
      enemies: enemies, grit: G.U.clamp(startGrit, 0, G.BAL.gritMax), round: 0,
      queue: [], turn: -1, over: false, result: null,
      guardian: !!opts.guardian, firstStrike: !!opts.firstStrike,
      brawl: !!opts.brawl, rivalId: opts.rivalId || null,
      guarding: {}, taunt: {}, shaken: {}, fledFail: false,
      reforged: 0, downed: {}, vanished: {}, revivified: false, unbroken: {}
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
        if (!d || !d.alive || c.downed[d.id]) continue; // downed (brawl) delvers skip their turn
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
        var dmg = C.eff(d, 'might') + gAtk(d) + G.rint(0, 3);
        dmg = Math.round(dmg * C.curseMult() * (talent(d, 'first_blood') && c.round === 1 ? 1.5 : 1));
        var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck + gFx(d, 'crit');
        var crit = G.rchance(critP);
        var critMult = talent(d, 'assassinate') ? 2.25 : G.BAL.critMult;
        if (crit) dmg = Math.round(dmg * critMult);
        C.damageEnemy(e, dmg, d, crit);
        if (crit && talent(d, 'exploit') && e.hp > 0) C.damageEnemy(e, Math.round(dmg * 0.5), d, false, 'exploit');
        c.grit = Math.min(G.BAL.gritMax, c.grit + 1);
        break;
      }
      case 'guard': {
        c.guarding[d.id] = true;
        c.grit = Math.min(G.BAL.gritMax, c.grit + 1);
        if (talent(d, 'second_wind')) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + 3); G.emit('fx', { t: 'heal', who: d.id, amt: 3 }); }
        if (talent(d, 'wider_shield')) {
          var others = G.Exp.team().filter(function (x) { return x.id !== d.id; });
          if (others.length) c.guarding[G.rpick(others).id] = true;
        }
        G.Exp.elog(d.name + ' guards.', 'info');
        G.emit('fx', { t: 'guard', who: d.id });
        break;
      }
      case 'skill': {
        var skill = G.Delvers.cls(d).skill;
        var cost = skill.cost - (skill.id === 'emberlance' && talent(d, 'overchannel') ? 1 : 0);
        if (c.grit < cost) { c.awaiting = d.id; return { ok: false, msg: 'Not enough Grit.' }; }
        c.grit -= Math.max(0, cost);
        C.useSkill(d, skill, action.target);
        break;
      }
      case 'item': {
        if (ex.bandages <= 0) { c.awaiting = d.id; return { ok: false, msg: 'No bandages left.' }; }
        var ally = action.target ? G.Delvers.get(action.target) : d;
        if (!ally || !ally.alive) ally = d;
        ex.bandages--;
        var heal = G.rint(G.BAL.bandageHeal[0], G.BAL.bandageHeal[1]);
        if (C.teamPassive('bandage40')) heal = Math.round(heal * 1.4); // Alchemist on the line
        if (G.Exp.team().some(function (x) { return talent(x, 'deep_draught'); })) heal += 3;
        ally.hp = Math.min(G.Delvers.maxHp(ally), ally.hp + heal);
        G.Exp.elog(d.name + ' bandages ' + (ally === d ? 'their wounds' : ally.name) + ' (+' + heal + ').', 'good');
        G.emit('fx', { t: 'heal', who: ally.id, amt: heal });
        break;
      }
      case 'flee': {
        if (relFlag('fleeAlways')) { C.fleeSucceed(); return { ok: true, fled: true }; }
        var p = G.BAL.fleeBase + C.eff(d, 'wits') * G.BAL.fleePerWits + (G.Delvers.trait(d).fleeBonus || 0) + gFx(d, 'flee');
        // scouts are flight experts; Light Feet helps the whole party
        if (d.cls === 'scout') p += 0.1;
        G.Exp.team().forEach(function (x) { if (talent(x, 'light_feet')) p += 0.15; });
        if (c.guardian) p -= 0.15;
        if (G.rchance(G.U.clamp(p, 0.1, 0.9))) {
          C.fleeSucceed();
          return { ok: true, fled: true };
        }
        // Vanish: once per fight a failed flee still ends the turn without a counter
        if (talent(d, 'vanish') && !c.vanished[d.id]) {
          c.vanished[d.id] = true;
          G.Exp.elog(d.name + ' slips into shadow — no opening for the enemy.', 'info');
          break;
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
    if (skill.kind === 'heal') {
      var amt = skill.power(d) + (talent(d, 'stronger_brew') ? 3 : 0);
      if (talent(d, 'great_tonic')) amt = Math.round(amt * 1.5);
      // Revivify: bring back a teammate who fell this fight
      if (talent(d, 'revivify') && !c.revivified) {
        var fallen = G.state.expedition.team.map(G.Delvers.get).filter(function (x) { return x && !x.alive && c.diedThisFight && c.diedThisFight[x.id]; });
        if (fallen.length) {
          var rv = fallen[0];
          rv.alive = true; rv.hp = 1; c.revivified = true;
          // remove from graveyard (undo the death record)
          for (var gi = G.state.graveyard.length - 1; gi >= 0; gi--) { if (G.state.graveyard[gi].name === rv.name && !G.state.graveyard[gi].honored) { G.state.graveyard.splice(gi, 1); G.state.stats.deaths = Math.max(0, G.state.stats.deaths - 1); break; } }
          G.Exp.elog(d.name + '’s revivify draught drags ' + rv.name + ' back from the brink!', 'good');
          G.emit('fx', { t: 'brink', who: rv.id });
        }
      }
      if (skill.target === 'party') {
        G.Exp.team().forEach(function (a) {
          a.hp = Math.min(G.Delvers.maxHp(a), a.hp + amt);
          G.emit('fx', { t: 'heal', who: a.id, amt: amt });
        });
        G.Exp.elog(d.name + ' works ' + skill.name + ' — the whole team steadies (+' + amt + ').', 'good');
      } else {
        var a2 = C.pickHealTarget(targetUid, d);
        a2.hp = Math.min(G.Delvers.maxHp(a2), a2.hp + amt);
        G.emit('fx', { t: 'heal', who: a2.id, amt: amt });
        G.Exp.elog(d.name + ' works ' + skill.name + ' on ' + a2.name + ' (+' + amt + ').', 'good');
      }
      // Acid Flask: the tonic also burns every enemy
      if (talent(d, 'acid_flask')) {
        c.enemies.filter(function (e) { return e.hp > 0; }).forEach(function (e) { C.damageEnemy(e, 3, d, false, 'acid'); });
      }
      return;
    }
    var mend = talent(d, 'mend_weave');
    if (mend) {
      var low = C.pickHealTarget(null, d);
      low.hp = Math.min(G.Delvers.maxHp(low), low.hp + 4);
      G.emit('fx', { t: 'heal', who: low.id, amt: 4 });
    }
    var empower = talent(d, 'empower') ? 1.4 : 1;
    if (skill.target === 'allEnemies') {
      var base = Math.round((skill.power(d) + gAtk(d) + (talent(d, 'wide_lance') ? 2 : 0)) * empower * C.curseMult());
      var living = c.enemies.filter(function (e) { return e.hp > 0; });
      var hitCount = living.length;
      living.forEach(function (e) {
        C.damageEnemy(e, base + G.rint(0, 2), d, false, skill.name);
      });
      if (talent(d, 'siphon') && hitCount) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + hitCount); G.emit('fx', { t: 'heal', who: d.id, amt: hitCount }); }
    } else {
      var e = C.enemyByUid(targetUid) || C.firstLivingEnemy();
      if (!e) return;
      var dmg = Math.round((skill.power(d) + gAtk(d) + G.rint(0, 3)) * empower * C.curseMult());
      var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck + (skill.critBonus || 0) + gFx(d, 'crit');
      var crit = G.rchance(critP);
      if (crit) dmg = Math.round(dmg * (talent(d, 'assassinate') ? 2.25 : G.BAL.critMult));
      C.damageEnemy(e, dmg, d, crit, skill.name);
      if (crit && talent(d, 'exploit') && e.hp > 0) C.damageEnemy(e, Math.round(dmg * 0.5), d, false, 'exploit');
      if (skill.taunt) {
        c.taunt[d.id] = skill.taunt + (talent(d, 'iron_taunt') ? 2 : 1);
        G.Exp.elog(d.name + ' draws every eye in the dark.', 'info');
      }
    }
  };

  /* Drowned Scholars curse the party, sapping their damage. Steady Hands halves it. */
  C.curseMult = function () {
    var c = C.cur();
    var n = 0;
    c.enemies.forEach(function (e) { if (e.hp > 0 && e.special === 'curse') n++; });
    if (!n) return 1;
    var per = 0.15;
    if (G.Exp.team().some(function (d) { return talent(d, 'steady_hands'); })) per *= 0.5;
    return Math.max(0.4, 1 - per * n);
  };

  C.pickHealTarget = function (targetId, fallback) {
    var a = targetId ? G.Delvers.get(targetId) : null;
    if (a && a.alive) return a;
    // default: the most-hurt living teammate
    var team = G.Exp.team();
    var low = fallback;
    team.forEach(function (d) { if (d.hp / G.Delvers.maxHp(d) < low.hp / G.Delvers.maxHp(low)) low = d; });
    return low;
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
    // Custodian ward: brass hide flatly softens blows
    if (e.special === 'ward') dmg = Math.max(1, dmg - 3);
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
    // Pickpocket: killer skims a little extra
    if (src && G.Delvers.hasTalent(src, 'pickpocket')) ex.marksFound += G.rint(1, 2);
    // loot
    (def.loot || []).forEach(function (L) {
      if (G.rchance(L.p)) G.Exp.grantMat(L.id, G.rint(L.q[0], L.q[1]));
    });
    if (def.marks) {
      var m = G.rint(def.marks[0], def.marks[1]);
      if (m > 0) { ex.marksFound += m; }
    }
    var xp = G.BAL.xpPerEnemy(ex.depth, e.maxHp) * (def.boss ? G.BAL.guardianXp : 1) * relMult('xpMult');
    var team = G.Exp.team();
    team.forEach(function (d) { G.Delvers.gainXp(d, Math.ceil(xp / team.length)); });
    G.Exp.elog(e.name + ' is destroyed.', 'good');
    G.emit('fx', { t: 'death', uid: e.uid });
  };

  /* team members still standing (brawl-downed are out but alive) */
  C.standing = function () {
    var c = C.cur();
    return G.Exp.team().filter(function (d) { return !(c && c.downed[d.id]); });
  };

  /* ---------- enemy turns ---------- */
  C.enemyAct = function (e) {
    var c = C.cur();
    var ex = G.state.expedition;
    var team = C.standing();
    if (!team.length) return;

    // Ink Revenant 'blot': smears a carried find into ruin
    if (e.special === 'blot' && G.rchance(0.5)) {
      var ids = Object.keys(ex.loot);
      if (ids.length) {
        var bid = G.rpick(ids);
        ex.loot[bid]--; if (ex.loot[bid] <= 0) delete ex.loot[bid];
        G.Exp.elog(e.name + ' smears ink across your pack — a ' + G.DATA.materials[bid].name + ' is ruined.', 'bad');
      }
    }

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
    // Bellows Wight and kin: a lung-blast sweep every third round
    if (e.special === 'gust' && c.round % 3 === 0) action = 'aoe';

    // The Smelted King reforges itself — but the furnace only has so much left
    if (action === 'reforge') {
      if (c.reforged < 2) {
        c.reforged++;
        var mend = Math.round(e.maxHp * 0.15);
        e.hp = Math.min(e.maxHp, e.hp + mend);
        G.Exp.elog(e.name + ' plunges into its own furnace and reforges (+' + mend + ').', 'bad');
        G.emit('fx', { t: 'heal', who: null, amt: mend, enemy: e.uid });
        return;
      }
      action = 'aoe'; // out of solder — it lashes out instead
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

    var chorus = C.chorusMult();

    // The Librarian's silence: drains the party's shared Grit
    if (action === 'silence') {
      var drain = Math.min(c.grit, 3);
      c.grit -= drain;
      G.Exp.elog(e.name + ' calls for silence — the team’s resolve drains (−' + drain + ' Grit).', 'bad');
      G.emit('fx', { t: 'windup', uid: e.uid });
      return;
    }
    // The Librarian's index: marks the biggest threat; its next hit on them is doubled
    if (action === 'index') {
      var mark = team[0];
      team.forEach(function (d) { if (d.kills > mark.kills) mark = d; });
      c.indexedDelver = mark.id;
      G.Exp.elog(e.name + ' indexes ' + mark.name + ' — a citation it means to correct.', 'bad');
      G.emit('fx', { t: 'windup', uid: e.uid });
      return;
    }

    if (action === 'aoe') {
      G.Exp.elog(e.name + ' sweeps the whole line!', 'bad');
      team.slice().forEach(function (d) {
        var dmg = G.rint(e.dmg[0], e.dmg[1]);
        C.damageDelver(d, Math.max(1, Math.round(dmg * 0.7 * chorus)), e);
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
      dmg = Math.round(dmg * chorus);
      var crit = G.rchance(e.crit);
      if (crit) dmg = Math.round(dmg * 1.5);
      // indexed citation: double the marked delver's next hit taken
      if (c.indexedDelver === target.id) { dmg = Math.round(dmg * 2); c.indexedDelver = null; G.Exp.elog(e.name + ' corrects the citation — the blow lands double!', 'bad'); }
      C.damageDelver(target, dmg, e, crit);

      if (e.special === 'tithe' && ex.marksFound > 0) {
        var steal = Math.min(ex.marksFound, G.rint(1, 3));
        ex.marksFound -= steal;
        G.Exp.elog(e.name + ' collects ' + steal + 'ᵯ into its bowl.', 'bad');
      }
    }
  };

  /* Ashwake Choristers amplify every enemy's blow while they sing. */
  C.chorusMult = function () {
    var c = C.cur();
    var n = 0;
    c.enemies.forEach(function (e) { if (e.hp > 0 && e.special === 'chorus') n++; });
    return 1 + 0.2 * n;
  };

  C.damageDelver = function (d, dmg, e, crit) {
    var c = C.cur();
    var ex = G.state.expedition;
    if (c.guarding[d.id]) {
      dmg = Math.max(1, Math.round(dmg * G.BAL.guardReduce));
      // Counterweight: guarding reflects a little damage back
      if (talent(d, 'counterweight') && e.hp > 0) C.damageEnemy(e, 3, d, false, 'counter');
    }
    dmg = Math.max(1, dmg - gDef(d)); // armor: flat reduction, never below 1
    if (talent(d, 'stone_skin')) dmg = Math.max(1, dmg - 2);
    d.hp -= dmg;
    G.Exp.elog(e.name + ' hits ' + d.name + ' for ' + dmg + (crit ? ' — savage!' : '.'), 'bad');
    G.emit('fx', { t: 'hit', side: 'delver', who: d.id, amt: dmg, crit: crit });
    if (d.hp <= 0) {
      // brawls are non-lethal: a downed delver yields, alive
      if (c.brawl) {
        d.hp = 1; c.downed[d.id] = true;
        G.Exp.elog(d.name + ' is knocked down and yields.', 'bad');
        G.emit('fx', { t: 'brink', who: d.id });
        return;
      }
      // Vanguard 'unbroken': personal brink, once per fight
      if (talent(d, 'unbroken') && !c.unbroken[d.id]) {
        c.unbroken[d.id] = true; d.hp = 1;
        G.Exp.elog(d.name + ' will not go down — not yet.', 'good');
        G.emit('fx', { t: 'brink', who: d.id });
        return;
      }
      // infirmary L3 brink ward
      if (G.bldFx('infirmary', 'brinkWard', false) && !ex.brinkUsed) {
        ex.brinkUsed = true;
        d.hp = 1;
        G.Exp.elog('The infirmary’s brink-charm flares — ' + d.name + ' refuses to fall!', 'good');
        G.emit('fx', { t: 'brink', who: d.id });
        return;
      }
      c.diedThisFight = c.diedThisFight || {};
      c.diedThisFight[d.id] = true;
      G.Delvers.kill(d, 'slain by ' + e.name + ' at depth ' + ex.depth);
      G.emit('fx', { t: 'delverDeath', who: d.id });
    }
  };

  /* ---------- resolution ---------- */
  C.fleeSucceed = function () {
    var c = C.cur();
    var ex = G.state.expedition;
    c.over = true; c.result = 'fled';
    // fleeing spills loot (a relic may soften — or worsen — the loss)
    var loss = relFlag('fleeAlways') ? (G.Relics ? G.Relics.add('fleeLoot') : G.BAL.fleeLootLoss) : G.BAL.fleeLootLoss;
    if (!loss) loss = G.BAL.fleeLootLoss;
    for (var id in ex.loot) {
      var drop = Math.floor(ex.loot[id] * loss);
      if (drop > 0) ex.loot[id] -= drop;
      if (ex.loot[id] <= 0) delete ex.loot[id];
    }
    G.Exp.elog('The team breaks and runs — packs lightened in the scramble.', 'bad');
    var wasGuardian = c.guardian;
    ex.combat = null;
    // A guardian fight happens ON the guardian node — the floor's final rank,
    // which has no outgoing edges. Returning to 'map' there strands the team on
    // a dead-end node. Send them back to the guardian approach instead, from
    // which they can surface or steel themselves for another attempt.
    ex.mode = wasGuardian ? 'guardian' : 'map';
    G.emit('combatEnd', 'fled');
    G.emit('expedition');
  };

  C.checkEnd = function () {
    var c = C.cur();
    if (!c || c.over) return true;
    var ex = G.state.expedition;
    var st = G.state;
    var team = G.Exp.team();
    var standing = C.standing();
    var living = c.enemies.filter(function (e) { return e.hp > 0; });

    // brawl loss: everyone knocked down, but nobody dies
    if (c.brawl && !standing.length) {
      c.over = true; c.result = 'brawl_lost';
      // lose a slice of the haul to the victors
      for (var lid in ex.loot) { var d0 = Math.ceil(ex.loot[lid] * 0.4); ex.loot[lid] -= d0; if (ex.loot[lid] <= 0) delete ex.loot[lid]; }
      var rd = Rv() && c.rivalId ? G.Rivals.def(c.rivalId).name : 'the rival crew';
      G.Exp.elog('The team yields the stair to ' + rd + ', packs lightened. Everyone limps away alive.', 'bad');
      ex.combat = null; ex.mode = 'map';
      G.emit('combatEnd', 'brawl_lost'); G.emit('expedition');
      return true;
    }

    if (!team.length) {
      c.over = true; c.result = 'wiped';
      G.emit('combatEnd', 'wiped');
      G.Exp.wipe();
      return true;
    }
    if (!living.length) {
      c.over = true; c.result = 'won';
      var wasGuardian = c.guardian;
      var wasBrawl = c.brawl, rivalId = c.rivalId;
      var noDeaths = !(c.diedThisFight && Object.keys(c.diedThisFight).length);
      ex.combat = null;
      if (wasBrawl) {
        // brawl won: bonus loot + renown, the rival concedes the stair
        G.Exp.grantLootValue(10 + ex.depth * 3);
        ex.marksFound += G.rint(4, 10);
        st.stats.rivalWins = (st.stats.rivalWins || 0) + 1;
        if (G.Renown) G.Renown.award('rivalWin');
        if (G.Achieve) G.Achieve.check();
        var rn = Rv() && rivalId ? G.Rivals.def(rivalId).name : 'the rival crew';
        G.Exp.elog('You hold the stair. ' + rn + ' concedes and marks your colours on their chart.', 'good');
        ex.mode = 'map';
      } else if (wasGuardian) {
        var biome = G.DATA.biomeForDepth(ex.depth);
        if (!st.guardiansSlain[biome.id]) {
          st.guardiansSlain[biome.id] = true;
          G.Exp.unlockJournal('guardian_' + biome.id);
          if (G.Renown) G.Renown.award('guardian');
          if (G.Rivals) G.Rivals.claimForPlayer(biome.id);
          if (noDeaths && G.Achieve) G.Achieve.grant('flawless');
          if (G.Relics) { // guardian first-kills award their relic
            var relForGuardian = { first_warden: 'wardens_bell', smelted_king: 'crown_cooling', the_librarian: 'blank_card' };
            if (relForGuardian[biome.guardian]) G.Relics.award(relForGuardian[biome.guardian]);
          }
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
      if (G.Achieve) G.Achieve.check();
      G.emit('combatEnd', 'won');
      G.emit('expedition');
      return true;
    }
    return false;
  };

  function Rv() { return !!G.Rivals; }
})();
