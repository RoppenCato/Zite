# The client (`client/`)

Phaser 4.2.1 with TypeScript and Vite 8, built as a PWA with `vite-plugin-pwa` 2. Five scenes: the **character screen**
the first time (a name and a class), then the **board** (the world, drawn in world pixels under a camera that follows the
character), the **HUD** over it (the fixed chrome, which never scrolls or zooms), and the **fight** and the **shop**,
each launched over both when it begins and stopped when it ends. Shapes and labels only; the Art Director's sprites come later. The client never decides anything: it sends intents to the holder of the
state (`LocalGame` today, the server from MVP step 2) and plays back the events.

| File | What it does |
| --- | --- |
| `index.html` | the page: viewport for phones, dark background, the `#game` box the canvas fills, `touch-action: none` |
| `src/main.ts` | makes the log, loads the save, starts Phaser on the board (a save) or the character screen (none), exposes `window.boardWorld` |
| `src/scenes/CreateScene.ts` | the character screen: the name field, the four class cards, Begin; makes the game and starts the board |
| `src/scenes/play.ts` | `playScenes(game, log)`: the board, HUD and fight scenes made together |
| `src/layout.ts` | the design size (412 by 915), the HUD's height (90) and the world band's (660), the colours, the font |
| `src/local-game.ts` | solo play: holds the state and the random stream, applies actions through the rules, saves |
| `src/game-log.ts` | the frame log and error log, downloadable |
| `src/scenes/BoardScene.ts` | the island, the token, the rings, the camera, the touch input; `roll`, `toggleMap`, `downloadLog` |
| `src/scenes/HudScene.ts` | the top panel, the message line, the Map, Roll and Log buttons; `setStats`, `setDie`, `setMessage`, `setBusy`, `setFollowing` |
| `src/scenes/FightScene.ts` | the fight screen over the band: the enemy, the character, their HP bars, the message, Attack, the class's move, Defend, Flee, Potion, Continue |
| `src/scenes/ShopScene.ts` | the shop over the band: what it sells with Buy buttons, your gold, what you carry, Leave |
| `src/ui.ts` | `makeButton` and the HP `Bar`, shared by the scenes |
| `public/icon.svg`, `public/pwa-*.png` | the icon placeholders (`npm run icons` remakes the PNGs from `tools/make-icons.mjs`) |

## Size and scaling (mine, 2026-10-31)

The design size is **412 by 915 CSS pixels, portrait**, an ordinary Android phone. Phaser's `Scale.FIT` with
`CENTER_BOTH` scales the whole canvas to fit whatever screen it gets and centres it; nothing is laid out per device. Judge it
in the browser pane's mobile preset (375 by 812), where the canvas comes out at 0.89 scale.

Layout at design size: the HUD panel in the top 90 pixels (name and class, HP, gold, current space; the die box at the
right); **the world band from y 90 to 750**, the main camera's viewport; a dark strip below it with the row of dice-card
chips at y 764 (empty most of the time), the message line at y 790 and, at y 862, the Map button (72 by 50, centred at
x 50), the Roll button (220 by 66, centred at x 206) and the Log button (72 by 50, centred at x 362); a tiny
build-island-and-seed line at the bottom left.

## The character screen (mine, 2026-10-31: first layout; Robin, 2026-10-31: the class is chosen at creation)

Shown when there is no save. "Board World" and the island's name at the top; **a name field** (a real `<input>` through
Phaser's DOM container, 300 by 44 at y 180, at most 12 characters, "Robin" to start, so the phone's keyboard comes up);
**four cards** (340 by 104, centred at y 304, 420, 536 and 652) with each class's name, its style line from the brief ("Steady, high
base damage, tough." and so on, in `classes.json`) and its HP, attack, defense and move; the chosen card is lit with a
yellow border; **Begin** (220 by 66 at y 812) makes the game (`LocalGame.create`), adds the three play scenes and starts
the board. An empty name becomes "Robin". The pane can call `choose(classId)` and `begin()` on the scene.

## The two scenes of play and the HUD

The board scene starts first, draws the world and **launches the HUD** (`this.scene.launch('hud')`) at the end of its
`create`. The HUD's `create` draws the chrome and calls `board.hudReady(hud)`; only then does the board push its first
message and re-offer a pending choice. The HUD's buttons call the board's public methods (`roll`, `toggleMap`,
`downloadLog`, through `this.scene.get('board')`); the board tells the HUD what to show (`setStats`, `setDie`, `setMessage`,
`setBusy`, `setFollowing`). Phaser dispatches input to the top scene first and stops there when it hit something, so a tap
on a button never reaches the world; a touch on the HUD's panel or strip is ignored by the board (it only takes touches
inside the band).

## The board scene

