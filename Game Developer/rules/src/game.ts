// The game as a pure function: apply(state, action, rng, now) -> { state, events }.
// The state passed in is never changed; a new one comes back. `now` is the holder's clock in ms, for spots that give
// again after a while and for spawns; the rules never read a clock themselves.

import { ABILITIES, CLASS_DATA, DICE_DATA, GEAR, ITEMS, ITEM_IDS, PROGRESSION, QUESTS, SPACE_KIND_DATA, SURPRISES, WORLD_DATA } from './data.ts';
import { addLoot, gainXp, giveGold, giveItem, nextGearId, reject, sellPrice, spend, withCharacter } from './common.ts';
import { fightRound, intentEvent, offerPicks, startFight } from './fight.ts';
import { plainGear, powers, rollGear, rollUnique, stats } from './gear.ts';
import { newQuest, questLine, questProgress } from './quests.ts';
import { checkPath } from './paths.ts';
import type { Rng } from './rng.ts';
import { buildBoard } from './world.ts';
import {
  SLOTS,
  STATE_VERSION,
  type Action,
  type ApplyResult,
  type Board,
  type Character,
  type ClassId,
  type GameEvent,
  type GameState,
  type Space,
  type Spawn,
} from './types.ts';

export interface NewGameOptions {
  seed: string;
  player: string;
  name: string;
  classId: ClassId;
  /** The board to play on. Left out, the world from rules/data/world.json; the tests pass the small ring. */
  board?: Board;
}

type MoveAction = Extract<Action, { type: 'move' }>;
type BuyAction = Extract<Action, { type: 'buy' }>;
type SellAction = Extract<Action, { type: 'sell' }>;
type EquipAction = Extract<Action, { type: 'equip' }>;
type UnequipAction = Extract<Action, { type: 'unequip' }>;
type DropAction = Extract<Action, { type: 'drop' }>;
type UseAction = Extract<Action, { type: 'use' }>;
type GambleAction = Extract<Action, { type: 'gamble' }>;
type PickAction = Extract<Action, { type: 'pick' }>;
type QuestAction = Extract<Action, { type: 'quest' }>;
type KeepAction = Extract<Action, { type: 'keep' }>;

/** The world from rules/data/world.json, built fresh so the state owns it. */
export function makeBoard(): Board {
  return buildBoard(WORLD_DATA);
}

export function makeCharacter(id: string, name: string, classId: ClassId, board: Board): Character {
  const c = CLASS_DATA[classId];
  const start = board.spaces[board.start]!;
  const abilities: Record<string, number> = {};
  for (const ability of c.kit) abilities[ability] = 1;
  return {
    id,
    name,
    classId,
    level: 1,
    xp: 0,
    gold: c.gold,
    hp: c.hp,
    mana: c.mana,
    maxHp: c.hp,
    maxMana: c.mana,
    attack: c.attack,
    defense: c.defense,
    space: board.start,
    steps: 0,
    fight: null,
    items: {},
    equipment: { weapon: null, armour: null, helm: null, boots: null, trinket: null },
    bag: [],
    abilities,
    opened: [start.area],
    cooldowns: {},
    bossKills: {},
    offer: null,
    quests: [],
    picks: [],
  };
}

/** A fresh game: the board, one character on the start space, the die unrolled, nothing spawned. */
export function newGame(o: NewGameOptions): GameState {
  const board = o.board ?? makeBoard();
  return {
    version: STATE_VERSION,
    seed: o.seed,
    board,
    characters: { [o.player]: makeCharacter(o.player, o.name, o.classId, board) },
    die: { sides: DICE_DATA.sides, last: null },
    spawns: {},
    nextItem: 1,
  };
}

