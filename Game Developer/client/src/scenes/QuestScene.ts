// The quest log (Robin, 2026-11-01: "you need a quest log then so you can keep track of what you have and what you
// completed"). The one quest under way, how far along and what it pays; what you finished. Opened from the HUD's Quests button.

import Phaser from 'phaser';
import { CALENDAR, DAY_NAMES, weekday } from '../../../rules/src/index.ts';
import type { GameHolder } from '../game-holder.ts';
import { icon, kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface QuestSceneDeps {
  game: GameHolder;
}

const CENTRE = DESIGN_WIDTH / 2;
const ROW_H = 96;

export class QuestScene extends Phaser.Scene {
  private readonly game_: GameHolder;

  constructor(deps: QuestSceneDeps) {
    super('quests');
    this.game_ = deps.game;
  }

  create(): void {
    const ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    const me = this.game_.me;
    sheet(this);
    this.add.text(26, 122, 'Quests', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: ink.text });
    makeButton(this, 344, 142, 84, 44, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).openQuests());

    let y = 172;
    this.add.text(24, y, `Under way · ${me.quests.length}`, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.dim });
    y += 30;
    if (!me.quests.length) {
      this.add.text(CENTRE, y + 8, 'Nothing yet. Walk to the map\'s quest board and pick one.', { fontFamily: FONT, fontSize: '15px', color: ink.dim, align: 'center', wordWrap: { width: DESIGN_WIDTH - 70 } }).setOrigin(0.5, 0);
      y += 66;
    }
    for (const q of me.quests) {
      const finished = q.done >= q.count;
      const rowY = y + ROW_H / 2 - 2;
      if (kitReady(this)) plate(this, finished ? 'row_bag_chosen' : 'row_bag_idle', CENTRE, rowY, DESIGN_WIDTH - 36, ROW_H - 6);
      this.add.text(32, y + 6, q.text, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.text, wordWrap: { width: DESIGN_WIDTH - 70 }, maxLines: 2 });
      this.add.text(32, y + 46, q.kind === 'loot' ? `${q.trophy ?? 'Trophies'}: ${q.done} of ${q.count}` : q.kind === 'kill' ? `${q.done} of ${q.count} beaten` : 'Keep walking the wilds.', { fontFamily: FONT, fontSize: '14px', fontStyle: finished ? 'bold' : 'normal', color: ink.text });
      this.add.text(32, y + 66, `Pays at once: ${q.gold} gold, ${q.xp} xp and a chest`, { fontFamily: FONT, fontSize: '13px', color: ink.gold });
      y += ROW_H;
    }

    y += 12;
    const done = [...(me.questsDone ?? [])].reverse();
    this.add.text(24, y, `Finished · ${done.length}`, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.dim });
    y += 28;
    if (!done.length) this.add.text(24, y, 'None so far.', { fontFamily: FONT, fontSize: '15px', color: ink.dim });
    for (const q of done) {
      if (y > 620) break;
      if (kitReady(this)) icon(this, 'mark_star', 36, y + 10).setScale(0.32);
      this.add.text(52, y, q.text, { fontFamily: FONT, fontSize: '14px', color: ink.text, wordWrap: { width: DESIGN_WIDTH - 90 }, maxLines: 1 });
      y += 26;
    }

    // The week (Robin, 2026-11-02): today, and the days something is on.
    const today = weekday(this.game_.now());
    const events = Object.values(CALENDAR.events);
    this.add.text(24, 654, 'This week', { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.dim });
    DAY_NAMES.forEach((day, i) => {
      const x = 42 + i * 55;
      const on = events.some((e) => e.days.includes(i));
      const face = this.add.graphics();
      face.fillStyle(i === today ? 0xf4c14a : on ? 0xe3c9a0 : 0xd9d0bc, 1).fillRoundedRect(x - 24, 678, 48, 30, 8);
      if (on) face.lineStyle(2, 0xa23c2c, 1).strokeRoundedRect(x - 24, 678, 48, 30, 8);
      this.add.text(x, 693, day.slice(0, 3), { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#3a2410' }).setOrigin(0.5);
    });
    this.add.text(CENTRE, 716, events.map((e) => `${e.name}: ${e.days.map((d) => DAY_NAMES[d]!.slice(0, 3)).join(', ')}`).join(' · '), { fontFamily: FONT, fontSize: '12.5px', fontStyle: 'bold', color: ink.dim }).setOrigin(0.5);
  }
}
