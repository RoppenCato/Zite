# sprout_attack: the Grumpy Sprout: a small grumble, sped up.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: sprout_attack
# seconds: 1.7
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/"
sample C + "c1_grunt_05.wav", rate: 1.3, amp: 1.0
sample W + "wood_hit_01.wav", rate: 1.3, amp: 0.3, attack: 0, sustain: 0.02, release: 0.03
sleep 1.2
