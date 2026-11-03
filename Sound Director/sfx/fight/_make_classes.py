# Chapter 2 (Miles, GD, 2026-11-01, on Robin's word). Writes three sets of sources from one spec:
#   sfx/fight-classes/  the Trickster's, Wizard's and Archer's 18 abilities and 3 meter pips (sprite fight-classes)
#   sfx/forest/         the six forest creatures' voices (sprite creatures-forest), steps on roots and moss
# Run: python -I sfx/fight/_make_classes.py, then bash work/render-pending.sh. The Survival game's sounds first (Robin, 2026-11-01). One variation each,
# three for the steps. Levels are first guesses until rendered and measured: a sound in these sets has not been heard or measured yet. Nigel, SD, 2026-11-01.
import os, json, shutil, glob
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEC = os.path.join(ROOT, "work", "decode", "voices")
CUT = os.path.join(ROOT, "sfx", "creatures", "ref", "cut")
files = json.load(open(os.path.join(DEC, "voices.json")))["files"]
for n in range(1, 59):                                                  # every creature piece, by piece number (docs/sfx-notes.md section 13)
    base = os.path.splitext(os.path.basename(files[n - 1]))[0]
    pack = "2" if "oga_creature2" in files[n - 1] else "1"
    shutil.copyfile(os.path.join(DEC, "out", "voices_%d.wav" % n), os.path.join(CUT, "c%s_%s.wav" % (pack, base)))

HEAD = """# {name}: {desc}
# Chapter 2, written by sfx/fight/_make_classes.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: {name}
# seconds: {secs}
# count: {count}

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
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
define :coin do |rate, amp|
  sample K + "impactMetal_light_00#{{rrand_i(0, 4)}}.ogg", rate: rate * 0.62, amp: amp, attack: 0, sustain: 0.03, release: 0.1
end
define :one do |v|
  use_random_seed {seed} + v
  r = 1 + rrand(-0.03, 0.03)
{body}
end
{count}.times do |v|
  one v
  sleep {gap}
end
"""
SETS = {"fight-classes": {}, "forest": {}}
def snd(sset, name, desc, gap, target, mx, body, count=1):
    SETS[sset][name] = dict(desc=desc, gap=gap, target=target, max=mx, body=body, count=count)

# ---- the Trickster -------------------------------------------------------------------------------------------------------------------
snd("fight-classes", "ability_backstab", "Sneak Jab: a quick thin cut and the slap.", 1.2, 1, 0.5, """  sample S + "combat/swish_seax_2.wav", rate: 1.3, amp: 0.5
  at [0.08] do sample S + "runes/riposte_a_1.wav", amp: 0.8; sample S + "flesh/hit_w_3.wav", amp: 0.9 end""")
snd("fight-classes", "ability_poison_blade", "Nettle Knife: the cut, a drip and a thin hiss.", 1.4, 0, 0.8, """  sample S + "runes/riposte_a_2.wav", amp: 0.9
  at [0.05] do sample S + "runes/blood_drip_a_1.wav", rate: 1.4, amp: 0.8, attack: 0, sustain: 0.15, release: 0.12 end
  at [0.12] do sample S + "runes/trap_poison_a_1.wav", start: 0.5, amp: 0.35, attack: 0.02, sustain: 0.2, release: 0.15 end""")
snd("fight-classes", "ability_shadowstep", "Vanishing Act: the recorded shadowstep and three small bells falling away.", 1.4, -1, 0.8, """  sample S + "runes/shadowstep_a_1.wav", amp: 0.9
  [[0.12, 88], [0.2, 84], [0.28, 79]].each do |t, n|
    at [t] do bell n, 0.4, 0.25 end
  end""")
snd("fight-classes", "ability_smoke_bomb", "Puff of Smoke: a small pop on wood and a rush of smoke.", 1.4, 0, 0.8, """  sample W + "wood_hit_07.wav", rate: 1.4, amp: 0.9, attack: 0, sustain: 0.03, release: 0.05
  sample S + "weather/gust_a_1.wav", rate: 1.6, amp: 0.6, attack: 0.02, sustain: 0.25, release: 0.25
  at [0.04] do sample S + "runes/shadowstep_a_2.wav", rate: 1.2, amp: 0.7 end""")
