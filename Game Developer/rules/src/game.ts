// The game as a pure function: apply(state, action, rng, now) -> { state, events }.
// The state passed in is never changed; a new one comes back. `now` is the holder's clock in ms, for spots that give
// again after a while and for spawns; the rules never read a clock themselves.

import { baseNumbers, canLearn, MAX_CARRIED, resetSkills, traitsOf } from './skills.ts';
import { notePlace } from './journal.ts';
import { ABILITIES, CLASS_DATA, DICE_DATA, ENCOUNTERS, EVENTS, GEAR, ITEMS, ITEM_IDS, PROGRESSION, QUESTS, SPACE_KIND_DATA, SURPRISES, TRACES, WORLD_DATA, townKind, type TownKind, ARENA, type ArenaMode } from './data.ts';
import { calendarDay, isOn } from './calendar.ts';
import { flaskId, addLoot, gainXp, giveGold, giveItem, heal, nextGearId, reject, restoreMana, sellPrice, spend, withCharacter } from './common.ts';
import { fightRound, intentEvent, makeEnemy, noteLevels, startFight } from './fight.ts';
import { plainGear, powers, rollGear, rollUnique, stats, emptyEquipment } from './gear.ts';
import { dropSlot, groundAt, inTownWalls, rollLine } from './grounds.ts';
import { boardQuests, finishQuests, questFound, questLine } from './quests.ts';
import { checkPath } from './paths.ts';
import type { Rng } from './rng.ts';
import { buildBoard, withArenas } from './world.ts';
import {
  SLOTS,
  STATE_VERSION,
  type Action,
  type ApplyResult,
  type Area,
  type Board,
  type Character,
  type ClassId,
  type GameEvent,
  type GameState,
  type Space,
  type Spawn,
  type Trace,
  type GearLine,
  type ShopStock,
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
type ArenaAction = Extract<Action, { type: 'arena' }>;
type SkillAction = Extract<Action, { type: 'skill' }>;
type ChallengeAction = Extract<Action, { type: 'challenge' }> & { now?: number };
type QuestAction = Extract<Action, { type: 'quest' }>;
type KeepAction = Extract<Action, { type: 'keep' }>;
type JoinAction = Extract<Action, { type: 'join' }>;
type TraceAction = Extract<Action, { type: 'trace' }>;

/** The longest name a character may have. */
export const MAX_NAME = 12;

/** The world from rules/data/world.json, built fresh so the state owns it. */
export function makeBoard(): Board {
  return withArenas(buildBoard(WORLD_DATA));
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
    equipment: emptyEquipment(),
    bag: [],
    abilities,
    opened: [start.area],
    cooldowns: {},
    bossKills: {},
    offer: null,
    quests: [],
    questsDone: [],
    carried: [...c.kit],
    journal: { beaten: {}, places: [], done: [] },
    bonusPoints: 0,
    keys: {},
    ailments: {},
  };
}

/** A fresh game: the board, one character on the start space, the die unrolled, nothing spawned. */
export function newGame(o: NewGameOptions): GameState {
  const world = newWorld(o);
  return { ...world, characters: { [o.player]: makeCharacter(o.player, o.name, o.classId, world.board) } };
}

/** A world with nobody in it yet: what the server's region starts from; players arrive with `join`. */
export function newWorld(o: { seed: string; board?: Board }): GameState {
  return {
    version: STATE_VERSION,
    seed: o.seed,
    board: o.board ?? makeBoard(),
    characters: {},
    die: { sides: DICE_DATA.sides, last: null },
    spawns: {},
    nextItem: 1,
    traces: {},
  };
}

export function apply(state: GameState, action: Action, rng: Rng, now = 0): ApplyResult {
  if (action.type === 'tick') return tick(state, action, rng, now);
  if (action.type === 'join') return join(state, action);
  const character = state.characters[action.player];
  if (!character) return reject(state, action, 'unknown player');
  switch (action.type) {
    case 'roll':
      return roll(state, action, character, rng);
    case 'move': {
      const moved = move(state, action, character, rng, now);
      return discover(moved, action);
    }
    case 'challenge':
      return challenge(state, { ...action, now }, character, rng);
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
    case 'arena':
      return arena(state, action, character, rng, now);
    case 'skill':
      return skill(state, action, character);
    case 'quest':
      return answerQuest(state, action, character, rng, now);
    case 'try':
      return tryRoll(state, action, character, rng);
    case 'travel':
      return discover(travel(state, action, character, rng, now), action);
    case 'keep':
      return keep(state, action, character);
    case 'trace':
      return trace(state, action, character, now);
  }
}

/** After a move: a place stood in for the first time goes in the journal. */
function discover(r: ApplyResult, action: Action): ApplyResult {
  const c = r.state.characters[action.player];
  if (!c || r.events[0]?.type === 'rejected') return r;
  const events = [...r.events];
  const next = notePlace(c, r.state.board, action, events);
  return next === c ? r : { state: withCharacter(r.state, next), events };
}

/** To a boss's spot, whenever you choose, in land you have opened (Robin, 2026-11-02: "you fight the boss by choosing to go to that spot at any time you want"). */
function challenge(state: GameState, action: ChallengeAction, c: Character, rng: Rng): ApplyResult {
  const busy = boardBusy(c);
  if (busy) return reject(state, action, busy);
  const space = state.board.spaces[action.space];
  if (!space?.boss || space.kind !== 'boss' || !c.opened.includes(space.area) || c.steps > 0 || (c.cooldowns[space.id] ?? 0) > (action.now ?? 0)) return reject(state, action, 'not now');
  return begin(state, { ...c, space: space.id, steps: 0 }, space.boss, space.id, false, action, rng, []);
}

// ---- the Arena (Robin, 2026-11-02) ----------------------------------------------------------------------------------

/** The spot that is an area's arena, if the area has one. */
export function arenaSpot(board: Board, area: string): string | null {
  const id = ARENA.spots[area];
  return id && board.spaces[id]?.kind === 'arena' ? id : null;
}

export function arenaFee(board: Board, area: string, mode: ArenaMode = 'normal'): number {
  const tier = board.areas[area]?.tier ?? 1;
  return Math.round(ARENA.fee[Math.min(tier, ARENA.fee.length) - 1]! * ARENA.modes[mode].fee);
}

