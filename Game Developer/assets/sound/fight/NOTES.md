# The fight sprite (2026-11-01)

**Why.** Miles, GD's step 4, wave 2 of `docs/sound-demands.md`, under the names his fight scene already calls. Robin, 2026-11-01: the Survival
game's sounds first. So every blow is one of Robin's picks from that game, and the rest is layered from its recordings. The bells, strings and
horn are the studio's, and are used only for what no recording can be: the tunes and the magic.

**Listen:** on the phone page, Chapter 1, three rows. Every sound in the sprite is in one of them.

- `preview-fight.mp3` (16 s), a staged fight: the opening 0:00, a hit 0:01, Guard well 0:02, Block 0:03, a heavy hit 0:04, the enemy's heavy blow
  on Brace 0:05, a crit 0:06, a miss 0:06, Dodge 0:07, Counter 0:08, Charge 0:08, Mighty Swing 0:10, the second phase 0:11, the victory 0:13, the drop 0:15.
- `preview-abilities.mp3` (14 s): Mighty Swing 0:00, Shield Bonk 0:01, Battle Hymn 0:01, Finishing Flourish 0:03, Second Wind 0:04, Castle Stance 0:06,
  Honey Tonic 0:07, Moon Dew 0:08, flee 0:09, caught 0:10, defeat 0:11.
- `preview-effects.mp3` (15 s): stunned 0:00, weakened 0:01, poison 0:02, a tick 0:02, armoured 0:03, evade 0:04, mark 0:04, trap 0:05, skip 0:06,
  attack up 0:07, barrier 0:08, sure crit 0:09, companion 0:09, windup 0:10, drained 0:11, heal 0:12, revive 0:13.

## Where each sound comes from

| Game's name | Made from | Survival verdict |
| --- | --- | --- |
| `fight/hit-light-1..3` | `hit_w`, as it is | **Robin's pick** (2026-10-20) |
| `fight/hit-heavy-1..3` | `heavyhit_x`, as it is | **Robin's pick** |
| `fight/swing-1..3` | `swing_e`, three speeds | **Robin's pick** (E) |
| `fight/enemy-hit-light-1..3`, `-heavy-1..3` | `hit_club_v`, `heavyhit_club_v`, as they are: blunt, so the enemy's blow differs from the hero's | **Robin's picks** |
| `fight/guard-block` | `block_a`, as it is (wood, though the brief asked for a clang) | **Robin's pick** |
| `fight/guard-counter` | `parry`, as it is | "parry and block are good" (2026-10-15) |
| `fight/crit-1..3` | `hit_w` with the Survival `crit` and a wooden snap on top | layers of picks |
| `fight/miss-1..3`, `fight/guard-dodge`, `fight/effect-sureCrit` | `swish_seax`, `dash`, `tele`, as they are | play in that game, never judged |
| `fight/effect-trap` | `trap_arm_a`, as it is | candidate, never judged |
| `fight/ability-heavy-blow` | `overhead_a` (his pick), swing F slowed, heavy hit and guard break at 0.3 s | layered |
| `fight/ability-shield-bash` | the club's hit, a tom pitched up, the shield's wood bouncing twice | layered |
| `fight/ability-execute` | sweep, two ripostes (his pick), a parry and a slap | layered |
| `fight/ability-shield-wall` | stone break (his pick), slowed, rock split, grit | layered |
| `fight/guard-brace`, `fight/caught` | the club's knock, the low thud under it, a recorded man's grunt (HaelDB, CC0) | layered |
| `fight/enemy-windup`, `fight/ability-rally`, `fight/revive`, `fight/effect-windup` | the shadowstep's recorded breath, with strings or bells | layered |
| `fight/potion`, `fight/mana-potion` | recorded drops (fishing's `fish_bite_a`) as glugs, a breath as the sigh; bells for the Moon Dew | layered |
| `fight/effect-poison`, `-poison-tick`, `-stunned`, `-armoured`, `-evade`, `fight/flee` | the recorded drip and hiss; stagger with bells as stars; parry cut short; dash; Kenney's grass steps | layered |
| `fight/begin`, `fight/victory`, `fight/defeat`, `fight/ability-war-cry`, `fight/phase`, `fight/charge`, `fight/heal`, `fight/meter-pip`, `fight/drop`, `fight/effect-weakened`, `-mark`, `-skip`, `-attackUp`, `-barrier`, `-companion`, `-drained` | the studio's horn, bells, strings, a reed, toms and wood knocks | **new**: tunes and magic |

All recordings are CC0 or free for any use, and their authors are credited in `C:\dev\SG\Game Developer\assets\sfx\free\CREDITS.md` and each set's `ref/README.md` in the
Survival studio (BigSoundBank, qubodup, Independent.nu, EZduzziteh, HaelDB, rubberduck, Kenney, remaxim).

## What the phone taught

Five of the Survival fight's sounds are almost nothing but low end: `hurt` 100 % under 250 Hz, `stagger` 99, `slam` 99, `heavytell` 97, `finish` 96. On that game's
PC speakers they were weight; on a phone they nearly vanish. They were never plain picks of Robin's. So they stay only as a quiet layer under a sound that lives in the
mids: Brace went from 96 % low to 5 %, the wind-up from 78 to 26, the opening from 77 to 37. The second phase stays the lowest at 61 %, on purpose, with its chord
carrying it on a phone. I cannot hear; these are measurements, and the phone is for Robin's ear.

## Levels and the files

Levelled by the hearing-weighted measure against the die's land (`out/sfx/ui/die_land_a_1.wav` at 1.0), targets in `sfx/fight/_levels.json`. The ladder of blows: enemy light
-4.5 dB, hero light -3.5, enemy heavy and hero heavy about -2.5 and -2.1, crit 0.2, the big abilities up to +3. The hero's hits needed their ladder set by measure: at the same
gain `hit_w` measures 1.1 dB louder than `heavyhit_x`.

`game/fight.ogg` and `game/fight.json`: **60 sounds, 31.6 s, 228 KB**, OGG Vorbis quality 4, mono, 48 kHz, 50 ms between sounds, every sound with 5 ms fades, the loudest at -3 dBFS.
Three variations for the swing, the hits, the crit, the miss and the enemy's blows; one for the rest (Miles, GD). With `ui.ogg` (154 KB) the first load is 382 KB before the title loop.

`tools/sprite.js` changed today: it now scales every sprite by a fixed -2 dB rather than normalising each to -3 dBFS, so levels hold between sprites. `ui.ogg` came out the same.

## For the game (Miles, GD)

Copy `out/sfx/fight/game/` as `assets/sound/fight/`. Every name your fight scene calls is there. The creature voices (`creature/slime/...`) will come as their own sprite,
`creatures-meadows`, in your order.

## For Robin's ear

- **The tone.** The hits are the sharp fleshy slap of a Viking game, on a jelly slime in a storybook meadow. Robin asked for them, and they are the sounds he picked by ear, but this is the
  biggest open question here: do they fit Enchanted Kingdoms, or should a slime be hit softer?
- Whether Block as wood is right, since the brief asked for a clang. Whether the grunt on Brace fits a cheerful game.
- Whether the victory is a tune, and whether the defeat is sorry rather than grim.
