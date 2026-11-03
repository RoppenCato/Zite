# Writes the fight set's layered sources (sfx/fight/<name>.rb) from one spec, and copies the plain library sounds into out/sfx/fight/.
# Run: python -I sfx/fight/_make.py. Nigel, SD, 2026-11-01. Names are Miles, GD's (docs/game-notes.md): three variations for the swing,
# the hits, the miss and the enemy's blows, one for the rest. Robin's rule (2026-11-01): the Survival game's sounds first. His picks go in
# as they are; the Survival fight's low thumps (hurt, stagger, slam: 96 to 100 % under 250 Hz, gone on a phone) get a layer in the mids.
import os, shutil, subprocess, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SG = "C:/dev/SG/Sound Director/"
OUT = os.path.join(ROOT, "out", "sfx", "fight")
os.makedirs(OUT, exist_ok=True)
GRUNTS = sorted(os.path.basename(f) for f in glob.glob(SG + "sfx/flesh/ref/oga_male_grunts/files/yelling sounds/3grunt*.wav"))
assert GRUNTS, "no recorded grunts"

# ---- plain copies: studio name -> (Survival set, its name, how many) ------------------------------------------------------------------
COPY = {"hit_light": ("flesh", "hit_w", 3), "hit_heavy": ("flesh", "heavyhit_x", 3), "miss": ("combat", "swish_seax", 3),
        "enemy_hit_light": ("chapter1", "hit_club_v", 3), "enemy_hit_heavy": ("chapter1", "heavyhit_club_v", 3),
        "guard_counter": ("combat", "parry", 1), "guard_dodge": ("combat", "dash", 1), "effect_trap": ("runes", "trap_arm_a", 1),
        "effect_surecrit": ("combat", "tele", 1)}
for name, (sset, src, n) in COPY.items():
    for i in range(1, n + 1):
        dst = os.path.join(OUT, "%s_%d.wav" % (name, i))
        if not os.path.exists(dst):                                      # never over a levelled master
            shutil.copyfile(SG + "out/sfx/%s/%s_%d.wav" % (sset, src, i), dst)
# the block is Robin's pick from the free set, an OGG: decoded to the studio's format
FF = "C:/dev/ffmpeg/bin/ffmpeg.exe"
if not os.path.exists(os.path.join(OUT, "guard_block_1.wav")): subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", "C:/dev/SG/Game Developer/assets/sfx/free/block_a_1.ogg", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", os.path.join(OUT, "guard_block_1.wav")], check=True)

HEAD = """# {name}: {desc}
# The fight sprite (Miles, GD's name fight/{game}). Layers from the Survival game's recordings, its picks first (docs/survival-library.md);
# the bells and strings are the studio's. Written by sfx/fight/_make.py; change it there.
# name: {name}
# seconds: {secs}
# count: {count}

use_bpm 60                                   # times in seconds
S = "C:/dev/SG/Sound Director/out/sfx/"
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
K = "C:/dev/SG/Sound Director/sfx/world/ref/kenney/"
GRUNT = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_male_grunts/files/yelling sounds/{grunt}"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :horn do |n, d, amp|                   # saws through a low-pass: a triangle reads as a flute (docs/maple-guide.md)
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.2, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.18, amp: amp * 0.12
  end
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
define :cut do |path, rate, amp, len, st = 0|  # a recording cut to a length with no tail
  sample path, rate: rate, amp: amp, start: st, attack: 0, sustain: len * 0.6, release: len * 0.4
end
"""
BODY = """
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
L = {}
def snd(name, game, desc, gap, body, count=1):
    L[name] = dict(name=name, game=game, desc=desc, gap=gap, body=body, count=count)

# ---- every round ----------------------------------------------------------------------------------------------------------------------
snd("swing", "swing", "the Knight's swing: Robin's pick E (a low-mid whoom, sfx/combat/ref in the Survival studio), a small change of speed.", 1.1, """
  sample "C:/dev/SG/Sound Director/sfx/combat/ref/swing_e.wav", rate: [0.97, 1.0, 1.03][v], amp: 1.0""", 3)
snd("crit", "crit", "a crit: Robin's slap with the Survival crit's crack on top and a wooden snap: bigger than a hit, a crack.", 1.1, """
  sample S + "flesh/hit_w_#{v + 1}.wav", amp: 0.9
  sample S + "combat/crit_#{v + 1}.wav", rate: 1.1, amp: 0.9
  sample C + "wood_hit_01.wav", rate: 1.1 * r, amp: 0.7, attack: 0, sustain: 0.03, release: 0.05
  at [0.03] do sample S + "flesh/heavyhit_x_#{v + 1}.wav", amp: 0.5 end""", 3)
snd("guard_brace", "guard-brace", "Brace: a blow taken: the Survival hurt (a pure low thud), a wooden knock so a phone hears it, a recorded man's grunt 40 ms later.", 1.3, """
  sample S + "combat/hurt_1.wav", amp: 0.3
  sample S + "chapter1/hit_club_v_1.wav", rate: 0.95, amp: 0.9
  at [0.04] do sample "C:/dev/Zite/Sound Director/sfx/fight/ref/cut/grunt.wav", amp: 0.5, attack: 0, sustain: 0.2, release: 0.12 end  # HaelDB CC0, cut past its silent head""")