export function apply(state: GameState, action: Action, rng: Rng, now = 0): ApplyResult {
  if (action.type === 'tick') return tick(state, action, rng, now);
  const character = state.characters[action.player];
  if (!character) return reject(state, action, 'unknown player');
  switch (action.type) {
    case 'roll':
      return roll(state, action, character, rng);
    case 'move':
      return move(state, action, character, rng, now);
    case 'fight':
      return fightRound(state, action, character, rng, now);
    case 'buy':
      return buy(state, action, character);
    case 'sell':
      return sell(state, action, character);
    case 'equip':
      return equip(state, action, character);
    case 'unequip':
      return unequip(state, action, character);
    case 'drop':
      return drop(state, action, character);
    case 'use':
      return useCard(state, action, character, rng, now);
    case 'gamble':
      return gamble(state, action, character, rng);
    case 'pick':
      return pick(state, action, character);
    case 'quest':
      return answerQuest(state, action, character, now);
    case 'keep':
      return keep(state, action, character);
  }
}

/** Why the board will not take a turn right now, or null. */
function boardBusy(c: Character): 'finish the fight first' | 'answer first' | null {
  if (c.fight) return 'finish the fight first';
  if (c.offer || c.picks.length) return 'answer first';
  return null;
}

// ---- the board -------------------------------------------------------------------------------------------------------

function roll(state: GameState, action: Action, character: Character, rng: Rng): ApplyResult {
  const busy = boardBusy(character);
  if (busy) return reject(state, action, busy);
  if (character.steps > 0) return reject(state, action, 'finish your move first');
  const value = rng.int(state.die.sides);
  const events: GameEvent[] = [{ type: 'rolled', action: action.id, player: action.player, value }];
  // Striders: a roll of one becomes two.
  const strider = powers(character).strider;
  const steps = value === 1 && strider ? strider : value;
  if (steps !== value) events.push({ type: 'steps', action: action.id, player: action.player, steps });
  const next = withCharacter({ ...state, die: { ...state.die, last: steps } }, { ...character, steps });
  return { state: next, events };
}

function move(state: GameState, action: MoveAction, character: Character, rng: Rng, now: number): ApplyResult {
  const busy = boardBusy(character);
  if (busy) return reject(state, action, busy);
  if (character.steps === 0) return reject(state, action, 'roll first');
  const problem = checkPath(state.board, character.space, character.steps, action.path, new Set(character.opened));
  if (problem) return reject(state, action, problem);
  const landing = action.path[action.path.length - 1]!;
  const space = state.board.spaces[landing]!;
  const events: GameEvent[] = [
    { type: 'moved', action: action.id, player: action.player, from: character.space, path: [...action.path] },
    { type: 'landed', action: action.id, player: action.player, space: landing, kind: space.kind },
  ];
  return land(state, { ...character, space: landing, steps: 0 }, space, action, rng, now, events);
}

/**
 * What landing on a spot does (mine, 2026-10-31, after Robin's spot list of the same day): a town rests you; a chest,
 * a spring and a shrine give once and then again after a while; a boss spot starts the boss fight if the boss is back;
 * the wilds roll what turns up: a fight with the area's creatures most of the time, else a chest, a merchant, a gamble
 * or a mini-boss, or whatever has spawned there. A shop does nothing on landing: the shop is open while you stand there.
 */
