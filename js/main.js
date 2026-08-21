/* Boot: load or new game, wire HUD, start the render loop. */
(function () {
  var G = (globalThis.G = globalThis.G || {});

  function boot() {
    G.GFX.init();

    var hadSave = G.loadSaved();
    if (!hadSave) {
      G.newGame();
      G.save();
    }

    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('hud-endday').addEventListener('click', function () {
      var r = G.Economy.endDay();
      if (!r.ok) G.UI.toast(r.msg, 'bad');
      G.UI.refresh();
    });
    document.getElementById('hud-journal').addEventListener('click', G.UI.showJournal);
    document.getElementById('hud-ledger').addEventListener('click', G.UI.showLedger);
    document.getElementById('hud-menu').addEventListener('click', G.UI.showMenu);
    document.getElementById('modal-wrap').addEventListener('click', function (ev) {
      if (ev.target === ev.currentTarget && G.UI.modalDismiss) G.UI.closeModal();
    });
    window.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && G.UI.modalDismiss) G.UI.closeModal();
    });

    // refresh panel on any state-changing event
    ['day', 'roster', 'market', 'buildings', 'supplies', 'journal'].forEach(function (evName) {
      G.on(evName, function () { G.UI.updateHud(); });
    });
    G.on('combatStart', function () { G.UI.refresh(); });
    G.on('combatEnd', function () { G.UI.refresh(); });

    G.UI.refresh();
    if (!hadSave) G.UI.showIntro();

    // render loop
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      G.GFX.render(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // autosave every 30s as backstop
    setInterval(function () { G.save(); }, 30000);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