snd("enemy_windup", "enemy-windup", "Guard well: an ominous intake: a dark breath drawn (the shadowstep's recording, slower) over the Survival wind-up's low swell.", 1.4, """
  sample S + "runes/shadowstep_a_1.wav", rate: 0.75, amp: 1.0
  sample S + "combat/heavytell_1.wav", amp: 0.3
  str 62, 0.3, 0.1, 0.12, 0.13; str 65, 0.3, 0.1, 0.12, 0.11
  at [0.34] do bell 62, 0.5, 0.3 end""")
snd("meter_pip", "meter-pip", "Valor's pip: one beat of a hand drum, tuned up so a phone carries it.", 1.0, """
  sample :drum_tom_hi_soft, rate: 1.6, amp: 0.9, attack: 0, sustain: 0.05, release: 0.08
  sample C + "wood_hit_05.wav", rate: 1.3, amp: 0.5, attack: 0, sustain: 0.03, release: 0.05""")

snd("dodge", "dodge", "a dodge pops on screen (Robin's first-chapter notes, 2026-11-02): a clear whoosh, in the mids: the recorded dash, quicker, with swing E high and short.", 1.1, """
  sample S + "combat/dash_2.wav", rate: 1.2, amp: 0.9
  sample "C:/dev/SG/Sound Director/sfx/combat/ref/swing_e.wav", rate: 1.5, amp: 0.5""")

# ---- the opening and the end ----------------------------------------------------------------------------------------------------------
# Robin, 2026-11-03: "Tone down the intro and outro tune, use another instrument." The horn, bells and hard toms are gone: a piano and plucked strings,
# soft hand drums, 3 dB quieter (_levels.json). The earlier versions are in out/_archive/fight-begin-victory-2026-11-03/.
snd("begin", "begin", "the fight opens: two soft hand-drum taps into G4 and C5 on a piano, a pluck doubling them, a short string swell; light, not a fanfare. 0.9 s.", 1.7, """
  [[0.0, 0.25], [0.12, 0.32]].each do |t, a|
    at [t] do sample :drum_tom_mid_soft, rate: 1.4, amp: a end
  end
  at [0.26] do
    synth :piano, note: 67, vel: 0.45, hard: 0.5, amp: 0.8
    synth :pluck, note: 55, coef: 0.35, pluck_decay: 20, amp: 0.4
  end
  at [0.42] do
    synth :piano, note: 72, vel: 0.5, hard: 0.55, amp: 0.9; synth :piano, note: 64, vel: 0.4, hard: 0.5, amp: 0.5
    synth :pluck, note: 48, coef: 0.35, pluck_decay: 20, amp: 0.45
    sample :drum_tom_mid_soft, rate: 1.2, amp: 0.3
    str 60, 0.04, 0.22, 0.2, 0.08; str 67, 0.04, 0.22, 0.2, 0.07
  end""")
