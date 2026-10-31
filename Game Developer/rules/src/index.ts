// The rules package: the game as a pure function. Import from here, never from the files inside.
export * from './types.ts';
export { makeRng, resumeRng, hashSeed, type Rng } from './rng.ts';
export { BOARD_DATA, CLASS_DATA, DICE_DATA, SPACE_KIND_DATA, SPACE_KINDS, CLASS_IDS } from './data.ts';
export type { BoardData, ClassData, SpaceKindData } from './data.ts';
export { legalPaths, checkPath, type PathProblem } from './paths.ts';
export { newGame, apply, makeBoard, makeCharacter, type NewGameOptions } from './game.ts';
export { migrate } from './save.ts';
