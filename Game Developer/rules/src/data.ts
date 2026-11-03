// The numbers live in rules/data/*.json; this file gives them types. Balancing is editing those files.

import worldJson from '../data/world.json' with { type: 'json' };
import diceJson from '../data/dice.json' with { type: 'json' };
import classesJson from '../data/classes.json' with { type: 'json' };
import spacesJson from '../data/spaces.json' with { type: 'json' };
import enemiesJson from '../data/enemies.json' with { type: 'json' };
import progressionJson from '../data/progression.json' with { type: 'json' };
import itemsJson from '../data/items.json' with { type: 'json' };
import abilitiesJson from '../data/abilities.json' with { type: 'json' };
import gearJson from '../data/gear.json' with { type: 'json' };
import surprisesJson from '../data/surprises.json' with { type: 'json' };
import townsJson from '../data/towns.json' with { type: 'json' };
import arenaJson from '../data/arena.json' with { type: 'json' };
import rumoursJson from '../data/rumours.json' with { type: 'json' };
import secretsJson from '../data/secrets.json' with { type: 'json' };
import dungeonsJson from '../data/dungeons.json' with { type: 'json' };
import themesJson from '../data/themes.json' with { type: 'json' };
import uniquesJson from '../data/uniques.json' with { type: 'json' };
import trinketsJson from '../data/trinkets.json' with { type: 'json' };
import questsJson from '../data/quests.json' with { type: 'json' };
import shapesJson from '../data/shapes.json' with { type: 'json' };
import eventsJson from '../data/events.json' with { type: 'json' };
import setsJson from '../data/sets.json' with { type: 'json' };
import encountersJson from '../data/encounters.json' with { type: 'json' };
import tracesJson from '../data/traces.json' with { type: 'json' };
import dreamJson from '../data/dream.json' with { type: 'json' };
import type { World, WorldHub, WorldRoad } from './world.ts';
import type { AffixKind, ClassId, EnemyData, EnemyMove, PowerKind, Rarity, Slot, SpaceKind, GearStat, GearLine, Affix  } from './types.ts';

export interface ClassData {
  name: string;
  /** One line on how it plays, shown when choosing. */
  style: string;
  /** A longer line on it, for the skill board. */
  about: string;
  /** What it is, in a sentence: its card on the character screen. */
  tagline: string;
  /** How it plays and who it suits: the panel on the character screen. */
  story: string;
  /** Three talents of each tree, by tree: the examples in that panel. */
  showcase: Record<string, string[]>;
  hp: number;
  mana: number;
  attack: number;
  defense: number;
  gold: number;
  /** The class's own crit chance and dodge chance, in place of or on top of the base; left out, the base and none. */
  crit?: number;
  dodge?: number;
  /** What a level brings. */
  growth: { hp: number; mana: number; attack: number; defense: number; magic?: number };
  /** Magic from the start (the Magician). */
  magic?: number;
  /** Always-on rules of the class. */
  traits?: ClassTraits;
  /** The abilities of the class, whatever its path. */
  core: string[];
  /** Its three trees, to specialize down. */
  trees: Record<string, ClassTree>;
  /** The abilities known from the start, at rank 1. */
  kit: string[];
  /** The enemy does not strike back in the first round (the Archer). */
  firstStrike?: boolean;
  /** The class's meter: its name, what fills it (hurt: blows taken; hit: hits landed; round: every round; miss: blows
   * that miss you and crits), and a line on it. */
  meter?: { name: string; gain: 'block' | 'hit' | 'round' | 'miss'; text: string };
}

/** A way to specialize (Robin, 2026-11-02): an ability, an always-on rule, an ability, a signature ability, each opening the next. */
export interface ClassTree {
  /** Eight tiers, each a row of talents. */
  tiers: string[][];
  name: string;
  text: string;
  nodes: string[];
}

