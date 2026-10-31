# Pages the browser pane can open

| Page | How | What it is |
| --- | --- | --- |
| `http://localhost:5173/` | `npm run dev`, or the pane's launch entry `game` | the game, hot-reloading; the board scene |
| `http://192.168.x.x:5173/` | the Network line Vite prints | the same, for a phone on the same Wi-Fi (no install prompt over plain http) |
| `http://localhost:4173/` | `npm run build` then `npm run preview` | the built PWA with its service worker and manifest; this is what installs |
| `ws://localhost:8787` | `npm run server` | the WebSocket server; answers `{"type":"ping"}` only |

## Driving the game from the pane

`window.boardWorld` is `{ game, log, phaser }`:

```js
boardWorld.game.me                       // the character: space, steps, hp, gold
boardWorld.game.act({ type: 'roll', player: 'local' })
boardWorld.game.act({ type: 'move', player: 'local', path: ['s1', 's2'] })
boardWorld.game.reset()                  // a fresh game and seed; reload the page to redraw
boardWorld.log.text()                    // what the Log button downloads
boardWorld.phaser.loop.actualFps
```

The Roll button in design pixels is at (176, 862); in the mobile preset (375 by 812, canvas at 0.89 scale, 5 pixels in
from the left) that is about (161, 765). A space at design (x, y) is at about (5 + 0.887 x, 0.887 y): Crossroads (56, 430)
is (55, 381), Windy Ridge (356, 430) is (320, 381). After a roll with more than one place to go, the lit spaces are
tappable; `boardWorld.phaser.scene.getScene('board').choices` is the map of landing space to path while the player is
choosing, null otherwise. The Log button triggers a file download, so in the pane read `log.text()` instead.

## Things the pane does to a page

- A **hidden pane pauses Phaser**: no animation frames, so a walk started by Roll finishes only when the pane is shown
  (`mcp__ccd_view__show_pane` with `preview`). The state is already saved before the walk starts.
- The mobile preset is cleared when the turn ends; set it again before each screenshot.
- `?mute=1` is the convention for test pages once sound exists; nothing reads it yet.
