/* v4.0 — The Maw's moods: the one weather that governs market and dungeon. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var M = (G.Moods = {});

  M.current = function () {
    var st = G.state;
    if (!st.mood) return G.DATA.moods[0];
    return G.DATA.moodById(st.mood.id);
  };
  M.fx = function (key, base) {
    var f = M.current().fx;
    return f[key] === undefined ? base : f[key];
  };

  M.roll = function () {
    var st = G.state;
    var prev = st.mood ? st.mood.id : null;
    var pool = G.DATA.moods.filter(function (m) { return m.id !== prev; });
    var m = G.rweighted(pool, function (x) { return x.w; });
    st.mood = { id: m.id, until: st.day + G.rint(2, 5) };
    G.log('The Maw’s mood shifts: ' + m.name + '. ' + m.blurb, 'story');
    G.emit('mood', m);
  };

  M.tick = function () {
    var st = G.state;
    if (!st.mood || st.day >= st.mood.until) M.roll();
  };

  /* Forecast available with Charter Hall L2, the Weather-Eye legacy perk, or
   * the Dreaming mood (which shows its own omens). Returns next-mood hint or null. */
  M.canForecast = function () {
    return G.bld('charterhall') >= 2 || (G.state.legacy && G.state.legacy.perks && G.state.legacy.perks.indexOf('weather_eye') >= 0 && legacyFx('moodForecast'));
  };
  function legacyFx(k) { return G.Prestige ? G.Prestige.fx(k) : false; }

  M.daysLeft = function () {
    var st = G.state;
    return st.mood ? Math.max(0, st.mood.until - st.day) : 0;
  };
})();
