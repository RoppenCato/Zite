// The quest log (Robin, 2026-11-01: "you need a quest log then so you can keep track of what you have and what you
// completed"). What you carry, how far along and what it pays; what you finished. Opened from the HUD's Quests button.

import Phaser from 'phaser';
import type { Quest } from '../../../rules/src/index.ts';
import type { GameHolder } from '../game-holder.ts';
import { icon, kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface QuestSceneDeps {
  game: GameHolder;
}

const CENTRE = DESIGN_WIDTH / 2;
const ROW_H = 84;

export class QuestScene extends Phaser.Scene {
  private readonly game_: GameHolder;

  constructor(deps: QuestSceneDeps) {
    super('quests');
    this.game_ = deps.game;
  }

  create(): void {
    const ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    const me = this.game_.me;
    const spaces = this.game_.state.board.spaces;
    const town = (q: Quest): string => spaces[q.town]?.name ?? 'the town';
    sheet(this);
    this.add.text(26, 122, 'Quests', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: ink.text });
    makeButton(this, 344, 142, 84, 44, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).openQuests());

    let y = 172;
    this.add.text(24, y, `Under way · ${me.quests.length}`, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.dim });
    y += 30;
    if (!me.quests.length) {
      this.add.text(CENTRE, y + 8, 'Nothing yet. Towns hand out errands: land on one and see.', { fontFamily: FONT, fontSize: '15px', color: ink.dim, align: 'center', wordWrap: { width: DESIGN_WIDTH - 70 } }).setOrigin(0.5, 0);
      y += 66;
    }
    for (const q of me.quests) {
      const finished = q.done >= q.count;
      const rowY = y + ROW_H / 2 - 2;
      if (kitReady(this)) plate(this, finished ? 'row_bag_chosen' : 'row_bag_idle', CENTRE, rowY, DESIGN_WIDTH - 36, ROW_H - 6);
      this.add.text(32, y + 6, q.text, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.text, wordWrap: { width: DESIGN_WIDTH - 110 }, maxLines: 1 });
      this.add.text(32, y + 30, finished ? `Done! Go back to ${town(q)} to be paid.` : `${q.done} of ${q.count} · from ${town(q)}`, { fontFamily: FONT, fontSize: '14px', fontStyle: finished ? 'bold' : 'normal', color: ink.text });
      this.add.text(32, y + 52, `Pays ${q.gold} gold and ${q.xp} xp${q.unique ? ', maybe a unique' : ''}`, { fontFamily: FONT, fontSize: '13px', color: ink.gold });
      y += ROW_H;
    }

    y += 12;
    const done = [...(me.questsDone ?? [])].reverse();
    this.add.text(24, y, `Finished · ${done.length}`, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink.dim });
    y += 28;
    if (!done.length) this.add.text(24, y, 'None so far.', { fontFamily: FONT, fontSize: '15px', color: ink.dim });
    for (const q of done) {
      if (y > 700) break;
      if (kitReady(this)) icon(this, 'mark_star', 36, y + 10).setScale(0.32);
      this.add.text(52, y, q.text, { fontFamily: FONT, fontSize: '14px', color: ink.text, wordWrap: { width: DESIGN_WIDTH - 90 }, maxLines: 1 });
      y += 26;
    }
  }
}
