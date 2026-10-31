# Pages the browser pane can open

| Page | How | What it is |
| --- | --- | --- |
| `http://localhost:5173/` | `npm run dev`, or the pane's launch entry `game` | the game, hot-reloading; the board under the HUD |
| `http://192.168.x.x:5173/` | the Network line Vite prints | the same, for a phone on the same Wi-Fi (no install prompt over plain http) |
| `http://localhost:4173/` | `npm run build` then `npm run preview` | the built PWA with its service worker and manifest; this is what installs |
| `ws://localhost:8787` | `npm run server` | the WebSocket server; answers `{"type":"ping"}` only |

## Driving the game from the pane

`window.boardWorld` is `{ game, log, phaser }`:

```js
boardWorld.game.me                       // the character: space, steps, hp, gold
boardWorld.game.act({ type: 'roll', player: 'local' })
boardWorld.game.act({ type: 'move', player: 'local', path: ['ashford-millford-1', 'ashford-millford-2'] })
boardWorld.game.reset()                  // a fresh game and seed; reload the page to redraw
boardWorld.log.text()                    // what the Log button downloads
boardWorld.phaser.loop.actualFps

const board = boardWorld.phaser.scene.getScene('board');
board.roll()                             // what the Roll button does: roll, then walk or light the choices
board.toggleMap()                        // the Map button: the whole island, or back to the character
board.downloadLog()                      // the Log button (a file download; in the pane read log.text() instead)
board.choices                            // landing space → path while the player is choosing, null otherwise
board.cameras.main.zoom                  // 0.8 following, about 0.29 in the overview, up to 1.4 pinched
board.cameras.main.worldView             // the world rectangle in view: x, y, width, height
boardWorld.phaser.scene.getScene('hud')  // the chrome: setMessage, setStats, setDie, setBusy, setFollowing
```

**Where things are on the screen.** The buttons sit at y 862 in design pixels: Map at x 50, Roll at x 206, Log at x 362.
In the mobile preset (375 by 812, canvas at 0.89 scale, 5 pixels in from the left) that is about (49, 765), (188, 765)
and (326, 765). A space at world (wx, wy) is on the screen at design
`x = (wx − worldView.x) × zoom`, `y = 90 + (wy − worldView.y) × zoom` (the band starts at y 90), then times 0.887 plus the
5 pixels for the preset; it is tappable only while inside the band (y 90 to 770 in design pixels). `board.frame([...])`
and `board.overview()` are private but callable from a script when a test needs the lit spaces in view.

**Gestures from a script**: a tap is a touch down and up at one point; a drag is a touch that moves more than 8 pixels
before it lifts (it pans the camera, and lifting it on a space is not a tap); a pinch is two touches moving apart or
together; a mouse wheel over the band zooms by a tenth a notch. In Playwright these are `page.touchscreen.tap`, or CDP's
`Input.dispatchTouchEvent` for drags and pinches; `tools/` has no driver script yet.

## Things the pane does to a page

- A **hidden pane pauses Phaser**: no animation frames, so a walk started by Roll finishes only when the pane is shown
  (`mcp__ccd_view__show_pane` with `preview`). The state is already saved before the walk starts.
- The mobile preset is cleared when the turn ends; set it again before each screenshot.
- A camera pan or zoom takes 350 ms; read `worldView` and `zoom` after that, not straight after a tap.
- `?mute=1` is the convention for test pages once sound exists; nothing reads it yet.
