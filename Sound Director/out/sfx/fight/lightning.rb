# lightning: a crack of lightning striking the enemy (Miles, GD, 2026-11-03, for Robin's trinkets of the same day: Storm Charm, Thunder Bell and Stormheart call
# down lightning on an Attack now and then; an ordinary creature loses its next move). Under a second.
# The Survival library first: its lightning and thunder recordings are 61 to 87 % under 250 Hz, a rumble on a phone, not a crack. So the crack is
# BigSoundBank's recorded whip (the Survival studio's cut, CC0), doubled 6 ms apart for the forked edge; a burst of crackle through a high band for the sizzle;
# Robin's pick lightning_small_a (the Survival game, 2026-10-23) high-passed under it as the body; the club's hit as the strike landing.
# name: lightning
# seconds: 1.6
# count: 1

use_bpm 60
S = "C:/dev/SG/Sound Director/out/sfx/"
WHIP = "C:/dev/SG/Sound Director/sfx/flesh/ref/cut/whip_2949.wav"
with_fx :lpf, cutoff: 122 do                                   # 8.9 kHz: bright, not glassy
  sample WHIP, rate: 1.0, amp: 1.0
  at [0.006] do sample WHIP, rate: 1.12, amp: 0.6 end
  with_fx :bpf, centre: 104, res: 0.3 do                       # the sizzle, about 3.3 kHz
    synth :cnoise, attack: 0.001, sustain: 0.05, release: 0.16, amp: 0.85
  end
  with_fx :hpf, cutoff: 62 do                                  # 290 Hz up: the body a phone can carry
    sample S + "runes/lightning_small_a_1.wav", amp: 0.4, attack: 0, sustain: 0.4, release: 0.3
  end
  at [0.02] do sample S + "chapter1/hit_club_v_2.wav", rate: 1.1, amp: 0.45 end
end
sleep 1.6
# 2026-11-03, second render: the first took 26 ms to its peak (the body under the whip); body 0.9 -> 0.4, sizzle up.