/** The always-on rules a class or a path can have; left out, none. */
export interface ClassTraits {
  /** Damage dealt and taken, times this. */
  damageDealt?: number;
  damageTaken?: number;
  defenseMult?: number;
  hpMult?: number;
  /** Shares of damage sent back, and added chances. */
  thorns?: number;
  dodge?: number;
  crit?: number;
  firstStrike?: boolean;
  /** Attack strikes this many times, for its share of the damage each. */
  attackHits?: number;
  /** Each hit adds this to the crit chance, until a crit. */
  critStreak?: number;
  /** Block pays this share of a blow in mana instead of halving it (no class has it since 2026-11-03). */
  shieldMana?: number;
  /** Block is an Arcane Ward: the same stop as a shield, said as a ward (the Magician, Robin, 2026-11-03). */
  ward?: boolean;
  /** Brace is Channel: this share of the mana comes back (Robin, 2026-11-03: "Like 50%"). */
  channel?: number;
  /** A Block heals this share of max HP. */
  blockHeal?: number;
  /** Plain attacks use magic too. */
  plainMagic?: boolean;
  /** Plain attacks use this share of magic: a Magician's staff. */
  attackMagic?: number;
  spellPower?: number;
  healPower?: number;
  poisonPower?: number;
  potionPower?: number;
  /** A chance to shoot back when struck or missed, under any guard, and how many arrows a counter is. */
  counterChance?: number;
  counterHits?: number;
  /** A counter's power, instead of the guard's. */
  counterPower?: number;
  companionPower?: number;
  /** After a dodge, the next hit is a sure crit. */
  dodgeCrit?: boolean;
  /** An enemy caught in a tripwire takes this times your attack. */
  trapHit?: number;
  /** Healing past full becomes a barrier, this share of it. */
  healOverflow?: number;
  /** Only bows may be worn. */
  rangedOnly?: boolean;
  // The talents' passives (Robin, 2026-11-02).
  attackMult?: number;
  manaMult?: number;
  critPower?: number;
  meterStart?: number;
  barrierStart?: number;
  hpRegen?: number;
  /** The new Rogue (Robin, 2026-11-03): drops of blood a blade can hold; a finale's bleed a drop; heal a drop spent; poison and bleed sting twice; a finale's crit a point of Mischief; a finale's burst of poison a point. */
  blood?: number;
  bloodFinale?: number;
  redMist?: number;
  blackBlood?: boolean;
  shadowFinale?: number;
  venomFinale?: number;
  /** With a great weapon, this share of the damage dealt heals you (Bloodlust). */
  greatLifesteal?: number;
  /** Once a fight, under a third of HP, this share of it back (Second Wind). */
  secondWind?: number;
  /** Trinkets (Robin, 2026-11-03): HP back after a fight won out in the world, not the Arena. */
  wildHeal?: number;
  /** Attack strikes twice as many times, each at half the damage. */
  twinStrikes?: boolean;
  /** A roll may be walked this many steps fewer or more. */
  stride?: number;
  /** The chance an Attack calls down lightning. */
  lightning?: number;
  /** Night makes the wild no stronger against you. */
  nightOwl?: boolean;
  /** The Dream's trinkets: Dreamdust found, times this; a share of the run's gold kept when you fall there. */
  dreamDust?: number;
  lucid?: number;
  manaRegen?: number;
  winHeal?: number;
  winMana?: number;
  critHeal?: number;
  critMana?: number;
  dodgeHeal?: number;
  blockPower?: number;
  lowHpDamage?: number;
  lowHpTaken?: number;
  highHpDamage?: number;
  executeDamage?: number;
  firstRoundDamage?: number;
  burningDamage?: number;
  poisonedDamage?: number;
  weakenedDamage?: number;
  stunnedDamage?: number;
  burnPower?: number;
}