export function arenaOpen(c: Character, now: number): boolean {
  return !!c.arenaTest || isOn('arena', now);
}

/** Whether this mode is still to be tried today: each once per open day, whatever came of it. */
export function arenaTried(c: Character, mode: string, now: number): boolean {
  return !c.arenaTest && c.arenaDone?.day === calendarDay(now) && c.arenaDone.modes.includes(mode);
}

/** A wave's numbers, from the fighter: mostly what is worn, some the class's bare numbers at this level, so good gear helps without making it easy. */
function arenaNumbers(c: Character, wave: number, mode: ArenaMode): { hp: number; attack: number; defense: number } {
  const bare = baseNumbers(c.classId, c.level);
  const worn = stats(c);
  const w = ARENA.waves[wave - 1]!;
  const m = ARENA.modes[mode];
  const share = ARENA.wornShare;
  const blend = (b: number, n: number): number => b * (1 - share) + n * share;
  const attack = blend(bare.attack, worn.attack);
  const maxHp = blend(bare.maxHp, worn.maxHp);
  const defense = blend(bare.defense, worn.defense);
  const grown = 1 + Math.max(0, c.level - 4) * ARENA.levelStep;
  const cls = ARENA.classes[c.classId];
  return {
    hp: Math.round(attack * w.rounds * m.hp * grown * (cls?.hp ?? 1)),
    // Its plain blow takes this share of the fighter's HP through their armour (a blow is cut by half the defense).
    attack: Math.round(maxHp * w.hit * m.hit * grown * (cls?.hit ?? 1) + defense / 2),
    defense: 0,
  };
}

/** The next wave's fight: a creature of the land, or at the last a mini-boss, at the fighter's measure. */
function arenaWave(state: GameState, c: Character, wave: number, mode: ArenaMode, action: Action, rng: Rng): ApplyResult {
  const space = state.board.spaces[c.space]!;
  const area = state.board.areas[space.area]!;
  const w = ARENA.waves[wave - 1]!;
  const pool = w.mini && area.miniBosses.length ? area.miniBosses : area.mobs;
  const met = begin(state, c, pool[rng.int(pool.length) - 1]!, space.id, false, action, rng, []);
  const me = met.state.characters[c.id]!;
  const e = me.fight!.enemy;
  const n = arenaNumbers(c, wave, mode);
  // What it pays: a share of the mode's whole, gold by the fee and xp by the level's bar, less for one who has outgrown this land.
  const fee = arenaFee(state.board, space.area, mode);
  const bar = (PROGRESSION.xpForLevel[c.level] ?? PROGRESSION.xpForLevel.at(-1)!) - (PROGRESSION.xpForLevel[c.level - 1] ?? 0);
  const outgrown = c.level > area.levels[1] + ARENA.outgrown.levelsOver ? ARENA.outgrown.xp : 1;
  const grown = { ...e, level: c.level, role: w.mini ? ('mini' as const) : e.role, hp: n.hp, maxHp: n.hp, attack: n.attack, defense: n.defense, xp: Math.round(bar * ARENA.modes[mode].xpShare * w.pay * outgrown), gold: Math.round(fee * ARENA.modes[mode].gold * w.pay) };
  return { state: withCharacter(met.state, { ...me, fight: { ...me.fight!, enemy: grown } }), events: met.events.map((ev) => (ev.type === 'fight' ? { ...ev, enemy: { ...grown, moves: grown.moves.map((m) => ({ ...m })) } } : ev)) };
}

function arena(state: GameState, action: ArenaAction, c: Character, rng: Rng, now: number): ApplyResult {
  if (action.op === 'test') return { state: withCharacter(state, { ...c, arenaTest: !c.arenaTest }), events: [] };
  const space = state.board.spaces[c.space];
  if (action.op === 'enter') {
    const busy = boardBusy(c);
    if (busy) return reject(state, action, busy);
    const mode = action.mode as ArenaMode;
    if (!ARENA.modes[mode]) return reject(state, action, 'bad value');
    if (!space || c.steps > 0 || space.kind !== 'arena' || !arenaOpen(c, now) || arenaTried(c, mode, now)) return reject(state, action, 'not now');
    const fee = arenaFee(state.board, space.area, mode);
    if (c.gold < fee) return reject(state, action, 'not enough gold');
    const day = calendarDay(now);
    const done = { day, modes: [...(c.arenaDone?.day === day ? c.arenaDone.modes : []), mode] };
    return arenaWave(state, { ...c, gold: c.gold - fee, arena: { mode, wave: 1, gold: 0, xp: 0, flasks: 0 }, arenaDone: done }, 1, mode, action, rng);
  }
  const offer = c.offer;
  const run = c.arena;
  if (offer?.kind !== 'arena' || !run) return reject(state, action, 'nothing to answer');
  const mode = run.mode as ArenaMode;
  if (action.op === 'next') {
    if (run.wave >= ARENA.waves.length) return reject(state, action, 'not now');
    const wave = run.wave + 1;
    return arenaWave(state, { ...c, offer: null, arena: { ...run, wave } }, wave, mode, action, rng);
  }
  const { arena: _done, ...left } = c;
  const events: GameEvent[] = [{ type: 'arenaTaken', action: action.id, player: action.player, waves: run.wave, gold: run.gold, xp: run.xp }];
  const levelBefore = left.level;
  let next: Character = gainXp({ ...left, offer: null, gold: left.gold + run.gold }, run.xp, action, events);
  let s = state;
  if (offer.gear) {
    const got = nextGearId(s);
    s = got.state;
    const m = ARENA.modes[mode];
    const tier = (state.board.areas[space?.area ?? '']?.tier ?? 1) + m.rankUp;
    const boost = GEAR.rarityBoost[run.wave >= ARENA.waves.length ? m.clearGear : m.midGear];
    next = addLoot(next, rollGear(got.id, dropSlot(null, rng), tier, boost, rng, rollLine(rng), c.classId), action, events);
  }
  next = noteLevels(next, levelBefore, action, events);
  return { state: withCharacter(s, next), events };
}

