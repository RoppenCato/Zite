import Phaser from 'phaser';
import { GameLog } from './game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from './layout.ts';
import { LocalGame } from './local-game.ts';
import { BoardScene } from './scenes/BoardScene.ts';
import { FightScene } from './scenes/FightScene.ts';
import { HudScene } from './scenes/HudScene.ts';

const log = new GameLog();
log.attach(window);

const game = LocalGame.load(window.localStorage);
log.note(`loaded: ${game.me.name} the ${game.me.classId} on ${game.me.space}, seed ${game.state.seed}`);

// The board scene starts first and launches the HUD scene over itself, so the HUD never scrolls or zooms with the world;
// the fight scene is launched over both when a fight begins and stopped when it ends.
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  backgroundColor: COLORS.background,
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [new BoardScene({ game, log }), new HudScene({ game, log }), new FightScene({ game, log })],
});

// For the browser pane and the tools in tools/: drive the game from a script, read the log.
declare global {
  interface Window {
    boardWorld: { game: LocalGame; log: GameLog; phaser: Phaser.Game };
  }
}
window.boardWorld = { game, log, phaser };
