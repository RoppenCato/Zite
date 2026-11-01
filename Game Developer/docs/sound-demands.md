# Sound demands: what the game needs heard, and in what order

Miles, GD, 2026-11-01, at Robin's request. The Game Developer's list for the Sound Director (Nigel, SD): every sound the
game as it stands needs, in waves, first wave first, each tagged with its **chapter** (`docs/chapters.md`). The studio's
own rules are in its `CLAUDE.md` (Sonic Pi 5, deliveries into its `out/`); this file says what, when it plays, and the
budgets the game can carry on a phone. The order is mine on Robin's steer: the UI first, the fight second, then the
first area's music and voices. He changes it with a word.

Nothing in the game plays a sound today (2026-11-01). Each drop is a whole folder in the Sound Director's `out/<name>/`
with NOTES.md; I copy it into `assets/sound/` and wire it in. Until a sound exists the game is silent at that moment; a
drop fills the moment in.

## The character of the sound (mine, from the theme; Robin decides)

Enchanted Kingdoms: cheerful, storybook, a little toy-like; wood, bells, plucked strings, whistles, kazoo-grade silliness
where a creature is silly; nothing harsh, nothing long. The big moments get the richest sounds and the rest stays
short and soft, so the big ones land: **the die landing, a chest opening, a level up, a boss falling** are the four
"dopamine" sounds (Robin, 2026-11-01) and deserve the most work. A sound a player hears a hundred times an hour (a tap,
a step, a hit) must be a pleasure the hundredth time: short, varied, never piercing.

## Wave 1 (chapter 1): the UI, the board, the chest

One **audio sprite** (one file plus a JSON of offsets) with the short sounds, so one request and one decode. Lengths are
upper bounds.

| Sound | Count | Length | When it plays |
| --- | --- | --- | --- |
| Tap (a button pressed), tap denied (a dim button, "not allowed") | 2 | 0.15 s | every button; the denied one soft, never a buzzer |
| Chip chosen (a dice card, an answer to the gambler, a note line) | 1 | 0.2 s | the chip row under the board |
| Roll: the die picked up and shaken; the tumble; **the die lands** | 3 | shake 0.4 s, tumble 0.6 s loop, land 0.5 s | the land is the beat of the game; the game pitches it a little by the face, so one sound, bright |
| A lit spot tapped (the choice made) | 1 | 0.2 s | after a roll with more than one place to go |
| Steps on the board: grass, road, wood (bridge), two or three variants each | 8 | 0.25 s | one per step of a walk (260 ms a step); the surface by the area later, grass for now |
| Arriving: a town (a small bell), a shop (a till or a jingle), a spring (a splash and a sip), a shrine (a chime), a chest found (a creak of discovery), a wild spot (a soft rustle), the boss spot (a low note) | 7 | 0.5 to 1.5 s | the walk's end, before what the spot does |
| **The chest**: the glow building (a rising shimmer, one sound the game stretches by rarity), the lid and the burst in six weights (common a wooden pop … legendary a fanfare with bells; unique its own), the card sliding out, the ding | 1 + 6 + 1 + 1 | shimmer 1.5 s, burst 0.6 to 2 s, slide 0.4 s, ding 0.5 s | the loot reveal (`docs/art-demands.md`, wave 1); vaults and boss drops use the same with the heavier bursts |
| Gold: coins gained (a short jingle), a few coins (small), a purse lost (death) | 3 | 0.6 s | chests, fights won, the gambler, death |
| **Level up** (a rising fanfare), the ability-pick chips appearing | 2 | 1.5 s, 0.4 s | after a fight that crossed a level |
| **Boss down** (a short triumphant phrase) and **area opened** (a swell, the cover lifting) | 2 | 2 s | the Iron Gate's moment, then each gate |
| Errand taken, errand done (a small "well done"), the trainer's lesson, buy, sell, wear, take off, drop | 7 | 0.3 to 0.8 s | towns, shops, the bag |
| Spring filled (a flask), shrine taught (a chime with a lift), a spot still empty (a dull tap) | 3 | 0.6 s | the special spots |
| Hint shown (a page turn), message line changed (a soft tick), the atlas or a sheet opening and closing | 4 | 0.2 to 0.4 s | the chrome |
| Online: someone joined (a small hello), someone left, reconnected, a note left nearby | 4 | 0.5 s | the shared world |
| The character screen: a class card chosen (four variants, one per class: the Knight a clink, the Trickster a snap, the Wizard a sparkle, the Archer a bowstring), Begin (a short overture) | 5 | 0.3 s; Begin 2 s | the first thing a new player hears |

About 60 sounds. **Delivered as** `ui.ogg` plus `ui.json` (name, start, length) and the loose files for listening.

