// The game as a pure function: apply(state, action, rng) -> { state, events }.
// The state passed in is never changed; a new one comes back.

import { CLASS_DATA, DICE_DATA, ENEMIES, EVENT_CARDS, ISLAND_DATA, ITEMS, PROGRESSION, SPACE_KIND_DATA } from './data.ts';
import { buildBoard } from './island.ts';
import { checkPath, nearestTown } from './paths.ts';
import type { Rng } from './rng.ts';
import {
  STATE_VERSION,
  type Action,
  type ApplyResult,
  type Board,
  type Character,
  type ClassId,
  type Enemy,
  type GameEvent,
  type GameState,
  type RejectReason,
  type Space,
} from './types.ts';

export interface NewGameOptions {
  seed: string;
  player: string;
  name: string;
  classId: ClassId;
  /** The board to play on. Left out, the island from rules/data/board.json; the tests pass the small ring. */
  board?: Board;
}

type MoveAction = Extract<Action, { type: 'move' }>;
type FightAction = Extract<Action, { type: 'attack' | 'defend' | 'skill' | 'flee' | 'use' }>;
type BuyAction = Extract<Action, { type: 'buy' }>;
type UseAction = Extract<Action, { type: 'use' }>;

/** The island from rules/data/board.json, built fresh so the state owns it. */
export function makeBoard(): Board {
  return buildBoard(ISLAND_DATA);
}

export function makeCharacter(id: string, name: string, classId: ClassId, space: string): Character {
  const c = CLASS_DATA[classId];
  return {
    id,
    name,
    classId,
    hp: c.hp,
    maxHp: c.hp,
    attack: c.attack,
    defense: c.defense,
    gold: c.gold,
    space,
    steps: 0,
    xp: 0,
    level: 1,
    fight: null,
    items: {},
  };
}

/** The level a total of `xp` gives, from the progression table: 1 at 0 xp, the table's length at most. */
export function levelFor(xp: number): number {
  const table = PROGRESSION.xpForLevel;
  let level = 1;
  for (let i = 1; i < table.length; i++) {
    if (xp >= table[i]!) level = i + 1;
  }
  return level;
}

/** A fresh game: the board, one character on the start space, the die unrolled. */
export function newGame(o: NewGameOptions): GameState {
  const board = o.board ?? makeBoard();
  return {
    version: STATE_VERSION,
    seed: o.seed,
    board,
    characters: { [o.player]: makeCharacter(o.player, o.name, o.classId, board.start) },
    die: { sides: DICE_DATA.sides, last: null },
  };
}

export function apply(state: GameState, action: Action, rng: Rng): ApplyResult {
  const character = state.characters[action.player];
  if (!character) return reject(state, action, 'unknown player');
  switch (action.type) {
    case 'roll':
      return roll(state, action, character, rng);
    case 'move':
      return move(state, action, character, rng);
    case 'attack':
    case 'defend':
    case 'skill':
    case 'flee':
      return fight(state, action, character, rng);
    case 'buy':
      return buy(state, action, character);
    case 'use':
      return use(state, action, character, rng);
  }
}

function reject(state: GameState, action: Action, reason: RejectReason): ApplyResult {
  return { state, events: [{ type: 'rejected', action: action.id, player: action.player, reason }] };
}

function withCharacter(state: GameState, character: Character): GameState {
  return { ...state, characters: { ...state.characters, [character.id]: character } };
}

// ---- the board ---------------------------------------------------------------------------------------------------

function roll(state: GameState, action: Action, character: Character, rng: Rng): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (character.steps > 0) return reject(state, action, 'finish your move first');
  const value = rng.int(state.die.sides);
  const next = withCharacter({ ...state, die: { ...state.die, last: value } }, { ...character, steps: value });
  return { state: next, events: [{ type: 'rolled', action: action.id, player: action.player, value }] };
}

