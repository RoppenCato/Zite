# Writes the second half of the UI set: the arrivals and spots (sprite ui-spots), the gold, the shop and bag, the chrome, the online moments and the
# character screen (sprite ui). One variation each (Miles, GD, 2026-11-01: heard less than once a minute). Run: python -I sfx/ui/_make2.py
# Robin's rule: the Survival game's sounds first; his picks for the page, the book and the talk go in as they are. Nigel, SD, 2026-11-01.
import os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SG = "C:/dev/SG/Sound Director/"
OUT = os.path.join(ROOT, "out", "sfx", "ui")
COPY = {"hint": ("ui", "book_page_b"), "message_tick": ("ui", "talk_next_e"), "sheet_open": ("ui", "book_open_b"), "sheet_close": ("ui", "book_close_c")}
for name, (sset, src) in COPY.items():
    if not os.path.exists(os.path.join(OUT, name + "_1.wav")):           # never over a levelled master
        shutil.copyfile(SG + "out/sfx/%s/%s_1.wav" % (sset, src), os.path.join(OUT, name + "_1.wav"))

HEAD = """# {name}: {desc}
# The UI set's second half (Miles, GD's name ui/{game}; docs/sound-demands.md, wave 1). Recorded wood, leather, water and metal from the Survival studio,
# bells and strings the studio's, in C pentatonic. Written by sfx/ui/_make2.py; change it there.
# name: {name}
# seconds: {secs}
# count: 1

use_bpm 60                                   # times in seconds
S = "C:/dev/SG/Sound Director/out/sfx/"
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.2, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.18, amp: amp * 0.12
  end
end
define :knock do |piece, rate, amp|           # a recorded knock cut with no tail
  sample C + piece, rate: rate, amp: amp, attack: 0, sustain: 0.03, release: 0.05
end
define :coin do |rate, amp|                   # a coin: Kenney's light metal impact pitched up and cut before it rings
  sample K + "impactMetal_light_00#{{rrand_i(0, 4)}}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1   # 0.62: the first render centred at 7 kHz, piercing
end
define :flip do |rate, amp|
  sample C + "bookFlip2.wav", rate: rate, amp: amp, attack: 0.005, sustain: 0.12, release: 0.08
end
"""
BODY = """
use_random_seed {seed}
{body}
sleep {gap}
"""
L = {}
def snd(name, game, desc, gap, body):
    L[name] = dict(game=game, desc=desc, gap=gap, body=body)

