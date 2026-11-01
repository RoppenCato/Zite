// The loot reveal (Robin, 2026-11-01: "a nice interface for when you find a chest. With it glowing in different rarity
// colors, and a nice animation when opening. The aim is dopamine hits."). A screen over the board for every chest, vault
// and boss drop: the chest glows in the colour of its best prize while the glow builds, opens (Mitch, AD's clip), bursts
// into sparkles and petals of that colour on the frame the lid is fully open, and each prize slides out on a card with
// its name in its colour and its power under it. A tap opens the chest early; a tap or a short wait moves to the next
// card; the last gives the board back. "Fewer effects" skips the build and the particles. Timings mine.

import Phaser from 'phaser';
import type { GameLog } from '../game-log.ts';
import { feel, sfx } from '../feel.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, RARITY_INK, RARITY_TINT, VIEW_HEIGHT } from '../layout.ts';
import { CARD, CHEST_OPEN_FRAME, cardWords, ensureLootClips, LOOT_KEYS, LOOT_SCALE, tierOf, type RevealRequest, type Tier } from '../loot.ts';
import { settings } from '../settings.ts';
import type { BoardScene } from './BoardScene.ts';

export interface RevealSceneDeps {
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where things sit, in design pixels (mine): the chest's feet, its mouth where the glow and the particles centre, the card at rest. */
export const REVEAL_LAYOUT = { titleY: 150, cardY: 330, chestY: 600, mouthY: 530, hintY: 696 } as const;
/** The glow builds this long before the lid moves; a tap cuts it short. */
const BUILD_MS = 750;
/** The card rests this long before the next card or the board, unless tapped. */
const REST_MS = 2200;
const QUICK_REST_MS = 1500;
/** How many sparkles and petals a burst throws, by tier: more for the rarer. */
const BURST: Record<Tier, { sparkles: number; petals: number; buzz: number }> = {
  gold: { sparkles: 6, petals: 4, buzz: 10 },
  common: { sparkles: 6, petals: 4, buzz: 10 },
  uncommon: { sparkles: 8, petals: 5, buzz: 15 },
  rare: { sparkles: 10, petals: 6, buzz: 25 },
  epic: { sparkles: 13, petals: 8, buzz: 35 },
  legendary: { sparkles: 16, petals: 10, buzz: 50 },
  unique: { sparkles: 16, petals: 10, buzz: 50 },
};
const FACE_INK = '#55493d';

type Phase = 'build' | 'opening' | 'card' | 'resting' | 'leaving';
type Movable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle;

function rnd(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** A colour mixed with white: the sparkles burn brighter than the petals. */
function lighten(tint: number): number {
  const r = Math.round(((tint >> 16) & 0xff) * 0.45 + 255 * 0.55);
  const g = Math.round(((tint >> 8) & 0xff) * 0.45 + 255 * 0.55);
  const b = Math.round((tint & 0xff) * 0.45 + 255 * 0.55);
  return (r << 16) | (g << 8) | b;
}

export class RevealScene extends Phaser.Scene {
  private readonly log: GameLog;
  private request!: RevealRequest;
  private tier: Tier = 'common';
  private tint = 0xffffff;
  private phase: Phase = 'build';
  private index = 0;
  private quick = false;
  private timer: Phaser.Time.TimerEvent | null = null;

  private veil!: Phaser.GameObjects.Rectangle;
  private count!: Phaser.GameObjects.Text;
  private glow!: Phaser.GameObjects.Image;
  private chest!: Phaser.GameObjects.Sprite;
  private hint!: Phaser.GameObjects.Text;
  private rim!: Phaser.GameObjects.Image;
  private face!: Phaser.GameObjects.Image;
  private faceMask!: Phaser.GameObjects.Graphics;
  private square!: Phaser.GameObjects.Text;
  private name_!: Phaser.GameObjects.Text;
  private power!: Phaser.GameObjects.Text;
  /** The card's parts, moved and faded together. */
  private cardParts: Movable[] = [];

  constructor(deps: RevealSceneDeps) {
    super('reveal');
    this.log = deps.log;
  }

  init(data: RevealRequest): void {
    this.request = data;
    this.tier = tierOf(data.prizes);
    this.tint = RARITY_TINT[this.tier] ?? 0xffffff;
    this.phase = 'build';
    this.index = 0;
    this.quick = settings.get().fewerEffects;
    this.timer = null;
    this.cardParts = [];
  }

  create(): void {
    ensureLootClips(this);
    const { titleY, cardY, chestY, mouthY, hintY } = REVEAL_LAYOUT;
    this.veil = this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x0a0c14, this.quick ? 0.88 : 0).setInteractive();
    this.veil.on('pointerdown', () => this.tap());
    if (!this.quick) this.tweens.add({ targets: this.veil, fillAlpha: 0.88, duration: 150 });

    this.add.text(CENTRE, titleY, this.request.title, { fontFamily: FONT, fontSize: settings.font(17), fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5).setDepth(5);
    this.count = this.add.text(CENTRE, titleY + 24, '', { fontFamily: FONT, fontSize: '12px', color: COLORS.dim }).setOrigin(0.5).setDepth(5);

    this.glow = this.add.image(CENTRE, mouthY, LOOT_KEYS.glow).setTint(this.tint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(LOOT_SCALE * 0.3).setDepth(1);
    this.chest = this.add.sprite(CENTRE, chestY, LOOT_KEYS.chest, 'chest/closed/0001').setScale(LOOT_SCALE).setDepth(3);
    this.hint = this.add.text(CENTRE, hintY, 'Tap to go on', { fontFamily: FONT, fontSize: '13px', color: COLORS.dim }).setOrigin(0.5).setAlpha(0).setDepth(5);

    this.makeCard(cardY);
    this.events.once('shutdown', () => {
      this.timer?.remove(false);
      this.faceMask.destroy();
    });
    this.log.note(`reveal: ${this.request.title}; ${this.request.prizes.map((p) => (p.kind === 'gear' ? `${p.gear.name} (${p.gear.rarity})` : p.kind === 'gold' ? `${p.amount} gold` : `${p.count} ${p.item}`)).join(', ')}`);
    this.startBuild();
  }

  // ---- the moments ---------------------------------------------------------------------------------------------------

  /** The glow builds under the shut chest, which stirs; then the lid goes up. */
  private startBuild(): void {
    this.phase = 'build';
    sfx.play('ui/chest-shimmer');
    if (this.quick) {
      this.open();
      return;
    }
    this.tweens.add({ targets: this.glow, alpha: 0.7, scale: LOOT_SCALE * 0.7, duration: BUILD_MS, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: this.chest, angle: { from: -2.5, to: 2.5 }, duration: 70, yoyo: true, repeat: 3, delay: BUILD_MS - 300 });
    this.timer = this.time.delayedCall(BUILD_MS, () => this.open());
  }

  /** The lid goes up (Mitch, AD's clip); the burst comes on the frame it is fully open. */
  private open(): void {
    if (this.phase !== 'build') return;
    this.phase = 'opening';
    this.timer?.remove(false);
    this.timer = null;
    this.tweens.killTweensOf(this.chest);
    this.chest.setAngle(0);
    if (this.quick) {
      this.chest.setFrame('chest/opened/0001');
      this.burst();
      return;
    }
    let burst = false;
    this.chest.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (!burst && frame.textureFrame === CHEST_OPEN_FRAME) {
        burst = true;
        this.burst();
      }
    });
    this.chest.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!burst) this.burst();
      this.chest.setFrame('chest/opened/0001');
    });
    this.chest.play(`${LOOT_KEYS.chest}/open`);
  }

  /** The glow swells, the particles fly, the first card comes out. */
  private burst(): void {
    this.phase = 'card';
    const kind = this.tier === 'gold' ? 'common' : this.tier;
    sfx.play(`ui/chest-burst-${kind}`);
    const b = BURST[this.tier];
    feel.buzz(b.buzz);
    if (this.quick) {
      this.glow.setAlpha(0.85).setScale(LOOT_SCALE * 1.4);
      this.showCard();
      return;
    }
    this.tweens.killTweensOf(this.glow);
    this.tweens.add({ targets: this.glow, alpha: 1, scale: LOOT_SCALE * 1.5, duration: 250, ease: 'Quad.easeOut', onComplete: () => this.tweens.add({ targets: this.glow, alpha: 0.85, scale: LOOT_SCALE * 1.4, duration: 400 }) });
    if (this.tier === 'legendary' || this.tier === 'unique') this.cameras.main.shake(160, 0.003);
    this.sparkles(b.sparkles);
    this.petals(b.petals);
    this.showCard();
  }

  /** The card for the prize at `index` slides up from behind the chest and rests over it. */
  private showCard(): void {
    const prize = this.request.prizes[this.index];
    if (!prize) {
      this.leave();
      return;
    }
    const words = cardWords(prize);
    const ink = RARITY_INK[words.tier] ?? COLORS.text;
    this.rim.setTint(RARITY_TINT[words.tier] ?? 0xffffff);
    this.square.setText(words.square.toUpperCase()).setColor(ink);
    this.name_.setText(words.name).setColor(ink);
    for (let px = 19; px > 13 && this.name_.width > CARD.w - CARD.textX - 14; px--) this.name_.setFontSize(`${px}px`);
    this.fitPower(words.power);
    const n = this.request.prizes.length;
    this.count.setText(n > 1 ? `${this.index + 1} of ${n}` : '');

    const { cardY, chestY } = REVEAL_LAYOUT;
    if (this.quick) {
      this.placeCard(cardY, 1);
      this.rest();
      return;
    }
    sfx.play('ui/chest-card');
    const from = chestY - 36;
    this.placeCard(from, 0);
    const dy = cardY - from;
    this.tweens.add({ targets: this.cardParts, y: `+=${dy}`, duration: 380, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.cardParts, alpha: 1, duration: 150, onComplete: () => this.time.delayedCall(240, () => this.rest()) });
  }

  /** The card is in place: a ding, a pulse on the name, the hint; the next card or the board after a wait or a tap. */
  private rest(): void {
    this.phase = 'resting';
    sfx.play('ui/chest-ding');
    feel.tick(this, this.name_);
    if (this.quick) this.hint.setAlpha(1);
    else this.tweens.add({ targets: this.hint, alpha: 1, duration: 200 });
    this.timer = this.time.delayedCall(this.quick ? QUICK_REST_MS : REST_MS, () => this.next());
  }

  /** The next card, or the end. */
  private next(): void {
    if (this.phase !== 'resting') return;
    this.timer?.remove(false);
    this.timer = null;
    this.index += 1;
    if (this.index >= this.request.prizes.length) {
      this.leave();
      return;
    }
    this.phase = 'card';
    if (this.quick) {
      this.showCard();
      return;
    }
    this.tweens.add({
      targets: this.cardParts,
      y: '-=40',
      alpha: 0,
      duration: 160,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.sparkles(4);
        this.showCard();
      },
    });
  }

  /** Everything fades and the board gets its turn back. */
  private leave(): void {
    this.phase = 'leaving';
    this.timer?.remove(false);
    this.timer = null;
    const done = () => (this.scene.get('board') as BoardScene).revealClosed(this.request.onDone);
    if (this.quick) {
      done();
      return;
    }
    this.tweens.add({ targets: this.children.list, alpha: 0, duration: 180, onComplete: done });
    this.tweens.add({ targets: this.veil, fillAlpha: 0, duration: 180 });
  }

  private tap(): void {
    if (this.phase === 'build') this.open();
    else if (this.phase === 'resting') this.next();
  }

  // ---- the pieces ----------------------------------------------------------------------------------------------------

  /** The card: a tinted copy for the rim, an untinted copy masked to the cream face, the square's word, the name, the power. */
  private makeCard(y: number): void {
    const left = CENTRE - CARD.w / 2;
    const top = y - CARD.h / 2;
    this.rim = this.add.image(CENTRE, y, LOOT_KEYS.card).setScale(LOOT_SCALE).setDepth(2);
    this.face = this.add.image(CENTRE, y, LOOT_KEYS.card).setScale(LOOT_SCALE).setDepth(2);
    this.faceMask = this.make.graphics({}, false);
    this.faceMask.fillStyle(0xffffff, 1);
    this.faceMask.fillRoundedRect(left + CARD.rim, top + CARD.rim, CARD.w - CARD.rim * 2, CARD.h - CARD.rim * 2, CARD.corner - CARD.rim + 4);
    this.face.setMask(this.faceMask.createGeometryMask());
    const sq = CARD.square;
    this.square = this.add
      .text(left + sq.x + sq.size / 2, top + sq.y + sq.size / 2, '', { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: FACE_INK, align: 'center', wordWrap: { width: sq.size - 6 } })
      .setOrigin(0.5)
      .setAlpha(0.55)
      .setDepth(2);
    this.name_ = this.add.text(left + CARD.textX, top + CARD.nameY, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: FACE_INK }).setOrigin(0, 0.5).setDepth(2);
    this.power = this.add
      .text(left + CARD.textX, top + CARD.powerY, '', { fontFamily: FONT, fontSize: '12px', color: FACE_INK, wordWrap: { width: CARD.w - CARD.textX - 14 }, lineSpacing: 1 })
      .setDepth(2);
    this.cardParts = [this.rim, this.face, this.faceMask, this.square, this.name_, this.power];
    this.placeCard(y, 0);
  }

  /** The power line in the room under the name: 12 px, then 11, then 10, then the last parts cut with an ellipsis. */
  private fitPower(text: string): void {
    const room = CARD.h - CARD.powerY - CARD.rim - 2;
    for (const px of [12, 11, 10]) {
      this.power.setFontSize(`${px}px`).setText(text);
      if (this.power.height <= room) return;
    }
    const parts = text.split(' · ');
    while (parts.length > 1 && this.power.height > room) {
      parts.pop();
      this.power.setText(`${parts.join(' · ')} …`);
    }
  }

  /** The card's parts moved so the card's centre is at `y`, at `alpha`. */
  private placeCard(y: number, alpha: number): void {
    const dy = y - this.rim.y;
    for (const part of this.cardParts) {
      part.y += dy;
      part.setAlpha(alpha);
    }
    this.square.setAlpha(alpha * 0.55);
  }

  /** Sparkles rise from the chest's mouth and fade with their clip. */
  private sparkles(n: number): void {
    const { mouthY } = REVEAL_LAYOUT;
    const tint = lighten(this.tint);
    for (let i = 0; i < n; i++) {
      const s = this.add
        .sprite(CENTRE + rnd(-30, 30), mouthY + rnd(-8, 8), LOOT_KEYS.sparkle, 'sparkle/play/0001')
        .setScale(LOOT_SCALE * rnd(0.7, 1.3))
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(4)
        .setVisible(false);
      this.time.delayedCall(rnd(0, 140), () => {
        if (!s.active) return;
        s.setVisible(true);
        s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
        s.play(`${LOOT_KEYS.sparkle}/play`);
        this.tweens.add({ targets: s, y: s.y - rnd(70, 150), x: s.x + rnd(-50, 50), duration: 460, ease: 'Quad.easeOut' });
      });
    }
  }

  /** Petals tumble out of the chest, up a little, then down past it. */
  private petals(n: number): void {
    const { mouthY, chestY } = REVEAL_LAYOUT;
    for (let i = 0; i < n; i++) {
      const p = this.add.sprite(CENTRE + rnd(-20, 20), mouthY, LOOT_KEYS.petal, 'petal/play/0001').setScale(LOOT_SCALE * rnd(0.8, 1.2)).setTint(this.tint).setDepth(4);
      const dx = rnd(-110, 110);
      p.play({ key: `${LOOT_KEYS.petal}/play`, repeat: -1 });
      this.tweens.add({
        targets: p,
        y: mouthY - rnd(30, 80),
        x: p.x + dx * 0.4,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (!p.active) return;
          this.tweens.add({ targets: p, y: chestY + rnd(0, 24), x: p.x + dx * 0.6, duration: rnd(520, 820), ease: 'Quad.easeIn', onComplete: () => p.destroy() });
          this.tweens.add({ targets: p, alpha: 0, delay: 300, duration: 300 });
        },
      });
    }
  }
}
