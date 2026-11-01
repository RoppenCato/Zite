// The bag: what you wear in the eight slots, what you carry, your numbers with it all on, and the flasks and cards.
// Equip, unequip and drop each send one intent. Opened from the HUD's Bag button; Close gives the board back.

import Phaser from 'phaser';
import { describeGear, GEAR, ITEMS, SLOTS, stats, type GearItem, type Slot } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, RARITY_COLORS, RARITY_INK, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { sfx } from '../feel.ts';
import { kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface BagSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
const SLOT_NAMES: Record<Slot, string> = { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', armour: 'Armour', gloves: 'Gloves', boots: 'Boots', cape: 'Cape', trinket: 'Trinket' };
/** Where things sit, in design pixels (the driver taps them here). */
export const BAG_LAYOUT = {
  close: { x: 364, y: 126, w: 72, h: 32 },
  wornY: 206,
  wornStep: 36,
  carriedY: 520,
  carriedStep: 36,
  carriedRows: 5,
  button: { x: 364, w: 72, h: 30 },
  dropX: 288,
} as const;

export class BagScene extends Phaser.Scene {
  /** The text colours: ink on the kit's parchment. */
  private ink: { text: string; dim: string; gold: string } = { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold };
  private rarity: Record<string, string> = RARITY_COLORS;
  private readonly game_: GameHolder;
  /** True while an action is on its way to the world: one at a time. */
  private inFlight = false;
  private readonly log: GameLog;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private numbers!: Phaser.GameObjects.Text;
  private carried!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;

  constructor(deps: BagSceneDeps) {
    super('bag');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    this.rarity = kitReady(this) ? RARITY_INK : RARITY_COLORS;
    sheet(this);
    this.add.text(24, 112, 'Bag', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: this.ink.text });
    this.numbers = this.add.text(24, 146, '', { fontFamily: FONT, fontSize: '13px', color: this.ink.dim, wordWrap: { width: 300 } });
    const { close } = BAG_LAYOUT;
    makeButton(this, close.x, close.y, close.w, close.h, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).bagClosed());
    this.add.text(24, BAG_LAYOUT.wornY - 30, 'Worn', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: this.ink.dim });
    this.carried = this.add.text(24, BAG_LAYOUT.carriedY - 30, 'Carried', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: this.ink.dim });
    this.message = this.add.text(CENTRE, 720, '', { fontFamily: FONT, fontSize: '12px', color: this.ink.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } }).setOrigin(0.5, 0);
    this.refresh();
    this.log.note('bag open');
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    this.carried.setText(`Carried ${me.bag.length} of ${GEAR.bagLimit}`);
    const s = stats(me);
    const extras = [s.crit > 0.1 ? `crit ${Math.round(s.crit * 100)}%` : '', s.dodge ? `dodge +${Math.round(s.dodge * 100)}%` : '', s.lifesteal ? `lifesteal ${Math.round(s.lifesteal * 100)}%` : '', s.thorns ? `thorns ${Math.round(s.thorns * 100)}%` : ''].filter(Boolean);
    this.numbers.setText(`Attack ${s.attack} · Defense ${s.defense} · HP ${me.hp}/${s.maxHp} · Mana ${me.mana}/${s.maxMana}${extras.length ? ` · ${extras.join(' · ')}` : ''}`);
    const { wornY, wornStep, carriedY, carriedStep, carriedRows, button, dropX } = BAG_LAYOUT;
    SLOTS.forEach((slot, i) => {
      const y = wornY + i * wornStep;
      const g = me.equipment[slot];
      if (kitReady(this)) this.rows.push(plate(this, 'row_bag_idle', CENTRE, y + 1, DESIGN_WIDTH - 36, wornStep - 2));
      this.rows.push(this.add.text(24, y - 14, SLOT_NAMES[slot], { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
      this.rows.push(this.add.text(24, y + 2, g ? describeGear(g) : 'nothing', { fontFamily: FONT, fontSize: '13px', fontStyle: g ? 'bold' : 'normal', color: g ? (this.rarity[g.rarity] ?? COLORS.text) : COLORS.dim }));
      if (g) this.rows.push(makeButton(this, button.x, y, button.w, button.h, 'Take off', COLORS.log, '12px', () => this.send({ type: 'unequip', slot }, `Took off ${g.name}.`)).button);
    });
    const carried = me.bag.slice(0, carriedRows);
    if (!carried.length) this.rows.push(this.add.text(24, carriedY - 6, 'No gear carried. Shops sell it; the wilds and chests drop it.', { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
    carried.forEach((g, i) => {
      const y = carriedY + i * carriedStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_bag_idle', CENTRE, y, DESIGN_WIDTH - 36, carriedStep - 4));
      this.rows.push(this.add.text(24, y - 8, describeGear(g), { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: this.rarity[g.rarity] ?? COLORS.text, wordWrap: { width: 230 } }));
      this.rows.push(makeButton(this, dropX, y, 60, button.h, 'Drop', 0x8f2f3b, '12px', () => this.send({ type: 'drop', gear: g.id }, `Dropped ${g.name}.`)).button);
      this.rows.push(makeButton(this, button.x, y, button.w, button.h, 'Wear', COLORS.button, '12px', () => this.send({ type: 'equip', gear: g.id }, `Now wearing ${g.name}.`)).button);
    });
    if (me.bag.length > carried.length) this.rows.push(this.add.text(24, carriedY + carried.length * carriedStep - 8, `and ${me.bag.length - carried.length} more`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
    const flasks = Object.entries(me.items)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${ITEMS[id]?.name ?? id} ×${n}`);
    this.rows.push(this.add.text(24, 700, flasks.length ? `Flasks and cards: ${flasks.join(', ')}` : 'No flasks or cards.', { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
  }

  private send(intent: { type: 'equip'; gear: string } | { type: 'unequip'; slot: Slot } | { type: 'drop'; gear: string }, done: string): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act({ ...intent, player: this.game_.player }).then(
      (events) => {
        this.inFlight = false;
        const rejected = events.find((e) => e.type === 'rejected');
        if (!rejected) sfx.play(intent.type === 'equip' ? 'ui/wear' : intent.type === 'unequip' ? 'ui/take-off' : 'ui/drop-item');
        this.message.setText(rejected?.type === 'rejected' ? `Not allowed: ${rejected.reason}.` : done);
        this.log.note(done);
        this.refresh();
        (this.scene.get('board') as BoardScene).refreshHud();
      },
      (e: unknown) => {
        this.inFlight = false;
        this.log.error(`bag action failed: ${String(e)}`);
        this.message.setText('No answer from the world. Try again.');
      },
    );
  }
}

export type { GearItem };
