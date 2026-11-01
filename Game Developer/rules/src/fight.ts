// The fight (Robin, 2026-10-31): a turn-based RPG. The player attacks, casts an ability, charges, drinks a potion or
// runs; then chooses a guard; then the enemy moves, with wind-ups to read and a stun, a poison or a weakening to
// suffer. Every number comes from the stream. Later the same day (Robin): class kits that feel different, in the hand
// (the meters: Rage, Combo, Flow, Focus; the abilities that spend them), enemies whose next move is shown a round ahead
// with effects the guard has to read, bosses with a second phase, and uniques whose powers bend the rules. The moves,
// the guards and all the numbers are mine, first settings.

import { ABILITIES, CLASS_DATA, ENEMIES, GEAR, ITEMS, ITEM_IDS, PROGRESSION, SPACE_KIND_DATA } from './data.ts';
import { addLoot, gainXp, giveItem, heal, nextGearId, reject, restoreMana, spend, withCharacter } from './common.ts';
import { powers, rollGear, rollUnique, stats, type Stats } from './gear.ts';
import { growBoard } from './generate.ts';
import { nearestTown } from './paths.ts';
import type { Rng } from './rng.ts';
import { questProgress } from './quests.ts';
import { SLOTS, type Action, type ApplyResult, type Character, type Enemy, type EnemyData, type EnemyMove, type Fight, type GameEvent, type GameState, type Guard } from './types.ts';

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

/** A fight with nothing on either side yet. */
export function freshFight(enemy: Enemy, space: string, spawn: boolean): Fight {
  return { enemy, round: 1, charged: false, attackUp: null, barrier: 0, evade: 0, space, spawn, meter: 0, strikes: 0, sureCrit: 0, windup: null, companion: null, mark: null, trap: 0, skip: 0, poisoned: null, weak: null, used: [] };
}

/**
 * The character squared up to the enemy on this space. With a stream, the enemy's first move is chosen now and shown;
 * Windstep's step aside is taken.
 */