snd("victory", "victory", "a fight won: E5 E5 G5 and a held C6 on a piano, plucked strings doubling the tune an octave down, a soft string chord under the last note: the same little tune, gentler. 1.5 s.", 2.3, """
  [[0.0, 76], [0.13, 76], [0.26, 79]].each do |t, n|
    at [t] do synth :piano, note: n, vel: 0.42, hard: 0.5, amp: 0.8; synth :pluck, note: n - 12, coef: 0.3, pluck_decay: 25, amp: 0.4 end
  end
  at [0.52] do
    synth :piano, note: 84, vel: 0.5, hard: 0.55, amp: 0.9; synth :piano, note: 76, vel: 0.4, hard: 0.5, amp: 0.55; synth :piano, note: 72, vel: 0.35, hard: 0.45, amp: 0.5
    synth :pluck, note: 60, coef: 0.3, pluck_decay: 25, amp: 0.45
    str 60, 0.05, 0.55, 0.35, 0.1; str 64, 0.05, 0.55, 0.35, 0.09; str 67, 0.05, 0.55, 0.35, 0.08
  end""")
snd("defeat", "defeat", "a fight lost: G4 Eb4 D4 and a long C4 on a soft reed, slower, a low string under it; sorry, not grim. 2 s.", 2.8, """
  with_fx :lpf, cutoff: 90 do
    [[0.0, 67, 0.3], [0.36, 63, 0.3], [0.72, 62, 0.3], [1.08, 60, 0.6]].each do |t, n, d|
      at [t] do synth :pulse, note: n, pulse_width: 0.5, attack: 0.06, sustain: d, release: 0.18, amp: 0.34 end
    end
  end
  str 48, 0.3, 1.2, 0.5, 0.13
  at [1.08] do str 55, 0.1, 0.6, 0.4, 0.09; sample :drum_tom_lo_soft, rate: 0.95, amp: 0.4 end""")
snd("drop", "drop", "a drop rolling onto the card: three light knocks slowing down, then the card's page flip.", 1.3, """
  [[0.0, 0.8], [0.09, 0.65], [0.21, 0.5]].each do |t, a|
    at [t] do sample C + "raise_e_1.wav", rate: 1.5, amp: a, attack: 0, sustain: 0.02, release: 0.04 end
  end
  at [0.27] do sample C + "bookFlip2.wav", rate: 1.3, amp: 0.7, attack: 0.005, sustain: 0.14, release: 0.08 end""")
snd("flee", "flee", "hurried steps: five quick grass steps (Kenney), getting away, a little whoosh.", 1.5, """
  [0, 2, 4, 1, 3].each_with_index do |k, i|
    at [i * 0.105] do sample K + "footstep_grass_00#{k}.ogg", rate: 1.15, amp: 1.0 - i * 0.12, attack: 0, sustain: 0.05, release: 0.04 end
  end
  sample S + "combat/dash_2.wav", rate: 1.1, amp: 0.3""")
snd("caught", "caught", "a flee that failed: the club's thud on the back, the low slam under it, a grunt.", 1.4, """
  sample S + "chapter1/hit_club_v_2.wav", amp: 1.0
  sample S + "combat/slam_1.wav", amp: 0.6
  at [0.05] do sample "C:/dev/Zite/Sound Director/sfx/fight/ref/cut/grunt.wav", rate: 1.05, amp: 0.45, attack: 0, sustain: 0.18, release: 0.1 end""")
snd("phase", "phase", "the enemy's second phase: a dark swell: the low wind-up slowed, a minor chord of strings rising, a heavy knock at the top.", 2.3, """
  sample S + "combat/heavytell_2.wav", rate: 0.7, amp: 0.3
  str 60, 0.7, 0.4, 0.4, 0.2; str 67, 0.75, 0.35, 0.4, 0.18; str 75, 0.8, 0.3, 0.4, 0.15
  at [0.72] do
    sample S + "chapter1/hit_club_v_1.wav", rate: 0.85, amp: 1.0
    sample :drum_tom_mid_hard, rate: 0.9, amp: 0.5
  end""")

