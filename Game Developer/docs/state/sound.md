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
uncommon, rare, epic, legendary, unique), `ui/chest-card`, `ui/chest-ding`. A new cut of `ui.ogg` and `ui.json` drops in by
copying the two files again. ffmpeg is on the PC (Robin's yes, 2026-11-01:
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

Still to come (chapter 1, step 7): the fight sprite loaded with the fight scene, music per area streamed through an audio element with a
crossfade on an area change and on a fight's start and end, ambience under it, the settings' mute and two volumes,
`?mute=1` for test pages, the audio unlocked on the first tap. The settings already carry a sound toggle that does nothing
yet, and the convention `?mute=1` is written down in `docs/state/pages.md`.
