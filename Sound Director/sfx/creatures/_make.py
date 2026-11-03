# The meadows' creature voices: attack, hit and die for each of the six, from rubberduck's CC0 creature packs and HaelDB's CC0 grunts on this PC
# (the Survival studio's sfx/flesh/ref/; measured in work/decode/voices/). One variation each (Miles, GD, 2026-11-01). Run: python -I sfx/creatures/_make.py
# Studio names by creature; the game's ids in _sprite-spec.js. Nigel, SD, 2026-11-01.
import os, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DEC = os.path.join(ROOT, "work", "decode", "voices")
CUT = os.path.join(HERE, "ref", "cut")
os.makedirs(CUT, exist_ok=True)
files = json.load(open(os.path.join(DEC, "voices.json")))["files"]
# the decode's piece N is recording N for the creature packs (each one piece, at the same offset in its slot)
for n in list(range(1, 9)) + [10, 14, 27, 30, 31, 32, 33, 34, 35, 36, 40, 41, 43, 46, 53, 54, 55, 56, 57, 58]:
    base = os.path.splitext(os.path.basename(files[n - 1]))[0]
    pack = "2" if "oga_creature2" in files[n - 1] else "1"
    shutil.copyfile(os.path.join(DEC, "out", "voices_%d.wav" % n), os.path.join(CUT, "c%s_%s.wav" % (pack, base)))
for n, name in [(59, "man_oof"), (61, "man_yah"), (62, "man_ow")]:      # HaelDB's grunts; a head of silence splits them, so named by piece
    shutil.copyfile(os.path.join(DEC, "out", "voices_%d.wav" % n), os.path.join(CUT, name + ".wav"))

HEAD = """# {name}: {desc}
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: {name}
# seconds: {secs}
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/"
{body}
sleep {gap}
"""
L = {}
def snd(name, desc, gap, body):
    L[name] = (desc, gap, body)

