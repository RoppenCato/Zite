// The fixed chrome over the world: the top panel (name, level, the HP and MP bars, gold, where you are, the die), a row
// of chips (dice cards while a roll is pending, the gambler's question), the message box, and the Map, World, Bag, Log
// and Roll buttons. It is its own scene so the world camera can scroll and zoom under it. It decides nothing: the buttons
// call the board scene, and the board scene tells it what to show. Drawn from the UI kit (kit.ts, Mitch, AD, 2026-11-01).

import Phaser from 'phaser';
import { CLASS_DATA, WORLD_DATA, specialization, PROGRESSION, creature, pointsFree } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, VIEW_HEIGHT, SCREEN_WIDTH, HUD_PLANK, PLANK_TOP, ROLL_TOP, ROLL_LEFT, ROLL_RIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { audio, type LoopHandle } from '../audio.ts';
import { feel, sfx } from '../feel.ts';
import { rememberMessage } from '../messages.ts';
import { BIG_DIE, CREAM, icon, INK, KIT, KIT_SOFT, kitReady, plate, resizePlate, GUIDE_ICON, DAYNIGHT } from '../kit.ts';
import { settings } from '../settings.ts';
import { Bar, makeButton, type Button } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface HudSceneDeps {
  game: GameHolder;
  log: GameLog;
}