/** One rank of an ability: what it does. Fields left out do nothing. */
export interface AbilityRank {
  power?: number;
  hits?: number;
  crit?: number;
  stun?: number;
  attackUp?: { rounds: number; mult: number };
  /** Spells hit harder for a few rounds (Magic Power, Robin, 2026-11-03). */
  spellUp?: { rounds: number; mult: number };
  weaken?: { rounds: number; mult: number };
  poison?: { rounds: number; power: number };
  barrier?: number;
  evade?: number;
  /** Execute: `executePower` instead of `power` while the enemy is under `executeBelow` of its HP. */
  executeBelow?: number;
  executePower?: number;
  /** Heal a share of max HP. */
  healShare?: number;
  /** A barrier worth a share of max HP, or worth `barrierPerMana` for every point of mana, all of it spent. */
  barrierShare?: number;
  barrierPerMana?: number;
  /** The next hits are sure crits. */
  sureCrit?: number;
  /** Gold lifted: a share of the enemy's purse. */
  steal?: number;
  /** Power added for each meter point spent (with `meterAll`). */
  perMeter?: number;
  /** More for each drop of blood on the blade, which the move spends (Robin, 2026-11-03). */
  perBlood?: number;
  spendBlood?: boolean;
  /** Harder on a poisoned foe. */
  vsPoisoned?: number;
  /** Opens a bleed: this share of attack a round, more a drop of blood. */
  bleed?: { rounds: number; power: number; perBlood?: number };
  /** Enemy turns lost, nothing resists it. */
  skip?: number;
  /** Rounds until the spell lands with `power`. */
  windup?: number;
  /** Enemy wind-ups that will fail. */
  trap?: number;
  companion?: { rounds: number; power: number; hits?: number };
  mark?: { hits: number; mult: number };
  /** Heal a share of the damage this hit dealt. */
  healDealt?: number;
  /** Lose a share of max HP, never the last point. */
  selfHurt?: number;
  meterGain?: number;
  /** Mana back for each meter point spent, and the next spell this much harder. */
  manaPerMeter?: number;
  nextSpell?: number;
  cure?: boolean;
  /** The enemy takes this much more for a while. */
  sunder?: { rounds: number; mult: number };
  burn?: { rounds: number; power: number };
  /** This much harder on a burning foe, or while dancing in shadow. */
  burnBonus?: number;
  danceBonus?: number;
  regen?: { rounds: number; share: number };
  infuse?: { kind: 'ice' | 'storm'; rounds: number; power: number; mult?: number; chance?: number };
  /** Hits share out the power, and count as melee for an infusion. */
  split?: boolean;
  melee?: boolean;
  ignoreDefense?: boolean;
  /** Attack added as a share of defense, as power. */
  defensePower?: number;
  flee?: boolean;
  dance?: { rounds: number; chance: number };
  coat?: { hits: number; power: number; rounds: number };
  blockUp?: { rounds: number; mult: number };
  thornsUp?: { rounds: number; share: number };
  counterUp?: { rounds: number; chance: number };
  spike?: { rounds: number; power: number };
  /** Power for each point of meter held, not spent. */
  perHeldMeter?: number;
  /** Power at full mana, less as it runs out. */
  manaPower?: number;
  /** Power times 1 + this times the share of HP missing. */
  missingPower?: number;
  /** This much harder on a foe winding up, or with the blade infused. */
  windupBonus?: number;
  infuseBonus?: number;
  /** Power as a share of all healed this fight, against attack. */
  healedPower?: number;
  /** Breaks a wind-up the enemy has gathered. */
  interrupt?: boolean;
  /** All of a poison or a burn lands now, times this. */
  consume?: { kind: 'burn' | 'poison'; mult: number };
  /** The next blow that would fell you leaves you with this share of HP. */
  guardian?: number;
  /** For a few rounds each attack strikes again at this power. */
  clone?: { rounds: number; power: number };
}

/** A weapon's or an off-hand's type, from gear.json (Robin, 2026-11-03). */
export interface KindData {
  name: string;
  hands?: number;
  /** Two hands, yet the off-hand stays worn (a bow). */
  keepsOffhand?: boolean;
  stat: GearStat;
  mult: number;
  extra?: { stat: GearStat; mult: number };
  crit?: number;
  price?: number;
  block?: number;
  dodge?: number;
  mana?: number;
  mirror?: number;
  brace?: number;
  classes: ClassId[];
}

export interface AbilityData {
  name: string;
  classId: ClassId;
  text: string;
  mana: number;
  /** The level it can be learned from. */
  level: number;
  /** A tree's always-on rule, not a move: no button, never carried. */
  rule?: ClassTraits;
  /** Meter needed and spent; or all of it, with `perMeter` on the rank. */
  meter?: number;
  meterAll?: boolean;
  oncePerFight?: boolean;
  /** What must be held to use it: a weapon kind, `shield` or `blade`; any one will do (Robin, 2026-11-03). */
  needs?: string[];
  ranks: AbilityRank[];
}

