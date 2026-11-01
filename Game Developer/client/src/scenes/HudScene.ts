// The fixed chrome over the world: the top panel (name, level, HP, mana, gold, where you are, the die box), a row of
// chips (dice cards while a roll is pending, the gambler's question), the message line, and the Map, World, Bag, Log
// and Roll buttons. It is its own scene so the world camera can scroll and zoom under it. It decides nothing: the buttons call
// the board scene, and the board scene tells it what to show.

import Phaser from 'phaser';
import { CLASS_DATA, WORLD_DATA } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { settings } from '../settings.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface HudSceneDeps {
  game: LocalGame;
  log: GameLog;
}

/** Where the buttons sit, in design pixels (the pane's scripts tap them here). */
export const BUTTONS = {
  map: { x: 60, y: 836, w: 90, h: 36 },
  world: { x: 158, y: 836, w: 90, h: 36 },
  bag: { x: 256, y: 836, w: 90, h: 36 },
  log: { x: 354, y: 836, w: 90, h: 36 },
  roll: { x: 206, y: 884, w: 300, h: 52 },
} as const;
const MESSAGE_Y = 776;
/** The row of chips, between the band and the message line. */
export const CHIPS_Y = 754;

/** A chip in the row: a dice card held, a number for Exactly N, an answer to the gambler. */
export interface Chip {
  text: string;
  onTap: () => void;
}

export class HudScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private name!: Phaser.GameObjects.Text;
  private stats!: Phaser.GameObjects.Text;
  private place!: Phaser.GameObjects.Text;
  private dieText!: Phaser.GameObjects.Text;
  private dieBox!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private rollButton!: Phaser.GameObjects.Container;
  private mapLabel!: Phaser.GameObjects.Text;
  private chipRow!: Phaser.GameObjects.Container;

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

  /** The two lines under the name: the numbers, and where you are. */
  setStats(numbers: string, place: string): void {
    this.stats.setText(numbers);
    this.place.setText(place);
    const me = this.game_.me;
    this.name.setText(`${me.name} the ${CLASS_DATA[me.classId].name}`);
  }

  /** The number in the die box; `pulse` gives it a small bounce for a fresh roll. */
  setDie(text: string, pulse = false): void {
    this.dieText.setText(text);
    if (pulse) this.tweens.add({ targets: this.dieBox, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }

  setMessage(text: string): void {
    this.message.setText(text);
  }

  /** While the player is choosing, walking, fighting or shopping, the Roll button is dimmed. */
  setBusy(busy: boolean): void {
    this.rollButton.setAlpha(busy ? 0.5 : 1);
  }

  /** The Map button reads "Map" while the camera follows the character and "Back" when it has been moved away. */
  setFollowing(following: boolean): void {
    this.mapLabel.setText(following ? 'Map' : 'Back');
  }

  /** The chips to show in the row; an empty list clears it. */
  setChips(chips: Chip[]): void {
    this.chipRow.removeAll(true);
    const widths = chips.map((c) => Math.max(36, c.text.length * 9 + 22));
    const gap = 8;
    let x = -(widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1)) / 2;
    chips.forEach((chip, i) => {
      const w = widths[i]!;
      const { button } = makeButton(this, x + w / 2, 0, w, 30, chip.text, 0x8e6ad9, '14px', chip.onTap);
      this.chipRow.add(button);
      x += w + gap;
    });
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------

  private drawPanel(): void {
    this.add.rectangle(DESIGN_WIDTH / 2, HUD_HEIGHT / 2, DESIGN_WIDTH, HUD_HEIGHT, COLORS.panel, 1);
    this.name = this.add.text(16, 14, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: COLORS.text });
    this.stats = this.add.text(16, 44, '', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim });
    this.place = this.add.text(16, 68, '', { fontFamily: FONT, fontSize: '13px', color: COLORS.dim });

    const box = this.add.graphics();
    box.fillStyle(0xe8e4d8, 1);
    box.fillRoundedRect(-28, -28, 56, 56, 10);
    this.dieText = this.add
      .text(0, 0, '–', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#101318' })
      .setOrigin(0.5);
    this.dieBox = this.add.container(DESIGN_WIDTH - 48, HUD_HEIGHT / 2, [box, this.dieText]);
  }

  private drawControls(): void {
    // A dark strip under the chips, the message and the buttons, so the world never shows through there.
    const stripTop = HUD_HEIGHT + VIEW_HEIGHT;
    this.add.rectangle(DESIGN_WIDTH / 2, (stripTop + DESIGN_HEIGHT) / 2, DESIGN_WIDTH, DESIGN_HEIGHT - stripTop, COLORS.panel, 1);
    this.chipRow = this.add.container(DESIGN_WIDTH / 2, CHIPS_Y);

    this.message = this.add
      .text(DESIGN_WIDTH / 2, MESSAGE_Y, '', {
        fontFamily: FONT,
        fontSize: settings.font(15),
        color: COLORS.text,
        align: 'center',
        wordWrap: { width: DESIGN_WIDTH - 32 },
      })
      .setOrigin(0.5, 0);

    const board = (): BoardScene => this.scene.get('board') as BoardScene;
    const { map, world, bag, log, roll } = BUTTONS;
    this.mapLabel = makeButton(this, map.x, map.y, map.w, map.h, 'Map', COLORS.log, '16px', () => board().toggleMap()).label;
    makeButton(this, world.x, world.y, world.w, world.h, 'World', COLORS.log, '16px', () => board().openAtlas());
    makeButton(this, bag.x, bag.y, bag.w, bag.h, 'Bag', COLORS.log, '16px', () => board().openBag());
    makeButton(this, log.x, log.y, log.w, log.h, 'Log', COLORS.log, '16px', () => board().downloadLog());
    this.rollButton = makeButton(this, roll.x, roll.y, roll.w, roll.h, 'Roll', COLORS.button, '24px', () => board().roll()).button;
    this.log.note(`build 0.2.0 · ${WORLD_DATA.name} · seed ${this.game_.state.seed.slice(0, 8)}`);
  }
}
