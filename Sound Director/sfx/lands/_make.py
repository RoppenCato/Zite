# The three newest lands' voices (Miles, GD, 2026-11-02): attack, hit and die for the 18 creatures of The Pirate Isles, The Giants' Land and The Buried Crown, the bosses' surges, the
# storm biting, the crown burning and the ending sting. One sprite per land, each loaded with its land. From recordings on this PC (the Survival studio: rubberduck's creature
# packs, HaelDB's men, BigSoundBank's groans, all CC0). The raw packs have not been measured: read the measurements after the render, heads of silence and low roars first.
# Run: python -I sfx/lands/_make.py. Nigel, SD, 2026-11-02.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SG = "C:/dev/SG/Sound Director/"
HEAD = """# {name}: {desc}
# Written by sfx/lands/_make.py; change it there. Recordings CC0, from the Survival studio.
# name: {name}
# seconds: {secs}
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
R = "C:/dev/SG/Sound Director/sfx/flesh/ref/"
A = R + "oga_creature1/files/"
B = R + "oga_creature2/files/"
V = R + "bsb_voices/"
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
define :cut do |path, rate, amp, len|          # a recording held to a length, high-passed at 330 Hz: a roar a phone can carry (196 Hz left Snowshoulder 86 to 94 % low)
  with_fx :hpf, cutoff: 64 do
    sample path, rate: rate, amp: amp, attack: 0, sustain: len * 0.65, release: len * 0.35
  end
end
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{{rrand_i(0, 4)}}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
use_random_seed {seed}
{body}
sleep {gap}
"""
# land -> { studio creature: (game id, attack, hit, die) }; each a Sonic Pi body
PIRATES = {
 "deckhand": ("deck-hand", 'sample C + "man_yah.wav", rate: 1.1, amp: 1.0', 'sample C + "man_oof.wav", rate: 1.1, amp: 1.0', 'sample C + "man_ow.wav", rate: 1.2, amp: 1.0'),
 "buccaneer": ("buccaneer", 'sample C + "man_yah.wav", rate: 0.92, amp: 1.0\nsample S + "runes/riposte_a_1.wav", amp: 0.5', 'sample C + "man_oof.wav", rate: 0.92, amp: 1.0', 'sample C + "man_ow.wav", rate: 1.0, amp: 1.0\nat [0.12] do sample W + "wood_hit_05.wav", rate: 0.85, amp: 0.6, attack: 0, sustain: 0.04, release: 0.06 end'),
 "crab": ("scuttle-crab", 'sample W + "wood_hit_01.wav", rate: 1.4, amp: 0.9, attack: 0, sustain: 0.02, release: 0.03\nat [0.08] do sample W + "wood_hit_01.wav", rate: 1.6, amp: 0.8, attack: 0, sustain: 0.02, release: 0.03 end', 'sample W + "wood_hit_03.wav", rate: 1.5, amp: 0.9, attack: 0, sustain: 0.03, release: 0.04\nsample C + "c1_bug_01.wav", rate: 0.8, amp: 0.5', 'sample C + "c1_bug_04.wav", rate: 0.7, amp: 0.8\n[0.1, 0.2, 0.32].each { |t| at [t] do sample W + "raise_e_1.wav", rate: 1.7, amp: 0.4, attack: 0, sustain: 0.015, release: 0.03 end }'),
 "parrot": ("cheeky-parrot", 'sample C + "c1_cute_04.wav", rate: 1.7, amp: 1.0\nat [0.1] do sample C + "c1_cute_05.wav", rate: 1.9, amp: 0.7 end', 'sample C + "c1_cute_09.wav", rate: 1.9, amp: 1.0', 'sample C + "c1_cute_10.wav", rate: 1.5, amp: 0.9\nat [0.15] do sample S + "ships/sail_flap_b_1.wav", rate: 2.0, amp: 0.5, attack: 0, sustain: 0.1, release: 0.08 end'),
 "redwake": ("first-mate-redwake", 'sample C + "man_yah.wav", rate: 0.82, amp: 1.0\nsample S + "runes/sweep_a_1.wav", rate: 1.2, amp: 0.5', 'sample C + "man_oof.wav", rate: 0.82, amp: 1.0', 'sample C + "man_ow.wav", rate: 0.85, amp: 1.0\nat [0.2] do sample S + "chapter1/heavyhit_club_v_1.wav", amp: 0.5 end'),
 "saltjaw": ("captain-saltjaw", 'sample S + "runes/war_cry_a_1.wav", rate: 0.9, amp: 1.0, attack: 0, sustain: 0.45, release: 0.25', 'sample C + "man_oof.wav", rate: 0.72, amp: 1.0\nsample S + "combat/parry_1.wav", amp: 0.35', 'sample S + "runes/war_cry_a_2.wav", rate: 0.72, amp: 1.0, attack: 0, sustain: 0.6, release: 0.35\nat [0.55] do sample S + "ships/creak_b_1.wav", rate: 1.0, amp: 0.7, attack: 0, sustain: 0.3, release: 0.2 end'),
}
GIANTS = {
 "youngyeti": ("young-yeti", 'cut A + "monster_01.ogg", 1.25, 1.0, 0.5', 'sample C + "c1_hurt_03.wav", rate: 1.1, amp: 1.0', 'sample C + "c1_cute_03.wav", rate: 0.75, amp: 1.0'),
 "snowmonster": ("snow-monster", 'cut A + "monster_03.ogg", 1.0, 1.0, 0.6\nsample S + "weather/step_snow_b_1.wav", amp: 0.5', 'cut A + "monster_04.ogg", 1.15, 1.0, 0.4\nsample S + "weather/step_snow_b_2.wav", amp: 0.7', 'cut A + "monster_05.ogg", 0.85, 1.0, 0.8\nat [0.3] do sample S + "weather/step_snow_b_3.wav", rate: 0.8, amp: 0.8 end'),
 "frostogre": ("frost-ogre", 'cut A + "troll_01.ogg", 1.0, 1.0, 0.7', 'cut A + "troll_02.ogg", 1.1, 1.0, 0.45', 'cut A + "troll_03.ogg", 0.85, 1.0, 0.9\nat [0.5] do sample S + "chapter1/heavyhit_club_v_2.wav", amp: 0.7 end'),
 "icebat": ("icicle-bat", 'sample C + "c2_bug_10.wav", rate: 1.4, amp: 0.9\nat [0.05] do bell 100, 0.3, 0.2 end', 'sample C + "c1_bug_01.wav", rate: 1.3, amp: 0.9\nbell 103, 0.35, 0.2', 'sample C + "c2_bug_06.wav", rate: 0.9, amp: 0.8\n[[0.1, 103], [0.18, 98], [0.27, 96]].each { |t, n| at [t] do bell n, 0.35, 0.2 end }'),
 "snowshoulder": ("old-snowshoulder", 'cut A + "roar_03.ogg", 1.1, 1.0, 0.8', 'cut A + "monster_06.ogg", 1.15, 1.0, 0.5', 'cut B + "roar_06.ogg", 0.95, 1.0, 1.0'),
 "yetiking": ("yeti-king", 'cut B + "roar_04.ogg", 0.9, 1.0, 0.9', 'cut B + "monster_08.ogg", 0.85, 1.0, 0.55', 'cut B + "roar_05.ogg", 0.72, 1.0, 1.2\nat [0.7] do sample S + "chapter1/heavyhit_club_v_3.wav", rate: 0.8, amp: 0.8; sample S + "weather/step_snow_b_1.wav", rate: 0.7, amp: 0.8 end'),
}
CROWN = {
 "cryptguard": ("crypt-guard", 'sample S + "runes/sweep_a_2.wav", rate: 1.1, amp: 0.6\nat [0.04] do sample S + "combat/parry_1.wav", rate: 0.8, amp: 0.5, attack: 0, sustain: 0.1, release: 0.1 end\nsample V + "bsb_2106.flac", rate: 1.1, amp: 0.7, attack: 0, sustain: 0.3, release: 0.2', 'sample S + "combat/parry_2.wav", rate: 0.75, amp: 0.8, attack: 0, sustain: 0.12, release: 0.1\nsample S + "chapter1/hit_club_v_2.wav", amp: 0.6', 'sample S + "runes/shield_break_a_1.wav", rate: 0.85, amp: 0.8\nat [0.12] do sample W + "wood_falling_02.wav", rate: 0.7, amp: 0.5 end'),
 "wraith": ("gilded-wraith", 'sample S + "runes/shadowstep_a_1.wav", rate: 0.8, amp: 0.8\nsample A + "weird_01.ogg", rate: 1.0, amp: 0.6, attack: 0, sustain: 0.3, release: 0.2', 'sample A + "weird_02.ogg", rate: 1.2, amp: 0.9, attack: 0, sustain: 0.25, release: 0.15\nbell 91, 0.25, 0.25', 'sample S + "runes/shadowstep_a_2.wav", rate: 0.65, amp: 0.8\n[[0.1, 91], [0.2, 86], [0.3, 81], [0.42, 74]].each { |t, n| at [t] do bell n, 0.35, 0.3 end }'),
 "gargoyle": ("stone-gargoyle", 'sample S + "runes/rock_split_a_1.wav", rate: 1.1, amp: 0.8, attack: 0, sustain: 0.2, release: 0.15\nsample A + "monster_02.ogg", rate: 0.9, amp: 0.5, attack: 0, sustain: 0.25, release: 0.15', 'sample S + "runes/stone_break_a_1.wav", rate: 1.0, amp: 1.0', 'sample S + "runes/stone_break_a_2.wav", rate: 0.75, amp: 1.0\nat [0.08] do sample S + "runes/rock_split_a_2.wav", rate: 0.8, amp: 0.8, attack: 0, sustain: 0.3, release: 0.25 end'),
 "mimic": ("gold-mimic", 'sample C + "c1_eat_01.wav", rate: 1.0, amp: 0.9\n[0.0, 0.07, 0.15].each { |t| at [t] do coin 2.6, 0.5 end }', 'sample W + "wood_hit_07.wav", rate: 1.1, amp: 0.8, attack: 0, sustain: 0.04, release: 0.06\n[0.02, 0.09].each { |t| at [t] do coin 2.8, 0.6 end }', 'sample W + "wood_hit_07.wav", rate: 0.9, amp: 0.8, attack: 0, sustain: 0.05, release: 0.08\n[[0.06, 2.2], [0.12, 2.0], [0.2, 1.9], [0.3, 1.7], [0.42, 1.6]].each { |t, ra| at [t] do coin ra, 0.6 end }'),
 "steward": ("last-steward", 'sample V + "bsb_2107.flac", rate: 1.1, amp: 1.0, attack: 0, sustain: 0.45, release: 0.25', 'sample V + "bsb_2108.flac", rate: 1.25, amp: 1.0, attack: 0, sustain: 0.25, release: 0.15', 'cut V + "bsb_2109.flac", 1.0, 1.0, 1.1; sample V + "bsb_2109.flac", rate: 1.0, amp: 0, attack: 0, sustain: 0.7, release: 0.4'),
 "hollowking": ("hollow-king", 'sample V + "bsb_2110.flac", rate: 0.85, amp: 1.0, attack: 0, sustain: 0.55, release: 0.3\nstr 62, 0.1, 0.3, 0.25, 0.11', 'cut V + "bsb_2111.flac", 1.1, 1.0, 0.5; sample V + "bsb_2111.flac", rate: 1.1, amp: 0, attack: 0, sustain: 0.3, release: 0.2\nsample S + "combat/parry_3.wav", rate: 0.7, amp: 0.4', 'sample V + "bsb_2112.flac", rate: 0.75, amp: 1.0, attack: 0, sustain: 0.9, release: 0.5\nstr 50, 0.2, 0.7, 0.5, 0.12; str 57, 0.25, 0.65, 0.5, 0.09'),
}
EXTRA = {
 "pirates": {"saltjaw_surge": ("creature/captain-saltjaw/surge", "Saltjaw bellows, all guns: a shout and a far cannon.", 'sample S + "runes/war_cry_a_1.wav", rate: 0.8, amp: 0.9, attack: 0, sustain: 0.5, release: 0.25\nat [0.35] do sample S + "runes/rock_split_a_1.wav", rate: 0.7, amp: 0.8, attack: 0, sustain: 0.3, release: 0.25; sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.75, amp: 0.8 end', 2.1, 2, 1.2)},
 "giants": {"yetiking_surge": ("creature/yeti-king/surge", "The Yeti King roars, the storm comes: a roar, the gust rising, far thunder.", 'cut B + "roar_06.ogg", 0.85, 1.0, 0.9\nat [0.2] do sample S + "weather/gust_a_1.wav", rate: 1.1, amp: 0.8, attack: 0.15, sustain: 0.4, release: 0.3 end\nstr 62, 0.3, 0.4, 0.3, 0.1; str 69, 0.35, 0.35, 0.3, 0.09', 2.3, 2, 1.4),
            "storm_bite": ("fight/storm-bite", "the storm biting: a short cold gust and glass-high bells, a bite, 0.5 s.", 'sample S + "weather/gust_a_2.wav", rate: 1.5, amp: 0.8, attack: 0.03, sustain: 0.2, release: 0.15\nsample S + "weather/step_snow_b_2.wav", amp: 0.7\n[[0.03, 103], [0.09, 98], [0.15, 105]].each { |t, n| at [t] do bell n, 0.3, 0.2 end }', 1.3, -3, 0.6)},
 "crown": {"hollowking_surge": ("creature/hollow-king/surge", "The crown burns, the blue flame turns to gold: the recorded fire swelling, a dark chord opening to gold bells.", 'sample S + "runes/fire_arrow_a_1.wav", rate: 0.7, amp: 0.8\nsample V + "bsb_2110.flac", rate: 0.7, amp: 0.6, attack: 0, sustain: 0.5, release: 0.3\nstr 50, 0.3, 0.7, 0.4, 0.12; str 57, 0.35, 0.65, 0.4, 0.11; str 65, 0.4, 0.3, 0.2, 0.1\nat [0.7] do str 69, 0.1, 0.4, 0.4, 0.11; [[0, 86], [0.09, 93], [0.18, 98]].each { |t, n| at [t] do bell n, 0.55, 0.5 end } end', 2.5, 2, 1.7),
           "ending_sting": ("fight/ending-sting", "the Hollow King falls, the ending: a low chord that does not resolve, then a slow horn-less rise of bells to a clean D major, 2.5 s: an old thing laid down, sorrow and light.", 'str 50, 0.05, 0.7, 0.4, 0.14; str 57, 0.05, 0.7, 0.4, 0.12; str 65, 0.05, 0.7, 0.4, 0.1\nsample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.75, amp: 0.8\nat [0.8] do str 50, 0.2, 1.0, 0.6, 0.12; str 62, 0.2, 1.0, 0.6, 0.12; str 66, 0.25, 0.95, 0.6, 0.11; str 69, 0.3, 0.9, 0.6, 0.1 end\n[[0.85, 86], [1.05, 90], [1.25, 93], [1.5, 98]].each { |t, n| at [t] do bell n, 0.65, 0.9 end }', 3.4, 2, 2.6)},
}
LANDS = {"pirates": ("The Pirate Isles", "creatures-pirates", PIRATES), "giants": ("The Giants' Land", "creatures-giants", GIANTS), "crown": ("The Buried Crown", "creatures-crown", CROWN)}
d = HERE
allnames, specs = [], {}
for land, (title, sprite, table) in LANDS.items():
    lv, sounds = {}, []
    for who, (gid, atk, hit, die) in table.items():
        for what, body in (("attack", atk), ("hit", hit), ("die", die)):
            sounds.append((land + "_" + who + "_" + what, "creature/%s/%s" % (gid, what), "%s, %s (%s)." % (gid, what, title), body, 1.7 if what == "die" else 1.3, -2 if what == "die" else -4 if what == "attack" else -5, 1.3 if what == "die" else 0.8))
    for k, (game, desc, body, gap, target, mx) in EXTRA[land].items():
        sounds.append((land + "_" + k, game, desc, body, gap, target, mx))
    specs[sprite] = []
    for k, (name, game, desc, body, gap, target, mx) in enumerate(sounds):
        open(os.path.join(d, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=7000 + 10 * k, body=body, gap="%.1f" % gap))
        lv[name] = {"target": target, "max": mx, "use": desc}
        specs[sprite].append((name, game))
        allnames.append(name)
    os.makedirs(os.path.join(ROOT, "out", "sfx", land, "game"), exist_ok=True)
    json.dump(lv, open(os.path.join(d, "_levels-%s.json" % land), "w"), indent=2)
    json.dump([{"name": g, "src": n} for n, g in specs[sprite]], open(os.path.join(d, "_names-%s.json" % land), "w"), indent=1)
open(os.path.join(d, "_list.txt"), "w").write("\n".join(allnames) + "\n")
print(len(allnames), "sources:", {k: len(v) for k, v in specs.items()})
