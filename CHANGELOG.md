# Changelog — The Gilded Maw

## v1.0 — "Founding"

The founding charter. The full tycoon × roguelite loop, playable end to end in
any browser from a single file.

### The Surface (tycoon)
- Hollowbrook: painted town scene with the Maw rift, winch, moonrise and lit windows.
- Four buildings, each 3 levels: **Storehouse** (shopfront sales & prices), **The Lamplit
  Cellar** (hire pool size/quality), **Assay Office** (sell price bonus), **Infirmary**
  (daily healing; L3 brink-ward cheats death once per expedition).
- Delvers: procedural names, 3 classes (**Vanguard / Scout / Arcanist**), 4 stats,
  traits (Greedy, Stalwart, Tunnel-born…), fears, XP and levels, wages — and delvers
  who go unpaid twice walk off the payroll.
- Market: 8 materials with bounded daily price drift, bulk-sale price impact,
  walk-in shopfront sales at a premium, sundries income floor.
- Day cycle: wages, healing, market drift, tavern pool turnover, Petra/Dov barks.

### The Descent (roguelite)
- Expeditions of up to 3 delvers carrying company supplies (torches, rations, bandages).
- **The Gullet** (depths 1–3): procedurally generated branching node maps — Fights,
  Events, Caches, Hazards, Rest hollows, Deep Peddlers, Shafts. Every floor
  guarantees at least one cache: the Maw trades, it doesn't stiff.
- Torch economy: one per passage; darkness costs blood. Rations per delver per depth.
- 12 choice-driven events with stat checks (the Tithe Bowl, the Echo Game, Maren's
  chalk marks, the Whispering Coin…).
- Turn-based combat: initiative, Strike / Guard / Skill / Bandage / Flee, shared
  **Grit** resource, taunts, crits, fear-shaken penalties. 6 enemy types plus the
  first guardian: **The First Warden**, with a bell that summons.
- Permadeath: the graveyard records names, days, and epitaphs.
- Guardian kill opens deeper starts (the groundwork for future biomes).

### Story
- Intro letter; 3 recoverable pages of Maren Vale's expedition log; reactive
  townsfolk barks.

### Foundation
- Versioned save with migration chain: localStorage autosave + export/import strings.
- Seeded RNG stored in the save — reloads continue the same dice.
- Headless test harness (`node test/run.js`): 20k+ checks — mapgen connectivity,
  save round-trips, 200-day economies, 150 policy-driven full expeditions, an
  80-day campaign sim.
- Single-file build (`node tools/build.js`), zero dependencies, runs from `file://`.