/** A unique (uniques.json): a named piece with a power the rules read. */
export interface UniqueData {
  name: string;
  slot: Slot;
  /** The earliest tier whose bosses carry it. */
  tier: number;
  /** A power the rules read by name; or `traits`, the same words talents use. */
  power?: PowerKind;
  value?: number;
  traits?: Partial<ClassTraits>;
  text: string;
  /** A legendary weapon (Robin, 2026-11-02): rarer than a unique, for one class, with art of its own. */
  legend?: boolean;
  classId?: ClassId;
  art?: string;
  /** What it is, in words: a bow, a great axe. */
  kind?: string;
  /** Won only from this land's Arena on Legend (Robin, 2026-11-03); never dropped. */
  arena?: string;
  /** What its number adds to, when not the slot's own. */
  stat?: GearStat;
  affix?: Affix;
}

/** A set of gear (Robin, 2026-11-02): wear 2 for one bonus, 4 for the other. */
export interface SetData {
  name: string;
  /** What its pieces are called: "Warden's Hat". */
  word: string;
  /** The lowest land tier it drops in. */
  tier: number;
  line: GearLine;
  slots: Slot[];
  bonuses: Record<string, { traits: Partial<ClassTraits>; text: string }>;
}

/** A kind of spot and what landing on it does; the hint the player sees when touching one. */
export interface SpaceKindData {
  label: string;
  letter: string;
  hint: string;
  /** How long the spot gives nothing after it gave, in ms. */
  cooldownMs?: number;
}

/** A thing to carry: a potion (a share of max HP or mana), or a dice card that changes a pending roll. */
export interface ItemData {
  name: string;
  text: string;
  price: number;
  /** The area tier a flask belongs to: shops sell their own tier's and the one before. */
  tier: number;
  stock: ('arms' | 'magic' | 'town' | 'dream')[];
  /** A flask: a set amount (Robin, 2026-11-02: "so that you need better potions later"). */
  heal?: number;
  mana?: number;
  elixir?: { kind: 'vigor' | 'arcana'; value: number; fights: number };
  cure?: boolean;
  dice?: 'reroll' | 'plus' | 'minus' | 'exact';
}

/** The towns' errands: how many are carried, how long a town waits before asking again, and the kinds with their numbers. */
export interface QuestsData {
  maxActive: number;
  offered: number;
  remembered: number;
  /** A quest's chest skips this many of the lowest rarities. */
  chestBoost: number;
  kinds: Record<'kill' | 'loot' | 'mini' | 'find', { weight: number; text: string; count: [number, number]; gold: number; xp: number; unique: number; dropChance?: number; spawnChance?: number; foundChance?: number }>;
  people: string[];
}

export interface LineSlot {
  base: string;
  stat: GearStat;
  perRank: number[];
  /** A second number on the piece. */
  extra?: { stat: GearStat; perRank: number[] };
  /** A bonus every piece of it carries, even plain: leather's crits. */
  affix?: { kind: AffixKind; perRank: number[] };
}

export interface GearData {
  /** A shop's stall (Robin, 2026-11-03). */
  stall: StallData;
  /** The rank names by tier, from 1; beyond the names a rank is "Rank n". */
  ranks: string[];
  /** How much each rank beyond the tables multiplies the last table entry's number and price. */
  rankGrowth: number;
  priceGrowth: number;
  slots: Record<Slot, { base: string; stat: GearStat; perRank: number[]; price: number[] }>;
  /** The chance a found piece takes one of its ground's two slots. */
  groundDrop: number;
  /** The kinds of gear; heavy reads `slots`, the others their own numbers at the same prices times `priceMult`. */
  lines: Record<GearLine, { weight: number; words: string[]; weaponByClass?: Record<ClassId, string>; firstWeapon?: string; priceMult?: number; slots?: Record<Slot, LineSlot> }>;
  rarities: Record<Rarity, { mult: number; weight: number; priceMult: number; affixes: number; named: boolean; prefix: boolean }>;
  /** The spread of a roll round the rank's number, as a share. */
  roll: number;
  affixes: Record<AffixKind, { suffix: string; text: string; slots: Slot[]; base: number; step: number; max: number; flat?: boolean; stat?: GearStat }>;
  prefixes: { word: string; stat: GearStat; perRank: number; slots: Slot[] }[];
  names: Record<Slot, string[]>;
  dropChance: Record<'mob' | 'mini' | 'boss', number>;
  rarityBoost: Record<'mob' | 'mini' | 'boss', number>;
  /** The chance a fallen creature's drop is a unique of its tier. */
  uniqueChance: Record<'mob' | 'mini' | 'boss', number>;
  setChance: Record<'mob' | 'mini' | 'boss' | 'chest', number>;
  legendChance: Record<'mob' | 'mini' | 'boss' | 'chest', number>;
  kinds: {
    shieldInWard: number;
    weapon: Record<string, KindData>;
    offhand: Record<string, KindData>;
    bare: { block: number; dodge: number };
    qualityStep: number;
    rankStep: number;
    ownShare: number;
    orbWords: string[];
    firstKinds: Partial<Record<ClassId, string[]>>;
    shop: { shields: Record<string, string>; orbs: Record<string, string> };
  };
  consumableDrop: { potion: number; card: number };
  sellShare: number;
  /** How many pieces the bag carries; one more asks to be sold or left. */
  bagLimit: number;
}

