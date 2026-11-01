// The moments (chapter 1, step 3): the level up, the boss down, the area opened, each a banner that lands over whatever
// is on screen (the board, a fight, the loot reveal), with a burst, a sound and a buzz, holds a moment and lifts away.
// This scene sits on top of all the others and takes no input, so it never gets in the way of a tap. Several moments in
// a row queue. Plates and text drawn by code until the UI kit's banners come (docs/art-demands.md, wave 1). Timings mine.

import Phaser from 'phaser';
import { audio } from '../audio.ts';
import { feel } from '../feel.ts';
import { INK, KIT_SOFT, kitReady, plate } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
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
  /** The kit's banner for it, and whether its words are ink (on parchment) or cream. */
  banner: 'banner_level' | 'banner_boss' | 'banner_area';
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where a banner rests: a third down the world band, clear of the fight's figures and the reveal's card. */
const BANNER_Y = HUD_HEIGHT + VIEW_HEIGHT * 0.3;
const PLATE = { w: 360, h: 80, r: 18 } as const;
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
    this.push({ title: `Level ${level}!`, line, color: 0xe8b84a, ink: '#ffe9a8', sound: 'ui/level-up', buzz: 30, kind: 'burst', banner: 'banner_level' });
  }

  /** A boss beaten. */
  bossDown(name: string): void {
    this.push({ title: `${name} is down!`, line: 'The way is clear.', color: 0xff7a5c, ink: '#ffd9cf', sound: 'ui/boss-down', buzz: 50, kind: 'burst', shake: true, banner: 'banner_boss' });
  }

  /** A new area opened. */
  opened(area: string): void {
    this.push({ title: `${area} opens`, line: 'New ground to walk.', color: 0x6fcf7a, ink: '#d6f5da', sound: 'ui/area-opened', buzz: 20, kind: 'swell', banner: 'banner_area' });
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

    const kit = kitReady(this);
    let back: Phaser.GameObjects.GameObject;
    if (kit) back = plate(this, m.banner, 0, 0, PLATE.w, PLATE.h);
    else {
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 0.94);
      g.fillRoundedRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
      g.lineStyle(3, m.color, 1);
      g.strokeRoundedRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
      back = g;
    }
    const inkTitle = kit ? (m.banner === 'banner_level' ? INK : '#f7efdc') : m.ink;
    const inkLine = kit ? (m.banner === 'banner_level' ? '#6b5a60' : '#e9dcc4') : COLORS.dim;
    const title = this.add.text(0, kit ? -12 : -12, m.title, { fontFamily: FONT_DISPLAY, fontSize: kit ? '26px' : '28px', fontStyle: 'bold', color: inkTitle }).setOrigin(0.5);
    for (let px = 28; px > 18 && title.width > PLATE.w - 60; px--) title.setFontSize(`${px}px`);
    const line = this.add.text(0, kit ? 10 : 20, m.line, { fontFamily: FONT, fontSize: kit ? '11px' : '13px', color: inkLine }).setOrigin(0.5);
    const banner = this.add.container(CENTRE, BANNER_Y, [back, title, line]);
    if (kit && m.banner === 'banner_level' && !quick) {
      const burst = this.add.image(CENTRE, BANNER_Y, KIT_SOFT, 'burst_levelup').setScale(0.2).setTint(0xffd166).setBlendMode(Phaser.BlendModes.ADD).setDepth(-1);
      this.tweens.add({ targets: burst, scale: 1.3, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => burst.destroy() });
    }

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
