// The fight (Robin, 2026-10-31): a turn-based RPG. The player attacks, casts an ability, charges, drinks a potion or
// runs; then chooses a guard; then the enemy moves, with wind-ups to read and a stun, a poison or a weakening to
// suffer. Every number comes from the stream. Later the same day (Robin): class kits that feel different, in the hand
// (the meters: Valor, Mischief, Arcana, Aim; the abilities that spend them), enemies whose next move is shown a round ahead
// with effects the guard has to read, bosses with a second phase, and uniques whose powers bend the rules. The moves,
// the guards and all the numbers are mine, first settings.

import { noteBeaten } from './journal.ts';
import { carriedLimit, pointsForLevel, pointsFree, traitsOf } from './skills.ts';
import { ABILITIES, CLASS_DATA, ENEMIES, GEAR, ITEMS, ITEM_IDS, PROGRESSION, SPACE_KIND_DATA, ARENA } from './data.ts';
import { flaskId, addLoot, gainXp, giveItem, heal, nextGearId, reject, restoreMana, spend, withCharacter, softcap } from './common.ts';
import { powers, rollGear, rollUnique, stats, type Stats } from './gear.ts';
import { growBoard } from './generate.ts';
import { nearestTown } from './paths.ts';
import type { Rng } from './rng.ts';
import { dropSlot, groundAt, rollLine } from './grounds.ts';
import { finishQuests, questProgress } from './quests.ts';
import { SLOTS, type Action, type ApplyResult, type Character, type Enemy, type EnemyData, type EnemyMove, type Fight, type GameEvent, type GameState, type Guard, type Spawn } from './types.ts';

type FightAction = Extract<Action, { type: 'fight' }>;

/** The enemy's effects on the player, first settings (mine). */
const EFFECTS = {
  poison: { rounds: 3, power: 0.25 },
  drain: 6,
  armour: { rounds: 2, mult: 1.5 },
  heal: 0.1,
  weaken: { rounds: 2, mult: 0.7 },
  /** How long Frostbrand's chill and Venomtooth's poison last. */
  frostbrand: 1,
  venom: 2,
  phoenixMs: 1_800_000,
  secondWindBelow: 0.25,
} as const;

/** A creature's data: the hand-laid ones from enemies.json, the grown ones from the board's bestiary. */
export function creature(id: string, bestiary: Record<string, EnemyData> = {}): EnemyData | undefined {
  return ENEMIES[id] ?? bestiary[id];
}

/** An enemy fresh from the data, ready to fight. */
export function makeEnemy(id: string, bestiary: Record<string, EnemyData> = {}): Enemy {
  const d = creature(id, bestiary);
  if (!d) throw new Error(`no such enemy: ${id}`);
  return {
    id,
    name: d.name,
    level: d.level,
    role: d.role,
    hp: d.hp,
    maxHp: d.hp,
    attack: d.attack,
    defense: d.defense,
    xp: d.xp,
    gold: d.gold,
    moves: d.moves.map((m) => ({ ...m })),
    charged: null,
    stunned: 0,
    weakened: null,
    poison: null,
    next: null,
    armoured: null,
    evade: 0,
    phase: 1,
    phase2: d.phase2 ? { at: d.phase2.at, text: d.phase2.text, moves: d.phase2.moves.map((m) => ({ ...m })) } : null,
  };
}

/** What a fight leaves on you when it ends with you standing (Robin, 2026-11-01): poison goes on stinging for twice its rounds in rolls, weakness into the next fight. */
function lingering(c: Character, f: Fight): Character {
  const ailments = { ...(c.ailments ?? {}) };
  if (f.poisoned) ailments.poison = { rolls: f.poisoned.rounds * 2, damage: f.poisoned.damage };
  if (f.weak) ailments.weak = { ...f.weak };
  return { ...c, ailments };
}

/** A fight with nothing on either side yet. */
export function freshFight(enemy: Enemy, space: string, spawn: boolean): Fight {
  return { enemy, round: 1, charged: false, attackUp: null, barrier: 0, evade: 0, space, spawn, meter: 0, strikes: 0, sureCrit: 0, windup: null, companion: null, mark: null, trap: 0, skip: 0, streak: 0, nextSpell: 0, regen: null, infuse: null, dance: null, coat: null, blockUp: null, thornsUp: null, counterUp: null, spike: null, clone: null, guardian: 0, healed: 0, poisoned: null, weak: null, used: [] };
}

/**
 * The character squared up to the enemy on this space. With a stream, the enemy's first move is chosen now and shown;
 * Windstep's step aside is taken.
 */
export function startFight(c: Character, enemyId: string, space: string, spawn: boolean, bestiary: Record<string, EnemyData> = {}, rng?: Rng): Character {
  const fight = freshFight(makeEnemy(enemyId, bestiary), space, spawn);
  const p = powers(c);
  const talents = traitsOf(c);
  if (talents.barrierStart) fight.barrier += Math.round(stats(c).maxHp * talents.barrierStart);
  if (talents.meterStart) fight.meter += talents.meterStart;
  if (p.windstep) fight.evade += p.windstep;
  if (rng) fight.enemy.next = pickMove(fight.enemy, rng);
  // Weakness carried from the last fight takes hold here, and is used up by it.
  const { weak, ...others } = c.ailments ?? {};
  if (weak) fight.weak = { ...weak };
  return { ...c, fight, ailments: others };
}

/** One blow: the swing then the crit from the stream. `attack` is the striker's effective attack; `base` is the damage before the crit. */
function blow(attack: number, power: number, defense: number, critChance: number, rng: Rng): { damage: number; base: number; crit: boolean } {
  const base = Math.max(1, Math.round(attack * power) - Math.floor(defense / 2));
  const swing = rng.int(5) - 3;
  const crit = rng.next() < critChance;
  const plain = Math.max(1, base + swing);
  return { damage: Math.max(1, Math.round(plain * (crit ? PROGRESSION.critPower : 1))), base: plain, crit };
}

/** The enemy's move for a round, by weight; a wind-up is never picked twice in a row. */
export function pickMove(enemy: Enemy, rng: Rng): EnemyMove {
  const pool = enemy.charged ? enemy.moves.filter((m) => !m.charge) : enemy.moves;
  const moves = pool.length ? pool : enemy.moves;
  const total = moves.reduce((sum, m) => sum + m.weight, 0);
  let pick = rng.next() * total;
  for (const m of moves) {
    pick -= m.weight;
    if (pick < 0) return m;
  }
  return moves[moves.length - 1]!;
}

/** The enemy's defense as it stands: hardened for a while, or plain. */
const enemyDefense = (e: Enemy): number => e.defense * (e.armoured ? e.armoured.mult : 1);

/** The round's working state: the fight being scribbled on and everything the helpers need. */
interface Round {
  state: GameState;
  action: FightAction;
  c: Character;
  s: Stats;
  f: Fight;
  rng: Rng;
  now: number;
  events: GameEvent[];
  /** Set when the fight ended inside a helper (a win or a death): the result to return. */
  done: ApplyResult | null;
}

/**
 * One round. The player's move first (a spell in the air lands before it); the enemy's poison bites; then the enemy's
 * turn unless it is dead, the player got away, it is stunned, caught in time, or it is the first round against a class
 * (or a Quickdraw) that strikes first. The guard is read when the blow comes. Then the companion strikes, the poisons
 * and effects count down, the meter and the mana move, and the enemy's next move is chosen and shown.
 */
/**
 * One round; against a world boss the HP is read from the spawn first and written back after, with the damage dealt
 * added to the player's tally (mine, 2026-11-01). A world boss that is gone ends the fight with nothing to show.
 */
