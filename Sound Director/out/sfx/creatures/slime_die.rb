# slime_die: the Jelly Slime bursts: a squish and a splat falling apart.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: slime_die
# seconds: 2.0
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_wet_squish/files/impsplat/"
sample C + "c2_slime_03.wav", rate: 0.95, amp: 0.8
at [0.1] do sample WET + "impactsplat02.mp3.flac", rate: 1.1, amp: 0.9 end
at [0.16] do sample C + "c2_slime_08.wav", rate: 0.9, amp: 0.6 end
sleep 1.5
