# ⛏ THE GILDED MAW
*A delving-company tycoon × roguelite for the browser.*

> Twelve years ago a comet burrowed into the valley of Hollowbrook and left behind
> the **Maw** — a living cavern system that bleeds treasure and swallows delvers.
> You've inherited Vale & Co.: a leaky storehouse, three silver marks, and a note.
>
> *"The Maw doesn't take. It trades. Find out what it wants."*

Run the company above. Finance the descents below. Delvers who die stay dead;
the company — and the Maw — remember.

## Play

No install, no dependencies, no build step:

```
open index.html          # or double-click it — runs from file://
```

Or build the single-file distributable:

```
node tools/build.js      # → dist/the-gilded-maw.html  (one file, share it anywhere)
```

Saves live in your browser (localStorage) with export/import strings as backup.

## The game

- **Tycoon surface:** hire delvers, raise eleven buildings, forge and **enchant**
  gear, ride a moody, **seasonal** market, sign contracts, race rival charters,
  earn renown, keep a menagerie — or fall behind, and watch your roster walk.
- **Roguelite depths:** branching node-map expeditions through five biomes
  (depths 1–13), turn-based combat with a shared Grit economy, **front/back
  rows**, status effects, telegraphed intents, push-your-luck torchlight,
  permadeath, and a guardian gating every biome.
- **One entity:** the Maw has **moods** that drive the market and the dungeon at
  once. Choose **omens** before a run; bank **Legacy Marks** and climb the
  **Ascension** ladder by retiring a charter; ride with a **Warden** and a pack
  of **companion beasts**; earn permanent **class mastery** across charters.
- **The last trade:** thirteen floors down waits the Heart of the Maw, and a
  choice — **Seal it. Trade with it. Or become it** — then the endless
  **Undervault** below it, the **Deep Court**, named **legends**, and, once all
  three answers are given, a fourth: **The Reckoning.** A seeded **Daily
  Descent**; a full **Codex**; difficulty & accessibility **options**; a
  synthesized soundscape.

Eight major versions, from the founding charter to the true ending — see
[CHANGELOG.md](CHANGELOG.md). The full design is in [docs/DESIGN.md](docs/DESIGN.md),
the plan in [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ROADMAP-6-8.md](docs/ROADMAP-6-8.md).

## Development

```
node test/run.js         # headless simulation tests (no browser needed)
node tools/build.js      # single-file build
```

Plain JavaScript on `globalThis.G` (no modules — file:// safe), all art drawn
procedurally on canvas, all audio synthesized (WebAudio). The entire game is
data-driven: patches mostly append to `js/data/`.
