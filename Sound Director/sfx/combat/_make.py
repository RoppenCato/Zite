# Writes the combat sound sources (sfx/combat/<name>.rb) from one spec, so every file has the same header, kit and
# variation loop. Run: python -I sfx/combat/_make.py. The bodies are Sonic Pi code; r is the variation's rate (±5 %).
# Requested by the game's session for Robin, 2026-10-15 ("Let's work on the attack sounds").
import os
HERE = os.path.dirname(os.path.abspath(__file__))

S = {}
def snd(name, desc, gap, body, cut=116):
    S[name] = (desc, gap, body, cut)

# ---- 1. swings: air, the weapon's weight ---------------------------------------------------------------
snd("swing", "the sword's swing (also fists and the men's swings): a mid whoosh with a thin edge whistling in it", 1.2, """
  whoosh 0.24 * r, 80, 104, 0.9, 0.5
  whoosh 0.2 * r, 98, 114, 0.22, 0.85
  snd :perc_swoosh, 1.35 * r, 0.45, 0.22""")
snd("swing_seax", "the seax: short and quick, the highest whoosh, a thin whistle", 1.2, """
  whoosh 0.16 * r, 86, 110, 0.85, 0.5
  whoosh 0.13 * r, 102, 118, 0.2, 0.85
  snd :perc_swoosh, 1.8 * r, 0.4, 0.15""")
snd("swing_spear", "the spear's thrust: one rising push of air, loudest late", 1.2, """
  whoosh 0.2 * r, 76, 100, 0.9, 0.5, :pnoise, 0.75
  snd :perc_swoosh, 1.6 * r, 0.35, 0.18""")
snd("swing_axe", "the axe: lower and heavier than the sword, a body of brown noise under it", 1.2, """
  whoosh 0.28 * r, 72, 96, 0.95, 0.45
  whoosh 0.26 * r, 60, 80, 0.6, 0.3, :bnoise
  snd :perc_swoosh, 1.0 * r, 0.5, 0.26""")
snd("swing_club", "the club: low and round, no whistle", 1.2, """
  whoosh 0.3 * r, 64, 86, 1.0, 0.35, :bnoise
  whoosh 0.28 * r, 74, 92, 0.45, 0.4
  snd :perc_swoosh, 0.85 * r, 0.5, 0.28""", 104)
snd("swing_greataxe", "the Dane axe: slow and heavy, the lowest and longest", 1.4, """
  whoosh 0.36 * r, 60, 88, 1.0, 0.35, :bnoise, 0.6
  whoosh 0.33 * r, 70, 96, 0.65, 0.45, :pnoise, 0.6
  snd :perc_swoosh, 0.7 * r, 0.55, 0.34""", 108)

# ---- 2. hits on flesh and hide ---------------------------------------------------------------------------
snd("hit", "the sword on flesh: an iron edge (a bell cut to 12 ms), the skin's slap, a meaty body, a slice of noise after", 1.2, """
  slap 1.6 * r, 0.6
  flesh 1.5 * r, 0.85, 0.12
  sub 1.0 * r, 0.45, 0.1
  iron 2.6 * r, 0.16, 0.012
  slice 108, 0.35, 0.06
  grains 2, 98, 0.12""")
snd("hit_seax", "the seax: a quick thin cut, more edge than weight", 1.2, """
  slap 1.9 * r, 0.5
  slice 114, 0.55, 0.07, 0.002
  flesh 1.8 * r, 0.55, 0.08
  iron 3.0 * r, 0.12, 0.01""")
snd("hit_spear", "the spear's thrust: a punch, a hollow knock, a short low thump", 1.2, """
  flesh 1.3 * r, 1.0, 0.12
  slap 1.4 * r, 0.45
  sub 1.1 * r, 0.55, 0.12
  snd :tabla_ke1, 1.2 * r, 0.3, 0.06
  slice 102, 0.25, 0.05, 0.01""")