export function fightRound(state: GameState, action: FightAction, character: Character, rng: Rng, now: number): ApplyResult {
  if (!character.fight) return reject(state, action, 'not in a fight');
  if (!character.fight.shared) return fightRoundOf(state, action, character, rng, now);
  const space = character.fight.space;
  const spawn = state.spawns[space];
  if (!spawn || spawn.kind !== 'worldboss') {
    const events: GameEvent[] = [{ type: 'nothing', action: action.id, player: action.player, text: 'The beast is gone.' }];
    return { state: withCharacter(state, { ...character, fight: null }), events };
  }
  const e = character.fight.enemy;
  const hp = Math.min(e.hp, spawn.hp ?? e.hp);
  const synced: Character = { ...character, fight: { ...character.fight, enemy: { ...e, hp, maxHp: spawn.maxHp ?? e.maxHp } } };
  const r = fightRoundOf(state, action, synced, rng, now);
  const left = r.state.spawns[space];
  if (!left || left.kind !== 'worldboss') return r; // it fell this round: the shared win took the spawn away
  const after = r.state.characters[character.id]!;
  const now_hp = after.fight?.shared && after.fight.space === space ? after.fight.enemy.hp : hp;
  const dealt = Math.max(0, hp - now_hp);
  const written: Spawn = { ...left, hp: now_hp, hitters: { ...(left.hitters ?? {}), [character.id]: (left.hitters?.[character.id] ?? 0) + dealt } };
  return { state: { ...r.state, spawns: { ...r.state.spawns, [space]: written } }, events: r.events };
}

