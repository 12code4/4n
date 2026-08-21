/* v3.0 — Achievements. Checked against state after key events. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;
  /* each: { id, name, desc, check: fn(st) -> bool } */
  D.achievements = [
    { id: 'first_blood', name: 'First Blood', desc: 'Win your first fight.', check: function (st) { return st.stats.kills >= 1; } },
    { id: 'first_delve', name: 'Down the Winch', desc: 'Complete your first expedition.', check: function (st) { return st.stats.delves >= 1 && st.stats.daysRun > 1; } },
    { id: 'warden_down', name: 'Ticket Punched', desc: 'Slay the First Warden.', check: function (st) { return !!st.guardiansSlain.gullet; } },
    { id: 'king_down', name: 'Uneasy Lies the Crown', desc: 'Slay the Smelted King.', check: function (st) { return !!st.guardiansSlain.emberdeep; } },
    { id: 'librarian_down', name: 'Overdue Returned', desc: 'Slay the Librarian.', check: function (st) { return !!st.guardiansSlain.archive; } },
    { id: 'rich_day', name: 'A Very Good Day', desc: 'Hold 1000 marks at once.', check: function (st) { return st.marks >= 1000; } },
    { id: 'richer', name: 'Vale & Co. Ascendant', desc: 'Hold 5000 marks at once.', check: function (st) { return st.marks >= 5000; } },
    { id: 'full_town', name: 'A Proper Charter', desc: 'Build every surface building at least once.', check: function (st) {
      var need = ['storehouse', 'tavern', 'assay', 'infirmary', 'forge', 'contracts', 'charterhall'];
      return need.every(function (b) { return (st.buildings[b] || 0) >= 1; });
    } },
    { id: 'maxed_bld', name: 'Built to Last', desc: 'Raise any building to level 3.', check: function (st) {
      for (var k in st.buildings) if (st.buildings[k] >= 3) return true; return false;
    } },
    { id: 'veteran_delver', name: 'Old Hand', desc: 'Level a delver to 5.', check: function (st) {
      return st.delvers.some(function (d) { return d.lvl >= 5; });
    } },
    { id: 'legend_delver', name: 'Living Legend', desc: 'Level a delver to 10.', check: function (st) {
      return st.delvers.some(function (d) { return d.lvl >= 10; });
    } },
    { id: 'no_torch', name: 'Eyes in the Dark', desc: 'Return from a run of depth 3+ having ended it with 0 torches.', check: null, event: true },
    { id: 'flawless', name: 'Not a Scratch', desc: 'Slay a guardian without losing a delver on that run.', check: null, event: true },
    { id: 'deep_seven', name: 'Below the Water', desc: 'Reach depth 7.', check: function (st) { return st.stats.deepest >= 7; } },
    { id: 'contractor', name: 'Good for the Work', desc: 'Deliver 10 contracts.', check: function (st) { return (st.stats.contractsDone || 0) >= 10; } },
    { id: 'craftsman', name: 'The Forge Rings', desc: 'Craft 10 pieces of gear.', check: function (st) { return (st.stats.crafted || 0) >= 10; } },
    { id: 'graveyard', name: 'The Cost of Business', desc: 'Lose 5 delvers to the Maw.', check: function (st) { return st.stats.deaths >= 5; } },
    { id: 'memorial', name: 'We Remember', desc: 'Honor a fallen delver at the memorial.', check: function (st) { return (st.stats.honored || 0) >= 1; } },
    { id: 'rival_beat', name: 'Not the Only Charter', desc: 'Best a rival crew underground.', check: function (st) { return (st.stats.rivalWins || 0) >= 1; } },
    { id: 'relic_bearer', name: 'Bearer of Old Things', desc: 'Slot a company relic.', check: function (st) { return st.relics && st.relics.slotted.length >= 1; } },
    { id: 'gilded', name: 'The Gilded Charter', desc: 'Reach the highest renown tier.', check: function (st) { return (st.renown || 0) >= 400; } },
    { id: 'deep_twelve', name: 'The Living Deep', desc: 'Reach depth 12, the Veins.', check: function (st) { return st.stats.deepest >= 12; } },
    { id: 'auricle_down', name: 'Unlike Yourself', desc: 'Best the Auricle.', check: function (st) { return !!st.guardiansSlain.veins; } },
    { id: 'the_heart', name: 'The Last Trade', desc: 'Reach the Heart of the Maw.', check: function (st) { return st.stats.deepest >= 13; } },
    { id: 'heart_seal', name: 'What Is Sealed', desc: 'Seal the Heart.', check: null, event: true },
    { id: 'heart_trade', name: 'Fair Terms', desc: 'Trade with the Heart.', check: null, event: true },
    { id: 'heart_become', name: 'The Keeping', desc: 'Become the Heart.', check: null, event: true },
    { id: 'all_endings', name: 'Every Answer', desc: 'Reach all three endings.', check: function (st) { return (st.endings || []).length >= 3; } }
  ];
})();
