// The hunting grounds (Robin, 2026-11-02: "maps should have areas where the mobs are, like in mmos. So you go around areas to
// hunt certain mobs or to get certain drops"). An area is cut into grounds round named spots: on a ground its own creature
// is the one you mostly meet, it carries that creature's trophy for a quest, and the gear found there leans to two slots.
// The hand-laid areas name theirs in world.json; a grown area's are made from its spots and creatures. Pure.

import { ENEMIES, GEAR } from './data.ts';
import type { Rng } from './rng.ts';
import { SLOTS, type Board, type Ground, type GearLine, type Slot, type Space } from './types.ts';

const memo = new WeakMap<object, Ground[]>();

/** The grounds of an area; an area with no named spot or creature has none. */
export function groundsOf(board: Board, areaId: string): Ground[] {
  const area = board.areas[areaId];
  if (!area) return [];
  if (area.grounds?.length) return area.grounds;
  const known = memo.get(area);
  if (known) return known;
  const spots = Object.values(board.spaces)
    .filter((s) => s.area === areaId && s.name && s.kind !== 'boss')
    .sort((a, b) => a.id.localeCompare(b.id));
  const made: Ground[] = spots.length
    ? area.mobs.map((mob, i) => {
        const hub = spots[Math.floor((i * spots.length) / area.mobs.length)]!;
        const name = (ENEMIES[mob] ?? board.bestiary?.[mob])?.name ?? mob;
        return { id: `${areaId}-${i}`, name: `${name} Grounds`, hub: hub.id, mob, trophy: `${name} Trophy`, drops: [SLOTS[(i * 2) % SLOTS.length]!, SLOTS[(i * 2 + 1) % SLOTS.length]!] };
      })
    : [];
  memo.set(area, made);
  return made;
}

/** The drawn place a spot stands in, if any. */
export function placeAt(board: Board, space: Space): string | null {
  for (const place of board.areas[space.area]?.places ?? []) {
    let inside = false;
    const s = place.shape;
    for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
      const [xi, yi] = s[i]!;
      const [xj, yj] = s[j]!;
      if (yi > space.y !== yj > space.y && space.x < ((xj - xi) * (space.y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return place.id;
  }
  return null;
}

/** A spot inside a town's walls: a place, but no ground. Nothing hunts there. */
export function inTownWalls(board: Board, space: Space): boolean {
  const place = placeAt(board, space);
  return !!place && !groundsOf(board, space.area).some((g) => g.id === place);
}

/** The ground a spot lies in: the one it stands in, else the one whose named spot is nearest. */
export function groundAt(board: Board, space: Space): Ground | null {
  const place = placeAt(board, space);
  const own = place ? groundsOf(board, space.area).find((g) => g.id === place) : undefined;
  if (own) return own;
  let best: Ground | null = null;
  let distance = Infinity;
  for (const g of groundsOf(board, space.area)) {
    const hub = board.spaces[g.hub];
    if (!hub) continue;
    const d = Math.hypot(hub.x - space.x, hub.y - space.y);
    if (d < distance) {
      distance = d;
      best = g;
    }
  }
  return best;
}

/** The slot a piece found on this ground takes: mostly the ground's two. One or two numbers from the stream. */
export function dropSlot(ground: Ground | null, rng: Rng): Slot {
  if (ground?.drops.length && rng.next() < GEAR.groundDrop) return ground.drops[rng.int(ground.drops.length) - 1]!;
  return SLOTS[rng.int(SLOTS.length) - 1]!;
}

/** Which kind of gear a found piece is. One number from the stream. */
export function rollLine(rng: Rng): GearLine {
  const lines = Object.keys(GEAR.lines) as GearLine[];
  const total = lines.reduce((sum, l) => sum + GEAR.lines[l].weight, 0);
  let pick = rng.next() * total;
  for (const l of lines) {
    pick -= GEAR.lines[l].weight;
    if (pick < 0) return l;
  }
  return 'heavy';
}
