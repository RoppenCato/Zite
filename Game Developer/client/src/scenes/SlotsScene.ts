// Your characters (Robin, 2026-11-02: "save slots... so i can save different characters"): the list when this phone holds two or more, or from Settings. Tap one to play it, make a new
// one, or take one off. Layout mine.

import Phaser from 'phaser';
import { CLASS_DATA, plainGear, WORLD_DATA, type Character, type ClassId } from '../../../rules/src/index.ts';
import backdropJpg from '../../../assets/brand/character_backdrop.jpg';
import wordmarkPng from '../../../assets/brand/wordmark.png';
import { feel, sfx } from '../feel.ts';
import type { GameLog } from '../game-log.ts';
import { Hero, heroReady, preloadHero } from '../hero.ts';
import { INK, kitReady, plate, preloadKit } from '../kit.ts';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, FONT_DISPLAY, SCREEN_WIDTH } from '../layout.ts';
import { MAX_SLOTS, type Slot } from '../slots.ts';
import { makeButton } from '../ui.ts';

export interface SlotsSceneDeps {
  log: GameLog;
  /** Solo on this phone, or a shared world: the line under the title, and what taking one off means. */
  where: string;
  online: boolean;
  slots: Slot[];
  /** The current character, marked on its card. */
  current: string | null;
  play: (id: string) => void;
  remove: (id: string) => void;
  make: () => void;
}

const CENTRE = DESIGN_WIDTH / 2;
const CARD_W = 360;
const CARD_H = 92;
const CARD_STEP = 100;
const FIRST_Y = 212;

export class SlotsScene extends Phaser.Scene {
  private readonly deps: SlotsSceneDeps;

  constructor(deps: SlotsSceneDeps) {
    super('slots');
    this.deps = deps;
  }

  preload(): void {
    preloadKit(this);
    preloadHero(this, [...new Set(this.deps.slots.map((s) => s.classId))]);
    if (!this.textures.exists('character-backdrop')) this.load.image('character-backdrop', backdropJpg);
    if (!this.textures.exists('wordmark')) this.load.image('wordmark', wordmarkPng);
  }

  create(): void {
    const { slots, where } = this.deps;
    if (this.textures.exists('character-backdrop')) this.add.image(CENTRE, DESIGN_HEIGHT / 2, 'character-backdrop').setScale((0.5 * SCREEN_WIDTH) / DESIGN_WIDTH);
    if (this.textures.exists('wordmark')) this.add.image(CENTRE, 62, 'wordmark').setScale(210 / 627);
    else this.add.text(CENTRE, 62, WORLD_DATA.name, { fontFamily: FONT_DISPLAY, fontSize: '36px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.add.text(CENTRE, 118, where, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(CENTRE, 148, 'Your characters', { fontFamily: FONT_DISPLAY, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 5 }).setOrigin(0.5);
    slots.forEach((slot, i) => this.card(slot, FIRST_Y + i * CARD_STEP));
    const below = FIRST_Y + slots.length * CARD_STEP - 8;
    if (slots.length < MAX_SLOTS) makeButton(this, CENTRE, below, 240, 54, 'New character', COLORS.button, '20px', () => this.deps.make());
    else this.add.text(CENTRE, below - 14, `${MAX_SLOTS} is all a phone holds. Take one off to make room.`, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#15102a', strokeThickness: 4 }).setOrigin(0.5);
    this.deps.log.note(`characters: ${slots.length}`);
  }

  private card(slot: Slot, y: number): void {
    const cls = CLASS_DATA[slot.classId as ClassId]!;
    const kit = kitReady(this);
    const here = slot.id === this.deps.current;
    if (kit) plate(this, here ? 'card_class_chosen' : 'card_class_idle', CENTRE, y, CARD_W, CARD_H);
    else this.add.rectangle(CENTRE, y, CARD_W, CARD_H, COLORS.panel, 1);
    const zone = this.add.zone(CENTRE - 28, y, CARD_W - 56, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => {
      feel.buzz();
      sfx.play('ui/chip');
      this.deps.play(slot.id);
    });
    if (heroReady(this, slot.classId)) {
      const look = { classId: slot.classId, equipment: { weapon: plainGear('card', 'weapon', 1) } } as unknown as Character;
      new Hero(this, look, CENTRE - CARD_W / 2 + 46, y + CARD_H / 2 - 5, 0.27);
    }
    const ink = kit ? INK : COLORS.text;
    const left = CENTRE - CARD_W / 2 + 90;
    this.add.text(left, y - 32, slot.name, { fontFamily: FONT_DISPLAY, fontSize: '20px', fontStyle: 'bold', color: ink });
    this.add.text(left, y - 5, `Level ${slot.level} ${cls.name}`, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: ink });
    this.add.text(left, y + 14, slot.land, { fontFamily: FONT, fontSize: '13px', color: kit ? '#46393f' : COLORS.dim });
    makeButton(this, CENTRE + CARD_W / 2 - 32, y, 42, 42, 'X', COLORS.log, '16px', () => this.takeOff(slot), { small: true });
  }

  private takeOff(slot: Slot): void {
    const line = this.deps.online
      ? `Take ${slot.name} off this phone? It stays in the world, but only its code can bring it back here.`
      : `Delete ${slot.name} for good? This cannot be undone.`;
    if (window.confirm(line)) this.deps.remove(slot.id);
  }
}
