// The settings (Robin, 2026-11-01: "you have to go into world map to reach settings"; it has its own button now): the guide,
// sound, effects, text, vibration, the world, the log, starting over. Opened from the HUD's Settings button.

import { CLASS_DATA, type ClassId } from '../../../rules/src/index.ts';
import Phaser from 'phaser';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { RECOVER_KEY, SERVER_KEY } from '../remote-game.ts';
import { settings } from '../settings.ts';
import { kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { audio } from '../audio.ts';
import { sfx } from '../feel.ts';
import { makeButton } from '../ui.ts';
import { setFlow } from '../slots.ts';
import type { BoardScene } from './BoardScene.ts';

export interface SettingsSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where things sit, in design pixels (the driver taps them here). */
const TEST_CLASSES: ClassId[] = ['warrior', 'rogue', 'mage', 'ranger'];

export const SETTINGS_LAYOUT = {
  close: { x: 344, y: 142, w: 84, h: 44 },
  firstRowY: 182,
  rowStep: 45,
  go: { x: 344, w: 88, h: 40 },
} as const;

export class SettingsScene extends Phaser.Scene {
  /** The text colours: ink on the kit's parchment. */
  private ink: { text: string; dim: string; gold: string } = { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold };
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  private rows: Phaser.GameObjects.GameObject[] = [];

  constructor(deps: SettingsSceneDeps) {
    super('settings');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    sheet(this);
    this.add.text(26, 122, 'Settings', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: this.ink.text });
    const { close } = SETTINGS_LAYOUT;
    makeButton(this, close.x, close.y, close.w, close.h, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).openSettings());
    this.refresh();
    this.log.note('settings open');
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    this.showSettings();
  }

  /** The rows: the guide first, then the four toggles, the world, the log, the account, starting over. */
  private showSettings(): void {
    const s = settings.get();
    const { firstRowY, rowStep, go } = SETTINGS_LAYOUT;
    const rows: { name: string; text: string; value: boolean; on: string; off: string; set: (v: boolean) => void }[] = [
      { name: 'Sound', text: 'The sounds and the music.', value: s.sound, on: 'On', off: 'Off', set: (v) => {
          settings.set({ sound: v });
          audio.applySettings();
        } },
      { name: 'Effects', text: 'Fewer is kinder to a slow phone.', value: !s.fewerEffects, on: 'Full', off: 'Fewer', set: (v) => settings.set({ fewerEffects: !v }) },
      { name: 'Text', text: 'Larger message lines.', value: s.largeText, on: 'Large', off: 'Normal', set: (v) => settings.set({ largeText: v }) },
      { name: 'Vibration', text: 'A short buzz when you press.', value: s.vibration, on: 'On', off: 'Off', set: (v) => settings.set({ vibration: v }) },
    ];
    this.settingRow(0, 'Guide', 'What fights, guards and abilities do.', 'Open', () => {
      sfx.play('ui/sheet-open');
      this.scene.launch('guide', { page: 0 });
    });
    rows.forEach((row, n) => {
      const i = n + 1;
      const y = firstRowY + i * rowStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_atlas_idle', CENTRE, y, DESIGN_WIDTH - 36, rowStep - 4));
      this.rows.push(this.add.text(26, y - 23, row.name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: this.ink.text }));
      this.rows.push(this.add.text(26, y - 2, row.text, { fontFamily: FONT, fontSize: '13px', color: this.ink.dim, wordWrap: { width: 270 }, maxLines: 2 }));
      this.rows.push(makeButton(this, go.x, y, go.w, go.h, row.value ? row.on : row.off, row.value ? COLORS.button : COLORS.log, '14px', () => { row.set(!row.value); this.log.note(`setting ${row.name}: ${!row.value ? row.on : row.off}`); this.refresh(); }).button);
    });
    const link = this.game_.link();
    const server = stored(SERVER_KEY);
    const worldText = link.kind === 'solo'
      ? 'Solo here. Join a shared world by address.'
      : link.kind === 'online'
        ? `Online: ${link.online} ${link.online === 1 ? 'player' : 'players'} here now.`
        : `Trying to reach the world (${link.tries} ${link.tries === 1 ? 'try' : 'tries'}).`;
    this.settingRow(rows.length + 1, 'World', worldText, link.kind === 'solo' ? 'Join…' : 'Server…', () => {
      const typed = window.prompt('The world\'s address (wss://…), or "off" for solo play:', server ?? 'wss://');
      if (typed === null) return;
      location.assign(`${location.pathname}?server=${encodeURIComponent(typed.trim())}`);
    });
    const code = this.game_.recovery();
    if (code) {
      this.settingRow(rows.length + 2, 'Account', `Your code for another phone: ${code}.`, 'Use a code…', () => {
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
    this.settingRow(rows.length + (code ? 3 : 2), 'Characters', 'Play another character, or make a new one.', 'Choose', () => {
      if (this.game_.me.fight) return;
      setFlow('choose');
      location.reload();
    });
    // For Robin's testing (2026-11-02), to go before an Alpha: another class at the same level, or a level more. The page loads again for its art.
    // The public site has none of them (mine, for Robin's friends).
    if (/^(localhost|127\.|192\.168\.)/.test(location.hostname)) {
      const next = TEST_CLASSES[(TEST_CLASSES.indexOf(this.game_.me.classId) + 1) % TEST_CLASSES.length]!;
      const row = rows.length + (code ? 6 : 5);
      this.settingRow(row, 'Test: class', `Now ${CLASS_DATA[this.game_.me.classId]?.name}. Skills start over.`, CLASS_DATA[next]!.name, () => {
        if (this.game_.me.fight) return;
        void this.game_.act({ type: 'skill', op: 'testClass', classId: next, player: this.game_.player } as never).then(() => setTimeout(() => location.reload(), 150));
      });
      this.settingRow(row + 4, 'Test: legend', 'Wear your class’s next one.', 'Next', () => {
        if (this.game_.me.fight) return;
        void this.game_.act({ type: 'skill', op: 'testLegend', player: this.game_.player } as never).then(() => setTimeout(() => location.reload(), 150));
      });
    this.settingRow(row + 1, 'Test: level', `Now level ${this.game_.me.level}.`, '+1 level', () => {
        if (this.game_.me.fight) return;
        void this.game_.act({ type: 'skill', op: 'testLevel', player: this.game_.player } as never).then(() => setTimeout(() => location.reload(), 150));
      });
      const { board } = this.game_.state;
      const towns = Object.values(board.areas).filter((a) => !a.dungeon).sort((a, b) => a.tier - b.tier).map((a) => Object.values(board.spaces).find((s) => s.area === a.id && s.kind === 'town')).filter((s): s is NonNullable<typeof s> => !!s);
      const hereTier = towns.findIndex((t) => t.area === board.spaces[this.game_.me.space]?.area);
      const nextTown = towns[(hereTier + 1) % towns.length];
      if (nextTown) {
        this.settingRow(row + 3, 'Test: land', `Next: ${board.areas[nextTown.area]?.name}.`, 'Go', () => {
          if (this.game_.me.fight) return;
          void this.game_.act({ type: 'skill', op: 'testLand', to: nextTown.id, player: this.game_.player } as never).then(() => setTimeout(() => location.reload(), 150));
        });
      }
      this.settingRow(row + 2, 'Test: Arena', this.game_.me.arenaTest ? 'Open for you whatever the day.' : 'Goes by the calendar.', this.game_.me.arenaTest ? 'Calendar' : 'Open it', () => {
        void this.game_.act({ type: 'arena', op: 'test', player: this.game_.player } as never).then(() => setTimeout(() => location.reload(), 150));
      });
    }
    this.settingRow(rows.length + (code ? 4 : 3), 'Log', 'A file of what happened, for bug reports.', 'Save', () => (this.scene.get('board') as BoardScene).downloadLog());
    this.settingRow(rows.length + (code ? 5 : 4), 'Start over', code ? 'Your code still brings this character back.' : 'Throw this save away for good.', 'Start over', () => {
      if (!window.confirm('Start over with a new character?')) return;
      this.game_.reset();
      setFlow('choose');
      location.reload();
    });
  }

  private settingRow(i: number, name: string, text: string, button: string, onTap: () => void): void {
    const { firstRowY, rowStep, go } = SETTINGS_LAYOUT;
    const y = firstRowY + i * rowStep;
    if (kitReady(this)) this.rows.push(plate(this, 'row_atlas_idle', CENTRE, y, DESIGN_WIDTH - 36, SETTINGS_LAYOUT.rowStep - 4));
    this.rows.push(this.add.text(26, y - 23, name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: this.ink.text }));
    this.rows.push(this.add.text(26, y - 2, text, { fontFamily: FONT, fontSize: '13px', color: this.ink.dim, wordWrap: { width: 270 }, maxLines: 2 }));
    this.rows.push(makeButton(this, go.x, y, go.w, go.h, button, COLORS.log, '14px', onTap).button);
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
