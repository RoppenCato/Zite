> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# Sound effects: what the research says, and the studio's method from it

Written 2026-10-15 after Robin's second verdict on the chop, mine, cut and build sounds ("missing the mark on all of
them; look online for tips on how it can be done nicely in Sonic Pi"). What was found, and the rules the third set
follows. The rules in `docs/sound-direction.md` section 5 still hold; these are more specific.

## 1. What is out there

There is no Sonic Pi tutorial for foley or impact sounds. Sonic Pi's own community makes drums, not axes: the kick
threads on in-thread.sonic-pi.net layer a click, a pitched pop and a sine body, and the advice that carries over is
"layer three or four short things that each do one job". Everything useful about impacts comes from general sound
design (game audio and film), and it agrees on one framework.

**An impact is four or five layers, each in its own frequency slot and its own job.**

| Layer | Job | Where it sits | How long |
| --- | --- | --- | --- |
| Transient | the first millisecond: tells the ear *that* something hit | broadband, bright | 1 to 10 ms |
| Body | *what* was hit: wood, stone, skin; the identity | low mid to mid (150 Hz to 1.5 kHz) | 50 to 200 ms |
| Sub (weight) | *how heavy*; felt more than heard | below 100 Hz | 50 to 150 ms for a tool strike |
| Detail | *what flew off*: chips, grit, splinters; realism | high (2 to 8 kHz) | 10 to 60 ms, may arrive late |
| Tail | the place: room, distance | spread | as long as the room; for a game tool, almost none |

Rules that came up again and again:

1. **Set the body first.** It is the anchor and usually the loudest layer; the others are fitted to it.
2. **One layer owns the low end.** Roll the lows off the body and the detail, or the bottom turns to mud.
3. **Line the transients up to the same frame.** Layers that are not aligned read as two hits. The one exception: the
   detail layer may land a few milliseconds late, for texture; the tail may run past the rest.
4. **Detail is a flavour, not a lead.** The commonest mistake is a high layer that dominates.
5. **Contrast makes weight.** A hit sounds heavy against silence before it, not by being loud; a short tail and a quick
   decay leave that silence for the next hit (and gameplay strikes come fast).
6. **Variation.** Several takes with small changes of pitch, timing and balance; the game picks one at random.
7. **Listen in context, against a reference.** The studio cannot listen; Robin is the ear, so each set ships with a
   note of which lever to pull.

## 2. What the first two sets did wrong, by that framework

- **Tonal bodies.** Both sets gave the body to a synth: sines, bells (set one), then plucked strings (set two). A
  Karplus-Strong pluck at 73 Hz is a bass note with a pitch; a bell is a bell. Real wood and stone have no pitch the
  ear can name. That is the "cyber" and the "missing the mark" in one: the body layer, the identity layer, was an
  instrument.
- **No weight layer of its own.** The thud was a brown-noise burst inside the same low-pass as everything else, so the
  low end was shared and muddy.
- **Transients not aligned.** The micro-hits were spread over 6 to 12 ms on purpose ("blade, then haft"); the ear
  heard a flam, not one strike.
- **Detail too present and too tonal** (pink-noise grains at the level of the body; a triangle "snap").

## 3. The studio's method for the third set

Only recorded samples and noise. No oscillator anywhere in a strike (a sine or triangle is allowed only in the sub
layer, where it is pitch-free to the ear, and even there a slowed drum sample is preferred).

| Layer | Sonic Pi material | Treatment |
| --- | --- | --- |
| Transient | `:tabla_tas1` (a skin slap), `:perc_snap2`, `:elec_tick`, at rate 1.3 to 2.5 | `sustain: 0.005..0.01, release: 0.02..0.03`; it must not ring |
| Body | wood: `:perc_door` (a wooden door) at rate 1.0 to 1.8; stone: `:perc_impact2` at 1.2 to 1.6; skin and earth: the toms | `finish` and `release` cut it to 80 to 160 ms; the sample's own room is cut with it |
| Sub | `:bd_boom` at rate 0.6 to 0.8, `:drum_tom_lo_hard` at 0.7 | under `with_fx :lpf, cutoff: 55..65`, 60 to 120 ms, quiet: felt, not heard |
| Detail | `:perc_snap` at rate 1.5 to 2.5 for chips and grit; `:pnoise` grains through a band-pass for dust and rustle | 15 to 30 ms after the strike, 20 to 35 percent of the body's level, two or three grains falling away |
| Tail | none; the game's cave can add its reverb | everything under one `with_fx :lpf, cutoff: 108..115` so nothing is glassy |

