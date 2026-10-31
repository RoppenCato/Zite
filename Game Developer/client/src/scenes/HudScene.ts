// The fixed chrome over the world: the top panel (name, HP, gold, current space, the die box), the message line and
// the Map, Roll and Log buttons at the bottom. It is its own scene so the world camera can scroll and zoom under it.
// It decides nothing: the buttons call the board scene, and the board scene tells it what to show.

import Phaser from 'phaser';
import { CLASS_DATA, ISLAND_DATA } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, HUD_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface HudSceneDeps {
  game: LocalGame;
  log: GameLog;
}

/** Where the bottom buttons sit, in design pixels (the pane's scripts tap them here). */
export const BUTTONS = {
  map: { x: 50, y: 862, w: 72, h: 50 },
  roll: { x: 206, y: 862, w: 220, h: 66 },
  log: { x: 362, y: 862, w: 72, h: 50 },
} as const;
const MESSAGE_Y = 795;

export class HudScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private stats!: Phaser.GameObjects.Text;
  private dieText!: Phaser.GameObjects.Text;
  private dieBox!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private rollButton!: Phaser.GameObjects.Container;
  private mapLabel!: Phaser.GameObjects.Text;

  constructor(deps: HudSceneDeps) {
    super('hud');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.drawPanel();
    this.drawControls();
    const board = this.scene.get('board') as BoardScene;
    board.hudReady(this);
    this.log.note('hud ready');
  }

  // ---- what the board scene tells us ------------------------------------------------------------------------------

  /** The line under the name: HP, gold and the current space. */
  setStats(line: string): void {
    this.stats.setText(line);
  }

  /** The number in the die box; `pulse` gives it a small bounce for a fresh roll. */
  setDie(text: string, pulse = false): void {
    this.dieText.setText(text);
    if (pulse) this.tweens.add({ targets: this.dieBox, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }

  setMessage(text: string): void {
    this.message.setText(text);
  }

  /** While the player is choosing or the token walks, the Roll button is dimmed. */
  setBusy(busy: boolean): void {
    this.rollButton.setAlpha(busy ? 0.5 : 1);
  }

  /** The Map button reads "Map" while the camera follows the character and "Back" when it has been moved away. */
  setFollowing(following: boolean): void {
    this.mapLabel.setText(following ? 'Map' : 'Back');
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------

  private drawPanel(): void {
    this.add.rectangle(DESIGN_WIDTH / 2, HUD_HEIGHT / 2, DESIGN_WIDTH, HUD_HEIGHT, COLORS.panel, 1);
    const me = this.game_.me;
    this.add.text(16, 20, `${me.name} the ${CLASS_DATA[me.classId].name}`, {
      fontFamily: FONT,
      fontSize: '19px',
      fontStyle: 'bold',
      color: COLORS.text,
    });
    this.stats = this.add.text(16, 50, '', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim });

    const box = this.add.graphics();
    box.fillStyle(0xe8e4d8, 1);
    box.fillRoundedRect(-28, -28, 56, 56, 10);
    this.dieText = this.add
      .text(0, 0, '–', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#101318' })
      .setOrigin(0.5);
    this.dieBox = this.add.container(DESIGN_WIDTH - 48, HUD_HEIGHT / 2, [box, this.dieText]);
  }

  private drawControls(): void {
    // A dark strip under the message and the buttons, so the world never shows through there.
    const stripTop = MESSAGE_Y - 20;
    this.add.rectangle(DESIGN_WIDTH / 2, (stripTop + DESIGN_HEIGHT) / 2, DESIGN_WIDTH, DESIGN_HEIGHT - stripTop, COLORS.panel, 1);

    this.message = this.add
      .text(DESIGN_WIDTH / 2, MESSAGE_Y, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: COLORS.text,
        align: 'center',
        wordWrap: { width: DESIGN_WIDTH - 40 },
      })
      .setOrigin(0.5, 0);

    const board = (): BoardScene => this.scene.get('board') as BoardScene;
    const { map, roll, log } = BUTTONS;
    this.mapLabel = makeButton(this, map.x, map.y, map.w, map.h, 'Map', COLORS.log, '17px', () => board().toggleMap()).label;
    this.rollButton = makeButton(this, roll.x, roll.y, roll.w, roll.h, 'Roll', COLORS.button, '26px', () => board().roll()).button;
    makeButton(this, log.x, log.y, log.w, log.h, 'Log', COLORS.log, '17px', () => board().downloadLog());

    this.add
      .text(12, DESIGN_HEIGHT - 8, `build 0.1.0 · ${ISLAND_DATA.name} · seed ${this.game_.state.seed.slice(0, 8)}`, {
        fontFamily: FONT,
        fontSize: '11px',
        color: COLORS.dim,
      })
      .setOrigin(0, 1)
      .setAlpha(0.7);
  }
}