# ---- the round sent -------------------------------------------------------------------------------------------------------------------
snd("charge", "charge", "Charge: the power gathering: a low swell from the recorded storm, small bells climbing in the middle so a phone hears it rise. 1 s.", 1.9, """
  sample S + "runes/storm_gather_a_1.wav", start: 0.2, finish: 0.59, amp: 0.8, attack: 0.05, release: 0.05
  [60, 62, 64, 67, 69, 72, 74, 76].each_with_index do |n, i|
    at [0.12 + i * 0.1] do bell n, 0.16 + i * 0.05, 0.3 end
  end
  str 60, 0.8, 0.1, 0.15, 0.1""")
snd("potion", "potion", "Honey Tonic: three glugs of a recorded drop rising, then a sigh (a breath, slowed).", 1.6, """
  [[0.0, 0.8], [0.13, 0.92], [0.26, 1.05]].each do |t, ra|
    at [t] do sample S + "fishing/fish_bite_a_1.wav", rate: ra, amp: 0.8, attack: 0, sustain: 0.07, release: 0.06 end
  end
  at [0.42] do sample S + "runes/shadowstep_a_2.wav", rate: 0.7, amp: 0.45 end""")
snd("mana_potion", "mana-potion", "Moon Dew: one recorded sip, higher, then a sparkle of small bells.", 1.5, """
  sample S + "fishing/fish_bite_a_2.wav", rate: 1.4, amp: 0.7, attack: 0, sustain: 0.07, release: 0.06
  at [0.14] do sample S + "fishing/fish_bite_a_1.wav", rate: 1.6, amp: 0.6, attack: 0, sustain: 0.06, release: 0.05 end
  [[0.26, 88], [0.34, 91], [0.42, 96], [0.5, 100]].each do |t, n|
    at [t] do bell n, 0.4, 0.3 end
  end""")
snd("ability_heavy_blow", "ability-heavy-blow", "Mighty Swing: Robin's heavy swing F slowed into a great whoosh, then the heavy hit with a crunch of wood at 0.3 s.", 1.6, """
  sample S + "runes/overhead_a_1.wav", amp: 0.9
  sample "C:/dev/SG/Sound Director/sfx/combat/ref/swing_f.wav", rate: 0.8, amp: 0.7
  at [0.3] do
    sample S + "flesh/heavyhit_x_2.wav", amp: 1.0
    sample S + "runes/guard_break_a_1.wav", rate: 1.1, amp: 0.6
  end""")
snd("ability_shield_bash", "ability-shield-bash", "Shield Bonk: a comic bonk: the club's knock, a tom pitched up hard, the shield's wood bouncing twice.", 1.3, """
  sample S + "chapter1/hit_club_v_3.wav", rate: 1.1, amp: 0.8
  sample :drum_tom_hi_hard, rate: 1.7, amp: 0.8
  at [0.1] do sample C + "wood_hit_07.wav", rate: 1.5, amp: 0.5, attack: 0, sustain: 0.03, release: 0.05 end
  at [0.17] do sample C + "wood_hit_07.wav", rate: 1.9, amp: 0.3, attack: 0, sustain: 0.02, release: 0.04 end""")
snd("ability_war_cry", "ability-war-cry", "Battle Hymn: a horn's short sung phrase, G4 C5 E5 held, strings under it, a hand drum on each note. 1.2 s.", 2.0, """
  [[0.0, 67, 0.16], [0.24, 72, 0.16], [0.48, 76, 0.55]].each do |t, n, d|
    at [t] do horn n, d, 1.0; sample :drum_tom_mid_soft, rate: 1.2, amp: 0.5 end
  end
  at [0.48] do str 60, 0.05, 0.55, 0.3, 0.13; str 67, 0.05, 0.55, 0.3, 0.11 end""")
snd("ability_execute", "ability-execute", "Finishing Flourish: steel: the recorded riposte, the sweep's whoosh turning, a parry's ring on the last touch.", 1.6, """
  sample S + "runes/sweep_a_1.wav", rate: 1.2, amp: 0.7
  sample S + "runes/riposte_a_1.wav", amp: 0.8
  at [0.18] do sample S + "runes/riposte_a_2.wav", rate: 1.1, amp: 0.8 end
  at [0.36] do
    sample S + "combat/parry_2.wav", rate: 1.1, amp: 0.8
    sample S + "flesh/hit_w_2.wav", amp: 0.7
  end""")
