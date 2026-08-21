/* The Gilded Maw — core: namespace, utilities, seeded RNG, event bus, save. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.VERSION = '6.0.0';
  G.SAVE_KEY = 'gilded_maw_save';
  G.SAVE_VER = 6;

  /* ---------- utilities ---------- */
  var U = (G.U = {});
  U.clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.fmt = function (n) {
    n = Math.round(n);
    if (Math.abs(n) >= 100000) return (n / 1000).toFixed(0) + 'k';
    if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };
  U.cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  U.deep = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.uid = (function () { var n = 0; return function (p) { return (p || 'id') + '_' + (++n) + '_' + Date.now().toString(36); }; })();
  U.byId = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; };
  U.sum = function (arr, f) { var s = 0; for (var i = 0; i < arr.length; i++) s += f ? f(arr[i]) : arr[i]; return s; };
  U.plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };

  /* ---------- seeded RNG (mulberry32) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function RNG(seed) { this.s = seed >>> 0; this.f = mulberry32(this.s); }
  RNG.prototype.next = function () { this.s = (this.s + 0x6D2B79F5) | 0; return this.f(); };
  RNG.prototype.f01 = function () { return this.next(); };
  RNG.prototype.int = function (lo, hi) { return lo + Math.floor(this.next() * (hi - lo + 1)); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(this.next() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  // weighted pick from [{w:number, ...}] or map of key->weight
  RNG.prototype.weighted = function (items, wf) {
    var tot = 0, i;
    for (i = 0; i < items.length; i++) tot += (wf ? wf(items[i]) : items[i].w) || 0;
    var r = this.next() * tot;
    for (i = 0; i < items.length; i++) {
      r -= (wf ? wf(items[i]) : items[i].w) || 0;
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  G.RNG = RNG;
  G.makeRng = function (seed) { return new RNG(seed); };
  // main game rng lives in state so it saves/loads deterministically
  G.rng = function () {
    var st = G.state;
    if (!st._rng || st._rng.s !== st.rngS) { st._rng = new RNG(st.rngS); }
    var r = st._rng; var v = r.next(); st.rngS = r.s;
    return v;
  };
  G.rint = function (lo, hi) { return lo + Math.floor(G.rng() * (hi - lo + 1)); };
  G.rpick = function (arr) { return arr[Math.floor(G.rng() * arr.length)]; };
  G.rchance = function (p) { return G.rng() < p; };
  G.rweighted = function (items, wf) {
    var tot = 0, i;
    for (i = 0; i < items.length; i++) tot += (wf ? wf(items[i]) : items[i].w) || 0;
    var r = G.rng() * tot;
    for (i = 0; i < items.length; i++) { r -= (wf ? wf(items[i]) : items[i].w) || 0; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  G.rshuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(G.rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  /* ---------- event bus ---------- */
  var subs = {};
  G.on = function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); };
  G.emit = function (ev, data) {
    var l = subs[ev]; if (l) for (var i = 0; i < l.length; i++) l[i](data);
    var all = subs['*']; if (all) for (var j = 0; j < all.length; j++) all[j](ev, data);
  };

  /* ---------- message log ---------- */
  G.log = function (msg, kind) {
    var st = G.state; if (!st) return;
    st.log.push({ d: st.day, m: msg, k: kind || 'info' });
    if (st.log.length > 120) st.log.splice(0, st.log.length - 120);
    G.emit('log', { m: msg, k: kind });
  };

  /* ---------- save / load ---------- */
  G.serialize = function () {
    var st = G.state, rng = st._rng;
    st._rng = null;
    var s = JSON.stringify({ sv: G.SAVE_VER, gv: G.VERSION, state: st });
    st._rng = rng;
    return s;
  };
  G.migrate = function (payload) {
    // Chain of migrations keyed by the save-version they upgrade FROM.
    var st = payload.state, sv = payload.sv || 1;
    var chain = G.migrations || {};
    while (sv < G.SAVE_VER) {
      if (chain[sv]) st = chain[sv](st) || st;
      sv++;
    }
    return st;
  };
  G.migrations = {}; // patches register: G.migrations[1] = function(st){...}
  G.deserialize = function (str) {
    var payload = JSON.parse(str);
    if (!payload || !payload.state) throw new Error('bad save');
    var st = G.migrate(payload);
    st._rng = null;
    G.state = st;
    return st;
  };
  G.save = function () {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(G.SAVE_KEY, G.serialize());
    } catch (e) { /* storage unavailable (private mode etc.) — play on */ }
  };
  G.loadSaved = function () {
    try {
      if (typeof localStorage === 'undefined') return false;
      var s = localStorage.getItem(G.SAVE_KEY);
      if (!s) return false;
      G.deserialize(s);
      return true;
    } catch (e) { return false; }
  };
  G.wipeSave = function () {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(G.SAVE_KEY); } catch (e) {}
  };
  G.exportSave = function () {
    // base64 of utf-8 json
    var s = G.serialize();
    if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(s)));
    return Buffer.from(s, 'utf8').toString('base64');
  };
  G.importSave = function (b64) {
    var s;
    if (typeof atob !== 'undefined') s = decodeURIComponent(escape(atob(b64.trim())));
    else s = Buffer.from(b64.trim(), 'base64').toString('utf8');
    G.deserialize(s);
  };
})();
