# The talents (2026-11-03)

All 99 pressed talents play a sound. `game/talent-map.json` maps each ability id to a sound the game has; 15 new family sounds fill the gaps, in `game/fight-talents.ogg` (8.7 s, 72 KB, 15 sounds), loaded for every class. Most of it is layered from the Survival studio's recordings: the hits, the ripostes, the roar, the bow shot, the poison pot, the sail flap.

**Listen:** `preview.mp3`: holy hit 0:00, holy blast 0:00, roar 0:02, cleave 0:03, arcane bolt 0:04, fire small 0:04, blade charge 0:05, triple cut 0:06, thrown 0:07, clone 0:08, dark cut 0:09, flask 0:10, arrow rain 0:11, bow ready 0:12, owl swoop 0:12. On the phone page, Chapter 2, the row "The talents' sounds".

**Fixed after measuring:** the triple cut centred at 5 kHz (now 3 kHz, under 7 kHz); the small flame was heavy (now 35 % under 250 Hz).

**For Robin's ear (I cannot hear):** whether the holy ones read as holy; whether the roar, a man's yell, fits a cheerful Knight's berserker.

# The Warlord (2026-11-10)

Robin, 2026-11-10: "Yes" to the Warlord tree, which replaces the Paladin. `fight/talent-banner-valor`, `-banner-dread`, `-banner-war` (a pole knocked in twice and Robin's Survival sail flap B, each with its own colour: a bright bell, a dark string, a horn stab), `fight/talent-banner-all` (three plants and a horn chord, 1.3 s), `fight/talent-war-cry` (Robin's Survival war cry A with a heavy hit), `fight/talent-hold` (a short shout, a shield knocked), `fight/talent-roar` (the recorded berserk roar over a deeper one, high-passed). The cues `fight/effect-banner`, `-banners`, `-valorUp` are in the fight sprite. The map sends `war-valor`, `war-dread`, `war-war`, `war-all`, `war-cry`, `war-hold`, `war-roar` to them; the Paladin's seven ids are out. `fight/talent-holy-hit` and `-thrown` stay in the sprite, unused. `fight-talents.ogg` 126 KB, 23 sounds. `preview-warlord.mp3`.