## Wave 2 (chapter 1 for the Knight, chapter 2 for the rest): the fight

A second audio sprite. Every blow has a swing and an impact so the game can line them up with the clip (the Knight's
`attack1` lands on its fourth frame, 200 ms in).

| Sound | Count | Length | When it plays |
| --- | --- | --- | --- |
| The fight begins (a sting), a round begins (a tick), the moves appear | 3 | 1 s, 0.2 s, 0.3 s | the fight screen |
| Attack: a swing, a light hit, a heavy hit, a crit (bigger, a crack), a miss (a whiff) | 5 | 0.3 to 0.6 s | every round |
| Guards: Block (a clang on shield), Dodge (a whoosh and a step), Brace (a thud taken with a grunt), Counter (a parry and a riposte) | 4 | 0.5 s | the guard row |
| Charge: the power gathering (a rising hum), the charged blow landing (heavier than a heavy hit) | 2 | 1 s, 0.6 s | Charge and the round after |
| **The Knight's six abilities**, each its own: Mighty Swing (a great whoosh and crunch), Shield Bonk (a comic bonk), Battle Hymn (a short sung phrase or horn), Finishing Flourish (a flourish of steel), Second Wind (a breath and a lift), Castle Stance (stone settling) | 6 | 0.6 to 1.2 s | the abilities menu |
| The meter: a pip filling (four variants by class later; the Knight's Valor a drum beat), the meter full (a shine) | 2 | 0.2 s, 0.6 s | under the HP bar |
| The enemy winds up (an ominous intake: Guard well), the enemy's generic blow (light, heavy), the enemy's second phase (a dark swell) | 4 | 0.5 to 1.5 s | the enemy's tell and its turns |
| Effects: poison tick, chill, burn, weaken, stun, heal, mana drained, barrier up, barrier broken | 9 | 0.3 to 0.6 s | status changes |
| Potions: Honey Tonic drunk (a glug and a sigh), Moon Dew drunk (a sparkle sip) | 2 | 0.6 s | the potion moves |
| Flee (hurried steps), caught (a thud) | 2 | 0.6 s | Flee |
| Victory (a short phrase, 1.5 s), defeat (a slower one, 2 s), the xp count ticking up, the drop rolling onto the card (then the chest's burst by rarity) | 4 | | the fight's end |
| **The Trickster's, the Wizard's and the Archer's abilities** (18) and their meters' pips (3) | 21 | 0.6 to 1.2 s | chapter 2 |

About 45 sounds in chapter 1, 21 more in chapter 2. **Delivered as** `fight.ogg` plus `fight.json`, then `fight-classes.ogg`.

## Wave 3 (chapter 1): Cloverfield Meadows' music, ambience and voices

| Piece | Count | Length | Notes |
| --- | --- | --- | --- |
| **The board theme** of the meadows (cheerful, strolling, the one the player hears most) | 1 | a seamless loop of 45 to 60 s | stereo; must not tire in an hour: light, with space |
| **The fight theme** of the meadows (bouncy, a little urgent, never grim) | 1 | loop of 30 to 45 s | starts on the fight sting, ends on victory or defeat |
| **King Goo's theme** (the boss: bigger, comic, a tuba somewhere) | 1 | loop of 45 to 60 s | the gate's fight |
| **Puddlewick's theme** (the town: calm, a music box or a fiddle) | 1 | loop of 30 to 45 s | optional in chapter 1; the board theme serves if time is short |
| The title (the character screen) | 1 | loop of 30 s | the first music heard; the Begin overture ends it |
| Ambience beds: the meadow (birds, a breeze, a bee now and then), the town (a bell far off, chatter) | 2 | loops of 30 s, quiet | under the music, mono is fine |
| **Creature voices**, three a creature (attack, hit, die): Jelly Slime (squelch, squish, splat), Grumpy Sprout (a grumble, a snap, a wilt), Meadow Bandit (a yah, an oof, a yelp), Bumbling Bee (a buzz swoop, a bzzt, a fading buzz; plus a hover buzz loop), Mushroom Muncher (a munch, a thump, a puff), King Goo (a wobble roar, a gloop, a great splat; plus the phase's surge) | 20 | 0.3 to 1.5 s | one audio sprite `creatures-meadows.ogg` |

**Delivered as** loops in `music/` (`meadows-board.ogg`, `meadows-fight.ogg`, `meadows-boss.ogg`, `meadows-town.ogg`,
`title.ogg`), beds in `ambience/`, the voices as a sprite. NOTES.md gives each loop's exact loop points and its loudness.

## Wave 4 (chapter 2): Wobblewood Forest

The forest's board theme, fight theme, Grumblebark's theme, Tumbletree's theme, the forest bed (wind in leaves, an owl,
creaks); the voices of Twigling, Moss Goblin, Sporeling, Nutkin Thief, Sleepy Owlbear Cub and Grumblebark (three each, 18);
the three classes' abilities and meter pips (wave 2's tail); steps on roots and moss.

## Wave 5 (chapter 3): Honeyhill Fields, the shared world

Honeyhill's board, fight, Queen Bumble and Goldencomb themes, the harvest bed (crickets, a windmill creak, bees); the
voices of Honey Blob, Corn Goblin, Buzzbug, Apple Mimic, Scarecrow Scrapper and Queen Bumble (18); the world boss
(an alarm horn when one rages, its own theme, the shared kill's fanfare); the recovery code and settings sounds.

## Wave 6 (the proximity chapter)

A link made (a two-note handshake), "someone is nearby" (a gentle ping, never alarming), the combo (a sting per pair
that exists in the rules, one generic for the rest), a friend joining your fight.

## Wave 7 (chapters 5 and on, one theme a chapter)

For each grown theme in the catalogue's order (Glimmerlake, Moonwhisper, Thunderstone, Sunfall, Frostveil, Thornhollow,
Starfall, Embercrown, the Shattered Crown): a board theme, a fight theme, a boss theme, an ambience bed, steps on its
ground, and the voices of its four mobs, mini-boss and boss (18). The second round of themes reuses them.

## Rules for every piece (mine, 2026-11-01; the budgets the game can carry)

- **Format**: OGG Vorbis, 44.1 kHz, effects mono at quality 4, music stereo at quality 5. Chrome on Android plays it;
  when iOS comes, the same files as AAC in `.m4a` beside them (the game loads whichever plays). The studio's MP3 habit is
  fine for listening copies, not for the game.
- **Short sounds come as audio sprites**: one `.ogg` plus a `.json` of `{ name: [start, length] }` in milliseconds per
  wave (`ui`, `fight`, `creatures-<area>`), with 50 ms of silence between sounds. One request, one decode, no gap on
  first play. A sprite stays under 1.5 MB on disk and under 60 s in all (about 10 MB decoded).
- **Music is a loop**, seamless, with the loop points in NOTES.md; 30 to 60 s; under 1.5 MB each. The game streams music
  through an audio element and decodes only the sprites, so loops cost no memory but the player hears a loop every
  minute: write them to bear it.
- **Loudness**: effects peak at −3 dBFS and sit around −16 LUFS; music around −18 LUFS; the UI set a touch quieter than
  the fight set; nothing clipped, nothing with a click at its start or end; a 5 ms fade on both ends of every effect.
- **Length** matters more than richness: a tap is 150 ms, a hit 300, a fanfare 1.5 s. Only the four dopamine sounds and
  the fight's end go past a second.
- **Variants**: steps, hits and taps in two or three variants, named `step-grass-1`, `-2`, `-3`; the game picks at random.
- **Names**: `ui/tap`, `ui/die-land`, `ui/chest-burst-epic`, `fight/hit-heavy`, `fight/ability-mighty-swing`,
  `creature/jelly-slime/hit`, `music/meadows-board`, `ambience/meadow`. Lower case, hyphens, the group first.
- **First load** (the title loop, the UI sprite, the fight sprite): under 3 MB; an area's music, bed and voices load when
  the player enters it.
- **Delivery**: `out/<name>/` with the files, the sprite JSON and NOTES.md (what each sound is, when it plays, loop points,
  loudness, the Sonic Pi source's name); I copy the folder into `assets/sound/` and wire it in; the mute switch and a
  music and effects volume go in the settings when the first drop lands.

## What I build when the first drop lands

An audio layer in the client: the sprites loaded with the scene, a `play(name)` on the events the scenes already have
(a tap, a roll, a step, a hit, a chest), music per area with a crossfade over two seconds on an area change and on a
fight's start and end, ambience under it, the settings' mute and two volumes, `?mute=1` for test pages, and the audio
unlocked on the first tap (phones play nothing before a gesture). Phaser's sound manager plays the sprites; an audio
element streams the music.

## The totals, for planning

| | Short sounds | Music loops | Ambience beds |
| --- | --- | --- | --- |
| Chapter 1 (waves 1 to 3) | about 60 UI, 45 fight, 20 voices | 5 | 2 |
| Chapter 2 (wave 4 and the classes) | 21 abilities, 18 voices, steps | 4 | 1 |
| Chapter 3 (wave 5) | 18 voices, the world boss, settings | 4 | 1 |
| Each grown theme | 18 voices, steps | 3 | 1 |
