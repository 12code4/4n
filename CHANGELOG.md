# Changelog — The Gilded Maw

## v2.0 — "Forge & Fortune"

Mastery over goods: craft what you delve, and take the industry down a level.

### The Forge & crafting
- New **Forge** building (3 levels → gear tiers I/II/III).
- 13 gear patterns across **weapon / armor / trinket** slots: weapons add attack,
  armor flat-reduces incoming damage, trinkets grant passives (crit, flee, xp,
  loot, luck, starting-grit). Crafting spends materials + marks; a company
  **armory** holds pieces you equip and re-equip freely at home (never below).
- Gear feeds straight into combat maths and shows on delver cards.

### The Alchemist (4th class)
- **Field Tonic**: a shared draught that heals the whole team.
- Passive: bandages heal +40% while an Alchemist stands the line.

### The Emberdeep (depths 4–6)
- Slag rivers and cinder pits in a molten palette; 4 new materials, 3 new
  hazards, 6 new enemies (Ember Tick, Cinder Hound, Slag Golem, Ashwake
  Chorister whose song amplifies every ally, Bellows Wight with a lung-blast
  every third round, Molten Weaver), and the guardian **The Smelted King** —
  who reforges itself in its own furnace, twice, before it runs out of solder.
- 6 new events, journal pages 4–6, reactive townsfolk lines.

### Contracts & the market
- **Contracts Board** (3 levels): valley clients post timed delivery wants that
  pay well above market; fulfil from stock, forfeit a fee if they lapse.
- **Market events & news ticker**: booms, crashes, guild strikes and caravans
  shock prices for a few days, shown as headlines and ▲▼ arrows.

### Injuries
- Delvers who surface badly hurt may carry a wound home — a temporary stat scar
  that heals over days (faster with a better Infirmary).

### Under the hood
- Versioned save migration v1 → v2 (old Founding saves load intact).
- New system tests: forge craft/equip/slot rules, contracts, alchemist heal,
  injuries, migration round-trip, and 40 Emberdeep runs that beat the Smelted
  King ~50% of the time on basic gear. Full suite: 23k+ checks.

## v1.0.1 — hotfix
- Fixed a soft-lock where fleeing a guardian fight stranded the team on the
  guardian node (now returns to the approach screen); cleared a leaked
  skip-rank bypass across floors; corrected a cosmetic darkness-damage log.

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
