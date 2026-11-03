// The skill board (Robin, 2026-11-02: "the 4 main classes have their different things, and then you can specialize down"; "think like how wow classic does it, where you mainly go down one tree, and take some in the others"; "I liked the old talents trees, i just wanted more talents, abilities and longer talent trees"; the system is in `rules/src/skills.ts`). After Mitch, AD's design: the five carried on a belt along the top, the
// class's own four, then its three trees side by side, read downwards, a branch through their tiers, gold as far as you have gone. One card at the bottom says what the tapped
// one does, with only the buttons that apply. In a town or a church, Reset gives every point back. Opened from the Hero sheet.

import Phaser from 'phaser';
import { ABILITIES, manaCost, canLearn, CLASS_DATA, isOpen, MAX_CARRIED, pointsFree, specialization, type AbilityRank, type Action, type Character, carriedLimit, needsFor, TIER_POINTS } from '../../../rules/src/index.ts';
import { abilityIcon, freeTalentIconsAfter, preloadAbilityIcons, preloadTalentIcons } from '../effects.ts';
import { feel, sfx } from '../feel.ts';
import type { GameHolder } from '../game-holder.ts';
import type { GameLog } from '../game-log.ts';
import { CREAM, KIT, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const RUST = '#a23c2c';
const GOLD = 0xf4c14a;
const CLASS_X = [66, 159, 252, 345] as const;
const TREE_X = [84, 206, 328] as const;
const FIRST_TIER = 354;
const TIER_H = 39;
const COLUMN_W = 114;
const COLUMN_TOP = 306;
const COLUMN_H = 340;
/** How far either side of its branch a talent stands. */
const TWIG = 27;
const NODE = 40;
const TREE_NODE = 34;
/** The capstone at a tree's foot stands larger. */
const SIGNATURE = 40;
/** The card, below the board. */
const CARD_Y = 656;

/** The numbers worth showing on a rank. */
function rankLine(r: AbilityRank): string {
  const bits: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  if (r.power) bits.push(`${pct(r.power)} power${r.hits ? ` in ${r.hits} hits` : ''}`);
  if (r.perHeldMeter) bits.push(`+${pct(r.perHeldMeter)} a point held`);
  if (r.perMeter) bits.push(`+${pct(r.perMeter)} a point spent`);
  if (r.manaPower) bits.push(`up to +${pct(r.manaPower)} with full mana`);
  if (r.missingPower) bits.push(`up to +${pct(r.missingPower)} near the end`);
  if (r.windupBonus) bits.push(`${pct(r.windupBonus)} on a wind-up`);
  if (r.executePower) bits.push(`${pct(r.executePower)} when it is low`);
  if (r.healedPower) bits.push(`+${pct(r.healedPower)} of all healed`);
  if (r.healShare) bits.push(`heals ${pct(r.healShare)} of HP`);
  if (r.healDealt) bits.push(`heals ${pct(r.healDealt)} of the damage`);
  if (r.barrierShare) bits.push(`barrier of ${pct(r.barrierShare)} of HP`);
  if (r.selfHurt) bits.push(`costs ${pct(r.selfHurt)} of HP`);
  if (r.guardian) bits.push(`stand up with ${pct(r.guardian)} of HP`);
  if (r.consume) bits.push(`${pct(r.consume.mult)} of what is left`);
  if (r.stun) bits.push(`stuns ${r.stun}`);
  if (r.evade) bits.push(`${r.evade} blows miss`);
  if (r.skip) bits.push(`${r.skip} turns lost`);
  if (r.attackUp) bits.push(`${pct(r.attackUp.mult - 1)} harder for ${r.attackUp.rounds} rounds`);
  if (r.regen) bits.push(`${pct(r.regen.share)} of HP a round for ${r.regen.rounds}`);
  if (r.infuse) bits.push(`${pct(r.infuse.power)} harder for ${r.infuse.rounds} rounds`);
  if (r.dance) bits.push(`${pct(r.dance.chance)} dodge for ${r.dance.rounds} rounds`);
  if (r.coat) bits.push(`${r.coat.hits} poisoned hits`);
  if (r.clone) bits.push(`${pct(r.clone.power)} again for ${r.clone.rounds} rounds`);
  if (r.companion) bits.push(`${r.companion.rounds} rounds of owl`);
  if (r.mark) bits.push(`next ${r.mark.hits} hits ${pct(r.mark.mult - 1)} harder`);
  if (r.counterUp) bits.push(`${pct(r.counterUp.chance)} more counters for ${r.counterUp.rounds} rounds`);
  if (r.thornsUp) bits.push(`${pct(r.thornsUp.share)} sent back for ${r.thornsUp.rounds} rounds`);
  if (r.blockUp) bits.push(`Block lets ${pct(r.blockUp.mult)} through for ${r.blockUp.rounds} rounds`);
  if (r.spike) bits.push(`${r.spike.rounds} rounds of spikes`);
  return bits.slice(0, 2).join(', ');
}

export class SkillsScene extends Phaser.Scene {
  private readonly game_: GameHolder;
  private readonly log: GameLog;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private picked: string | null = null;
  private note = '';
  private inFlight = false;

  constructor(deps: { game: GameHolder; log: GameLog }) {
    super('skills');
    this.game_ = deps.game;
    this.log = deps.log;
  }

  preload(): void {
    preloadAbilityIcons(this);
    preloadTalentIcons(this);
  }

  create(): void {
    freeTalentIconsAfter(this);
    this.picked = null;
    this.note = '';
    this.rows = [];
    sheet(this);
    this.refresh();
    this.log.note('skills open');
  }

  private board(x: number, y: number, w: number, h: number): void {
    this.rows.push(kitReady(this) ? plate(this, 'board_plain', x, y, w, h).setOrigin(0, 0) : this.add.rectangle(x, y, w, h, COLORS.panel, 1).setOrigin(0, 0));
  }

  private wood(x: number, y: number, s: string, size: number, wrap = 0): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, s, { fontFamily: FONT_DISPLAY, fontSize: `${size}px`, fontStyle: 'bold', color: CREAM, stroke: WOOD_INK, strokeThickness: Math.min(3.5, size / 4), wordWrap: wrap ? { width: wrap } : undefined });
    this.rows.push(t);
    return t;
  }

  /** The icon of an ability; a rule shows the star, and anything without art its first letter. */
  private icon(id: string, x: number, y: number, size: number, alpha: number): void {
    const pic = abilityIcon(this, id, x, y, size);
    if (pic) {
      // A crest has no cubby behind it: dimmed by tint, or the branch would show through.
      if (ABILITIES[id]?.rule && alpha < 1) {
        const v = Math.round(255 * alpha);
        pic.setTint((v << 16) | (v << 8) | v);
      } else pic.setAlpha(alpha);
      this.rows.push(pic);
      return;
    }
    if (ABILITIES[id]?.rule && kitReady(this)) {
      const star = this.add.image(x, y, KIT, 'mark_star').setAlpha(alpha);
      this.rows.push(star.setScale((size * 0.8) / star.width));
      return;
    }
    this.rows.push(this.add.text(x, y, ABILITIES[id]?.name.charAt(0) ?? '?', { fontFamily: FONT_DISPLAY, fontSize: `${Math.round(size * 0.6)}px`, fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5).setAlpha(alpha));
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    const cls = CLASS_DATA[me.classId]!;
    const free = pointsFree(me);
    const title = specialization(me);

    // The header: the title, the points, the way back.
    this.board(18, 116, 376, 40);
    this.wood(32, 136, title ? `${cls.name} · ${title}` : cls.name, 16).setOrigin(0, 0.5);
    const pill = this.add.graphics();
    pill.fillStyle(free > 0 ? GOLD : 0x3a2410, 1).fillRoundedRect(226, 123, 78, 26, 13);
    this.rows.push(pill);
    this.rows.push(this.add.text(265, 136, free === 1 ? '1 point' : `${free} points`, { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: free > 0 ? WOOD_INK : CREAM }).setOrigin(0.5));
    this.rows.push(makeButton(this, 350, 136, 76, 36, 'Back', COLORS.log, '15px', () => this.back()).button);

    // The belt: what goes into a fight.
    this.board(18, 160, 376, 58);
    const limit = carriedLimit(me.level);
    this.wood(30, 172, `Carried\n${me.carried.length} of ${limit}`, 11);
    for (let i = 0; i < MAX_CARRIED; i++) {
      const id = me.carried[i];
      const x = 128 + i * 56;
      if (i >= limit) this.rows.push(this.add.text(x, 203, 'Lv 15', { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: CREAM, backgroundColor: '#3a2410', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(2));
      if (kitReady(this)) this.rows.push(this.add.image(x, 189, KIT, id ? 'cubby_plain' : 'cubby_empty').setDisplaySize(44, 44));
      if (id) {
        this.icon(id, x, 189, 36, 1);
        const zone = this.add.zone(x, 189, 54, 54).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.tap(id));
        this.rows.push(zone);
      }
    }

    // The class's own four.
    this.board(18, 222, 376, 74);
    cls.core.forEach((id, i) => this.node(id, CLASS_X[i]!, 257, me));

    // The three trees, read downwards (Mitch, AD's layout): a dark column each, the name on a slip at its crown, a branch down through its
    // tiers, gold as far as you have gone, with a leaf at each lit joint. Each tier stands either side of the branch, the capstone on it.
    this.board(18, 300, 376, 350);
    Object.values(cls.trees).forEach((tree, col) => {
      const x = TREE_X[col]!;
      const spent = tree.nodes.reduce((sum, id) => sum + (me.abilities[id] ?? 0), 0);
      const column = this.add.graphics();
      column.fillStyle(0x7a5030, 1).fillRoundedRect(x - COLUMN_W / 2, COLUMN_TOP, COLUMN_W, COLUMN_H, 8).lineStyle(1.5, 0x6a4628, 1).strokeRoundedRect(x - COLUMN_W / 2, COLUMN_TOP, COLUMN_W, COLUMN_H, 8);
      this.rows.push(column);
      if (kitReady(this)) this.rows.push(plate(this, 'board_slip', x, 321, 104, 22));
      this.rows.push(this.add.text(x, 320, `${tree.name} ${spent}`, { fontFamily: FONT_DISPLAY, fontSize: tree.name.length > 9 ? '11px' : '12px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5));
      const branch = this.add.graphics();
      this.rows.push(branch);
      // From the slip's foot down, each stretch bending a little to alternate sides; gold where the tier at its lower end is open.
      tree.tiers.forEach((row, tier) => {
        const from = tier === 0 ? 332 : FIRST_TIER + (tier - 1) * TIER_H;
        const to = FIRST_TIER + tier * TIER_H;
        const lit = spent >= tier * TIER_POINTS;
        const bend = x + (tier % 2 ? 3 : -3);
        const mid = (from + to) / 2;
        const points = [new Phaser.Math.Vector2(x, from), new Phaser.Math.Vector2(bend, mid), new Phaser.Math.Vector2(x, to)];
        branch.lineStyle(6.4, 0x2a1a0c, 1).strokePoints(points);
        branch.lineStyle(3.6, lit ? GOLD : 0x6a4630, 1).strokePoints(points);
        if (lit && tier > 0) branch.fillStyle(0x7ccf6a, 1).fillEllipse(bend + 6, mid, 9, 5);
      });
      tree.tiers.forEach((row, tier) => {
        const y = FIRST_TIER + tier * TIER_H;
        row.forEach((id, i) => this.node(id, row.length === 1 ? x : x + (i ? TWIG : -TWIG), y, me, row.length === 1 ? SIGNATURE : TREE_NODE, false));
        const need = ABILITIES[row[0]!]!.level;
        if (me.level < need) this.rows.push(this.add.text(x, row.length === 1 ? y + SIGNATURE / 2 - 3 : y, `${need}`, { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: CREAM, backgroundColor: '#3a2410', padding: { x: 3, y: 1 } }).setOrigin(0.5));
      });
    });

    this.card(me);
  }

  /** A slot: its cubby and icon, its rank's dots, a ring when carried, a + when a point can go here, the level when it is out of reach. */
  private node(id: string, cx: number, cy: number, me: Character, size = NODE, levelTag = true): void {
    const a = ABILITIES[id]!;
    const rank = me.abilities[id] ?? 0;
    const open = isOpen(me, id);
    const can = canLearn(me, id);
    if (this.picked === id) {
      const glow = this.add.graphics();
      glow.fillStyle(GOLD, 1).fillRoundedRect(cx - size / 2 - 3, cy - size / 2 - 3, size + 6, size + 6, 9);
      this.rows.push(glow);
    }
    // A rule is a crest on the branch, not a slot: something you are, not something you press.
    if (kitReady(this) && !a.rule) this.rows.push(this.add.image(cx, cy, KIT, rank ? 'cubby_plain' : 'cubby_empty').setDisplaySize(size, size));
    this.icon(id, cx, cy, a.rule ? size + 2 : size - 8, rank ? 1 : open ? 0.76 : a.rule ? 0.58 : 0.4);
    if (me.carried.includes(id)) {
      const ring = this.add.graphics();
      ring.lineStyle(2.5, GOLD, 1).strokeRoundedRect(cx - size / 2 + 2, cy - size / 2 + 2, size - 4, size - 4, 6);
      this.rows.push(ring);
    }
    if (a.ranks.length > 1 && rank > 0 && kitReady(this)) {
      for (let i = 0; i < a.ranks.length; i++) this.rows.push(this.add.image(cx + (i - (a.ranks.length - 1) / 2) * 7, cy + size / 2, KIT, i < rank ? 'pip_full' : 'pip_empty').setScale(7.5 / 24));
    }
    if (can && kitReady(this)) this.rows.push(this.add.image(cx + size / 2 - 2, cy + size / 2 - 4, KIT, 'badge_plus').setDisplaySize(17, 17));
    if (levelTag && !rank && me.level < a.level) {
      this.rows.push(this.add.text(cx, cy + size / 2 - 3, `Lv ${a.level}`, { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: CREAM, backgroundColor: '#3a2410', padding: { x: 3, y: 0 } }).setOrigin(0.5));
    }
    const zone = this.add.zone(cx, cy, size + 14, size + 5).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this.tap(id));
    this.rows.push(zone);
  }

  private tap(id: string): void {
    this.picked = id;
    this.note = '';
    feel.buzz();
    sfx.play('ui/chip');
    this.refresh();
  }

  private card(me: Character): void {
    const y = CARD_Y;
    const cls = CLASS_DATA[me.classId]!;
    this.board(18, y, 376, 164);
    const slip = (top: number, h: number): void => {
      if (kitReady(this)) this.rows.push(plate(this, 'board_slip', 28, top, 356, h).setOrigin(0, 0));
    };
    const words = (top: number, s: string, size = 13, color = WOOD_INK): Phaser.GameObjects.Text => {
      const t = this.add.text(38, top, s, { fontFamily: FONT, fontSize: `${size}px`, color, wordWrap: { width: 336 } });
      this.rows.push(t);
      return t;
    };
    const id = this.picked;
    const a = id ? ABILITIES[id] : null;
    if (!id || !a) {
      this.wood(30, y + 8, this.note ? 'Done' : 'Your skills', 15);
      slip(y + 28, 128);
      const free = pointsFree(me);
      const line = free ? `You have ${free} to spend: a gold + marks where. Go mainly down one tree, and take some from the others.` : 'A point comes with each level. Each tier of a tree asks for 3 more points in that tree.';
      words(y + 33, [this.note, cls.about, cls.meter?.text ?? '', line].filter(Boolean).join('\n'), 12);
      const kind = this.game_.state.board.spaces[me.space]?.kind;
      if (kind === 'town' || kind === 'church') this.rows.push(makeButton(this, 332, y + 136, 96, 34, 'Reset all', 0xd9534f, '13px', () => this.send({ type: 'skill', op: 'reset' } as never, 'Every point is yours to spend again.')).button);
      return;
    }
    const rank = me.abilities[id] ?? 0;
    const meter = cls.meter?.name ?? 'meter';
    const cost = a.rule ? 'Always on' : [a.mana ? `${manaCost(this.game_.me, id)} mana` : '', a.meterAll ? `all ${meter}` : a.meter ? `${a.meter} ${meter}` : '', a.oncePerFight ? 'once a fight' : ''].filter(Boolean).join(', ') || 'Free';
    if (kitReady(this)) this.rows.push(this.add.image(53, y + 28, KIT, rank ? 'cubby_plain' : 'cubby_empty').setDisplaySize(46, 46));
    this.icon(id, 53, y + 28, 36, rank ? 1 : 0.62);
    this.wood(86, y + 7, a.name, 15);
    this.rows.push(this.add.text(86, y + 28, `${cost} · ${rank ? `rank ${rank} of ${a.ranks.length}` : `from level ${a.level}`}`, { fontFamily: FONT, fontSize: '11.5px', color: CREAM }));
    const locked = !isOpen(me, id);
    slip(y + 52, locked ? 106 : 80);
    const text = words(y + 56, a.text, 12);
    const now = rank && !a.rule ? rankLine(a.ranks[rank - 1]!) : '';
    const then = rank < a.ranks.length && !a.rule ? rankLine(a.ranks[rank]!) : '';
    let at = y + 56 + text.height + 2;
    const say = (label: string, line: string): void => {
      const word = this.add.text(38, at, label, { fontFamily: FONT, fontSize: '11.5px', fontStyle: 'bold', color: RUST });
      this.rows.push(word);
      const said = this.add.text(Math.max(76, 38 + word.width + 6), at, line, { fontFamily: FONT, fontSize: '11.5px', color: WOOD_INK, wordWrap: { width: 296 } });
      this.rows.push(said);
      at += Math.max(15, said.height);
    };
    if (this.note) say('', this.note);
    else {
      if (now) say('Now', now);
      if (then) say(rank ? 'Next' : 'First', then);
      if (locked) {
        const need = needsFor(me, id);
        say('Needs', [need.level > 0 ? `level ${a.level}` : '', need.points > 0 ? `${need.points} more in this tree` : ''].filter(Boolean).join(', '));
      }
    }
    const can = canLearn(me, id);
    if (!locked && rank < a.ranks.length) {
      const b = makeButton(this, a.rule ? 206 : 121, y + 149, a.rule ? 220 : 186, 30, rank ? 'Raise' : 'Learn', can ? COLORS.button : COLORS.log, '15px', () => this.send({ type: 'skill', op: 'learn', ability: id } as never, ''));
      b.setEnabled(can && !this.inFlight);
      this.rows.push(b.button);
    }
    if (rank && !a.rule) {
      const carried = me.carried.includes(id);
      const b = makeButton(this, 303, y + 149, 162, 30, carried ? 'Put down' : 'Carry', COLORS.log, '15px', () => this.send({ type: 'skill', op: 'carry', ability: id } as never, ''));
      b.setEnabled((carried || me.carried.length < carriedLimit(me.level)) && !this.inFlight);
      this.rows.push(b.button);
    }
  }

  private send(intent: Omit<Extract<Action, { type: 'skill' }>, 'id' | 'player'>, done: string): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.game_.act({ ...intent, player: this.game_.player } as never).then(
      (events) => {
        this.inFlight = false;
        const rejected = events.find((e) => e.type === 'rejected');
        if (rejected?.type === 'rejected') this.note = `Not now: ${rejected.reason}.`;
        else {
          this.note = done;
          // Learning or raising a skill is the trainer's sound; carrying one, the plain one.
          sfx.play(intent.op === 'learn' ? 'ui/trainer' : 'ui/wear');
          feel.buzz();
          if (intent.op === 'reset') this.picked = null;
        }
        this.refresh();
      },
      (e: unknown) => {
        this.inFlight = false;
        this.log.error(`skill action failed: ${String(e)}`);
        this.note = 'No answer from the world. Try again.';
        this.refresh();
      },
    );
  }

  private back(): void {
    this.scene.stop();
    this.scene.launch('bag');
  }
}
