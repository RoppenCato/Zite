// Small pieces of chrome shared by the scenes. Shapes and labels only; the art comes later.

import Phaser from 'phaser';
import { COLORS, FONT } from './layout.ts';

export interface Button {
  button: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
}

/** A rounded button that presses in a little and calls `onTap` on the press (so it answers at once on a phone). */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  color: number,
  fontSize: string,
  onTap: () => void,
): Button {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  const label = scene.add
    .text(0, 0, text, { fontFamily: FONT, fontSize, fontStyle: 'bold', color: color === COLORS.button ? COLORS.buttonText : COLORS.text })
    .setOrigin(0.5);
  const button = scene.add.container(x, y, [g, label]).setSize(w, h);
  button.setInteractive({ useHandCursor: true });
  button.on('pointerdown', () => {
    scene.tweens.add({ targets: button, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
    onTap();
  });
  return { button, label };
}

/** A horizontal bar whose fill shrinks from the right: HP. `set` moves the fill, tweened unless `now`. */
export class Bar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private readonly label: string;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color: number, depth = 0, label = 'HP') {
    this.scene = scene;
    this.label = label;
    scene.add.rectangle(x, y, w, h, 0x2b3245, 1).setDepth(depth);
    this.fill = scene.add.rectangle(x - w / 2, y, w, h, color, 1).setOrigin(0, 0.5).setDepth(depth + 1);
    this.text = scene.add
      .text(x, y, '', { fontFamily: FONT, fontSize: h < 16 ? '11px' : '13px', fontStyle: 'bold', color: COLORS.text })
      .setOrigin(0.5)
      .setDepth(depth + 2);
  }

  set(value: number, max: number, now = false): void {
    const scaleX = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    this.text.setText(`${this.label} ${value}/${max}`);
    this.scene.tweens.killTweensOf(this.fill);
    if (now) this.fill.setScale(scaleX, 1);
    else this.scene.tweens.add({ targets: this.fill, scaleX, duration: 220, ease: 'Quad.easeOut' });
  }
}