snd("hit_axe", "the axe: a chop that bites, a crunch in it", 1.2, """
  slap 1.3 * r, 0.55
  crunch 90, 0.6, 0.06
  flesh 1.2 * r, 0.9, 0.14
  sub 0.9 * r, 0.6, 0.14
  grains 3, 94, 0.18""")
snd("hit_club", "the club: a dull thud, no ring, no edge", 1.2, """
  flesh 1.0 * r, 1.0, 0.16, 80
  sub 0.85 * r, 0.8, 0.16
  snd :drum_tom_lo_soft, 1.1 * r, 0.4, 0.12
  slap 1.0 * r, 0.25""", 96)
snd("hit_greataxe", "the Dane axe: deep and heavy, a crunch and an impact", 1.2, """
  slap 1.1 * r, 0.5
  crunch 84, 0.7, 0.08
  flesh 0.95 * r, 1.0, 0.16
  sub 0.75 * r, 0.9, 0.18
  snd :perc_impact1, 1.1 * r, 0.4, 0.15
  grains 4, 90, 0.18""")

# ---- 3. heavy hits: the hit with more weight under it (the chain's last blow, every club and Dane axe hit) ----------
snd("heavyhit", "the sword's heavy blow: the hit with a sub, an impact and more iron", 1.4, """
  slap 1.5 * r, 0.65
  flesh 1.3 * r, 1.0, 0.16
  sub 0.7 * r, 1.0, 0.3
  snd :perc_impact1, 0.9 * r, 0.55, 0.28
  iron 2.4 * r, 0.22, 0.015
  slice 106, 0.4, 0.08
  grains 3, 96, 0.15""")
snd("heavyhit_axe", "the axe's heavy blow: a deeper bite and the weight under it", 1.4, """
  slap 1.25 * r, 0.6
  crunch 86, 0.8, 0.09
  flesh 1.1 * r, 1.0, 0.18
  sub 0.65 * r, 1.0, 0.32
  snd :perc_impact1, 0.85 * r, 0.6, 0.3
  grains 4, 92, 0.2""")
snd("heavyhit_club", "the club's heavy blow: a big dull thud, the ground's weight", 1.4, """
  flesh 0.9 * r, 1.0, 0.2, 78
  sub 0.6 * r, 1.0, 0.36
  snd :drum_bass_hard, 0.8 * r, 0.7, 0.25
  snd :perc_impact1, 0.75 * r, 0.5, 0.3
  slap 0.9 * r, 0.3""", 96)
snd("heavyhit_greataxe", "the Dane axe's heavy blow: the deepest hit, a cinematic boom under it", 1.5, """
  slap 1.05 * r, 0.55
  crunch 82, 0.9, 0.1
  flesh 0.85 * r, 1.0, 0.2
  sub 0.55 * r, 1.0, 0.4
  snd :perc_impact1, 0.7 * r, 0.65, 0.35
  snd :misc_cineboom, 1.6 * r, 0.35, 0.38
  grains 5, 88, 0.2""")

# ---- 4. defence -------------------------------------------------------------------------------------------
snd("block", "a blow stopped on a wooden round shield: a thick wooden thunk, the shield's body, a rattle of the rim", 1.2, """
  snd :elec_wood, 0.7 * r, 0.5, 0.03
  wood 1.1 * r, 1.0, 0.18
  snd :drum_tom_mid_hard, 0.8 * r, 0.5, 0.15
  sub 1.0 * r, 0.5, 0.12
  iron 1.4 * r, 0.06, 0.02
  grains 3, 86, 0.2, 0.015""", 110)
snd("parry", "the timed deflect, metal on metal: a bright ring under a low-pass (not glassy), the clash, a short scrape", 1.4, """
  snd :drum_cymbal_closed, 1.2 * r, 0.45, 0.05
  snd :perc_impact2, 1.4 * r, 0.5, 0.08
  metal :perc_bell, 1.5 * r, 0.7, 0.42, 116
  metal :perc_bell2, 1.2 * r, 0.3, 0.3, 112
  metal :drum_splash_hard, 1.3 * r, 0.3, 0.16, 114
  whoosh 0.12, 112, 116, 0.18, 0.7, :pnoise, 0.2""", 120)
