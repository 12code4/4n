/* Boot: title screen → game. Wires HUD, audio, and the render loop. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var UI = G.UI;

  function boot() {
    G.GFX.init();
    if (G.Audio) G.Audio.init();

    // HUD wiring (buttons persist; panel/scene swap per screen)
    document.getElementById('hud-endday').addEventListener('click', function () {
      var r = G.Economy.endDay();
      if (!r.ok) UI.toast(r.msg, 'bad');
      UI.refresh();
    });
    document.getElementById('hud-journal').addEventListener('click', UI.showJournal);
    document.getElementById('hud-codex').addEventListener('click', UI.showCodex);
    document.getElementById('hud-ledger').addEventListener('click', UI.showLedger);
    document.getElementById('hud-menu').addEventListener('click', UI.showMenu);
    var audioBtn = document.getElementById('hud-audio');
    audioBtn.addEventListener('click', function () {
      if (!G.Audio) return;
      G.Audio.resume();
      G.Audio.setOn(!G.Audio.on);
      audioBtn.textContent = G.Audio.on ? '🔊' : '🔇';
    });
    if (G.Audio) audioBtn.textContent = G.Audio.on ? '🔊' : '🔇';

    document.getElementById('modal-wrap').addEventListener('click', function (ev) {
      if (ev.target === ev.currentTarget && UI.modalDismiss) UI.closeModal();
    });
    window.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && UI.modalDismiss) UI.closeModal();
    });
    // first interaction resumes audio (browser autoplay policy)
    window.addEventListener('pointerdown', function once() { if (G.Audio) G.Audio.resume(); window.removeEventListener('pointerdown', once); }, { once: true });

    ['day', 'roster', 'market', 'buildings', 'supplies', 'journal', 'renown', 'beasts', 'contracts', 'quests', 'mood'].forEach(function (evName) {
      G.on(evName, function () { UI.updateHud(); });
    });
    G.on('combatStart', function () { UI.refresh(); });
    G.on('combatEnd', function () { UI.refresh(); });

    // render loop (always running; scene chosen by UI)
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      G.GFX.render(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // autosave backstop
    setInterval(function () { if (G.state) G.save(); }, 30000);

    // start at the title screen
    UI.showTitle();
  }

  /* enter the game proper (from title Continue/New/Daily) */
  UI.boot2 = function () {
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('panel').classList.remove('hidden');
    if (G.Audio) G.Audio.resume();
    UI.refresh();
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
