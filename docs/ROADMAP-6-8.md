# THE GILDED MAW — Roadmap 6.0 → 8.0

The game is narratively complete at 5.0: founding charter → the Heart → three
endings. So 6.0–8.0 are **expansions**, not padding. Each builds on a real seam
the finale left open, adds substantial content, and carries a full polish pass.

**Seams we build on**
- The **Warden** class (beast-bond) was promised in the original design doc and
  never shipped — a genuine gap.
- The **Trade** ending says "the Vault opens below the Heart" but there is no
  distinct endless mode yet.
- **New-Charter+** exists but has no escalating difficulty — the classic
  roguelite endgame ladder is missing.
- No day/night, no seasons, no combat positioning, no onboarding hints.

Everything stays one continuous, save-migrating line (v5 saves load into v8).

---

## v6.0 — "The Warden's Charter"
**Theme: the company matures; the meta gets its endgame ladder.**

### The Warden (5th class) — beast-bond
- The class the design doc promised. Base: sturdy, Wits-light, Luck-light.
- **Bond**: the Warden fights *with* the expedition's companion beast — the beast
  acts on its own initiative (not just once/fight), the Warden can spend Grit to
  command it, and beast abilities recharge. Warden + Menagerie is a build.
- Skill **Call of the Pack**: the beast strikes and the bonded beast is warded.
- Passive: a second beast may ride along when a Warden is on the team.

### Ascension — the New-Charter+ ladder
- After any ending (or from the Charter Hall once you've reached depth 6+), opt
  into **Ascension I–X**. Each tier stacks a modifier: steeper wages, a meaner
  Maw (mood floor), pricier hires, tougher guardians, thinner torches, permadeath
  of buildings on wipe (high tiers).
- Each cleared Ascension awards **Legacy Marks + a charter seal** (cosmetic rank
  on the title) and unlocks **Ascension relics** (powerful, tier-gated).
- Your highest Ascension per ending is recorded; the ladder is the long game.

### Seasons, day/night & festivals
- A 4-season cycle (**Thaw / Glare / Fall / Frost**), each ~8 days, tinting the
  town and tilting the market (Fall floods food & lowers rations cost; Frost
  raises fuel/torch prices; Glare booms glass). A day/night visual cycle on the
  town scene (lamps, moon phase).
- **Festivals**: rare seeded market days (Founders' Fair, the Bell Toll, the
  Lantern Night) with special stock, premium contracts, and a mood shift.

### Two new buildings
- **The Cartographer's Table**: reveals the *type* of adjacent map nodes before
  you commit; higher levels reveal two ranks ahead and cut darkness damage.
- **The Countinghouse**: banked marks earn small daily interest; take a short
  **loan** (with interest) to fund a big push — miss repayment and renown drops.

### Polish
- Contextual **onboarding hints** (first hire / first descent / first death /
  first contract / first guardian), shown once each.
- Town day/night lighting layer, seasonal weather particles (thaw drip, frost
  motes), the Warden + two-beast art, festival banners.

---

## v7.0 — "The Undervault"
**Theme: below the Heart, the Maw keeps its true accounts.**

### The Undervault — an endless, escalating descent
- Unlocked by the **Trade** ending (or Ascension III+). Below depth 13 lies an
  infinite ladder of **strata**; each stratum rolls procedural **affixes**:
  - *Tithe* — enemies steal marks; *Ledger* — each kill compounds run loot;
  - *Famine* — no rest/pulse; *Gilt* — loot doubled, enemies +HP;
  - *Echoing* — every enemy telegraphs the Heart's echo; *Interest* — enemies
    heal each round; *Audit* — a Court noble joins every third fight.
- Enemy scaling escalates per stratum; the chase is the **deep-record** (deepest
  stratum reached), banked to the codex and the daily-style leaderboard.
- **The Deep Court**: 6+ new nobility enemies (the Auditor, the Usurer, the
  Assessor, the Chamberlain, the Collector, the Notary) and periodic **Court
  Guardians** every few strata.

### Combat formation (front/back rows)
- The party fights in **two rows**. Front row takes melee and shields the back;
  back row is protected but exposed to reach/aoe/back-line hunters. You place
  delvers at outfitting and can **shift** rows in combat (an action).
- Vanguards anchor the front; Arcanists/Alchemists want the back; some Deep Court
  enemies specifically hunt the back line, making placement a live decision.

### Gear tier IV + relic sets
- Undervault-only materials and **tier IV gear** (crafted at Forge L3 + a new
  Undervault forge upgrade). **Relic sets**: 2-piece / 4-piece bonuses reward
  committing to a theme (the Warden's Regalia, the Auditor's Ledger…).

### Polish
- Combat camera (subtle zoom on crits/kills, row parallax), richer death & loot
  ceremonies, an Undervault audio layer (a ledger-tick metronome under the drone),
  affix banners on the run HUD.

---

## v8.0 — "Legends of the Maw"
**Theme: the company becomes legend; the game becomes a keepsake.**

### Legendary delvers
- Hand-authored **unique heroes** with signature kits, portraits, and backstories,
  recruited through multi-step questlines that thread the whole story:
  *Corvo One-Arm* (the Warden who lost an arm to the First Warden), *The
  Cartographer's Daughter*, *Petra's Apprentice*, *the Nameless Pilgrim*. A
  **Hall of Legends** in the Charter Hall records who served and how they fell.

### Mastery & the Forge, deepened
- **Gear enchanting**: reforge a piece for a prefix/suffix affix (crit, lifesteal,
  ward-on-hit, +stat). **Class mastery**: each class earns permanent tiny buffs as
  its delvers accumulate kills/levels across charters.

### Options, accessibility & records
- **Options screen**: game speed (1×/2×/instant combat log), **difficulty presets**
  (Story / Standard / Brutal) separate from Ascension, **colorblind palettes**,
  reduced-motion, full keyboard play, combat auto-resolve for trivially-cleared
  fights.
- A proper **records hall**: lifetime numbers, per-run history, best scores,
  every achievement in a gallery with rewards.

### The capstone
- **Title sequence** + transition wipes + a final particle/lighting pass.
- A **"true ending"** that unlocks once all three Heart endings have been reached
  (across charters/Ascensions): a fourth epilogue and a New-Game++ seal.
- Full credits; the codex completed becomes a keepsake page.

---

## Delivery discipline (unchanged from 1.0–5.0)
Each version: design → build → **headless tests green** (the suite only grows) →
**browser smoke test with screenshots, zero console errors** → save migration →
CHANGELOG + patch notes → commit + tag + push → republish the playable artifact.