snd("crit", "a sharp accent laid over a hit: a snap, an iron tick, a crack", 1.2, """
  snd :perc_snap2, 1.5 * r, 0.6, 0.05
  iron 3.2 * r, 0.3, 0.02
  snd :drum_snare_hard, 1.6 * r, 0.35, 0.06
  slice 116, 0.3, 0.05, 0.003""", 120)

# ---- 5. the new fight moments ---------------------------------------------------------------------------
def chain(n, step, amp, extra):
    return """
  metal :drum_splash_soft, %.2f * r, %.2f, 0.32, 114
  sample :perc_bell2, rpitch: %d, amp: %.2f, attack: 0, sustain: 0.12, release: 0.32
  snd :perc_impact2, 1.3 * r, %.2f, 0.1%s""" % (1.0 + 0.12 * (n - 2), 0.3 + 0.08 * (n - 2), step, amp, 0.2 + 0.15 * (n - 2), extra)
snd("chain_2", "laid over parry, a chain of two: a shimmer and a bell, a step up", 1.4, chain(2, 0, 0.4, ""))
snd("chain_3", "laid over parry, a chain of three: a major third higher, stronger", 1.4, chain(3, 4, 0.55, ""))
snd("chain_4", "laid over parry, a chain of four, the peak: a fifth higher, a boom and a cymbal under it", 1.6, chain(4, 7, 0.7, """
  sub 0.9 * r, 0.6, 0.25
  metal :drum_cymbal_hard, 0.9 * r, 0.3, 0.4, 112"""))
snd("finish", "the finishing blow (time slows): the biggest impact of the set, a cinematic boom, a crunch, a crash", 2.2, """
  slap 1.0 * r, 0.6
  crunch 84, 0.8, 0.12
  flesh 0.9 * r, 1.0, 0.2
  sub 0.7 * r, 1.0, 0.6
  snd :perc_impact1, 0.75 * r, 0.8, 0.5
  snd :misc_cineboom, 1.0 * r, 0.8, 1.0
  metal :drum_cymbal_hard, 0.8 * r, 0.3, 0.6, 110
  in_thread { sleep 0.08; whoosh 0.5, 58, 74, 0.5, 0.3, :bnoise, 0.3 }""", 114)
snd("broken", "a foe's balance breaks: a crack of wood and leather, then a reeling whoosh falling away and a low thump", 1.6, """
  snd :perc_snap, 0.9 * r, 0.6, 0.05
  wood 2.0 * r, 0.6, 0.06
  snd :elec_wood, 1.2 * r, 0.4, 0.03
  in_thread { sleep 0.04; whoosh 0.36, 92, 96, 0.5, 0.35, :bnoise, 0.15 }
  in_thread { sleep 0.06; sub 0.9 * r, 0.5, 0.16 }
  grains 4, 86, 0.18, 0.025, 0.08""", 112)
snd("heavytell", "an unparriable blow winding up: a deep gathering swell (a boom and a cymbal played backwards) that stops dead", 1.6, """
  swell :bd_boom, 0.9 * r, 0.9, 0.45
  swell :drum_cymbal_open, 1.1 * r, 0.35, 0.42
  whoosh 0.45, 56, 80, 0.55, 0.3, :bnoise, 0.95""", 100)
snd("perfect", "a dash in the last moment (time slows): an indrawn breath of air swelling backwards, then a long muffled whoosh", 1.8, """
  swell :drum_cymbal_soft, 1.0 * r, 0.25, 0.22
  in_thread { sleep 0.16; whoosh 0.45, 68, 98, 0.8, 0.3, :pnoise, 0.4 }
  in_thread { sleep 0.18; snd :perc_swoosh, 0.8 * r, 0.3, 0.4 }""", 100)
