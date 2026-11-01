// The shop: the plain gear of the area's rank for every slot, the potions and the dice cards, with a Buy button each;
// a Sell side for what you carry; in a town a Train side too, the class's abilities from the trainer (Robin,
// 2026-10-31: skills are bought, found or earned); your gold; Leave. Opened by the board when a walk ends on a shop or a town, when a
// merchant has set up, or when the player taps the shop they stand on. Each Buy or Sell sends one intent.

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, describeGear, GEAR, ITEM_IDS, ITEMS, plainGear, PROGRESSION, sellPrice, SLOTS, SPACE_KIND_DATA, type GearItem } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, RARITY_COLORS, RARITY_INK, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { sfx } from '../feel.ts';
import { kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface ShopSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where things sit, in design pixels (the driver taps them here). */
export const SHOP_LAYOUT = {
  tabBuy: { x: 140, y: 178, w: 120, h: 34 },
  tabSell: { x: 272, y: 178, w: 120, h: 34 },
  /** In a town the three tabs share the row. */
  townTabs: { buy: { x: 96, y: 178, w: 100, h: 34 }, sell: { x: 206, y: 178, w: 100, h: 34 }, train: { x: 316, y: 178, w: 100, h: 34 } },
  firstRowY: 216,
  rowStep: 33,
  rows: 14,
  button: { x: 356, w: 80, h: 32 },
  leave: { x: CENTRE, y: 706, w: 220, h: 50 },
} as const;

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
  private tab: 'buy' | 'sell' | 'train' = 'buy';
  private merchant = false;
  private town = false;

  constructor(deps: ShopSceneDeps) {
    super('shop');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(data?: { merchant?: boolean }): void {
    this.merchant = !!data?.merchant;
    this.tab = 'buy';
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space];
    this.town = !this.merchant && space?.kind === 'town';
    const title = this.merchant ? 'Wandering Merchant' : space?.name || SPACE_KIND_DATA.shop.label;
    this.ink = sheetInk(this, { text: COLORS.text, dim: COLORS.dim, gold: COLORS.gold });
    this.rarity = kitReady(this) ? RARITY_INK : RARITY_COLORS;
    sheet(this);
    this.add.text(CENTRE, 124, title, { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: 'bold', color: this.ink.text }).setOrigin(0.5);
    this.gold = this.add.text(CENTRE, 152, '', { fontFamily: FONT, fontSize: '15px', color: this.ink.gold }).setOrigin(0.5);
    const { tabBuy, tabSell, townTabs, leave } = SHOP_LAYOUT;
    const buyTab = this.town ? townTabs.buy : tabBuy;
    const sellTab = this.town ? townTabs.sell : tabSell;
    makeButton(this, buyTab.x, buyTab.y, buyTab.w, buyTab.h, 'Buy', COLORS.log, '15px', () => this.show('buy'));
    makeButton(this, sellTab.x, sellTab.y, sellTab.w, sellTab.h, 'Sell', COLORS.log, '15px', () => this.show('sell'));
    if (this.town) makeButton(this, townTabs.train.x, townTabs.train.y, townTabs.train.w, townTabs.train.h, 'Train', COLORS.log, '15px', () => this.show('train'));
    this.message = this.add
      .text(CENTRE, 668, 'What will it be?', { fontFamily: FONT, fontSize: '14px', color: this.ink.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } })
      .setOrigin(0.5, 0);
    makeButton(this, leave.x, leave.y, leave.w, leave.h, 'Leave', COLORS.log, '20px', () => (this.scene.get('board') as BoardScene).shopLeft());
    this.show('buy');
    this.log.note(`shop: ${title}`);
  }

  private show(tab: 'buy' | 'sell' | 'train'): void {
    this.tab = tab;
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    this.gold.setText(`Gold ${me.gold}`);
    const { firstRowY, rowStep, button } = SHOP_LAYOUT;
    const tier = this.game_.state.board.areas[this.game_.state.board.spaces[me.space]?.area ?? '']?.tier ?? 1;
    const row = (i: number, name: string, nameColor: string, detail: string, price: string, label: string, onTap: () => void): void => {
      const y = firstRowY + i * rowStep;
      if (kitReady(this)) this.rows.push(plate(this, 'row_shop_idle', CENTRE, y, DESIGN_WIDTH - 36, rowStep - 3));
      // The name and its line on one row each, cut to the room before the price (Robin, 2026-11-01: the shop's words overlapped).
      this.rows.push(this.add.text(26, y - 7, name, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: nameColor }).setOrigin(0, 0.5));
      this.rows.push(this.add.text(26, y + 7, detail, { fontFamily: FONT, fontSize: '10px', color: this.ink.dim, wordWrap: { width: 238 }, maxLines: 1 }).setOrigin(0, 0.5));
      this.rows.push(this.add.text(306, y, price, { fontFamily: FONT, fontSize: '14px', color: this.ink.gold }).setOrigin(1, 0.5));
      this.rows.push(makeButton(this, button.x, y, button.w, button.h, label, label === 'Sell' ? 0xb0643a : label === '—' ? COLORS.log : COLORS.button, '14px', onTap).button);
    };
    if (tab === 'train') {
      // The trainer: the class's abilities, each learned for the tier's price or raised a rank for more.
      const mine = Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === me.classId);
      const meterName = CLASS_DATA[me.classId].meter?.name ?? 'meter';
      mine.forEach((id, i) => {
        const a = ABILITIES[id]!;
        const rank = me.abilities[id] ?? 0;
        const top = rank >= a.ranks.length;
        const price = rank === 0 ? PROGRESSION.training.learn * tier : PROGRESSION.training.rank * tier * rank;
        const cost = `${a.mana} MP${a.meterAll ? `, all ${meterName}` : a.meter ? `, ${a.meter} ${meterName}` : ''}`;
        row(i, `${a.name}${rank ? ` · rank ${rank}` : ''}`, rank ? this.ink.text : this.ink.dim, `${a.text} ${cost}.`, top ? 'top' : `${price} g`, top ? '—' : rank ? 'Rank up' : 'Learn', () => {
          if (!top) this.buy({ ability: id });
        });
      });
    } else if (tab === 'buy') {
      SLOTS.forEach((slot, i) => {
        const g = plainGear('preview', slot, tier);
        row(i, g.name, this.ink.text, describeGear(g).split(' · ').slice(2).join(' · '), `${g.price} g`, 'Buy', () => this.buy({ slot }));
      });
      ITEM_IDS.forEach((id, i) => {
        const item = ITEMS[id]!;
        const owned = me.items[id] ?? 0;
        row(SLOTS.length + i, item.name, this.ink.text, `${item.text}${owned ? ` · you have ${owned}` : ''}`, `${item.price} g`, 'Buy', () => this.buy({ item: id }));
      });
    } else {
      const bag = me.bag.slice(0, SHOP_LAYOUT.rows);
      if (!bag.length) this.rows.push(this.add.text(CENTRE, firstRowY, 'Nothing to sell: your bag holds no gear.', { fontFamily: FONT, fontSize: '14px', color: this.ink.dim }).setOrigin(0.5));
      bag.forEach((g, i) => row(i, g.name, this.rarity[g.rarity] ?? COLORS.text, describeGear(g).split(' · ').slice(1).join(' · '), `${sellPrice(g)} g`, 'Sell', () => this.sell(g)));
      this.rows.push(this.add.text(24, firstRowY - 34, `Bag: ${me.bag.length} of ${GEAR.bagLimit}`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
      if (me.bag.length > bag.length) this.rows.push(this.add.text(CENTRE, firstRowY + bag.length * rowStep, `and ${me.bag.length - bag.length} more`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }).setOrigin(0.5));
    }
  }

  private buy(what: { item?: string; slot?: (typeof SLOTS)[number]; ability?: string }): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act({ type: 'buy', player: this.game_.player, ...what }).then((events) => this.bought(events), (e: unknown) => this.failed(e));
  }

  private bought(events: GameEvent[]): void {
    this.inFlight = false;
    const bought = events.find((e) => e.type === 'bought');
    const trained = events.find((e) => e.type === 'trained');
    if (trained?.type === 'trained') {
      this.message.setText(`${trained.rank === 1 ? 'Learned' : 'Raised'} ${ABILITIES[trained.ability]?.name ?? trained.ability}${trained.rank > 1 ? ` to rank ${trained.rank}` : ''} for ${trained.price} gold.`);
      this.log.note(`trained ${trained.ability} rank ${trained.rank} for ${trained.price}`);
    } else if (bought && bought.type === 'bought') {
      const name = bought.gear ? bought.gear.name : (ITEMS[bought.item ?? '']?.name ?? bought.item);
      this.message.setText(`Bought ${name} for ${bought.price} gold.${bought.gear ? ' It is in your bag.' : ''}`);
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
