# Chapters: the game built one part at a time, each ending in a playable alpha

Robin, 2026-11-01: "split the game and art into chapters, so that we can make sure we complete one chapter at a time;
this could also be a level range; the aim is to be able to complete one part at a time and have working versions on the
way as alphas." The chapters below are mine (Miles, GD) from what is decided: the world is areas by tier (Cloverfield
Meadows levels 1 to 4, Wobblewood Forest 4 to 8, Honeyhill Fields 8 to 12, then the grown themes four levels a tier), so
**a chapter is an area's level range, finished in game and art, ending in an alpha Robin and friends can play on their
phones**. Two chapters are systems rather than places (proximity, the real-world flavour) and sit where the brief's MVP
order puts them. A chapter is done when every line of its "done when" is true on a phone, not before; the next chapter
starts when the one before is done, except art, which may run one chapter ahead.

The art for each chapter is in `docs/art-demands.md` and the sound in `docs/sound-demands.md` (the waves carry chapter
tags); how each system stands is in
`docs/state/`; what is open is in `docs/idea-bank.md`.

## Chapter 1: Puddlewick. Cloverfield Meadows, levels 1 to 4. **Alpha 1**

The whole loop, small and finished: one area, one class with its gear visible, a UI worth looking at, chests that feel
like winning.

**Game (what exists is marked)**
- The board, the die, the choice at forks, the camera, the hints, the spots (town, shop, spring, shrine, chest, wilds,
  the boss gate): exists.
- The fight with a move and a guard, the Knight's six abilities, levels, death to Puddlewick: exists.
- Gear in eight slots, the shop, the bag, the trainer, errands, dice cards, the gamble, spawns: exists.
- Accounts and the shared world on Robin's PC (join, reconnect, two phones, notes, the world boss): exists.
- **To build**: the hero drawn from the atlas on the board and in the fight, with the worn set showing (the loader, the
  layered parts when they come); the UI layer drawing the kit instead of rectangles, **snappy and responsive** (Robin, 2026-11-01: every tap answered within a
  frame; a press squashes and pops with a tick and, on Android, a short vibration; cards and chips sparkle when chosen; bars
  tick when they move; nothing waits on a load to react); **the loot reveal** (the chest glows
  in the rarity colour, opens with a burst, the piece slides out on a card) for chests, vaults and boss drops; the level-up
  and boss-down moments; a character screen for the Knight alone (the other classes come in chapter 2; the rules keep all
  four); the tunnel set up for friends; the install page.
- **Balance**: the bots' walls for levels 1 to 6 (King Goo) run again with the eight slots and retuned.

**Art** (waves 1 to 3): the UI kit with the chest and loot reveal; the Knight's body, his Tin and Copper pieces for all
eight slots and the four weapon types; Cloverfield Meadows' board kit, fight backdrop, the Jelly Slime, Grumpy Sprout,
Meadow Bandit, Bumbling Bee, Mushroom Muncher and King Goo; the Tin and Copper gear icons; the wordmark and the icon.

**Sound** (sound waves 1 to 3): the UI set (the tap, the roll, the die landing, the steps, the chest's shimmer, burst and
ding, the level up, boss down), the fight set with the Knight's abilities, Cloverfield Meadows' board, fight, King Goo
and town themes, the meadow bed, the six creatures' voices; the audio layer in the client with mute and volumes.

**Done when**: a new player on an Android phone installs Zite, makes a Knight, plays from Puddlewick Village to King Goo
and beats him by level 5 or 6 with the real UI and art and no placeholder shape in sight; two phones see each other in
the world over the tunnel; a chest opening makes Robin smile; the frame log shows 60 fps on his phone.

## Chapter 2: Tumbletree. Wobblewood Forest, levels 4 to 8. **Alpha 2**

**Game**: the Trickster, the Wizard and the Archer drawn with their sets; the Iron and Silver pieces; the second area's
spots and the Grumblebark gate (exists in rules); the errands and trainer polished for a second town; the other players'
marks and notes drawn with the UI kit; the first balance pass over four classes against Grumblebark.