snd("fight-classes", "ability_pickpocket", "Sticky Fingers: a quick cut and coins lifted.", 1.2, 0, 0.6, """  sample S + "runes/riposte_a_1.wav", rate: 1.1, amp: 0.7
  [[0.1, 2.6], [0.15, 3.0], [0.22, 2.8]].each do |t, ra|
    at [t] do coin ra, 0.7 end
  end""")
snd("fight-classes", "ability_eviscerate", "Grand Finale: a whirl of three cuts and the heavy hit, a bell's flourish on top.", 1.7, 3, 1.1, """  sample S + "runes/whirl_a_1.wav", rate: 1.1, amp: 0.7
  [0.12, 0.26].each do |t|
    at [t] do sample S + "runes/riposte_a_#{{t < 0.2 ? 1 : 2}}.wav", amp: 0.85 end
  end
  at [0.42] do sample S + "flesh/heavyhit_x_3.wav", amp: 1.0; sample S + "flesh/hit_w_2.wav", amp: 0.8; bell 91, 0.5, 0.5; bell 84, 0.4, 0.5 end""")
# ---- the Wizard ----------------------------------------------------------------------------------------------------------------------
snd("fight-classes", "ability_fireball", "Firework: the recorded fire arrow goes up, a crack, a burst of sparks in small bells.", 1.8, 3, 1.2, """  sample S + "runes/fire_arrow_a_1.wav", amp: 0.8
  at [0.3] do sample S + "runes/guard_break_a_1.wav", rate: 1.2, amp: 0.8; sample W + "wood_hit_01.wav", rate: 0.9, amp: 0.9, attack: 0, sustain: 0.03, release: 0.06 end
  7.times do
    at [0.33 + rrand(0, 0.45)] do bell [91, 93, 96, 98, 100, 103][rrand_i(0, 5)], 0.3, 0.25 end
  end""")
snd("fight-classes", "ability_frost_bolt", "Snowball Hex: a soft crunch of recorded snow and glassy bells.", 1.3, 0, 0.7, """  sample S + "weather/step_snow_b_1.wav", amp: 1.0
  [[0.02, 96], [0.07, 103], [0.14, 100]].each do |t, n|
    at [t] do bell n, 0.4, 0.3 end
  end""")
snd("fight-classes", "ability_arcane_shield", "Bubble Shield: recorded drops rising as bubbles, a string swell closing round.", 1.5, 0, 0.9, """  [[0.0, 1.0], [0.1, 1.25], [0.2, 1.55]].each do |t, ra|
    at [t] do sample S + "fishing/fish_bite_a_1.wav", rate: ra, amp: 0.65, attack: 0, sustain: 0.06, release: 0.05 end
  end
  str 67, 0.2, 0.25, 0.3, 0.12; str 74, 0.25, 0.2, 0.3, 0.1
  at [0.3] do bell 86, 0.4, 0.4 end""")
snd("fight-classes", "ability_time_warp", "Pocket Watch: four ticks of a small clock slowing to a stop, one long bell.", 1.8, 1, 1.2, """  [[0.0, 1.9], [0.14, 1.6], [0.32, 1.9], [0.56, 1.6]].each do |t, ra|
    at [t] do sample W + "raise_e_1.wav", rate: ra, amp: 0.8, attack: 0, sustain: 0.015, release: 0.03 end
  end
  at [0.6] do bell 81, 0.8, 0.7; sample S + "runes/trap_arm_a_1.wav", amp: 0.5 end""")
snd("fight-classes", "ability_meteor", "Falling Star, the casting: bells falling from the top, a deep whoosh; the star lands two rounds later (a second name if the game wants one).", 1.8, 2, 1.2, """  [[0.0, 103], [0.08, 100], [0.16, 96], [0.24, 91], [0.32, 88], [0.4, 84]].each do |t, n|
    at [t] do bell n, 0.45, 0.3 end
  end
  sample S + "combat/swish_greataxe_1.wav", rate: 0.8, amp: 0.8
  at [0.55] do sample S + "runes/rock_split_a_1.wav", rate: 0.8, amp: 0.7, attack: 0, sustain: 0.25, release: 0.2 end""")