function move(state: GameState, action: MoveAction, character: Character, rng: Rng): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (character.steps === 0) return reject(state, action, 'roll first');
  const problem = checkPath(state.board, character.space, character.steps, action.path);
  if (problem) return reject(state, action, problem);
  const landing = action.path[action.path.length - 1]!;
  const space = state.board.spaces[landing]!;
  const events: GameEvent[] = [
    { type: 'moved', action: action.id, player: action.player, from: character.space, path: [...action.path] },
    { type: 'landed', action: action.id, player: action.player, space: landing, kind: space.kind },
  ];
  const arrived = land({ ...character, space: landing, steps: 0 }, space, action, rng, events);
  return { state: withCharacter(state, arrived), events };
}

/**
 * What landing on a space does (mine, 2026-10-31; numbers in data/spaces.json, events.json and enemies.json): a battle
 * draws an enemy and the fight begins, a treasure gives gold, a town heals to full, a shrine heals some, an event draws a
 * card. A shop, a quest giver and a boss gate do nothing yet. Every random draw comes from the stream, so the holder of
 * the state decides (shared-world rule 5).
 */
function land(character: Character, space: Space, action: Action, rng: Rng, events: GameEvent[]): Character {
  const kind = SPACE_KIND_DATA[space.kind];
  let c = character;
  if (space.kind === 'battle') {
    const data = ENEMIES[rng.int(ENEMIES.length) - 1]!;
    const enemy: Enemy = { id: data.id, name: data.name, hp: data.hp, maxHp: data.hp, attack: data.attack, defense: data.defense, xp: data.xp, gold: data.gold };
    events.push({ type: 'fight', action: action.id, player: action.player, enemy: { ...enemy } });
    return { ...c, fight: { enemy, round: 1, charged: false } };
  }
  if (space.kind === 'event') {
    const card = EVENT_CARDS[rng.int(EVENT_CARDS.length) - 1]!;
    events.push({ type: 'event', action: action.id, player: action.player, card: card.id, text: card.text });
    if (card.gold) c = giveGold(c, card.gold, action, events);
    if (card.heal) c = heal(c, card.heal, action, events);
    return c;
  }
  if (kind.gold) c = giveGold(c, kind.gold.min + rng.int(kind.gold.max - kind.gold.min + 1) - 1, action, events);
  if (kind.heal !== undefined) c = heal(c, kind.heal === 'full' ? c.maxHp : kind.heal, action, events);
  return c;
}

/** Gold never goes below 0: a loss takes what there is. */
function giveGold(c: Character, delta: number, action: Action, events: GameEvent[]): Character {
  const gold = Math.max(0, c.gold + delta);
  events.push({ type: 'gold', action: action.id, player: action.player, delta: gold - c.gold, gold });
  return { ...c, gold };
}

/** HP never goes above maxHp. */
function heal(c: Character, amount: number, action: Action, events: GameEvent[]): Character {
  const hp = Math.min(c.maxHp, c.hp + amount);
  events.push({ type: 'healed', action: action.id, player: action.player, amount: hp - c.hp, hp });
  return { ...c, hp };
}

// ---- items -----------------------------------------------------------------------------------------------------------

/** At a shop and out of a fight: one of the item for its price (mine, 2026-10-31; prices in data/items.json). */
function buy(state: GameState, action: BuyAction, character: Character): ApplyResult {
  const item = ITEMS[action.item];
  if (!item) return reject(state, action, 'no such item');
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (state.board.spaces[character.space]?.kind !== 'shop') return reject(state, action, 'not at a shop');
  if (character.gold < item.price) return reject(state, action, 'not enough gold');
  const gold = character.gold - item.price;
  const items = { ...character.items, [action.item]: (character.items[action.item] ?? 0) + 1 };
  return { state: withCharacter(state, { ...character, gold, items }), events: [{ type: 'bought', action: action.id, player: action.player, item: action.item, price: item.price, gold }] };
}