function fightRoundOf(state: GameState, action: FightAction, character: Character, rng: Rng, now: number): ApplyResult {
  if (!character.fight) return reject(state, action, 'not in a fight');
  const cls = CLASS_DATA[character.classId];
  const events: GameEvent[] = [];
  const id = action.id;
  const player = action.player;
  // Fresh copies of the fight and the enemy: this round scribbles on them, never on the state passed in.
  const old = character.fight;
  const f: Fight = {
    ...freshFight(old.enemy, old.space, old.spawn),
    ...old,
    enemy: {
      ...old.enemy,
      weakened: old.enemy.weakened ? { ...old.enemy.weakened } : null,
      poison: old.enemy.poison ? { ...old.enemy.poison } : null,
      armoured: old.enemy.armoured ? { ...old.enemy.armoured } : null,
      evade: old.enemy.evade ?? 0,
      phase: old.enemy.phase ?? 1,
      phase2: old.enemy.phase2 ?? null,
      next: old.enemy.next ?? null,
    },
    attackUp: old.attackUp ? { ...old.attackUp } : null,
    windup: old.windup ? { ...old.windup } : null,
    companion: old.companion ? { ...old.companion } : null,
    mark: old.mark ? { ...old.mark } : null,
    poisoned: old.poisoned ? { ...old.poisoned } : null,
    weak: old.weak ? { ...old.weak } : null,
    used: [...(old.used ?? [])],
  };
  const r: Round = { state, action, c: { ...character, fight: f }, s: stats(character), f, rng, now, events, done: null };
  const p = r.s.powers;
  const traits = traitsOf(r.c);
  const guard: Guard = action.guard;
  let quick = false;

  // ---- a spell in the air lands --------------------------------------------------------------------------------------
  if (f.windup) {
    f.windup.rounds -= 1;
    if (f.windup.rounds <= 0) {
      const w = f.windup;
      f.windup = null;
      strike(r, w.name, w.power, 1, r.s.crit, true);
      if (r.done) return r.done;
    }
  }

  // ---- the player's move ------------------------------------------------------------------------------------------
  const move = action.move;
  switch (move.kind) {
    case 'attack': {
      if (p.quickdraw && f.round === 1 && !f.used.includes('quickdraw')) {
        f.used.push('quickdraw');
        f.sureCrit += 1;
        quick = true;
      }
      if (p.twinStrike) strike(r, 'Attack', p.twinStrike, 2, r.s.crit);
      else if (traits.attackHits) strike(r, 'Attack', 1, traits.attackHits, r.s.crit, !!traits.plainMagic, { split: true, melee: true });
      else strike(r, 'Attack', 1, 1, r.s.crit, !!traits.plainMagic, { melee: true });
      // Of Haste: now and then the whole attack again.
      if (r.s.bonus.haste && f.enemy.hp > 0 && !r.done && rng.next() < r.s.bonus.haste) strike(r, 'Attack', 1, traits.attackHits ?? 1, r.s.crit, !!traits.plainMagic, { split: !!traits.attackHits, melee: true });
      if (f.clone && f.enemy.hp > 0 && !r.done) strike(r, 'Shadow Clone', f.clone.power, traits.attackHits ?? 1, r.s.crit, false, { split: !!traits.attackHits });
      break;
    }
    case 'charge':
      if (f.charged) return reject(state, action, 'not now');
      f.charged = true;
      events.push({ type: 'charged', action: id, player, by: 'player', move: 'Charge' });
      break;
    case 'ability': {
      const ability = ABILITIES[move.ability];
      const rank = r.c.abilities[move.ability] ?? 0;
      if (!ability || rank <= 0) return reject(state, action, 'no such ability');
      if (ability.oncePerFight && f.used.includes(move.ability)) return reject(state, action, 'already used');
      // Four go into a fight; with fewer carried, nothing known is left behind.
      if (r.c.carried.length >= carriedLimit(r.c.level) && !r.c.carried.includes(move.ability)) return reject(state, action, 'not now');
      const meterCost = ability.meterAll ? f.meter : (ability.meter ?? 0);
      if ((ability.meter && f.meter < ability.meter) || (ability.meterAll && f.meter <= 0)) return reject(state, action, 'not enough meter');
      const manaCost = Math.ceil((p.arcane ? ability.mana * p.arcane : ability.mana) * (1 - (r.s.bonus.focus ?? 0)));
      if (r.c.mana < manaCost) return reject(state, action, 'not enough mana');
      if (manaCost > 0) {
        r.c = { ...r.c, mana: r.c.mana - manaCost };
        events.push({ type: 'mana', action: id, player, delta: -manaCost, mana: r.c.mana });
      }
      if (meterCost > 0) {
        f.meter -= meterCost;
        events.push({ type: 'meter', action: id, player, name: cls.meter?.name ?? 'Meter', value: f.meter, max: PROGRESSION.meterMax });
      }
      if (ability.oncePerFight) f.used.push(move.ability);
      const rk = ability.ranks[Math.min(rank, ability.ranks.length) - 1]!;
      const powerMult = p.arcane ? 0.8 : 1;
      if (rk.flee) {
        events.push({ type: 'fled', action: id, player, ok: true });
        return { state: withCharacter(state, outOfArena({ ...lingering(r.c, f), fight: null })), events };
      }
      if (rk.selfHurt) {
        const hp = Math.max(1, r.c.hp - Math.round(r.s.maxHp * rk.selfHurt));
        events.push({ type: 'selfHurt', action: id, player, amount: r.c.hp - hp, hp });
        r.c = { ...r.c, hp };
      }
      if (rk.meterGain) gainMeterFlat(r, rk.meterGain);
      if (rk.manaPerMeter) r.c = restoreMana(r.c, rk.manaPerMeter * meterCost, action, events);
      if (rk.nextSpell) f.nextSpell = rk.nextSpell;
      if (rk.cure) {
        f.poisoned = null;
        f.weak = null;
      }
      if (rk.regen) f.regen = { ...rk.regen };
      if (rk.infuse) f.infuse = { ...rk.infuse };
      if (rk.dance) f.dance = { exposed: true, ...rk.dance };
      if (rk.coat) f.coat = { ...rk.coat };
      if (rk.blockUp) f.blockUp = { ...rk.blockUp };
      if (rk.thornsUp) f.thornsUp = { ...rk.thornsUp };
      if (rk.counterUp) f.counterUp = { ...rk.counterUp };
      if (rk.spike) f.spike = { ...rk.spike };
      if (rk.clone) {
        f.clone = { ...rk.clone };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'clone', rounds: rk.clone.rounds });
      }
      if (rk.guardian) {
        f.guardian = rk.guardian;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'guardian', rounds: 1 });
      }
      if (rk.consume) {
        const kind = rk.consume.kind;
        const dot = f.enemy[kind];
        if (dot) {
          const damage = Math.max(1, Math.round(dot.damage * dot.rounds * rk.consume.mult));
          f.enemy[kind] = null;
          f.enemy.hp = Math.max(0, f.enemy.hp - damage);
          events.push({ type: 'hit', action: id, player, by: 'player', move: ability.name, damage, crit: false, hp: f.enemy.hp, absorbed: 0 });
          if (f.enemy.hp <= 0) return win(r);
          phaseCheck(r);
        }
      }
      if (rk.healShare) healing(r, Math.round(r.s.maxHp * rk.healShare * (traits.healPower ?? 1)));
      if (rk.attackUp) {
        f.attackUp = { ...rk.attackUp };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'attackUp', rounds: rk.attackUp.rounds });
      }
      let barrier = rk.barrier ?? 0;
      if (rk.barrierShare) barrier += Math.round(r.s.maxHp * rk.barrierShare);
      if (rk.barrierPerMana) {
        barrier += Math.round(r.c.mana * rk.barrierPerMana);
        if (r.c.mana > 0) {
          events.push({ type: 'mana', action: id, player, delta: -r.c.mana, mana: 0 });
          r.c = { ...r.c, mana: 0 };
        }
      }
      if (barrier > 0) {
        f.barrier += barrier;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'barrier', rounds: barrier });
      }
      if (rk.evade) {
        f.evade += rk.evade;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'evade', rounds: rk.evade });
      }
      if (rk.sureCrit) {
        f.sureCrit += rk.sureCrit;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'sureCrit', rounds: rk.sureCrit });
      }
      if (rk.mark) {
        f.mark = { ...rk.mark };
        events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'mark', rounds: rk.mark.hits });
      }
      if (rk.companion) {
        f.companion = { name: ability.name, ...rk.companion };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'companion', rounds: rk.companion.rounds });
      }
      if (rk.trap) {
        f.trap += rk.trap;
        events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'trap', rounds: rk.trap });
      }
      if (rk.skip) {
        f.skip += rk.skip;
        events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'skip', rounds: rk.skip });
      }
      if (rk.windup && rk.power) {
        f.windup = { name: ability.name, power: rk.power * powerMult, rounds: rk.windup };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'windup', rounds: rk.windup });
      } else if (rk.power) {
        let power = rk.power;
        if (rk.executeBelow && rk.executePower && f.enemy.hp < f.enemy.maxHp * rk.executeBelow) power = rk.executePower;
        if (ability.meterAll && rk.perMeter) power += rk.perMeter * meterCost;
        if (rk.burnBonus && f.enemy.burn) power *= rk.burnBonus;
        if (rk.danceBonus && f.dance && !f.dance.exposed) power *= rk.danceBonus;
        if (rk.defensePower) power += (rk.defensePower * r.s.defense) / Math.max(1, r.s.attack);
        if (rk.perHeldMeter) power += rk.perHeldMeter * f.meter;
        if (rk.manaPower) power += (rk.manaPower * r.c.mana) / Math.max(1, r.s.maxMana);
        if (rk.missingPower) power *= 1 + rk.missingPower * (1 - r.c.hp / Math.max(1, r.s.maxHp));
        if (rk.windupBonus && (f.enemy.charged || f.enemy.next?.charge)) power *= rk.windupBonus;
        if (rk.infuseBonus && f.infuse) power *= rk.infuseBonus;
        if (rk.healedPower) power += (rk.healedPower * f.healed) / Math.max(1, r.s.attack + r.s.magic);
        const before = f.enemy.hp;
        strike(r, ability.name, power * powerMult, rk.hits ?? 1, rk.crit ?? r.s.crit, true, { split: rk.split, melee: rk.melee, ignoreDefense: rk.ignoreDefense });
        if (rk.healDealt && before > f.enemy.hp) healing(r, Math.max(1, Math.round((before - f.enemy.hp) * rk.healDealt * (traits.healPower ?? 1))));
        if (r.done) return r.done;
      }
      if (rk.steal) {
        const gold = Math.max(1, Math.round(f.enemy.gold * rk.steal));
        r.c = { ...r.c, gold: r.c.gold + gold };
        events.push({ type: 'stolen', action: id, player, gold, total: r.c.gold });
      }
      if (f.enemy.hp > 0) {
        if (rk.interrupt && f.enemy.charged) {
          f.enemy.charged = null;
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'interrupt', rounds: 1 });
        }
        if (rk.stun) {
          // Mobs are stunned; minis and bosses shrug it off, or a stun every other round would rob them of the fight.
          if (f.enemy.role === 'mob') {
            f.enemy.stunned += rk.stun;
            events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'stunned', rounds: rk.stun });
          } else {
            events.push({ type: 'resisted', action: id, player, kind: 'stunned' });
          }
        }
        if (rk.burn) {
          f.enemy.burn = { rounds: rk.burn.rounds, damage: Math.max(1, Math.round((r.s.attack + r.s.magic) * rk.burn.power * (traits.burnPower ?? 1))) };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'burn', rounds: rk.burn.rounds });
        }
        if (rk.sunder) {
          f.enemy.sunder = { ...rk.sunder };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'sunder', rounds: rk.sunder.rounds });
        }
        if (rk.weaken) {
          f.enemy.weakened = { ...rk.weaken };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: rk.weaken.rounds });
        }
        if (rk.poison) {
          f.enemy.poison = { rounds: rk.poison.rounds, damage: Math.max(1, Math.round(r.s.attack * rk.poison.power * (traits.poisonPower ?? 1))) };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: rk.poison.rounds });
        }
      }
      break;
    }
    case 'item': {
      const item = ITEMS[move.item];
      if (!item) return reject(state, action, 'no such item');
      if ((r.c.items[move.item] ?? 0) <= 0) return reject(state, action, 'none left');
      if (!item.heal && !item.mana) return reject(state, action, 'not now');
      if (r.c.arena && r.c.arena.flasks >= ARENA.flasks) return reject(state, action, 'not now');
      r.c = spend(r.c, move.item);
      if (r.c.arena) r.c = { ...r.c, arena: { ...r.c.arena, flasks: r.c.arena.flasks + 1 } };
      events.push({ type: 'used', action: id, player, item: move.item });
      const stronger = (traits.potionPower ?? 1) * (1 + (r.s.bonus.plenty ?? 0));
      if (item.heal) r.c = heal(r.c, Math.round(item.heal * stronger), action, events);
      if (item.mana) r.c = restoreMana(r.c, Math.round(item.mana * stronger), action, events);
      break;
    }
    case 'flee': {
      const ok = rng.next() < PROGRESSION.fleeChance;
      events.push({ type: 'fled', action: id, player, ok });
      if (ok) return { state: withCharacter(state, outOfArena({ ...lingering(r.c, f), fight: null })), events };
      break;
    }
  }
  if (r.done) return r.done;
  if (f.enemy.hp <= 0) return win(r);
  // A weakening on the player counts down once its round of hits has been softened.
  if (f.weak) {
    f.weak.rounds -= 1;
    if (f.weak.rounds <= 0) f.weak = null;
  }

  // ---- the enemy's poison -----------------------------------------------------------------------------------------
  if (f.enemy.poison) {
    f.enemy.hp = Math.max(0, f.enemy.hp - f.enemy.poison.damage);
    events.push({ type: 'poisoned', action: id, player, target: 'enemy', damage: f.enemy.poison.damage, hp: f.enemy.hp });
    f.enemy.poison.rounds -= 1;
    if (f.enemy.poison.rounds <= 0) f.enemy.poison = null;
    if (f.enemy.hp <= 0) return win(r);
    phaseCheck(r);
  }

  if (f.enemy.burn) {
    const burn = f.enemy.burn;
    f.enemy.hp = Math.max(0, f.enemy.hp - burn.damage);
    events.push({ type: 'poisoned', action: id, player, target: 'enemy', damage: burn.damage, hp: f.enemy.hp, burn: true });
    f.enemy.burn = burn.rounds > 1 ? { ...burn, rounds: burn.rounds - 1 } : null;
    if (f.enemy.hp <= 0) return win(r);
    phaseCheck(r);
  }

  // ---- the enemy's turn -------------------------------------------------------------------------------------------
  const firstStrike = f.round === 1 && (cls.firstStrike || traits.firstStrike || quick);
  if (f.skip > 0) {
    f.skip -= 1;
    events.push({ type: 'skipped', action: id, player, by: 'enemy', reason: 'warped' });
  } else if (f.enemy.stunned > 0) {
    f.enemy.stunned -= 1;
    events.push({ type: 'skipped', action: id, player, by: 'enemy', reason: 'stunned' });
  } else if (!firstStrike) {
    const mv = f.enemy.next ?? pickMove(f.enemy, rng);
    f.enemy.next = null;
    if (mv.charge && !f.enemy.charged) {
      if (f.trap > 0) {
        f.trap -= 1;
        events.push({ type: 'skipped', action: id, player, by: 'enemy', reason: 'trapped' });
        if (traits.trapHit) {
          hurtEnemy(r, Math.max(1, Math.round(r.s.attack * traits.trapHit)));
          if (r.done) return r.done;
        }
      } else {
        f.enemy.charged = mv.name;
        events.push({ type: 'charged', action: id, player, by: 'enemy', move: mv.name });
      }
    } else if (mv.power === 0 && mv.effect) {
      // A move that is all effect: no blow to guard against.
      enemyEffect(r, mv);
    } else {
      if (guard !== 'none') events.push({ type: 'guarded', action: id, player, guard });
      const name = f.enemy.charged ?? mv.name;
      const heavy = f.enemy.charged !== null;
      let mult = mv.power * (heavy ? PROGRESSION.enemyCharge : 1) * (f.enemy.weakened ? f.enemy.weakened.mult : 1);
      if (heavy && r.s.bonus.warding && !f.used.includes('warding')) {
        f.used.push('warding');
        mult *= 1 - r.s.bonus.warding;
      }
      f.enemy.charged = null;
      const b = blow(f.enemy.attack, mult, r.s.defense, PROGRESSION.baseCrit, rng);
      let landed = false;
      const exposed = !!f.dance?.exposed;
      // Shadow Dance's first round: the blow in full, whatever the guard.
      const held: Guard = exposed ? 'none' : guard;
      if (f.spike) {
        hurtEnemy(r, Math.max(1, Math.round(r.s.attack * f.spike.power)));
        if (r.done) return r.done;
      }
      if (heavy && p.ward && !f.used.includes('ward')) {
        f.used.push('ward');
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else if (f.evade > 0 && !exposed) {
        f.evade -= 1;
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else if (f.dance && !exposed && rng.next() < f.dance.chance) {
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
        if (traits.dodgeCrit) f.sureCrit = Math.max(f.sureCrit, 1);
        if (traits.dodgeHeal) healing(r, Math.max(1, Math.round(r.s.maxHp * traits.dodgeHeal)));
      } else if (held === 'dodge' && rng.next() < PROGRESSION.guards.dodge + r.s.dodge) {
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
        if (traits.dodgeCrit) f.sureCrit = Math.max(f.sureCrit, 1);
        if (traits.dodgeHeal) healing(r, Math.max(1, Math.round(r.s.maxHp * traits.dodgeHeal)));
      } else {
        landed = true;
        let dealt = b.damage;
        let crit = b.crit;
        if (crit && p.ironbrow) {
          dealt = b.base;
          crit = false;
          events.push({ type: 'resisted', action: id, player, kind: 'crit' });
        }
        if (p.bulwark && r.c.hp < r.s.maxHp / 2) dealt = Math.ceil(dealt * (1 - p.bulwark));
        if (traits.damageTaken) dealt = Math.ceil(dealt * traits.damageTaken);
        if (traits.lowHpTaken && r.c.hp < r.s.maxHp / 3) dealt = Math.ceil(dealt * traits.lowHpTaken);
        const beforeGuard = dealt;
        if (held === 'block' && traits.shieldMana) {
          // The Magician's Mana Shield (Robin, 2026-11-02): part of the blow is paid in mana while there is any.
          const paid = Math.min(r.c.mana, Math.ceil(dealt * traits.shieldMana));
          if (paid > 0) {
            r.c = { ...r.c, mana: r.c.mana - paid };
            events.push({ type: 'mana', action: id, player, delta: -paid, mana: r.c.mana });
            dealt -= paid;
          }
        } else if (held === 'block') dealt = Math.ceil(dealt * Math.max(0.15, (f.blockUp?.mult ?? PROGRESSION.guards.block) - (r.s.bonus.wall ?? 0) - (traits.blockPower ?? 0)));
        if (held === 'brace') {
          dealt = Math.ceil(dealt * PROGRESSION.guards.brace);
          r.c = restoreMana(r.c, Math.max(PROGRESSION.guards.braceMana, Math.round(r.s.maxMana * PROGRESSION.guards.braceManaShare)), action, events);
        }
        let absorbed = 0;
        if (f.barrier > 0) {
          absorbed = Math.min(f.barrier, dealt);
          f.barrier -= absorbed;
          dealt -= absorbed;
        }
        r.c = { ...r.c, hp: Math.max(0, r.c.hp - dealt) };
        events.push({ type: 'hit', action: id, player, by: 'enemy', move: name, damage: dealt, crit, hp: r.c.hp, absorbed });
        if (held === 'block') gainMeter(r, 'block', heavy ? 2 : 1);
        if (!survive(r)) return r.done!;
        if (held === 'block' && traits.blockHeal) healing(r, Math.max(1, Math.round(r.s.maxHp * traits.blockHeal)));
        if (held === 'block' && p.mirror && beforeGuard > dealt + absorbed) {
          hurtEnemy(r, Math.max(1, Math.round((beforeGuard - dealt - absorbed) * p.mirror)));
          if (r.done) return r.done;
        }
        const thorns = r.s.thorns + (f.thornsUp?.share ?? 0);
        if (thorns > 0 && beforeGuard > 0) {
          hurtEnemy(r, Math.max(1, Math.round(beforeGuard * thorns)));
          if (r.done) return r.done;
        }
      }
      // A counter: always under that guard, if the blow landed; for a Hunter also by chance, whether it landed or not.
      const chance = (traits.counterChance ?? 0) + (f.counterUp?.chance ?? 0);
      if ((held === 'counter' && landed) || (chance > 0 && rng.next() < chance)) {
        for (let i = 0; i < (traits.counterHits ?? 1) && f.enemy.hp > 0; i++) {
          const back = blow(r.s.attack, traits.counterPower ?? PROGRESSION.guards.counter, enemyDefense(f.enemy), r.s.crit, rng);
          hurtEnemy(r, back.damage);
          if (r.done) return r.done;
        }
        gainMeter(r, 'hit', 1);
      }
      if (!landed) gainMeter(r, 'miss', 1);
      if (landed && mv.effect) enemyEffect(r, mv);
    }
    if (f.enemy.weakened) {
      f.enemy.weakened.rounds -= 1;
      if (f.enemy.weakened.rounds <= 0) f.enemy.weakened = null;
    }
  }

  // ---- the round ends ---------------------------------------------------------------------------------------------
  if (f.companion && f.enemy.hp > 0) {
    for (let i = 0; i < (f.companion.hits ?? 1) && f.enemy.hp > 0; i++) {
      const b = blow(r.s.attack, f.companion.power * (traits.companionPower ?? 1), enemyDefense(f.enemy), 0, rng);
      f.enemy.hp = Math.max(0, f.enemy.hp - b.damage);
      events.push({ type: 'hit', action: id, player, by: 'player', move: f.companion.name, damage: b.damage, crit: false, hp: f.enemy.hp, absorbed: 0 });
    }
    f.companion.rounds -= 1;
    if (f.companion.rounds <= 0) f.companion = null;
    if (f.enemy.hp <= 0) return win(r);
    phaseCheck(r);
  }
  if (f.poisoned) {
    r.c = { ...r.c, hp: Math.max(0, r.c.hp - f.poisoned.damage) };
    events.push({ type: 'poisoned', action: id, player, target: 'player', damage: f.poisoned.damage, hp: r.c.hp });
    f.poisoned.rounds -= 1;
    if (f.poisoned.rounds <= 0) f.poisoned = null;
    if (!survive(r)) return r.done!;
  }
  if (f.enemy.armoured) {
    f.enemy.armoured.rounds -= 1;
    if (f.enemy.armoured.rounds <= 0) f.enemy.armoured = null;
  }
  if (f.attackUp) {
    f.attackUp.rounds -= 1;
    if (f.attackUp.rounds <= 0) f.attackUp = null;
  }
  if (traits.hpRegen) healing(r, Math.max(1, Math.round(r.s.maxHp * traits.hpRegen * (traits.healPower ?? 1))));
  if (traits.manaRegen) r.c = restoreMana(r.c, Math.max(1, Math.round(r.s.maxMana * traits.manaRegen)), action, events);
  if (f.regen) {
    healing(r, Math.max(1, Math.round(r.s.maxHp * f.regen.share * (traits.healPower ?? 1))));
    f.regen = f.regen.rounds > 1 ? { ...f.regen, rounds: f.regen.rounds - 1 } : null;
  }
  if (f.infuse) f.infuse = f.infuse.rounds > 1 ? { ...f.infuse, rounds: f.infuse.rounds - 1 } : null;
  if (f.blockUp) f.blockUp = f.blockUp.rounds > 1 ? { ...f.blockUp, rounds: f.blockUp.rounds - 1 } : null;
  if (f.thornsUp) f.thornsUp = f.thornsUp.rounds > 1 ? { ...f.thornsUp, rounds: f.thornsUp.rounds - 1 } : null;
  if (f.counterUp) f.counterUp = f.counterUp.rounds > 1 ? { ...f.counterUp, rounds: f.counterUp.rounds - 1 } : null;
  if (f.spike) f.spike = f.spike.rounds > 1 ? { ...f.spike, rounds: f.spike.rounds - 1 } : null;
  if (f.clone) f.clone = f.clone.rounds > 1 ? { ...f.clone, rounds: f.clone.rounds - 1 } : null;
  if (f.enemy.sunder) f.enemy.sunder = f.enemy.sunder.rounds > 1 ? { ...f.enemy.sunder, rounds: f.enemy.sunder.rounds - 1 } : null;
  if (f.dance) f.dance = f.dance.exposed ? { ...f.dance, exposed: false } : f.dance.rounds > 1 ? { ...f.dance, rounds: f.dance.rounds - 1 } : null;
  gainMeter(r, 'round', 1);
  if (p.regen) r.c = heal(r.c, Math.max(1, Math.round(r.s.maxHp * p.regen)), action, events);
  if (r.s.bonus.mending) r.c = heal(r.c, Math.max(1, Math.round(r.s.maxHp * r.s.bonus.mending)), action, events);
  f.round += 1;
  r.c = restoreMana(r.c, PROGRESSION.manaPerRound + (p.manaWell ?? 0) + (r.s.bonus.clarity ?? 0), action, events);
  f.enemy.next = pickMove(f.enemy, rng);
  events.push(intentEvent(f.enemy, id, player));
  return { state: withCharacter(state, r.c), events };
}

/** The event that tells the player what the enemy will do next round. */
export function intentEvent(enemy: Enemy, action: string, player: string): GameEvent {
  const mv = enemy.next;
  return { type: 'intent', action, player, move: enemy.charged ?? mv?.name ?? '', effect: mv?.effect ?? null, charge: enemy.charged !== null || !!mv?.charge };
}

/** The meter fills by the class's rule (`gain`), up to the cap; a Wolf Totem brings a second point now and then. */
function gainMeter(r: Round, gain: 'block' | 'hit' | 'round' | 'miss', n: number): void {
  const meter = CLASS_DATA[r.c.classId].meter;
  if (!meter || meter.gain !== gain || n <= 0) return;
  let add = n;
  const fury = (r.s.powers.fury ?? 0) + (r.s.bonus.resolve ?? 0);
  if (fury && r.rng.next() < fury) add += 1;
  const before = r.f.meter;
  r.f.meter = Math.min(PROGRESSION.meterMax, r.f.meter + add);
  if (r.f.meter !== before) r.events.push({ type: 'meter', action: r.action.id, player: r.action.player, name: meter.name, value: r.f.meter, max: PROGRESSION.meterMax });
}

/** Healing in a fight: counted for Judgement Day, and past full a Cleric's becomes a barrier. */
function healing(r: Round, amount: number): void {
  const traits = traitsOf(r.c);
  const room = r.s.maxHp - r.c.hp;
  if (traits.healOverflow && amount > room) r.f.barrier += Math.round((amount - room) * traits.healOverflow);
  r.f.healed += amount;
  r.c = heal(r.c, amount, r.action, r.events);
}

/** Meter from an ability, whatever fills it otherwise. */
function gainMeterFlat(r: Round, n: number): void {
  const meter = CLASS_DATA[r.c.classId].meter;
  if (!meter) return;
  r.f.meter = Math.min(PROGRESSION.meterMax, r.f.meter + n);
  r.events.push({ type: 'meter', action: r.action.id, player: r.action.player, name: meter.name, value: r.f.meter, max: PROGRESSION.meterMax });
}

/**
 * The player hits the enemy `hits` times at `power`; a held charge, a war cry and a mark multiply; a weakening divides;
 * sure crits, Stormcaller's third hits and the Sunblade apply; lifesteal heals; Frostbrand chills and Venomtooth poisons.
 * Ends the fight (sets `done`) when the enemy falls.
 */
function strike(r: Round, move: string, power: number, hits: number, crit: number, spell = false, how: { split?: boolean; melee?: boolean; ignoreDefense?: boolean } = {}): void {
  const { f, s, rng, events } = r;
  const traits = traitsOf(r.c);
  const infused = how.melee ? f.infuse : null;
  if (traits.damageDealt) power *= traits.damageDealt;
  if (spell && traits.spellPower) power *= traits.spellPower;
  // The talents: where you stand, and what state it is in.
  const share = r.c.hp / Math.max(1, s.maxHp);
  if (traits.lowHpDamage && share < 1 / 3) power *= traits.lowHpDamage;
  if (traits.highHpDamage && share > 0.8) power *= traits.highHpDamage;
  if (traits.executeDamage && f.enemy.hp < f.enemy.maxHp / 3) power *= traits.executeDamage;
  if (traits.firstRoundDamage && f.round === 1) power *= traits.firstRoundDamage;
  if (traits.burningDamage && f.enemy.burn) power *= traits.burningDamage;
  if (traits.poisonedDamage && f.enemy.poison) power *= traits.poisonedDamage;
  if (traits.weakenedDamage && f.enemy.weakened) power *= traits.weakenedDamage;
  if (traits.stunnedDamage && f.enemy.stunned > 0) power *= traits.stunnedDamage;
  if (spell && f.nextSpell) {
    power *= f.nextSpell;
    f.nextSpell = 0;
  }
  if (f.enemy.sunder) power *= f.enemy.sunder.mult;
  if (infused) power *= 1 + infused.power;
  power *= 1 + ((f.enemy.role === 'mob' ? s.bonus.hunter : s.bonus.giant) ?? 0);
  const id = r.action.id;
  const player = r.action.player;
  const p = s.powers;
  if (f.charged) {
    power *= PROGRESSION.charge;
    f.charged = false;
  }
  if (f.attackUp) power *= f.attackUp.mult;
  if (f.weak) power *= f.weak.mult;
  if (p.sunblade && f.enemy.role !== 'mob') power *= p.sunblade;
  for (let i = 0; i < hits && f.enemy.hp > 0; i++) {
    if (f.enemy.evade > 0) {
      f.enemy.evade -= 1;
      events.push({ type: 'missed', action: id, player, by: 'player', move });
      continue;
    }
    let chance = crit + f.streak * (traits.critStreak ?? 0);
    let hitPower = power;
    if (f.mark) {
      hitPower *= f.mark.mult;
      f.mark.hits -= 1;
      if (f.mark.hits <= 0) f.mark = null;
    }
    f.strikes += 1;
    if (f.sureCrit > 0) {
      f.sureCrit -= 1;
      chance = 1;
    } else if (p.thunder && f.strikes % p.thunder === 0) {
      chance = 1;
    }
    const b = blow(s.attack + (spell ? s.magic : 0), hitPower, how.ignoreDefense ? 0 : Math.floor(enemyDefense(f.enemy) * (1 - (s.bonus.ruin ?? 0))), chance, rng);
    if (b.crit && s.bonus.cruelty) b.damage = Math.round(b.damage * (1 + s.bonus.cruelty));
    if (b.crit && traits.critPower) b.damage = Math.round(b.damage * (1 + traits.critPower));
    // Split: the hits share one blow's power, so defense counts once, not on every small hit.
    if (how.split) b.damage = Math.max(1, Math.round(b.damage / hits));
    if (traits.critStreak) f.streak = b.crit ? 0 : f.streak + 1;
    f.enemy.hp = Math.max(0, f.enemy.hp - b.damage);
    events.push({ type: 'hit', action: id, player, by: 'player', move, damage: b.damage, crit: b.crit, hp: f.enemy.hp, absorbed: 0 });
    if (b.crit) gainMeter(r, 'miss', 1);
    if (b.crit && traits.critHeal) healing(r, Math.max(1, Math.round(s.maxHp * traits.critHeal)));
    if (b.crit && traits.critMana) r.c = restoreMana(r.c, Math.max(1, Math.round(s.maxMana * traits.critMana)), r.action, events);
    if (s.lifesteal > 0) {
      const back = Math.max(1, Math.round(b.damage * s.lifesteal));
      const hp = Math.min(s.maxHp, r.c.hp + back);
      if (hp > r.c.hp) {
        events.push({ type: 'healed', action: id, player, amount: hp - r.c.hp, hp });
        r.c = { ...r.c, hp };
      }
    }
    if (f.enemy.hp > 0 && s.bonus.venom && rng.next() < s.bonus.venom) {
      f.enemy.poison = { rounds: 3, damage: Math.max(f.enemy.poison?.damage ?? 0, Math.max(1, Math.round(s.attack * 0.2))) };
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: 3 });
    }
    if (f.enemy.hp > 0 && s.bonus.embers && rng.next() < s.bonus.embers) {
      f.enemy.burn = { rounds: 3, damage: Math.max(f.enemy.burn?.damage ?? 0, Math.max(1, Math.round((s.attack + s.magic) * 0.2))) };
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'burn', rounds: 3 });
    }
    if (f.enemy.hp > 0 && s.bonus.frost && rng.next() < s.bonus.frost) {
      f.enemy.weakened = { rounds: 2, mult: Math.min(f.enemy.weakened?.mult ?? 1, 0.8) };
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: 2 });
    }
    if (f.enemy.hp > 0 && f.coat) {
      const damage = (f.enemy.poison?.damage ?? 0) + Math.max(1, Math.round(s.attack * f.coat.power * (traits.poisonPower ?? 1)));
      f.enemy.poison = { rounds: f.coat.rounds, damage };
      f.coat = f.coat.hits > 1 ? { ...f.coat, hits: f.coat.hits - 1 } : null;
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: f.enemy.poison.rounds });
    }
    if (f.enemy.hp > 0 && infused?.kind === 'ice' && infused.mult) {
      f.enemy.weakened = { rounds: 2, mult: infused.mult };
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: 2 });
    }
    if (f.enemy.hp > 0 && infused?.kind === 'storm' && infused.chance && rng.next() < infused.chance) {
      const bolt = blow(s.attack + s.magic, 0.5, enemyDefense(f.enemy), 0, rng);
      f.enemy.hp = Math.max(0, f.enemy.hp - bolt.damage);
      events.push({ type: 'hit', action: id, player, by: 'player', move: 'Lightning', damage: bolt.damage, crit: false, hp: f.enemy.hp, absorbed: 0 });
    }
    if (f.enemy.hp > 0) {
      if (p.frostbrand && (!f.enemy.weakened || f.enemy.weakened.mult > p.frostbrand)) {
        f.enemy.weakened = { rounds: EFFECTS.frostbrand, mult: p.frostbrand };
        events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: EFFECTS.frostbrand });
      }
      if (p.venom) {
        const damage = Math.max(1, Math.round(s.attack * p.venom));
        if (!f.enemy.poison || f.enemy.poison.damage < damage) {
          f.enemy.poison = { rounds: EFFECTS.venom, damage };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: EFFECTS.venom });
        }
      }
    }
  }
  gainMeter(r, 'hit', 1);
  if (f.enemy.hp <= 0) r.done = win(r);
  else phaseCheck(r);
}

