// The shape of the game. Nothing here renders, talks to a socket or reads a clock.

export const STATE_VERSION = 8;

/** The kinds of spot (Robin, 2026-10-31): towns and shops, the wilds, chests, springs, shrines, and bosses on the board. */
export type SpaceKind = 'town' | 'shop' | 'normal' | 'chest' | 'potion' | 'spell' | 'boss';

export type ClassId = 'warrior' | 'rogue' | 'mage' | 'ranger';

/** The equipment slots (Robin, 2026-10-31). */
export type Slot = 'weapon' | 'armour' | 'helm' | 'boots' | 'trinket';
export const SLOTS: readonly Slot[] = ['weapon', 'armour', 'helm', 'boots', 'trinket'];

/** Unique is never rolled by chance: it is the rarity of the named pieces with powers that bosses carry (uniques.json). */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'];

/** A named piece's special effect. */
export type AffixKind = 'crit' | 'lifesteal' | 'dodge' | 'thorns' | 'vigor';
export interface Affix {
  kind: AffixKind;
  value: number;
}

/**
 * What a unique does (Robin, 2026-10-31: loot with effects that change how you play). The rules read these by name;
 * `uniques.json` gives each unique one, with a value.
 */
export type PowerKind =
  | 'twinStrike'
  | 'quickdraw'
  | 'frostbrand'
  | 'venom'
  | 'arcane'
  | 'bloodthirst'
  | 'thunder'
  | 'sunblade'
  | 'ward'
  | 'mirror'
  | 'bulwark'
  | 'secondWind'
  | 'scholar'
  | 'ironbrow'
  | 'strider'
  | 'windstep'
  | 'pathfinder'
  | 'greed'
  | 'regen'
  | 'manaWell'
  | 'lucky'
  | 'phoenix'
  | 'fury';

/** What an enemy's move does besides its blow: the guard has something to read. */
export type EnemyEffect = 'poison' | 'drain' | 'armour' | 'evade' | 'heal' | 'weaken';

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
  phase2?: EnemyPhase;
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
  /** Rare and up carry one; a legendary two; a unique one beside its power. */
  affixes: Affix[];
  /** The id in uniques.json when the piece is a unique: its power is read from there. */
  unique?: string;
  price: number;
}

/** A town's errand (mine, 2026-11-01, from Robin's list: direction between bosses): what to do, where, how far along, what it pays. */
export interface Quest {
  /** The space id of the town that gave it: one errand a town. */
  id: string;
  kind: 'cull' | 'chests' | 'hunt' | 'boss';
  town: string;
  area: string;
  /** The creature to beat (cull, hunt, boss); null for chests. */
  target: string | null;
  count: number;
  done: number;
  gold: number;
  xp: number;
  /** The chance the reward holds a unique of the tier. */
  unique: number;
  text: string;
}

/** A pending question the character must answer before rolling again: the gambler's, a town's errand, or a piece that found no room in the bag. */
export type Offer = { kind: 'gamble'; stake: number } | { kind: 'quest'; quest: Quest } | { kind: 'loot'; gear: GearItem };

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
  /** The errands carried, one a town at most. */
  quests: Quest[];
  /** Picks of one ability in two owed from levels, answered one at a time before the next roll. */
  picks: string[][];
}

export interface EnemyMove {
  name: string;
  power: number;
  weight: number;
  /** A wind-up: no blow this round, the next one hits for `enemyCharge` times as much. */
  charge?: boolean;
  /** What the move does besides (or instead of) its blow. */
  effect?: EnemyEffect;
}