/**
 * Use an item. A potion is a round of the fight (the enemy strikes back) and is refused outside one. A dice card needs a
 * roll pending and no fight: it changes the steps owed, and the die shows the new number.
 */
function use(state: GameState, action: UseAction, character: Character, rng: Rng): ApplyResult {
  const item = ITEMS[action.item];
  if (!item) return reject(state, action, 'no such item');
  if ((character.items[action.item] ?? 0) <= 0) return reject(state, action, 'none left');
  if (item.heal) {
    if (!character.fight) return reject(state, action, 'not now');
    return fight(state, action, character, rng);
  }
  if (!item.dice) return reject(state, action, 'not now');
  if (character.fight || character.steps === 0) return reject(state, action, 'not now');
  let steps = character.steps;
  switch (item.dice) {
    case 'reroll':
      steps = rng.int(state.die.sides);
      break;
    case 'plus':
      steps += 1;
      break;
    case 'minus':
      steps = Math.max(1, steps - 1);
      break;
    case 'exact':
      if (!Number.isInteger(action.value) || action.value! < 1 || action.value! > state.die.sides) return reject(state, action, 'bad value');
      steps = action.value!;
      break;
  }
  const c = spend({ ...character, steps }, action.item);
  const next = withCharacter({ ...state, die: { ...state.die, last: steps } }, c);
  return {
    state: next,
    events: [
      { type: 'used', action: action.id, player: action.player, item: action.item },
      { type: 'steps', action: action.id, player: action.player, steps },
    ],
  };
}

/** One fewer of the item; a count of 0 is dropped from the bag. */
function spend(c: Character, item: string): Character {
  const items = { ...c.items, [item]: (c.items[item] ?? 0) - 1 };
  if (items[item]! <= 0) delete items[item];
  return { ...c, items };
}

// ---- the fight -----------------------------------------------------------------------------------------------------

/**
 * One round of a fight (Robin, 2026-10-31: turn-based, choices among attacks, spells and defending; the moves and the
 * numbers are mine, first settings). The player acts (a move, a guard, a potion); then the enemy strikes back, unless it
 * is dead, the player got away, or it is the first round against a class that strikes first. A hit is the attack times the move's power, less
 * half the defense, plus a swing of -2 to +2 from the stream, doubled on a crit, never under 1. A guard halves the
 * enemy's hit. Beating the enemy gives its xp and gold, and levels when the table says so; being beaten puts the
 * character on its feet in the nearest town, a fifth of the gold gone.
 */
function fight(state: GameState, action: FightAction, character: Character, rng: Rng): ApplyResult {
  if (!character.fight) return reject(state, action, 'not in a fight');
  const cls = CLASS_DATA[character.classId];
  const events: GameEvent[] = [];
  // Fresh copies of the fight and the enemy: this round scribbles on them, never on the state passed in.
  const f = { ...character.fight, enemy: { ...character.fight.enemy } };
  let c: Character = { ...character, fight: f };
  let guard = false;

  switch (action.type) {
    case 'attack':
      c = strike(c, 'Attack', 1, 1, PROGRESSION.baseCrit, action, rng, events);
      break;
    case 'defend':
      guard = true;
      events.push({ type: 'guarded', action: action.id, player: action.player });
      break;
    case 'skill': {
      const skill = cls.skill;
      if (skill.charge) {
        if (!f.charged) {
          f.charged = true;
          events.push({ type: 'charged', action: action.id, player: action.player });
        } else {
          c = strike(c, skill.name, 1, 1, skill.crit ?? PROGRESSION.baseCrit, action, rng, events);
        }
      } else {
        c = strike(c, skill.name, skill.power, skill.hits ?? 1, skill.crit ?? PROGRESSION.baseCrit, action, rng, events);
      }
      break;
    }
    case 'flee': {
      const ok = rng.next() < PROGRESSION.fleeChance;
      events.push({ type: 'fled', action: action.id, player: action.player, ok });
      if (ok) return { state: withCharacter(state, { ...c, fight: null }), events };
      break;
    }
    case 'use': {
      // A potion: checked by use() before it gets here. Drinking it is the round; the enemy still strikes.
      const amount = ITEMS[action.item]?.heal ?? 0;
      c = spend(c, action.item);
      events.push({ type: 'used', action: action.id, player: action.player, item: action.item });
      c = heal(c, amount, action, events);
      break;
    }
  }

  if (f.enemy.hp <= 0) return win(state, c, action, events);

  if (!(f.round === 1 && cls.firstStrike)) {
    const blow = damage(f.enemy.attack, 1, c.defense, PROGRESSION.baseCrit, rng);
    const dealt = guard ? Math.ceil(blow.damage / 2) : blow.damage;
    c = { ...c, hp: Math.max(0, c.hp - dealt) };
    events.push({ type: 'hit', action: action.id, player: action.player, by: 'enemy', move: f.enemy.name, damage: dealt, crit: blow.crit, hp: c.hp });
    if (c.hp <= 0) return die(state, c, action, events);
  }
  f.round += 1;
  return { state: withCharacter(state, c), events };
}

