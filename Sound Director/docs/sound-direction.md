# Sound direction

The direction for the board world game, distilled into rules to check work against. Written 2026-10-31 from the Survival
game's sound direction (Robin, 2026-10-05 the brief, 2026-10-14 Sonic Pi) and from what Robin's ear taught that studio
(`docs/maple-guide.md` section 7). The sentence and the places are mine until Robin says yes; the rules are his.

## The sentence (mine, 2026-10-31, for Robin)

**MapleStory in a bright fantasy board world: a few clearly drawn instruments playing tunes you hum; a theme and a key for
every region of the map; the map itself wide and inviting, towns warm, fights quick and driving but never ugly, bosses big.**

## 1. The instruments (the map from GM voices to Sonic Pi, in `music/_lib.rb`)

| Voice | Studio instrument | How it is built |
| --- | --- | --- |
| flute | `flute` | `:sine` + `:tri` (octave up, 0.25) with a 0.06 s attack, slow vibrato by `control`, breath: `:noise` through a band filter at the note, very quiet |
| clarinet | `clarinet` | `:pulse` at half width through `:lpf` 90, attack 0.05 |
| piano | `piano` | `:piano`, `vel` 0.25 to 0.5 and `hard` 0.4 to 0.7 varied per note, `stereo_width` 0.3 |
| celesta, musicbox | `bell` | `:pretty_bell` an octave up, release 0.8, a `:sine` two octaves up at 0.15 for the shimmer |
| harp | `harp` | `:pluck` `coef` 0.25, with a soft `:sine` behind it at 0.2 for warmth |
| strings | `strings` | `:blade` or `:dsaw` `detune` 0.1 through `:lpf` 85, attack 0.4, release 0.8, quiet; a pad never leads |
| brass, horn | `music/_fight.rb` | saws through a low-pass (a triangle reads as a flute, 2026-10-15) |
| bass | `bass` | `:fm` `depth` 0.6 `divisor` 1 plus `:sine` an octave up at 0.3; release 0.35; sits under C3 |
| shaker, rim, kick | `shaker`, `rim`, `kick` | light; the kick dry, never through the reverb |

One lead at a time. A lead and an answering voice may share a section (flute and bell), never two leads in the same octave.

## 2. The places (mine, 2026-10-31; the game decides which exist)

| Place | Heard for | Tempo and key | Model in the studies (`docs/maple-guide.md` section 6) |
| --- | --- | --- | --- |
| The world map, by region | long stretches: the player rolls, moves, looks | 118 to 135, a key of its own per region | Ellinia, Aquarium, Orbis for bright regions; Sleepywood, El Nath for dark or cold ones; Ant Tunnel (minor) for caves and ruins |
| A town | a minute or two at a time | 105 to 130 | Lith Harbor, Ludibrium: a pedal opening, the middle voice, a sus held |
| A shop, an inn | short | 100 to 120 | a thinner cousin of the town's theme, the same key |
| A fight, by region | one to two minutes | 116 to 140 | a ramp of a few seconds, then drums from the first bar; the region's key, its minor or Dorian |
| A boss | a few minutes | 116 to 130 | a ramp played once and an intense loop; big and broad, no happy relative-major chords |
| The title | first thing heard | 100 to 120 | the game's hook, hummable; the one theme every region's theme can quote |
| An event, a shrine, a treasure | a sting or a short loop | | stings in the region's key |

Robin's rule for the studies holds: the region's colour is in the mode, the tune and the lead voice (the Survival game's
"Viking in the tune, not the instruments", 2026-10-14), but when Robin names a game as the reference the arrangement follows
it.

## 3. Composing

- Tempos 100 to 140 for the map, the towns and the fights; 70 to 90 only where a place is meant to be slow (a cave, a
  night region). Keys: one per region; the tracks of one region share a key family so the map theme, the fight and the town
  crossfade without a clash.
- Form: 64 to 100 bars, two to three minutes a loop (`docs/maple-guide.md` section 2), full from the first sixteen bars
  (Robin, 2026-10-14), the breakdown and the return as the one big event, the hook back late and varied, a short tail.
- The hook: two to four bars, one rhythmic cell, stepwise with a leap at the phrase end, chord tones on the strong beats, said
  twice with a changed ending. If it cannot be hummed from the written notes, it is not a hook yet.