/** Damage to the enemy outside a strike: thorns, a mirrored blow, a counter. */
function hurtEnemy(r: Round, damage: number): void {
  r.f.enemy.hp = Math.max(0, r.f.enemy.hp - damage);
  r.events.push({ type: 'countered', action: r.action.id, player: r.action.player, damage, hp: r.f.enemy.hp });
  if (r.f.enemy.hp <= 0) r.done = win(r);
  else phaseCheck(r);
}

/** A boss under its mark switches to its second phase: new moves, a line, its next move chosen afresh. */
function phaseCheck(r: Round): void {
  const e = r.f.enemy;
  if (!e.phase2 || e.phase !== 1 || e.hp <= 0 || e.hp > e.maxHp * e.phase2.at) return;
  e.phase = 2;
  e.moves = e.phase2.moves.map((m) => ({ ...m }));
  e.next = null;
  r.events.push({ type: 'phase', action: r.action.id, player: r.action.player, text: e.phase2.text });
}

/** What an enemy's move does to the player besides its blow. Ironbrow shrugs off poison and weakening. */
function enemyEffect(r: Round, mv: EnemyMove): void {
  const { f, s, events } = r;
  const id = r.action.id;
  const player = r.action.player;
  switch (mv.effect) {
    case 'poison':
      if (s.powers.ironbrow) {
        events.push({ type: 'resisted', action: id, player, kind: 'poison' });
      } else {
        f.poisoned = { rounds: EFFECTS.poison.rounds, damage: Math.max(1, Math.round(f.enemy.attack * EFFECTS.poison.power)) };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'poison', rounds: EFFECTS.poison.rounds });
      }
      break;
    case 'weaken':
      if (s.powers.ironbrow) {
        events.push({ type: 'resisted', action: id, player, kind: 'weakened' });
      } else {
        f.weak = { ...EFFECTS.weaken };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'weakened', rounds: EFFECTS.weaken.rounds });
      }
      break;
    case 'drain': {
      const mana = Math.min(r.c.mana, EFFECTS.drain);
      if (mana > 0) {
        r.c = { ...r.c, mana: r.c.mana - mana };
        events.push({ type: 'drained', action: id, player, mana, left: r.c.mana });
      }
      break;
    }
    case 'armour':
      f.enemy.armoured = { ...EFFECTS.armour };
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'armoured', rounds: EFFECTS.armour.rounds });
      break;
    case 'evade':
      f.enemy.evade += 1;
      events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'evade', rounds: 1 });
      break;
    case 'heal': {
      const amount = Math.min(f.enemy.maxHp - f.enemy.hp, Math.max(1, Math.round(f.enemy.maxHp * EFFECTS.heal)));
      if (amount > 0) {
        f.enemy.hp += amount;
        events.push({ type: 'enemyHealed', action: id, player, amount, hp: f.enemy.hp });
      }
      break;
    }
    default:
      break;
  }
}