snd("ability_rally", "ability-rally", "Second Wind: a breath drawn, then a lift: strings opening and three bells rising.", 1.8, """
  sample S + "runes/shadowstep_a_1.wav", rate: 0.8, amp: 0.8
  at [0.34] do str 60, 0.08, 0.3, 0.3, 0.12; str 67, 0.1, 0.3, 0.3, 0.1; str 76, 0.15, 0.25, 0.3, 0.07 end
  [[0.34, 79], [0.46, 84], [0.58, 88]].each do |t, n|
    at [t] do bell n, 0.55, 0.45 end
  end""")
snd("ability_shield_wall", "ability-shield-wall", "Castle Stance: stone settling: the recorded stone breaking, slowed, a heavier split under it, grit falling.", 1.5, """
  sample S + "runes/stone_break_a_1.wav", rate: 0.8, amp: 1.0
  sample S + "runes/rock_split_a_1.wav", rate: 0.85, amp: 0.7, attack: 0, sustain: 0.3, release: 0.25
  at [0.2] do sample C + "wood_falling_02.wav", rate: 0.75, amp: 0.35, attack: 0, sustain: 0.15, release: 0.15 end""")

# ---- the effects ----------------------------------------------------------------------------------------------------------------------
snd("effect_stunned", "effect-stunned", "stunned: the Survival stagger's knock and a wooden one, then little bells circling, the stars round the head.", 1.5, """
  sample S + "combat/stagger_1.wav", amp: 0.3
  sample C + "wood_hit_05.wav", rate: 0.8, amp: 0.9, attack: 0, sustain: 0.03, release: 0.06
  [[0.1, 91], [0.2, 88], [0.3, 91], [0.4, 88], [0.5, 91]].each do |t, n|
    at [t] do bell n, 0.45, 0.2 end
  end""")
snd("effect_weakened", "effect-weakened", "weakened: two bells falling, a low string sagging under them.", 1.3, """
  bell 76, 0.5, 0.3
  at [0.16] do bell 69, 0.45, 0.4 end
  str 52, 0.03, 0.25, 0.2, 0.12""")
snd("effect_poison", "effect-poison", "poisoned: the recorded drip, quicker, and the hiss of the broken pot.", 1.4, """
  sample S + "runes/blood_drip_a_1.wav", rate: 1.3, amp: 0.9, attack: 0, sustain: 0.2, release: 0.15
  at [0.08] do sample S + "runes/trap_poison_a_1.wav", start: 0.5, amp: 0.3, attack: 0.02, sustain: 0.15, release: 0.12 end""")
snd("effect_poison_tick", "effect-poison-tick", "a poison tick: one small drip.", 1.0, """
  sample S + "runes/blood_drip_a_2.wav", rate: 1.5, amp: 0.9, attack: 0, sustain: 0.12, release: 0.1""")
snd("effect_armoured", "effect-armoured", "armoured: a clink of iron: the parry's first touch cut short, a knock under it.", 1.1, """
  sample S + "combat/parry_3.wav", amp: 0.8, attack: 0, sustain: 0.12, release: 0.1
  sample C + "wood_hit_05.wav", rate: 1.0, amp: 0.4, attack: 0, sustain: 0.03, release: 0.05""")
snd("effect_evade", "effect-evade", "ready to evade: a light rush of air and one small bell.", 1.1, """
  sample S + "combat/dash_3.wav", rate: 1.25, amp: 0.7
  at [0.1] do bell 86, 0.3, 0.2 end""")
snd("effect_mark", "effect-mark", "marked: a small knock and a thin high note that hangs a moment.", 1.1, """
  sample C + "raise_e_1.wav", rate: 1.3, amp: 0.6, attack: 0, sustain: 0.02, release: 0.04
  at [0.03] do bell 93, 0.45, 0.45 end""")
