// The rules package: the game as a pure function. Import from here, never from the files inside.
export * from './types.ts';
export { makeRng, resumeRng, hashSeed, type Rng } from './rng.ts';
export { ISLAND_DATA, CLASS_DATA, DICE_DATA, SPACE_KIND_DATA, EVENT_CARDS, SPACE_KINDS, CLASS_IDS } from './data.ts';
export type { ClassData, SpaceKindData, EventCardData } from './data.ts';
export { buildBoard, roadSpaceId, KIND_LETTERS, type Island, type IslandHub, type IslandRoad } from './island.ts';
export { legalPaths, reachable, checkPath, type PathProblem, type Reach } from './paths.ts';
export { newGame, apply, makeBoard, makeCharacter, type NewGameOptions } from './game.ts';
export { migrate } from './save.ts';