/**
 * After a wound: a Phoenix Helm catches a character dropped under a quarter (once a fight), a Phoenix Feather one that
 * would fall (once every half hour); otherwise a fallen character dies. True when the fight goes on.
 */
function survive(r: Round): boolean {
  const { f, s } = r;
  const p = s.powers;
  const id = r.action.id;
  const player = r.action.player;
  if (p.secondWind && !f.used.includes('secondWind') && r.c.hp < s.maxHp * EFFECTS.secondWindBelow) {
    f.used.push('secondWind');
    const hp = Math.min(s.maxHp, r.c.hp + Math.round(s.maxHp * p.secondWind));
    r.c = { ...r.c, hp };
    r.events.push({ type: 'revived', action: id, player, by: 'secondWind', hp });
  }
  if (r.c.hp > 0) return true;
  if (f.guardian > 0) {
    const hp = Math.max(1, Math.round(s.maxHp * f.guardian));
    f.guardian = 0;
    r.c = { ...r.c, hp };
    r.events.push({ type: 'revived', action: id, player, by: 'guardian', hp });
    return true;
  }
  if (p.phoenix && (r.c.cooldowns.phoenix ?? 0) <= r.now) {
    const hp = Math.max(1, Math.round(s.maxHp * p.phoenix));
    r.c = { ...r.c, hp, cooldowns: { ...r.c.cooldowns, phoenix: r.now + EFFECTS.phoenixMs } };
    r.events.push({ type: 'revived', action: id, player, by: 'phoenix', hp });
    return true;
  }
  r.done = die(r.state, r.c, r.action, r.events);
  return false;
}