function land(state: GameState, c: Character, space: Space, action: Action, rng: Rng, now: number, events: GameEvent[]): ApplyResult {
  const id = action.id;
  const player = action.player;
  const area = state.board.areas[space.area];
  const tier = area?.tier ?? 1;
  const kind = SPACE_KIND_DATA[space.kind];
  const onCooldown = (c.cooldowns[space.id] ?? 0) > now;
  // Pathfinders: chests, springs and shrines give again in half the time.
  const pathfinder = space.kind === 'chest' || space.kind === 'potion' || space.kind === 'spell' ? powers(c).pathfinder : undefined;
  const wait = (kind.cooldownMs ?? 0) * (pathfinder ? 0.5 : 1);
  const cooled = (ch: Character): Character => (wait ? { ...ch, cooldowns: { ...ch.cooldowns, [space.id]: now + wait } } : ch);
  const empty = (): ApplyResult => {
    events.push({ type: 'empty', action: id, player, space: space.id, until: c.cooldowns[space.id] ?? now });
    return { state: withCharacter(state, c), events };
  };

  switch (space.kind) {
    case 'town': {
      const s = stats(c);
      let rested: Character = { ...c, hp: s.maxHp, mana: s.maxMana };
      events.push({ type: 'rested', action: id, player, hp: rested.hp, mana: rested.mana });
      // The town's errand: paid when done, told when not, offered when there is none from here.
      const mine = rested.quests.find((q) => q.town === space.id);
      let st = state;
      if (mine && mine.done >= mine.count) {
        events.push({ type: 'questDone', action: id, player, quest: mine });
        rested = { ...rested, quests: rested.quests.filter((q) => q !== mine), cooldowns: { ...rested.cooldowns, [`quest:${space.id}`]: now + QUESTS.cooldownMs } };
        rested = giveGold(rested, mine.gold, action, events);
        rested = gainXp(rested, mine.xp, action, events);
        rested = offerPicks(rested, rng, c.level, action, events);
        if (mine.unique > 0 && rng.next() < mine.unique) {
          const got = nextGearId(st);
          st = got.state;
          const unique = rollUnique(got.id, tier, tier, rng);
          if (unique) rested = addLoot(rested, unique, action, events);
        }
      } else if (mine) {
        events.push({ type: 'nothing', action: id, player, text: `Your errand here: ${questLine(mine)}` });
      } else if ((c.cooldowns[`quest:${space.id}`] ?? 0) <= now && rested.quests.length < QUESTS.maxActive && !rested.offer) {
        const quest = newQuest(state, rested, space, rng);
        if (quest) {
          rested = { ...rested, offer: { kind: 'quest', quest } };
          events.push({ type: 'offer', action: id, player, offer: rested.offer! });
        }
      }
      return { state: withCharacter(st, rested), events };
    }
    case 'shop':
      return { state: withCharacter(state, c), events };
    case 'chest': {
      if (onCooldown) return empty();
      return openChest(state, cooled(c), tier, space.area, action, rng, events);
    }
    case 'potion': {
      if (onCooldown) return empty();
      return { state: withCharacter(state, giveItem(giveItem(cooled(c), 'potion', 1, action, events), 'mana-potion', 1, action, events)), events };
    }
    case 'spell': {
      if (onCooldown) return empty();
      return { state: withCharacter(state, learn(cooled(c), action, rng, events)), events };
    }
    case 'boss': {
      if (!space.boss) return { state: withCharacter(state, c), events };
      if (onCooldown) {
        events.push({ type: 'nothing', action: id, player, text: `${space.name} is quiet: the boss is not back yet.` });
        return { state: withCharacter(state, c), events };
      }
      return begin(state, c, space.boss, space.id, false, action, rng, events);
    }
    case 'normal': {
      const spawn = state.spawns[space.id];
      if (spawn?.kind === 'miniboss' && spawn.enemy) return begin(state, c, spawn.enemy, space.id, true, action, rng, events);
      if (spawn?.kind === 'merchant') {
        events.push({ type: 'merchant', action: id, player });
        return { state: withCharacter(state, c), events };
      }
      const what = surprise(rng);
      if (what === 'chest') return openChest(state, c, tier, space.area, action, rng, events);
      if (what === 'merchant') {
        events.push({ type: 'merchant', action: id, player });
        return { state: withCharacter(state, c), events };
      }
      if (what === 'gamble' && c.gold > 0) {
        const stake = Math.min(c.gold, PROGRESSION.gamble.stakePerTier * tier);
        const offered = { ...c, offer: { kind: 'gamble' as const, stake } };
        events.push({ type: 'offer', action: id, player, offer: offered.offer! });
        return { state: withCharacter(state, offered), events };
      }
      if (what === 'miniboss' && area && area.miniBosses.length) {
        return begin(state, c, area.miniBosses[rng.int(area.miniBosses.length) - 1]!, space.id, false, action, rng, events);
      }
      const mobs = area?.mobs ?? [];
      if (!mobs.length) return { state: withCharacter(state, c), events };
      return begin(state, c, mobs[rng.int(mobs.length) - 1]!, space.id, false, action, rng, events);
    }
  }
}

