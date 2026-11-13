# The sound

The first sounds are in the game (2026-11-01, chapter 1 step 3): Nigel, SD's UI sprite, `assets/sound/ui/ui.ogg` with its
spritemap `ui.json` (copied whole from his `out/sfx/ui/game/`; by the evening of 2026-11-01 17 names in three variants each: the die's shake, tumble and three candidate landings, `ui/tap`, `ui/tap-denied`, `ui/choice`, the chest's shimmer, six bursts, card and ding; his levels against the die's landing in his NOTES.md),
loaded with the board and played through `client/src/audio.ts`: `audio.play(name)` plays a sprite entry, or one of a family's
variants (`ui/die-land` picks `-1` to `-3` at random), and is silent for a name no sprite holds yet; `audio.loop` for the
tumble; the sound setting and `?mute=1` keep everything quiet; the UI sprite plays at 0.8 of full (the UI bus under the fight
bus). `ui/die-land` is an alias for candidate B until Robin picks; the pick renames the winner `ui/die-land-1` to `-3` and the
alias goes. The scenes call these names (`sfx.play` in `client/src/feel.ts` goes to `audio.play`), made or not yet:
`ui/die-shake`, `ui/die-tumble` (looped), `ui/die-land` (rate by face), `ui/step-grass` (each step of a walk), `ui/tap-denied`
(a dimmed button, Roll while busy), `ui/level-up`, `ui/boss-down`, `ui/area-opened`, `ui/tap` on every button, `ui/choice`
on a lit spot, `ui/card` on a class card, and in the loot reveal `ui/chest-shimmer`, `ui/chest-burst-<rarity>` (common,
uncommon, rare, epic, legendary, unique), `ui/chest-card`, `ui/chest-ding`. Wave 1 is complete (2026-11-01 evening): `ui.ogg` holds 68 sounds (the die, taps, choice, steps, the chest, the banners, gold,
the shop and bag, errands, the chrome, online, the character screen, Begin) and `assets/sound/ui-spots/` the arrivals and the
spots (10); the fight sprite is `assets/sound/fight/`. A new cut drops in by copying the files again. ffmpeg is on the PC (Robin's yes, 2026-11-01:
`C:\dev\ffmpeg\bin`, on the PATH). The Sound Director's studio (Nigel, SD, Sonic
Pi 5, deliveries into `C:\dev\Zite\Sound Director\out/`) exists since 2026-10-31 and has not worked yet. **What the game
needs heard, in order, is `docs/sound-demands.md`** (the UI first, the fight second, then Cloverfield Meadows' music,
ambience and creature voices; each wave tagged with its chapter), with the formats and budgets the game can carry on a
phone: OGG Vorbis, short sounds as audio sprites under 1.5 MB each, music as seamless loops of 30 to 60 s under 1.5 MB,
the first load under 3 MB of sound, effects around −16 LUFS and music around −18.

**The fight's hooks** (wired 2026-11-01; Nigel, SD's `assets/sound/fight/fight.ogg` and `fight.json` landed the same evening with all 60 and play at full; the ability ids are those of
`rules/data/abilities.json`): `fight/begin` when the screen opens; on the round sent, `fight/swing`, `fight/charge`,
`fight/flee`, `fight/potion`, `fight/mana-potion` or `fight/ability-<id>` (the Knight's: heavy-blow, shield-bash,
war-cry, execute, rally, shield-wall); on the blow's frame `fight/hit-light`, `fight/hit-heavy` (a seventh of the
enemy's HP or more) or `fight/crit`, and the enemy's `fight/enemy-hit-light` or `-heavy` (a seventh of the hero's HP,
or a crit); `fight/miss`; `fight/guard-block`, `-dodge`, `-brace`, `-counter`; `fight/enemy-windup`; `fight/phase`;
`fight/meter-pip`; `fight/effect-<kind>` for stunned, weakened, poison, armoured, evade, mark, trap, skip, attackUp,
barrier, sureCrit, companion, windup, plus `fight/effect-poison-tick`, `fight/effect-drained`, `fight/heal`,
`fight/revive`; `fight/caught`; `fight/victory`, `fight/defeat`, `fight/drop`. The creature's voice by its id:
`creature/<id>/attack`, `/hit`, `/die` (the slime is `slime`).

