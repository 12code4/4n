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
  /* null-safe v4.0 accessors */
  function omenMult(k) { return G.Omens ? G.Omens.mult(k) : 1; }
  function omenAdd(k) { return G.Omens ? G.Omens.add(k) : 0; }
  function omenFlag(k) { return G.Omens ? G.Omens.flag(k) : false; }
  function moodEnemy() { return G.Moods ? G.Moods.fx('enemy', 1) : 1; }
  function beastPassive(k, base) { return G.Beasts ? G.Beasts.passive(k, base) : base; }
  function wildFury() { var c = C.cur(); return (c && c.wildFuryRound === c.round) ? 2 : 0; }
  function healScale() { return omenMult('healBonus') * (G.Beasts ? G.Beasts.passive('heal', 1) : 1); }
  /* null-safe v7.0 Undervault affix check */
  function vHas(id) { return G.Vault && G.Vault.has(id); }

  /* ---------- status effects (v4.0) ---------- */
  function estatus(e) { if (!e.status) e.status = { burn: 0, chill: 0, bleed: 0, ward: false }; return e.status; }
  C.dstatus = function (id) {
    var c = C.cur();
    if (!c.dstat) c.dstat = {};
    if (!c.dstat[id]) c.dstat[id] = { burn: 0, chill: 0, bleed: 0, ward: false };
    return c.dstat[id];
  };
  /* apply a status. target: enemy object, or delver-id string. */
  C.applyStatus = function (target, kind, turns) {
    var s = (typeof target === 'string') ? C.dstatus(target) : estatus(target);
    if (kind === 'ward') s.ward = true;
    else s[kind] = Math.max(s[kind] || 0, turns);
  };
  /* tick burn/bleed damage + decay at the start of a turn. returns false if the
   * unit died to the status. */
  C.tickEnemyStatus = function (e) {
    var s = estatus(e);
    if (s.burn > 0) { e.hp -= 3; s.burn--; G.Exp.elog(e.name + ' burns (−3).', 'bad'); G.emit('fx', { t: 'status', side: 'enemy', uid: e.uid, kind: 'burn' }); }
    if (s.bleed > 0) { e.hp -= 2; s.bleed--; }
    if (s.chill > 0) s.chill--;
    if (e.hp <= 0) { e.hp = 0; C.onEnemyDeath(e, null); return false; }
    return true;
  };
  C.tickDelverStatus = function (d) {
    var s = C.dstatus(d.id);
    if (s.burn > 0) { d.hp = Math.max(1, d.hp - 3); s.burn--; }
    if (s.bleed > 0) { d.hp = Math.max(1, d.hp - 2); s.bleed--; }
    if (s.chill > 0) s.chill--;
  };
  function chilled(unitStatus) { return unitStatus && unitStatus.chill > 0; }
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
      // mood + omen + ascension enemy scaling (the Living Maw, meaner or milder)
      var ascHp = G.Ascension ? G.Ascension.enemyHp() : 1;
      var ascBoss = (def.boss && G.Ascension) ? G.Ascension.guardianHp() : 1;
      var giltHp = vHas('gilt') ? 1.25 : 1; // the Gilt affix swells the enemy with the loot it guards
      var eScale = (def.boss ? 1 : s) * moodEnemy() * omenMult('enemyHp') * ascHp * ascBoss * giltHp;
      var hp = Math.max(1, Math.round(def.hp * eScale));
      var relSpd = relAdd('enemySpd');
      var dmgBonus = omenAdd('enemyDmg') + (G.Ascension ? G.Ascension.enemyDmg() : 0);
      return {
        uid: 'e' + i + '_' + id, id: id, name: def.name,
        hp: hp, maxHp: hp,
        dmg: [Math.round(def.dmg[0] * s * moodEnemy()) + dmgBonus, Math.round(def.dmg[1] * s * moodEnemy()) + dmgBonus],
        spd: def.spd + relSpd, crit: def.crit || 0.05,
        special: def.special || null, boss: !!def.boss,
        rotIdx: 0, look: def.look, tags: def.tags || [], nonlethal: !!def.nonlethal,
        indexed: false, status: { burn: 0, chill: 0, bleed: 0, ward: false }, intent: null
      };
    });
    ex.mode = 'combat';
    // the run's companion pack is locked at launch (ex.beasts); nothing to do here
    // starting grit: base + best gritStart trinket + still_point talent + relic bell + omen + beast
    var startGrit = G.BAL.gritStart + relAdd('gritStart') + omenAdd('gritStart') + beastPassive('grit', 0);
    G.Exp.team().forEach(function (d) {
      var g = G.BAL.gritStart + gFx(d, 'gritStart') + relAdd('gritStart') + omenAdd('gritStart') + beastPassive('grit', 0) + (talent(d, 'still_point') ? 1 : 0);
      startGrit = Math.max(startGrit, g);
    });
    ex.combat = {
      enemies: enemies, grit: G.U.clamp(startGrit, 0, G.BAL.gritMax), round: 0,
      queue: [], turn: -1, over: false, result: null,
      guardian: !!opts.guardian, firstStrike: !!opts.firstStrike, vaultGuardian: !!opts.vaultGuardian,
      brawl: !!opts.brawl, rivalId: opts.rivalId || null,
      guarding: {}, taunt: {}, shaken: {}, fledFail: false,
      reforged: 0, downed: {}, vanished: {}, revivified: false, unbroken: {},
      dstat: {}, skipNext: {}, actionCounts: {}, beastReady: {}, echoAcc: 0
    };
    // omen of the ward: the team begins each fight warded against the first blow
    if (omenFlag('wardStart')) G.Exp.team().forEach(function (d) { C.applyStatus(d.id, 'ward', true); });
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
    if (G.Codex) enemies.forEach(function (e) { G.Codex.discover('enemy', e.id); });
    var names = enemies.map(function (e) { return e.name; }).join(', ');
    G.Exp.elog('Ambush! ' + names + '!', 'bad');
    if (G.Hints) G.Hints.fire('firstCombat');
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
    // Undervault affixes that tick at the top of a round
    if (c.round > 1) {
      var livingE = c.enemies.filter(function (e) { return e.hp > 0; });
      if (vHas('interest') && livingE.length) {
        // the enemy heals a little every round it stands
        livingE.forEach(function (e) { var h = Math.max(1, Math.round(e.maxHp * 0.04)); e.hp = Math.min(e.maxHp, e.hp + h); });
        G.Exp.elog('Interest accrues — the dark mends what you marked.', 'bad');
      }
      c.enemies.forEach(function (e) { e.charged = false; });
      if (vHas('echoing') && livingE.length) {
        // the dark rehearses the Heart: one foe charges a heavy blow this round
        var ch = G.rpick(livingE); ch.charged = true;
        G.Exp.elog(ch.name + ' draws in an echo of the Heart — its next blow will land hard.', 'bad');
        G.emit('fx', { t: 'windup', uid: ch.uid });
      }
    }
    // compute enemy intents for the coming round (telegraphed to the UI)
    c.enemies.forEach(function (e) { if (e.hp > 0) e.intent = C.enemyIntent(e); });
  };

  /* what the enemy means to do next round (for the UI to telegraph) */
  C.enemyIntent = function (e) {
    var c = C.cur();
    if (e.special === 'slow' && (c.round + 1) % 2 === 0 && !e.boss) return 'windup';
    if (e.special === 'gust' && (c.round + 1) % 3 === 0) return 'aoe';
    if (e.boss) { var def = G.DATA.enemies[e.id]; return def.rotation[e.rotIdx % def.rotation.length]; }
    return 'strike';
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
        C.tickDelverStatus(d);                 // burn/bleed tick
        if (!d.alive) continue;
        if (c.skipNext[d.id]) { delete c.skipNext[d.id]; G.Exp.elog(d.name + ' stands lost in longing, and does nothing.', 'bad'); continue; }
        delete c.guarding[d.id]; // guard lasts until your next turn
        c.awaiting = t.id;
        G.emit('combat');
        return;
      } else {
        var e = null;
        for (var i = 0; i < c.enemies.length; i++) if (c.enemies[i].uid === t.id) e = c.enemies[i];
        if (!e || e.hp <= 0) continue;
        if (!C.tickEnemyStatus(e)) { if (C.checkEnd()) return; continue; } // died to burn/bleed
        C.enemyAct(e);
        if (C.checkEnd()) return;
      }
    }
  };

  C.actor = function () {
    var c = C.cur();
    return c && c.awaiting ? G.Delvers.get(c.awaiting) : null;
  };

  /* self-chill: a chilled delver's blows land softer */
  function selfChillMult(d) { return chilled(C.cur().dstat && C.cur().dstat[d.id]) ? 0.7 : 1; }

  /* ---------- delver actions ---------- */
  C.act = function (action) {
    var c = C.cur();
    var d = C.actor();
    if (!c || c.over || !d) return { ok: false };
    var ex = G.state.expedition;
    c.awaiting = null;
    c.actionCounts[action.type] = (c.actionCounts[action.type] || 0) + 1; // the Auricle is listening

    switch (action.type) {
      case 'strike': {
        var e = C.enemyByUid(action.target) || C.firstLivingEnemy();
        if (!e) break;
        var dmg = C.eff(d, 'might') + gAtk(d) + beastPassive('dmg', 0) + wildFury() + G.rint(0, 3);
        dmg = Math.round(dmg * C.curseMult() * selfChillMult(d) * (talent(d, 'first_blood') && c.round === 1 ? 1.5 : 1));
        var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck + gFx(d, 'crit');
        var crit = G.rchance(critP);
        var critMult = talent(d, 'assassinate') ? 2.25 : G.BAL.critMult;
        if (crit) dmg = Math.round(dmg * critMult);
        C.damageEnemy(e, dmg, d, crit);
        if (e.hp > 0 && omenFlag('burnStrike')) { C.applyStatus(e, 'burn', 2); G.Exp.elog(e.name + ' catches fire.', 'bad'); }
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
        heal = Math.round(heal * healScale()); // omen/beast healing bonuses
        // a bandage staunches Bleed
        var bs = C.dstatus(ally.id); if (bs.bleed > 0) bs.bleed = 0;
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
      case 'beast': {
        var bid = action.beastId || (G.Beasts.runList()[0] && G.Beasts.runList()[0].id);
        if (!bid || !C.beastReady(bid)) { c.awaiting = d.id; return { ok: false, msg: 'That beast is not ready yet.' }; }
        C.useBeast(bid);
        break; // the beast acts on the delver's turn; the delver still passes
      }
      case 'shift': {
        var ex2 = G.state.expedition;
        if (!ex2.rows) ex2.rows = {};
        var now = C.rowOf(d);
        ex2.rows[d.id] = (now === 'front') ? 'back' : 'front';
        G.Exp.elog(d.name + ' shifts to the ' + ex2.rows[d.id] + ' line.', 'info');
        break; // shifting takes the turn
      }
    }
    if (!C.checkEnd()) C.advance();
    return { ok: true };
  };

  /* is a beast's active ability available this round? */
  C.beastReady = function (bid) {
    var c = C.cur();
    if (!c.beastReady) c.beastReady = {};
    return (c.beastReady[bid] || 0) <= c.round;
  };
  C.useBeast = function (bid) {
    var c = C.cur();
    var bdef = G.DATA.beasts[bid];
    if (!bdef) return;
    C.beastAbility(bdef);
    // cooldown: normally once per fight; the Warden's bond recharges it
    var warden = G.Beasts.wardenBond();
    if (warden) {
      var cd = 3 - (G.Exp.team().some(function (x) { return talent(x, 'two_as_one'); }) ? 1 : 0);
      c.beastReady[bid] = c.round + cd;
    } else {
      c.beastReady[bid] = 9999; // spent for the fight
    }
    // Wild Fury: a party-wide damage bump the round a beast acts
    if (G.Exp.team().some(function (x) { return talent(x, 'wild_fury'); })) c.wildFuryRound = c.round;
  };

  C.beastAbility = function (bdef, targetUid) {
    var c = C.cur(), ex = G.state.expedition;
    var a = bdef.active;
    var living = c.enemies.filter(function (e) { return e.hp > 0; });
    switch (a.kind) {
      case 'bite': {
        var e = C.enemyByUid(targetUid) || living[0];
        if (e) { G.Exp.elog(bdef.name + ' lunges — ' + a.name + '!', 'good'); C.damageEnemy(e, a.power, null, false, bdef.name); }
        break;
      }
      case 'scorch': {
        G.Exp.elog(bdef.name + ' breathes cinders across the line!', 'good');
        living.forEach(function (e) { C.damageEnemy(e, a.power, null, false, bdef.name); if (e.hp > 0) C.applyStatus(e, 'burn', 2); });
        break;
      }
      case 'shriek': {
        G.Exp.elog(bdef.name + ' shrieks — the enemy freezes!', 'good');
        living.forEach(function (e) { C.applyStatus(e, 'chill', 2); });
        break;
      }
      case 'mend': {
        G.Exp.elog(bdef.name + ' scatters healing dust over the team.', 'good');
        G.Exp.team().forEach(function (d) { var h = Math.round(a.power * healScale()); d.hp = Math.min(G.Delvers.maxHp(d), d.hp + h); G.emit('fx', { t: 'heal', who: d.id, amt: h }); });
        break;
      }
      case 'fetch': {
        var val = a.power + ex.depth * 2;
        G.Exp.grantLootValue(val); ex.marksFound += G.rint(2, 6);
        G.Exp.elog(bdef.name + ' returns from the dark with loose marks and a find.', 'good');
        break;
      }
      case 'guardbeast': {
        G.Exp.elog(bdef.name + ' bristles — the team takes a ward.', 'good');
        G.Exp.team().forEach(function (d) { C.applyStatus(d.id, 'ward', true); });
        break;
      }
    }
  };

  C.useSkill = function (d, skill, targetUid) {
    var c = C.cur();
    if (skill.kind === 'command') {
      // Warden's Call of the Pack: every companion beast acts now (ignoring cooldown), Warden warded
      var list = G.Beasts.runList();
      if (!list.length) { G.Exp.elog(d.name + ' calls, but no beast answers.', 'info'); }
      list.forEach(function (b) { C.beastAbility(b, targetUid); c.beastReady[b.id] = c.round; }); // refreshed, ready again
      C.applyStatus(d.id, 'ward', true);
      // Houndmaster: the call also strikes
      if (talent(d, 'houndmaster')) { var e = C.enemyByUid(targetUid) || C.firstLivingEnemy(); if (e) C.damageEnemy(e, C.eff(d, 'might'), d, false, 'Call'); }
      G.Exp.elog(d.name + ' calls the pack to the attack.', 'good');
      return;
    }
    if (skill.kind === 'heal') {
      var amt = skill.power(d) + (talent(d, 'stronger_brew') ? 3 : 0);
      if (talent(d, 'great_tonic')) amt = Math.round(amt * 1.5);
      amt = Math.round(amt * healScale());
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
    var empower = (talent(d, 'empower') ? 1.4 : 1) * selfChillMult(d);
    if (skill.target === 'allEnemies') {
      var base = Math.round((skill.power(d) + gAtk(d) + beastPassive('dmg', 0) + wildFury() + (talent(d, 'wide_lance') ? 2 : 0)) * empower * C.curseMult());
      var living = c.enemies.filter(function (e) { return e.hp > 0; });
      var hitCount = living.length;
      living.forEach(function (e) {
        C.damageEnemy(e, base + G.rint(0, 2), d, false, skill.name);
        if (e.hp > 0 && omenFlag('burnStrike')) C.applyStatus(e, 'burn', 2);
      });
      if (talent(d, 'siphon') && hitCount) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + hitCount); G.emit('fx', { t: 'heal', who: d.id, amt: hitCount }); }
    } else {
      var e = C.enemyByUid(targetUid) || C.firstLivingEnemy();
      if (!e) return;
      var dmg = Math.round((skill.power(d) + gAtk(d) + beastPassive('dmg', 0) + wildFury() + G.rint(0, 3)) * empower * C.curseMult());
      var critP = G.BAL.critBase + d.stats.luck * G.BAL.critPerLuck + (skill.critBonus || 0) + gFx(d, 'crit');
      var crit = G.rchance(critP);
      if (crit) dmg = Math.round(dmg * (talent(d, 'assassinate') ? 2.25 : G.BAL.critMult));
      C.damageEnemy(e, dmg, d, crit, skill.name);
      if (e.hp > 0 && omenFlag('burnStrike')) { C.applyStatus(e, 'burn', 2); }
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
    // status ward absorbs a blow entirely
    var es = estatus(e);
    if (es.ward) { es.ward = false; G.Exp.elog(e.name + '’s ward flares and eats the blow.', 'info'); G.emit('fx', { t: 'status', side: 'enemy', uid: e.uid, kind: 'ward' }); return; }
    e.hp -= dmg;
    // The Heart doesn't die — at half its accounting, it stops and opens the ledger.
    if (e.id === 'the_heart' && e.hp <= e.maxHp * 0.5 && !C.cur().heartTriggered) {
      C.cur().heartTriggered = true;
      e.hp = Math.max(1, Math.round(e.maxHp * 0.5));
      G.Exp.elog('The Heart stops. The beating you have chased for thirteen floors goes quiet, and it slides a blank card across the desk.', 'story');
      G.state.expedition.combat = null;
      G.state.expedition.mode = 'heart_parley';
      G.emit('combatEnd', 'parley');
      G.emit('expedition');
      return;
    }
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
    // Undervault "Ledger" affix: each kill compounds the stratum's take
    if (vHas('ledger')) {
      ex.ledgerStacks = (ex.ledgerStacks || 0) + 1;
      var comp = ex.ledgerStacks * 2;
      ex.marksFound += comp;
      G.Exp.elog('The Ledger compounds: +' + comp + 'ᵯ (×' + ex.ledgerStacks + ').', 'loot');
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

  /* ---------- front/back rows (v7.0) ---------- */
  C.rowOf = function (d) { var ex = G.state.expedition; return (ex && ex.rows && ex.rows[d.id]) || 'front'; };
  C.backStanding = function () { return C.standing().filter(function (d) { return C.rowOf(d) === 'back'; }); };
  C.frontStanding = function () { return C.standing().filter(function (d) { return C.rowOf(d) === 'front'; }); };
  /* who an ordinary blow can reach: the front line, or the back if the front has fallen */
  C.exposed = function () { var f = C.frontStanding(); return f.length ? f : C.standing(); };
  /* who a back-line hunter reaches: the back line if any stand, else whoever is exposed */
  C.backTargets = function () { var b = C.backStanding(); return b.length ? b : C.exposed(); };

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

    // The Lord Exchequer's audit: it calls a Court noble to the field (resolved by the summon block below)
    if (action === 'audit') {
      action = (c.enemies.filter(function (x) { return x.hp > 0; }).length < 5)
        ? 'summon:' + (G.Vault ? G.Vault.auditNoble() : 'court_collector') : 'aoe';
    }
    // The Magistrate's levy: it notarises away the team's Grit, then lashes out
    if (action === 'levy') {
      var lvd = Math.min(c.grit, G.rint(2, 4));
      c.grit -= lvd;
      G.Exp.elog(e.name + ' passes a levy — the team loses ' + lvd + ' Grit.', 'bad');
      action = 'strike';
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
          boss: false, rotIdx: 0, look: sdef.look, tags: sdef.tags || [],
          status: { burn: 0, chill: 0, bleed: 0, ward: false }, intent: null, nonlethal: false
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

    // The Auricle's echo: it plays the party's own favourite move back, amplified
    if (action === 'echo') {
      var fav = 'strike', mx = -1;
      ['strike', 'skill', 'guard', 'item'].forEach(function (k) { if ((c.actionCounts[k] || 0) > mx) { mx = c.actionCounts[k] || 0; fav = k; } });
      G.Exp.elog(e.name + ' echoes your own delving back at you…', 'bad');
      if (fav === 'skill') { action = 'aoe'; } // they lean on skills → it sweeps
      else if (fav === 'guard' || fav === 'item') { // they play safe → it heals & wards itself
        estatus(e).ward = true; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.08));
        G.Exp.elog(e.name + ' mirrors your caution — it guards and mends.', 'bad');
        return;
      } else { // strike-heavy → a single crushing blow
        var tgt = G.rpick(team);
        C.damageDelver(tgt, Math.round(G.rint(e.dmg[0], e.dmg[1]) * 1.8 * chorus), e, true);
        return;
      }
    }
    // The Auricle's systole: the tunnel clenches — heavy hit on all
    if (action === 'systole') {
      G.Exp.elog(e.name + ' clenches the whole gallery shut!', 'bad');
      team.slice().forEach(function (d) { C.damageDelver(d, Math.round(G.rint(e.dmg[0], e.dmg[1]) * 0.85 * chorus), e); });
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
      // targeting — taunts override; a back-line hunter reaches past the front;
      // otherwise the front line is struck (or the back, once the front has fallen)
      var target = null;
      var taunters = team.filter(function (d) { return c.taunt[d.id]; });
      var pool = (e.special === 'backhunt') ? C.backTargets() : C.exposed();
      if (!pool.length) pool = team;
      if (taunters.length) target = G.rpick(taunters);
      else if (e.special === 'lowest') {
        target = pool[0];
        pool.forEach(function (d) { if (d.hp < target.hp) target = d; });
      } else target = G.rpick(pool);

      var dmg = G.rint(e.dmg[0], e.dmg[1]);
      if (e.special === 'slow') dmg = Math.round(dmg * 1.5);
      if (e.charged) { dmg = Math.round(dmg * 1.5); e.charged = false; G.Exp.elog(e.name + ' looses the Heart’s echo!', 'bad'); } // Echoing affix
      if (chilled(estatus(e))) dmg = Math.round(dmg * 0.7); // a chilled enemy hits softer
      dmg = Math.round(dmg * chorus);
      var crit = G.rchance(e.crit);
      if (crit) dmg = Math.round(dmg * 1.5);
      // indexed citation: double the marked delver's next hit taken
      if (c.indexedDelver === target.id) { dmg = Math.round(dmg * 2); c.indexedDelver = null; G.Exp.elog(e.name + ' corrects the citation — the blow lands double!', 'bad'); }
      var dealt = C.damageDelver(target, dmg, e, crit);

      // Veins / Deep Court specials ride the strike
      if (e.special === 'drain' && dealt > 0) { e.hp = Math.min(e.maxHp, e.hp + Math.round(dealt * 0.6)); G.Exp.elog(e.name + ' drinks the wound and warms (+' + Math.round(dealt * 0.6) + ').', 'bad'); }
      if (e.special === 'bleed' && target.alive) { C.applyStatus(target.id, 'bleed', 3); G.Exp.elog(target.name + ' is bleeding.', 'bad'); }
      if (e.special === 'chill' && target.alive) { C.applyStatus(target.id, 'chill', 2); G.Exp.elog(target.name + ' is chilled to the bone.', 'bad'); }
      if (e.special === 'want' && target.alive && !c.skipNext[target.id]) { c.skipNext[target.id] = true; G.Exp.elog(target.name + ' falters, listening to the Chorus.', 'bad'); }
      // the Notary's levy: a hit also drains the team's shared Grit
      if (e.special === 'levy' && c.grit > 0) { var lv = Math.min(c.grit, G.rint(1, 2)); c.grit -= lv; G.Exp.elog(e.name + ' notarises away ' + lv + ' Grit.', 'bad'); }

      if (e.special === 'tithe' && ex.marksFound > 0) {
        var steal = Math.min(ex.marksFound, G.rint(1, 3));
        ex.marksFound -= steal;
        G.Exp.elog(e.name + ' collects ' + steal + 'ᵯ into its bowl.', 'bad');
      }
    }

    // Undervault "Tithe" affix: every landed blow also skims the haul
    if (action !== 'aoe' && vHas('tithe') && ex.marksFound > 0) {
      var t2 = Math.min(ex.marksFound, G.rint(1, 2));
      ex.marksFound -= t2;
      G.Exp.elog('The Tithe takes its due — ' + t2 + 'ᵯ gone from the count.', 'bad');
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
    // status ward eats the blow entirely
    var ds = C.dstatus(d.id);
    if (ds.ward) { ds.ward = false; G.Exp.elog(d.name + '’s ward flares and eats the blow.', 'good'); G.emit('fx', { t: 'status', side: 'delver', who: d.id, kind: 'ward' }); return 0; }
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
        return dmg;
      }
      // Vanguard 'unbroken': personal brink, once per fight
      if (talent(d, 'unbroken') && !c.unbroken[d.id]) {
        c.unbroken[d.id] = true; d.hp = 1;
        G.Exp.elog(d.name + ' will not go down — not yet.', 'good');
        G.emit('fx', { t: 'brink', who: d.id });
        return dmg;
      }
      // infirmary L3 brink ward
      if (G.bldFx('infirmary', 'brinkWard', false) && !ex.brinkUsed) {
        ex.brinkUsed = true;
        d.hp = 1;
        G.Exp.elog('The infirmary’s brink-charm flares — ' + d.name + ' refuses to fall!', 'good');
        G.emit('fx', { t: 'brink', who: d.id });
        return dmg;
      }
      c.diedThisFight = c.diedThisFight || {};
      c.diedThisFight[d.id] = true;
      G.Delvers.kill(d, 'slain by ' + e.name + ' at depth ' + ex.depth);
      G.emit('fx', { t: 'delverDeath', who: d.id });
    }
    return dmg;
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
      var wasVaultGuardian = c.vaultGuardian;
      var wasBrawl = c.brawl, rivalId = c.rivalId;
      var noDeaths = !(c.diedThisFight && Object.keys(c.diedThisFight).length);
      ex.combat = null;
      if (wasVaultGuardian) {
        // a Court guardian falls: no biome unlock, but a Court relic and a bonus haul
        if (G.Relics) {
          var courtRel = { lord_exchequer: 'court_seal', the_magistrate: 'court_scepter' }[G.Vault ? G.Vault.guardianFor(ex.stratum) : ''];
          if (courtRel) G.Relics.award(courtRel);
          // the nobles' regalia trickle in as you break their offices
          if (G.rchance(0.5)) G.Relics.award(G.rpick(['court_mask', 'court_ledger']));
        }
        G.Exp.grantLootValue(20 + ex.depth * 3);
        if (G.Renown) G.Renown.award('guardian');
        G.Exp.elog('The Court office falls. The stratum below stands open.', 'good');
        ex.mode = 'guardian_won';
      } else if (wasBrawl) {
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