# ---- the arrivals and the spots: sprite ui-spots ----------------------------------------------------------------------------------------
snd("arrive_town", "arrive-town", "arriving at a town: a small bell far off, twice, warm.", 1.6, """
bell 72, 0.9, 0.7
at [0.42] do bell 72, 0.65, 0.7; bell 79, 0.2, 0.5 end""")
snd("arrive_shop", "arrive-shop", "arriving at a shop: a shop door's jingle: three small bells shaken, a wooden knock of the door.", 1.3, """
knock "wood_hit_05.wav", 1.1, 0.5
[[0.03, 91], [0.1, 88], [0.17, 93], [0.27, 88]].each do |t, n|
  at [t] do bell n, 0.55, 0.25 end
end""")
snd("arrive_spring", "arrive-spring", "arriving at a spring: the recorded splash, small, then a sip.", 1.5, """
sample S + "weather/splash_a_1.wav", rate: 1.15, amp: 0.8, attack: 0, sustain: 0.25, release: 0.15
at [0.34] do sample S + "fishing/fish_bite_a_1.wav", rate: 1.25, amp: 0.6, attack: 0, sustain: 0.06, release: 0.05 end""")
snd("arrive_shrine", "arrive-shrine", "arriving at a shrine: one long chime, an open fifth, a breath of strings under.", 1.8, """
bell 79, 0.8, 0.9; bell 86, 0.5, 0.9
str 67, 0.2, 0.2, 0.4, 0.08""")
snd("arrive_chest", "arrive-chest", "a chest found: a creak of discovery (Robin's hull creak, cut) and a small glint.", 1.6, """
sample S + "ships/creak_b_1.wav", rate: 1.3, amp: 0.9, attack: 0.01, sustain: 0.35, release: 0.2
at [0.42] do bell 88, 0.4, 0.3 end""")
snd("arrive_wild", "arrive-wild", "arriving on a wild spot: a soft rustle: two of Kenney's grass steps, slow, and a breath of wind.", 1.3, """
sample K + "footstep_grass_001.ogg", rate: 0.8, amp: 0.8, attack: 0, sustain: 0.08, release: 0.08
at [0.1] do sample K + "footstep_grass_003.ogg", rate: 0.9, amp: 0.6, attack: 0, sustain: 0.08, release: 0.08 end
sample S + "weather/gust_a_1.wav", amp: 0.25, attack: 0.08, sustain: 0.15, release: 0.15""")
snd("arrive_boss", "arrive-boss", "arriving at the boss's spot: a low note: a horn's C4 with a tom and a dark string; not a fanfare, a warning.", 1.8, """
horn 60, 0.5, 1.1
sample :drum_tom_mid_hard, rate: 0.85, amp: 0.5
str 55, 0.1, 0.4, 0.3, 0.14; str 63, 0.1, 0.4, 0.3, 0.1""")
snd("spring_fill", "spring-fill", "a flask filled: three drops rising quickly, a cork's knock.", 1.2, """
[[0.0, 0.9], [0.09, 1.1], [0.18, 1.35]].each do |t, ra|
  at [t] do sample S + "fishing/fish_bite_a_2.wav", rate: ra, amp: 0.7, attack: 0, sustain: 0.05, release: 0.05 end
end
at [0.34] do knock "wood_hit_07.wav", 1.5, 0.6 end""")
snd("shrine_teach", "shrine-teach", "the shrine teaches: a chime with a lift: two bells rising a fourth, strings opening.", 1.5, """
bell 79, 0.7, 0.4
at [0.17] do bell 84, 0.8, 0.6; bell 91, 0.3, 0.5 end
str 60, 0.08, 0.3, 0.25, 0.1; str 67, 0.1, 0.25, 0.25, 0.09""")
snd("spot_empty", "spot-empty", "a spot still empty: one dull tap.", 1.0, """
with_fx :lpf, cutoff: 90 do
  knock "wood_hit_05.wav", 0.8, 0.9
end""")

