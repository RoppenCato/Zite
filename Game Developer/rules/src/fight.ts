// The fight (Robin, 2026-10-31): a turn-based RPG. The player attacks, casts an ability, charges, drinks a potion or
// runs; then chooses a guard; then the enemy moves, with wind-ups to read and a stun, a poison or a weakening to
// suffer. Every number comes from the stream. The moves, the guards and all the numbers are mine, first settings.

import { ABILITIES, CLASS_DATA, ENEMIES, GEAR, ITEMS, ITEM_IDS, PROGRESSION, SPACE_KIND_DATA } from './data.ts';
import { addLoot, gainXp, giveItem, heal, nextGearId, reject, restoreMana, spend, withCharacter } from './common.ts';
import { rollGear, stats, type Stats } from './gear.ts';
import { nearestTown } from './paths.ts';
import type { Rng } from './rng.ts';
import { SLOTS, type Action, type ApplyResult, type Character, type Enemy, type EnemyMove, type Fight, type GameEvent, type GameState, type Guard } from './types.ts';

type FightAction = Extract<Action, { type: 'fight' }>;

/** An enemy fresh from the data, ready to fight. */
export function makeEnemy(id: string): Enemy {
  const d = ENEMIES[id];
  if (!d) throw new Error(`no such enemy: ${id}`);
  return { id, name: d.name, level: d.level, role: d.role, hp: d.hp, maxHp: d.hp, attack: d.attack, defense: d.defense, xp: d.xp, gold: d.gold, moves: d.moves.map((m) => ({ ...m })), charged: null, stunned: 0, weakened: null, poison: null };
}

/** The character squared up to the enemy on this space. */
export function startFight(c: Character, enemyId: string, space: string, spawn: boolean): Character {
  const fight: Fight = { enemy: makeEnemy(enemyId), round: 1, charged: false, attackUp: null, barrier: 0, evade: 0, space, spawn };
  return { ...c, fight };
}

/** One blow: the swing then the crit from the stream. `attack` is the striker's effective attack. */
function blow(attack: number, power: number, defense: number, critChance: number, rng: Rng): { damage: number; crit: boolean } {
  const base = Math.max(1, Math.round(attack * power) - Math.floor(defense / 2));
  const swing = rng.int(5) - 3;
  const crit = rng.next() < critChance;
  return { damage: Math.max(1, Math.round((base + swing) * (crit ? PROGRESSION.critPower : 1))), crit };
}

