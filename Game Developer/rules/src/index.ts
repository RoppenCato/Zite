// The rules package: the game as a pure function. Import from here, never from the files inside.
export * from './types.ts';
export { makeRng, resumeRng, hashSeed, type Rng } from './rng.ts';
export { WORLD_DATA, CLASS_DATA, ABILITIES, DICE_DATA, SPACE_KIND_DATA, ENEMIES, PROGRESSION, ITEMS, ITEM_IDS, GEAR, SURPRISES, SPACE_KINDS, CLASS_IDS } from './data.ts';
export type { ClassData, AbilityData, AbilityRank, SpaceKindData, EnemyData, ProgressionData, ItemData, GearData } from './data.ts';
export { buildBoard, roadSpaceId, KIND_LETTERS, type World, type WorldArea, type WorldHub, type WorldRoad } from './world.ts';
export { legalPaths, reachable, checkPath, nearestTown, type PathProblem, type Reach } from './paths.ts';
export { stats, plainGear, rollGear, rollRarity, rankName, describeGear, type Stats } from './gear.ts';
export { levelFor, sellPrice } from './common.ts';
export { makeEnemy } from './fight.ts';
export { hintFor, countdown } from './hints.ts';
export { newGame, apply, makeBoard, makeCharacter, type NewGameOptions } from './game.ts';
export { migrate } from './save.ts';
