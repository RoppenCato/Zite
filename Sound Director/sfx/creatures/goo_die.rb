# goo_die: King Goo falls: a long burble, then a great splat and the crown's tiny ring.
# Written by sfx/creatures/_make.py; change it there. Recordings: rubberduck's 80 CC0 creature SFX (1 and 2), HaelDB's male grunts (CC0), BigSoundBank through the Survival studio.
# name: goo_die
# seconds: 2.9
# count: 1

use_bpm 60
C = "C:/dev/Zite/Sound Director/sfx/creatures/ref/cut/"
W = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
S = "C:/dev/SG/Sound Director/out/sfx/"
WET = "C:/dev/SG/Sound Director/sfx/flesh/ref/oga_wet_squish/files/impsplat/"
sample C + "c1_burble_01.wav", rate: 0.75, amp: 0.9
at [0.7] do
  sample WET + "impactsplat01.mp3.flac", rate: 0.8, amp: 1.0
  sample C + "c2_slime_03.wav", rate: 0.6, amp: 0.9
  sample C + "c2_slime_08.wav", rate: 0.6, amp: 0.7
end
at [1.15] do synth :pretty_bell, note: 96, attack: 0.002, sustain: 0.01, release: 0.25, amp: 0.2 end
sleep 2.4
