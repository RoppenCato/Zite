// The fight screen: its own scene over the board band, one thumb (Robin, 2026-10-31: fights are their own screen, 2D,
// turn-based with choices among attacks, spells and defending). The enemy at the top, the character below, a message
// between, four buttons. It decides nothing: each button sends one intent and the events are played back one by one.

import Phaser from 'phaser';
import { CLASS_DATA, ITEMS, type GameEvent } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { Bar, makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface FightSceneDeps {
  game: LocalGame;
  log: GameLog;
}

/** Where the buttons sit, in design pixels (the driver taps them here). */
export const FIGHT_BUTTONS = {
  attack: { x: 110, y: 672, w: 180, h: 52 },
  skill: { x: 302, y: 672, w: 180, h: 52 },
  defend: { x: 110, y: 736, w: 180, h: 52 },
  flee: { x: 302, y: 736, w: 180, h: 52 },
  potion: { x: 206, y: 612, w: 220, h: 44 },
  continue: { x: 206, y: 704, w: 220, h: 56 },
} as const;

const STEP_MS = 450; // between two events of a round
const CENTRE = DESIGN_WIDTH / 2;
const BAR_W = 260;
const BAR_H = 18;

const ENEMY_COLORS: Record<string, number> = {
  slime: 0x6fbf73,
  wolf: 0x9a8f7a,
  wisp: 0x7fd8d8,
  bandit: 0xb0643a,
};

const CLASS_COLORS: Record<string, number> = {
  warrior: 0xf2f2f2,
  rogue: 0xcfcfcf,
  mage: 0xd8c8ff,
  ranger: 0xc8f0c8,
};

export type FightOutcome = { type: 'won' | 'died' | 'fled'; summary: string };

export class FightScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private enemyBody!: Phaser.GameObjects.Arc;
  private enemyBar!: Bar;
  private heroBody!: Phaser.GameObjects.Arc;
  private heroBar!: Bar;
  private message!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Container[] = [];
  private potionButton!: Phaser.GameObjects.Container;
  private potionLabel!: Phaser.GameObjects.Text;
  private continueButton!: Phaser.GameObjects.Container;
  /** True while a round's events are being played back; the buttons wait. */
  private busy = false;
  private outcome: FightOutcome | null = null;
  /** Kept from the start, since the fight is gone from the state by the time the last events are shown. */
  private enemyName = '';
  private enemyMaxHp = 1;

  constructor(deps: FightSceneDeps) {
    super('fight');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  create(): void {
    const me = this.game_.me;
    const fight = me.fight;
    if (!fight) {
      this.scene.stop();
      return;
    }
    const enemy = fight.enemy;
    const cls = CLASS_DATA[me.classId];
    this.busy = false;
    this.outcome = null;
    this.enemyName = enemy.name;
    this.enemyMaxHp = enemy.maxHp;

    // The panel covers the band and takes every touch, so nothing reaches the board under it.
    this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();

    this.add.text(CENTRE, 122, enemy.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.enemyBar = new Bar(this, CENTRE, 158, BAR_W, BAR_H, 0xd9534f);
    this.enemyBody = this.add.circle(CENTRE, 268, 60, ENEMY_COLORS[enemy.id] ?? 0x8f2f3b, 1).setStrokeStyle(4, 0x101318, 1);
    this.add.text(CENTRE, 268, enemy.name.charAt(0), { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);

    this.message = this.add
      .text(CENTRE, 362, `A ${enemy.name} blocks the way!`, { fontFamily: FONT, fontSize: '17px', color: COLORS.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 60 } })
      .setOrigin(0.5, 0);

    this.heroBody = this.add.circle(CENTRE, 470, 30, CLASS_COLORS[me.classId] ?? 0xffffff, 1).setStrokeStyle(3, 0x101318, 1);
    this.add.text(CENTRE, 470, cls.name.charAt(0), { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
    this.heroBar = new Bar(this, CENTRE, 530, BAR_W, BAR_H, COLORS.button);
    this.add
      .text(CENTRE, 552, `${me.name} the ${cls.name}, level ${me.level}`, { fontFamily: FONT, fontSize: '13px', color: COLORS.dim })
      .setOrigin(0.5, 0);

    const b = FIGHT_BUTTONS;
    this.buttons = [
      makeButton(this, b.attack.x, b.attack.y, b.attack.w, b.attack.h, 'Attack', COLORS.button, '20px', () => this.act('attack')).button,
      makeButton(this, b.skill.x, b.skill.y, b.skill.w, b.skill.h, cls.skill.name, 0x8e6ad9, '20px', () => this.act('skill')).button,
      makeButton(this, b.defend.x, b.defend.y, b.defend.w, b.defend.h, 'Defend', COLORS.log, '20px', () => this.act('defend')).button,
      makeButton(this, b.flee.x, b.flee.y, b.flee.w, b.flee.h, 'Flee', COLORS.log, '20px', () => this.act('flee')).button,
    ];
    const potion = makeButton(this, b.potion.x, b.potion.y, b.potion.w, b.potion.h, 'Potion', 0x4aa3df, '17px', () => this.act('use', 'potion'));
    this.potionButton = potion.button;
    this.potionLabel = potion.label;
    this.buttons.push(this.potionButton);
    this.refreshPotion();
    this.continueButton = makeButton(this, b.continue.x, b.continue.y, b.continue.w, b.continue.h, 'Continue', COLORS.button, '22px', () => this.leave()).button;
    this.continueButton.setVisible(false);

    this.enemyBar.set(enemy.hp, enemy.maxHp, true);
    this.heroBar.set(me.hp, me.maxHp, true);
    this.log.note(`fight: ${enemy.name} ${enemy.hp} hp, round ${fight.round}`);
  }

  // ---- play ----------------------------------------------------------------------------------------------------------

  private act(type: 'attack' | 'defend' | 'skill' | 'flee' | 'use', item?: string): void {
    if (this.busy || this.outcome) return;
    this.setBusy(true);
    const events = type === 'use' ? this.game_.act({ type, player: this.game_.player, item: item ?? 'potion' }) : this.game_.act({ type, player: this.game_.player });
    this.log.note(`fight ${type}: ${events.map((e) => (e.type === 'hit' ? `${e.by} ${e.damage}` : e.type)).join(', ')}`);
    this.play(events, 0);
  }

  /** One event at a time, a beat apart, so a round reads as blows and not as a jump of the bars. */
  private play(events: GameEvent[], i: number): void {
    if (i >= events.length) {
      this.setBusy(false);
      this.refreshPotion();
      (this.scene.get('board') as BoardScene).refreshHud();
      if (this.outcome) {
        for (const b of this.buttons) b.setVisible(false);
        this.continueButton.setVisible(true);
      }
      return;
    }
    this.show(events[i]!);
    this.time.delayedCall(STEP_MS, () => this.play(events, i + 1));
  }

  private show(e: GameEvent): void {
    const me = this.game_.me;
    switch (e.type) {
      case 'hit':
        if (e.by === 'player') {
          this.flash(this.enemyBody, e.damage, e.crit);
          this.enemyBar.set(e.hp, this.enemyMaxHp);
          this.say(`${e.move}: ${e.damage} damage${e.crit ? ', a crit!' : '.'}`);
        } else {
          this.flash(this.heroBody, e.damage, e.crit);
          this.heroBar.set(e.hp, me.maxHp);
          this.say(`${e.move} hits you for ${e.damage}${e.crit ? ', a crit!' : '.'}`);
        }
        break;
      case 'used':
        this.say(`You drink a ${ITEMS[e.item]?.name ?? e.item}.`);
        break;
      case 'healed':
        this.heroBar.set(e.hp, me.maxHp);
        this.say(e.amount > 0 ? `You feel better: +${e.amount} HP.` : 'Nothing to heal.');
        break;
      case 'charged':
        this.say('You gather power. The next hit will be huge.');
        break;
      case 'guarded':
        this.say('You brace for the blow.');
        break;
      case 'fled':
        if (e.ok) this.end({ type: 'fled', summary: 'You got away.' }, 'You got away!');
        else this.say('No escape!');
        break;
      case 'won':
        this.end({ type: 'won', summary: `Beat the ${this.enemyName}: +${e.xp} xp, +${e.gold} gold.` }, `${this.enemyName} is beaten! +${e.xp} xp, +${e.gold} gold.`);
        break;
      case 'levelled':
        this.heroBar.set(me.hp, me.maxHp);
        this.say(`Level ${e.level}! HP ${e.maxHp}, attack ${e.attack}, defense ${e.defense}.`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} Level ${e.level}!` };
        break;
      case 'died': {
        const town = this.game_.state.board.spaces[e.town]?.name ?? e.town;
        this.heroBar.set(0, me.maxHp);
        this.end({ type: 'died', summary: `You wake in ${town} with ${e.lostGold} gold less.` }, `You fall. You wake in ${town}, ${e.lostGold} gold lighter.`);
        break;
      }
      case 'rejected':
        this.say(`Not allowed: ${e.reason}.`);
        break;
      default:
        break;
    }
  }

  private end(outcome: FightOutcome, text: string): void {
    this.outcome = outcome;
    this.say(text);
  }

  private leave(): void {
    if (!this.outcome) return;
    (this.scene.get('board') as BoardScene).fightOver(this.outcome);
  }

  // ---- drawing -------------------------------------------------------------------------------------------------------

  private flash(body: Phaser.GameObjects.Arc, damage: number, crit: boolean): void {
    this.tweens.add({ targets: body, alpha: 0.25, duration: 80, yoyo: true, repeat: 1 });
    const number = this.add
      .text(body.x + 40, body.y - 40, `-${damage}`, { fontFamily: FONT, fontSize: crit ? '30px' : '22px', fontStyle: 'bold', color: crit ? '#fff27a' : COLORS.text })
      .setOrigin(0.5);
    this.tweens.add({ targets: number, y: number.y - 50, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => number.destroy() });
  }

  private say(text: string): void {
    this.message.setText(text);
  }

  /** The potion button shows how many are left and hides when there are none. */
  private refreshPotion(): void {
    const n = this.game_.me.items.potion ?? 0;
    this.potionLabel.setText(n > 1 ? `Potion ×${n}` : 'Potion');
    this.potionButton.setVisible(n > 0);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    for (const b of this.buttons) b.setAlpha(busy ? 0.5 : 1);
  }

}
