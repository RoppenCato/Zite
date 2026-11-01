// The rules package: the game as a pure function. Import from here, never from the files inside.
export * from './types.ts';
export { makeRng, resumeRng, hashSeed, type Rng } from './rng.ts';
export { WORLD_DATA, CLASS_DATA, ABILITIES, DICE_DATA, SPACE_KIND_DATA, ENEMIES, PROGRESSION, ITEMS, ITEM_IDS, GEAR, SURPRISES, THEMES, UNIQUES, UNIQUE_IDS, QUESTS, SHAPES, EVENTS, SPACE_KINDS, CLASS_IDS } from './data.ts';
export type { ClassData, AbilityData, AbilityRank, SpaceKindData, ProgressionData, ItemData, GearData, ThemesData, UniqueData, QuestsData, ThemeEvent } from './data.ts';
export { buildBoard, addArea, addRoad, setBounds, checkOpens, roadSpaceId, KIND_LETTERS, GROWN, type World, type WorldArea, type WorldHub, type WorldRoad } from './world.ts';
export { peekArea, generateArea, growBoard, grownIndex, cellFor, entryName, GROWN_PREFIX, type AreaPeek, type GrownArea } from './generate.ts';
export { legalPaths, reachable, checkPath, nearestTown, type PathProblem, type Reach } from './paths.ts';
export { stats, powers, plainGear, rollGear, rollRarity, rankName, rankStat, rankPrice, describeGear, makeUnique, rollUnique, uniquePool, type Stats } from './gear.ts';
export { levelFor, sellPrice } from './common.ts';
export { makeEnemy, creature, startFight, freshFight, pickMove, intentEvent, pickOptions, offerPicks } from './fight.ts';
export { newQuest, questProgress, questLine } from './quests.ts';
export { hintFor, countdown } from './hints.ts';
export { newGame, newWorld, apply, makeBoard, makeCharacter, MAX_NAME, type NewGameOptions } from './game.ts';
export { diffState, mergeDelta, mergeDeltas, type Delta } from './delta.ts';
export { PROTOCOL_VERSION, MAX_FRAME, RATE, BATCH_MS, type WireAction, type ClientMessage, type ServerMessage } from './protocol.ts';
export { migrate } from './save.ts';
