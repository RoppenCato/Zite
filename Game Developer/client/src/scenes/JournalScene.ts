// The journal (Robin, 2026-11-02: yes): each region's creatures, what you have beaten and how often, the rest as question marks, and how many of
// its places you have found. The first of each pays a little; a region's page filled is worth a skill point (`rules/src/journal.ts`). Opened from Hero.

import Phaser from 'phaser';
import { creature, placeAt, regionCreatures, type Area } from '../../../rules/src/index.ts';
import facesJson from '../../../assets/journal/journal_faces.json?url';
import facesPng from '../../../assets/journal/journal_faces.png';
import facesEastJson from '../../../assets/journal_east/journal_faces_east.json?url';
import facesEastPng from '../../../assets/journal_east/journal_faces_east.png';
import facesGiantsJson from '../../../assets/journal_giants/journal_faces_giants.json?url';
import facesGiantsPng from '../../../assets/journal_giants/journal_faces_giants.png';
import facesPiratesJson from '../../../assets/journal_pirates/journal_faces_pirates.json?url';
import facesPiratesPng from '../../../assets/journal_pirates/journal_faces_pirates.png';
import { sfx } from '../feel.ts';
import type { GameHolder } from '../game-holder.ts';
import { CREAM, KIT, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const DIM = '#8a7458';
const FACES = 'journal_faces';
const FACES_EAST = 'journal_faces_east';
const FACES_PIRATES = 'journal_faces_pirates';
const FACES_GIANTS = 'journal_faces_giants';
const ROWS = 6;

export class JournalScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private area = '';
  private page = 0;

  constructor(deps: { game: GameHolder }) {
    super('journal');
    this.game_ = deps.game;
  }

  preload(): void {
    if (!this.textures.exists(FACES)) this.load.atlas(FACES, facesPng, facesJson);
    if (!this.textures.exists(FACES_EAST)) this.load.atlas(FACES_EAST, facesEastPng, facesEastJson);
    if (!this.textures.exists(FACES_PIRATES)) this.load.atlas(FACES_PIRATES, facesPiratesPng, facesPiratesJson);
    if (!this.textures.exists(FACES_GIANTS)) this.load.atlas(FACES_GIANTS, facesGiantsPng, facesGiantsJson);
  }

  create(): void {
    this.rows = [];
    this.page = 0;
    const me = this.game_.me;
    const { board } = this.game_.state;
    sheet(this);
    if (kitReady(this)) plate(this, 'board_plain', 18, 116, 376, 40).setOrigin(0, 0);
    this.add.text(32, 136, 'Journal', { fontFamily: FONT_DISPLAY, fontSize: '18px', fontStyle: 'bold', color: CREAM, stroke: WOOD_INK, strokeThickness: 4 }).setOrigin(0, 0.5);
    makeButton(this, 350, 136, 76, 36, 'Back', COLORS.log, '15px', () => {
      this.scene.stop();
      this.scene.launch('bag');
    });
    this.area = board.spaces[me.space]?.area ?? me.opened[0] ?? '';
    this.refresh();
  }

  private regions(): Area[] {
    const { board } = this.game_.state;
    const reach = Math.max(...this.game_.me.opened.map((id) => board.areas[id]?.tier ?? 1)) + 1;
    return Object.values(board.areas)
      .filter((a) => this.game_.me.opened.includes(a.id) || a.tier === reach)
      .sort((a, b) => a.tier - b.tier)
      .slice(-4);
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    const { board } = this.game_.state;
    const journal = me.journal ?? { beaten: {}, places: [], done: [] };

    // The regions, as tabs; one not open yet is a question.
    const regions = this.regions();
    const w = 376 / Math.max(1, regions.length);
    regions.forEach((a, i) => {
      const open = me.opened.includes(a.id);
      const x = 18 + w * i + w / 2;
      if (kitReady(this)) this.rows.push(plate(this, a.id === this.area ? 'chip_chosen' : 'chip_idle', x, 177, w - 4, 34));
      this.rows.push(this.add.text(x, 176, open ? a.name.split(' ')[0]! : '? ? ?', { fontFamily: FONT_DISPLAY, fontSize: '12px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5));
      if (!open) return;
      const zone = this.add.zone(x, 177, w, 36).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.area = a.id;
        this.page = 0;
        sfx.play('ui/chip');
        this.refresh();
      });
      this.rows.push(zone);
    });

    const area = board.areas[this.area];
    if (kitReady(this)) this.rows.push(plate(this, 'board_slip', 18, 198, 376, 524).setOrigin(0, 0));
    if (!area) return;
    const ids = regionCreatures(board, area.id);
    const met = ids.filter((id) => journal.beaten[id]).length;
    this.rows.push(this.add.text(32, 208, area.name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: WOOD_INK }));
    this.rows.push(this.add.text(380, 216, `${met} of ${ids.length} met`, { fontFamily: FONT, fontSize: '12.5px', fontStyle: 'bold', color: DIM }).setOrigin(1, 0.5));
    this.bar(228, met / Math.max(1, ids.length), 0xf4c14a);

    // Six to a page; a grown region with more turns the page (mine).
    const pages = Math.max(1, Math.ceil(ids.length / ROWS));
    this.page = Math.min(this.page, pages - 1);
    const shown = ids.slice(this.page * ROWS, (this.page + 1) * ROWS);
    shown.forEach((id, i) => this.row(id, 242 + i * 62, journal.beaten[id] ?? 0));
    const after = 242 + shown.length * 62 + 12;

    const places = new Set(Object.values(board.spaces).filter((s) => s.area === area.id).map((s) => placeAt(board, s) ?? (s.name ? s.id : '')).filter(Boolean));
    const found = [...places].filter((p) => journal.places.includes(p)).length;
    this.rows.push(this.add.text(32, after, 'Places found', { fontFamily: FONT, fontSize: '13.5px', fontStyle: 'bold', color: WOOD_INK }));
    this.rows.push(this.add.text(380, after + 8, `${found} of ${places.size}`, { fontFamily: FONT, fontSize: '12.5px', fontStyle: 'bold', color: DIM }).setOrigin(1, 0.5));
    this.bar(after + 18, found / Math.max(1, places.size), 0x58b84f);
    if (kitReady(this)) this.rows.push(this.add.image(40, after + 42, KIT, 'badge_plus').setDisplaySize(16, 16));
    this.rows.push(this.add.text(54, after + 42, journal.done.includes(area.id) ? 'This page is full. A skill point is yours.' : 'Beat all of these for a skill point.', { fontFamily: FONT, fontSize: '12.5px', color: WOOD_INK }).setOrigin(0, 0.5));
    if (pages > 1) {
      this.rows.push(makeButton(this, 344, after + 42, 72, 34, `${this.page + 1} of ${pages}`, COLORS.log, '13px', () => {
        this.page = (this.page + 1) % pages;
        this.refresh();
      }).button);
    }
  }

  private bar(y: number, share: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xd9c8a6, 1).fillRoundedRect(32, y, 348, 8, 4);
    if (share > 0) g.fillStyle(color, 1).fillRoundedRect(32, y, Math.max(8, 348 * share), 8, 4);
    this.rows.push(g);
  }

  /** A creature: its face in a cubby, dark with a question mark until it has been beaten; a rare one or a boss on a warm backing with a pill. */
  private row(id: string, y: number, beaten: number): void {
    const { board } = this.game_.state;
    const c = creature(id, board.bestiary);
    const seen = beaten > 0;
    const special = c?.role === 'boss' || c?.role === 'mini';
    const cy = y + 28;
    if (special) {
      const back = this.add.graphics();
      back.fillStyle(0xf0e0b8, 1).fillRoundedRect(26, cy - 29, 360, 58, 8);
      this.rows.push(back);
    } else {
      const line = this.add.graphics();
      line.lineStyle(1, 0x7a6446, 0.25).lineBetween(94, y + 59, 380, y + 59);
      this.rows.push(line);
    }
    if (kitReady(this)) this.rows.push(this.add.image(58, cy, KIT, special ? 'cubby_legendary' : seen ? 'cubby_plain' : 'cubby_empty').setDisplaySize(52, 52));
    const faces = [FACES, FACES_EAST, FACES_PIRATES, FACES_GIANTS].find((key) => this.textures.exists(key) && this.textures.get(key).has(id));
    const hasFace = !!faces;
    if (hasFace) {
      const face = this.add.image(58, cy, faces!, id).setDisplaySize(44, 44);
      if (!seen) face.setTint(0x2a2640);
      this.rows.push(face);
    }
    if (!seen) this.rows.push(this.add.text(58, cy, '?', { fontFamily: FONT_DISPLAY, fontSize: '20px', fontStyle: 'bold', color: hasFace ? '#fff1b0' : WOOD_INK }).setOrigin(0.5));
    this.rows.push(this.add.text(94, special ? y + 19 : cy, seen ? (c?.name ?? id) : '? ? ?', { fontFamily: FONT, fontSize: '14.5px', fontStyle: 'bold', color: seen ? WOOD_INK : DIM }).setOrigin(0, 0.5));
    if (special) {
      const boss = c?.role === 'boss';
      const pill = this.add.graphics();
      pill.fillStyle(boss ? 0xa23c2c : 0x8a5ad0, 1).fillRoundedRect(94, y + 31, 40, 16, 8);
      this.rows.push(pill);
      this.rows.push(this.add.text(114, y + 39, boss ? 'Boss' : 'Rare', { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5));
    }
    if (seen) this.rows.push(this.add.text(380, cy, `beaten ${beaten}`, { fontFamily: FONT, fontSize: '12.5px', color: DIM }).setOrigin(1, 0.5));
  }
}
