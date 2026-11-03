// The painted roads' bends between two neighbouring spots (Robin, 2026-11-03: walking in the city "was quite buggy and
// unnatural. The paths were clipping"). A road's spots lie evenly along its line through its `via` points, so a straight
// step from spot to spot cuts every corner, through the houses beside the street. The walk goes through the bends instead.
// Worked out once a board, from the same line the rules lay the spots on; nothing here changes the rules or the save.

import { DUNGEONS, pointsAlong, WORLD_DATA, type Board } from '../../rules/src/index.ts';

interface Point {
  x: number;
  y: number;
}

let built: { board: Board; bends: Map<string, Point[]> } | null = null;
const key = (a: Point, b: Point): string => `${Math.round(a.x)},${Math.round(a.y)}>${Math.round(b.x)},${Math.round(b.y)}`;

function build(board: Board): Map<string, Point[]> {
  const bends = new Map<string, Point[]>();
  const roads = [...WORLD_DATA.roads, ...WORLD_DATA.areas.flatMap((a) => a.roads), ...Object.values(DUNGEONS).flatMap((d) => d.area.roads)];
  for (const road of roads) {
    if (!road.via?.length) continue;
    const a = board.spaces[road.from];
    const b = board.spaces[road.to];
    if (!a || !b) continue;
    const line: Point[] = [a, ...road.via, b];
    const count = road.kinds.length;
    const chain: Point[] = [a, ...pointsAlong(line, count), b];
    // How far along the line each corner lies, and each spot (evenly, as the rules lay them).
    const along = [0];
    for (let i = 1; i < line.length; i++) along.push(along[i - 1]! + Math.hypot(line[i]!.x - line[i - 1]!.x, line[i]!.y - line[i - 1]!.y));
    const total = along[along.length - 1]!;
    for (let k = 0; k < chain.length - 1; k++) {
      const from = (total * k) / (count + 1);
      const to = (total * (k + 1)) / (count + 1);
      const between = road.via.filter((_, j) => along[j + 1]! > from + 0.5 && along[j + 1]! < to - 0.5).map((p) => ({ x: p.x, y: p.y }));
      if (!between.length) continue;
      bends.set(key(chain[k]!, chain[k + 1]!), between);
      bends.set(key(chain[k + 1]!, chain[k]!), [...between].reverse());
    }
  }
  return bends;
}

/** The corners of the painted road between two neighbouring spots, in walking order; none on a straight stretch. */
export function bendsBetween(board: Board, from: Point, to: Point): Point[] {
  if (built?.board !== board) built = { board, bends: build(board) };
  return built.bends.get(key(from, to)) ?? [];
}
