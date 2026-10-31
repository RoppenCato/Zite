> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# How others make game music and sound with Claude, and what it teaches us (research, 2026-10-22)

Robin, 2026-10-22: "Do research online on what other people that develop games with Claude use to make music and sounds ...
See what people think about Sonic Pi and how they use it, tips and tricks. Your goal is to learn things and update your
skills. You could also suggest other tools." Derek, SD searched the web the same day. What is below is what the sources say,
then what the studio takes from it, then tools to discuss. Nothing here is installed or decided.

## 1. What people use

Four routes come up again and again for a coding agent that cannot hear:

| Route | How it works | Examples found | Instruments sound like |
| --- | --- | --- | --- |
| **Live-coding languages** | the agent writes code, a live engine plays it | Sonic Pi (MCP servers: `sonic-pi-mcp`, yevbar's live-prompting), Strudel / TidalCycles (`strudel-mcp-server`), SuperCollider (`claude-collider`, `supercollider-mcp`) | synthesis; real instruments only through samples |
| **A score, rendered offline with sampled instruments** | the agent writes a score (JSON or Python), it becomes MIDI, FluidSynth (SoundFonts) or sfizz (SFZ) renders it to WAV faster than real time, a script checks loudness | Audio as Code, SoundFont 2 Music (a Claude Code and Codex skill), midi-agent-skill, toy-midi's agent renderer | recorded instruments: GeneralUser GS for piano, guitar, bass, drums; **VSCO 2 Community Edition (CC0) for the orchestra** through sfizz |
| **Driving a DAW** | the agent controls Ableton Live through MCP | ahujasid's `ableton-mcp` (the most used music MCP server), others for REAPER, Logic, Bitwig | whatever the DAW has; needs the DAW and a person at it |
| **Generative audio models** | text to audio | Stable Audio (local, `audio-studio-mcp`), ElevenLabs sound effects, Suno (SunoBoard) | whatever the model makes; little control over a tune |

For sound effects the same split shows: procedural synthesis in code (Web Audio oscillators, sfxr-style generators), free
recordings (Kenney, OpenGameArt, BigSoundBank, Freesound), or a model (ElevenLabs, Stable Audio).

**Every serious project says the same thing about hearing:** the checks are signal checks (peak, RMS, LUFS per track and
per mix, silence, clipping, true peak), comparisons are made at **matched loudness** so the louder take does not win, and
"musical quality still needs listening" is reported as pending until a person has heard it. That is how this studio already
works; two of their habits are new to us (section 3).

## 2. What people say about Sonic Pi

- **It is the language code models handle best** among the live-coding ones (a preliminary finding of an arXiv paper on
  code-to-audio, 2508.05473), terse and well known. But the same paper finds that small code changes move the sound
  unpredictably, and that models rank their own candidates by how the code reads, not by how it sounds.
- **Its built-in synths lean electronic** (the community, again and again): acoustic and orchestral music in Sonic Pi is
  done with **external samples**. One user built a piano from a sample library with eight dynamic levels; another chose the
  best Sonatina Symphonic Orchestra sample for each note; for winds "one sample and `rpitch:`" is said to be enough. Others
  send Sonic Pi's MIDI out to FluidSynth with a SoundFont.
- **No faster-than-real-time render.** Recording is real time (as ours: about three minutes a stem, two passes); no source
  shows a way round it inside Sonic Pi.
- **Performance:** a `with_fx :reverb` inside a fast loop makes a new reverb every pass (a big room keeps each alive for
  about ten seconds: dozens at once); wrap the loop in the FX instead, or play several notes per pass. Turning off debug
  output (`use_debug false`) helps "can't keep up". A CPU's power saving can glitch real-time audio.
- **Safety:** Sam Aaron, Sonic Pi's author, warns that letting an agent evaluate Sonic Pi code gives it the whole machine
  (Sonic Pi runs Ruby): read the code before running it. Here the studio writes and runs its own files, never code from
  elsewhere, which is within his advice.

## 3. What the studio takes from it (now in the skills and the notes)

1. **Claude's own taste pulls toward slow, gentle, ambient counterpoint.** A LessWrong study had six models "evolve" a
   piece many times: Claude (Opus 4.5 and 4.6) drifted to slow, ambient, gentle counterpoint, sometimes a "bliss
   attractor"; other models went to IDM or hardcore. That is exactly Robin's "too much lullaby" (the sea voyage, the
   Shield wall, 2026-10-15). **So every brief now names its energy in numbers before any note** (tempo, notes per bar in
   the busiest part, where the drums are, what moves under a long note), and the render is checked against them.