snd("stagger", "a foe stunned or reeling: a blunt knock, a dazed wobbling ring, feet scuffing", 1.6, """
  flesh 0.9 * r, 0.7, 0.12
  sub 0.9 * r, 0.5, 0.15
  with_fx :tremolo, phase: 0.06, depth: 0.8, wave: 1 do
    metal :perc_bell, 0.55 * r, 0.3, 0.38, 92
  end
  in_thread { sleep 0.06; whoosh 0.2, 84, 88, 0.25, 0.35, :pnoise, 0.2 }""", 108)

# ---- 6. the rest of a fight --------------------------------------------------------------------------------
snd("dash", "the dodge: a quick whoosh of a body moving and a flap of cloth", 1.2, """
  whoosh 0.25 * r, 74, 98, 0.9, 0.4
  snd :perc_swoosh, 1.2 * r, 0.35, 0.22
  grains 4, 82, 0.22, 0.03, 0.04""", 110)
snd("hurt", "the hero struck: darker and duller than a hit he gives", 1.2, """
  flesh 1.1 * r, 1.0, 0.14, 84
  slap 1.2 * r, 0.4
  sub 0.9 * r, 0.7, 0.15
  crunch 80, 0.35, 0.05""", 96)
snd("shoot", "the bow's release: the string's low twang and its slap on the bracer, then the arrow's thin whoosh", 1.4, """
  synth :pluck, note: 40 + rrand(-1, 1), coef: 0.15, pluck_decay: 3, noise_amp: 0.9, release: 0.18, amp: 0.8
  snd :perc_snap, 0.8 * r, 0.5, 0.04
  in_thread { sleep 0.01; whoosh 0.18 * r, 96, 112, 0.5, 0.6, :pnoise, 0.3 }""", 116)
snd("slam", "a guard broken, a heavy landing: a big low impact, the shield's wood, a clatter", 1.6, """
  sub 0.65 * r, 1.0, 0.35
  snd :drum_heavy_kick, 0.8 * r, 0.9, 0.2
  snd :perc_impact1, 0.8 * r, 0.6, 0.3
  wood 0.9 * r, 0.6, 0.15
  snd :elec_wood, 0.6 * r, 0.4, 0.04
  grains 5, 86, 0.25""", 108)
snd("die", "a man or a beast falls: the body's thud, a smaller second thud, gear rattling, a dropped weapon", 2.0, """
  flesh 0.8 * r, 0.9, 0.15, 84
  sub 0.7 * r, 0.8, 0.2
  whoosh 0.12, 60, 66, 0.4, 0.3, :bnoise, 0.1
  in_thread { sleep 0.13; flesh 0.9 * r, 0.5, 0.1, 84; sub 0.8 * r, 0.4, 0.12 }
  grains 6, 84, 0.2, 0.03, 0.05
  in_thread { sleep 0.25; wood 1.3 * r, 0.25, 0.08 }""", 104)

# ---- 7. two small cues the engine also plays (asked for by the game's session after the set went in) -----------------
snd("raise", "the hero's guard coming up: a tiny click of wood and a creak of leather, very short", 1.0, """
  snd :elec_wood, 1.5 * r, 0.35, 0.02
  wood 2.4 * r, 0.25, 0.04
  whoosh 0.07 * r, 84, 92, 0.25, 0.4, :pnoise, 0.3
  grains 2, 90, 0.12, 0.012, 0.01""", 112)
snd("tele", "a man begins a blow that CAN be parried: a short clean glint of iron, readable but small (unlike the deep heavytell)", 1.0, """
  sample :perc_bell, rate: 2.2 * r, amp: 0.55, attack: 0, sustain: 0.01, release: 0.05
  iron 3.4 * r, 0.25, 0.01
  whoosh 0.06 * r, 100, 110, 0.15, 0.6, :pnoise, 0.3""", 118)

