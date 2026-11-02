// The skill board (Robin, 2026-11-02: the classes and their paths; the system is mine, in `rules/src/skills.ts`). One screen: the class's
// four abilities, its path's three, what the path does, the points free. Tap an ability: a card says what it does and offers what applies,
// Learn or Raise, Carry or Put down. Four are carried into a fight. In a town or a church, Reset gives every point back. Opened from the
// Hero sheet; its look is a first one until Mitch, AD has designed it.

import Phaser from 'phaser';
import { ABILITIES, abilitiesFor, canLearn, CLASS_DATA, MAX_CARRIED, PATH_LEVEL, pointsFree, type AbilityRank, type Action, type Character } from '../../../rules/src/index.ts';
import { abilityIcon, preloadAbilityIcons } from '../effects.ts';
import { feel, sfx } from '../feel.ts';
import type { GameHolder } from '../game-holder.ts';
import type { GameLog } from '../game-log.ts';
import { CREAM, KIT, kitReady, plate, sheet } from '../kit.ts';
import { COLORS, FONT, FONT_DISPLAY } from '../layout.ts';
import { makeButton } from '../ui.ts';

const WOOD_INK = '#3a2410';
const SLOT = 58;
const COLS = [28, 95, 162, 229, 296] as const;

/** The numbers worth showing on a rank. */
function rankLine(r: AbilityRank): string {
  const bits: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  if (r.power) bits.push(`${pct(r.power)} power${r.hits ? ` in ${r.hits} hits` : ''}`);
  if (r.healShare) bits.push(`heals ${pct(r.healShare)} of HP`);
  if (r.healDealt) bits.push(`heals ${pct(r.healDealt)} of the damage`);
  if (r.barrierShare) bits.push(`barrier of ${pct(r.barrierShare)} of HP`);
  if (r.selfHurt) bits.push(`costs ${pct(r.selfHurt)} of HP`);
  if (r.stun) bits.push(`stuns ${r.stun}`);
  if (r.evade) bits.push(`${r.evade} blows miss`);
  if (r.skip) bits.push(`${r.skip} turns lost`);
  if (r.attackUp) bits.push(`${pct(r.attackUp.mult - 1)} harder for ${r.attackUp.rounds} rounds`);
  if (r.regen) bits.push(`${pct(r.regen.share)} of HP a round for ${r.regen.rounds}`);
  if (r.infuse) bits.push(`${pct(r.infuse.power)} harder for ${r.infuse.rounds} rounds`);
  if (r.dance) bits.push(`${pct(r.dance.chance)} dodge for ${r.dance.rounds} rounds`);
  if (r.coat) bits.push(`${r.coat.hits} poisoned hits`);
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
  private pathPick: string | null = null;
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
    this.pathPick = null;
    this.note = '';
    this.rows = [];
    sheet(this);
    this.refresh();
    this.log.note('skills open');
  }

  private board(x: number, y: number, w: number, h: number): Phaser.GameObjects.GameObject {
    const b = kitReady(this) ? plate(this, 'board_plain', x, y, w, h).setOrigin(0, 0) : this.add.rectangle(x, y, w, h, COLORS.panel, 1).setOrigin(0, 0);
    this.rows.push(b);
    return b;
  }

  private text(x: number, y: number, s: string, size: number, wood = true, wrap = 0): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, s, wood
      ? { fontFamily: FONT_DISPLAY, fontSize: `${size}px`, fontStyle: 'bold', color: CREAM, stroke: WOOD_INK, strokeThickness: Math.min(4, size / 4), wordWrap: wrap ? { width: wrap } : undefined }
      : { fontFamily: FONT, fontSize: `${size}px`, color: WOOD_INK, wordWrap: wrap ? { width: wrap } : undefined });
    this.rows.push(t);
    return t;
  }

  private refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const me = this.game_.me;
    const cls = CLASS_DATA[me.classId]!;
    const free = pointsFree(me);
    const path = me.path ? cls.paths[me.path] : null;

    // The header.
    this.board(18, 116, 376, 44);
    this.text(32, 138, path ? `${cls.name} · ${path.name}` : cls.name, 18).setOrigin(0, 0.5);
    this.rows.push(makeButton(this, 346, 137, 76, 36, 'Back', COLORS.log, '15px', () => this.back()).button);
    this.text(258, 138, free === 1 ? '1 point' : `${free} points`, 14).setOrigin(0.5).setColor(free > 0 ? '#ffd166' : CREAM);

    // The class's four.
    this.board(18, 164, 376, 112);
    this.text(32, 172, cls.name, 13);
    this.text(380, 172, `carried ${me.carried.length} of ${MAX_CARRIED}`, 12).setOrigin(1, 0);
    cls.core.forEach((id, i) => this.slot(id, COLS[i]!, 196, me));

    // The path.
    this.board(18, 280, 376, 136);
    if (path) {
      this.text(32, 288, path.name, 13);
      this.text(32, 306, path.passiveText, 11, true, 348);
      path.abilities.forEach((id, i) => this.slot(id, COLS[i]!, 336, me));
    } else {
      this.text(32, 288, me.level >= PATH_LEVEL ? 'Choose your path' : `Your path comes at level ${PATH_LEVEL}`, 13);
      Object.entries(cls.paths).forEach(([id, p], i) => {
        const y = 312 + i * 34;
        const chosen = this.pathPick === id;
        this.rows.push(plate(this, chosen ? 'chip_chosen' : 'chip_idle', 206, y + 13, 352, 30));
        const name = this.add.text(42, y + 12, p.name, { fontFamily: FONT_DISPLAY, fontSize: '14px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0, 0.5);
        this.rows.push(name);
        this.rows.push(this.add.text(136, y + 12, p.text, { fontFamily: FONT, fontSize: '11px', color: WOOD_INK, wordWrap: { width: 244 } }).setOrigin(0, 0.5));
        const zone = this.add.zone(206, y + 13, 352, 32).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => {
          this.pathPick = id;
          this.picked = null;
          this.note = '';
          sfx.play('ui/chip');
          this.refresh();
        });
        this.rows.push(zone);
      });
    }

    this.card(me);
  }

  /** An ability's slot: its icon, its rank's dots, a gold edge when carried, dim until known. */
  private slot(id: string, x: number, y: number, me: Character): void {
    const a = ABILITIES[id]!;
    const rank = me.abilities[id] ?? 0;
    const carried = me.carried.includes(id);
    const cx = x + SLOT / 2;
    const cy = y + 24;
    if (kitReady(this)) this.rows.push(this.add.image(cx, cy, KIT, rank ? 'cubby_plain' : 'cubby_empty').setDisplaySize(46, 46));
    const pic = abilityIcon(this, id, cx, cy, 34);
    if (pic) this.rows.push(pic.setAlpha(rank ? 1 : 0.45));
    else this.rows.push(this.add.text(cx, cy, a.name.charAt(0), { fontFamily: FONT_DISPLAY, fontSize: '22px', fontStyle: 'bold', color: WOOD_INK }).setOrigin(0.5).setAlpha(rank ? 1 : 0.45));
    if (carried && kitReady(this)) this.rows.push(this.add.image(cx, cy, KIT, 'cubby_chosen').setDisplaySize(50, 50).setTint(0xffe9a0));
    if (this.picked === id && kitReady(this)) this.rows.push(this.add.image(cx, cy, KIT, 'cubby_chosen').setDisplaySize(52, 52));
    for (let i = 0; i < a.ranks.length; i++) {
      this.rows.push(this.add.image(cx - 12 + i * 12, cy + 30, KIT, i < rank ? 'pip_full' : 'pip_empty').setScale(10 / 24));
    }
    if (canLearn(me, id)) this.rows.push(this.text(cx + 20, cy - 26, '+', 16).setOrigin(0.5).setColor('#ffd166'));
    const zone = this.add.zone(cx, cy + 4, SLOT + 6, 62).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => {
      this.picked = id;
      this.pathPick = null;
      this.note = '';
      feel.buzz();
      sfx.play('ui/chip');
      this.refresh();
    });
    this.rows.push(zone);
  }

  private card(me: Character): void {
    const y = 420;
    this.board(18, y, 376, 300);
    const cls = CLASS_DATA[me.classId]!;
    const slip = (top: number, h: number): void => {
      if (kitReady(this)) this.rows.push(plate(this, 'board_slip', 30, top, 352, h).setOrigin(0, 0));
    };
    const reset = (): void => {
      const kind = this.game_.state.board.spaces[me.space]?.kind;
      if (kind === 'town' || kind === 'church') this.rows.push(makeButton(this, 332, y + 276, 100, 36, 'Reset all', 0xd9534f, '13px', () => this.send({ type: 'skill', op: 'reset' } as never, 'Every point is yours to spend again.')).button);
    };
    if (this.pathPick) {
      const p = cls.paths[this.pathPick]!;
      this.text(34, y + 12, p.name, 18);
      slip(y + 40, 188);
      this.text(42, y + 50, `${p.text}\n\nAlways: ${p.passiveText}\n\n${p.abilities.map((id) => `${ABILITIES[id]!.name}, level ${ABILITIES[id]!.level}`).join('\n')}`, 13, false, 330);
      if (me.level >= PATH_LEVEL) {
        const id = this.pathPick;
        this.rows.push(makeButton(this, 206, y + 256, 220, 44, `Be a ${p.name}`, COLORS.button, '17px', () => this.send({ type: 'skill', op: 'path', path: id } as never, `You walk the ${p.name}'s path.`)).button);
      }
      return;
    }
    const id = this.picked;
    const a = id ? ABILITIES[id] : null;
    if (!id || !a) {
      const free = pointsFree(me);
      this.text(34, y + 12, this.note ? 'Done' : 'Your skills', 18);
      slip(y + 40, 188);
      const lines = [this.note, cls.about, cls.meter ? cls.meter.text : '', free ? `You have ${free} to spend: a gold + marks what you can learn.` : 'Each level brings a point, every second level after ten, and a region\'s boss one more.', 'Tap an ability to see it.'].filter(Boolean);
      this.text(42, y + 50, lines.join('\n\n'), 13, false, 330);
      reset();
      return;
    }
    const rank = me.abilities[id] ?? 0;
    const meter = cls.meter?.name ?? 'meter';
    const cost = [a.mana ? `${a.mana} mana` : '', a.meterAll ? `all ${meter}` : a.meter ? `${a.meter} ${meter}` : '', a.oncePerFight ? 'once a fight' : ''].filter(Boolean).join(', ') || 'free';
    this.text(34, y + 12, a.name, 18);
    this.text(380, y + 16, rank ? `rank ${rank} of ${a.ranks.length}` : `from level ${a.level}`, 12).setOrigin(1, 0);
    slip(y + 40, 188);
    const now = rank ? rankLine(a.ranks[rank - 1]!) : '';
    const then = rank < a.ranks.length ? rankLine(a.ranks[rank]!) : '';
    const lines = [this.note, a.text, `Costs ${cost}.`, now ? `Now: ${now}.` : '', then ? `${rank ? 'Next rank' : 'First rank'}: ${then}.` : ''].filter(Boolean);
    this.text(42, y + 50, lines.join('\n\n'), 13, false, 330);
    const can = canLearn(me, id);
    if (rank < a.ranks.length) {
      const b = makeButton(this, 130, y + 256, 180, 44, rank ? 'Raise' : 'Learn', COLORS.button, '17px', () => this.send({ type: 'skill', op: 'learn', ability: id } as never, ''));
      b.setEnabled(can && !this.inFlight);
      this.rows.push(b.button);
    }
    if (rank) {
      const carried = me.carried.includes(id);
      const b = makeButton(this, 318, y + 256, 130, 44, carried ? 'Put down' : 'Carry', COLORS.log, '15px', () => this.send({ type: 'skill', op: 'carry', ability: id } as never, ''));
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
          if ('path' in intent || intent.op === 'reset') {
            this.picked = null;
            this.pathPick = null;
          }
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