/** A note on the spot you stand on (mine, 2026-11-01): one of the set lines, one a player a spot, newest first, a few a spot. */
function trace(state: GameState, action: TraceAction, c: Character, now: number): ApplyResult {
  if (c.fight) return reject(state, action, 'finish the fight first');
  if (!TRACES.includes(action.text)) return reject(state, action, 'bad value');
  const note: Trace = { player: c.id, name: c.name, text: action.text, at: now };
  const others = (state.traces[c.space] ?? []).filter((t) => t.player !== c.id);
  const traces = { ...state.traces, [c.space]: [note, ...others].slice(0, PROGRESSION.traces.perSpace) };
  return { state: { ...state, traces }, events: [{ type: 'traced', action: action.id, player: action.player, space: c.space, trace: note }] };
}

/** A new character for the player at the start, the way `newGame` makes the first; a player already here is refused. */
function join(state: GameState, action: JoinAction): ApplyResult {
  if (state.characters[action.player]) return reject(state, action, 'already here');
  const name = action.name.trim().slice(0, MAX_NAME);
  if (!name || !CLASS_DATA[action.classId]) return reject(state, action, 'bad value');
  const c = makeCharacter(action.player, name, action.classId, state.board);
  return { state: withCharacter(state, c), events: [{ type: 'joined', action: action.id, player: action.player, name, classId: action.classId, space: c.space }] };
}

/** Why the board will not take a turn right now, or null. */
function boardBusy(c: Character): 'finish the fight first' | 'answer first' | null {
  if (c.fight) return 'finish the fight first';
  if (c.offer) return 'answer first';
  return null;
}

// ---- the board -------------------------------------------------------------------------------------------------------

function roll(state: GameState, action: Action, character: Character, rng: Rng): ApplyResult {
  const busy = boardBusy(character);
  if (busy) return reject(state, action, busy);
  if (character.steps > 0) return reject(state, action, 'finish your move first');
  const value = rng.int(state.die.sides);
  const events: GameEvent[] = [{ type: 'rolled', action: action.id, player: action.player, value }];
  // Of the Road: a little back with each roll.
  const road = stats(character).bonus.road;
  if (road && character.hp < stats(character).maxHp) character = heal(character, Math.max(1, Math.round(stats(character).maxHp * road)), action, events);
  // Poison carried out of a fight stings on each roll; it never kills, and it wears off.
  const poison = character.ailments?.poison;
  if (poison) {
    const hp = Math.max(1, character.hp - poison.damage);
    const left = poison.rolls - 1;
    const { poison: _gone, ...others } = character.ailments;
    character = { ...character, hp, ailments: left > 0 ? { ...others, poison: { ...poison, rolls: left } } : others };
    events.push({ type: 'stung', action: action.id, player: action.player, damage: poison.damage, hp, left });
  }
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
  // Walking past the quest board with no quest stops there to choose; the walk goes on after the answer (Robin, 2026-11-02).
  const stop = character.quests.length ? -1 : action.path.findIndex((id, i) => i < action.path.length - 1 && state.board.spaces[id]?.kind === 'board');
  if (stop >= 0) {
    return walkTo(state, { ...character, walking: action.path.slice(stop + 1) }, action.path.slice(0, stop + 1), action, rng, now);
  }
  return walkTo(state, character, action.path, action, rng, now);
}

