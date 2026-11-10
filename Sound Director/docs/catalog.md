# Catalog: every piece and sound, where it lives, its state, what needs work

| Piece or sound | Where | State | What needs work |
| --- | --- | --- | --- |
| The die landing, candidates A, B, C (`die_land_a/b/c`, 3 variations each) | `out/sfx/ui/` (masters, `ui.json`, `preview.mp3`, `NOTES.md`); `out/sfx/ui/game/` (the sprite `ui.ogg`, `ui.json`, loose OGGs); sources `sfx/ui/die_land_*.rb`; refs `sfx/ui/ref/` | candidates, 2026-11-01, waiting for Robin's letter | the pick; then the shake and the tumble (wave 1's roll row) |
| The die's shake and tumble loop (`die_shake`, `die_tumble`, 3 variations each) | `out/sfx/ui/` and `out/sfx/ui/game/` (in `ui.ogg` with the landings); sources `sfx/ui/die_shake.rb`, `die_tumble.rb` | delivered 2026-11-01, waiting for Robin's ear | nothing known; move if Robin says the shake is dull or the tumble even |
| The taps, the choice and the chest (`tap`, `tap_denied`, `choice`, `chest_shimmer`, `chest_burst_<rarity>` x6, `chest_card`, `chest_ding`) | `out/sfx/ui/` and `out/sfx/ui/game/` (one sprite with the die); `sfx/ui/_make.py` writes the sources | delivered 2026-11-01, waiting for Robin's ear | the tap's feel after a hundred presses; whether six bursts read as six steps |
| The banners: level up, boss down, area opened (`level_up`, `boss_down`, `area_opened`) | `out/sfx/ui/`, in the same sprite; `sfx/ui/_make.py` | delivered 2026-11-01, waiting for Robin's ear | the boss down plays 1.3 dB under its target (the file is at its peak); the sprite's 60 s ceiling needs Miles, GD's call |
| Steps on grass (`step_grass`, 3) | `out/sfx/ui/`, in the ui sprite; source `sfx/ui/step_grass.rb` (Kenney's recordings, cut) | delivered 2026-11-01, waiting for Robin's ear | the surface by area later |
| The fight sprite (60 sounds: `sfx/fight/`) | `out/sfx/fight/` (masters, `fight.json`, three previews, `NOTES.md`); `out/sfx/fight/game/` (`fight.ogg`, `fight.json`); `sfx/fight/_make.py` writes the sources | delivered 2026-11-01, waiting for Robin's ear | whether Viking hits fit a storybook slime; Block as wood |
| Wave 1's second half (37 sounds: arrivals, spots, gold, shop, chrome, online, character screen) | `out/sfx/ui/`; `out/sfx/ui/game/ui.ogg` and `ui-spots.ogg`; `sfx/ui/_make2.py` | delivered 2026-11-01, waiting for Robin's ear | `ui/begin` a stand-in until the title; the coins' brightness |
| The meadows' board theme (`music/meadows-board`), G major, 122, 72 bars, 2:22 | `out/music/meadows-board/` (`meadows-board.ogg`, `full.mp3`, `NOTES.md`); source `music/meadows/meadows-board.rb`; master `work/meadows-board/full.wav` | in the game; Robin, 2026-11-03: keep it | |
| The meadows' creature voices (19) | `out/sfx/creatures/`, sprite in `game/`; `sfx/creatures/_make.py` | delivered 2026-11-01, waiting for Robin's ear | the bee's hover loop not made; other areas' voices later |
| Chapter 2: the classes' sounds (22) | `out/sfx/fight-classes/`, sprite in `game/` | delivered 2026-11-02, waiting for Robin's ear | |
| Chapter 2: the forest's voices and steps (24) | `out/sfx/forest/`, sprite in `game/` | delivered 2026-11-02, waiting for Robin's ear | moss may vanish on a phone |
| The talents' family sounds (15) and the map of 99 | `out/sfx/talents/`, sprite and map in `game/` | delivered 2026-11-03, waiting for Robin's ear | |
| The Pirate Isles', the Giants' Land's and the Buried Crown's voices (57) | `out/sfx/pirates/`, `giants/`, `crown/`, sprites in `game/` | delivered 2026-11-03, waiting for Robin's ear | |
| `fight/storm-bite`, `fight/ending-sting` | `out/sfx/fight/` | delivered 2026-11-03 | |
| The meadows' three candidates, A storybook, B jig, C adventure (about 1 min each) | `out/music/meadows-a-storybook/`, `-b-jig/`, `-c-adventure/` | archived 2026-11-03 (Robin: keep what we had) | |
| The chest, candidate Z (Zelda's shape) | `out/sfx/ui/chest_shimmer_z_1.wav`, `chest_reveal_z_1.wav`, `preview-chest-z.mp3` | in the game 2026-11-03 (Robin: "Yes Z!") as the shimmer and the rare and epic bursts | |
| The new Rogue's blood and bleed tick; night falls, morning, sleep | `out/sfx/talents/`, `out/sfx/fight/`, `out/sfx/ui/`, in their sprites; `preview-rogue-day.mp3` | delivered 2026-11-03 | |
| `fight/lightning` (the trinkets) | `out/sfx/fight/`, in `fight.ogg` | delivered 2026-11-03 | |
| Magic Power; the spell impacts (arcane, fire, holy) | `out/sfx/talents/`, `out/sfx/fight/`, in their sprites | delivered 2026-11-03 | |
| Robin's "fill the holes": the voices of 28 creatures in five lands, five surges (Grumblebark's in the forest), six effects, the quest board, steps on stone, planks, snow, mud, sand | `out/sfx/honeyhill/`, `bogglemire/`, `frostcrown/`, `rootways/`, `kingswood/`, sprites in `game/`; effects in `fight`, board in `ui-spots`, steps in `ui` | delivered 2026-11-03 | |
| `music/meadows-fight` (E minor, 140, 0:55), `music/king-goo` (C minor 3/4, 132, 1:03), `music/title` (G, 108, 0:36), `music/dream` (D Lydian, 96, 1:20) | `out/music/<name>/` | in the game; Robin, 2026-11-03: all four good | the fight's seam measures 0.82 %FS on the war drum |
| The Dream's sounds: `ui/ferry`, `ui/dreamgate`, `ui/wake`, `ui/dreamdust`, `ui/dreamdust-buy` | `out/sfx/ui/`, in `ui-spots` | delivered 2026-11-03 | |
| The Warlord's banners and shouts (7) and cues (3) | `out/sfx/talents/`, `out/sfx/fight/`, in their sprites; map in `talents/game/talent-map.json` | delivered 2026-11-10 | |