export function startFight(c: Character, enemyId: string, space: string, spawn: boolean, bestiary: Record<string, EnemyData> = {}, rng?: Rng): Character {
  const fight = freshFight(makeEnemy(enemyId, bestiary), space, spawn);
  const p = powers(c);
  if (p.windstep) fight.evade += p.windstep;
  if (rng) fight.enemy.next = pickMove(fight.enemy, rng);
  return { ...c, fight };
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
export function fightRound(state: GameState, action: FightAction, character: Character, rng: Rng, now: number): ApplyResult {
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
  const guard: Guard = action.guard;
  let quick = false;

  // ---- a spell in the air lands --------------------------------------------------------------------------------------
  if (f.windup) {
    f.windup.rounds -= 1;
    if (f.windup.rounds <= 0) {
      const w = f.windup;
      f.windup = null;
      strike(r, w.name, w.power, 1, r.s.crit);
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
      else strike(r, 'Attack', 1, 1, r.s.crit);
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
      const meterCost = ability.meterAll ? f.meter : (ability.meter ?? 0);
      if ((ability.meter && f.meter < ability.meter) || (ability.meterAll && f.meter <= 0)) return reject(state, action, 'not enough meter');
      const manaCost = p.arcane ? Math.ceil(ability.mana * p.arcane) : ability.mana;
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
      if (rk.healShare) r.c = heal(r.c, Math.round(r.s.maxHp * rk.healShare), action, events);
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
        strike(r, ability.name, power * powerMult, rk.hits ?? 1, rk.crit ?? r.s.crit);
        if (r.done) return r.done;
      }
      if (rk.steal) {
        const gold = Math.max(1, Math.round(f.enemy.gold * rk.steal));
        r.c = { ...r.c, gold: r.c.gold + gold };
        events.push({ type: 'stolen', action: id, player, gold, total: r.c.gold });
      }
      if (f.enemy.hp > 0) {
        if (rk.stun) {
          // Mobs are stunned; minis and bosses shrug it off, or a stun every other round would rob them of the fight.
          if (f.enemy.role === 'mob') {
            f.enemy.stunned += rk.stun;
            events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'stunned', rounds: rk.stun });
          } else {
            events.push({ type: 'resisted', action: id, player, kind: 'stunned' });
          }
        }
        if (rk.weaken) {
          f.enemy.weakened = { ...rk.weaken };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: rk.weaken.rounds });
        }
        if (rk.poison) {
          f.enemy.poison = { rounds: rk.poison.rounds, damage: Math.max(1, Math.round(r.s.attack * rk.poison.power)) };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: rk.poison.rounds });
        }
      }
      break;
    }
    case 'item': {
      const item = ITEMS[move.item];
      if (!item) return reject(state, action, 'no such item');
      if ((r.c.items[move.item] ?? 0) <= 0) return reject(state, action, 'none left');
      if (!item.healShare && !item.manaShare) return reject(state, action, 'not now');
      r.c = spend(r.c, move.item);
      events.push({ type: 'used', action: id, player, item: move.item });
      if (item.healShare) r.c = heal(r.c, Math.max(1, Math.round(r.s.maxHp * item.healShare)), action, events);
      if (item.manaShare) r.c = restoreMana(r.c, Math.max(1, Math.round(r.s.maxMana * item.manaShare)), action, events);
      break;
    }
    case 'flee': {
      const ok = rng.next() < PROGRESSION.fleeChance;
      events.push({ type: 'fled', action: id, player, ok });
      if (ok) return { state: withCharacter(state, { ...r.c, fight: null }), events };
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

  // ---- the enemy's turn -------------------------------------------------------------------------------------------
  const firstStrike = f.round === 1 && (cls.firstStrike || quick);
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
      const mult = mv.power * (heavy ? PROGRESSION.enemyCharge : 1) * (f.enemy.weakened ? f.enemy.weakened.mult : 1);
      f.enemy.charged = null;
      const b = blow(f.enemy.attack, mult, r.s.defense, PROGRESSION.baseCrit, rng);
      let landed = false;
      if (heavy && p.ward && !f.used.includes('ward')) {
        f.used.push('ward');
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else if (f.evade > 0) {
        f.evade -= 1;
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else if (guard === 'dodge' && rng.next() < PROGRESSION.guards.dodge + r.s.dodge) {
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
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
        const beforeGuard = dealt;
        if (guard === 'block') dealt = Math.ceil(dealt * PROGRESSION.guards.block);
        if (guard === 'brace') {
          dealt = Math.ceil(dealt * PROGRESSION.guards.brace);
          r.c = restoreMana(r.c, PROGRESSION.guards.braceMana, action, events);
        }
        let absorbed = 0;
        if (f.barrier > 0) {
          absorbed = Math.min(f.barrier, dealt);
          f.barrier -= absorbed;
          dealt -= absorbed;
        }
        r.c = { ...r.c, hp: Math.max(0, r.c.hp - dealt) };
        events.push({ type: 'hit', action: id, player, by: 'enemy', move: name, damage: dealt, crit, hp: r.c.hp, absorbed });
        gainMeter(r, 'hurt', heavy ? 2 : 1);
        if (!survive(r)) return r.done!;
        if (guard === 'block' && p.mirror && beforeGuard > dealt + absorbed) {
          hurtEnemy(r, Math.max(1, Math.round((beforeGuard - dealt - absorbed) * p.mirror)));
          if (r.done) return r.done;
        }
        if (r.s.thorns > 0 && dealt > 0) {
          hurtEnemy(r, Math.max(1, Math.round(dealt * r.s.thorns)));
          if (r.done) return r.done;
        }
        if (guard === 'counter') {
          const back = blow(r.s.attack, PROGRESSION.guards.counter, enemyDefense(f.enemy), r.s.crit, rng);
          hurtEnemy(r, back.damage);
          gainMeter(r, 'hit', 1);
          if (r.done) return r.done;
        }
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
    const b = blow(r.s.attack, f.companion.power, enemyDefense(f.enemy), 0, rng);
    f.enemy.hp = Math.max(0, f.enemy.hp - b.damage);
    events.push({ type: 'hit', action: id, player, by: 'player', move: f.companion.name, damage: b.damage, crit: false, hp: f.enemy.hp, absorbed: 0 });
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
  gainMeter(r, 'round', 1);
  if (p.regen) r.c = heal(r.c, Math.max(1, Math.round(r.s.maxHp * p.regen)), action, events);
  f.round += 1;
  r.c = restoreMana(r.c, PROGRESSION.manaPerRound + (p.manaWell ?? 0), action, events);
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
function gainMeter(r: Round, gain: 'hurt' | 'hit' | 'round' | 'miss', n: number): void {
  const meter = CLASS_DATA[r.c.classId].meter;
  if (!meter || meter.gain !== gain || n <= 0) return;
  let add = n;
  const fury = r.s.powers.fury;
  if (fury && r.rng.next() < fury) add += 1;
  const before = r.f.meter;
  r.f.meter = Math.min(PROGRESSION.meterMax, r.f.meter + add);
  if (r.f.meter !== before) r.events.push({ type: 'meter', action: r.action.id, player: r.action.player, name: meter.name, value: r.f.meter, max: PROGRESSION.meterMax });
}

/**
 * The player hits the enemy `hits` times at `power`; a held charge, a war cry and a mark multiply; a weakening divides;
 * sure crits, Stormcaller's third hits and the Sunblade apply; lifesteal heals; Frostbrand chills and Venomtooth poisons.
 * Ends the fight (sets `done`) when the enemy falls.
 */
function strike(r: Round, move: string, power: number, hits: number, crit: number): void {
  const { f, s, rng, events } = r;
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
    let chance = crit;
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
    const b = blow(s.attack, hitPower, enemyDefense(f.enemy), chance, rng);
    f.enemy.hp = Math.max(0, f.enemy.hp - b.damage);
    events.push({ type: 'hit', action: id, player, by: 'player', move, damage: b.damage, crit: b.crit, hp: f.enemy.hp, absorbed: 0 });
    gainMeter(r, 'hit', 1);
    if (b.crit) gainMeter(r, 'miss', 1);
    if (s.lifesteal > 0) {
      const back = Math.max(1, Math.round(b.damage * s.lifesteal));
      const hp = Math.min(s.maxHp, r.c.hp + back);
      if (hp > r.c.hp) {
        events.push({ type: 'healed', action: id, player, amount: hp - r.c.hp, hp });
        r.c = { ...r.c, hp };
      }
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
  events.push({ type: 'won', action: id, player, xp, gold });
  let next: Character = { ...c, gold: c.gold + gold, fight: null };
  const levelBefore = next.level;
  next = gainXp(next, xp, action, events);
  next = questProgress(next, { beat: e.id }, action, events);

  const space = r.state.board.spaces[f.space];
  const area = space ? r.state.board.areas[space.area] : undefined;
  const rank = area?.tier ?? 1;
  let s = r.state;
  if (rng.next() < GEAR.dropChance[e.role]) {
    const got = nextGearId(s);
    s = got.state;
    const unique = rng.next() < GEAR.uniqueChance[e.role] ? rollUnique(got.id, rank, rank, rng) : null;
    if (unique) {
      next = addLoot(next, unique, action, events);
    } else {
      const slot = SLOTS[rng.int(SLOTS.length) - 1]!;
      next = addLoot(next, rollGear(got.id, slot, rank, GEAR.rarityBoost[e.role], rng), action, events);
    }
  }
  if (rng.next() < GEAR.consumableDrop.potion) {
    next = giveItem(next, 'potion', 1, action, events);
  } else if (rng.next() < GEAR.consumableDrop.card) {
    const cards = ITEM_IDS.filter((i) => ITEMS[i]!.dice);
    next = giveItem(next, cards[rng.int(cards.length) - 1]!, 1, action, events);
  }

  if (space?.kind === 'boss' && e.role === 'boss') {
    const until = now + (SPACE_KIND_DATA.boss.cooldownMs ?? 0);
    next = { ...next, cooldowns: { ...next.cooldowns, [f.space]: until }, bossKills: { ...next.bossKills, [f.space]: (next.bossKills[f.space] ?? 0) + 1 } };
    events.push({ type: 'bossDown', action: id, player, space: f.space, until });
    if (space.opens && !next.opened.includes(space.opens)) {
      // An area not laid yet grows now, from the seed, the same for everyone.
      if (!s.board.areas[space.opens]) s = { ...s, board: growBoard(s.board, s.seed, space.opens) };
      next = { ...next, opened: [...next.opened, space.opens] };
      events.push({ type: 'opened', action: id, player, area: space.opens });
    }
  }

  // The levels crossed owe their picks of one ability in two, answered on the board.
  next = offerPicks(next, rng, levelBefore, action, events);

  let spawns = s.spawns;
  if (f.spawn && spawns[f.space]) {
    spawns = { ...spawns };
    delete spawns[f.space];
    events.push({ type: 'despawned', action: id, player, space: f.space });
  }
  return { state: { ...withCharacter(s, next), spawns }, events };
}

/** The levels crossed between `from` and the character's level now owe their picks (one each), when there is something to pick. */
export function offerPicks(c: Character, rng: Rng, from: number, action: Action, events: GameEvent[]): Character {
  let next = c;
  for (const level of PROGRESSION.pickLevels) {
    if (level <= from || level > next.level) continue;
    const options = pickOptions(next, rng);
    if (options.length !== 2) break;
    next = { ...next, picks: [...next.picks, options] };
    events.push({ type: 'pickOwed', action: action.id, player: action.player, options, level });
  }
  return next;
}

/** Two abilities of the class to choose between: unknown ones first, then ones with a rank to gain. */
export function pickOptions(c: Character, rng: Rng): string[] {
  const mine = Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === c.classId);
  const unknown = mine.filter((a) => !c.abilities[a]);
  const improvable = mine.filter((a) => c.abilities[a] && c.abilities[a]! < ABILITIES[a]!.ranks.length);
  const pool = unknown.length >= 2 ? unknown : [...unknown, ...improvable];
  if (pool.length < 2) return [];
  const first = pool.splice(rng.int(pool.length) - 1, 1)[0]!;
  const second = pool.splice(rng.int(pool.length) - 1, 1)[0]!;
  return [first, second];
}

/** Beaten: back on your feet in the nearest town, HP and mana full, a fifth of the gold gone, gear kept. */
function die(state: GameState, c: Character, action: Action, events: GameEvent[]): ApplyResult {
  const lostGold = Math.floor(c.gold * PROGRESSION.deathGoldLoss);
  const town = nearestTown(state.board, c.space, new Set(c.opened));
  events.push({ type: 'died', action: action.id, player: action.player, town, lostGold });
  const woke: Character = { ...c, gold: c.gold - lostGold, space: town, steps: 0, fight: null, offer: null };
  const s = stats(woke);
  return { state: withCharacter(state, { ...woke, hp: s.maxHp, mana: s.maxMana }), events };
}
