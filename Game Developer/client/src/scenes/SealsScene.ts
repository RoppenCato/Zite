// The Seals (Robin, 2026-11-02): how far you are from the end of the game. One for each land's greatest boss, the ones still to come, and what they open. Opened from Hero. Layout mine.

import Phaser from 'phaser';
import { sealCount, sealsOf, SEALS_COMING } from '../../../rules/src/index.ts';
import facesJson from '../../../assets/journal/journal_faces.json?url';
import facesPng from '../../../assets/journal/journal_faces.png';
import facesEastJson from '../../../assets/journal_east/journal_faces_east.json?url';
import facesEastPng from '../../../assets/journal_east/journal_faces_east.png';
import type { GameHolder } from '../game-holder.ts';
import { CREAM, KIT, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const DIM = '#8a7458';
const RUST = '#a23c2c';
const GOLD = 0xf4c14a;
const FACES = 'journal_faces';
const FACES_EAST = 'journal_faces_east';
const ROW_H = 62;

export class SealsScene extends Phaser.Scene {
  private readonly game_: GameHolder;

  constructor(deps: { game: GameHolder }) {
    super('seals');
    this.game_ = deps.game;
  }

  preload(): void {
    if (!this.textures.exists(FACES)) this.load.atlas(FACES, facesPng, facesJson);
    if (!this.textures.exists(FACES_EAST)) this.load.atlas(FACES_EAST, facesEastPng, facesEastJson);
  }

  create(): void {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const { won, total } = sealCount(board, me);
    const all = won === total + SEALS_COMING.length;
    sheet(this);
    if (kitReady(this)) plate(this, 'board_plain', 18, 116, 376, 40).setOrigin(0, 0);
    this.add.text(32, 136, `Seals  ${won} of ${total + SEALS_COMING.length}`, { fontFamily: FONT_DISPLAY, fontSize: '18px', fontStyle: 'bold', color: CREAM, stroke: WOOD_INK, strokeThickness: 4 }).setOrigin(0, 0.5);
    makeButton(this, 350, 136, 76, 36, 'Back', COLORS.log, '15px', () => {
      this.scene.stop();
      this.scene.launch('bag');
    });
    if (kitReady(this)) plate(this, 'board_slip', 18, 162, 376, 560).setOrigin(0, 0);
    this.add.text(32, 172, 'Beat the greatest boss of each land to win its Seal. With every Seal, a way opens under Crownhaven, to the last fight of all.', { fontFamily: FONT, fontSize: '14px', color: WOOD_INK, wordWrap: { width: 348 } });
    let y = 258;
    for (const seal of sealsOf(board, me)) {
      this.medal(seal.won, y);
      const face = seal.open ? [FACES, FACES_EAST].find((key) => this.textures.exists(key) && this.textures.get(key).has(seal.boss)) : undefined;
      if (face) {
        const pic = this.add.image(370, y, face, seal.boss).setDisplaySize(44, 44);
        if (!seal.won) pic.setTint(0x777777);
      }
      this.add.text(78, y - 22, seal.landName, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: seal.won ? WOOD_INK : DIM });
      this.add.text(78, y - 2, seal.won ? `${seal.bossName} beaten` : seal.open ? `${seal.bossName} waits there` : 'Not open to you yet', { fontFamily: FONT, fontSize: '13.5px', fontStyle: seal.won ? 'bold' : 'normal', color: seal.won ? RUST : DIM });
      this.add.text(78, y + 15, `Level ${seal.levels[0]} to ${seal.levels[1]}`, { fontFamily: FONT, fontSize: '12px', color: DIM });
      y += ROW_H;
    }
    for (const land of SEALS_COMING) {
      this.medal(false, y);
      this.add.text(78, y - 22, land.name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: DIM });
      this.add.text(78, y - 2, 'Still to come', { fontFamily: FONT, fontSize: '13.5px', color: DIM });
      this.add.text(78, y + 15, `Level ${land.levels[0]} to ${land.levels[1]}`, { fontFamily: FONT, fontSize: '12px', color: DIM });
      y += ROW_H;
    }
    if (all) this.add.text(32, y - 14, 'You hold every Seal. The way under Crownhaven is still being dug: it opens in a coming version.', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: RUST, wordWrap: { width: 348 } });
  }

  private medal(won: boolean, y: number): void {
    if (kitReady(this)) this.add.image(48, y, KIT, won ? 'cubby_plain' : 'cubby_empty').setDisplaySize(46, 46);
    if (!kitReady(this)) return;
    const star = this.add.image(48, y, KIT, 'mark_star');
    star.setScale(34 / star.width);
    if (won) star.setTint(GOLD);
    else star.setTint(0x6a5a48).setAlpha(0.45);
  }
}
