// The fight screen (Robin, 2026-10-31: a turn-based RPG, fights on their own screen, one thumb), side on since chapter 1
// step 4 (2026-11-01): the area's layered backdrop, the hero at the left at 150 CSS px with his feet on the ground, the
// enemy at the right at its size (the Art Director's figure when it has one, a circle until then), the bars over each
// figure, the enemy's tell over its bar, the words and the buttons on a dark strip under the ground. A round is two
// taps: what you do (Attack, an ability, Charge, a Potion, Flee), then how you take the blow (Block, Dodge, Brace,
// Counter). Each round is one intent; the events play back one at a time, a blow landing on its clip's frame. The
// layout and the pacing are mine; the backdrop's measures are Mitch, AD's (assets/meadow_fight/NOTES.md).

import Phaser from 'phaser';
import talentSounds from '../../../assets/sound/talents/talent-map.json';
import { ABILITIES, manaCost, gearKind, CLASS_DATA, ITEMS, PROGRESSION, powers, stats, type Enemy, type FightMove, type GameEvent, type Guard, traitsOf, ARENA, holdsFor, needsWords, isNight } from '../../../rules/src/index.ts';
import type { ClassId } from '../../../rules/src/index.ts';
import { Backdrop, preloadBackdrop } from '../backdrop.ts';
import { creatureReady, Figure, preloadCreature } from '../creatures.ts';
import type { GameLog } from '../game-log.ts';
import { abilityIcon, behind, fly, freeTalentIconsAfter, HeldEffects, Owl, playOnce, preloadCarriedIcons, preloadEffects } from '../effects.ts';
import { sfx } from '../feel.ts';
import { Hero, HERO_FIGHT_SCALE, heroReady } from '../hero.ts';
import { INK, kitReady, plate, GUIDE_ICON } from '../kit.ts';
import { COLORS, DESIGN_WIDTH, FONT, HUD_HEIGHT, FONT_DISPLAY, SCREEN_WIDTH, HUD_PLANK } from '../layout.ts';
import type { GameHolder } from '../game-holder.ts';
import { gearIn, type Prize } from '../loot.ts';
import { rememberMessage } from '../messages.ts';
import { settings } from '../settings.ts';
import { tips } from '../tips.ts';
import { ENEMY_BOARD, FightBoard, HERO_BOARD } from '../fightboard.ts';
import { Bar, logButtons, makeButton, MESSAGE_BOX_W } from '../ui.ts';
import type { BoardScene } from './BoardScene.ts';
import { moments } from './MomentScene.ts';

export interface FightSceneDeps {
  game: GameHolder;
  log: GameLog;
}

/** The fight's layout, in design pixels (mine, 2026-11-01): the ground line, where the figures stand, the strip of words and buttons. */
export const FIGHT_LAYOUT = {
  groundY: 490,
  /** The soil runs to here; the dark strip with the words and the buttons begins. */
  stripY: 640,
  // Robin, 2026-11-01: "in battle you stand way too close to the enemy". The hero at the left edge, the enemy well to the right.
  heroX: 66,
  /** The hero's bars sit in from the edge, so they stay on the screen. */
  enemyX: 318,
  titleY: 122,
  historyY: 148,
  messageY: 650,
  promptY: 708,
} as const;

/** Each class's meter has its own pip (Nigel, SD); the plain one is the Knight's. */
const METER_PIP: Partial<Record<ClassId, string>> = { rogue: 'fight/meter-pip-trickster', mage: 'fight/meter-pip-wizard', ranger: 'fight/meter-pip-archer' };

/** The title stops short of the ? at the top right. */
const TITLE_X = 180;
/** How far under the fighters' feet the name boards start. */
const BOARD_BELOW = 16;
const TITLE_W = 340;

/** Where the buttons sit, in design pixels (the driver taps them here). Two rows of two, and a row for Flee or Back. */
export const FIGHT_BUTTONS = {
  a: { x: 108, y: 744, w: 188, h: 54 },
  b: { x: 304, y: 744, w: 188, h: 54 },
  c: { x: 108, y: 802, w: 188, h: 54 },
  d: { x: 304, y: 802, w: 188, h: 54 },
  e: { x: 108, y: 860, w: 188, h: 54 },
  f: { x: 304, y: 860, w: 188, h: 54 },
  continue: { x: 206, y: 802, w: 260, h: 70 },
} as const;

const STEP_MS = 450; // between two events of a round
const COMBO_MS = 170; // between the hits of one combo
/** The first fight's line, said once (tips.ts). */
const TIP_FIGHT = 'Pick a move, then a guard. The orange line says what comes next.';
const CENTRE = DESIGN_WIDTH / 2;

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
  /** Smaller than the rest: a label of two lines. */
  size?: string;
  /** An ability's icon at the button's left. */
  icon?: string;
}

type Body = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

export class FightScene extends Phaser.Scene {
  private combo: { move: string; at: number; n: number } | null = null;
  private dripIn = 400;
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  private backdrop: Backdrop | null = null;
  private enemyBody!: Body;
  /** The enemy drawn from the Art Director's atlas when it has one. */
  private enemy: Figure | null = null;
  private enemyBar!: Bar;
  private enemyBoard!: FightBoard;
  private heroBody!: Body;
  /** The hero drawn from the atlas when a set is loaded. */
  private hero: Hero | null = null;
  /** The clips held while a state lasts, and the Archer's owl while it fights. */
  private held!: HeldEffects;
  private owl: Owl | null = null;
  private feetY = 0;
  private heroBar!: Bar;
  private manaBar!: Bar;
  private heroBoard!: FightBoard;
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
  private enemyRole = 'mob';
  private enemyMaxHp = 1;