snd("fight-classes", "meteor_land", "Falling Star lands, two rounds after the cast (fight/meteor-land): a rush down, a crack and the heavy split, bells scattering. The biggest of the Wizard's.", 2.2, 3, 1.5, """  sample S + "combat/swish_greataxe_2.wav", rate: 0.9, amp: 0.7
  at [0.18] do
    sample S + "runes/guard_break_a_1.wav", rate: 0.9, amp: 0.9
    sample S + "runes/rock_split_a_1.wav", rate: 0.8, amp: 0.9, attack: 0, sustain: 0.3, release: 0.25
    sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.85, amp: 0.8
    str 60, 0.02, 0.4, 0.4, 0.14; str 67, 0.02, 0.4, 0.4, 0.12
  end
  6.times do
    at [0.25 + rrand(0, 0.5)] do bell [91, 93, 96, 98, 100, 103][rrand_i(0, 5)], 0.25, 0.3 end
  end""")
snd("fight-classes", "ability_mana_shield", "Moonlight Veil: high strings opening, slow bells, a pale chord.", 1.8, -1, 1.2, """  str 72, 0.3, 0.4, 0.4, 0.11; str 79, 0.35, 0.35, 0.4, 0.1; str 86, 0.4, 0.3, 0.4, 0.07
  [[0.15, 86], [0.4, 91], [0.65, 98]].each do |t, n|
    at [t] do bell n, 0.4, 0.6 end
  end""")
# ---- the Archer ----------------------------------------------------------------------------------------------------------------------
snd("fight-classes", "ability_volley", "Triple Shot: Robin's bow shot, three times, quick.", 1.3, 1, 0.7, """  [[0.0, 1], [0.13, 2], [0.26, 3]].each do |t, f|
    at [t] do sample S + "bow/shoot_b_#{{f}}.wav", amp: 0.9 end
  end""")
snd("fight-classes", "ability_aimed_shot", "Bullseye: a long breath of the string, the recorded pinning shot, a glint.", 1.4, 2, 0.8, """  sample S + "runes/pin_shot_a_1.wav", amp: 1.0
  at [0.02] do sample S + "bow/shoot_b_4.wav", amp: 0.6 end
  at [0.3] do sample S + "combat/tele_1.wav", amp: 0.6 end""")
snd("fight-classes", "ability_snare", "Net Toss: a rush of air, the net's small weights landing.", 1.3, 0, 0.7, """  sample S + "combat/dash_1.wav", amp: 0.7
  at [0.16] do sample S + "runes/trap_land_a_1.wav", amp: 0.9 end""")
snd("fight-classes", "ability_trap", "Tripwire: a small chain's jingle and the catch setting.", 1.3, -2, 0.7, """  with_fx :lpf, cutoff: 108 do                     # the chain alone measured over 10 kHz
    sample S + "runes/trap_throw_a_1.wav", rate: 0.7, amp: 0.7, attack: 0, sustain: 0.2, release: 0.15
  end
  at [0.26] do
    with_fx :lpf, cutoff: 112 do                   # the catch alone measured 12 kHz, piercing
      sample S + "runes/trap_arm_a_1.wav", rate: 0.85, amp: 1.0
    end
  end""")
snd("fight-classes", "ability_hawk", "Owl Friend: a soft hoot, two notes, and wings (Robin's sail flap, quick).", 1.5, 0, 1.0, """  [[0.0, 69, 0.14], [0.26, 65, 0.24]].each do |t, n, d|
    at [t] do
      synth :sine, note: n, attack: 0.05, sustain: d, release: 0.1, amp: 0.45
      synth :tri, note: n + 12, attack: 0.05, sustain: d, release: 0.08, amp: 0.05
    end
  end
  at [0.5] do sample S + "ships/sail_flap_b_1.wav", rate: 1.6, amp: 0.8, attack: 0, sustain: 0.2, release: 0.15 end""")
snd("fight-classes", "ability_mark", "Painted Target: a brush's stroke of breath, a knock and a thin note.", 1.2, -2, 0.6, """  sample S + "runes/shadowstep_a_2.wav", rate: 1.6, amp: 0.6
  at [0.12] do sample W + "raise_e_1.wav", rate: 1.2, amp: 0.7, attack: 0, sustain: 0.02, release: 0.04; bell 93, 0.4, 0.3 end""")
