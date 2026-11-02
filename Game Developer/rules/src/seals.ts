// The Seals (Robin, 2026-11-02): "the long term goal would be to beat the biggest boss in each zone... when those are dead, you open up the final dungeon somewhere under the hub city".
// One Seal for each land's greatest boss, won the first time it falls: read from what you have beaten, so a character who beat them before Seals existed already holds them. A gate's
// mini-boss and a dungeon's boss give none. Pure.

import { ENEMIES } from './data.ts';
import type { Board, Character } from './types.ts';

/** The lands with a Seal that are not in the world yet (Mitch, AD, 2026-11-02): off this list as each is laid. */
export const SEALS_COMING: readonly { land: string; name: string; levels: [number, number] }[] = [
  { land: 'giantsland', name: 'The Giants’ Land', levels: [24, 28] },
];

export interface Seal {
  land: string;
  landName: string;
  levels: [number, number];
  /** The boss's spot, and who stands there. */
  space: string;
  boss: string;
  bossName: string;
  won: boolean;
  /** Whether you can walk there yet. */
  open: boolean;
}

/** The land a boss on this spot holds a Seal for, or null. */
export function sealAt(board: Board, spaceId: string): string | null {
  const space = board.spaces[spaceId];
  const area = space ? board.areas[space.area] : undefined;
  if (!space || !area || !space.boss || space.kind !== 'boss' || area.dungeon || area.city) return null;
  return (board.bestiary[space.boss] ?? ENEMIES[space.boss])?.role === 'boss' ? area.id : null;
}

/** Every Seal there is, easiest land first. */
export function sealsOf(board: Board, c: Character): Seal[] {
  const out: Seal[] = [];
  for (const space of Object.values(board.spaces)) {
    const land = sealAt(board, space.id);
    if (!land) continue;
    const area = board.areas[land]!;
    out.push({
      land,
      landName: area.name,
      levels: area.levels,
      space: space.id,
      boss: space.boss!,
      bossName: (board.bestiary[space.boss!] ?? ENEMIES[space.boss!])?.name ?? space.boss!,
      won: (c.bossKills[space.id] ?? 0) > 0,
      open: c.opened.includes(land),
    });
  }
  return out.sort((a, b) => a.levels[0] - b.levels[0] || a.land.localeCompare(b.land));
}

/** How many you hold, of how many. */
export function sealCount(board: Board, c: Character): { won: number; total: number } {
  const all = sealsOf(board, c);
  return { won: all.filter((s) => s.won).length, total: all.length };
}