/**
 * The enemy is down: xp (a Sage's Crown adds half; a Miser's Coin halves it and doubles the gold), loot (bosses carry
 * uniques and nothing under epic, minis rare and up), a potion or a card now and then; a boss opens the way and goes
 * away for a while; a spawn is cleared; a level that offers a pick of abilities asks it.
 */
function win(r: Round): ApplyResult {
  if (r.f.shared) return worldBossDown(r);
  const { f, rng, events, now } = r;
  const action = r.action;
  const c = r.c;
  const e = f.enemy;
  const id = action.id;
  const player = action.player;
  const p = r.s.powers;
  let xp = e.xp;
  let gold = e.gold;
  if (p.scholar) xp = Math.round(xp * p.scholar);
  if (p.greed) {
    gold = Math.round(gold * p.greed);
    xp = Math.round(xp / p.greed);
  }
  xp = Math.round(xp * (1 + (r.s.bonus.wisdom ?? 0)));
  gold = Math.round(gold * (1 + (r.s.bonus.fortune ?? 0)));
  // The Arena's pay is measured from the fighter already.
  if (!c.arena) {
    const land = r.state.board.areas[r.state.board.spaces[f.space]?.area ?? ''];
    const cap = softcap(c.level, e.level, land?.levels[1] ?? 99, e.role === 'boss');
    xp = Math.max(1, Math.round(xp * cap.xp));
    gold = Math.round(gold * cap.gold);
  }
  events.push({ type: 'won', action: id, player, xp, gold });
  if (c.arena) return arenaWon(r, xp, gold);
  let next: Character = { ...lingering(c, f), gold: c.gold + gold, fight: null };
  const talents = traitsOf(c);
  if (talents.winHeal) next = { ...next, hp: Math.min(r.s.maxHp, next.hp + Math.round(r.s.maxHp * talents.winHeal)) };
  if (talents.winMana) next = { ...next, mana: Math.min(r.s.maxMana, next.mana + Math.round(r.s.maxMana * talents.winMana)) };
  const levelBefore = next.level;
  next = gainXp(next, xp, action, events);
  next = questProgress(next, { beat: e.id }, rng, action, events);

  const space = r.state.board.spaces[f.space];
  const area = space ? r.state.board.areas[space.area] : undefined;
  next = noteBeaten(next, e.id, r.state.board, area?.id, action, events);
  const rank = area?.tier ?? 1;
  let s = r.state;
  if (e.wanderer || rng.next() < GEAR.dropChance[e.role] + (r.s.bonus.scavenger ?? 0)) {
    const got = nextGearId(s);
    s = got.state;
    const unique = rng.next() < GEAR.uniqueChance[e.role] ? rollUnique(got.id, rank, rank, rng) : null;
    if (unique) {
      next = addLoot(next, unique, action, events);
    } else {
      next = addLoot(next, rollGear(got.id, dropSlot(space ? groundAt(s.board, space) : null, rng), rank, GEAR.rarityBoost[e.wanderer ? 'boss' : e.role], rng, rollLine(rng), c.classId), action, events);
    }
  }
  if (rng.next() < GEAR.consumableDrop.potion) {
    next = giveItem(next, flaskId('potion', rank), 1, action, events);
  } else if (rng.next() < GEAR.consumableDrop.card) {
    const cards = ITEM_IDS.filter((i) => ITEMS[i]!.dice);
    next = giveItem(next, cards[rng.int(cards.length) - 1]!, 1, action, events);
  }

  const paid = finishQuests(s, next, action, rng, events);
  s = paid.state;
  next = paid.c;

  // A mini-boss of an area with a locked chest carries its key, until the character holds one.
  if (e.role === 'mini' && area && (next.keys[area.id] ?? 0) === 0 && Object.values(s.board.spaces).some((x) => x.area === area.id && x.locked)) {
    next = { ...next, keys: { ...next.keys, [area.id]: 1 } };
    events.push({ type: 'keyFound', action: id, player, area: area.id });
  }

  // A land's boss, or a mini-boss guarding a land's gate.
  if (space?.kind === 'boss' && (e.role === 'boss' || (e.role === 'mini' && space.opens))) {
    const until = now + (SPACE_KIND_DATA.boss.cooldownMs ?? 0);
    next = { ...next, cooldowns: { ...next.cooldowns, [f.space]: until }, bossKills: { ...next.bossKills, [f.space]: (next.bossKills[f.space] ?? 0) + 1 } };
    events.push({ type: 'bossDown', action: id, player, space: f.space, until });
    if (space.opens && !next.opened.includes(space.opens)) {
      // An area not laid yet grows now, from the seed, the same for everyone.
      if (!s.board.areas[space.opens]) s = { ...s, board: growBoard(s.board, s.seed, space.opens) };
      // A region's boss beaten for the first time is worth a skill point (mine).
      next = { ...next, opened: [...next.opened, space.opens], bonusPoints: (next.bonusPoints ?? 0) + 1 };
      events.push({ type: 'opened', action: id, player, area: space.opens });
      // The lands with no gate of their own open with it.
      const withIt = Object.values(s.board.areas).filter((a) => a.openWith === space.opens && !next.opened.includes(a.id));
      for (const a of withIt) {
        next = { ...next, opened: [...next.opened, a.id] };
        events.push({ type: 'opened', action: id, player, area: a.id });
      }
      events.push({ type: 'skillPoints', action: id, player, gained: 1, free: pointsFree(next) });
    }
  }

  // The levels crossed owe their picks of one ability in two, answered on the board.
  next = noteLevels(next, levelBefore, action, events);

  let spawns = s.spawns;
  if (f.spawn && spawns[f.space]) {
    spawns = { ...spawns };
    delete spawns[f.space];
    events.push({ type: 'despawned', action: id, player, space: f.space });
  }
  return { state: { ...withCharacter(s, next), spawns }, events };
}