/** Step along a path and land on its end. */
function walkTo(state: GameState, character: Character, path: string[], action: Action, rng: Rng, now: number): ApplyResult {
  const landing = path[path.length - 1]!;
  const space = state.board.spaces[landing]!;
  const events: GameEvent[] = [
    { type: 'moved', action: action.id, player: action.player, from: character.space, path: [...path] },
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
    case 'arena':
      return { state: withCharacter(state, c), events };
    case 'town': {
      const s = stats(c);
      const rested: Character = { ...c, hp: s.maxHp, mana: s.maxMana, visited: [...new Set([...(c.visited ?? []), space.id])] };
      events.push({ type: 'rested', action: id, player, hp: rested.hp, mana: rested.mana });
      return { state: withCharacter(state, rested), events };
    }
    case 'board': {
      // One quest at a time: with one under way the board only asks whether to drop it.
      const quests = c.quests.length ? [] : boardQuests(state, space, rng);
      const offered: Character = { ...c, offer: { kind: 'board', quests } };
      events.push({ type: 'offer', action: id, player, offer: offered.offer! });
      return { state: withCharacter(state, offered), events };
    }
    case 'shop':
      return { state: withCharacter(state, c), events };
    case 'chest': {
      if (onCooldown) return empty();
      if (space.locked) {
        if ((c.keys[space.area] ?? 0) <= 0) {
          events.push({ type: 'locked', action: id, player, space: space.id, area: space.area, mini: area?.miniBosses[0] ?? null });
          return { state: withCharacter(state, c), events };
        }
        const keys = { ...c.keys, [space.area]: c.keys[space.area]! - 1 };
        return openChest(state, cooled({ ...c, keys }), tier, space.area, action, rng, events, true);
      }
      return openChest(state, cooled(c), tier, space.area, action, rng, events);
    }
    case 'potion': {
      if (onCooldown) return empty();
      return askRoll(state, cooled(c), 'flask', action, events);
    }
    case 'gear': {
      if (onCooldown) return empty();
      return askRoll(state, cooled(c), 'gear', action, events);
    }
    case 'spell': {
      if (onCooldown) return empty();
      // A shrine restores (mine: abilities come from the skill board now).
      const s = stats(c);
      events.push({ type: 'themeEvent', action: id, player, text: 'The shrine fills you with quiet strength.', kind: 'mana', amount: s.maxMana });
      return { state: withCharacter(state, restoreMana(heal(cooled(c), Math.round(s.maxHp * 0.15), action, events), s.maxMana, action, events)), events };
    }
    case 'church': {
      // Robin, 2026-11-01: a church on every map, to heal and be rid of poison and the like. Always open, and free.
      const s = stats(c);
      events.push({ type: 'rested', action: id, player, hp: s.maxHp, mana: s.maxMana });
      const carried = Object.keys(c.ailments ?? {});
      if (carried.length) events.push({ type: 'cured', action: id, player, ailments: carried });
      return { state: withCharacter(state, { ...c, hp: s.maxHp, mana: s.maxMana, ailments: {} }), events };
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
      if (spawn?.kind === 'worldboss' && spawn.enemy) return begin(state, c, spawn.enemy, space.id, true, action, rng, events, spawn);
      if (spawn?.kind === 'miniboss' && spawn.enemy) return begin(state, c, spawn.enemy, space.id, true, action, rng, events);
      if (spawn?.kind === 'elite' && spawn.enemy) {
        // A creature grown big and mean, marked on the map, there to be taken on or walked round (Robin, 2026-11-02): worth a mini-boss's drop.
        const met = begin(state, c, spawn.enemy, space.id, true, action, rng, events);
        const me = met.state.characters[c.id]!;
        const e = me.fight!.enemy;
        const big = { ...e, name: `Elite ${e.name}`, role: 'mini' as const, hp: Math.round(e.hp * 2.5), maxHp: Math.round(e.maxHp * 2.5), attack: Math.round(e.attack * 1.2), xp: e.xp * 3, gold: e.gold * 3 };
        return { state: withCharacter(met.state, { ...me, fight: { ...me.fight!, enemy: big } }), events };
      }
      if (spawn?.kind === 'wanderer' && spawn.enemy) {
        const met = begin(state, c, spawn.enemy, space.id, true, action, rng, events);
        const me = met.state.characters[c.id]!;
        const e = me.fight!.enemy;
        const w = PROGRESSION.wanderer;
        const huge = { ...e, name: `Dread ${e.name}`, level: spawn.level ?? e.level, role: 'mini' as const, wanderer: true, hp: Math.round(e.hp * w.hp), maxHp: Math.round(e.maxHp * w.hp), attack: Math.round(e.attack * w.attack), defense: Math.round(e.defense * w.defense), xp: Math.round(e.xp * w.xp), gold: Math.round(e.gold * w.gold) };
        return { state: withCharacter(met.state, { ...me, fight: { ...me.fight!, enemy: huge } }), events };
      }
      if (spawn?.kind === 'merchant') {
        events.push({ type: 'merchant', action: id, player });
        return { state: withCharacter(state, c), events };
      }
      // A quest under way may turn up here (Robin, 2026-11-02: "chance of spawning").
      const quest = c.quests[0];
      if (quest?.kind === 'find' && quest.ground === groundAt(state.board, space)?.id && rng.next() < QUESTS.kinds.find.foundChance!) {
        const met = finishQuests(state, questFound(c, quest, action, events), action, rng, events);
        return { state: withCharacter(met.state, noteLevels(met.c, c.level, action, events)), events };
      }
      if (quest?.kind === 'mini' && quest.area === space.area && quest.target && rng.next() < QUESTS.kinds.mini.spawnChance!) {
        return begin(state, c, quest.target, space.id, false, action, rng, events);
      }
      // Nothing hunts inside a town's walls (Robin, 2026-11-02: creatures only in their own place), and a street is never empty: "its weird with town spaces where nothing happens".
      if (inTownWalls(state.board, space)) return streetMoment(state, c, tier, action, rng, events);
      let what = surprise(rng);
      // Of the Explorer: some fights turn out to be something else.
      const explorer = stats(c).bonus.explorer;
      if (what === 'fight' && explorer && rng.next() < explorer) what = surprise(rng);
      if (what === 'chest') return openChest(state, c, tier, space.area, action, rng, events);
      if (what === 'event' && area && (EVENTS[area.theme] || ENCOUNTERS[area.theme])) return themeEvent(state, c, area.theme, tier, action, rng, events);
      const finds = area ? ENCOUNTERS[area.theme]?.finds : undefined;
      if (what === 'find' && finds?.length) {
        const find = finds[rng.int(finds.length) - 1]!;
        const offered: Character = { ...c, offer: { kind: 'roll', what: 'find', need: find.need, slot: find.slot, text: find.text } };
        events.push({ type: 'offer', action: id, player, offer: offered.offer! });
        return { state: withCharacter(state, offered), events };
      }
      if (what === 'stranger' && !c.quests.length) {
        // Someone on the road with a job (Robin, 2026-11-02: "sometimes meet a questgiver"), a quest of the board's kind.
        const quests = boardQuests(state, space, rng).slice(0, 1);
        if (quests.length) {
          const offered: Character = { ...c, offer: { kind: 'board', quests, from: QUESTS.people[rng.int(QUESTS.people.length) - 1]! } };
          events.push({ type: 'offer', action: id, player, offer: offered.offer! });
          return { state: withCharacter(state, offered), events };
        }
      }
      if (what === 'merchant') {
        // The merchant camps here for a while, so the shop he opens is a shop (Robin, 2026-11-01: nothing could be bought from one).
        events.push({ type: 'merchant', action: id, player });
        const camped = { ...state, spawns: { ...state.spawns, [space.id]: { kind: 'merchant' as const, enemy: null, until: now + PROGRESSION.spawns.lifeMs } } };
        return { state: withCharacter(camped, c), events };
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
      // Only the place's own creature (Robin, 2026-11-02: "creatures only in their own place").
      const mob = groundAt(state.board, space)?.mob ?? mobs[rng.int(mobs.length) - 1]!;
      return begin(state, c, mob, space.id, false, action, rng, events);
    }
  }
}

/** Where the coach goes from here: the other towns you have stood in, with the fare (mine, 2026-11-02: a bigger world needs a way back). */
export function travelOptions(state: GameState, c: Character): { id: string; name: string; price: number }[] {
  if (state.board.spaces[c.space]?.kind !== 'town') return [];
  return (c.visited ?? [])
    .filter((id) => id !== c.space && state.board.spaces[id]?.kind === 'town')
    .map((id) => {
      const space = state.board.spaces[id]!;
      return { id, name: space.name, price: PROGRESSION.travel.perTier * (state.board.areas[space.area]?.tier ?? 1) };
    });
}

function travel(state: GameState, action: Extract<Action, { type: 'travel' }>, character: Character, rng: Rng, now: number): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  const busy = boardBusy(character);
  if (busy) return reject(state, action, busy);
  if (character.steps !== 0) return reject(state, action, 'not now');
  const option = travelOptions(state, character).find((o) => o.id === action.to);
  if (!option) return reject(state, action, 'not in a town');
  if (character.gold < option.price) return reject(state, action, 'not enough gold');
  const gold = character.gold - option.price;
  const events: GameEvent[] = [{ type: 'traveled', action: action.id, player: action.player, from: character.space, to: action.to, price: option.price, gold }];
  return land(state, { ...character, gold, space: action.to }, state.board.spaces[action.to]!, action, rng, now, events);
}