/** What a normal spot holds this time, by the weights in surprises.json. One number from the stream. */
function surprise(rng: Rng): keyof typeof SURPRISES {
  const entries = Object.entries(SURPRISES) as [keyof typeof SURPRISES, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let pick = rng.next() * total;
  for (const [what, w] of entries) {
    pick -= w;
    if (pick < 0) return what;
  }
  return 'fight';
}

function begin(state: GameState, c: Character, enemy: string, space: string, spawn: boolean, action: Action, rng: Rng, events: GameEvent[]): ApplyResult {
  const fighting = startFight(c, enemy, space, spawn, state.board.bestiary, rng);
  const e = fighting.fight!.enemy;
  events.push({ type: 'fight', action: action.id, player: action.player, enemy: { ...e, moves: e.moves.map((m) => ({ ...m })) }, space });
  events.push(intentEvent(e, action.id, action.player));
  return { state: withCharacter(state, fighting), events };
}

/** A chest: gold by the tier, maybe gear of the tier's rank, maybe a potion or a card; an errand for chests moves along. */
function openChest(state: GameState, c: Character, tier: number, areaId: string, action: Action, rng: Rng, events: GameEvent[]): ApplyResult {
  events.push({ type: 'chest', action: action.id, player: action.player });
  const [lo, hi] = PROGRESSION.chest.gold;
  let next = giveGold(questProgress(c, { chest: areaId }, action, events), tier * (lo + rng.int(hi - lo + 1) - 1), action, events);
  let s = state;
  if (rng.next() < PROGRESSION.chest.gearChance) {
    const slot = SLOTS[rng.int(SLOTS.length) - 1]!;
    const got = nextGearId(s);
    s = got.state;
    next = addLoot(next, rollGear(got.id, slot, tier, 0, rng), action, events);
  }
  if (rng.next() < PROGRESSION.chest.consumableChance) {
    const cards = ITEM_IDS.filter((i) => ITEMS[i]!.dice);
    const roll = rng.next();
    next = roll < 0.4 ? giveItem(next, 'potion', 1, action, events) : roll < 0.6 ? giveItem(next, 'mana-potion', 1, action, events) : giveItem(next, cards[rng.int(cards.length) - 1]!, 1, action, events);
  }
  return { state: withCharacter(s, next), events };
}

/** A shrine: a new ability of the class if one is left, else a rank for one known, else nothing. */
function learn(c: Character, action: Action, rng: Rng, events: GameEvent[]): Character {
  const mine = Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === c.classId);
  const unknown = mine.filter((a) => !c.abilities[a]);
  if (unknown.length) {
    const ability = unknown[rng.int(unknown.length) - 1]!;
    events.push({ type: 'learned', action: action.id, player: action.player, ability, rank: 1 });
    return { ...c, abilities: { ...c.abilities, [ability]: 1 } };
  }
  const improvable = mine.filter((a) => (c.abilities[a] ?? 0) < ABILITIES[a]!.ranks.length);
  if (improvable.length) {
    const ability = improvable[rng.int(improvable.length) - 1]!;
    const rank = (c.abilities[ability] ?? 0) + 1;
    events.push({ type: 'learned', action: action.id, player: action.player, ability, rank });
    return { ...c, abilities: { ...c.abilities, [ability]: rank } };
  }
  events.push({ type: 'nothing', action: action.id, player: action.player, text: 'The shrine has nothing more to teach you.' });
  return c;
}

// ---- the shop and the bag ---------------------------------------------------------------------------------------------

/** A shop is where you stand on one, in a town, or where a merchant has camped. */
function atShop(state: GameState, c: Character): boolean {
  const kind = state.board.spaces[c.space]?.kind;
  return kind === 'shop' || kind === 'town' || state.spawns[c.space]?.kind === 'merchant';
}

