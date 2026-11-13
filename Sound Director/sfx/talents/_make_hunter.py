# The Hunter's rebuilt trees (Robin, 2026-11-12: his design, "Yes" to Miles, GD's talent list). Pets, traps, bleeds. Talent sounds into the talents set and its map
# (sfx/talents/_make.py); the pet cues, the sprung trap, the stampede and the pets' strikes into the fight set. The Survival game's library first: its creature
# recordings (oga_creature1 and 2, CC0: the howl, the bark, a roar), Robin's picks for the wolf's and the snake's cries (pain_wolf_w, pain_snake_w), the trap set
# (trap_land_a, trap_arm_a, trap_snap_a, trap_poison_a), the bow (pin_shot_a, shoot_b), the blood (blood_drip_a, the wet splats). Mine: one call cue per pet, since
# an owl, a wolf, a bear and a viper cannot share one; the strikes in three variations, since they sound on most turns. Run: python -I sfx/talents/_make_hunter.py.
# Nigel, SD, 2026-11-12.
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HEAD = open(os.path.join(ROOT, "sfx", "lands2", "_make.py"), encoding="utf-8").read().split('HEAD = """', 1)[1].split('"""', 1)[0]
HOOT = '''[[0.3, 69, 0.14], [0.55, 65, 0.24]].each do |t, n, d|
  at [t] do
    synth :sine, note: n, attack: 0.05, sustain: d, release: 0.1, amp: 0.45
    synth :tri, note: n + 12, attack: 0.05, sustain: d, release: 0.08, amp: 0.05
  end
end'''
T = {
 # ---- talents: what the press sounds like
 ("talents", "rend"): ("Rend: an arrow that surely crits and tears, the blood starting to run.", 1.4, 2, 0.9, 1,
  'sample S + "runes/pin_shot_a_1.wav", amp: 1.0\nat [0.02] do sample S + "bow/shoot_b_4.wav", amp: 0.6 end\n'
  'at [0.2] do sample S + "runes/riposte_a_1.wav", amp: 0.8; sample WET + "impactsplat03.mp3.flac", rate: 1.2, amp: 0.6 end\n'
  'at [0.3] do sample S + "runes/blood_drip_a_1.wav", rate: 1.1, amp: 0.5, attack: 0, sustain: 0.25, release: 0.2 end'),
 ("talents", "bleed_dry"): ("Bleed Dry: all the bleeding lands at once, four wet bursts quickening, then the arrow after it.", 1.5, 2, 0.9, 1,
  '[0, 0.07, 0.13, 0.18].each_with_index do |t, i|\n  at [t] do sample WET + "impactsplat0#{i + 1}.mp3.flac", rate: 1.15 + i * 0.05, amp: 0.55 + i * 0.1 end\nend\n'
  'at [0.05] do sample S + "runes/blood_drip_a_2.wav", rate: 1.2, amp: 0.6, attack: 0, sustain: 0.2, release: 0.15 end\n'
  'at [0.3] do sample S + "runes/pin_shot_a_2.wav", amp: 0.9; sample S + "flesh/hit_w_3.wav", amp: 0.7 end'),
 ("talents", "call"): ("a pet called: the Hunter's two-note whistle, up and then falling. The pet's own cue (effect-pet-<pet>) follows it.", 1.2, 0, 0.6, 1,
  's = synth :sine, note: 84, note_slide: 0.1, attack: 0.02, sustain: 0.12, release: 0.06, amp: 0.4\ncontrol s, note: 91\n'
  'synth :bnoise, cutoff: 115, attack: 0.02, sustain: 0.1, release: 0.05, amp: 0.05\n'
  'at [0.24] do\n  s2 = synth :sine, note: 91, note_slide: 0.2, attack: 0.02, sustain: 0.18, release: 0.1, amp: 0.4\n  control s2, note: 86\nend'),
 ("talents", "kill_command"): ("Kill Command: one sharp whistle, then the bite, the swipe and the strike close together.", 1.4, 2, 0.9, 1,
  's = synth :sine, note: 86, note_slide: 0.06, attack: 0.01, sustain: 0.08, release: 0.04, amp: 0.4\ncontrol s, note: 95\n'
  'at [0.14] do sample S + "runes/trap_snap_a_1.wav", rate: 1.3, amp: 0.8; sample S + "flesh/hit_w_1.wav", amp: 0.7 end\n'
  'at [0.2] do sample S + "combat/swish_axe_2.wav", rate: 0.85, amp: 0.6 end\n'
  'at [0.26] do sample S + "flesh/heavyhit_x_1.wav", amp: 0.9; sample S + "flesh/pain_snake_w_1.wav", rate: 1.2, amp: 0.4, attack: 0, sustain: 0.08, release: 0.05 end'),
 ("talents", "snare_set"): ("Snare laid: the trap set down, the cord whipping taut, the catch.", 1.1, 0, 0.6, 1,
  'sample S + "runes/trap_land_a_1.wav", amp: 0.8\nat [0.08] do sample S + "ships/sail_flap_b_3.wav", rate: 2.0, amp: 0.5, attack: 0, sustain: 0.06, release: 0.05 end\n'
  'at [0.14] do sample S + "runes/trap_arm_a_2.wav", amp: 0.8 end'),
 ("talents", "fire_pot"): ("Fire Pot laid: a clay pot set down, a fuse catching.", 1.2, 0, 0.6, 1,
  'knock "wood_hit_05.wav", 1.5, 0.7\nat [0.03] do sample S + "runes/trap_land_a_2.wav", rate: 0.9, amp: 0.6 end\n'
  'at [0.15] do sample S + "runes/fire_burn_man_a_1.wav", start: 0.3, amp: 0.8, attack: 0.02, sustain: 0.25, release: 0.15 end'),
 ("talents", "venom_trap"): ("Venom Trap laid: the trap set, the catch, the venom's hiss and a drip.", 1.2, 0, 0.6, 1,
  'sample S + "runes/trap_land_a_3.wav", amp: 0.8\nat [0.06] do sample S + "runes/trap_arm_a_2.wav", amp: 0.7 end\n'
  'at [0.14] do sample S + "runes/trap_poison_a_1.wav", amp: 0.5, attack: 0, sustain: 0.15, release: 0.1 end\n'
  'at [0.25] do sample S + "runes/blood_drip_a_1.wav", rate: 1.5, amp: 0.4, attack: 0, sustain: 0.12, release: 0.1 end'),
 ("talents", "traps_all"): ("Master of Snares: every trap laid at once, three set down and caught in a run, then two bells.", 1.4, 1, 0.8, 1,
  '[0, 0.13, 0.26].each_with_index do |t, i|\n  at [t] do sample S + "runes/trap_land_a_#{i + 1}.wav", amp: 0.8; sample S + "runes/trap_arm_a_#{i + 1}.wav", rate: 1 + i * 0.08, amp: 0.6 end\nend\n'
  'at [0.4] do sample S + "runes/trap_snap_a_2.wav", rate: 0.9, amp: 0.6; bell 84, 0.4, 0.3; bell 91, 0.3, 0.3 end'),
 # ---- fight cues
 ("fight", "effect_pet_owl"): ("the owl comes: wings, then a soft two-note hoot.", 1.2, -4, 0.5, 1,
  'sample S + "ships/sail_flap_b_1.wav", rate: 1.6, amp: 0.7, attack: 0, sustain: 0.15, release: 0.1\n'
  'at [0.12] do sample S + "ships/sail_flap_b_2.wav", rate: 1.7, amp: 0.6, attack: 0, sustain: 0.12, release: 0.1 end\n' + HOOT),
 ("fight", "effect_pet_wolf"): ("the wolf comes: a short howl and one bark.", 1.2, -3, 0.6, 1,
  'sample A + "howl.ogg", amp: 0.8, attack: 0, sustain: 0.35, release: 0.2\nat [0.5] do sample A + "barking_02.ogg", amp: 0.6, attack: 0, sustain: 0.15, release: 0.08 end'),
 ("fight", "effect_pet_bear"): ("the bear comes: two heavy steps and a roar, high-passed so a phone carries it.", 1.2, -3, 0.6, 1,
  'sample S + "flesh/heavyhit_x_3.wav", rate: 0.75, amp: 0.6\nat [0.06] do cut B + "roar_04.ogg", 1.0, 0.9, 0.55 end\nat [0.3] do sample S + "flesh/heavyhit_x_4.wav", rate: 0.75, amp: 0.5 end'),
 ("fight", "effect_pet_viper"): ("the viper comes: Robin's snake cry as a hiss, then a dry rattle.", 1.0, -4, 0.5, 1,
  'with_fx :lpf, cutoff: 104 do sample S + "flesh/pain_snake_w_2.wav", rate: 0.9, amp: 0.9 end\n7.times do |i|\n  at [0.28 + i * 0.035] do with_fx :hpf, cutoff: 88 do synth :cnoise, cutoff: 108, attack: 0.002, sustain: 0.004, release: 0.02, amp: 0.4 end end\nend'),
 ("fight", "effect_sprung"): ("a trap springs on the foe: the jaws snapping shut, a chain, a hit.", 1.0, -2, 0.6, 1,
  'sample S + "runes/trap_snap_a_1.wav", amp: 1.0\nsample S + "runes/trap_snap_a_3.wav", rate: 0.8, amp: 0.7\n'
  'at [0.02] do sample S + "flesh/heavyhit_x_2.wav", amp: 0.6; sample S + "combat/chain_2_1.wav", rate: 1.2, amp: 0.4 end'),
 ("fight", "effect_stampede"): ("Stampede, once a fight: running feet quickening, the howl, the roar and the hiss over them, then the blows land together.", 1.6, -1, 0.8, 1,
  '[0, 0.09, 0.17, 0.24, 0.31, 0.38, 0.45, 0.52, 0.6, 0.68].each_with_index do |t, i|\n  at [t] do with_fx :hpf, cutoff: 68 do sample :drum_tom_mid_hard, rate: 1.6 + (i % 2) * 0.15, amp: 0.55 + i * 0.05 end end\nend\n'
  'at [0.05] do sample A + "howl.ogg", rate: 1.05, amp: 0.55, attack: 0, sustain: 0.3, release: 0.2 end\n'
  'at [0.25] do cut B + "roar_04.ogg", 1.05, 0.6, 0.4 end\nat [0.45] do sample S + "flesh/pain_snake_w_1.wav", amp: 0.5 end\n'
  'at [0.72] do sample S + "runes/trap_snap_a_2.wav", rate: 1.3, amp: 0.7; sample S + "combat/swish_axe_1.wav", rate: 0.9, amp: 0.5; with_fx :hpf, cutoff: 60 do sample S + "flesh/heavyhit_x_1.wav", amp: 0.9 end; sample S + "flesh/hit_w_2.wav", amp: 0.7 end'),
 # ---- the pets' strikes, three variations each (v, r)
 ("fight", "pet_wolf"): ("the wolf bites: a snarl, the jaws snapping, a slap. Short, it sounds most turns.", 0.7, -2, 0.6, 3,
  'sample A + "barking_02.ogg", rate: r * 1.15, amp: 0.4, attack: 0, sustain: 0.06, release: 0.05\n'
  'at [0.04] do sample S + "runes/trap_snap_a_#{v + 1}.wav", rate: r * 1.3, amp: 0.7; sample S + "flesh/hit_w_#{v + 1}.wav", rate: r, amp: 0.6 end'),
 ("fight", "pet_bear"): ("the bear swipes: a heavy rush of air, a grunt and the heavy hit.", 0.8, -2, 0.6, 3,
  'sample S + "combat/swish_axe_#{v + 1}.wav", rate: r * 0.85, amp: 0.7\n'
  'at [0.08] do sample S + "flesh/heavyhit_x_#{v + 1}.wav", rate: r, amp: 0.8; sample B + "attack_01.ogg", rate: r * 0.8, amp: 0.4 end'),
 ("fight", "pet_viper"): ("the viper strikes: a quick hiss and a fast, light hit.", 0.7, -2, 0.6, 3,
  'with_fx :lpf, cutoff: 104 do sample S + "flesh/pain_snake_w_#{v + 1}.wav", rate: r * 1.05, amp: 0.5, attack: 0, sustain: 0.08, release: 0.05 end\n'
  'at [0.07] do sample B + "attack_05.ogg", rate: r * 1.2, amp: 0.4; sample S + "flesh/hit_w_#{v + 1}.wav", rate: r * 1.15, amp: 0.6 end'),
 ("fight", "pet_owl"): ("the owl strikes (added 2026-11-13, mine, on Miles, GD's offer): a quick wingbeat, the talons' scratch, a light hit.", 0.7, -2, 0.6, 3,
  'sample S + "ships/sail_flap_b_#{v + 1}.wav", rate: r * 1.9, amp: 0.5, attack: 0, sustain: 0.06, release: 0.05\n'
  'at [0.05] do sample S + "runes/riposte_a_#{v + 1}.wav", rate: r * 1.3, amp: 0.5; sample S + "flesh/hit_w_#{v + 1}.wav", rate: r * 1.1, amp: 0.6 end'),
}
for k, ((sset, name), (desc, gap, target, mx, count, body)) in enumerate(T.items()):
    seed = 10400 + 10 * k
    head = HEAD
    if count > 1:
        head = head.replace("# count: 1", "# count: %d" % count)
        body = "%d.times do |v|\n  use_random_seed %d + v\n  r = 1 + rrand(-0.04, 0.04)\n" % (count, seed) + "\n".join("  " + l for l in body.split("\n")) + "\n  sleep %.1f\nend" % gap
    secs = round((gap + 0.5) * count, 1)
    open(os.path.join(ROOT, "sfx", sset, name + ".rb"), "w", encoding="utf-8").write(head.format(name=name, desc=desc, secs=secs, seed=seed, body=body, gap="%.1f" % (gap if count == 1 else 0.1)))
    p = os.path.join(ROOT, "sfx", sset, "_levels.json"); d = json.load(open(p)); d[name] = {"target": target, "max": mx, "use": desc}; json.dump(d, open(p, "w"), indent=2)
open(os.path.join(HERE, "_list-hunter.txt"), "w").write("\n".join("%s/%s" % k for k in T) + "\n")
print(len(T), "written")