/** The enemy's move for this round, by weight; a wind-up is never picked twice in a row. */
function pickMove(enemy: Enemy, rng: Rng): EnemyMove {
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

/**
 * One round. The player's move first; the enemy's poison bites; then the enemy's turn unless it is dead, the player
 * got away, it is stunned, or it is the first round against a class that strikes first. The guard is read when the
 * blow comes. Effects count down at the end; mana trickles back.
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
    ...old,
    enemy: { ...old.enemy, moves: old.enemy.moves, weakened: old.enemy.weakened ? { ...old.enemy.weakened } : null, poison: old.enemy.poison ? { ...old.enemy.poison } : null },
    attackUp: old.attackUp ? { ...old.attackUp } : null,
  };
  let c: Character = { ...character, fight: f };
  const s = stats(c);
  const guard: Guard = action.guard;

  // ---- the player's move ------------------------------------------------------------------------------------------
  const move = action.move;
  switch (move.kind) {
    case 'attack':
      c = strike(c, s, 'Attack', 1, 1, s.crit, id, player, rng, events);
      break;
    case 'charge':
      if (f.charged) return reject(state, action, 'not now');
      f.charged = true;
      events.push({ type: 'charged', action: id, player, by: 'player', move: 'Charge' });
      break;
    case 'ability': {
      const ability = ABILITIES[move.ability];
      const rank = c.abilities[move.ability] ?? 0;
      if (!ability || rank <= 0) return reject(state, action, 'no such ability');
      if (c.mana < ability.mana) return reject(state, action, 'not enough mana');
      c = { ...c, mana: c.mana - ability.mana };
      events.push({ type: 'mana', action: id, player, delta: -ability.mana, mana: c.mana });
      const r = ability.ranks[Math.min(rank, ability.ranks.length) - 1]!;
      if (r.attackUp) {
        f.attackUp = { ...r.attackUp };
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'attackUp', rounds: r.attackUp.rounds });
      }
      if (r.barrier) {
        f.barrier += r.barrier;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'barrier', rounds: r.barrier });
      }
      if (r.evade) {
        f.evade += r.evade;
        events.push({ type: 'effect', action: id, player, target: 'player', kind: 'evade', rounds: r.evade });
      }
      if (r.power) c = strike(c, s, ability.name, r.power, r.hits ?? 1, r.crit ?? s.crit, id, player, rng, events);
      if (f.enemy.hp > 0) {
        if (r.stun) {
          // Mobs are stunned; minis and bosses shrug it off, or a stun every other round would rob them of the fight.
          if (f.enemy.role === 'mob') {
            f.enemy.stunned += r.stun;
            events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'stunned', rounds: r.stun });
          } else {
            events.push({ type: 'resisted', action: id, player, kind: 'stunned' });
          }
        }
        if (r.weaken) {
          f.enemy.weakened = { ...r.weaken };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'weakened', rounds: r.weaken.rounds });
        }
        if (r.poison) {
          f.enemy.poison = { rounds: r.poison.rounds, damage: Math.max(1, Math.round(s.attack * r.poison.power)) };
          events.push({ type: 'effect', action: id, player, target: 'enemy', kind: 'poison', rounds: r.poison.rounds });
        }
      }
      break;
    }
    case 'item': {
      const item = ITEMS[move.item];
      if (!item) return reject(state, action, 'no such item');
      if ((c.items[move.item] ?? 0) <= 0) return reject(state, action, 'none left');
      if (!item.heal) return reject(state, action, 'not now');
      c = spend(c, move.item);
      events.push({ type: 'used', action: id, player, item: move.item });
      c = heal(c, item.heal, action, events);
      break;
    }
    case 'flee': {
      const ok = rng.next() < PROGRESSION.fleeChance;
      events.push({ type: 'fled', action: id, player, ok });
      if (ok) return { state: withCharacter(state, { ...c, fight: null }), events };
      break;
    }
  }
  if (f.enemy.hp <= 0) return win(state, c, action, rng, events, now);

  // ---- the enemy's poison -----------------------------------------------------------------------------------------
  if (f.enemy.poison) {
    f.enemy.hp = Math.max(0, f.enemy.hp - f.enemy.poison.damage);
    events.push({ type: 'poisoned', action: id, player, damage: f.enemy.poison.damage, hp: f.enemy.hp });
    f.enemy.poison.rounds -= 1;
    if (f.enemy.poison.rounds <= 0) f.enemy.poison = null;
    if (f.enemy.hp <= 0) return win(state, c, action, rng, events, now);
  }

  // ---- the enemy's turn -------------------------------------------------------------------------------------------
  const firstStrike = f.round === 1 && cls.firstStrike;
  if (f.enemy.stunned > 0) {
    f.enemy.stunned -= 1;
    events.push({ type: 'skipped', action: id, player, by: 'enemy', reason: 'stunned' });
  } else if (!firstStrike) {
    const mv = pickMove(f.enemy, rng);
    if (mv.charge && !f.enemy.charged) {
      f.enemy.charged = mv.name;
      events.push({ type: 'charged', action: id, player, by: 'enemy', move: mv.name });
    } else {
      if (guard !== 'none') events.push({ type: 'guarded', action: id, player, guard });
      const name = f.enemy.charged ?? mv.name;
      const mult = mv.power * (f.enemy.charged ? PROGRESSION.enemyCharge : 1) * (f.enemy.weakened ? f.enemy.weakened.mult : 1);
      f.enemy.charged = null;
      const b = blow(f.enemy.attack, mult, s.defense, PROGRESSION.baseCrit, rng);
      if (f.evade > 0) {
        f.evade -= 1;
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else if (guard === 'dodge' && rng.next() < PROGRESSION.guards.dodge + s.dodge) {
        events.push({ type: 'missed', action: id, player, by: 'enemy', move: name });
      } else {
        let dealt = b.damage;
        if (guard === 'block') dealt = Math.ceil(dealt * PROGRESSION.guards.block);
        if (guard === 'brace') {
          dealt = Math.ceil(dealt * PROGRESSION.guards.brace);
          c = restoreMana(c, PROGRESSION.guards.braceMana, action, events);
        }
        let absorbed = 0;
        if (f.barrier > 0) {
          absorbed = Math.min(f.barrier, dealt);
          f.barrier -= absorbed;
          dealt -= absorbed;
        }
        c = { ...c, hp: Math.max(0, c.hp - dealt) };
        events.push({ type: 'hit', action: id, player, by: 'enemy', move: name, damage: dealt, crit: b.crit, hp: c.hp, absorbed });
        if (c.hp <= 0) return die(state, c, action, events);
        if (s.thorns > 0 && dealt > 0) {
          const back = Math.max(1, Math.round(dealt * s.thorns));
          f.enemy.hp = Math.max(0, f.enemy.hp - back);
          events.push({ type: 'countered', action: id, player, damage: back, hp: f.enemy.hp });
          if (f.enemy.hp <= 0) return win(state, c, action, rng, events, now);
        }
        if (guard === 'counter') {
          const back = blow(s.attack, PROGRESSION.guards.counter, f.enemy.defense, s.crit, rng);
          f.enemy.hp = Math.max(0, f.enemy.hp - back.damage);
          events.push({ type: 'countered', action: id, player, damage: back.damage, hp: f.enemy.hp });
          if (f.enemy.hp <= 0) return win(state, c, action, rng, events, now);
        }
      }
    }
    if (f.enemy.weakened) {
      f.enemy.weakened.rounds -= 1;
      if (f.enemy.weakened.rounds <= 0) f.enemy.weakened = null;
    }
  }

  // ---- the round ends ---------------------------------------------------------------------------------------------
  if (f.attackUp) {
    f.attackUp.rounds -= 1;
    if (f.attackUp.rounds <= 0) f.attackUp = null;
  }
  f.round += 1;
  c = restoreMana(c, PROGRESSION.manaPerRound, action, events);
  return { state: withCharacter(state, c), events };
}

/** The player hits the enemy `hits` times at `power`; a held charge and a war cry multiply; lifesteal heals. */
function strike(c: Character, s: Stats, move: string, power: number, hits: number, crit: number, id: string, player: string, rng: Rng, events: GameEvent[]): Character {
  const f = c.fight!;
  if (f.charged) {
    power *= PROGRESSION.charge;
    f.charged = false;
  }
  if (f.attackUp) power *= f.attackUp.mult;
  let next = c;
  for (let i = 0; i < hits && f.enemy.hp > 0; i++) {
    const b = blow(s.attack, power, f.enemy.defense, crit, rng);
    f.enemy.hp = Math.max(0, f.enemy.hp - b.damage);
    events.push({ type: 'hit', action: id, player, by: 'player', move, damage: b.damage, crit: b.crit, hp: f.enemy.hp, absorbed: 0 });
    if (s.lifesteal > 0) {
      const back = Math.max(1, Math.round(b.damage * s.lifesteal));
      const hp = Math.min(s.maxHp, next.hp + back);
      if (hp > next.hp) {
        events.push({ type: 'healed', action: id, player, amount: hp - next.hp, hp });
        next = { ...next, hp };
      }
    }
  }
  return next;
}

/** The enemy is down: xp, gold, loot; a boss opens the way and goes away for a while; a spawn is cleared. */
function win(state: GameState, c: Character, action: Action, rng: Rng, events: GameEvent[], now: number): ApplyResult {
  const f = c.fight!;
  const e = f.enemy;
  const id = action.id;
  const player = action.player;
  events.push({ type: 'won', action: id, player, xp: e.xp, gold: e.gold });
  let next: Character = { ...c, gold: c.gold + e.gold, fight: null };
  next = gainXp(next, e.xp, action, events);

  const space = state.board.spaces[f.space];
  const area = space ? state.board.areas[space.area] : undefined;
  const rank = area?.tier ?? 1;
  let s = state;
  if (rng.next() < GEAR.dropChance[e.role]) {
    const slot = SLOTS[rng.int(SLOTS.length) - 1]!;
    const got = nextGearId(s);
    s = got.state;
    next = addLoot(next, rollGear(got.id, slot, rank, GEAR.rarityBoost[e.role], rng), action, events);
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
      next = { ...next, opened: [...next.opened, space.opens] };
      events.push({ type: 'opened', action: id, player, area: space.opens });
    }
  }

  let spawns = s.spawns;
  if (f.spawn && spawns[f.space]) {
    spawns = { ...spawns };
    delete spawns[f.space];
    events.push({ type: 'despawned', action: id, player, space: f.space });
  }
  return { state: { ...withCharacter(s, next), spawns }, events };
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