function buy(state: GameState, action: BuyAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (action.ability !== undefined) return train(state, action, character, action.ability);
  if (!atShop(state, character)) return reject(state, action, 'not at a shop');
  if (action.item !== undefined) {
    const item = ITEMS[action.item];
    if (!item) return reject(state, action, 'no such item');
    if (character.gold < item.price) return reject(state, action, 'not enough gold');
    const gold = character.gold - item.price;
    const items = { ...character.items, [action.item]: (character.items[action.item] ?? 0) + 1 };
    return { state: withCharacter(state, { ...character, gold, items }), events: [{ type: 'bought', action: action.id, player: action.player, item: action.item, gear: null, price: item.price, gold }] };
  }
  if (action.slot !== undefined && SLOTS.includes(action.slot)) {
    const tier = state.board.areas[state.board.spaces[character.space]!.area]?.tier ?? 1;
    const got = nextGearId(state);
    const gear = plainGear(got.id, action.slot, tier);
    if (character.gold < gear.price) return reject(state, action, 'not enough gold');
    if (character.bag.length >= GEAR.bagLimit) return reject(state, action, 'bag full');
    const gold = character.gold - gear.price;
    return { state: withCharacter(got.state, { ...character, gold, bag: [...character.bag, gear] }), events: [{ type: 'bought', action: action.id, player: action.player, item: null, gear, price: gear.price, gold }] };
  }
  return reject(state, action, 'no such item');
}

/**
 * The trainer, in a town (Robin, 2026-10-31: skills are bought, found or earned): an ability of the class not yet known
 * for `training.learn` times the tier, a rank for one known for `training.rank` times the tier times the rank it has.
 */
function train(state: GameState, action: BuyAction, character: Character, abilityId: string): ApplyResult {
  const here = state.board.spaces[character.space];
  if (here?.kind !== 'town') return reject(state, action, 'not in a town');
  const ability = ABILITIES[abilityId];
  if (!ability || ability.classId !== character.classId) return reject(state, action, 'no such ability');
  const rank = character.abilities[abilityId] ?? 0;
  if (rank >= ability.ranks.length) return reject(state, action, 'not now');
  const tier = state.board.areas[here.area]?.tier ?? 1;
  const price = rank === 0 ? PROGRESSION.training.learn * tier : PROGRESSION.training.rank * tier * rank;
  if (character.gold < price) return reject(state, action, 'not enough gold');
  const gold = character.gold - price;
  const next = { ...character, gold, abilities: { ...character.abilities, [abilityId]: rank + 1 } };
  return { state: withCharacter(state, next), events: [{ type: 'trained', action: action.id, player: action.player, ability: abilityId, rank: rank + 1, price, gold }] };
}

function sell(state: GameState, action: SellAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (!atShop(state, character)) return reject(state, action, 'not at a shop');
  const gear = character.bag.find((g) => g.id === action.gear);
  if (!gear) return reject(state, action, 'no such gear');
  const price = sellPrice(gear);
  const gold = character.gold + price;
  return { state: withCharacter(state, { ...character, gold, bag: character.bag.filter((g) => g.id !== gear.id) }), events: [{ type: 'sold', action: action.id, player: action.player, gear, price, gold }] };
}

/** HP and mana never above the maximum after a change of gear. */
function capped(c: Character): Character {
  const s = stats(c);
  return { ...c, hp: Math.min(c.hp, s.maxHp), mana: Math.min(c.mana, s.maxMana) };
}

function equip(state: GameState, action: EquipAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  const gear = character.bag.find((g) => g.id === action.gear);
  if (!gear) return reject(state, action, 'no such gear');
  const replaced = character.equipment[gear.slot];
  const bag = character.bag.filter((g) => g.id !== gear.id);
  if (replaced) bag.push(replaced);
  const next = capped({ ...character, bag, equipment: { ...character.equipment, [gear.slot]: gear } });
  return { state: withCharacter(state, next), events: [{ type: 'equipped', action: action.id, player: action.player, gear, replaced }] };
}

