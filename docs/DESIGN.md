# THE GILDED MAW
### A Delving Company — Game Design Document

> *"The Maw doesn't take. It trades. Find out what it wants."*
> — Maren Vale's last note

---

## 1. High Concept

**The Gilded Maw** is a **tycoon × roguelite** hybrid for the browser. You are the new
proprietor of **Vale & Co.**, a near-bankrupt delving charter perched on the lip of the
Maw — a living cavern system that opened when the star-iron comet *Vel* cracked the
valley of Hollowbrook twelve years ago.

The twist that fuses the genres: **the tycoon layer IS the roguelite meta-progression.**

- **Above ground** you run a business: hire delvers, construct and upgrade buildings,
  stock goods, watch the market drift, sign contracts, pay wages. Money compounds.
- **Below ground** you finance expeditions: procedurally generated node-map descents
  with turn-based combat, events, hazards and loot. Delvers who die **stay dead**.
  Runs end in retreat, triumph, or a very expensive silence.

Every run feeds the company; every company upgrade makes the next run go deeper.
At the bottom waits the **Heart of the Maw** — and the last trade Maren Vale ever made.

**Platform:** any modern browser. Vanilla JS + Canvas + DOM. Zero dependencies,
no build step required to play (open `index.html`), single-file distributable via
`node tools/build.js`.

---

## 2. Story

Twelve years ago the comet **Vel** fell on the valley of Hollowbrook. It did not
explode — it *burrowed*. Where it passed, the earth stayed open, and kept opening:
galleries of ember-glass, veins of singing ore, stairwells nobody built descending
past the reach of rope. Scholars called it a cave system. The delvers who actually
went down called it what it is: **the Maw**.

The strange part is not the monsters. The strange part is the *economy*. The Maw
produces wealth the way a wound produces blood — relics of a civilisation that fell
**downward** rather than apart, materials that hum, coin-shaped stones with faces
worn smooth on both sides. And the Maw's moods move the market: when it is restless,
ember-glass is everywhere and worthless; when it holds its breath, a single vial of
Root Amber buys a house.

**Maren Vale** founded the valley's first delving charter and spent a decade learning
the Maw's manners. Then she outfitted one last expedition — her best delvers, her whole
fortune — and went down. None of them came back. The company passed to you: a leaky
storehouse, three silver marks, a tavern tab, and a note pinned to the assay desk:

> *"The Maw doesn't take. It trades. Find out what it wants."*

The story unfolds through **journal pages** recovered at depth milestones — Maren's
expedition log, growing stranger the deeper it goes — and through the townsfolk of
Hollowbrook, who each want something from the Maw and fear what it wants back.
It ends at the Heart, with a choice (v5.0): **Seal it. Trade with it. Or become it.**

### Named characters (surface)
| Name | Role | Arc |
|---|---|---|
| **Petra Kiln** | Assayer | Grades your loot; suspects the coins are *minted*, not found |
| **Dov Harrow** | Tavernkeep | Feeds you delver gossip; keeps Maren's tab open "for when she's back" |
| **The Silent Priest** | Keeps the bone-chapel | Never speaks; buys specific relics for troubling prices |
| **Maren Vale** | Founder (missing) | Speaks only through journal pages, from below |

---

## 3. The Core Loop

```
        ┌────────────────────── SURFACE (tycoon) ──────────────────────┐
        │  advance days · earn shop income · pay wages · market drifts │
        │  hire delvers · upgrade buildings · craft · sign contracts   │
        └──────────────────────────────┬───────────────────────────────┘
                     outfit expedition │ (team, supplies, depth target)
                                       ▼
        ┌────────────────────── THE DESCENT (roguelite) ───────────────┐
        │  branching node map, one floor per depth: fights, events,    │
        │  caches, hazards, rests, deep-merchants, the depth guardian  │
        │  turn-based combat · permadeath · push-your-luck deeper      │
        └──────────────────────────────┬───────────────────────────────┘
                        return / flee  │  (or don't return at all)
                                       ▼
        ┌───────────────────────── SETTLEMENT ─────────────────────────┐
        │  assay & sell loot · level survivors · bury the rest         │
        │  journal pages · unlock depths · reinvest · repeat           │
        └──────────────────────────────────────────────────────────────┘
```

