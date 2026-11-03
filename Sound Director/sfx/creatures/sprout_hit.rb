# sprout_hit: the Grumpy Sprout struck: a twig's snap and a squeak.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: sprout_hit
# seconds: 1.7
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/"
sample W + "wood_hit_01.wav", rate: 1.1, amp: 0.9, attack: 0, sustain: 0.03, release: 0.05
at [0.02] do sample C + "c1_hurt_05.wav", rate: 1.5, amp: 0.7 end
sleep 1.2
