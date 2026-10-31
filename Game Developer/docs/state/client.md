# The client (`client/`)

Phaser 4.2.1 with TypeScript and Vite 8, built as a PWA with `vite-plugin-pwa` 2. One scene so far: the board. Shapes and
labels only; the Art Director's sprites come later. The client never decides anything: it sends intents to the holder of
the state (`LocalGame` today, the server from MVP step 2) and plays back the events.

| File | What it does |
| --- | --- |
| `index.html` | the page: viewport for phones, dark background, the `#game` box the canvas fills |
| `src/main.ts` | makes the log, loads the save, starts Phaser, exposes `window.boardWorld` |
| `src/layout.ts` | the design size (412 by 915) and the colours of the chrome |
| `src/local-game.ts` | solo play: holds the state and the random stream, applies actions through the rules, saves |
| `src/game-log.ts` | the frame log and error log, downloadable |
| `src/scenes/BoardScene.ts` | the board, the token, the HUD, the Roll and Log buttons |
| `public/icon.svg`, `public/pwa-*.png` | the icon placeholders (`npm run icons` remakes the PNGs from `tools/make-icons.mjs`) |

## Size and scaling (mine, 2026-10-31)

The design size is **412 by 915 CSS pixels, portrait**, an ordinary Android phone. Phaser's `Scale.FIT` with
`CENTER_BOTH` scales the whole canvas to fit whatever screen it gets and centres it; nothing is laid out per device. Judge it
in the browser pane's mobile preset (375 by 812), where the canvas comes out at 0.89 scale.

Layout at design size: the HUD panel in the top 90 pixels (name and class, HP, gold, current space; the die box at the
right); the board between y 110 and 745 (the positions are in `rules/data/board.json`); the message line at y 795; the Roll
button (220 by 66) and the Log button (80 by 50) at y 862; a tiny build-and-seed line at the bottom left.

## The board scene

- **Links** are 6-pixel lines in one `Graphics`; **spaces** are circles of radius 26 in a colour per kind (town green,
  battle red, shop yellow, event purple, treasure orange, quest blue, boss gate dark red with a thick ring, shrine teal), with
  the kind's first letter inside and the name under; the **token** is a container (a circle of radius 15 with the class's
  first letter) sitting just above its space.
- **Roll** calls `game.act({ type: 'roll' })`, shows the value in the die box with a small pulse, then asks the rules
  where the roll can end (`reachable`). **One place: the token walks at once. More: those spaces light up** (a pulsing
  yellow ring, radius 34) and the message says "Tap a lit space to walk there". The tap area of a space is a circle of
  radius 38, wider than the drawn 26, for thumbs. Tapping an unlit space says "Not N steps away"; tapping Roll says "Tap
  a lit space first". (Robin, 2026-10-31: the die gives the choice of where to go; the tap-the-destination form is mine.)
- **The tap** calls `game.act({ type: 'move', path })` at once, clears the rings, and only then walks the token: a tween
  chain, 260 ms per step, Sine in-out. The state is therefore ahead of the picture during the walk, as it will be with a
  server: the picture is playback. While choosing or walking, the Roll button is dimmed.
- **A page closed mid-choice** opens with the same choice lit again: the save holds the owed steps and the die's last
  value, and `create` offers the choice when `steps > 0`.
- A refusal shows as "Not allowed: <reason>." in the message line.
- A hidden tab or a hidden browser pane pauses Phaser (no animation frames), so a walk finishes when the page is shown
  again. The state is already saved by then.

## The save (`local-game.ts`)

`localStorage['boardworld.save']` = `{ version: 1, state, rng }` where `rng` is the random stream's position. On load a save
of version 1 goes through `migrate`; anything else starts a fresh game from a new seed (`crypto.randomUUID`, or a
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
test needs the tunnel or Cloudflare Pages). Phaser is the weight: 1.38 MB of script, 362 kB gzipped; the build warns
above 1.5 MB per chunk.

## Not here yet

A fight screen, the space resolutions, a map bigger than one screen (a camera that follows the character and zooms out
for the overview), a character screen, sound (`?mute=1` is the convention for
test pages once sound exists), the socket client (after `docs/state/protocol.md` is written), reconnect on
`visibilitychange` and `pageshow`.
