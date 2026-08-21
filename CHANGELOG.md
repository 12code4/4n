# Changelog — The Gilded Maw

## v8.0 — "Legends of the Maw" — final release

The company becomes legend; the game becomes a keepsake. The last patch adds
named heroes, deep gear and class craft, a full options suite, and a true ending
that answers Maren's question for good.

### Legendary delvers
- Four hand-authored **unique heroes**, each with fixed stats, a **signature
  skill**, pre-learned talents, a laurel-ringed portrait, and a backstory that
  threads the whole game: **Corvo One-Arm** (the Warden who lost an arm to the
  First Warden), **Yove Vantry** (the Cartographer's daughter), **Wick Alder**
  (Petra's apprentice), and **the Nameless Pilgrim** (who walked into the Heart
  and came back without a name).
- Each is recruited by meeting a condition that threads the story — reach the
  Undervault, raise the Cartographer's Table, finish Petra's questline, stand at
  the Heart. A **Hall of Legends** in the Charter Hall tells their tales and
  remembers how they fell.

### Enchanting & class mastery
- **Gear enchanting**: reforge an armory piece with a prefix affix — Keen,
  Heavy, Bulwark, Steady, **Vampiric** (lifesteal), **Warding** (ward-on-hit).
- **Class mastery**: kills by each class accumulate across **every charter** and
  earn permanent, company-wide craft — Vanguard damage-reduction, Scout crit,
  Warden beast-damage, Alchemist healing, Arcanist skill-damage.

### Options, accessibility & records
- An **Options** screen: **difficulty presets** (Story / Standard / Brutal,
  separate from Ascension), **colorblind palette**, **reduced motion**, combat
  **auto-resolve** for safely-won fights, and combat speed.
- A **Records** hall — the company's whole lifetime account and every class's
  mastery — plus a **Credits** keepsake page that celebrates a complete Codex.

### The true ending
- Once all three Heart answers have been given (across charters), the Heart
  offers a fourth: **The Reckoning** — audit the Maw its own ledger and square
  the books at last, a grand windfall and a New-Charter++ seal.

### Polish & release
- Legend portraits with a gold laurel; reduced-motion and colorblind honored in
  the gfx and DOM; save migration v7 → v8 (v1 saves still load into v8). New v8
  test coverage — legends, enchanting, mastery, difficulty scaling, lifesteal,
  and the true ending — all green. The line closes at **8.0**.

## v7.0 — "The Undervault"

The Trade ending said the Vault opens below the Heart. Now it does — an endless,
escalating descent with its own Court, its own rules, and no bottom.

### The Undervault — an endless descent
- Unlocked by the **Trade** ending or **Ascension III+**. Below depth 13 lies an
  infinite ladder of **strata**; the chase is the **deep-record** (deepest
  stratum reached), banked and carried across charters.
- Each stratum rolls procedural **affixes** that reshape the fight and the haul:
  **Tithe** (blows skim your marks), **Ledger** (each kill compounds the take),
  **Famine** (no rest or pulse), **Gilt** (double loot, swollen enemies),
  **Echoing** (a foe charges a Heart-echo each round), **Interest** (enemies mend
  every round), **Audit** (a Court noble joins every third fight). Affix count
  grows the deeper you climb.
- **The Deep Court**: six new nobility — the Auditor, the Usurer, the Assessor,
  the Chamberlain, the Collector, the Notary — each with its own trick (back-row
  hunting, wound-drinking, mark-collecting, Grit-levying, brass wards). Two
  **Court guardians** — the Lord Exchequer and the Magistrate — bar every fourth
  stratum and drop their regalia.

### Combat formation — front & back rows
- The party now fights in **two lines**. The **front** takes the blows and
  **shields the back**; the back is spared until the front falls — but some Deep
  Court foes **hunt the back row**, and area attacks hit everyone. Place your
  delvers at outfitting and **Shift** lines mid-fight (it costs the turn).

### Tier IV gear & relic sets
- **The Deep Forge** — an Undervault upgrade (Forge L3 + gilt-marrow) unlocks
  **tier IV** patterns: the Exchequer’s Edge, Gilt-Marrow Plate, Null Seal, Deep
  Ledger, forged from Undervault materials.
- **Relic sets** with 2-piece / 4-piece bonuses: complete the **Regalia of the
  Deep Court** or the **Underdelver’s Kit** for escalating company-wide rewards.

### Polish
- New procedural art: the purple **Undervault** biome, the masked **Deep Court**
  nobles and the scale-crowned **Court guardians**, and a **front/back** combat
  layout. Affix banners on the run and in every fight; an **Undervault audio
  layer** — a ledger-tick under a deeper drone.
- Save migration v6 → v7. New v7 test coverage: the endless descent (30-run
  policy sim), affix mechanics, the front/back rows, the guardian cadence, relic
  sets, and the Deep Forge — all green in the headless sim.

## v6.0 — "The Warden's Charter"

After the Heart is answered, the company keeps house — and the house gets
deeper roots. A fifth class, a difficulty ladder that carries across charters,
a turning year, and two new buildings.

### The Warden — a fifth class
- A beast-bond delver built around the Menagerie. A Warden opens a **second
  companion slot** on the run, **amplifies every beast passive by +50%**, and
  lets beast abilities **recharge** instead of firing once and going quiet.
- New skill **Call of the Pack**: command every companion to act at once
  (ignoring cooldown) and take a ward. New talents: *Kindred* / *Houndmaster*
  (L3), *Two as One* / *Thick Hide* (L6), *Alpha* (a third beast slot) /
  *Wild Fury* (L9).
- The Menagerie's beasts are now a **pack** you assemble at outfitting, not a
  single companion — the old single-beast save is migrated into the new pack.

### Ascension — a New-Charter+ ladder
- Ten escalating tiers, each stacking a new modifier on all below it: dearer
  wages and hires, tougher enemies and guardians, a hungrier dark, costlier
  supplies, worse wounds, keener rivals, and at tier X a total wipe **collapses
  a building**.
- Clearing a tier (reaching any ending at it) **banks bonus Legacy Marks**,
  unlocks the next, and can award an **Ascension relic** (The First Seal, The
  Standing Ledger, The Ascendant Crown). The ladder **persists across charters**
  in the Legacy store; choose your tier at Renewal.

### The turning year — seasons & festivals
- The surface year cycles through **Thaw, Glare, Fall, Frost** (8 days each),
  each tilting the market — cheap hires in Thaw, glass-and-fire premiums in
  Glare, cheap rations in Fall, dear fuel in Frost — and **tinting the town's
  sky**, with a slow day/night cycle over the vista.
- Rare **festival days** — the Founders' Fair, the Bell Toll, Lantern Night —
  string lanterns across the town, shift the Maw's mood, and bring special
  stock and richer contracts.

### Two new buildings
- **The Cartographer's Table** — the dark costs less HP per passage at every
  level; at L3, once per run you may **Survey** ahead to slip past a whole rank.
- **The Countinghouse** — banked marks earn **daily interest**, and you can take
  **short loans** against a cap. Miss the due date and the clerk seizes what
  they can, rolls the rest with penalty interest, and your renown suffers.

### Polish
- **Onboarding hints** — one-time contextual tips on your first hire, descent,
  fight, death, contract, guardian, and mood (silent during Daily Descents).
- New art: the Warden's figure (fur mantle, warhorn, a companion at heel) and
  teal portrait; the Cartographer's Table and the Countinghouse on the skyline;
  seasonal sky and festival lanterns.
- Save migration v5 → v6. New v6 test coverage: Warden bond, the Ascension
  ladder, seasons/festivals, the Countinghouse's interest & loans, the
  Cartographer's survey, and hints — all green in the headless sim.

## v5.0 — "The Heart of It"

The last trade. Everything the game has taught converges at depth 13, and the
whole thing gets its final coat of lacquer.

### The finale — depth 13, The Heart
- A hand-authored final descent: an antechamber, then three **trials** that
  quote the biomes you passed (the Warden, the King, the Auricle in gold), then
  **The Heart of the Maw** itself.
- The Heart is part boss, part negotiation: fight it to half health and it
  **stops**, opens your company's real lifetime ledger, and asks Maren's
  question back — *what is the company FOR?*
- **Three endings**, each with a written epilogue: **Seal It** (collapse the
  stair), **Trade With It** (a perpetual charter — +8% sell forever, the Vault
  stays open), **Become It** (take the keeper's seat → New Charter+ with a
  legacy windfall). Journal pages 10–12 pay the story off; all three endings
  are trackable in the Codex.

### Daily Descent
- A seeded challenge: the same Maw for everyone on a given date, a fixed
  founding crew, 14 days to build the highest score. Per-seed local best;
  your career save is stashed and restored when you leave.

### The soundscape (WebAudio, no files)
- Fully synthesized: per-biome drones, combat impacts, coin ticks, a music-box
  motif for Maren's journal pages, mood stingers. Mute toggle in the HUD;
  volume/state persisted.

### The Codex & the title
- A living **Codex** of every enemy, material, biome, relic, beast, mood and
  ending discovered — undiscovered entries stay "???".
- A painted **title screen** (Continue / New Charter / Daily Descent / Codex)
  over the golden rift.

### Polish & balance
- Balance verified across the whole 1→13 curve with leveled-roster boss sims
  (every guardian winnable with appropriate preparation, brutal when
  under-levelled). Save migration v4 → v5. New art: the Heart, the gold echoes,
  the title vista, the Codex. Full suite: 25.5k+ checks including all three
  Heart endings, the parley trigger, Codex discovery, and the Daily Descent.

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
