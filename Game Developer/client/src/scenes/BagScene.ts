// The bag (Robin, 2026-11-01: "The inventory needs to look better"; laid out after Mitch, AD's mock-up of the kit): what
// you wear as a grid of eight slot tiles in their rarity frames, a detail plate for the piece you tap, what you carry as
// cards with their frame, name and power, the flasks and cards as icons with counts, and Wear, Take off and Drop acting
// on the piece you tapped. Equip, unequip and drop each send one intent. Opened from the HUD's Bag button; Close gives
// the board back. The gear icons are not drawn yet: the slot's icon stands in the frame until they come.

import Phaser from 'phaser';
import { GEAR, gearPowers, ITEMS, SLOTS, stats, type GearItem, type Slot } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, RARITY_INK } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { feel, sfx } from '../feel.ts';
import { hasFrame, icon, INK, INK_DIM, itemFrame, kitReady, plate, sheet } from '../kit.ts';
import { gearIcon } from '../hero.ts';
import { makeButton, type Button } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface BagSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
const SLOT_NAMES: Record<Slot, string> = { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', armour: 'Armour', gloves: 'Gloves', boots: 'Boots', cape: 'Cape', trinket: 'Trinket' };
/** Where things sit, in design pixels (the driver taps them here). */
export const BAG_LAYOUT = {
  close: { x: 344, y: 142, w: 84, h: 44 },
  /** The worn grid: four tiles a row, two rows, in slot order. */
  tile: (i: number) => ({ x: 58 + (i % 4) * 99, y: 216 + Math.floor(i / 4) * 70 }),
  detailY: 354,
  carriedY: 436,
  carriedStep: 50,
  carriedRows: 4,
  flasksY: 652,
  drop: { x: 100, y: 708, w: 120, h: 48 },
  act: { x: 268, y: 708, w: 170, h: 48 },
} as const;

type Pick = { kind: 'worn'; slot: Slot } | { kind: 'carried'; gear: GearItem } | { kind: 'item'; item: string } | null;

export class BagScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  /** True while an action is on its way to the world: one at a time. */
  private inFlight = false;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private numbers!: Phaser.GameObjects.Text;
  private carriedLabel!: Phaser.GameObjects.Text;
  private detailName!: Phaser.GameObjects.Text;
  private detailLine!: Phaser.GameObjects.Text;
  private actButton!: Button;
  private dropButton!: Button;
  private picked: Pick = null;
  /** Which page of the carried pieces is shown: four to a page. */
  private carriedPage = 0;
  /** A line about the last thing done, shown in the detail plate until the next tap. */
  private note = '';

  constructor(deps: BagSceneDeps) {
    super('bag');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    this.picked = null;
    this.note = '';
    this.carriedPage = 0;
    sheet(this);
    const kit = kitReady(this);
    const ink = kit ? INK : COLORS.text;
    const dim = kit ? INK_DIM : COLORS.dim;
    this.add.text(26, 112, 'Hero', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: ink });
    this.numbers = this.add.text(24, 146, '', { fontFamily: FONT, fontSize: '13px', color: dim, wordWrap: { width: 284 } });
    const { close, detailY, carriedY, drop, act } = BAG_LAYOUT;
    makeButton(this, close.x, close.y, close.w, close.h, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).bagClosed());

    // The detail plate: the piece tapped, or what just happened.
    if (kit) plate(this, 'panel_message', CENTRE, detailY, DESIGN_WIDTH - 36, 68);
    this.detailName = this.add.text(32, detailY - 18, '', { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink }).setOrigin(0, 0.5);
    this.detailLine = this.add.text(32, detailY + 10, '', { fontFamily: FONT, fontSize: '13px', color: dim, wordWrap: { width: DESIGN_WIDTH - 72 }, maxLines: 2 }).setOrigin(0, 0.5);

    this.carriedLabel = this.add.text(24, carriedY - 42, '', { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: dim });
    this.add.text(24, BAG_LAYOUT.flasksY - 38, 'Flasks and cards', { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: dim });

    this.dropButton = makeButton(this, drop.x, drop.y, drop.w, drop.h, 'Drop', 0xd9534f, '15px', () => this.dropPicked());
    this.actButton = makeButton(this, act.x, act.y, act.w, act.h, 'Wear', COLORS.button, '15px', () => this.actOnPicked());
    this.refresh();
    this.log.note('bag open');
  }

  // ---- what is shown ------------------------------------------------------------------------------------------------

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    const kit = kitReady(this);
    const ink = kit ? INK : COLORS.text;
    const dim = kit ? INK_DIM : COLORS.dim;
    const s = stats(me);
    const extras = [s.crit > 0.1 ? `crit ${Math.round(s.crit * 100)}%` : '', s.dodge ? `dodge +${Math.round(s.dodge * 100)}%` : '', s.lifesteal ? `lifesteal ${Math.round(s.lifesteal * 100)}%` : '', s.thorns ? `thorns ${Math.round(s.thorns * 100)}%` : ''].filter(Boolean);
    this.numbers.setText(`Attack ${s.attack}${s.magic ? ` · Magic ${s.magic}` : ""} · Defense ${s.defense} · HP ${me.hp}/${s.maxHp} · Mana ${me.mana}/${s.maxMana}${extras.length ? ` · ${extras.join(' · ')}` : ''}`);
    this.carriedLabel.setText(`Carried · ${me.bag.length} of ${GEAR.bagLimit}`);

    // The worn grid.
    SLOTS.forEach((slot, i) => {
      const { x, y } = BAG_LAYOUT.tile(i);
      const g = me.equipment[slot];
      const chosen = this.picked?.kind === 'worn' && this.picked.slot === slot;
      if (kit) {
        if (chosen) this.rows.push(plate(this, 'row_bag_chosen', x, y, 84, 66));
        this.rows.push(icon(this, g ? `frame_${g.rarity}` : 'frame_common', x, y - 4).setAlpha(g ? 1 : 0.55));
        const art = g ? gearIcon(this, g, this.game_.me.classId) : null;
        if (art) this.rows.push(this.add.image(x, y - 4, art.texture, art.frame).setScale(0.5));
        else this.rows.push(icon(this, `slot_${slot}`, x, y - 4).setAlpha(g ? 1 : 0.45));
      } else {
        this.rows.push(this.add.rectangle(x, y - 4, 44, 44, chosen ? 0x3a4256 : 0x2b3245, 1).setStrokeStyle(2, g ? parseInt((RARITY_INK[g.rarity] ?? '#888').slice(1), 16) : 0x4a5470, 1));
      }
      this.rows.push(this.add.text(x, y + 25, SLOT_NAMES[slot], { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: g ? ink : dim }).setOrigin(0.5));
      const zone = this.add.zone(x, y, 92, 68).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pick({ kind: 'worn', slot }, x, y - 4));
      this.rows.push(zone);
    });

    // What is carried: cards.
    const { carriedY, carriedStep, carriedRows } = BAG_LAYOUT;
    const pages = Math.max(1, Math.ceil(me.bag.length / carriedRows));
    this.carriedPage = Math.min(this.carriedPage, pages - 1);
    const carried = me.bag.slice(this.carriedPage * carriedRows, (this.carriedPage + 1) * carriedRows);
    if (pages > 1) {
      this.rows.push(this.add.text(306, carriedY - 34, `${this.carriedPage + 1} of ${pages}`, { fontFamily: FONT, fontSize: '12px', color: dim }).setOrigin(1, 0.5));
      this.rows.push(makeButton(this, 346, carriedY - 36, 56, 34, 'Next', COLORS.log, '13px', () => {
        this.carriedPage = (this.carriedPage + 1) % pages;
        this.refresh();
      }).button);
    }
    if (!carried.length) this.rows.push(this.add.text(CENTRE, carriedY + 10, 'Nothing carried yet. Shops sell gear; the wilds and chests drop it.', { fontFamily: FONT, fontSize: '12px', color: dim, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } }).setOrigin(0.5));
    carried.forEach((g, i) => {
      const y = carriedY + i * carriedStep;
      const chosen = this.picked?.kind === 'carried' && this.picked.gear.id === g.id;
      if (kit) {
        this.rows.push(plate(this, chosen ? 'row_bag_chosen' : 'row_bag_idle', CENTRE, y, DESIGN_WIDTH - 36, carriedStep - 6));
        this.rows.push(icon(this, `frame_${g.rarity}`, 48, y).setScale(0.42));
        const art = gearIcon(this, g, this.game_.me.classId);
        if (art) this.rows.push(this.add.image(48, y, art.texture, art.frame).setScale(0.42));
        else this.rows.push(icon(this, `slot_${g.slot}`, 48, y).setScale(0.42));
      }
      this.rows.push(this.add.text(76, y - 10, g.name, { fontFamily: FONT_DISPLAY, fontSize: '15px', fontStyle: 'bold', color: RARITY_INK[g.rarity] ?? ink }).setOrigin(0, 0.5));
      this.rows.push(this.add.text(76, y + 10, this.powerLine(g), { fontFamily: FONT, fontSize: '13px', color: dim, wordWrap: { width: 312 }, maxLines: 1 }).setOrigin(0, 0.5));
      const zone = this.add.zone(CENTRE, y, DESIGN_WIDTH - 36, carriedStep - 4).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pick({ kind: 'carried', gear: g }, 48, y));
      this.rows.push(zone);
    });

    // The flasks and cards, as icons with counts.
    const items = Object.entries(me.items).filter(([, n]) => n > 0);
    if (!items.length) this.rows.push(this.add.text(24, BAG_LAYOUT.flasksY, 'None yet.', { fontFamily: FONT, fontSize: '11px', color: dim }).setOrigin(0, 0.5));
    items.slice(0, 7).forEach(([id, n], i) => {
      const x = 44 + i * 52;
      const frame = itemFrame(id);
      if (kit && hasFrame(this, frame)) this.rows.push(icon(this, frame, x, BAG_LAYOUT.flasksY).setScale(0.45));
      else this.rows.push(this.add.text(x, BAG_LAYOUT.flasksY, (ITEMS[id]?.name ?? id).charAt(0), { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: ink }).setOrigin(0.5));
      this.rows.push(this.add.text(x + 14, BAG_LAYOUT.flasksY + 8, `×${n}`, { fontFamily: FONT_DISPLAY, fontSize: '11px', fontStyle: 'bold', color: ink }).setOrigin(0, 0.5));
      const zone = this.add.zone(x + 4, BAG_LAYOUT.flasksY, 50, 44).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pick({ kind: 'item', item: id }, x, BAG_LAYOUT.flasksY));
      this.rows.push(zone);
    });

    this.refreshDetail();
  }

  /** What a piece does, without its name: its rarity and kind, its numbers, its powers. */
  private powerLine(g: GearItem): string {
    const kind = g.name.toLowerCase() === g.base.toLowerCase() ? g.rarity : `${g.rarity} ${g.base}`;
    return [kind, ...gearPowers(g)].join(' · ');
  }

  /** The detail plate and the two buttons follow the pick, or show the last note. */
  private refreshDetail(): void {
    const me = this.game_.me;
    const p = this.picked;
    const worn = p?.kind === 'worn' ? me.equipment[p.slot] : null;
    const carried = p?.kind === 'carried' ? (me.bag.find((g) => g.id === p.gear.id) ?? null) : null;
    const piece = worn ?? carried;
    if (!this.note && p?.kind === 'item') {
      const item = ITEMS[p.item];
      const count = me.items[p.item] ?? 0;
      const s = stats(me);
      const flask = !!item && !item.dice;
      const helps = flask && count > 0 && ((!!item.heal && me.hp < s.maxHp) || (!!item.mana && me.mana < s.maxMana) || !!item.elixir || (!!item.cure && Object.keys(me.ailments ?? {}).length > 0));
      this.detailName.setText(item?.name ?? p.item).setColor(kitReady(this) ? INK : COLORS.text);
      // What it does first, whatever else there is to say (Robin, 2026-11-02: they "dont really tell you what they do when you press them").
      this.detailLine.setText(flask ? `${item.text.split('.')[0]}.${helps ? '' : ' You are full: it would do nothing now.'}` : `${item?.text ?? ''} Use it after a roll.`);
      this.actButton.label.setText(flask ? 'Drink' : 'Wear');
      this.actButton.setEnabled(helps && !this.inFlight);
      this.dropButton.setEnabled(false);
      return;
    }
    if (this.note) {
      this.detailName.setText(this.note).setColor(kitReady(this) ? INK : COLORS.text);
      this.detailLine.setText('');
    } else if (piece) {
      this.detailName.setText(piece.name).setColor(RARITY_INK[piece.rarity] ?? INK);
      this.detailLine.setText(this.powerLine(piece));
    } else if (p?.kind === 'worn') {
      this.detailName.setText(`${SLOT_NAMES[p.slot]}: nothing worn`).setColor(kitReady(this) ? INK_DIM : COLORS.dim);
      this.detailLine.setText('A piece for this slot from the bag goes on with Wear.');
    } else {
      this.detailName.setText('Tap a piece to see it').setColor(kitReady(this) ? INK_DIM : COLORS.dim);
      this.detailLine.setText('Worn above, carried below.');
    }
    this.actButton.label.setText(worn ? 'Take off' : 'Wear');
    this.actButton.setEnabled(!!piece && !this.inFlight);
    this.dropButton.setEnabled(!!carried && !this.inFlight);
  }

  private pick(p: Pick, x: number, y: number): void {
    this.note = '';
    this.picked = p;
    feel.buzz();
    sfx.play('ui/chip');
    feel.sparkle(this, x, y, 0xfff1b0, 60, 6);
    this.refresh();
  }

  // ---- the intents --------------------------------------------------------------------------------------------------

  private actOnPicked(): void {
    const me = this.game_.me;
    const p = this.picked;
    if (!p) return;
    if (p.kind === 'item') {
      const name = ITEMS[p.item]?.name ?? p.item;
      this.send({ type: 'use', item: p.item }, `You drink a ${name}.`);
      return;
    }
    if (p.kind === 'worn') {
      const g = me.equipment[p.slot];
      if (g) this.send({ type: 'unequip', slot: p.slot }, `Took off ${g.name}.`);
      return;
    }
    const g = me.bag.find((x) => x.id === p.gear.id);
    if (g) this.send({ type: 'equip', gear: g.id }, `Now wearing ${g.name}.`);
  }

  private dropPicked(): void {
    const p = this.picked;
    if (p?.kind !== 'carried') return;
    const g = this.game_.me.bag.find((x) => x.id === p.gear.id);
    if (g) this.send({ type: 'drop', gear: g.id }, `Dropped ${g.name}.`);
  }

  private send(intent: { type: 'equip'; gear: string } | { type: 'unequip'; slot: Slot } | { type: 'drop'; gear: string } | { type: 'use'; item: string }, done: string): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.refreshDetail();
    this.game_.act({ ...intent, player: this.game_.player }).then(
      (events) => {
        this.inFlight = false;
        const rejected = events.find((e) => e.type === 'rejected');
        if (!rejected) sfx.play(intent.type === 'use' ? (intent.item.startsWith('mana-potion') ? 'fight/mana-potion' : 'fight/potion') : intent.type === 'equip' ? 'ui/wear' : intent.type === 'unequip' ? 'ui/take-off' : 'ui/drop-item');
        this.note = rejected?.type === 'rejected' ? `Not allowed: ${rejected.reason}.` : done;
        // A worn piece taken off is carried now, and a piece put on is worn: the pick follows it.
        if (!rejected && intent.type === 'equip') {
          const slot = SLOTS.find((s) => this.game_.me.equipment[s]?.id === intent.gear);
          this.picked = slot ? { kind: 'worn', slot } : null;
        }
        if (!rejected && intent.type === 'drop') this.picked = null;
        if (!rejected && intent.type === 'unequip') {
          const g = this.game_.me.bag[this.game_.me.bag.length - 1];
          this.picked = g ? { kind: 'carried', gear: g } : null;
        }
        this.log.note(done);
        this.refresh();
        (this.scene.get('board') as BoardScene).refreshHud();
      },
      (e: unknown) => {
        this.inFlight = false;
        this.log.error(`bag action failed: ${String(e)}`);
        this.note = 'No answer from the world. Try again.';
        this.refreshDetail();
      },
    );
  }
}

export type { GearItem };