The envelope of the whole strike: the peak inside the first 5 ms, most of the energy gone by 120 ms, silence by
250 ms. The renderer trims and normalises each variation to -1 dBFS peak; the relative level between the four sounds is
set by hand (the mallet heaviest, the grass lightest).

Variation: three seeds per sound; the rate of the body moves 5 percent, the detail's timing 10 ms, the transient's
level 15 percent. Different enough to not sound like a machine gun, the same enough to be one tool.

## 4. The levers, sound by sound (for Robin's ear)

- **Chop:** the body is `:perc_door` pitched up to a log; if it reads as a door, the rate goes up (1.8 to 2.2) and the
  body shorter; if it reads thin, more `:bd_boom` under it.
- **Mine:** the body is `:perc_impact2` sped up; the clink is `:perc_bell` cut to 12 ms (a metallic click, no tone). If
  it rings, the clink goes; if it is dull, the clink's rate up.
- **Cut grass:** the one sound that is mostly noise by nature (air and fibre): a short band-passed swish, a soft snap
  (`:perc_snap2` slowed), rustle grains. If it reads as a hiss, the swish shorter and lower.
- **Build:** the body is `:perc_door` near its own pitch, with a quiet second knock 70 ms later (the mallet's bounce);
  the heaviest sub of the four. If it reads as the chop, the bounce louder and the body lower.

## 5. Sources

- Morphic, "How to layer sound effects": the four-layer table, body first, one layer owns the sub, align transients,
  detail may arrive late, mute layers one at a time.
- IRPR sound design guide, "How to add weight to impacts": low booms, transient cracks and tails as the three
  essentials; contrast and headroom; undo and try a lighter touch when a change does not work.
- in-thread.sonic-pi.net, the kick drum threads: layered click, pop and body; noise synths and filters as the building
  blocks; `:drum_heavy_kick` as a base to process.
- General game-audio practice (several forum and blog sources, 2026-10-15): short tails for gameplay; several
  variations played at random with a little pitch randomisation; the player's ear tires of a single file within minutes.

## 6. Swings (2026-10-15, Robin: "the swing sounds with the sword are really bad")

- **A swing is a build to one moment, the contact.** The game lands the blow 95 to 435 ms into the windup (the sword
  125 ms) and now times a swing so its loudest 10 ms falls on contact, cutting it at the hit. A swing that is loud from
  its first 10 ms and flat for 170 ms is a burst of hiss, not a blade passing; start 20 dB or more under the peak.
- **No resonant filter on noise.** A band-pass with a high res sweeping over noise is a pitched, synthetic wind: the
  same "cyber" colour Robin rejected in the music. Recorded whooshes (`perc_swoosh`, `ambi_swoosh`), trimmed so their
  own peak lands on the mark, or noise under plain low- and high-pass filters.
- **The mirrored pass:** a recorded whoosh played backwards swells into its own attack, so backwards-then-forwards
  (approach a little higher, going away a little lower) is a blade passing by construction.
- **Grains scheduled one by one under 10 ms apart come late** in the headless engine ("can't keep up") and smear
  into a tail: chop one noise with the slicer (`probability` for random grains) instead.

## 7. Robin's own swings: the reference (2026-10-15)

Robin on the four candidates: **"The sounds of the sword swing are all bad."** He then supplied two swings of his own
("Sword, axe or dagger, light swing - attack" and "... heavy swing - attack"; source and licence his), now the sword's
swing in the game (`C:\dev\Zite\Game Developer\assets\sfx\robin\`). Measured with `work/swing-compare.js` (read only):

| File | Length | Loudest | First sound under the peak | Centroid | Energy by octave band |
| --- | --- | --- | --- | --- | --- |
| Robin's light | 0.20 s | 53 ms after the first sound | 38 dB | 413 Hz | 79 % at 500 Hz (354 to 707), 16 % at 250 Hz, almost nothing above 1 kHz |
| Robin's heavy | 0.34 s | 81 ms | 37 dB | 307 Hz | spread from 62 to 500 Hz (26, 14, 24, 33 %), nothing above 1 kHz |
| our old swing | 0.24 s | 103 ms | 11 dB | 2789 Hz | 58 % at 2 kHz, 23 % at 4 kHz |
| swing_a | 0.19 s | 86 ms | 25 dB | 3192 Hz | spread from 500 Hz to 8 kHz |
| swing_b | 0.19 s | 64 ms | 22 dB | 121 Hz | 53 % at 62 Hz, 38 % at 125 Hz (too low: a rumble) |
| swing_c | 0.12 s | 74 ms | 24 dB | 5704 Hz | 46 % at 8 kHz |
| swing_d | 0.18 s | 77 ms | 21 dB | 3071 Hz | spread from 1 to 8 kHz |

What it says:
- **The colour was the miss.** Robin's swings are a low-mid "whoom", centred at 300 to 400 Hz. Every studio swing but
  one was a high hiss centred at 2.8 to 5.7 kHz (a "shhh" of air), and B went the other way, a rumble at 121 Hz. A swing
  is heard as the weight moving through the air, in the low mids, not as the air's hiss.
- **The shape is quicker than ours.** The light one rises from silence to its peak in about 50 ms (from 38 dB under)
  and is down 28 dB 40 ms later: one short "vwom". The heavy one is broader (a plateau from 60 to 100 ms, then a tail).
- A caution: his files are 24 kbps MP3s at 22 kHz, which can drop quiet high frequencies. It cannot explain the absence
  of everything above 1 kHz, but a little hiss on top may have been lost in the encoding.
- **For the other weapons** (on hold until Robin judges his two in the game): recorded material in his manner first;
  if Sonic Pi has to make them, aim at the low mids (a recorded whoosh pitched down two octaves or more, centroid 300 to
  500 Hz, a 40 to 50 ms rise and a quick fall), never the high band, and measure every candidate's centroid and band
  shares against his before Robin hears it.

## 8. The hit drowned its own detail (2026-10-15)

Robin: the sword's hit sounds off. The game's session measured it, and `work/swing-compare.js` agrees: `hit` is centred
at 104 Hz with 100 % of its energy below 250 Hz (35 % at 62 Hz, 65 % at 125 Hz); `heavyhit` the same at 107 Hz,
`hit_axe` at 149 Hz. The recipe had a slap, an iron tick and a slice of noise for the edge, but at those levels the kick
drum's body and the boom swallowed them: a thump with no slap or cut, which Robin's own swing (peaking on the hit at about
400 Hz) now covers. The parry he likes is centred at 3.2 kHz, most of it between 1 and 8 kHz.

- **Measure the band shares of every strike before delivery.** A hit on flesh needs its slap or crack in the 1 to 4 kHz
  octaves, clearly there, above the body; a body and a sub that hold all the energy are a thump.
- **Level by a hearing-weighted loudness, not plain RMS.** Plain RMS over-counts low thumps (they measure loud and sound
  quiet). The game's session levels its free recordings with a high-pass at 100 Hz and a 4 dB shelf at 1.5 kHz over the
  loudest 50 ms; `tools/sfx-level.js` should do the same before the next set (not changed yet: the gains in the game came
  from the plain measure).
- The game now offers free CC0 recordings (Kenney, OpenGameArt, qubodup) as choices beside ours, nothing replaced (its
  commit f783131, credits in its `assets/sfx/free/CREDITS.md`). When Robin picks, the winners' measurements are the target
  for the other weapons, as with his swings.

## 9. Robin's picks, and the other weapons from them (2026-10-15)

Robin: "Sword swing: E OpenGameArt a swish. Heavy hit: F OpenGameArt a heavier swish. Sword hit: The studios first."
So the sword swings on free recordings (E light, F heavy; credits in `sfx/combat/ref/README.md`) and hits with ours.
The other weapons' swings are made from E and F (`swish_*`): recorded material, the weight setting how low and long
(the playback rate), measured against E and F before Robin hears them (centre, octave shares, the loudest moment) and
levelled by a hearing-weighted loudness against E at its game gain (`tools/sfx-level.js --weighted --anchor`).
Rule: **when a recording Robin likes exists, derive from it** rather than building from Sonic Pi's built-ins; the four
built-in whooshes could not reach his colour.

## 10. The hit as a sharp fleshy slap (2026-10-16)

Robin: the hit reads as "a bump"; the reference is Valheim's melee hit on a creature, "a sharp fleshy slap". The game's
session set measurable targets (attack under 5 ms; centre 800 to 1600 Hz; a third or more of the energy from 1 to 4 kHz,
under a fifth below 250 Hz; 150 to 250 ms, 30 dB down by about 120 ms). Sonic Pi does have recorded slaps: **the tabla
strokes are a hand on skin** (`tas1` to `tas3` at 650 to 750 Hz, `na`, `na_s` at about 900, `te2` noisy at 1.8 kHz),
**`perc_snap` is a crack** (89 % between 2 and 8 kHz). Built from those (`sfx/hit_v/`), measured with
`tools/sfx-measure.js` after every render: the first pass had too much low end (the tom body) and too little bite, the
second too much above 4 kHz, the fourth landed. Rules: keep the low body small and short under a high-pass; start a
sample past its own build-up when its peak comes late (the snap, the `na` strokes); a plain low-pass near 6 kHz keeps a
hit sharp without hiss; in a layered sound, measure the attack as the time to within 3 dB of the peak.

## 11. Building from free recordings (2026-10-20, chapter 1)

Robin, after playing chapter 1: search online for free sounds, "it might be easier to get better sounds that way". What was learnt
putting them together:

- **Sonic Pi plays WAV, FLAC, OGG and MP3** as samples (its `sound.rb`), so a pack is layered straight from its folder. To
  measure a FLAC or an OGG, play the files one by one in a small file (`work/decode/`) and let `render-sfx.js` split them.
- **Look at the head of every file.** Some start with silence (rubberduck's `wood_slam_01` 20 ms, `wood_breaking_01` 67 ms):
  layered at once with a file that does not, the knock lands after the thump and the blow is soft (attacks of 18 to 28 ms).
  The split's trim times against the slots give the lead; `start:` skips it.
- **Kenney's "heavy" impacts are low thumps,** 98 to 133 Hz, all of it under 250 Hz; their wave swells for about 15 ms. Under a
  knock they add weight; louder than the knock they set the attack and the sound turns dull.
- **The attack measure follows the biggest sample,** and a low wave's samples are big. A blow whose knock is 10 to 20 dB under its
  thump's peak reads as slow even when the knock is at 1 ms: the knock must be the loudest moment.
- **An axe into a standing trunk is mostly low** (60 to 80 % under 250 Hz in the itch.io pack): real, but heard as a thud. A crisp
  knock on top (an axe on a log, 1.4 to 2.1 kHz) and a high-pass at 165 Hz under the trunk make the chop.
- **A recording's loudest moment is not its peak sample:** the felling's crash peaks at 2.894 s but its loudest 10 ms come at
  3.0 s. Timing to the game (the trunk lands at 0.95 s) uses the loudest 10 ms.
- **A pack may hold a copy:** the beach pack's fourth wave is its third with a longer tail (correlation 0.999).

## 12. Hits from real flesh (2026-10-20)

- **BigSoundBank's spanking (`bsb_1152`) is the sharp fleshy slap as a recording:** twenty hand slaps on skin, 20 to 50 ms
  each, 2.7 to 6 kHz, attacks of 1 to 2 ms. Under it a recorded punch for the impact and the middle of a fist into a body
  (qubodup's punches high-passed at 185 Hz); the low end small. That is `hit_w`.
- **Recorded levels differ by 30 dB and more between packs.** Layer from peak-normalised pieces, or the quiet one vanishes:
  the first `hit_w` had no slap in it at all.
- **Sonic Pi's `onset:` cannot be trusted for layering:** on some files its slice 0 is a near-silent sliver before the sound.
  Cutting each hit out of a decode render (the split trims at the sound's start) gives layers that start on their sound.
- **Sonic Pi here does not play MP3,** though its docs say it does: take FLAC, WAV or OGG.
- **A splat that peaks late makes a flam:** `impactsplat01` and `03` peak 17 to 60 ms in; only the quick one (`06`) works
  under a slap.

**Levels against the game's own sounds (2026-10-24).** A target in a set levelled with `--weighted --anchor hit_1:0.417`
is dB against the hit as the ear measures it. The combat set's own targets (`sfx/combat/_levels.json`: the dash -12, the
swing -11) are an older, plain measure and do not carry over: measured as the ear does, at their gains in the game, the
dash sits about 5 dB under the hit and the sword's swing E about 5.6 dB under. So "as loud as the dash" is -5, "heavier
than the swing" is -4 or above. When a sound must match one the game plays, level it against that sound itself (its file
and its gain as the anchor, target 0), then write the equivalent target against the hit into the spec.

**Robin picks the plain recording (2026-10-24).** Of the runes' two letters, he chose A, the recording cut at its sound, nine
times of nine (and B, a raw recurve, for the bow). Lead with the best single recording; a layered V is worth offering only
where no one recording does what the moment needs (the storm's gathering, a sound the game times to the frame).


## 13. The die landing, Zite's first sound (2026-11-01)

- **A decode's slot must be longer than its lead-in, or label by piece number.** The decode file sleeps 2 s before its
  marker; with 1 s slots `work/decode/label.js` found a latency of 0.877 s instead of 2.877 and named every piece two
  recordings off. The first three renders were built on a 590 Hz knock believed to be a 3.4 kHz clack (60 % of the energy
  under 250 Hz). Rule: slots of 3 s or more, or read `die_N` as recording N and check one piece by ear or by its length.
- **Wood for a die**: of 40 recorded knocks on this PC only rubberduck's `wood_hit_01` and `_06` (2.6 and 3.4 kHz, attacks
  under 3 ms) read as a small hard object; Kenney's impacts and footsteps are all heavy things on boards (under 260 Hz).

## 14. What the Survival fight sounds lose on a phone (2026-11-01)

- **Measure the band shares before reusing a sound for the phone.** `hurt` 100 % under 250 Hz, `stagger` 99, `slam` 99, `heavytell` 97, `finish` 96, `last_stand_a` 95, `cudgel_thud_a` 86. On a phone speaker these nearly vanish. Use them only under a sound that lives in the mids (a wooden knock, the club's hit, a recorded breath).
- **A normalised file can measure louder than a heavier one.** At equal gain `hit_w` is 1.1 dB over `heavyhit_x` by the weighted measure: set the ladder from the printed loudness, and check that a gain has not hit the ceiling of 1.0.
- **Recorded yells can start with a long silence** (HaelDB's `3grunt1`): `render-sfx.js` split it off as a second piece. Cut past the head (`sfx/fight/ref/cut/grunt.wav`).

## 15. Recorded roars on a phone (2026-11-03)

- rubberduck's roars and BigSoundBank's groans are mostly under 250 Hz. High-pass them at 330 Hz (`:hpf, cutoff: 64`) before anything else; a high-pass at 196 Hz left Old Snowshoulder at 86 to 94 %. Some recordings stay low whatever is done (roar_01, roar_02): swap the recording.
