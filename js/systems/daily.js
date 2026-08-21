/* v5.0 — Daily Descent: a seeded challenge run. Everyone gets the same Maw for
 * the day; you have a fixed number of days to build the highest score. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var Da = (G.Daily = {});
  Da.DAYS = 14;
  Da.BEST_KEY = 'gilded_maw_daily_best';

  Da.todaySeed = function () {
    if (typeof Date === 'undefined') return 20260101;
    var d = new Date();
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  };
  Da.dateLabel = function (seed) {
    seed = seed || Da.todaySeed();
    var y = Math.floor(seed / 10000), m = Math.floor((seed % 10000) / 100), d = seed % 100;
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  };

  Da.active = function () { return !!(G.state && G.state.daily); };
  Da.daysLeft = function () {
    if (!Da.active()) return 0;
    return Math.max(0, G.state.daily.day0 + Da.DAYS - G.state.day);
  };

  Da.start = function (seed) {
    seed = seed || Da.todaySeed();
    G.wipeSaveDaily();
    G.newGame(seed);
    var st = G.state;
    // a fixed, generous starting hand so the run is about play, not luck of setup
    st.marks = 120;
    st.buildings.tavern = 1;
    st.legacy = { marks: 0, perks: [] }; // dailies ignore your persistent legacy
    st.daily = { seed: seed, date: Da.dateLabel(seed), day0: st.day, days: Da.DAYS, finalized: false };
    // a fixed founding party of three, seeded
    while (G.Delvers.roster().length < 3) G.Delvers.addToRoster(G.Delvers.generate(2));
    st.supplies = { torches: 12, rations: 10, bandages: 4 };
    G.Delvers.refreshPool(true);
    G.log('Daily Descent ' + st.daily.date + ' begins. ' + Da.DAYS + ' days to make your mark.', 'story');
    G.save();
    return st;
  };

  Da.score = function () {
    var st = G.state;
    if (!st) return 0;
    var s = st.marks;
    for (var id in st.inventory) s += (G.Economy ? G.Economy.price(id) : (G.DATA.materials[id].base)) * st.inventory[id];
    s += (st.stats.deepest || 0) * 80;
    s += (st.renown || 0) * 2;
    if (st.relics) s += st.relics.owned.length * 60;
    return Math.round(s);
  };

  Da.finalize = function () {
    var st = G.state;
    if (!st.daily || st.daily.finalized) return;
    st.daily.finalized = true;
    var score = Da.score();
    var best = Da.best(st.daily.seed);
    if (score > best.score) { Da.saveBest(st.daily.seed, score); best.score = score; }
    st.daily.finalScore = score;
    G.log('The Daily Descent ends. Score: ' + score + (score >= best.score ? ' — a new best!' : ' (best ' + best.score + ')'), 'story');
    G.emit('dailyEnd', { score: score, best: best.score });
  };

  /* per-seed best in localStorage */
  Da.allBest = function () {
    try { if (typeof localStorage === 'undefined') return {}; var s = localStorage.getItem(Da.BEST_KEY); return s ? JSON.parse(s) : {}; }
    catch (e) { return {}; }
  };
  Da.best = function (seed) { var a = Da.allBest(); return { score: (a[seed] && a[seed].score) || 0 }; };
  Da.saveBest = function (seed, score) {
    try { var a = Da.allBest(); a[seed] = { score: score, date: Da.dateLabel(seed) }; if (typeof localStorage !== 'undefined') localStorage.setItem(Da.BEST_KEY, JSON.stringify(a)); } catch (e) {}
  };

  /* called from the day tick to auto-finalize when the clock runs out */
  Da.checkEnd = function () {
    if (Da.active() && !G.state.daily.finalized && Da.daysLeft() <= 0) Da.finalize();
  };
})();

/* dailies use the normal save slot but we keep a distinct wipe so a daily
 * doesn't clobber a career save on start (career save is restored on exit). */
(function () {
  var G = globalThis.G;
  G.wipeSaveDaily = function () {
    // stash the career save so leaving the daily can restore it
    try {
      if (typeof localStorage === 'undefined') return;
      var cur = localStorage.getItem(G.SAVE_KEY);
      if (cur) {
        var payload = JSON.parse(cur);
        if (payload && payload.state && !payload.state.daily) localStorage.setItem('gilded_maw_career_stash', cur);
      }
    } catch (e) {}
  };
  G.restoreCareer = function () {
    try {
      if (typeof localStorage === 'undefined') return false;
      var s = localStorage.getItem('gilded_maw_career_stash');
      if (!s) return false;
      localStorage.setItem(G.SAVE_KEY, s);
      G.deserialize(s);
      return true;
    } catch (e) { return false; }
  };
})();
