import { resetSkills } from './skills.ts';
import { emptyEquipment } from './gear.ts';
import { CLASS_DATA, DICE_DATA, PROGRESSION } from './data.ts';
import { freshFight } from './fight.ts';
import { makeBoard, makeCharacter } from './game.ts';
import { growBoard } from './generate.ts';
import { GROWN, withArenas, withDungeons, withSecrets } from './world.ts';
import { STATE_VERSION, type Board, type Character, type Enemy, type Fight, type GameState, type GearItem, type Offer } from './types.ts';

/** The older shapes, as far as the migrations need them. */
interface StateV1 {
  version: 1;
  seed: string;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV2 {
  version: 2;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV3 {
  version: 3;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
interface StateV4 {
  version: 4;
  seed: string;
  board: Board;
  characters: Record<string, OldCharacter>;
  die: { sides: number; last: number | null };
}
/** A version-5 state: the shape of version 6, with a board that knew no grown areas and no bestiary. */
interface StateV5 {
  version: 5;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
  spawns: GameState['spawns'];
  nextItem: number;
}
/** A version-8 state: today's shape, but a character carried no keys. */
/** A version-9 state: today's shape without the notes on spots. */
interface StateV9 {
  version: 9;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
  spawns: GameState['spawns'];
  nextItem: number;
}
interface StateV8 {
  version: 8;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
  spawns: GameState['spawns'];
  nextItem: number;
}
/** A version-7 state: the shape of 8, but a character carried no errands and its level's pick sat in `offer`. */
interface StateV7 {
  version: 7;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
  spawns: GameState['spawns'];
  nextItem: number;
}
/** A version-6 state: the shape of 7, but gear carried one `affix` and a fight knew no meter, intent or phase. */
interface StateV6 {
  version: 6;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: { sides: number; last: number | null };
  spawns: GameState['spawns'];
  nextItem: number;
}
/** What every version before 5 had on a character that version 5 keeps. */
interface OldCharacter {
  id: string;
  name: string;
  classId: Character['classId'];
  hp: number;
  gold: number;
  xp?: number;
  level?: number;
  items?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Bring a stored state up to the current version, or null for a thing that is not a state we know, so the holder
 * starts a fresh game instead of crashing on it. Each step goes to the next version; an older state takes them all.
 *
 * 1 → 2 (2026-10-31): the ring became the island. 2 → 3: the fight came (xp, level, fight). 3 → 4: items came (the bag).
 * 4 → 5 (2026-10-31): the island became the world in areas, with bosses, gear, mana and abilities. The board is
 * rebuilt; every character keeps its name, class, level, xp, gold and consumables, stands on the start again with full
 * HP and mana, an empty wardrobe, its class's starting abilities and only the first area open.
 * 5 → 6 (2026-10-31): the world grows. The board is rebuilt from today's data (the Summit now opens the first grown
 * area) and the areas a character had opened are laid again, so everything else is kept as it was.
 * 6 → 7 (2026-11-01): uniques, meters and intents. A piece's one `affix` becomes its `affixes`; a fight in progress gains
 * the fields it did not have (meter 0, nothing in the air, the enemy's next move unknown until the round ends).
 * 7 → 8 (2026-11-01): errands and the bag's limit. A character gains `quests` and `picks`; a pick that sat in `offer`
 * moves to `picks`.
 * 8 → 9 (2026-11-01): locked vaults. A character gains `keys`.
 */
export function migrate(raw: unknown): GameState | null {
  const version = (raw as { version?: unknown } | null)?.version;
  // 25 → 26: a stand-in cave gives way to the Rootways, before the board is laid again.
  const before = migrateOlder(version === 25 ? withoutStandIn(raw as GameState) : raw);
  if (!before || version === STATE_VERSION) return before;
  // 26 → 27: the two new lands lie before the grown ones: anyone past Queen Bumble already has them open.
  const up = withHubOpen(withEastOpen(before));
  // 36 → 37: a land is veiled until you stand in it.
  if (version === 36) return withArena(up);
  // 35 → 36: Arenas and hidden places in the two far lands.
  if (version === 35) return withArena(up);
  // 34 → 35: the Buried Crown is laid.
  if (version === 34) return withArena(up);
  // 33 → 34: the Giants’ Land is laid.
  if (version === 33) return withArena(up);
  // 32 → 33: the Pirate Isles are laid.
  if (version === 32) return withArena(up);
  // 31 → 32: the board again: nothing lives in the city's streets any more.
  if (version === 31) return withArena(up);
  // 30 → 31: the hub world: the land moved, and bosses no longer open lands.
  if (version === 30) return withArena(up);
  // 29 → 30: the talent trees: every point back to spend again.
  if (version === 29) return withArena(withTalents(up));
  // 28 → 29: the level curve moved; everyone keeps their level and how far along it they were.
  if (version === 28) return withArena(withTalents(onNewCurve(up)));
  // 27 → 28: the hidden trails are laid.
  if (version === 27) return withArena(withTalents(onNewCurve(up)));
  if (version === 26) return withArena(withTalents(onNewCurve(up)));
  if (version === 25) return withArena(up);
  // 24 → 25: the dungeons are laid.
  if (version === 24) return withArena(up);
  // 23 → 24: the Arena takes its spot in each land laid so far.
  if (version === 23) return withArena(up);
  // 22 → 23: the journal starts empty; nothing else moves.
  if (version === 22) return withArena(withJournal(up));
  return withArena(withJournal(toPaths(up)));
}

function withTalents(state: GameState): GameState {
  return { ...state, characters: Object.fromEntries(Object.entries(state.characters).map(([id, c]) => [id, resetSkills(c)])) };
}

const CURVE_BEFORE_29 = [0, 30, 80, 160, 280, 440, 650, 920, 1250, 1650, 2100, 2650, 3300, 4050, 4900, 5850, 6900, 8050, 9300, 10650, 12100, 13650, 15300, 17050, 18900, 20850, 22900, 25050, 27300, 29650];

function onNewCurve(state: GameState): GameState {
  const now = PROGRESSION.xpForLevel;
  const characters = Object.fromEntries(
    Object.entries(state.characters).map(([id, c]) => {
      const from = CURVE_BEFORE_29[c.level - 1] ?? 0;
      const to = CURVE_BEFORE_29[c.level] ?? from + 1;
      const share = Math.min(1, Math.max(0, (c.xp - from) / Math.max(1, to - from)));
      const low = now[c.level - 1] ?? c.xp;
      const high = now[c.level] ?? low + 1;
      return [id, { ...c, xp: Math.round(low + share * (high - low)) }];
    }),
  );
  return { ...state, characters };
}

/** Past the first boss, the hub and the lands with no gate are open (Robin, 2026-11-02); a rumour on a road that has gone is forgotten. */
function withHubOpen(state: GameState): GameState {
  const characters = Object.fromEntries(
    Object.entries(state.characters).map(([id, c]) => {
      const past = c.opened.includes('thornwood') || (c.bossKills.gate ?? 0) > 0;
      const opened = past ? [...new Set([...c.opened, 'kingswood', 'crownhaven', 'thornwood', 'frostpeak'])] : c.opened;
      return [id, { ...c, opened, ...(c.rumours ? { rumours: c.rumours.filter((r) => state.board.spaces[r.space]) } : {}) }];
    }),
  );
  return { ...state, characters };
}

function withEastOpen(state: GameState): GameState {
  const characters = Object.fromEntries(
    Object.entries(state.characters).map(([id, c]) => [id, c.opened.some((a) => GROWN.test(a)) ? { ...c, opened: [...new Set([...c.opened, 'bogglemire', 'frostcrown'])] } : c]),
  );
  return { ...state, characters };
}

/** A build on Robin's phone for a while had a stand-in cave, `grotto`: anyone in it comes out at its door, and the real one is laid. */
function withoutStandIn(state: GameState): GameState {
  const areas = { ...state.board.areas };
  delete areas.grotto;
  const spaces = Object.fromEntries(Object.entries(state.board.spaces).filter(([, s]) => s.area !== 'grotto'));
  const characters = Object.fromEntries(
    Object.entries(state.characters).map(([id, c]) => {
      const inside = state.board.spaces[c.space]?.area === 'grotto';
      return [id, { ...c, opened: c.opened.filter((a) => a !== 'grotto'), ...(inside ? { space: 'lookout', steps: 0, fight: null, offer: null } : {}) }];
    }),
  );
  return { ...state, characters, board: { ...state.board, areas, spaces } };
}

/** To 24 (Robin, 2026-11-02): the Arena's spots; anyone standing on one just stands at the Arena. */
function withArena(state: GameState): GameState {
  // To 37 (Robin, 2026-11-03): a land stays veiled until you stand in it; all you had open, you have seen.
  const characters = Object.fromEntries(Object.entries(state.characters).map(([id, c]) => [id, c.seen ? c : { ...c, seen: [...c.opened] }]));
  return { ...state, version: STATE_VERSION, characters, board: withSecrets(withDungeons(withArenas(state.board))) };
}

/**
 * To 22 (Robin, 2026-11-02): the classes and their trees. Everyone goes back to what their class starts with, with their numbers as
 * the class grows them now and every point theirs to spend on the skill board; nothing is lost but the old picks.
 */
function toPaths(state: GameState): GameState {
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(state.characters)) {
    const cls = CLASS_DATA[c.classId];
    if (!cls) continue;
    const grown = c.level - 1;
    const maxHp = cls.hp + cls.growth.hp * grown;
    const maxMana = cls.mana + cls.growth.mana * grown;
    const reset = resetSkills({ ...c, bonusPoints: Math.max(0, (c.opened?.length ?? 1) - 1), maxHp, maxMana, attack: cls.attack + cls.growth.attack * grown, defense: cls.defense + cls.growth.defense * grown });
    const { picks: _old, path: _path, ...kept } = reset as Character & { picks?: unknown; path?: unknown };
    characters[id] = { ...kept, hp: Math.min(kept.hp, maxHp), mana: Math.min(kept.mana, maxMana) };
  }
  return { ...state, version: STATE_VERSION, characters };
}

function withJournal(state: GameState): GameState {
  const characters = Object.fromEntries(Object.entries(state.characters).map(([id, c]) => [id, { ...c, journal: c.journal ?? { beaten: {}, places: [], done: [] } }]));
  return { ...state, version: STATE_VERSION, characters };
}

function migrateOlder(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { version?: unknown };
  if (candidate.version === STATE_VERSION) return raw as GameState;
  if (candidate.version === 36 || candidate.version === 35 || candidate.version === 34 || candidate.version === 33 || candidate.version === 32 || candidate.version === 31 || candidate.version === 30 || candidate.version === 29 || candidate.version === 28 || candidate.version === 27 || candidate.version === 26 || candidate.version === 25 || candidate.version === 24 || candidate.version === 23 || candidate.version === 22 || candidate.version === 21 || candidate.version === 20 || candidate.version === 19 || candidate.version === 18 || candidate.version === 12 || candidate.version === 13 || candidate.version === 14 || candidate.version === 15 || candidate.version === 16 || candidate.version === 17) return relay(fillSlots(raw as GameState));
  if (candidate.version === 11) return fillSlots({ ...(raw as StateV11), version: STATE_VERSION });
  if (candidate.version === 10) return fillSlots(fromVersion10(raw as StateV10));
  if (candidate.version === 9) return fillSlots(relay(fromVersion9(raw as StateV9)));
  if (candidate.version === 8) return fillSlots(relay(fromVersion8(raw as StateV8)));
  if (candidate.version === 7) {
    const v8 = fromVersion7(raw as StateV7);
    return v8 ? fillSlots(relay(fromVersion8(v8 as unknown as StateV8))) : null;
  }
  if (candidate.version === 6) {
    const v7 = fromVersion6(raw as StateV6);
    const v8 = v7 ? fromVersion7(v7 as unknown as StateV7) : null;
    return v8 ? fillSlots(relay(fromVersion8(v8 as unknown as StateV8))) : null;
  }
  if (candidate.version === 5) {
    const v6 = fromVersion5(raw as StateV5);
    const v7 = v6 ? fromVersion6(v6 as unknown as StateV6) : null;
    const v8 = v7 ? fromVersion7(v7 as unknown as StateV7) : null;
    return v8 ? fillSlots(relay(fromVersion8(v8 as unknown as StateV8))) : null;
  }
  if (candidate.version === 1 || candidate.version === 2 || candidate.version === 3 || candidate.version === 4) {
    return fillSlots(fromOlder(raw as StateV1 | StateV2 | StateV3 | StateV4));
  }
  return null;
}

/** A state as version 11 stored it: five gear slots. */
type StateV11 = Omit<GameState, 'version'> & { version: 11 };

/**
 * 11 → 12 (2026-11-01): shield, gloves and cape join the gear slots (Robin). Every character's wardrobe gains the three,
 * empty; everything else is kept. Older states pass through here last.
 */
function fillSlots(state: GameState | null): GameState | null {
  if (!state) return null;
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(state.characters)) {
    characters[id] = { ...c, equipment: { ...emptyEquipment(), ...(c.equipment ?? {}) }, ailments: c.ailments ?? {}, ...fromErrands(c) };
  }
  return { ...state, version: STATE_VERSION, characters, board: withChurches(state.board) };
}

/** 12 → 13 (2026-11-01): a church on every map (Robin), and ailments that outlast a fight. The hand-laid areas' churches stand on set hubs; a grown area already played gets one on its first named wild hub. */
const HAND_LAID_CHURCHES: Record<string, string> = { ravine: 'Little Clover Church', hollow: 'Oakshade Church', ridge: 'Honeybell Church' };
function withChurches(board: Board): Board {
  const spaces = { ...board.spaces };
  for (const area of Object.values(board.areas)) {
    if (area.dungeon || area.city || area.id === 'kingswood') continue;
    const own = Object.values(spaces).filter((s) => s.area === area.id).sort((a, b) => a.id.localeCompare(b.id));
    if (own.some((s) => s.kind === 'church')) continue;
    const set = own.find((s) => HAND_LAID_CHURCHES[s.id] && s.kind === 'normal');
    const pick = set ?? own.find((s) => s.kind === 'normal' && s.name) ?? own.find((s) => s.kind === 'normal');
    if (pick) spaces[pick.id] = { ...pick, kind: 'church', name: HAND_LAID_CHURCHES[pick.id] ?? pick.name ?? `${area.name} Church` };
  }
  return { ...board, spaces };
}

/** 14 → 15 (2026-11-02): the board replaces the towns' errands. An errand already done pays its gold and is remembered; the rest go. */
function fromErrands(c: Character): Pick<Character, 'quests' | 'questsDone' | 'gold' | 'offer'> {
  const kinds = ['kill', 'loot', 'mini', 'find'];
  const old = (c.quests ?? []).filter((q) => !kinds.includes(q.kind));
  const finished = old.filter((q) => q.done >= q.count);
  return {
    quests: (c.quests ?? []).filter((q) => kinds.includes(q.kind)),
    questsDone: [...(c.questsDone ?? []), ...finished].slice(-20),
    gold: c.gold + finished.reduce((sum, q) => sum + q.gold, 0),
    offer: (c.offer as { kind: string } | null)?.kind === 'quest' ? null : c.offer,
  };
}

/** A state as version 10 stored it: today's shape, the board laid under the old names. */
type StateV10 = Omit<GameState, 'version'> & { version: 10 };

/**
 * 10 → 11 (2026-11-01): the Enchanted Kingdoms names (Robin: names yes, order A). Spot and area ids did not change, so
 * the board is laid again from today's data, the areas a character had opened laid again too, and everything else kept.
 */
function fromVersion10(old: StateV10): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  for (const c of Object.values(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
  }
  return relay({ ...old, version: STATE_VERSION });
}

/**
 * Lay the board again from today's data (names change, ids do not), keeping whatever stands on it. Only a board laid
 * from the world's data is laid again (its start is the world's start); a test's own board, such as the ring, is kept.
 */
function relay(state: GameState | null): GameState | null {
  if (!state) return null;
  let board = makeBoard();
  if (state.board.start !== board.start) return state;
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(state.characters)) {
    for (const areaId of c.opened ?? []) if (!board.areas[areaId]) board = growBoard(board, state.seed, areaId);
    if (board.spaces[c.space]) {
      characters[id] = c;
      continue;
    }
    // Its spot went when its land was repainted: back to that land's town, not to the start of the world.
    const area = state.board.spaces[c.space]?.area;
    const town = Object.values(board.spaces).find((s) => s.area === area && s.kind === 'town');
    characters[id] = { ...c, space: town?.id ?? board.start, steps: 0, fight: null };
  }
  const spawns = Object.fromEntries(Object.entries(state.spawns ?? {}).filter(([space]) => board.spaces[space]));
  const traces = Object.fromEntries(Object.entries(state.traces ?? {}).filter(([space]) => board.spaces[space]));
  return { ...state, board, characters, spawns, traces };
}

/** From 9: the notes on spots arrive, none yet. */
function fromVersion9(old: StateV9): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  for (const c of Object.values(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
  }
  return { version: STATE_VERSION, seed: old.seed, board: old.board, characters: old.characters, die: old.die ?? { sides: DICE_DATA.sides, last: null }, spawns: old.spawns ?? {}, nextItem: typeof old.nextItem === 'number' ? old.nextItem : 1, traces: {} };
}

function fromVersion8(old: StateV8): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    characters[id] = { ...c, keys: c.keys ?? {} };
  }
  return { version: STATE_VERSION, seed: old.seed, board: old.board, characters, die: old.die ?? { sides: DICE_DATA.sides, last: null }, spawns: old.spawns ?? {}, nextItem: typeof old.nextItem === 'number' ? old.nextItem : 1, traces: {} };
}

