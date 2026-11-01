// The moments (chapter 1, step 3): the level up, the boss down, the area opened, each a banner that lands over whatever
// is on screen (the board, a fight, the loot reveal), with a burst, a sound and a buzz, holds a moment and lifts away.
// This scene sits on top of all the others and takes no input, so it never gets in the way of a tap. Several moments in
// a row queue. Plates and text drawn by code until the UI kit's banners come (docs/art-demands.md, wave 1). Timings mine.

import Phaser from 'phaser';
import { audio } from '../audio.ts';
import { feel } from '../feel.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import { settings } from '../settings.ts';

interface Moment {
  title: string;
  line: string;
  /** The rim, the burst and the title's colour. */
  color: number;
  ink: string;
  sound: string;
  buzz: number;
  /** A swell grows in from small; a burst pops in with sparkles and a ring. */
  kind: 'burst' | 'swell';
  shake?: boolean;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where a banner rests: a third down the world band, clear of the fight's figures and the reveal's card. */
const BANNER_Y = HUD_HEIGHT + VIEW_HEIGHT * 0.3;
const PLATE = { w: 340, h: 86, r: 18 } as const;
const HOLD_MS = 1300;

export class MomentScene extends Phaser.Scene {
  private queue: Moment[] = [];
  private showing = false;

  constructor() {
    super('moment');
  }

  create(): void {
    this.input.enabled = false;
  }

  /** A level crossed: the new level and the new numbers. */
  levelUp(level: number, line: string): void {
    this.push({ title: `Level ${level}!`, line, color: 0xe8b84a, ink: '#ffe9a8', sound: 'ui/level-up', buzz: 30, kind: 'burst' });
  }

  /** A boss beaten. */
  bossDown(name: string): void {
    this.push({ title: `${name} is down!`, line: 'The way is clear.', color: 0xff7a5c, ink: '#ffd9cf', sound: 'ui/boss-down', buzz: 50, kind: 'burst', shake: true });
  }

  /** A new area opened. */
  opened(area: string): void {
    this.push({ title: `${area} opens`, line: 'New ground to walk.', color: 0x6fcf7a, ink: '#d6f5da', sound: 'ui/area-opened', buzz: 20, kind: 'swell' });
  }

  private push(m: Moment): void {
    this.queue.push(m);
    if (!this.showing) this.next();
  }

  private next(): void {
    const m = this.queue.shift();
    if (!m) {
      this.showing = false;
      return;
    }
    this.showing = true;
    this.show(m);
  }

  private show(m: Moment): void {
    const quick = settings.get().fewerEffects;
    audio.play(m.sound);
    feel.buzz(m.buzz);

    const plate = this.add.graphics();
    plate.fillStyle(COLORS.panel, 0.94);
    plate.fillRoundedRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
    plate.lineStyle(3, m.color, 1);
    plate.strokeRoundedRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
    const title = this.add.text(0, -12, m.title, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: m.ink }).setOrigin(0.5);
    for (let px = 28; px > 18 && title.width > PLATE.w - 40; px--) title.setFontSize(`${px}px`);
    const line = this.add.text(0, 22, m.line, { fontFamily: FONT, fontSize: '13px', color: COLORS.dim }).setOrigin(0.5);
    const banner = this.add.container(CENTRE, BANNER_Y, [plate, title, line]);

    const leave = () => {
      if (quick) {
        banner.destroy();
        this.next();
        return;
      }
      this.tweens.add({ targets: banner, alpha: 0, y: BANNER_Y - 30, duration: 220, ease: 'Quad.easeIn', onComplete: () => {
        banner.destroy();
        this.next();
      } });
    };

    if (quick) {
      this.time.delayedCall(HOLD_MS - 300, leave);
      return;
    }
    if (m.kind === 'burst') {
      banner.setScale(0.6).setAlpha(0);
      this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      feel.sparkle(this, CENTRE - 90, BANNER_Y, m.color, 60, 12);
      feel.sparkle(this, CENTRE + 90, BANNER_Y, m.color, 60, 12);
      this.ring(m.color);
      if (m.shake) this.cameras.main.shake(180, 0.004);
    } else {
      banner.setScale(0.85).setAlpha(0);
      this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 420, ease: 'Sine.easeOut' });
      this.ring(m.color, 700);
    }
    this.time.delayedCall(HOLD_MS, leave);
  }

  /** A ring that grows out of the banner and fades. */
  private ring(color: number, duration = 450): void {
    const ring = this.add.circle(CENTRE, BANNER_Y, 40).setStrokeStyle(4, color, 0.9).setDepth(55);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}

/** The moment scene from any scene of play, once it runs. */
export function moments(scene: Phaser.Scene): MomentScene | null {
  const m = scene.scene.get('moment') as MomentScene | null;
  return m && scene.scene.isActive('moment') ? m : null;
}
