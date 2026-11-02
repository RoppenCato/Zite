// The name board under a fighter's feet (Robin, 2026-11-02: "some sort of wooden board, where the hp, mp, valor etc are on the
// upper part, and text on the lower", concept 1; Mitch, AD's `assets/ui/` pieces and fight_boards notes give the numbers). Bars and
// the meter's pips on the wood; the words on a parchment slip that shows when there are any, the plank growing with its lines.

import Phaser from 'phaser';
import { KIT, kitReady, plate, resizePlate } from './kit.ts';
import { COLORS, FONT } from './layout.ts';
import { Bar } from './ui.ts';

const DARK = '#3a2410';
const RUST = '#a23c2c';
const CREAM = '#f7efdc';
const NEXT = 'next:';
const PIP = { x: 67, gap: 12, size: 10 } as const;

export interface BoardShape {
  /** The plank's left edge, width and top, in design pixels. */
  x: number;
  w: number;
  top: number;
  hpColor: number;
  mana: boolean;
  /** The plank's height with no words, and with this many lines of them. */
  bare: number;
  plank: (lines: number) => number;
  slip: { x: number; w: number; top: number };
  words: { size: number; wrap: number; firstY: number; lineH: number; lines: number };
}

export const HERO_BOARD = (top: number): BoardShape => ({
  x: 6,
  w: 134,
  top,
  hpColor: COLORS.button,
  mana: true,
  bare: 49,
  plank: (n) => 58 + n * 14.5,
  slip: { x: 12, w: 122, top: 47 },
  words: { size: 12, wrap: 116, firstY: 56, lineH: 14.5, lines: 2 },
});

export const ENEMY_BOARD = (top: number): BoardShape => ({
  x: 232,
  w: 172,
  top,
  hpColor: 0xd9534f,
  mana: false,
  bare: 26,
  plank: (n) => 35 + n * 15,
  slip: { x: 238, w: 160, top: 25 },
  words: { size: 12.5, wrap: 152, firstY: 34, lineH: 15, lines: 3 },
});

export class FightBoard {
  readonly hp: Bar;
  readonly mana: Bar | null = null;
  private readonly shape: BoardShape;
  private readonly plank: Phaser.GameObjects.NineSlice | null = null;
  private readonly slip: Phaser.GameObjects.NineSlice | null = null;
  private readonly next: Phaser.GameObjects.Text;
  private readonly lines: Phaser.GameObjects.Text[] = [];
  private readonly meterName: Phaser.GameObjects.Text;
  private readonly pips: Phaser.GameObjects.Image[] = [];
  private shown = '';

  constructor(scene: Phaser.Scene, shape: BoardShape) {
    this.shape = shape;
    const kit = kitReady(scene);
    const { x, w, top, slip, words } = shape;
    if (kit) {
      this.plank = plate(scene, 'board_plank', x, top, w, shape.bare).setOrigin(0, 0);
      this.slip = plate(scene, 'board_slip', slip.x, top + slip.top, slip.w, 20).setOrigin(0, 0).setVisible(false);
    }
    const barW = w - 18;
    const barX = x + 9 + barW / 2;
    this.hp = new Bar(scene, barX, top + 13, barW, 14, shape.hpColor, 0, '', { fontSize: 11 });
    if (shape.mana) this.mana = new Bar(scene, barX, top + 26.5, barW, 11, COLORS.mana, 0, '', { small: true, fontSize: 9.5 });
    const style = { fontFamily: FONT, fontSize: `${words.size}px`, fontStyle: 'bold', color: kit ? DARK : COLORS.text };
    for (let i = 0; i < words.lines; i++) this.lines.push(scene.add.text(0, top + words.firstY + i * words.lineH, '', style).setOrigin(0.5).setDepth(3));
    this.next = scene.add.text(0, top + words.firstY, NEXT, { ...style, color: kit ? RUST : COLORS.text }).setOrigin(0, 0.5).setDepth(3).setVisible(false);
    this.meterName = scene.add.text(x + 10, top + 40, '', { fontFamily: FONT, fontSize: '10.5px', fontStyle: 'bold', color: CREAM, stroke: DARK, strokeThickness: 2.5 }).setOrigin(0, 0.5).setDepth(3);
  }

  /** The class's meter on the wood: its name, then its pips. */
  setMeter(scene: Phaser.Scene, name: string, value: number, max: number): void {
    if (!kitReady(scene)) {
      this.meterName.setText(`${name} ${'●'.repeat(value)}${'○'.repeat(Math.max(0, max - value))}`);
      return;
    }
    this.meterName.setText(name);
    while (this.pips.length < max) {
      const left = this.shape.x + PIP.x + this.pips.length * PIP.gap;
      this.pips.push(scene.add.image(left, this.shape.top + 40, KIT, 'pip_empty').setOrigin(0, 0.5).setScale(PIP.size / 24).setDepth(3));
    }
    this.pips.forEach((pip, i) => pip.setFrame(i < value ? 'pip_full' : 'pip_empty'));
  }

  /** The words on the slip, most important first; what does not fit in its lines is left off. An empty list takes the slip away. */
  setWords(bits: string[]): void {
    const key = bits.join('|');
    if (key === this.shown) return;
    this.shown = key;
    const { w, slip, words, plank, bare } = this.shape;
    const lines = this.pack(bits).slice(0, words.lines);
    const cx = slip.x + slip.w / 2;
    this.lines.forEach((t, i) => t.setText(lines[i] ?? '').setOrigin(0.5).setX(cx));
    const first = lines[0] ?? '';
    const isNext = first === NEXT || first.startsWith(`${NEXT} `);
    this.next.setVisible(isNext);
    if (isNext) {
      const rest = first.slice(NEXT.length).trim();
      const line = this.lines[0]!.setText(rest);
      const gap = rest ? 4 : 0;
      const left = cx - (this.next.width + gap + line.width) / 2;
      this.next.setX(left);
      line.setOrigin(0, 0.5).setX(left + this.next.width + gap);
    }
    this.slip?.setVisible(lines.length > 0);
    if (this.slip && lines.length) resizePlate(this.slip, slip.w, lines.length * words.lineH + 5);
    if (this.plank) resizePlate(this.plank, w, lines.length ? plank(lines.length) : bare);
  }

  /** Breaks at each " · " before it wraps a part, and no part is split while it fits on a line of its own. */
  private pack(bits: string[]): string[] {
    const { wrap } = this.shape.words;
    const ruler = this.lines[0]!;
    const fits = (s: string): boolean => ruler.setText(s).width <= wrap;
    const out: string[] = [];
    let line = '';
    for (const bit of bits) {
      if (line && fits(`${line} · ${bit}`)) {
        line += ` · ${bit}`;
        continue;
      }
      if (line) out.push(line);
      line = '';
      for (const word of bit.split(' ')) {
        const longer = line ? `${line} ${word}` : word;
        if (line && !fits(longer)) {
          out.push(line);
          line = word;
        } else line = longer;
      }
    }
    if (line) out.push(line);
    return out;
  }
}
