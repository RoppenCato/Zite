// The first minutes (mine, 2026-11-01, from Robin's list): a few lines in order, each said once and remembered in
// localStorage, so the first roll, the first choice, the first fight and the first win explain themselves and a reload
// does not nag. `take(key)` gives the line the first time and null after.

const KEY = 'boardworld.tips';

export const TIPS = {
  start: 'Welcome to Zite. Tap Roll to move; tap any spot to hear about it. Towns rest you. A quest board on the map has work for you.',
  choice: 'More than one place to go: the lit spots are where this roll can end. Tap one.',
  fight: 'A fight: pick a move, then how you take the blow. The orange line under the enemy says what it does next: Block a wind-up, Dodge a poison.',
  won: 'Won: the gold and xp are yours. A Health Potion heals 50 HP; Hero shows what you carry; each level brings a skill point for abilities.',
  rested: 'A town rests you: HP and mana full. From now on it only says so when there was something to heal.',
  boss: 'A boss stands on the big dark red spot: land exactly on it to fight it. Too hard now? Level up in the wilds and buy the area\'s gear first.',
} as const;

export type TipKey = keyof typeof TIPS;

export class Tips {
  private shown: Set<string>;
  private readonly storage: Storage | null;

  constructor(storage: Storage | null) {
    this.storage = storage;
    let shown: string[] = [];
    try {
      shown = JSON.parse(storage?.getItem(KEY) ?? '[]') as string[];
    } catch {
      shown = [];
    }
    this.shown = new Set(shown);
  }

  /** The tip's line the first time it is asked for, null after. */
  take(key: TipKey): string | null {
    if (this.shown.has(key)) return null;
    this.shown.add(key);
    try {
      this.storage?.setItem(KEY, JSON.stringify([...this.shown]));
    } catch {
      // Storage full or blocked: the tip is simply said again next time.
    }
    return TIPS[key];
  }

  /** Forget them all (the game's reset). */
  clear(): void {
    this.shown.clear();
    try {
      this.storage?.removeItem(KEY);
    } catch {
      // nothing to do
    }
  }
}

export const tips = new Tips(typeof window === 'undefined' ? null : window.localStorage);
