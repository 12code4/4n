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

- **Tycoon surface:** hire delvers, raise buildings, stock the shop, ride the
  market, sign contracts, pay wages — or don't, and watch your roster walk.
- **Roguelite depths:** branching node-map expeditions, turn-based combat with a
  shared Grit economy, push-your-luck torchlight, permadeath, guardians gating
  each biome, and a story that only exists below a certain depth.
- **One entity:** the market's moods and the dungeon's moods are the same moods.

See [docs/DESIGN.md](docs/DESIGN.md) for the full design document and
[docs/ROADMAP.md](docs/ROADMAP.md) for the version plan.
[CHANGELOG.md](CHANGELOG.md) records what each major version shipped.

## Development

```
node test/run.js         # headless simulation tests (no browser needed)
node tools/build.js      # single-file build
```

Plain JavaScript on `globalThis.G` (no modules — file:// safe), all art drawn
procedurally on canvas, all audio synthesized (WebAudio). The entire game is
data-driven: patches mostly append to `js/data/`.
