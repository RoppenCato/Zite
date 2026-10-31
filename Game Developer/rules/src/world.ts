// The world: areas by tier, each a set of hubs (named spots at fixed positions) joined by roads (a spot every step,
// laid along a curve), and passage roads between areas that start at a boss. buildBoard turns that description into the
// Board the rules walk on. Pure and deterministic: the same world always gives the same board.

import type { Area, Board, Space, SpaceKind } from './types.ts';

/** A named spot at a fixed position: a town, a shrine, a fork, a boss on the board. */
export interface WorldHub {
  id: string;
  kind: SpaceKind;
  name: string;
  x: number;
  y: number;
  /** For a boss spot: the enemy, and the area beaten it opens (null when nothing lies beyond yet). */
  boss?: string;
  opens?: string | null;
}

/**
 * A road between two hubs with `kinds.length` plain spots between them, one letter per spot (see KIND_LETTERS).
 * `bow` curves it: the spots lie on a quadratic Bezier whose middle is `bow` pixels off the straight line, positive
 * away from the area's centre (so loops bulge outward); 0 is straight. `area` says which area the spots belong to;
 * left out, the `from` hub's.
 */
export interface WorldRoad {
  from: string;
  to: string;
  kinds: string;
  bow: number;
  area?: string;
}

export interface WorldArea {
  id: string;
  name: string;
  theme: string;
  tier: number;
  levels: [number, number];
  mobs: string[];
  miniBosses: string[];
  hubs: WorldHub[];
  roads: WorldRoad[];
}

export interface World {
  name: string;
  width: number;
  height: number;
  start: string;
  areas: WorldArea[];
  /** The passage roads between areas, from a boss hub into the next area. */
  roads: WorldRoad[];
}

/** One letter per kind of spot, for writing roads by hand: "nnptnn" is wilds, wilds, spring, chest, wilds, wilds. */
export const KIND_LETTERS: Record<string, SpaceKind> = {
  n: 'normal',
  t: 'chest',
  p: 'potion',
  h: 'spell',
  s: 'shop',
  g: 'boss',
  w: 'town',
};

const KNOWN_KINDS = new Set<string>(Object.values(KIND_LETTERS));
const AREA_MARGIN = 60;

/** The id of the n-th spot (from 1) on the road from `from` to `to`. */
export function roadSpaceId(from: string, to: string, n: number): string {
  return `${from}-${to}-${n}`;
}

/**
 * The board from a world. Road spots are named "" (the client shows the kind instead) and chained hub → 1 → 2 → … →
 * hub, linked both ways; a hub gains its links in road order, its own area's roads first, then the passage roads.
 * Throws a clear Error on an unknown hub, an unknown kind letter, a duplicate id, an unknown area, a boss spot with
 * no boss, or a start that is not a hub.
 */
