# Writes the UI set's sources (sfx/ui/<name>.rb) for the taps, the choice and the chest from one spec, as sfx/combat/_make.py did for
# the Survival game's fight. Run: python -I sfx/ui/_make.py. The die's five sources (die_land_a/b/c, die_shake, die_tumble) were
# written by hand before this and are not touched. Nigel, SD, 2026-11-01.
import os
# Robin, 2026-11-03, "Yes Z!": chest_shimmer, chest_burst_rare and chest_burst_epic are now made by sfx/ui/chest_shimmer_z.rb and chest_reveal_z.rb;
# the specs below for those three are the archived versions (out/_archive/chest-before-z-2026-11-03/). Do not re-render them over Z.
HERE = os.path.dirname(os.path.abspath(__file__))

HEAD = """# {name}: {title}. {desc}
# Miles, GD's brief (docs/sound-demands.md, wave 1; the game's name ui/{game}). Enchanted Kingdoms: storybook, wood and bells, short,
# never piercing. Recorded wood for every knock (sfx/ui/ref/README.md); bells are the studio's pretty bell, the one synth voice Robin
# has liked, in C pentatonic so they sit over any region's key. Written by sfx/ui/_make.py; change it there.
# name: {name}
# seconds: {secs}
# count: 3

use_bpm 60                                   # times in seconds
C = "C:/dev/Zite/Sound Director/sfx/ui/ref/cut/"
define :bell do |n, amp, rel|                 # a small bright bell: pretty_bell with a sine an octave up for the shimmer
  synth :pretty_bell, note: n, attack: 0.002, sustain: 0.01, release: rel, amp: amp * 0.5
  synth :sine, note: n + 12, attack: 0.002, sustain: 0.005, release: rel * 0.45, amp: amp * 0.07
end
define :pop do |r, amp|                       # the lid: a hollow wooden knock, a warm knock under it, the latch's thin click on top
  sample C + "wood_hit_07.wav", rate: 1.15 * r, amp: amp * 0.9, attack: 0, sustain: 0.04, release: 0.08
  sample C + "wood_hit_05.wav", rate: 1.0 * r, amp: amp * 0.5, attack: 0, sustain: 0.03, release: 0.06
  sample C + "wood_hit_02.wav", rate: 1.1 * r, amp: amp * 0.35, attack: 0, sustain: 0.01, release: 0.03
end
"""
BODY = """
define :one do |v|
  use_random_seed {seed} + v
  r = 1 + rrand(-0.04, 0.04)
{body}
end

3.times do |v|
  one v
  sleep {gap}
end
"""
S = {}
def snd(name, game, title, desc, gap, body):
    S[name] = dict(name=name, game=game, title=title, desc=desc, gap=gap, body=body)

snd("tap", "tap", "a button pressed", "A soft wooden tick, 60 ms, under a 4.4 kHz low-pass so it is never sharp: heard a hundred times an hour, so plain and quiet.", 1.0, """
  with_fx :lpf, cutoff: 108 do                               # 4.4 kHz
    sample C + "raise_e_1.wav", rate: (1.25 + rrand(-0.05, 0.05)) * r, amp: 0.9, attack: 0, sustain: 0.02, release: 0.035
  end""")
snd("tap_denied", "tap-denied", "a dim button pressed, not allowed", "Two dull knocks 70 ms apart, lower and softer than the tap, under a 1.6 kHz low-pass: a quiet no, never a buzzer.", 1.0, """
  with_fx :lpf, cutoff: 90 do                                # 1.6 kHz: dull
    sample C + "wood_hit_05.wav", rate: 0.85 * r, amp: 0.8, attack: 0, sustain: 0.025, release: 0.04
    at [0.07 + rrand(-0.005, 0.005)] do
      sample C + "wood_hit_05.wav", rate: 0.78 * r, amp: 0.6, attack: 0, sustain: 0.025, release: 0.045
    end
  end""")
