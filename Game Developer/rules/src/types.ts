// The shape of the game. Nothing here renders, talks to a socket or reads a clock.

export const STATE_VERSION = 26;

/** The kinds of spot (Robin, 2026-10-31): towns and shops, the wilds, chests, springs, shrines, and bosses on the board. */
export type SpaceKind = 'town' | 'shop' | 'normal' | 'chest' | 'potion' | 'spell' | 'church' | 'boss' | 'board' | 'gear' | 'arena' | 'door';

export type ClassId = 'warrior' | 'rogue' | 'mage' | 'ranger';

/** The equipment slots (Robin, 2026-10-31). */
/** The gear slots, in the order they are worn and shown (Robin, 2026-10-31 the first five; 2026-11-01 shield, gloves and cape, so that what shows on the character can be worn piece by piece). */
export type Slot = 'weapon' | 'shield' | 'helm' | 'armour' | 'gloves' | 'boots' | 'cape' | 'trinket';
export const SLOTS: readonly Slot[] = ['weapon', 'shield', 'helm', 'armour', 'gloves', 'boots', 'cape', 'trinket'];

/** Unique is never rolled by chance: it is the rarity of the named pieces with powers that bosses carry (uniques.json). */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'];

/** A named piece's special effect. */
export type AffixKind = 'crit' | 'lifesteal' | 'dodge' | 'thorns' | 'vigor' | 'cruelty' | 'haste' | 'venom' | 'embers' | 'frost' | 'giant' | 'hunter' | 'ruin' | 'magus' | 'focus' | 'turtle' | 'wall' | 'mending' | 'clarity' | 'warding' | 'resolve' | 'fortune' | 'wisdom' | 'scavenger' | 'explorer' | 'luck' | 'road' | 'plenty';
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
  /** A door: the spot it leads to, in another part of the board. */
  door?: string;
  /** A shop's stock: arms when not said. */
  stock?: ShopStock;
  /** A locked chest: it opens only with the area's key, which its mini-boss carries, and holds more (mine, 2026-11-01). */
  locked?: boolean;
}

/** A hunting ground (Robin, 2026-11-02): the spots nearest `hub`, where `mob` mostly roams, carries `trophy` and leans to `drops`. */
export interface Ground {
  id: string;
  name: string;
  hub: string;
  mob: string;
  trophy: string;
  drops: Slot[];
  /** The levels it suits, shown on the map. */
  levels?: [number, number];
}

/** The land of a place, as an outline: a ground's own id, a town's, or a `wild` place, named land where the nearest ground's creature still hunts. */
export interface Place {
  id: string;
  shape: [number, number][];
  wild?: boolean;
  name?: string;
}

/** An area of the map: a theme, a tier, the levels of what lives there, and which mobs and mini-bosses those are. */
export interface Area {
  /** A dungeon: off the map, hidden until you stand in it, with no spawns and no boss to walk straight to. */
  dungeon?: boolean;
  id: string;
  name: string;
  theme: string;
  /** The kingdom or territory the area belongs to: a label for the atlas and the hints (the Enchanted Kingdoms catalogue). */
  kingdom?: string;
  tier: number;
  levels: [number, number];
  mobs: string[];
  miniBosses: string[];
  /** Its hunting grounds, where the data names them; `groundsOf` makes them for a grown area. */
  grounds?: Ground[];
  /** The land of its places, as outlines: a ground's own id, or a town's. */
  places?: Place[];
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

export type GearStat = 'attack' | 'defense' | 'maxHp' | 'maxMana' | 'magic';

/** Which kind of gear: heavy Tin for defense and health, light Leather for crits and attack, magic Cloth for spells (Robin, 2026-11-02). */
export type GearLine = 'heavy' | 'light' | 'magic';

/** What a shop sells: arms and armour, magic, a town's flasks and cards, or all of it from a merchant. */
export type ShopStock = 'arms' | 'magic' | 'town' | 'merchant';

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
  /** Heavy when not said. */
  line?: GearLine;
  /** Rare and up carry one; a legendary two; a unique one beside its power. */
  affixes: Affix[];
  /** The id in uniques.json when the piece is a unique: its power is read from there. */
  unique?: string;
  price: number;
}

