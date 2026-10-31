// The shop: the plain gear of the area's rank for every slot, the potion and the dice cards, with a Buy button each;
// a Sell side for what you carry; your gold; Leave. Opened by the board when a walk ends on a shop or a town, when a
// merchant has set up, or when the player taps the shop they stand on. Each Buy or Sell sends one intent.

import Phaser from 'phaser';
import { describeGear, ITEM_IDS, ITEMS, plainGear, sellPrice, SLOTS, SPACE_KIND_DATA, type GearItem } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, RARITY_COLORS, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface ShopSceneDeps {
  game: LocalGame;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** Where things sit, in design pixels (the driver taps them here). */
export const SHOP_LAYOUT = {
  tabBuy: { x: 140, y: 178, w: 120, h: 34 },
  tabSell: { x: 272, y: 178, w: 120, h: 34 },
  firstRowY: 224,
  rowStep: 44,
  rows: 10,
  button: { x: 356, w: 80, h: 32 },
  leave: { x: CENTRE, y: 706, w: 220, h: 50 },
} as const;

export class ShopScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private gold!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private tab: 'buy' | 'sell' = 'buy';
  private merchant = false;

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
    const title = this.merchant ? 'Wandering Merchant' : space?.name || SPACE_KIND_DATA.shop.label;
    this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();
    this.add.text(CENTRE, 124, title, { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.gold = this.add.text(CENTRE, 152, '', { fontFamily: FONT, fontSize: '15px', color: COLORS.gold }).setOrigin(0.5);
    const { tabBuy, tabSell, leave } = SHOP_LAYOUT;
    makeButton(this, tabBuy.x, tabBuy.y, tabBuy.w, tabBuy.h, 'Buy', COLORS.log, '15px', () => this.show('buy'));
    makeButton(this, tabSell.x, tabSell.y, tabSell.w, tabSell.h, 'Sell', COLORS.log, '15px', () => this.show('sell'));
    this.message = this.add
      .text(CENTRE, 668, 'What will it be?', { fontFamily: FONT, fontSize: '14px', color: COLORS.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } })
      .setOrigin(0.5, 0);
    makeButton(this, leave.x, leave.y, leave.w, leave.h, 'Leave', COLORS.log, '20px', () => (this.scene.get('board') as BoardScene).shopLeft());
    this.show('buy');
    this.log.note(`shop: ${title}`);
  }

  private show(tab: 'buy' | 'sell'): void {
    this.tab = tab;
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    this.gold.setText(`Gold ${me.gold}`);
    const { firstRowY, rowStep, button } = SHOP_LAYOUT;
    const tier = this.game_.state.board.areas[this.game_.state.board.spaces[me.space]?.area ?? '']?.tier ?? 1;
    const row = (i: number, name: string, nameColor: string, detail: string, price: string, label: string, onTap: () => void): void => {
      const y = firstRowY + i * rowStep;
      this.rows.push(this.add.text(24, y - 15, name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: nameColor }));
      this.rows.push(this.add.text(24, y + 4, detail, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim }));
      this.rows.push(this.add.text(306, y, price, { fontFamily: FONT, fontSize: '14px', color: COLORS.gold }).setOrigin(1, 0.5));
      this.rows.push(makeButton(this, button.x, y, button.w, button.h, label, label === 'Buy' ? COLORS.button : 0xb0643a, '14px', onTap).button);
    };
    if (tab === 'buy') {
      SLOTS.forEach((slot, i) => {
        const g = plainGear('preview', slot, tier);
        row(i, g.name, COLORS.text, describeGear(g).split(' · ').slice(2).join(' · '), `${g.price} g`, 'Buy', () => this.buy({ slot }));
      });
      ITEM_IDS.forEach((id, i) => {
        const item = ITEMS[id]!;
        const owned = me.items[id] ?? 0;
        row(SLOTS.length + i, item.name, COLORS.text, `${item.text}${owned ? ` · you have ${owned}` : ''}`, `${item.price} g`, 'Buy', () => this.buy({ item: id }));
      });
    } else {
      const bag = me.bag.slice(0, SHOP_LAYOUT.rows);
      if (!bag.length) this.rows.push(this.add.text(CENTRE, firstRowY, 'Nothing to sell: your bag holds no gear.', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim }).setOrigin(0.5));
      bag.forEach((g, i) => row(i, g.name, RARITY_COLORS[g.rarity] ?? COLORS.text, describeGear(g).split(' · ').slice(1).join(' · '), `${sellPrice(g)} g`, 'Sell', () => this.sell(g)));
      if (me.bag.length > bag.length) this.rows.push(this.add.text(CENTRE, firstRowY + bag.length * rowStep, `and ${me.bag.length - bag.length} more`, { fontFamily: FONT, fontSize: '12px', color: COLORS.dim }).setOrigin(0.5));
    }
  }

  private buy(what: { item?: string; slot?: (typeof SLOTS)[number] }): void {
    const events = this.game_.act({ type: 'buy', player: this.game_.player, ...what });
    const bought = events.find((e) => e.type === 'bought');
    if (bought && bought.type === 'bought') {
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
    const events = this.game_.act({ type: 'sell', player: this.game_.player, gear: g.id });
    const sold = events.find((e) => e.type === 'sold');
    this.message.setText(sold?.type === 'sold' ? `Sold ${g.name} for ${sold.price} gold.` : this.describe(events));
    this.show(this.tab);
    (this.scene.get('board') as BoardScene).refreshHud();
  }

  private describe(events: GameEvent[]): string {
    const rejected = events.find((e) => e.type === 'rejected');
    if (rejected?.type === 'rejected') return rejected.reason === 'not enough gold' ? 'Not enough gold.' : `Not allowed: ${rejected.reason}.`;
    return 'Nothing happened.';
  }
}

type GameEvent = ReturnType<LocalGame['act']>[number];
