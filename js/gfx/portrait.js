/* v3.0 — Procedural delver portraits, drawn from d.face seed onto a small
 * canvas. Cached per (seed,size). Used on delver cards. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var P = (G.Portrait = {});
  var cache = {};

  var SKINS = ['#e8c9a6', '#d9b48f', '#c99b76', '#a97c56', '#8a5e3c', '#f0d9bf'];
  var HAIRS = ['#2b2018', '#4a3320', '#6b4a2a', '#8a8a8a', '#c9c9c9', '#3a1c14', '#101010', '#7a5a33'];

  function rngFromSeed(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* returns a canvas element with the portrait */
  P.get = function (d, size) {
    size = size || 44;
    var key = (d.face >>> 0) + '_' + d.cls + '_' + size;
    if (cache[key]) return cache[key];
    var cv = document.createElement('canvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr; cv.height = size * dpr;
    cv.style.width = size + 'px'; cv.style.height = size + 'px';
    var cx = cv.getContext('2d');
    cx.scale(dpr, dpr);
    P.paint(cx, d, size);
    cache[key] = cv;
    return cv;
  };

  P.paint = function (cx, d, S) {
    var r = rngFromSeed((d.face >>> 0) ^ 0x9e3779b9);
    var cls = G.DATA.classes[d.cls];
    var hue = cls ? cls.hue : 40;
    var cxm = S / 2;

    // background disc tinted by class
    cx.fillStyle = 'hsl(' + hue + ',30%,16%)';
    cx.beginPath(); cx.arc(cxm, cxm, S / 2, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = 'hsla(' + hue + ',60%,55%,0.15)';
    cx.beginPath(); cx.arc(cxm, S * 0.78, S * 0.5, 0, Math.PI * 2); cx.fill();

    var skin = SKINS[Math.floor(r() * SKINS.length)];
    var hair = HAIRS[Math.floor(r() * HAIRS.length)];

    // shoulders
    cx.fillStyle = 'hsl(' + hue + ',32%,34%)';
    cx.beginPath(); cx.arc(cxm, S * 0.98, S * 0.36, Math.PI, 0); cx.fill();

    // neck + head
    cx.fillStyle = skin;
    cx.fillRect(cxm - S * 0.08, S * 0.55, S * 0.16, S * 0.16);
    cx.beginPath(); cx.arc(cxm, S * 0.46, S * 0.2, 0, Math.PI * 2); cx.fill();

    // hair variants
    var hairStyle = Math.floor(r() * 4);
    cx.fillStyle = hair;
    if (hairStyle === 0) { // full cap
      cx.beginPath(); cx.arc(cxm, S * 0.42, S * 0.22, Math.PI, 0); cx.fill();
      cx.fillRect(cxm - S * 0.22, S * 0.4, S * 0.06, S * 0.14);
      cx.fillRect(cxm + S * 0.16, S * 0.4, S * 0.06, S * 0.14);
    } else if (hairStyle === 1) { // topknot
      cx.beginPath(); cx.arc(cxm, S * 0.4, S * 0.2, Math.PI, 0); cx.fill();
      cx.beginPath(); cx.arc(cxm, S * 0.26, S * 0.06, 0, Math.PI * 2); cx.fill();
    } else if (hairStyle === 2) { // bald-ish / receding
      cx.beginPath(); cx.arc(cxm, S * 0.4, S * 0.2, Math.PI * 1.15, Math.PI * 1.85); cx.fill();
    } else { // side-swept
      cx.beginPath(); cx.arc(cxm, S * 0.42, S * 0.22, Math.PI, Math.PI * 1.7); cx.fill();
    }

    // eyes
    cx.fillStyle = '#1c1712';
    var eo = S * 0.075;
    cx.beginPath(); cx.arc(cxm - eo, S * 0.46, S * 0.022, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(cxm + eo, S * 0.46, S * 0.022, 0, Math.PI * 2); cx.fill();

    // brow / expression tilt
    cx.strokeStyle = hair; cx.lineWidth = S * 0.02;
    cx.beginPath(); cx.moveTo(cxm - eo - S * 0.03, S * 0.42); cx.lineTo(cxm - eo + S * 0.03, S * 0.425); cx.stroke();
    cx.beginPath(); cx.moveTo(cxm + eo - S * 0.03, S * 0.425); cx.lineTo(cxm + eo + S * 0.03, S * 0.42); cx.stroke();

    // some get a scar or beard
    if (r() < 0.28) { // scar
      cx.strokeStyle = 'rgba(150,60,50,0.8)'; cx.lineWidth = S * 0.02;
      cx.beginPath(); cx.moveTo(cxm + eo + S * 0.02, S * 0.4); cx.lineTo(cxm + eo + S * 0.05, S * 0.52); cx.stroke();
    }
    if (r() < 0.3) { // beard
      cx.fillStyle = hair;
      cx.beginPath(); cx.arc(cxm, S * 0.54, S * 0.15, 0.15, Math.PI - 0.15); cx.fill();
    }

    // class emblem dot
    cx.fillStyle = 'hsl(' + hue + ',70%,60%)';
    cx.beginPath(); cx.arc(S * 0.85, S * 0.85, S * 0.06, 0, Math.PI * 2); cx.fill();
  };
})();
