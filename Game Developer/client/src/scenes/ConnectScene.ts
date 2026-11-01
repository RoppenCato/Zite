// The first screen when this phone has an account on the server: "connecting…" until the snapshot comes, then the board.
// It tries again on its own, forever (shared-world rule 7); a player who cannot wait can play offline meanwhile, and one
// whose account the server no longer knows can start over. Layout mine (2026-11-01).

import Phaser from 'phaser';
import { WORLD_DATA } from '../../../rules/src/index.ts';
import type { GameHolder } from '../game-holder.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT } from '../layout.ts';
import { makeButton } from '../ui.ts';
import { playScenes } from './play.ts';

export interface ConnectSceneDeps {
  log: GameLog;
  /** The server, for the screen. */
  where: string;
  /** One try: resolves with the game once the snapshot is in; rejects with a reason. */
  attempt: () => Promise<GameHolder>;
  /** Play on this phone alone meanwhile; absent when there is nothing local to play. */
  offline: ((scene: Phaser.Scene) => void) | null;
  /** This phone's account is gone from the server: forget it and make a new character. */
  startOver: (scene: Phaser.Scene) => void;
  onConnected: (game: GameHolder) => void;
}

const CENTRE = DESIGN_WIDTH / 2;
const RETRY_S = [1, 2, 4, 8, 15];

export const CONNECT_LAYOUT = {
  offline: { x: CENTRE, y: 560, w: 240, h: 48 },
  startOver: { x: CENTRE, y: 560, w: 240, h: 48 },
} as const;

export class ConnectScene extends Phaser.Scene {
  private readonly deps: ConnectSceneDeps;
  private status!: Phaser.GameObjects.Text;
  private tries = 0;
  private done = false;
  private startOverButton: Phaser.GameObjects.Container | null = null;

  constructor(deps: ConnectSceneDeps) {
    super('connect');
    this.deps = deps;
  }

  create(): void {
    this.add.text(CENTRE, 240, WORLD_DATA.name, { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.add.text(CENTRE, 280, 'a board world', { fontFamily: FONT, fontSize: '16px', color: COLORS.dim }).setOrigin(0.5);
    this.add.text(CENTRE, 380, `Connecting to the world at\n${this.deps.where}`, { fontFamily: FONT, fontSize: '16px', color: COLORS.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } }).setOrigin(0.5);
    this.status = this.add.text(CENTRE, 450, '…', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } }).setOrigin(0.5);
    if (this.deps.offline) {
      const { offline } = CONNECT_LAYOUT;
      makeButton(this, offline.x, offline.y, offline.w, offline.h, 'Play offline for now', COLORS.log, '16px', () => this.deps.offline?.(this));
    }
    this.add.text(12, DESIGN_HEIGHT - 8, `build 0.2.0 · ${WORLD_DATA.name}`, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim }).setOrigin(0, 1).setAlpha(0.7);
    this.deps.log.note(`connect screen: ${this.deps.where}`);
    this.attempt();
  }

  private attempt(): void {
    if (this.done) return;
    this.tries += 1;
    this.deps
      .attempt()
      .then((game) => {
        if (this.done) return;
        this.done = true;
        this.deps.log.note(`connected on try ${this.tries}`);
        this.deps.onConnected(game);
        for (const { key, scene } of playScenes(game, this.deps.log)) this.scene.add(key, scene, false);
        this.scene.start('board');
      })
      .catch((e: unknown) => {
        if (this.done) return;
        const why = e instanceof Error ? e.message : String(e);
        if (why === 'unknown account') {
          this.status.setText('This phone\'s character is not known to the world any more.\nStart over with a new one, or use your code from another phone.');
          const { startOver } = CONNECT_LAYOUT;
          this.startOverButton ??= makeButton(this, startOver.x, startOver.y + 70, startOver.w, startOver.h, 'Start over', COLORS.button, '16px', () => this.deps.startOver(this)).button;
          return;
        }
        const wait = RETRY_S[Math.min(this.tries - 1, RETRY_S.length - 1)]!;
        this.status.setText(`${why === 'no connection' ? 'The world did not answer' : why}. Trying again in ${wait} s (try ${this.tries}).`);
        this.time.delayedCall(wait * 1000, () => this.attempt());
      });
  }
}