- Harmony: maj7 on I and IV, m7 on ii, iii, vi, a dominant seventh or a sus4 on V; loops of two to four chords; one borrowed
  chord per piece as colour; a sus before a cadence.
- Three registers, each with a job: bass below E3, the busy middle voice E3 to E4, the lead E4 and up, sparse.
- Percussion light or none on the map and in towns; real drums in a fight (a low drum, toms, a frame drum under sustained
  strings and a horn); never a drum machine, never a pulsing saw (the "80s retro" fault, 2026-10-15).
- Dynamics from a seeded stream: amplitude varies 5 to 10 percent, timing 5 to 12 ms on the lead and the harp, less on the
  bass, none on the kick. A phrase climbs in loudness to its highest note and falls off.

## 4. One mix, no layers

**Robin, 2026-10-14: the music will just be what it is.** A track renders to one `full.wav`, exactly the loop length,
seamless. No layer that reacts to the game; a fight has its own track. A boss is a ramp (`<name>-intro`) played once and a
loop.

## 5. Mixing and rendering

- Peak under -1 dBFS in every file; RMS of the full mix between -22 and -16 dBFS. No limiter work (`set_volume!` stays at
  its default; never raise `set_drive!`). Fight pieces at master 1.0, place pieces at 0.6, then measure (2026-10-15).
- One reverb for the room (`mix` 0.25 to 0.35, `room` 0.6 to 0.8) around the lead, bell and harp; a smaller one around the
  piano; the bass dry or nearly; the kick dry.
- Every instrument has a register of its own: bass below C3, piano comp C3 to C5, harp C4 to C6, lead C5 to C6, bell C6 up.
- The loop length is bars times beats at the bpm; rendered as two passes and the second cut out. The seam is checked.
- 48 kHz 24-bit from the engine; the delivery is a 48 kHz 16-bit WAV (the master) and a 160 kbps MP3 (what the game loads;
  Chrome keeps the encoder's 1105 samples of delay at the head, so the game loops from 1105 to 1105 + `loop_frames`). Every
  delivery's notes give the file's size.
- **The phone:** listen on the phone page before calling it done. The tune must carry on a phone speaker; the bass is heard
  as a line, not felt as a weight.

## 6. Sound effects

- The game's sounds (mine, 2026-10-31, until the game has them): the die rolled and landing, a step on the board, a space
  resolved (a chest, a shrine, an event), a fight's attacks by class (a sword, a dagger chain, a spell charged and loosed, a
  bowshot), a hit, a crit, a block, a monster's cry and death, a level up, a purchase, a town freed, a boss gate, the UI's
  taps. Each must read at a glance on a phone speaker.
- Short: 60 to 400 ms, up to 1.2 s for a roar or a big spell. Three variations each (seeded), so repeats are not identical.
- Named as the game names them (`hit_sword_1.wav`), mono unless the sound has width, peak-normalised to -1 dBFS, trimmed to
  the first and last sample above -60 dBFS.
- **From a reference, always** (2026-10-15): a recording Robin likes, or candidates for him to pick from. Synthesis from
  Sonic Pi's built-ins alone missed every time it had no reference. **Not cyber**: pure sines, clean noise and a pitch slide
  are what lasers are made of; a real strike is layered impact samples at different rates, a plucked body, filtered brown
  noise, two or three micro-hits a few milliseconds apart.
- Layers each with one job: the front (the crack, under 10 ms, above 1 kHz) is the loudest moment; the body under it; weight
  only on heavy sounds and never leading; a tiny tail. No limiter.
- A set is levelled against itself (`tools/sfx-level.js`): the first set delivered is the anchor the later ones are levelled
  against; `docs/pipeline.md` says which.

## 7. The check (before a delivery)

1. Does the hook come back, and can it be hummed from the written notes?
2. One lead at a time; every part in its own register; nothing doubled for thickness.
3. Is it full from the first sixteen bars, and does the breakdown-and-return land?
4. Does the loop seam pass, and is there a sound on beat one?
5. Peak and RMS within the numbers; the limiter untouched; the file's size in the notes.
6. Does it belong to its place, and does it sound like no other region's theme (its own key, lead voice and rhythmic cell)?
7. Was it heard on the phone, and did Robin get it from the chat, with what changed written in plain words with the date?