/** A boss's second wind: under `at` of its HP it switches to these moves, with a line to say. */
export interface EnemyPhase {
  at: number;
  text: string;
  moves: EnemyMove[];
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
  /** What it will do next round, shown ahead so the guard can be chosen for it (mine, 2026-10-31); null before it is known. */
  next: EnemyMove | null;
  /** Hardened: its defense multiplied for some rounds. */
  armoured: { rounds: number; mult: number } | null;
  /** Player hits that will miss it. */
  evade: number;
  /** 1 until a boss's second phase begins, then 2. */
  phase: number;
  phase2: EnemyPhase | null;
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
  /** The class's meter (Rage, Combo, Flow, Focus), 0 to `meterMax`; abilities spend it. */
  meter: number;
  /** Hits the player has landed this fight (Stormcaller counts them). */
  strikes: number;
  /** Player hits that will surely crit. */
  sureCrit: number;
  /** A spell in the air (Meteor): it lands when `rounds` reaches 0. */
  windup: { name: string; power: number; rounds: number } | null;
  /** A companion striking at the end of each round. */
  companion: { name: string; rounds: number; power: number } | null;
  /** The next `hits` player hits land `mult` times as hard. */
  mark: { hits: number; mult: number } | null;
  /** Enemy wind-ups that will fail. */
  trap: number;
  /** Enemy turns lost to Time Warp: nothing resists it. */
  skip: number;
  /** The player's poison and weakening, from the enemy's moves. */
  poisoned: { rounds: number; damage: number } | null;
  weak: { rounds: number; mult: number } | null;
  /** Once-a-fight things already used: ability ids, and powers such as ward, secondWind, quickdraw. */
  used: string[];
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
  /** At a shop: a consumable by id, or the plain gear of the shop's rank for a slot; in a town, an ability from the trainer. */
  | { type: 'buy'; id: string; player: string; item?: string; slot?: Slot; ability?: string }
  | { type: 'sell'; id: string; player: string; gear: string }
  | { type: 'equip'; id: string; player: string; gear: string }
  | { type: 'unequip'; id: string; player: string; slot: Slot }
  | { type: 'drop'; id: string; player: string; gear: string }
  /** A dice card while a roll is pending; `value` is the number for Exactly N. */
  | { type: 'use'; id: string; player: string; item: string; value?: number }
  | { type: 'gamble'; id: string; player: string; choice: 'high' | 'low' | 'pass' }
  /** The answer to a pick of one ability in two. */
  | { type: 'pick'; id: string; player: string; ability: string }
  /** The answer to a town's errand. */
  | { type: 'quest'; id: string; player: string; accept: boolean }
  /** The answer for a piece that found no room in the bag: sold on the spot, or left. */
  | { type: 'keep'; id: string; player: string; choice: 'sell' | 'drop' }
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
  | 'not enough meter'
  | 'already used'
  | 'no such ability'
  | 'not at a shop'
  | 'not in a town'
  | 'bag full'
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
  /** A level crossed owes a pick of one ability in two, answered on the board. */
  | { type: 'pickOwed'; action: string; player: string; options: string[]; level: number }
  /** One of two abilities taken at a level (the other stays for a shrine to teach). */
  | { type: 'picked'; action: string; player: string; ability: string; rank: number }
  /** A town's errand taken or declined. */
  | { type: 'questTaken'; action: string; player: string; quest: Quest }
  | { type: 'questDeclined'; action: string; player: string; quest: Quest }
  /** An errand moved along; `quest` is how it stands now. */
  | { type: 'questProgress'; action: string; player: string; quest: Quest }
  /** An errand turned in; what it paid follows as gold, levels and maybe loot. */
  | { type: 'questDone'; action: string; player: string; quest: Quest }
  /** A piece that found no room in the bag: it waits in `offer` for keep, or was sold at once for `sold` when something else was pending. */
  | { type: 'bagFull'; action: string; player: string; gear: GearItem; sold: number | null }
  /** An ability bought from a town's trainer: learned, or a rank gained. */
  | { type: 'trained'; action: string; player: string; ability: string; rank: number; price: number; gold: number }
  /** A wandering merchant: the shop is open here. */
  | { type: 'merchant'; action: string; player: string }
  /** A fight began against this enemy, on this space. */
  | { type: 'fight'; action: string; player: string; enemy: Enemy; space: string }
  /** One blow landed; `hp` is what it left. `absorbed` is what a barrier soaked first. */
  | { type: 'hit'; action: string; player: string; by: 'player' | 'enemy'; move: string; damage: number; crit: boolean; hp: number; absorbed: number }
  | { type: 'missed'; action: string; player: string; by: 'player' | 'enemy'; move: string }
  | { type: 'charged'; action: string; player: string; by: 'player' | 'enemy'; move: string }
  | { type: 'guarded'; action: string; player: string; guard: Guard }
  /** The enemy lost its turn: stunned, caught in time (Time Warp), or its wind-up sprang a trap. */
  | { type: 'skipped'; action: string; player: string; by: 'enemy'; reason: 'stunned' | 'warped' | 'trapped' }
  /** A mini-boss or a boss shrugged an effect off; or Ironbrow shrugged one off the player. */
  | { type: 'resisted'; action: string; player: string; kind: 'stunned' | 'weakened' | 'poison' | 'crit' }
  | { type: 'effect'; action: string; player: string; target: 'player' | 'enemy'; kind: 'attackUp' | 'weakened' | 'stunned' | 'poison' | 'barrier' | 'evade' | 'armoured' | 'mark' | 'companion' | 'windup' | 'skip' | 'trap' | 'sureCrit'; rounds: number }
  /** A poison bit; `hp` is what it left. */
  | { type: 'poisoned'; action: string; player: string; target: 'player' | 'enemy'; damage: number; hp: number }
  /** What the enemy will do next round. */
  | { type: 'intent'; action: string; player: string; move: string; effect: EnemyEffect | null; charge: boolean }
  /** A boss's second phase began. */
  | { type: 'phase'; action: string; player: string; text: string }
  /** The class's meter moved; `name` is Rage, Combo, Flow or Focus. */
  | { type: 'meter'; action: string; player: string; name: string; value: number; max: number }
  /** Gold lifted from the enemy in the fight. */
  | { type: 'stolen'; action: string; player: string; gold: number; total: number }
  /** The enemy healed itself; `hp` is the new value. */
  | { type: 'enemyHealed'; action: string; player: string; amount: number; hp: number }
  /** A blow that would have felled you did not: a power caught you; `hp` is where it left you. */
  | { type: 'revived'; action: string; player: string; by: 'secondWind' | 'phoenix'; hp: number }
  /** The enemy drank mana from you. */
  | { type: 'drained'; action: string; player: string; mana: number; left: number }
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
