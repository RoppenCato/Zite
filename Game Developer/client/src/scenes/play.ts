// The three scenes of play, made together once there is a game: the board starts, launches the HUD, and opens the fight
// when one begins. main.ts starts them straight from a save; CreateScene adds them after the character is made.

import type { GameLog } from '../game-log.ts';
import type { LocalGame } from '../local-game.ts';
import { BoardScene } from './BoardScene.ts';
import { FightScene } from './FightScene.ts';
import { HudScene } from './HudScene.ts';

export function playScenes(game: LocalGame, log: GameLog): { key: string; scene: Phaser.Scene }[] {
  return [
    { key: 'board', scene: new BoardScene({ game, log }) },
    { key: 'hud', scene: new HudScene({ game, log }) },
    { key: 'fight', scene: new FightScene({ game, log }) },
  ];
}