/** A spot you roll for (Robin, 2026-11-02, from Dokapon): the timer starts on landing, win or lose. */
function askRoll(state: GameState, c: Character, what: 'flask' | 'gear', action: Action, events: GameEvent[]): ApplyResult {
  const offered: Character = { ...c, offer: { kind: 'roll', what, need: PROGRESSION.lootRoll.need } };
  events.push({ type: 'offer', action: action.id, player: action.player, offer: offered.offer! });
  return { state: withCharacter(state, offered), events };
}

/** The roll itself: a flask of the area's tier, or a plain piece worth little so it cannot be farmed for gold. */
function tryRoll(state: GameState, action: Action, character: Character, rng: Rng): ApplyResult {
  const offer = character.offer;
  if (!offer || offer.kind !== 'roll') return reject(state, action, 'nothing to answer');
  const luck = stats(character).bonus.luck;
  const roll = Math.min(state.die.sides, rng.int(state.die.sides) + (luck && rng.next() < luck ? 1 : 0));
  const won = roll >= offer.need;
  const events: GameEvent[] = [{ type: 'tried', action: action.id, player: action.player, what: offer.what, roll, need: offer.need, won }];
  let next: Character = { ...character, offer: null };
  let s = state;
  if (won) {
    const tier = s.board.areas[s.board.spaces[character.space]?.area ?? '']?.tier ?? 1;
    if (offer.what === 'flask') next = giveItem(next, flaskId(rng.next() < 0.5 ? 'potion' : 'mana-potion', tier), 1, action, events);
    else if (offer.what === 'find') {
      // Rare and worth it (Robin, 2026-11-02): never under uncommon, with a fair chance of better.
      const got = nextGearId(s);
      s = got.state;
      next = addLoot(next, rollGear(got.id, offer.slot ?? dropSlot(null, rng), tier, 1, rng, rollLine(rng), character.classId), action, events);
    }
    else {
      const got = nextGearId(s);
      s = got.state;
      const piece = plainGear(got.id, dropSlot(null, rng), tier, rollLine(rng), character.classId);
      next = addLoot(next, { ...piece, price: Math.max(1, Math.round(piece.price * LOOT_SPOT_PRICE)) }, action, events);
    }
  }
  return { state: withCharacter(s, next), events };
}

/** How much of its shop price a loot spot's piece is worth. */
const LOOT_SPOT_PRICE = 0.2;

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

/** An elixir lasts so many fights: one is counted off as each begins, and it is gone at the one after its last. */
function fightStarted(c: Character): Character {
  if (!c.elixirs) return c;
  const elixirs: NonNullable<Character['elixirs']> = {};
  for (const [kind, e] of Object.entries(c.elixirs) as ['vigor' | 'arcana', { value: number; fights: number }][]) {
    if (e.fights > 0) elixirs[kind] = { value: e.value, fights: e.fights - 1 };
  }
  const next = { ...c, elixirs };
  return { ...next, hp: Math.min(next.hp, stats(next).maxHp) };
}

function begin(state: GameState, c: Character, enemy: string, space: string, spawn: boolean, action: Action, rng: Rng, events: GameEvent[], shared?: Spawn): ApplyResult {
  let fighting = startFight(fightStarted(c), enemy, space, spawn, state.board.bestiary, rng);
  if (shared) {
    // A world boss: its HP is the spawn's, whatever others have done to it already.
    const f = fighting.fight!;
    fighting = { ...fighting, fight: { ...f, shared: true, enemy: { ...f.enemy, hp: shared.hp ?? f.enemy.hp, maxHp: shared.maxHp ?? f.enemy.maxHp } } };
  }
  const e = fighting.fight!.enemy;
  events.push({ type: 'fight', action: action.id, player: action.player, enemy: { ...e, moves: e.moves.map((m) => ({ ...m })) }, space });
  events.push(intentEvent(e, action.id, action.player));
  return { state: withCharacter(state, fighting), events };
}

/**
 * A chest: gold by the tier, maybe gear of the tier's rank, maybe a potion or a card; an errand for chests moves along.
 * A vault (`rich`, the locked chest opened with its key) holds three times the gold, a piece never under epic, and a
 * unique of the tier three times in ten.
 */
function openChest(state: GameState, c: Character, tier: number, areaId: string, action: Action, rng: Rng, events: GameEvent[], rich = false): ApplyResult {
  events.push({ type: 'chest', action: action.id, player: action.player });
  const [lo, hi] = PROGRESSION.chest.gold;
  let next = giveGold(c, tier * (lo + rng.int(hi - lo + 1) - 1) * (rich ? 3 : 1), action, events);
  let s = state;
  if (rich || rng.next() < PROGRESSION.chest.gearChance) {
    const got = nextGearId(s);
    s = got.state;
    const unique = rich && rng.next() < 0.3 ? rollUnique(got.id, tier, tier, rng) : null;
    if (unique) {
      next = addLoot(next, unique, action, events);
    } else {
      next = addLoot(next, rollGear(got.id, dropSlot(null, rng), tier, rich ? 3 : 0, rng, rollLine(rng), c.classId), action, events);
    }
  }
  if (rng.next() < PROGRESSION.chest.consumableChance) {
    const cards = ITEM_IDS.filter((i) => ITEMS[i]!.dice);
    const roll = rng.next();
    next = roll < 0.4 ? giveItem(next, flaskId('potion', tier), 1, action, events) : roll < 0.6 ? giveItem(next, flaskId('mana-potion', tier), 1, action, events) : giveItem(next, cards[rng.int(cards.length) - 1]!, 1, action, events);
  }
  return { state: withCharacter(s, next), events };
}

/** A moment on a town's street: a little kindness, drawn from the stream. */
function streetMoment(state: GameState, c: Character, tier: number, action: Action, rng: Rng, events: GameEvent[]): ApplyResult {
  const lines = (EVENTS as unknown as { streets: { text: string; kind: 'heal' | 'mana' | 'gold'; value: number }[] }).streets;
  const ev = lines[rng.int(lines.length) - 1]!;
  const s = stats(c);
  const amount = ev.kind === 'gold' ? ev.value * tier : Math.max(1, Math.round((ev.kind === 'heal' ? s.maxHp : s.maxMana) * ev.value));
  events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
  const next = ev.kind === 'gold' ? giveGold(c, amount, action, events) : ev.kind === 'heal' ? heal(c, amount, action, events) : restoreMana(c, amount, action, events);
  return { state: withCharacter(state, next), events };
}

