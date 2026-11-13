# The talents (2026-11-03)

All 99 pressed talents play a sound. `game/talent-map.json` maps each ability id to a sound the game has; 15 new family sounds fill the gaps, in `game/fight-talents.ogg` (8.7 s, 72 KB, 15 sounds), loaded for every class. Most of it is layered from the Survival studio's recordings: the hits, the ripostes, the roar, the bow shot, the poison pot, the sail flap.

**Listen:** `preview.mp3`: holy hit 0:00, holy blast 0:00, roar 0:02, cleave 0:03, arcane bolt 0:04, fire small 0:04, blade charge 0:05, triple cut 0:06, thrown 0:07, clone 0:08, dark cut 0:09, flask 0:10, arrow rain 0:11, bow ready 0:12, owl swoop 0:12. On the phone page, Chapter 2, the row "The talents' sounds".

**Fixed after measuring:** the triple cut centred at 5 kHz (now 3 kHz, under 7 kHz); the small flame was heavy (now 35 % under 250 Hz).

**For Robin's ear (I cannot hear):** whether the holy ones read as holy; whether the roar, a man's yell, fits a cheerful Knight's berserker.

# The Warlord (2026-11-10)

Robin, 2026-11-10: "Yes" to the Warlord tree, which replaces the Paladin. `fight/talent-banner-valor`, `-banner-dread`, `-banner-war` (a pole knocked in twice and Robin's Survival sail flap B, each with its own colour: a bright bell, a dark string, a horn stab), `fight/talent-banner-all` (three plants and a horn chord, 1.3 s), `fight/talent-war-cry` (Robin's Survival war cry A with a heavy hit), `fight/talent-hold` (a short shout, a shield knocked), `fight/talent-roar` (the recorded berserk roar over a deeper one, high-passed). The cues `fight/effect-banner`, `-banners`, `-valorUp` are in the fight sprite. The map sends `war-valor`, `war-dread`, `war-war`, `war-all`, `war-cry`, `war-hold`, `war-roar` to them; the Paladin's seven ids are out. `fight/talent-holy-hit` and `-thrown` stay in the sprite, unused. `fight-talents.ogg` 126 KB, 23 sounds. `preview-warlord.mp3`.

# The Magician's reworked trees (2026-11-11)

Robin, 2026-11-11: "Yes" to Miles, GD's list. Made by `sfx/talents/_make_magician.py`; the Survival game's recordings (CC0) first.

| game name | file | what it is | length | phone |
|---|---|---|---|---|
| fight/talent-flare (wiz-combust) | talents/flare_1.wav | the recorded burning (fire_burn_man_a) swelling open under the fire arrow's rush (fire_arrow_a); no hit | 0.45 s | 44 % under 250 Hz |
| fight/talent-shift (spl-shift) | talents/shift_1.wav | shield_break_a sped up for the frost shattering, three falling bells, the game's own lightning, riposte_a and a heavy hit for the strike; fits both ways round | 0.56 s | 2 % low, 31 % high |
| fight/effect-stance | fight/effect_stance_1.wav | rune_ready_a (Robin's pick), an open fifth, one bell | 0.48 s | 79 % in 1-4 kHz |
| fight/effect-both | fight/effect_both_1.wav | storm_rise_a and the game's lightning, four bells falling, a wide chord | 0.86 s | 21 % low |
| fight/effect-light | fight/effect_light_1.wav | two soft bells, short so three in a row stay light | 0.30 s | 90 % in 1-4 kHz |

Mine: the library's lightning recordings are thunder (57 to 97 % under 250 Hz), which a phone loses, so Shift and Both use the game's own lightning (fight/lightning) instead.
Sprites: fight-talents.ogg 25 sounds, 135 KB; fight.ogg 80 sounds, 42 s, 311 KB. The map drops wiz-pillar and spl-tempest; 99 talents, none missing.

# The Rogue rework (2026-11-11)

Robin, 2026-11-11: yes to the Rogue's new talents; Miles, GD asked for two cues. Made by `sfx/talents/_make_rogue.py`; the Survival game's recordings (CC0).

| game name | file | what it is | length | phone |
|---|---|---|---|---|
| fight/talent-night-cut (sha-gloom) | talents/night_cut_1.wav | a quick shadowstep, riposte_a and the light slap hit_w: a lighter cut, no crit (mine: the vanish is the effect-dark cue after it) | 0.24 s | 5 % low, 33 % high |
| fight/effect-dark | fight/effect_dark_1.wav | shadowstep_a slowed and dulled, a soft low minor third; no bell | 0.47 s | 16 % low |
| fight/effect-reaction | fight/effect_reaction_1.wav | trap_poison_a's hiss, fire_arrow_a's rush, the recorded burning | 0.50 s | 26 % low |

Sprites: fight-talents.ogg 26 sounds, 137 KB; fight.ogg 82 sounds, 43 s, 319 KB. The map: 99 talents, none missing.

# The Hunter rebuilt (2026-11-13)

Robin, 2026-11-12: his design, yes to Miles, GD's talent list. Made by `sfx/talents/_make_hunter.py`. Recordings CC0: the Survival studio's sets, and its creature packs oga_creature1 and 2 (howl, barking_02, roar_04, attack_01, attack_05).

Talents (fight-talents): talent-rend (ran-rend), talent-bleed-dry (ran-bleed-dry), talent-call (bea-wolf, bea-bear, bea-viper, bea-stampede: the whistle; the cue follows), talent-kill-command (bea-kill), talent-snare-set (snare), talent-fire-pot (tra-mine), talent-venom-trap (tra-venom), talent-traps-all (tra-master). Kept: bea-stoop on talent-owl-swoop, spike-trap on ability-trap, tra-net on ability-snare (Net Toss).

Cues (fight): effect-pet-owl, effect-pet-wolf, effect-pet-bear, effect-pet-viper (mine: one per pet), effect-sprung, effect-stampede.

Pet strikes (fight), three variations each since they sound most turns: pet-wolf-1..3 (a bite: a snarl, the trap's jaws as teeth, a slap), pet-bear-1..3 (a swipe: a heavy rush, a grunt, the heavy hit), pet-viper-1..3 (a strike: a hiss, a fast light hit).

Phone: the first render of the stampede was 82 % under 250 Hz (the toms) and the viper's hiss 55 to 61 % over 4 kHz; the toms went up and high-passed, the hiss low-passed at about 3.3 kHz. All seventeen pass now.
Sprites: fight-talents.ogg 34 sounds, 179 KB; fight.ogg 97 sounds, 49.7 s, 370 KB (the budget is 60 s). The map: 97 pressed talents, none missing.
