// The world: areas by tier, each a set of hubs (named spots at fixed positions) joined by roads (a spot every step,
// laid along a curve), and passage roads between areas that start at a boss. buildBoard turns the hand-laid description
// into the Board the rules walk on; the generator (generate.ts) lays grown areas into it with the same functions.
// Pure and deterministic: the same world always gives the same board.

import type { Area, Board, Space, SpaceKind , Ground, ShopStock } from './types.ts';

/** A named spot at a fixed position: a town, a shrine, a fork, a boss on the board. */
export interface WorldHub {
  id: string;
  kind: SpaceKind;
  name: string;
  x: number;
  y: number;
  /** For a boss spot: the enemy, and the area beaten it opens (null when nothing lies beyond). An area not laid yet
   * may be named by its grown id ("gen-1"): it is laid when the boss falls. */
  boss?: string;
  opens?: string | null;
  /** A chest that needs the area's key. */
  locked?: boolean;
  /** A shop's stock. */
  stock?: ShopStock;
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
  grounds?: Ground[];
  miniBosses: string[];
  /** The kingdom or territory the area belongs to: a label for the atlas and the hints. */
  kingdom?: string;
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
export const KIND_LETTERS: Record<string, SpaceKind> = { q: 'board',
  n: 'normal',
  a: 'gear',
  t: 'chest',
  p: 'potion',
  h: 'spell',
  c: 'church',
  s: 'shop',
  g: 'boss',
  w: 'town',
};

const KNOWN_KINDS = new Set<string>(Object.values(KIND_LETTERS));
const AREA_MARGIN = 60;
/** The id of an area grown by the generator: "gen-" and its number from 1. */
export const GROWN = /^gen-\d+$/;

/** The id of the n-th spot (from 1) on the road from `from` to `to`. */
export function roadSpaceId(from: string, to: string, n: number): string {
  return `${from}-${to}-${n}`;
}

/**
 * The board from the hand-laid world. Road spots are named "" (the client shows the kind instead) and chained hub →
 * 1 → 2 → … → hub, linked both ways; a hub gains its links in road order, its own area's roads first, then the passage
 * roads. Throws a clear Error on an unknown hub, an unknown kind letter, a duplicate id, an unknown area, a boss spot
 * with no boss, or a start that is not a hub.
 */
export function buildBoard(world: World): Board {
  const board: Board = { start: world.start, width: world.width, height: world.height, spaces: {}, areas: {}, bestiary: {} };
  for (const area of world.areas) addArea(board, area, world.name);
  const start = board.spaces[world.start];
  if (!start || start.name === '') throw new Error(`world ${world.name}: start "${world.start}" is not a hub`);
  for (const road of world.roads) addRoad(board, road, board.spaces[road.from]?.area ?? '', world.name);
  for (const areaId of Object.keys(board.areas)) setBounds(board, areaId);
  checkOpens(board, world.name);
  return board;
}

/** Lay an area's hubs and roads into the board (the board is changed in place; pass a copy to keep the old one). */
export function addArea(board: Board, area: WorldArea, worldName = 'world'): void {
  if (board.areas[area.id]) throw new Error(`world ${worldName}: duplicate area id "${area.id}"`);
  board.areas[area.id] = { id: area.id, name: area.name, theme: area.theme, ...(area.kingdom ? { kingdom: area.kingdom } : {}), ...(area.grounds ? { grounds: area.grounds } : {}), tier: area.tier, levels: area.levels, mobs: area.mobs, miniBosses: area.miniBosses, bounds: { x: 0, y: 0, width: 0, height: 0 } };
  for (const hub of area.hubs) {
    if (!KNOWN_KINDS.has(hub.kind)) throw new Error(`world ${worldName}: hub "${hub.id}" has unknown kind "${hub.kind}"`);
    if (hub.kind === 'boss' && !hub.boss) throw new Error(`world ${worldName}: boss spot "${hub.id}" names no boss`);
    if (hub.name === '') throw new Error(`world ${worldName}: hub "${hub.id}" has no name`);
    const space: Space = { id: hub.id, kind: hub.kind, name: hub.name, x: hub.x, y: hub.y, links: [], area: area.id };
    if (hub.locked && hub.kind === 'chest') space.locked = true;
    if (hub.stock && hub.kind === 'shop') space.stock = hub.stock;
    if (hub.kind === 'boss') {
      space.boss = hub.boss;
      space.opens = hub.opens ?? null;
    }
    add(board, space, worldName);
  }
  for (const road of area.roads) addRoad(board, road, area.id, worldName);
}

/** A road's spots into the board, chained between its hubs, in `areaId`. */
export function addRoad(board: Board, road: WorldRoad, areaId: string, worldName = 'world'): void {
  const a = board.spaces[road.from];
  const b = board.spaces[road.to];
  if (!a || a.name === '') throw new Error(`world ${worldName}: road ${road.from}-${road.to} starts at unknown hub "${road.from}"`);
  if (!b || b.name === '') throw new Error(`world ${worldName}: road ${road.from}-${road.to} ends at unknown hub "${road.to}"`);
  const area = road.area ?? areaId;
  if (!board.areas[area]) throw new Error(`world ${worldName}: road ${road.from}-${road.to} lies in unknown area "${area}"`);
  const points = roadPoints(a, b, road.kinds.length, road.bow, areaCentre(board, area));
  let previous = a.id;
  for (let n = 1; n <= road.kinds.length; n++) {
    const letter = road.kinds.charAt(n - 1);
    const kind = KIND_LETTERS[letter];
    if (!kind) throw new Error(`world ${worldName}: road ${road.from}-${road.to} has unknown kind letter "${letter}"`);
    if (kind === 'boss') throw new Error(`world ${worldName}: road ${road.from}-${road.to} puts a boss on a road; bosses are hubs`);
    const point = points[n - 1]!;
    const id = roadSpaceId(road.from, road.to, n);
    add(board, { id, kind, name: '', x: point.x, y: point.y, links: [], area }, worldName);
    link(board, previous, id);
    previous = id;
  }
  link(board, previous, b.id);
}

/** The box round an area's spots, with a margin, clipped to the board. */
export function setBounds(board: Board, areaId: string): void {
  const area = board.areas[areaId];
  if (!area) return;
  const own = Object.values(board.spaces).filter((s) => s.area === areaId);
  if (!own.length) return;
  const xs = own.map((s) => s.x);
  const ys = own.map((s) => s.y);
  const x = Math.max(0, Math.min(...xs) - AREA_MARGIN);
  const y = Math.max(0, Math.min(...ys) - AREA_MARGIN);
  area.bounds = { x, y, width: Math.min(board.width, Math.max(...xs) + AREA_MARGIN) - x, height: Math.min(board.height, Math.max(...ys) + AREA_MARGIN) - y };
}

/** Every boss's `opens` names an area that exists, or a grown one laid when it falls. */
export function checkOpens(board: Board, worldName = 'world'): void {
  for (const space of Object.values(board.spaces)) {
    if (space.opens && !board.areas[space.opens] && !GROWN.test(space.opens)) {
      throw new Error(`world ${worldName}: boss spot "${space.id}" opens unknown area "${space.opens}"`);
    }
  }
}

function add(board: Board, space: Space, worldName: string): void {
  if (board.spaces[space.id]) throw new Error(`world ${worldName}: duplicate space id "${space.id}"`);
  board.spaces[space.id] = space;
}

/** Link both ways, replacing the spaces rather than scribbling on them, so a copied board never touches the original's. */
function link(board: Board, a: string, b: string): void {
  board.spaces[a] = { ...board.spaces[a]!, links: [...board.spaces[a]!.links, b] };
  board.spaces[b] = { ...board.spaces[b]!, links: [...board.spaces[b]!.links, a] };
}

/** The middle of an area's hubs: what its roads bow away from. */
export function areaCentre(board: Board, areaId: string): { x: number; y: number } {
  const hubs = Object.values(board.spaces).filter((s) => s.area === areaId && s.name !== '');
  if (!hubs.length) return { x: 0, y: 0 };
  const xs = hubs.map((h) => h.x);
  const ys = hubs.map((h) => h.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/**
 * `count` points evenly spaced in the parameter of a quadratic Bezier from `a` to `b`, whose middle lies `bow` pixels
 * off the straight line, away from `centre`. Rounded to whole pixels.
 */
export function roadPoints(
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
