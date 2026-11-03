# goo_hit: King Goo struck: a gloop.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: goo_hit
# seconds: 1.8
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/"
sample C + "c2_slime_02.wav", rate: 0.7, amp: 1.0
sample C + "c1_burble_02.wav", rate: 0.9, amp: 0.4
sleep 1.3
