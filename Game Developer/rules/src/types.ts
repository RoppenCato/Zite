// The shape of the game. Nothing here renders, talks to a socket or reads a clock.

export const STATE_VERSION = 6;

/** The kinds of spot (Robin, 2026-10-31): towns and shops, the wilds, chests, springs, shrines, and bosses on the board. */
export type SpaceKind = 'town' | 'shop' | 'normal' | 'chest' | 'potion' | 'spell' | 'boss';

export type ClassId = 'warrior' | 'rogue' | 'mage' | 'ranger';

/** The equipment slots (Robin, 2026-10-31). */
export type Slot = 'weapon' | 'armour' | 'helm' | 'boots' | 'trinket';
export const SLOTS: readonly Slot[] = ['weapon', 'armour', 'helm', 'boots', 'trinket'];

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** A named piece's special effect. */
export type AffixKind = 'crit' | 'lifesteal' | 'dodge' | 'thorns' | 'vigor';

/** The defensive choice made before the enemy's blow (Robin, 2026-10-31: different kinds; these four are mine). */
export type Guard = 'none' | 'block' | 'dodge' | 'brace' | 'counter';

/**
 * One space on the board. `x` and `y` are world pixels; `links` are the spaces one step away; `area` is the area it
 * lies in. A plain road space has the name "". A boss space names its boss and the area it opens (null for none yet).
 */
export interface Space {
  id: string;
  kind: SpaceKind;
  name: string;
  x: number;
  y: number;
  links: string[];
  area: string;
  boss?: string;
  opens?: string | null;
}

/** An area of the map: a theme, a tier, the levels of what lives there, and which mobs and mini-bosses those are. */
export interface Area {
  id: string;
  name: string;
  theme: string;
  tier: number;
  levels: [number, number];
  mobs: string[];
  miniBosses: string[];
  /** The box round its spaces, with a margin, in world pixels: the camera's overview of what is open. */
  bounds: { x: number; y: number; width: number; height: number };
}

/** A creature as the data describes it: what a fight starts from. */
export interface EnemyData {
  name: string;
  level: number;
  role: 'mob' | 'mini' | 'boss';
  hp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
  moves: EnemyMove[];
}

/**
 * The board is a graph: spaces and the connections between them, never a grid. One big map in areas by tier: the
 * hand-laid ones from the start, and the grown ones added as bosses fall, with their creatures in the bestiary.
 */
export interface Board {
  start: string;
  width: number;
  height: number;
  spaces: Record<string, Space>;
  areas: Record<string, Area>;
  /** The creatures of the grown areas, by id; the hand-laid ones live in enemies.json. */
  bestiary: Record<string, EnemyData>;
}

export type GearStat = 'attack' | 'defense' | 'maxHp' | 'maxMana';

/** A piece of gear as rolled: its rank by tier, its rarity, its name, what it adds, and its special effect if named. */
export interface GearItem {
  id: string;
  slot: Slot;
  rank: number;
  rarity: Rarity;
  /** "Iron Sword", or a proper name such as "Stormborn" for an epic or legendary piece. */
  name: string;
  /** The plain description under a proper name: "iron sword". */
  base: string;
  stats: Partial<Record<GearStat, number>>;
  affix: { kind: AffixKind; value: number } | null;
  price: number;
}

/** A pending question the character must answer before rolling again. */
export interface Offer {
  kind: 'gamble';
  stake: number;
}

export interface Character {
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  gold: number;
  hp: number;
  mana: number;
  /** The base numbers from the class and the levels; gear adds to them (see `stats`). */
  maxHp: number;
  maxMana: number;
  attack: number;
  defense: number;
  /** The space the character stands on. */
  space: string;
  /** Steps still to walk from the last roll; 0 means no roll is pending. */
  steps: number;
  /** The fight the character is in, or null. While it lasts, the board waits. */
  fight: Fight | null;
  /** The bag of consumables: item id to count (rules/data/items.json). */
  items: Record<string, number>;
  equipment: Record<Slot, GearItem | null>;
  /** Gear carried but not worn. */
  bag: GearItem[];
  /** Abilities known: ability id to rank (1 to 3). */
  abilities: Record<string, number>;
  /** The areas this character has opened. */
  opened: string[];
  /** Spots used up for a while: space id to the time (ms) they give again. Bosses, chests, springs, shrines. */
  cooldowns: Record<string, number>;
  /** Times each boss space's boss was beaten. */
  bossKills: Record<string, number>;
  offer: Offer | null;
}