# ---- gold, shop, bag, the rest: sprite ui ---------------------------------------------------------------------------------------------
snd("gold_gain", "gold-gain", "coins gained: a short jingle: six small coins falling together, a bell's glint.", 1.3, """
[[0.0, 2.4], [0.05, 2.9], [0.11, 2.6], [0.16, 3.1], [0.23, 2.7], [0.31, 3.0]].each do |t, ra|
  at [t] do coin ra, 0.7 end
end
at [0.31] do bell 91, 0.25, 0.3 end""")
snd("gold_small", "gold-small", "a few coins: two small coins.", 1.0, """
coin 2.6, 0.8
at [0.07] do coin 3.0, 0.65 end""")
snd("gold_lost", "gold-lost", "a purse lost (death): coins spilling and falling away, slower and lower, a soft thud.", 1.4, """
knock "wood_hit_05.wav", 0.8, 0.6
[[0.05, 2.2, 0.7], [0.12, 2.0, 0.6], [0.21, 1.9, 0.5], [0.32, 1.7, 0.4], [0.46, 1.6, 0.3]].each do |t, ra, a|
  at [t] do coin ra, a end
end""")
snd("pick_appear", "pick-appear", "the ability-pick chips appearing: three light knocks in a row, rising.", 1.0, """
[[0.0, 1.2], [0.08, 1.4], [0.16, 1.65]].each do |t, ra|
  at [t] do knock "raise_e_1.wav", ra, 0.7 end
end""")
snd("chip", "chip", "a chip chosen: a light knock with a small bell in it.", 1.0, """
knock "raise_e_1.wav", 1.4, 0.8
at [0.01] do bell 84, 0.25, 0.15 end""")
snd("errand_take", "errand-take", "an errand taken: paper taken and a knock on the table.", 1.1, """
flip 1.2, 0.8
at [0.16] do knock "wood_hit_07.wav", 1.2, 0.7 end""")
snd("errand_done", "errand-done", "an errand done: a small well done: two bells and a warm knock.", 1.2, """
knock "wood_hit_07.wav", 1.2, 0.6
bell 79, 0.6, 0.3
at [0.14] do bell 84, 0.75, 0.45 end""")
snd("trainer", "trainer", "the trainer's lesson: a practice blow on wood, a small rise of bells.", 1.3, """
sample S + "chapter1/hit_club_v_1.wav", amp: 0.7
[[0.12, 76], [0.22, 79], [0.32, 84]].each do |t, n|
  at [t] do bell n, 0.5, 0.3 end
end""")
snd("buy", "buy", "bought: coins on the counter and a small till bell.", 1.1, """
coin 2.5, 0.8
at [0.06] do coin 2.9, 0.7 end
at [0.13] do knock "wood_hit_05.wav", 1.2, 0.4; bell 88, 0.6, 0.3 end""")
snd("sell", "sell", "sold: coins handed back, falling the other way.", 1.1, """
coin 2.9, 0.7
at [0.07] do coin 2.5, 0.8 end
at [0.14] do coin 2.2, 0.6 end""")
snd("wear", "wear", "gear put on: leather straps (Robin's pick) and a clink.", 1.0, """
sample S + "ui/talk_open_f_1.wav", amp: 1.0
at [0.07] do coin 1.5, 0.4 end""")
snd("take_off", "take-off", "gear taken off: the straps, softer and lower.", 1.0, """
sample S + "ui/talk_open_f_2.wav", rate: 0.85, amp: 0.9""")
snd("drop_item", "drop-item", "an item dropped: a small thud on the ground.", 1.0, """
knock "wood_hit_05.wav", 0.85, 0.9
at [0.07] do knock "raise_e_1.wav", 1.0, 0.3 end""")
snd("online_join", "online-join", "someone joined: a small hello: two bells rising.", 1.0, """
bell 79, 0.6, 0.25
at [0.11] do bell 84, 0.7, 0.35 end""")
snd("online_leave", "online-leave", "someone left: the same two bells falling, softer.", 1.0, """
bell 84, 0.45, 0.25
at [0.11] do bell 79, 0.4, 0.35 end""")
snd("online_reconnect", "online-reconnect", "reconnected: three quick knocks and one bell: back in the room.", 1.0, """
[[0.0, 1.3], [0.07, 1.3], [0.14, 1.3]].each do |t, ra|
  at [t] do knock "raise_e_1.wav", ra, 0.5 end
end
at [0.22] do bell 84, 0.5, 0.25 end""")
snd("online_note", "online-note", "a note left nearby: paper, and a soft single bell.", 1.0, """
flip 1.4, 0.7
at [0.1] do bell 88, 0.35, 0.3 end""")
snd("card", "card", "a class card chosen, the general sound: a card slapped down on wood.", 1.0, """
flip 1.5, 0.7
at [0.06] do knock "wood_hit_07.wav", 1.3, 0.8 end""")
snd("card_knight", "card-knight", "the Knight's card: a clink of iron.", 1.0, """
knock "wood_hit_07.wav", 1.3, 0.5
sample S + "combat/parry_1.wav", amp: 0.7, attack: 0, sustain: 0.12, release: 0.12""")
snd("card_trickster", "card-trickster", "the Trickster's card: a snap.", 1.0, """
knock "wood_hit_07.wav", 1.3, 0.5
sample S + "runes/trap_snap_b_1.wav", rate: 1.2, amp: 0.7, attack: 0, sustain: 0.05, release: 0.05""")
snd("card_wizard", "card-wizard", "the Wizard's card: a sparkle.", 1.0, """
knock "wood_hit_07.wav", 1.3, 0.4
[[0.02, 91], [0.07, 96], [0.12, 100], [0.17, 103]].each do |t, n|
  at [t] do bell n, 0.4, 0.2 end
end""")
snd("card_archer", "card-archer", "the Archer's card: a bowstring (Robin's pick).", 1.0, """
knock "wood_hit_07.wav", 1.3, 0.4
sample S + "bow/shoot_b_1.wav", amp: 0.8""")
snd("begin", "begin", "Begin: a short overture: C5 E5 G5, then A5 G5 and a held C6, on bells and a horn with strings. 2 s. A stand-in for the game's hook until the title theme is written; it will quote the same notes.", 2.9, """
[[0.0, 72], [0.16, 76], [0.32, 79], [0.56, 81], [0.72, 79]].each do |t, n|
  at [t] do bell n + 12, 0.7, 0.3; horn n, 0.08, 0.7 end
end
at [0.96] do
  bell 96, 1.0, 1.0; bell 91, 0.5, 0.9; horn 84, 0.7, 0.9; horn 72, 0.7, 0.5
  str 60, 0.03, 0.7, 0.4, 0.13; str 64, 0.03, 0.7, 0.4, 0.11; str 67, 0.03, 0.7, 0.4, 0.1
  sample :drum_tom_mid_hard, rate: 1.0, amp: 0.4
end""")