/**
 * A world boss fell (mine, 2026-11-01): everyone who hit it shares the reward by their damage, never under `minShare`:
 * xp and gold, and a boss's drop roll each (a unique half the time). The one who struck the last blow gets the usual
 * events; the others' pieces change in the same action and their fights on it end. The spawn goes.
 */
function worldBossDown(r: Round): ApplyResult {
  const { f, rng, events } = r;
  const action = r.action;
  const e = f.enemy;
  const id = action.id;
  const player = action.player;
  const space = f.space;
  const spawn = r.state.spawns[space];
  const tally: Record<string, number> = { ...(spawn?.hitters ?? {}) };
  // The last blow took whatever was left when this round began.
  tally[player] = (tally[player] ?? 0) + Math.max(1, spawn?.hp ?? e.hp);
  const total = Object.values(tally).reduce((a, b) => a + b, 0) || 1;
  const rank = r.state.board.areas[r.state.board.spaces[space]?.area ?? '']?.tier ?? 1;
  let s = r.state;
  const shares: { player: string; damage: number; xp: number; gold: number }[] = [];
  const characters = { ...s.characters };
  for (const [who, damage] of Object.entries(tally).sort(([a], [b]) => (a === player ? -1 : b === player ? 1 : a.localeCompare(b)))) {
    const c = characters[who];
    if (!c) continue;
    const share = Math.max(PROGRESSION.worldBoss.minShare, damage / total);
    const mine = who === player;
    const p = powers(c);
    let xp = Math.round(e.xp * share);
    let gold = Math.round(e.gold * share);
    if (p.scholar) xp = Math.round(xp * p.scholar);
    if (p.greed) {
      gold = Math.round(gold * p.greed);
      xp = Math.round(xp / p.greed);
    }
    const out: GameEvent[] = mine ? events : [];
    if (mine) events.push({ type: 'won', action: id, player, xp, gold });
    let next: Character = { ...c, gold: c.gold + gold, fight: c.fight?.shared && c.fight.space === space ? null : c.fight };
    const levelBefore = next.level;
    next = gainXp(next, xp, action, out);
    next = questProgress(next, { beat: e.id }, rng, action, out);
    const paid = finishQuests(s, next, action, rng, out);
    s = paid.state;
    next = paid.c;
    if (rng.next() < GEAR.dropChance.boss) {
      const got = nextGearId(s);
      s = got.state;
      const unique = rng.next() < GEAR.uniqueChance.boss ? rollUnique(got.id, rank, rank, rng) : null;
      next = addLoot(next, unique ?? rollGear(got.id, SLOTS[rng.int(SLOTS.length) - 1]!, rank, GEAR.rarityBoost.boss, rng, rollLine(rng), c.classId), action, out);
    }
    next = noteLevels(next, levelBefore, action, out);
    characters[who] = next;
    shares.push({ player: who, damage, xp, gold });
  }
  events.push({ type: 'worldBossDown', action: id, player, space, enemy: e.id, shares });
  const spawns = { ...s.spawns };
  delete spawns[space];
  events.push({ type: 'despawned', action: id, player, space });
  return { state: { ...s, characters, spawns }, events };
}

