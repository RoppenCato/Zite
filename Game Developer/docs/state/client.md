# The client (`client/`)

Phaser 4.2.1 with TypeScript and Vite 8, built as a PWA with `vite-plugin-pwa` 2. Six scenes: the **character screen**
the first time (a name and a class), then the **board** (the world in areas, drawn in world pixels under a camera that
follows the character), the **HUD** over it (the fixed chrome, which never scrolls or zooms), and the **fight**, the
**shop** and the **bag**, each launched over both when it begins and stopped when it ends. Shapes and labels only; the Art
Director's sprites come later. The client never decides anything: it sends intents to the holder of the state
(`LocalGame` today, the server from MVP step 2) and plays back the events.

| File | What it does |
| --- | --- |
| `index.html` | the page: viewport for phones, dark background, the `#game` box the canvas fills, `touch-action: none` |
| `src/main.ts` | makes the log, loads the save, starts Phaser on the board (a save) or the character screen (none), ticks the world, exposes `window.boardWorld` |
| `src/layout.ts` | the design size (412 by 915), the HUD's height (100) and the world band's (640), the colours (the themes', the rarities'), the font |
| `src/ui.ts` | `makeButton` and the `Bar` (HP, mana), shared by the scenes |
| `src/local-game.ts` | solo play: holds the state and the random stream, applies actions through the rules with the browser's clock, ticks, saves |
| `src/game-log.ts` | the frame log and error log, downloadable |
| `src/scenes/CreateScene.ts` | the character screen: the name field, the four class cards, Begin; makes the game and starts the board |
| `src/scenes/play.ts` | `playScenes(game, log)`: the board, HUD, fight, shop and bag scenes made together |
| `src/scenes/BoardScene.ts` | the world, the token, the camera, the touch input, hints; `roll`, `toggleMap`, `openBag`, `downloadLog`, `useCard`, `answerGamble` |
| `src/scenes/HudScene.ts` | the top panel, the chip row, the message line, Map, Bag, Log and Roll; `setStats`, `setDie`, `setMessage`, `setBusy`, `setFollowing`, `setChips` |
| `src/scenes/FightScene.ts` | the fight screen: a move, then a guard, the round played back; Continue |
| `src/scenes/ShopScene.ts` | the shop: Buy (gear by rank, potions, cards) and Sell, Leave |
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

Shown when there is no save. "Zite" at the top; **a name field** (a real `<input>` through Phaser's DOM container, 300 by
44 at y 180, at most 12 characters, "Robin" to start, so the phone's keyboard comes up); **four cards** (340 by 104,
centred at y 304, 420, 536 and 652) with each class's name, its style line (in `classes.json`), its HP, mana, attack and
defense and its two starting abilities; the chosen card is lit with a yellow border; **Begin** (220 by 66 at y 812)
makes the game (`LocalGame.create`), adds the play scenes and starts the board. An empty name becomes "Robin". The pane
can call `choose(classId)` and `begin()` on the scene.

## The scenes of play and the HUD

The board scene starts first, draws the world and **launches the HUD** at the end of its `create`. The HUD's `create`
draws the chrome and calls `board.hudReady(hud)`; only then does the board push its first message, or take up again what
the page was closed in the middle of: a fight, the gambler's question, a pending roll. The HUD's buttons call the board's
public methods (`roll`, `toggleMap`, `openBag`, `downloadLog`); the board tells the HUD what to show. Phaser dispatches
input to the top scene first and stops there when it hit something, so a tap on a button never reaches the world; a
touch on the HUD's panel or strip is ignored by the board. The fight, shop and bag scenes each cover the band with an
opaque panel that takes every touch, and call the board back when they close (`fightOver`, `shopLeft`, `bagClosed`).

## The board scene

- **The world**: each area's ground in its theme's colour (meadow, forest, ice), its name written large and faint, a thin
  border round the map. **A closed area is covered** by a dark rectangle (you see there is more, not what); the cover
  lifts when a boss opens it. **Links** are 6-pixel lines in one `Graphics`.
- **Spots**: circles in a colour per kind with a letter (town T, shop $, chest C, spring +, shrine *, boss B); the wilds
  are smaller (radius 20) and bare, the others radius 26; **a boss spot is big (radius 34), dark red, named, with its
  boss's level under it**, and dims with a countdown while the boss is away. Hubs show their names (bold 13 px) below
  zoom 0.45 hidden. **Whatever has spawned** bobs as a badge above its spot: a red "!" for a mini-boss, a yellow "$" for a
  merchant; redrawn whenever the spawns change (`LocalGame.onSpawns`) and after a fight. A clock once a second refreshes
  the boss labels.
