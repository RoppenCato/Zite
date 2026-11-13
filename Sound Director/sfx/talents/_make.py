# The pressed talents (Miles, GD, 2026-11-02: about 90 with no sound; Robin's rules: the Survival library first, keep it light). Not 99 sounds: the sounds the
# game already has, plus fifteen new family sounds in one sprite `fight-talents`, loaded for every class. Writes the sources, the levels, and
# out/sfx/talents/game/talent-map.json: { ability id: sound name } for all pressed talents, checked against rules/data/abilities.json.
# Run: python -I sfx/talents/_make.py. Nigel, SD, 2026-11-02.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
GAME = os.path.join(os.path.dirname(ROOT), "Game Developer", "rules", "data", "abilities.json")

HEAD = """# {name}: {desc}
# The talents' family sounds, written by sfx/talents/_make.py; change it there. Recordings from the Survival studio (CC0, docs/survival-library.md).
# name: {name}
# seconds: {secs}
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :bell do |n, amp, rel|
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :str do |n, a, s, rel, amp|
  synth :blade, note: n, attack: a, sustain: s, release: rel, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: amp
end
use_random_seed {seed}
{body}
sleep {gap}
"""
F = {}
def fam(name, desc, gap, target, mx, body):
    F[name] = dict(desc=desc, gap=gap, target=target, max=mx, body=body)