function fromVersion7(old: StateV7): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    const offer = c.offer as (Offer | { kind: 'ability'; options: string[] }) | null;
    const owed = offer && offer.kind === 'ability' ? [offer.options] : [];
    characters[id] = { ...c, offer: offer && offer.kind === 'ability' ? null : offer, quests: c.quests ?? [] };
    void owed;
  }
  return { version: STATE_VERSION, seed: old.seed, board: old.board, characters, die: old.die ?? { sides: DICE_DATA.sides, last: null }, spawns: old.spawns ?? {}, nextItem: typeof old.nextItem === 'number' ? old.nextItem : 1, traces: {} };
}

/** A piece as version 6 stored it: one affix or none. */
type OldGear = Omit<GearItem, 'affixes'> & { affix?: { kind: GearItem['affixes'][number]['kind']; value: number } | null; affixes?: GearItem['affixes'] };

function fromVersion6(old: StateV6): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const gear = (g: OldGear | null): GearItem | null => {
    if (!g) return null;
    const { affix, ...rest } = g;
    return { ...rest, affixes: rest.affixes ?? (affix ? [affix] : []) };
  };
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    const equipment = { ...c.equipment };
    for (const slot of Object.keys(equipment) as (keyof typeof equipment)[]) equipment[slot] = gear(equipment[slot] as OldGear | null);
    let fight: Fight | null = null;
    if (c.fight) {
      const e = c.fight.enemy as Partial<Enemy> & Enemy;
      const enemy: Enemy = { ...e, next: e.next ?? null, armoured: e.armoured ?? null, evade: e.evade ?? 0, phase: e.phase ?? 1, phase2: e.phase2 ?? null };
      fight = { ...freshFight(enemy, c.fight.space, c.fight.spawn), ...c.fight, enemy };
    }
    characters[id] = { ...c, equipment, bag: (c.bag as OldGear[]).map((g) => gear(g)!), fight };
  }
  return { version: STATE_VERSION, seed: old.seed, board: old.board, characters, die: old.die ?? { sides: DICE_DATA.sides, last: null }, spawns: old.spawns ?? {}, nextItem: typeof old.nextItem === 'number' ? old.nextItem : 1, traces: {} };
}

