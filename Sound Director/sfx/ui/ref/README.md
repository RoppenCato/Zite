# UI sounds: the reference recordings (2026-11-01)

Robin, 2026-11-01: the Survival game's sounds are reused where they fit. These pieces were cut from recordings already on this
PC in the Survival game's studio, decoded through the engine and measured (`work/decode/die/`), each starting at its own sound
and peak-normalised. Nothing new was downloaded. Piece `die_N` of that decode is recording N of its list (a 1 s slot aliased
the 2 s lead-in, so `label.js` named them two off; the numbers here are read by piece number).

| Piece | Recording | Pack, author, licence | Measured |
| --- | --- | --- | --- |
| `wood_hit_06.wav` | `wood_hit_06.ogg` | 100 CC0 metal and wood SFX, rubberduck (OpenGameArt), CC0; `C:\dev\SG\Sound Director\sfx\world\ref\rubberduck\` | 113 ms, attack 3.0 ms, centre 3.4 kHz, 42 % in 1 to 4 kHz and 40 % over: a short bright clack, the die's corner |
| `wood_hit_01.wav` | `wood_hit_01.ogg` | same | 158 ms, 0.7 ms, 2.6 kHz, 54 % in 1 to 4 kHz, 22 % over: a bright clack |
| `wood_hit_02.wav` | `wood_hit_02.ogg` | same | 204 ms, 1.2 ms, 5.0 kHz, 67 % over 4 kHz: a thin click |
| `wood_hit_03.wav` | `wood_hit_03.ogg` | same | 216 ms, 5.3 ms, 2.0 kHz, 95 % in 1 to 4 kHz: a clean knock |
| `wood_hit_05.wav` | `wood_hit_05.ogg` | same | 104 ms, 1.9 ms, 558 Hz, 82 % in 250 Hz to 1 kHz: a warm knock, the board's body |
| `wood_hit_07.wav` | `wood_hit_07.ogg` | same | 186 ms, 1.1 ms, 686 Hz, 93 % in 250 Hz to 1 kHz: a hollow knock |
| `wood_misc_02.wav` | `wood_misc_02.ogg` | same | 219 ms, 2.0 ms, 7.1 kHz, 97 % over 4 kHz: a tiny tick |
| `wood_falling_02.wav` | `wood_falling_02.ogg` | same | 317 ms, a 32 ms swell, 2.3 kHz, 86 % in 1 to 4 kHz: bits of wood settling |
| `wood_falling_04.wav` | `wood_falling_04.ogg` | same | 250 ms, a 103 ms swell, 1.6 kHz, 81 % in 1 to 4 kHz: a longer settle |
| `bookFlip2.wav` | `bookFlip2.ogg` as the Survival game cut it (`sfx/ui/ref/cut/`) | RPG Audio, Kenney (kenney.nl), CC0 | a quick page flip, bright (5.5 to 6 kHz): the card sliding out, played faster |
| `raise_e_1.wav` | `impactWood_light_000.ogg` as the Survival game trimmed it (`assets/sfx/free/raise_e_1.ogg`) | Impact Sounds, Kenney (kenney.nl), CC0 | 77 ms, 2.4 ms, 1.4 kHz, 60 % in 1 to 4 kHz: a light wood knock |

Measured and set aside: Kenney's `impactPlank_medium`, `impactWood_medium` and `footstep_wood` (131 to 164 ms, 108 to 257 Hz,
most of the energy under 250 Hz: a heavy thing on a board, not a die); rubberduck's `wood_hit_08` (588 Hz, 68 % under 250 Hz),
`wood_hit_09` (234 Hz, a thud), `wood_hit_04` (2.4 kHz but a 7 ms attack), `wood_misc_01` (a slow rattle, 130 ms to its peak).
