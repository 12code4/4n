# THE GILDED MAW — Version Roadmap

Each major version is a self-contained patch: new systems, new content, and a
refine/polish + graphics pass. Planned scope below; `CHANGELOG.md` records what
actually shipped.

---

## v1.0 — "Founding"
**Theme: the loop, complete and honest.**
- Surface town scene (painted canvas): Storehouse, Tavern, Assay Office, Infirmary — all buildable/upgradeable (3 levels).
- Delver generation: names, 3 classes (Vanguard / Scout / Arcanist), 4 stats, traits & fears, XP/levels.
- Tavern hiring with rotating pool; wages; graveyard.
- Expedition outfitting: team of ≤3, supplies (Rations/Torches/Bandages), depth target.
- The Gullet (depths 1–3): branching node maps — Fight, Event, Cache, Hazard, Rest, Peddler, Shaft, Guardian (The First Warden).
- Turn-based combat: initiative, Strike/Guard/Skill/Item/Flee, shared Grit resource, 6 enemy types + guardian.
- ~12 expedition events with choices & stat checks.
- Market: 8 materials with daily drift; assay & sell; shop income from stock.
- Story: intro letter, 3 journal pages (depth milestones), Petra/Dov barks.
- Save/load (versioned, localStorage + export/import string), seeded RNG.
- Canvas art pass one: town, map chart, combat diorama, particles for hits/loot.

## v2.0 — "Forge & Fortune"
**Theme: mastery over goods — craft what you delve.**
- **Forge** building + crafting: 15+ recipes; gear slots (weapon/armor/trinket) per delver; 3 gear tiers.
- **Alchemist** class (brews, acid flasks, field revival draught).
- **The Emberdeep** (depths 4–6): 6 new enemies, guardian **The Smelted King**, new hazards (slag flows, ash storms).
- **Contracts Board**: timed delivery contracts with penalties/bonuses; client reputations.
- Market events + news ticker (booms, crashes, guild strikes, caravan arrivals).
- Injury system: survivors of near-death carry wounds (temporary stat scars) until treated.
- 10+ new events, new peddler stock, new journal pages 4–6.
- Polish: town grows visually with buildings; combat hit-stop & better projectiles; map biome palettes.

## v3.0 — "Rivals & Renown"
**Theme: you are not the only one down there.**
- **Rival charters**: Blacklantern Syndicate & the Cartographers' Union — race for depth claims, snipe contracts, appear as map encounters (parley/trade/brawl).
- **Renown** tiers (Charter ranks) with perks; **Charter Hall** building.
- **The Sunken Archive** (depths 7–9): 6 new enemies, guardian **The Librarian**.
- Company **relics**: equippable at company level, passive run modifiers with drawbacks.
- Delver **skill choices** at levels 3/6/9 (branching kit upgrades).
- **Memorial wall** + graveyard epitaphs; achievements (20+); townsfolk questlines (Petra's coin mystery, Dov's tab, the Priest's list).
- 12+ new events incl. rival encounters; journal pages 7–9.
- Polish: portraits (procedural face painter) for delvers; richer map decorations; UI tooltips everywhere.

## v4.0 — "The Living Maw"
**Theme: the Maw notices you.**
- **Maw moods**: multi-day weather (Generous, Restless, Hungry, Holding-Breath…) coupling market drift and run difficulty/loot.
- **Omens**: pre-run blessed/cursed mutators, choose risk for reward.
- Combat depth: status effects (Burn/Chill/Bleed/Ward), telegraphed enemy intents, skill upgrade tiers.
- **The Veins** (depths 10–12): 6 new enemies, guardian **The Auricle**.
- **Companion beasts** (Menagerie building): rescue creatures on runs, one per expedition, passive + active ability.
- **Charter Renewal** (prestige): retire → Legacy Marks → permanent perk tree (12+ perks).
- Journal pages 10–12; the Maw begins replying in the margins.
- Polish: town visual expansion (roads, walls, lamplight at night), map weather fx, combat camera (subtle zoom/shake), better death/loot ceremonies.

## v5.0 — "The Heart of It"
**Theme: the last trade.**
- **Depth 13 — The Heart**: the final descent (fixed hand-authored map), the Heart encounter: part boss, part negotiation. **Three endings**: Seal / Trade / Become. Post-ending epilogue states + New-Charter+.
- **Daily Descent**: seeded daily challenge (fixed company, fixed omens, score + shareable seed).
- **WebAudio soundscape**: procedural biome drones, UI ticks, combat impacts, music-box motif for journal pages. Mute toggle, no audio files.
- **Codex**: every enemy/material/relic/character discovered gets an entry; company **stats ledger** (lifetime numbers, deepest delve, best day).
- Balance overhaul from simulated playtests; onboarding contextual hints.
- Final graphics pass: lighting layer, parallax dust, transition wipes, ending cinematics (canvas-painted), title screen.

---

### Numbering
Majors ship as `X.0`. Hotfixes within a patch cycle would be `X.Y`, but the
repository history is organized around the five majors.
