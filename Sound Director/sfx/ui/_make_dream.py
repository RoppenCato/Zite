# The Dream's short sounds (Miles, GD, 2026-11-03, for Robin's endgame): the ferry leaving, the Dreamgate, waking up, Dreamdust picked up and spent. Into ui-spots.
# Robin's Survival picks where they fit: the hull's creak B and the oar A for the ferry. Run: python -I sfx/ui/_make_dream.py. Nigel, SD, 2026-11-03.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
HEAD = open(os.path.join(os.path.dirname(HERE), "lands2", "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
D = {
 "ferry": ("the ferry leaving: Robin's hull creak and oar, a ship's bell twice, water against the side. 1.5 s.", 2.4, -4, 1.6, 'sample S + "ships/creak_b_1.wav", amp: 0.8, attack: 0, sustain: 0.5, release: 0.3\nat [0.15] do sample S + "ships/oar_a_1.wav", amp: 0.7 end\nat [0.05] do bell 79, 0.6, 0.6 end\nat [0.45] do bell 79, 0.45, 0.6 end\nat [0.7] do sample S + "weather/splash_a_2.wav", rate: 0.9, amp: 0.4, attack: 0.05, sustain: 0.3, release: 0.3 end'),
 "dreamgate": ("stepping through the Dreamgate: a breath drawn backwards into the gate, bells climbing the Lydian scale, a soft low swell. 1.4 s.", 2.3, -2, 1.5, 'sample S + "runes/shadowstep_a_1.wav", rate: -0.8, amp: 0.6\nstr 50, 0.4, 0.5, 0.4, 0.12; str 62, 0.45, 0.45, 0.4, 0.1\n[[0.1, 74], [0.18, 76], [0.26, 78], [0.34, 80], [0.42, 81], [0.5, 86], [0.58, 88], [0.66, 90]].each_with_index { |(t, n), i| at [t] do bell n, 0.25 + i * 0.05, 0.35 end }'),
 "wake": ("waking up: bells falling slowly, a breath let out, a warm chord coming to rest. 1.5 s.", 2.4, -4, 1.6, '[[0.0, 90], [0.15, 86], [0.3, 81], [0.45, 78]].each { |t, n| at [t] do bell n, 0.5, 0.5 end }\nat [0.4] do sample S + "runes/shadowstep_a_2.wav", rate: 0.7, amp: 0.5 end\nat [0.55] do str 62, 0.1, 0.6, 0.4, 0.11; str 66, 0.1, 0.6, 0.4, 0.1; str 69, 0.1, 0.6, 0.4, 0.09 end'),
 "dreamdust": ("Dreamdust picked up: a soft sparkle, three high bells in the Lydian scale, a breath of glitter. 0.4 s.", 1.2, -6, 0.5, '[[0.0, 93], [0.05, 97], [0.11, 102]].each { |t, n| at [t] do bell n, 0.5, 0.25 end }\nwith_fx :hpf, cutoff: 100 do sample S + "runes/shadowstep_a_2.wav", rate: 2.0, amp: 0.25 end'),
 "dreamdust_buy": ("bought with Dreamdust: the sparkle poured out, a wooden knock on the counter, a small chord. 0.6 s.", 1.3, -4, 0.7, '[[0.0, 102], [0.04, 97], [0.08, 93], [0.12, 90]].each { |t, n| at [t] do bell n, 0.4, 0.2 end }\nat [0.16] do knock "wood_hit_05.wav", 1.2, 0.6; bell 86, 0.5, 0.45; bell 81, 0.35, 0.4 end'),
}
lv = json.load(open(os.path.join(HERE, "_levels.json")))
for k, (name, (desc, gap, target, mx, body)) in enumerate(D.items()):
    open(os.path.join(HERE, "dream_" + name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name="dream_" + name, desc=desc, secs=round(gap + 0.5, 1), seed=9700 + 10 * k, body=body, gap="%.1f" % gap))
    lv["dream_" + name] = {"target": target, "max": mx, "use": desc}
json.dump(lv, open(os.path.join(HERE, "_levels.json"), "w"), indent=2)
p = os.path.join(HERE, "_sprite-spec.js"); s = open(p, encoding="utf-8").read()
a = "  level_up: N('ui/level-up', 1),"
if "dream_ferry" not in s:
    s = s.replace(a, "  dream_ferry: N('ui/ferry', 1, 'ui-spots'), dream_dreamgate: N('ui/dreamgate', 1, 'ui-spots'), dream_wake: N('ui/wake', 1, 'ui-spots'), dream_dreamdust: N('ui/dreamdust', 1, 'ui-spots'), dream_dreamdust_buy: N('ui/dreamdust-buy', 1, 'ui-spots'),   // the Dream, 2026-11-03\n" + a, 1)
    open(p, "w", encoding="utf-8").write(s)
print(len(D), "dream sounds written")
