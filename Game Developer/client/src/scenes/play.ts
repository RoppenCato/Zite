// The scenes of play, made together once there is a game: the board starts, launches the HUD, and opens the fight,
// the shop, the bag or the loot reveal over both when one begins; the moments scene sits over everything for its banners. main.ts starts them straight from a save; CreateScene adds them after
// the character is made.

import type { GameLog } from '../game-log.ts';
import type { GameHolder } from '../game-holder.ts';
import { AtlasScene } from './AtlasScene.ts';
import { AskScene } from './AskScene.ts';
import { BagScene } from './BagScene.ts';
import { BoardScene } from './BoardScene.ts';
import { FightScene } from './FightScene.ts';
import { GuideScene } from './GuideScene.ts';
import { HudScene } from './HudScene.ts';
import { MomentScene } from './MomentScene.ts';
import { RevealScene } from './RevealScene.ts';
import { ShopScene } from './ShopScene.ts';

export function playScenes(game: GameHolder, log: GameLog): { key: string; scene: Phaser.Scene }[] {
  return [
    { key: 'board', scene: new BoardScene({ game, log }) },
    { key: 'hud', scene: new HudScene({ game, log }) },
    { key: 'fight', scene: new FightScene({ game, log }) },
    { key: 'shop', scene: new ShopScene({ game, log }) },
    { key: 'bag', scene: new BagScene({ game, log }) },
    { key: 'atlas', scene: new AtlasScene({ game, log }) },
    { key: 'reveal', scene: new RevealScene({ log }) },
    { key: 'ask', scene: new AskScene() },
    { key: 'guide', scene: new GuideScene({ game }) },
    { key: 'moment', scene: new MomentScene() },
  ];
}