snd("choice", "choice", "a lit spot tapped, the way chosen", "Two bright ticks rising, 45 ms apart, the second higher: a small lift, recorded wood only.", 1.0, """
  with_fx :lpf, cutoff: 118 do                               # 6.6 kHz
    sample C + "wood_hit_01.wav", rate: 1.25 * r, amp: 0.8, attack: 0, sustain: 0.02, release: 0.04
    at [0.045 + rrand(-0.004, 0.004)] do
      sample C + "raise_e_1.wav", rate: 1.7 * r, amp: 0.7, attack: 0, sustain: 0.02, release: 0.05
    end
  end""")
snd("chest_card", "chest-card", "a card slides out of the chest", "Kenney's page flip played a third faster and cut to 0.35 s, under a 7 kHz low-pass: paper and card, nothing more.", 1.1, """
  with_fx :lpf, cutoff: 119 do                               # 7 kHz
    sample C + "bookFlip2.wav", rate: (1.3 + rrand(-0.05, 0.05)) * r, amp: 1.0, attack: 0.005, sustain: 0.2, release: 0.1
  end""")
snd("chest_ding", "chest-ding", "the card rests", "One bell, C6, E6 or G6 by variation, half a second: the full stop of the reveal.", 1.2, """
  bell [84, 88, 91][v], 1.0, 0.42""")
snd("chest_shimmer", "chest-shimmer", "the glow builds before the lid moves", "A rising run of small bells in C pentatonic over 1.4 s, each a little louder, glitter above them, a soft string swell under: a build with no event at its end, so the game's fade on a tap can cut it anywhere, and the game may stretch it by rarity.", 2.4, """
  notes = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98]
  notes.each_with_index do |n, i|
    at [i * 0.115 + rrand(-0.006, 0.006)] do
      bell n, 0.1 + 0.02 * i, 0.4
    end
  end
  8.times do |i|                                             # glitter: tiny high bells scattered through the second half
    at [0.5 + rrand(0, 0.9)] do
      bell [96, 98, 100, 103, 105][rrand_i(0, 4)], 0.05, 0.25
    end
  end
  synth :blade, note: 60, attack: 1.0, sustain: 0.25, release: 0.3, cutoff: 86, vibrato_depth: 0.05, amp: 0.1   # the swell under
  synth :blade, note: 67, attack: 1.1, sustain: 0.2, release: 0.3, cutoff: 86, vibrato_depth: 0.05, amp: 0.07""")
snd("chest_burst_common", "chest-burst-common", "a common chest opens", "The lid's wooden pop alone, 0.3 s: a hollow knock, a warm knock, the latch's click. Gold-only chests too.", 1.1, """
  with_fx :lpf, cutoff: 120 do
    pop r, 1.0
  end""")
snd("chest_burst_uncommon", "chest-burst-uncommon", "an uncommon chest opens", "The pop and one bell (G5) on the lid, 0.6 s.", 1.3, """
  with_fx :lpf, cutoff: 120 do
    pop r, 1.0
  end
  at [0.02] do bell 79, 0.7, 0.5 end""")
snd("chest_burst_rare", "chest-burst-rare", "a rare chest opens", "The pop and two bells rising a third (C6, E6), 0.8 s.", 1.5, """
  with_fx :lpf, cutoff: 120 do
    pop r, 1.0
  end
  at [0.02] do bell 84, 0.75, 0.55 end
  at [0.14 + rrand(-0.01, 0.01)] do bell 88, 0.8, 0.6 end""")
snd("chest_burst_epic", "chest-burst-epic", "an epic chest opens", "The pop, three bells rising (C6, E6, G6) and a soft string chord swelling under them, 1.2 s.", 1.9, """
  with_fx :lpf, cutoff: 120 do
    pop r, 1.0
  end
  [[0.02, 84], [0.14, 88], [0.26, 91]].each do |t, n|
    at [t + rrand(-0.01, 0.01)] do bell n, 0.8, 0.7 end
  end
  synth :blade, note: 60, attack: 0.25, sustain: 0.35, release: 0.5, cutoff: 88, vibrato_depth: 0.05, amp: 0.12
  synth :blade, note: 67, attack: 0.3, sustain: 0.3, release: 0.5, cutoff: 88, vibrato_depth: 0.05, amp: 0.09""")
