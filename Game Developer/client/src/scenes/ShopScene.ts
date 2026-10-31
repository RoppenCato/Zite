// The shop: a list of what the cart sells with a Buy button each, your gold, what you carry, Leave. Opened by the board
// when a walk ends on a shop space, or when the player taps the shop they stand on. Each Buy sends one intent.

import Phaser from 'phaser';
import { ITEM_IDS, ITEMS, SPACE_KIND_DATA } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
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
  firstRowY: 214,
  rowStep: 72,
  buy: { x: 352, w: 88, h: 40 },
  leave: { x: CENTRE, y: 696, w: 220, h: 56 },
} as const;

export class ShopScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private gold!: Phaser.GameObjects.Text;
  private bag!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;

  constructor(deps: ShopSceneDeps) {
    super('shop');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    const me = this.game_.me;
    const space = this.game_.state.board.spaces[me.space];
    const title = space?.name || SPACE_KIND_DATA.shop.label;
    this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();
    this.add.text(CENTRE, 124, title, { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.gold = this.add.text(CENTRE, 158, '', { fontFamily: FONT, fontSize: '16px', color: '#e8b84a' }).setOrigin(0.5);

    ITEM_IDS.forEach((id, i) => {
      const item = ITEMS[id]!;
      const y = SHOP_LAYOUT.firstRowY + i * SHOP_LAYOUT.rowStep;
      this.add.text(28, y - 20, item.name, { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: COLORS.text });
      this.add.text(28, y + 4, item.text, { fontFamily: FONT, fontSize: '12px', color: COLORS.dim, wordWrap: { width: 236 } });
      this.add.text(300, y - 2, `${item.price} g`, { fontFamily: FONT, fontSize: '15px', color: '#e8b84a' }).setOrigin(1, 0.5);
      makeButton(this, SHOP_LAYOUT.buy.x, y, SHOP_LAYOUT.buy.w, SHOP_LAYOUT.buy.h, 'Buy', COLORS.button, '17px', () => this.buy(id));
    });

    this.message = this.add
      .text(CENTRE, 586, 'What will it be?', { fontFamily: FONT, fontSize: '16px', color: COLORS.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } })
      .setOrigin(0.5, 0);
    this.bag = this.add.text(CENTRE, 622, '', { fontFamily: FONT, fontSize: '13px', color: COLORS.dim, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } }).setOrigin(0.5, 0);
    const { leave } = SHOP_LAYOUT;
    makeButton(this, leave.x, leave.y, leave.w, leave.h, 'Leave', COLORS.log, '22px', () => (this.scene.get('board') as BoardScene).shopLeft());
    this.refresh();
    this.log.note(`shop: ${title}`);
  }

  private buy(item: string): void {
    const events = this.game_.act({ type: 'buy', player: this.game_.player, item });
    const bought = events.find((e) => e.type === 'bought');
    if (bought && bought.type === 'bought') {
      this.message.setText(`Bought a ${ITEMS[item]?.name ?? item} for ${bought.price} gold.`);
      this.log.note(`bought ${item} for ${bought.price}`);
    } else {
      const rejected = events.find((e) => e.type === 'rejected');
      this.message.setText(rejected?.type === 'rejected' ? (rejected.reason === 'not enough gold' ? 'Not enough gold.' : `Not allowed: ${rejected.reason}.`) : 'Nothing happened.');
    }
    this.refresh();
    (this.scene.get('board') as BoardScene).refreshHud();
  }

  private refresh(): void {
    const me = this.game_.me;
    this.gold.setText(`Gold ${me.gold}`);
    const carried = Object.entries(me.items)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${ITEMS[id]?.name ?? id} ×${n}`);
    this.bag.setText(carried.length ? `You carry: ${carried.join(', ')}` : 'You carry nothing yet.');
  }
}
