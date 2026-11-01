// The fixed chrome over the world: the top panel (name, level, the HP and MP bars, gold, where you are, the die), a row
// of chips (dice cards while a roll is pending, the gambler's question), the message box, and the Map, World, Bag, Log
// and Roll buttons. It is its own scene so the world camera can scroll and zoom under it. It decides nothing: the buttons
// call the board scene, and the board scene tells it what to show. Drawn from the UI kit (kit.ts, Mitch, AD, 2026-11-01).

import Phaser from 'phaser';
import { CLASS_DATA, WORLD_DATA } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { audio, type LoopHandle } from '../audio.ts';
import { feel } from '../feel.ts';
import { CREAM, icon, INK, KIT, KIT_SOFT, kitReady, plate, resizePlate } from '../kit.ts';
import { settings } from '../settings.ts';
import { Bar, makeButton, type Button } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface HudSceneDeps {
  game: GameHolder;
  log: GameLog;
}

/** Where the buttons sit, in design pixels (the pane's scripts tap them here). */
export const BUTTONS = {
  map: { x: 60, y: 836, w: 90, h: 40 },
  world: { x: 158, y: 836, w: 90, h: 40 },
  bag: { x: 256, y: 836, w: 90, h: 40 },
  log: { x: 354, y: 836, w: 90, h: 40 },
  roll: { x: 206, y: 886, w: 300, h: 56 },
} as const;
/** The message box: its bottom edge stays here; it grows upward for a longer line. */
const MESSAGE_BOTTOM = 812;
const MESSAGE_W = 380;
/** The row of chips, between the band and the message box. */
export const CHIPS_Y = 754;
/** The die's place in the panel. */
const DIE = { x: DESIGN_WIDTH - 48, y: HUD_HEIGHT / 2 } as const;

/** The numbers the panel shows. */
export interface HudNumbers {
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
}

/** A chip in the row: a dice card held, a number for a Fairy Pick, an answer to the gambler. */
export interface Chip {
  text: string;
  onTap: () => void;
}