/** The theme's event on a wild spot (mine, 2026-11-01): a share of HP or mana, gold by the tier, a flask or a card. */
function themeEvent(state: GameState, c: Character, theme: string, tier: number, action: Action, rng: Rng, events: GameEvent[]): ApplyResult {
  const pool = ENCOUNTERS[theme]?.events;
  const ev = pool?.length ? pool[rng.int(pool.length) - 1]! : EVENTS[theme]!;
  const s = stats(c);
  let next = c;
  let amount = 0;
  switch (ev.kind) {
    case 'heal':
      amount = Math.max(1, Math.round(s.maxHp * ev.value));
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      next = heal(next, amount, action, events);
      break;
    case 'hurt':
      // Never the last point: an event is colour, not a death.
      amount = Math.min(Math.max(0, c.hp - 1), Math.max(1, Math.round(s.maxHp * ev.value)));
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      next = { ...next, hp: next.hp - amount };
      break;
    case 'gold':
      amount = ev.value * tier;
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      next = giveGold(next, amount, action, events);
      break;
    case 'mana':
      amount = Math.max(1, Math.round(s.maxMana * ev.value));
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      next = restoreMana(next, amount, action, events);
      break;
    case 'flask':
      amount = ev.value;
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      next = giveItem(next, flaskId(rng.next() < 0.5 ? 'potion' : 'mana-potion', tier), amount, action, events);
      break;
    case 'card': {
      amount = ev.value;
      events.push({ type: 'themeEvent', action: action.id, player: action.player, text: ev.text, kind: ev.kind, amount });
      const cards = ITEM_IDS.filter((i) => ITEMS[i]!.dice);
      next = giveItem(next, cards[rng.int(cards.length) - 1]!, amount, action, events);
      break;
    }
  }
  return { state: withCharacter(state, next), events };
}

// ---- the shop and the bag ---------------------------------------------------------------------------------------------

/** What can be bought where the character stands, or null away from any shop. A merchant has everything. */
export function shopOffer(state: GameState, c: Character): { stock: ShopStock; lines: GearLine[]; items: string[]; town: TownKind | null; tier: number; price: (item: string) => number } | null {
  const space = state.board.spaces[c.space];
  const stock: ShopStock | null = state.spawns[c.space]?.kind === 'merchant' ? 'merchant' : space?.kind === 'town' ? 'town' : space?.kind === 'shop' ? (space.stock ?? 'arms') : null;
  if (!stock || !space) return null;
  const tier = state.board.areas[space.area]?.tier ?? 1;
  const top = Math.min(tier, 3);
  const items = ITEM_IDS.filter((id) => {
    const item = ITEMS[id]!;
    if (stock !== 'merchant' && !item.stock.includes(stock)) return false;
    return !(item.heal || item.mana) || item.tier === top || item.tier === top - 1;
  });
  const town = stock === 'town' ? townKind(space.id) : null;
  const lines: GearLine[] = stock === 'arms' ? ['light', 'heavy'] : stock === 'magic' ? ['magic'] : stock === 'merchant' || town?.rank ? ['light', 'heavy', 'magic'] : [];
  const price = (id: string): number => {
    const item = ITEMS[id]!;
    const share = item.dice ? town?.cards : item.heal || item.mana ? town?.flasks : undefined;
    return Math.max(1, Math.round(item.price * (share ?? 1)));
  };
  return { stock, lines, items, town, tier: tier + (town?.rank ?? 0), price };
}

function buy(state: GameState, action: BuyAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  const offer = shopOffer(state, character);
  if (!offer) return reject(state, action, 'not at a shop');
  if (action.item !== undefined) {
    const item = ITEMS[action.item];
    if (!item) return reject(state, action, 'no such item');
    if (!offer.items.includes(action.item)) return reject(state, action, 'not at a shop');
    const cost = offer.price(action.item);
    if (character.gold < cost) return reject(state, action, 'not enough gold');
    const gold = character.gold - cost;
    const items = { ...character.items, [action.item]: (character.items[action.item] ?? 0) + 1 };
    return { state: withCharacter(state, { ...character, gold, items }), events: [{ type: 'bought', action: action.id, player: action.player, item: action.item, gear: null, price: cost, gold }] };
  }
  if (action.slot !== undefined && SLOTS.includes(action.slot)) {
    const tier = offer.tier;
    const got = nextGearId(state);
    const line = action.line ?? (offer.lines.includes('heavy') ? 'heavy' : offer.lines[0]);
    if (!line || !offer.lines.includes(line)) return reject(state, action, 'not at a shop');
    const gear = plainGear(got.id, action.slot, tier, line, character.classId);
    if (character.gold < gear.price) return reject(state, action, 'not enough gold');
    const old = character.equipment[action.slot];
    const empty = !old;
    if (!empty && character.bag.length >= GEAR.bagLimit) return reject(state, action, 'bag full');
    const gold = character.gold - gear.price;
    // A plain piece replaces a plain one no higher, which goes to the bag: you bought it to wear it (mine, 2026-11-01).
    if (old && old.rarity === 'common' && old.rank <= gear.rank) {
      const worn = { ...character, gold, bag: [...character.bag, old], equipment: { ...character.equipment, [action.slot]: gear } };
      return { state: withCharacter(got.state, worn), events: [{ type: 'bought', action: action.id, player: action.player, item: null, gear, price: gear.price, gold }, { type: 'equipped', action: action.id, player: action.player, gear, replaced: old }] };
    }
    // A piece for an empty slot goes straight on (Robin, 2026-11-01).
    if (empty) {
      const worn = { ...character, gold, equipment: { ...character.equipment, [action.slot]: gear } };
      return { state: withCharacter(got.state, worn), events: [{ type: 'bought', action: action.id, player: action.player, item: null, gear, price: gear.price, gold }, { type: 'equipped', action: action.id, player: action.player, gear, replaced: null }] };
    }
    return { state: withCharacter(got.state, { ...character, gold, bag: [...character.bag, gear] }), events: [{ type: 'bought', action: action.id, player: action.player, item: null, gear, price: gear.price, gold }] };
  }
  return reject(state, action, 'no such item');
}


