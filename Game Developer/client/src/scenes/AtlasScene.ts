// The world map as a list (mine, 2026-11-01, from Robin's list): the areas by tier, open or not, their bosses and your
// kills, your errands there, where you stand. A tap on an area frames it on the board; Close gives the board back.
// Opened from the HUD's World button. Shapes and text only, like the rest.

import Phaser from 'phaser';
import { creature, questLine, type Area } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, RARITY_COLORS, RARITY_INK, THEME_COLORS, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { RECOVER_KEY, SERVER_KEY } from '../remote-game.ts';
import { settings } from '../settings.ts';
import { kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { audio } from '../audio.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface AtlasSceneDeps {
  game: GameHolder;
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
  /** The text colours: ink on the kit's parchment. */
  private ink: { text: string; dim: string; gold: string } = { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold };
  private rarity: Record<string, string> = RARITY_COLORS;
  private readonly game_: GameHolder;
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
    this.ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    this.rarity = kitReady(this) ? RARITY_INK : RARITY_COLORS;
    sheet(this);
    this.add.text(24, 112, 'The world', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: this.ink.text });
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
      if (kitReady(this)) this.rows.push(plate(this, 'row_atlas_idle', CENTRE, y + 10, DESIGN_WIDTH - 36, rowStep - 6));
      this.rows.push(this.add.text(54, y - 6, name, { fontFamily: FONT_DISPLAY, fontSize: '15px', fontStyle: 'bold', wordWrap: { width: 250 }, color: open ? this.ink.text : this.ink.dim }));
      this.rows.push(this.add.text(54, y + 14, this.detail(area, open), { fontFamily: FONT, fontSize: '11px', color: this.ink.dim, wordWrap: { width: 258 } }));
      if (open) this.rows.push(makeButton(this, go.x, y + 12, go.w, go.h, 'Go', COLORS.button, '14px', () => (this.scene.get('board') as BoardScene).atlasFrame(area.id)).button);
    });
    if (pages > 1) {
      const y = firstRowY + rows * rowStep - 10;
      this.rows.push(this.add.text(CENTRE, y, `${this.page + 1} of ${pages}`, { fontFamily: FONT, fontSize: '13px', color: this.ink.dim }).setOrigin(0.5));
      if (this.page > 0) this.rows.push(makeButton(this, 110, y, 100, 30, 'Earlier', COLORS.log, '14px', () => { this.page--; this.refresh(); }).button);
      if (this.page < pages - 1) this.rows.push(makeButton(this, 302, y, 100, 30, 'Further', COLORS.log, '14px', () => { this.page++; this.refresh(); }).button);
    }
  }

  /** The four settings as rows with a toggle each (mine, 2026-11-01: sound for the sound layer to come, fewer effects, larger text, vibration),
   * then the world (the server, or solo) and the account (the code for another phone, starting over). */
  private showSettings(): void {
    const s = settings.get();
    const { firstRowY, rowStep, go } = ATLAS_LAYOUT;
    const rows: { name: string; text: string; value: boolean; on: string; off: string; set: (v: boolean) => void }[] = [
      { name: 'Sound', text: 'The sounds, and the music when it comes. Off keeps the game quiet.', value: s.sound, on: 'On', off: 'Off', set: (v) => {
          settings.set({ sound: v });
          audio.applySettings();
        } },
      { name: 'Effects', text: 'Fewer: bars and the camera jump instead of gliding, blows do not flash. For a slow phone.', value: !s.fewerEffects, on: 'Full', off: 'Fewer', set: (v) => settings.set({ fewerEffects: !v }) },
      { name: 'Text', text: 'Larger text in the message lines, from the next screen on.', value: s.largeText, on: 'Large', off: 'Normal', set: (v) => settings.set({ largeText: v }) },
      { name: 'Vibration', text: 'A short buzz when you press, on phones that can.', value: s.vibration, on: 'On', off: 'Off', set: (v) => settings.set({ vibration: v }) },
    ];
    rows.forEach((row, i) => {
      const y = firstRowY + i * rowStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_atlas_idle', CENTRE, y + 10, DESIGN_WIDTH - 36, rowStep - 6));
      this.rows.push(this.add.text(24, y - 6, row.name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: this.ink.text }));
      this.rows.push(this.add.text(24, y + 14, row.text, { fontFamily: FONT, fontSize: '11px', color: this.ink.dim, wordWrap: { width: 280 } }));
      this.rows.push(makeButton(this, go.x, y + 12, go.w + 8, go.h, row.value ? row.on : row.off, row.value ? COLORS.button : COLORS.log, '14px', () => { row.set(!row.value); this.log.note(`setting ${row.name}: ${!row.value ? row.on : row.off}`); this.refresh(); }).button);
    });
    const link = this.game_.link();
    const server = stored(SERVER_KEY);
    const worldText = link.kind === 'solo'
      ? 'Solo play on this phone. Join a world with its address (wss://…) and your character there is kept on the server.'
      : link.kind === 'online'
        ? `Online at ${server ?? '?'}: ${link.online} ${link.online === 1 ? 'player' : 'players'} here now.`
        : `Trying to reach ${server ?? '?'} (${link.tries} ${link.tries === 1 ? 'try' : 'tries'}): ${link.reason}.`;
    this.settingRow(rows.length, 'World', worldText, link.kind === 'solo' ? 'Join…' : 'Server…', () => {
      const typed = window.prompt('The world\'s address (wss://…), or "off" for solo play:', server ?? 'wss://');
      if (typed === null) return;
      location.assign(`${location.pathname}?server=${encodeURIComponent(typed.trim())}`);
    });
    const code = this.game_.recovery();
    if (code) {
      this.settingRow(rows.length + 1, 'Account', `Your code for another phone: ${code}. Write it down; it brings this character back.`, 'Use a code…', () => {
        const typed = window.prompt('The code from your other phone:');
        if (!typed?.trim()) return;
        try {
          localStorage.setItem(RECOVER_KEY, typed.trim());
        } catch {
          return;
        }
        this.game_.reset();
        location.reload();
      });
    }
    this.settingRow(rows.length + (code ? 2 : 1), 'Start over', code ? 'Forget this phone\'s character (the code still brings it back) and make a new one.' : 'Throw this save away and make a new character.', 'Start over', () => {
      if (!window.confirm('Start over with a new character?')) return;
      this.game_.reset();
      location.reload();
    });
  }

  private settingRow(i: number, name: string, text: string, button: string, onTap: () => void): void {
    const { firstRowY, rowStep, go } = ATLAS_LAYOUT;
    const y = firstRowY + i * rowStep;
    if (kitReady(this)) this.rows.push(plate(this, 'row_atlas_idle', CENTRE, y + 10, DESIGN_WIDTH - 36, ATLAS_LAYOUT.rowStep - 6));
    this.rows.push(this.add.text(24, y - 6, name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: this.ink.text }));
    this.rows.push(this.add.text(24, y + 14, text, { fontFamily: FONT, fontSize: '11px', color: this.ink.dim, wordWrap: { width: 258 } }));
    this.rows.push(makeButton(this, go.x - 10, y + 12, go.w + 28, go.h, button, COLORS.log, '13px', onTap).button);
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
    const parts = [`${area.kingdom ? `${area.kingdom}. ` : ''}Levels ${area.levels[0]} to ${area.levels[1]}.`];
    if (boss) parts.push(`${boss.name} at ${gate!.name}${kills ? `, beaten ${kills}×` : ''}.`);
    if (errand) parts.push(`Errand: ${questLine(errand)}`);
    return parts.join(' ');
  }
}

/** A value from the page's storage, or null when there is none or storage is blocked. */
function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