function fromVersion5(old: StateV5): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  let board = makeBoard();
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    for (const areaId of c.opened ?? []) board = growBoard(board, old.seed, areaId);
    const opened = (c.opened ?? []).filter((a) => board.areas[a]);
    const space = board.spaces[c.space] && opened.includes(board.spaces[c.space]!.area) ? c.space : board.start;
    characters[id] = { ...c, id, opened: opened.length ? opened : [board.spaces[board.start]!.area], space, steps: space === c.space ? c.steps : 0, fight: space === c.space ? c.fight : null };
  }
  const spawns = Object.fromEntries(Object.entries(old.spawns ?? {}).filter(([space]) => board.spaces[space]));
  return { version: STATE_VERSION, seed: old.seed, board, characters, die: old.die ?? { sides: DICE_DATA.sides, last: null }, spawns, nextItem: typeof old.nextItem === 'number' ? old.nextItem : 1, traces: {} };
}

function fromOlder(old: StateV1 | StateV2 | StateV3 | StateV4): GameState | null {
  if (typeof old.seed !== 'string' || typeof old.characters !== 'object' || old.characters === null) return null;
  const board = makeBoard();
  const characters: Record<string, Character> = {};
  for (const [id, c] of Object.entries(old.characters)) {
    if (typeof c !== 'object' || c === null || !Object.hasOwn(CLASS_DATA, c.classId)) return null;
    const fresh = makeCharacter(id, typeof c.name === 'string' ? c.name : id, c.classId, board);
    const level = Math.max(1, Math.floor(typeof c.level === 'number' ? c.level : 1));
    const growth = CLASS_DATA[c.classId].growth;
    const grown: Character = {
      ...fresh,
      level,
      xp: typeof c.xp === 'number' ? c.xp : 0,
      gold: typeof c.gold === 'number' ? Math.max(0, c.gold) : fresh.gold,
      items: typeof c.items === 'object' && c.items !== null ? { ...c.items } : {},
      maxHp: fresh.maxHp + growth.hp * (level - 1),
      maxMana: fresh.maxMana + growth.mana * (level - 1),
      attack: fresh.attack + growth.attack * (level - 1),
      defense: fresh.defense + growth.defense * (level - 1),
    };
    characters[id] = { ...grown, hp: grown.maxHp, mana: grown.maxMana };
  }
  const sides = typeof old.die?.sides === 'number' ? old.die.sides : DICE_DATA.sides;
  return { version: STATE_VERSION, seed: old.seed, board, characters, die: { sides, last: null }, spawns: {}, nextItem: 1, traces: {} };
}
