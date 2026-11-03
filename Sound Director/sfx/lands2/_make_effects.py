# The rest of Robin's "fill the holes" (2026-11-03): six fight effects that played nothing, the quest board's arrival, and steps on stone, snow, mud, sand and
# planks. Effects one variation (into sfx/fight and the fight sprite), the board into ui-spots, the steps three each (into ui). Snow, mud and sand are Robin's
# Survival picks as they are (step_snow_b, step_mud_a, step_wetsand_v), copied, not remade. Run: python -I sfx/lands2/_make_effects.py. Nigel, SD, 2026-11-03.
import os, shutil, json
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SG = "C:/dev/SG/Sound Director/out/sfx/"
HEAD = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
E = {
 ("fight", "effect_burn"): ("burning: a flame catching, the recorded fire's crackle, 0.4 s.", 1.2, -4, 0.5, 'with_fx :hpf, cutoff: 52 do sample S + "runes/fire_arrow_a_2.wav", rate: 1.4, amp: 0.6 end\nsample S + "runes/fire_burn_man_a_1.wav", start: 0.3, amp: 1.0, attack: 0.01, sustain: 0.2, release: 0.15'),
 ("fight", "effect_bleed"): ("bleeding: a thin wet cut and a drip, 0.35 s.", 1.1, -4, 0.45, 'sample S + "runes/riposte_a_2.wav", rate: 1.1, amp: 0.6\nat [0.04] do sample S + "runes/blood_drip_a_1.wav", rate: 1.2, amp: 0.8, attack: 0, sustain: 0.15, release: 0.12 end'),
 ("fight", "effect_sunder"): ("armour sundered: iron cracking, a plate knocked loose, 0.5 s.", 1.3, -2, 0.6, 'sample S + "runes/shield_break_a_2.wav", rate: 1.0, amp: 0.8\nsample S + "combat/parry_3.wav", rate: 0.75, amp: 0.5, attack: 0, sustain: 0.12, release: 0.1\nat [0.15] do knock "wood_hit_03.wav", 0.9, 0.5 end'),
 ("fight", "effect_interrupt"): ("a wind-up broken: the Survival game's broken (a crack and a reel), quicker, 0.4 s.", 1.2, -3, 0.5, 'with_fx :hpf, cutoff: 60 do sample S + "combat/broken_1.wav", rate: 1.15, amp: 1.0 end\nknock "wood_hit_01.wav", 1.1, 0.9\nsample S + "runes/guard_break_a_1.wav", rate: 1.3, amp: 0.5'),
 ("fight", "effect_guardian"): ("a guardian steps in: a shield's wooden knock, an open chord of bells, a breath of strings, 0.6 s.", 1.4, -3, 0.7, 'sample S + "chapter1/hit_club_v_1.wav", rate: 0.9, amp: 0.6\nknock "wood_hit_07.wav", 1.0, 0.7\nat [0.04] do bell 79, 0.5, 0.45; bell 86, 0.4, 0.45 end\nstr 67, 0.05, 0.3, 0.25, 0.09; str 74, 0.05, 0.3, 0.25, 0.08'),
 ("fight", "effect_clone"): ("a copy appears: the recorded shadowstep, its echo, a falling pair of bells, 0.5 s.", 1.3, -3, 0.6, 'sample S + "runes/shadowstep_a_1.wav", rate: 1.1, amp: 0.7\nat [0.1] do sample S + "runes/shadowstep_a_2.wav", rate: 1.3, amp: 0.6 end\nat [0.22] do bell 81, 0.4, 0.3; bell 76, 0.35, 0.3 end'),
 ("ui", "arrive_board"): ("arriving at a quest board: paper rustling, a pin's knock, one small bell.", 1.3, -6, 0.6, 'sample W + "bookFlip2.wav", rate: 1.1, amp: 0.7, attack: 0.005, sustain: 0.12, release: 0.08\nat [0.12] do knock "raise_e_1.wav", 1.6, 0.6 end\nat [0.2] do bell 84, 0.35, 0.3 end'),
}
lv = {"fight": {}, "ui": {}}
for k, ((sset, name), (desc, gap, target, mx, body)) in enumerate(E.items()):
    open(os.path.join(ROOT, "sfx", sset, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=9800 + 10 * k, body=body, gap="%.1f" % gap))
    lv[sset][name] = {"target": target, "max": mx, "use": desc}
# the steps: copies of Robin's picks; stone and planks layered with three variations
STEP_HEAD = HEAD.replace("# count: 1", "# count: 3").replace("use_random_seed {seed}\n{body}\nsleep {gap}\n", "define :one do |v|\n  use_random_seed {seed} + v\n  r = 1 + rrand(-0.03, 0.03)\n{body}\nend\n3.times do |v|\n  one v\n  sleep {gap}\nend\n")
STEPS = {
 "step_stone": ("a step on a stone road: Kenney's concrete footsteps, a little brighter, cut short.", '  with_fx :hpf, cutoff: 50 do\n    sample K + "footstep_concrete_00#{[0, 2, 4][v]}.ogg", rate: 1.05 * r, amp: 1.0, attack: 0, sustain: 0.1, release: 0.06\n  end\n  sample S + "runes/stone_break_a_1.wav", rate: [1.6, 1.7, 1.55][v] * r, amp: 0.35, attack: 0, sustain: 0.03, release: 0.05'),
 "step_wood": ("a step on wooden planks: a hollow recorded knock and a faint creak.", '  knock ["wood_hit_07.wav", "wood_hit_05.wav", "wood_hit_07.wav"][v], [0.95, 1.0, 1.05][v] * r, 0.9\n  sample K + "creak1.ogg", start: 0.2, rate: 1.6 * r, amp: 0.12, attack: 0.01, sustain: 0.05, release: 0.05'),
}
for k, (name, (desc, body)) in enumerate(STEPS.items()):
    open(os.path.join(ROOT, "sfx", "ui", name + ".rb"), "w", encoding="utf-8").write(STEP_HEAD.format(name=name, desc=desc, secs=3.5, seed=9900 + 10 * k, body=body, gap="1.0"))
for name, src in (("step_snow", "weather/step_snow_b"), ("step_mud", "weather/step_mud_a"), ("step_sand", "weather/step_wetsand_v")):
    for i in (1, 2, 3):
        dst = os.path.join(ROOT, "out", "sfx", "ui", "%s_%d.wav" % (name, i))
        if not os.path.exists(dst):
            shutil.copyfile(SG + "%s_%d.wav" % (src, i), dst)
for name, t in (("step_stone", -9), ("step_wood", -9), ("step_snow", -9), ("step_mud", -9), ("step_sand", -10)):
    lv["ui"][name] = {"target": t, "max": 0.3, "use": "a step: " + name[5:]}
for sset in ("fight", "ui"):
    p = os.path.join(ROOT, "sfx", sset, "_levels.json"); d = json.load(open(p)); d.update(lv[sset]); json.dump(d, open(p, "w"), indent=2)
open(os.path.join(ROOT, "sfx", "lands2", "_list-effects.txt"), "w").write("\n".join(["fight/" + n for (s, n) in E if s == "fight"] + ["ui/arrive_board", "ui/step_stone", "ui/step_wood"]) + "\n")
print(len(E), "effects and the board,", len(STEPS), "steps written, 3 copied")
