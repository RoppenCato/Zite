// The character screen, the first time: a name and a class (Robin, 2026-10-31: the class is chosen at creation and the
// classes must feel different). Four cards with each class's style line and numbers, a Begin button. Layout mine.

import Phaser from 'phaser';
import { CLASS_DATA, CLASS_IDS, ISLAND_DATA, type ClassId } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT } from '../layout.ts';
import { LocalGame } from '../local-game.ts';
import { makeButton } from '../ui.ts';
import { playScenes } from './play.ts';

export interface CreateSceneDeps {
  log: GameLog;
  storage: Storage | null;
  /** Called with the new game before play starts, so main.ts can expose it to the pane. */
  onCreated: (game: LocalGame) => void;
}

const CENTRE = DESIGN_WIDTH / 2;
const CARD_W = 340;
const CARD_H = 104;
const CARD_GAP = 12;
const FIRST_CARD_Y = 292;
export const DEFAULT_NAME = 'Robin';
export const MAX_NAME = 12;

/** Where things sit, in design pixels (the driver taps them here). */
export const CREATE_LAYOUT = {
  input: { x: CENTRE, y: 180, w: 300, h: 44 },
  cardY: (i: number) => FIRST_CARD_Y + i * (CARD_H + CARD_GAP),
  begin: { x: CENTRE, y: 812, w: 220, h: 66 },
} as const;

const CARD_COLORS: Record<ClassId, number> = {
  warrior: 0x5a6378,
  rogue: 0x4f5a5a,
  mage: 0x5f528a,
  ranger: 0x4f6e55,
};

export class CreateScene extends Phaser.Scene {
  private readonly log: GameLog;
  private readonly storage: Storage | null;
  private readonly onCreated: (game: LocalGame) => void;
  private readonly cards = new Map<ClassId, Phaser.GameObjects.Graphics>();
  private nameField!: HTMLInputElement;
  private chosen: ClassId = 'warrior';
  private begun = false;

  constructor(deps: CreateSceneDeps) {
    super('create');
    this.log = deps.log;
    this.storage = deps.storage;
    this.onCreated = deps.onCreated;
  }

  create(): void {
    this.add.text(CENTRE, 62, 'Board World', { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.add.text(CENTRE, 100, ISLAND_DATA.name, { fontFamily: FONT, fontSize: '16px', color: COLORS.dim }).setOrigin(0.5);

    const { input, begin } = CREATE_LAYOUT;
    this.add.text(input.x - input.w / 2, 140, 'Your name', { fontFamily: FONT, fontSize: '15px', color: COLORS.dim });
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
    this.add.dom(input.x, input.y, this.nameField);

    this.add.text(CENTRE, 232, 'Pick a class. Each one fights its own way.', { fontFamily: FONT, fontSize: '15px', color: COLORS.dim }).setOrigin(0.5);
    CLASS_IDS.forEach((id, i) => this.drawCard(id, CREATE_LAYOUT.cardY(i)));
    this.select(this.chosen);

    makeButton(this, begin.x, begin.y, begin.w, begin.h, 'Begin', COLORS.button, '26px', () => this.begin());
    this.add
      .text(12, DESIGN_HEIGHT - 8, `build 0.1.0 · ${ISLAND_DATA.name}`, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim })
      .setOrigin(0, 1)
      .setAlpha(0.7);
    this.log.note('character screen');
  }

  /** Pick a class (the cards call this; so can a script). */
  choose(classId: ClassId): void {
    if (!CLASS_DATA[classId]) return;
    this.select(classId);
  }

  /** Make the character and start play. An empty name becomes the default. */
  begin(): void {
    if (this.begun) return;
    this.begun = true;
    const name = this.nameField.value.trim().slice(0, MAX_NAME) || DEFAULT_NAME;
    const game = LocalGame.create(this.storage, { name, classId: this.chosen });
    this.log.note(`created: ${name} the ${this.chosen}, seed ${game.state.seed}`);
    this.onCreated(game);
    for (const { key, scene } of playScenes(game, this.log)) this.scene.add(key, scene, false);
    this.scene.start('board');
  }

  private drawCard(id: ClassId, y: number): void {
    const c = CLASS_DATA[id];
    const g = this.add.graphics();
    this.cards.set(id, g);
    const zone = this.add.zone(CENTRE, y, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.choose(id));
    const left = CENTRE - CARD_W / 2 + 16;
    this.add.text(left, y - CARD_H / 2 + 12, c.name, { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: COLORS.text });
    this.add.text(left, y - CARD_H / 2 + 40, c.style, { fontFamily: FONT, fontSize: '14px', color: COLORS.text });
    this.add.text(left, y - CARD_H / 2 + 64, `HP ${c.hp}   Attack ${c.attack}   Defense ${c.defense}   ${c.skill.name}`, {
      fontFamily: FONT,
      fontSize: '13px',
      color: COLORS.dim,
    });
  }

  private select(classId: ClassId): void {
    this.chosen = classId;
    CLASS_IDS.forEach((id, i) => {
      const g = this.cards.get(id)!;
      const y = CREATE_LAYOUT.cardY(i);
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
