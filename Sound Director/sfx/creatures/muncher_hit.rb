# muncher_hit: the Mushroom Muncher struck: a soft thump and a grunt.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: muncher_hit
# seconds: 1.7
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_wet_squish/files/impsplat/"
sample C + "c1_eat_02.wav", rate: 1.1, amp: 0.8
sample W + "wood_hit_05.wav", rate: 0.9, amp: 0.7, attack: 0, sustain: 0.03, release: 0.06
at [0.03] do sample C + "c1_hurt_04.wav", rate: 1.3, amp: 0.5 end
sleep 1.2