snd("chest_burst_legendary", "chest-burst-legendary", "a legendary chest opens", "A fanfare of bells: the pop, a run up the pentatonic to a high C7 held, glitter around it, a string chord swelling under for 2 s.", 2.7, """
  with_fx :lpf, cutoff: 122 do
    pop r, 1.0
  end
  [[0.02, 84], [0.11, 88], [0.2, 91], [0.29, 93], [0.38, 96]].each do |t, n|
    at [t + rrand(-0.008, 0.008)] do bell n, 0.8, 0.6 end
  end
  at [0.5] do bell 96, 1.0, 1.2; bell 91, 0.6, 1.1; bell 84, 0.5, 1.0 end            # the top chord held
  6.times do
    at [0.6 + rrand(0, 0.9)] do bell [98, 100, 103, 105, 108][rrand_i(0, 4)], 0.08, 0.3 end
  end
  synth :blade, note: 60, attack: 0.3, sustain: 0.9, release: 0.7, cutoff: 90, vibrato_depth: 0.06, amp: 0.14
  synth :blade, note: 67, attack: 0.35, sustain: 0.85, release: 0.7, cutoff: 90, vibrato_depth: 0.06, amp: 0.1
  synth :blade, note: 76, attack: 0.5, sustain: 0.7, release: 0.7, cutoff: 90, vibrato_depth: 0.06, amp: 0.06""")
snd("chest_burst_unique", "chest-burst-unique", "a unique chest opens: its own sound", "Not a fanfare: the pop, then a strange open chord of bells (D6, A6, E7, fifths stacked) ringing over a low dark string, 1.6 s. Something old and particular, not something big.", 2.3, """
  with_fx :lpf, cutoff: 120 do
    pop r, 0.9
  end
  at [0.03] do bell 86, 0.7, 1.1 end
  at [0.1 + rrand(-0.01, 0.01)] do bell 93, 0.65, 1.1 end
  at [0.18 + rrand(-0.01, 0.01)] do bell 100, 0.55, 1.0 end
  synth :blade, note: 50, attack: 0.15, sustain: 0.7, release: 0.6, cutoff: 80, vibrato_depth: 0.04, amp: 0.16     # D3, dark
  synth :blade, note: 57, attack: 0.2, sustain: 0.65, release: 0.6, cutoff: 80, vibrato_depth: 0.04, amp: 0.08""")

# ---- the banners (Miles, GD's names of the same evening): two of the four big moments and the fifth, softer ----------------------
# A horn for the boss: two saws a hair apart through a low-pass (docs/maple-guide.md: a horn is saws, a triangle reads as a flute).
HORN = """
define :horn do |n, d, amp|
  with_fx :lpf, cutoff: 86 do
    synth :saw, note: n, attack: 0.04, sustain: d, release: 0.25, amp: amp * 0.3
    synth :saw, note: n + 0.08, attack: 0.05, sustain: d, release: 0.25, amp: amp * 0.18
    synth :tri, note: n - 12, attack: 0.04, sustain: d, release: 0.2, amp: amp * 0.12
  end
end
"""
snd("level_up", "level-up", "a level gained", "A short tune to hum, not a run: G5 C6 E6 then a held G6 (short short short long), on bells with strings doubling and a swell under, a sprinkle of glitter on the held note. 1.5 s. The rhythm is the level up's own; the chest's bursts run, this one sings.", 2.2, HORN + """
  [[0.0, 79], [0.17, 84], [0.34, 88]].each do |t, n|
    at [t + rrand(-0.006, 0.006)] do bell n, 0.75, 0.45; synth :blade, note: n - 12, attack: 0.02, sustain: 0.12, release: 0.15, cutoff: 92, amp: 0.1 end
  end
  at [0.51] do
    bell 91, 1.0, 1.0; bell 84, 0.5, 0.9                       # the held note, with its octave below
    synth :blade, note: 79, attack: 0.05, sustain: 0.6, release: 0.4, cutoff: 92, vibrato_depth: 0.08, vibrato_delay: 0.3, amp: 0.14
    synth :blade, note: 72, attack: 0.08, sustain: 0.6, release: 0.4, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: 0.12
    synth :blade, note: 64, attack: 0.1, sustain: 0.55, release: 0.4, cutoff: 88, amp: 0.1
  end
  5.times do
    at [0.6 + rrand(0, 0.6)] do bell [96, 98, 100, 103][rrand_i(0, 3)], 0.08, 0.3 end
  end""")