function unequip(state: GameState, action: UnequipAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  const gear = SLOTS.includes(action.slot) ? character.equipment[action.slot] : null;
  if (!gear) return reject(state, action, 'no such gear');
  const next = capped({ ...character, bag: [...character.bag, gear], equipment: { ...character.equipment, [action.slot]: null } });
  return { state: withCharacter(state, next), events: [{ type: 'unequipped', action: action.id, player: action.player, gear }] };
}

function drop(state: GameState, action: DropAction, character: Character): ApplyResult {
  const gear = character.bag.find((g) => g.id === action.gear);
  if (!gear) return reject(state, action, 'no such gear');
  return { state: withCharacter(state, { ...character, bag: character.bag.filter((g) => g.id !== gear.id) }), events: [{ type: 'dropped', action: action.id, player: action.player, gear }] };
}

/**
 * A dice card: a roll must be pending and the board free. It changes the steps owed and the die shows the new number.
 * The item `charm` is no card but a worn Lucky Charm: a re-roll once every so often (its value, in ms).
 */
function useCard(state: GameState, action: UseAction, character: Character, rng: Rng, now: number): ApplyResult {
  if (action.item === 'charm') {
    const lucky = powers(character).lucky;
    if (!lucky) return reject(state, action, 'no such item');
    const busy = boardBusy(character);
    if (busy) return reject(state, action, busy);
    if (character.steps === 0 || (character.cooldowns.charm ?? 0) > now) return reject(state, action, 'not now');
    const steps = rng.int(state.die.sides);
    const c = { ...character, steps, cooldowns: { ...character.cooldowns, charm: now + lucky } };
    return {
      state: withCharacter({ ...state, die: { ...state.die, last: steps } }, c),
      events: [
        { type: 'used', action: action.id, player: action.player, item: 'charm' },
        { type: 'steps', action: action.id, player: action.player, steps },
      ],
    };
  }
  const item = ITEMS[action.item];
  if (!item) return reject(state, action, 'no such item');
  if ((character.items[action.item] ?? 0) <= 0) return reject(state, action, 'none left');
  if (!item.dice) return reject(state, action, 'not now');
  const busy = boardBusy(character);
  if (busy) return reject(state, action, busy);
  if (character.steps === 0) return reject(state, action, 'not now');
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

/** The gambler's offer: double or nothing on a die, high (4 to 6) or low (1 to 3); or walk on. */
function gamble(state: GameState, action: GambleAction, character: Character, rng: Rng): ApplyResult {
  const offer = character.offer;
  if (!offer || offer.kind !== 'gamble') return reject(state, action, 'nothing to answer');
  if (action.choice === 'pass') {
    return { state: withCharacter(state, { ...character, offer: null }), events: [{ type: 'nothing', action: action.id, player: action.player, text: 'You walk on.' }] };
  }
  const roll = rng.int(state.die.sides);
  const high = roll > state.die.sides / 2;
  const won = action.choice === 'high' ? high : !high;
  const stake = Math.min(offer.stake, character.gold);
  const delta = won ? stake : -stake;
  const gold = character.gold + delta;
  return { state: withCharacter(state, { ...character, gold, offer: null }), events: [{ type: 'gambled', action: action.id, player: action.player, choice: action.choice, roll, won, delta, gold }] };
}

/** The pick of one ability in two that a level owed, the first of the list: the one chosen is learned, or gains a rank; the other waits for a shrine. */
function pick(state: GameState, action: PickAction, character: Character): ApplyResult {
  const options = character.picks[0];
  if (!options) return reject(state, action, 'nothing to answer');
  if (!options.includes(action.ability) || !ABILITIES[action.ability]) return reject(state, action, 'no such ability');
  const rank = Math.min((character.abilities[action.ability] ?? 0) + 1, ABILITIES[action.ability]!.ranks.length);
  const next = { ...character, picks: character.picks.slice(1), abilities: { ...character.abilities, [action.ability]: rank } };
  return { state: withCharacter(state, next), events: [{ type: 'picked', action: action.id, player: action.player, ability: action.ability, rank }] };
}

/** The town's errand taken or declined; a declined town waits before it asks again. */
function answerQuest(state: GameState, action: QuestAction, character: Character, now: number): ApplyResult {
  const offer = character.offer;
  if (!offer || offer.kind !== 'quest') return reject(state, action, 'nothing to answer');
  const quest = offer.quest;
  if (action.accept) {
    const next = { ...character, offer: null, quests: [...character.quests, quest] };
    return { state: withCharacter(state, next), events: [{ type: 'questTaken', action: action.id, player: action.player, quest }] };
  }
  const next = { ...character, offer: null, cooldowns: { ...character.cooldowns, [`quest:${quest.town}`]: now + QUESTS.cooldownMs } };
  return { state: withCharacter(state, next), events: [{ type: 'questDeclined', action: action.id, player: action.player, quest }] };
}

/** The piece that found no room in the bag: sold for half its worth, or left where it lay. */
function keep(state: GameState, action: KeepAction, character: Character): ApplyResult {
  const offer = character.offer;
  if (!offer || offer.kind !== 'loot') return reject(state, action, 'nothing to answer');
  const gear = offer.gear;
  if (action.choice === 'sell') {
    const price = sellPrice(gear);
    const gold = character.gold + price;
    return { state: withCharacter(state, { ...character, offer: null, gold }), events: [{ type: 'sold', action: action.id, player: action.player, gear, price, gold }] };
  }
  return { state: withCharacter(state, { ...character, offer: null }), events: [{ type: 'dropped', action: action.id, player: action.player, gear }] };
}

// ---- the world's tick ---------------------------------------------------------------------------------------------------

/**
 * Spawns come and go (Robin, 2026-10-31: random mini-bosses and events on random normal spots from time to time).
 * Expired ones leave; with room under the cap, a coin from the stream puts a mini-boss or a merchant on a free wild
 * spot of an open area for a while. Nothing to do gives the same state back.
 */
function tick(state: GameState, action: Action, rng: Rng, now: number): ApplyResult {
  const events: GameEvent[] = [];
  const spawns: Record<string, Spawn> = { ...state.spawns };
  let changed = false;
  for (const [space, spawn] of Object.entries(spawns)) {
    if (spawn.until <= now) {
      delete spawns[space];
      changed = true;
      events.push({ type: 'despawned', action: action.id, player: action.player, space });
    }
  }
  const settings = PROGRESSION.spawns;
  if (Object.keys(spawns).length < settings.cap && rng.next() < settings.chancePerTick) {
    const open = new Set<string>();
    const standing = new Set<string>();
    for (const c of Object.values(state.characters)) {
      for (const a of c.opened) open.add(a);
      standing.add(c.space);
    }
    const candidates = Object.values(state.board.spaces)
      .filter((s) => s.kind === 'normal' && open.has(s.area) && !spawns[s.id] && !standing.has(s.id))
      .map((s) => s.id)
      .sort();
    if (candidates.length) {
      const space = candidates[rng.int(candidates.length) - 1]!;
      const area = state.board.areas[state.board.spaces[space]!.area];
      const mini = rng.next() < settings.miniboss && area && area.miniBosses.length > 0;
      const spawn: Spawn = mini ? { kind: 'miniboss', enemy: area.miniBosses[rng.int(area.miniBosses.length) - 1]!, until: now + settings.lifeMs } : { kind: 'merchant', enemy: null, until: now + settings.lifeMs };
      spawns[space] = spawn;
      changed = true;
      events.push({ type: 'spawned', action: action.id, player: action.player, space, spawn });
    }
  }
  return changed ? { state: { ...state, spawns }, events } : { state, events };
}
