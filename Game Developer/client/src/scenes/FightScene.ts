// The fight screen (Robin, 2026-10-31: a turn-based RPG, fights on their own screen, one thumb), side on since chapter 1
// step 4 (2026-11-01): the area's layered backdrop, the hero at the left at 150 CSS px with his feet on the ground, the
// enemy at the right at its size (the Art Director's figure when it has one, a circle until then), the bars over each
// figure, the enemy's tell over its bar, the words and the buttons on a dark strip under the ground. A round is two
// taps: what you do (Attack, an ability, Charge, a Potion, Flee), then how you take the blow (Block, Dodge, Brace,
// Counter). Each round is one intent; the events play back one at a time, a blow landing on its clip's frame. The
// layout and the pacing are mine; the backdrop's measures are Mitch, AD's (assets/meadow_fight/NOTES.md).

import Phaser from 'phaser';
import { ABILITIES, CLASS_DATA, ITEMS, PROGRESSION, powers, stats, type Enemy, type FightMove, type GameEvent, type Guard } from '../../../rules/src/index.ts';
import { Backdrop } from '../backdrop.ts';
import { creatureReady, Figure } from '../creatures.ts';
import type { GameLog } from '../game-log.ts';
import { sfx } from '../feel.ts';
import { Hero, HERO_FIGHT_SCALE, heroReady } from '../hero.ts';
import { INK, INK_DIM, kitReady, plate } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { gearIn, type Prize } from '../loot.ts';
import { settings } from '../settings.ts';
import { tips } from '../tips.ts';
import { Bar, makeButton } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';
import { moments } from './MomentScene.ts';

export interface FightSceneDeps {
  game: GameHolder;
  log: GameLog;
}

/** The fight's layout, in design pixels (mine, 2026-11-01): the ground line, where the figures stand, the strip of words and buttons. */
export const FIGHT_LAYOUT = {
  groundY: 540,
  /** The soil runs to here; the dark strip with the words and the buttons begins. */
  stripY: 720,
  heroX: 112,
  enemyX: 300,
  titleY: 122,
  historyY: 148,
  messageY: 736,
  promptY: 770,
  barW: 150,
} as const;

/** Where the buttons sit, in design pixels (the driver taps them here). Two rows of two, and a row for Flee or Back. */
export const FIGHT_BUTTONS = {
  a: { x: 110, y: 800, w: 180, h: 38 },
  b: { x: 302, y: 800, w: 180, h: 38 },
  c: { x: 110, y: 842, w: 180, h: 38 },
  d: { x: 302, y: 842, w: 180, h: 38 },
  e: { x: 110, y: 884, w: 180, h: 36 },
  f: { x: 302, y: 884, w: 180, h: 36 },
  continue: { x: 206, y: 842, w: 220, h: 56 },
} as const;

const STEP_MS = 450; // between two events of a round
/** The first fight's line, said once (tips.ts). */
const TIP_FIGHT = 'Pick a move, then a guard. The orange line says what comes next.';
const CENTRE = DESIGN_WIDTH / 2;
const BAR_H = 16;

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

/** How a fight ended, for the board: the words for the message line, the gear it dropped (shown by the loot reveal), who dropped it. */
export type FightOutcome = { type: 'won' | 'died' | 'fled'; summary: string; loot: Prize[]; enemy: string };

interface Option {
  text: string;
  color: number;
  enabled: boolean;
  onTap: () => void;
}

type Body = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