/** A town's errand (mine, 2026-11-01, from Robin's list: direction between bosses): what to do, where, how far along, what it pays. */
export interface Quest {
  id: string;
  kind: 'kill' | 'loot' | 'mini' | 'find';
  /** The board that gave it. */
  town: string;
  area: string;
  /** The ground it asks you to walk. */
  ground?: string;
  /** The creature to beat, or the person to find. */
  target: string | null;
  /** What a loot quest carries home. */
  trophy?: string;
  count: number;
  done: number;
  gold: number;
  xp: number;
  /** The chance the reward holds a unique of the tier. */
  unique: number;
  text: string;
}

/** A pending question the character must answer before rolling again: the gambler's, a town's errand, or a piece that found no room in the bag. */
export type Offer = { kind: 'arena'; mode: string; wave: number; total: number; gold: number; xp: number; gear: boolean } | { kind: 'gamble'; stake: number } | { kind: 'board'; quests: Quest[]; from?: string } | { kind: 'roll'; what: 'flask' | 'gear' | 'find'; need: number; slot?: Slot; text?: string } | { kind: 'loot'; gear: GearItem };

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
  /** A run in the Arena: the wave under way and the pot so far, lost on a fall. */
  arena?: { mode: string; wave: number; gold: number; xp: number; flasks: number };
  /** The Arena's modes already tried on this day: once each, so it cannot be farmed. */
  arenaDone?: { day: number; modes: string[] };
  /** A test switch: the Arena is open for this character whatever the day (to go before Alpha). */
  arenaTest?: boolean;
  /** The errands carried, one a town at most. */
  quests: Quest[];
  /** The errands finished, oldest first, the last few kept for the quest log (Robin, 2026-11-01). */
  questsDone: Quest[];
  /** The towns this character has stood in: the coach goes to these. */
  visited?: string[];
  /** The rest of a walk stopped at the quest board, walked once the board is answered. */
  walking?: string[];
  /** Elixirs drunk: what they add and for how many more fights. */
  elixirs?: Partial<Record<'vigor' | 'arcana', { value: number; fights: number }>>;
  /** The abilities brought into a fight, up to four. */
  carried: string[];
  /** Points from a first win over a region's boss, on top of the levels'. */
  bonusPoints: number;
  /** What has been beaten and found (Robin, 2026-11-02). */
  journal: { beaten: Record<string, number>; places: string[]; done: string[] };
  /** Keys to the locked chests, by area: a mini-boss of the area drops one. */
  keys: Record<string, number>;
  /** What a fight left on you (Robin, 2026-11-01): it stays until it wears off or a church cures it. */
  ailments: Ailments;
}

/** Poison stings on each roll; weakness softens your hits through the next fight. */
export interface Ailments {
  poison?: { rolls: number; damage: number };
  weak?: { rounds: number; mult: number };
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
  /** A wanderer always drops a piece, at a boss's rarity. */
  wanderer?: boolean;
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
  /** Burning, as poison but from fire; taking more damage. */
  burn?: { rounds: number; damage: number } | null;
  sunder?: { rounds: number; mult: number } | null;
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
  /** True against a world boss: its HP lives in the spawn and is shared by everyone fighting it. */
  shared?: boolean;
  /** The class's meter (Valor, Mischief, Arcana, Aim), 0 to `meterMax`; abilities spend it. */
  meter: number;
  /** Hits the player has landed this fight (Stormcaller counts them). */
  strikes: number;
  /** Player hits that will surely crit. */
  sureCrit: number;
  /** A spell in the air (Meteor): it lands when `rounds` reaches 0. */
  windup: { name: string; power: number; rounds: number } | null;
  /** A companion striking at the end of each round. */
  companion: { name: string; rounds: number; power: number; hits?: number } | null;
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
  /** Hits since the last crit (the Rogue). */
  streak: number;
  /** The next spell lands this much harder (Overflow). */
  nextSpell: number;
  regen: { rounds: number; share: number } | null;
  infuse: { kind: 'ice' | 'storm'; rounds: number; power: number; mult?: number; chance?: number } | null;
  /** Shadow Dance: this round's blow in full, then `rounds` rounds at this dodge. */
  dance: { exposed: boolean; rounds: number; chance: number } | null;
  coat: { hits: number; power: number; rounds: number } | null;
  blockUp: { rounds: number; mult: number } | null;
  thornsUp: { rounds: number; share: number } | null;
  counterUp: { rounds: number; chance: number } | null;
  spike: { rounds: number; power: number } | null;
  clone: { rounds: number; power: number } | null;
  /** Last Light: the next fatal blow leaves this share of HP. */
  guardian: number;
  /** All healed this fight (Judgement Day). */
  healed: number;
}

