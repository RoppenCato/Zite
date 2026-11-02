// The character screen, the first time: a name and a class (Robin, 2026-10-31: the class is chosen at creation and the
// classes must feel different). Four cards with each class's style line and numbers, a Begin button. In co-op the same
// screen makes the account on the server, and a player with a code from another phone can bring that character instead.
// Layout mine.

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, CLASS_IDS, MAX_NAME, plainGear, WORLD_DATA, type Character, type ClassId } from '../../../rules/src/index.ts';
import { Hero, heroReady, preloadHero, releaseClasses } from '../hero.ts';
import type { GameHolder } from '../game-holder.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, SCREEN_WIDTH } from '../layout.ts';
import { feel, sfx } from '../feel.ts';
import backdropJpg from '../../../assets/brand/character_backdrop.jpg';
import wordmarkPng from '../../../assets/brand/wordmark.png';
import { CREAM, INK, kitReady, plate, preloadKit } from '../kit.ts';
import { makeButton } from '../ui.ts';
import { playScenes } from './play.ts';

export interface CreateSceneDeps {
  log: GameLog;
  /** Where the world is, for the line under the title: this phone, or the server. */
  where: string;
  /** Make the game for the character: the local save, or an account on the server. Rejects with a reason to show. */
  make: (o: { name: string; classId: ClassId }) => Promise<GameHolder>;
  /** Bring a character from another phone by its recovery code; absent in solo play. */
  recover: ((code: string) => Promise<GameHolder>) | null;
  /** Called with the new game before play starts, so main.ts can expose it to the pane. */
  onCreated: (game: GameHolder) => void;
}

const CENTRE = DESIGN_WIDTH / 2;
const CARD_W = 340;
const CARD_H = 104;
const CARD_GAP = 12;
const FIRST_CARD_Y = 304;
export const DEFAULT_NAME = 'Robin';
export { MAX_NAME };

/** Where things sit, in design pixels (the driver taps them here). */
export const CREATE_LAYOUT = {
  input: { x: CENTRE, y: 180, w: 300, h: 44 },
  cardY: (i: number) => FIRST_CARD_Y + i * (CARD_H + CARD_GAP),
  begin: { x: CENTRE, y: 812, w: 220, h: 66 },
  code: { x: CENTRE, y: 872, w: 260, h: 28 },
} as const;

/** The classes offered (Robin, 2026-11-01: Alpha 1 with the Knight alone; the rules keep all four, chapter 2 opens the rest). */
export const OFFERED: readonly ClassId[] = ['warrior', 'rogue', 'mage', 'ranger'];
const LATER = CLASS_IDS.filter((id) => !OFFERED.includes(id));

const CARD_COLORS: Record<ClassId, number> = {
  warrior: 0x5a6378,
  rogue: 0x4f5a5a,
  mage: 0x5f528a,
  ranger: 0x4f6e55,
};

export class CreateScene extends Phaser.Scene {
  private readonly deps: CreateSceneDeps;
  private readonly cards = new Map<ClassId, Phaser.GameObjects.Graphics | Phaser.GameObjects.NineSlice>();
  private nameField!: HTMLInputElement;
  private status!: Phaser.GameObjects.Text;
  private chosen: ClassId = 'warrior';
  private begun = false;

  constructor(deps: CreateSceneDeps) {
    super('create');
    this.deps = deps;
  }

  preload(): void {
    preloadKit(this);
    preloadHero(this, OFFERED);
    // The character screen's backdrop and the wordmark (Mitch, AD, 2026-11-01): dusk over the kingdom, and the name with the stolen crown.
    if (!this.textures.exists('character-backdrop')) this.load.image('character-backdrop', backdropJpg);
    if (!this.textures.exists('wordmark')) this.load.image('wordmark', wordmarkPng);
  }

