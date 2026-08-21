# Changelog — The Gilded Maw

## v4.0 — "The Living Maw"

The Maw stops being a place and becomes a counterparty — with moods, appetites,
and a pulse. The design pillar made literal: the market's weather and the
dungeon's weather are the same weather.

### Moods
- One **mood** at a time (Generous, Restless, Hungry, Holding Its Breath,
  Dreaming), lasting a few days, shown on the HUD and driving **both** the
  market (prices flood or starve, drift widens or calms) **and** the descent
  (more fights or more wonders, richer or thinner loot, hungrier dark). Forecast
  it with a Charter Hall or a legacy perk.

### Omens
- At outfitting, choose up to two **omens** — blessed, cursed, or mixed — that
  reshape the whole run: +loot for +enemy damage, a quiet stair with no guardian
  (and no rewards), no rest but +2 starting Grit, weapons that set fire, and more.

### Combat, alive
- **Status effects**: Burn, Chill, Bleed, and Ward, applied by enemies, omens
  and beasts and shown as pips on both sides.
- **Telegraphed intents**: every enemy shows its next move, turning Guard and
  taunt into real reads.

### The Veins (depths 10–12)
- Living tunnels that beat; a crimson, pulsing biome. 4 materials, a heartbeat
  **pulse** node, 6 enemies (a leech that drinks wounds, a knight that bleeds
  you, a chorus that makes delvers skip their turn…), and the guardian
  **The Auricle** — the Maw's ear, which **echoes your own favourite move back
  at you, amplified**. Journal pages 10–12: the story's turn.

### Companion beasts
- The **Menagerie** houses creatures you rescue below. Take one per expedition
  for an always-on passive and a once-per-fight ability (Bite, Scorch, Shriek,
  Mend, Fetch, a protective Stand).

### Charter Renewal (prestige)
- Retire a charter to bank **Legacy Marks** and start fresh, inheriting a
  permanent perk tree (start gold, a founding crew, a pre-built forge, mood
  foresight, cheaper building, Maren's Chalk, a kept beast…). The colours
  outlive the ledger.

### Under the hood
- Save migration v3 → v4. Town skyline breathes with the mood; new art
  (the Auricle, Menagerie, Charter Hall, status/intent UI). New tests: mood
  market coupling, omen locking, status mechanics, 40 Auricle runs, beast
  abilities, prestige math. Full suite: 25k+ checks.

## v3.0 — "Rivals & Renown"

You are not the only charter delving the Maw — and the valley is starting to
keep score.

### Rivals
- Two AI charters, the **Blacklantern Syndicate** and the **Cartographers'
  Union**, run their own simulated economies: they earn, they push depth, they
  snipe your open contracts, and they plant **depth claims** on biomes you're
  slow to clear (a claim you hold is +5% sell on that biome's goods).
- New underground **Rival Lanterns** node: **trade** your haul at a good rate,
  **wager** for map intel (skip a rank), or **brawl** for the stair — a
  non-lethal fight where the loser only drops loot. Winning brawls earns renown.

### Renown & the Charter Hall
- **Renown** rises with guardian kills, contracts, depth records, honored dead
  and rival wins, across five ranks (Provisional → The Gilded Charter), each
  granting a passive perk (hire discount, sell bonus, cheaper peddlers, +1
  contract slot).
- New **Charter Hall** building: standings vs. rivals, rival intel (L2),
  relic slots, questlines, the memorial, and the deeds ledger.

### The Sunken Archive (depths 7–9)
- A drowned library in ink-black water; teal palette. 4 materials, 6 enemies
  with new behaviours (Ink Revenant smears your loot, Custodian wards itself,
  Drowned Scholar curses your damage), and the guardian **The Librarian** —
  who *silences* your Grit and *indexes* your best fighter for a doubled blow.
- 6 events, journal pages 7–9 (Maren's story turns).

### Growth & keepsakes
- **Talents**: at levels 3/6/9 each delver chooses 1 of 2 class talents —
  16 per class path, all self-contained (First Blood, Assassinate, Overchannel,
  Revivify Draught, Stone Skin…).
- **Company relics**: guardian first-kills award powerful passives with a real
  drawback (the Warden's Bell, a Crown Cooling, the Blank Card…), slotted at
  the Charter Hall.

### The valley remembers
- **Memorial wall** with honor-the-fallen; **20 achievements**; three
  **townsfolk questlines** (Petra's minted-coin mystery, Dov's tab, the
  Priest's list) with lasting perks.
- **Procedural portraits** for every delver on their card.

### Under the hood
- Save migration v2 → v3. New tests: renown/perks, relic slotting & fx,
  talent gating, 40 non-lethal brawls (0 deaths), 40 Archive runs beating the
  Librarian, migration round-trip. Full suite: 24k+ checks.

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