export interface EnemyMove {
  name: string;
  power: number;
  weight: number;
  /** A wind-up: no blow this round, the next one hits for `enemyCharge` times as much. */
  charge?: boolean;
}

/** The enemy as it stands in a fight. */
export interface Enemy {
  id: string;
  name: string;
  level: number;
  role: 'mob' | 'mini' | 'boss';
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
  moves: EnemyMove[];
  /** The wind-up held, named by its move; the next blow carries that name and hits `enemyCharge` times as hard. */
  charged: string | null;
  /** Rounds it must skip. */
  stunned: number;
  weakened: { rounds: number; mult: number } | null;
  poison: { rounds: number; damage: number } | null;
}

export interface Fight {
  enemy: Enemy;
  /** The round about to be fought, from 1. */
  round: number;
  /** True after a charge: the next hit is `charge` times as strong. */
  charged: boolean;
  attackUp: { rounds: number; mult: number } | null;
  /** Damage soaked before HP. */
  barrier: number;
  /** Enemy blows that will miss. */
  evade: number;
  /** The space the fight is on (a boss space, a spawn, or just the wilds). */
  space: string;
  /** True when the enemy is a spawn on the board, cleared when it falls. */
  spawn: boolean;
}

/** Something that turned up on a normal spot for a while: a mini-boss prowling, or a merchant camped. */
export interface Spawn {
  kind: 'miniboss' | 'merchant';
  enemy: string | null;
  until: number;
}

export interface Die {
  sides: number;
  /** The last value rolled (or set by a dice card), or null before the first roll. */
  last: number | null;
}

export interface GameState {
  version: typeof STATE_VERSION;
  seed: string;
  board: Board;
  characters: Record<string, Character>;
  die: Die;
  spawns: Record<string, Spawn>;
  /** The next gear id's number. */
  nextItem: number;
}

/** What the player does in a round (Robin, 2026-10-31: attack, items, spells and abilities, charging). */
export type FightMove =
  | { kind: 'attack' }
  | { kind: 'ability'; ability: string }
  | { kind: 'charge' }
  | { kind: 'item'; item: string }
  | { kind: 'flee' };

/** What a player wants. Every action carries a client-made id so a retry never acts twice. */
export type Action =
  | { type: 'roll'; id: string; player: string }
  | { type: 'move'; id: string; player: string; path: string[] }
  /** One round of a fight: the move, and the guard taken before the enemy's blow. */
  | { type: 'fight'; id: string; player: string; move: FightMove; guard: Guard }
  /** At a shop: a consumable by id, or the plain gear of the shop's rank for a slot. */
  | { type: 'buy'; id: string; player: string; item?: string; slot?: Slot }
  | { type: 'sell'; id: string; player: string; gear: string }
  | { type: 'equip'; id: string; player: string; gear: string }
  | { type: 'unequip'; id: string; player: string; slot: Slot }
  | { type: 'drop'; id: string; player: string; gear: string }
  /** A dice card while a roll is pending; `value` is the number for Exactly N. */
  | { type: 'use'; id: string; player: string; item: string; value?: number }
  | { type: 'gamble'; id: string; player: string; choice: 'high' | 'low' | 'pass' }
  /** The world moves: spawns come and go. Sent by whoever holds the state, now and then. */
  | { type: 'tick'; id: string; player: string };

export type RejectReason =
  | 'unknown player'
  | 'finish your move first'
  | 'finish the fight first'
  | 'answer first'
  | 'roll first'
  | 'wrong number of steps'
  | 'no such space'
  | 'not connected'
  | 'no turning back'
  | 'that way is closed'
  | 'not in a fight'
  | 'not enough mana'
  | 'no such ability'
  | 'not at a shop'
  | 'not enough gold'
  | 'no such item'
  | 'no such gear'
  | 'none left'
  | 'not now'
  | 'bad value'
  | 'nothing to answer';