export function buildBoard(world: World): Board {
  const spaces: Record<string, Space> = {};
  const areas: Record<string, Area> = {};
  const hubArea = new Map<string, string>();
  const add = (space: Space): void => {
    if (spaces[space.id]) throw new Error(`world ${world.name}: duplicate space id "${space.id}"`);
    spaces[space.id] = space;
  };

  for (const area of world.areas) {
    if (areas[area.id]) throw new Error(`world ${world.name}: duplicate area id "${area.id}"`);
    areas[area.id] = { id: area.id, name: area.name, theme: area.theme, tier: area.tier, levels: area.levels, mobs: area.mobs, miniBosses: area.miniBosses, bounds: { x: 0, y: 0, width: 0, height: 0 } };
    for (const hub of area.hubs) {
      if (!KNOWN_KINDS.has(hub.kind)) throw new Error(`world ${world.name}: hub "${hub.id}" has unknown kind "${hub.kind}"`);
      if (hub.kind === 'boss' && !hub.boss) throw new Error(`world ${world.name}: boss spot "${hub.id}" names no boss`);
      const space: Space = { id: hub.id, kind: hub.kind, name: hub.name, x: hub.x, y: hub.y, links: [], area: area.id };
      if (hub.kind === 'boss') {
        space.boss = hub.boss;
        space.opens = hub.opens ?? null;
      }
      add(space);
      hubArea.set(hub.id, area.id);
    }
  }
  if (!hubArea.has(world.start)) throw new Error(`world ${world.name}: start "${world.start}" is not a hub`);
  for (const space of Object.values(spaces)) {
    if (space.opens && !areas[space.opens]) throw new Error(`world ${world.name}: boss spot "${space.id}" opens unknown area "${space.opens}"`);
  }

  const centres = new Map<string, { x: number; y: number }>();
  for (const area of world.areas) {
    const xs = area.hubs.map((h) => h.x);
    const ys = area.hubs.map((h) => h.y);
    centres.set(area.id, { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 });
  }

  const link = (a: string, b: string): void => {
    spaces[a]!.links.push(b);
    spaces[b]!.links.push(a);
  };
  const lay = (road: WorldRoad, defaultArea: string): void => {
    const a = spaces[road.from];
    const b = spaces[road.to];
    if (!a || !hubArea.has(road.from)) throw new Error(`world ${world.name}: road ${road.from}-${road.to} starts at unknown hub "${road.from}"`);
    if (!b || !hubArea.has(road.to)) throw new Error(`world ${world.name}: road ${road.from}-${road.to} ends at unknown hub "${road.to}"`);
    const areaId = road.area ?? defaultArea;
    if (!areas[areaId]) throw new Error(`world ${world.name}: road ${road.from}-${road.to} lies in unknown area "${areaId}"`);
    const points = roadPoints(a, b, road.kinds.length, road.bow, centres.get(areaId)!);
    let previous = a.id;
    for (let n = 1; n <= road.kinds.length; n++) {
      const letter = road.kinds.charAt(n - 1);
      const kind = KIND_LETTERS[letter];
      if (!kind) throw new Error(`world ${world.name}: road ${road.from}-${road.to} has unknown kind letter "${letter}"`);
      if (kind === 'boss') throw new Error(`world ${world.name}: road ${road.from}-${road.to} puts a boss on a road; bosses are hubs`);
      const point = points[n - 1]!;
      const id = roadSpaceId(road.from, road.to, n);
      add({ id, kind, name: '', x: point.x, y: point.y, links: [], area: areaId });
      link(previous, id);
      previous = id;
    }
    link(previous, b.id);
  };
  for (const area of world.areas) for (const road of area.roads) lay(road, area.id);
  for (const road of world.roads) lay(road, hubArea.get(road.from) ?? '');

  // Each area's box, with a margin, from the spots it holds.
  for (const area of Object.values(areas)) {
    const own = Object.values(spaces).filter((s) => s.area === area.id);
    const xs = own.map((s) => s.x);
    const ys = own.map((s) => s.y);
    const x = Math.max(0, Math.min(...xs) - AREA_MARGIN);
    const y = Math.max(0, Math.min(...ys) - AREA_MARGIN);
    area.bounds = { x, y, width: Math.min(world.width, Math.max(...xs) + AREA_MARGIN) - x, height: Math.min(world.height, Math.max(...ys) + AREA_MARGIN) - y };
  }

  return { start: world.start, width: world.width, height: world.height, spaces, areas };
}

/**
 * `count` points evenly spaced in the parameter of a quadratic Bezier from `a` to `b`, whose middle lies `bow` pixels
 * off the straight line, away from `centre`. Rounded to whole pixels.
 */
function roadPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  count: number,
  bow: number,
  centre: { x: number; y: number },
): { x: number; y: number }[] {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  // The perpendicular, flipped so it points away from the centre of the area.
  let px = -dy / length;
  let py = dx / length;
  if (px * (mid.x - centre.x) + py * (mid.y - centre.y) < 0) {
    px = -px;
    py = -py;
  }
  // The curve's middle is halfway from the line to the control point, so the control point sits at twice the bow.
  const control = { x: mid.x + px * 2 * bow, y: mid.y + py * 2 * bow };
  const points: { x: number; y: number }[] = [];
  for (let n = 1; n <= count; n++) {
    const t = n / (count + 1);
    const u = 1 - t;
    points.push({
      x: Math.round(u * u * a.x + 2 * u * t * control.x + t * t * b.x),
      y: Math.round(u * u * a.y + 2 * u * t * control.y + t * t * b.y),
    });
  }
  return points;
}
