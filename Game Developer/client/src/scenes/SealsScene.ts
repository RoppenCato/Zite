// The Seals (Robin, 2026-11-02): how far you are from the end of the game. One for each land's greatest boss, the ones still to come, and what they open. Opened from Hero. Layout mine.

import Phaser from 'phaser';
import { FINAL_BOSS, sealCount, sealsOf, SEALS_COMING } from '../../../rules/src/index.ts';
import facesJson from '../../../assets/journal/journal_faces.json?url';
import facesPng from '../../../assets/journal/journal_faces.png';
import facesEastJson from '../../../assets/journal_east/journal_faces_east.json?url';
import facesEastPng from '../../../assets/journal_east/journal_faces_east.png';
import facesCrownJson from '../../../assets/journal_crown/journal_faces_crown.json?url';
import facesCrownPng from '../../../assets/journal_crown/journal_faces_crown.png';
import facesGiantsJson from '../../../assets/journal_giants/journal_faces_giants.json?url';
import facesGiantsPng from '../../../assets/journal_giants/journal_faces_giants.png';
import facesPiratesJson from '../../../assets/journal_pirates/journal_faces_pirates.json?url';
import facesPiratesPng from '../../../assets/journal_pirates/journal_faces_pirates.png';
import { preloadSeals, SEALS } from '../effects.ts';
import type { GameHolder } from '../game-holder.ts';
import { CREAM, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const DIM = '#8a7458';
const RUST = '#a23c2c';
const FACES = 'journal_faces';
const FACES_EAST = 'journal_faces_east';
const FACES_PIRATES = 'journal_faces_pirates';
const FACES_GIANTS = 'journal_faces_giants';
const FACES_CROWN = 'journal_faces_crown';
const ROW_H = 62;

export class SealsScene extends Phaser.Scene {
  private readonly game_: GameHolder;

  constructor(deps: { game: GameHolder }) {
    super('seals');
    this.game_ = deps.game;
  }

  preload(): void {
    preloadSeals(this);
    if (!this.textures.exists(FACES)) this.load.atlas(FACES, facesPng, facesJson);
    if (!this.textures.exists(FACES_EAST)) this.load.atlas(FACES_EAST, facesEastPng, facesEastJson);
    if (!this.textures.exists(FACES_PIRATES)) this.load.atlas(FACES_PIRATES, facesPiratesPng, facesPiratesJson);
    if (!this.textures.exists(FACES_GIANTS)) this.load.atlas(FACES_GIANTS, facesGiantsPng, facesGiantsJson);
    if (!this.textures.exists(FACES_CROWN)) this.load.atlas(FACES_CROWN, facesCrownPng, facesCrownJson);
  }

  create(): void {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const { won, total } = sealCount(board, me);
    const all = won === total + SEALS_COMING.length;
    const finished = Object.values(this.game_.state.board.spaces).some((s) => s.boss === FINAL_BOSS && (this.game_.me.bossKills[s.id] ?? 0) > 0);
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
      this.medal(seal.won ? seal.land : null, y);
      const face = seal.open ? [FACES, FACES_EAST, FACES_PIRATES, FACES_GIANTS, FACES_CROWN].find((key) => this.textures.exists(key) && this.textures.get(key).has(seal.boss)) : undefined;
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
      this.medal(null, y);
      this.add.text(78, y - 22, land.name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: DIM });
      this.add.text(78, y - 2, 'Still to come', { fontFamily: FONT, fontSize: '13.5px', color: DIM });
      this.add.text(78, y + 15, `Level ${land.levels[0]} to ${land.levels[1]}`, { fontFamily: FONT, fontSize: '12px', color: DIM });
      y += ROW_H;
    }
    if (all) this.add.text(32, y - 14, finished ? 'The Hollow King is beaten. The old kingdom sleeps. You have done it all.' : 'You hold every Seal. The door before Crownhaven’s castle stands open.', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: RUST, wordWrap: { width: 348 } });
  }

  /** A land's seal when won; the empty one when not. */
  private medal(land: string | null, y: number): void {
    if (!this.textures.exists(SEALS)) return;
    this.add.image(46, y, SEALS, land ? `seal_${land}` : 'seal_empty').setScale(0.5);
  }
}