/** Something that turned up on a normal spot for a while: a mini-boss prowling, or a merchant camped. */
export interface Spawn {
  kind: 'miniboss' | 'merchant' | 'worldboss' | 'elite' | 'wanderer';
  enemy: string | null;
  until: number;
  /** A wanderer (Robin, 2026-11-02): far too strong for its land, its level shown on the map; it walks the roads, to be avoided or tried later. */
  level?: number;
  /** A world boss (mine, 2026-11-01): its HP, shared by everyone who fights it, and the damage each player dealt. */
  hp?: number;
  maxHp?: number;
  hitters?: Record<string, number>;
}

/** A note a player left on a spot (mine, 2026-11-01). */
export interface Trace {
  player: string;
  name: string;
  text: string;
  at: number;
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
  /** The notes left on spots, newest first. */
  traces: Record<string, Trace[]>;
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
  /** Go straight to a boss's spot in land you have opened, and fight it (Robin, 2026-11-02). */
  | { type: 'challenge'; id: string; player: string; space: string }
  | { type: 'move'; id: string; player: string; path: string[] }
  /** One round of a fight: the move, and the guard taken before the enemy's blow. */
  | { type: 'fight'; id: string; player: string; move: FightMove; guard: Guard }
  /** At a shop: a consumable by id, or the plain gear of the shop's rank for a slot. */
  | { type: 'buy'; id: string; player: string; line?: GearLine; item?: string; slot?: Slot }
  | { type: 'sell'; id: string; player: string; gear: string }
  | { type: 'equip'; id: string; player: string; gear: string }
  | { type: 'unequip'; id: string; player: string; slot: Slot }
  | { type: 'drop'; id: string; player: string; gear: string }
  /** A dice card while a roll is pending; `value` is the number for a Fairy Pick. */
  | { type: 'use'; id: string; player: string; item: string; value?: number }
  | { type: 'gamble'; id: string; player: string; choice: 'high' | 'low' | 'pass' }
  /** Through the door you stand on. */
  | { type: 'door'; id: string; player: string }
  /** The Arena: go in, go on to the next wave, take the pot; `test` opens it for this character. */
  | { type: 'arena'; id: string; player: string; op: 'enter' | 'next' | 'take' | 'test'; mode?: string }
  /** The skill board: learn or raise an ability, carry or put down an ability, or reset in a town. */
  | { type: 'skill'; id: string; player: string; op: 'learn' | 'carry'; ability: string }
  /** For Robin's testing (2026-11-02), to go before an Alpha: another class, or a level more. */
  | { type: 'skill'; id: string; player: string; op: 'testClass'; classId: ClassId }
  | { type: 'skill'; id: string; player: string; op: 'testLevel' }
  | { type: 'skill'; id: string; player: string; op: 'reset' }
  /** The answer to a town's errand. */
  | { type: 'quest'; id: string; player: string; accept: boolean; index?: number; drop?: boolean }
  | { type: 'try'; id: string; player: string }
  | { type: 'travel'; id: string; player: string; to: string }
  /** The answer for a piece that found no room in the bag: sold on the spot, or left. */
  | { type: 'keep'; id: string; player: string; choice: 'sell' | 'drop' }
  /** The world moves: spawns come and go. Sent by whoever holds the state, now and then. */
  /** A new character for `player` at the start. Sent by whoever makes accounts: the server, or the local holder. */
  | { type: 'join'; id: string; player: string; name: string; classId: ClassId }
  /** A note on the spot the character stands on: one of the set lines (rules/data/traces.json). */
  | { type: 'trace'; id: string; player: string; text: string }
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
  | 'nothing to answer'
  | 'already here';

/** What happened. The client plays these back; the server will send them on. */
export type GameEvent =
  | { type: 'rolled'; action: string; player: string; value: number }
  | { type: 'moved'; action: string; player: string; from: string; path: string[] }
  | { type: 'landed'; action: string; player: string; space: string; kind: SpaceKind }
  /** A town: HP and mana back to full. */
  | { type: 'rested'; action: string; player: string; hp: number; mana: number }
  /** A church took these off you. */
  | { type: 'cured'; action: string; player: string; ailments: string[] }
  /** Poison carried out of a fight stung on a roll. */
  | { type: 'stung'; action: string; player: string; damage: number; hp: number; left: number }
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
  | { type: 'doored'; action: string; player: string; from: string; to: string }
  | { type: 'arenaTaken'; action: string; player: string; waves: number; gold: number; xp: number }
  | { type: 'gambled'; action: string; player: string; choice: 'high' | 'low'; roll: number; won: boolean; delta: number; gold: number }
  /** Levels crossed or a boss beaten brought skill points. */
  | { type: 'skillPoints'; action: string; player: string; gained: number; free: number }
  /** Blood Price, Reckless Swing: HP spent. */
  | { type: 'journal'; action: string; player: string; text: string }
  | { type: 'selfHurt'; action: string; player: string; amount: number; hp: number }
  | { type: 'skillReset'; action: string; player: string }
  /** A town's errand taken or declined. */
  | { type: 'questTaken'; action: string; player: string; quest: Quest }
  | { type: 'questDeclined'; action: string; player: string; quest: Quest }
  /** An errand moved along; `quest` is how it stands now. */
  | { type: 'questProgress'; action: string; player: string; quest: Quest }
  | { type: 'traveled'; action: string; player: string; from: string; to: string; price: number; gold: number }
  | { type: 'tried'; action: string; player: string; what: 'flask' | 'gear' | 'find'; roll: number; need: number; won: boolean }
  | { type: 'personFound'; action: string; player: string; person: string; quest: Quest }
  /** An errand turned in; what it paid follows as gold, levels and maybe loot. */
  | { type: 'questDone'; action: string; player: string; quest: Quest }
  /** A piece that found no room in the bag: it waits in `offer` for keep, or was sold at once for `sold` when something else was pending. */
  | { type: 'bagFull'; action: string; player: string; gear: GearItem; sold: number | null }
  /** A locked chest with no key for it: `mini` names what carries the key. */
  | { type: 'locked'; action: string; player: string; space: string; area: string; mini: string | null }
  /** The key to an area's locked chest, from its mini-boss. */
  | { type: 'keyFound'; action: string; player: string; area: string }
  /** A wild spot's event of the area's theme; what it did follows as healed, hit, gold, mana or found. */
  | { type: 'themeEvent'; action: string; player: string; text: string; kind: 'heal' | 'hurt' | 'gold' | 'mana' | 'flask' | 'card'; amount: number }
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
  | { type: 'effect'; action: string; player: string; target: 'player' | 'enemy'; kind: 'burn' | 'sunder' | 'interrupt' | 'guardian' | 'clone' | 'attackUp' | 'weakened' | 'stunned' | 'poison' | 'barrier' | 'evade' | 'armoured' | 'mark' | 'companion' | 'windup' | 'skip' | 'trap' | 'sureCrit'; rounds: number }
  /** A poison bit; `hp` is what it left. */
  | { type: 'poisoned'; action: string; player: string; target: 'player' | 'enemy'; damage: number; hp: number; burn?: boolean }
  /** What the enemy will do next round. */
  | { type: 'intent'; action: string; player: string; move: string; effect: EnemyEffect | null; charge: boolean }
  /** A boss's second phase began. */
  | { type: 'phase'; action: string; player: string; text: string }
  /** The class's meter moved; `name` is Valor, Mischief, Arcana or Aim. */
  | { type: 'meter'; action: string; player: string; name: string; value: number; max: number }
  /** Gold lifted from the enemy in the fight. */
  | { type: 'stolen'; action: string; player: string; gold: number; total: number }
  /** The enemy healed itself; `hp` is the new value. */
  | { type: 'enemyHealed'; action: string; player: string; amount: number; hp: number }
  /** A blow that would have felled you did not: a power caught you; `hp` is where it left you. */
  | { type: 'revived'; action: string; player: string; by: 'guardian' | 'secondWind' | 'phoenix'; hp: number }
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
  | { type: 'joined'; action: string; player: string; name: string; classId: ClassId; space: string }
  | { type: 'traced'; action: string; player: string; space: string; trace: Trace }
  /** A world boss fell: everyone who hit it is paid by their share of the damage. */
  | { type: 'worldBossDown'; action: string; player: string; space: string; enemy: string; shares: { player: string; damage: number; xp: number; gold: number }[] }
  /** A world boss's time ran out: it left, and the fights on it ended. */
  | { type: 'bossLeft'; action: string; player: string; space: string; enemy: string; players: string[] }
  | { type: 'rejected'; action: string; player: string; reason: RejectReason };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
}