# ---- Robin's play notes, through Miles, GD (2026-11-01) ---------------------------------------------------------------------------------
snd("arrive_church", "arrive-church", "arriving at a church: a warm bell, low, and a held chord of strings under it, 1.5 s.", 2.3, """
bell 67, 1.0, 1.0; bell 79, 0.35, 0.8
str 60, 0.12, 0.8, 0.5, 0.13; str 64, 0.15, 0.75, 0.5, 0.11; str 67, 0.18, 0.7, 0.5, 0.1
at [0.55] do bell 67, 0.55, 0.8 end""")
snd("stung", "stung", "poison stinging on a roll: a small sharp tick and a drip, under 0.2 s.", 1.0, """
sample C + "wood_hit_01.wav", rate: 1.6, amp: 0.7, attack: 0, sustain: 0.015, release: 0.03
at [0.02] do sample S + "runes/blood_drip_a_2.wav", rate: 1.7, amp: 0.8, attack: 0, sustain: 0.08, release: 0.07 end""")

# ---- Robin's first-chapter notes, through Miles, GD (2026-11-02) --------------------------------------------------------------------------
snd("board_open", "board-open", "the pin-board opens: paper rustling: two quick page flips and a pin's small knock.", 1.3, """
flip 1.0, 0.8
at [0.11] do flip 1.25, 0.6 end
at [0.24] do knock "raise_e_1.wav", 1.7, 0.45 end""")
snd("quest_done", "quest-done", "a quest done: a short fanfare, smaller than the level up: G5 C6 and a held E6 on bells, strings under.", 1.7, """
[[0.0, 79], [0.14, 84]].each do |t, n|
  at [t] do bell n, 0.75, 0.3 end
end
at [0.28] do
  bell 88, 0.9, 0.6; bell 84, 0.35, 0.5
  str 60, 0.03, 0.3, 0.25, 0.1; str 67, 0.03, 0.3, 0.25, 0.09
end""")
snd("person_found", "person-found", "a person found: a friendly chime: two notes rising a sixth, warm, no strings.", 1.3, """
bell 76, 0.7, 0.35
at [0.15] do bell 84, 0.8, 0.5; bell 72, 0.25, 0.4 end""")
snd("log_open", "log-open", "the log opens: a soft page turn, Robin's pick from the Lore Book, slower and dimmer.", 1.1, """
with_fx :lpf, cutoff: 112 do
  sample S + "ui/book_page_b_1.wav", rate: 0.9, amp: 0.9
end""")

for k, (name, s) in enumerate(L.items()):
    secs = round(s["gap"] + 0.5, 1)
    src = HEAD.format(name=name, game=s["game"], desc=s["desc"], secs=secs) + BODY.format(seed=4800 + 10 * k, body=s["body"], gap="%.1f" % s["gap"])
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(src)
open(os.path.join(HERE, "_list2.txt"), "w").write("\n".join(L) + "\n")
print(len(COPY), "copied;", len(L), "sources written")