/** What the generator draws from to grow an area: its theme's names and creatures, the shapes of creatures, the cell grid. */
export interface ThemesData {
  order: string[];
  themes: Record<string, { areas: string[]; adjectives: string[]; mobs: string[]; mini: string; boss: string; kingdom?: string }>;
  places: Record<string, string[]>;
  archetypes: { hp: number; attack: number; defense: number; moves: EnemyMove[] }[];
  /** A grown boss's second phase by theme: the line (with {boss}) and the move it adds. */
  rage: Record<string, { text: string; move: EnemyMove }>;
  base: Record<'mob' | 'mini' | 'boss', { hp: number; attack: number; defense: number; xp: number; gold: number }>;
  perTier: { hp: number; attack: number; defense: number; reward: number };
  cell: { width: number; height: number; firstColumn: number };
}

export interface ProgressionData {
  /** The most a crit chance can be, a sure crit aside (Robin, 2026-11-03: crit capped at 60%). */
  critCap: number;
  /** Day and night in die rolls (Robin, 2026-11-03). */
  dayNight: { dayRolls: number; nightRolls: number; enemyMult: number; rewardMult: number };
  /** Total xp needed to be at level n + 1, by index; the last entry is the top level. */
  xpForLevel: number[];
  baseCrit: number;
  critPower: number;
  fleeChance: number;
  /** The share of gold lost on death. */
  deathGoldLoss: number;
  /** What a charge multiplies the next hit by, for the player and for an enemy's wind-up. */
  charge: number;
  enemyCharge: number;
  manaPerRound: number;
  lootRoll: { need: number };
  /** The coach between towns: gold for each tier of where you are going. */
  travel: { perTier: number };
  guards: { block: number; dodge: number; brace: number; braceMana: number; braceManaShare: number; counter: number; blockFloor: number };
  chest: { gold: [number, number]; gearChance: number; consumableChance: number };
  gamble: { stakePerTier: number };
  spawns: { cap: number; chancePerTick: number; lifeMs: number; miniboss: number; elite: number };
  homeWaitMs: number;
  softcap: { below: number; floor: number; above: number; aboveMax: number; outgrownLand: number };
  wanderer: { chancePerTick: number; lifeMs: number; moveChance: number; levelsOver: number; hp: number; attack: number; defense: number; xp: number; gold: number };
  /** The world boss (mine, 2026-11-01): how often a tick brings one when none is about, how long it stays, its HP against the area's boss, the least share a hitter gets. */
  link: { codeSeconds: number; linkMinutes: number };
  worldBoss: { chancePerTick: number; lifeMs: number; hpMult: number; minShare: number };
  /** The notes left on spots: how many a spot keeps, how long one lasts. */
  traces: { perSpace: number; lifeMs: number };
  /** The class meters' cap. */
  meterMax: number;
  /** The levels at which a character picks one ability in two. */
  /** The trainers' prices a tier: to learn an ability, and a rank (times the rank). */
}

