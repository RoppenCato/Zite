import Phaser from 'phaser';
import { GameLog } from './game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from './layout.ts';
import { LocalGame, TICK_MS } from './local-game.ts';
import { CreateScene } from './scenes/CreateScene.ts';
import { playScenes } from './scenes/play.ts';

const log = new GameLog();
log.attach(window);

// A save opens straight on the board; no save opens the character screen, which makes the game and starts the board.
const storage = window.localStorage;
const saved = LocalGame.load(storage);
log.note(saved ? `loaded: ${saved.me.name} the ${saved.me.classId} on ${saved.me.space}, seed ${saved.state.seed}` : 'no save: the character screen');

const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  backgroundColor: COLORS.background,
  banner: false,
  dom: { createContainer: true }, // the name field on the character screen
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: saved
    ? playScenes(saved, log).map((s) => s.scene)
    : [new CreateScene({ log, storage, onCreated: (game) => (window.boardWorld.game = game) })],
});

// For the browser pane and the tools in tools/: drive the game from a script, read the log. `game` is null on the
// character screen.
declare global {
  interface Window {
    boardWorld: { game: LocalGame | null; log: GameLog; phaser: Phaser.Game };
  }
}
window.boardWorld = { game: saved, log, phaser };

// The world ticks once a minute while the page is open, and when it comes back to the front: spawns come and go.
const tick = (): void => {
  const game = window.boardWorld.game;
  if (!game) return;
  const events = game.tick();
  for (const e of events) log.note(e.type === 'spawned' ? `spawned ${e.spawn.kind} at ${e.space}` : e.type === 'despawned' ? `despawned at ${e.space}` : e.type);
};
window.setInterval(tick, TICK_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') tick();
});
if (saved) tick();
