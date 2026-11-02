// The journal (Robin, 2026-11-02: yes): each region's creatures, what you have beaten and how often, the rest as question marks, and how many of
// its places you have found. The first of each pays a little; a region's page filled is worth a skill point (`rules/src/journal.ts`). Opened from Hero.

import Phaser from 'phaser';
import { creature, placeAt, regionCreatures, type Area } from '../../../rules/src/index.ts';
import { sfx } from '../feel.ts';
import type { GameHolder } from '../game-holder.ts';
import { CREAM, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const DIM = '#8a7458';

export class JournalScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private area = '';

  constructor(deps: { game: GameHolder }) {
    super('journal');
    this.game_ = deps.game;
  }

  create(): void {
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
      if (kitReady(this)) this.rows.push(plate(this, a.id === this.area ? 'chip_chosen' : 'chip_idle', x, 180, w - 4, 34));
      this.rows.push(this.add.text(x, 179, open ? a.name.split(' ')[0]! : '???', { fontFamily: FONT_DISPLAY, fontSize: '12px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5));
      if (!open) return;
      const zone = this.add.zone(x, 180, w, 36).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.area = a.id;
        sfx.play('ui/chip');
        this.refresh();
      });
      this.rows.push(zone);
    });

    const area = board.areas[this.area];
    if (kitReady(this)) this.rows.push(plate(this, 'board_slip', 28, 204, 356, 516).setOrigin(0, 0));
    if (!area) return;
    const ids = regionCreatures(board, area.id);
    const done = ids.filter((id) => journal.beaten[id]).length;
    this.line(218, area.name, `${done} of ${ids.length}`, true);
    ids.forEach((id, i) => {
      const seen = (journal.beaten[id] ?? 0) > 0;
      const c = creature(id, board.bestiary);
      const kind = c?.role === 'boss' ? ' (boss)' : c?.role === 'mini' ? ' (rare)' : '';
      this.line(248 + i * 28, seen ? `${c?.name ?? id}${kind}` : `? ? ?${kind}`, seen ? `beaten ${journal.beaten[id]}` : '', false, seen);
    });
    const places = new Set(Object.values(board.spaces).filter((s) => s.area === area.id).map((s) => placeAt(board, s) ?? (s.name ? s.id : '')).filter(Boolean));
    const found = [...places].filter((p) => journal.places.includes(p)).length;
    const y = 248 + ids.length * 28 + 14;
    this.line(y, 'Places found', `${found} of ${places.size}`, true);
    this.rows.push(this.add.text(42, y + 30, journal.done.includes(area.id) ? 'This page is full. A skill point is yours.' : 'Beat all of it for a skill point.', { fontFamily: FONT, fontSize: '13px', color: DIM, wordWrap: { width: 330 } }));
  }

  private line(y: number, left: string, right: string, head = false, seen = true): void {
    this.rows.push(this.add.text(42, y, left, { fontFamily: head ? FONT_DISPLAY : FONT, fontSize: head ? '16px' : '14px', fontStyle: 'bold', color: seen ? WOOD_INK : DIM }));
    this.rows.push(this.add.text(372, y, right, { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: seen ? WOOD_INK : DIM }).setOrigin(1, 0));
  }
}
