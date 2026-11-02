// The shop: the plain gear of the area's rank for every slot, the potions and the dice cards; a Sell side for what you carry; your gold;
// Leave. Tap a piece of gear: it stands beside what you wear in that slot, to compare for yourself, with its Buy or Sell (Robin, 2026-11-02). Opened by the board when a walk ends on a shop or a town, when a
// merchant has set up, or when the player taps the shop they stand on. Each Buy or Sell sends one intent.

import Phaser from 'phaser';
import { CLASS_DATA, GEAR, ITEMS, plainGear, PROGRESSION, sellPrice, shopOffer, SLOTS, SPACE_KIND_DATA, travelOptions, type GearItem, type GearLine, gearPowers, calendarDay, dailyPiece } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, RARITY_COLORS, RARITY_INK, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { abilityIcon } from '../effects.ts';
import { sfx } from '../feel.ts';
import { gearIcon } from '../hero.ts';
import { CREAM, hasFrame, icon, KIT, kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface ShopSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** The tag's green. */
const OWNED = 0x2f7d4f;

/** How much of this kind of piece you own: "Worn", "Worn, 2 in bag", "1 in bag", or nothing. */
export function ownedGear(worn: GearItem | null, bag: GearItem[], base: string): string {
  const wearing = worn?.base === base;
  const carried = bag.filter((g) => g.base === base).length;
  if (wearing && carried) return `Worn, ${carried} in bag`;
  if (wearing) return 'Worn';
  return carried ? `${carried} in bag` : '';
}

/** Where things sit, in design pixels (the driver taps them here). */
export const SHOP_LAYOUT = {
  /** Gear, Items and Sell; in a town Train too. */
  tabY: 192,
  firstRowY: 244,
  rowStep: 48,
  rows: 8,
  button: { x: 344, w: 88, h: 42 },
  leave: { x: CENTRE, y: 706, w: 220, h: 50 },
} as const;

type Tab = GearLine | 'items' | 'cards' | 'sell' | 'coach' | 'fine';

export class ShopScene extends Phaser.Scene {
  /** The text colours: ink on the kit's parchment. */
  private ink: { text: string; dim: string; gold: string } = { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold };
  private rarity: Record<string, string> = RARITY_COLORS;
  private readonly game_: GameHolder;
  /** True while an action is on its way to the world (mine, 2026-11-01): one at a time. */
  private inFlight = false;
  private readonly log: GameLog;
  private gold!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private comparing: Phaser.GameObjects.GameObject[] = [];
  private tab: Tab = 'items';
  private merchant = false;
  private town = false;

  constructor(deps: ShopSceneDeps) {
    super('shop');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(data?: { merchant?: boolean }): void {
    this.merchant = !!data?.merchant;
    this.comparing = [];
    this.tab = 'items';
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space];
    this.town = !this.merchant && space?.kind === 'town';
    const title = this.merchant ? 'Wandering Merchant' : space?.name || SPACE_KIND_DATA.shop.label;
    this.ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    this.rarity = kitReady(this) ? RARITY_INK : RARITY_COLORS;
    sheet(this);
    this.add.text(CENTRE, 134, title, { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: this.ink.text }).setOrigin(0.5);
    this.gold = this.add.text(CENTRE, 160, '', { fontFamily: FONT, fontSize: '15px', color: this.ink.gold }).setOrigin(0.5);
    const { tabY, leave } = SHOP_LAYOUT;
    // What this shop sells, as tabs (Robin, 2026-11-02: "landing on different shops should give you option to buy different gear").
    const offer = shopOffer(this.game_.state, me);
    const tier = offer?.tier ?? 1;
    const lineWord = (line: GearLine): string => GEAR.lines[line].words[tier - 1] ?? line;
    const lines = (offer?.lines ?? []) as GearLine[];
    const hasCards = (offer?.items ?? []).some((id) => ITEMS[id]?.dice);
    const tabs: [Tab, string][] = [...lines.map((l): [Tab, string] => [l, lineWord(l)]), ['items', 'Flasks'], ...(hasCards ? ([['cards', 'Cards']] as [Tab, string][]) : []), ['sell', 'Sell'], ...(this.town ? ([['coach', 'Coach']] as [Tab, string][]) : [])];
    if (offer?.town?.rank) tabs.unshift(['fine', 'Fine']);
    const tabW = (DESIGN_WIDTH - 40) / tabs.length;
    tabs.forEach(([id, word], i) => makeButton(this, 20 + tabW * (i + 0.5), tabY, tabW - 6, 44, word, COLORS.log, '15px', () => this.show(id)));
    this.message = this.add
      .text(CENTRE, 636, offer?.town?.line ?? 'What will it be?', { fontFamily: FONT, fontSize: '14px', color: this.ink.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } })
      .setOrigin(0.5, 0);
    makeButton(this, leave.x, leave.y, leave.w, leave.h, 'Leave', COLORS.log, '20px', () => (this.scene.get('board') as BoardScene).shopLeft());
    this.show(lines[0] ?? 'items');
    this.log.note(`shop: ${title}`);
  }

  private show(tab: Tab): void {
    this.tab = tab;
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    this.gold.setText(`Gold ${me.gold}`);
    const { firstRowY, rowStep, button } = SHOP_LAYOUT;
    const tier = shopOffer(this.game_.state, me)?.tier ?? 1;
    const gearRow = (i: number, g: GearItem, price: string, own: string, onTap: () => void): void => {
      const y = firstRowY + i * rowStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_shop_idle', CENTRE, y, DESIGN_WIDTH - 36, rowStep - 4));
      this.pieceIcon(g, 44, y, 34);
      const title = this.add.text(70, y, g.name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: g.rarity === 'common' ? this.ink.text : (this.rarity[g.rarity] ?? this.ink.text) }).setOrigin(0, 0.5);
      this.rows.push(title);
      if (own) this.rows.push(this.add.text(title.x + title.width + 10, y, own, { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#3f8a3a' }).setOrigin(0, 0.5));
      this.rows.push(this.add.text(378, y, price, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: this.ink.gold }).setOrigin(1, 0.5));
      const zone = this.add.zone(CENTRE, y, DESIGN_WIDTH - 36, rowStep - 2).setInteractive({ useHandCursor: true });
      zone.on('pointerup', onTap);
      this.rows.push(zone);
    };
    const row = (i: number, name: string, nameColor: string, detail: string, price: string, label: string, onTap: () => void, own = '', ability = ''): void => {
      const y = firstRowY + i * rowStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_shop_idle', CENTRE, y, DESIGN_WIDTH - 36, rowStep - 4));
      // The name and its line on one row each, cut to the room before the price (Robin, 2026-11-01: the shop's words overlapped).
      const pic = ability ? (hasFrame(this, ability) ? icon(this, ability, 42, y).setScale(0.42) : abilityIcon(this, ability, 40, y, 34)) : null;
      if (pic) this.rows.push(pic);
      const textX = pic ? 62 : 26;
      const title = this.add.text(textX, y - 9, name, { fontFamily: FONT_DISPLAY, fontSize: '16px', fontStyle: 'bold', color: nameColor }).setOrigin(0, 0.5);
      this.rows.push(title);
      // What you already own, as a green tag beside the name (Robin, 2026-11-01: "easy to see in the shops if you already own an item (or how many)").
      if (own) {
        const tag = this.add.text(title.x + title.width + 14, y - 9, own, { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0, 0.5);
        const pill = this.add.rectangle(tag.x - 5, y - 9, tag.width + 10, 19, OWNED).setOrigin(0, 0.5);
        this.rows.push(pill, tag);
        tag.setDepth(1);
      }
      this.rows.push(this.add.text(textX, y + 10, detail, { fontFamily: FONT, fontSize: '13px', color: this.ink.dim, wordWrap: { width: pic ? 200 : 236 }, maxLines: 1 }).setOrigin(0, 0.5));
      this.rows.push(this.add.text(292, y, price, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: this.ink.gold }).setOrigin(1, 0.5));
      this.rows.push(makeButton(this, button.x, y, button.w, button.h, label, label === 'Sell' ? 0xb0643a : label === '—' ? COLORS.log : COLORS.button, '15px', onTap).button);
    };
    if (tab === 'coach') {
      // The coach to a town you have stood in (mine, 2026-11-02: a bigger world needs a way back).
      const options = travelOptions(this.game_.state, me);
      if (!options.length) this.rows.push(this.add.text(CENTRE, firstRowY, 'The coach goes to towns you have been to.\nNo other yet.', { fontFamily: FONT, fontSize: '14px', color: this.ink.dim, align: 'center' }).setOrigin(0.5, 0));
      options.slice(0, SHOP_LAYOUT.rows).forEach((o, i) => row(i, o.name, this.ink.text, 'Rest there on arrival.', `${o.price} g`, 'Go', () => (this.scene.get('board') as BoardScene).travelTo(o.id)));
    } else if (tab === 'fine') {
      // The smith's one fine piece of the day (Robin, 2026-11-02: something for gold to do).
      const piece = dailyPiece(this.game_.state, me, this.game_.now());
      if (piece) {
        const sold = me.dailyBought?.[me.space] === calendarDay(this.game_.now());
        this.rows.push(this.add.text(CENTRE, sold ? firstRowY : firstRowY + rowStep, sold ? 'Gone for today. Back tomorrow.' : 'One piece a day, and dear.', { fontFamily: FONT, fontSize: '14px', color: this.ink.dim }).setOrigin(0.5));
        if (!sold) gearRow(0, piece, `${piece.price} g`, '', () => this.compare(piece, 'Buy', () => this.buy({ daily: true })));
      }
    } else if (tab === 'light' || tab === 'heavy' || tab === 'magic') {
      SLOTS.forEach((slot, i) => {
        const g = plainGear('preview', slot, tier, tab, me.classId);
        gearRow(i, g, `${g.price} g`, ownedGear(me.equipment[slot], me.bag, g.base), () => this.compare(g, 'Buy', () => this.buy({ slot, line: tab })));
      });
    } else if (tab === 'items' || tab === 'cards') {
      const sold = (shopOffer(this.game_.state, me)?.items ?? []).filter((id) => !!ITEMS[id]!.dice === (tab === 'cards'));
      sold.forEach((id, i) => {
        const item = ITEMS[id]!;
        const owned = me.items[id] ?? 0;
        row(i, item.name, this.ink.text, `${item.text.split('. ')[0]!.replace(/.$/, '')}.`, `${shopOffer(this.game_.state, me)?.price(id) ?? item.price} g`, 'Buy', () => this.buy({ item: id }), owned ? `You have ${owned}` : '', item.dice ? '' : id);
      });
    } else {
      const bag = me.bag.slice(0, SHOP_LAYOUT.rows);
      if (!bag.length) this.rows.push(this.add.text(CENTRE, firstRowY, 'Nothing to sell: your bag holds no gear.', { fontFamily: FONT, fontSize: '14px', color: this.ink.dim }).setOrigin(0.5));
      bag.forEach((g, i) => gearRow(i, g, `${sellPrice(g)} g`, '', () => this.compare(g, 'Sell', () => this.sell(g))));
      this.rows.push(this.add.text(24, firstRowY - 34, `Bag: ${me.bag.length} of ${GEAR.bagLimit}`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
      if (me.bag.length > bag.length) this.rows.push(this.add.text(CENTRE, firstRowY + bag.length * rowStep, `and ${me.bag.length - bag.length} more`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }).setOrigin(0.5));
    }
  }

  private pieceIcon(g: GearItem, x: number, y: number, size: number, list: Phaser.GameObjects.GameObject[] = this.rows): void {
    const art = gearIcon(this, g, this.game_.me.classId);
    if (kitReady(this)) list.push(this.add.image(x, y, KIT, `cubby_${g.rarity}`).setDisplaySize(size, size));
    if (art && this.textures.get(art.texture).has(art.frame)) {
      const img = this.add.image(x, y, art.texture, art.frame);
      list.push(img.setScale((size * 0.76) / Math.max(img.width, img.height)));
    } else if (kitReady(this) && hasFrame(this, `slot_${g.slot}`)) list.push(icon(this, `slot_${g.slot}`, x, y).setScale((size * 0.76) / 80));
  }

  /** The piece tapped beside what is worn in its slot, each with its own words: to compare for yourself (Robin, 2026-11-02). */
  private compare(g: GearItem, verb: 'Buy' | 'Sell', act: () => void): void {
    this.closeCompare();
    const me = this.game_.me;
    const worn = me.equipment[g.slot];
    const parts = this.comparing;
    const veil = this.add.rectangle(CENTRE, 400, 620, 800, 0x0b0d14, 0.6).setInteractive();
    veil.on('pointerup', () => this.closeCompare());
    parts.push(veil);
    const top = 236;
    const card = (x: number, w: number, head: string, piece: GearItem | null, note: string): void => {
      if (kitReady(this)) parts.push(plate(this, 'board_plain', x, top, w, 300).setOrigin(0, 0));
      else parts.push(this.add.rectangle(x, top, w, 300, COLORS.panel, 1).setOrigin(0, 0));
      parts.push(this.add.text(x + w / 2, top + 10, head, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: CREAM, stroke: '#3a2410', strokeThickness: 3 }).setOrigin(0.5, 0));
      if (kitReady(this)) parts.push(plate(this, 'board_slip', x + 8, top + 34, w - 16, 256).setOrigin(0, 0));
      if (!piece) {
        parts.push(this.add.text(x + w / 2, top + 150, note, { fontFamily: FONT, fontSize: '14px', color: '#8a7458', align: 'center', wordWrap: { width: w - 32 } }).setOrigin(0.5));
        return;
      }
      this.pieceIcon(piece, x + w / 2, top + 72, 52, parts);
      const name = this.add.text(x + w / 2, top + 104, piece.name, { fontFamily: FONT_DISPLAY, fontSize: '15px', fontStyle: 'bold', color: '#3a2410', align: 'center', wordWrap: { width: w - 28 } }).setOrigin(0.5, 0);
      parts.push(name);
      const rare = this.add.text(x + w / 2, name.y + name.height + 2, piece.rarity, { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: piece.rarity === 'common' ? '#8a7458' : (RARITY_INK[piece.rarity] ?? '#8a7458') }).setOrigin(0.5, 0);
      parts.push(rare);
      parts.push(this.add.text(x + 16, rare.y + 24, gearPowers(piece).join('\n'), { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#3a2410', lineSpacing: 6, wordWrap: { width: w - 32 } }));
    };
    card(18, 186, verb === 'Buy' ? 'In the shop' : 'In your bag', g, '');
    card(208, 186, 'You wear', worn, 'Nothing in this slot.');
    const price = verb === 'Buy' ? g.price : sellPrice(g);
    const can = verb === 'Sell' || me.gold >= price;
    const go = makeButton(this, 112, top + 334, 186, 48, `${verb} · ${price} g`, verb === 'Sell' ? 0xb0643a : COLORS.button, '17px', () => {
      this.closeCompare();
      act();
    });
    go.setEnabled(can);
    parts.push(go.button);
    parts.push(makeButton(this, 300, top + 334, 186, 48, 'Back', COLORS.log, '17px', () => this.closeCompare()).button);
    sfx.play('ui/chip');
  }

  private closeCompare(): void {
    for (const p of this.comparing) p.destroy();
    this.comparing = [];
  }

  private buy(what: { item?: string; slot?: (typeof SLOTS)[number]; ability?: string; line?: GearLine; daily?: boolean }): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act({ type: 'buy', player: this.game_.player, ...what }).then((events) => this.bought(events), (e: unknown) => this.failed(e));
  }

  private bought(events: GameEvent[]): void {
    this.inFlight = false;
    const bought = events.find((e) => e.type === 'bought');
    if (bought && bought.type === 'bought') {
      const name = bought.gear ? bought.gear.name : (ITEMS[bought.item ?? '']?.name ?? bought.item);
      this.message.setText(`Bought ${name} for ${bought.price} gold.${bought.gear ? (events.some((e) => e.type === 'equipped') ? ' You put it on.' : ' It is in your bag.') : ''}`);
      this.log.note(`bought ${name} for ${bought.price}`);
    } else {
      this.message.setText(this.describe(events));
    }
    this.show(this.tab);
    (this.scene.get('board') as BoardScene).refreshHud();
  }

  private sell(g: GearItem): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act({ type: 'sell', player: this.game_.player, gear: g.id }).then(
      (events) => {
        this.inFlight = false;
        const sold = events.find((e) => e.type === 'sold');
        this.message.setText(sold?.type === 'sold' ? `Sold ${g.name} for ${sold.price} gold.` : this.describe(events));
        this.show(this.tab);
        (this.scene.get('board') as BoardScene).refreshHud();
      },
      (e: unknown) => this.failed(e),
    );
  }

  /** The world did not answer (the socket is between two lives): say so; the next tap tries again. */
  /** Words from elsewhere: why the coach would not go. */
  showMessage(text: string): void {
    this.message.setText(text);
  }

  private failed(e: unknown): void {
    this.inFlight = false;
    this.log.error(`shop action failed: ${String(e)}`);
    this.message.setText('No answer from the world. Try again.');
  }

  private describe(events: GameEvent[]): string {
    const rejected = events.find((e) => e.type === 'rejected');
    if (rejected?.type === 'rejected') return rejected.reason === 'not enough gold' ? 'Not enough gold.' : rejected.reason === 'bag full' ? `Your bag is full (${GEAR.bagLimit}): sell or drop something first.` : `Not allowed: ${rejected.reason}.`;
    return 'Nothing happened.';
  }
}

type GameEvent = Awaited<ReturnType<GameHolder['act']>>[number];
