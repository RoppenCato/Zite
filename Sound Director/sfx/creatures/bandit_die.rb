# bandit_die: the Meadow Bandit runs out of luck: a yelp.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: bandit_die
# seconds: 1.7
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_squish/files/"
sample C + "man_ow.wav", rate: 1.4, amp: 1.0
at [0.12] do sample C + "c1_hurt_03.wav", rate: 1.2, amp: 0.5 end
sleep 1.2