  constructor(deps: FightSceneDeps) {
    super('fight');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  /** Only this enemy and this area's backdrop are loaded, here, the first time they are met. */
  preload(): void {
    const me = this.game_.me;
    if (!me.fight) return;
    const board = this.game_.state.board;
    preloadCreature(this, me.fight.enemy.id);
    // Lightning only for one who can call it: a trinket's, or the storm blade (2026-11-03).
    preloadEffects(this, me.classId === 'ranger', me.classId === 'rogue', !!traitsOf(me).lightning || !!me.abilities['storm-blade'], me.classId === 'mage');
    preloadCarriedIcons(this, me.carried);
    preloadBackdrop(this, board.areas[board.spaces[me.fight.space]?.area ?? '']?.theme ?? board.areas[board.spaces[me.space]?.area ?? '']?.theme ?? 'meadow');
  }

  create(): void {
    freeTalentIconsAfter(this);
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
    this.enemyRole = enemy.role;
    this.enemyMaxHp = enemy.maxHp;

    // The screen covers the band and the HUD's strip and takes every touch, so nothing reaches the board under it.
    this.add.rectangle(CENTRE, (HUD_PLANK + 915) / 2, SCREEN_WIDTH, 915 - HUD_PLANK, 0x151826, 1).setInteractive();
    const board = this.game_.state.board;
    const theme = board.areas[board.spaces[fight.space]?.area ?? '']?.theme ?? board.areas[board.spaces[me.space]?.area ?? '']?.theme ?? 'meadow';
    this.backdrop = new Backdrop(this, theme, L.groundY, L.stripY);
    const kit = kitReady(this);
    if (kit) {
      plate(this, 'panel_bottom', CENTRE, (L.stripY + 915) / 2, SCREEN_WIDTH, 915 - L.stripY);
      plate(this, 'panel_message', CENTRE, L.messageY + 22, MESSAGE_BOX_W, 56);
    }
    const feetY = this.backdrop.feetY;
    this.feetY = feetY;
    this.held = new HeldEffects(this);
    this.owl = null;

    const title = this.add.text(TITLE_X, L.titleY, `${enemy.name} · level ${enemy.level}${fight.shared ? ' · world boss' : enemy.role === 'boss' ? ' · boss' : enemy.role === 'mini' ? ' · mini-boss' : ''}`, { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#1a2030', strokeThickness: 5 }).setOrigin(0.5);
    // A long name must not run under the ? (mine, 2026-11-01: the Sleepy Owlbear Cub did).
    for (let size = 19; title.width > TITLE_W && size >= 14; size--) title.setFontSize(size);
    this.lines = [];
    // One line of what just happened, so it never runs into the enemy's tell.
    this.history = this.add.text(22, L.historyY, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#1a2030', strokeThickness: 4, wordWrap: { width: 368 }, maxLines: 1 }).setOrigin(0, 0);

    // The contact shadows, then the figures, so they stand on the ground.
    this.add.ellipse(L.heroX, feetY, 64, 16, 0x000000, 0.22);
    const enemyArt = creatureReady(this, enemy.id);
    if (enemyArt) {
      this.enemy = new Figure(this, enemy.id, L.enemyX, feetY);
      if (enemy.phase === 2) this.enemy.setPhase(2);
      const shadow = this.enemy.shadow();
      this.add.ellipse(L.enemyX + shadow.dx, feetY, shadow.width, Math.max(14, shadow.width * 0.16), 0x000000, 0.22);
      this.enemy.sprite.setDepth(1);
      this.enemyBody = this.enemy.sprite;
    } else {
      this.add.ellipse(L.enemyX, feetY, 110, 20, 0x000000, 0.22);
      this.enemyBody = this.add.circle(L.enemyX, feetY - 56, 56, ENEMY_COLORS[enemy.role] ?? 0x8f2f3b, 1).setStrokeStyle(4, 0x101318, 1);
      this.add.text(L.enemyX, feetY - 56, enemy.name.charAt(0), { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
    }
    // Under the feet, on the ground (Robin, 2026-11-02: "healthbars etc should be under the characters... It can look a little messy and cluttery").
    this.enemyBoard = new FightBoard(this, ENEMY_BOARD(feetY + BOARD_BELOW));
    this.enemyBar = this.enemyBoard.hp;

        if (heroReady(this, me.classId)) {
      this.hero = new Hero(this, me, L.heroX, feetY, HERO_FIGHT_SCALE);
      this.hero.face(true);
      this.heroBody = this.hero.root;
    } else {
      this.heroBody = this.add.circle(L.heroX, feetY - 26, 26, CLASS_COLORS[me.classId] ?? 0xffffff, 1).setStrokeStyle(3, 0x101318, 1);
      this.add.text(L.heroX, feetY - 26, cls.name.charAt(0), { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#101318' }).setOrigin(0.5);
    }
    // Health above mana (Robin, 2026-11-02).
    this.heroBoard = new FightBoard(this, HERO_BOARD(feetY + BOARD_BELOW));
    this.heroBar = this.heroBoard.hp;
    this.manaBar = this.heroBoard.mana!;

    this.message = this.add
      .text(CENTRE, L.messageY + 22, fight.shared ? 'A world boss: all who land here fight the same beast and share the reward.' : enemy.trick ? enemy.trick.text : this.game_.me.classId === 'mage' && this.game_.me.level <= 4 ? `${enemy.name} blocks the way! Spells are your strength: tap Abilities.` : `${enemy.name} blocks the way!${tips.take('fight') ? ` ${TIP_FIGHT}` : ''}`, { fontFamily: FONT, fontSize: settings.font(15), color: kit ? INK : COLORS.text, align: 'center', wordWrap: { width: MESSAGE_BOX_W - 24 } })
      .setOrigin(0.5);
    logButtons(this, L.messageY + 22);
    this.prompt = this.add.text(CENTRE, L.promptY, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#fff8e8', stroke: '#3a2410', strokeThickness: 3 }).setOrigin(0.5);

    this.continueButton = makeButton(this, FIGHT_BUTTONS.continue.x, FIGHT_BUTTONS.continue.y, FIGHT_BUTTONS.continue.w, FIGHT_BUTTONS.continue.h, 'Continue', COLORS.button, '22px', () => this.leave()).button;
    this.continueButton.setVisible(false);

    this.enemyBar.set(enemy.hp, enemy.maxHp, true);
    this.heroBar.set(me.hp, s.maxHp, true);
    this.manaBar.set(me.mana, s.maxMana, true);
    this.refreshStatus();
    this.showMoves();
    makeButton(this, 380, 124, 44, 44, this.textures.exists(GUIDE_ICON) ? '' : '?', COLORS.log, '20px', () => {
      sfx.play('ui/sheet-open');
      this.scene.launch('guide', { page: 2 });
    }, { icon: { frame: 'icon_guide', y: 2, size: 30, atlas: GUIDE_ICON } });
    // The night darkens the road behind the fighters (Robin, 2026-11-03).
    if (isNight(me)) this.add.rectangle(0, 0, DESIGN_WIDTH * 3, 2000, 0x0b1440, 0.3).setOrigin(0.3, 0.3).setDepth(0.5);
    sfx.play('fight/begin');
    this.log.note(`fight: ${enemy.name} L${enemy.level} ${enemy.hp} hp, round ${fight.round}; backdrop ${theme}, figure ${enemyArt ? enemy.id : 'circle'}`);
  }

  override update(_time: number, delta: number): void {
    // A coated blade drips (Robin, 2026-11-03), about once a second.
    // Blood on the blade drips red, quicker the more there is (Robin, 2026-11-03; Mitch, AD's clips).
    const blood = this.game_.me.fight?.blood ?? 0;
    if (blood > 0 && !this.game_.me.fight?.coat) {
      this.dripIn -= delta;
      if (this.dripIn <= 0) {
        this.dripIn = 1300 - blood * 250 + Math.random() * 250;
        const tip = { x: FIGHT_LAYOUT.heroX + 8, y: this.feetY - 28 };
        const drop = playOnce(this, 'blood_drip', tip.x, tip.y, 'fx_blood');
        drop?.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => playOnce(this, 'blood_splash', tip.x + 2, this.feetY - 2, 'fx_blood'));
      }
    }
    if (this.game_.me.fight?.coat && this.game_.me.classId === 'rogue') {
      this.dripIn -= delta;
      if (this.dripIn <= 0) {
        this.dripIn = 900 + Math.random() * 300;
        // The dagger hangs low in the right hand at stand: its tip, measured on the phone-size screen.
        const tip = { x: FIGHT_LAYOUT.heroX + 8, y: this.feetY - 28 };
        const drop = playOnce(this, 'blade_drip', tip.x, tip.y, 'fx_rogue');
        drop?.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => playOnce(this, 'drip_splash', tip.x + 2, this.feetY - 2, 'fx_rogue'));
      }
    }
    this.backdrop?.update(delta);
    this.hero?.update(delta);
  }

  // ---- the two taps of a round --------------------------------------------------------------------------------------

  /** The first row of choices: what you do. */
  private showMoves(): void {
    const me = this.game_.me;
    // The strongest flask you carry of each (Robin, 2026-11-02: set amounts, better potions later).
    const health = ['potion-5', 'potion-4', 'potion-3', 'potion-2', 'potion'].find((id) => (me.items[id] ?? 0) > 0) ?? 'potion';
    const mana = ['mana-potion-5', 'mana-potion-4', 'mana-potion-3', 'mana-potion-2', 'mana-potion'].find((id) => (me.items[id] ?? 0) > 0) ?? 'mana-potion';
    const potions = me.items[health] ?? 0;
    const manaPotions = me.items[mana] ?? 0;
    // The Arena lets you drink only so many (its rule): the buttons say so instead of doing nothing.
    const mayDrink = !me.arena || me.arena.flasks < ARENA.flasks;
    this.prompt.setText(`Round ${me.fight?.round ?? 1} · your move`);
    this.setOptions([
      { text: 'Attack', color: COLORS.button, enabled: true, onTap: () => this.pick({ kind: 'attack' }) },
      { text: 'Abilities', color: 0x8e6ad9, enabled: me.carried.length > 0, onTap: () => this.showAbilities() },
      { text: me.fight?.charged ? 'Charged' : 'Charge', color: 0xf0a030, enabled: !me.fight?.charged, onTap: () => this.pick({ kind: 'charge' }) },
      { text: potions > 1 ? `${ITEMS[health]!.name} ×${potions}` : ITEMS[health]!.name, color: 0xc84b4b, enabled: potions > 0 && mayDrink, onTap: () => this.pick({ kind: 'item', item: health }) },
      { text: 'Flee', color: COLORS.log, enabled: true, onTap: () => this.pick({ kind: 'flee' }) },
      { text: manaPotions > 1 ? `${ITEMS[mana]!.name} ×${manaPotions}` : ITEMS[mana]!.name, color: 0x3a7fbf, enabled: manaPotions > 0 && mayDrink, onTap: () => this.pick({ kind: 'item', item: mana }) },
    ]);
  }

  /** The known abilities with their mana costs; dimmed when mana is short. */
  /** The abilities, four a page when they do not all fit beside Back, so Back is always there (mine, 2026-11-01: a sixth pushed it off and could strand you). */
  private showAbilities(page = 0): void {
    const me = this.game_.me;
    this.prompt.setText('Which ability? The ? up top says what each does.');
    const f = me.fight;
    const meterName = CLASS_DATA[me.classId].meter?.name ?? 'meter';
    const arcane = powers(me).arcane;
    // What is carried into the fight: four at most (mine, 2026-11-02).
    const known = me.carried.length ? me.carried : Object.keys(me.abilities);
    const options: Option[] = known.map((id) => {
      const rank = me.abilities[id] ?? 1;
      const a = ABILITIES[id];
      const mana = a ? manaCost(me, id) : 0;
      const cost = a?.meterAll ? `all ${meterName}` : a?.meter ? `${a.meter} ${meterName}` : '';
      const used = !!a?.oncePerFight && !!f?.used?.includes(id);
      const meterOk = !a?.meter || (f?.meter ?? 0) >= a.meter;
      const meterAllOk = !a?.meterAll || (f?.meter ?? 0) > 0;
      const held = holdsFor(me, a?.needs);
      return {
        text: `${a?.name ?? id}${rank > 1 ? ` R${rank}` : ''}
${used ? 'used' : !held ? `needs ${needsWords(a?.needs)}` : `${mana} MP${cost ? ` · ${cost}` : ''}`}`,
        size: '14px',
        icon: id,
        color: 0x8e6ad9,
        enabled: !!a && me.mana >= mana && meterOk && meterAllOk && !used && held,
        onTap: () => this.pick({ kind: 'ability', ability: id }),
      };
    });
    const back: Option = { text: 'Back', color: COLORS.log, enabled: true, onTap: () => this.showMoves() };
    if (options.length <= 5) {
      this.setOptions([...options, back]);
      return;
    }
    const pages = Math.ceil(options.length / 4);
    const next = (page + 1) % pages;
    this.setOptions([...options.slice(page * 4, page * 4 + 4), { text: `More (${page + 1} of ${pages})`, color: 0x8e6ad9, enabled: true, onTap: () => this.showAbilities(next) }, back]);
  }

  /** The move is chosen: now how to take the blow. */
  private pick(move: FightMove): void {
    this.pendingMove = move;
    // What the chosen ability does, while there is still Back (Robin, 2026-11-01: hard to tell what skills do).
    if (move.kind === 'ability') {
      const a = ABILITIES[move.ability];
      if (a) this.say(`${a.name}: ${a.text}`);
    }
    this.prompt.setText('And when it strikes back?');
    this.setOptions([
      // A Magician wards and channels (Robin, 2026-11-03).
      { text: traitsOf(this.game_.me).ward ? 'Ward (no mana)' : 'Block (half)', color: COLORS.log, enabled: true, onTap: () => this.act('block') },
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
    // Each pressed talent's sound, from Nigel, SD's map; anything not arrived yet borrows the swing.
    // A Magician's heal shines on her, the holy burst at her feet (Mitch, AD, 2026-11-03).
    if (move.kind === 'ability' && ABILITIES[move.ability]?.classId === 'mage' && ABILITIES[move.ability]!.ranks.some((rk) => rk.healShare || rk.regen)) {
      this.after(this.hero?.blowMs(1) ?? 0, () => playOnce(this, 'holy_burst', FIGHT_LAYOUT.heroX, this.feetY, 'fx_spells'));
    }
    // A Magician's spell with no sound of its own sounds like magic, not a swing (2026-11-03).
    if (move.kind === 'ability') sfx.playOr((talentSounds as Record<string, string>)[move.ability] ?? `fight/ability-${move.ability}`, ABILITIES[move.ability]?.classId === 'mage' ? 'fight/talent-arcane-bolt' : 'fight/swing');
    else sfx.play(move.kind === 'attack' ? 'fight/swing' : move.kind === 'charge' ? 'fight/charge' : move.kind === 'flee' ? 'fight/flee' : `fight/${move.item === 'mana-potion' ? 'mana-potion' : 'potion'}`);
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
    // A combo's hits come close together: a swipe, not three blows (Robin, 2026-11-03).
    const now = events[i]!;
    const following = events[i + 1];
    const combo = now.type === 'hit' && now.by === 'player' && following?.type === 'hit' && following.by === 'player' && following.move === now.move;
    this.time.delayedCall(combo ? COMBO_MS : STEP_MS, () => this.play(events, i + 1));
  }

  private show(e: GameEvent): void {
    const me = this.game_.me;
    const s = stats(me);
    switch (e.type) {
      case 'hit':
        if (e.by === 'player' && e.move === 'Lightning') {
          // A trinket's lightning (Robin, 2026-11-03): a bolt from the sky once the blow has landed.
          this.after((this.hero?.blowMs(1) ?? 0) + 140, () => {
            const at = this.spot('enemy', 'chest');
            // Mitch, AD's strike, added light on the foe's chest; the drawn line if it is not loaded.
            const strike = playOnce(this, 'strike', at.x, at.y, 'fx_lightning');
            if (strike) strike.setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
            else this.bolt(at);
            playOnce(this, 'hit_spark', at.x, at.y);
            this.enemy?.play('hit1');
            sfx.play('fight/lightning');
            this.flash(this.enemyBody, e.damage, false);
            this.enemyBar.set(e.hp, this.enemyMaxHp);
          });
          this.say(`Lightning strikes ${this.enemyName} for ${e.damage}!`);
          break;
        }
        if (e.by === 'player') {
          const combo = this.comboStep(e.move);
          // The hero swings; the blow lands on his clip's frame, and the enemy takes it then.
          const byOwl = e.move === ABILITIES.hawk?.name;
          const star = e.move === ABILITIES.meteor?.name;
          // A spell is cast and a bow shot from where the hero stands (Robin, 2026-11-03: "not hitting melee", "There should be ranged attack").
          // A Magician with a staff or a wand casts even her plain Attack, a small arcane bolt (Mitch, AD's cast pose, 2026-11-03).
          const plainCast = this.game_.me.classId === 'mage' && e.move === 'Attack' && gearKind(this.game_.me.equipment.weapon) !== 'sword';
          const spell = spellLook(e.move) ?? (plainCast ? SPELL_LOOKS.arcane : null);
          const bowShot = this.game_.me.classId === 'ranger' && gearKind(this.game_.me.equipment.weapon) === 'bow' && !byOwl;
          if (byOwl) this.owl?.strike(FIGHT_LAYOUT.enemyX - 70);
          else {
            // In a combo the hero swings fast and steps in once; a caster and an archer stay put.
            this.hero?.play('attack1', false, combo > 0 ? 2.2 : 1);
            if (combo <= 1 && !spell && !star && !bowShot) this.step(this.heroBody, 34);
          }
          this.after(byOwl ? (this.owl?.blowMs() ?? 0) : (this.hero?.blowMs(combo > 0 ? 2.2 : 1) ?? 0), () => {
            const at = this.spot('enemy', 'chest');
            if (combo > 0 && this.game_.me.classId === 'rogue') this.slash(combo);
            // The foe feels it when the bolt, the star or the arrow arrives, not when it leaves.
            const react = () => {
              this.enemy?.play('hit1');
              // A spell lands with its element's sound (Nigel, SD, 2026-11-03).
              sfx.play(spell ? spell.sound : e.crit ? 'fight/crit' : e.damage >= this.enemyMaxHp * 0.15 ? 'fight/hit-heavy' : 'fight/hit-light');
              if (e.move === ABILITIES.meteor?.name) sfx.play('fight/meteor-land');
              sfx.play(`creature/${this.enemyId}/hit`);
              this.flash(this.enemyBody, e.damage, e.crit);
              this.enemyBar.set(e.hp, this.enemyMaxHp);
            };
            const land = () => {
              if (star) playOnce(this, 'fire_burst', at.x, at.y, 'fx_spells') ?? playOnce(this, 'star_impact', at.x, at.y);
              else if (spell) playOnce(this, spell.burst, spell.feet ? FIGHT_LAYOUT.enemyX : at.x, spell.feet ? this.feetY : at.y, 'fx_spells');
              else playOnce(this, e.crit ? 'crit_burst' : 'hit_spark', at.x, at.y);
              react();
            };
            if (star) fly(this, 'falling_star', { x: at.x, y: HUD_HEIGHT + 20 }, at, settings.ms(260), land);
            else if (spell) {
              // Her free hand on the cast's fourth frame (Mitch, AD): the flare there, then the bolt at about 600 px a second.
              const hand = { x: FIGHT_LAYOUT.heroX + 50, y: this.feetY - 80 };
              playOnce(this, spell.flare, hand.x, hand.y, 'fx_spells');
              fly(this, spell.bolt, hand, at, settings.ms(Math.max(160, Math.hypot(at.x - hand.x, at.y - hand.y) / 0.6)), land, 'fx_spells', true);
            } else if (bowShot) fly(this, 'arrow', this.spot('hero', 'chest'), at, settings.ms(130), land);
            else land();
          });
          this.say(`${e.move}: ${e.damage} damage${e.crit ? ', a crit!' : '.'}`);
        } else {
          this.enemy?.play('attack1');
          sfx.play(`creature/${this.enemyId}/attack`);
          this.step(this.enemyBody, -30);
          this.after(this.enemy?.blowMs() ?? 0, () => {
            this.hero?.play('hit1');
            const hurt = this.spot('hero', 'chest');
            playOnce(this, e.crit ? 'crit_burst' : 'hit_spark', hurt.x, hurt.y);
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
          this.showDodge();
        } else this.hero?.play('attack1');
        sfx.play('fight/miss');
        {
          const at = this.spot(e.by === 'enemy' ? 'hero' : 'enemy', 'chest');
          playOnce(this, 'dodge_whoosh', at.x, at.y);
        }
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
        if (e.guard === 'block' || e.guard === 'brace') {
          const at = this.spot('hero', 'chest');
          playOnce(this, 'block_shield', at.x + 20, at.y);
        }
        this.say({ block: 'You raise your guard.', dodge: 'You step aside…', brace: 'You brace.', counter: 'You wait for the opening…', none: '' }[e.guard]);
        break;
      case 'skipped':
        this.say({ stunned: `${this.enemyName} is stunned and loses its turn.`, warped: `Time bends: ${this.enemyName} loses its turn.`, trapped: `${this.enemyName} springs your trap and loses its turn!` }[e.reason]);
        break;
      case 'resisted':
        this.say(e.kind === 'crit' ? 'Ironbrow turns the crit aside: only a hit.' : e.kind === 'stunned' ? `${this.enemyName} shrugs it off.` : 'Ironbrow shrugs it off.');
        break;
      case 'effect':
        sfx.play(`fight/effect-${e.kind === 'spellUp' ? 'attackUp' : e.kind}`);
        // Magic Power rises round her feet, behind her (Mitch, AD, 2026-11-03).
        if (e.kind === 'spellUp') {
          const on = playOnce(this, 'power_on', FIGHT_LAYOUT.heroX, this.feetY, 'fx_spells');
          if (on) behind(this, on, this.heroBody as Phaser.GameObjects.GameObject & { depth: number });
        }
        this.say(this.effectText(e.target, e.kind, e.rounds));
        this.refreshStatus();
        break;
      case 'selfHurt':
        this.flash(this.heroBody, e.amount, false);
        this.heroBar.set(e.hp, s.maxHp);
        break;
      case 'poisoned':
        sfx.play(e.storm ? 'fight/storm-bite' : e.bleed ? 'fight/effect-bleed-tick' : 'fight/effect-poison-tick');
        if (e.target === 'enemy') {
          this.flash(this.enemyBody, e.damage, false);
          this.enemyBar.set(e.hp, this.enemyMaxHp);
          this.say(e.burn ? `${this.enemyName} burns for ${e.damage}.` : e.bleed ? `${this.enemyName} bleeds for ${e.damage}.` : `The poison bites ${this.enemyName} for ${e.damage}.`);
        } else {
          this.flash(this.heroBody, e.damage, false);
          this.heroBar.set(e.hp, s.maxHp);
          this.say(e.storm ? `The storm bites you for ${e.damage}.` : `The poison bites you for ${e.damage}.`);
        }
        break;
      case 'intent':
        this.refreshStatus();
        break;
      case 'trick':
        this.say(e.text);
        this.refreshStatus();
        break;
      case 'phase':
        this.enemy?.setPhase(2);
        sfx.play('fight/phase');
        // Grumblebark's second phase: the whole forest shakes (art-demands, wave 4).
        if (this.enemyId === 'briar-king' && !settings.get().fewerEffects) this.cameras.main.shake(700, 0.006);
        sfx.play(`creature/${this.enemyId}/surge`);
        this.say(e.text);
        this.refreshStatus();
        break;
      case 'meter':
        sfx.play(METER_PIP[this.game_.me.classId] ?? 'fight/meter-pip');
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
        this.say(e.by === 'guardian' ? `The last light holds: you stand with ${e.hp} HP!` : e.by === 'phoenix' ? `The Phoenix Feather burns: you rise with ${e.hp} HP!` : `The Phoenix Helm pulls you back to ${e.hp} HP.`);
        break;
      case 'countered':
        this.hero?.play('attack1');
        this.after(this.hero?.blowMs() ?? 0, () => {
          const at = this.spot('enemy', 'chest');
          playOnce(this, 'counter_flash', at.x, at.y);
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
        if (ITEMS[e.item]?.mana) {
          const at = this.spot('hero', 'chest');
          playOnce(this, 'mana_sparkle', at.x, at.y);
        }
        break;
      case 'healed':
        this.heroBar.set(e.hp, s.maxHp);
        if (e.amount > 0) {
          sfx.play('fight/heal');
          {
            const at = this.spot('hero', 'chest');
            playOnce(this, 'heal_glow', at.x, at.y);
          }
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
        this.end({ type: 'won', loot: [], enemy: this.enemyName, summary: this.game_.me.arena ? `Wave ${this.game_.me.arena.wave} won: +${e.xp} xp and +${e.gold} gold in the pot.` : `Beat ${this.enemyRole === 'boss' ? '' : 'the '}${this.enemyName}: +${e.xp} xp, +${e.gold} gold.${tip ? ` ${tip}` : ''}` }, `${this.enemyName} is beaten! +${e.xp} xp, +${e.gold} gold.`);
        break;
      }
      case 'loot':
        // The drop is told here and shown by the loot reveal once the fight closes (chapter 1, step 2).
        sfx.play('fight/drop');
        // Robin, 2026-11-01: "You open the chest first of course": no name here, the reveal shows what it is.
        this.say('It drops a chest!');
        if (this.outcome) this.outcome = { ...this.outcome, loot: [...this.outcome.loot, ...gearIn([e])] };
        break;
      case 'bagFull':
        if (this.outcome) this.outcome = { ...this.outcome, loot: this.outcome.loot.map((p) => (p.kind === 'gear' && p.gear.id === e.gear.id ? { ...p, sold: e.sold } : p)) };
        break;
      case 'equipped':
        if (this.outcome) this.outcome = { ...this.outcome, loot: this.outcome.loot.map((p) => (p.kind === 'gear' && p.gear.id === e.gear.id ? { ...p, worn: true } : p)) };
        (this.scene.get('board') as BoardScene).refreshHud();
        break;
      case 'questProgress':
        this.say(e.quest.trophy ? `${e.quest.trophy} for your quest: ${e.quest.done} of ${e.quest.count}.` : `Quest: ${e.quest.done} of ${e.quest.count}.`);
        break;
      case 'questDone':
        sfx.play('ui/quest-done');
        moments(this)?.find('mark_scroll', 'Quest complete!', `+${e.quest.xp} xp, +${e.quest.gold} gold and a chest.`, 0xe8b84a);
        this.say(`Quest complete: ${e.quest.text}`);
        break;
      case 'found':
        this.say(`You find ${e.count > 1 ? `${e.count} ` : 'a '}${ITEMS[e.item]?.name ?? e.item}.`);
        break;
      case 'levelled':
        {
          const at = this.spot('hero', 'chest');
          playOnce(this, 'levelup_burst', at.x, at.y);
        }
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
      case 'gameWon':
        sfx.play('fight/ending-sting');
        moments(this)?.find('item_gold', 'The Hollow King falls', 'The flame goes out under the old crown. You have beaten the game. The world is still yours to walk.', 0xf4c14a);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} The old kingdom sleeps at last.` };
        break;
      case 'sealWon':
        moments(this)?.seal(e.land, 'A Seal!', `${this.game_.state.board.areas[e.land]?.name ?? e.land}: ${e.won} of ${e.total} Seals.`);
        if (this.outcome) this.outcome = { ...this.outcome, summary: `${this.outcome.summary} A Seal! ${e.won} of ${e.total}.` };
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

  /** A figure steps toward the other for its blow and back. */
  private step(body: Body, dx: number): void {
    if (!settings.ms(1) || !body) return;
    const home = body === this.heroBody ? FIGHT_LAYOUT.heroX : body === this.enemyBody ? FIGHT_LAYOUT.enemyX : body.x;
    body.x = home;
    this.tweens.add({ targets: body, x: home + dx, duration: 160, ease: 'Quad.easeOut', yoyo: true, hold: 120, onComplete: () => (body.x = home) });
  }

  /** Which hit of a combo this is: 1, 2, 3 for hits of the same move in a row within 600 ms, 0 when it is a lone hit. */
  private comboStep(move: string): number {
    const now = this.time.now;
    this.combo = this.combo && this.combo.move === move && now - this.combo.at < 600 ? { move, at: now, n: this.combo.n + 1 } : { move, at: now, n: 1 };
    const f = this.game_.me.fight;
    const hits = traitsOf(this.game_.me).attackHits ?? 1;
    return hits > 1 || this.combo.n > 1 || (f && move !== 'Attack') ? this.combo.n : 0;
  }

  /** A Rogue's slash across the foe (Mitch, AD's clips): across, back, then up; drawn additively. */
  private slash(n: number): void {
    const clip = ['slash_a', 'slash_b', 'slash_c'][(n - 1) % 3]!;
    const s = playOnce(this, clip, FIGHT_LAYOUT.enemyX, this.feetY - 75, 'fx_rogue');
    s?.setBlendMode(Phaser.BlendModes.ADD);
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
      const { button, label } = makeButton(this, slot.x, slot.y, slot.w, slot.h, o.text, o.color, o.size ?? '16px', () => {
        if (o.enabled && !this.busy) o.onTap();
        else sfx.play('ui/tap-denied');
      });
      const pic = o.icon ? abilityIcon(this, o.icon, -slot.w / 2 + 24, -2, 30) : null;
      if (pic) {
        button.add(pic);
        label.setX(14);
        for (let px = 13; label.width > slot.w - 56 && px > 11; px--) label.setFontSize(px);
      }
      if (!o.enabled) button.setAlpha(0.4);
      this.buttons.push(button);
    });
  }

  /** A dodge you can see (Robin, 2026-11-02): the hero slips back and fades a little, a whoosh, a faint blue word over them. */
  private showDodge(): void {
    sfx.play('fight/dodge');
    const at = this.spot('hero', 'chest');
    const word = this.add.text(at.x + 22, at.y - 30, 'dodge', { fontFamily: FONT_DISPLAY, fontSize: '24px', fontStyle: 'bold', color: '#a8d8ff', stroke: '#1a2a44', strokeThickness: 3 }).setOrigin(0.5).setAlpha(0.8).setDepth(60);
    this.tweens.add({ targets: word, y: word.y - 46, alpha: 0, duration: settings.ms(1100) || 1, ease: 'Sine.easeOut', onComplete: () => word.destroy() });
    if (!settings.ms(1)) return;
    const whoosh = playOnce(this, 'dodge_whoosh', at.x + 34, at.y);
    whoosh?.setScale(whoosh.scale * 1.8);
    const body = this.heroBody;
    const home = body.x;
    this.tweens.add({ targets: body, x: home - 30, alpha: 0.45, duration: 110, ease: 'Quad.easeOut', yoyo: true, hold: 170 });
  }

  /** Where an effect goes on a figure. */
  private spot(who: 'hero' | 'enemy', where: 'chest' | 'head'): { x: number; y: number } {
    const height = who === 'hero' ? 150 : (this.enemy?.headHeight() ?? 56);
    return { x: who === 'hero' ? FIGHT_LAYOUT.heroX : FIGHT_LAYOUT.enemyX, y: this.feetY - height * (where === 'chest' ? 0.5 : 0.95) };
  }

  /** What is on each side: wind-ups, stuns, poison, weakening; charges, buffs, barriers, evasion. */
  private refreshStatus(): void {
    const f = this.game_.me.fight;
    if (!f) {
      this.enemyBoard.setWords([]);
      this.heroBoard.setWords([]);
      this.held.clear();
      this.owl?.destroy();
      this.owl = null;
      return;
    }
    const e = f.enemy;
    const enemyBits = [
      this.intentText(e),
      e.stunned ? `stunned ${e.stunned}` : '',
      e.poison ? `poisoned ${e.poison.rounds}` : '',
      e.burn ? `burning ${e.burn.rounds}` : '',
      e.bleed ? `bleeding ${e.bleed.rounds}` : '',
      e.sunder ? `exposed ${e.sunder.rounds}` : '',
      e.weakened ? `weakened ${e.weakened.rounds}` : '',
      e.armoured ? `hardened ${e.armoured.rounds}` : '',
      e.evade ? 'fading' : '',
      e.phase === 2 ? 'raging' : '',
    ].filter(Boolean);
    this.enemyBoard.setWords(enemyBits);
    // A wind-up held: the enemy reddens until it lands.
    if (this.enemyBody instanceof Phaser.GameObjects.Arc) {
      if (e.charged) this.enemyBody.setStrokeStyle(8, 0xff5a4a, 1);
      else this.enemyBody.setStrokeStyle(4, 0x101318, 1);
    } else if (this.enemyBody instanceof Phaser.GameObjects.Sprite) {
      if (e.charged) this.enemyBody.setTint(0xffb0a0);
      else this.enemyBody.clearTint();
    }
    const meter = CLASS_DATA[this.game_.me.classId].meter;
    if (meter) this.heroBoard.setMeter(this, meter.name, f.meter ?? 0, PROGRESSION.meterMax);
    const heroBits = [
      f.charged ? 'charged' : '',
      f.attackUp ? `hits harder ${f.attackUp.rounds}` : '',
      f.spellUp ? `magic power ${f.spellUp.rounds}` : '',
      f.barrier ? `barrier ${f.barrier}` : '',
      f.evade ? `evading ${f.evade}` : '',
      f.sureCrit ? `sure crit ${f.sureCrit}` : '',
      f.mark ? `marked ${f.mark.hits}` : '',
      f.companion ? `${f.companion.name.toLowerCase()} ${f.companion.rounds}` : '',
      f.windup ? `${f.windup.name.toLowerCase()} in ${f.windup.rounds}` : '',
      f.trap ? 'trap set' : '',
      f.skip ? `time bent ${f.skip}` : '',
      f.poisoned ? `poisoned ${f.poisoned.rounds}` : '',
      f.streak && traitsOf(this.game_.me).critStreak ? `crit +${Math.round(f.streak * (traitsOf(this.game_.me).critStreak ?? 0) * 100)}%` : '',
      f.infuse ? `${f.infuse.kind === 'ice' ? 'frost' : 'storm'} ${f.infuse.rounds}` : '',
      f.dance ? (f.dance.exposed ? 'open' : `shadow ${f.dance.rounds}`) : '',
      f.coat ? `coated ${f.coat.hits}` : '',
      f.blood ? `blood ${f.blood}` : '',
      f.clone ? `clone ${f.clone.rounds}` : '',
      f.guardian ? 'last light' : '',
      f.regen ? `healing ${f.regen.rounds}` : '',
      f.blockUp ? `bulwark ${f.blockUp.rounds}` : '',
      f.thornsUp ? `retort ${f.thornsUp.rounds}` : '',
      f.counterUp ? `reflexes ${f.counterUp.rounds}` : '',
      f.spike ? `spikes ${f.spike.rounds}` : '',
      f.weak ? `weakened ${f.weak.rounds}` : '',
      this.game_.me.elixirs?.vigor ? 'vigor' : '',
      this.game_.me.elixirs?.arcana ? 'arcana' : '',
    ].filter(Boolean);
    this.heroBoard.setWords(heroBits);
    // What lasts is seen on the figure (Mitch, AD's clips). No clip of its own: burn; Firework hits as a plain hit for now.
    const heroChest = this.spot('hero', 'chest');
    const heroHead = this.spot('hero', 'head');
    const foeChest = this.spot('enemy', 'chest');
    const foeHead = this.spot('enemy', 'head');
    this.held.set('charge_glow', !!f.charged, heroChest.x, heroChest.y);
    // Magic Power's ring at her feet while it lasts.
    this.held.set('power_aura', !!f.spellUp, FIGHT_LAYOUT.heroX, this.feetY, 'fx_spells', undefined, 'power_aura', this.heroBody as Phaser.GameObjects.GameObject & { depth: number });
    this.held.set('poison_drip', !!f.poisoned, heroHead.x, heroHead.y);
    this.held.set('weaken', !!f.weak, heroHead.x, heroHead.y);
    this.held.set('bubble_shield', !!f.barrier, heroChest.x, heroChest.y, 'bubble', 'bubble_pop');
    this.held.set('windup_tell', !!e.charged, foeHead.x, Math.max(foeHead.y - 14, FIGHT_LAYOUT.historyY + 34));
    this.held.set('poison_drip', !!e.poison, foeHead.x, foeHead.y + 20);
    this.held.set('burn', !!e.burn, this.spot('enemy', 'chest').x, this.feetY - 10);
    this.held.set('frost_edge', f.infuse?.kind === 'ice', heroChest.x + 26, heroChest.y + 6);
    this.held.set('storm_edge', f.infuse?.kind === 'storm', heroChest.x + 26, heroChest.y + 6);
    this.held.set('weaken', !!e.weakened, foeChest.x, foeChest.y);
    this.held.set('chill', !!e.stunned, foeChest.x, foeChest.y);
    if (f.companion && !this.owl && this.game_.me.classId === 'ranger' && !settings.get().fewerEffects) this.owl = new Owl(this, FIGHT_LAYOUT.heroX + 84, this.feetY - 70);
    else if (!f.companion && this.owl) {
      this.owl.destroy();
      this.owl = null;
    }
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
        case 'burn': return `${n} is burning for ${rounds} rounds.`;
        case 'bleed': return `${n} is bleeding for ${rounds} rounds.`;
        case 'sunder': return `${n} takes more damage for ${rounds} rounds.`;
        case 'interrupt': return `You break ${n}'s wind-up!`;
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
      case 'spellUp': return `Magic Power: your spells hit harder for ${rounds} rounds.`;
      case 'barrier': return `A barrier of ${rounds} forms round you.`;
      case 'evade': return `You slip into the shadows: the next ${rounds} ${rounds === 1 ? 'blow misses' : 'blows miss'}.`;
      case 'sureCrit': return `Your next ${rounds === 1 ? 'hit is a sure crit' : `${rounds} hits are sure crits`}.`;
      case 'companion': return `Your owl takes wing: it strikes at the end of every round for ${rounds} rounds.`;
      case 'windup': return `A star is called: it lands in ${rounds} rounds, whatever you do.`;
      case 'clone': return `A copy of you joins in for ${rounds} rounds.`;
      case 'guardian': return 'A last light stands over you.';
      case 'poison': return `You are poisoned for ${rounds} rounds.`;
      case 'weakened': return `You are weakened for ${rounds} rounds: your hits land softer.`;
      default: return '';
    }
  }

  /** A bolt of lightning down onto `at`: a jagged line drawn once and faded, until Mitch, AD's own clip (2026-11-03). */
  private bolt(at: { x: number; y: number }): void {
    const g = this.add.graphics().setDepth(20);
    const top = HUD_HEIGHT + 10;
    const points: { x: number; y: number }[] = [];
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const y = top + ((at.y - top) * i) / steps;
      points.push({ x: at.x + (i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 34), y });
    }
    for (const [width, color, alpha] of [[10, 0xfff3a0, 0.35], [4, 0xffffff, 1]] as const) {
      g.lineStyle(width, color, alpha);
      g.beginPath();
      g.moveTo(points[0]!.x, points[0]!.y);
      for (const p of points.slice(1)) g.lineTo(p.x, p.y);
      g.strokePath();
    }
    this.tweens.add({ targets: g, alpha: 0, duration: settings.ms(260), delay: settings.ms(60), onComplete: () => g.destroy() });
  }

  /** A blow landing: the figure blinks, the number floats up from its chest, a crit shakes the camera a little. */
  private flash(body: Body, damage: number, crit: boolean): void {
    const quick = !settings.ms(1);
    if (!quick) this.tweens.add({ targets: body, alpha: 0.25, duration: 80, yoyo: true, repeat: 1 });
    if (crit && !quick) this.cameras.main.shake(120, 0.004);
    const top = body instanceof Phaser.GameObjects.Arc ? body.y - 40 : body.y - body.displayHeight * 0.75;
    const number = this.add
      .text(body.x + 30, top, `-${damage}`, { fontFamily: FONT, fontSize: crit ? '32px' : '24px', fontStyle: 'bold', color: crit ? '#fff27a' : '#ffffff', stroke: '#1a2030', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(60); // over every figure: a big boss used to hide it
    // It stays to be read (Robin, 2026-11-02: "fades too quickly"), then rises away.
    this.tweens.add({ targets: number, y: top - 56, alpha: { value: 0, delay: settings.ms(1000), duration: settings.ms(600) || 1 }, duration: settings.ms(1600) || 1, ease: 'Sine.easeOut', onComplete: () => number.destroy() });
  }

  private say(text: string): void {
    if (!text) return;
    rememberMessage(text);
    const last = this.message.text;
    if (last && last !== text) {
      this.lines = [last];
      this.history.setText(last);
    }
    this.message.setFontSize(settings.font(15)).setText(text);
    if (this.message.height > 44) this.message.setFontSize(settings.font(13));
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    for (const b of this.buttons) b.setAlpha(busy ? 0.4 : b.alpha);
  }
}

/** Each of the Magician's damage spells by its element (Robin, 2026-11-03: "We need effects for spells"). */
const SPELL_ELEMENT: Record<string, 'arcane' | 'fire' | 'holy'> = {
  'arcane-bolt': 'arcane',
  fireball: 'fire',
  detonate: 'fire',
  'wiz-scorch': 'fire',
  'wiz-pillar': 'fire',
  'wiz-firestorm': 'fire',
  'wiz-phoenix': 'fire',
  smite: 'holy',
  'judgement-day': 'holy',
  'cle-lance': 'holy',
};
/** How a school looks: the flare at her hand, the bolt that flies and the burst where it lands (Mitch, AD's fx_spells). */
type SpellLook = { flare: string; bolt: string; burst: string; feet: boolean; sound: string };
const SPELL_LOOKS: Record<'arcane' | 'fire' | 'holy', SpellLook> = {
  arcane: { flare: 'arcane_flare', bolt: 'arcane_bolt', burst: 'arcane_burst', feet: false, sound: 'fight/impact-arcane' },
  fire: { flare: 'fire_flare', bolt: 'fire_bolt', burst: 'fire_burst', feet: false, sound: 'fight/impact-fire' },
  // Holy comes down as a beam on the foe's feet.
  holy: { flare: 'holy_flare', bolt: 'holy_bolt', burst: 'holy_burst', feet: true, sound: 'fight/impact-holy' },
};
const SPELL_BY_NAME = new Map(Object.entries(SPELL_ELEMENT).map(([id, el]) => [ABILITIES[id]?.name ?? id, el]));
/** The look of a hit's move when it is a spell, else null. */
function spellLook(move: string): SpellLook | null {
  const el = SPELL_BY_NAME.get(move);
  return el ? SPELL_LOOKS[el] : null;
}
