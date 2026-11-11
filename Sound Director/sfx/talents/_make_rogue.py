# The Rogue's rework (Robin, 2026-11-11: yes to the Rogue's new talents; Miles, GD's ask): the cues effect-dark and effect-reaction for the fight set, and Night Cut
# (sha-gloom) its own lighter sound, since the vanish is now the effect-dark cue that follows it (mine). The Survival game's library first: shadowstep_a for the dark,
# trap_poison_a and the fire recordings for the reaction, riposte_a and hit_w for the cut. Run: python -I sfx/talents/_make_rogue.py. Nigel, SD, 2026-11-11.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HEAD = open(os.path.join(ROOT, "sfx", "lands2", "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
T = {
 ("talents", "night_cut"): ("Night Cut: a lighter cut than the dark cut, a quick edge and a slap, no crit; the vanish after it is the effect-dark cue.", 1.0, 1, 0.6,
  'sample S + "runes/shadowstep_a_1.wav", rate: 1.6, amp: 0.4\nat [0.08] do sample S + "runes/riposte_a_2.wav", amp: 0.9; sample S + "flesh/hit_w_1.wav", amp: 0.7 end'),
 ("fight", "effect_dark"): ("in the dark for a round: the recorded shadowstep slowed and dulled, a soft low minor third under it. Short and quiet, no bell (the evade and the clone have one).", 1.0, -6, 0.4,
  'with_fx :lpf, cutoff: 96 do sample S + "runes/shadowstep_a_3.wav", rate: 0.8, amp: 0.8 end\nat [0.05] do str 57, 0.08, 0.1, 0.3, 0.09; str 60, 0.08, 0.1, 0.3, 0.08 end'),
 ("fight", "effect_reaction"): ("two flasks react on the foe: the poison's hiss, then the fire catching it with a rush and a crackle.", 1.2, -3, 0.6,
  'sample S + "runes/trap_poison_a_1.wav", rate: 1.2, amp: 0.5, attack: 0, sustain: 0.15, release: 0.1\n'
  'at [0.07] do with_fx :hpf, cutoff: 52 do sample S + "runes/fire_arrow_a_3.wav", rate: 1.1, amp: 0.8 end end\n'
  'at [0.1] do sample S + "runes/fire_burn_man_a_1.wav", start: 0.3, amp: 1.0, attack: 0.01, sustain: 0.2, release: 0.2 end'),
}
for k, ((sset, name), (desc, gap, target, mx, body)) in enumerate(T.items()):
    open(os.path.join(ROOT, "sfx", sset, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=10300 + 10 * k, body=body, gap="%.1f" % gap))
    p = os.path.join(ROOT, "sfx", sset, "_levels.json"); d = json.load(open(p)); d[name] = {"target": target, "max": mx, "use": desc}; json.dump(d, open(p, "w"), indent=2)
open(os.path.join(HERE, "_list-rogue.txt"), "w").write("\n".join("%s/%s" % k for k in T) + "\n")
print(len(T), "written")
