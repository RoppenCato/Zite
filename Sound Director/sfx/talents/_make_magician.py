# The Magician's reworked trees (Robin, 2026-11-11: "Yes" to the list; Miles, GD's ask): Combust and Shift for the talent map, three cues for the fight set.
# The Survival game's library first: its fire (fire_burn_man_a, fire_arrow_a), the Wizard's charge (rune_ready_a, lightning_small_a, storm_rise_a), riposte_a for
# the strike and shield_break_a for the frost shattering. Run: python -I sfx/talents/_make_magician.py. Nigel, SD, 2026-11-11.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HEAD = open(os.path.join(ROOT, "sfx", "lands2", "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
T = {
 ("talents", "flare"): ("Combust: the fire on the foe flares up, no hit. The recorded burning swells open, the fire arrow's rush over it.", 1.4, 1, 0.7,
  'with_fx :lpf, cutoff: 78, cutoff_slide: 0.3 do |f|\n  control f, cutoff: 118\n  sample S + "runes/fire_burn_man_a_1.wav", start: 0.2, rate: 1.1, amp: 1.0, attack: 0.12, sustain: 0.3, release: 0.35\nend\n'
  'at [0.1] do with_fx :hpf, cutoff: 52 do sample S + "runes/fire_arrow_a_1.wav", rate: 0.85, amp: 0.8 end end'),
 ("talents", "shift"): ("Shift: a blade changes stance with a strike. The frost shatters and falls, the storm lets go, then the blow; it fits both ways round.", 1.4, 1, 0.9,
  'sample S + "runes/shield_break_a_1.wav", rate: 1.5, amp: 0.55\nbell 96, 0.4, 0.25\nat [0.03] do bell 91, 0.35, 0.25 end\nat [0.06] do bell 86, 0.3, 0.25 end\n'
  'at [0.1] do sample Z + "lightning_1.wav", rate: 1.15, amp: 0.55 end\n'
  'at [0.18] do with_fx :hpf, cutoff: 58 do sample S + "runes/riposte_a_1.wav", amp: 1.0; sample S + "flesh/heavyhit_x_1.wav", amp: 0.4 end end'),
 ("fight", "effect_stance"): ("a stance taken up (Frost Blade or Storm Blade): the Wizard's charge, an open fifth under it, one bell.", 1.0, -4, 0.5,
  'sample S + "runes/rune_ready_a_1.wav", rate: 1.1, amp: 0.6, attack: 0, sustain: 0.3, release: 0.2\nstr 62, 0.03, 0.2, 0.3, 0.1; str 69, 0.03, 0.2, 0.3, 0.09\nat [0.08] do bell 86, 0.35, 0.35 end'),
 ("fight", "effect_both"): ("both blades at once, the Spellsword's once-a-fight moment: frost falling in bells while the storm rises, a wide chord.", 1.4, -2, 0.7,
  'sample S + "runes/storm_rise_a_1.wav", rate: 1.2, amp: 0.6, attack: 0, sustain: 0.4, release: 0.25\nat [0.04] do sample Z + "lightning_1.wav", rate: 1.05, amp: 0.5 end\n'
  '[[0, 98], [0.06, 91], [0.12, 86], [0.18, 79]].each do |t, n|\n  at [t] do bell n, 0.4, 0.35 end\nend\n'
  'at [0.24] do str 62, 0.02, 0.3, 0.35, 0.12; str 69, 0.02, 0.3, 0.35, 0.1; str 74, 0.02, 0.3, 0.35, 0.09; bell 86, 0.35, 0.5; bell 93, 0.3, 0.5 end'),
 ("fight", "effect_light"): ("a charge of Light gained by the Cleric: two soft bells, 0.3 s, so three in a row stay light.", 0.6, -6, 0.35,
  'bell 88, 0.45, 0.3\nat [0.04] do bell 95, 0.3, 0.25 end\nsynth :sine, note: 100, attack: 0.01, sustain: 0.02, release: 0.2, amp: 0.05'),
}
for k, ((sset, name), (desc, gap, target, mx, body)) in enumerate(T.items()):
    body = 'Z = "C:/dev/Zite/Sound Director/out/sfx/fight/"   # the game\'s own lightning (sfx/fight/lightning.rb): the library\'s lightning is thunder a phone loses\n' + body
    open(os.path.join(ROOT, "sfx", sset, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), seed=10200 + 10 * k, body=body, gap="%.1f" % gap))
    p = os.path.join(ROOT, "sfx", sset, "_levels.json"); d = json.load(open(p)); d[name] = {"target": target, "max": mx, "use": desc}; json.dump(d, open(p, "w"), indent=2)
open(os.path.join(HERE, "_list-magician.txt"), "w").write("\n".join("%s/%s" % k for k in T) + "\n")
print(len(T), "written")