- **The island's ground** is a flat rectangle of the board's width by height with a thin border, so the edge shows when
  zoomed out. **Links** are 6-pixel lines in one `Graphics`; **spaces** are circles of radius 26 in a colour per kind (town
  green, battle red, shop yellow, event purple, treasure orange, quest blue, boss gate dark red with a thick ring, shrine
  teal), with the kind's first letter inside; **hubs** have their name under them (bold 13 px); road spaces show the letter
  only. The **token** is a container (a circle of radius 15 with the class's first letter) just above its space.
- **Roll** calls `game.act({ type: 'roll' })`, shows the value in the die box with a small pulse, then asks the rules
  where the roll can end (`reachable`). **One place and no dice card in the bag: the token walks at once. Otherwise those
  spaces light up** (a pulsing yellow ring, radius 34), the camera frames them, the HUD's row shows the dice cards held
  ("Reroll", "+1 ×2", "−1", "Exactly N") and the message says "Tap a lit space to walk there". **A chip** calls
  `game.act({ type: 'use', item })` (Exactly N first turns the row into the numbers 1 to 6 and a way back); on the
  `steps` event the die shows the new number, the rings are cleared and the choices offered again, framed, with the
  message "+1: now 4 steps." (mine: a card can still change a roll that had only one way to go, so such a roll waits). The tap area of a
  space is a circle of radius 38, wider than the drawn 26, for thumbs. Tapping an unlit space says "Not N steps away";
  tapping Roll says "Tap a lit space first". (Robin, 2026-10-31: the die gives the choice of where to go; the
  tap-the-destination form is mine.)
- **The tap** calls `game.act({ type: 'move', path })` at once, clears the rings, and only then walks the token: a tween
  chain, 260 ms per step, Sine in-out, the camera following. The state is therefore ahead of the picture during the walk,
  as it will be with a server: the picture is playback. While choosing or walking, the Roll button is dimmed.
- The landed message names the space ("Landed on Ashford (town)") or, for a road space, its kind ("Landed on a battle
  space"), then what the space did from the events: an event card's text, "Found 23 gold." or "Lost 10 gold.",
  "Healed 30 HP." or "HP already full." The HUD's Space shows the name or the kind the same way, and HP and gold are
  refreshed after the walk.
- **A page closed mid-choice** opens with the same choice lit and framed again: the save holds the owed steps and the die's
  last value, and `hudReady` offers the choice when `steps > 0`. **A page closed mid-fight** opens on the fight again.
- **A walk that ends on a battle space** opens the fight scene instead of finishing the turn: the Roll button stays dimmed
  and the HUD message says "A Moor Wolf blocks the way." When the fight scene calls `fightOver`, the board stops it,
  puts the token in the town the character woke in if it was beaten, and finishes the turn with the outcome as the message.
- **A walk that ends on a shop space** opens the shop scene the same way; `shopLeft` closes it and finishes the turn
  ("Left Tinker Cart. Tap it again to go back in."). **A tap on the shop the character stands on**, with nothing
  pending, opens it again (mine).
- The HUD's stats line reads `Lv 1   HP 120/120   Gold 50   Space Ashford` (14 px).
- A refusal shows as "Not allowed: <reason>." in the message line.
- A hidden tab or a hidden browser pane pauses Phaser (no animation frames), so a walk finishes when the page is shown
  again. The state is already saved by then.

## The camera (mine, 2026-10-31: numbers to start with)

- The main camera's viewport is the band (`setViewport(0, 90, 412, 660)`), its bounds the island
  (`setBounds(0, 0, board.width, board.height)`), `roundPixels` on. Near an edge the view stops at the bounds, so the
  character is not centred there.
- **Follow zoom 0.8**; **minimum zoom** such that the whole island fits the band (412 / 1400, about 0.29); **maximum 1.4**.
  The camera starts following the token at the follow zoom (`startFollow(token, true, 0.12, 0.12)`: a lerp of 0.12 a
  frame).
- **A roll with more than one place to go frames the token and every lit space**: their box plus 80 pixels of padding,
  the zoom clamped between the minimum and the follow zoom, `pan` and `zoomTo` over 350 ms, following stopped. **After
  the tap** the camera zooms back to the follow zoom and follows the token through the walk, gliding from where it was
  (no jump: `startFollow` is called and the scroll put back, so the lerp carries it).
- **Drag pans**: once a finger has moved more than 8 design pixels from where it went down, following stops and the
  scroll moves by the finger's travel divided by the zoom. A space is tapped on `pointerup` only when
  `pointer.getDistance()` is under 10, so a drag that ends on a space is not a tap.
- **Pinch zooms**: with two fingers down, the zoom is the zoom at the pinch's start times the fingers' distance over
  their starting distance, clamped. A **mouse wheel** zooms by 10 percent a notch (for the desktop pane).
- **The Map button** shows the whole island (the minimum zoom, centred on it, following stopped) and reads "Back" whenever
  the camera is not following the token (after Map, a drag, or while a roll is framed); Back returns to the follow zoom and
  follows the token again.
- **Hub names are hidden below zoom 0.45**; the check runs in `update` only when the zoom changed.
- Nothing reads the canvas back and nothing filters per frame; the per-frame work is the frame log and the zoom check.

## The fight scene (mine, 2026-10-31: first layout; Robin, 2026-10-31: fights are their own screen, turn-based, one thumb)

An opaque panel over the band (y 90 to 770) that takes every touch, so nothing reaches the board under it; the HUD stays
above with name, HP, gold and the die. From the top: the enemy's name (22 px), its HP bar (260 by 18, red), the enemy as
a circle of radius 60 with its initial; the message line at y 362; the character as a circle of radius 30 with the
class's letter, its HP bar (green) and "Robin the Warrior, level 1"; a **Potion** button (220 by 44 at y 612, "Potion
×2", shown only while the bag has one) that sends `use`; then four buttons, 180 by 52: **Attack** and the class's move
(**Heavy Blow**, **Backstab**, **Charge**, **Volley**) at y 672, **Defend** and **Flee** at y 736. Each
button sends one intent (`game.act({ type })`) and the round's events are **played back one at a time, 450 ms apart**:
a hit flashes the one struck and floats the damage up (bigger and yellow on a crit), the bar tweens to the hit's `hp`,
the message says the blow; `charged`, `guarded`, `fled` and `levelled` are said in words. While a round plays the buttons
are dimmed. On `won`, `died` or a successful `fled` the four buttons give way to **Continue** (220 by 56 at y 704), which
calls the board's `fightOver` with a one-line summary for the HUD's message line. On death the bar goes to 0 and the
message says where the character wakes and what it cost.

## The shop scene (mine, 2026-10-31: first layout)

An opaque panel over the band with the shop's name (the space's, or "Shop") and your gold at the top; one row per item in
`items.json` from y 214, 72 apart: the name, its line of text, the price in gold and a **Buy** button (88 by 40 at
x 352) that sends `game.act({ type: 'buy', item })` and says "Bought a Potion for 15 gold." or "Not enough gold."; a
line with what you carry; **Leave** (220 by 56 at y 696), which calls the board's `shopLeft`. The HUD's gold is refreshed
after every buy.

## The save (`local-game.ts`)

`localStorage['boardworld.save']` = `{ version: 1, state, rng }` where `rng` is the random stream's position. On load a save
of version 1 passes its state through `migrate`, which brings a version-1 state (the ring) or a version-2 state (no xp
yet) up to version 3; no save, or one we cannot read, gives null and the character screen comes up, and `create` makes
the game from the name and class chosen with a new seed (`crypto.randomUUID`, or a timestamp-and-random fallback where
that is missing). The one local player's id is `local`. `reset()` throws the save away, so the next load is the character
screen. A save made in the pane is not Robin's: he plays on his phone.

## The frame log and error log (`game-log.ts`)

- Per frame: the delta goes into a ring of the last 1,800 frames (30 s at 60 fps); each full second is summarised as fps and
  worst frame (up to 600 seconds kept).
- Errors: `window.onerror`, unhandled promise rejections and `console.error` are caught (up to 200 kept); notable game
  events go in with `log.note` (up to 500).
- **Log** button: downloads the whole thing as `boardworld-log-<time>.txt` (header with user agent, screen and viewport;
  errors; events; the per-second table; the last frame times). On a phone Robin shares that file into the chat.
- `window.boardWorld` = `{ game, log, phaser }` so the pane and the scripts in `tools/` can read the state and the log.

## The PWA

`vite.config.ts` carries the manifest: name Board World (the working title is still open), standalone, portrait, dark
theme, icons 192 and 512 (plus the 512 as maskable). The service worker (Workbox, `autoUpdate`) is only generated by
`npm run build`; in `npm run dev` it is off so hot reload and the pane stay simple. Chrome on Android offers "Install app"
once the built site is served over HTTPS (localhost counts; a phone on the LAN over plain http does not, so the install
test needs the tunnel or Cloudflare Pages). Phaser is the weight: 1.39 MB of script, 365 kB gzipped; the build warns
above 1.5 MB per chunk.

## Not here yet

The quest giver and the boss gate, items found on the board (treasure gives only gold), a second island and the world
beyond it (the generator), sound
(`?mute=1` is the convention for test pages once sound exists), the socket client (after `docs/state/protocol.md` is
written), reconnect on `visibilitychange` and `pageshow`.
