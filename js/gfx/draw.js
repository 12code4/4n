/* Canvas plumbing: resize, palette, paint helpers, particles, shake, floaters. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var F = (G.GFX = {});

  F.scene = 'town';
  F.parts = [];      // particles
  F.floaters = [];   // rising combat text
  F.shakeT = 0; F.shakeMag = 0;
  F.t = 0;

  F.init = function () {
    F.cv = document.getElementById('scene');
    F.cx = F.cv.getContext('2d');
    F.resize();
    window.addEventListener('resize', F.resize);
  };
  F.resize = function () {
    if (!F.cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    F.W = window.innerWidth; F.H = window.innerHeight;
    F.cv.width = F.W * dpr; F.cv.height = F.H * dpr;
    F.cv.style.width = F.W + 'px'; F.cv.style.height = F.H + 'px';
    F.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  F.shake = function (mag, dur) {
    F.shakeMag = Math.max(F.shakeMag, mag);
    F.shakeT = Math.max(F.shakeT, dur);
  };

  /* ---------- paint helpers ---------- */
  F.rr = function (cx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.arcTo(x + w, y, x + w, y + h, r);
    cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r);
    cx.arcTo(x, y, x + w, y, r);
    cx.closePath();
  };
  F.glow = function (cx, x, y, r, color, a) {
    var g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.save();
    cx.globalAlpha = a === undefined ? 0.5 : a;
    cx.fillStyle = g;
    cx.fillRect(x - r, y - r, r * 2, r * 2);
    cx.restore();
  };
  F.poly = function (cx, pts, close) {
    cx.beginPath();
    cx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) cx.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) cx.closePath();
  };
  F.hsl = function (h, s, l, a) {
    return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')';
  };

  /* ---------- particles ---------- */
  F.spawn = function (p) {
    // {x,y,vx,vy,life,size,color,grav,fade,glow}
    p.age = 0;
    F.parts.push(p);
    if (F.parts.length > 400) F.parts.splice(0, F.parts.length - 400);
  };
  F.burst = function (x, y, color, n, speed) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var v = (0.3 + Math.random() * 0.7) * (speed || 120);
      F.spawn({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 3, color: color, grav: 260, fade: true });
    }
  };
  F.floater = function (x, y, text, color, big) {
    F.floaters.push({ x: x, y: y, text: text, color: color || '#fff', age: 0, life: 1.1, big: big });
  };

  F.stepFx = function (dt) {
    var i;
    for (i = F.parts.length - 1; i >= 0; i--) {
      var p = F.parts[i];
      p.age += dt;
      if (p.age >= p.life) { F.parts.splice(i, 1); continue; }
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (i = F.floaters.length - 1; i >= 0; i--) {
      var f = F.floaters[i];
      f.age += dt;
      f.y -= 42 * dt;
      if (f.age >= f.life) F.floaters.splice(i, 1);
    }
    if (F.shakeT > 0) { F.shakeT -= dt; if (F.shakeT <= 0) F.shakeMag = 0; }
  };

  F.drawFx = function (cx) {
    var i;
    for (i = 0; i < F.parts.length; i++) {
      var p = F.parts[i];
      var a = p.fade ? 1 - p.age / p.life : 1;
      cx.save();
      cx.globalAlpha = Math.max(0, a);
      if (p.glow) F.glow(cx, p.x, p.y, p.size * 4, p.color, a * 0.6);
      cx.fillStyle = p.color;
      cx.beginPath();
      cx.arc(p.x, p.y, p.size * (p.shrink ? a : 1), 0, Math.PI * 2);
      cx.fill();
      cx.restore();
    }
    for (i = 0; i < F.floaters.length; i++) {
      var f = F.floaters[i];
      var fa = 1 - f.age / f.life;
      cx.save();
      cx.globalAlpha = Math.max(0, fa);
      cx.font = (f.big ? '700 26px' : '700 17px') + ' Georgia, serif';
      cx.textAlign = 'center';
      cx.lineWidth = 3;
      cx.strokeStyle = 'rgba(0,0,0,0.7)';
      cx.strokeText(f.text, f.x, f.y);
      cx.fillStyle = f.color;
      cx.fillText(f.text, f.x, f.y);
      cx.restore();
    }
  };

  /* ---------- master render ---------- */
  F.render = function (dt) {
    if (!F.cx) return;
    F.t += dt;
    F.stepFx(dt);
    var cx = F.cx;
    cx.save();
    if (F.shakeMag > 0) {
      cx.translate((Math.random() - 0.5) * F.shakeMag, (Math.random() - 0.5) * F.shakeMag);
    }
    var painter = F.scenes[F.scene] || F.scenes.town;
    painter(cx, F.W, F.H, F.t);
    F.drawFx(cx);
    cx.restore();
  };
  F.scenes = {};
})();
