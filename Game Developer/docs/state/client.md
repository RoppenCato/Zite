# The client (`client/`)

Phaser 4.2.1 with TypeScript and Vite 8, built as a PWA with `vite-plugin-pwa` 2. The scenes: the **character screen**
the first time (a name and a class), then the **board** (the world in areas, drawn in world pixels under a camera that
follows the character), the **HUD** over it (the fixed chrome, which never scrolls or zooms), and the **fight**, the
**shop**, the **bag**, the **atlas** and the **loot reveal**, each launched over both when it begins and stopped when it ends. Shapes and labels only; the Art
Director's sprites come later. The client never decides anything: it sends intents to the holder of the state and plays
back the events. **Two holders** behind one interface (`GameHolder`, `src/game-holder.ts`): `LocalGame` (solo: the state
and the dice in the browser, saved to storage) and `RemoteGame` (co-op: the server holds the state; the page was opened
once with `?server=wss://…`, `docs/state/protocol.md`). The scenes cannot tell them apart: `act` answers as a promise in
both, and a scene waits the same way whether the die rolls here or on Robin's PC.

| File | What it does |
| --- | --- |
| `index.html` | the page: viewport for phones, dark background, the `#game` box the canvas fills, `touch-action: none` |
| `src/main.ts` | makes the log; reads the server address (`?server=`, remembered) and the device's account; starts Phaser on the board (a local save), the connect screen (an account on the server), or the character screen; ticks the world; exposes `window.boardWorld` |
| `src/game-holder.ts` | `GameHolder`: what the scenes need from whatever holds the state (`state`, `me`, `act`, `tick`, `reset`, `now`, `link`, `recovery`, `onlinePlayers`, `onSpawns`, `onChange`) |
| `src/remote-game.ts` | co-op: the socket, join with the token (or a new character, or a code), the snapshot, intents one at a time with the pending one resent after a reconnect, deltas folded in, pings and reconnects, the server's clock; `serverUrl`, `storedAccount` |
| `src/layout.ts` | the design size (412 by 915), the HUD's height (100) and the world band's (640), the colours (the themes', the rarities'), the font |
| `src/ui.ts` | `makeButton` and the `Bar` (HP, mana), shared by the scenes |
| `src/local-game.ts` | solo play: holds the state and the random stream, applies actions through the rules with the browser's clock, ticks, saves; `actNow` for scripts |
| `src/game-log.ts` | the frame log and error log, downloadable |
| `src/scenes/CreateScene.ts` | the character screen: the name field, the four class cards, Begin (the local save, or an account on the server), "I have a code from another phone" in co-op; starts the board |
| `src/scenes/ConnectScene.ts` | co-op, with an account on this phone: "connecting…", tries again on its own, Play offline for now, Start over when the account is gone |
| `src/scenes/play.ts` | `playScenes(game, log)`: the board, HUD, fight, shop, bag, atlas and reveal scenes made together |
| `src/scenes/RevealScene.ts` | the loot reveal: the chest glows in the colour of its best prize, opens, bursts, and gives each prize on a card; a tap or a wait moves on; `REVEAL_LAYOUT` |
| `src/loot.ts` | loads Mitch, AD's chest, glow, card and particle sheets; `prizesIn` and `gearIn` (what a landing's or a fight's events put on cards), `tierOf`, `cardWords` |
| `src/audio.ts` | the sounds: Nigel, SD's audio sprites loaded with the board, `audio.play(name)` (a family such as `ui/die-land` picks a variant; a name no sprite holds is silent), `audio.loop`, the sound setting and `?mute=1` |
| `src/scenes/MomentScene.ts` | the banners over everything: `levelUp`, `bossDown`, `opened`; queued; no input; `moments(scene)` reaches it |
| `src/clips.ts` | the studios' atlas form: `ensureClips` turns an atlas's `actions` block into animations keyed `<atlas>/<action>` with each frame's delay |
| `src/scenes/BoardScene.ts` | the world, the token, the other players' marks, the camera, the touch input, hints, culling; `roll`, `toggleMap`, `openAtlas`, `openBag`, `downloadLog`, `useCard`, `answerGamble`; `send` (one intent at a time), `onWorldChange` |
| `src/scenes/AtlasScene.ts` | the world as a list: the areas by tier, bosses, kills, errands, where you are; Go frames one; the settings behind a button |
| `src/tips.ts` | the first minutes: a few lines said once (the start, the first choice, fight, win and boss), kept in storage |
| `src/settings.ts` | sound, fewer effects, larger text, vibration; kept in storage; `ms()` and `font()` for the scenes |
| `src/scenes/HudScene.ts` | the top panel (with the link line under the die: solo, online · n here, reconnecting), the chip row, the message line, Map, World, Bag, Log and Roll; `setStats`, `setDie`, `setMessage`, `setBusy`, `setFollowing`, `setChips`, `setLink` |
| `src/scenes/FightScene.ts` | the fight, side on: the area's backdrop, the hero at the left, the enemy at the right as the Art Director's figure or a circle, bars over each, the tell over the enemy, the words and buttons on the strip under the ground; two taps a round, the events played back a beat apart with a blow landing on its frame; `FIGHT_LAYOUT`, `FIGHT_BUTTONS` |
| `src/backdrop.ts` | the fight backdrops by theme: a code sky, the Art Director's strips as tiling sprites with scroll factors, the soil; `Backdrop`, `preloadBackdrops` |
| `src/creatures.ts` | the creatures' atlases by enemy id (the Jelly Slime so far); `Figure` plays a creature's clips, `blowMs` says when its blow lands; `preloadCreatures` |
| `src/scenes/ShopScene.ts` | the shop: Buy (gear by rank, potions, cards) and Sell, and in a town Train (the class's abilities from the trainer); Leave |
| `src/scenes/BagScene.ts` | the bag: what is worn, what is carried, the numbers, flasks and cards; Wear, Take off, Drop, Close |
| `public/icon.svg`, `public/pwa-*.png` | the icon placeholders (`npm run icons` remakes the PNGs from `tools/make-icons.mjs`) |

## Size and scaling (mine, 2026-10-31)

The design size is **412 by 915 CSS pixels, portrait**, an ordinary Android phone. Phaser's `Scale.FIT` with
`CENTER_BOTH` scales the whole canvas to fit whatever screen it gets and centres it; nothing is laid out per device. Judge it
in the browser pane's mobile preset (375 by 812), where the canvas comes out at 0.89 scale.

Layout at design size: the HUD panel in the top 100 pixels (name and class; `Lv 2 · HP 41/132 · MP 10/22 · Gold 127`;
the area and the spot; the die box at the right); **the world band from y 100 to 740**, the main camera's viewport; a
dark strip below it with the row of chips at y 754 (empty most of the time), the message line at y 776, the Map, Bag and
Log buttons (112 by 36 at y 836, x 72, 206 and 340) and the Roll button (300 by 52 at y 884).

## The character screen (mine, 2026-10-31: first layout; Robin, 2026-10-31: the class is chosen at creation)

Shown when there is no save (solo) or no account on this phone (co-op). "Zite" at the top and where the world is under it
("solo play on this phone" or "the world at wss://…"); **a name field** (a real `<input>` through Phaser's DOM container,
300 by 44 at y 180, at most 12 characters, "Robin" to start, so the phone's keyboard comes up); **four cards** (340 by
104, centred at y 304, 420, 536 and 652) with each class's name, its style line (in `classes.json`), its HP, mana,
attack and defense and its two starting abilities; the chosen card is lit with a yellow border; **Begin** (220 by 66 at
y 812) makes the game (`LocalGame.create`, or the account on the server through `RemoteGame.connect`; a status line at
y 752 says "Making your character…" or why it could not), adds the play scenes and starts the board. An empty name
becomes "Robin". In co-op a small button under Begin (y 872), **"I have a code from another phone"**, asks for the
recovery code and brings that character to this phone. The pane can call `choose(classId)`, `begin()` and
`recoverWithCode()` on the scene.

## The connect screen (mine, 2026-11-01)

Shown in co-op when this phone has an account (or a code left by the settings): "Connecting to the world at …", a status
line that counts the tries (1, 2, 4, 8, then 15 s apart, forever), **Play offline for now** (the local save, or a local
character screen) and, when the server says the account is unknown, **Start over** (forgets the token and shows the
character screen for the world). The board starts the moment the snapshot is in.

## The scenes of play and the HUD

The board scene starts first, draws the world and **launches the HUD** at the end of its `create`. The HUD's `create`
draws the chrome and calls `board.hudReady(hud)`; only then does the board push its first message, or take up again what
the page was closed in the middle of: a fight, the gambler's question, a pending roll. The HUD's buttons call the board's
public methods (`roll`, `toggleMap`, `openBag`, `downloadLog`); the board tells the HUD what to show. Phaser dispatches
input to the top scene first and stops there when it hit something, so a tap on a button never reaches the world; a
touch on the HUD's panel or strip is ignored by the board. The fight, shop and bag scenes each cover the band with an
opaque panel that takes every touch, the reveal with a dark veil, and they call the board back when they close (`fightOver`,
`shopLeft`, `bagClosed`, `revealClosed`).

## The board scene

- **The world**: each area's ground in its theme's colour (meadow, forest, ice), its name written large and faint, a thin
  border round the map. **A closed area is covered** by a dark rectangle (you see there is more, not what); the cover
  lifts when a boss opens it. **Links** are 6-pixel lines in one `Graphics`. **The world grows**: `drawBoard` draws
  whatever the board has that is not drawn yet (at the start everything; after a fight that laid a grown area, that
  area's ground, name, roads, spots, boss label and cover), redraws the border and widens the camera's bounds and its
  minimum zoom; the eight grown themes have their own ground colours (`THEME_COLORS`). **Culling** (mine, 2026-11-01):
  every frame the camera has moved, each spot's circle, letter and names are shown only inside the view and a margin
  of 120, the names also under their zoom rule; rings and the token are never hidden. A vault shows a V.
- **Spots**: circles in a colour per kind with a letter (town T, shop $, chest C, spring +, shrine *, boss B); the wilds
  are smaller (radius 20) and bare, the others radius 26; **a boss spot is big (radius 34), dark red, named, with its
  boss's level under it**, and dims with a countdown while the boss is away. Hubs show their names (bold 13 px) below
  zoom 0.45 hidden. **Whatever has spawned** bobs as a badge above its spot: a red "!" for a mini-boss, a yellow "$" for a
  merchant; **a world boss as a big purple W with its HP written above it**, for everyone to see shrink; redrawn
  whenever the spawns change (`onSpawns`) and after a fight. **A spot with notes** carries a small pale mark to its left
  (a quote mark, or how many). A clock once a second refreshes the boss labels.
- **The token** is a container (a circle of radius 15 with the class's first letter) just above its spot. **The other
  players** (co-op) stand as smaller marks (radius 12, the class letter, the name under it) to the right of their spot,
  fanned when several share one, full when online and dim when not; they glide when their player moves. The place line
  says "with Bo" when someone shares your spot, a tapped spot says who is there, and a line in the message tells of a
  newcomer, an area opened, a boss beaten, a level reached or a fall by someone else.
- **A tap on any spot** that is not lit says what it is (`hintFor`, the notes left there last) in the message line and
  flashes its ring; a tap on the shop or town you stand on opens the shop again; **a tap on the spot you stand on**
  (any other kind, the board free) adds "Leave a note here?" and the four notes as chips; the one tapped is left
  (`trace`), the spot gets its mark, and the others hear of it. The tap that closes the fight, the shop or the bag never also
  counts on the spot under the button (a quarter-second guard), so Continue over a spot keeps the fight's summary.
- **Questions in the chip row**: the gambler's (High, Low, Walk on); **a town's errand** (Take it, Not now; the message
  says what it asks and pays); **a piece with no room in the bag** (Sell for n, Leave it); and **a level's pick of one
  ability in two** (the two names as chips, the message saying what each does; the one tapped is learned, `pick`),
  asked after the fight that owed it and whenever the board is free. **A Rabbit's Foot** worn adds a Charm chip to a
  pending roll (a re-roll; the chip shows the wait while it is spent).
- **Every intent goes through `send`**: one at a time (`inFlight`), the scene going on when the promise answers; no
  answer (the socket between two lives) says "No answer from the world. Try again." and `resume` takes up whatever the
  state is in the middle of. **`onWorldChange`** (the holder's `onChange`) redraws the others, the board when it grew,
  the spawns, the HUD and the link line, and after a snapshot puts the token where the state says.
- **Roll** calls `game.act({ type: 'roll' })`, shows the value in the die box with a small pulse, then asks the rules
  where the roll can end inside the open areas (`reachable` with `opened`). **One place and no dice card in the bag: the
  token walks at once. Otherwise those spots light up** (a pulsing yellow ring, radius 42), the camera frames them, the
  chip row shows the dice cards held, and the message says "Tap a lit spot to walk there". A chip sends `use`; on the
  `steps` event the die shows the new number and the choices are offered again (Fairy Pick first turns the row into the
  numbers and a way back). The tap area of a spot is a circle of radius 38, for thumbs. Tapping an unlit spot while
  choosing says "Not N steps away"; tapping Roll says "Tap a lit spot first".
- **The tap** calls `game.act({ type: 'move', path })` at once, clears the rings, and only then walks the token: a tween
  chain, 260 ms per step, the camera following. The state is ahead of the picture during the walk, as it will be with a
  server: the picture is playback. Then what the landing brought: the message says it ("Rolled 4. Landed in the wilds."
  / "Landed on Slime Cave (chest). A chest! +23 gold. Found Tiptoes, copper boots · epic · +4 defense …" / "Rested: HP
  and mana full." / "Empty for now; again in 4:59." / "Learned war cry, rank 1."); a fight opens the fight scene; a shop,
  a town or a merchant opens the shop scene; the gambler's offer puts **High, Low, Walk on** in the chip row with the
  question in the message line, and the answer's result finishes the turn. While choosing, walking, fighting or shopping
  the Roll button is dimmed.
- **A page closed mid-choice** opens with the same choice lit and framed again; **mid-fight** on the fight; **mid-question**
  with the gambler's chips again.
- A refusal shows as "Not allowed: <reason>." in the message line. A hidden tab or a hidden browser pane pauses Phaser,
  so a walk finishes when the page is shown again; the state is already saved by then.

## The camera (mine, 2026-10-31: numbers to start with)

- The main camera's viewport is the band (`setViewport(0, 100, 412, 640)`), its bounds the whole map
  (`setBounds(0, 0, board.width, board.height)`, so the covered areas can be looked at), `roundPixels` on.
- **Follow zoom 0.8**; **minimum zoom** such that **everything open** fits the band (the meadows alone: about 0.37; all
  three hand-laid areas: about 0.15, never under 0.12; a world grown wider than 0.12 fits may pull back as far as 0.05,
  where the areas read as patches of colour); **maximum 1.4**. The camera starts following the token at the follow zoom
  (`startFollow(token, true, 0.12, 0.12)`).
- **A roll with more than one place to go frames the token and every lit spot**: their box plus 80 pixels of padding, the
  zoom clamped between the minimum and the follow zoom, `pan` and `zoomTo` over 350 ms, following stopped. **After the
  tap** the camera zooms back to the follow zoom and follows the token through the walk, gliding from where it was.
- **Drag pans** once a finger has moved more than 8 design pixels (following stops; the scroll moves by the finger's
  travel divided by the zoom). A spot is tapped on `pointerup` only when `pointer.getDistance()` is under 10, so a drag
  that ends on a spot is not a tap. **Pinch zooms** with two fingers; a **mouse wheel** zooms by 10 percent a notch.
- **The World button** opens the atlas (`AtlasScene`): the areas by tier with a swatch of their colour, the open ones
  bright, "you are here", the levels, the boss and your kills, your errand there, or what opens a closed one; **Go**
  frames the area on the board; **Settings** turns the list into three toggles (sound, effects full or fewer, text
  normal or large), kept in `localStorage['boardworld.settings']`, then **World** (solo, or online at the server with
  how many are here, or trying to reach it; **Join…** or **Server…** asks for an address and reloads with `?server=`),
  **Account** in co-op (the recovery code to write down; **Use a code…** brings another character to this phone) and
  **Start over** (the save, or this phone's token, thrown away after a confirm); Close. Fewer effects make the camera
  and the bars jump and the blows not flash; large text takes from the next screen on.
- **The first minutes** (`tips.ts`): the start ("Welcome to Zite…"), the first roll with a choice, the first fight,
  the first win and the first boss tapped each add a line once, kept in `localStorage['boardworld.tips']` and forgotten
  on reset.
- **The Map button** frames everything open (following stopped) and reads "Back" whenever the camera is not following
  the token; Back returns to the follow zoom and follows the token again.
- Nothing reads the canvas back and nothing filters per frame; the per-frame work is the frame log and the zoom check.

## The fight scene (Robin, 2026-10-31: a turn-based RPG with a defensive choice, one thumb; layout and pacing mine)

**Side on since 2026-11-01 (chapter 1, step 4), on Mitch, AD's first pieces.** The screen covers the band and the HUD's
strip (the HUD's own buttons wait under it). The ground line is at y 540 (`FIGHT_LAYOUT`); the area's backdrop
(`backdrop.ts`, by the theme of the fight's space) is a code sky gradient from the band's top to the ground line, then
the Art Director's strips as tiling sprites placed by their bottoms against the ground line with his scroll factors
(far 0.15, the tree line 0.45, the hedge 0.8, the ground 1), the far strip drifting 2 px a second, and the soil colour
under the ground band down to y 720; a theme with no strips yet gets the sky and plain soil. The fighters' feet stand 14
px below the ground strip's top: the hero at x 112 at 150 CSS px facing right, the enemy at x 300, the Art Director's
figure (`creatures.ts`, by the enemy's id, the Jelly Slime at 120) or the old circle with a letter until its art
comes. Contact shadows under both. Over each figure its bars (the hero's HP and MP with the status line above; the
enemy's HP with its tell and status above, in white with a dark stroke so they read on the sky); the title (name, level,
role) at the top with the two history lines under it. The strip from y 720 holds the message, the prompt and the three
rows of buttons (`FIGHT_BUTTONS`, at y 800, 842, 884; Continue at 842).

**Blows on their frames**: a hit by the player plays the hero's attack1 and waits `Hero.blowMs()` (the fourth frame, 201
ms) before the enemy's hit1, the flash, the floating number and the bar; a hit by the enemy plays its attack1 and waits
`Figure.blowMs()` (the slime's seventh frame, 418 ms) before the hero's hit1 and the rest; a counter the same as a hit by
the player; a crit shakes the camera a touch; a win plays the enemy's die1 (its last frames fading); a wind-up held tints
a figure red. Fewer effects: no waits, no shakes, no blinks.


An opaque panel over the band; the HUD stays above. From the top: the enemy's name, level and role, its HP bar (260 by
18, red), the enemy as a circle of radius 56 with its initial, a status line in orange that **leads with what it will do
next** ("next: Venom Bite (poison)", "next: it winds up Smash", "next: Smash lands, hard. Block it!"; then stunned,
poisoned, weakened, hardened, fading, raging); the message line; the character as a circle of radius 26, its HP bar
(green) and mana bar (blue), a status line in teal that **leads with the class meter as dots** ("Valor ●●○○○"; then
charged, hits harder, barrier, evading, sure crit, marked, hawk, meteor in n, trap set, time bent, poisoned, weakened); a
prompt that counts the rounds. The two lines said before the message stay above it, dimmer: a round reads as a short
log; the enemy rings red while it holds a wind-up. **A round is two taps.** First the move, in two rows of two and a
third row: **Attack**, **Abilities** (then the known abilities with their mana and meter costs, dimmed when mana or meter
is short or the once-a-fight one is used, and Back), **Charge** ("Charged" while held), **Honey Tonic ×n** (dimmed with
none), **Flee**, **Moon Dew ×n**. Then the guard:
**Block (half)**, **Dodge (luck)**, **Brace (+mana)**, **Counter (hit back)**, and Back. The round is one intent
(`game.act({ type: 'fight', move, guard })`) and its events are **played back one at a time, 450 ms apart**: a hit
flashes the one struck and floats the damage up (bigger and yellow on a crit), the bars tween, the message says the blow,
the miss, the wind-up, the stun (or a boss shrugging it off), the poison on either side, the counter, the drink, the
loot, the level, the boss falling, the area opening, and the new things: the boss's second phase in its own words, time
bending, a trap springing, gold lifted, the enemy healing or draining mana, a Phoenix catching a fall, Kettle Hat turning a
crit aside. On `won`, `died` or a lucky `fled` the rows give way to **Continue**, which hands the board a one-line summary.
**A world boss** says "world boss" in the header and what a shared fight is in the first line; its bar follows the HP in
the spawn when others hit it (`refreshFromState`, called by the board on every change to the player or the spawns); when
someone else brings it down the screen says so with this player's share and ends as a win; when it leaves, "is gone".

## The shop scene (mine, 2026-10-31)

The shop's name (or "Wandering Merchant") and your gold at the top; two sides, **Buy** and **Sell**, and in a town a
third, **Train** (the three tabs then share the row at x 96, 206 and 316). Buy lists the plain piece of the area's rank
for each of the eight slots with its number and price, then the potion, the mana potion and the four dice cards with
their text and how many you hold; a Buy button each (80 by 32 at x 356, eleven rows from y 222, 40 apart). Sell lists
the gear in the bag with its rarity colour and half its worth, and how full the bag is. Train lists the class's six
abilities with rank, text and costs, and a **Learn** or **Rank up** button at the trainer's price (greyed at the top
rank). The message line says what happened; **Leave** (220 by 50 at y 706) calls the board's `shopLeft`. The HUD's gold
follows every buy.

## The bag scene (mine, 2026-10-31)

"Bag" and the numbers with everything on (attack, defense, HP, mana, crit, dodge, lifesteal, thorns); **Worn**: the five
slots, each with its piece in its rarity colour (or "nothing") and a **Take off** button; **Carried n of 12**: up to
six pieces shown with **Wear** and **Drop**; the flasks and cards at the bottom; **Close** at the top right. Opened from the HUD's Bag
button, not while a fight or the shop is up.

## The hero on screen (`hero.ts`, 2026-11-01)

`client/src/hero.ts` loads the hero's sets (`assets/hero/<set>/hero_<set>.png` and `.json`, imported through Vite so the build
carries them), makes a Phaser animation per clip from the atlas's `actions` block (each frame's own delay; `stand` and
`move` loop), and the class `Hero` plays them on a sprite whose x, y is the feet (the frames carry a pivot at the feet, which
Phaser applies on every frame change). The files face left; `face(true)` flips. `heroSetFor(character)` picks the set: a
coat worn shows `plate`, otherwise `tunic` (mine, for the test); `refreshHud` swaps the set when the wardrobe changes.

## The loot reveal (`RevealScene.ts`, chapter 1 step 2, 2026-11-01)

Robin, 2026-11-01: "a nice interface for when you find a chest. With it glowing in different rarity colors, and a nice
animation when opening. The aim is dopamine hits." Built on Mitch, AD's pieces (`assets/loot/`, `docs/state/art.md`).

- **When**: every chest (its gold, its gear, its flask or card, each on a card, in that order; `prizesIn`), gear found
  without a chest (the wilds, an errand), and a fight's drop after Continue (`FightOutcome.loot`, collected from the
  fight's `loot` and `bagFull` events). Gold and flasks from anything but a chest stay in the message line. The board's
  `reveal(prizes, title, then)` launches the scene and runs `then` (the message, the shop, a question) when it closes;
  nothing to show, or the art not loaded, runs `then` at once. The board is busy meanwhile; the Bag and World buttons wait.
- **The moments** (timings mine): the veil (0.88) in 150 ms; the glow builds for 750 ms under the shut chest, which stirs
  in the last 300; the lid goes up (Mitch, AD's clip, 60 ms a frame); on `chest/open/0008`, the frame it is fully open,
  the glow swells to 1.5 and settles at 1.4 and 0.85, 6 to 16 sparkles (tinted light, additive) rise from the mouth and
  4 to 10 petals (in the colour) tumble out and down, a legendary or a unique shakes the camera a touch, and the first
  card slides up from behind the chest (380 ms, a little overshoot). At rest: a ding, a pulse on the name, "Tap to go on";
  2.2 s or a tap brings the next card (the old one lifts away, a few sparkles) or the board. A tap during the build opens
  the chest at once.
- **The colour** is the best prize's rarity, gold for a chest of coins and flasks (`tierOf`; `RARITY_TINT` for the glow,
  rim and particles, `RARITY_INK` for the name on the cream face, both in `layout.ts`).
- **The card** is Mitch, AD's card.png twice: one copy tinted for the rim, one untinted under a geometry mask cut to the
  cream face. The slot's word sits in the icon square until the gear icons come; the name shrinks from 19 px to fit; the
  power line (`cardWords`: the rarity and base, the stats, the affixes, a unique's power, "no room: sold for n gold")
  goes 12, 11, 10 px, then loses its last parts with an ellipsis.
- **Fewer effects**: no veil fade, no build, no particles, the clip still plays, the card appears in place, 1.5 s or a tap.
- **Sound hooks** (silent until step 7): `ui/chest-shimmer` at the build, `ui/chest-burst-<rarity>` on the open frame
  (gold-only chests use common), `ui/chest-card` per card, `ui/chest-ding` at rest; the buzz grows with the tier.
- **For looking** without finding a chest: `?reveal=rare` (any rarity) or `?reveal=all` (gold, a flask and the six
  rarities in a row) on a page with a save; or in the pane, `boardWorld.phaser.scene.getScene('board').showcase('epic')`.
- **Tests**: `client/test/loot.test.ts` covers the pure parts (Vitest now includes `client/test/`); the scene is judged in
  the pane.

## The moments (chapter 1 step 3, 2026-11-01)

- **The die's roll** (`HudScene.startRoll`, `landDie`, `cancelRoll`): the roll begins on the tap, before the world answers.
  The box rocks for 320 ms (Nigel, SD's `ui/die-shake`), then the faces flicker every 70 ms with his `ui/die-tumble`
  looping, until the answer lands it: the final face, a bounce from 1.35 (Back.easeOut, 280 ms), a glow ring that grows
  and fades, `ui/die-land` with the rate 0.94 + face × 0.025, a buzz. The shake and a little of the tumble are always
  seen (620 ms at least), so a local answer and a server's look the same; a refused roll puts the old face back. Fewer
  effects: the face at once. The board lights the spots after the landing.
- **The banners** (`MomentScene`, added last in `play.ts` so it draws over the fight and the reveal; it takes no input):
  the level up ("Level 3!" in gold with the new numbers, a burst of sparkles and a ring, `ui/level-up`), the boss down
  (in red, a stronger buzz and a small shake, `ui/boss-down`), the area opened (in green, a slower swell and a wide ring,
  `ui/area-opened`). A plate of 340 by 86 drawn by code until the UI kit's banners come. Each holds 1.3 s and lifts away;
  several queue. The board shows them for a landing's events (`showMoments`), the fight at the beat of its own events.
- **The sounds** (`audio.ts`): `assets/sound/ui/ui.ogg` and `ui.json` (Nigel, SD's sprite, copied whole from his
  `out/sfx/ui/game/`), loaded by the board's preload with Phaser's audio sprite loader; the UI sprite plays at 0.8 of
  full. `ui/die-land` is an alias for his candidate B until Robin picks. Every hook the scenes call is listed in
  `docs/state/sound.md`.

- **On the board** the token is the hero at 0.15 of the file (about 45 CSS px), feet on the spot, facing right; a walk
  plays `move` and turns him the way each step goes, then `stand`.
- **In the fight** the hero stands at the left (feet at 70, 470) at 0.45 (about 135 CSS px) facing the enemy, which moved
  to the right (x 300); the history and message texts sit at x 266 in a 270-wide column beside him. The round's events
  drive the clips: a hit landed plays `attack1`, a hit taken `hit1`, Block, Brace and Counter hold `defend` until the
  blow, a miss of yours `attack1`, a fall `die1` with the last two frames fading, a win `stand`.
- With no set loaded the circle and the letter draw as before.

## The feel of a press (`feel.ts`, 2026-11-01; chapter 1, step 1)

Robin: the UI snappy and responsive, small effects on every press. `client/src/feel.ts` is the one place: `press` squashes
a thing to 0.94 in 60 ms the moment the finger lands, `release` pops it to 1.05 and back in 90 ms when the finger lifts or
leaves, `buzz` vibrates the phone for 10 ms through `navigator.vibrate` where it exists (Android; a **Vibration** setting,
on by default, in the atlas's Settings), `sparkle` throws seven small dots out from a point in a colour, `tick` pulses a
text once, and `sfx.play(name)` is the hook the audio layer fills in (step 7; silent until then). `makeButton` in `ui.ts`
uses them for every button in the game: squash, buzz, `ui/tap`, the tap answered on the press itself, the pop on release.
A class card chosen sparkles and buzzes (`ui/card`); a chip tapped sparkles; a lit spot tapped ripples in its light,
buzzes and plays `ui/choice`; a bar whose number moved ticks its text. All of it respects "fewer effects" (no tweens) and
the vibration setting.

## The save (`local-game.ts`) and the account (`remote-game.ts`)

**Solo**: `localStorage['boardworld.save']` = `{ version: 1, state, rng }` where `rng` is the random stream's position. On
load a save of version 1 passes its state through `migrate`, which brings any older state up to the current version; no
save, or one we cannot read, gives null and the character screen comes up, and `create` makes the game from the name and
class chosen with a new seed. `act` passes `Date.now()` to the rules as the clock. **The world ticks** (`game.tick()`, the
`tick` action) on load, once a minute, and when the page comes back to the front. The one local player's id is `local`.
`reset()` throws the save away, so the next load is the character screen. A save made in the pane is not Robin's: he
plays on his phone.

**Co-op** (mine, 2026-11-01): `localStorage['boardworld.server']` is the address from `?server=` (`off` or empty forgets
it); `localStorage['boardworld.account']` = `{ token, player, recovery }`, written from the first snapshot. `RemoteGame`
sends `join` with the token (or `name` and `classId`, or `recover`), takes the snapshot as the whole truth, sends each
intent with a UUID and waits for its `result` before the next; `event` messages fold others' deltas in and tell the
scenes (`onChange`). It pings every 20 s and drops a socket with no pong in 10; a closed socket is replaced after 1, 2,
4, 8, then 15 s, forever; `visibilitychange`, `pageshow` and the minute's tick call `checkLink`, which replaces a dead
socket at once; after every new snapshot the intent that was in flight is sent again with the same id, and the server
answers from its store if it had it. `now()` is the server's clock (its `serverTime` less ours). `reset()` forgets this
phone's token (the code brings the character back) and tells the server `leave`. The solo save is not uploaded; the two
worlds are separate.

## The frame log and error log (`game-log.ts`)

- Per frame: the delta goes into a ring of the last 1,800 frames (30 s at 60 fps); each full second is summarised as fps and
  worst frame (up to 600 seconds kept).
- Errors: `window.onerror`, unhandled promise rejections and `console.error` are caught (up to 200 kept); notable game
  events go in with `log.note` (up to 500).
- **Log** button: downloads the whole thing as `boardworld-log-<time>.txt`. On a phone Robin shares that file into the chat.
- `window.boardWorld` = `{ game, log, phaser, rules, server }` so the pane and the scripts in `tools/` can read the state and the log.

## The PWA

`vite.config.ts` carries the manifest: name Board World (to become Zite with the local session's blessing: the manifest
name is what the phone shows on install), standalone, portrait, dark theme, icons 192 and 512. The service worker
(Workbox, `autoUpdate`) is only generated by `npm run build`; in `npm run dev` it is off. Chrome on Android offers
"Install app" once the built site is served over HTTPS. Phaser is the weight: 1.4 MB of script, 370 kB gzipped.

## Not here yet

**The UI layer from the kit** (chapter 1, step 6), the loot reveal screen (the chest's glow by rarity, the open, the burst,
the card; step 2), the side-view fight and the board renderer from the kits (steps 4 and 5), and the audio layer
(`docs/state/sound.md`, step 7).

A second hand-laid pass at the numbers once Robin has played; sound (`?mute=1` is the convention for test pages once
sound exists); a quieter way to type the server's address and a code than the browser's prompt; the install prompt; the
world boss in the atlas's list.