# Jelly Slime: squelch, squish, splat
snd("slime_attack", "the Jelly Slime lunges: a squelch.", 1.2, 'sample C + "c2_slime_07.wav", rate: 1.0, amp: 1.0')
snd("slime_hit", "the Jelly Slime struck: a squish.", 1.2, 'sample C + "c2_slime_03.wav", rate: 1.1, amp: 1.0')
snd("slime_die", "the Jelly Slime bursts: a squish and a splat falling apart.", 1.5, """sample C + "c2_slime_03.wav", rate: 0.95, amp: 0.8
at [0.1] do sample WET + "impactsplat02.mp3.flac", rate: 1.1, amp: 0.9 end
at [0.16] do sample C + "c2_slime_08.wav", rate: 0.9, amp: 0.6 end""")
# Grumpy Sprout: a grumble, a snap, a wilt
snd("sprout_attack", "the Grumpy Sprout: a small grumble, sped up.", 1.2, """sample C + "c1_grunt_05.wav", rate: 1.3, amp: 1.0
sample W + "wood_hit_01.wav", rate: 1.3, amp: 0.3, attack: 0, sustain: 0.02, release: 0.03""")
snd("sprout_hit", "the Grumpy Sprout struck: a twig's snap and a squeak.", 1.2, """sample W + "wood_hit_01.wav", rate: 1.1, amp: 0.9, attack: 0, sustain: 0.03, release: 0.05
at [0.02] do sample C + "c1_hurt_05.wav", rate: 1.5, amp: 0.7 end""")
snd("sprout_die", "the Grumpy Sprout wilts: a small voice sagging, slowed.", 1.4, 'sample C + "c1_cute_03.wav", rate: 0.8, amp: 1.0')
# Meadow Bandit: a yah, an oof, a yelp (a small man: the grunts a little quicker)
snd("bandit_attack", "the Meadow Bandit: a yah.", 1.3, 'sample C + "man_yah.wav", rate: 1.2, amp: 1.0')
snd("bandit_hit", "the Meadow Bandit struck: an oof.", 1.2, 'sample C + "man_oof.wav", rate: 1.2, amp: 1.0')
snd("bandit_die", "the Meadow Bandit runs out of luck: a yelp.", 1.2, """sample C + "man_ow.wav", rate: 1.4, amp: 1.0
at [0.12] do sample C + "c1_hurt_03.wav", rate: 1.2, amp: 0.5 end""")
# Bumbling Bee: a buzz swoop, a bzzt, a fading buzz
snd("bee_attack", "the Bumbling Bee swoops: a buzz.", 1.2, 'sample C + "c2_bug_10.wav", rate: 1.0, amp: 1.0')
snd("bee_hit", "the Bumbling Bee struck: a bzzt.", 1.0, 'sample C + "c1_bug_01.wav", rate: 1.0, amp: 1.0')
snd("bee_die", "the Bumbling Bee falls: the buzz slowing and fading.", 1.3, """sample C + "c1_bug_04.wav", rate: 0.85, amp: 1.0
at [0.2] do sample C + "c1_bug_04.wav", rate: 0.6, amp: 0.6 end""")
# Mushroom Muncher: a munch, a thump, a puff
snd("muncher_attack", "the Mushroom Muncher: a munch.", 1.3, 'sample C + "c1_eat_01.wav", rate: 1.0, amp: 1.0')
snd("muncher_hit", "the Mushroom Muncher struck: a soft thump and a grunt.", 1.2, """sample C + "c1_eat_02.wav", rate: 1.1, amp: 0.8
sample W + "wood_hit_05.wav", rate: 0.9, amp: 0.7, attack: 0, sustain: 0.03, release: 0.06
at [0.03] do sample C + "c1_hurt_04.wav", rate: 1.3, amp: 0.5 end""")
snd("muncher_die", "the Mushroom Muncher: a puff of spores, a breath let out.", 1.3, """sample S + "runes/shadowstep_a_1.wav", rate: 1.3, amp: 0.9
sample C + "c1_eat_02.wav", rate: 0.9, amp: 0.5""")
# King Goo: a wobble roar, a gloop, a great splat, the second phase's surge: the slime's own sounds, huge and comic
snd("goo_attack", "King Goo: a wobbling roar: a burp slowed under the slime's squelch.", 1.5, """sample C + "c1_burp_02.wav", rate: 0.85, amp: 1.0
sample C + "c2_slime_07.wav", rate: 0.65, amp: 0.8""")
snd("goo_hit", "King Goo struck: a gloop.", 1.3, """sample C + "c2_slime_02.wav", rate: 0.7, amp: 1.0
sample C + "c1_burble_02.wav", rate: 0.9, amp: 0.4""")
snd("goo_die", "King Goo falls: a long burble, then a great splat and the crown's tiny ring.", 2.4, """sample C + "c1_burble_01.wav", rate: 0.75, amp: 0.9
at [0.7] do
  sample WET + "impactsplat01.mp3.flac", rate: 0.8, amp: 1.0
  sample C + "c2_slime_03.wav", rate: 0.6, amp: 0.9
  sample C + "c2_slime_08.wav", rate: 0.6, amp: 0.7
end
at [1.15] do synth :pretty_bell, note: 96, attack: 0.002, sustain: 0.01, release: 0.25, amp: 0.2 end""")
snd("goo_surge", "King Goo's second phase: a swelling burble and a roar.", 1.8, """sample C + "c1_burble_02.wav", rate: 0.65, amp: 0.9
at [0.25] do sample C + "c1_burp_01.wav", rate: 0.7, amp: 1.0 end""")

for name, (desc, gap, body) in L.items():
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(HEAD.format(name=name, desc=desc, secs=round(gap + 0.5, 1), body=body, gap="%.1f" % gap))
open(os.path.join(HERE, "_list.txt"), "w").write("\n".join(L) + "\n")
lv = {n: {"target": (-2 if n.startswith("goo") or n.endswith("die") else -4 if n.endswith("attack") else -5), "max": 1.8 if n == "goo_die" else 1.0 if n.startswith("goo") else 0.7, "use": L[n][0]} for n in L}
json.dump(lv, open(os.path.join(HERE, "_levels.json"), "w"), indent=2)
print(len(L), "sources")
