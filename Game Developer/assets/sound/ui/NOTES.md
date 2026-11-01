# The die landing: three candidates (2026-11-01)

**Why.** Robin, 2026-11-01: start with the die landing. Miles, GD's brief (`docs/sound-demands.md`, wave 1): the land is the beat of
the game, one sound, bright, under 0.5 s; the game pitches it a little by the face; one of the four sounds that carry the game
(the die landing, the chest's bursts, the level up, the boss down), so made new and ours, not taken from the Survival library.
Nothing in that library is a die; what it had was recordings of wood, and a die lands on a wooden board, so the three candidates
are built from those recordings (credits and measurements in `sfx/ui/ref/README.md`; all CC0). Nothing was downloaded.

**Listen:** `preview.mp3` (14 s): A three times (0:00), B three times (0:03), C three times (0:07), then one of each in a row (0:10),
all at their set gains. On Robin's phone page: the **Chapter 1** tab, the row "The die lands: A, B and C"; under **Sounds** each
candidate has one button per variation.

## The three

| Candidate | Files | What it is | Measured (3 variations) |
| --- | --- | --- | --- |
| **A** `die_land_a` | 3, 0.13 s | **A plain clack**: a recorded wood clack (rubberduck's `wood_hit_06`, 3.4 kHz, sped up 12 %) as the die's corner on the board, and one smaller bounce 68 ms later (`wood_hit_01`, sped up 30 %). The nearest thing to a bare recording. | attack 1.8 ms; 30 dB down by 118 ms; centre 3.4 kHz; 1 % under 250 Hz, 47 % in 1 to 4 kHz, 36 % over; weighted loudness -14.0 dB |
| **B** `die_land_b` | 3, 0.28 s | **The die on the board**: A's clack with the board's own knock under it (`wood_hit_05`, 558 Hz, high-passed at 280 Hz so it is a board, not a floor, at a third of the clack), a second lighter bounce at 118 ms (Kenney's light wood impact, sped up 40 %), and a few grains of wood settling from 150 ms (`wood_falling_02`, quiet). | attack 1.5 to 1.8 ms; 30 dB down by 138 ms; centre 3.2 kHz; 1 % under 250 Hz, 53 % in 1 to 4 kHz; -13.9 dB |
| **C** `die_land_c` | 3, 0.30 s | **The lucky die**: B with a small bright chime on the landing (one `pretty_bell` note at a sixth of the clack's level, G6, A6 or B6 by variation, with a faint sine an octave up), the storybook glint Miles, GD called the dopamine. The only synthesised thing in the set. | attack 1.5 to 2.6 ms; 30 dB down by 290 ms (the chime's tail); centre 2.6 to 2.9 kHz; 0 % under 250 Hz, 68 to 74 % in 1 to 4 kHz; -12.9 dB |

Each has three variations: the speed moves ±4 %, the bounces' timing ±6 to 8 ms, and C's chime changes note, so a die rolled a
hundred times is never the same twice. Everything sits under a plain low-pass at 8.9 kHz so it is bright but never glassy, and the
clack is the loudest moment in every one (`docs/sfx-notes.md`).

**What I think (mine, for Robin to decide).** B is the die: it has the board in it and settles like a real die, and it leaves
room for the game's pitch-by-face to do its work. C is the gamble: the chime makes every roll a small reward, which is what Miles,
GD asked for, but it is also the one thing here that is not a recording, and Robin has picked the plain recording over the layered
one nearly every time in the Survival game. A is the safe fallback if B reads as too much.

## Levels and the files

- `die_land_<L>_1.wav` to `_3.wav`: 48 kHz 16-bit mono, the WAV masters, each peak -1 dBFS (`ui.json` has the set: files, lengths,
  gain). Levelled against each other by the hearing-weighted measure (a high-pass at 100 Hz, +4 dB above 1.5 kHz, the loudest
  50 ms): gains A 1.0, B 0.977, C 0.871, so the three sound equally loud and a pick changes the sound, not the level. **This set
  is the anchor every later Zite set is levelled against** (`--anchor out/sfx/ui/die_land_a_1.wav:1.0`; written in `docs/pipeline.md`).
- `game/`: what the game loads. `ui.ogg` (2.58 s, 26 KB, OGG Vorbis quality 4, mono, 48 kHz) holds all nine with 50 ms between
  them; `ui.json` is the spritemap in the game's form (`{ "spritemap": { "ui/die-land-a-1": { "start": 0, "end": 0.1316, "loop": false } } }`,
  seconds). The whole set is scaled once so its peak is -3 dBFS (Miles, GD's rule), with 5 ms fades at both ends of every sound.
  The nine are also there as loose files, `ui-die-land-a-1.ogg` and so on, 5 to 7 KB each. Made by `tools/sprite.js` from
  `sfx/ui/_sprite.json`.
- I do not measure LUFS. The weighted loudness of the loudest 50 ms is -13 to -14 dB on the masters; Miles, GD sets the UI bus a
  touch under the fight bus as his file says, and the first drop in the game is where that gain gets set by ear.
- `preview.mp3`: 213 KB, 128 kbps, for listening only.

## For the game (Miles, GD)

Copy `out/sfx/ui/game/` whole. Until Robin picks, play **B** (`ui/die-land-b-1` to `-3`, one at random); the game's pitch-by-face
applies on top. When he picks, the winner is renamed `ui/die-land-1` to `-3` in the next sprite and the others leave the sprite;
the rest of wave 1 joins the same `ui.ogg` as it is made. The shake and the tumble are the next two sounds.

## For Robin's ear

- Does it read as a die at all, and as a die on wood? If it reads as a knock on a door, the body is too much (B, C) or the clack too
  low: say so and I move it.
- A or B against C: is the chime a pleasure or a toy? It is quiet on purpose; it can go louder, higher or away.
- The phone: all three are above 1 kHz, where a phone speaker is honest, so the phone should lose nothing here.

The phone page: https://claude.ai/artifact/RbeCB5EqixKqLrj4TCYa8m (the Chapter 1 tab, and Sounds).

# The roll before the landing: the shake and the tumble (2026-11-01, the same evening)

Made in B's family while Robin listens to the three landings (his "start with the die landing"; Miles, GD's order has the roll's
three sounds together). Both from the same recorded wood, no oscillator.

**Listen:** `preview-roll.mp3` (14 s): four whole rolls as the game plays them, the shake, the tumble looping, the land: with B
(0:00 and 0:03), with A (0:07), with C (0:10). On the phone page: Chapter 1, the row "The roll: shake, tumble, land".

| Sound | Files | What it is | Measured |
| --- | --- | --- | --- |
| `die_shake` (`ui/die-shake-1` to `-3`) | 3, 0.33 to 0.40 s | the die shaken in a cupped hand: five to seven small knocks against the fingers in 0.35 s, uneven and a touch quicker toward the throw, muffled by the hand (a low-pass at 2.8 kHz), a faint rustle of skin under them | attack 4 ms; centre 850 Hz, 75 % in 250 Hz to 1 kHz, nothing over 4 kHz: the colour of a closed hand |
| `die_tumble` (`ui/die-tumble-1` to `-3`, **loop**) | 3, padded to exactly 0.600 s in the sprite | the die tumbling over the board: six bright clacks (the land's own pieces, smaller and quicker), uneven as a die rolls; the last tail is gone by 0.54 s, so the loop's wrap-around gap is 100 ms, like the gaps inside it | attack 1.5 ms; centre 3.2 to 3.5 kHz, 55 % in 1 to 4 kHz, 1 % under 250 Hz: the land's colour, a step quieter |

**Levels**, against the anchor (`die_land_a_1.wav` at 1.0, weighted): the shake 8 dB under the land (gain 0.442: it is inside a hand),
the tumble 4 dB under (gain 0.709: smaller knocks). The game's pitch-by-face applies to the land only.

**For the game (Miles, GD):** `game/ui.ogg` now holds fifteen sounds (shake 3, tumble 3, the nine landings), `ui.json` the
spritemap; the tumble entries are `loop: true` and exactly 0.6 s each. Play `ui/die-shake-<n>` as the die is picked up, start
`ui/die-tumble-<n>` looping when it leaves the hand, stop it on the frame the die lands and play the land. The shake runs 0.33 to
0.40 s; if your shake animation is shorter, cut it with a 20 ms fade, nothing in it needs its end.

**For Robin's ear:** whether the shake reads as a hand (it is deliberately dull) or as a knock in the next room; whether the tumble
is too even, or too bright beside the land. Both are easy to move.

# The taps, the choice and the chest (2026-11-01, the same evening)

Twelve sounds, three variations each, written from one spec (`sfx/ui/_make.py`). Robin told Miles, GD to go on with the next steps,
so these follow the die without waiting for its letter. Every knock is recorded wood (`sfx/ui/ref/README.md`); the bells are the
studio's pretty bell, in C pentatonic (C D E G A) so they sit over any region's key; the swells are the studio's strings.

**Listen:** `preview-chest.mp3` (25 s): the six chests as the game plays them, each the shimmer, the burst 0.75 s later, the card, the
ding: common (0:00), uncommon (0:03), rare (0:07), epic (0:10), legendary (0:14), unique (0:17); then three taps (0:21), two denied
taps (0:22), three choices (0:23). On the phone page: Chapter 1, the row "The chest, six ways, and the taps"; each sound under Sounds.

| Sound (the game's name) | Length | What it is | Level against the die's land |
| --- | --- | --- | --- |
| `tap` (`ui/tap`) | 50 ms | a soft wooden tick (Kenney's light impact, faster), under 4.4 kHz: plain, since it is heard a hundred times an hour | -10 dB (gain 0.31) |
| `tap_denied` (`ui/tap-denied`) | 120 ms | two dull knocks 70 ms apart, under 1.6 kHz: a quiet no, no buzzer | -12 dB (0.296) |
| `choice` (`ui/choice`) | 87 ms | two bright ticks 45 ms apart, the second higher and a touch louder: a small lift | -6 dB (0.491) |
| `chest_shimmer` (`ui/chest-shimmer`) | 1.5 s | twelve small bells running up C pentatonic over 1.4 s, each louder, glitter above, a soft string swell under; no event at its end, so a tap's fade can cut it anywhere | -8 dB (0.18) |
| `chest_burst_common` | 0.11 s | the lid's pop: a hollow knock, a warm knock, the latch's click; recorded wood only. Gold-only chests too | -2 dB (0.583) |
| `chest_burst_uncommon` | 0.5 s | the pop and one bell, G5 | -1 dB (0.583) |
| `chest_burst_rare` | 0.72 s | the pop and two bells rising a third, C6 E6 | 0 dB (0.639) |
| `chest_burst_epic` | 1.0 s | the pop, three bells rising C6 E6 G6, a soft string chord under | +1 dB (0.677) |
| `chest_burst_legendary` | 1.8 s | the fanfare: the pop, a run up to C7 held as a chord, glitter, strings swelling for two seconds | +2 dB (0.654): the loudest UI sound |
| `chest_burst_unique` | 1.33 s | its own: the pop, then a strange open chord of bells (D6 A6 E7, fifths stacked) over a low dark string; old and particular, not big | +2 dB (0.709) |
| `chest_card` (`ui/chest-card`) | 0.26 s | Kenney's page flip a third faster, under 7 kHz: card and paper | -8 dB (0.544) |
| `chest_ding` (`ui/chest-ding`) | 0.42 s | one bell, C6 E6 or G6 by variation: the full stop | -4 dB (0.214) |

The six bursts climb in length, in brightness and in level together (0.1 s and -2 dB to 1.8 s and +2 dB), so rarity is heard before
it is read. The shimmer rendered at 1.6 s and is held to 1.5 s with a fade at the cut, as the brief's length says.

**For the game (Miles, GD):** `game/ui.ogg` and `ui.json` now hold 51 sounds (17 names, three each), 16.5 s, about 170 KB: the die,
the taps, the choice, the chest. The shimmer may be stretched by rarity as you planned; it has no end event. The level up, the boss
down and the area opened come next in the same pair.

**For Robin's ear:** the tap most of all, since it is the sound he will hear most: is it pleasant the hundredth time, or should it be
softer or duller? Whether the six bursts read as six steps of rarity, and whether the unique one reads as special or merely odd.
Whether the shimmer is a glow or a music box. The bells are the one synth voice here; if they read as too much, the pop alone is the
common burst and the others can lose a bell each.

# The banners: the level up, the boss down, the area opened (2026-11-01, the same evening)

Three sounds for Miles, GD's banners, in the same spec (`sfx/ui/_make.py`). Two of them are big moments, so each has a tune, not a
run: a cell of short short short long that the two share, the level up rising on bells, the boss down the same cell inverted on a
horn, so the two are kin and neither is the chest's bells running up.

**Listen:** `preview-banners.mp3` (22 s): the level up twice (0:00, 0:02), the boss down twice (0:05, 0:08), the area opened twice
(0:11, 0:14), then a boss down and an area opened as they come in the game (0:17). On the phone page: Chapter 1, the row "The
banners: level up, boss down, area opened".

| Sound (the game's name) | Length | What it is | Level against the die's land |
| --- | --- | --- | --- |
| `level_up` (`ui/level-up`) | 1.5 s | G5 C6 E6 then a held G6 on bells, strings doubling, a chord swelling under the held note, glitter on it | +1 dB (gain 0.485) |
| `boss_down` (`ui/boss-down`) | 1.93 s | C5 G5 E5 then a long C6 on a horn (two saws and a low triangle through a low-pass), a low drum on the first and the last note, strings under, bells only on the last | wanted +3 dB; **the file is already at its peak, so it plays at +1.7 dB (gain 1.0)**: the loudest UI sound, and Miles, GD may give it a little more in the game |
| `area_opened` (`ui/area-opened`) | 1.92 s | strings rising from a low C to a wide C major with the ninth over 1.2 s, bells shimmering up through it late, no knock, no drum | -4 dB (0.292): the fifth moment, softer |

The boss down is 40 % under 250 Hz (the drum and the horn's low triangle); a phone loses that weight and keeps the horn's phrase,
which is the point. The first render merged its three variations because the boom sample's own tail runs for seconds; it is now cut
to half a second.

**For the game (Miles, GD):** `game/ui.ogg` is 47.8 s and 328 KB with 60 sounds (20 names). **The 60 s sprite ceiling is near**: wave 1
has about 60 names, so at three variations each the UI sprite would run to some 150 s. Either the UI wave becomes two or three sprites
(`ui.ogg` the die, the taps and the chest; `ui-spots.ogg` the arrivals and the spots; `ui-chrome.ogg` the rest), or the one-shot
moments (the banners, the bursts, the arrivals) carry one variation instead of three, which they can: nobody hears a level up twice in
a minute. My suggestion is both: one variation for anything heard less than once a minute, and a second sprite for the arrivals and
the spots. Miles, GD decides; the spec changes in one line either way.

**For Robin's ear:** whether the level up is a tune you could hum after a week of hearing it; whether the boss down is big enough
without being long; whether the area opened is a swell or a sigh.

# The steps on grass (2026-11-01, late)

`step_grass` (`ui/step-grass-1` to `-3`): Kenney's grass footsteps (CC0, on this PC in the Survival studio's `sfx/world/ref/kenney/`),
three of the five, played as recorded, cut to under 0.13 s with a short fade, under a 7 kHz low-pass. Robin's library-first rule:
nothing made, a recording chosen. 65 to 123 ms; soft (centre 550 to 830 Hz, a third under 250 Hz); 9 dB under the die's land
(gain 0.372), since a walk plays one every 260 ms. The surface changes by area later (wood, road, roots, moss, snow).

**Listen:** `preview-turn.mp3` (8 s): one whole turn as the game plays it: the roll (shake, tumble, land B), eight steps on grass at the
game's pace, a rare chest (the glow, the lid, the card, the ding). On the phone page: Chapter 1, the row "One whole turn".

The sprite now: `game/ui.ogg` 21.6 s, 154 KB, 41 sounds, 21 names.

# The rest of wave 1: arrivals, spots, gold, shop and bag, chrome, online, the character screen (2026-11-01, night)

37 sounds, one variation each (Miles, GD: heard less than once a minute), written by `sfx/ui/_make2.py`. Wave 1 is now complete.

**Listen:** `preview-spots.mp3` (11 s): town 0:00, shop 0:01, spring 0:02, shrine 0:03, chest found 0:04, wild 0:06, boss spot 0:06, flask filled 0:08, shrine teaches 0:08, an empty spot 0:10.
`preview-rest.mp3` (20 s): coins gained and a few 0:00, purse lost 0:01, buy 0:02, sell 0:03, errand taken 0:03, errand done 0:04, trainer 0:05, wear 0:06, take off and drop 0:07, the pick chips and a chip 0:08, hint and message tick 0:09, sheet open 0:10, close 0:11, online join 0:11, leave 0:12, reconnect 0:13, note 0:14, the card and the Knight's 0:14 to 0:15, Trickster and Wizard 0:16, Archer 0:17, Begin 0:17.

| Group | The game's names | Made from |
| --- | --- | --- |
| Arrivals and spots, in **`ui-spots.ogg`** | `ui/arrive-town`, `-shop`, `-spring`, `-shrine`, `-chest`, `-wild`, `-boss`, `ui/spring-fill`, `ui/shrine-teach`, `ui/spot-empty` | bells; the Survival splash and drops; **Robin's hull creak** for the chest found; Kenney's grass and the gust for the wild spot; a horn for the boss |
| Gold | `ui/gold-gain`, `-small`, `-lost` | Kenney's light metal impacts, pitched up as coins (no coin recording on this PC) |
| Shop and bag | `ui/buy`, `sell`, `wear`, `take-off`, `drop-item`, `errand-take`, `errand-done`, `trainer` | coins and wood; **Robin's leather straps** for wear and take off; the club's hit for the trainer |
| Chrome | `ui/hint`, `message-tick`, `sheet-open`, `sheet-close` | **Robin's four picks as they are**: the page, the talk's next line, the book opening and closing |
| Small | `ui/chip`, `ui/pick-appear` | wood knocks, a small bell |
| Online | `ui/online-join`, `-leave`, `-reconnect`, `-note` | bells and knocks, all quiet |
| Character screen | `ui/card`, `ui/card-knight`, `-trickster`, `-wizard`, `-archer`, `ui/begin` | a card on wood, with the parry's clink, a trap's snap, bells, **Robin's bow shot**; Begin a 2 s overture |

**Sizes:** `ui.ogg` 32.4 s, 225 KB, 68 sounds; `ui-spots.ogg` 6.2 s, 43 KB, 10 sounds. All recordings CC0 (Kenney, rubberduck, BigSoundBank through the Survival studio's credits).

**Mine, to revisit:** `ui/begin` is a stand-in phrase (C5 E5 G5, A5 G5, a held C6) until the title theme exists; the title will quote it or replace it. The coins are still bright (centre about 4.9 kHz, lowered from 7): that is where coins live, but they are the first thing to soften if they tire.

**For Robin's ear:** the coins, since gold comes often; the boss spot's low note (66 % under 250 Hz, so a phone mostly hears its upper part); whether the card sounds are worth keeping while only the Knight can be chosen.
