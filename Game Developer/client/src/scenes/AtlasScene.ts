// The world map as a list (mine, 2026-11-01, from Robin's list): the areas by tier, open or not, their bosses and your
// kills, your errands there, where you stand. A tap on an area frames it on the board; Close gives the board back.
// Opened from the HUD's World button. Shapes and text only, like the rest.

import Phaser from 'phaser';
import { creature, questLine, type Area } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, THEME_COLORS, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { settings } from '../settings.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface AtlasSceneDeps {
  game: LocalGame;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where things sit, in design pixels (the driver taps them here). */
export const ATLAS_LAYOUT = {
  close: { x: 364, y: 126, w: 72, h: 32 },
  settings: { x: 276, y: 126, w: 92, h: 32 },
  firstRowY: 176,
  rowStep: 74,
  rows: 7,
  go: { x: 364, w: 72, h: 30 },
} as const;

export class AtlasScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private page = 0;
  private mode: 'areas' | 'settings' = 'areas';
  private settingsLabel!: Phaser.GameObjects.Text;

  constructor(deps: AtlasSceneDeps) {
    super('atlas');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.page = 0;
    this.mode = 'areas';
    this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();
    this.add.text(24, 114, 'The world', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: COLORS.text });
    const { close, settings: settingsButton } = ATLAS_LAYOUT;
    makeButton(this, close.x, close.y, close.w, close.h, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).atlasClosed());
    this.settingsLabel = makeButton(this, settingsButton.x, settingsButton.y, settingsButton.w, settingsButton.h, 'Settings', COLORS.log, '14px', () => {
      this.mode = this.mode === 'areas' ? 'settings' : 'areas';
      this.settingsLabel.setText(this.mode === 'areas' ? 'Settings' : 'Areas');
      this.refresh();
    }).label;
    this.refresh();
    this.log.note('atlas open');
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    if (this.mode === 'settings') {
      this.showSettings();
      return;
    }
    const me = this.game_.me;
    const { board } = this.game_.state;
    const areas = Object.values(board.areas).sort((a, b) => a.tier - b.tier);
    const here = board.spaces[me.space]?.area;
    const { firstRowY, rowStep, rows, go } = ATLAS_LAYOUT;
    const pages = Math.max(1, Math.ceil(areas.length / rows));
    this.page = Math.min(this.page, pages - 1);
    const shown = areas.slice(this.page * rows, this.page * rows + rows);
    shown.forEach((area, i) => {
      const y = firstRowY + i * rowStep;
      const open = me.opened.includes(area.id);
      const swatch = this.add.rectangle(34, y + 14, 20, 40, THEME_COLORS[area.theme] ?? COLORS.ground, 1).setStrokeStyle(2, 0x101318, 1);
      this.rows.push(swatch);
      const name = `${area.name} · tier ${area.tier}${area.id === here ? ' · you are here' : ''}`;
      this.rows.push(this.add.text(54, y - 6, name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: open ? COLORS.text : COLORS.dim }));
      this.rows.push(this.add.text(54, y + 14, this.detail(area, open), { fontFamily: FONT, fontSize: '11px', color: COLORS.dim, wordWrap: { width: 258 } }));
      if (open) this.rows.push(makeButton(this, go.x, y + 12, go.w, go.h, 'Go', COLORS.button, '14px', () => (this.scene.get('board') as BoardScene).atlasFrame(area.id)).button);
    });
    if (pages > 1) {
      const y = firstRowY + rows * rowStep - 10;
      this.rows.push(this.add.text(CENTRE, y, `${this.page + 1} of ${pages}`, { fontFamily: FONT, fontSize: '13px', color: COLORS.dim }).setOrigin(0.5));
      if (this.page > 0) this.rows.push(makeButton(this, 110, y, 100, 30, 'Earlier', COLORS.log, '14px', () => { this.page--; this.refresh(); }).button);
      if (this.page < pages - 1) this.rows.push(makeButton(this, 302, y, 100, 30, 'Further', COLORS.log, '14px', () => { this.page++; this.refresh(); }).button);
    }
  }

  /** The three settings as rows with a toggle each (mine, 2026-11-01: sound for the sound layer to come, fewer effects, larger text). */
  private showSettings(): void {
    const s = settings.get();
    const { firstRowY, rowStep, go } = ATLAS_LAYOUT;
    const rows: { name: string; text: string; value: boolean; on: string; off: string; set: (v: boolean) => void }[] = [
      { name: 'Sound', text: 'Music and sounds, when they come. Off keeps the game quiet.', value: s.sound, on: 'On', off: 'Off', set: (v) => settings.set({ sound: v }) },
      { name: 'Effects', text: 'Fewer: bars and the camera jump instead of gliding, blows do not flash. For a slow phone.', value: !s.fewerEffects, on: 'Full', off: 'Fewer', set: (v) => settings.set({ fewerEffects: !v }) },
      { name: 'Text', text: 'Larger text in the message lines, from the next screen on.', value: s.largeText, on: 'Large', off: 'Normal', set: (v) => settings.set({ largeText: v }) },
    ];
    rows.forEach((row, i) => {
      const y = firstRowY + i * rowStep;
      this.rows.push(this.add.text(24, y - 6, row.name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: COLORS.text }));
      this.rows.push(this.add.text(24, y + 14, row.text, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim, wordWrap: { width: 280 } }));
      this.rows.push(makeButton(this, go.x, y + 12, go.w + 8, go.h, row.value ? row.on : row.off, row.value ? COLORS.button : COLORS.log, '14px', () => { row.set(!row.value); this.log.note(`setting ${row.name}: ${!row.value ? row.on : row.off}`); this.refresh(); }).button);
    });
  }

  /** One line under the name: the levels, the boss and your kills, the errand, or that it is closed and what opens it. */
  private detail(area: Area, open: boolean): string {
    const me = this.game_.me;
    const { board } = this.game_.state;
    const gate = Object.values(board.spaces).find((s) => s.area === area.id && s.kind === 'boss');
    const boss = gate?.boss ? creature(gate.boss, board.bestiary) : undefined;
    const kills = gate ? (me.bossKills[gate.id] ?? 0) : 0;
    if (!open) {
      const opener = Object.values(board.spaces).find((s) => s.opens === area.id);
      const by = opener?.boss ? creature(opener.boss, board.bestiary)?.name : undefined;
      return `Closed.${by ? ` Beat the ${by} at ${opener!.name} to open it.` : ''}`;
    }
    const errand = me.quests.find((q) => q.area === area.id);
    const parts = [`Levels ${area.levels[0]} to ${area.levels[1]}.`];
    if (boss) parts.push(`${boss.name} at ${gate!.name}${kills ? `, beaten ${kills}×` : ''}.`);
    if (errand) parts.push(`Errand: ${questLine(errand)}`);
    return parts.join(' ');
  }
}
