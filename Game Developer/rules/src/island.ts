// An island: hubs (named spaces at fixed positions) joined by roads (a space every step, laid along a curve).
// buildBoard turns that short description into the Board the rules walk on. Pure and deterministic: the same
// island always gives the same board, in the browser and on the server.

import type { Board, Space, SpaceKind } from './types.ts';

/** A named space at a fixed position: a town, a shrine, a gate, a fork in the road. */
export interface IslandHub {
  id: string;
  kind: SpaceKind;
  name: string;
  x: number;
  y: number;
}

/**
 * A road between two hubs with `kinds.length` plain spaces between them, one letter per space (see KIND_LETTERS).
 * `bow` curves it: the spaces lie on a quadratic Bezier whose middle is `bow` pixels off the straight line, positive
 * away from the map's centre (so loops bulge outward); 0 is straight.
 */
export interface IslandRoad {
  from: string;
  to: string;
  kinds: string;
  bow: number;
}

export interface Island {
  name: string;
  /** The world's size in world pixels: the camera's bounds. */
  width: number;
  height: number;
  /** The hub the characters start on. */
  start: string;
  hubs: IslandHub[];
  roads: IslandRoad[];
}

/** One letter per kind of space, for writing roads by hand: "bebtbb" is battle, event, battle, treasure, battle, battle. */
export const KIND_LETTERS: Record<string, SpaceKind> = {
  b: 'battle',
  e: 'event',
  t: 'treasure',
  s: 'shop',
  q: 'quest',
  h: 'shrine',
  g: 'bossgate',
  w: 'town',
};

const KNOWN_KINDS = new Set<string>(Object.values(KIND_LETTERS));

/** The id of the n-th space (from 1) on the road from `from` to `to`. */
export function roadSpaceId(from: string, to: string, n: number): string {
  return `${from}-${to}-${n}`;
}

/**
 * The board from an island. Road spaces are named "" (the client shows the kind instead) and chained
 * hub → 1 → 2 → … → hub, linked both ways; the hubs gain the links too, in road order.
 * Throws a clear Error on an unknown hub, an unknown kind letter, a duplicate id, or a start that is not a hub.
 */
export function buildBoard(island: Island): Board {
  const spaces: Record<string, Space> = {};
  const add = (space: Space): void => {
    if (spaces[space.id]) throw new Error(`island ${island.name}: duplicate space id "${space.id}"`);
    spaces[space.id] = space;
  };

  for (const hub of island.hubs) {
    if (!KNOWN_KINDS.has(hub.kind)) throw new Error(`island ${island.name}: hub "${hub.id}" has unknown kind "${hub.kind}"`);
    add({ id: hub.id, kind: hub.kind, name: hub.name, x: hub.x, y: hub.y, links: [] });
  }
  if (!island.hubs.some((h) => h.id === island.start)) {
    throw new Error(`island ${island.name}: start "${island.start}" is not a hub`);
  }

  const link = (a: string, b: string): void => {
    spaces[a]!.links.push(b);
    spaces[b]!.links.push(a);
  };
  const centre = { x: island.width / 2, y: island.height / 2 };

  for (const road of island.roads) {
    const a = island.hubs.find((h) => h.id === road.from);
    const b = island.hubs.find((h) => h.id === road.to);
    if (!a) throw new Error(`island ${island.name}: road ${road.from}-${road.to} starts at unknown hub "${road.from}"`);
    if (!b) throw new Error(`island ${island.name}: road ${road.from}-${road.to} ends at unknown hub "${road.to}"`);
    const points = roadPoints(a, b, road.kinds.length, road.bow, centre);
    let previous = a.id;
    for (let n = 1; n <= road.kinds.length; n++) {
      const letter = road.kinds.charAt(n - 1);
      const kind = KIND_LETTERS[letter];
      if (!kind) throw new Error(`island ${island.name}: road ${road.from}-${road.to} has unknown kind letter "${letter}"`);
      const point = points[n - 1]!;
      const id = roadSpaceId(road.from, road.to, n);
      add({ id, kind, name: '', x: point.x, y: point.y, links: [] });
      link(previous, id);
      previous = id;
    }
    link(previous, b.id);
  }

  return { start: island.start, width: island.width, height: island.height, spaces };
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
  // The perpendicular, flipped so it points away from the centre of the map.
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