2. **Constraints keep the piece clear.** Without limits the models kept adding layers, effects and odd lengths until parts
   were inaudible. Our rule (few instruments, each with a register) is the same lesson; the skills now cap the parts.
3. **Pin the original.** When revising, keep the version Robin liked as the fixed reference and name what changes against
   it, not against the last draft (the study's `--pin-original`).
4. **Loudness-matched comparisons.** When Robin compares an old and a new version, both are played at the same loudness, or
   the louder one sounds better whatever it is. The studio will make A/B clips matched by loudness.
5. **Per-part loudness, not only the mix.** toy-midi found that agents cannot balance parts by ear; they measure each
   track. LUFS under-weights the bass, so a spectral check stays with it. Our per-bar table and the stems tool do this.
6. **For sound effects: real recordings, cut and measured** (what this studio learnt on 2026-10-20 and wrote into
   `docs/sfx-notes.md` sections 11 and 12) is what the other projects do too when quality matters.

## 4. Tools to discuss (suggestions; Robin decides)

**A. Real instruments inside Sonic Pi, with VSCO 2 Community Edition (CC0).** Versilian Studios' free orchestra (flute,
clarinet, oboe, horn, trumpet, strings, harp, piano, percussion; public domain, about 3 GB as WAV with an SFZ map) played
as samples from Sonic Pi: for each note the nearest recorded note, pitched the small rest of the way, at the velocity
layer that fits. **Our pipeline stays as it is** (the same files, render, measures); only the voices change, from synths
imitating a flute to a recorded flute. The meadow's flute, the night's clarinet, the mountain's horn, the sea's harp would
gain the most. Cost: one download (Robin's yes), a small sample-map helper in `_lib.rb`, and real time renders as now.

**B. A score rendered offline: MIDI to FluidSynth or sfizz.** The route most agent projects take. The studio writes the
music as MIDI (Node can write it with no new library), `sfizz_render` plays it with VSCO 2 (SFZ) or FluidSynth with a
SoundFont (GeneralUser GS is free for commercial use), **much faster than real time** (minutes become seconds), and the
same measurements follow. Better long notes and legato than one-shot samples in Sonic Pi. Cost: two small programs to
download and run (Robin's yes), a new render tool, and the music written as MIDI rather than Sonic Pi code; Sonic Pi stays
for sound design and quick sketches. The biggest change, and the biggest gain in sound and speed.

**C. SuperCollider's offline mode.** Sonic Pi runs on SuperCollider; in its non-real-time mode a score renders 50 to 150
times faster than real time. It would end the three-minute renders but means learning SuperCollider's own language; it
does not by itself make the instruments sound more real. Behind A and B.

**D. Freesound, through an API key on Robin's account.** The largest free library (many CC0 recordings of real boars,
wolves, deer, axes, waves). Its API lets a search filter by licence and fetch the high-quality previews with a key alone
(the original files need a login flow). The pain cries made from a pig done by mouth and a small dog would have real
animals to start from. Cost: Robin makes a free account and a key.

**E. Generative audio for sound effects only.** Stable Audio Open runs on the PC's own NVIDIA card (free for commercial use
under $1M a year in revenue, Stability's community licence); ElevenLabs' sound effects need a paid plan for commercial
rights. Useful to get candidates quickly for things no pack has; not for music, where the game's identity is composed
tunes. Licences to be read before anything ships.

**F. A second pair of ears.** Audio-capable models (Gemini, Qwen-Omni) or a CLAP score can say whether a render matches
words like "lullaby" or "adventure". The research is cautious: these judges are much weaker on audio than on notes, so at
best a rough check before Robin listens. A cheaper step with what we have: transcribe each render with Basic Pitch (already
in the studio) and check the hook is there and heard where the plan says.

**Derek, SD's suggestion:** start with **A** (the same pipeline, real instruments, the clearest gain for this game's
sound), then try **B** on one track to compare speed and sound, and ask Robin for **D** when the cries come back.

