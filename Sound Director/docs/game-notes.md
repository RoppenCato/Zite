# The game: its places and states, and how it plays our files

The brief is `C:\dev\Zite\board-world-game-brief.md`; the game's list of every sound it needs, in waves, is its
`docs/sound-demands.md` (Miles, GD, 2026-11-01, at Robin's request). Nothing in the game plays a sound yet (2026-11-01); the
settings screen has a sound toggle waiting for the audio layer, which Miles, GD builds when the first drop lands.

## The budgets (Miles, GD, confirmed 2026-11-01 at Robin's ask; Robin, 2026-11-01: the GD confirms what sizes sounds and music can be)

- **Format: OGG Vorbis at 48 kHz** (the studio's own rate; the phone's audio context runs at 48 kHz and the browser resamples
  anyway). Encoded at the studio with ffmpeg and libvorbis: quality 4 for effects in mono, quality 4 for music in stereo
  (about 128 kbps), quality 5 only where a piece suffers. **The WAV masters stay in `work/`**: git ignores WAVs, so a WAV in
  `out/` would never reach the game.
- **Short sounds as audio sprites**, one `.ogg` plus one `.json` per wave (`ui`, `fight`, `creatures-<area>`), 50 ms of
  silence between sounds, each sprite under 1.5 MB and 60 s. The JSON in the audiosprite form the game loads straight,
  in seconds:
  ```json
  { "spritemap": { "ui/tap": { "start": 0, "end": 0.15, "loop": false }, "ui/die-tumble": { "start": 0.2, "end": 0.8, "loop": true } } }
  ```
  `loop` true only for the few that loop (the die's tumble, the bee's hover).
- **Music is streamed** through an audio element, so memory is no ceiling; disk and the first load are. The title loop 30 to
  45 s and under 1 MB (it is in the first load). **An area's board theme up to 2.5 minutes and under 2.5 MB: written long,
  as Robin likes.** Its fight theme 45 to 60 s (heard in bursts); its boss and town themes 60 to 90 s; an area's music in all
  under 6 MB, loaded when the player enters the area and kept by the service worker after.
- **Loudness:** effects peak -3 dBFS and sit around -16 LUFS; music around -18 LUFS; 5 ms fades on both ends of every
  effect; no clicks. The UI set a touch quieter than the fight set.
- **The first load** (the title loop, the UI sprite, the fight sprite) under 3 MB.
- **Names** as the game gives them: lower case, hyphens, the group first (`ui/die-land`, `fight/hit-heavy`,
  `creature/jelly-slime/hit`, `music/meadows-board`, `ambience/meadow`); variants `-1`, `-2`, `-3`.
- **The Survival game's effects under Zite's names are fine** (Miles, GD, 2026-11-01), each with its source and licence in
  `NOTES.md` (Kenney is CC0; Robin's own are his). **The four that carry the game are made new and ours: the die landing, the
  chest's bursts, the level up and the boss down.**
- **Delivery:** `out/<name>/` with the files, the sprite JSON and `NOTES.md` (what each sound is, when it plays, loop points,
  loudness, the Sonic Pi source's name). Miles, GD copies the folder whole into the game's `assets/sound/` and wires it in.

## The names the code already calls (Miles, GD, 2026-11-01; the sprite's names must match)

| Name | When the game plays it |
| --- | --- |
| `ui/tap` | every button pressed |
| `ui/choice` | a lit spot tapped after a roll with more than one place to go |
| `ui/card` | a class card chosen on the character screen |
| `ui/die-land-b-1` to `-3` (until Robin picks; then `ui/die-land-1` to `-3`) | the die lands; one of three at random, the game's pitch by face on top |
| `ui/chest-shimmer` | the glow starts to build, about 0.75 s before the lid moves; **a tap cuts it short, so it must be able to stop early** (a fade-out the game can apply, nothing that depends on reaching its end) |
| `ui/chest-burst-common`, `-uncommon`, `-rare`, `-epic`, `-legendary`, `-unique` | the frame the lid is fully open; gold-only chests use `-common` |
| `ui/chest-card` | a card slides out (each card of a chest with several prizes) |
| `ui/chest-ding` | the card rests |
| `ui/level-up`, `ui/boss-down`, `ui/area-opened` | the banners: the level up and the boss down are two of the four big moments; the area opened is the fifth, a swell, softer (Miles, GD, 2026-11-01, later) |

**The drop as the game takes it** (Miles, GD, 2026-11-01): `out/sfx/ui/game/` is copied whole as the game's `assets/sound/ui/`,
so `ui.ogg` and `ui.json` are **the one growing pair** for wave 1: every new UI sound is added to the same spec (`sfx/ui/_sprite.json`)
and the pair rebuilt, never a second sprite for the wave. The die goes in with his step 3, the moments.

**Variations and sprites** (Miles, GD, 2026-11-01, on the studio's proposal): one variation for anything heard less than once a
minute (the banners, the bursts, the arrivals, the shop and bag, the character screen), three for what is heard every turn (taps,
steps, the die, hits). A one-variation sound carries the plain name (`ui/boss-down`); three carry `-1` to `-3`. A second sprite,
`ui-spots.ogg` with `ui-spots.json`, holds the arrivals and the spots; a third, `ui-chrome`, if `ui.ogg` still presses 60 s. The game
finds a name in whichever sprite holds it, so names never change when a sound moves files. `sfx/ui/_sprite-spec.js` holds the table.

## How the game will play them (Miles, GD's plan, 2026-11-01)

Phaser's sound manager plays the sprites, loaded with the scene, through a `play(name)` on the events the scenes already
have (a tap, a roll, a step, a hit, a chest). Music per area streams through an audio element with a two-second crossfade on
an area change and on a fight's start and end; ambience under it. The settings get a mute and two volumes (music, effects);
`?mute=1` silences test pages; audio is unlocked on the first tap, since phones play nothing before a gesture.

## The places (from the brief and the game's `docs/world-content.md`, 2026-11-01)

Twelve region archetypes by tier, Cloverfield Meadows first: Puddlewick Village is the start, the mobs are the Jelly Slime,
Grumpy Sprout, Bumbling Bee, Mushroom Muncher and Meadow Bandit, the boss King Goo (a huge slime in a tiny stolen crown).
Chapter 2 is Wobblewood Forest (Grumblebark), chapter 3 Honeyhill Fields (Queen Bumble); then Glimmerlake Shores,
Moonwhisper Woods, Thunderstone Highlands, Sunfall Expanse, Frostveil Peaks, Thornhollow Wilds, Starfall Dominion,
Embercrown Mountains and the Shattered Crown. The tone: charming before grim, cheerful early, mysterious and more dangerous
farther out. The board is looked at most; fights are their own side-view screen; everything is judged at phone size.

## The fight's names (Miles, GD, 2026-11-01; `client/src/scenes/FightScene.ts`)

`fight/begin`; on the round sent `fight/swing`, `charge`, `flee`, `potion`, `mana-potion`, `ability-<id>` (the Knight's: `heavy-blow`, `shield-bash`, `war-cry`, `execute`, `rally`, `shield-wall`); on the blow's frame `fight/hit-light`, `hit-heavy`, `crit`, `enemy-hit-light`, `enemy-hit-heavy`, `miss`; `fight/guard-block`, `-dodge`, `-brace`, `-counter`; `fight/enemy-windup`, `phase`, `meter-pip`; `fight/effect-<kind>` (stunned, weakened, poison, armoured, evade, mark, trap, skip, attackUp, barrier, sureCrit, companion, windup, poison-tick, drained); `fight/heal`, `revive`, `caught`, `victory`, `defeat`, `drop`. Voices: `creature/<id>/attack`, `hit`, `die`. The fight sprite plays at full, the UI sprite at 0.8 under it. The game calls `ui/card` and will want it with the character screen's sounds.

**Music's names** (Miles, GD, 2026-11-01): `music/meadows-board`, `music/meadows-fight`, `music/king-goo`, `music/title`, `ambience/meadow`; one file per piece, streamed, under the sizes above.

**Chapter 2's names** (Miles, GD, 2026-11-01): `fight/meter-pip-trickster`, `-wizard`, `-archer` (the plain `fight/meter-pip` stays the Knight's); `fight/meteor-land` for Falling Star's landing, two rounds after `fight/ability-meteor`; `fight/ability-<id>` for the 18 class abilities; sprite `creatures-forest` holds `creature/<id>/attack`, `hit`, `die` for spider, treant, outlaw, wraith, spider-queen, briar-king, and the steps `ui/step-roots-1..3`, `ui/step-moss-1..3`, loaded with the area.

**The lands' names** (Miles, GD, 2026-11-02): sprites `creatures-pirates`, `creatures-giants`, `creatures-crown` under his `assets/sound/`, loaded with the land. `fight/storm-bite` (every storm bite) and `fight/ending-sting` (when the Hollow King first falls) go in the **`fight` sprite**, not the lands': when packing, level them into `out/sfx/fight/` and take them out of `creatures-giants` and `creatures-crown`. Surges use his phase hook.

**No ambience beds** (Robin, 2026-11-03: "Nah we dont need ambient sound"): `ambience/meadow` and the area beds are dropped. Music and effects only.
