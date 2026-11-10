# The Warrior's Warlord tree (Robin, 2026-11-10: "Yes" to the tree; Miles, GD's ask): banners and shouts, and three effect cues. Talent sounds into the talents set and
# its map (sfx/talents/_make.py), the cues into the fight set. The Survival game's library first: Robin's picks there for the war cry (war_cry_a) and the sail flap (B)
# carry the shouts and the banners' cloth. Run: python -I sfx/talents/_make_warlord.py. Nigel, SD, 2026-11-10.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HEAD = open(os.path.join(ROOT, "sfx", "lands2", "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
HORN = 'define :horn do |n, d, amp|\n  with_fx :lpf, cutoff: 88 do\n    synth :saw, note: n, attack: 0.03, sustain: d, release: 0.2, amp: amp * 0.3\n    synth :saw, note: n + 0.08, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.18\n    synth :tri, note: n - 12, attack: 0.03, sustain: d, release: 0.18, amp: amp * 0.12\n  end\nend\n'
PLANT = 'knock "wood_hit_05.wav", 0.85, 0.9\nat [0.12] do knock "wood_hit_05.wav", 0.75, 1.0; sample S + "chapter1/hit_club_v_1.wav", rate: 0.9, amp: 0.5 end\nat [0.2] do sample S + "ships/sail_flap_b_1.wav", rate: 1.3, amp: 0.8, attack: 0, sustain: 0.2, release: 0.15 end'
T = {
 ("talents", "banner_valor"): ("a banner of valor planted: the pole knocked in twice, the cloth snapping open, a bright bell.", 1.4, 1, 0.8, PLANT + '\nat [0.24] do bell 84, 0.5, 0.45; bell 91, 0.35, 0.4 end'),
 ("talents", "banner_dread"): ("a banner of dread planted: the pole knocked in, the cloth snapping, a dark low string.", 1.4, 1, 0.8, PLANT + '\nat [0.22] do str 50, 0.03, 0.3, 0.25, 0.14; str 56, 0.03, 0.3, 0.25, 0.11 end'),
 ("talents", "banner_war"): ("a banner of war planted: the pole knocked in, the cloth snapping, a horn stab.", 1.4, 1, 0.8, HORN + PLANT + '\nat [0.22] do horn 67, 0.15, 1.0; horn 74, 0.15, 0.6 end'),
 ("talents", "banner_all"): ("Raise Every Banner, the capstone: three banners planted one after another, the cloth snapping wide, a horn chord rising over them. 1.3 s.", 2.2, 3, 1.4, HORN + '[0.0, 0.22, 0.44].each_with_index do |t, i|\n  at [t] do knock "wood_hit_05.wav", 0.8 + i * 0.05, 0.9; sample S + "ships/sail_flap_b_#{i + 1}.wav", rate: 1.2, amp: 0.7, attack: 0, sustain: 0.2, release: 0.15 end\nend\nat [0.55] do horn 67, 0.5, 1.1; horn 71, 0.5, 0.7; horn 74, 0.5, 0.7; sample S + "chapter1/heavyhit_club_v_1.wav", rate: 0.9, amp: 0.6; str 55, 0.05, 0.5, 0.35, 0.12 end'),
 ("talents", "war_cry"): ("War Cry: Robin's war cry pick from the Survival game, a rallying shout, with a heavy hit under it.", 1.6, 2, 1.0, 'sample S + "runes/war_cry_a_1.wav", amp: 1.0, attack: 0, sustain: 0.55, release: 0.3\nat [0.05] do sample S + "flesh/heavyhit_x_2.wav", amp: 0.8 end'),
 ("talents", "hold"): ("Hold the Line: a firm short command, a shield knocked once.", 1.2, 0, 0.6, 'sample C + "man_yah.wav", rate: 0.9, amp: 1.0, attack: 0, sustain: 0.25, release: 0.1\nat [0.06] do sample S + "chapter1/hit_club_v_2.wav", rate: 0.95, amp: 0.7; knock "wood_hit_07.wav", 0.9, 0.6 end'),
 ("talents", "roar"): ("Terrifying Roar: the recorded berserk roar over a deeper roar, high-passed so a phone carries it, heavier than the war cry.", 1.8, 3, 1.1, 'sample S + "runes/berserk_roar_a_1.wav", amp: 1.0, attack: 0, sustain: 0.6, release: 0.35\ncut A + "roar_03.ogg", 0.8, 0.7, 0.9'),
 ("fight", "effect_banner"): ("a banner standing: a small cloth flap and one bell.", 1.0, -6, 0.4, 'sample S + "ships/sail_flap_b_2.wav", rate: 1.5, amp: 0.7, attack: 0, sustain: 0.12, release: 0.1\nat [0.05] do bell 84, 0.4, 0.3 end'),
 ("fight", "effect_banners"): ("banners standing: two flaps and two bells.", 1.1, -5, 0.5, 'sample S + "ships/sail_flap_b_1.wav", rate: 1.5, amp: 0.6, attack: 0, sustain: 0.12, release: 0.1\nat [0.1] do sample S + "ships/sail_flap_b_2.wav", rate: 1.6, amp: 0.6, attack: 0, sustain: 0.12, release: 0.1 end\nat [0.05] do bell 84, 0.4, 0.3 end\nat [0.15] do bell 88, 0.4, 0.3 end'),
 ("fight", "effect_valorup"): ("Valor up: a drum tap and two horn notes rising.", 1.1, -4, 0.5, HORN + 'sample :drum_tom_mid_soft, rate: 1.3, amp: 0.5\nhorn 67, 0.06, 0.8\nat [0.12] do horn 74, 0.18, 0.9 end'),
}
for k, ((sset, name), (desc, gap, target, mx, body)) in enumerate(T.items()):
    open(os.path.join(ROOT, "sfx", sset, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=10100 + 10 * k, body=body, gap="%.1f" % gap))
    p = os.path.join(ROOT, "sfx", sset, "_levels.json"); d = json.load(open(p)); d[name] = {"target": target, "max": mx, "use": desc}; json.dump(d, open(p, "w"), indent=2)
open(os.path.join(HERE, "_list-warlord.txt"), "w").write("\n".join("%s/%s" % k for k in T) + "\n")
print(len(T), "written")
