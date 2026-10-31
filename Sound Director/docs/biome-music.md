> Carried over from the Survival game's sound studio (C:\dev\SG\Sound Director) on 2026-10-31. The places and sounds named in it are that game's; the rules, the tools and what Robin's ear taught stand for the board world game too. Nigel, SD.

# Music by place and mood: what game composers do for forests, seas, mountains, caves and cold

Gathered 2026-10-14 while the first Maple-rule renders ran (Robin: "what notes, instruments etc are common for certain
themes, tones, mood, biomes"). Most of it is convention and composers' own words rather than measurement; where a claim
comes from our own studies it says so. Sources at the end. The Maple guide (`docs/maple-guide.md`) says how a piece is
built; this says what colour to build it in.

## 1. Principles that hold across games

- **Music is a map.** Players should hear where they are: each place gets its own palette (instruments and mode) so a
  change of place is heard before it is seen. That is what the fourteen Maple tracks do with tempo families and keys.
- **Not always on.** Stardew Valley plays several songs per season at random, and outdoors the songs do not loop back
  to back: ambient soundscapes fill the gaps between them. Skyrim shuffles its exploration cues as a bed. Breath of the
  Wild goes furthest: piano fragments with silences up to thirteen seconds, chosen so the environment's own sounds are
  heard. For us: the game's ambient layer (wind, birds, surf) is part of the music's plan, and a day may hold several
  pieces with quiet between them rather than one loop forever. (Robin rejected an *emptied* piece for the meadow; a
  *pause* between full pieces is a different thing and untried.)
- **Fragments and variable timing** keep a theme from wearing out over a huge map: Breath of the Wild marks its
  fragments with fermatas so the music never settles into a pulse; Stardew varies by choosing a different song.
- **Mode sets the mood more than the key does.** Major for safety and daylight; Mixolydian (major with the flat seventh)
  for old, rural, open; Dorian (minor with the raised sixth) for a minor that is not sad, a seafaring or travelling minor;
  Lydian (major with the raised fourth) for dreamy, magical, floating (the Lost Woods); Phrygian (minor with the flat
  second) for dark, foreign, threatening; natural minor and the tritone for dungeons. Aeolian plus a drone for the North.
- **Tempo and pulse read as effort.** 80 to 105 for water, dusk, weight and slow places; 115 to 135 for bright daylight;
  a steady drum reads as walking or work, no drum as stillness. (The fourteen studies: slow places 80 to 105, bright
  places 120 to 135.)
- **Register reads as temperature and size.** High and bright (bells, celesta, glockenspiel, piccolo, string harmonics)
  is cold and crystalline; low and dense (low brass, cellos, drones, pedal tones) is weight, depth and dark; the middle is
  warm.

## 2. By place, for our game

| Place | Mood | Instruments (convention) | Our voices (Sonic Pi) | Mode, key, tempo | References |
| --- | --- | --- | --- | --- | --- |
| **Meadow, groves, the lush day** | happy, safe, at work | flute as the signature forest instrument, woodwinds, acoustic strings, harp, plucked strings, light mallets; Stardew's banjo, harp, mallets and flute | flute, bells, harp, piano, pad, FM bass, shaker | major; F, Bb, C, D; 115 to 125 | Stardew (spring "hopeful and fresh", summer "happy and energetic"), Ellinia, Aquarium, our v1 |
| **Deep forest, the groves at dusk** | old, watchful, lovely | celesta and music box, slower, fewer parts; Lydian for enchantment; no bass (Ellinia Forest) | bells, harp, a high flute, no bass | Lydian or major, slower (90 to 110) | Ellinia Forest, Sleepywood (two chords, I and VI7, sixty bars) |
| **The sea, a crossing** | wide, slow, unresolved | sustained strings, wide reverb, harp, long notes; two chords rocking | pad, harp, flute long notes, the drone | maj7 chords in parallel, 80 to 90 | Aqua Road, Nautilus Harbor |
| **Harbour, jetty, village, trade** | bouncy, busy, human | clarinet, piano comp, plucked strings, light drums; a pedal chord with the middle voice busy | clarinet lead, piano, harp, shaker and rim, a soft kick | major, 105 to 130; a sus held | Lith Harbor, Ludibrium; the idea bank's "clarinet, bouncier" |
| **The North, fells, mountain, the Viking colour** | open, old, severe, soaring | Nordic folk: tagelharpa (a bowed lyre), lyre, frame drums, lur (horn), bass flutes, fiddle, drones; Valheim's clarinet, viola, cello, horn, guitar over Swedish folk; soaring open melodies, Nordic and Celtic, dulcimer | the blade low as a bowed string, pluck as a lyre, open-fifth drones, bd_pure as a frame drum, the wooden flute; a horn from a filtered saw | Mixolydian, Dorian, Aeolian with a drone; 90 to 110; open fifths | Assassin's Creed Valhalla (Schachner, Kyd, Selvik), Valheim (Jarlestam), Hellblade (Heilung: frame drums, bone, iron), our Woodsmoke |
| **Caves, the mine, the troll** | pressing, deep, alert | low drones (cello, bass), echoing drips and metallic clangs, cavernous reverb against close dry elements, sparse echoing percussion, unresolved harmony, the tritone, descending glissandi; keep the midrange clear for the game's sounds | dark_ambience and hollow as drones, pulse strings low, piano singles with long reverb, bnoise for air, a tom sample; no lead | minor, modal, or no key; 80 to 95; or no pulse at all | Ant Tunnel (D minor, 5 notes a second, bass-led, one bright burst), Stardew's "strange" underground music |
| **A crystal cave, an underground lake** | beauty inside the dark | major tonality and gentle textures against the surrounding gloom, so the dark feels darker after | bells, harp, a high pad | major, slow | the dungeon-contrast convention |
| **Winter, ice, snow (later seasons)** | cold, brittle, still, majestic, lonely | bells, celesta, piccolo, high string harmonics, glockenspiel, the glass harmonica; static repeated narrow tunes and pedal tones for frozen stillness; low brass and dense string clusters for the weight of snow; dissonant clusters for a blizzard | pretty_bell and dull_bell high, sine shimmers, the pad as a pedal, a low drone for weight; sparse | major for sparkle, minor or static for stillness; slow, or motionless | Stardew winter "lonely, cold, and majestic", the Sugar Plum Fairy as the icy sparkle model, El Nath (90 bpm, the house chords slowed for a cold place) |
| **Night, dusk** | sparse, strings, lonely | strings held, music box, fewer notes, a slower pulse | pad, bells, harp | relative minor or the day's key slowed, 80 to 90 | the game's evening song (D minor, 84), Sleepywood |
| **Danger, a beast** | (dropped by Robin 2026-10-14: no layer) | | | | |
| **Church, credits** | wide, still, long | sustained chords, bells, the ambient approach | our ambient meadow | | Robin: the ambient version "maybe a church or credits" |

## 3. Notes on the Viking colour, since it is ours

- The instruments the Norse-themed scores reach for: the **tagelharpa** (a bowed lyre with horsehair strings; Schachner's
  main string melody in Valhalla is a group of them), the plucked **lyre**, **frame drums**, the **lur** (a long horn),
  **bass flutes**, the **fiddle**; Heilung adds bone, reconstructed swords and shields and bronze rings as percussion;
  Jesper Kyd adds the rebec and crwth (medieval bowed strings) and even a Mongolian horsehead fiddle. Valheim's composer
  works from Swedish folk bands (Nordic, Kongero, Lyy, Groupa) with clarinet, viola, cello, horn, guitar.
- What that is in sound: bowed strings with a rough, breathy edge and vibrato (our `:blade` with a low cutoff), plucked
  strings that decay fast (our `:pluck` with a low `coef`), **drones of open fifths** (no third: neither major nor minor,
  which is where the old sound lives), **modal tunes** (Mixolydian's flat seventh, Dorian's raised sixth), hand drums
  rather than kits, horns in long notes, and rhythms in threes and in **3+3+2** (the lilt of rowing and of work).
- Valheim's meadow track is "a place to rest": slow, warm, acoustic; its forest is "the darkness". The contrast between
  rest and threat is in tempo and register, not in volume.

## 4. What this changes for our catalog (suggestions)

- The groves at dusk and the deep forest could take Lydian or a two-chord mood piece (Sleepywood's model) rather than a
  slower version of the meadow song.
- The sea wants parallel maj7 chords and a two-chord rock, slow, with the harp; a sketch would take an afternoon.
- The caves should have **no tune**: a drone, drips, one bright burst, the midrange left to the game's ambience.
- When winter comes to the game, the cold palette is bells, celesta, harmonics and a pedal tone; our bell voice is ready.
- The ambient-and-pause idea (songs with quiet between them, Stardew's way) is the untried path to "never tired" that
  keeps the full songs Robin likes.

## Sources

- Biome conventions (forest woodwinds, mountain Nordic/Celtic, caves): https://www.tunee.ai/music-generator/open-world-music (a generator's guide; conventions, not research)
- Modes and moods: https://www.musical-u.com/learn/the-many-moods-of-musical-modes/, https://blog.dubspot.com/music-theory-modes, https://www.productionmusiclive.com/blogs/news/musical-modes-and-their-emotions-characteristics-for-edm
- Valheim: https://en.wikipedia.org/wiki/Valheim (composer, performers, Swedish folk influences), https://www.nme.com/news/the-official-soundtrack-to-valheim-has-been-released-3082828
- Breath of the Wild: https://www.zeldadungeon.net/musical-musings-listening-closely-to-the-emptiness-of-breath-of-the-wilds-hyrule-field-day/, https://the-artifice.com/zelda-breath-of-the-wild-music/, https://acloserlisten.com/2018/04/03/press-a-the-music-of-zelda-breath-of-the-wild/
- Stardew Valley: https://stardewvalley.net/dev-update-16/ (instruments, seasons, random songs with ambient gaps), https://www.rpgfan.com/feature/prescription-for-sleep-stardew-valley-interview-with-the-musicians-and-producers/
- Assassin's Creed Valhalla: https://composer.spitfireaudio.com/en/articles/sarah-schachner-on-assassins-creed-valhalla, https://daily.bandcamp.com/high-scores/assassins-creed-valhalla-interview, https://news.ubisoft.com/en-us/article/10viz5kf9dL3OVpZZnMIvN/game-makers-podcast--einar-selvik-on-the-music-of-assassins-creed-valhalla
- Hellblade and Heilung: https://gamingaudionews.com/2019/12/16/senuas-saga-hellblade-ii-soundtrack-includes-experimental-band-heilung/
- Cold and ice: https://biblio.kz/blogs/entry/Şiirlik-kış-müziğinde (an essay on winter in music: bells, celesta, piccolo, harmonics, pedal tones, clusters), https://en.wikipedia.org/wiki/Glass_music
- Caves and dungeons: https://tunee.ai/music-generator/dungeon-music (conventions), https://digitalspace.bradfordcollege.ac.uk/10626277/music-block-1-ambience/ (a student cave score: drones, choir, the tritone)
- Skyrim: https://en.wikipedia.org/wiki/The_Elder_Scrolls_V:_Skyrim_(soundtrack), https://content2.uesp.net/wiki/Skyrim:Music (exploration cues shuffled as a bed)
- Minecraft (sparse piano, no percussion, slow): https://www.musicnotes.com/sheetmusic/c418/minecraft-calm-1/MN0114415
