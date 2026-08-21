/* v5.0 — WebAudio soundscape. Everything synthesized; no audio files.
 * Biome drones, UI ticks, combat impacts, coin counts, and Maren's music-box
 * motif for journal pages. Guarded so it's inert under node/tests. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var A = (G.Audio = {});
  A.on = true; A.vol = 0.6; A._ctx = null; A._master = null; A._drone = null; A._droneBiome = null;

  A.available = function () { return typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); };

  A.init = function () {
    if (!A.available() || A._ctx) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      A._ctx = new Ctx();
      A._master = A._ctx.createGain();
      A._master.gain.value = A.on ? A.vol : 0;
      A._master.connect(A._ctx.destination);
      // load persisted prefs
      try {
        var s = localStorage.getItem('gilded_maw_audio');
        if (s) { var p = JSON.parse(s); A.on = p.on !== false; A.vol = typeof p.vol === 'number' ? p.vol : 0.6; A._master.gain.value = A.on ? A.vol : 0; }
      } catch (e) {}
    } catch (e) { A._ctx = null; }
  };
  A.resume = function () { if (A._ctx && A._ctx.state === 'suspended') A._ctx.resume(); };
  A.savePrefs = function () { try { localStorage.setItem('gilded_maw_audio', JSON.stringify({ on: A.on, vol: A.vol })); } catch (e) {} };
  A.setOn = function (v) { A.on = v; if (A._master) A._master.gain.setTargetAtTime(v ? A.vol : 0, A._ctx.currentTime, 0.05); A.savePrefs(); };
  A.setVol = function (v) { A.vol = v; if (A._master && A.on) A._master.gain.setTargetAtTime(v, A._ctx.currentTime, 0.05); A.savePrefs(); };

  function now() { return A._ctx.currentTime; }

  /* one-shot tone */
  A.tone = function (freq, dur, type, gain, glideTo) {
    if (!A._ctx || !A.on) return;
    var t = now();
    var o = A._ctx.createOscillator(); var g = A._ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime((gain || 0.2), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(A._master);
    o.start(t); o.stop(t + dur + 0.02);
  };
  /* filtered noise burst (thuds, impacts) */
  A.noise = function (dur, gain, freq, q) {
    if (!A._ctx || !A.on) return;
    var t = now();
    var n = Math.floor(A._ctx.sampleRate * dur);
    var buf = A._ctx.createBuffer(1, n, A._ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = A._ctx.createBufferSource(); src.buffer = buf;
    var bp = A._ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq || 400; bp.Q.value = q || 1;
    var g = A._ctx.createGain(); g.gain.value = gain || 0.2;
    src.connect(bp); bp.connect(g); g.connect(A._master);
    src.start(t);
  };

  /* biome drone: a low pad tuned to the biome hue */
  A.setDrone = function (biomeId) {
    if (!A._ctx || A._droneBiome === biomeId) return;
    A._droneBiome = biomeId;
    if (A._drone) { try { A._drone.stop(); } catch (e) {} A._drone = null; }
    if (!biomeId || !A.on) return;
    var freqs = { gullet: 65, emberdeep: 55, archive: 73, veins: 49, heart: 82, town: 98 };
    var base = freqs[biomeId] || 65;
    var t = now();
    var o1 = A._ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = base;
    var o2 = A._ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = base * 1.5;
    var lfo = A._ctx.createOscillator(); lfo.frequency.value = 0.15;
    var lfoG = A._ctx.createGain(); lfoG.gain.value = base * 0.01;
    lfo.connect(lfoG); lfoG.connect(o1.frequency);
    var g = A._ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.06, t, 1.5);
    o1.connect(g); o2.connect(g); g.connect(A._master);
    o1.start(t); o2.start(t); lfo.start(t);
    A._drone = { stop: function () { g.gain.setTargetAtTime(0, now(), 0.4); o1.stop(now() + 1); o2.stop(now() + 1); lfo.stop(now() + 1); } };
  };

  /* Maren's music-box motif — nine notes, played on journal pages */
  A.motif = function () {
    if (!A._ctx || !A.on) return;
    var notes = [523.25, 659.25, 783.99, 659.25, 587.33, 493.88, 523.25, 440.00, 523.25];
    var t = now();
    notes.forEach(function (f, i) {
      var o = A._ctx.createOscillator(); var g = A._ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      var st0 = t + i * 0.26;
      g.gain.setValueAtTime(0, st0);
      g.gain.linearRampToValueAtTime(0.14, st0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, st0 + 0.4);
      o.connect(g); g.connect(A._master);
      o.start(st0); o.stop(st0 + 0.42);
    });
  };

  /* ---------- event hookups ---------- */
  if (typeof window !== 'undefined') {
    G.on('fx', function (fx) {
      if (!A._ctx || !A.on) return;
      if (fx.t === 'hit') { A.noise(0.12, fx.crit ? 0.32 : 0.18, fx.side === 'enemy' ? 320 : 220, 1.2); if (fx.crit) A.tone(180, 0.18, 'sawtooth', 0.12, 90); }
      else if (fx.t === 'death') { A.noise(0.3, 0.28, 180, 0.7); A.tone(120, 0.4, 'sine', 0.14, 50); }
      else if (fx.t === 'delverDeath') { A.tone(200, 1.1, 'sine', 0.2, 70); A.noise(0.5, 0.2, 140, 0.6); }
      else if (fx.t === 'heal') A.tone(660, 0.25, 'sine', 0.1, 880);
      else if (fx.t === 'brink') A.tone(440, 0.5, 'triangle', 0.16, 660);
      else if (fx.t === 'status' && fx.kind === 'burn') A.noise(0.2, 0.12, 900, 2);
    });
    G.on('journal', function () { A.motif(); });
    G.on('log', function (d) { if (d.k === 'loot') A.tone(880, 0.09, 'square', 0.07, 1100); });
    G.on('combatStart', function () { A.tone(140, 0.3, 'sawtooth', 0.14, 90); });
    G.on('mood', function () { A.tone(330, 0.6, 'sine', 0.1); });
  }

  /* click-to-tick for UI buttons (wired from main.js) */
  A.tick = function () { A.tone(1200, 0.04, 'square', 0.04); };
})();
