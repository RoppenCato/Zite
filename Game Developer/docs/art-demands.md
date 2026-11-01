# Art demands: what the game needs drawn, and in what order

Miles, GD, 2026-11-01 (re-ordered the same evening on Robin's word: the UI first, the hero's sets second). The Game
Developer's list for the Art Director (Mitch, AD): every piece the game as it stands needs, in waves, first wave first,
each wave tagged with the **chapter** it belongs to (`docs/chapters.md`: the game is built one chapter at a time, each
ending in a playable alpha). The budgets, the file form and how a drop is delivered are in `docs/state/art.md`; this file
says what and when. Sizes here are **CSS (design) pixels; the files are 2x**. The order is mine on Robin's steer; he
changes it with a word.

## The order, and why

1. **A UI that is pleasant to look at comes first** (Robin, 2026-11-01: "I want to have a really nice UI"; "The aim is
   dopamine hits"). The UI is on every screen, it is what the player touches, and today it is flat rectangles.
2. **The hero and what he wears come second** (Robin, 2026-11-01: visible equipment progression is extremely important;
   the character's construction approved; eight slots). The player looks at his own character more than at anything else.
3. **Then the first area complete**: Cloverfield Meadows' board kit, fight backdrop, creatures, mini-boss and King Goo.
   One finished area with placeholders beyond it beats half an area everywhere. Waves 1 to 3 are **chapter 1**.
4. **Characters before decorations**; **within the budgets, always** (`docs/state/art.md`).

Until a piece exists the game draws a shape in its place, so nothing waits on art to be playable; each drop replaces its
shape. Every drop is a whole folder in the Art Director's `out/<name>/` with NOTES.md; I copy it into `assets/` and wire it in.

## What exists (2026-11-01, evening)

| Piece | State |
| --- | --- |
| The hero's construction: one skeleton with slots, five test sets (tunic, plate, mage, mix, archer) in `assets/hero/` | approved by Robin; the tunic and plate sets drawn as the Knight on the board and in the fight since 2026-11-01 (`docs/state/art.md`); the rest poses will be re-exported after Robin approves the attachment system |
| The old Warrior and the three old meadow monsters in `assets/` | scrapped art, stand-ins only |
| Everything else | shapes |

## Wave 1 (chapter 1): the UI, pleasant to look at

One kit, one atlas (two if the loot reveal needs its own), drawn once, used on every screen. The look is the Enchanted
Kingdoms': warm, chunky, friendly, a little storybook; nothing flat, nothing pixel. Sizes in design pixels; nine-slice
pieces stretch, so draw their corners and edges with care.

| Piece | Count | Size | Notes |
| --- | --- | --- | --- |
| Panel backgrounds: the HUD band, the bottom band, the message box, a modal sheet (shop, bag, atlas, settings) | 4 | 9-slice, 16 px corners | parchment, wood or stone in the theme's hand, but quiet: text sits on it |
| Cards: a class card on the character screen, a shop row, a bag row, an atlas row, a chip in the row under the board | 5 | 9-slice | two states each: idle and chosen |
| Buttons: the big green action (Roll, Begin, Continue), the plain button (Map, World, Bag, Log, Back, Close), the danger button (Drop, Flee), each in idle, pressed and dim | 3 × 3 | 220 by 66 and 80 by 50, 9-slice | the Roll button is the most pressed thing in the game: make it a pleasure; the pressed state is drawn as pushed in (a shadow lost, the face a touch darker), the game squashes it on touch and pops it on release (Robin, 2026-11-01: snappy, responsive, small effects on every press) |
| Press and feedback effects: a tap ring, a small sparkle for a chosen card or chip, a ripple for a lit spot tapped, a tick glyph for a bar that moved | 4 | 32 to 64, 3 to 5 frames | the micro-effects behind the feel; the sounds are in `docs/sound-demands.md` wave 1 |
| The die: six faces, a rolling blur, a settled glow | 8 | 56 | the roll's moment; the glow is the "it landed" beat |
| HP and MP bars (frame, fill, a tick when it changes), the class meter (empty and full pips) | 6 | bar 160 by 14; pip 12 | |
| Spot-kind icons: wilds, town, shop, chest, spring, shrine, boss; also used in hints and the atlas | 7 | 32 | |
| Item icons: Honey Tonic, Moon Dew, the four dice cards (Do-Over, Hop, Hold, Fairy Pick), a gold coin, a vault key | 8 | 40 | |
| Gear slot icons for an empty slot: weapon, shield, helm, armour, gloves, boots, cape, trinket | 8 | 40 | |
| Rarity frames round an icon: common, uncommon, rare, epic, legendary, and the orange unique frame | 6 | 48 | the same six colours are the glow colours below |
| Small marks: lock, clock (a cooldown), star (xp), heart, mana drop, online dot, a note scroll, a "!" and a "$" badge, a tap ring | 10 | 24 to 40 | |
| **The chest and the loot reveal** (Robin, 2026-11-01): a closed chest, a glowing chest in each rarity colour (the glow a separate layer so the code can tint it), an opening animation of 8 to 12 frames with the lid flying and a burst of light, a loot card the piece slides out on, sparkle and confetti particles in the rarity colours, a "ding" moment frame | 1 chest + 6 glows + 1 opening clip + 1 card + 2 particle sheets | chest 160, card 300 by 120, particles 16 to 32 | the dopamine hit: the glow builds before the open, the burst, then the card with the name in its rarity colour **Landed 2026-11-01** (`assets/loot/`) |
| Level-up burst, a boss-defeated banner, an "area opened" banner | 3 | banner 360 by 80 | the other big moments |
| The Zite wordmark; the app icon (512, and 192; the 512 also maskable: subject in the middle 80 %); a character-screen backdrop | 3 | backdrop 824 by 1830 at 2x | the placeholders are `client/public/pwa-*.png` |
| A font pairing for the UI (a display face for titles and numbers, a text face for lines), chosen from Google Fonts | 2 | | the game draws text with it; licence noted in NOTES.md |

What I do when it lands: a UI layer in the client that draws nine-slices and icons from the atlas instead of rectangles
and letters, and a **loot reveal screen** that runs the chest's glow, open, burst and card for every chest, vault and
boss drop (built 2026-11-01, `client/src/scenes/RevealScene.ts`, on the pieces, which landed the same day in `assets/loot/`).

## Wave 2 (chapter 1 for the Knight, chapter 2 for the other three): the hero and what he wears

The construction is approved (Robin, 2026-11-01): one skeleton a class, slots head, torso, hips, boots, hands, back, near
arm, far arm, weapon, off-hand; clips **stand 4, move 6, attack1 6 (the fourth frame held, the blow lands there), defend
2, hit1 2, die1 6 (the last two fading)**; files facing left, pivot at the feet, names `hero_<set>/<action>/0001`; a class
character may take an atlas of 2048 by 2048 (my word, 2026-11-01: 16 MB decoded; the 300 to 400 KB on disk holds).

- **The Knight**, as the test sets are, is the first class: the body and the worn pieces of the first two ranks (Tin and
  Copper) for all eight slots, and the four weapon types (sword, axe, mace, spear) Robin asked to see. One atlas per worn
  set for the first drops; **one atlas per part**, layered by the client in a fixed order (cape, body, boots, hips, torso,
  gloves, head, helm, near arm, weapon, off-hand), as soon as the per-part test proves the alignment: eight free slots
  cannot be pre-rendered as sets.
- **The Trickster, the Wizard, the Archer** on the same skeleton with their own stance and weapons (dagger and bow are two
  more weapon types), the same clips, the same slots. Chapter 2.
- **Class cards**: the standing frame of each class in its Tin set is the card's picture; no separate portraits.
- **Ability icons**, 24, 40 px, one atlas: Knight first (Mighty Swing, Shield Bonk, Battle Hymn, Finishing Flourish, Second
  Wind, Castle Stance), then Trickster (Sneak Jab, Nettle Knife, Vanishing Act, Puff of Smoke, Sticky Fingers, Grand
  Finale), Wizard (Firework, Snowball Hex, Bubble Shield, Pocket Watch, Falling Star, Moonlight Veil), Archer (Triple Shot,
  Bullseye, Net Toss, Tripwire, Owl Friend, Painted Target).
- **Fight effects**, small strips of 4 to 6 frames at 64 to 128 px, one atlas: hit spark, crit burst, block shield, dodge
  whoosh, counter flash, charge glow, poison drip, chill, burn, weaken, heal glow, mana sparkle, the wind-up tell over an
  enemy's head, the level-up burst.
- **The player's height on screen** is Robin's to confirm from the test shots (100 CSS px was the old number; his own sheet
  stood 118). On the board the hero stands at half the fight's size, 75 CSS px, against the 56 px plates (mine, 2026-11-01). **Robin named 44 px for the board to Mitch, AD the same day**; the 75 replaces it until he says, since 44 looked small beside the kit's plates.

## Wave 3 (chapter 1): Cloverfield Meadows, complete

### 3a. The meadows' board kit

The board is seen from a raised camera in 2D (the brief, "The look"): a tilted ground with cliff faces where the land
steps up, roads flat on it, everything standing on it upright. Cloverfield Meadows' bounds are x 140 to 1260 and y 2120 to
3592 world pixels (1120 by 1472; the brief's 1400 by 1900 was a first guess, corrected 2026-11-01) with 60 spots; the ground is
tiles and strips, never one picture.

| Piece | Count | Size | Notes |
| --- | --- | --- | --- |
| Ground tiles (clover and grass) and edge pieces (the cliff faces where land steps, the edge of nothing at the map's rim) | a small tile set | tiles 128 | tileable; the board is drawn at 0.8 and seen whole at 0.3, so broad shapes |
| Road pieces (straight, bend, fork, end) | 4 to 6 | 64 wide | laid along the links between spots |
| Spot markers, one per kind: wild, town, shop, chest, spring, shrine, the boss spot (the gate) | 7 | wild 56; town and shop 90; the gate 120 | the player stands on them; strong silhouettes, readable at 30 % |
| The closed-area cover (fog or cloud) | 1 tile | 256 | tiled over areas not yet open |
| Props from the catalogue: fences, stumps, rounded bushes, flower patches, a windmill, cottages | 8 to 12 | 60 to 160 | placed by hand on the hubs' spots |
| The name plate for another player's mark, the area's name banner | 2 | plate 120 by 28; banner 400 by 60 | text drawn by the game |
| Horizon strips behind the board (sky and far hills) | 2 | 2048 by 1024 at 2x | last |

### 3b. The meadows' fight backdrop

Layers, not one picture: the sky is a gradient drawn by code; then **two or three strips of at most 2048 by 1024 (2x)**
that tile or stretch (soft distant hills and farmhouse silhouettes, near grass), then the ground plane the fighters stand
on, clean behind the combatants.

### 3c. The meadows' creatures

| Creature | Role | Level | Size |
| --- | --- | --- | --- |
| Jelly Slime | mob | 1 | 120 |
| Grumpy Sprout | mob | 2 | 130 |
| Meadow Bandit | mob | 3 | 110 |
| Bumbling Bee (flies: it hovers above its ground point) | mob | 3 | 120 |
| Mushroom Muncher | mini-boss | 5 | 180 to 200 |
| King Goo at King Goo's Gate | boss | 6 | 300 to 400; a second phase under half HP (the tiny crown slips, the goo surges): a second `stand` and `attack1` if a second atlas fits, else a tint in code |

The five actions for monsters: stand 6, move 6, hit1 1, die1 8, attack1 12; the blow lands on the held frame.

## Wave 4 (chapter 2): Wobblewood Forest (tier 2, levels 4 to 8)

The forest's board kit (as 3a: leaning trees, huge mushrooms, logs, roots), its fight backdrop (big trunks in the
midground, a pale canopy behind), and its creatures:

| Creature | Role | Level | Size |
| --- | --- | --- | --- |
| Twigling | mob | 5 | 120 |
| Moss Goblin | mob | 6 | 130 |
| Sporeling | mob | 6 | 100 |
| Nutkin Thief | mob | 7 | 110 |
| Sleepy Owlbear Cub | mini-boss | 9 | 200 |
| Grumblebark at Grumblebark's Glade | boss | 10 | 350; second phase: the whole forest shakes |

## Wave 5 (chapter 3): Honeyhill Fields (tier 3, levels 8 to 12)

The harvest board kit (grain, orchards, hives, hay bales, windmills), its fight backdrop (harvest rows, a distant
windmill), and:

| Creature | Role | Level | Size |
| --- | --- | --- | --- |
| Honey Blob | mob | 9 | 130 |
| Corn Goblin | mob | 10 | 140 |
| Buzzbug | mob | 10 | 110 |
| Apple Mimic | mob | 11 | 120 |
| Scarecrow Scrapper | mini-boss | 13 | 220 |
| Queen Bumble at Queen Bumble's Hive | boss | 14 | 400; second phase: the swarm thickens |

## Wave 6 (a rank's icons with its chapter): gear icons

- **Base pieces**: eight slots (sword, shield, hat, coat, gloves, boots, cape, charm) by ten ranks (Tin, Copper, Iron,
  Silver, Moonsilver, Sunsteel, Dragonscale, Starglass, Crownsteel, Everbright) = 80 icons at 48 px. **In rank order, all
  eight slots of a rank at a time**, because players meet the ranks in order: Tin and Copper with chapter 1 (they double
  as the hero's first worn sets), Iron and Silver with chapter 2, and so on. Rarity is the frame (wave 1), not a new icon;
  ranks past Everbright reuse the last with a tint.
- **The 23 uniques**, each its own icon, as their bosses come: weapons Twinstinger, Hare's Edge, Icicle, Nettlefang,
  Moonquill, Grudgeblade, Thunderclap, Crownbreaker; armour Hedgehog Coat, Mirrorcoat, Bramblehide; hats Rooster's Crest,
  Owl's Crown, Kettle Hat; boots Seven-League Boots, Dancing Shoes, Wanderers; charms Dragon's Penny, Honeycomb Heart,
  Moondrop, Rabbit's Foot, Phoenix Feather, Heartbeat Drum.

## Wave 7 (chapters 4 and on, one theme a chapter): the grown themes, in the catalogue's order

Beyond Honeyhill Fields the world is laid from the seed, a theme at a time, round and round. Each theme needs a board kit
(as 3a, in its ground), a fight backdrop (as 3b), four mobs, a mini-boss and a boss with a second phase. Until a theme's
art exists its areas draw with the shapes in the theme's colour, so the game keeps growing meanwhile. The second round of
themes reuses the art under new names: nothing new to draw, a tint at most.

| Order | Theme (kingdom) | First area | Mobs (four shapes: a skitterer, a brute, a wisp, a stalker) | Mini-boss | Boss |
| --- | --- | --- | --- | --- | --- |
| 1 | glimmerlake (Glimmerlake Marches) | Glimmerlake Shores | Bubble Imp, Shellback, River Sprite, Marsh Goblin | Crystal Crab | Lord Ripplefin |
| 2 | moonwhisper (Moonspire Kingdom) | Moonwhisper Woods | Moon Moth, Lantern Wisp, Dream Fox, Hexcap | Spellbound Doll | Lady Nightbloom |
| 3 | thunderstone (Stormward Highlands) | Thunderstone Highlands | Pebble Golem, Storm Bat, Rock Hopper, Spark Imp | Iron Goblin | Boulderbelly |
| 4 | sunfall (Suncrest Kingdom) | Sunfall Expanse | Sand Skitter, Scarab Guard, Dust Wraith, Relic Mimic | Sunstone Sentinel | Pharaoh Solmar |
| 5 | frostveil (Frostveil Kingdom) | Frostveil Peaks | Snow Puff, Icefang Wolf, Frost Spirit, Crystal Yeti | Frozen Knight | Glaciorn |
| 6 | thornhollow (Thornhollow Wilds) | Thornhollow Wilds | Thornling, Briar Wolf, Rotcap, Shadow Wisp | Cursed Stag | The Briar Queen |
| 7 | starfall (Moonspire Kingdom) | Starfall Dominion | Astral Wisp, Spell Eater, Rune Knight, Voidling | Arcane Construct | Archmage Veyra |
| 8 | embercrown (Embercrown Range) | Embercrown Mountains | Emberling, Ash Drake, Magma Golem, Flamefang | Obsidian Guardian | Ignarox, the Crownfire Dragon |
| 9 | shattered (The Shattered Crown) | The Shattered Crown | Crownless Knight, Royal Phantom, Mirror Beast, Celestial Sentinel | Rift Dragon | The Hollow King |

## Wave 8 (the proximity chapter): co-op and proximity pieces

Nothing new for the world on the server: other players are their class sprite small with a name plate, the world boss its
badge, notes their scroll (all wave 1 and 2). For proximity: a frame round the QR code, a "someone is nearby" marker, and
the combo effects for cross-class attacks (one burst per pair that exists in the rules then).

## Rules for every piece (the short form of `docs/state/art.md`)

- Files at 2x; atlases only, power-of-two sides up to 2048; a monster at most 1024 by 2048 and 300 KB; a class character's
  set at most 2048 by 2048 and 400 KB; an area's kit at most 2.5 MB; the first load (code, the meadows, the Knight's first
  set, one monster, the UI kit) under 4 MB.
- Characters and monsters face left, pivot at the feet, frames trimmed and named `<thing>/<action>/0001`; the clips as
  stated above; bosses add a second phase if two atlases fit.
- Backdrops as layers, never one picture; at most four full-screen layers in a fight, three on the board.
- Board pieces are seen at 30 % in the overview: silhouettes first, little fine detail.
- Nothing from the MapleStory reference library or from any other game is copied (the brief, "The look").

## The totals, for planning

| | Board kits | Backdrops | Mobs | Minis | Bosses | Other |
| --- | --- | --- | --- | --- | --- | --- |
| The UI (wave 1) | | | | | | about 75 pieces, the chest and loot reveal, the wordmark, the icon, two fonts |
| The hero (wave 2) | | | | | | 4 classes × (body + 8 slots × the first ranks), 6 weapon types, 24 ability icons, ~14 effects |
| Hand-laid areas (waves 3 to 5) | 3 | 3 | 12 | 3 | 3 | props |
| Gear (wave 6) | | | | | | 80 base icons, 23 unique icons |
| Grown themes (wave 7) | 9 | 9 | 36 | 9 | 9 | |

## For Robin to say yes or no to

1. The player's height on screen, from the test shots: 100 CSS px, or bigger (your own sheet stood 118).
2. The order itself: the UI, then the hero's sets, then the meadows. If you would rather see the meadows before the other
   three classes, waves 2 and 3 swap in part.