/** The world the game plays on: areas, hubs and roads; `buildBoard` lays the spots. */
export const WORLD_DATA = worldJson as unknown as World;
export const DICE_DATA: { sides: number } = diceJson;
export const CLASS_DATA = classesJson as Record<ClassId, ClassData>;
export const ABILITIES = abilitiesJson as Record<string, AbilityData>;
export const SPACE_KIND_DATA = spacesJson as Record<SpaceKind, SpaceKindData>;
export const ENEMIES = enemiesJson as Record<string, EnemyData>;
export const PROGRESSION = progressionJson as unknown as ProgressionData;
export const ITEMS = itemsJson as Record<string, ItemData>;
/** A shop's stall (Robin, 2026-11-03). */
export interface StallData {
  size: number;
  common: number;
  uncommon: number;
  lean: Partial<Record<string, Partial<Record<Slot, number>>>>;
}
export const GEAR = gearJson as GearData;
/** The notes a player may leave on a spot (mine, 2026-11-01: set lines, so nothing needs moderating). */
export const TRACES: readonly string[] = (tracesJson as { texts: string[] }).texts;
/** The odds of what a normal spot holds, as weights. */
export const SURPRISES = surprisesJson as Record<'fight' | 'chest' | 'merchant' | 'gamble' | 'miniboss' | 'event' | 'find' | 'stranger', number>;
/** By theme: more that can happen on a plain spot, and the rare finds worth a roll. */
export const ENCOUNTERS = encountersJson as unknown as Record<string, { events: { text: string; kind: 'heal' | 'hurt' | 'gold' | 'mana' | 'flask' | 'card'; value: number }[]; finds: { text: string; slot: Slot; need: number }[] }>;
/** More shapes for the generator, laid inside one cell. */
export const SHAPES = (shapesJson as unknown as { shapes: { id: string; hubs: WorldHub[]; roads: WorldRoad[] }[] }).shapes;
/** What a wild spot does now and then besides a fight, by theme. */
export interface ThemeEvent {
  text: string;
  kind: 'heal' | 'hurt' | 'gold' | 'mana' | 'flask' | 'card';
  value: number;
}
const { _about: _eventsAbout, ...eventEntries } = eventsJson as unknown as { _about: string } & Record<string, ThemeEvent>;
export const EVENTS = eventEntries as Record<string, ThemeEvent>;
export const THEMES = themesJson as ThemesData;
const { _about: _uniquesAbout, ...uniqueEntries } = uniquesJson as unknown as { _about: string } & Record<string, UniqueData>;
export const UNIQUES = uniqueEntries as Record<string, UniqueData>;
export const UNIQUE_IDS = Object.keys(UNIQUES);

/** A trinket (Robin, 2026-11-03): a passive of its own, in or out of a fight, and nothing else. */
export interface TrinketData {
  name: string;
  /** The land's tier where it starts to be found. */
  tier: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  power?: PowerKind;
  value?: number;
  traits?: Partial<ClassTraits>;
  affixes?: Affix[];
  text: string;
  /** What Mitch, AD's icon shows. */
  look: string;
  /** Only the Dream's merchant sells it, for this much Dreamdust; never found (Robin, 2026-11-03). */
  dream?: boolean;
  dust?: number;
}
export const TRINKET_DATA = trinketsJson as unknown as {
  price: { base: number; rarity: Record<string, number> };
  nearTiers: number;
  nearWeight: number;
  lightning: { power: number; stun: number };
  trinkets: Record<string, TrinketData>;
};
export const TRINKETS = TRINKET_DATA.trinkets;
export const TRINKET_IDS = Object.keys(TRINKETS);
const { _about: _setsAbout, ...setEntries } = setsJson as unknown as Record<string, unknown>;
export const SETS = setEntries as Record<string, SetData>;
export const SET_IDS = Object.keys(SETS);
const { _about: _questsAbout, ...questEntries } = questsJson as unknown as { _about: string } & QuestsData;
export const QUESTS = questEntries as QuestsData;

export const SPACE_KINDS = Object.keys(SPACE_KIND_DATA) as SpaceKind[];
export const CLASS_IDS = Object.keys(CLASS_DATA) as ClassId[];
export const ITEM_IDS = Object.keys(ITEMS);

/** What a town offers besides its rest (Robin, 2026-11-02). */
export interface TownKind {
  name: string;
  line: string;
  flasks?: number;
  cards?: number;
  rank?: number;
}
export const TOWNS = townsJson as unknown as { kinds: Record<string, TownKind>; towns: Record<string, string> };
/** The town's kind: from the list, or from its id, for towns the generator lays. */
export function townKind(id: string): TownKind {
  const kinds = Object.keys(TOWNS.kinds).sort();
  const named = TOWNS.towns[id];
  const key = named ?? kinds[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % kinds.length]!;
  return TOWNS.kinds[key]!;
}

