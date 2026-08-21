/* Scene painters: town, delve chart, combat diorama. All art is procedural. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var F = G.GFX;
  var hsl = F.hsl;

  var flashes = {}; // uid/delverId -> expiry (F.t)

  /* usable width: the play area not covered by the side panel */
  F.uW = function () { return F.W > 720 ? F.W - 430 : F.W; };

  /* =================== TOWN =================== */
  F.scenes.town = function (cx, W, H, t) {
    // sky
    var sky = cx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0d0f1e');
    sky.addColorStop(0.55, '#241a2e');
    sky.addColorStop(0.8, '#4a2c25');
    sky.addColorStop(1, '#1c120c');
    cx.fillStyle = sky;
    cx.fillRect(0, 0, W, H);

    // stars
    cx.save();
    for (var i = 0; i < 60; i++) {
      var sx = (i * 137.5) % W, sy = ((i * 89.3) % (H * 0.45));
      var tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i));
      cx.globalAlpha = 0.25 + 0.4 * tw;
      cx.fillStyle = '#cdd3ff';
      cx.fillRect(sx, sy, 1.6, 1.6);
    }
    cx.restore();

    // moon
    F.glow(cx, W * 0.16, H * 0.18, 90, 'rgba(220,215,255,0.55)', 0.5);
    cx.fillStyle = '#d8d4e8';
    cx.beginPath(); cx.arc(W * 0.16, H * 0.18, 26, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#b9b4cf';
    cx.beginPath(); cx.arc(W * 0.155, H * 0.175, 6, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(W * 0.17, H * 0.19, 3.4, 0, Math.PI * 2); cx.fill();

    // far hills
    cx.fillStyle = '#161222';
    F.poly(cx, [[0, H * 0.62], [W * 0.2, H * 0.5], [W * 0.45, H * 0.6], [W * 0.7, H * 0.48], [W, H * 0.58], [W, H], [0, H]]);
    cx.fill();
    // near hills
    cx.fillStyle = '#100d18';
    F.poly(cx, [[0, H * 0.7], [W * 0.3, H * 0.6], [W * 0.55, H * 0.68], [W * 0.8, H * 0.58], [W, H * 0.66], [W, H], [0, H]]);
    cx.fill();

    // THE MAW: rift on the right of the visible play area
    var mx = F.uW() * 0.82, gy = H * 0.72;
    F.glow(cx, mx, gy + 30, 190, 'rgba(255,120,30,0.5)', 0.55 + 0.1 * Math.sin(t * 1.3));
    cx.fillStyle = '#050303';
    F.poly(cx, [[mx - 90, H], [mx - 55, gy + 40], [mx - 20, gy + 6], [mx + 12, gy + 34], [mx + 45, gy - 2], [mx + 80, gy + 46], [mx + 110, H]]);
    cx.fill();
    cx.strokeStyle = 'rgba(255,140,50,0.8)';
    cx.lineWidth = 2;
    F.poly(cx, [[mx - 55, gy + 40], [mx - 20, gy + 6], [mx + 12, gy + 34], [mx + 45, gy - 2], [mx + 80, gy + 46]], false);
    cx.stroke();
    // winch frame over the rift
    cx.strokeStyle = '#3a2c1c';
    cx.lineWidth = 5;
    cx.beginPath();
    cx.moveTo(mx - 40, gy + 20); cx.lineTo(mx, gy - 60); cx.lineTo(mx + 40, gy + 18);
    cx.stroke();
    cx.strokeStyle = '#6b5233';
    cx.lineWidth = 1.5;
    cx.beginPath(); cx.moveTo(mx, gy - 58); cx.lineTo(mx, gy + 30); cx.stroke();
    // rising embers
    if (Math.random() < 0.25) {
      F.spawn({ x: mx + (Math.random() - 0.5) * 90, y: gy + 40, vx: (Math.random() - 0.5) * 12, vy: -24 - Math.random() * 30, life: 2.5, size: 1.5 + Math.random() * 1.8, color: 'rgba(255,' + (120 + Math.floor(Math.random() * 80)) + ',40,1)', grav: -6, fade: true, glow: true });
    }

    // ground
    var gr = cx.createLinearGradient(0, H * 0.78, 0, H);
    gr.addColorStop(0, '#221610');
    gr.addColorStop(1, '#0d0805');
    cx.fillStyle = gr;
    cx.fillRect(0, H * 0.78, W, H * 0.22);

    // buildings
    var st = G.state;
    if (st) {
      var by = H * 0.8, U = F.uW();
      drawStorehouse(cx, U * 0.04, by, st.buildings.storehouse, t);
      drawTavern(cx, U * 0.20, by, st.buildings.tavern, t);
      drawAssay(cx, U * 0.36, by, st.buildings.assay, t);
      drawInfirmary(cx, U * 0.49, by, st.buildings.infirmary, t);
      if (st.buildings.forge) drawForge(cx, U * 0.62, by, st.buildings.forge, t);
      if (st.buildings.contracts) drawContractsBoard(cx, U * 0.76, by, st.buildings.contracts, t);
    }

    // fog band
    cx.save();
    cx.globalAlpha = 0.08 + 0.03 * Math.sin(t * 0.5);
    cx.fillStyle = '#c9a468';
    cx.fillRect(0, H * 0.74, W, H * 0.06);
    cx.restore();
  };

  function ghost(cx, x, y, w, h, label) {
    cx.save();
    cx.strokeStyle = 'rgba(200,170,110,0.35)';
    cx.setLineDash([5, 5]);
    cx.lineWidth = 1.5;
    cx.strokeRect(x, y - h, w, h);
    cx.setLineDash([]);
    cx.fillStyle = 'rgba(200,170,110,0.4)';
    cx.font = '11px Georgia, serif';
    cx.textAlign = 'center';
    cx.fillText(label, x + w / 2, y - h / 2);
    cx.restore();
  }
  function windowLit(cx, x, y, w, h, t, phase) {
    cx.fillStyle = 'rgba(255,190,90,' + (0.75 + 0.2 * Math.sin(t * 2 + (phase || 0))) + ')';
    cx.fillRect(x, y, w, h);
  }
  function drawStorehouse(cx, x, y, lvl, t) {
    if (!lvl) return ghost(cx, x, y, 120, 70, 'Storehouse (plot)');
    var w = 100 + lvl * 14, h = 54 + lvl * 8;
    cx.fillStyle = '#2e2118';
    cx.fillRect(x, y - h, w, h);
    cx.fillStyle = '#43301f';
    F.poly(cx, [[x - 8, y - h], [x + w / 2, y - h - 26 - lvl * 4], [x + w + 8, y - h]]);
    cx.fill();
    cx.fillStyle = '#1c130c';
    cx.fillRect(x + w * 0.38, y - 30, 26, 30);
    windowLit(cx, x + 12, y - h + 14, 12, 10, t, 1);
    if (lvl >= 2) windowLit(cx, x + w - 26, y - h + 14, 12, 10, t, 2);
    // crates
    cx.fillStyle = '#3d2d1c';
    cx.fillRect(x + w + 6, y - 16, 16, 16);
    cx.fillRect(x + w + 24, y - 12, 12, 12);
    if (lvl >= 3) cx.fillRect(x + w + 8, y - 30, 14, 14);
  }
  function drawTavern(cx, x, y, lvl, t) {
    if (!lvl) return ghost(cx, x, y, 100, 80, 'Tavern (plot)');
    var w = 90 + lvl * 10, h = 66 + lvl * 10;
    cx.fillStyle = '#33241a';
    cx.fillRect(x, y - h, w, h);
    cx.fillStyle = '#4a3423';
    F.poly(cx, [[x - 6, y - h], [x + w / 2, y - h - 22], [x + w + 6, y - h]]);
    cx.fill();
    windowLit(cx, x + 12, y - h + 16, 14, 12, t, 0);
    windowLit(cx, x + w - 28, y - h + 16, 14, 12, t, 3);
    windowLit(cx, x + 14, y - 30, 14, 12, t, 5);
    cx.fillStyle = '#1c130c';
    cx.fillRect(x + w * 0.45, y - 32, 22, 32);
    // hanging sign
    cx.strokeStyle = '#6b5233'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(x + w + 4, y - h + 8); cx.lineTo(x + w + 16, y - h + 8); cx.stroke();
    var sw = Math.sin(t * 1.4) * 0.08;
    cx.save();
    cx.translate(x + w + 16, y - h + 8);
    cx.rotate(sw);
    cx.fillStyle = '#7a5a33';
    cx.fillRect(-8, 2, 18, 14);
    cx.fillStyle = '#ffce7a';
    cx.fillRect(-3, 6, 8, 7); // mug
    cx.restore();
    // chimney smoke
    if (Math.random() < 0.12) {
      F.spawn({ x: x + 16, y: y - h - 20, vx: 6 + Math.random() * 6, vy: -14, life: 2.4, size: 3 + Math.random() * 3, color: 'rgba(170,160,150,0.25)', grav: -4, fade: true });
    }
    cx.fillStyle = '#241811';
    cx.fillRect(x + 10, y - h - 18, 10, 18);
  }
  function drawAssay(cx, x, y, lvl, t) {
    if (!lvl) return ghost(cx, x, y, 84, 60, 'Assay (plot)');
    var w = 76 + lvl * 8, h = 48 + lvl * 6;
    cx.fillStyle = '#2b2430';
    cx.fillRect(x, y - h, w, h);
    cx.fillStyle = '#3d3346';
    cx.fillRect(x - 4, y - h - 8, w + 8, 10);
    windowLit(cx, x + w / 2 - 9, y - h + 12, 18, 14, t, 2);
    // scale emblem
    cx.strokeStyle = '#c9a468'; cx.lineWidth = 1.5;
    cx.beginPath();
    cx.moveTo(x + w / 2, y - h + 30); cx.lineTo(x + w / 2, y - h + 40);
    cx.moveTo(x + w / 2 - 8, y - h + 32); cx.lineTo(x + w / 2 + 8, y - h + 32);
    cx.stroke();
    cx.fillStyle = '#1c130c';
    cx.fillRect(x + w * 0.4, y - 26, 18, 26);
  }
  function drawInfirmary(cx, x, y, lvl, t) {
    if (!lvl) return ghost(cx, x, y, 84, 56, 'Infirmary (plot)');
    var w = 78 + lvl * 8, h = 46 + lvl * 6;
    cx.fillStyle = '#2a2f2a';
    cx.fillRect(x, y - h, w, h);
    cx.fillStyle = '#3a453a';
    F.poly(cx, [[x - 5, y - h], [x + w / 2, y - h - 16], [x + w + 5, y - h]]);
    cx.fill();
    windowLit(cx, x + 10, y - h + 12, 12, 10, t, 4);
    // cross
    cx.fillStyle = '#d8e8d8';
    cx.fillRect(x + w - 26, y - h + 8, 14, 4);
    cx.fillRect(x + w - 21, y - h + 3, 4, 14);
    cx.fillStyle = '#1c130c';
    cx.fillRect(x + w * 0.42, y - 24, 17, 24);
  }

  function drawForge(cx, x, y, lvl, t) {
    var w = 80 + lvl * 8, h = 50 + lvl * 6;
    cx.fillStyle = '#2a1c14';
    cx.fillRect(x, y - h, w, h);
    cx.fillStyle = '#3a271a';
    F.poly(cx, [[x - 5, y - h], [x + w / 2, y - h - 14], [x + w + 5, y - h]]);
    cx.fill();
    // furnace mouth glowing
    var pulse = 0.55 + 0.35 * Math.abs(Math.sin(t * 2.2));
    F.glow(cx, x + w * 0.5, y - 16, 30, 'rgba(255,110,30,0.9)', pulse);
    cx.fillStyle = 'rgba(255,150,60,' + pulse + ')';
    F.rr(cx, x + w * 0.35, y - 26, w * 0.3, 22, 4); cx.fill();
    // chimney + sparks
    cx.fillStyle = '#1c130c';
    cx.fillRect(x + w - 16, y - h - 16, 10, 18);
    if (Math.random() < 0.2) F.spawn({ x: x + w - 11, y: y - h - 16, vx: (Math.random() - 0.3) * 10, vy: -20, life: 1.2, size: 1.6, color: 'rgba(255,170,60,1)', grav: 20, fade: true, glow: true });
    // anvil out front
    cx.fillStyle = '#26242a';
    cx.fillRect(x + 8, y - 12, 16, 6);
    cx.fillRect(x + 13, y - 6, 6, 6);
  }
  function drawContractsBoard(cx, x, y, lvl, t) {
    // posts + a board of pinned notices
    cx.strokeStyle = '#3a271a'; cx.lineWidth = 5;
    cx.beginPath(); cx.moveTo(x + 6, y); cx.lineTo(x + 6, y - 40); cx.moveTo(x + 54, y); cx.lineTo(x + 54, y - 40); cx.stroke();
    cx.fillStyle = '#4a3320';
    F.rr(cx, x, y - 52, 60, 34, 3); cx.fill();
    cx.strokeStyle = '#2a1c12'; cx.lineWidth = 2; cx.strokeRect(x, y - 52, 60, 34);
    // pinned papers scale with level
    var papers = 1 + lvl;
    cx.fillStyle = '#d8cba8';
    for (var i = 0; i < papers && i < 4; i++) {
      var px = x + 6 + (i % 2) * 28, py = y - 48 + Math.floor(i / 2) * 15;
      cx.save(); cx.translate(px, py); cx.rotate((i % 2 ? 1 : -1) * 0.04);
      cx.fillRect(0, 0, 22, 12);
      cx.restore();
    }
    F.glow(cx, x + 30, y - 58, 10, 'rgba(255,190,90,0.5)', 0.5); // lantern over the board
  }

  /* =================== DELVE MAP =================== */
  F.mapLayout = function (W, H) {
    var ex = G.state.expedition;
    if (!ex || !ex.map) return null;
    var rows = ex.map.rows;
    var top = 110, bottom = H - 130;
    var dy = (bottom - top) / Math.max(1, rows.length - 1);
    var pos = {};
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var U = (F.uW ? F.uW() : W);
        var spread = Math.min(U * 0.5, 170 * Math.max(1, row.length - 1));
        var x = U * 0.5 + (row.length === 1 ? 0 : (c / (row.length - 1) - 0.5) * spread);
        pos[row[c].id] = { x: x, y: top + dy * r, node: row[c] };
      }
    }
    return pos;
  };

  F.scenes.delve = function (cx, W, H, t) {
    var ex = G.state.expedition;
    var biome = ex ? G.DATA.biomeForDepth(ex.depth) : G.DATA.biomes[0];
    var pal = biome.pal;
    // cavern bg
    var bg = cx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, pal.bg1);
    bg.addColorStop(1, pal.bg0);
    cx.fillStyle = bg;
    cx.fillRect(0, 0, W, H);
    // rocky edges
    cx.fillStyle = pal.rock;
    F.poly(cx, [[0, 0], [W, 0], [W, 40], [W * 0.8, 62], [W * 0.6, 38], [W * 0.4, 66], [W * 0.2, 42], [0, 60]]);
    cx.fill();
    F.poly(cx, [[0, H], [W, H], [W, H - 36], [W * 0.7, H - 58], [W * 0.45, H - 30], [W * 0.2, H - 60], [0, H - 34]]);
    cx.fill();
    // drifting motes
    if (Math.random() < 0.2) {
      F.spawn({ x: Math.random() * W, y: H * 0.2 + Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 8, life: 3, size: 1.2 + Math.random(), color: pal.glow, grav: 0, fade: true, glow: true });
    }
    if (!ex || !ex.map) return;

    var pos = F.mapLayout(W, H);
    var rows = ex.map.rows;
    // edges as rope lines
    cx.strokeStyle = 'rgba(200,170,120,0.28)';
    cx.lineWidth = 2;
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var n = rows[r][c], p = pos[n.id];
        for (var e = 0; e < n.edges.length; e++) {
          var q = pos[n.edges[e]];
          cx.beginPath();
          cx.moveTo(p.x, p.y);
          var midx = (p.x + q.x) / 2, midy = (p.y + q.y) / 2 + 12;
          cx.quadraticCurveTo(midx, midy, q.x, q.y);
          cx.stroke();
        }
      }
    }
    // nodes
    var cur = ex.at;
    var reach = {};
    if (ex.mode === 'map') {
      var curNode = G.Exp.findNode(ex.map, cur);
      if (curNode) curNode.edges.forEach(function (id) { reach[id] = true; });
    }
    for (var id in pos) {
      var P = pos[id], node = P.node;
      var isCur = id === cur;
      var r0 = node.type === 'guardian' ? 20 : 14;
      if (isCur) {
        F.glow(cx, P.x, P.y, 40, pal.glow, 0.5 + 0.2 * Math.sin(t * 3));
      } else if (reach[id]) {
        F.glow(cx, P.x, P.y, 26, pal.glow, 0.25 + 0.12 * Math.sin(t * 2.4));
      }
      cx.fillStyle = node.done ? 'rgba(70,60,48,0.9)' : '#241d14';
      cx.strokeStyle = isCur ? '#ffd98c' : (reach[id] ? pal.ink : 'rgba(160,140,110,0.5)');
      cx.lineWidth = isCur ? 2.5 : 1.5;
      cx.beginPath(); cx.arc(P.x, P.y, r0, 0, Math.PI * 2);
      cx.fill(); cx.stroke();
      drawNodeIcon(cx, node.type, P.x, P.y, node.done ? 'rgba(200,180,150,0.45)' : pal.ink, t);
    }
  };

  function drawNodeIcon(cx, type, x, y, color, t) {
    cx.save();
    cx.strokeStyle = color; cx.fillStyle = color;
    cx.lineWidth = 1.8; cx.lineCap = 'round';
    switch (type) {
      case 'entry':
        cx.beginPath(); cx.arc(x, y, 5, 0, Math.PI * 2); cx.stroke(); break;
      case 'fight': // crossed picks
        cx.beginPath();
        cx.moveTo(x - 6, y - 6); cx.lineTo(x + 6, y + 6);
        cx.moveTo(x + 6, y - 6); cx.lineTo(x - 6, y + 6);
        cx.stroke(); break;
      case 'event':
        cx.font = '700 13px Georgia, serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText('?', x, y + 1); break;
      case 'cache':
        cx.strokeRect(x - 6, y - 4, 12, 9);
        cx.beginPath(); cx.moveTo(x - 6, y - 1); cx.lineTo(x + 6, y - 1); cx.stroke(); break;
      case 'hazard':
        cx.font = '700 13px Georgia, serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText('!', x, y + 1); break;
      case 'rest': // flame
        cx.beginPath();
        cx.moveTo(x, y - 7);
        cx.quadraticCurveTo(x + 6, y, x, y + 6);
        cx.quadraticCurveTo(x - 6, y, x, y - 7);
        cx.stroke(); break;
      case 'peddler': // lantern
        cx.strokeRect(x - 4, y - 5, 8, 10);
        cx.beginPath(); cx.arc(x, y, 2, 0, Math.PI * 2); cx.fill(); break;
      case 'shaft': // down arrow
        cx.beginPath();
        cx.moveTo(x, y - 6); cx.lineTo(x, y + 5);
        cx.moveTo(x - 4, y + 1); cx.lineTo(x, y + 6); cx.lineTo(x + 4, y + 1);
        cx.stroke(); break;
      case 'guardian': // skull-ish
        cx.beginPath(); cx.arc(x, y - 2, 6, 0, Math.PI * 2); cx.stroke();
        cx.fillRect(x - 4, y + 4, 2.5, 3); cx.fillRect(x + 1.5, y + 4, 2.5, 3);
        cx.beginPath(); cx.arc(x - 2.5, y - 3, 1.4, 0, Math.PI * 2); cx.arc(x + 2.5, y - 3, 1.4, 0, Math.PI * 2); cx.fill();
        break;
      case 'rival': // crossed flags
        cx.beginPath(); cx.moveTo(x - 5, y + 6); cx.lineTo(x - 2, y - 6); cx.moveTo(x + 5, y + 6); cx.lineTo(x + 2, y - 6); cx.stroke();
        cx.beginPath(); cx.moveTo(x - 2, y - 6); cx.lineTo(x - 7, y - 4); cx.lineTo(x - 2, y - 2); cx.moveTo(x + 2, y - 6); cx.lineTo(x + 7, y - 4); cx.lineTo(x + 2, y - 2); cx.stroke();
        break;
    }
    cx.restore();
  }

  /* =================== COMBAT =================== */
  F.combatPos = function (kind, i) {
    var U = F.uW(), H = F.H;
    if (kind === 'delver') return { x: U * 0.30 - i * 96, y: H * 0.58 + i * 52 };
    return { x: U * 0.72 + i * 100, y: H * 0.58 + i * 50 };
  };
  F.FIG_SCALE = 1.5;

  F.scenes.combat = function (cx, W, H, t) {
    var ex = G.state.expedition;
    var biome = ex ? G.DATA.biomeForDepth(ex.depth) : G.DATA.biomes[0];
    var pal = biome.pal;
    var bg = cx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(0.7, pal.bg1);
    bg.addColorStop(1, pal.bg0);
    cx.fillStyle = bg;
    cx.fillRect(0, 0, W, H);
    // torch pools
    F.glow(cx, W * 0.28, H * 0.62, 260, 'rgba(255,160,70,0.35)', ex && ex.torches > 0 ? 0.5 : 0.12);
    F.glow(cx, W * 0.7, H * 0.6, 220, pal.glow, 0.2);
    // ground
    cx.fillStyle = 'rgba(0,0,0,0.35)';
    cx.fillRect(0, H * 0.68, W, H * 0.32);
    cx.strokeStyle = 'rgba(200,170,120,0.15)';
    cx.beginPath(); cx.moveTo(0, H * 0.68); cx.lineTo(W, H * 0.68); cx.stroke();
    // stalactites
    cx.fillStyle = pal.rock;
    for (var s = 0; s < 8; s++) {
      var sx = (s + 0.5) * W / 8 + Math.sin(s * 3.7) * 20;
      F.poly(cx, [[sx - 14, 0], [sx + 14, 0], [sx + Math.sin(s) * 4, 40 + (s % 3) * 22]]);
      cx.fill();
    }
    if (!ex || !ex.combat) return;
    var c = ex.combat;
    var team = G.Exp.team();
    var S = F.FIG_SCALE;
    var i;
    for (i = 0; i < team.length; i++) {
      var p = F.combatPos('delver', i);
      var d = team[i];
      var bob = Math.sin(t * 2.2 + i) * 3;
      drawShadow(cx, p.x, p.y + 26 * S, S);
      cx.save(); cx.translate(p.x, p.y + bob); cx.scale(S, S);
      drawDelver(cx, d, 0, 0, t, flashes['d' + d.id] > F.t, c.awaiting === d.id);
      cx.restore();
      miniBar(cx, p.x, p.y - 44 * S, d.hp / G.Delvers.maxHp(d), '#7fca6c');
    }
    var living = c.enemies.filter(function (e) { return e.hp > 0; });
    for (i = 0; i < living.length; i++) {
      var e = living[i];
      var q = F.combatPos('enemy', i);
      var bob2 = Math.sin(t * 2 + i * 1.7) * 4;
      drawShadow(cx, q.x, q.y + 26 * S, e.look.size * S);
      cx.save(); cx.translate(q.x, q.y + bob2); cx.scale(S, S);
      drawEnemy(cx, e, 0, 0, t, flashes['e' + e.uid] > F.t);
      cx.restore();
      miniBar(cx, q.x, q.y - (enemyTop(e.look) + 12) * S, e.hp / e.maxHp, '#e06a5a');
    }
  };

  /* approximate top of each enemy silhouette (pre-scale px above anchor) */
  function enemyTop(lk) {
    var s = lk.size;
    switch (lk.form) {
      case 'blob': return 8 + 14 * s;
      case 'tall': return 34 * s + 12;
      case 'winged': return 16 + 18 * s;
      case 'orb': return 12 + 12 * s;
      case 'mass': return 34 * s + 4;
      case 'warden': return 62 * s + 8;
      case 'hound': return 14 + 12 * s;
      case 'king': return 60 * s + 10;
      case 'librarian': return 58 * s + 10;
      default: return 40;
    }
  }

  function drawShadow(cx, x, y, size) {
    cx.save();
    cx.fillStyle = 'rgba(0,0,0,0.45)';
    cx.beginPath();
    cx.ellipse(x, y, 26 * (size || 1), 7 * (size || 1), 0, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }
  function miniBar(cx, x, y, frac, color) {
    frac = Math.max(0, Math.min(1, frac));
    cx.fillStyle = 'rgba(0,0,0,0.55)';
    cx.fillRect(x - 22, y, 44, 5);
    cx.fillStyle = color;
    cx.fillRect(x - 21, y + 1, 42 * frac, 3);
  }

  function drawDelver(cx, d, x, y, t, flash, active) {
    var cls = G.Delvers.cls(d);
    var hue = cls.hue;
    cx.save();
    if (active) F.glow(cx, x, y, 46, '#ffd98c', 0.35 + 0.15 * Math.sin(t * 4));
    // legs
    cx.strokeStyle = '#241a12'; cx.lineWidth = 5; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x - 6, y + 6); cx.lineTo(x - 7, y + 24); cx.moveTo(x + 6, y + 6); cx.lineTo(x + 7, y + 24); cx.stroke();
    // body
    cx.fillStyle = flash ? '#fff' : hsl(hue, 32, 34);
    F.rr(cx, x - 11, y - 18, 22, 28, 8);
    cx.fill();
    // head
    cx.fillStyle = flash ? '#fff' : '#d9b48f';
    cx.beginPath(); cx.arc(x, y - 26, 8, 0, Math.PI * 2); cx.fill();
    // class kit
    cx.strokeStyle = flash ? '#fff' : hsl(hue, 45, 60);
    cx.lineWidth = 2.5;
    if (d.cls === 'vanguard') {
      cx.fillStyle = flash ? '#fff' : hsl(hue, 30, 45);
      cx.beginPath(); cx.arc(x - 17, y - 4, 9, 0, Math.PI * 2); cx.fill(); // shield
      cx.strokeStyle = '#2b2b33';
      cx.beginPath(); cx.arc(x, y - 30, 8, Math.PI, 0); cx.stroke(); // helm
    } else if (d.cls === 'scout') {
      cx.fillStyle = flash ? '#fff' : hsl(hue, 28, 26);
      F.poly(cx, [[x - 9, y - 30], [x + 9, y - 30], [x, y - 40]]); cx.fill(); // hood
      cx.strokeStyle = '#cfd6dd';
      cx.beginPath(); cx.moveTo(x + 13, y - 6); cx.lineTo(x + 20, y - 14); cx.stroke(); // dagger
    } else if (d.cls === 'arcanist') {
      cx.fillStyle = flash ? '#fff' : hsl(hue, 36, 30);
      F.poly(cx, [[x - 11, y + 10], [x + 11, y + 10], [x + 7, y + 24], [x - 7, y + 24]]); cx.fill(); // robe skirt
      var ox = x + 17, oy = y - 16 + Math.sin(t * 3) * 3;
      F.glow(cx, ox, oy, 14, hsl(hue, 80, 65), 0.7);
      cx.fillStyle = hsl(hue, 80, 70);
      cx.beginPath(); cx.arc(ox, oy, 4, 0, Math.PI * 2); cx.fill(); // orb
    } else if (d.cls === 'alchemist') {
      // apron + a bubbling flask that fumes
      cx.fillStyle = flash ? '#fff' : hsl(hue, 22, 42);
      F.rr(cx, x - 8, y - 12, 16, 20, 4); cx.fill(); // apron
      var fx0 = x + 16, fy0 = y - 6 + Math.sin(t * 3.4) * 2;
      cx.fillStyle = flash ? '#fff' : hsl(hue, 60, 45);
      F.poly(cx, [[fx0 - 4, fy0 - 8], [fx0 + 4, fy0 - 8], [fx0 + 6, fy0 + 6], [fx0 - 6, fy0 + 6]]); cx.fill(); // flask
      F.glow(cx, fx0, fy0 + 2, 9, hsl(hue, 85, 60), 0.6);
      cx.fillStyle = flash ? '#fff' : hsl(hue, 70, 62);
      cx.beginPath(); cx.arc(fx0, fy0 + 1, 2.4, 0, Math.PI * 2); cx.fill(); // brew
    }
    cx.restore();
  }

  function drawEnemy(cx, e, x, y, t, flash) {
    var lk = e.look, hue = lk.hue, S = lk.size;
    cx.save();
    var body = flash ? '#fff' : hsl(hue, 35, 30);
    var lite = flash ? '#fff' : hsl(hue, 55, 55);
    switch (lk.form) {
      case 'blob': {
        cx.fillStyle = body;
        cx.beginPath();
        cx.ellipse(x, y + 8, 20 * S, 14 * S, 0, 0, Math.PI * 2);
        cx.fill();
        cx.fillStyle = lite;
        cx.beginPath(); cx.arc(x - 6 * S, y + 3, 2.4, 0, Math.PI * 2); cx.arc(x + 6 * S, y + 3, 2.4, 0, Math.PI * 2); cx.fill();
        // legs
        cx.strokeStyle = body; cx.lineWidth = 3;
        for (var l = -2; l <= 2; l++) {
          cx.beginPath(); cx.moveTo(x + l * 8 * S, y + 18); cx.lineTo(x + l * 9 * S, y + 26); cx.stroke();
        }
        break;
      }
      case 'tall': {
        cx.fillStyle = body;
        F.rr(cx, x - 12 * S, y - 34 * S, 24 * S, 56 * S, 10);
        cx.fill();
        cx.fillStyle = flash ? '#fff' : hsl(hue, 25, 18);
        cx.beginPath(); cx.arc(x, y - 34 * S, 10 * S, Math.PI, 0); cx.fill(); // hood
        cx.fillStyle = lite;
        cx.beginPath(); cx.arc(x - 4, y - 32 * S, 2, 0, Math.PI * 2); cx.arc(x + 4, y - 32 * S, 2, 0, Math.PI * 2); cx.fill();
        break;
      }
      case 'winged': {
        var flap = Math.sin(t * 9) * 10 * S;
        cx.fillStyle = flash ? '#fff' : hsl(hue, 60, 45, 0.85);
        F.poly(cx, [[x, y - 6], [x - 30 * S, y - 16 - flap], [x - 10 * S, y + 4]]); cx.fill();
        F.poly(cx, [[x, y - 6], [x + 30 * S, y - 16 - flap], [x + 10 * S, y + 4]]); cx.fill();
        F.glow(cx, x, y - 4, 18 * S, hsl(hue, 80, 60), 0.5);
        cx.fillStyle = body;
        cx.beginPath(); cx.ellipse(x, y - 4, 7 * S, 12 * S, 0, 0, Math.PI * 2); cx.fill();
        break;
      }
      case 'orb': {
        var pulse = 1 + Math.sin(t * 5) * 0.12;
        F.glow(cx, x, y - 10, 30 * S * pulse, hsl(hue, 90, 60), 0.8);
        cx.fillStyle = flash ? '#fff' : hsl(hue, 90, 65);
        cx.beginPath(); cx.arc(x, y - 10, 9 * S * pulse, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = flash ? '#eee' : hsl(hue + 30, 90, 80);
        cx.beginPath(); cx.arc(x, y - 10, 4 * S, 0, Math.PI * 2); cx.fill();
        break;
      }
      case 'mass': {
        cx.fillStyle = body;
        cx.beginPath();
        cx.moveTo(x - 30 * S, y + 24);
        cx.quadraticCurveTo(x - 34 * S, y - 20 * S, x - 8 * S, y - 24 * S);
        cx.quadraticCurveTo(x + 16 * S, y - 34 * S, x + 28 * S, y - 4 * S);
        cx.quadraticCurveTo(x + 36 * S, y + 22, x - 30 * S, y + 24);
        cx.fill();
        // teeth
        cx.fillStyle = flash ? '#fff' : '#e8e0c8';
        for (var th = 0; th < 5; th++) {
          var tx = x - 18 * S + th * 9 * S;
          F.poly(cx, [[tx, y + 6], [tx + 4 * S, y + 6], [tx + 2 * S, y + 14]]);
          cx.fill();
        }
        cx.fillStyle = lite;
        cx.beginPath(); cx.arc(x - 8 * S, y - 12 * S, 2.6, 0, Math.PI * 2); cx.arc(x + 6 * S, y - 12 * S, 2.6, 0, Math.PI * 2); cx.fill();
        break;
      }
      case 'warden': {
        // towering keeper with lantern-bell
        cx.fillStyle = body;
        F.rr(cx, x - 16 * S, y - 46 * S, 32 * S, 70 * S, 12);
        cx.fill();
        cx.fillStyle = flash ? '#fff' : hsl(hue, 20, 14);
        F.poly(cx, [[x - 16 * S, y - 46 * S], [x + 16 * S, y - 46 * S], [x, y - 62 * S]]);
        cx.fill();
        var lam = 0.6 + 0.3 * Math.sin(t * 2.5);
        F.glow(cx, x, y - 50 * S, 26 * S, 'rgba(150,200,255,0.9)', lam);
        cx.fillStyle = 'rgba(190,225,255,0.95)';
        cx.beginPath(); cx.arc(x, y - 50 * S, 5 * S, 0, Math.PI * 2); cx.fill();
        // bell in hand
        cx.strokeStyle = flash ? '#fff' : hsl(hue, 25, 40); cx.lineWidth = 3;
        cx.beginPath(); cx.moveTo(x + 16 * S, y - 20 * S); cx.lineTo(x + 26 * S, y - 6 * S); cx.stroke();
        cx.fillStyle = flash ? '#fff' : '#b8a26a';
        F.poly(cx, [[x + 22 * S, y - 6 * S], [x + 32 * S, y - 6 * S], [x + 30 * S, y + 4 * S], [x + 24 * S, y + 4 * S]]);
        cx.fill();
        break;
      }
      case 'hound': {
        // low, quadruped ember-beast with a smoldering back
        cx.fillStyle = body;
        cx.beginPath();
        cx.ellipse(x, y + 4, 22 * S, 11 * S, 0, 0, Math.PI * 2); cx.fill(); // body
        F.poly(cx, [[x + 16 * S, y - 4], [x + 30 * S, y - 8 * S], [x + 26 * S, y + 6]]); cx.fill(); // head
        cx.strokeStyle = body; cx.lineWidth = 3;
        for (var hl = -1; hl <= 1; hl += 2) {
          cx.beginPath(); cx.moveTo(x + hl * 12 * S, y + 12); cx.lineTo(x + hl * 12 * S, y + 24); cx.stroke();
          cx.beginPath(); cx.moveTo(x + hl * 4 * S, y + 12); cx.lineTo(x + hl * 4 * S, y + 24); cx.stroke();
        }
        // ember mane
        F.glow(cx, x - 6 * S, y - 4, 16 * S, hsl(hue, 90, 55), 0.5 + 0.2 * Math.sin(t * 6));
        cx.fillStyle = lite;
        cx.beginPath(); cx.arc(x + 26 * S, y - 3, 2, 0, Math.PI * 2); cx.fill(); // eye
        break;
      }
      case 'king': {
        // seated furnace-king with a broken crown of sparks
        cx.fillStyle = flash ? '#fff' : hsl(hue, 30, 22);
        F.rr(cx, x - 20 * S, y - 24 * S, 40 * S, 48 * S, 10); cx.fill(); // throne-fused body
        cx.fillStyle = body;
        F.rr(cx, x - 14 * S, y - 40 * S, 28 * S, 26 * S, 8); cx.fill(); // torso
        cx.fillStyle = flash ? '#fff' : hsl(hue, 20, 16);
        cx.beginPath(); cx.arc(x, y - 44 * S, 10 * S, 0, Math.PI * 2); cx.fill(); // head
        // molten core
        var pulse = 0.6 + 0.35 * Math.sin(t * 3);
        F.glow(cx, x, y - 8 * S, 30 * S, hsl(hue, 95, 55), pulse);
        cx.fillStyle = hsl(hue, 95, 62);
        cx.beginPath(); cx.arc(x, y - 8 * S, 6 * S, 0, Math.PI * 2); cx.fill();
        // crown of sparks
        cx.strokeStyle = flash ? '#fff' : '#ffcf6a'; cx.lineWidth = 2;
        for (var cr = -2; cr <= 2; cr++) {
          var cxk = x + cr * 6 * S;
          cx.beginPath(); cx.moveTo(cxk, y - 52 * S); cx.lineTo(cxk, y - 60 * S - (cr % 2 ? 4 : 0)); cx.stroke();
        }
        cx.fillStyle = lite;
        cx.beginPath(); cx.arc(x - 3.5 * S, y - 45 * S, 1.8, 0, Math.PI * 2); cx.arc(x + 3.5 * S, y - 45 * S, 1.8, 0, Math.PI * 2); cx.fill();
        break;
      }
      case 'librarian': {
        // a robed keeper of drowned books, ink dripping, a lantern-eye
        cx.fillStyle = flash ? '#fff' : hsl(hue, 30, 22);
        F.poly(cx, [[x - 22 * S, y + 24], [x - 14 * S, y - 44 * S], [x + 14 * S, y - 44 * S], [x + 22 * S, y + 24]]); cx.fill(); // robe
        cx.fillStyle = flash ? '#fff' : hsl(hue, 20, 14);
        cx.beginPath(); cx.arc(x, y - 46 * S, 11 * S, 0, Math.PI * 2); cx.fill(); // cowl
        // single lantern eye
        var lp = 0.6 + 0.3 * Math.sin(t * 2);
        F.glow(cx, x, y - 46 * S, 16 * S, hsl(hue, 85, 60), lp);
        cx.fillStyle = hsl(hue, 85, 70);
        cx.beginPath(); cx.arc(x, y - 46 * S, 4 * S, 0, Math.PI * 2); cx.fill();
        // floating pages
        cx.fillStyle = flash ? '#fff' : 'rgba(200,220,215,0.85)';
        for (var pg = 0; pg < 5; pg++) {
          var ang = t * 0.8 + pg * 1.257;
          var px = x + Math.cos(ang) * (20 + pg * 3) * S, py = y - 20 * S + Math.sin(ang) * 14 * S;
          cx.save(); cx.translate(px, py); cx.rotate(ang);
          cx.fillRect(-3 * S, -4 * S, 6 * S, 8 * S);
          cx.restore();
        }
        // ink drip
        cx.strokeStyle = hsl(hue, 40, 30); cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(x - 6 * S, y + 6); cx.lineTo(x - 6 * S, y + 18 + Math.sin(t * 3) * 3); cx.stroke();
        break;
      }
    }
    cx.restore();
  }

  /* ---------- fx event hookup ---------- */
  G.on('fx', function (fx) {
    var ex = G.state && G.state.expedition;
    if (!ex || !ex.combat) return;
    var team = G.Exp.team();
    var living = ex.combat.enemies.filter(function (e) { return e.hp > 0; });
    function delverPos(id) {
      for (var i = 0; i < team.length; i++) if (team[i].id === id) return F.combatPos('delver', i);
      return F.combatPos('delver', 0);
    }
    function enemyPos(uid) {
      for (var i = 0; i < living.length; i++) if (living[i].uid === uid) return F.combatPos('enemy', i);
      return F.combatPos('enemy', 0);
    }
    var p;
    switch (fx.t) {
      case 'hit':
        if (fx.side === 'enemy') {
          p = enemyPos(fx.uid);
          flashes['e' + fx.uid] = F.t + 0.18;
          F.burst(p.x, p.y - 10, fx.crit ? '#ffd98c' : '#e06a5a', fx.crit ? 18 : 9, fx.crit ? 190 : 130);
          F.floater(p.x, p.y - 50, String(fx.amt), fx.crit ? '#ffd98c' : '#fff', fx.crit);
          if (fx.crit) F.shake(7, 0.22);
        } else {
          p = delverPos(fx.who);
          flashes['d' + fx.who] = F.t + 0.18;
          F.burst(p.x, p.y - 10, '#c94f42', 9, 120);
          F.floater(p.x, p.y - 50, String(fx.amt), '#ff9d8a', fx.crit);
          F.shake(fx.crit ? 8 : 4, 0.2);
        }
        break;
      case 'heal':
        p = delverPos(fx.who);
        F.burst(p.x, p.y - 20, '#7fca6c', 10, 70);
        F.floater(p.x, p.y - 52, '+' + fx.amt, '#9be08a');
        break;
      case 'guard':
        p = delverPos(fx.who);
        F.floater(p.x, p.y - 52, '◈', '#9db4d6');
        break;
      case 'death':
        p = enemyPos(fx.uid);
        F.burst(p.x, p.y - 8, '#c9a468', 26, 210);
        F.shake(5, 0.2);
        break;
      case 'delverDeath':
        p = delverPos(fx.who);
        F.burst(p.x, p.y - 8, '#8a2d22', 30, 230);
        F.floater(p.x, p.y - 60, '✝', '#e8e0c8', true);
        F.shake(12, 0.45);
        break;
      case 'brink':
        p = delverPos(fx.who);
        F.burst(p.x, p.y - 20, '#ffe9b0', 22, 160);
        F.floater(p.x, p.y - 60, 'BRINK!', '#ffe9b0', true);
        break;
      case 'summon':
        F.shake(6, 0.3);
        break;
      case 'windup':
        p = enemyPos(fx.uid);
        F.floater(p.x, p.y - 56, '…', '#e8e0c8');
        break;
    }
  });
})();