export class HudScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  private kit = false;
  private name!: Phaser.GameObjects.Text;
  private place!: Phaser.GameObjects.Text;
  private hpBar!: Bar;
  private mpBar!: Bar;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  /** The die: the kit's face (or the blur while it tumbles) in a box, or a number in a drawn box before the kit. */
  private dieBox!: Phaser.GameObjects.Container;
  private dieFace: Phaser.GameObjects.Image | null = null;
  private dieText: Phaser.GameObjects.Text | null = null;
  private dieValue = '–';
  /** A roll under way: when it began, the tumble's sound, the faces flickering, what the die showed before. */
  private rolling: { started: number; tumble: LoopHandle | null; flicker: Phaser.Time.TimerEvent | null; was: string } | null = null;
  private messagePlate: Phaser.GameObjects.NineSlice | null = null;
  private message!: Phaser.GameObjects.Text;
  private rollButton!: Button;
  private mapLabel!: Phaser.GameObjects.Text;
  private chipRow!: Phaser.GameObjects.Container;
  private linkText!: Phaser.GameObjects.Text;

  constructor(deps: HudSceneDeps) {
    super('hud');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.kit = kitReady(this);
    this.drawPanel();
    this.drawControls();
    const board = this.scene.get('board') as BoardScene;
    board.hudReady(this);
    this.log.note(`hud ready${this.kit ? ' (kit)' : ''}`);
  }

  // ---- what the board scene tells us ------------------------------------------------------------------------------

  /** The numbers under the name, and where you are. */
  setStats(n: HudNumbers, place: string): void {
    const me = this.game_.me;
    this.name.setText(`${me.name} the ${CLASS_DATA[me.classId].name}`);
    this.levelText.setText(`Lv ${n.level}`);
    this.hpBar.set(n.hp, n.maxHp);
    this.mpBar.set(n.mana, n.maxMana);
    if (this.goldText.text !== String(n.gold) && this.goldText.text) feel.tick(this, this.goldText);
    this.goldText.setText(String(n.gold));
    this.place.setText(place);
  }

  /** What the die shows: a face, or a dash before the first roll. */
  private showDie(text: string): void {
    this.dieValue = text;
    const n = parseInt(text, 10);
    if (this.dieFace) {
      this.dieFace.setAngle(0);
      if (n >= 1 && n <= 6) this.dieFace.setFrame(`die_${n}`).setAlpha(1);
      else this.dieFace.setFrame('die_1').setAlpha(0.45);
    }
    this.dieText?.setText(text);
  }

  /** The number on the die; `pulse` gives it a small bounce when a card changed the steps. */
  setDie(text: string, pulse = false): void {
    this.showDie(text);
    if (pulse) this.tweens.add({ targets: this.dieBox, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }

  /**
   * The roll begins the moment Roll is tapped, before the world answers (chapter 1, step 3): the die shakes in the hand
   * (Nigel, SD's shake), then tumbles, a blur turning with the faces flickering (his tumble, looped), until `landDie`.
   * The answer from a server arrives under the tumble, so the wait is never seen.
   */
  startRoll(): void {
    if (this.rolling) return;
    this.rolling = { started: this.time.now, tumble: null, flicker: null, was: this.dieValue };
    audio.play('ui/die-shake');
    if (!settings.ms(1)) return;
    this.tweens.killTweensOf(this.dieBox);
    this.dieBox.setScale(1).setAngle(0);
    this.tweens.add({
      targets: this.dieBox,
      angle: { from: -9, to: 9 },
      duration: 40,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        const r = this.rolling;
        if (!r) return;
        this.dieBox.setAngle(0);
        r.tumble = audio.loop('ui/die-tumble');
        let spin = 0;
        r.flicker = this.time.addEvent({
          delay: 70,
          loop: true,
          callback: () => {
            spin += 1;
            if (this.dieFace) this.dieFace.setFrame(spin % 2 ? 'die_blur' : `die_${1 + Math.floor(Math.random() * 6)}`).setAlpha(1).setAngle(spin * 37);
            this.dieText?.setText(String(1 + Math.floor(Math.random() * 6)));
          },
        });
      },
    });
  }

  /** The die lands on `value`: a bounce, the kit's glow behind it, the landing sound pitched a little by the face; then `done`. */
  landDie(value: number, done: () => void): void {
    const r = this.rolling;
    this.rolling = null;
    const quick = !settings.ms(1);
    const land = () => {
      r?.flicker?.remove(false);
      r?.tumble?.stop();
      this.tweens.killTweensOf(this.dieBox);
      this.dieBox.setAngle(0);
      this.showDie(String(value));
      audio.play('ui/die-land', { rate: 0.94 + value * 0.025 });
      feel.buzz(15);
      if (!quick) {
        this.dieBox.setScale(1.35);
        this.tweens.add({ targets: this.dieBox, scaleX: 1, scaleY: 1, duration: 280, ease: 'Back.easeOut' });
        if (this.kit) {
          const glow = this.add.image(DIE.x, DIE.y, KIT_SOFT, 'die_glow').setScale(0.5).setTint(0xffd166).setBlendMode(Phaser.BlendModes.ADD).setDepth(-1);
          this.tweens.add({ targets: glow, scale: 0.9, alpha: 0, duration: 420, ease: 'Quad.easeOut', onComplete: () => glow.destroy() });
        } else {
          const ring = this.add.circle(DIE.x, DIE.y, 34).setStrokeStyle(4, 0xfff27a, 0.9).setDepth(5);
          this.tweens.add({ targets: ring, scale: 2.1, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
        }
      }
      done();
    };
    // The shake and a little of the tumble are always seen, even when the answer is instant.
    const minMs = quick ? 0 : 620;
    const elapsed = r ? this.time.now - r.started : minMs;
    if (elapsed >= minMs) land();
    else this.time.delayedCall(minMs - elapsed, land);
  }

  /** The world refused the roll: the die goes back to what it showed. */
  cancelRoll(): void {
    const r = this.rolling;
    this.rolling = null;
    if (!r) return;
    r.flicker?.remove(false);
    r.tumble?.stop();
    this.tweens.killTweensOf(this.dieBox);
    this.dieBox.setAngle(0).setScale(1);
    this.showDie(r.was);
  }

  /** The message box: up to two lines at the usual size, smaller for a long one, and the box grows for the rest. */
  setMessage(text: string): void {
    if (text && text !== this.message.text) audio.play('ui/message-tick', { volume: 0.6 });
    this.message.setFontSize(settings.font(14)).setText(text);
    if (this.message.height > 44) this.message.setFontSize(settings.font(12));
    const h = Math.max(44, Math.ceil(this.message.height) + 14);
    const y = MESSAGE_BOTTOM - h / 2;
    this.message.setY(y);
    if (this.messagePlate) {
      resizePlate(this.messagePlate, MESSAGE_W, h);
      this.messagePlate.setY(y);
    }
  }

  /** While the player is choosing, walking, fighting or shopping, the Roll button is dimmed. */
  setBusy(busy: boolean): void {
    this.rollButton.setEnabled(!busy);
  }

  /** The Map button reads "Map" while the camera follows the character and "Back" when it has been moved away. */
  setFollowing(following: boolean): void {
    this.mapLabel.setText(following ? 'Map' : 'Back');
  }

  /** The link to the world, under the die: solo, online with how many, or reconnecting (mine, 2026-11-01). */
  setLink(text: string, color: string): void {
    this.linkText.setText(text).setColor(color);
  }

  /** The chips to show in the row; an empty list clears it. */
  setChips(chips: Chip[]): void {
    this.chipRow.removeAll(true);
    const widths = chips.map((c) => Math.max(40, c.text.length * 9 + 24));
    const gap = 8;
    let x = -(widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1)) / 2;
    chips.forEach((chip, i) => {
      const w = widths[i]!;
      const cx = x + w / 2;
      const onTap = () => {
        feel.sparkle(this, this.chipRow.x + cx, this.chipRow.y, 0xfff1b0, 60, 6);
        chip.onTap();
      };
      if (this.kit) {
        const face = plate(this, 'chip_idle', 0, 0, w, 34);
        const label = this.add.text(0, 0, chip.text, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: INK }).setOrigin(0.5);
        const button = this.add.container(cx, 0, [face, label]).setSize(w, 34).setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
          face.setFrame('chip_chosen');
          feel.press(this, button);
          feel.buzz();
          audio.play('ui/chip');
          onTap();
        });
        this.chipRow.add(button);
      } else {
        this.chipRow.add(makeButton(this, cx, 0, w, 30, chip.text, 0x8e6ad9, '14px', onTap).button);
      }
      x += w + gap;
    });
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------

  private drawPanel(): void {
    const cream = this.kit ? CREAM : COLORS.text;
    const dim = this.kit ? '#e3d6bd' : COLORS.dim;
    if (this.kit) plate(this, 'panel_hud', DESIGN_WIDTH / 2, HUD_HEIGHT / 2, DESIGN_WIDTH, HUD_HEIGHT);
    else this.add.rectangle(DESIGN_WIDTH / 2, HUD_HEIGHT / 2, DESIGN_WIDTH, HUD_HEIGHT, COLORS.panel, 1);
    this.name = this.add.text(16, 10, '', { fontFamily: FONT_DISPLAY, fontSize: '19px', fontStyle: 'bold', color: cream });
    this.levelText = this.add.text(DESIGN_WIDTH - 92, 14, '', { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: cream }).setOrigin(1, 0);

    // The bars with their marks, the gold with its coin.
    if (this.kit) {
      icon(this, 'mark_heart', 26, 48);
      icon(this, 'mark_drop', 26, 70);
      icon(this, 'item_gold', 236, 48).setScale(0.4);
    } else {
      this.add.text(16, 42, 'HP', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(0, 0.5);
      this.add.text(16, 64, 'MP', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(0, 0.5);
      this.add.text(222, 48, 'Gold', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(0, 0.5);
    }
    this.hpBar = new Bar(this, 128, 48, 160, 14, COLORS.button, 0, 'HP');
    this.mpBar = new Bar(this, 128, 70, 160, 14, COLORS.mana, 0, 'MP');
    this.goldText = this.add.text(254, 48, '', { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: cream }).setOrigin(0, 0.5);
    this.place = this.add.text(16, HUD_HEIGHT - 6, '', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(0, 1);

    // The die.
    if (this.kit) {
      this.dieFace = this.add.image(0, 0, KIT, 'die_1').setScale(0.5).setAlpha(0.45);
      this.dieBox = this.add.container(DIE.x, DIE.y, [this.dieFace]);
    } else {
      const box = this.add.graphics();
      box.fillStyle(0xe8e4d8, 1);
      box.fillRoundedRect(-28, -28, 56, 56, 10);
      this.dieText = this.add.text(0, 0, '–', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
      this.dieBox = this.add.container(DIE.x, DIE.y, [box, this.dieText]);
    }
    this.linkText = this.add.text(DESIGN_WIDTH - 86, HUD_HEIGHT - 6, '', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(1, 1);
  }

  private drawControls(): void {
    // The band under the world: the chips, the message box and the buttons, so the world never shows through there.
    const stripTop = HUD_HEIGHT + VIEW_HEIGHT;
    if (this.kit) plate(this, 'panel_bottom', DESIGN_WIDTH / 2, (stripTop + DESIGN_HEIGHT) / 2, DESIGN_WIDTH, DESIGN_HEIGHT - stripTop);
    else this.add.rectangle(DESIGN_WIDTH / 2, (stripTop + DESIGN_HEIGHT) / 2, DESIGN_WIDTH, DESIGN_HEIGHT - stripTop, COLORS.panel, 1);
    this.chipRow = this.add.container(DESIGN_WIDTH / 2, CHIPS_Y);

    if (this.kit) this.messagePlate = plate(this, 'panel_message', DESIGN_WIDTH / 2, MESSAGE_BOTTOM - 22, MESSAGE_W, 44);
    this.message = this.add
      .text(DESIGN_WIDTH / 2, MESSAGE_BOTTOM - 22, '', {
        fontFamily: FONT,
        fontSize: settings.font(14),
        color: this.kit ? INK : COLORS.text,
        align: 'center',
        wordWrap: { width: MESSAGE_W - 28 },
      })
      .setOrigin(0.5);

    const board = (): BoardScene => this.scene.get('board') as BoardScene;
    const { map, world, bag, log, roll } = BUTTONS;
    this.mapLabel = makeButton(this, map.x, map.y, map.w, map.h, 'Map', COLORS.log, '16px', () => board().toggleMap()).label;
    makeButton(this, world.x, world.y, world.w, world.h, 'World', COLORS.log, '16px', () => board().openAtlas());
    makeButton(this, bag.x, bag.y, bag.w, bag.h, 'Bag', COLORS.log, '16px', () => board().openBag());
    makeButton(this, log.x, log.y, log.w, log.h, 'Log', COLORS.log, '16px', () => board().downloadLog());
    this.rollButton = makeButton(this, roll.x, roll.y, roll.w, roll.h, 'Roll', COLORS.button, '24px', () => board().roll());
    this.log.note(`build 0.2.0 · ${WORLD_DATA.name} · seed ${this.game_.state.seed.slice(0, 8)}`);
  }
}