/** The Arena's numbers (Robin, 2026-11-02). */
export type ArenaMode = 'normal' | 'hard' | 'nightmare' | 'legend';
export const ARENA = arenaJson as unknown as {
  spots: Record<string, string>;
  fee: number[];
  waves: { rounds: number; hit: number; pay: number; mini?: boolean }[];
  modes: Record<ArenaMode, { name: string; words: string; hp: number; hit: number; fee: number; gold: number; xpShare: number; midGear: 'mini' | 'boss'; clearGear: 'mini' | 'boss'; rankUp: number; feeTier?: number; seals?: boolean }>;
  /** The rank an Arena legend is made at: level 30 and past it (Robin, 2026-11-03: "max level (30) so really good"). */
  legendRank: number;
  gearFrom: number;
  wornShare: number;
  /** Flasks a run may drink: what stops a bag of them buying the hard ways. */
  flasks: number;
  /** How much harder each level past 4 makes a wave: a fighter's abilities outgrow plain numbers. */
  levelStep: number;
  /** A class the sim finds well ahead here. */
  classes: Record<string, { hp?: number; hit?: number; top?: { hp: number; hit: number } }>;
  outgrown: { levelsOver: number; xp: number };
};

/** The dungeons, off the map (Robin, 2026-11-02). */
export const DUNGEONS = Object.fromEntries(Object.entries(dungeonsJson).filter(([k]) => k !== '_about')) as unknown as Record<string, { outside: { spot: string; name: string; sealed?: boolean; needs?: string }; inside: string; area: import('./world.ts').WorldArea }>;

/** A foe's measure in the Dream: rounds of your Attacks it lasts, the share of your HP its blow takes, and what it pays. */
export interface DreamFoe {
  rounds: number;
  hit: number;
  xp: number;
  gold: number;
  dust: number;
}
/** A run's colour (Mitch, AD): the colour matrix laid over its board, its foes and the fight's backdrop, and a tint for its overlay and gear. */
export interface DreamPalette {
  id: string;
  name: string;
  hue: number;
  sat: number;
  bright: number;
  /** `#rrggbb`. */
  tint: string;
}
/** The Dream (Robin, 2026-11-03), `rules/data/dream.json`. */
export const DREAM = dreamJson as unknown as {
  isle: { area: string; gate: string; camp: string };
  needs: string;
  place: { x: number; y: number; width: number; height: number };
  layout: { hubs: number; step: number; wiggle: number; roadSpots: [number, number]; minis: number[]; springs: number[]; loops: number; loopSpots: number; loopReach: number; spurs: number; spurSpots: number; spurReach: number; chests: number; tries: number };
  themes: Record<string, { land: string; mobs: string[]; minis: string[]; bosses: string[]; places: string[]; palettes: string[] }>;
  palettes: DreamPalette[];
  words: string[];
  hubNames: string[];
  springName: string;
  hoardName: string;
  gateName: string;
  elements: Record<import('./types.ts').DreamElement, { word: string; prefix: string; trick: import('./types.ts').BossTrick }>;
  foes: Record<'mob' | 'mini' | 'boss', DreamFoe> & { perDepth: number; goldPerDepth: number; dustPerDepth: number; level: number };
  spots: { fight: number; event: number; drift: number; driftDust: [number, number]; chestDust: number };
  loot: { rankFrom: number; depthsPerRank: number };
  merchant: { piece: number; piecePerRank: number; palette: string; tint: string };
};

/** Rumours' numbers and words (Robin, 2026-11-02). */
export const RUMOURS = rumoursJson as unknown as { max: number; cooldownMs: number; minDistance: number; weights: Record<'stash' | 'beast' | 'secret', number>; beast: { hp: number; attack: number; xp: number; gold: number }; lines: Record<'stash' | 'beast' | 'secret', string[]> };

/** A hidden trail: spots off an anchor on the road, the last named. */
export interface SecretTrail {
  id: string;
  area: string;
  anchor: string;
  prop?: string;
  spots: { x: number; y: number; name?: string; kind?: string; mob?: string }[];
}
export const SECRETS = (secretsJson as unknown as { trails: SecretTrail[] }).trails;
