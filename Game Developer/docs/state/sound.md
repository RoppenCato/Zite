# The sound

No sound is in the game yet (2026-11-01): nothing is loaded and nothing plays, but the scenes already call `sfx.play(name)`
(`client/src/feel.ts`, a no-op until the audio layer) at the moments that will sound: `ui/tap` on every button, `ui/choice`
on a lit spot, `ui/card` on a class card, and in the loot reveal `ui/chest-shimmer`, `ui/chest-burst-<rarity>` (common,
uncommon, rare, epic, legendary, unique), `ui/chest-card`, `ui/chest-ding`. Nigel, SD's first drop landed on 2026-11-01
(the die landing as three candidates, `Sound Director/out/sfx/ui/`, with the game's `ui.ogg` and `ui.json` in its
`game/`); it is wired with the die's moment (chapter 1, step 3). ffmpeg is on the PC (Robin's yes, 2026-11-01:
`C:\dev\ffmpeg\bin`, on the PATH). The Sound Director's studio (Nigel, SD, Sonic
Pi 5, deliveries into `C:\dev\Zite\Sound Director\out/`) exists since 2026-10-31 and has not worked yet. **What the game
needs heard, in order, is `docs/sound-demands.md`** (the UI first, the fight second, then Cloverfield Meadows' music,
ambience and creature voices; each wave tagged with its chapter), with the formats and budgets the game can carry on a
phone: OGG Vorbis, short sounds as audio sprites under 1.5 MB each, music as seamless loops of 30 to 60 s under 1.5 MB,
the first load under 3 MB of sound, effects around −16 LUFS and music around −18.

When the first drop lands it is copied whole into `assets/sound/` and the client gains its audio layer: the sprites loaded
with the scene and played on the events the scenes already have, music per area streamed through an audio element with a
crossfade on an area change and on a fight's start and end, ambience under it, the settings' mute and two volumes,
`?mute=1` for test pages, the audio unlocked on the first tap. The settings already carry a sound toggle that does nothing
yet, and the convention `?mute=1` is written down in `docs/state/pages.md`.
