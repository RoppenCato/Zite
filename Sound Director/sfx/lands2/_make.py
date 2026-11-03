# Robin, 2026-11-03: "fill the holes" (through Miles, GD). The voices of the 28 creatures that were silent, the great bosses' phase-two surges, in one sprite per land:
# creatures-honeyhill, -bogglemire, -frostcrown, -rootways, -kingswood; Grumblebark's surge joins creatures-forest. The ids are the game's (some are old internal
# names: ice-wolf is the Honey Blob), the sounds follow the creature's name. Recordings on this PC from the Survival studio, CC0, and Robin's Survival picks where
# they fit (the boar's and the deer's cries, the bow shot). Run: python -I sfx/lands2/_make.py. Nigel, SD, 2026-11-03.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HEAD = """# {name}: {desc}
# Written by sfx/lands2/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: {name}
# seconds: {secs}
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
R = "C:/dev/SG/Sound Director/sfx/flesh/ref/"
A = R + "oga_creature1/files/"
B = R + "oga_creature2/files/"
V = R + "bsb_voices/"
WET = R + "oga_wet_squish/files/impsplat/"
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :cut do |path, rate, amp, len|          # held to a length and high-passed at 330 Hz: a roar a phone can carry (docs/sfx-notes.md section 15)
  with_fx :hpf, cutoff: 64 do
    sample path, rate: rate, amp: amp, attack: 0, sustain: len * 0.65, release: len * 0.35
  end
end
define :knock do |piece, rate, amp|
  sample W + piece, rate: rate, amp: amp, attack: 0, sustain: 0.03, release: 0.05