## Sources

- Community projects: github.com/abhishekjairath/sonic-pi-mcp; in-thread.sonic-pi.net/t/mcp-server-for-playing-sonic-pi-from-claude-code-or-cursor/9838 (Sam Aaron's warning);
  github.com/jeremyruppel/claude-collider; glama.ai/mcp/servers/AJBogo9/supercollider-mcp (NRT, 50 to 150 times real time);
  github.com/williamzujkowski/live-coding-music-mcp; github.com/ahujasid/ableton-mcp; chatforest.com/guides/mcp-music-audio-production/.
- Offline score rendering: audioascode.com; github.com/leeseifer/soundfont2-music; github.com/tubone24/midi-agent-skill;
  github.com/hi-ogawa/toy-midi issues 845, 863 (per-track loudness for agents); man.archlinux.org/man/sfizz_render.1.en;
  versilian-studios.com/vsco-community/ (VSCO 2 CE, CC0); scancode-licensedb.aboutcode.org/generaluser-gs-2.0.LICENSE.
- Sonic Pi practice: in-thread.sonic-pi.net threads on FX in loops ("too many fx", "FX in practice: no CPU difference"),
  genres ("what genre do you think Sonic Pi is best suited for"), piano sound ("how can I get this kind of piano sound"),
  bulk rendering from the command line; arxiv.org/html/2508.05473v1.
- Models' taste: lesswrong.com/posts/DWtMPR8797aEDYXei (the Goldberg variations as algorave: attractor states of LLMs).
- Generative audio and licences: huggingface.co/stabilityai/stable-audio-open-1.0; stability.ai/news/stable-audio-open-research-paper;
  github.com/kanaworksai-hue/audio-studio-mcp; elevenlabs sound-effects terms; freesound.org/docs/api/overview.html.
- Judges: arXiv 2506.00003 (CLAP), 2605.21538 (Qwen3-Omni as a music judge; Gemini weaker on audio than on MIDI).

## Google's Lyria (asked by Robin, 2026-10-27: "What about Lyria 2.5?")

There is no Lyria 2.5. The family today (Google's own pages, 2026-10-27): **Lyria 2** (`lyria-002`, Vertex AI, 30 s
instrumental, 48 kHz WAV); **Lyria 3 Clip** (`lyria-3-clip-preview`, 30 s, $0.04); **Lyria 3 Pro** (`lyria-3-pro-preview`, up to
about 3 min, $0.08); **Lyria 3.5** (`lyria-3.5`, the newest, full songs of a couple of minutes, 44.1 kHz stereo, MP3 or WAV,
$0.08 a song); **Lyria RealTime** (a live stream steered as it plays). Paid tier only, no free tier. Control is the prompt:
genre, instruments, mood, tempo and key as words, instrumental by asking, a timeline of sections (`[0:00 - 0:10] Intro: ...`);
no seed, no note-level editing, one shot per request, a different result each time. Every output carries an inaudible
SynthID watermark. The Gemini API terms: Google "won't claim ownership" of the output, may give others similar output, and
the user is responsible for its use.

**Against the studio's way of working.** It sounds like real players, which Sonic Pi cannot; and it is cheap and fast.
But Robin's verdicts work at the level of notes and bars ("weird in the start", "the hook", "too much lullaby",
the flute's octave), and Lyria cannot keep a hook and change one bar, cannot share a tune across seasons, and does not
write to a bar grid, so a seamless loop has to be found and cut afterwards. It is a second instrument for what Sonic Pi
does worst (real voices, a fiddle, a choir), tried beside a Sonic Pi version and compared at matched loudness, not a
replacement. It needs a Google account with billing and an API key that Robin sets up himself (the studio never enters
keys); the studio would call it from a script that reads the key from the environment.

**Robin's decision, 2026-10-27:** "If it costs money i think we leave it for now." Lyria, SeedAudio and ElevenLabs are
paid, so none is used; the studio stays Sonic Pi and free (CC0) recordings. Come back to them only if Robin asks.

