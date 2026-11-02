// The skill board (Robin, 2026-11-02: "the 4 main classes have their different things, and then you can specialize down"; "picking down three
// different trees"; the system is mine, in `rules/src/skills.ts`). After Mitch, AD's design: the four carried on a belt along the top, the
// class's own four, then its three trees side by side, read downwards, each node opening the next. One card at the bottom says what the tapped
// one does, with only the buttons that apply. In a town or a church, Reset gives every point back. Opened from the Hero sheet.

import Phaser from 'phaser';
import { ABILITIES, canLearn, CLASS_DATA, isOpen, MAX_CARRIED, pointsFree, specialization, type AbilityRank, type Action, type Character } from '../../../rules/src/index.ts';
import { abilityIcon, preloadAbilityIcons } from '../effects.ts';
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
const TREE_X = [80, 206, 332] as const;
const TREE_Y = 358;
const TREE_STEP = 47;
const NODE = 40;

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
  }

  create(): void {
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
      this.rows.push(pic.setAlpha(alpha));
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
    this.board(18, 116, 376, 44);
    this.wood(32, 138, title ? `${cls.name} · ${title}` : cls.name, 16).setOrigin(0, 0.5);
    const pill = this.add.graphics();
    pill.fillStyle(free > 0 ? GOLD : 0x3a2410, 1).fillRoundedRect(226, 125, 78, 26, 13);
    this.rows.push(pill);
    this.rows.push(this.add.text(265, 138, free === 1 ? '1 point' : `${free} points`, { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: free > 0 ? WOOD_INK : CREAM }).setOrigin(0.5));
    this.rows.push(makeButton(this, 350, 138, 76, 36, 'Back', COLORS.log, '15px', () => this.back()).button);

    // The belt: what goes into a fight.
    this.board(18, 164, 376, 62);
    this.wood(30, 176, `Carried\n${me.carried.length} of ${MAX_CARRIED}`, 11);
    for (let i = 0; i < MAX_CARRIED; i++) {
      const id = me.carried[i];
      const x = 137 + i * 68;
      if (kitReady(this)) this.rows.push(this.add.image(x, 195, KIT, id ? 'cubby_plain' : 'cubby_empty').setDisplaySize(46, 46));
      if (id) {
        this.icon(id, x, 195, 36, 1);
        const zone = this.add.zone(x, 195, 54, 54).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.tap(id));
        this.rows.push(zone);
      }
    }

    // The class's own four.
    this.board(18, 230, 376, 84);
    this.wood(30, 234, cls.name, 11);
    cls.core.forEach((id, i) => this.node(id, CLASS_X[i]!, 270, me));

    // The three trees, read downwards.
    this.board(18, 318, 376, 212);
    const trees = Object.values(cls.trees);
    const lines = this.add.graphics();
    lines.lineStyle(3, 0x3a2410, 0.75);
    this.rows.push(lines);
    trees.forEach((tree, col) => {
      const x = TREE_X[col]!;
      this.wood(x, 322, tree.name, 12).setOrigin(0.5, 0);
      lines.lineBetween(x, TREE_Y, x, TREE_Y + TREE_STEP * 3);
      tree.nodes.forEach((id, row) => this.node(id, x, TREE_Y + row * TREE_STEP, me));
    });

    this.card(me);
  }

  /** A slot: its cubby and icon, its rank's dots, a ring when carried, a + when a point can go here, the level when it is out of reach. */
  private node(id: string, cx: number, cy: number, me: Character): void {
    const a = ABILITIES[id]!;
    const rank = me.abilities[id] ?? 0;
    const open = isOpen(me, id);
    const can = canLearn(me, id);
    if (this.picked === id) {
      const glow = this.add.graphics();
      glow.fillStyle(GOLD, 1).fillRoundedRect(cx - NODE / 2 - 3, cy - NODE / 2 - 3, NODE + 6, NODE + 6, 9);
      this.rows.push(glow);
    }
    if (kitReady(this)) this.rows.push(this.add.image(cx, cy, KIT, rank ? 'cubby_plain' : 'cubby_empty').setDisplaySize(NODE, NODE));
    this.icon(id, cx, cy, 31, rank ? 1 : open ? 0.62 : 0.32);
    if (me.carried.includes(id)) {
      const ring = this.add.graphics();
      ring.lineStyle(2.5, GOLD, 1).strokeRoundedRect(cx - NODE / 2 + 2, cy - NODE / 2 + 2, NODE - 4, NODE - 4, 6);
      this.rows.push(ring);
    }
    if (a.ranks.length > 1 && rank > 0 && kitReady(this)) {
      for (let i = 0; i < a.ranks.length; i++) this.rows.push(this.add.image(cx - 8 + i * 8, cy + NODE / 2 + 2, KIT, i < rank ? 'pip_full' : 'pip_empty').setScale(7 / 24));
    }
    if (can) {
      const plus = this.add.graphics();
      plus.fillStyle(GOLD, 1).fillCircle(cx + NODE / 2 - 2, cy + NODE / 2 - 4, 8).lineStyle(1.5, 0x3a2410, 1).strokeCircle(cx + NODE / 2 - 2, cy + NODE / 2 - 4, 8);
      this.rows.push(plus);
      this.rows.push(this.add.text(cx + NODE / 2 - 2, cy + NODE / 2 - 5, '+', { fontFamily: FONT_DISPLAY, fontSize: '13px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5));
    }
    if (!rank && me.level < a.level) {
      this.rows.push(this.add.text(cx, cy + NODE / 2 - 3, `Lv ${a.level}`, { fontFamily: FONT, fontSize: '10px', fontStyle: 'bold', color: CREAM, backgroundColor: '#3a2410', padding: { x: 3, y: 0 } }).setOrigin(0.5));
    }
    const zone = this.add.zone(cx, cy, 58, 48).setInteractive({ useHandCursor: true });
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
    const y = 534;
    const cls = CLASS_DATA[me.classId]!;
    this.board(18, y, 376, 186);
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
      slip(y + 30, 148);
      const free = pointsFree(me);
      const line = free ? `You have ${free} to spend: a gold + marks where. Go down one tree, or a little down two.` : "Each level brings a point, every second level after ten, and a region's boss one more.";
      words(y + 37, [this.note, cls.about, cls.meter?.text ?? '', line].filter(Boolean).join('\n'), 12);
      const kind = this.game_.state.board.spaces[me.space]?.kind;
      if (kind === 'town' || kind === 'church') this.rows.push(makeButton(this, 332, y + 156, 96, 34, 'Reset all', 0xd9534f, '13px', () => this.send({ type: 'skill', op: 'reset' } as never, 'Every point is yours to spend again.')).button);
      return;
    }
    const rank = me.abilities[id] ?? 0;
    const meter = cls.meter?.name ?? 'meter';
    const cost = a.rule ? 'Always on' : [a.mana ? `${a.mana} mana` : '', a.meterAll ? `all ${meter}` : a.meter ? `${a.meter} ${meter}` : '', a.oncePerFight ? 'once a fight' : ''].filter(Boolean).join(', ') || 'Free';
    if (kitReady(this)) this.rows.push(this.add.image(53, y + 28, KIT, rank ? 'cubby_plain' : 'cubby_empty').setDisplaySize(46, 46));
    this.icon(id, 53, y + 28, 36, rank ? 1 : 0.62);
    this.wood(86, y + 7, a.name, 15);
    this.rows.push(this.add.text(86, y + 28, `${cost} · ${rank ? `rank ${rank} of ${a.ranks.length}` : `from level ${a.level}`}`, { fontFamily: FONT, fontSize: '11.5px', color: CREAM }));
    slip(y + 54, 90);
    const text = words(y + 60, a.text, 12.5);
    const now = rank && !a.rule ? rankLine(a.ranks[rank - 1]!) : '';
    const then = rank < a.ranks.length && !a.rule ? rankLine(a.ranks[rank]!) : '';
    let at = y + 60 + text.height + 3;
    const say = (label: string, line: string): void => {
      this.rows.push(this.add.text(38, at, label, { fontFamily: FONT, fontSize: '11.5px', fontStyle: 'bold', color: RUST }));
      this.rows.push(this.add.text(76, at, line, { fontFamily: FONT, fontSize: '11.5px', color: WOOD_INK, wordWrap: { width: 300 } }));
      at += 15;
    };
    if (this.note) say('', this.note);
    else {
      if (now) say('Now', now);
      if (then) say(rank ? 'Next' : 'First', then);
      if (!isOpen(me, id) && me.level >= a.level) say('Needs', 'the one above it in its tree.');
    }
    const can = canLearn(me, id);
    if (rank < a.ranks.length) {
      const b = makeButton(this, a.rule ? 206 : 121, y + 165, a.rule ? 220 : 186, 34, rank ? 'Raise' : 'Learn', can ? COLORS.button : COLORS.log, '15px', () => this.send({ type: 'skill', op: 'learn', ability: id } as never, ''));
      b.setEnabled(can && !this.inFlight);
      this.rows.push(b.button);
    }
    if (rank && !a.rule) {
      const carried = me.carried.includes(id);
      const b = makeButton(this, 303, y + 165, 162, 34, carried ? 'Put down' : 'Carry', COLORS.log, '15px', () => this.send({ type: 'skill', op: 'carry', ability: id } as never, ''));
      b.setEnabled((carried || me.carried.length < MAX_CARRIED) && !this.inFlight);
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
          sfx.play('ui/wear');
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