# ---- the three pips ---------------------------------------------------------------------------------------------------------------
snd("fight-classes", "pip_trickster", "Mischief's pip: a finger's snap.", 1.0, -8, 0.2, """  sample :perc_snap, rate: 1.2, amp: 0.9""")
snd("fight-classes", "pip_wizard", "Arcana's pip: one small bell.", 1.0, -8, 0.3, """  bell 88, 0.8, 0.22""")
snd("fight-classes", "pip_archer", "Aim's pip: a tick of the bowstring.", 1.0, -8, 0.2, """  sample S + "bow/shoot_b_1.wav", rate: 0.8, amp: 0.8, attack: 0, sustain: 0.04, release: 0.05
  sample W + "raise_e_1.wav", rate: 1.2, amp: 0.5, attack: 0, sustain: 0.02, release: 0.04""")

# ---- the forest's six creatures: studio name -> id in _sprite-spec-forest.js ------------------------------------------------------------
def v(name, desc, t, body, gap=1.3, mx=0.8):
    snd("forest", name, desc, gap, t, mx, body)
v("twigling_attack", "the Twigling: dry wood clacking twice.", -4, """  sample W + "wood_hit_03.wav", rate: 1.3, amp: 0.9, attack: 0, sustain: 0.04, release: 0.05
  at [0.09] do sample W + "wood_hit_01.wav", rate: 1.2, amp: 0.7, attack: 0, sustain: 0.03, release: 0.05 end""")
v("twigling_hit", "the Twigling struck: a twig's snap, a small voice.", -5, """  sample W + "wood_hit_02.wav", rate: 0.9, amp: 0.8, attack: 0, sustain: 0.03, release: 0.05
  at [0.02] do sample C + "c1_cute_07.wav", rate: 1.2, amp: 0.5 end""")
v("twigling_die", "the Twigling falls: sticks clattering down.", -2, """  sample W + "wood_falling_02.wav", amp: 1.0
  at [0.05] do sample W + "wood_falling_04.wav", rate: 1.1, amp: 0.7 end""")
v("goblin_attack", "the Moss Goblin: a nasal grunt.", -4, """  sample C + "c1_grunt_04.wav", rate: 1.2, amp: 1.0""")
v("goblin_hit", "the Moss Goblin struck: a yelp.", -5, """  sample C + "c1_hurt_01.wav", rate: 1.15, amp: 1.0""")
v("goblin_die", "the Moss Goblin falls: a long small groan.", -2, """  sample C + "c1_grunt_03.wav", rate: 1.15, amp: 1.0
  at [0.2] do sample C + "c1_hurt_03.wav", rate: 0.95, amp: 0.5 end""")
v("sporeling_attack", "the Sporeling: a tiny voice and a puff.", -4, """  sample C + "c1_cute_01.wav", rate: 1.3, amp: 0.9
  at [0.05] do sample S + "runes/shadowstep_a_2.wav", rate: 1.8, amp: 0.4 end""")
v("sporeling_hit", "the Sporeling struck: a squeak.", -5, """  sample C + "c1_cute_06.wav", rate: 1.4, amp: 1.0""")
v("sporeling_die", "the Sporeling bursts: a pop and a puff of spores.", -2, """  sample W + "wood_hit_07.wav", rate: 1.7, amp: 0.8, attack: 0, sustain: 0.02, release: 0.04
  at [0.02] do sample S + "runes/shadowstep_a_1.wav", rate: 1.5, amp: 0.8 end""")
v("nutkin_attack", "the Nutkin Thief: a chatter of small voices.", -4, """  sample C + "c1_cute_04.wav", rate: 1.5, amp: 0.9
  at [0.08] do sample C + "c1_cute_05.wav", rate: 1.6, amp: 0.6 end""")
v("nutkin_hit", "the Nutkin Thief struck: a squeak and a nut's knock.", -5, """  sample C + "c1_cute_09.wav", rate: 1.5, amp: 0.9
  sample W + "raise_e_1.wav", rate: 1.6, amp: 0.5, attack: 0, sustain: 0.02, release: 0.03""")
v("nutkin_die", "the Nutkin Thief falls: a falling squeak, acorns dropping.", -2, """  sample C + "c1_cute_10.wav", rate: 1.1, amp: 0.9
  [[0.14, 1.7], [0.24, 1.9], [0.37, 1.8]].each do |t, ra|
    at [t] do sample W + "raise_e_1.wav", rate: ra, amp: 0.45, attack: 0, sustain: 0.02, release: 0.03 end
  end""")
