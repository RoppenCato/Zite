# Pages the browser pane can open

| Page | How | What it is |
| --- | --- | --- |
| `http://localhost:5173/` | `npm run dev`, or the pane's launch entry `game` | the game, hot-reloading |
| `http://192.168.x.x:5173/` | the Network line Vite prints | the same, for a phone on the same Wi-Fi (no install prompt over plain http) |
| `http://localhost:4173/` | `npm run build` then `npm run preview` | the built PWA with its service worker and manifest; this is what installs |
| `ws://localhost:8787` | `npm run server` | the WebSocket server; answers `{"type":"ping"}` only |

## Driving the game from the pane

`window.boardWorld` is `{ game, log, phaser }`; `game` is null while the character screen is up:

```js
boardWorld.phaser.scene.isActive('create')                 // the character screen (no save)
boardWorld.phaser.scene.getScene('create').choose('mage')  // or tap a card; Begin at (206, 812), the cards at y 304, 420, 536, 652
boardWorld.phaser.scene.getScene('create').begin()         // the name is read from the <input> inside #game
boardWorld.game.me                       // the character: space, steps, hp, mana, gold, xp, level, fight, items, equipment, bag, abilities, opened, cooldowns
boardWorld.game.state.spawns             // what prowls or camps where, and until when
boardWorld.game.act({ type: 'roll', player: 'local' })
boardWorld.game.act({ type: 'move', player: 'local', path: ['ashford-millford-1', 'ashford-millford-2'] })
boardWorld.game.act({ type: 'fight', player: 'local', move: { kind: 'attack' }, guard: 'block' })   // one round
boardWorld.game.act({ type: 'buy', player: 'local', slot: 'weapon' })         // standing on a shop or in a town
boardWorld.game.act({ type: 'equip', player: 'local', gear: 'g1' })
boardWorld.game.act({ type: 'use', player: 'local', item: 'exact', value: 4 }) // a dice card on a pending roll
boardWorld.game.act({ type: 'gamble', player: 'local', choice: 'high' })
boardWorld.game.tick()                   // the world moves: a spawn may appear or leave
boardWorld.game.reset()                  // throws the save away; reload and the character screen comes up
boardWorld.log.text()                    // what the Log button downloads
boardWorld.phaser.loop.actualFps

const board = boardWorld.phaser.scene.getScene('board');
board.roll(); board.toggleMap(); board.openBag(); board.downloadLog()
board.useCard('plus-one'); board.answerGamble('pass')
board.choices                            // landing space → path while the player is choosing, null otherwise
board.cameras.main.zoom                  // 0.8 following; the overview fits what is open
board.cameras.main.worldView             // the world rectangle in view: x, y, width, height
boardWorld.phaser.scene.getScene('hud')  // name, stats, place, message, dieText, chipRow, rollButton, mapLabel
boardWorld.phaser.scene.isActive('fight') / isActive('shop') / isActive('bag')
```

**Where things are on the screen**, in design pixels: Map (72, 836), Bag (206, 836), Log (340, 836), Roll (206, 884).
The band runs from y 100 to 740. A spot at world (wx, wy) is on the screen at design `x = (wx − worldView.x) × zoom`,
`y = 100 + (wy − worldView.y) × zoom`; in the mobile preset (375 by 812, canvas at 0.887 scale, 5 pixels in from the
left) multiply by 0.887 and add the 5 pixels. The chips sit in a row centred at (206, 754) (the HUD's `chipRow`).
`board.frame([...])` and `board.overview()` are private but callable from a script when a test needs the lit spots in
view.

**The fight screen's buttons**: rows a (110, 600), b (302, 600), c (110, 652), d (302, 652), e (110, 704), f (302, 704),
each 180 wide; the moves fill a to e (Attack, Abilities, Charge, Potion, Flee), then the guards fill a to e (Block,
Dodge, Brace, Counter, Back); Continue at (206, 652) once the fight is over. A round's events play 450 ms apart; the
scene's `busy` is true meanwhile.

**The shop**: Buy rows from y 224, 44 apart (the five slots, then potion, Reroll, +1, −1, Exactly N), Buy at x 356; the
Sell side at (272, 178); Leave at (206, 706). **The bag**: Close at (364, 126); the worn rows from y 212 with Take off at
x 364; the carried rows from y 456 with Wear at x 364 and Drop at x 288.

**Gestures from a script**: a tap is a touch down and up at one point; a drag is a touch that moves more than 8 pixels
before it lifts (it pans the camera, and lifting it on a spot is not a tap); a pinch is two touches moving apart or
together; a mouse wheel over the band zooms by a tenth a notch. `tools/drive-board.mjs` does all of this headless against
the built game (`node tools/drive-board.mjs [url]`, Chromium through Playwright, CDP touch events): the character screen,
the camera, hints, the covered areas and the bosses, a reload mid-choice, an old save, a fight with its two taps, a reload
mid-fight, the shop, the bag, a dice card, a potion, the Iron Gate's boss and Thornwood opening, the Briar King and
Frostpeak, the Frost Matriarch and the first grown area laid and drawn (then its boss and the second), and a reset,
with screenshots in `tools/out/shots/`. It clears the page's save first and plants saves of its own.

## The balance simulation

`node tools/simulate.ts [turns] [seeds]` needs no browser: bots of each class play from Ashford and each boss is fought
level by level (`docs/state/rules.md`, Balance). A minute for the defaults. Rerun it after changing any number in
`rules/data`.

## Things the pane does to a page

- A **hidden pane pauses Phaser**: no animation frames, so a walk started by Roll finishes only when the pane is shown
  (`mcp__ccd_view__show_pane` with `preview`). The state is already saved before the walk starts.
- The mobile preset is cleared when the turn ends; set it again before each screenshot.
- A camera pan or zoom takes 350 ms; read `worldView` and `zoom` after that, not straight after a tap.
- Spots that give again after a while and bosses' returns run on the page's clock (`Date.now()`); a planted save with
  `cooldowns` in the past makes them give at once.
- `?mute=1` is the convention for test pages once sound exists; nothing reads it yet.