end
use_random_seed {seed}
{body}
sleep {gap}
"""
# land -> { creature: (game id, attack, hit, die) }
HONEY = {
 "honeyblob": ("ice-wolf", 'sample C + "c2_slime_07.wav", rate: 0.85, amp: 1.0\nsample C + "c1_burble_02.wav", rate: 1.2, amp: 0.4', 'sample C + "c2_slime_03.wav", rate: 0.9, amp: 1.0', 'sample C + "c2_slime_08.wav", rate: 0.75, amp: 0.9\nat [0.1] do sample WET + "impactsplat04.mp3.flac", rate: 0.9, amp: 0.7 end'),
 "corngoblin": ("yeti", 'sample C + "c1_grunt_04.wav", rate: 1.3, amp: 1.0\nsample K + "footstep_grass_002.ogg", rate: 1.4, amp: 0.5', 'sample C + "c1_hurt_01.wav", rate: 1.3, amp: 1.0', 'sample C + "c1_grunt_03.wav", rate: 1.3, amp: 0.9\nat [0.15] do sample K + "footstep_grass_004.ogg", rate: 0.9, amp: 0.6 end'),
 "buzzbug": ("frost-wisp", 'with_fx :lpf, cutoff: 110 do sample C + "c2_bug_06.wav", rate: 1.0, amp: 1.0 end', 'sample C + "c1_bug_01.wav", rate: 1.5, amp: 1.0', 'sample C + "c2_bug_10.wav", rate: 0.8, amp: 0.9\nat [0.18] do sample C + "c2_bug_10.wav", rate: 0.55, amp: 0.5 end'),
 "applemimic": ("ice-golem", 'sample C + "c1_eat_01.wav", rate: 1.2, amp: 1.0\nknock "wood_hit_07.wav", 1.3, 0.5', 'knock "wood_hit_07.wav", 1.1, 0.9\nsample C + "c1_cute_06.wav", rate: 1.1, amp: 0.5', 'sample WET + "impactsplat05.mp3.flac", rate: 1.2, amp: 0.8\nknock "wood_hit_05.wav", 0.9, 0.7'),
 "scarecrow": ("yeti-elder", 'sample S + "runes/sweep_a_1.wav", rate: 1.1, amp: 0.6\nsample K + "footstep_grass_000.ogg", rate: 0.8, amp: 0.8\nsample C + "c1_grunt_05.wav", rate: 0.9, amp: 0.5', 'sample K + "footstep_grass_003.ogg", rate: 0.7, amp: 1.0\nknock "wood_hit_03.wav", 0.8, 0.6', 'sample K + "creak2.ogg", rate: 1.1, amp: 0.8, attack: 0, sustain: 0.3, release: 0.2\nat [0.25] do sample K + "footstep_grass_001.ogg", rate: 0.6, amp: 0.9; knock "wood_hit_05.wav", 0.7, 0.6 end'),
 "queenbumble": ("frost-matriarch", 'sample C + "c2_bug_10.wav", rate: 0.7, amp: 1.0\nsample C + "c1_bug_04.wav", rate: 0.6, amp: 0.6', 'sample C + "c1_bug_01.wav", rate: 0.8, amp: 1.0\nsample C + "c2_bug_06.wav", rate: 0.7, amp: 0.5', 'sample C + "c1_bug_04.wav", rate: 0.5, amp: 1.0\nat [0.3] do sample C + "c1_bug_04.wav", rate: 0.38, amp: 0.6 end\n[[0.5, 88], [0.6, 84], [0.72, 79]].each { |t, n| at [t] do bell n, 0.3, 0.3 end }'),
}
BOG = {
 "bogtoad": ("bog-toad", 'sample C + "c1_burp_01.wav", rate: 1.35, amp: 1.0', 'sample C + "c1_burp_02.wav", rate: 1.6, amp: 0.9\nsample WET + "impactsplat01.mp3.flac", rate: 1.4, amp: 0.4', 'sample C + "c1_burp_02.wav", rate: 1.1, amp: 1.0\nat [0.25] do sample S + "weather/splash_a_1.wav", rate: 1.3, amp: 0.6, attack: 0, sustain: 0.2, release: 0.15 end'),
 "mudling": ("mudling", 'sample C + "c2_slime_05.wav", rate: 0.9, amp: 1.0\nsample S + "weather/step_mud_a_1.wav", amp: 0.6', 'sample S + "weather/step_mud_a_2.wav", amp: 1.0\nsample C + "c1_cute_06.wav", rate: 0.9, amp: 0.4', 'sample C + "c2_slime_04.wav", rate: 0.8, amp: 0.9\nat [0.12] do sample S + "weather/step_mud_a_3.wav", rate: 0.8, amp: 0.8 end'),
 "lanternwisp": ("lantern-wisp", 'sample S + "runes/shadowstep_a_1.wav", rate: 1.2, amp: 0.7\n[[0.0, 86], [0.08, 93]].each { |t, n| at [t] do bell n, 0.5, 0.3 end }', 'sample C + "c1_cute_07.wav", rate: 1.3, amp: 0.8\nbell 98, 0.4, 0.2', 'sample S + "runes/shadowstep_a_2.wav", rate: 0.8, amp: 0.7\n[[0.0, 93], [0.12, 88], [0.24, 81], [0.38, 74]].each { |t, n| at [t] do bell n, 0.4, 0.35 end }'),
 "reedwitch": ("reed-witch", 'sample A + "weird_03.ogg", rate: 1.2, amp: 0.9, attack: 0, sustain: 0.35, release: 0.2\nsample S + "runes/shadowstep_a_2.wav", rate: 1.3, amp: 0.4', 'sample C + "c1_cute_04.wav", rate: 0.9, amp: 1.0', 'sample C + "c1_cute_03.wav", rate: 0.95, amp: 1.0\nsample S + "runes/shadowstep_a_1.wav", rate: 0.9, amp: 0.5\nat [0.3] do sample K + "footstep_grass_002.ogg", rate: 0.7, amp: 0.6 end'),
 "bogsnapper": ("bogsnapper", 'sample C + "c1_eat_01.wav", rate: 0.8, amp: 0.9\nat [0.18] do knock "wood_hit_01.wav", 0.9, 1.0; sample S + "runes/trap_snap_b_1.wav", rate: 0.8, amp: 0.7 end', 'knock "wood_hit_05.wav", 0.8, 1.0\nsample C + "c1_grunt_05.wav", rate: 0.8, amp: 0.6', 'cut A + "monster_07.ogg", 0.85, 1.0, 0.7\nat [0.35] do sample S + "weather/splash_a_1.wav", rate: 0.9, amp: 0.7, attack: 0, sustain: 0.3, release: 0.2 end'),
 "mothermurk": ("mother-murk", 'sample V + "bsb_2108.flac", rate: 0.75, amp: 0.8, attack: 0, sustain: 0.5, release: 0.3\nsample C + "c1_burble_01.wav", rate: 0.9, amp: 0.7', 'sample C + "c1_burble_02.wav", rate: 0.8, amp: 1.0\nsample C + "c1_hurt_04.wav", rate: 0.75, amp: 0.5', 'sample C + "c1_burble_01.wav", rate: 0.6, amp: 0.9\ncut V + "bsb_2109.flac", 0.8, 0.8, 1.0\nat [0.6] do sample S + "weather/splash_a_1.wav", rate: 0.7, amp: 0.8, attack: 0, sustain: 0.4, release: 0.3 end'),
}
FROST = {
 "snowgoat": ("snow-goat", 'sample S + "flesh/pain_deer_w_1.wav", rate: 1.1, amp: 1.0', 'sample S + "flesh/pain_deer_w_2.wav", rate: 1.2, amp: 1.0\nsample S + "weather/step_snow_b_1.wav", amp: 0.4', 'sample S + "flesh/pain_deer_w_3.wav", rate: 0.85, amp: 1.0\nat [0.25] do sample S + "weather/step_snow_b_2.wav", rate: 0.8, amp: 0.7 end'),
 "craggoblin": ("crag-goblin", 'sample C + "c1_grunt_04.wav", rate: 1.0, amp: 1.0\nknock "wood_hit_03.wav", 0.7, 0.4', 'sample C + "c1_hurt_01.wav", rate: 1.0, amp: 1.0', 'sample C + "c1_grunt_03.wav", rate: 1.0, amp: 0.9\nat [0.2] do sample S + "runes/rock_split_a_1.wav", rate: 1.4, amp: 0.5, attack: 0, sustain: 0.15, release: 0.1 end'),
 "pebblegolem": ("pebble-golem", 'sample S + "runes/stone_break_a_1.wav", rate: 1.3, amp: 0.9\nsample S + "runes/rock_split_a_2.wav", rate: 1.4, amp: 0.5, attack: 0, sustain: 0.15, release: 0.1', 'sample S + "runes/stone_break_a_2.wav", rate: 1.5, amp: 1.0', 'sample S + "runes/rock_split_a_1.wav", rate: 1.1, amp: 0.9, attack: 0, sustain: 0.35, release: 0.25\n[0.1, 0.18, 0.27, 0.38].each { |t| at [t] do knock "wood_hit_03.wav", 1.6, 0.35 end }'),
 "frostling": ("frostling", 'sample C + "c1_cute_05.wav", rate: 1.3, amp: 0.8\n[[0.03, 100], [0.09, 103]].each { |t, n| at [t] do bell n, 0.35, 0.2 end }', 'sample C + "c1_cute_09.wav", rate: 1.4, amp: 0.9\nbell 105, 0.3, 0.15', 'sample S + "weather/step_snow_b_3.wav", rate: 1.1, amp: 0.8\n[[0.0, 103], [0.08, 98], [0.17, 96], [0.27, 91]].each { |t, n| at [t] do bell n, 0.35, 0.25 end }'),
 "oldbighorn": ("old-bighorn", 'sample S + "flesh/pain_deer_w_4.wav", rate: 0.75, amp: 1.0\nat [0.1] do sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.9, amp: 0.7 end', 'sample S + "flesh/pain_deer_w_2.wav", rate: 0.8, amp: 1.0', 'sample S + "flesh/pain_deer_w_1.wav", rate: 0.62, amp: 1.0\nat [0.4] do sample S + "weather/step_snow_b_4.wav", rate: 0.7, amp: 0.9 end'),
 "frostbeard": ("frostbeard", 'cut B + "roar_05.ogg", 1.0, 1.0, 0.8', 'cut B + "roar_06.ogg", 1.2, 1.0, 0.45\nknock "wood_hit_07.wav", 1.0, 0.5', 'cut B + "roar_04.ogg", 0.95, 1.0, 1.1\nat [0.6] do knock "wood_hit_05.wav", 0.8, 0.8; sample S + "weather/step_snow_b_1.wav", rate: 0.9, amp: 0.8 end'),
}
ROOTS = {
 "glowcap": ("glowcap", 'sample C + "c1_cute_01.wav", rate: 1.5, amp: 0.8\nbell 91, 0.3, 0.25\nsample S + "runes/shadowstep_a_2.wav", rate: 1.8, amp: 0.4', 'sample C + "c1_cute_06.wav", rate: 1.6, amp: 1.0', 'knock "wood_hit_07.wav", 1.8, 0.7\nat [0.02] do sample S + "runes/shadowstep_a_1.wav", rate: 1.6, amp: 0.8; bell 86, 0.3, 0.4 end'),
 "rootbeard": ("old-rootbeard", 'sample K + "creak3.ogg", rate: 0.8, amp: 1.0, attack: 0, sustain: 0.5, release: 0.3\nsample C + "c1_grunt_01.wav", rate: 0.9, amp: 0.4', 'sample S + "chapter1/heavyhit_club_v_2.wav", rate: 0.85, amp: 0.9\nknock "wood_hit_05.wav", 0.65, 0.9', 'sample K + "creak1.ogg", rate: 0.6, amp: 1.0, attack: 0, sustain: 0.8, release: 0.4\nat [0.5] do sample S + "runes/rock_split_a_1.wav", rate: 0.7, amp: 0.8, attack: 0, sustain: 0.4, release: 0.3 end'),
 "rootgrub": ("root-grub", 'sample C + "c1_eat_02.wav", rate: 1.2, amp: 1.0\nsample C + "c2_slime_05.wav", rate: 1.2, amp: 0.4', 'sample C + "c2_slime_03.wav", rate: 1.3, amp: 0.9\nsample C + "c1_cute_06.wav", rate: 0.8, amp: 0.4', 'sample WET + "impactsplat06.mp3.flac", rate: 1.0, amp: 0.9\nat [0.1] do sample C + "c2_slime_08.wav", rate: 1.0, amp: 0.6 end'),
 "moleminer": ("mole-miner", 'sample C + "c1_cute_04.wav", rate: 1.1, amp: 0.8\nat [0.08] do sample S + "combat/tele_1.wav", rate: 0.9, amp: 0.7; sample S + "runes/stone_break_a_1.wav", rate: 1.5, amp: 0.5 end', 'sample C + "c1_cute_09.wav", rate: 1.2, amp: 1.0', 'sample C + "c1_cute_10.wav", rate: 1.0, amp: 0.9\nat [0.2] do sample S + "combat/parry_3.wav", rate: 1.2, amp: 0.4, attack: 0, sustain: 0.1, release: 0.1 end'),
 "digby": ("old-digby", 'sample C + "c1_grunt_05.wav", rate: 0.9, amp: 0.8\nat [0.1] do sample S + "combat/parry_2.wav", rate: 0.8, amp: 0.6, attack: 0, sustain: 0.12, release: 0.1 end\nat [0.16] do sample S + "runes/rock_split_a_2.wav", rate: 1.1, amp: 0.8, attack: 0, sustain: 0.25, release: 0.2 end\n[0.3, 0.38, 0.47].each { |t| at [t] do knock "wood_hit_03.wav", 1.5, 0.4 end }', 'sample C + "c1_hurt_05.wav", rate: 0.85, amp: 1.0', 'sample C + "c1_cute_03.wav", rate: 0.7, amp: 1.0\nat [0.4] do sample S + "runes/rock_split_a_1.wav", rate: 0.9, amp: 0.7, attack: 0, sustain: 0.3, release: 0.2 end'),
}
KINGS = {
 "outcast": ("city-outcast", 'sample C + "man_yah.wav", rate: 1.05, amp: 1.0', 'sample C + "man_oof.wav", rate: 1.05, amp: 1.0', 'sample C + "man_ow.wav", rate: 1.1, amp: 1.0'),
 "poacher": ("poacher", 'sample S + "bow/shoot_b_2.wav", rate: 0.85, amp: 0.8\nsample C + "man_yah.wav", rate: 1.15, amp: 0.5', 'sample C + "man_oof.wav", rate: 1.15, amp: 1.0', 'sample C + "man_ow.wav", rate: 1.25, amp: 1.0\nat [0.15] do sample S + "bow/shoot_b_3.wav", rate: 0.6, amp: 0.3 end'),
 "hedgeknight": ("hedge-knight", 'sample S + "runes/sweep_a_1.wav", rate: 1.05, amp: 0.6\nsample C + "man_yah.wav", rate: 0.9, amp: 0.7\nat [0.1] do sample S + "combat/parry_1.wav", rate: 0.9, amp: 0.4, attack: 0, sustain: 0.1, release: 0.1 end', 'sample S + "combat/parry_2.wav", rate: 0.85, amp: 0.7, attack: 0, sustain: 0.12, release: 0.1\nsample C + "man_oof.wav", rate: 0.9, amp: 0.8', 'sample C + "man_ow.wav", rate: 0.9, amp: 1.0\nat [0.2] do sample S + "runes/shield_break_a_1.wav", rate: 0.9, amp: 0.6 end'),
 "tusker": ("tusker", 'sample S + "flesh/pain_boar_w_1.wav", rate: 0.9, amp: 1.0\nsample S + "chapter1/hit_club_v_1.wav", rate: 0.9, amp: 0.4', 'sample S + "flesh/pain_boar_w_2.wav", rate: 1.0, amp: 1.0', 'sample S + "flesh/pain_boar_w_3.wav", rate: 0.75, amp: 1.0\nat [0.3] do sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.85, amp: 0.6 end'),
 "outlawking": ("outlaw-king", 'sample S + "runes/war_cry_a_1.wav", rate: 0.95, amp: 1.0, attack: 0, sustain: 0.45, release: 0.25\nsample S + "runes/sweep_a_2.wav", rate: 1.0, amp: 0.5', 'sample C + "man_oof.wav", rate: 0.78, amp: 1.0\nsample S + "combat/parry_1.wav", amp: 0.35', 'sample S + "runes/war_cry_a_2.wav", rate: 0.78, amp: 1.0, attack: 0, sustain: 0.6, release: 0.35\nat [0.6] do sample S + "chapter1/heavyhit_club_v_2.wav", rate: 0.85, amp: 0.6 end'),
}
SURGES = {
 "honeyhill": ("queenbumble_surge", "creature/frost-matriarch/surge", "Queen Bumble's hive answers, the swarm thickens: buzzes piling up and rising.", '[[0.0, 0.7], [0.1, 0.8], [0.2, 0.9], [0.32, 1.0], [0.45, 1.1]].each_with_index { |(t, ra), i| at [t] do sample C + "c2_bug_10.wav", rate: ra, amp: 0.45 + i * 0.1 end }\nsample C + "c1_bug_04.wav", rate: 0.5, amp: 0.7\nstr 62, 0.4, 0.4, 0.3, 0.1'),
 "bogglemire": ("mothermurk_surge", "creature/mother-murk/surge", "the bog boils around Old Mother Murk: bubbles rising faster and a groan under them.", '[0.0, 0.12, 0.22, 0.3, 0.37, 0.43, 0.48].each_with_index { |t, i| at [t] do sample C + "c1_burble_0#{(i % 2) + 1}.wav", rate: 0.9 + i * 0.08, amp: 0.4 + i * 0.06 end }\ncut V + "bsb_2110.flac", 0.7, 0.7, 0.9'),
 "frostcrown": ("frostbeard_surge", "creature/frostbeard/surge", "the blizzard comes, Frostbeard roars: a roar, the gust rising, glass-high bells.", 'cut B + "roar_06.ogg", 0.8, 1.0, 0.9\nat [0.2] do sample S + "weather/gust_a_3.wav", rate: 1.1, amp: 0.8, attack: 0.15, sustain: 0.4, release: 0.3 end\n[[0.3, 103], [0.4, 98], [0.5, 105]].each { |t, n| at [t] do bell n, 0.3, 0.25 end }'),
 "rootways": ("rootbeard_surge", "creature/old-rootbeard/surge", "the deep roots wake: a long creak, the earth splitting, a low groan.", 'sample K + "creak3.ogg", rate: 0.6, amp: 1.0, attack: 0, sustain: 0.6, release: 0.3\nat [0.3] do sample S + "runes/rock_split_a_1.wav", rate: 0.75, amp: 0.9, attack: 0, sustain: 0.4, release: 0.3 end\ncut A + "monster_06.ogg", 0.8, 0.6, 0.8'),
 "kingswood": ("outlawking_surge", "creature/outlaw-king/surge", "the Outlaw King casts off his cloak, the gold blade is out: a shout, cloth thrown, a blade's long ring.", 'sample S + "runes/war_cry_a_1.wav", rate: 0.85, amp: 1.0, attack: 0, sustain: 0.5, release: 0.3\nat [0.3] do sample S + "runes/sweep_a_1.wav", rate: 0.9, amp: 0.6; sample S + "combat/parry_1.wav", rate: 0.9, amp: 0.7; bell 84, 0.35, 0.6 end'),
 "forest": ("grumblebark_surge", "creature/briar-king/surge", "Grumblebark's second phase, the whole forest shakes: a great creak, a groan, the wood knocking.", 'sample K + "creak1.ogg", rate: 0.75, amp: 1.0, attack: 0, sustain: 0.6, release: 0.3\ncut A + "troll_02.ogg", 0.85, 0.7, 0.7\n[0.3, 0.42, 0.55].each { |t| at [t] do knock "wood_hit_05.wav", 0.75, 0.6 end }'),
}
LANDS = {"honeyhill": HONEY, "bogglemire": BOG, "frostcrown": FROST, "rootways": ROOTS, "kingswood": KINGS}
allnames = []
for land in list(LANDS) + ["forest"]:
    lv, names, sounds = {}, [], []
    for who, (gid, atk, hit, die) in LANDS.get(land, {}).items():
        for what, body in (("attack", atk), ("hit", hit), ("die", die)):
            sounds.append(("%s_%s_%s" % (land, who, what), "creature/%s/%s" % (gid, what), "%s, %s (%s)." % (gid, what, land), body, 1.8 if what == "die" else 1.4, -2 if what == "die" else -4 if what == "attack" else -5, 1.3 if what == "die" else 0.8))
    k, game, desc, body = SURGES[land]
    sounds.append(("%s_%s" % (land, k), game, desc, body, 2.2, 2, 1.4))
    for i, (name, game, desc, body, gap, target, mx) in enumerate(sounds):
        open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=9000 + 10 * len(allnames), body=body, gap="%.1f" % gap))
        lv[name] = {"target": target, "max": mx, "use": desc}
        names.append({"name": game, "src": name}); allnames.append(name)
    os.makedirs(os.path.join(ROOT, "out", "sfx", land, "game"), exist_ok=True)
    json.dump(lv, open(os.path.join(HERE, "_levels-%s.json" % land), "w"), indent=2)
    json.dump(names, open(os.path.join(HERE, "_names-%s.json" % land), "w"), indent=1)
open(os.path.join(HERE, "_list.txt"), "w").write("\n".join(allnames) + "\n")
print(len(allnames), "sources")
