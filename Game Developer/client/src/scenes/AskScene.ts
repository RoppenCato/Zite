// A question in a window (Robin, 2026-11-01: "A quest should show up in a window and look nicer. This way its hard to
// realise if anything happend even"): an errand offered, the gambler, a level's pick of abilities, a piece with no room in
// the bag. The world dims and waits; the answer is a big button. The board opens it (`BoardScene.ask`) and closes it when
// an answer goes out.

import Phaser from 'phaser';
import { feel, sfx } from '../feel.ts';
import { hasFrame, icon, INK, INK_DIM, kitReady, plate, veil } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, VIEW_HEIGHT, SCREEN_WIDTH, HUD_PLANK } from '../layout.ts';
import { settings } from '../settings.ts';
import { makeButton } from '../ui.ts';

export interface AskOption {
  label: string;
  color: number;
  onTap: () => void;
  /** Words about this answer, over its button: what an ability does. */
  note?: string;
}

export interface AskRequest {
  icon?: string;
  /** The rays and the sparkle behind the icon. */
  color: number;
  title: string;
  text: string;
  /** A bold line under the text: what it pays. */
  pays?: string;
  options: AskOption[];
}

const CENTRE = DESIGN_WIDTH / 2;
const WIDTH = DESIGN_WIDTH - 36;
const INNER = WIDTH - 52;
const BUTTON_H = 56;

export class AskScene extends Phaser.Scene {
  private request!: AskRequest;

  constructor() {
    super('ask');
  }

  init(data: AskRequest): void {
    this.request = data;
  }

  create(): void {
    const r = this.request;
    const kit = kitReady(this);
    const ink = kit ? INK : COLORS.text;
    const inkDim = kit ? INK_DIM : COLORS.dim;
    const quick = settings.get().fewerEffects;
    const dim = veil(this, 0x0a0c14, quick ? 0.72 : 0);
    if (!quick) this.tweens.add({ targets: dim, fillAlpha: 0.72, duration: 160 });

    // Laid out from the top down, then centred in the band.
    const parts: Phaser.GameObjects.GameObject[] = [];
    let y = 26;
    const hasIcon = !!r.icon && hasFrame(this, r.icon);
    const iconY = y + 34;
    if (hasIcon) y += 76;
    const title = this.add.text(0, y, r.title, { fontFamily: FONT_DISPLAY, fontSize: '23px', fontStyle: 'bold', color: ink, align: 'center', wordWrap: { width: INNER } }).setOrigin(0.5, 0);
    y += title.height + 8;
    const text = this.add.text(0, y, r.text, { fontFamily: FONT, fontSize: '16px', color: ink, align: 'center', wordWrap: { width: INNER }, lineSpacing: 2 }).setOrigin(0.5, 0);
    y += text.height + 8;
    parts.push(title, text);
    if (r.pays) {
      const pays = this.add.text(0, y, r.pays, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: '#7a5206', align: 'center', wordWrap: { width: INNER } }).setOrigin(0.5, 0);
      parts.push(pays);
      y += pays.height + 8;
    }
    y += 6;
    const buttons: Phaser.GameObjects.GameObject[] = [];
    for (const o of r.options) {
      if (o.note) {
        const note = this.add.text(0, y, o.note, { fontFamily: FONT, fontSize: '14px', color: inkDim, align: 'center', wordWrap: { width: INNER } }).setOrigin(0.5, 0);
        parts.push(note);
        y += note.height + 4;
      }
      buttons.push(makeButton(this, 0, y + BUTTON_H / 2, INNER, BUTTON_H, o.label, o.color, '20px', o.onTap).button);
      y += BUTTON_H + 8;
    }
    const height = y + 16;
    const back: Phaser.GameObjects.GameObject = kit ? plate(this, 'panel_sheet', 0, height / 2, WIDTH, height) : this.add.rectangle(0, height / 2, WIDTH, height, COLORS.panel, 1).setStrokeStyle(2, r.color);
    const top = Math.max(HUD_HEIGHT + 8, HUD_HEIGHT + (VIEW_HEIGHT - height) / 2);
    const window = this.add.container(CENTRE, top, [back, ...parts, ...buttons]);
    if (hasIcon) {
      const pic = icon(this, r.icon!, 0, iconY).setScale(1.2);
      window.add(pic);
      if (!quick) {
        this.tweens.add({ targets: pic, scale: 1.4, duration: 170, yoyo: true, delay: 200, ease: 'Quad.easeOut' });
        this.time.delayedCall(220, () => feel.sparkle(this, CENTRE, top + iconY, r.color, 60, 10));
      }
    }
    if (!quick) {
      // It pops in about its own middle.
      window.setY(top + height * 0.08).setScale(0.86).setAlpha(0);
      this.tweens.add({ targets: window, y: top, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    }
    feel.buzz(12);
    sfx.play('ui/pick-appear');
  }
}