  create(): void {
    if (this.textures.exists('character-backdrop')) this.add.image(CENTRE, DESIGN_HEIGHT / 2, 'character-backdrop').setScale((0.5 * SCREEN_WIDTH) / DESIGN_WIDTH);
    if (this.textures.exists('wordmark')) this.add.image(CENTRE, 62, 'wordmark').setScale(210 / 627);
    else this.add.text(CENTRE, 62, WORLD_DATA.name, { fontFamily: FONT_DISPLAY, fontSize: '36px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.add.text(CENTRE, 118, this.deps.where, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4 }).setOrigin(0.5);

    const { input, begin, code } = CREATE_LAYOUT;
    this.add.text(input.x - input.w / 2, 134, 'Your name', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4 });
    this.nameField = document.createElement('input');
    this.nameField.type = 'text';
    this.nameField.maxLength = MAX_NAME;
    this.nameField.value = DEFAULT_NAME;
    this.nameField.autocomplete = 'off';
    this.nameField.setAttribute('style', [
      `width:${input.w}px`,
      `height:${input.h}px`,
      'box-sizing:border-box',
      'padding:0 14px',
      'border:2px solid #3a4256',
      'border-radius:12px',
      'background:#121521',
      `color:${COLORS.text}`,
      `font:bold 20px ${FONT}`,
      'outline:none',
      'user-select:text',
      '-webkit-user-select:text',
    ].join(';'));
    // Placed by hand over the canvas (not Phaser's DOM layer, which sits off under the device-density canvas): the
    // canvas's box on screen gives the scale from design pixels to CSS pixels, on every resize.
    this.nameField.style.position = 'absolute';
    this.nameField.style.zIndex = '10';
    const parent = this.game.canvas.parentElement ?? document.body;
    parent.appendChild(this.nameField);
    const place = (): void => {
      const rect = this.game.canvas.getBoundingClientRect();
      const host = parent.getBoundingClientRect();
      const s = rect.width / SCREEN_WIDTH;
      const inset = (SCREEN_WIDTH - DESIGN_WIDTH) / 2;
      this.nameField.style.left = `${rect.left - host.left + (inset + input.x - input.w / 2) * s}px`;
      this.nameField.style.top = `${rect.top - host.top + (input.y - input.h / 2) * s}px`;
      this.nameField.style.width = `${input.w * s}px`;
      this.nameField.style.height = `${input.h * s}px`;
      this.nameField.style.fontSize = `${20 * s}px`;
      this.nameField.style.borderRadius = `${12 * s}px`;
      this.nameField.style.padding = `0 ${14 * s}px`;
    };
    place();
    this.scale.on(Phaser.Scale.Events.RESIZE, place);
    window.addEventListener('resize', place);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, place);
      window.removeEventListener('resize', place);
      this.nameField.remove();
    });

    this.add.text(CENTRE, 234, OFFERED.length > 1 ? 'Pick a class. Each one fights its own way.' : 'Your class, for now.', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4 }).setOrigin(0.5);
    OFFERED.forEach((id, i) => this.drawCard(id, CREATE_LAYOUT.cardY(i)));
    if (LATER.length) {
      const names = LATER.map((id) => `the ${CLASS_DATA[id].name}`);
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]!;
      this.add
        .text(CENTRE, CREATE_LAYOUT.cardY(OFFERED.length) - CARD_H / 2 + 8, `${list.charAt(0).toUpperCase()}${list.slice(1)} come in chapter 2.`, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4, align: 'center', wordWrap: { width: CARD_W } })
        .setOrigin(0.5, 0);
    }
    this.select(this.chosen);

    this.status = this.add.text(CENTRE, 752, '', { fontFamily: FONT, fontSize: '13px', color: '#f0a030', align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } }).setOrigin(0.5);
    makeButton(this, begin.x, begin.y, begin.w, begin.h, 'Begin', COLORS.button, '26px', () => this.begin());
    if (this.deps.recover) makeButton(this, code.x, code.y, code.w, code.h, 'I have a code from another phone', COLORS.log, '12px', () => this.recoverWithCode());
    this.add
      .text(12, DESIGN_HEIGHT - 8, `build 0.2.0 · ${WORLD_DATA.name}`, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim })
      .setOrigin(0, 1)
      .setAlpha(0.7);
    this.deps.log.note('character screen');
  }

  /** Pick a class (the cards call this; so can a script). */
  choose(classId: ClassId): void {
    if (!CLASS_DATA[classId] || !OFFERED.includes(classId)) return;
    this.select(classId);
  }

  /** Make the character and start play. An empty name becomes the default. */
  begin(): void {
    if (this.begun) return;
    this.begun = true;
    const name = this.nameField.value.trim().slice(0, MAX_NAME) || DEFAULT_NAME;
    this.status.setText('Making your character…');
    this.deps.make({ name, classId: this.chosen }).then(
      (game) => this.start(game, `created: ${name} the ${this.chosen}, seed ${game.state.seed}`),
      (e: unknown) => this.failed(e),
    );
  }

  /** A code typed from another phone: that character, on this one. */
  recoverWithCode(): void {
    if (this.begun || !this.deps.recover) return;
    const code = window.prompt('The code from your other phone (it looks like KPM4-R7QX-2HJD):');
    if (!code?.trim()) return;
    this.begun = true;
    this.status.setText('Finding your character…');
    this.deps.recover(code.trim()).then(
      (game) => this.start(game, `recovered: ${game.me.name} the ${game.me.classId}`),
      (e: unknown) => this.failed(e),
    );
  }

  private start(game: GameHolder, line: string): void {
    releaseClasses(this.game, game.me.classId);
    this.deps.log.note(line);
    this.deps.onCreated(game);
    for (const { key, scene } of playScenes(game, this.deps.log)) this.scene.add(key, scene, false);
    this.scene.start('board');
  }

  private failed(e: unknown): void {
    this.begun = false;
    const why = e instanceof Error ? e.message : String(e);
    this.deps.log.error(`could not start: ${why}`);
    this.status.setText(why === 'unknown code' ? 'No character has that code. Check it and try again.' : `Could not start: ${why}. Try again.`);
  }

  private drawCard(id: ClassId, y: number): void {
    const c = CLASS_DATA[id];
    const kit = kitReady(this);
    const g = kit ? plate(this, 'card_class_idle', CENTRE, y, CARD_W, CARD_H) : this.add.graphics();
    this.cards.set(id, g);
    const ink = kit ? INK : COLORS.text;
    const dim = kit ? '#46393f' : COLORS.dim;
    const zone = this.add.zone(CENTRE, y, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      feel.buzz();
      sfx.play(`ui/card-${{ warrior: 'knight', rogue: 'trickster', mage: 'wizard', ranger: 'archer' }[id] ?? 'knight'}`);
      feel.sparkle(this, CENTRE - CARD_W / 2 + 28, y - CARD_H / 2 + 22, 0xfff27a);
      this.choose(id);
    });
    const left = CENTRE - CARD_W / 2 + 16;
    // The class itself on its card: bare but for its weapon, so its colours and hair show (Mitch, AD's art, 2026-11-01).
    if (heroReady(this, id)) {
      const look = { classId: id, equipment: { weapon: plainGear('card', 'weapon', 1) } } as unknown as Character;
      new Hero(this, look, CENTRE + CARD_W / 2 - 44, y + CARD_H / 2 - 6, 0.3);
    }
    this.add.text(left, y - CARD_H / 2 + 12, c.name, { fontFamily: FONT_DISPLAY, fontSize: '20px', fontStyle: 'bold', color: ink });
    this.add.text(left, y - CARD_H / 2 + 40, c.style, { fontFamily: FONT, fontSize: '14px', color: ink });
    this.add.text(left, y - CARD_H / 2 + 64, `HP ${c.hp}  Mana ${c.mana}  Atk ${c.attack}  Def ${c.defense}
${c.kit.map((a) => ABILITIES[a]?.name ?? a).join(', ')}`, {
      fontFamily: FONT,
      fontSize: '13px',
      color: dim,
      wordWrap: { width: CARD_W - 110 },
    });
  }

  private select(classId: ClassId): void {
    this.chosen = classId;
    OFFERED.forEach((id, i) => {
      const g = this.cards.get(id)!;
      const y = CREATE_LAYOUT.cardY(i);
      if (!(g instanceof Phaser.GameObjects.Graphics)) {
        g.setFrame(id === classId ? 'card_class_chosen' : 'card_class_idle');
        return;
      }
      g.clear();
      g.fillStyle(CARD_COLORS[id], id === classId ? 1 : 0.55);
      g.fillRoundedRect(CENTRE - CARD_W / 2, y - CARD_H / 2, CARD_W, CARD_H, 16);
      if (id === classId) {
        g.lineStyle(4, 0xfff27a, 1);
        g.strokeRoundedRect(CENTRE - CARD_W / 2, y - CARD_H / 2, CARD_W, CARD_H, 16);
      }
    });
  }
}
