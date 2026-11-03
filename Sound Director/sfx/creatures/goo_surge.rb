# goo_surge: King Goo's second phase: a swelling burble and a roar.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: goo_surge
# seconds: 2.3
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_wet_squish/files/impsplat/"
sample C + "c1_burble_02.wav", rate: 0.65, amp: 0.9
at [0.25] do sample C + "c1_burp_01.wav", rate: 0.7, amp: 1.0 end
sleep 1.8
