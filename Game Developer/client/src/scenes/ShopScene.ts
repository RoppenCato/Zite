// The shop: the plain gear of the area's rank for every slot, the potions and the dice cards, with a Buy button each;
// a Sell side for what you carry; in a town a Train side too, the class's abilities from the trainer (Robin,
// 2026-10-31: skills are bought, found or earned); your gold; Leave. Opened by the board when a walk ends on a shop or a town, when a
// merchant has set up, or when the player taps the shop they stand on. Each Buy or Sell sends one intent.

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, describeGear, GEAR, ITEMS, plainGear, PROGRESSION, sellPrice, shopOffer, SLOTS, SPACE_KIND_DATA, type GearItem, type GearLine } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, FONT_DISPLAY, HUD_HEIGHT, RARITY_COLORS, RARITY_INK, VIEW_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { abilityIcon } from '../effects.ts';
import { sfx } from '../feel.ts';
import { hasFrame, icon, kitReady, plate, sheet, sheetInk } from '../kit.ts';
import { makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface ShopSceneDeps {
  game: GameHolder;
  log: GameLog;
}

const CENTRE = DESIGN_WIDTH / 2;
/** The tag's green. */
const OWNED = 0x2f7d4f;

/** What you wear in the slot now, by the same number, for a piece of another kind. */
function compareWorn(g: GearItem, worn: GearItem | null): string {
  if (!worn || worn.base === g.base) return '';
  const stat = Object.keys(g.stats)[0] as keyof GearItem['stats'] | undefined;
  return stat ? ` · you have +${worn.stats[stat] ?? 0}` : '';
}

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

type Tab = GearLine | 'items' | 'cards' | 'sell' | 'train';

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
    const tier = this.game_.state.board.areas[space?.area ?? '']?.tier ?? 1;
    const lineWord = (line: GearLine): string => GEAR.lines[line].words[tier - 1] ?? line;
    const lines = (offer?.lines ?? []) as GearLine[];
    const hasCards = (offer?.items ?? []).some((id) => ITEMS[id]?.dice);
    const tabs: [Tab, string][] = [...lines.map((l): [Tab, string] => [l, lineWord(l)]), ['items', 'Flasks'], ...(hasCards ? ([['cards', 'Cards']] as [Tab, string][]) : []), ['sell', 'Sell'], ...(this.town ? ([['train', 'Train']] as [Tab, string][]) : [])];
    const tabW = (DESIGN_WIDTH - 40) / tabs.length;
    tabs.forEach(([id, word], i) => makeButton(this, 20 + tabW * (i + 0.5), tabY, tabW - 6, 44, word, COLORS.log, '15px', () => this.show(id)));
    this.message = this.add
      .text(CENTRE, 636, 'What will it be?', { fontFamily: FONT, fontSize: '14px', color: this.ink.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 40 } })
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
    const tier = this.game_.state.board.areas[this.game_.state.board.spaces[me.space]?.area ?? '']?.tier ?? 1;
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
        }, '', id);
      });
    } else if (tab === 'light' || tab === 'heavy' || tab === 'magic') {
      SLOTS.forEach((slot, i) => {
        const g = plainGear('preview', slot, tier, tab, me.classId);
        row(i, g.name, this.ink.text, `${describeGear(g).split(' · ').slice(2).join(' · ')}${compareWorn(g, me.equipment[slot])}`, `${g.price} g`, 'Buy', () => this.buy({ slot, line: tab }), ownedGear(me.equipment[slot], me.bag, g.base));
      });
    } else if (tab === 'items' || tab === 'cards') {
      const sold = (shopOffer(this.game_.state, me)?.items ?? []).filter((id) => !!ITEMS[id]!.dice === (tab === 'cards'));
      sold.forEach((id, i) => {
        const item = ITEMS[id]!;
        const owned = me.items[id] ?? 0;
        row(i, item.name, this.ink.text, `${item.text.split('. ')[0]!.replace(/.$/, '')}.`, `${item.price} g`, 'Buy', () => this.buy({ item: id }), owned ? `You have ${owned}` : '', item.dice ? '' : id);
      });
    } else {
      const bag = me.bag.slice(0, SHOP_LAYOUT.rows);
      if (!bag.length) this.rows.push(this.add.text(CENTRE, firstRowY, 'Nothing to sell: your bag holds no gear.', { fontFamily: FONT, fontSize: '14px', color: this.ink.dim }).setOrigin(0.5));
      bag.forEach((g, i) => row(i, g.name, this.rarity[g.rarity] ?? COLORS.text, describeGear(g).split(' · ').slice(1).join(' · '), `${sellPrice(g)} g`, 'Sell', () => this.sell(g)));
      this.rows.push(this.add.text(24, firstRowY - 34, `Bag: ${me.bag.length} of ${GEAR.bagLimit}`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }));
      if (me.bag.length > bag.length) this.rows.push(this.add.text(CENTRE, firstRowY + bag.length * rowStep, `and ${me.bag.length - bag.length} more`, { fontFamily: FONT, fontSize: '12px', color: this.ink.dim }).setOrigin(0.5));
    }
  }

  private buy(what: { item?: string; slot?: (typeof SLOTS)[number]; ability?: string; line?: GearLine }): void {
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