**Art** (waves 2 and 4): the three classes on the skeleton with their weapons (dagger, bow, staff); the 24 ability icons
and the fight effects; Wobblewood's kit, backdrop, Twigling, Moss Goblin, Sporeling, Nutkin Thief, the Sleepy Owlbear
Cub and Grumblebark; the Iron and Silver gear icons.

**Sound** (wave 4): the three classes' abilities and meters, Wobblewood's themes and bed, its six creatures' voices.

**Done when**: four classes play differently from level 1 to 8 with their own look, and a party of friends on four phones
clears Grumblebark together over a weekend without a crash or a stuck socket.

## Chapter 3: Goldencomb. Honeyhill Fields, levels 8 to 12. **Alpha 3 (the first beta candidate)**

**Game**: the world boss and the notes as finished features (the badge, the shared HP on screen, the share paid); the
account's recovery code and the settings as real screens; the save and the database at a version we promise to carry
forward; the spawn and cooldown feel; a first pass of the "fewer effects" switch and the frame budget on a weak phone.

**Art** (wave 5): Honeyhill's kit, backdrop, Honey Blob, Corn Goblin, Buzzbug, Apple Mimic, the Scarecrow Scrapper and
Queen Bumble; the Moonsilver and Sunsteel gear icons; the uniques' icons that have dropped so far.

**Sound** (wave 5): Honeyhill's themes and bed, its six creatures' voices, the world boss's horn and fanfare, the settings.

**Done when**: the three hand-laid areas are complete, a character goes from 1 to 12 with no placeholder, Queen Bumble
falls to a party, and the world keeps going for a week on Robin's PC without a restart.

## Chapter 4: Proximity. **Alpha 4** (the brief's MVP step 4)

**Game**: GPS as discovery (coarse cells on the server, "X is nearby"), the QR as confirmation (a one-off token, the
six-letter code to type), the link's lifetime, joining each other's fights from anywhere, the live fight room with
cross-class combos. **Art** (wave 8): the QR frame, the nearby marker, the combo bursts.

**Sound** (wave 6): the link made, the nearby ping, the combo stings.

**Done when**: two friends in the same room link up by QR and win a fight together with a combo, and two strangers in
the same café are told of each other and nothing more.

## Chapters 5 and on: the grown themes, one a chapter, four levels each

Glimmerlake Shores (12 to 16), Moonwhisper Woods (16 to 20), Thunderstone Highlands (20 to 24), Sunfall Expanse (24 to
28), Frostveil Peaks (28 to 32), Thornhollow Wilds (32 to 36), Starfall Dominion (36 to 40), Embercrown Mountains (40 to
44), The Shattered Crown (44 to 48). Each chapter: the theme's kit, backdrop, four mobs, mini-boss and boss (wave 7), its
rank's gear icons, its uniques, its three themes, bed and eighteen voices (sound wave 7), the balance walls for its levels,
and whatever the generator needs for that theme's shape. The game already lays these areas from the seed; a chapter turns the shapes into art and the numbers into felt
ones. **Done when** a party at the chapter's level clears the gate boss and the next area opens with its own look.

## The real-world flavour (the brief's MVP step 5): a chapter when Robin wants it

Weather and time of day from a free service on the server, changing which creatures roam; later real places as shrines.
Small in code; it fits after chapter 4 or in any gap.

## How a chapter runs

1. The chapter's art list goes to Mitch, AD at the chapter's start; drops land piece by piece and replace shapes.
2. The game's pieces are built in the cloud one at a time (Robin's credits), each on a branch with tests, merged here;
   anything that needs the screen is checked in the pane at phone size and on Robin's phone.
3. The alpha is a build on the tunnel that friends install; a week of play; what they say goes into the idea bank and the
   next chapter's list, or into a fix before the chapter closes.
4. A chapter closes with its "done when" true, the docs in `docs/state/` current, and a tag on main (`alpha-1`, …).
