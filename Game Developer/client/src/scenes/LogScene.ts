// The last messages (Robin, 2026-11-02: "touching the text where it describes what just happend should open up a window showing
// the last 5 messages"). The newest at the bottom; a tap anywhere closes it. Opened from the HUD's and the fight's message box.

import Phaser from 'phaser';
import { sfx } from '../feel.ts';
import { INK, INK_DIM, kitReady, plate } from '../kit.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, SCREEN_WIDTH } from '../layout.ts';
import { lastMessages } from '../messages.ts';

const CENTRE = DESIGN_WIDTH / 2;
const WIDTH = DESIGN_WIDTH - 36;

export class LogScene extends Phaser.Scene {
  constructor() {
    super('log');
  }

  create(): void {
    const kit = kitReady(this);
    const ink = kit ? INK : COLORS.text;
    const dim = kit ? INK_DIM : COLORS.dim;
    this.add.rectangle(CENTRE, DESIGN_HEIGHT / 2, SCREEN_WIDTH, DESIGN_HEIGHT, 0x0a0c14, 0.6).setInteractive().on('pointerup', () => this.close());
    const lines = lastMessages(5);
    const parts: Phaser.GameObjects.GameObject[] = [];
    let y = 22;
    parts.push(this.add.text(0, y, 'What just happened', { fontFamily: FONT_DISPLAY, fontSize: '20px', fontStyle: 'bold', color: ink }).setOrigin(0.5, 0));
    y += 36;
    if (!lines.length) {
      parts.push(this.add.text(0, y, 'Nothing yet.', { fontFamily: FONT, fontSize: '15px', color: dim }).setOrigin(0.5, 0));
      y += 26;
    }
    lines.forEach((line, i) => {
      const newest = i === lines.length - 1;
      const text = this.add.text(0, y, line, { fontFamily: FONT, fontSize: '15px', fontStyle: newest ? 'bold' : 'normal', color: newest ? ink : dim, align: 'center', wordWrap: { width: WIDTH - 52 } }).setOrigin(0.5, 0);
      parts.push(text);
      y += text.height + 10;
    });
    parts.push(this.add.text(0, y + 4, 'Tap to close', { fontFamily: FONT, fontSize: '13px', color: dim }).setOrigin(0.5, 0));
    const height = y + 34;
    const back = kit ? plate(this, 'panel_sheet', 0, height / 2, WIDTH, height) : this.add.rectangle(0, height / 2, WIDTH, height, COLORS.panel, 1);
    this.add.container(CENTRE, (DESIGN_HEIGHT - height) / 2, [back, ...parts]);
    sfx.play('ui/log-open');
  }

  private close(): void {
    sfx.play('ui/sheet-close');
    this.scene.stop();
  }
}