snd("boss_down", "boss-down", "a boss falls", "The biggest of the UI sounds: a horn's phrase, C5 G5 E5 then a long C6 (short short short long, the level up's cell inverted so the two are kin), strings under it, a low drum on the first and the last note, bells only on the last. 2 s, triumphant, not loud for long.", 3.4, HORN + """
  [[0.0, 72], [0.2, 79], [0.4, 76]].each do |t, n|
    at [t + rrand(-0.006, 0.006)] do horn n, 0.14, 0.9 end
  end
  # the drum: bd_boom cut to half a second (its own tail runs for seconds and merged the variations in the first render)
  at [0.0] do sample :bd_boom, rate: 0.9 * r, amp: 0.4, attack: 0, sustain: 0.15, release: 0.3; sample :drum_tom_lo_hard, rate: 0.9 * r, amp: 0.45 end
  at [0.6] do
    horn 84, 0.9, 1.0; horn 72, 0.9, 0.6
    sample :bd_boom, rate: 0.85 * r, amp: 0.55, attack: 0, sustain: 0.2, release: 0.4; sample :drum_tom_lo_hard, rate: 0.85 * r, amp: 0.6
    bell 96, 0.6, 1.0; bell 91, 0.4, 0.9
    synth :blade, note: 67, attack: 0.1, sustain: 0.8, release: 0.5, cutoff: 92, vibrato_depth: 0.08, vibrato_delay: 0.3, amp: 0.16
    synth :blade, note: 60, attack: 0.12, sustain: 0.8, release: 0.5, cutoff: 90, vibrato_depth: 0.06, vibrato_delay: 0.3, amp: 0.14
    synth :blade, note: 55, attack: 0.15, sustain: 0.75, release: 0.5, cutoff: 86, amp: 0.1
  end
  4.times do
    at [0.8 + rrand(0, 0.7)] do bell [98, 100, 103, 105][rrand_i(0, 3)], 0.07, 0.3 end
  end""")
snd("area_opened", "area-opened", "a new area opens: the cover lifts", "A swell, softer than the banners: strings rising from a low C to a wide C major with the ninth over 1.2 s, bells shimmering up through it late, no knock, no drum, a long tail. 2 s.", 2.8, """
  synth :blade, note: 48, attack: 0.6, sustain: 0.6, release: 0.7, cutoff: 84, vibrato_depth: 0.05, vibrato_delay: 0.5, amp: 0.14
  at [0.3] do synth :blade, note: 55, attack: 0.5, sustain: 0.6, release: 0.7, cutoff: 86, vibrato_depth: 0.05, amp: 0.12 end
  at [0.55] do synth :blade, note: 64, attack: 0.45, sustain: 0.55, release: 0.7, cutoff: 88, vibrato_depth: 0.06, amp: 0.1 end
  at [0.75] do synth :blade, note: 74, attack: 0.4, sustain: 0.5, release: 0.7, cutoff: 90, vibrato_depth: 0.06, amp: 0.07 end
  [[0.8, 84], [0.95, 88], [1.1, 91], [1.25, 93], [1.4, 96]].each do |t, n|
    at [t + rrand(-0.01, 0.01)] do bell n, 0.25 + 0.05 * (n - 84) / 3, 0.6 end
  end
  3.times do
    at [1.3 + rrand(0, 0.4)] do bell [98, 100, 103][rrand_i(0, 2)], 0.06, 0.3 end
  end""")

for k, (name, s) in enumerate(S.items()):
    src = HEAD.format(name=name, game=s["game"], title=s["title"], desc=s["desc"], secs=round(3 * s["gap"] + 0.5, 1))
    src += BODY.format(seed=3600 + 10 * k, body=s["body"], gap="%.1f" % s["gap"])
    open(os.path.join(HERE, name + ".rb"), "w", encoding="utf-8").write(src)
print(len(S), "sources written:", " ".join(S))