# ---- 8. four candidates for the sword's swing (Robin, 2026-10-15: "The swing sounds with the sword are really bad.
# Parry and block are good tho.") What was wrong: a flat 170 ms wall of hiss through a resonant band-pass (a pitched,
# synthetic wind), loudest at 120 ms, i.e. after the contact. Now each candidate builds to ONE loudest moment at about
# 90 ms (the game starts the swing so that moment lands on contact and cuts it at the hit), stays under 0.25 s, and
# puts no resonant filter on noise. Measured (work/sample-shape.js): perc_swoosh 0.619 s, loudest at 0.145 s, bright;
# ambi_swoosh 1.848 s, loudest at 0.955 s, darker.
PEAKS = """
    d = sample_duration(:perc_swoosh)
    pk = 0.145
    da = sample_duration(:ambi_swoosh)
    pa = 0.955"""
snd("swing_a", "sword swing candidate A, recorded whooshes only: the short whoosh and the broad one, trimmed so both peak at 90 ms, no filter at all", 1.0, PEAKS + """
  rr = 1.15 * r
  sample :perc_swoosh, rate: rr, start: [pk - 0.09 * rr, 0].max / d, finish: [(pk + 0.12 * rr) / d, 1].min, attack: 0.07, sustain: 0.03, release: 0.1, amp: 1.0
  ra = 2.2 * r
  sample :ambi_swoosh, rate: ra, start: (pa - 0.09 * ra) / da, finish: (pa + 0.12 * ra) / da, attack: 0.08, sustain: 0.02, release: 0.1, amp: 0.6""", 130)
snd("swing_b", "sword swing candidate B, the body more than the blade: the arm's low push of air, cloth and leather rustling with it, a faint recorded whoosh under it; plain filters only", 1.0, PEAKS + """
  sample :perc_snap2, rate: 0.55 * r, amp: 0.12, attack: 0, sustain: 0.005, release: 0.02
  with_fx :lpf, cutoff: 68 do
    synth :bnoise, attack: 0.08, sustain: 0.01, release: 0.09, amp: 1.2
  end
  # the rustle: one noise, chopped into random grains by the slicer (grains scheduled one by one every 9 ms came late:
  # the headless engine could not keep up, and they smeared into a tail)
  with_fx :hpf, cutoff: 78 do
    with_fx :lpf, cutoff: 106 do
      with_fx :slicer, phase: 0.011, probability: 0.65, smooth: 0.002, wave: 1, seed: (v * 7 + 3) do
        synth :pnoise, attack: 0.085, sustain: 0.01, release: 0.1, amp: 0.7
      end
    end
  end
  rr = 1.15 * r
  sample :perc_swoosh, rate: rr, start: [pk - 0.09 * rr, 0].max / d, finish: [(pk + 0.1 * rr) / d, 1].min, attack: 0.07, sustain: 0.02, release: 0.09, amp: 0.3""", 130)
snd("swing_c", "sword swing candidate C, only a breath: the short recorded whoosh cut to about 0.12 s, loudest at 80 ms, quiet; the impact carries the blow", 1.0, PEAKS + """
  rr = 1.6 * r
  sample :perc_swoosh, rate: rr, start: [pk - 0.08 * rr, 0].max / d, finish: [(pk + 0.05 * rr) / d, 1].min, attack: 0.07, sustain: 0.01, release: 0.04, amp: 1.0""", 130)
snd("swing_d", "sword swing candidate D, a mirrored pass: the recorded whoosh played backwards so it swells into the mark, then forwards and a little lower as it goes away (the Doppler of a blade passing)", 1.0, PEAKS + """
  ra = 1.12 * r
  sample :perc_swoosh, rate: -ra, start: pk / d, finish: [(pk + 0.09 * ra) / d, 1].min, attack: 0.02, sustain: 0.065, release: 0.005, amp: 1.0
  in_thread { sleep 0.087; sample :perc_swoosh, rate: 0.9 * r, start: pk / d, finish: [(pk + 0.14 * 0.9) / d, 1].min, attack: 0.006, sustain: 0.02, release: 0.09, amp: 0.9 }
  rb = 2.4 * r
  sample :ambi_swoosh, rate: -rb, start: pa / da, finish: (pa + 0.09 * rb) / da, attack: 0.03, sustain: 0.055, release: 0.005, amp: 0.45
  in_thread { sleep 0.087; sample :ambi_swoosh, rate: 2.0 * r, start: pa / da, finish: (pa + 0.12 * 2.0) / da, attack: 0.006, sustain: 0.02, release: 0.08, amp: 0.4 }""", 130)