fam("holy_hit", "a holy blow: Robin's heavy hit with a bright chord of bells on it.", 1.4, 2, 0.8, """sample S + "flesh/heavyhit_x_1.wav", amp: 1.0
sample S + "flesh/hit_w_1.wav", amp: 0.6
at [0.01] do bell 84, 0.7, 0.5; bell 91, 0.5, 0.5; bell 88, 0.4, 0.45 end""")
fam("holy_blast", "a blast of light: strings opening fast, bells running up, a soft crack.", 1.7, 2, 1.1, """str 60, 0.08, 0.45, 0.4, 0.15; str 67, 0.08, 0.45, 0.4, 0.13; str 76, 0.1, 0.4, 0.4, 0.11
[[0.0, 79], [0.07, 84], [0.14, 88], [0.21, 91], [0.28, 96]].each do |t, n|
  at [t] do bell n, 0.6, 0.45 end
end
at [0.26] do sample S + "runes/guard_break_a_2.wav", rate: 1.3, amp: 0.45 end""")
fam("roar", "a berserk's roar and a hit of the blood: the recorded roar, the drip.", 1.5, 1, 0.9, """sample S + "runes/berserk_roar_a_1.wav", amp: 0.9, attack: 0, sustain: 0.45, release: 0.25
at [0.04] do sample S + "runes/blood_drip_a_1.wav", amp: 0.5, attack: 0, sustain: 0.2, release: 0.15 end""")
fam("cleave", "wild swings: the recorded sweep and two heavy hits close together.", 1.5, 3, 0.9, """sample S + "runes/sweep_a_1.wav", rate: 1.15, amp: 0.8
at [0.14] do sample S + "flesh/heavyhit_x_2.wav", amp: 1.0; sample S + "flesh/hit_w_2.wav", amp: 0.5 end
at [0.34] do sample S + "flesh/heavyhit_x_3.wav", rate: 0.95, amp: 1.0; sample S + "flesh/hit_w_3.wav", amp: 0.5 end""")
fam("arcane_bolt", "a bolt of magic: a quick run of bells and the recorded rune's front, a knock on arrival.", 1.3, 1, 0.7, """[[0.0, 72], [0.04, 79], [0.08, 84], [0.12, 91]].each do |t, n|
  at [t] do bell n, 0.6, 0.22 end
end
sample S + "combat/swish_seax_1.wav", rate: 1.4, amp: 0.45
at [0.16] do sample S + "runes/rune_ready_a_1.wav", amp: 0.5, attack: 0, sustain: 0.2, release: 0.15; sample S + "chapter1/hit_club_v_1.wav", rate: 1.2, amp: 0.7 end""")
fam("fire_small", "a quick flame: a rush, the recorded fire arrow, a crackle.", 1.3, 1, 0.7, """with_fx :hpf, cutoff: 52 do sample S + "runes/fire_arrow_a_2.wav", rate: 1.25, amp: 1.0 end
at [0.1] do sample S + "runes/fire_burn_man_a_1.wav", start: 0.3, amp: 0.9, attack: 0.02, sustain: 0.25, release: 0.2 end""")
fam("blade_charge", "a blade charged with frost or storm: a small recorded lightning under rising bells and a string's edge.", 1.6, 0, 1.0, """sample S + "runes/lightning_small_a_1.wav", rate: 1.2, amp: 0.7
sample S + "runes/rune_ready_a_2.wav", amp: 0.7
[[0.05, 79], [0.13, 86], [0.21, 91], [0.29, 98]].each do |t, n|
  at [t] do bell n, 0.45, 0.3 end
end
str 67, 0.2, 0.3, 0.25, 0.1""")
fam("triple_cut", "three quick cuts: the recorded riposte three times, a bright hit on the last; under 7 kHz (the first render centred at 5 kHz).", 1.3, 2, 0.7, """with_fx :lpf, cutoff: 112 do
  [[0.0, 1, 0.9], [0.12, 2, 0.95], [0.24, 3, 1.0]].each do |t, f, ra|
    at [t] do sample S + "runes/riposte_a_#{f}.wav", rate: ra, amp: 0.8 end
  end
  at [0.25] do sample S + "flesh/hit_w_4.wav", amp: 1.0 end
end""")
fam("thrown", "thrown stars: four thin whooshes and little metal ticks.", 1.3, 0, 0.7, """[0.0, 0.09, 0.18, 0.27].each_with_index do |t, i|
  at [t] do
    sample S + "combat/swish_seax_#{(i % 3) + 1}.wav", rate: 1.7, amp: 0.6
    sample S + "combat/tele_#{(i % 3) + 1}.wav", rate: 1.0 - i * 0.05, amp: 0.5
  end
end""")
fam("clone", "a copy of you: the recorded shadowstep twice, a shadow behind itself, a falling pair of bells.", 1.5, 0, 0.9, """sample S + "runes/shadowstep_a_1.wav", amp: 0.8
at [0.14] do sample S + "runes/shadowstep_a_2.wav", rate: 1.2, amp: 0.7 end
at [0.3] do bell 79, 0.45, 0.35; bell 74, 0.4, 0.35 end""")
fam("dark_cut", "a hard cut from the dark: a breath drawn, the heavy hit and the edge.", 1.3, 3, 0.7, """sample S + "runes/shadowstep_a_2.wav", rate: 1.4, amp: 0.6
at [0.16] do
  sample S + "runes/riposte_a_2.wav", rate: 0.9, amp: 0.9
  sample S + "flesh/heavyhit_x_1.wav", amp: 0.9
  sample S + "combat/crit_2.wav", amp: 0.7
end""")
fam("flask", "a flask thrown and broken: the recorded poison pot, a wet splat, the hiss.", 1.4, 0, 0.8, """sample S + "combat/swish_seax_2.wav", rate: 1.2, amp: 0.4
at [0.1] do sample S + "runes/trap_poison_a_2.wav", amp: 1.0, attack: 0, sustain: 0.4, release: 0.2 end""")
fam("arrow_rain", "arrows from above: Robin's bow shot up, then five small thuds falling around.", 1.6, 1, 1.0, """sample S + "bow/shoot_b_1.wav", amp: 0.9
at [0.04] do sample S + "bow/shoot_b_2.wav", amp: 0.6 end
[[0.3, 2], [0.38, 1], [0.47, 3], [0.54, 2], [0.63, 1]].each do |t, f|
  at [t] do sample S + "chapter1/hit_club_v_#{f}.wav", rate: 1.5, amp: 0.55 end
end""")
fam("bow_ready", "a bow held ready: the string drawn (the recorded trap's catch, low), a soft hum of the string.", 1.2, -3, 0.6, """sample S + "runes/trap_arm_a_1.wav", rate: 0.8, amp: 0.7
at [0.08] do sample S + "bow/shoot_b_3.wav", rate: 0.6, amp: 0.5 end""")
fam("owl_swoop", "the owl dives: wings (Robin's sail flap), a rush, a hard hit and a hoot.", 1.5, 3, 0.9, """sample S + "ships/sail_flap_b_2.wav", rate: 1.7, amp: 0.8, attack: 0, sustain: 0.15, release: 0.1
sample S + "combat/swish_axe_1.wav", rate: 1.2, amp: 0.7
at [0.22] do sample S + "flesh/hit_w_1.wav", amp: 0.9; sample S + "flesh/heavyhit_x_2.wav", amp: 0.6 end
at [0.34] do synth :sine, note: 69, attack: 0.04, sustain: 0.12, release: 0.1, amp: 0.3 end""")