function sell(state: GameState, action: SellAction, character: Character): ApplyResult {
  if (character.fight) return reject(state, action, 'finish the fight first');
  if (!shopOffer(state, character)) return reject(state, action, 'not at a shop');
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
  // A Hunter uses bows only (Robin, 2026-11-02).
  if (gear.slot === 'weapon' && traitsOf(character).rangedOnly && !/bow\b/i.test(gear.name)) return reject(state, action, 'not now');
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
 * The item `charm` is no card but a worn Rabbit's Foot: a re-roll once every so often (its value, in ms).
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
  if (!item.dice) {
    // A flask drunk from the bag (Robin, 2026-11-01), not only in a fight.
    if (character.fight) return reject(state, action, 'finish the fight first');
    const s = stats(character);
    const ailing = Object.keys(character.ailments ?? {}).length > 0;
    const helps = (item.heal && character.hp < s.maxHp) || (item.mana && character.mana < s.maxMana) || item.elixir || (item.cure && ailing);
    if (!helps) return reject(state, action, 'not now');
    const events: GameEvent[] = [{ type: 'used', action: action.id, player: action.player, item: action.item }];
    let c = spend(character, action.item);
    const stronger = (traitsOf(character).potionPower ?? 1) * (1 + (s.bonus.plenty ?? 0));
    if (item.heal) c = heal(c, Math.round(item.heal * stronger), action, events);
    if (item.mana) c = restoreMana(c, Math.round(item.mana * stronger), action, events);
    if (item.elixir) c = { ...c, elixirs: { ...c.elixirs, [item.elixir.kind]: { value: item.elixir.value, fights: item.elixir.fights } } };
    if (item.cure) {
      events.push({ type: 'cured', action: action.id, player: action.player, ailments: Object.keys(c.ailments ?? {}) });
      c = { ...c, ailments: {} };
    }
    return { state: withCharacter(state, c), events };
  }
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

/** The skill board: learn or raise, take a path, choose what is carried, or reset, which only a town or a church allows. */
function skill(state: GameState, action: SkillAction, c: Character): ApplyResult {
  if (c.fight) return reject(state, action, 'finish the fight first');
  const done = (next: Character, events: GameEvent[] = []): ApplyResult => ({ state: withCharacter(state, next), events });
  if (action.op === 'learn') {
    if (!canLearn(c, action.ability)) return reject(state, action, 'not now');
    const rank = (c.abilities[action.ability] ?? 0) + 1;
    const isRule = !!ABILITIES[action.ability]!.rule;
    const carried = isRule || c.carried.includes(action.ability) || c.carried.length >= MAX_CARRIED ? c.carried : [...c.carried, action.ability];
    return done({ ...c, carried, abilities: { ...c.abilities, [action.ability]: rank } }, [{ type: 'learned', action: action.id, player: action.player, ability: action.ability, rank }]);
  }
  if (action.op === 'testClass') {
    if (!CLASS_DATA[action.classId]) return reject(state, action, 'not now');
    const worn = c.equipment.weapon;
    const weapon = worn ? plainGear(worn.id, 'weapon', worn.rank, 'heavy', action.classId) : null;
    const numbers = baseNumbers(action.classId, c.level);
    const next = resetSkills({ ...c, classId: action.classId, ...numbers, equipment: { ...c.equipment, weapon } });
    const s = stats(next);
    return done({ ...next, hp: s.maxHp, mana: s.maxMana });
  }
  if (action.op === 'testLevel') {
    const level = c.level + 1;
    const numbers = baseNumbers(c.classId, level);
    const next = { ...c, level, xp: Math.max(c.xp, PROGRESSION.xpForLevel[level - 1] ?? c.xp), ...numbers };
    const s = stats(next);
    return done({ ...next, hp: s.maxHp, mana: s.maxMana });
  }
  if (action.op === 'carry') {
    if (!c.abilities[action.ability] || ABILITIES[action.ability]?.rule) return reject(state, action, 'no such ability');
    if (c.carried.includes(action.ability)) return done({ ...c, carried: c.carried.filter((a) => a !== action.ability) });
    if (c.carried.length >= MAX_CARRIED) return reject(state, action, 'not now');
    return done({ ...c, carried: [...c.carried, action.ability] });
  }
  const kind = state.board.spaces[c.space]?.kind;
  if (kind !== 'town' && kind !== 'church') return reject(state, action, 'not now');
  return done(resetSkills(c), [{ type: 'skillReset', action: action.id, player: action.player }]);
}

/** A quest chosen at the board, the board left, or the quest under way dropped. */
function answerQuest(state: GameState, action: QuestAction, character: Character, rng: Rng, now: number): ApplyResult {
  const offer = character.offer;
  if (!offer || offer.kind !== 'board') return reject(state, action, 'nothing to answer');
  const quest = action.accept ? offer.quests[action.index ?? 0] : undefined;
  const events: GameEvent[] = [];
  let next: Character;
  if (quest && !character.quests.length) {
    next = { ...character, offer: null, quests: [quest] };
    events.push({ type: 'questTaken', action: action.id, player: action.player, quest });
  } else {
    const dropped = action.drop ? character.quests[0] : undefined;
    next = { ...character, offer: null, quests: dropped ? [] : character.quests };
    if (dropped) events.push({ type: 'questDeclined', action: action.id, player: action.player, quest: dropped });
  }
  // The walk the board interrupted goes on.
  const { walking, ...still } = next;
  if (walking?.length) {
    const r = walkTo(state, still, walking, action, rng, now);
    return { state: r.state, events: [...events, ...r.events] };
  }
  return { state: withCharacter(state, still), events };
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
  let characters = state.characters;
  let changed = false;
  for (const [space, spawn] of Object.entries(spawns)) {
    if (spawn.until <= now) {
      delete spawns[space];
      changed = true;
      if (spawn.kind === 'worldboss') {
        // Its time ran out: whoever was still fighting it is let go.
        const fighters = Object.values(characters).filter((c) => c.fight?.shared && c.fight.space === space);
        if (fighters.length) {
          characters = { ...characters };
          for (const c of fighters) characters[c.id] = { ...c, fight: null };
        }
        events.push({ type: 'bossLeft', action: action.id, player: action.player, space, enemy: spawn.enemy ?? '', players: fighters.map((c) => c.id) });
      }
      events.push({ type: 'despawned', action: action.id, player: action.player, space });
    }
  }
  // Old notes fade.
  let traces = state.traces;
  for (const [space, notes] of Object.entries(traces)) {
    const kept = notes.filter((t) => t.at + PROGRESSION.traces.lifeMs > now);
    if (kept.length !== notes.length) {
      if (traces === state.traces) traces = { ...traces };
      if (kept.length) traces[space] = kept;
      else delete traces[space];
      changed = true;
    }
  }
  const settings = PROGRESSION.spawns;
  if (Object.values(spawns).filter((s) => s.kind !== 'wanderer').length < settings.cap && rng.next() < settings.chancePerTick) {
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
      // Otherwise an elite of the place, marked on the map, or a merchant (Robin, 2026-11-02).
      const ground = groundAt(state.board, state.board.spaces[space]!);
      const elite = !mini && ground && !inTownWalls(state.board, state.board.spaces[space]!) && rng.next() < settings.elite;
      const spawn: Spawn = elite ? { kind: 'elite', enemy: ground.mob, until: now + settings.lifeMs } : mini ? { kind: 'miniboss', enemy: area.miniBosses[rng.int(area.miniBosses.length) - 1]!, until: now + settings.lifeMs } : { kind: 'merchant', enemy: null, until: now + settings.lifeMs };
      spawns[space] = spawn;
      changed = true;
      events.push({ type: 'spawned', action: action.id, player: action.player, space, spawn });
    }
  }
  // Wanderers (Robin, 2026-11-02): a creature far above its land walks the roads, its level on the map. One at a time, in land where someone stands who it still towers over.
  const w = PROGRESSION.wanderer;
  const standingOn = new Set(Object.values(characters).map((c) => c.space));
  const free = (s: Space | undefined): s is Space => !!s && s.kind === 'normal' && !spawns[s.id] && !standingOn.has(s.id) && !inTownWalls(state.board, s);
  const roaming = Object.entries(spawns).find(([, s]) => s.kind === 'wanderer');
  if (roaming) {
    if (rng.next() < w.moveChance) {
      const [from, spawn] = roaming;
      const fighting = Object.values(characters).some((c) => c.fight?.space === from);
      const area = state.board.spaces[from]?.area;
      // It walks over whatever lies on the road, up to three spots, to the next free wild spot.
      const seen = new Set([from]);
      let ring = [from];
      const ways: string[] = [];
      for (let step = 0; step < 3 && !ways.length; step++) {
        ring = ring.flatMap((id) => state.board.spaces[id]?.links ?? []).filter((id) => !seen.has(id) && state.board.spaces[id]?.area === area);
        for (const id of ring) seen.add(id);
        ways.push(...ring.filter((id) => free(state.board.spaces[id])));
      }
      ways.sort();
      if (ways.length && !fighting) {
        const to = ways[rng.int(ways.length) - 1]!;
        delete spawns[from];
        spawns[to] = spawn;
        changed = true;
        events.push({ type: 'despawned', action: action.id, player: action.player, space: from });
        events.push({ type: 'spawned', action: action.id, player: action.player, space: to, spawn });
      }
    }
  } else if (rng.next() < w.chancePerTick) {
    const here = Object.values(characters)
      .map((c) => ({ c, area: state.board.areas[state.board.spaces[c.space]?.area ?? ''] }))
      .filter((x): x is { c: Character; area: Area } => !!x.area && x.c.level < x.area.levels[1] + w.levelsOver)
      .sort((a, b) => a.c.id.localeCompare(b.c.id));
    const pick = here.length ? here[rng.int(here.length) - 1]! : null;
    const wilds = pick ? Object.values(state.board.spaces).filter((s) => s.area === pick.area.id && free(s) && groundAt(state.board, s)).sort((a, b) => a.id.localeCompare(b.id)) : [];
    if (pick && wilds.length) {
      const at = wilds[rng.int(wilds.length) - 1]!;
      const spawn: Spawn = { kind: 'wanderer', enemy: groundAt(state.board, at)!.mob, level: pick.area.levels[1] + w.levelsOver, until: now + w.lifeMs };
      spawns[at.id] = spawn;
      changed = true;
      events.push({ type: 'spawned', action: action.id, player: action.player, space: at.id, spawn });
    }
  }
  // A world boss (mine, 2026-11-01): now and then, when none is about, the boss of the highest area anyone has opened
  // rages on a wild spot there with HP for a crowd, for a while; everyone who lands there fights the same HP.
  const wb = PROGRESSION.worldBoss;
  if (!Object.values(spawns).some((s) => s.kind === 'worldboss') && rng.next() < wb.chancePerTick) {
    const open = new Set<string>();
    const standing = new Set<string>();
    for (const c of Object.values(characters)) {
      for (const a of c.opened) open.add(a);
      standing.add(c.space);
    }
    const frontier = [...open].map((id) => state.board.areas[id]).filter((a): a is Area => !!a).sort((a, b) => b.tier - a.tier || a.id.localeCompare(b.id))[0];
    const gate = frontier ? Object.values(state.board.spaces).find((s) => s.area === frontier.id && s.kind === 'boss' && s.boss) : undefined;
    const enemy = gate?.boss ?? frontier?.miniBosses[0] ?? null;
    const wilds = frontier ? Object.values(state.board.spaces).filter((s) => s.area === frontier.id && s.kind === 'normal' && !spawns[s.id] && !standing.has(s.id)).map((s) => s.id).sort() : [];
    if (enemy && wilds.length) {
      const space = wilds[rng.int(wilds.length) - 1]!;
      const hp = Math.round(makeEnemy(enemy, state.board.bestiary).maxHp * wb.hpMult);
      const spawn: Spawn = { kind: 'worldboss', enemy, until: now + wb.lifeMs, hp, maxHp: hp, hitters: {} };
      spawns[space] = spawn;
      changed = true;
      events.push({ type: 'spawned', action: action.id, player: action.player, space, spawn });
    }
  }
  return changed ? { state: { ...state, spawns, characters, traces }, events } : { state, events };
}