A session beat is ~5–10 minutes: prep, descend, return, reinvest. The macro arc
(charter → Heart) is many hours, accelerated by prestige (v4.0).

---

## 4. Systems

### 4.1 Time & Money
- Currency: **Marks (ᵯ)**. Time: **Days**, advanced manually on the surface
  (`End Day`) or consumed automatically by expeditions (deeper = more days).
- Daily tick: shop income from stocked goods × building bonuses, wages deducted,
  market drift, tavern pool refresh chance, contract deadlines count down.
- Insolvency is soft-fail: at ᵯ0 you can always run a bare expedition ("the Maw
  always pays *something*"), but wages unpaid → delvers walk.

### 4.2 Delvers
Procedurally generated. Stats: **Vigor** (HP), **Might** (physical power),
**Wits** (skill power & initiative), **Luck** (crits, event outcomes, loot).
Classes at 1.0: **Vanguard** (tank/taunt), **Scout** (fast, high crit, flee expert),
**Arcanist** (AoE + ward). Later: **Alchemist** (2.0), **Warden** (3.0, beast-bond).
Each delver has a **trait** (e.g. *Greedy: +loot, may pocket finds*) and a **fear**
(a node type that stresses them). XP → levels → stat growth + skill choices (3.0).
**Death is permanent.** The graveyard remembers (memorial wall, 3.0).

### 4.3 Expeditions
Choose ≤3 delvers, buy supplies (Rations, Torches, Bandages, later Charms),
pick a target depth. The map is a branching DAG per floor (Slay-the-Spire-like),
node types: **Fight · Event · Cache · Hazard · Rest · Peddler · Shaft (exit) ·
Guardian (floor boss)**. Torches burn per node; darkness stacks damage & fear.
Retreat is always possible at a Shaft; fleeing mid-fight costs loot.
Each biome guardian gates the next biome the first time it's slain.

### 4.4 Combat
Turn-based, initiative by Wits. Party of ≤3 vs 1–4 enemies. Actions: **Strike ·
Guard · Skill (class-specific, costs Grit) · Item · Flee**. Grit is the shared
party resource earned by Strikes/Guards, spent on skills — creates rhythm.
Enemy **intents are telegraphed** (4.0). Status effects (4.0): Burn, Chill,
Bleed, Ward. Deaths in combat are real deaths.

### 4.5 Surface Buildings
| Building | Effect (L1→L3) | Version |
|---|---|---|
| **Storehouse** | inventory cap, +shop income | 1.0 |
| **Tavern** | hire pool size & quality | 1.0 |
| **Assay Office** | sell price %, unlock rare grading | 1.0 |
| **Infirmary** | heal rate between runs, revive-on-brink ward (L3) | 1.0 |
| **Forge** | craft gear, gear tiers | 2.0 |
| **Contracts Board** | timed contracts, better clients | 2.0 |
| **Charter Hall** | renown perks, rival intel | 3.0 |
| **Menagerie** | companion beasts | 4.0 |
| **The Bone-Chapel** | endgame; the Priest's trades | 5.0 |

### 4.6 Economy & Market
Every material has base value + daily drift (bounded random walk) + event shocks
(2.0 news ticker: *"Glasswright guild strike — Ember-Glass +40%"*). Selling in bulk
saturates (soft price impact). The Maw's **mood** (4.0) correlates market & runs:
generous moods flood the market (cheap goods, easy runs), hungry moods starve it.

### 4.7 The Depths (biomes)
| Depths | Biome | Look | Guardian | Version |
|---|---|---|---|---|
| 1–3 | **The Gullet** | ember-glass caverns, grave soil | The First Warden | 1.0 |
| 4–6 | **The Emberdeep** | slag flows, cinder pits | The Smelted King | 2.0 |
| 7–9 | **The Sunken Archive** | drowned library, ink water | The Librarian | 3.0 |
| 10–12 | **The Veins** | living tunnels, pulse-light | The Auricle | 4.0 |
| 13 | **The Heart** | (spoilers) | The Heart of the Maw | 5.0 |

### 4.8 Roguelite Meta
- Persistent: company, buildings, marks, unlocked depths, codex, relics, renown.
- Per-run: map, loot carried (lost if wiped), torch/supply state, omens (4.0).
- **Charter Renewal** (4.0 prestige): retire the charter → **Legacy Marks** →
  permanent perk tree (start gold, starting delver quality, market insight…).
- **Daily Descent** (5.0): seeded daily challenge run, fixed company, score chase.

---

## 5. Presentation

- **Art direction:** "lantern-lit ledger" — deep umber/ink backgrounds, warm
  brass/gold UI, each biome a strong palette (ember orange, slag red, archive
  teal, vein crimson, heart white-gold). All art is **procedurally drawn on
  canvas** — layered vector shapes, glow, dither, particles. No image assets.
- **Scenes:** painted surface town (parallax sky, day/night tint, chimney smoke),
  node map as an inked chart, combat as a lit diorama with idle-bobbing creatures,
  particle language for hits/crits/deaths/loot.
- **Audio (5.0):** WebAudio-synthesized — no audio files. Drones per biome,
  UI ticks, combat thuds, a music-box motif for Maren's pages.
- **UI:** DOM overlay (panels, tooltips, log) over canvas scenes. Keyboard
  shortcuts. Readable at 1280×720 up to 4K; degrades gracefully to mobile-ish.

---

## 6. Technical Architecture

```
index.html          loads css + ordered <script> tags (file:// safe, no modules)
css/style.css
js/core/            rng (seeded, streams), util, bus (pub/sub), save (versioned,
                    migrating, localStorage + export string)
js/data/            all content as data: materials, items, enemies, events,
                    classes, traits, names, story, biomes  ← patches append here
js/systems/         economy, delvers, market, expedition (mapgen), combat,
                    buildings, contracts, rivals, moods, prestige  (pure logic,
                    no DOM/canvas — unit-testable in node via globalThis.G)
js/gfx/             palette, painter helpers, scene painters, particles, fx
js/ui/              screen manager + one file per screen; renders from state,
                    emits intents to systems
js/main.js          boot, game loop (rAF render + coarse sim tick)
test/run.js         headless node tests: sim invariants, combat termination,
                    mapgen validity, save round-trip, economy solvency curves
tools/build.js      inlines css+js → dist/the-gilded-maw.html (single file)
```

**State** is one serializable object (`G.state`). Systems mutate it through
intent functions; UI re-renders from it. RNG is seeded per-run (daily mode uses
date seed). Save format carries a version int + migration chain so every patch
loads old saves.

---

## 7. Version Roadmap (see ROADMAP.md for full patch notes)

- **1.0 — "Founding"**: core loop complete: town, 4 buildings, 3 classes,
  Gullet biome (depths 1–3), combat, market, save/load, tutorial-by-doing.
- **2.0 — "Forge & Fortune"**: Forge & crafting, gear slots, Alchemist class,
  Emberdeep (4–6), contracts board, market events & news ticker, injuries.
- **3.0 — "Rivals & Renown"**: rival charters race you underground, renown
  tiers, Charter Hall, Sunken Archive (7–9), company relics, skill choices,
  memorial wall, achievements, townsfolk questlines.
- **4.0 — "The Living Maw"**: Maw moods, omens (run mutators), status-effect
  combat & enemy intents, the Veins (10–12), companion beasts, Charter Renewal
  prestige + Legacy perk tree, town visual expansion.
- **5.0 — "The Heart of It"**: depth 13 + final encounter with 3 endings,
  Daily Descent seeded mode, full WebAudio soundscape, codex, stats,
  polish pass (particles, transitions, lighting), balance overhaul.

---

## 8. Design Pillars

1. **Every coin has a heartbeat** — economy and dungeon feed each other; neither
   is a minigame bolted to the other.
2. **Loss is content** — permadeath produces stories (graves, memorials, gossip),
   not just setbacks.
3. **Push-your-luck is the verb** — one more node, one more depth, one more day
   before wages. The game constantly asks *"and if you went a little further?"*
4. **The Maw is a character** — the market, the moods, the story: one entity.
5. **Zero friction** — one file, no install, saves itself, a run fits in a coffee.
