// The fight screen (Robin, 2026-10-31: a turn-based RPG, fights on their own screen, one thumb). The enemy at the top,
// the character below, a message between. A round is two taps: what you do (Attack, an ability, Charge, a Potion,
// Flee), then how you take the blow (Block, Dodge, Brace, Counter). Each round is one intent; the events play back one
// at a time. The layout and the pacing are mine.

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, ITEMS, stats, type FightMove, type GameEvent, type Guard } from '../../../rules/src/index.ts';
import type { GameLog } from '../game-log.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, VIEW_HEIGHT } from '../layout.ts';
import type { LocalGame } from '../local-game.ts';
import { Bar, makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';

export interface FightSceneDeps {
  game: LocalGame;
  log: GameLog;
}

/** Where the buttons sit, in design pixels (the driver taps them here). Two rows of two, and a row for Flee or Back. */
export const FIGHT_BUTTONS = {
  a: { x: 110, y: 600, w: 180, h: 46 },
  b: { x: 302, y: 600, w: 180, h: 46 },
  c: { x: 110, y: 652, w: 180, h: 46 },
  d: { x: 302, y: 652, w: 180, h: 46 },
  e: { x: 110, y: 704, w: 180, h: 40 },
  f: { x: 302, y: 704, w: 180, h: 40 },
  continue: { x: 206, y: 652, w: 220, h: 56 },
} as const;

const STEP_MS = 450; // between two events of a round
const CENTRE = DESIGN_WIDTH / 2;
const BAR_W = 260;
const BAR_H = 18;

const ENEMY_COLORS: Record<string, number> = {
  mob: 0x9a8f7a,
  mini: 0xb0643a,
  boss: 0x8f2f3b,
};

const CLASS_COLORS: Record<string, number> = {
  warrior: 0xf2f2f2,
  rogue: 0xcfcfcf,
  mage: 0xd8c8ff,
  ranger: 0xc8f0c8,
};

export type FightOutcome = { type: 'won' | 'died' | 'fled'; summary: string };

interface Option {
  text: string;
  color: number;
  enabled: boolean;
  onTap: () => void;
}

export class FightScene extends Phaser.Scene {
  private readonly game_: LocalGame;
  private readonly log: GameLog;
  private enemyBody!: Phaser.GameObjects.Arc;
  private enemyBar!: Bar;
  private enemyStatus!: Phaser.GameObjects.Text;
  private heroBody!: Phaser.GameObjects.Arc;
  private heroBar!: Bar;
  private manaBar!: Bar;
  private heroStatus!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Container[] = [];
  private continueButton!: Phaser.GameObjects.Container;
  /** True while a round's events are being played back; the buttons wait. */
  private busy = false;
  private outcome: FightOutcome | null = null;
  /** The move chosen, waiting for its guard. */
  private pendingMove: FightMove | null = null;
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
    const s = stats(me);
    this.busy = false;
    this.outcome = null;
    this.pendingMove = null;
    this.enemyName = enemy.name;
    this.enemyMaxHp = enemy.maxHp;

    // The panel covers the band and takes every touch, so nothing reaches the board under it.
    this.add.rectangle(CENTRE, HUD_HEIGHT + VIEW_HEIGHT / 2, DESIGN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();

    this.add.text(CENTRE, 128, `${enemy.name} · level ${enemy.level}${enemy.role === 'boss' ? ' · boss' : enemy.role === 'mini' ? ' · mini-boss' : ''}`, { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: COLORS.text }).setOrigin(0.5);
    this.enemyBar = new Bar(this, CENTRE, 162, BAR_W, BAR_H, 0xd9534f);
    this.enemyBody = this.add.circle(CENTRE, 250, 56, ENEMY_COLORS[enemy.role] ?? 0x8f2f3b, 1).setStrokeStyle(4, 0x101318, 1);
    this.add.text(CENTRE, 250, enemy.name.charAt(0), { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
    this.enemyStatus = this.add.text(CENTRE, 318, '', { fontFamily: FONT, fontSize: '13px', color: '#f0a030', align: 'center' }).setOrigin(0.5, 0);

    this.message = this.add
      .text(CENTRE, 346, `${enemy.name} blocks the way!`, { fontFamily: FONT, fontSize: '16px', color: COLORS.text, align: 'center', wordWrap: { width: DESIGN_WIDTH - 50 } })
      .setOrigin(0.5, 0);

    this.heroBody = this.add.circle(CENTRE, 440, 26, CLASS_COLORS[me.classId] ?? 0xffffff, 1).setStrokeStyle(3, 0x101318, 1);
    this.add.text(CENTRE, 440, cls.name.charAt(0), { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
    this.heroBar = new Bar(this, CENTRE, 486, BAR_W, BAR_H, COLORS.button);
    this.manaBar = new Bar(this, CENTRE, 510, BAR_W, 14, COLORS.mana, 0, 'MP');
    this.heroStatus = this.add.text(CENTRE, 524, '', { fontFamily: FONT, fontSize: '13px', color: '#7fd8d8', align: 'center' }).setOrigin(0.5, 0);
    this.prompt = this.add.text(CENTRE, 566, '', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim }).setOrigin(0.5);

    this.continueButton = makeButton(this, FIGHT_BUTTONS.continue.x, FIGHT_BUTTONS.continue.y, FIGHT_BUTTONS.continue.w, FIGHT_BUTTONS.continue.h, 'Continue', COLORS.button, '22px', () => this.leave()).button;
    this.continueButton.setVisible(false);

    this.enemyBar.set(enemy.hp, enemy.maxHp, true);
    this.heroBar.set(me.hp, s.maxHp, true);
    this.manaBar.set(me.mana, s.maxMana, true);
    this.refreshStatus();
    this.showMoves();
    this.log.note(`fight: ${enemy.name} L${enemy.level} ${enemy.hp} hp, round ${fight.round}`);
  }

  // ---- the two taps of a round --------------------------------------------------------------------------------------

  /** The first row of choices: what you do. */
  private showMoves(): void {
    const me = this.game_.me;
    const potions = me.items.potion ?? 0;
    this.prompt.setText('Your move');
    this.setOptions([
      { text: 'Attack', color: COLORS.button, enabled: true, onTap: () => this.pick({ kind: 'attack' }) },
      { text: 'Abilities', color: 0x8e6ad9, enabled: Object.keys(me.abilities).length > 0, onTap: () => this.showAbilities() },
      { text: me.fight?.charged ? 'Charged' : 'Charge', color: 0xf0a030, enabled: !me.fight?.charged, onTap: () => this.pick({ kind: 'charge' }) },
      { text: potions > 1 ? `Potion ×${potions}` : 'Potion', color: 0x4aa3df, enabled: potions > 0, onTap: () => this.pick({ kind: 'item', item: 'potion' }) },
      { text: 'Flee', color: COLORS.log, enabled: true, onTap: () => this.pick({ kind: 'flee' }) },
    ]);
  }

  /** The known abilities with their mana costs; dimmed when mana is short. */
  private showAbilities(): void {
    const me = this.game_.me;
    this.prompt.setText('Which ability?');
    const options: Option[] = Object.entries(me.abilities).map(([id, rank]) => {
      const a = ABILITIES[id];
      return {
        text: `${a?.name ?? id} ${rank > 1 ? `R${rank} ` : ''}· ${a?.mana ?? 0} MP`,
        color: 0x8e6ad9,
        enabled: !!a && me.mana >= a.mana,
        onTap: () => this.pick({ kind: 'ability', ability: id }),
      };
    });
    options.push({ text: 'Back', color: COLORS.log, enabled: true, onTap: () => this.showMoves() });
    this.setOptions(options);
  }

  /** The move is chosen: now how to take the blow. */
  private pick(move: FightMove): void {
    this.pendingMove = move;
    this.prompt.setText('And when it strikes back?');
    this.setOptions([
      { text: 'Block (half)', color: COLORS.log, enabled: true, onTap: () => this.act('block') },
      { text: 'Dodge (luck)', color: COLORS.log, enabled: true, onTap: () => this.act('dodge') },
      { text: 'Brace (+mana)', color: COLORS.log, enabled: true, onTap: () => this.act('brace') },
      { text: 'Counter (hit back)', color: COLORS.log, enabled: true, onTap: () => this.act('counter') },
      { text: 'Back', color: COLORS.log, enabled: true, onTap: () => this.showMoves() },
    ]);
  }

  private act(guard: Guard): void {
    if (this.busy || this.outcome || !this.pendingMove) return;
    const move = this.pendingMove;
    this.pendingMove = null;
    this.setBusy(true);
    const events = this.game_.act({ type: 'fight', player: this.game_.player, move, guard });
    this.log.note(`fight ${move.kind}${'ability' in move ? ` ${move.ability}` : ''}/${guard}: ${events.map((e) => (e.type === 'hit' ? `${e.by} ${e.damage}` : e.type)).join(', ')}`);
    this.play(events, 0);
  }

  /** One event at a time, a beat apart, so a round reads as blows and not as a jump of the bars. */
  private play(events: GameEvent[], i: number): void {
    if (i >= events.length) {
      this.setBusy(false);
      this.refreshStatus();
      (this.scene.get('board') as BoardScene).refreshHud();
      if (this.outcome) {
        for (const b of this.buttons) b.setVisible(false);
        this.prompt.setText('');
        this.continueButton.setVisible(true);
      } else {
        this.showMoves();
      }
      return;
    }
    this.show(events[i]!);
    this.time.delayedCall(STEP_MS, () => this.play(events, i + 1));
  }

  private show(e: GameEvent): void {
    const me = this.game_.me;
    const s = stats(me);
    switch (e.type) {
      case 'hit':
        if (e.by === 'player') {
          this.flash(this.enemyBody, e.damage, e.crit);
          this.enemyBar.set(e.hp, this.enemyMaxHp);
          this.say(`${e.move}: ${e.damage} damage${e.crit ? ', a crit!' : '.'}`);
        } else {
          this.flash(this.heroBody, e.damage, e.crit);
          this.heroBar.set(e.hp, s.maxHp);
          this.say(`${e.move} hits you for ${e.damage}${e.absorbed ? ` (${e.absorbed} soaked)` : ''}${e.crit ? ', a crit!' : '.'}`);
        }
        break;
      case 'missed':
        this.say(e.by === 'enemy' ? `${e.move} misses!` : 'You miss.');
        break;
      case 'charged':
        this.say(e.by === 'player' ? 'You gather power: the next hit lands twice as hard.' : `${this.enemyName} winds up ${e.move}! Guard well.`);
        this.refreshStatus();
        break;
      case 'guarded':
        this.say({ block: 'You raise your guard.', dodge: 'You step aside…', brace: 'You brace.', counter: 'You wait for the opening…', none: '' }[e.guard]);
        break;
      case 'skipped':
        this.say(`${this.enemyName} is stunned and loses its turn.`);
        break;
      case 'effect':
        this.say(
          e.target === 'enemy'
            ? { stunned: `${this.enemyName} is stunned for ${e.rounds}.`, weakened: `${this.enemyName} is weakened for ${e.rounds} rounds.`, poison: `${this.enemyName} is poisoned for ${e.rounds} rounds.`, attackUp: '', barrier: '', evade: '' }[e.kind]
            : { attackUp: `Your hits land harder for ${e.rounds} rounds.`, barrier: `A barrier of ${e.rounds} forms round you.`, evade: `You slip into the shadows: the next ${e.rounds} blows miss.`, stunned: '', weakened: '', poison: '' }[e.kind],
        );
        this.refreshStatus();
        break;
      case 'poisoned':
        this.flash(this.enemyBody, e.damage, false);
        this.enemyBar.set(e.hp, this.enemyMaxHp);
        this.say(`The poison bites ${this.enemyName} for ${e.damage}.`);
        break;
      case 'countered':
        this.flash(this.enemyBody, e.damage, false);
        this.enemyBar.set(e.hp, this.enemyMaxHp);
        this.say(`You strike back for ${e.damage}.`);
        break;
      case 'mana':
        this.manaBar.set(e.mana, s.maxMana);
        if (e.delta > 0 && e.delta !== 2) this.say(`+${e.delta} mana.`);
        break;
      case 'used':
        this.say(`You drink a ${ITEMS[e.item]?.name ?? e.item}.`);
        break;
      case 'healed':
        this.heroBar.set(e.hp, s.maxHp);
        if (e.amount > 0) this.say(`You feel better: +${e.amount} HP.`);
        break;
      case 'fled':
        if (e.ok) this.end({ type: 'fled', summary: 'You got away.' }, 'You got away!');
        else this.say('No escape!');
        break;
      case 'won':
        this.end({ type: 'won', summary: `Beat the ${this.enemyName}: +${e.xp} xp, +${e.gold} gold.` }, `${this.enemyName} is beaten! +${e.xp} xp, +${e.gold} gold.`);
        break;
      case 'loot':
        this.say(`It drops ${e.gear.name} (${e.gear.rarity})!`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} ${e.gear.name} (${e.gear.rarity}).` };
        break;
      case 'found':
        this.say(`You find ${e.count > 1 ? `${e.count} ` : 'a '}${ITEMS[e.item]?.name ?? e.item}.`);
        break;
      case 'levelled':
        this.heroBar.set(me.hp, s.maxHp);
        this.manaBar.set(me.mana, s.maxMana);
        this.say(`Level ${e.level}! HP ${e.maxHp}, mana ${e.maxMana}, attack ${e.attack}, defense ${e.defense}.`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} Level ${e.level}!` };
        break;
      case 'bossDown':
        this.say(`${this.enemyName} falls. It will be back in five minutes.`);
        break;
      case 'opened': {
        const area = this.game_.state.board.areas[e.area];
        this.say(`The way to ${area?.name ?? e.area} is open!`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} ${area?.name ?? e.area} is open!` };
        break;
      }
      case 'died': {
        const town = this.game_.state.board.spaces[e.town]?.name ?? e.town;
        this.heroBar.set(0, s.maxHp);
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

  /** Up to six choices in the rows a, b, c, d, e, f; the rest of the rows stay empty. */
  private setOptions(options: Option[]): void {
    for (const b of this.buttons) b.destroy();
    this.buttons = [];
    const slots = [FIGHT_BUTTONS.a, FIGHT_BUTTONS.b, FIGHT_BUTTONS.c, FIGHT_BUTTONS.d, FIGHT_BUTTONS.e, FIGHT_BUTTONS.f];
    options.slice(0, slots.length).forEach((o, i) => {
      const slot = slots[i]!;
      const { button } = makeButton(this, slot.x, slot.y, slot.w, slot.h, o.text, o.color, '16px', () => {
        if (o.enabled && !this.busy) o.onTap();
      });
      if (!o.enabled) button.setAlpha(0.4);
      this.buttons.push(button);
    });
  }

  /** What is on each side: wind-ups, stuns, poison, weakening; charges, buffs, barriers, evasion. */
  private refreshStatus(): void {
    const f = this.game_.me.fight;
    if (!f) {
      this.enemyStatus.setText('');
      this.heroStatus.setText('');
      return;
    }
    const e = f.enemy;
    const enemyBits = [
      e.charged ? `winding up ${e.charged}!` : '',
      e.stunned ? `stunned ${e.stunned}` : '',
      e.poison ? `poisoned ${e.poison.rounds}` : '',
      e.weakened ? `weakened ${e.weakened.rounds}` : '',
    ].filter(Boolean);
    this.enemyStatus.setText(enemyBits.join(' · '));
    const heroBits = [f.charged ? 'charged' : '', f.attackUp ? `hits harder ${f.attackUp.rounds}` : '', f.barrier ? `barrier ${f.barrier}` : '', f.evade ? `evading ${f.evade}` : ''].filter(Boolean);
    this.heroStatus.setText(heroBits.join(' · '));
  }

  private flash(body: Phaser.GameObjects.Arc, damage: number, crit: boolean): void {
    this.tweens.add({ targets: body, alpha: 0.25, duration: 80, yoyo: true, repeat: 1 });
    const number = this.add
      .text(body.x + 40, body.y - 40, `-${damage}`, { fontFamily: FONT, fontSize: crit ? '30px' : '22px', fontStyle: 'bold', color: crit ? '#fff27a' : COLORS.text })
      .setOrigin(0.5);
    this.tweens.add({ targets: number, y: number.y - 50, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => number.destroy() });
  }

  private say(text: string): void {
    if (text) this.message.setText(text);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    for (const b of this.buttons) b.setAlpha(busy ? 0.4 : b.alpha);
  }
}
