// The hero's sheet (Robin, 2026-11-02: "the inventory could do with an overhaul to make it more practical and visually better"; he
// chose Mitch, AD's option 2, The Hero, with all seven stats beside the picture). The hero in what they wear with the worn slots
// either side; two tabs, gear and flasks and cards, in wooden slots with counts; a card that says what the tapped thing does, how a
// piece compares with what is worn, and holds only the buttons that apply. Equip, unequip, drop and use each send one intent.

import Phaser from 'phaser';
import { gearPowers, GEAR, ITEMS, SLOTS, stats, type Character, type GearItem, type Slot } from '../../../rules/src/index.ts';
import forestBackJpg from '../../../assets/forest_fight/background.jpg';
import meadowBackJpg from '../../../assets/meadow_fight/background.jpg';
import type { GameLog } from '../game-log.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { feel, sfx } from '../feel.ts';
import { CREAM, frameTexture, hasFrame, INK, INK_DIM, itemFrame, KIT, kitReady, plate, sheet } from '../kit.ts';
import { gearIcon, Hero, heroReady } from '../hero.ts';
import { Bar, makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface BagSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const SLOT_NAMES: Record<Slot, string> = { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', armour: 'Armour', gloves: 'Gloves', boots: 'Boots', cape: 'Cape', trinket: 'Trinket' };
const WOOD_INK = '#3a2410';
const GOOD = '#2f7a35';
const BAD = '#a23c2c';
const BACKS: Record<string, string> = { meadow: meadowBackJpg, forest: forestBackJpg };
const backKey = (theme: string): string => `bag_back_${theme}`;

/** Where things sit, in design pixels (Mitch, AD's bag_options notes): left and top edges unless it says centre. */
export const BAG_LAYOUT = {
  header: { x: 18, y: 116, w: 376, h: 44 },
  block: { x: 18, y: 164, w: 376, h: 214 },
  left: ['helm', 'armour', 'gloves', 'boots'] as Slot[],
  right: ['weapon', 'shield', 'cape', 'trinket'] as Slot[],
  worn: { leftX: 30, rightX: 336, y: 172, size: 46, step: 50 },
  picture: { x: 132, y: 172, w: 148, h: 198, feet: 352 },
  bars: { x: 18, y: 382, w: 376, h: 30 },
  tabs: { x: 18, y: 416, w: 186, h: 32, step: 190 },
  slots: { x: 28, y: 454, size: 52, stepX: 60.8, stepY: 56, cols: 6, rows: 2 },
  card: { x: 18, y: 568, w: 376, h: 152 },
} as const;

type StatId = 'attack' | 'magic' | 'defense' | 'thorns' | 'crit' | 'dodge' | 'lifesteal';
/** The seven, each with what the rules do with it. */
const STATS: { id: StatId; name: string; x: number; row: number; share: boolean; words: string }[] = [
  { id: 'attack', name: 'Attack', x: 104, row: 0, share: false, words: 'What your blows are built on. The enemy\'s defense takes some of it away.' },
  { id: 'magic', name: 'Magic', x: 104, row: 1, share: false, words: 'Added to your attack when you cast a spell.' },
  { id: 'defense', name: 'Defense', x: 104, row: 2, share: false, words: 'Takes some of the force out of every blow that lands on you.' },
  { id: 'thorns', name: 'Thorns', x: 104, row: 3, share: true, words: 'This share of the damage you take goes back to whoever dealt it.' },
  { id: 'crit', name: 'Crit', x: 308, row: 0, share: true, words: 'The chance that a strike of yours lands as a critical hit, for more damage.' },
  { id: 'dodge', name: 'Dodge', x: 308, row: 1, share: true, words: 'Added to your chance of slipping a blow when you guard with Dodge.' },
  { id: 'lifesteal', name: 'Lifesteal', x: 308, row: 2, share: true, words: 'You heal this share of the damage you deal.' },
];

type Tab = 'gear' | 'items';
type Pick = { kind: 'worn'; slot: Slot } | { kind: 'carried'; id: string } | { kind: 'item'; item: string } | { kind: 'stat'; stat: StatId } | null;

export class BagScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  /** True while an action is on its way to the world: one at a time. */
  private inFlight = false;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private hero: Hero | null = null;
  private hpBar!: Bar;
  private mpBar!: Bar;
  private tab: Tab = 'gear';
  private itemPage = 0;
  private picked: Pick = null;
  /** A line about the last thing done, on the card until the next tap. */
  private note = '';

  constructor(deps: BagSceneDeps) {
    super('bag');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  private theme(): string {
    const { board } = this.game_.state;
    return board.areas[board.spaces[this.game_.me.space]?.area ?? '']?.theme ?? '';
  }

  preload(): void {
    const theme = this.theme();
    const url = BACKS[theme];
    if (url && !this.textures.exists(backKey(theme))) this.load.image(backKey(theme), url);
  }

  create(): void {
    this.picked = null;
    this.note = '';
    this.tab = 'gear';
    this.itemPage = 0;
    this.rows = [];
    const me = this.game_.me;
    sheet(this);
    const { header, block, bars } = BAG_LAYOUT;
    this.board(header.x, header.y, header.w, header.h);
    this.woodText(40, header.y + header.h / 2, 'Hero', 20).setOrigin(0, 0.5);
    makeButton(this, 346, header.y + header.h / 2 - 1, 76, 36, 'Close', COLORS.log, '15px', () => (this.scene.get('board') as BoardScene).bagClosed());
    this.board(block.x, block.y, block.w, block.h);
    this.drawPicture(me);
    this.board(bars.x, bars.y, bars.w, bars.h);
    this.hpBar = new Bar(this, 128, 397, 200, 14, COLORS.button, 0, '', { fontSize: 11 });
    this.mpBar = new Bar(this, 311, 397, 146, 11, COLORS.mana, 0, '', { small: true, fontSize: 10 });
    this.refresh();
    this.log.note('bag open');
  }

  override update(_time: number, delta: number): void {
    this.hero?.update(delta);
  }

  // ---- pieces of the drawing ----------------------------------------------------------------------------------------

  private board(x: number, y: number, w: number, h: number): Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle {
    if (kitReady(this)) return plate(this, 'board_plain', x, y, w, h).setOrigin(0, 0);
    return this.add.rectangle(x, y, w, h, COLORS.panel, 1).setOrigin(0, 0);
  }

  private woodText(x: number, y: number, text: string, size: number): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, { fontFamily: FONT_DISPLAY, fontSize: `${size}px`, fontStyle: 'bold', color: CREAM, stroke: WOOD_INK, strokeThickness: Math.min(4, size / 4) });
  }

  private drawPicture(me: Character): void {
    const { x, y, w, h, feet } = BAG_LAYOUT.picture;
    const key = backKey(this.theme());
    if (this.textures.exists(key)) {
      // A window on the area's fight picture, whose files are 2x: its road and fields behind the feet.
      const fileX = 260;
      const fileY = 500;
      this.add.image(x - fileX / 2, y - fileY / 2, key).setOrigin(0, 0).setScale(0.5).setCrop(fileX, fileY, w * 2, h * 2);
    } else this.add.rectangle(x, y, w, h, 0x8fc7e8, 1).setOrigin(0, 0);
    this.add.rectangle(x, y, w, h).setOrigin(0, 0).setStrokeStyle(2, 0x2a1a0c, 1);
    this.add.ellipse(x + w / 2, feet, 76, 13, 0x000000, 0.22);
    if (heroReady(this, me.classId)) {
      this.hero = new Hero(this, me, x + w / 2, feet, 0.5);
      this.hero.face(true);
    }
  }

  /** A wooden slot, its art fitted inside, the gold ring when it is the one tapped; the whole of it taps. */
  private cubby(frame: string, x: number, y: number, size: number, art: { texture: string; frame: string; alpha?: number } | null, chosen: boolean, onTap: () => void): void {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const rows = this.rows;
    if (kitReady(this)) rows.push(this.add.image(cx, cy, KIT, frame).setDisplaySize(size, size));
    else rows.push(this.add.rectangle(cx, cy, size, size, 0x2b3245, 1).setStrokeStyle(2, 0x4a5470, 1));
    if (art && this.textures.get(art.texture).has(art.frame)) {
      const img = this.add.image(cx, cy, art.texture, art.frame).setAlpha(art.alpha ?? 1);
      img.setScale((size * 0.74) / Math.max(img.width, img.height));
      rows.push(img);
    }
    if (chosen && kitReady(this)) rows.push(this.add.image(cx, cy, KIT, 'cubby_chosen').setDisplaySize((size * 58) / 52, (size * 58) / 52));
    const zone = this.add.zone(cx, cy, size + 6, size + 6).setInteractive({ useHandCursor: true });
    zone.on('pointerup', onTap);
    rows.push(zone);
  }

  private artOf(g: GearItem): { texture: string; frame: string } {
    return gearIcon(this, g, this.game_.me.classId) ?? { texture: KIT, frame: `slot_${g.slot}` };
  }

  // ---- what is shown ------------------------------------------------------------------------------------------------

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    const s = stats(me);
    this.hpBar.set(me.hp, s.maxHp, true);
    this.mpBar.set(me.mana, s.maxMana, true);
    this.drawWorn(me);
    this.drawStats(me);
    this.drawTabs(me);
    if (this.tab === 'gear') this.drawGear(me);
    else this.drawItems(me);
    this.drawCard(me);
  }

  private drawWorn(me: Character): void {
    const { left, right, worn } = BAG_LAYOUT;
    const column = (slots: readonly Slot[], x: number): void =>
      slots.forEach((slot, i) => {
        const g = me.equipment[slot];
        const chosen = this.picked?.kind === 'worn' && this.picked.slot === slot;
        const art = g ? this.artOf(g) : { texture: KIT, frame: `slot_${slot}`, alpha: 0.55 };
        this.cubby(g ? `cubby_${g.rarity}` : 'cubby_plain', x, worn.y + i * worn.step, worn.size, art, chosen, () => this.pick({ kind: 'worn', slot }));
      });
    column(left, worn.leftX);
    column(right, worn.rightX);
  }

  private statText(id: StatId, me: Character): { value: number; shown: string } {
    const value = stats(me)[id];
    const share = STATS.find((x) => x.id === id)!.share;
    return { value, shown: share ? `${Math.round(value * 100)}%` : `${value}` };
  }

  private drawStats(me: Character): void {
    for (const st of STATS) {
      const y = 188 + st.row * 50;
      const { value, shown } = this.statText(st.id, me);
      const faint = value === 0 ? 0.5 : 1;
      if (this.picked?.kind === 'stat' && this.picked.stat === st.id) this.rows.push(this.add.rectangle(st.x, y + 8, 50, 42, 0xc99a4e, 1));
      this.rows.push(this.woodText(st.x, y, shown, 14.5).setOrigin(0.5).setAlpha(faint));
      this.rows.push(this.add.text(st.x, y + 15, st.name, { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: CREAM }).setOrigin(0.5).setAlpha(value === 0 ? 0.55 : 0.92));
      const zone = this.add.zone(st.x, y + 8, 52, 46).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.pick({ kind: 'stat', stat: st.id }));
      this.rows.push(zone);
    }
  }

  private drawTabs(me: Character): void {
    const { tabs } = BAG_LAYOUT;
    const one = (tab: Tab, x: number, text: string): void => {
      const on = this.tab === tab;
      if (kitReady(this)) this.rows.push(plate(this, on ? 'chip_chosen' : 'chip_idle', x + tabs.w / 2, tabs.y + tabs.h / 2, tabs.w, tabs.h));
      this.rows.push(this.add.text(x + tabs.w / 2, tabs.y + tabs.h / 2 - 1, text, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: kitReady(this) ? INK : COLORS.text }).setOrigin(0.5));
      const zone = this.add.zone(x + tabs.w / 2, tabs.y + tabs.h / 2, tabs.w, tabs.h + 4).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.tab === tab) return;
        this.tab = tab;
        sfx.play('ui/chip');
        this.refresh();
      });
      this.rows.push(zone);
    };
    one('gear', tabs.x, `Gear ${me.bag.length} of ${GEAR.bagLimit}`);
    one('items', tabs.x + tabs.step, 'Flasks and cards');
  }

  private slotAt(i: number): { x: number; y: number } {
    const { slots } = BAG_LAYOUT;
    return { x: slots.x + (i % slots.cols) * slots.stepX, y: slots.y + Math.floor(i / slots.cols) * slots.stepY };
  }

  private drawGear(me: Character): void {
    const { slots } = BAG_LAYOUT;
    for (let i = 0; i < slots.cols * slots.rows; i++) {
      const { x, y } = this.slotAt(i);
      const g = me.bag[i];
      if (!g) {
        if (kitReady(this)) this.rows.push(this.add.image(x + slots.size / 2, y + slots.size / 2, KIT, 'cubby_empty').setDisplaySize(slots.size, slots.size));
        continue;
      }
      const chosen = this.picked?.kind === 'carried' && this.picked.id === g.id;
      this.cubby(`cubby_${g.rarity}`, x, y, slots.size, this.artOf(g), chosen, () => this.pick({ kind: 'carried', id: g.id }));
    }
  }

  private drawItems(me: Character): void {
    const { slots } = BAG_LAYOUT;
    const owned = Object.keys(ITEMS).filter((id) => (me.items[id] ?? 0) > 0);
    // Twelve slots and thirteen kinds: when they do not all fit, the last slot turns the page (mine).
    const room = slots.cols * slots.rows;
    const paged = owned.length > room;
    const perPage = paged ? room - 1 : room;
    const pages = Math.max(1, Math.ceil(owned.length / perPage));
    this.itemPage = Math.min(this.itemPage, pages - 1);
    const shown = owned.slice(this.itemPage * perPage, (this.itemPage + 1) * perPage);
    for (let i = 0; i < room; i++) {
      const { x, y } = this.slotAt(i);
      const id = shown[i];
      if (paged && i === room - 1) {
        this.cubby('cubby_plain', x, y, slots.size, null, false, () => {
          this.itemPage = (this.itemPage + 1) % pages;
          sfx.play('ui/chip');
          this.refresh();
        });
        this.rows.push(this.add.text(x + slots.size / 2, y + slots.size / 2, 'More', { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: INK }).setOrigin(0.5));
        continue;
      }
      if (!id) {
        if (kitReady(this)) this.rows.push(this.add.image(x + slots.size / 2, y + slots.size / 2, KIT, 'cubby_empty').setDisplaySize(slots.size, slots.size));
        continue;
      }
      const frame = itemFrame(id);
      const chosen = this.picked?.kind === 'item' && this.picked.item === id;
      this.cubby('cubby_plain', x, y, slots.size, hasFrame(this, frame) ? { texture: frameTexture(this, frame), frame } : null, chosen, () => this.pick({ kind: 'item', item: id }));
      if (!hasFrame(this, frame)) this.rows.push(this.add.text(x + slots.size / 2, y + slots.size / 2, (ITEMS[id]?.name ?? id).charAt(0), { fontFamily: FONT_DISPLAY, fontSize: '18px', fontStyle: 'bold', color: INK }).setOrigin(0.5));
      this.badge(x + slots.size - 8, y + slots.size - 4, me.items[id] ?? 0);
    }
  }

  private badge(x: number, y: number, n: number): void {
    if (kitReady(this)) this.rows.push(plate(this, 'badge_count', x, y, 24, 15));
    this.rows.push(this.add.text(x, y, `×${n}`, { fontFamily: FONT_DISPLAY, fontSize: '10.5px', fontStyle: 'bold', color: CREAM }).setOrigin(0.5));
  }

  // ---- the card -----------------------------------------------------------------------------------------------------

  private drawCard(me: Character): void {
    const { card } = BAG_LAYOUT;
    this.rows.push(this.board(card.x, card.y, card.w, card.h));
    const p = this.picked;
    if (p?.kind === 'stat') {
      const st = STATS.find((x) => x.id === p.stat)!;
      this.rows.push(this.woodText(34, card.y + 20, st.name, 16).setOrigin(0, 0.5));
      this.rows.push(this.woodText(378, card.y + 20, this.statText(st.id, me).shown, 16).setOrigin(1, 0.5));
      this.slip(30, card.y + 38, 352, 102, [{ text: st.words }]);
      return;
    }
    if (p?.kind === 'item' && (me.items[p.item] ?? 0) > 0) return this.itemCard(me, p.item);
    const worn = p?.kind === 'worn' ? me.equipment[p.slot] : null;
    const carried = p?.kind === 'carried' ? me.bag.find((g) => g.id === p.id) : null;
    const piece = worn ?? carried;
    if (piece) return this.gearCard(me, piece, !!worn);
    if (p?.kind === 'worn') {
      this.rows.push(this.woodText(34, card.y + 20, SLOT_NAMES[p.slot], 16).setOrigin(0, 0.5));
      this.slip(30, card.y + 38, 352, 102, [{ text: `${this.note ? `${this.note}\n` : ''}Nothing worn here. A piece for this slot goes on from your gear, with Wear.` }]);
      return;
    }
    this.rows.push(this.woodText(34, card.y + 20, this.note ? 'Done' : 'Your things', 16).setOrigin(0, 0.5));
    this.slip(30, card.y + 38, 352, 102, [{ text: this.note || 'Tap anything to see what it does.' }]);
  }

  private slip(x: number, y: number, w: number, h: number, lines: { text: string; color?: string; bold?: boolean }[]): void {
    if (kitReady(this)) this.rows.push(plate(this, 'board_slip', x, y, w, h).setOrigin(0, 0));
    let at = y + 9;
    for (const line of lines) {
      const t = this.add.text(x + 10, at, line.text, { fontFamily: FONT, fontSize: '13px', fontStyle: line.bold ? 'bold' : 'normal', color: line.color ?? (kitReady(this) ? WOOD_INK : COLORS.text), wordWrap: { width: w - 20 } });
      this.rows.push(t);
      at += t.height + 4;
    }
  }

  /** How wearing this would change the seven numbers, HP and mana, against what is worn in its slot. */
  private comparison(me: Character, g: GearItem): { text: string; color?: string } {
    const now = me.equipment[g.slot];
    const before = stats(me);
    const after = stats({ ...me, equipment: { ...me.equipment, [g.slot]: g } });
    const bits: string[] = [];
    let worse = false;
    let better = false;
    const note = (delta: number, shown: string, name: string): void => {
      if (!delta) return;
      if (delta > 0) better = true;
      else worse = true;
      bits.push(`${delta > 0 ? '+' : '−'}${shown} ${name}`);
    };
    note(after.attack - before.attack, `${Math.abs(after.attack - before.attack)}`, 'attack');
    note(after.magic - before.magic, `${Math.abs(after.magic - before.magic)}`, 'magic');
    note(after.defense - before.defense, `${Math.abs(after.defense - before.defense)}`, 'defense');
    note(after.maxHp - before.maxHp, `${Math.abs(after.maxHp - before.maxHp)}`, 'HP');
    note(after.maxMana - before.maxMana, `${Math.abs(after.maxMana - before.maxMana)}`, 'mana');
    for (const [id, name] of [['crit', 'crit'], ['dodge', 'dodge'], ['lifesteal', 'lifesteal'], ['thorns', 'thorns']] as const) {
      const delta = Math.round((after[id] - before[id]) * 100);
      note(delta, `${Math.abs(delta)}%`, name);
    }
    const against = now ? `Against ${now.name}` : `Your ${SLOT_NAMES[g.slot].toLowerCase()} slot is empty`;
    if (!bits.length) return { text: `${against}: no change.` };
    return { text: `${against}: ${bits.join(', ')}.`, color: worse && !better ? BAD : !worse ? GOOD : undefined };
  }

  private gearCard(me: Character, g: GearItem, worn: boolean): void {
    const { card } = BAG_LAYOUT;
    const iconY = card.y + 8;
    const before = this.rows.length;
    this.cubby(`cubby_${g.rarity}`, 30, iconY, 46, this.artOf(g), false, () => undefined);
    (this.rows.slice(before).find((o) => o instanceof Phaser.GameObjects.Zone) as Phaser.GameObjects.Zone | undefined)?.disableInteractive();
    this.rows.push(this.woodText(88, card.y + 16, g.name, 15).setOrigin(0, 0.5));
    const kind = g.name.toLowerCase() === g.base.toLowerCase() ? g.rarity : `${g.rarity} ${g.base}`;
    this.rows.push(this.add.text(88, card.y + 34, `${worn ? 'Worn · ' : ''}${kind} ${SLOT_NAMES[g.slot].toLowerCase()}`, { fontFamily: FONT, fontSize: '11px', color: CREAM }).setOrigin(0, 0.5));
    const lines: { text: string; color?: string; bold?: boolean }[] = [{ text: gearPowers(g).join(' · ') || 'A plain piece.', bold: true }];
    if (this.note) lines.push({ text: this.note });
    else if (!worn) lines.push(this.comparison(me, g));
    this.slip(88, card.y + 46, 296, 96, lines);
    const act = (y: number, text: string, color: number, onTap: () => void): void => {
      const b = makeButton(this, 53, y, 62, 36, text, color, '14px', onTap);
      b.setEnabled(!this.inFlight);
      this.rows.push(b.button);
    };
    if (worn) act(card.y + 84, 'Take off', COLORS.log, () => this.actOnPicked());
    else {
      act(card.y + 80, 'Wear', COLORS.button, () => this.actOnPicked());
      act(card.y + 122, 'Drop', 0xd9534f, () => this.dropPicked());
    }
  }

  private itemCard(me: Character, id: string): void {
    const { card } = BAG_LAYOUT;
    const item = ITEMS[id];
    const count = me.items[id] ?? 0;
    const s = stats(me);
    const flask = !!item && !item.dice;
    const helps = flask && count > 0 && ((!!item.heal && me.hp < s.maxHp) || (!!item.mana && me.mana < s.maxMana) || !!item.elixir || (!!item.cure && Object.keys(me.ailments ?? {}).length > 0));
    const frame = itemFrame(id);
    if (kitReady(this)) this.rows.push(this.add.image(53, card.y + 31, KIT, 'cubby_plain').setDisplaySize(46, 46));
    if (hasFrame(this, frame)) {
      const img = this.add.image(53, card.y + 31, frameTexture(this, frame), frame);
      img.setScale(34 / Math.max(img.width, img.height));
      this.rows.push(img);
    }
    this.rows.push(this.woodText(88, card.y + 16, item?.name ?? id, 15).setOrigin(0, 0.5));
    this.rows.push(this.add.text(88, card.y + 34, `${flask ? 'Flask' : 'Card'} · you have ${count}`, { fontFamily: FONT, fontSize: '11px', color: CREAM }).setOrigin(0, 0.5));
    const lines: { text: string; color?: string; bold?: boolean }[] = [{ text: item?.text ?? '' }];
    if (this.note) lines.push({ text: this.note, bold: true });
    else if (!flask) lines.push({ text: 'Use it after a roll: it shows above the message then.' });
    else if (!helps) lines.push({ text: 'You are full: it would do nothing now.', color: BAD });
    this.slip(88, card.y + 46, 296, 96, lines);
    if (flask) {
      const b = makeButton(this, 53, card.y + 84, 62, 36, 'Drink', COLORS.button, '14px', () => this.actOnPicked());
      b.setEnabled(helps && !this.inFlight);
      this.rows.push(b.button);
    }
  }

  private pick(p: Pick): void {
    this.note = '';
    this.picked = p;
    feel.buzz();
    sfx.play('ui/chip');
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
    if (p.kind !== 'carried') return;
    const g = me.bag.find((x) => x.id === p.id);
    if (g) this.send({ type: 'equip', gear: g.id }, `Now wearing ${g.name}.`);
  }

  private dropPicked(): void {
    const p = this.picked;
    if (p?.kind !== 'carried') return;
    const g = this.game_.me.bag.find((x) => x.id === p.id);
    if (g) this.send({ type: 'drop', gear: g.id }, `Dropped ${g.name}.`);
  }

  private send(intent: { type: 'equip'; gear: string } | { type: 'unequip'; slot: Slot } | { type: 'drop'; gear: string } | { type: 'use'; item: string }, done: string): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.refresh();
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
          this.picked = g ? { kind: 'carried', id: g.id } : null;
          this.tab = 'gear';
        }
        this.log.note(done);
        // What is worn shows on the hero at once (Robin, 2026-11-01: equipment must show).
        this.hero?.wear(this.game_.me);
        this.refresh();
        (this.scene.get('board') as BoardScene).refreshHud();
      },
      (e: unknown) => {
        this.inFlight = false;
        this.log.error(`bag action failed: ${String(e)}`);
        this.note = 'No answer from the world. Try again.';
        this.refresh();
      },
    );
  }
}

export type { GearItem };
