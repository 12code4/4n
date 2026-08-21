/* Expeditions: mapgen, movement, node resolution, events, loot, the way home. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var X = (G.Exp = {});

  /* ---------- map generation ---------- */
  X.genFloor = function (depth) {
    if (depth === 13) return X.genHeartFloor();
    var biome = G.DATA.biomeForDepth(depth);
    var nRanks = G.rint(G.BAL.ranksPerFloor[0], G.BAL.ranksPerFloor[1]);
    var rows = [];
    var id = 0;
    function node(type, r, c) { return { id: 'n' + depth + '_' + (id++), r: r, c: c, type: type, edges: [], done: false }; }

    rows.push([node('entry', 0, 0)]);
    for (var r = 1; r <= nRanks; r++) {
      var count = G.rint(G.BAL.nodesPerRank[0], G.BAL.nodesPerRank[1]);
      var row = [];
      for (var c = 0; c < count; c++) {
        var wl = [];
        for (var t in biome.nodeW) {
          var w = biome.nodeW[t];
          // the Maw's mood tilts a floor toward trouble or toward wonders
          if (G.Moods) {
            if (t === 'fight') w += G.Moods.fx('fightW', 0);
            if (t === 'event') w += G.Moods.fx('eventW', 0);
          }
          if (w > 0) wl.push({ t: t, w: w });
        }
        var type = G.rweighted(wl, function (x) { return x.w; }).t;
        // omen of salt: no resting hollows
        if (type === 'rest' && G.Omens && G.Omens.flag('noRest')) type = 'fight';
        // Undervault "Famine" affix: the stratum offers no rest or pulse
        if ((type === 'rest' || type === 'pulse') && G.Vault && G.Vault.has('famine')) type = 'fight';
        row.push(node(type, r, c));
      }
      // guarantee at most one rest/peddler/pulse per rank (dedupe into fights)
      var seen = {};
      for (var i = 0; i < row.length; i++) {
        if ((row[i].type === 'rest' || row[i].type === 'peddler' || row[i].type === 'pulse') && seen[row[i].type]) row[i].type = 'fight';
        seen[row[i].type] = true;
      }
      rows.push(row);
    }
    // rivals may hold a stair on floors deep enough for them to reach (v3.0)
    if (G.Rivals && G.Rivals.active() && depth >= 4 && G.rchance(0.28)) {
      var rr0 = rows[1 + Math.floor(G.rng() * nRanks)];
      var rc0 = rr0[Math.floor(G.rng() * rr0.length)];
      if (rc0.type === 'fight' || rc0.type === 'event') rc0.type = 'rival';
    }
    // every floor owes at least one cache — the Maw trades, it doesn't stiff
    var hasCache = false;
    for (var cr = 1; cr <= nRanks; cr++)
      for (var cc = 0; cc < rows[cr].length; cc++)
        if (rows[cr][cc].type === 'cache') hasCache = true;
    if (!hasCache) {
      var rrow = rows[1 + Math.floor(G.rng() * nRanks)];
      var cand = rrow[Math.floor(G.rng() * rrow.length)];
      cand.type = 'cache';
    }
    // final rank: guardian if biome's last depth & not slain, else shaft.
    // The Omen of the Quiet Stair removes the guardian (and its rewards).
    var lastType = 'shaft';
    var quiet = G.Omens && G.Omens.flag('noGuardian');
    if (depth === biome.depths[1] && !G.state.guardiansSlain[biome.id] && !quiet) lastType = 'guardian';
    // Undervault: a Court guardian bars every few strata (the stratum's final rank)
    var vex = G.state.expedition;
    if (vex && vex.vault && G.Vault && G.Vault.isGuardianStratum(vex.stratum)) lastType = 'guardian';
    rows.push([node(lastType, nRanks + 1, 0)]);

    // edges: each node -> 1-2 nodes in next rank; every next-rank node gets an inbound
    for (var rr = 0; rr < rows.length - 1; rr++) {
      var cur = rows[rr], nxt = rows[rr + 1];
      for (var a = 0; a < cur.length; a++) {
        // connect to nearest by relative position, sometimes two
        var frac = cur.length === 1 ? 0.5 : a / (cur.length - 1);
        var tgt = Math.min(nxt.length - 1, Math.max(0, Math.round(frac * (nxt.length - 1))));
        cur[a].edges.push(nxt[tgt].id);
        if (nxt.length > 1 && G.rchance(0.45)) {
          var alt = tgt + (G.rchance(0.5) ? 1 : -1);
          if (alt >= 0 && alt < nxt.length && cur[a].edges.indexOf(nxt[alt].id) < 0) cur[a].edges.push(nxt[alt].id);
        }
      }
      // inbound guarantee
      for (var b = 0; b < nxt.length; b++) {
        var has = cur.some(function (n) { return n.edges.indexOf(nxt[b].id) >= 0; });
        if (!has) {
          var frac2 = nxt.length === 1 ? 0.5 : b / (nxt.length - 1);
          var src = Math.min(cur.length - 1, Math.max(0, Math.round(frac2 * (cur.length - 1))));
          cur[src].edges.push(nxt[b].id);
        }
      }
    }
    return { depth: depth, biome: biome.id, rows: rows };
  };

  /* The Heart floor (depth 13): a hand-authored linear descent — an antechamber
   * to breathe, three trials that quote the biomes you passed, then the Heart. */
  X.genHeartFloor = function () {
    var id = 0;
    function node(type, r, extra) {
      var n = { id: 'h13_' + (id++), r: r, c: 0, type: type, edges: [], done: false };
      if (extra) for (var k in extra) n[k] = extra[k];
      return n;
    }
    var rows = [
      [node('entry', 0)],
      [node('rest', 1)],                                   // antechamber — breathe
      [node('fight', 2, { enc: ['echo_warden'], trial: 'the toll' })],
      [node('fight', 3, { enc: ['echo_king'], trial: 'the crown' })],
      [node('fight', 4, { enc: ['echo_auricle'], trial: 'the listening' })],
      [node('guardian', 5)]                                // the Heart
    ];
    for (var r = 0; r < rows.length - 1; r++) rows[r][0].edges.push(rows[r + 1][0].id);
    return { depth: 13, biome: 'heart', rows: rows };
  };

  X.findNode = function (map, id) {
    for (var r = 0; r < map.rows.length; r++)
      for (var c = 0; c < map.rows[r].length; c++)
        if (map.rows[r][c].id === id) return map.rows[r][c];
    return null;
  };

  /* ---------- launch / floors ---------- */
  X.canLaunch = function (teamIds, depth, opts) {
    var st = G.state;
    opts = opts || {};
    if (st.expedition) return 'An expedition is already below.';
    if (!teamIds.length || teamIds.length > G.BAL.teamMax) return 'Take 1–' + G.BAL.teamMax + ' delvers.';
    if (opts.vault) {
      if (!G.Vault || !G.Vault.unlocked()) return 'The Vault stair is not open.';
    } else if (depth < 1 || depth > st.unlockedStart) return 'That depth is not yet opened.';
    if (depth === 13 && st.heartSealed) return 'The stair to the Heart is collapsed. What is sealed stays sealed.';
    for (var i = 0; i < teamIds.length; i++) {
      var d = G.Delvers.get(teamIds[i]);
      if (!d || !d.alive) return 'A chosen delver is unavailable.';
      if (d.hp <= 0) return d.name + ' cannot walk, let alone delve.';
    }
    return null;
  };

  X.launch = function (teamIds, depth, opts) {
    opts = opts || {};
    var err = X.canLaunch(teamIds, depth, opts);
    if (err) return { ok: false, msg: err };
    var st = G.state;
    st.expedition = {
      team: teamIds.slice(),
      startDepth: depth, depth: depth,
      map: null, at: null,
      torches: st.supplies.torches, rations: st.supplies.rations, bandages: st.supplies.bandages,
      loot: {}, marksFound: 0,
      mode: 'map', combat: null, event: null, peddler: null,
      daysOut: 0, bypass: false, brinkUsed: false,
      xpEarned: {}, killCount: 0, log: [],
      omens: (st.omenChosen || []).slice(),                       // v4 locked omens
      beasts: G.Beasts ? G.Beasts.lockRun(teamIds.map(G.Delvers.get)) : [], // v6 companion pack for the run
      rows: opts.rows || {},                                       // v7 front/back placement (delverId -> row)
      vault: !!opts.vault, stratum: opts.vault ? 1 : 0, affixes: [], ledgerStacks: 0, vaultFights: 0 // v7 Undervault
    };
    if (G.Omens) G.Omens.reset(); // clear the offer once committed
    st.supplies.torches = 0; st.supplies.rations = 0; st.supplies.bandages = 0;
    st.stats.delves++;
    teamIds.forEach(function (id) { G.Delvers.get(id).delves++; });
    if (opts.vault && G.Vault) G.Vault.onLaunch();          // seed stratum 1 affixes before the floor is built
    X.enterFloor(depth);
    G.log(opts.vault ? 'The company descends the Vault stair, below the Heart. The winch has no more rope — from here you climb.' :
      'Expedition departs for depth ' + depth + '. The winch pays out rope.', 'story');
    if (G.Hints) G.Hints.fire('firstDescent');
    G.emit('expedition');
    return { ok: true };
  };

  X.team = function () {
    var ex = G.state.expedition;
    return ex ? ex.team.map(G.Delvers.get).filter(function (d) { return d && d.alive; }) : [];
  };

  X.enterFloor = function (depth) {
    var st = G.state, ex = st.expedition;
    ex.depth = depth;
    if (G.Codex) G.Codex.discover('biome', G.DATA.biomeForDepth(depth).id);
    if (depth > (st.stats.deepest || 0)) {
      st.stats.deepest = depth;
      if (G.Renown) G.Renown.award('depthRecord'); // new company record
    }
    ex.map = X.genFloor(depth);
    ex.at = ex.map.rows[0][0].id;
    ex.map.rows[0][0].done = true;
    ex.bypass = false; // a skip-rank blessing never carries between floors
    ex.daysOut++;
    G.Economy.expeditionDays(G.BAL.daysPerDepth);
    // rations: one per living member
    var team = X.team();
    for (var i = 0; i < team.length; i++) {
      if (ex.rations > 0) ex.rations--;
      else {
        team[i].hp = Math.max(1, team[i].hp - G.BAL.rationHungerHp);
        X.elog(team[i].name + ' goes hungry (-' + G.BAL.rationHungerHp + ' hp).', 'bad');
      }
    }
    // reaching a depth unlocks any journal page keyed to it
    for (var jd = 2; jd <= depth; jd++) X.unlockJournal('depth' + jd);
    X.elog('— Depth ' + depth + ': ' + G.DATA.biomeForDepth(depth).name + ' —', 'story');
  };

  X.elog = function (m, k) {
    var ex = G.state.expedition;
    if (!ex) { G.log(m, k); return; }
    ex.log.push({ m: m, k: k || 'info' });
    if (ex.log.length > 60) ex.log.splice(0, ex.log.length - 60);
    G.emit('elog', { m: m, k: k });
  };

  X.unlockJournal = function (flag) {
    var st = G.state;
    if (st.flags[flag]) return;
    st.flags[flag] = true;
    G.DATA.journal.forEach(function (p) {
      if (p.unlock === flag && st.journalSeen.indexOf(p.id) < 0) {
        st.journalSeen.push(p.id);
        G.log('Journal page recovered: “' + p.title + '”', 'story');
        G.emit('journal', p);
      }
    });
  };

  /* ---------- movement & node resolution ---------- */
  /* Cartographer's Table L3: survey the way ahead to slip past a rank, once per run */
  X.canSurvey = function () {
    var ex = G.state.expedition;
    return ex && ex.mode === 'map' && G.bldFx('cartographer', 'survey', false) && !ex.surveyed && !ex.bypass;
  };
  X.survey = function () {
    var ex = G.state.expedition;
    if (!X.canSurvey()) return;
    ex.surveyed = true; ex.bypass = true;
    X.elog('The Cartographer’s survey pays off — you read a high ledge past the next rank.', 'good');
    G.emit('expedition');
  };

  X.currentNode = function () {
    var ex = G.state.expedition;
    return ex && ex.map ? X.findNode(ex.map, ex.at) : null;
  };
  X.nextChoices = function () {
    var ex = G.state.expedition;
    if (!ex || ex.mode !== 'map') return [];
    var cur = X.currentNode();
    if (!cur) return [];
    return cur.edges.map(function (id) { return X.findNode(ex.map, id); });
  };

  X.move = function (nodeId) {
    var st = G.state, ex = st.expedition;
    if (!ex || ex.mode !== 'map') return { ok: false };
    var cur = X.currentNode();
    if (cur.edges.indexOf(nodeId) < 0) return { ok: false, msg: 'No passage that way.' };
    var node = X.findNode(ex.map, nodeId);
    ex.at = nodeId;

    // torchlight — relic / mood / ascension can make the dark hungrier for torches
    var torchCost = 1 + (G.Relics ? G.Relics.add('torchDrain') : 0) + (G.Moods ? G.Moods.fx('torch', 0) : 0) + (G.Ascension ? G.Ascension.torch() : 0);
    if (ex.torches >= torchCost) {
      ex.torches -= torchCost;
    } else {
      ex.torches = 0; // burn what's left, then grope
      var team = X.team();
      var hurt = 0;
      var darkDmg = Math.max(1, G.BAL.darknessHp - G.bldFx('cartographer', 'darkCut', 0)); // the Table steadies the crew
      team.forEach(function (d) {
        var t = G.Delvers.trait(d);
        if (!t.noDark) { d.hp = Math.max(1, d.hp - darkDmg); hurt++; }
      });
      if (hurt) X.elog('The team gropes forward in the dark. (-' + darkDmg + ' hp)', 'bad');
      else X.elog('The team gropes forward in the dark — the tunnel-born lead the way.', 'info');
    }

    if (ex.bypass && node.type !== 'shaft' && node.type !== 'guardian') {
      ex.bypass = false;
      node.done = true;
      X.elog('You slip past on the high ledge — whatever waited below waits on.', 'good');
      G.emit('expedition');
      return { ok: true };
    }

    X.resolveNode(node);
    G.emit('expedition');
    return { ok: true };
  };

  X.resolveNode = function (node) {
    var st = G.state, ex = st.expedition;
    var depth = ex.depth;
    switch (node.type) {
      case 'fight': {
        node.done = true;
        if (node.trial) X.elog('A trial of the Heart: ' + node.trial + '.', 'story');
        G.Combat.start(node.enc || X.buildEncounter(depth), {});
        break;
      }
      case 'guardian': {
        // resolved via shaft-style choice UI first (approach), then fight
        ex.mode = 'guardian';
        if (G.Hints) G.Hints.fire('firstGuardian');
        break;
      }
      case 'rival': {
        node.done = true;
        X.startRival(depth);
        break;
      }
      case 'event': {
        node.done = true;
        X.startEvent(depth);
        break;
      }
      case 'cache': {
        node.done = true;
        var val = 8 + depth * 5 + G.rint(0, 6);
        X.grantLootValue(val);
        var marks = G.rint(0, 3 + depth * 2);
        if (marks) { ex.marksFound += marks; X.elog('Cache: goods worth ~' + val + 'ᵯ and ' + marks + ' loose marks.', 'good'); }
        else X.elog('Cache: goods worth ~' + val + 'ᵯ.', 'good');
        break;
      }
      case 'hazard': {
        node.done = true;
        X.runHazard(depth);
        break;
      }
      case 'rest': {
        node.done = true;
        var team = X.team();
        team.forEach(function (d) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + Math.round(G.Delvers.maxHp(d) * 0.2)); });
        var found = G.rchance(0.4) ? G.rint(1, 2) : 0;
        if (found) ex.torches += found;
        X.elog('A defensible hollow. The team rests and patches up.' + (found ? ' Found ' + found + ' usable torches.' : ''), 'good');
        break;
      }
      case 'peddler': {
        node.done = true;
        ex.mode = 'peddler';
        X.elog('A deep peddler’s lantern glows in an alcove. “Fair rates for the depth,” it says.', 'info');
        break;
      }
      case 'pulse': {
        // a heartbeat chamber in the Veins: rest to the Maw's pulse, and it gives a little
        node.done = true;
        var team = X.team();
        team.forEach(function (d) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + Math.round(G.Delvers.maxHp(d) * 0.25)); });
        if (G.rchance(0.5)) X.grantMat('pulse_gem', 1);
        else X.grantLootValue(6 + depth);
        X.elog('A chamber that beats slow and warm. The team breathes with the Maw and mends.', 'good');
        break;
      }
      case 'shaft': {
        ex.mode = 'shaft';
        break;
      }
    }
  };

  X.buildEncounter = function (depth) {
    var biome = G.DATA.biomeForDepth(depth);
    var table = G.DATA.encounters[biome.id].filter(function (e) { return depth >= (e.minD || 1); });
    var pick = G.rweighted(table, function (e) { return e.w; });
    var group = pick.group.slice();
    // Undervault "Audit" affix: a Court noble joins every third fight
    if (G.Vault && G.Vault.auditThisFight()) group.push(G.Vault.auditNoble());
    return group;
  };

  X.runHazard = function (depth) {
    var biome = G.DATA.biomeForDepth(depth);
    var hazards = biome.hazards || [
      { name: 'Rockfall', stat: 'might', text: 'The roof lets go over the passage!' },
      { name: 'Gas pocket', stat: 'wits', text: 'The torch flame turns green — bad air!' },
      { name: 'Glass field', stat: 'luck', text: 'The floor is a field of upturned ember-glass razors.' }
    ];
    var hz = G.rpick(hazards);
    var team = X.team();
    var best = team[0];
    team.forEach(function (d) { if (d.stats[hz.stat] > best.stats[hz.stat]) best = d; });
    var p = G.U.clamp(0.5 + (best.stats[hz.stat] - (4 + depth)) * 0.07, 0.15, 0.92);
    if (G.rchance(p)) {
      X.elog(hz.text + ' ' + best.name + ' sees it coming — the team gets clear.', 'good');
      X.grantXpAll(2);
    } else {
      var dmg = 3 + depth + G.rint(0, 3);
      team.forEach(function (d) { d.hp = Math.max(1, d.hp - dmg); });
      X.elog(hz.text + ' The team takes ' + dmg + ' damage getting through.', 'bad');
    }
  };

  /* ---------- events ---------- */
  X.startEvent = function (depth) {
    var st = G.state, ex = st.expedition;
    var biome = G.DATA.biomeForDepth(depth);
    var pool = G.DATA.events.filter(function (e) {
      if (e.biome && e.biome !== biome.id) return false;
      if (depth < (e.minD || 1) || depth > (e.maxD || 99)) return false;
      return true;
    });
    var recent = ex.recentEvents = ex.recentEvents || [];
    var fresh = pool.filter(function (e) { return recent.indexOf(e.id) < 0; });
    if (fresh.length) pool = fresh;
    var ev = G.rweighted(pool, function (e) { return e.w || 10; });
    recent.push(ev.id);
    if (recent.length > 5) recent.shift();
    ex.mode = 'event';
    ex.event = { id: ev.id, stage: 'choose', outcomeText: null, pendingFight: null };
  };

  X.eventDef = function () {
    var ex = G.state.expedition;
    return ex && ex.event ? G.U.byId(G.DATA.events, ex.event.id) : null;
  };

  X.choiceAvailable = function (choice) {
    var st = G.state, ex = st.expedition;
    if (!choice.cost) return true;
    if (choice.cost.marks && st.marks + ex.marksFound < choice.cost.marks) return false;
    var kinds = ['torches', 'rations', 'bandages'];
    for (var i = 0; i < kinds.length; i++) {
      if (choice.cost[kinds[i]] && ex[kinds[i]] < choice.cost[kinds[i]]) return false;
    }
    return true;
  };

  X.chooseEvent = function (choiceIdx) {
    var st = G.state, ex = st.expedition;
    var def = X.eventDef();
    if (!def || ex.event.stage !== 'choose') return;
    var choice = def.choices[choiceIdx];
    if (!choice || !X.choiceAvailable(choice)) return;

    // pay costs
    if (choice.cost) {
      if (choice.cost.marks) {
        var m = choice.cost.marks;
        var fromFound = Math.min(ex.marksFound, m);
        ex.marksFound -= fromFound;
        st.marks -= (m - fromFound);
        st.stats.spent += (m - fromFound);
      }
      ['torches', 'rations', 'bandages'].forEach(function (k) {
        if (choice.cost[k]) ex[k] -= choice.cost[k];
      });
    }

    // find the acting delver (best stat if check, else random)
    var team = X.team();
    var actor = G.rpick(team);
    var outs;
    if (choice.check) {
      team.forEach(function (d) { if (d.stats[choice.check.stat] > actor.stats[choice.check.stat]) actor = d; });
      var bonus = 0;
      team.forEach(function (d) { bonus += (G.Delvers.trait(d).eventLuck || 0); });
      var chalk = (G.Prestige && G.Prestige.fx('eventLuck')) || 0; // Maren's Chalk legacy perk
      var stat = actor.stats[choice.check.stat] + (choice.check.stat === 'luck' ? bonus : 0) + chalk;
      var p = G.U.clamp(0.5 + (stat - choice.check.dc) * 0.07, 0.15, 0.92);
      outs = G.rchance(p) ? choice.outcomes.success : choice.outcomes.fail;
    } else {
      outs = choice.outcomes.success || choice.outcomes; // plain array
    }
    var out = G.rweighted(outs, function (o) { return o.p * 100; });
    ex.event.stage = 'outcome';
    ex.event.outcomeText = out.text;
    X.applyFx(out.fx || {}, actor);
    G.emit('expedition');
  };

  X.applyFx = function (fx, actor) {
    var st = G.state, ex = st.expedition;
    var team = X.team();
    if (fx.marks) {
      if (fx.marks > 0) { ex.marksFound += fx.marks; }
      else { st.marks = Math.max(0, st.marks + fx.marks); }
    }
    if (fx.mats) {
      for (var id in fx.mats) X.grantMat(id, fx.mats[id]);
    }
    if (fx.lootValue) X.grantLootValue(fx.lootValue);
    if (fx.hp) {
      var d = actor || G.rpick(team);
      d.hp = Math.max(1, d.hp + fx.hp); // events wound, combat kills
      if (fx.hp < 0) X.elog(d.name + ' takes ' + (-fx.hp) + ' damage.', 'bad');
    }
    if (fx.hpAll) team.forEach(function (d) { d.hp = Math.max(1, d.hp + fx.hpAll); });
    if (fx.heal && actor) actor.hp = Math.min(G.Delvers.maxHp(actor), actor.hp + fx.heal);
    if (fx.healAll) team.forEach(function (d) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + fx.healAll); });
    if (fx.xp) team.forEach(function (d) { G.Delvers.gainXp(d, Math.ceil(fx.xp / team.length) + 1); });
    if (fx.supplies) {
      for (var k in fx.supplies) ex[k] = Math.max(0, ex[k] + fx.supplies[k]);
    }
    if (fx.skipRank) ex.bypass = true;
    if (fx.recruit) {
      var nd = G.Delvers.generate(2);
      nd.freeDays = 30;
      G.Delvers.addToRoster(nd);
      X.elog(nd.name + ' (' + G.DATA.classes[nd.cls].name + ') will be waiting at the tavern — first month free.', 'good');
    }
    if (fx.rescueBeast && G.Beasts) {
      // the beast comes home if there's a Menagerie with room; the event flavor
      // already covers the "no menagerie" case in the log
      G.Beasts.rescue(fx.rescueBeast);
    }
    if (fx.fight) {
      ex.event.pendingFight = fx.fight === 'encounter' ? X.buildEncounter(ex.depth) : fx.fight.slice();
      ex.event.firstStrike = !!fx.firstStrike;
    }
  };

  X.closeEvent = function () {
    var ex = G.state.expedition;
    if (!ex || ex.mode !== 'event') return;
    var pending = ex.event && ex.event.pendingFight;
    var fs = ex.event && ex.event.firstStrike;
    ex.event = null;
    if (pending) G.Combat.start(pending, { firstStrike: fs });
    else ex.mode = 'map';
    G.emit('expedition');
  };

  /* ---------- loot ---------- */
  X.grantMat = function (id, qty) {
    var ex = G.state.expedition;
    if (G.Vault && G.Vault.giltActive()) qty *= 2; // the Gilt affix doubles what the dark sheds
    ex.loot[id] = (ex.loot[id] || 0) + qty;
    if (G.Codex) G.Codex.discover('material', id);
    X.elog('+' + qty + '× ' + G.DATA.materials[id].name, 'loot');
  };
  X.grantLootValue = function (value) {
    var ex = G.state.expedition;
    var biome = G.DATA.biomeForDepth(ex.depth);
    // greedy trait + ledger-charm gear + relic all lift loot value
    var team = X.team();
    var mult = 1;
    team.forEach(function (d) {
      var t = G.Delvers.trait(d); if (t.lootMult) mult = Math.max(mult, t.lootMult);
      if (G.Forge) mult += G.Forge.fx(d, 'loot');
    });
    if (G.Relics) mult *= G.Relics.mult('lootMult');
    if (G.Moods) mult *= G.Moods.fx('loot', 1);        // the Maw's generosity
    if (G.Omens) mult *= G.Omens.mult('loot');          // chosen omens
    if (G.Beasts) mult *= G.Beasts.passive('loot', 1);  // a fetching beast
    if (G.Vault && G.Vault.giltActive()) mult *= 2;     // the Gilt affix doubles loot value
    value = Math.round(value * mult);
    var tries = 0;
    while (value > 0 && tries++ < 30) {
      var mid = G.rpick(biome.mats);
      var mat = G.DATA.materials[mid];
      if (mat.base > value + 4) continue;
      ex.loot[mid] = (ex.loot[mid] || 0) + 1;
      value -= mat.base;
    }
  };
  X.grantXpAll = function (amount) {
    X.team().forEach(function (d) { G.Delvers.gainXp(d, amount); });
  };

  /* ---------- peddler ---------- */
  X.peddlerBuy = function (kind) {
    var st = G.state, ex = st.expedition;
    var markup = (G.Renown && G.Renown.hasPerk('peddler')) ? 1.2 : 1.6; // renown perk
    var cost = Math.ceil((G.BAL.supplyCost[kind] || 2) * markup);
    var funds = st.marks + ex.marksFound;
    if (funds < cost) return { ok: false, msg: 'Not enough marks.' };
    var fromFound = Math.min(ex.marksFound, cost);
    ex.marksFound -= fromFound; st.marks -= (cost - fromFound);
    ex[kind]++;
    G.emit('expedition');
    return { ok: true };
  };
  X.peddlerSellAll = function () {
    var st = G.state, ex = st.expedition;
    var total = 0;
    for (var id in ex.loot) {
      total += Math.floor(G.Economy.price(id) * 0.7) * ex.loot[id];
    }
    if (!total) return { ok: false, msg: 'Nothing to sell.' };
    ex.loot = {};
    ex.marksFound += total;
    X.elog('The peddler weighs everything twice and pays ' + total + 'ᵯ. “Lighter pockets, longer legs.”', 'good');
    G.emit('expedition');
    return { ok: true };
  };
  X.leavePeddler = function () {
    var ex = G.state.expedition;
    if (ex && ex.mode === 'peddler') { ex.mode = 'map'; G.emit('expedition'); }
  };

  /* ---------- rival encounter (v3.0) ---------- */
  X.startRival = function (depth) {
    var ex = G.state.expedition;
    if (!G.Rivals) { ex.mode = 'map'; return; }
    var r = G.Rivals.pickRival();
    ex.rival = { id: r.id, resolved: false };
    ex.mode = 'rival';
    X.elog('Another charter’s lanterns bob in the dark — ' + G.Rivals.def(r.id).name + '.', 'info');
  };
  X.rivalDef = function () {
    var ex = G.state.expedition;
    return ex && ex.rival ? G.Rivals.def(ex.rival.id) : null;
  };
  X.rivalTrade = function () {
    var st = G.state, ex = st.expedition;
    var total = 0;
    for (var id in ex.loot) total += Math.floor(G.Economy.price(id) * 0.85) * ex.loot[id]; // better than the peddler
    if (!total) { X.elog('You have nothing to trade; the factor shrugs and moves on.', 'info'); }
    else {
      ex.loot = {}; ex.marksFound += total;
      X.elog(X.rivalDef().parley.trade + ' They pay ' + total + 'ᵯ.', 'good');
    }
    ex.mode = 'map'; ex.rival = null; G.emit('expedition');
  };
  X.rivalWager = function () {
    var st = G.state, ex = st.expedition;
    var cost = 8 + ex.depth * 2;
    if (st.marks + ex.marksFound < cost) return { ok: false, msg: 'Not enough marks for the wager.' };
    var fromFound = Math.min(ex.marksFound, cost);
    ex.marksFound -= fromFound; st.marks -= (cost - fromFound);
    // buy a bypass of the next rank (their map intel)
    ex.bypass = true;
    X.elog(X.rivalDef().parley.wager + ' You buy the safe line past the next stair.', 'good');
    ex.mode = 'map'; ex.rival = null; G.emit('expedition');
    return { ok: true };
  };
  X.rivalBrawl = function () {
    var ex = G.state.expedition;
    var rid = ex.rival.id;
    X.elog(X.rivalDef().parley.brawl, 'bad');
    ex.rival = null;
    G.Combat.start(G.Rivals.encounterCrew(ex.depth), { brawl: true, rivalId: rid });
    G.emit('expedition');
  };
  X.leaveRival = function () {
    var ex = G.state.expedition;
    if (ex && ex.mode === 'rival') { ex.mode = 'map'; ex.rival = null; G.emit('expedition'); }
  };

  /* ---------- shaft / guardian / descent ---------- */
  X.canDescend = function () {
    var st = G.state, ex = st.expedition;
    if (!ex) return false;
    if (ex.vault) return true; // the Undervault has no bottom
    var depth = ex.depth;
    if (depth >= G.DATA.maxDepth()) return false;
    var biome = G.DATA.biomeForDepth(depth);
    if (depth === biome.depths[1] && !st.guardiansSlain[biome.id]) return false; // guardian bars the stair
    if (depth + 1 === 13 && st.heartSealed) return false; // the Heart's stair was collapsed
    return true;
  };
  X.descend = function () {
    var ex = G.state.expedition;
    if (!ex || (ex.mode !== 'shaft' && ex.mode !== 'guardian_won')) return;
    if (!X.canDescend()) return;
    if (ex.vault && G.Vault) G.Vault.onDescend(); // advance the stratum + reroll affixes before the floor builds
    ex.mode = 'map';
    X.enterFloor(ex.depth + 1);
    G.emit('expedition');
  };
  X.fightGuardian = function () {
    var ex = G.state.expedition;
    if (!ex || ex.mode !== 'guardian') return;
    if (ex.vault && G.Vault) {
      G.Combat.start([G.Vault.guardianFor(ex.stratum)], { guardian: true, vaultGuardian: true });
    } else {
      var biome = G.DATA.biomeForDepth(ex.depth);
      G.Combat.start([biome.guardian], { guardian: true });
    }
    G.emit('expedition');
  };

  /* v8: the true ending is available once all three base endings have been reached
   * (this charter or across charters) — a fourth answer to Maren's question. */
  X.trueEndingReady = function () {
    var st = G.state;
    var seen = {};
    (st.endings || []).forEach(function (e) { seen[e] = true; });
    (st._legEndings || []).forEach(function (e) { seen[e] = true; });
    return seen.seal && seen.trade && seen.become;
  };

  /* ---------- the Heart's three endings (v5.0) ---------- */
  X.chooseEnding = function (endingId) {
    var st = G.state, ex = st.expedition;
    if (!ex || ex.mode !== 'heart_parley') return { ok: false };
    var end = G.DATA.endings[endingId];
    if (!end) return { ok: false };
    // the Heart pays out its whole account, whatever you decide
    X.grantMat('heart_ember', G.rint(3, 5));
    X.grantMat('held_breath', G.rint(2, 3));
    ex.marksFound += G.rint(150, 250);
    st.guardiansSlain.heart = true;
    if (G.Exp.unlockJournal) X.unlockJournal('guardian_heart');
    // record the ending (once per kind)
    st.endings = st.endings || [];
    if (st.endings.indexOf(endingId) < 0) st.endings.push(endingId);
    st.heartOutcome = endingId;
    if (G.Codex) G.Codex.discover('ending', endingId);
    // v8: remember Heart endings across charters (gates the true ending)
    if (endingId !== 'reckoning' && G.Prestige) {
      var legE = G.Prestige.loadLegacy();
      legE.endings = legE.endings || [];
      if (legE.endings.indexOf(endingId) < 0) { legE.endings.push(endingId); G.Prestige.saveLegacy(legE); }
      if (st._legEndings && st._legEndings.indexOf(endingId) < 0) st._legEndings.push(endingId);
    }

    // ending-specific, lasting effects
    if (endingId === 'seal') {
      st.heartSealed = true;                 // the rift dims; no re-entry
      if (G.Renown) G.Renown.award(null, 120);
    } else if (endingId === 'trade') {
      st.questPerks = st.questPerks || {};
      st.questPerks.heart_trade = true;      // +8% sell forever; the Vault stays open
      if (G.Renown) G.Renown.award(null, 100);
    } else if (endingId === 'become') {
      // a large legacy windfall, banked to the persistent store
      if (G.Prestige) {
        var leg = G.Prestige.loadLegacy();
        leg.marks = (leg.marks || 0) + 6;
        G.Prestige.saveLegacy(leg);
        st.legacy.marks = (st.legacy.marks || 0) + 6;
      }
      if (G.Renown) G.Renown.award(null, 80);
    } else if (endingId === 'reckoning') {
      // the true ending: the books are squared. A grand windfall and a New-Game++ seal.
      st.trueEnding = true;
      if (G.Prestige) {
        var legR = G.Prestige.loadLegacy();
        legR.marks = (legR.marks || 0) + 12; legR.trueEnding = true;
        G.Prestige.saveLegacy(legR);
        st.legacy.marks = (st.legacy.marks || 0) + 12;
      }
      if (G.Renown) G.Renown.award(null, 200);
    }
    if (G.Achieve) G.Achieve.grant('heart_' + endingId);
    if (G.Ascension) G.Ascension.onEnding(); // bank the Ascension clear, unlock the next tier
    ex.endingId = endingId;
    // carry the choice into the surface summary; the UI shows the epilogue
    var summary = X.surface();
    summary.ending = endingId;
    st.lastRun = summary;
    G.emit('ending', { id: endingId });
    return { ok: true, ending: endingId };
  };

  /* ---------- going home ---------- */
  X.surface = function () {
    var st = G.state, ex = st.expedition;
    if (!ex) return;
    var endingId = ex.endingId || null; // set when surfacing from a Heart ending
    var haul = 0;
    for (var id in ex.loot) {
      st.inventory[id] = (st.inventory[id] || 0) + ex.loot[id];
      haul += G.Economy.price(id) * ex.loot[id];
    }
    var survivors = X.team();
    // greedy pocket: chance a greedy delver skims
    survivors.forEach(function (d) {
      var t = G.Delvers.trait(d);
      if (t.pocket && G.rchance(t.pocket) && ex.marksFound > 4) {
        var skim = Math.ceil(ex.marksFound * 0.15);
        ex.marksFound -= skim;
        G.log(d.name + ' reports the count a little light. (' + skim + 'ᵯ missing)', 'bad');
      }
    });
    // the badly-hurt may carry a wound home (v2.0 injuries)
    if (G.Economy.checkInjuries) G.Economy.checkInjuries(survivors);
    st.marks += ex.marksFound;
    st.stats.earned += ex.marksFound;
    st.supplies.torches += ex.torches;
    st.supplies.rations += ex.rations;
    st.supplies.bandages += ex.bandages;
    var summary = {
      haul: haul, marks: ex.marksFound, days: ex.daysOut,
      kills: ex.killCount, depth: st.stats.deepest, wiped: false,
      survivors: X.team().length,
      ending: endingId // present only for a Heart ending, so the epilogue owns the modal
    };
    // achievement: end a depth-3+ run with the torches spent
    if (G.Achieve && ex.startDepth >= 3 && ex.torches === 0) G.Achieve.grant('no_torch');
    st.expedition = null;
    st.lastRun = summary;
    G.log('The winch hauls the team up: goods worth ~' + haul + 'ᵯ and ' + summary.marks + 'ᵯ in coin.', 'story');
    if (G.Achieve) G.Achieve.check();
    G.emit('returned', summary);
    G.save();
    return summary;
  };

  X.wipe = function () {
    var st = G.state, ex = st.expedition;
    if (!ex) return;
    var lost = X.team();
    lost.forEach(function (d) { G.Delvers.kill(d, 'lost at depth ' + ex.depth); });
    // Ascension X: a total wipe collapses one building by a level
    if (G.Ascension && G.Ascension.wipeCollapses()) {
      var built = Object.keys(st.buildings).filter(function (b) { return st.buildings[b] > (b === 'storehouse' ? 1 : 0); });
      if (built.length) { var b = G.rpick(built); st.buildings[b]--; G.log('The Collapsing Charter takes its due: the ' + G.DATA.buildings[b].name + ' falls to L' + st.buildings[b] + '.', 'bad'); }
    }
    var summary = { haul: 0, marks: 0, days: ex.daysOut, kills: ex.killCount, wiped: true, survivors: 0, depth: ex.depth };
    st.expedition = null;
    st.lastRun = summary;
    G.log('No one comes up. The winch rope returns light. The Maw kept everything.', 'bad');
    G.emit('returned', summary);
    G.save();
    return summary;
  };
})();