T = "fight/talent-"
A = "fight/ability-"
MAP = {
  # their own sounds, already in the game
  **{i: A + i for i in ["heavy-blow", "execute", "shield-bash", "shield-wall", "backstab", "eviscerate", "shadowstep", "pickpocket", "arcane-shield", "fireball", "meteor", "volley", "aimed-shot", "hawk", "mark"]},
  # the Knight's trees (fight and fight-talents only: fight-classes does not load for him)
  "war-valor": T + "banner-valor", "war-dread": T + "banner-dread", "war-war": T + "banner-war", "war-all": T + "banner-all",
  "war-cry": T + "war-cry", "war-hold": T + "hold", "war-roar": T + "roar",   # the Warlord, replacing the Paladin (Robin, 2026-11-10)
  "reckless": T + "cleave", "blood-price": T + "roar", "bloodbath": T + "cleave", "ber-cleave": T + "cleave", "ber-frenzy": T + "roar", "ber-rampage": T + "cleave",
  "shield-slam": A + "shield-bash", "kni-charge": A + "shield-bash", "iron-retort": "fight/guard-counter", "bulwark": A + "shield-wall", "kni-rampart": A + "shield-wall", "kni-fortress": A + "shield-wall", "kni-taunt": A + "war-cry",
  # the Wizard's
  "arcane-bolt": T + "arcane-bolt", "overflow": A + "mana-shield", "spl-thrust": T + "arcane-bolt", "detonate": T + "fire-small", "wiz-scorch": T + "fire-small", "wiz-combust": T + "flare", "wiz-firestorm": A + "meteor", "wiz-phoenix": "fight/revive",
  "smite": T + "holy-blast", "mend": "fight/heal", "judgement-day": T + "holy-blast", "cle-renew": "fight/heal", "cle-lance": T + "holy-blast", "cle-sanctuary": A + "arcane-shield", "cle-ascend": "fight/revive",
  "frost-blade": A + "frost-bolt", "storm-blade": T + "blade-charge", "spl-shift": T + "shift", "spl-avatar": T + "blade-charge", "arc-slash": T + "triple-cut", "spl-whirl": T + "triple-cut",
  # the Trickster's
  "smoke-escape": A + "smoke-bomb", "nin-vanish": A + "smoke-bomb", "sha-blind": A + "smoke-bomb", "shadow-dance": A + "shadowstep",
  "clone": T + "clone", "nin-army": T + "clone", "ambush": T + "dark-cut", "assassinate": T + "dark-cut", "sha-gloom": T + "night-cut", "sha-reaper": T + "dark-cut", "sha-cut": A + "backstab",
  "crimson-arc": T + "blood", "bleed-out": T + "blood",                 # the new Rogue (Miles, GD, 2026-11-03)
  "magic-power": T + "magic-power",                                     # replaces the Pocket Watch (Robin, 2026-11-03)
  "thousand-cuts": T + "triple-cut", "toxic-jab": A + "poison-blade",
  "poison-coat": A + "poison-blade", "bitter-end": A + "poison-blade", "caustic-flask": T + "flask", "alc-plague": T + "flask", "alc-bomb": T + "fire-small", "alc-philosopher": "fight/revive",
  # the Archer's
  "sure-shot": A + "aimed-shot", "ran-pin": A + "aimed-shot", "ran-snipe": A + "aimed-shot", "ran-barrage": A + "volley", "rain-arrows": T + "arrow-rain",
  # the Hunter rebuilt (Robin, 2026-11-12): pets, traps, bleeds
  "ran-rend": T + "rend", "ran-bleed-dry": T + "bleed-dry",
  "bea-wolf": T + "call", "bea-bear": T + "call", "bea-viper": T + "call", "bea-stampede": T + "call",   # the whistle; the cue (effect-pet-<pet>, effect-stampede) follows
  "bea-kill": T + "kill-command", "bea-stoop": T + "owl-swoop",
  "spike-trap": A + "trap", "snare": T + "snare-set", "tra-mine": T + "fire-pot", "tra-venom": T + "venom-trap", "tra-net": A + "snare", "tra-master": T + "traps-all",
}
data = json.load(open(GAME, encoding="utf-8"))
items = data if isinstance(data, list) else data.get("abilities", [dict(id=k, **v) for k, v in data.items()])
pressed = {x["id"] for x in items if not x.get("rule")}
print("pressed", len(pressed), "mapped", len(MAP), "missing:", sorted(pressed - set(MAP)), "not in the game:", sorted(set(MAP) - pressed))
used = {v for v in MAP.values() if v.startswith(T)}
EXTRA = ["blood", "magic_power", "banner_valor", "banner_dread", "banner_war", "banner_all", "war_cry", "hold", "roar", "flare", "shift", "night_cut", "rend", "bleed_dry", "call", "kill_command", "snare_set", "fire_pot", "venom_trap", "traps_all"]   # written outside this spec
fams = {T + k.replace("_", "-") for k in F} | {T + k.replace("_", "-") for k in EXTRA}                 # blood is written outside this spec (sfx/talents/blood.rb)
assert used <= fams, used - fams
if fams - used: print("families no talent uses now (kept in the sprite):", sorted(fams - used))
for k, (name, s) in enumerate(F.items()):
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=s["desc"], secs=round(s["gap"] + 0.5, 1), seed=6200 + 10 * k, body=s["body"], gap="%.1f" % s["gap"]))
open(os.path.join(HERE, "_list.txt"), "w").write("\n".join(F) + "\n")
lv = {n: {"target": s["target"], "max": s["max"], "use": s["desc"]} for n, s in F.items()}
old = json.load(open(os.path.join(HERE, "_levels.json")))
for k in EXTRA: lv[k] = old[k]
json.dump(lv, open(os.path.join(HERE, "_levels.json"), "w"), indent=2)
os.makedirs(os.path.join(ROOT, "out", "sfx", "talents", "game"), exist_ok=True)
json.dump(dict(sorted(MAP.items())), open(os.path.join(ROOT, "out", "sfx", "talents", "game", "talent-map.json"), "w"), indent=1)
print(len(F), "family sources;", len(used), "new names")