/** A run ends with nothing paid: fled or fallen. */
function outOfArena(c: Character): Character {
  const { arena: _run, ...left } = c;
  return left;
}

/** A wave of the Arena beaten: what it paid goes in the pot, and the player is asked to take it or go on. The wave counts for quests and the journal. */
function arenaWon(r: Round, xp: number, gold: number): ApplyResult {
  const { f, rng, events, action } = r;
  const run = r.c.arena!;
  const space = r.state.board.spaces[f.space];
  const pot = { ...run, xp: run.xp + xp, gold: run.gold + gold };
  let next: Character = { ...lingering(r.c, f), fight: null, arena: pot };
  next = questProgress(next, { beat: f.enemy.id }, rng, action, events);
  next = noteBeaten(next, f.enemy.id, r.state.board, space?.area, action, events);
  const paid = finishQuests(r.state, next, action, rng, events);
  const offer = { kind: 'arena' as const, mode: run.mode, wave: run.wave, total: ARENA.waves.length, gold: pot.gold, xp: pot.xp, gear: run.wave >= ARENA.gearFrom };
  const asked: Character = { ...paid.c, offer };
  events.push({ type: 'offer', action: action.id, player: action.player, offer });
  return { state: withCharacter(paid.state, asked), events };
}

/** Tell of the points levels crossed since `from` brought (the skill board spends them). */
export function noteLevels(c: Character, from: number, action: Action, events: GameEvent[]): Character {
  const gained = pointsForLevel(c.level) - pointsForLevel(from);
  if (gained > 0) events.push({ type: 'skillPoints', action: action.id, player: action.player, gained, free: pointsFree(c) });
  return c;
}

/** Beaten: back on your feet in the nearest town, HP and mana full, a fifth of the gold gone, gear kept. */
function die(state: GameState, c: Character, action: Action, events: GameEvent[]): ApplyResult {
  // In the Arena the pot is what you lose.
  const lostGold = c.arena ? 0 : Math.floor(c.gold * PROGRESSION.deathGoldLoss);
  // Out of a dungeon by its door: no road leads from inside to a town.
  const area = state.board.spaces[c.space]?.area ?? '';
  const exit = state.board.areas[area]?.dungeon ? Object.values(state.board.spaces).find((s) => s.area === area && s.door)?.door : undefined;
  const town = nearestTown(state.board, exit ?? c.space, new Set(c.opened));
  events.push({ type: 'died', action: action.id, player: action.player, town, lostGold });
  const woke: Character = { ...outOfArena(c), gold: c.gold - lostGold, space: town, steps: 0, fight: null, offer: null, ailments: {} };
  const s = stats(woke);
  return { state: withCharacter(state, { ...woke, hp: s.maxHp, mana: s.maxMana }), events };
}
