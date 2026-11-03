# The Survival game's sound library: what is there, what Robin picked, what Zite can use

Robin, 2026-11-01: "Reuse sound effects from my other game; there are sounds like hitting, shooting a bow and so on. Whenever
you need a new sound, check if those could be used." This is the list to check first. Written by Nigel, SD on 2026-11-01 from
`C:\dev\SG\Sound Director\out\sfx\` (the studio's deliveries) and `C:\dev\SG\Game Developer\assets\sfx\keep.txt` (what the
Survival game plays: Robin's picks, locked in 2026-10-20 and added to through 2026-10-25). The studio's notes on each set
are in `C:\dev\SG\Sound Director\out\sfx\<set>\NOTES.md`; the picks and verdicts in its `docs\feedback.md`.

Every file there is 48 kHz 16-bit mono WAV, peak -1 dBFS, three or four variations (`<name>_1.wav` ...), with a gain per sound
in the set's JSON, levelled by a hearing-weighted measure against the old combat hit (`hit_1.wav` at 0.417). All recorded
material is CC0 or "free for any use"; the credits are in `C:\dev\SG\Game Developer\assets\sfx\free\CREDITS.md` and each
set's `ref/README.md`. Robin's own two swings (`assets/sfx/robin/`, 24 kbps MP3) are his; their source and licence are his to say.

## How a library sound is used here

1. Find it below; read its row in the Survival game's `docs/feedback.md` so Robin's verdict is known.
2. Copy the WAVs into `out/sfx/<category>/` under **this game's name** (Miles, GD's names: `fight/hit-light`, not `hit_w`).
3. Re-level it against this game's set (the first set delivered here becomes the anchor; `docs/pipeline.md` says which).
4. Convert to the format Miles, GD confirms (`docs/sound-demands.md`); say in `NOTES.md` where it came from, Robin's verdict,
   the licence, and what was changed (trim, level, speed).
5. Never move or rename the original: the Survival game's keep-list names it.

## The sets, and what Zite's sound demands they could serve

A **pick** is a sound Robin chose by ear and the Survival game plays. A **candidate** was delivered and never judged, or sits
beside the pick as an unchosen option (still good material: Robin judged against another sound, not against nothing).

| Set | Sounds | Robin's picks | Could serve in Zite (Miles, GD's list, `docs/sound-demands.md`) |
| --- | --- | --- | --- |
| `flesh` (24 files) | `hit_w` the slap, `hit_x` the punch, `hit_y` the wet one, their `heavyhit_`; `pain_boar_w`, `pain_wolf_w`, `pain_deer_w`, `pain_snake_w` | **`hit_w`** the light hit, **`heavyhit_x`** the heavy hit, the four **pain** cries (2026-10-20) | the fight's light hit and heavy hit; a bandit's "oof"; the wet slap and splats are the start of the slime voices (Jelly Slime, King Goo) |
| `combat` (60 files, Sonic Pi layers) | `parry`, `crit`, `broken`, `stagger`, `dash`, `hurt`, `die`, `slam`, `finish`, `heavytell`, `perfect`, `tele`, `chain_2` to `_4`; the weapons' `swish_seax`, `_spear`, `_axe`, `_club`, `_greataxe` | **parry and block** liked (2026-10-15: "parry and block are good"); the rest plays in the game unjudged; the old `swing` and `hit` turned down | Counter (the parry), the crit's crack, a miss's whiff (the swishes), Dodge (dash), Brace (hurt), the enemy's wind-up (heavytell, tele), a stun, the Knight's Mighty Swing (`swish_greataxe` plus a heavy hit), the fight's end (`die`) |
| `assets/sfx/free` | `swing_e`, `swing_f` (the swishes), `block_a`, `raise_e`, `raise_f`, `chop_a`, `clink_a`, `treefall_a` | **E** the light swing, **F** the heavy swing (2026-10-15), **block A**, **raise E and F**, chop, clink and treefall A (2026-10-20) | the attack's swing, Block (a clang on a shield: `block_a` is wood, so a candidate), the guard coming up, a chest's creak from `raise`'s leather |
| `chapter1` (15 files) | `hit_club_v`, `heavyhit_club_v`, `logthud_v`, `boxbreak_v`, `wave_v` | **`hit_club_v`**, **`heavyhit_club_v`** (Shield Bonk's "comic bonk" is a club hit), **`boxbreak_v`** ("a nice snappy comforting sound"), **`wave_v`** | the common chest's "wooden pop" (`boxbreak_v`), a step on wood, Shield Bonk, a water spot's splash (`wave_v` cut) |
| `bow` (4 files) | `shoot_b` (a recurve's snap; a, c and v archived) | **B** (2026-10-23) | the Archer's attacks and the class card's bowstring (chapter 2; the class card in wave 1) |
| `ui` (20 files, Kenney RPG Audio) | `talk_open_f`, `talk_next_e`, `book_open_b`, `book_close_c`, `book_page_b` | all five his picks (2026-10-22) | the hint's page turn, the atlas or a sheet opening and closing, the message line's tick (`talk_next_e`, already 3 dB soft for repetition) |
| `runes` (206 files) | 35 ability and rite sounds, each as `a` (a plain recording) and `v` (layered): war cry, berserk roar, last stand, riposte, guard break, blink step, leap land, lunge, whirl, overhead, sweep, twin shot, pin shot, fire arrow, rock split, slide, cudgel thud, storm gather and rise, lightning, rune carve, wake and ready, stone break, blood drip, altar lay, sacrifice stab, fire burning, shield break, axe throw and catch, trap throw, land, arm, snap, poison, shadowstep | Robin picked the **plain recording (a)** every time he judged: nine of nine in the trial, and altar_lay, lightning_small, rune_ready, blink_step, leap_land, overhead, riposte, war_cry, stone_break | the four classes' abilities: Battle Hymn (war cry), Finishing Flourish (riposte, whirl), Second Wind (last stand), Castle Stance (stone break, rock split); the Trickster's dagger chain (twin shot, slide, shadowstep); the Wizard's charge (storm gather, rune ready, lightning); Archer (pin shot, fire arrow); Stun (cudgel thud); Burn (fire); the meter full (rune wake) |
| `weather` (29 files) | rain light, rain, rain heavy, rain on water, thunder, gust, a splash, steps on snow, mud and wet sand | **thunder A**, **step on snow B** (2026-10-23); the rest plays as `a` | Frostveil's steps (snow), a rainy real-weather day, the meadow bed's breeze (gust), a spring's splash |
| `ships` (25 files) | oar, oars, sail filling, sail flapping, the hull's creak, the keel on sand and off | oar A, sail fill A, sail flap B, creak B (2026-10-23) | Glimmerlake Shores (tier 2); the creak for a chest's lid or a wooden door |
| `fishing` (56 files) | cast, plop, bite, reel (a 2 s loop), splash, snap, land, as a, b and v | not yet judged (2026-10-25); he had picked plain recordings every time before | Glimmerlake; a water spot; the die's tumble could borrow the reel's loop only as a last resort |

Not in the library, so to be made or found new: everything the die does (shake, tumble, land), taps and chips, grass and road
steps, the arrival sounds (a town's bell, a shop's till, a shrine's chime), the chest's shimmer and the heavier bursts, coins,
the fanfares (level up, boss down, area opened, victory, defeat), the stings, the spell effects (chill, poison tick, heal,
barrier), potions, the creature voices beyond slimes and a bandit, every bed but the breeze, and all music. The Survival
game's music is Viking and its own (`C:\dev\SG\Sound Director\out\music\`); its studies and Robin's rules carry over, not the
tracks.

## What the library taught, in one line each (the long form is `docs/sfx-notes.md`)

- Robin picks plain recordings over layered versions nearly every time; lead with a recording, layer only to fix it.
- A swing is a low-mid "whoom" at 300 to 400 Hz that builds to the contact, never a high hiss.
- A hit's slap or crack sits in the 1 to 4 kHz octaves and is its loudest moment; a thump with no slap reads as "a bump".
- Repeated sounds (a line of talk, a tap) sit a few dB under what he first liked, or they wear.
- The licence and the origin of every recording are written down at delivery, not later.