- **The token** is a container (a circle of radius 15 with the class's first letter) just above its spot.
- **A tap on any spot** that is not lit says what it is (`hintFor`) in the message line and flashes its ring; a tap on
  the shop or town you stand on opens the shop again.
- **Roll** calls `game.act({ type: 'roll' })`, shows the value in the die box with a small pulse, then asks the rules
  where the roll can end inside the open areas (`reachable` with `opened`). **One place and no dice card in the bag: the
  token walks at once. Otherwise those spots light up** (a pulsing yellow ring, radius 42), the camera frames them, the
  chip row shows the dice cards held, and the message says "Tap a lit spot to walk there". A chip sends `use`; on the
  `steps` event the die shows the new number and the choices are offered again (Exactly N first turns the row into the
  numbers and a way back). The tap area of a spot is a circle of radius 38, for thumbs. Tapping an unlit spot while
  choosing says "Not N steps away"; tapping Roll says "Tap a lit spot first".
- **The tap** calls `game.act({ type: 'move', path })` at once, clears the rings, and only then walks the token: a tween
  chain, 260 ms per step, the camera following. The state is ahead of the picture during the walk, as it will be with a
  server: the picture is playback. Then what the landing brought: the message says it ("Rolled 4. Landed in the wilds."
  / "Landed on Old Cairn (chest). A chest! +23 gold. Found Quietfall, copper boots · epic · +4 defense …" / "Rested: HP
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
  three areas: about 0.15, never under 0.12); **maximum 1.4**. The camera starts following the token at the follow zoom
  (`startFollow(token, true, 0.12, 0.12)`).
- **A roll with more than one place to go frames the token and every lit spot**: their box plus 80 pixels of padding, the
  zoom clamped between the minimum and the follow zoom, `pan` and `zoomTo` over 350 ms, following stopped. **After the
  tap** the camera zooms back to the follow zoom and follows the token through the walk, gliding from where it was.
- **Drag pans** once a finger has moved more than 8 design pixels (following stops; the scroll moves by the finger's
  travel divided by the zoom). A spot is tapped on `pointerup` only when `pointer.getDistance()` is under 10, so a drag
  that ends on a spot is not a tap. **Pinch zooms** with two fingers; a **mouse wheel** zooms by 10 percent a notch.
- **The Map button** frames everything open (following stopped) and reads "Back" whenever the camera is not following
  the token; Back returns to the follow zoom and follows the token again.
- Nothing reads the canvas back and nothing filters per frame; the per-frame work is the frame log and the zoom check.

## The fight scene (Robin, 2026-10-31: a turn-based RPG with a defensive choice, one thumb; layout and pacing mine)

An opaque panel over the band; the HUD stays above. From the top: the enemy's name, level and role, its HP bar (260 by
18, red), the enemy as a circle of radius 56 with its initial, a status line in orange (**"winding up Smash!"**, stunned,
poisoned, weakened); the message line; the character as a circle of radius 26, its HP bar (green) and mana bar (blue),
a status line in teal (charged, hits harder, barrier, evading); a prompt. **A round is two taps.** First the move, in two
rows of two and a third row: **Attack**, **Abilities** (then the known abilities with their mana costs, dimmed when mana
is short, and Back), **Charge** ("Charged" while held), **Potion ×n** (dimmed with none), **Flee**. Then the guard:
**Block (half)**, **Dodge (luck)**, **Brace (+mana)**, **Counter (hit back)**, and Back. The round is one intent
(`game.act({ type: 'fight', move, guard })`) and its events are **played back one at a time, 450 ms apart**: a hit
flashes the one struck and floats the damage up (bigger and yellow on a crit), the bars tween, the message says the blow,
the miss, the wind-up, the stun (or a boss shrugging it off), the poison, the counter, the drink, the loot, the level,
the boss falling, the area opening. On `won`, `died` or a lucky `fled` the rows give way to **Continue**, which hands the board a one-line summary.

## The shop scene (mine, 2026-10-31)

The shop's name (or "Wandering Merchant") and your gold at the top; two sides, **Buy** and **Sell**. Buy lists the plain
piece of the area's rank for each of the five slots with its number and price, then the potion and the four dice cards
with their text and how many you hold; a Buy button each (80 by 32 at x 356, rows from y 224, 44 apart). Sell lists the
gear in the bag with its rarity colour and half its worth. The message line says what happened; **Leave** (220 by 50 at
y 706) calls the board's `shopLeft`. The HUD's gold follows every buy.

## The bag scene (mine, 2026-10-31)

"Bag" and the numbers with everything on (attack, defense, HP, mana, crit, dodge, lifesteal, thorns); **Worn**: the five
slots, each with its piece in its rarity colour (or "nothing") and a **Take off** button; **Carried**: up to six pieces
with **Wear** and **Drop**; the flasks and cards at the bottom; **Close** at the top right. Opened from the HUD's Bag
button, not while a fight or the shop is up.

## The save (`local-game.ts`)

`localStorage['boardworld.save']` = `{ version: 1, state, rng }` where `rng` is the random stream's position. On load a save
of version 1 passes its state through `migrate`, which brings any older state up to version 5; no save, or one we cannot
read, gives null and the character screen comes up, and `create` makes the game from the name and class chosen with a new
seed. `act` passes `Date.now()` to the rules as the clock. **The world ticks** (`game.tick()`, the `tick` action) on load,
once a minute, and when the page comes back to the front. The one local player's id is `local`. `reset()` throws the save
away, so the next load is the character screen. A save made in the pane is not Robin's: he plays on his phone.

## The frame log and error log (`game-log.ts`)

- Per frame: the delta goes into a ring of the last 1,800 frames (30 s at 60 fps); each full second is summarised as fps and
  worst frame (up to 600 seconds kept).
- Errors: `window.onerror`, unhandled promise rejections and `console.error` are caught (up to 200 kept); notable game
  events go in with `log.note` (up to 500).
- **Log** button: downloads the whole thing as `boardworld-log-<time>.txt`. On a phone Robin shares that file into the chat.
- `window.boardWorld` = `{ game, log, phaser }` so the pane and the scripts in `tools/` can read the state and the log.

## The PWA

`vite.config.ts` carries the manifest: name Board World (to become Zite with the local session's blessing: the manifest
name is what the phone shows on install), standalone, portrait, dark theme, icons 192 and 512. The service worker
(Workbox, `autoUpdate`) is only generated by `npm run build`; in `npm run dev` it is off. Chrome on Android offers
"Install app" once the built site is served over HTTPS. Phaser is the weight: 1.4 MB of script, 370 kB gzipped.

## Not here yet

A second hand-laid pass at the numbers once Robin has played; the fourth area and the generator; trainers in towns; sound
(`?mute=1` is the convention for test pages once sound exists); the socket client (after `docs/state/protocol.md` is
written); reconnect on `visibilitychange` and `pageshow`.
