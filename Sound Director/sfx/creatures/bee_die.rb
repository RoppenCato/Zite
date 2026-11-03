# bee_die: the Bumbling Bee falls: the buzz slowing and fading.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: bee_die
# seconds: 1.8
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_wet_squish/files/impsplat/"
sample C + "c1_bug_04.wav", rate: 0.85, amp: 1.0
at [0.2] do sample C + "c1_bug_04.wav", rate: 0.6, amp: 0.6 end
sleep 1.3
