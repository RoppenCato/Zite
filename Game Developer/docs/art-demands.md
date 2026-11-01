# Art demands: what the game needs drawn, and in what order

Miles, GD, 2026-11-01, at Robin's request. This is the Game Developer's list for the Art Director (Mitch, AD since 2026-11-01; Perry, AD before): every piece
the game as it stands needs, grouped in waves, first wave first. The budgets, the file form and how a drop is delivered
are in `docs/state/art.md`; this file says what and when. Sizes here are **CSS (design) pixels; the files are 2x**.
The order is mine; Robin changes it with a word.

**Later the same day Robin scrapped the art direction** and kept the shell (the raised-camera board, side-view fights,
kits as data, the budgets and the atlas form), so this list stands as it is; the new art session starts from the Art
Director's `CLAUDE.md` and `docs/direction.md`. The four delivered pieces are stand-ins now, nothing more.

## The order, and why

1. **What the player sees most comes first**: the board of the first area, the fight of the first area, and the UI that
   is on every screen. The board is the thing the player looks at most (the brief).
2. **One area complete before the next**: the meadows all the way (board kit, fight backdrop, its four mobs, its
   mini-boss, its boss), then Wobblewood Forest, then Honeyhill Fields, then the eight grown themes one at a time. Half an area everywhere
   looks worse than one finished area and placeholders beyond it.
3. **Characters before decorations**: the monster you fight before the bush you pass.
4. **Within the budgets, always**: a piece that does not fit is drawn smaller, not excepted (`docs/state/art.md`).

Until a piece exists, the game draws a shape in its place (a coloured circle with a letter, a flat ground colour), so
nothing waits on art to be playable; each drop replaces its shape.

## What exists (2026-11-01)

| Piece | State |
| --- | --- |
| The Knight (player class) | scrapped art (Robin, 2026-11-01); kept in `assets/warrior/` as a stand-in for the loader work |
| The Puffwort, the Honey Bumble, the Bramble Bun (meadow monsters) | scrapped art; kept in `assets/<name>/` as stand-ins |
| The Turnip Grump | not coming |
| Everything else | shapes |

**Wave 0 is mine, not the studio's**: the atlas loader; the Knight on the board (`stand` at 0.6, `move` on the walk) and in
the fight (`stand`, `attack1`, `hit1`, `die1`); the three monsters in the fight. The meadows' mobs keep their rules names (Jelly Slime, Grumpy Sprout, Meadow Bandit, Bumbling Bee) until the new art
names them; the stand-ins wear those names meanwhile.

## Wave 1: the meadows, complete (the first minutes of the game)

### 1a. The meadows' board kit

The board is seen from a raised camera in 2D (the brief, "The look"): a tilted ground with cliff faces where the land
steps up, roads flat on it, everything standing on it upright. Cloverfield Meadows is one cell of 1400 by 1900 world pixels
with 60 spots; the ground is tiles and strips, never one picture.