v("owlbear_attack", "the Sleepy Owlbear Cub: a drowsy growl.", -3, """  sample C + "c1_hurt_05.wav", rate: 0.85, amp: 1.0
  sample C + "c1_grunt_05.wav", rate: 0.95, amp: 0.7""")
v("owlbear_hit", "the Owlbear Cub struck: a hoot of surprise.", -4, """  sample C + "c1_hurt_05.wav", rate: 0.95, amp: 1.0""")
v("owlbear_die", "the Owlbear Cub goes to sleep: a long yawning groan and a snore.", -2, """  sample C + "c1_cute_03.wav", rate: 0.6, amp: 0.9
  at [0.55] do sample "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_creature1/files/snore.ogg", amp: 0.5, attack: 0, sustain: 0.4, release: 0.3 end""", 2.2, 1.5)
v("grumblebark_attack", "Grumblebark: a huge groan: Kenney's creak slowed under a low grunt.", -1, """  sample K + "creak1.ogg", rate: 0.9, amp: 1.0, attack: 0, sustain: 0.5, release: 0.3
  sample C + "c1_grunt_01.wav", rate: 1.0, amp: 0.3""", 1.7, 1.2)
v("grumblebark_hit", "Grumblebark struck: heavy wood knocked, a creak.", -2, """  sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.9, amp: 0.9
  sample W + "wood_hit_05.wav", rate: 0.7, amp: 0.9, attack: 0, sustain: 0.05, release: 0.08
  at [0.08] do sample K + "creak2.ogg", rate: 0.85, amp: 0.6, attack: 0, sustain: 0.2, release: 0.15 end""", 1.4, 0.9)
v("grumblebark_die", "Grumblebark falls: Robin's tree falling, cracking and crashing.", 0, """  sample "C:/dev/SG/Game Developer/assets/sfx/free/treefall_a_1.wav", amp: 1.0
  sample K + "creak1.ogg", rate: 0.6, amp: 0.5                   # bridges the recording's silences (the first render split into a 36 ms crack and the rest)
  at [0.5] do sample K + "creak3.ogg", rate: 0.6, amp: 0.4 end""", 3.4, 2.4)
# steps, three variations each
snd("forest", "step_roots", "a step on roots: a recorded wooden knock, dull and light.", 1.0, -9, 0.25, """  with_fx :lpf, cutoff: 98 do                       # Kenney's wood footsteps are 99 % under 250 Hz, gone on a phone: recorded knocks instead
    sample W + ["wood_hit_05.wav", "wood_hit_07.wav", "wood_hit_05.wav"][v], rate: [0.85, 0.95, 1.0][v] * r, amp: 1.0, attack: 0, sustain: 0.03, release: 0.06
  end""", 3)
snd("forest", "step_moss", "a step on moss: Kenney's grass footsteps, slower and dulled, very soft.", 1.0, -11, 0.25, """  with_fx :lpf, cutoff: 92 do
    sample K + "footstep_grass_00#{{[0, 2, 4][v]}}.ogg", rate: 0.85 * r, amp: 1.0, attack: 0, sustain: 0.14, release: 0.07
  end""", 3)

for sset, L in SETS.items():
    d = os.path.join(ROOT, "sfx", sset); os.makedirs(d, exist_ok=True); os.makedirs(os.path.join(ROOT, "out", "sfx", sset), exist_ok=True)
    for k, (name, s) in enumerate(L.items()):
        src = HEAD.format(name=name, desc=s["desc"], secs=round(s["count"] * s["gap"] + 0.5, 1), count=s["count"], seed=5400 + 10 * k, gap="%.1f" % s["gap"], body=s["body"].replace("{{", "{").replace("}}", "}"))
        open(os.path.join(d, name + ".rb"), "w", encoding="utf-8").write(src)
    open(os.path.join(d, "_list.txt"), "w").write("\n".join(L) + "\n")
    json.dump({n: {"target": s["target"], "max": s["max"], "use": s["desc"]} for n, s in L.items()}, open(os.path.join(d, "_levels.json"), "w"), indent=2)
    print(sset, len(L), "sources")