**Music** (2026-11-01 evening): Nigel, SD's `music/meadows-board` (`assets/sound/music/meadows-board.ogg`, 2.27 MB, 141.6 s,
looped whole, -18.9 LUFS) plays on the board through an audio element at 0.7 with a two-second crossfade (`audio.music`);
the fight, King Goo and title themes wait on Robin's word on the board theme, since they quote its tune; the six creatures' voices
landed the same night (`assets/sound/creatures-meadows/`, 19 sounds: `creature/<id>/attack`, `hit`, `die` for slime, wolf,
bandit, wisp, wolf-alpha and thornwood-warden, plus `creature/thornwood-warden/surge` on the phase); the meadow bed waits on a
birds recording (a download, Robin's yes).

Still to come (chapter 1, step 7): the fight sprite loaded with the fight scene, music per area streamed through an audio element with a
crossfade on an area change and on a fight's start and end, ambience under it, the settings' mute and two volumes,
`?mute=1` for test pages, the audio unlocked on the first tap. The settings already carry a sound toggle that does nothing
yet, and the convention `?mute=1` is written down in `docs/state/pages.md`.

## Nigel, SD's render of 2026-11-02

New cuts of `ui`, `ui-spots` and `fight` (with the church's bell, the sting, the quest and log sounds, the dodge), and two new sprites loaded only when needed: `fight-classes` (the three classes' abilities and pips, for a class other than the Knight) and `creatures-forest` (the forest's six voices and steps, once it is open or entered). The borrowed names in `audio.ts` step aside by themselves. Robin's ear wanted on the phone: moss steps may nearly vanish, Grumblebark's death is 2.4 s on purpose. Held by Nigel, SD: the beds, and every theme including the forest's, until Robin has heard the meadows' board theme.

## Nigel, SD's drop of 2026-11-03

The new lands' voices as lazy sprites by folder (`creatures-honeyhill`, `-bogglemire`, `-frostcrown`, `-rootways`, `-kingswood`), found by the `creatures-*` glob; `creatures-forest` and `creatures-meadows` re-cut; `fight`, `fight-talents`, `ui` and `ui-spots` re-cut with the new effects, the ground steps and the Dream's five sounds. Music: `title`, `meadows-fight`, `king-goo` and `dream` (Robin: "fight good, Goo good, title good, Dream good", 2026-11-03). The fight theme's loop seam is 0.82 %FS; listen for a click on the phone.

## Nigel, SD's drop of 2026-11-13: the Hunter

`fight` re-cut (97 sounds, 49.7 s, 370 KB, 10 s under the 60 s budget) and `fight-talents` (34 sounds, 179 KB) with `talent-map.json`, copied whole from `out/sfx/fight/game` and `out/sfx/talents/game`. New in `fight`: `effect-pet-owl`, `-wolf`, `-bear`, `-viper` (no plain `effect-pet`), `effect-sprung` (the jaws, a chain, a hit), `effect-stampede` (1.1 s), and the pets' blows `pet-wolf-1..3` (a bite), `pet-bear-1..3` (a swipe), `pet-viper-1..3` (a strike). New in the talent map: `ran-rend` → `talent-rend`, `ran-bleed-dry` → `talent-bleed-dry`, `bea-kill` → `talent-kill-command`, `snare` → `talent-snare-set`, `tra-mine` → `talent-fire-pot`, `tra-venom` → `talent-venom-trap`, `tra-master` → `talent-traps-all`; `bea-wolf`, `bea-bear`, `bea-viper` and `bea-stampede` → `talent-call`, the Hunter's whistle, written so the pet's cue or the stampede plays right after it (the client waits 0.5 s). Kept: `bea-stoop` → `talent-owl-swoop`, `spike-trap` → `ability-trap`, `tra-net` → `ability-snare`. The gone talents are off the map; 97 pressed, 97 mapped. `effect-bleed` and `bleed-tick` unchanged. All pass his phone test.

Later the same day: the owl's blow, `pet-owl-1..3` (a wingbeat, the talons, a light hit, 0.14 to 0.17 s), so every pet's strike has its own; `fight` is 100 sounds, 50.3 s, 375 KB. A pet's crit plays the arrow's `crit` on top of its blow (Nigel, SD: it reads fine).