| Piece | Count | Size | Notes |
| --- | --- | --- | --- |
| Ground tiles (grass) and edge pieces (the cliff faces where land steps, the shore of nothing at the map's edge) | a small tile set | tiles 128 | tileable; the board is drawn at 0.8 and seen whole at 0.3, so broad shapes |
| Road pieces (straight, bend, fork, end) | 4 to 6 | 64 wide | laid along the links between spots |
| Spot markers, one per kind: wild (`normal`), town, shop, chest, spring (`potion`), shrine (`spell`), boss spot (the passage gate) | 7 | wild 56; town and shop 90; the gate 120 | the player stands on them; strong silhouettes, readable at 30 % |
| The closed-area cover (fog or cloud) | 1 tile | 256 | tiled over areas not yet open, 70 % dark today |
| Badges over a spot: mini-boss (!), merchant ($), world boss (W), a note left (a small scroll) | 4 | 40; the world boss 56 | bob above the spot |
| The name plate for another player's mark, and the area's name banner | 2 | plate 120 by 28; banner 400 by 60 | text drawn by the game |
| Horizon strips behind the board (sky and far hills) | 2 | 2048 by 1024 at 2x | optional, after the rest |

### 1b. The meadows' fight backdrop

Layers, not one picture: the sky is a gradient drawn by code; then **two or three strips of at most 2048 by 1024 (2x)**
that tile or stretch (far hills, near trees, the ground the fighters stand on). One backdrop for the meadows now;
variants (a spring, a road, the town's gate) later if there is appetite.

### 1c. The meadows' creatures

| Creature | Role | Level | Size | State |
| --- | --- | --- | --- | --- |
| Jelly Slime (the name follows the art) | mob | 1 | 120 | **needed**; a stand-in exists |
| Grumpy Sprout | mob | 2 | 140 | **needed**; a stand-in exists |
| Meadow Bandit | mob | 3 | 110 | **needed** |
| Bumbling Bee (flies, drains mana) | mob | 3 | 120 | **needed**; a stand-in exists |
| **The meadows' mini-boss** (the rules call it Mushroom Muncher; the name follows the art) | mini | 5 | 180 to 200 | **needed** |
| **The King Goo** at the King Goo's Gate | boss | 6 | 300 to 400 | **needed**; a second phase under half HP (its bark splits): a second `stand` (6) and `attack1` (12) if a second atlas fits, else a tint done in code |

The five actions as delivered (stand 6, move 6, hit1 1, die1 8, attack1 12); the blow lands on the held frame.

### 1d. The UI kit (on every screen)

One atlas, drawn once, used everywhere. Sizes in design pixels.

| Piece | Count | Size |
| --- | --- | --- |
| Panel and card backgrounds (the HUD band, the message box, a class card, a shop row, a bag row, an atlas row), nine-slice | 3 styles | 9-slice, 16 px corners |
| Buttons in three states (idle, pressed, dim), two sizes | 2 × 3 | 220 by 66 and 80 by 50, 9-slice |
| The die: six faces and a rolling blur | 7 | 56 |
| HP and MP bars (frame and fill), the class meter dots (empty, full) | 4 | bar 160 by 14; dot 12 |
| Chips (the row under the board: dice cards, an errand, a level's pick, a note) in two states | 2 | 9-slice, 40 tall |
| Spot-kind icons (the seven kinds), also used in hints and the atlas | 7 | 32 |
| Item icons: potion, mana potion, the four dice cards (Do-Over, +1, −1, Fairy Pick), a gold coin, a key | 8 | 40 |
| Gear slot icons for an empty slot (weapon, armour, helm, boots, trinket) | 5 | 40 |
| Rarity frames round an icon (common, uncommon, rare, epic, legendary) and the orange unique frame | 6 | 48 |
| Small marks: a lock (a vault, a closed area), a clock (a cooldown), a star (xp), a heart, a drop of mana, an online dot | 6 | 24 |

### 1e. The title and the app

The **Zite** wordmark for the character screen and the install page; the **app icon** (512 and 192, the 512 also
maskable: keep the subject in the middle 80 %); a backdrop for the character screen (the meadows at dusk, one picture of
at most 824 by 1830 at 2x, or the board kit's strips reused). The placeholder icons are `client/public/pwa-*.png`.

## Wave 2: the other three classes, their abilities, the fight's effects

- **The Trickster, the Wizard, the Archer** on the Warrior's rig: 25 frames each (stand 4, move 6, attack1 6, hit1 1, die1 6),
  all four the same height (to be reconfirmed with Robin: 100 CSS px was the old number, his own sheet
  stood 118), facing left, at most 400 KB each. Their standing frame is the class card's picture; no separate portraits
  (mine). **Gear shows on the character** (Robin, 2026-11-01: "Visible equipment progression is extremely important for
  this game. Players must be able to wear different armor sets, helmets, gloves, boots, and capes, and wield different
  weapons and shields. All of these must remain visible during animation."). The studio's way (Mitch, AD): one skeleton a
  class with slots (head, torso, hips, boots, hands, back, near arm, far arm, weapon, off-hand); the whole figure with its
  worn set is rendered into the same atlas form as today, so the loader does not change for the first drops; which sets
  exist and when they are rendered is Robin's to decide once he has judged the studio's test. What the game must then
  do: pick the atlas for the class and the worn set (or draw the slots as layers on one skeleton, if the drops come that
  way); the gear data gains a look per piece. Not built yet.
- **Ability icons**, 24, 40 px, one atlas, in this order: Knight (Mighty Swing, Shield Bonk, Battle Hymn, Finishing Flourish, Second Wind, Shield
  Wall), Trickster (Sneak Jab, Nettle Knife, Vanishing Act, Puff of Smoke, Sticky Fingers, Grand Finale), Wizard (Firework, Snowball Hex, Arcane
  Shield, Pocket Watch, Falling Star, Moonlight Veil), Archer (Triple Shot, Bullseye, Net Toss, Tripwire, Owl Friend, Painted Target).
- **Fight effects**, small strips of 4 to 6 frames at 64 to 128 px, one atlas: hit spark, crit burst, block shield, dodge
  whoosh, counter flash, charge glow, poison drip, chill, burn, weaken, heal glow, mana sparkle, the wind-up tell over an
  enemy's head, a level-up burst.

## Wave 3: Wobblewood Forest (tier 2, levels 4 to 8)

The forest's board kit (as 1a, forest ground and trees instead of grass), its fight backdrop (as 1b), and its creatures:

| Creature | Role | Level | Size |
| --- | --- | --- | --- |
| Twigling | mob | 5 | 120 |
| Moss Goblin | mob | 6 | 200 |
| Sporeling | mob | 6 | 110 |
| Nutkin Thief | mob | 7 | 140 |
| Sleepy Owlbear Cub | mini | 9 | 200 |
| The Grumblebark at the Grumblebark's Glade | boss | 10 | 350; second phase: it regrows |

## Wave 4: Honeyhill Fields (tier 3, levels 8 to 12)

The harvest board kit (grain, orchards, hives, hay bales, windmills), its fight backdrop, and:

| Creature | Role | Level | Size |
| --- | --- | --- | --- |
| Honey Blob | mob | 9 | 130 |
| Corn Goblin | mob | 10 | 200 |
| Buzzbug | mob | 10 | 110 |
| Apple Mimic | mob | 11 | 220 |
| Scarecrow Scrapper | mini | 13 | 240 |
| The Queen Bumble at Queen Bumble's Hive | boss | 14 | 400; second phase: its heart freezes over |

## Wave 5: gear icons

- **Base pieces**: five slots (sword, mail, helm, boots, amulet) by ten ranks (Tin, Copper, Iron, Silver, Moonsilver, Sunsteel,
  Dragonscale, Starglass, Crownsteel, Everbright) = 50 icons at 48 px. **In rank order, all five slots of a rank at a time**,
  because players meet the ranks in order: Tin and Copper first. Rarity is the frame (wave 1d), not a new icon; ranks past
  Everbright reuse the last with a tint.
- **The 23 uniques**, each its own icon, as they are met (bosses drop them): weapons Twinstinger, Hare's Edge, Icicle,
  Nettlefang, Moonquill, Grudgeblade, Thunderclap, Crownbreaker; armour Hedgehog Coat, Mirrorcoat, Bramblehide; helms Rooster's Crest,
  Owl's Crown, Kettle Hat; boots Seven-League Boots, Dancing Shoes, Wanderers; trinkets Dragon's Penny, Honeycomb Heart, Moondrop, Rabbit's
  Foot, Phoenix Feather, Heartbeat Drum.

## Wave 6: the grown themes, one at a time, in the generator's order

Beyond Honeyhill Fields the world is laid from the seed, a theme at a time, round and round. Each theme needs a board kit (as
1a, in its ground), a fight backdrop (as 1b), four mobs, a mini-boss and a boss with a second phase. Until a theme's art
exists its areas draw with the shapes in the theme's colour, so the game keeps growing meanwhile. The second round of
themes (Ashen Reach after Glimmerlake Shores, …) reuses the art under new names: nothing new to draw, a tint at most.

| Order | Theme (kingdom) | First area | Mobs (four shapes: a skitterer, a brute, a wisp, a stalker) | Mini-boss | Boss |
| --- | --- | --- | --- | --- | --- |
| 1 | glimmerlake (Glimmerlake Marches) | Glimmerlake Shores | Bubble Imp, Shellback, River Sprite, Marsh Goblin | Crystal Crab | Lord Ripplefin |
| 2 | moonwhisper (Moonspire Kingdom) | Moonwhisper Woods | Moon Moth, Lantern Wisp, Dream Fox, Hexcap | Spellbound Doll | Lady Nightbloom |
| 3 | thunderstone (Stormward Highlands) | Thunderstone Highlands | Pebble Golem, Storm Bat, Rock Hopper, Spark Imp | Copper Goblin | Boulderbelly |
| 4 | sunfall (Suncrest Kingdom) | Sunfall Expanse | Sand Skitter, Scarab Guard, Dust Wraith, Relic Mimic | Sunstone Sentinel | Pharaoh Solmar |
| 5 | frostveil (Frostveil Kingdom) | Frostveil Peaks | Snow Puff, Icefang Wolf, Frost Spirit, Crystal Corn Goblin | Frozen Knight | Glaciorn |
| 6 | thornhollow (Thornhollow Wilds) | Thornhollow Wilds | Thornling, Briar Wolf, Rotcap, Shadow Wisp | Cursed Stag | The Briar Queen |
| 7 | starfall (Moonspire Kingdom) | Starfall Dominion | Astral Wisp, Spell Eater, Rune Knight, Voidling | Arcane Construct | Archmage Veyra |
| 8 | embercrown (Embercrown Range) | Embercrown Mountains | Emberling, Ash Drake, Magma Golem, Flamefang | Obsidian Guardian | Ignarox, the Crownfire Dragon |
| 9 | shattered (The Shattered Crown) | The Shattered Crown | Acorncap Knight, Royal Phantom, Mirror Beast, Celestial Sentinel | Rift Dragon | The Hollow King |

Each theme's creatures, mini-boss and boss are the catalogue's, in `rules/data/themes.json`.

## Wave 7: co-op and proximity pieces (when those systems exist)

Nothing new for the world on the server: other players are their class sprite small with a name plate (1a, 2), the
world boss its badge (1a), notes their scroll (1a). For MVP step 4 (proximity): a frame round the QR code, a "someone is
nearby" marker, and the combo effects for cross-class attacks (one burst per pair that exists in the rules then).

## Rules for every piece (the short form of `docs/state/art.md`)

- Files at 2x; atlases only, power-of-two sides up to 2048; a monster or a class at most 1024 by 2048 and 300 to 400 KB;
  an area's kit at most 2.5 MB; the first load (code, the meadows, the Knight, one monster, the icons) under 4 MB.
- Characters and monsters face left, pivot at the feet, frames trimmed and named `<thing>/<action>/0001`; the five
  actions for monsters, the five for classes, as delivered; bosses add a second phase if two atlases fit.
- Backdrops as layers, never one picture; at most four full-screen layers in a fight, three on the board.
- Board pieces are seen at 30 % in the overview: silhouettes first, little fine detail.
- Nothing from the MapleStory reference library is copied (the brief, "The look"); we learn from it and draw our own.
- A drop is a whole folder in the Art Director's `out/<name>/` with NOTES.md (what, actions and rates, pivots, sources);
  I copy it into `assets/` and wire it in; the game's shapes give way piece by piece.

## The totals, for planning

| | Board kits | Backdrops | Mobs | Minis | Bosses | Other |
| --- | --- | --- | --- | --- | --- | --- |
| Hand-laid areas (waves 1, 3, 4) | 3 | 3 | 12 (4 delivered or held) | 3 | 3 | the UI kit, the title, the icon |
| Classes and the fight (wave 2) | | | | | | 3 classes, 24 ability icons, ~14 effects |
| Gear (wave 5) | | | | | | 50 base icons, 23 unique icons |
| Grown themes (wave 6) | 8 | 8 | 32 | 8 | 8 | |

About 70 monsters in all at 300 KB each is 21 MB over the whole game, loaded an area at a time, never together.

## For Robin to say yes or no to

1. The player's height on screen: 100 CSS px, or bigger (your own sheet stood 118).
2. The gear slots on the character: today the rules have weapon, armour, helm, boots and trinket; Robin's words of
   2026-11-01 add gloves, capes and shields. Adding them to the rules (gear, shop, bag, stats) is a decision for Robin.
3. The order itself: the meadows complete, then the UI, then the other classes, then the next areas. If you would rather
   see the four classes before the meadows' boss, say so and waves 1c and 2 swap.