/** What happened. The client plays these back; the server will send them on. */
export type GameEvent =
  | { type: 'rolled'; action: string; player: string; value: number }
  | { type: 'moved'; action: string; player: string; from: string; path: string[] }
  | { type: 'landed'; action: string; player: string; space: string; kind: SpaceKind }
  /** A town: HP and mana back to full. */
  | { type: 'rested'; action: string; player: string; hp: number; mana: number }
  /** Gold found (delta > 0) or lost (delta < 0); `gold` is the new total. */
  | { type: 'gold'; action: string; player: string; delta: number; gold: number }
  /** HP given back; `amount` is 0 when there was nothing to heal. `hp` is the new value. */
  | { type: 'healed'; action: string; player: string; amount: number; hp: number }
  /** A consumable gained. */
  | { type: 'found'; action: string; player: string; item: string; count: number }
  /** Gear gained, into the bag. */
  | { type: 'loot'; action: string; player: string; gear: GearItem }
  /** A chest opened; what was in it follows as gold, loot or found. */
  | { type: 'chest'; action: string; player: string }
  /** A spot used up for now; `until` is when it gives again. */
  | { type: 'empty'; action: string; player: string; space: string; until: number }
  | { type: 'learned'; action: string; player: string; ability: string; rank: number }
  | { type: 'nothing'; action: string; player: string; text: string }
  | { type: 'offer'; action: string; player: string; offer: Offer }
  | { type: 'gambled'; action: string; player: string; choice: 'high' | 'low'; roll: number; won: boolean; delta: number; gold: number }
  /** A wandering merchant: the shop is open here. */
  | { type: 'merchant'; action: string; player: string }
  /** A fight began against this enemy, on this space. */
  | { type: 'fight'; action: string; player: string; enemy: Enemy; space: string }
  /** One blow landed; `hp` is what it left. `absorbed` is what a barrier soaked first. */
  | { type: 'hit'; action: string; player: string; by: 'player' | 'enemy'; move: string; damage: number; crit: boolean; hp: number; absorbed: number }
  | { type: 'missed'; action: string; player: string; by: 'player' | 'enemy'; move: string }
  | { type: 'charged'; action: string; player: string; by: 'player' | 'enemy'; move: string }
  | { type: 'guarded'; action: string; player: string; guard: Guard }
  /** The enemy lost its turn. */
  | { type: 'skipped'; action: string; player: string; by: 'enemy'; reason: 'stunned' }
  /** A mini-boss or a boss shrugged an effect off. */
  | { type: 'resisted'; action: string; player: string; kind: 'stunned' }
  | { type: 'effect'; action: string; player: string; target: 'player' | 'enemy'; kind: 'attackUp' | 'weakened' | 'stunned' | 'poison' | 'barrier' | 'evade'; rounds: number }
  /** The enemy's poison bit; `hp` is what it left. */
  | { type: 'poisoned'; action: string; player: string; damage: number; hp: number }
  /** A free blow back after taking one (the counter guard, or thorns); `hp` is the enemy's. */
  | { type: 'countered'; action: string; player: string; damage: number; hp: number }
  | { type: 'mana'; action: string; player: string; delta: number; mana: number }
  | { type: 'fled'; action: string; player: string; ok: boolean }
  | { type: 'won'; action: string; player: string; xp: number; gold: number }
  | { type: 'levelled'; action: string; player: string; level: number; maxHp: number; maxMana: number; attack: number; defense: number }
  /** Beaten: back on your feet in the nearest town, a share of the gold gone. */
  | { type: 'died'; action: string; player: string; town: string; lostGold: number }
  | { type: 'opened'; action: string; player: string; area: string }
  /** A boss beaten; `until` is when it is back. */
  | { type: 'bossDown'; action: string; player: string; space: string; until: number }
  | { type: 'bought'; action: string; player: string; item: string | null; gear: GearItem | null; price: number; gold: number }
  | { type: 'sold'; action: string; player: string; gear: GearItem; price: number; gold: number }
  | { type: 'equipped'; action: string; player: string; gear: GearItem; replaced: GearItem | null }
  | { type: 'unequipped'; action: string; player: string; gear: GearItem }
  | { type: 'dropped'; action: string; player: string; gear: GearItem }
  /** An item spent; what it did follows. */
  | { type: 'used'; action: string; player: string; item: string }
  /** The steps owed from the pending roll changed (a dice card); the die shows the new number. */
  | { type: 'steps'; action: string; player: string; steps: number }
  | { type: 'spawned'; action: string; player: string; space: string; spawn: Spawn }
  | { type: 'despawned'; action: string; player: string; space: string }
  | { type: 'rejected'; action: string; player: string; reason: RejectReason };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
}
