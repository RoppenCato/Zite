// Small pieces of chrome shared by the scenes, drawn from the UI kit (kit.ts, Mitch, AD, 2026-11-01) when it is loaded
// and as shapes when it is not. Every button has the press feel (feel.ts): it swaps to its pressed face and squashes on
// touch, answers at once, pops back on release, buzzes and ticks.

import Phaser from 'phaser';
import { feel, sfx } from './feel.ts';
import { CREAM, fx, INK, KIT, kitReady, plate, resizePlate } from './kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY } from './layout.ts';
import { settings } from './settings.ts';

export interface Button {
  button: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  /** Dim or wake the button (the kit's dim face; the shapes fade). A dim button does nothing but say no, unless `live`: Roll still answers "tap a lit spot". */
  setEnabled(on: boolean, live?: boolean): void;
  /** The picture on the button, when it has one. */
  icon?: Phaser.GameObjects.Image;
}

type ButtonKind = 'action' | 'plain' | 'danger';

/** Which of the kit's three buttons a colour asks for: green is the action, red the danger, the rest plain (tinted when coloured). */
function kindOf(color: number): { kind: ButtonKind; tint: number | null } {
  if (color === COLORS.button) return { kind: 'action', tint: null };
  if (color === 0xd9534f || color === 0xc0392b) return { kind: 'danger', tint: null };
  if (color === COLORS.log || color === COLORS.panel) return { kind: 'plain', tint: null };
  return { kind: 'plain', tint: color };
}

/** A button that squashes on the press, calls `onTap` at once (so it answers within a frame), and pops on release. */
/** How wide the message box is now that a button stands on each side of it. */
export const MESSAGE_BOX_W = 320;

/**
 * A small button on each side of the message box, opening the last messages (Robin, 2026-11-02: "the what just happend box seem
 * easy to accidently press. Maybe there should be a button on the side of it instead... Like a button on each side?").
 */
export function logButtons(scene: Phaser.Scene, y: number): void {
  for (const x of [24, DESIGN_WIDTH - 24]) {
    const { button } = makeButton(scene, x, y, 36, 44, kitReady(scene) ? '' : '…', COLORS.log, '18px', () => scene.scene.launch('log'));
    if (kitReady(scene)) button.add(scene.add.image(0, -2, KIT, 'mark_scroll').setScale(0.38));
  }
}

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
  opts: { small?: boolean; labelY?: number; icon?: { frame: string; y: number; size: number; atlas?: string } } = {},
): Button {
  if (!kitReady(scene)) return shapeButton(scene, x, y, w, h, text, color, fontSize, onTap);
  const { kind, tint } = kindOf(color);
  const big = !opts.small && h >= 50;
  const labelY = opts.labelY ?? 0;
  const corner = big ? 22 : 18;
  const height = Math.max(h, corner * 2);
  const width = Math.max(w, corner * 2);
  const frame = (state: 'idle' | 'pressed' | 'dim') => `btn_${kind}_${big ? 'big' : 'small'}_${state}`;
  const face = plate(scene, frame('idle'), 0, 0, width, height);
  if (tint !== null) face.setTint(tint);
  const label = scene.add.text(0, labelY - 3, text, { fontFamily: FONT_DISPLAY, fontSize, fontStyle: 'bold', color: CREAM, stroke: '#2a2030', strokeThickness: 3, align: 'center' }).setOrigin(0.5);
  for (let px = parseInt(fontSize, 10); px > 13 && label.width > width - 14; px--) label.setFontSize(`${px}px`);
  const icon = opts.icon && scene.textures.exists(opts.icon.atlas ?? KIT) ? scene.add.image(0, opts.icon.y - 3, opts.icon.atlas ?? KIT, opts.icon.frame).setDisplaySize(opts.icon.size, opts.icon.size) : undefined;
  const button = scene.add.container(x, y, icon ? [face, icon, label] : [face, label]).setSize(width, height);
  button.setInteractive({ useHandCursor: true });
  let enabled = true;
  let live = false;
  const show = (state: 'idle' | 'pressed' | 'dim') => {
    face.setFrame(frame(state));
    const shift = state === 'pressed' ? 3 : -3;
    label.setY(labelY + shift);
    if (icon && opts.icon) icon.setY(opts.icon.y + shift);
  };
  button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (enabled) show('pressed');
    feel.press(scene, button);
    feel.buzz();
    if (!enabled && !live) {
      sfx.play('ui/tap-denied');
      return;
    }
    sfx.play('ui/tap');
    if (!settings.get().fewerEffects) fx(scene, 'fx_tap', pointer.worldX, pointer.worldY, tint ?? (kind === 'action' ? 0xb8f09a : kind === 'danger' ? 0xffb0a0 : 0xe2d6ff), 500, 0.8);
    onTap();
  });
  const up = () => {
    show(enabled ? 'idle' : 'dim');
    feel.release(scene, button);
  };
  button.on('pointerup', up);
  button.on('pointerout', up);
  return {
    button,
    label,
    ...(icon ? { icon } : {}),
    setEnabled: (on: boolean, stays = false) => {
      enabled = on;
      live = stays;
      show(on ? 'idle' : 'dim');
    },
  };
}