snd("effect_skip", "effect-skip", "a turn lost: one dull knock and a soft falling note.", 1.1, """
  sample C + "wood_hit_05.wav", rate: 0.75, amp: 0.8, attack: 0, sustain: 0.04, release: 0.07
  at [0.1] do bell 64, 0.3, 0.3 end""")
snd("effect_attackup", "effect-attackUp", "attack raised: a hand drum and two rising horn notes, short.", 1.2, """
  sample :drum_tom_mid_soft, rate: 1.2, amp: 0.5
  horn 67, 0.06, 0.8
  at [0.13] do horn 74, 0.2, 0.9; sample :drum_tom_mid_soft, rate: 1.4, amp: 0.5 end""")
snd("effect_barrier", "effect-barrier", "a barrier up: strings swelling on an open fifth, one ringing bell chord on top.", 1.5, """
  str 60, 0.12, 0.2, 0.25, 0.13; str 67, 0.12, 0.2, 0.25, 0.11; str 79, 0.15, 0.15, 0.25, 0.07
  at [0.12] do bell 84, 0.45, 0.5; bell 91, 0.35, 0.5 end""")
snd("effect_companion", "effect-companion", "a companion joins: a little two-note whistle, a friendly hello.", 1.2, """
  [[0.0, 79, 0.08], [0.13, 84, 0.16]].each do |t, n, d|
    at [t] do
      synth :sine, note: n, attack: 0.02, sustain: d, release: 0.08, amp: 0.4
      synth :tri, note: n + 12, attack: 0.02, sustain: d, release: 0.06, amp: 0.06
    end
  end""")
snd("effect_windup", "effect-windup", "winding up for next turn: a short breath in and low bells climbing.", 1.2, """
  sample S + "runes/shadowstep_a_2.wav", rate: 0.9, amp: 0.6
  [[0.08, 60], [0.17, 64], [0.26, 67]].each do |t, n|
    at [t] do bell n, 0.4, 0.2 end
  end""")
snd("effect_drained", "effect-drained", "mana drained: five bells falling and dimming under a closing filter.", 1.4, """
  with_fx :lpf, cutoff: 96 do
    [[0.0, 88, 0.5], [0.07, 84, 0.45], [0.14, 81, 0.4], [0.21, 76, 0.35], [0.28, 72, 0.3]].each do |t, n, a|
      at [t] do bell n, a, 0.25 end
    end
  end""")
snd("heal", "heal", "healed: three bells rising over a warm string chord, 0.6 s.", 1.4, """
  str 60, 0.05, 0.25, 0.25, 0.11; str 64, 0.05, 0.25, 0.25, 0.1; str 67, 0.05, 0.25, 0.25, 0.09
  [[0.0, 76], [0.09, 79], [0.18, 84]].each do |t, n|
    at [t] do bell n, 0.65, 0.4 end
  end""")
snd("revive", "revive", "revived: a breath, then a long rising run of bells and a wide chord, 1.2 s.", 2.1, """
  sample S + "runes/shadowstep_a_1.wav", rate: 0.8, amp: 0.6
  str 48, 0.2, 0.6, 0.35, 0.12; str 60, 0.25, 0.55, 0.35, 0.12; str 67, 0.3, 0.5, 0.35, 0.1; str 76, 0.4, 0.4, 0.35, 0.08
  [[0.2, 72], [0.29, 76], [0.38, 79], [0.47, 84], [0.56, 88], [0.65, 91]].each do |t, n|
    at [t] do bell n, 0.55, 0.45 end
  end""")

for k, (name, s) in enumerate(L.items()):
    secs = round(s["count"] * s["gap"] + 0.5, 1)
    src = HEAD.format(name=name, game=s["game"], desc=s["desc"], secs=secs, count=s["count"], grunt=GRUNTS[0])
    src += BODY.format(seed=4000 + 10 * k, body=s["body"], gap="%.1f" % s["gap"], count=s["count"])
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(src)
open(os.path.join(HERE, "_list.txt"), "w").write("\n".join(L) + "\n")
print(len(COPY) + 1, "copied;", len(L), "sources written; grunt:", GRUNTS[0])