# ---- 9. the other weapons' swings, from the swishes Robin picked (2026-10-15: "Sword swing: E OpenGameArt a swish.
# Heavy hit: F OpenGameArt a heavier swish."). E (remaxim's "sword sound", from qubodup's Swish sounds, free for any
# use): 0.54 s, centred at 462 Hz, 95 % in the 500 Hz octave, loudest at 64 ms. F ("melee sound", same source): 0.61 s,
# 300 Hz, 98 % in the 250 Hz octave, loudest at 101 ms. Copied to sfx/combat/ref/. Each weapon is E or F played faster
# (lighter: higher and shorter) or slower (heavier: lower and longer), so its centre lands on a line from the seax at
# about 590 Hz to the Dane axe at about 255 Hz, and its loudest moment stays well inside the weapon's windup (seax 95 ms,
# spear 165, axe 185, club 215, Dane axe 435). The three variations: the rate 3 % down, as is, 3 % up.
REF = """
    e = "C:/dev/Zite/Sound Director/sfx/combat/ref/swing_e.wav"
    f = "C:/dev/Zite/Sound Director/sfx/combat/ref/swing_f.wav"
    rr = [0.97, 1.0, 1.03][v]"""
snd("swish_seax", "the seax's swing: E played 28 % faster, about 590 Hz, loudest at 50 ms, the shortest", 1.2, REF + """
  sample e, rate: 1.28 * rr, amp: 1.0""", 130)
snd("swish_spear", "the spear's thrust: E played 6 % faster, about 490 Hz, loudest at 60 ms", 1.2, REF + """
  sample e, rate: 1.06 * rr, amp: 1.0""", 130)
snd("swish_axe", "the axe's swing: E played 18 % slower with F 26 % faster under it, their peaks together at about 80 ms, about 380 Hz", 1.3, REF + """
  sample e, rate: 0.82 * rr, amp: 1.0
  sample f, rate: 1.26 * rr, amp: 0.5""", 130)
snd("swish_club", "the club's swing: F played 5 % faster, about 315 Hz, round, loudest at 96 ms", 1.3, REF + """
  sample f, rate: 1.05 * rr, amp: 1.0""", 130)
snd("swish_greataxe", "the Dane axe's swing: F played 15 % slower with E at about half speed under it, about 255 Hz, loudest at about 118 ms, the longest", 1.5, REF + """
  sample f, rate: 0.85 * rr, amp: 1.0
  sample e, rate: 0.55 * rr, amp: 0.4""", 130)

TEMPLATE = """# %(name)s: %(desc)s.
# Combat set, 2026-10-15 (the game's session for Robin: "Let's work on the attack sounds"). Written by sfx/combat/_make.py;
# change it there. Layers from sfx/combat/_kit.rb (docs/sfx-notes.md): samples and noise only in a strike, no room tail.
# name: %(name)s
# seconds: %(secs).1f
# count: 3

use_bpm 60                                  # times in seconds
eval File.read("C:/dev/Zite/Sound Director/sfx/combat/_kit.rb")

define :one do |v|
  use_random_seed %(seed)d + v
  r = 1 + rrand(-0.05, 0.05)
  with_fx :lpf, cutoff: %(cut)d do%(body)s
  end
end

3.times do |v|
  one v
  sleep %(gap).1f
end
"""
for k, (name, (desc, gap, body, cut)) in enumerate(S.items()):
    body = body.replace("\n  ", "\n    ")
    src = TEMPLATE % dict(name=name, desc=desc, secs=3 * gap + 0.5, seed=700 + 10 * k, cut=cut, body=body, gap=gap)
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(src)
print(len(S), "sources written:", " ".join(S))