export class FightScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  private backdrop: Backdrop | null = null;
  private enemyBody!: Body;
  /** The enemy drawn from the Art Director's atlas when it has one. */
  private enemy: Figure | null = null;
  private enemyBar!: Bar;
  private enemyStatus!: Phaser.GameObjects.Text;
  private heroBody!: Body;
  /** The hero drawn from the atlas when a set is loaded. */
  private hero: Hero | null = null;
  private heroBar!: Bar;
  private manaBar!: Bar;
  private heroStatus!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  /** The two lines before the message, dimmer, under the title: a round reads as a short log (mine, 2026-11-01). */
  private history!: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Container[] = [];
  private continueButton!: Phaser.GameObjects.Container;
  /** True while a round's events are being played back; the buttons wait. */
  private busy = false;
  private outcome: FightOutcome | null = null;
  /** The move chosen, waiting for its guard. */
  private pendingMove: FightMove | null = null;
  private enemyName = '';
  private enemyId = '';
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
    const L = FIGHT_LAYOUT;
    this.busy = false;
    this.outcome = null;
    this.pendingMove = null;
    this.enemy = null;
    this.hero = null;
    this.enemyName = enemy.name;
    this.enemyId = enemy.id;
    this.enemyMaxHp = enemy.maxHp;

    // The screen covers the band and the HUD's strip and takes every touch, so nothing reaches the board under it.
    this.add.rectangle(CENTRE, (HUD_HEIGHT + DESIGN_WIDTH * 0 + 915) / 2, DESIGN_WIDTH, 915 - HUD_HEIGHT, 0x151826, 1).setInteractive();
    const board = this.game_.state.board;
    const theme = board.areas[board.spaces[fight.space]?.area ?? '']?.theme ?? board.areas[board.spaces[me.space]?.area ?? '']?.theme ?? 'meadow';
    this.backdrop = new Backdrop(this, theme, L.groundY, L.stripY);
    const kit = kitReady(this);
    if (kit) {
      plate(this, 'panel_bottom', CENTRE, (L.stripY + 915) / 2, DESIGN_WIDTH, 915 - L.stripY);
      plate(this, 'panel_message', CENTRE, L.messageY + 20, 380, 50);
    }
    const feetY = this.backdrop.feetY;

    this.add.text(CENTRE, L.titleY, `${enemy.name} · level ${enemy.level}${fight.shared ? ' · world boss' : enemy.role === 'boss' ? ' · boss' : enemy.role === 'mini' ? ' · mini-boss' : ''}`, { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#1a2030', strokeThickness: 4 }).setOrigin(0.5);
    this.lines = [];
    this.history = this.add.text(CENTRE, L.historyY, '', { fontFamily: FONT, fontSize: '12px', color: '#e8eef6', stroke: '#1a2030', strokeThickness: 3, align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5, 0);

    // The contact shadows, then the figures, so they stand on the ground.
    this.add.ellipse(L.heroX, feetY, 64, 16, 0x000000, 0.22);
    const enemyArt = creatureReady(this, enemy.id);
    let enemyTop: number;
    if (enemyArt) {
      this.enemy = new Figure(this, enemy.id, L.enemyX, feetY);
      if (enemy.phase === 2) this.enemy.setPhase(2);
      const shadow = this.enemy.shadow();
      this.add.ellipse(L.enemyX + shadow.dx, feetY, shadow.width, Math.max(14, shadow.width * 0.16), 0x000000, 0.22);
      this.enemy.sprite.setDepth(1);
      this.enemyBody = this.enemy.sprite;
      enemyTop = feetY - this.enemy.headHeight();
    } else {
      this.add.ellipse(L.enemyX, feetY, 110, 20, 0x000000, 0.22);
      this.enemyBody = this.add.circle(L.enemyX, feetY - 56, 56, ENEMY_COLORS[enemy.role] ?? 0x8f2f3b, 1).setStrokeStyle(4, 0x101318, 1);
      this.add.text(L.enemyX, feetY - 56, enemy.name.charAt(0), { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
      enemyTop = feetY - 112;
    }
    this.enemyBar = new Bar(this, L.enemyX, enemyTop - 26, L.barW, BAR_H, 0xd9534f);
    this.enemyStatus = this.add.text(L.enemyX, enemyTop - 48, '', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#ffb347', stroke: '#1a2030', strokeThickness: 3, align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5, 1);

    let heroTop: number;
    if (heroReady(this)) {
      this.hero = new Hero(this, me, L.heroX, feetY, HERO_FIGHT_SCALE);
      this.hero.face(true);
      this.heroBody = this.hero.root;
      heroTop = feetY - 150;
    } else {
      this.heroBody = this.add.circle(L.heroX, feetY - 26, 26, CLASS_COLORS[me.classId] ?? 0xffffff, 1).setStrokeStyle(3, 0x101318, 1);
      this.add.text(L.heroX, feetY - 26, cls.name.charAt(0), { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
      heroTop = feetY - 52;
    }
    this.heroBar = new Bar(this, L.heroX, heroTop - 26, L.barW, BAR_H, COLORS.button);
    this.manaBar = new Bar(this, L.heroX, heroTop - 44, L.barW, 12, COLORS.mana, 0, 'MP');
    this.heroStatus = this.add.text(L.heroX, heroTop - 56, '', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#7fe0e0', stroke: '#1a2030', strokeThickness: 3, align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5, 1);

    this.message = this.add
      .text(CENTRE, L.messageY, fight.shared ? 'A world boss: all who land here fight the same beast and share the reward.' : `${enemy.name} blocks the way!${tips.take('fight') ? ` ${TIP_FIGHT}` : ''}`, { fontFamily: FONT, fontSize: settings.font(14), color: kit ? INK : COLORS.text, align: 'center', wordWrap: { width: 350 } })
      .setOrigin(0.5, 0);
    this.prompt = this.add.text(CENTRE, L.promptY, '', { fontFamily: FONT, fontSize: '12px', color: kit ? INK_DIM : COLORS.dim }).setOrigin(0.5);

    this.continueButton = makeButton(this, FIGHT_BUTTONS.continue.x, FIGHT_BUTTONS.continue.y, FIGHT_BUTTONS.continue.w, FIGHT_BUTTONS.continue.h, 'Continue', COLORS.button, '22px', () => this.leave()).button;
    this.continueButton.setVisible(false);

    this.enemyBar.set(enemy.hp, enemy.maxHp, true);
    this.heroBar.set(me.hp, s.maxHp, true);
    this.manaBar.set(me.mana, s.maxMana, true);
    this.refreshStatus();
    this.showMoves();
    sfx.play('fight/begin');
    this.log.note(`fight: ${enemy.name} L${enemy.level} ${enemy.hp} hp, round ${fight.round}; backdrop ${theme}, figure ${enemyArt ? enemy.id : 'circle'}`);
  }

  override update(_time: number, delta: number): void {
    this.backdrop?.update(delta);
    this.hero?.update(delta);
  }

  // ---- the two taps of a round --------------------------------------------------------------------------------------

  /** The first row of choices: what you do. */
  private showMoves(): void {
    const me = this.game_.me;
    const potions = me.items.potion ?? 0;
    const manaPotions = me.items['mana-potion'] ?? 0;
    this.prompt.setText(`Round ${me.fight?.round ?? 1} · your move`);
    this.setOptions([
      { text: 'Attack', color: COLORS.button, enabled: true, onTap: () => this.pick({ kind: 'attack' }) },
      { text: 'Abilities', color: 0x8e6ad9, enabled: Object.keys(me.abilities).length > 0, onTap: () => this.showAbilities() },
      { text: me.fight?.charged ? 'Charged' : 'Charge', color: 0xf0a030, enabled: !me.fight?.charged, onTap: () => this.pick({ kind: 'charge' }) },
      { text: potions > 1 ? `${ITEMS.potion!.name} ×${potions}` : ITEMS.potion!.name, color: 0x4aa3df, enabled: potions > 0, onTap: () => this.pick({ kind: 'item', item: 'potion' }) },
      { text: 'Flee', color: COLORS.log, enabled: true, onTap: () => this.pick({ kind: 'flee' }) },
      { text: manaPotions > 1 ? `${ITEMS['mana-potion']!.name} ×${manaPotions}` : ITEMS['mana-potion']!.name, color: 0x3a7fbf, enabled: manaPotions > 0, onTap: () => this.pick({ kind: 'item', item: 'mana-potion' }) },
    ]);
  }

  /** The known abilities with their mana costs; dimmed when mana is short. */
  private showAbilities(): void {
    const me = this.game_.me;
    this.prompt.setText('Which ability?');
    const f = me.fight;
    const meterName = CLASS_DATA[me.classId].meter?.name ?? 'meter';
    const arcane = powers(me).arcane;
    const options: Option[] = Object.entries(me.abilities).map(([id, rank]) => {
      const a = ABILITIES[id];
      const mana = a ? (arcane ? Math.ceil(a.mana * arcane) : a.mana) : 0;
      const cost = a?.meterAll ? `all ${meterName}` : a?.meter ? `${a.meter} ${meterName}` : '';
      const used = !!a?.oncePerFight && !!f?.used?.includes(id);
      const meterOk = !a?.meter || (f?.meter ?? 0) >= a.meter;
      const meterAllOk = !a?.meterAll || (f?.meter ?? 0) > 0;
      return {
        text: `${a?.name ?? id}${rank > 1 ? ` R${rank}` : ''} · ${mana} MP${cost ? ` · ${cost}` : ''}${used ? ' · used' : ''}`,
        color: 0x8e6ad9,
        enabled: !!a && me.mana >= mana && meterOk && meterAllOk && !used,
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
    sfx.play(move.kind === 'ability' ? `fight/ability-${move.ability}` : move.kind === 'attack' ? 'fight/swing' : move.kind === 'charge' ? 'fight/charge' : move.kind === 'flee' ? 'fight/flee' : `fight/${move.item === 'mana-potion' ? 'mana-potion' : 'potion'}`);
    this.game_.act({ type: 'fight', player: this.game_.player, move, guard }).then(
      (events) => {
        this.log.note(`fight ${move.kind}${'ability' in move ? ` ${move.ability}` : ''}/${guard}: ${events.map((e) => (e.type === 'hit' ? `${e.by} ${e.damage}` : e.type)).join(', ')}`);
        this.play(events, 0);
      },
      (e: unknown) => {
        // The world did not answer: the round was not fought. Back to the moves; the next tap tries again.
        this.log.error(`fight action failed: ${String(e)}`);
        this.setBusy(false);
        this.say('No answer from the world. Try again.');
        this.showMoves();
      },
    );
  }

  /**
   * The state changed under the fight: others hit the world boss, someone brought it down and this player was paid, or a
   * reconnect brought a snapshot. The bars and the lines follow it; a fight that ended elsewhere ends here too.
   */
  refreshFromState(events: GameEvent[] = []): void {
    const me = this.game_.me;
    if (!me.fight) {
      if (this.outcome) return;
      const down = events.find((e) => e.type === 'worldBossDown');
      const share = down?.type === 'worldBossDown' ? down.shares.find((x) => x.player === this.game_.player) : undefined;
      if (share) this.end({ type: 'won', loot: [], enemy: this.enemyName, summary: `The ${this.enemyName} fell to all of you. Your share: +${share.xp} xp, +${share.gold} gold.` }, `${this.enemyName} falls! Your share: +${share.xp} xp, +${share.gold} gold.`);
      else this.end({ type: 'fled', loot: [], enemy: this.enemyName, summary: 'The fight is over.' }, events.some((e) => e.type === 'bossLeft') ? `${this.enemyName} is gone.` : 'The fight is over.');
      if (!this.busy) this.play([], 0);
      return;
    }
    const s = stats(me);
    const hp = me.fight.shared ? (this.game_.state.spawns[me.fight.space]?.hp ?? me.fight.enemy.hp) : me.fight.enemy.hp;
    this.enemyBar.set(Math.min(hp, me.fight.enemy.hp), this.enemyMaxHp, true);
    this.heroBar.set(me.hp, s.maxHp, true);
    this.manaBar.set(me.mana, s.maxMana, true);
    this.refreshStatus();
  }

  /** One event at a time, a beat apart, so a round reads as blows and not as a jump of the bars. */
  private play(events: GameEvent[], i: number): void {
    if (i >= events.length) {
      this.setBusy(false);
      this.refreshStatus();
      (this.scene.get('board') as BoardScene).refreshHud();
      // A fight that ended without a win, a fall or an escape (a world boss gone): over all the same.
      if (!this.outcome && !this.game_.me.fight) this.end({ type: 'fled', loot: [], enemy: this.enemyName, summary: 'The fight is over.' }, this.message.text || 'The fight is over.');
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
          // The hero swings; the blow lands on his clip's frame, and the enemy takes it then.
          this.hero?.play('attack1');
          this.after(this.hero?.blowMs() ?? 0, () => {
            this.enemy?.play('hit1');
            sfx.play(e.crit ? 'fight/crit' : e.damage >= this.enemyMaxHp * 0.15 ? 'fight/hit-heavy' : 'fight/hit-light');
            sfx.play(`creature/${this.enemyId}/hit`);
            this.flash(this.enemyBody, e.damage, e.crit);
            this.enemyBar.set(e.hp, this.enemyMaxHp);
          });
          this.say(`${e.move}: ${e.damage} damage${e.crit ? ', a crit!' : '.'}`);
        } else {
          this.enemy?.play('attack1');
          sfx.play(`creature/${this.enemyId}/attack`);
          this.after(this.enemy?.blowMs() ?? 0, () => {
            this.hero?.play('hit1');
            sfx.play(e.crit || e.damage >= s.maxHp * 0.15 ? 'fight/enemy-hit-heavy' : 'fight/enemy-hit-light');
            this.flash(this.heroBody, e.damage, e.crit);
            this.heroBar.set(e.hp, s.maxHp);
          });
          this.say(`${e.move} hits you for ${e.damage}${e.absorbed ? ` (${e.absorbed} soaked)` : ''}${e.crit ? ', a crit!' : '.'}`);
        }
        break;
      case 'missed':
        if (e.by === 'enemy') {
          this.enemy?.play('attack1');
          sfx.play(`creature/${this.enemyId}/attack`);
          this.hero?.play('stand');
        } else this.hero?.play('attack1');
        sfx.play('fight/miss');
        this.say(e.by === 'enemy' ? `${e.move} misses!` : 'You miss.');
        break;
      case 'charged':
        if (e.by === 'enemy') sfx.play('fight/enemy-windup');
        this.say(e.by === 'player' ? 'You gather power: the next hit lands twice as hard.' : `${this.enemyName} winds up ${e.move}! Guard well.`);
        this.refreshStatus();
        break;
      case 'guarded':
        if (e.guard === 'block' || e.guard === 'brace' || e.guard === 'counter') this.hero?.play('defend', true);
        if (e.guard !== 'none') sfx.play(`fight/guard-${e.guard}`);
        this.say({ block: 'You raise your guard.', dodge: 'You step aside…', brace: 'You brace.', counter: 'You wait for the opening…', none: '' }[e.guard]);
        break;
      case 'skipped':
        this.say({ stunned: `${this.enemyName} is stunned and loses its turn.`, warped: `Time bends: ${this.enemyName} loses its turn.`, trapped: `${this.enemyName} springs your trap and loses its turn!` }[e.reason]);
        break;
      case 'resisted':
        this.say(e.kind === 'crit' ? 'Ironbrow turns the crit aside: only a hit.' : e.kind === 'stunned' ? `${this.enemyName} shrugs it off.` : 'Ironbrow shrugs it off.');
        break;
      case 'effect':
        sfx.play(`fight/effect-${e.kind}`);
        this.say(this.effectText(e.target, e.kind, e.rounds));
        this.refreshStatus();
        break;
      case 'poisoned':
        sfx.play('fight/effect-poison-tick');
        if (e.target === 'enemy') {
          this.flash(this.enemyBody, e.damage, false);
          this.enemyBar.set(e.hp, this.enemyMaxHp);
          this.say(`The poison bites ${this.enemyName} for ${e.damage}.`);
        } else {
          this.flash(this.heroBody, e.damage, false);
          this.heroBar.set(e.hp, s.maxHp);
          this.say(`The poison bites you for ${e.damage}.`);
        }
        break;
      case 'intent':
        this.refreshStatus();
        break;
      case 'phase':
        this.enemy?.setPhase(2);
        sfx.play('fight/phase');
        sfx.play(`creature/${this.enemyId}/surge`);
        this.say(e.text);
        this.refreshStatus();
        break;
      case 'meter':
        sfx.play('fight/meter-pip');
        this.refreshStatus();
        break;
      case 'stolen':
        this.say(`You lift ${e.gold} gold from its purse.`);
        break;
      case 'enemyHealed':
        this.enemyBar.set(e.hp, this.enemyMaxHp);
        this.say(`${this.enemyName} heals ${e.amount}.`);
        break;
      case 'drained':
        sfx.play('fight/effect-drained');
        this.manaBar.set(e.left, s.maxMana);
        this.say(`${this.enemyName} drinks ${e.mana} mana from you.`);
        break;
      case 'revived':
        sfx.play('fight/revive');
        this.heroBar.set(e.hp, s.maxHp);
        this.say(e.by === 'phoenix' ? `The Phoenix Feather burns: you rise with ${e.hp} HP!` : `The Phoenix Helm pulls you back to ${e.hp} HP.`);
        break;
      case 'countered':
        this.hero?.play('attack1');
        this.after(this.hero?.blowMs() ?? 0, () => {
          this.enemy?.play('hit1');
          sfx.play('fight/hit-light');
          sfx.play(`creature/${this.enemyId}/hit`);
          this.flash(this.enemyBody, e.damage, false);
          this.enemyBar.set(e.hp, this.enemyMaxHp);
        });
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
        if (e.amount > 0) {
          sfx.play('fight/heal');
          this.say(`You feel better: +${e.amount} HP.`);
        }
        break;
      case 'fled':
        if (e.ok) this.end({ type: 'fled', loot: [], enemy: this.enemyName, summary: 'You got away.' }, 'You got away!');
        else {
          sfx.play('fight/caught');
          this.say('No escape!');
        }
        break;
      case 'won': {
        this.hero?.play('stand');
        this.enemy?.play('die1');
        sfx.play(`creature/${this.enemyId}/die`);
        sfx.play('fight/victory');
        const tip = tips.take('won');
        this.end({ type: 'won', loot: [], enemy: this.enemyName, summary: `Beat the ${this.enemyName}: +${e.xp} xp, +${e.gold} gold.${tip ? ` ${tip}` : ''}` }, `${this.enemyName} is beaten! +${e.xp} xp, +${e.gold} gold.`);
        break;
      }
      case 'loot':
        // The drop is told here and shown by the loot reveal once the fight closes (chapter 1, step 2).
        sfx.play('fight/drop');
        this.say(`It drops ${e.gear.name} (${e.gear.rarity})!`);
        if (this.outcome) this.outcome = { ...this.outcome, loot: [...this.outcome.loot, ...gearIn([e])] };
        break;
      case 'bagFull':
        if (this.outcome) this.outcome = { ...this.outcome, loot: this.outcome.loot.map((p) => (p.kind === 'gear' && p.gear.id === e.gear.id ? { ...p, sold: e.sold } : p)) };
        break;
      case 'found':
        this.say(`You find ${e.count > 1 ? `${e.count} ` : 'a '}${ITEMS[e.item]?.name ?? e.item}.`);
        break;
      case 'levelled':
        this.heroBar.set(me.hp, s.maxHp);
        this.manaBar.set(me.mana, s.maxMana);
        this.say(`Level ${e.level}! HP ${e.maxHp}, mana ${e.maxMana}, attack ${e.attack}, defense ${e.defense}.`);
        moments(this)?.levelUp(e.level, `HP ${e.maxHp} · mana ${e.maxMana} · attack ${e.attack} · defense ${e.defense}`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} Level ${e.level}!` };
        break;
      case 'bossDown':
        this.say(`${this.enemyName} falls. It will be back in five minutes.`);
        moments(this)?.bossDown(this.enemyName);
        break;
      case 'worldBossDown':
        this.enemy?.play('die1');
        this.say(`${this.enemyName} falls to all of you! ${e.shares.length === 1 ? 'The reward is yours alone.' : `${e.shares.length} fighters share the reward.`}`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} ${e.shares.length === 1 ? 'Fought alone.' : `Shared by ${e.shares.length}.`}` };
        break;
      case 'nothing':
        this.say(e.text);
        break;
      case 'opened': {
        const area = this.game_.state.board.areas[e.area];
        this.say(`The way to ${area?.name ?? e.area} is open!`);
        moments(this)?.opened(area?.name ?? e.area);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} ${area?.name ?? e.area} is open!` };
        break;
      }
      case 'died': {
        this.hero?.play('die1');
        sfx.play('fight/defeat');
        const town = this.game_.state.board.spaces[e.town]?.name ?? e.town;
        this.heroBar.set(0, s.maxHp);
        this.end({ type: 'died', loot: [], enemy: this.enemyName, summary: `You wake in ${town} with ${e.lostGold} gold less.` }, `You fall. You wake in ${town}, ${e.lostGold} gold lighter.`);
        break;
      }
      case 'rejected':
        this.say(`Not allowed: ${e.reason}.`);
        break;
      default:
        break;
    }
  }

  /** Something that waits for a blow to land on its frame; at once with fewer effects. */
  private after(ms: number, what: () => void): void {
    if (ms <= 0 || !settings.ms(1)) what();
    else this.time.delayedCall(ms, () => {
      if (this.scene.isActive()) what();
    });
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
        else sfx.play('ui/tap-denied');
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
      this.intentText(e),
      e.stunned ? `stunned ${e.stunned}` : '',
      e.poison ? `poisoned ${e.poison.rounds}` : '',
      e.weakened ? `weakened ${e.weakened.rounds}` : '',
      e.armoured ? `hardened ${e.armoured.rounds}` : '',
      e.evade ? 'fading' : '',
      e.phase === 2 ? 'raging' : '',
    ].filter(Boolean);
    this.enemyStatus.setText(enemyBits.join(' · '));
    // A wind-up held: the enemy reddens until it lands.
    if (this.enemyBody instanceof Phaser.GameObjects.Arc) {
      if (e.charged) this.enemyBody.setStrokeStyle(8, 0xff5a4a, 1);
      else this.enemyBody.setStrokeStyle(4, 0x101318, 1);
    } else if (this.enemyBody instanceof Phaser.GameObjects.Sprite) {
      if (e.charged) this.enemyBody.setTint(0xffb0a0);
      else this.enemyBody.clearTint();
    }
    const meter = CLASS_DATA[this.game_.me.classId].meter;
    const heroBits = [
      meter ? `${meter.name} ${'●'.repeat(f.meter ?? 0)}${'○'.repeat(Math.max(0, PROGRESSION.meterMax - (f.meter ?? 0)))}` : '',
      f.charged ? 'charged' : '',
      f.attackUp ? `hits harder ${f.attackUp.rounds}` : '',
      f.barrier ? `barrier ${f.barrier}` : '',
      f.evade ? `evading ${f.evade}` : '',
      f.sureCrit ? `sure crit ${f.sureCrit}` : '',
      f.mark ? `marked ${f.mark.hits}` : '',
      f.companion ? `${f.companion.name.toLowerCase()} ${f.companion.rounds}` : '',
      f.windup ? `${f.windup.name.toLowerCase()} in ${f.windup.rounds}` : '',
      f.trap ? 'trap set' : '',
      f.skip ? `time bent ${f.skip}` : '',
      f.poisoned ? `poisoned ${f.poisoned.rounds}` : '',
      f.weak ? `weakened ${f.weak.rounds}` : '',
    ].filter(Boolean);
    this.heroStatus.setText(heroBits.join(' · '));
  }

  /** What the enemy will do next, from its intent: the thing to pick a guard for (mine, 2026-11-01). */
  private intentText(e: Enemy): string {
    if (e.charged) return `next: ${e.charged} lands, hard. Block it!`;
    const mv = e.next;
    if (!mv) return '';
    if (mv.charge) return `next: it winds up ${mv.name}`;
    const effect = mv.effect ? { poison: 'poison', drain: 'drains mana', armour: 'hardens', evade: 'fades', heal: 'heals', weaken: 'weakens you' }[mv.effect] : '';
    return `next: ${mv.name}${effect ? ` (${effect})` : ''}`;
  }

  private effectText(target: 'player' | 'enemy', kind: string, rounds: number): string {
    const n = this.enemyName;
    if (target === 'enemy') {
      switch (kind) {
        case 'stunned': return `${n} is stunned for ${rounds}.`;
        case 'weakened': return `${n} is weakened for ${rounds} ${rounds === 1 ? 'round' : 'rounds'}.`;
        case 'poison': return `${n} is poisoned for ${rounds} rounds.`;
        case 'armoured': return `${n} hardens: its hide is thicker for ${rounds} rounds.`;
        case 'evade': return `${n} fades: your next hit will miss.`;
        case 'mark': return `${n} is marked: your next ${rounds} hits land harder.`;
        case 'trap': return 'A trap is set: its next wind-up will fail.';
        case 'skip': return `Time bends round ${n}: it loses ${rounds} ${rounds === 1 ? 'turn' : 'turns'}.`;
        default: return '';
      }
    }
    switch (kind) {
      case 'attackUp': return `Your hits land harder for ${rounds} rounds.`;
      case 'barrier': return `A barrier of ${rounds} forms round you.`;
      case 'evade': return `You slip into the shadows: the next ${rounds} ${rounds === 1 ? 'blow misses' : 'blows miss'}.`;
      case 'sureCrit': return `Your next ${rounds === 1 ? 'hit is a sure crit' : `${rounds} hits are sure crits`}.`;
      case 'companion': return `Your hawk takes wing: it strikes at the end of every round for ${rounds} rounds.`;
      case 'windup': return `A meteor is called: it lands in ${rounds} rounds, whatever you do.`;
      case 'poison': return `You are poisoned for ${rounds} rounds.`;
      case 'weakened': return `You are weakened for ${rounds} rounds: your hits land softer.`;
      default: return '';
    }
  }

  /** A blow landing: the figure blinks, the number floats up from its chest, a crit shakes the camera a little. */
  private flash(body: Body, damage: number, crit: boolean): void {
    const quick = !settings.ms(1);
    if (!quick) this.tweens.add({ targets: body, alpha: 0.25, duration: 80, yoyo: true, repeat: 1 });
    if (crit && !quick) this.cameras.main.shake(120, 0.004);
    const top = body instanceof Phaser.GameObjects.Arc ? body.y - 40 : body.y - body.displayHeight * 0.75;
    const number = this.add
      .text(body.x + 30, top, `-${damage}`, { fontFamily: FONT, fontSize: crit ? '32px' : '24px', fontStyle: 'bold', color: crit ? '#fff27a' : '#ffffff', stroke: '#1a2030', strokeThickness: 4 })
      .setOrigin(0.5);
    this.tweens.add({ targets: number, y: top - 50, alpha: 0, duration: settings.ms(700) || 1, ease: 'Quad.easeOut', onComplete: () => number.destroy() });
  }

  private say(text: string): void {
    if (!text) return;
    const last = this.message.text;
    if (last && last !== text) {
      this.lines = [...this.lines, last].slice(-2);
      this.history.setText(this.lines.join('\n'));
    }
    this.message.setText(text);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    for (const b of this.buttons) b.setAlpha(busy ? 0.4 : b.alpha);
  }
}