/** The button as a shape, for a scene that runs before the kit is loaded. */
function shapeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, color: number, fontSize: string, onTap: () => void): Button {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  const label = scene.add
    .text(0, 0, text, { fontFamily: FONT, fontSize, fontStyle: 'bold', color: color === COLORS.button ? COLORS.buttonText : COLORS.text })
    .setOrigin(0.5);
  const button = scene.add.container(x, y, [g, label]).setSize(w, h);
  button.setInteractive({ useHandCursor: true });
  button.on('pointerdown', () => {
    feel.press(scene, button);
    feel.buzz();
    sfx.play('ui/tap');
    onTap();
  });
  button.on('pointerup', () => feel.release(scene, button));
  button.on('pointerout', () => feel.release(scene, button));
  return { button, label, setEnabled: (on) => button.setAlpha(on ? 1 : 0.4) };
}

/**
 * A horizontal bar: HP (green) or MP (blue). From the kit: the frame, the fill that shrinks from the right, and the part
 * just lost draining away behind it, with the number over it. `set` moves the fill, tweened unless `now`.
 */
export class Bar {
  private readonly scene: Phaser.Scene;
  private readonly label: string;
  private readonly text: Phaser.GameObjects.Text;
  private readonly fill: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle;
  private readonly lost: Phaser.GameObjects.NineSlice | null;
  /** The fill's full width in design pixels, and its current share. */
  private readonly inner: number;
  private fillH = 10;
  private share = { fill: 1, lost: 1 };

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color: number, depth = 0, label = 'HP', opts: { small?: boolean; fontSize?: number } = {}) {
    this.scene = scene;
    this.label = label;
    const kit = kitReady(scene);
    if (kit) {
      const mp = color === COLORS.mana || label === 'MP';
      // The small frame is 11 tall with a 7 tall fill; the plain one 14 and 10.
      const small = !!opts.small;
      this.fillH = small ? 7 : 10;
      plate(scene, small ? 'bar_frame_s' : 'bar_frame', x, y, w, small ? 11 : 14).setDepth(depth);
      this.inner = w - 4;
      const left = x - w / 2 + 2;
      this.lost = plate(scene, small ? 'bar_lost_s' : 'bar_lost', left, y, this.inner, this.fillH).setOrigin(0, 0.5).setDepth(depth + 1);
      this.fill = plate(scene, mp ? (small ? 'bar_mp_s' : 'bar_mp') : 'bar_hp', left, y, this.inner, this.fillH).setOrigin(0, 0.5).setDepth(depth + 2);
      this.text = scene.add
        .text(x, y, '', { fontFamily: FONT_DISPLAY, fontSize: `${opts.fontSize ?? 13}px`, fontStyle: 'bold', color: '#ffffff', stroke: INK, strokeThickness: (opts.fontSize ?? 13) < 13 ? 3 : 4 })
        .setOrigin(0.5)
        .setDepth(depth + 3);
      return;
    }
    scene.add.rectangle(x, y, w, h, 0x2b3245, 1).setDepth(depth);
    this.inner = w;
    this.lost = null;
    this.fill = scene.add.rectangle(x - w / 2, y, w, h, color, 1).setOrigin(0, 0.5).setDepth(depth + 1);
    this.text = scene.add
      .text(x, y, '', { fontFamily: FONT, fontSize: h < 16 ? '11px' : '13px', fontStyle: 'bold', color: COLORS.text })
      .setOrigin(0.5)
      .setDepth(depth + 2);
  }

  set(value: number, max: number, now = false): void {
    const target = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    const line = this.label ? `${this.label} ${value}/${max}` : `${value}/${max}`;
    if (this.text.text && this.text.text !== line && !now) feel.tick(this.scene, this.text);
    this.text.setText(line);
    this.scene.tweens.killTweensOf(this.share);
    if (now) {
      this.share.fill = target;
      this.share.lost = target;
      this.apply();
      return;
    }
    // The fill moves at once; what was lost lingers behind it for a beat and drains.
    const dropped = target < this.share.fill;
    this.share.fill = target;
    if (!dropped) this.share.lost = target;
    this.apply();
    this.scene.tweens.add({ targets: this.share, lost: target, delay: dropped ? 260 : 0, duration: 320, ease: 'Quad.easeOut', onUpdate: () => this.apply() });
  }

  private apply(): void {
    const w = (share: number) => Math.max(share > 0 ? 6 : 0, this.inner * share);
    if (this.fill instanceof Phaser.GameObjects.Rectangle) {
      this.fill.setScale(this.share.fill, 1);
      return;
    }
    const f = w(this.share.fill);
    this.fill.setVisible(f > 0);
    if (f > 0) resizePlate(this.fill, f, this.fillH);
    if (this.lost) {
      const l = w(Math.max(this.share.lost, this.share.fill));
      this.lost.setVisible(l > 0);
      if (l > 0) resizePlate(this.lost, l, this.fillH);
    }
  }
}