/** The player hits the enemy `hits` times at `power`; a charge held from before multiplies the move and is spent. */
function strike(c: Character, move: string, power: number, hits: number, crit: number, action: Action, rng: Rng, events: GameEvent[]): Character {
  const f = c.fight!;
  if (f.charged) {
    power *= CLASS_DATA[c.classId].skill.power;
    f.charged = false;
  }
  for (let i = 0; i < hits && f.enemy.hp > 0; i++) {
    const blow = damage(c.attack, power, f.enemy.defense, crit, rng);
    f.enemy.hp = Math.max(0, f.enemy.hp - blow.damage);
    events.push({ type: 'hit', action: action.id, player: action.player, by: 'player', move, damage: blow.damage, crit: blow.crit, hp: f.enemy.hp });
  }
  return c;
}

/** One blow: two numbers from the stream, the swing then the crit. */
function damage(attack: number, power: number, defense: number, critChance: number, rng: Rng): { damage: number; crit: boolean } {
  const base = Math.max(1, Math.round(attack * power) - Math.floor(defense / 2));
  const swing = rng.int(5) - 3;
  const crit = rng.next() < critChance;
  return { damage: Math.max(1, Math.round((base + swing) * (crit ? PROGRESSION.critPower : 1))), crit };
}

function win(state: GameState, c: Character, action: Action, events: GameEvent[]): ApplyResult {
  const enemy = c.fight!.enemy;
  events.push({ type: 'won', action: action.id, player: action.player, xp: enemy.xp, gold: enemy.gold });
  let next: Character = { ...c, gold: c.gold + enemy.gold, xp: c.xp + enemy.xp, fight: null };
  const growth = CLASS_DATA[c.classId].growth;
  for (let level = c.level + 1; level <= levelFor(next.xp); level++) {
    next = {
      ...next,
      level,
      maxHp: next.maxHp + growth.hp,
      hp: next.hp + growth.hp,
      attack: next.attack + growth.attack,
      defense: next.defense + growth.defense,
    };
    events.push({ type: 'levelled', action: action.id, player: action.player, level, maxHp: next.maxHp, attack: next.attack, defense: next.defense });
  }
  return { state: withCharacter(state, next), events };
}

function die(state: GameState, c: Character, action: Action, events: GameEvent[]): ApplyResult {
  const lostGold = Math.floor(c.gold * PROGRESSION.deathGoldLoss);
  const town = nearestTown(state.board, c.space);
  events.push({ type: 'died', action: action.id, player: action.player, town, lostGold });
  return { state: withCharacter(state, { ...c, hp: c.maxHp, gold: c.gold - lostGold, space: town, steps: 0, fight: null }), events };
}
