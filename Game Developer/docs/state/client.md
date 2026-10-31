# The client (`client/`)

Phaser 4.2.1 with TypeScript and Vite 8, built as a PWA with `vite-plugin-pwa` 2. Two scenes: the **board** (the world,
drawn in world pixels under a camera that follows the character) and the **HUD** over it (the fixed chrome, which never
scrolls or zooms). Shapes and labels only; the Art Director's sprites come later. The client never decides anything: it
sends intents to the holder of the state (`LocalGame` today, the server from MVP step 2) and plays back the events.

| File | What it does |
| --- | --- |
| `index.html` | the page: viewport for phones, dark background, the `#game` box the canvas fills, `touch-action: none` |
| `src/main.ts` | makes the log, loads the save, starts Phaser with both scenes, exposes `window.boardWorld` |
| `src/layout.ts` | the design size (412 by 915), the HUD's height (90) and the world band's (680), the colours, the font |
| `src/local-game.ts` | solo play: holds the state and the random stream, applies actions through the rules, saves |
| `src/game-log.ts` | the frame log and error log, downloadable |
| `src/scenes/BoardScene.ts` | the island, the token, the rings, the camera, the touch input; `roll`, `toggleMap`, `downloadLog` |
| `src/scenes/HudScene.ts` | the top panel, the message line, the Map, Roll and Log buttons; `setStats`, `setDie`, `setMessage`, `setBusy`, `setFollowing` |
| `public/icon.svg`, `public/pwa-*.png` | the icon placeholders (`npm run icons` remakes the PNGs from `tools/make-icons.mjs`) |

## Size and scaling (mine, 2026-10-31)

The design size is **412 by 915 CSS pixels, portrait**, an ordinary Android phone. Phaser's `Scale.FIT` with
`CENTER_BOTH` scales the whole canvas to fit whatever screen it gets and centres it; nothing is laid out per device. Judge it
in the browser pane's mobile preset (375 by 812), where the canvas comes out at 0.89 scale.

Layout at design size: the HUD panel in the top 90 pixels (name and class, HP, gold, current space; the die box at the
right); **the world band from y 90 to 770**, the main camera's viewport; a dark strip below it with the message line at
y 795 and, at y 862, the Map button (72 by 50, centred at x 50), the Roll button (220 by 66, centred at x 206) and the Log
button (72 by 50, centred at x 362); a tiny build-island-and-seed line at the bottom left.

## The two scenes

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
  where the roll can end (`reachable`). **One place: the token walks at once. More: those spaces light up** (a pulsing
  yellow ring, radius 34), the camera frames them, and the message says "Tap a lit space to walk there". The tap area of a
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
  last value, and `hudReady` offers the choice when `steps > 0`.
- A refusal shows as "Not allowed: <reason>." in the message line.
- A hidden tab or a hidden browser pane pauses Phaser (no animation frames), so a walk finishes when the page is shown
  again. The state is already saved by then.

## The camera (mine, 2026-10-31: numbers to start with)

- The main camera's viewport is the band (`setViewport(0, 90, 412, 680)`), its bounds the island
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

## The save (`local-game.ts`)

`localStorage['boardworld.save']` = `{ version: 1, state, rng }` where `rng` is the random stream's position. On load a save
of version 1 passes its state through `migrate`, which brings a version-1 state (the ring) up to version 2 (the island,
the character on Ashford again); anything else starts a fresh game from a new seed (`crypto.randomUUID`, or a
timestamp-and-random fallback where that is missing). The one local player's id is `local`, named Robin, a Warrior (mine,
until there is a character screen). `reset()` throws the save away. A save made in the pane is not Robin's: he plays on his
phone.

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

A fight screen, the space resolutions, a second island and the world beyond it (the generator), a character screen, sound
(`?mute=1` is the convention for test pages once sound exists), the socket client (after `docs/state/protocol.md` is
written), reconnect on `visibilitychange` and `pageshow`.