/** Where the buttons sit, in design pixels (the pane's scripts tap them here). */
export const BUTTONS = {
  map: { x: 40, y: 876, w: 64, h: 60 },
  hero: { x: 108, y: 876, w: 64, h: 60 },
  quests: { x: 304, y: 876, w: 64, h: 60 },
  settings: { x: 372, y: 876, w: 64, h: 60 },
  roll: { x: 206, y: 866, w: 120, h: 84 },
} as const;
/** The message's sign: it stands with its foot here and grows upward over the map, on two posts (Mitch, AD's numbers). */
const SIGN = { x: 14, w: 384, foot: 814, one: 38, posts: [30, 382] } as const;
const CHIP_H = 34;
/** The die's place in the panel. */
const DIE = { x: 370, y: 30 } as const;
/** The big die: where it stands, how long its number stays. */
const BIG_DIE_Y = 390;
const BIG_DIE_HOLD_MS = 620;

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
  private bigDie: Phaser.GameObjects.Container | null = null;
  private bigFace: Phaser.GameObjects.Image | null = null;
  private dieText: Phaser.GameObjects.Text | null = null;
  private dieValue = '–';
  /** A roll under way: when it began, the tumble's sound, the faces flickering, what the die showed before. */
  private rolling: { started: number; tumble: LoopHandle | null; flicker: Phaser.Time.TimerEvent | null; was: string } | null = null;
  private signPlate: Phaser.GameObjects.NineSlice | null = null;
  private messagePlate: Phaser.GameObjects.NineSlice | null = null;
  private signPosts!: Phaser.GameObjects.Graphics;
  private signZone!: Phaser.GameObjects.Zone;
  private logMark: Phaser.GameObjects.Image | null = null;
  private logZone!: Phaser.GameObjects.Zone;
  private signTop = SIGN.foot - SIGN.one;
  private message!: Phaser.GameObjects.Text;
  private rollButton!: Button;
  private mapLabel!: Phaser.GameObjects.Text;
  private chipRow!: Phaser.GameObjects.Container;
  private linkText!: Phaser.GameObjects.Text;
  private clockIcon: Phaser.GameObjects.Image | null = null;

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

  private xpFill: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle | null = null;
  private readonly xpShare = { value: 0 };
  private goal!: Phaser.GameObjects.Text;

  private drawXp(): void {
    const w = 384 * this.xpShare.value;
    if (!this.xpFill) return;
    this.xpFill.setVisible(w >= 6);
    if (w < 6) return;
    if (this.xpFill instanceof Phaser.GameObjects.NineSlice) resizePlate(this.xpFill, w, 6);
    else this.xpFill.setSize(w, 6);
  }

  // ---- what the board scene tells us ------------------------------------------------------------------------------

  /** The numbers under the name, and where you are. */
  setStats(n: HudNumbers, place: string): void {
    const me = this.game_.me;
    this.name.setText(`${me.name} the ${specialization(me) ?? CLASS_DATA[me.classId].name}`);
    this.levelText.setText(String(n.level));
    this.hpBar.set(n.hp, n.maxHp);
    this.mpBar.set(n.mana, n.maxMana);
    if (this.goldText.text !== String(n.gold) && this.goldText.text) feel.tick(this, this.goldText);
    this.goldText.setText(String(n.gold));
    // Only the region fits its sign.
    this.place.setText(place.split(' · ')[0] ?? place);
    // The XP bar (Robin, 2026-11-02): how far to the next level, sliding as it fills.
    const table = PROGRESSION.xpForLevel;
    const from = table[me.level - 1] ?? 0;
    const to = table[me.level] ?? from + 1;
    const share = Math.max(0, Math.min(1, (me.xp - from) / Math.max(1, to - from)));
    this.tweens.killTweensOf(this.xpShare);
    this.tweens.add({ targets: this.xpShare, value: share, duration: settings.ms(400), ease: 'Quad.easeOut', onUpdate: () => this.drawXp() });
    this.drawXp();
    // What is next, one short thing on its sign (Robin, 2026-11-02): the quest, a point to spend, or the level.
    const q = me.quests[0];
    const free = pointsFree(me);
    let next = `${Math.max(0, to - me.xp)} XP to Lv ${me.level + 1}`;
    if (q) {
      const who = q.target ? (creature(q.target, this.game_.state.board.bestiary)?.name ?? q.target) : '';
      const left = q.count - q.done;
      next = q.kind === 'kill' ? `${left} more ${who}${left === 1 ? '' : 's'}` : q.kind === 'loot' ? `${left} from ${who}s` : q.kind === 'mini' ? `Hunt ${who}` : 'Find them';
    } else if (free > 0) next = free === 1 ? '1 skill point' : `${free} skill points`;
    this.goal.setText(next).setFontSize(next.length > 18 ? 10 : 12);
  }

  /** What the die shows: a face, or a dash before the first roll. */
  private showDie(text: string): void {
    this.dieValue = text;
    const n = parseInt(text, 10);
    if (this.dieFace) {
      this.dieFace.setAngle(0);
      if (n >= 1 && n <= 6) {
        this.dieFace.setFrame(`die_${n}`).setAlpha(1);
        this.rollButton.icon?.setFrame(`die_${n}`).setDisplaySize(34, 34);
      }
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
    this.showBigDie();
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
            const frame = spin % 2 ? 'die_blur' : `die_${1 + Math.floor(Math.random() * 6)}`;
            if (this.dieFace) this.dieFace.setFrame(frame).setAlpha(1).setAngle(spin * 37);
            this.bigFace?.setFrame(spin % 2 ? 'big_die_blur' : `big_die_${1 + Math.floor(Math.random() * 6)}`);
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
      if (quick || !this.bigDie) {
        done();
        return;
      }
      this.landBigDie(value, done);
    };
    // The shake and a little of the tumble are always seen, even when the answer is instant.
    const minMs = quick ? 0 : 620;
    const elapsed = r ? this.time.now - r.started : minMs;
    if (elapsed >= minMs) land();
    else this.time.delayedCall(minMs - elapsed, land);
  }

  /** The die in the middle of the screen while it rolls (Robin, 2026-11-02). */
  private showBigDie(): void {
    if (!this.textures.exists(BIG_DIE)) return;
    this.bigDie?.destroy();
    this.bigFace = this.add.image(0, 0, BIG_DIE, 'big_die_blur').setScale(0.5);
    this.bigDie = this.add.container(DESIGN_WIDTH / 2, BIG_DIE_Y, [this.add.circle(0, 0, 92, 0x0a0c14, 0.28), this.bigFace]).setDepth(20);
    this.bigDie.setScale(0.4);
    this.tweens.add({ targets: this.bigDie, scale: 1, duration: 170, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.bigFace, angle: 360, duration: 420, repeat: -1 });
  }

  /** It lands: the number, a pop, a moment to read it, then it flies to the corner die and the world goes on. */
  private landBigDie(value: number, done: () => void): void {
    const die = this.bigDie!;
    const face = this.bigFace!;
    this.tweens.killTweensOf(face);
    face.setAngle(0).setFrame(`big_die_${value}`);
    this.tweens.killTweensOf(die);
    die.setScale(1.25);
    this.tweens.add({ targets: die, scale: 1, duration: 240, ease: 'Back.easeOut' });
    this.time.delayedCall(BIG_DIE_HOLD_MS, () => {
      this.tweens.add({
        targets: die,
        x: DIE.x,
        y: DIE.y,
        scale: 0.32,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: () => {
          die.destroy();
          if (this.bigDie === die) {
            this.bigDie = null;
            this.bigFace = null;
          }
        },
      });
      done();
    });
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
    this.bigDie?.destroy();
    this.bigDie = null;
    this.bigFace = null;
  }

  /** The message box: up to two lines at the usual size, smaller for a long one, and the box grows for the rest. */
  setMessage(text: string): void {
    rememberMessage(text);
    if (text && text !== this.message.text) audio.play('ui/message-tick', { volume: 0.6 });
    this.message.setFontSize(settings.font(15)).setText(text);
    if (this.message.height > 44) this.message.setFontSize(settings.font(13));
    this.layoutSign(Math.max(SIGN.one, Math.ceil(this.message.height) + 14));
  }

  /** The sign at this height, its foot where it stands; the posts, the scroll and the chips follow it. */
  private layoutSign(height: number): void {
    const top = SIGN.foot - height;
    const y = top + height / 2;
    this.signTop = top;
    this.message.setY(y);
    if (this.signPlate && this.messagePlate) {
      resizePlate(this.signPlate, SIGN.w, height);
      this.signPlate.setY(y);
      resizePlate(this.messagePlate, SIGN.w - 12, height - 10);
      this.messagePlate.setY(y);
    }
    this.signPosts.clear();
    for (const x of SIGN.posts) {
      this.signPosts.fillStyle(0x2a2030, 1).fillRect(x - 4, top + 8, 8, 828 - top - 8);
      this.signPosts.fillStyle(0x8a5a34, 1).fillRect(x - 2.5, top + 8, 5, 828 - top - 8);
    }
    this.signZone.setPosition(SIGN.x + SIGN.w / 2, y).setSize(SIGN.w, height);
    this.signZone.input?.hitArea.setSize(SIGN.w, height);
    this.logMark?.setY(y);
    this.logZone.setPosition(36, y).setSize(36, height);
    this.logZone.input?.hitArea.setSize(36, height);
    this.chipRow.setY(top - 4 - CHIP_H / 2);
  }

  /** Whether a spot in the column is covered by the bars, the signs or the chips that stand over the map; a tap there is not the map's. */
  covers(x: number, y: number): boolean {
    if (y < HUD_PLANK || y >= PLANK_TOP) return true;
    if (y < 104 && x >= 12 && x <= 400) return true;
    if (y >= ROLL_TOP && x >= ROLL_LEFT && x <= ROLL_RIGHT) return true;
    if (y >= this.signTop && y <= 828 && x >= SIGN.x && x <= SIGN.x + SIGN.w) return true;
    if (this.chipRow.length > 0 && y >= this.signTop - 4 - CHIP_H && y < this.signTop) {
      const half = this.chipRow.getBounds().width / 2;
      return Math.abs(x - this.chipRow.x) <= half;
    }
    return false;
  }

  /** While the player is choosing, walking, fighting or shopping, the Roll button is dimmed. */
  setBusy(busy: boolean): void {
    const { board: map } = this.game_.state;
    const at = map.spaces[this.game_.me.space];
    const walled = !!at && !!map.areas[at.area]?.city && !at.links.some((l) => map.spaces[l]?.area !== at.area);
    this.rollButton.setEnabled(!busy && !walled, true);
    this.rollButton.icon?.setAlpha(busy || walled ? 0.55 : 1);
  }

  /** The Map button reads "Map" while the camera follows the character and "Back" when it has been moved away. */
  setFollowing(following: boolean): void {
    this.mapLabel.setText(following ? 'Map' : 'Back');
  }

  /** The link to the world, under the die: solo, online with how many, or reconnecting (mine, 2026-11-01). */
  setLink(text: string, color: string, night?: boolean): void {
    this.linkText.setText(text).setColor(color);
    if (this.clockIcon && night !== undefined) this.clockIcon.setFrame(night ? 'icon_moon' : 'icon_sun').setVisible(true).setX(this.linkText.x - this.linkText.width - 8);
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
        const face = plate(this, 'chip_idle', 0, 0, w, CHIP_H);
        const label = this.add.text(0, 0, chip.text, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: INK }).setOrigin(0.5);
        const button = this.add.container(cx, 0, [face, label]).setSize(w, CHIP_H).setInteractive({ useHandCursor: true });
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
    const dim = this.kit ? '#fff8e8' : COLORS.dim;
    // The slim bar (Robin, 2026-11-02, Mitch, AD's numbers): a plank of 74, with two signs hanging over the map.
    if (this.kit) plate(this, 'panel_hud', DESIGN_WIDTH / 2, HUD_PLANK / 2, SCREEN_WIDTH, HUD_PLANK);
    else this.add.rectangle(DESIGN_WIDTH / 2, HUD_PLANK / 2, SCREEN_WIDTH, HUD_PLANK, COLORS.panel, 1);
    const ropes = this.add.graphics();
    ropes.lineStyle(2, 0x3a2410, 1);
    for (const x of [34, 150, 262, 378]) ropes.lineBetween(x, 72, x, 80);
    if (this.kit) {
      plate(this, 'board_slip', 12, 76, 184, 24).setOrigin(0, 0);
      plate(this, 'board_slip', 240, 76, 160, 24).setOrigin(0, 0);
    }
    // How the game works, a tap away (Robin, 2026-11-02).
    makeButton(this, 318, 24, 32, 28, this.textures.exists(GUIDE_ICON) ? '' : '?', COLORS.log, '15px', () => {
      sfx.play('ui/sheet-open');
      this.scene.launch('guide', { page: 0 });
      this.scene.bringToTop('guide');
    }, { small: true, icon: { frame: 'icon_guide', y: 2, size: 24, atlas: GUIDE_ICON } });
    makeButton(this, 218, 89, 40, 26, 'Home', COLORS.log, '10.5px', () => (this.scene.get('board') as BoardScene).goHome(), { small: true });
    this.place = this.add.text(24, 88, '', { fontFamily: FONT, fontSize: '11.5px', fontStyle: 'bold', color: '#3a2410' }).setOrigin(0, 0.5);
    this.add.text(250, 88, 'Next:', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#a23c2c' }).setOrigin(0, 0.5);
    this.goal = this.add.text(284, 88, '', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#3a2410' }).setOrigin(0, 0.5);
    if (this.kit) this.add.image(34, 30, KIT, 'medal_level').setDisplaySize(48, 48);
    this.add.text(34, 20, 'Lv', { fontFamily: FONT, fontSize: '9.5px', fontStyle: 'bold', color: '#3a2410' }).setOrigin(0.5);
    this.levelText = this.add.text(34, 35, '', { fontFamily: FONT_DISPLAY, fontSize: '17px', fontStyle: 'bold', color: '#3a2410' }).setOrigin(0.5);
    this.name = this.add.text(66, 13, '', { fontFamily: FONT_DISPLAY, fontSize: '14.5px', fontStyle: 'bold', color: cream, stroke: '#3a2410', strokeThickness: 3 }).setOrigin(0, 0.5);
    this.hpBar = new Bar(this, 145, 30, 158, 14, COLORS.button, 0, '', { fontSize: 10.5 });
    this.mpBar = new Bar(this, 145, 44, 158, 12, COLORS.mana, 0, '', { small: true, fontSize: 9.5 });
    if (this.kit) {
      const coin = this.add.image(240, 22, KIT, 'item_gold');
      coin.setScale(18 / coin.width);
    }
    this.goldText = this.add.text(253, 22, '', { fontFamily: FONT_DISPLAY, fontSize: '15.5px', fontStyle: 'bold', color: cream, stroke: '#3a2410', strokeThickness: 3 }).setOrigin(0, 0.5);
    if (this.kit) {
      plate(this, 'bar_frame_xp', 12, 57, 388, 9).setOrigin(0, 0);
      this.xpFill = plate(this, 'bar_xp', 14, 58.5, 6, 6).setOrigin(0, 0).setVisible(false);
    } else this.xpFill = this.add.rectangle(14, 58.5, 6, 6, 0xf4c14a, 1).setOrigin(0, 0).setVisible(false);

    // The die.
    if (this.kit) {
      const well = this.add.graphics();
      well.fillStyle(0x3a2410, 1).fillRoundedRect(344, 4, 52, 52, 8);
      this.dieFace = this.add.image(0, 0, KIT, 'die_1').setScale(46 / 112).setAlpha(0.45);
      this.dieBox = this.add.container(DIE.x, DIE.y, [this.dieFace]);
    } else {
      const box = this.add.graphics();
      box.fillStyle(0xe8e4d8, 1);
      box.fillRoundedRect(-28, -28, 56, 56, 10);
      this.dieText = this.add.text(0, 0, '–', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
      this.dieBox = this.add.container(DIE.x, DIE.y, [box, this.dieText]);
    }
    this.linkText = this.add.text(340, 44, '', { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: dim, stroke: '#3a2410', strokeThickness: 2.5 }).setOrigin(1, 0.5);
    // The sun or the moon, left of the words (Robin, 2026-11-03).
    this.clockIcon = this.textures.exists(DAYNIGHT) ? this.add.image(0, 44, DAYNIGHT, 'icon_sun').setScale(0.42).setVisible(false) : null;
  }

  private drawControls(): void {
    // Bottom bar 1 (Robin, 2026-11-02: "Go for 1"; Mitch, AD's numbers): a plank of 80 with Roll rising from its middle, and the message on a sign over the map.
    const plankH = DESIGN_HEIGHT - PLANK_TOP;
    this.signPosts = this.add.graphics();
    if (this.kit) plate(this, 'panel_bottom', DESIGN_WIDTH / 2, PLANK_TOP + plankH / 2, SCREEN_WIDTH, plankH);
    else this.add.rectangle(DESIGN_WIDTH / 2, PLANK_TOP + plankH / 2, SCREEN_WIDTH, plankH, COLORS.panel, 1);
    this.chipRow = this.add.container(DESIGN_WIDTH / 2, this.signTop - 4 - CHIP_H / 2);

    // The sign takes its own taps, so none falls through to the map.
    this.signZone = this.add.zone(SIGN.x + SIGN.w / 2, 0, SIGN.w, SIGN.one).setInteractive();
    if (this.kit) {
      this.signPlate = plate(this, 'board_plain', SIGN.x + SIGN.w / 2, 0, SIGN.w, SIGN.one);
      this.messagePlate = plate(this, 'board_slip', SIGN.x + SIGN.w / 2, 0, SIGN.w - 12, SIGN.one - 10);
      this.logMark = this.add.image(36, 0, KIT, 'mark_scroll').setDisplaySize(18, 18);
    }
    this.logZone = this.add.zone(36, 0, 36, SIGN.one).setInteractive({ useHandCursor: true });
    this.logZone.on('pointerup', () => {
      sfx.play('ui/tap');
      this.scene.launch('log');
    });
    this.message = this.add
      .text(212, 0, '', {
        fontFamily: FONT,
        fontSize: settings.font(15),
        fontStyle: 'bold',
        color: this.kit ? INK : COLORS.text,
        align: 'center',
        wordWrap: { width: 324 },
      })
      .setOrigin(0.5);
    this.layoutSign(SIGN.one);

    const board = (): BoardScene => this.scene.get('board') as BoardScene;
    const { map, hero, quests, settings: gear, roll } = BUTTONS;
    const dock = (b: { x: number; y: number; w: number; h: number }, text: string, frame: string, onTap: () => void): Button =>
      makeButton(this, b.x, b.y, b.w, b.h, text, COLORS.log, '10.5px', onTap, { small: true, labelY: 22, icon: { frame, y: -6, size: 31 } });
    this.mapLabel = dock(map, 'Map', 'icon_map', () => board().toggleMap()).label;
    dock(hero, 'Hero', 'icon_hero', () => board().openBag());
    dock(quests, 'Quests', 'icon_quests', () => board().openQuests());
    dock(gear, 'Settings', 'icon_settings', () => board().openSettings());
    this.rollButton = makeButton(this, roll.x, roll.y, roll.w, roll.h, 'Roll', COLORS.button, '19px', () => board().roll(), { labelY: 24, icon: { frame: 'die_4', y: -14, size: 34 } });
    this.log.note(`build 0.2.0 · ${WORLD_DATA.name} · seed ${this.game_.state.seed.slice(0, 8)}`);
  }
}
