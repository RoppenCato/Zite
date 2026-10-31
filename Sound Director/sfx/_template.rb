# <sound>: what happens on screen, how long it may be, how heavy, what must be heard first.
# name: <game_name>          the game's name for it, e.g. hit_axe
# seconds: 6                 the whole run (count variations plus the silences between)
# count: 3                   variations
#
# The game's version (templates/combat.html): <its tone and noise layers, in words>.
# Layers here: attack (noise, the material), body (a falling tone, the weight), tail (filtered noise or a ring).

use_bpm 60                             # envelope times are then in seconds

# one sound; v is the variation number, which seeds the small differences
define :sfx do |v|
  use_random_seed 100 + v
  pitch = 52 + rrand(-1.5, 1.5)
  cut = 95 + rrand(-6, 6)
  # attack: a short burst of noise, the material in the cutoff
  synth :noise, release: 0.06, cutoff: cut, amp: 0.7
  # body: a tone that falls, the weight
  s = synth :tri, note: pitch, release: 0.22, amp: 0.6, note_slide: 0.18
  control s, note: pitch - 7
  # tail: a little filtered noise ringing on
  with_fx :lpf, cutoff: 70 do
    synth :bnoise, release: 0.3, amp: 0.25
  end
end

3.times do |v|
  sfx v
  sleep 1.5                            # at least a second of silence between variations, for the splitter
end
