/* v4.0 — Companion beasts: the Menagerie, rescue, and expedition companions. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var B = (G.Beasts = {});

  B.capacity = function () { return G.bldFx('menagerie', 'capacity', 0); };
  B.owned = function () { return (G.state.beasts && G.state.beasts.owned) || []; };
  B.has = function (id) { return B.owned().indexOf(id) >= 0; };

  B.rescue = function (id) {
    var st = G.state;
    if (!st.beasts) st.beasts = { owned: [], active: null };
    if (!G.DATA.beasts[id]) return false;
    if (B.has(id)) { G.log('The Menagerie already keeps a ' + G.DATA.beasts[id].name + '. This one is set loose.', 'info'); return false; }
    if (!G.bld('menagerie')) { G.log('You’ve nowhere to keep a ' + G.DATA.beasts[id].name + ' — build the Menagerie first. It slips away.', 'bad'); return false; }
    if (B.owned().length >= B.capacity()) { G.log('The Menagerie is full. The ' + G.DATA.beasts[id].name + ' is set loose.', 'bad'); return false; }
    st.beasts.owned.push(id);
    G.log('A ' + G.DATA.beasts[id].name + ' is brought home to the Menagerie.', 'good');
    G.emit('beasts');
    return true;
  };
  B.release = function (id) {
    var st = G.state;
    st.beasts.owned = B.owned().filter(function (x) { return x !== id; });
    if (st.beasts.active === id) st.beasts.active = null;
    G.emit('beasts');
  };

  /* choose which beast rides along on the next expedition (null = none) */
  B.setActive = function (id) {
    var st = G.state;
    if (id && !B.has(id)) return;
    st.beasts.active = id;
    G.emit('beasts');
  };
  B.activeDef = function () {
    var ex = G.state.expedition;
    if (ex) return ex.beast ? G.DATA.beasts[ex.beast] : null; // locked for the run
    var st = G.state;
    return (st.beasts && st.beasts.active) ? G.DATA.beasts[st.beasts.active] : null;
  };

  /* passive accessor for the beast currently on the run */
  B.passive = function (key, base) {
    var ex = G.state.expedition;
    var def = ex && ex.beast ? G.DATA.beasts[ex.beast] : null;
    if (!def || !def.passive || def.passive[key] === undefined) return base;
    return def.passive[key];
  };

  /* between-run heal (Menagerie L3) — beasts don't get hurt, but they cheer the crew */
  B.betweenRuns = function () {
    if (G.bld('menagerie') >= 3 && G.state.beasts && G.state.beasts.active) {
      G.Delvers.atHome().forEach(function (d) { d.hp = Math.min(G.Delvers.maxHp(d), d.hp + 2); });
    }
  };
})();
