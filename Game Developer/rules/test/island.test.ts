import { describe, expect, it } from 'vitest';
import { buildBoard, KIND_LETTERS, roadSpaceId, type Island, type IslandRoad } from '../src/island.ts';
import { SPACE_KINDS } from '../src/data.ts';

// A square test island: four hubs at its corners round the centre (500, 500).
function isle(roads: IslandRoad[], extra: Partial<Island> = {}): Island {
  return {
    name: 'Test Isle',
    width: 1000,
    height: 1000,
    start: 'a',
    hubs: [
      { id: 'a', kind: 'town', name: 'A', x: 100, y: 200 },
      { id: 'b', kind: 'shrine', name: 'B', x: 900, y: 200 },
      { id: 'c', kind: 'event', name: 'C', x: 100, y: 800 },
      { id: 'd', kind: 'battle', name: 'D', x: 900, y: 800 },
    ],
    roads,
    ...extra,
  };
}

const road = (from: string, to: string, kinds: string, bow = 0): IslandRoad => ({ from, to, kinds, bow });

describe('buildBoard', () => {
  it('lays a road as a chain of spaces from hub to hub, linked both ways, with ids numbered from 1', () => {
    const board = buildBoard(isle([road('a', 'b', 'bet')]));
    expect(board).toMatchObject({ start: 'a', width: 1000, height: 1000 });
    expect(Object.keys(board.spaces)).toEqual(['a', 'b', 'c', 'd', 'a-b-1', 'a-b-2', 'a-b-3']);
    expect(roadSpaceId('a', 'b', 2)).toBe('a-b-2');
    expect(board.spaces.a!.links).toEqual(['a-b-1']);
    expect(board.spaces['a-b-1']).toEqual({ id: 'a-b-1', kind: 'battle', name: '', x: 300, y: 200, links: ['a', 'a-b-2'] });
    expect(board.spaces['a-b-2']).toMatchObject({ kind: 'event', name: '', links: ['a-b-1', 'a-b-3'] });
    expect(board.spaces['a-b-3']).toMatchObject({ kind: 'treasure', name: '', links: ['a-b-2', 'b'] });
    expect(board.spaces.b!.links).toEqual(['a-b-3']);
    // The hubs keep their own name, kind and place.
    expect(board.spaces.a).toMatchObject({ kind: 'town', name: 'A', x: 100, y: 200 });
  });

  it('gives a hub its links in road order, whichever end of the road it is', () => {
    const board = buildBoard(isle([road('a', 'b', 'b'), road('c', 'a', 'bb'), road('a', 'd', '')]));
    expect(board.spaces.a!.links).toEqual(['a-b-1', 'c-a-2', 'd']);
    expect(board.spaces.d!.links).toEqual(['a']); // a road with no spaces joins the hubs directly
    expect(board.spaces['c-a-1']!.links).toEqual(['c', 'c-a-2']);
  });

  it('lays a bow 0 road as a straight, evenly spaced line', () => {
    const board = buildBoard(isle([road('a', 'b', 'bbb'), road('a', 'd', 'bbb')]));
    expect([1, 2, 3].map((n) => [board.spaces[`a-b-${n}`]!.x, board.spaces[`a-b-${n}`]!.y])).toEqual([
      [300, 200],
      [500, 200],
      [700, 200],
    ]);
    expect([1, 2, 3].map((n) => [board.spaces[`a-d-${n}`]!.x, board.spaces[`a-d-${n}`]!.y])).toEqual([
      [300, 350],
      [500, 500],
      [700, 650],
    ]);
  });

  it('bows a positive bow away from the centre of the map, by exactly the bow at the middle', () => {
    const board = buildBoard(isle([road('a', 'b', 'bbb', 50), road('c', 'd', 'bbb', 50), road('a', 'c', 'bbb', 50), road('b', 'd', 'bbb', 50)]));
    // The top road bows up, the bottom road down, the left road left, the right road right.
    expect(board.spaces['a-b-2']).toMatchObject({ x: 500, y: 150 });
    expect(board.spaces['c-d-2']).toMatchObject({ x: 500, y: 850 });
    expect(board.spaces['a-c-2']).toMatchObject({ x: 50, y: 500 });
    expect(board.spaces['b-d-2']).toMatchObject({ x: 950, y: 500 });
    // The spaces either side of the middle bow less, and the same on both sides.
    const first = board.spaces['a-b-1']!;
    const third = board.spaces['a-b-3']!;
    expect(first.y).toBe(third.y);
    expect(first.y).toBeGreaterThan(150);
    expect(first.y).toBeLessThan(200);
    expect(first.x).toBe(1000 - third.x);
  });

  it('bows the same whichever way the road is written, and a negative bow bows toward the centre', () => {
    const forward = buildBoard(isle([road('a', 'b', 'bbb', 50)]));
    const backward = buildBoard(isle([road('b', 'a', 'bbb', 50)]));
    expect(backward.spaces['b-a-1']).toMatchObject({ x: forward.spaces['a-b-3']!.x, y: forward.spaces['a-b-3']!.y });
    expect(backward.spaces['b-a-2']).toMatchObject({ x: 500, y: 150 });
    const inward = buildBoard(isle([road('a', 'b', 'bbb', -50)]));
    expect(inward.spaces['a-b-2']).toMatchObject({ x: 500, y: 250 });
  });

  it('reads one letter per kind of space', () => {
    expect(KIND_LETTERS).toEqual({
      b: 'battle',
      e: 'event',
      t: 'treasure',
      s: 'shop',
      q: 'quest',
      h: 'shrine',
      g: 'bossgate',
      w: 'town',
    });
    expect(new Set(Object.values(KIND_LETTERS))).toEqual(new Set(SPACE_KINDS));
    const board = buildBoard(isle([road('a', 'b', 'betsqhgw')]));
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => board.spaces[`a-b-${n}`]!.kind)).toEqual([
      'battle',
      'event',
      'treasure',
      'shop',
      'quest',
      'shrine',
      'bossgate',
      'town',
    ]);
  });

  it('refuses an unknown hub, an unknown kind letter, a duplicate id, an unknown hub kind and a start that is no hub', () => {
    expect(() => buildBoard(isle([road('a', 'zzz', 'b')]))).toThrow(/road a-zzz ends at unknown hub "zzz"/);
    expect(() => buildBoard(isle([road('zzz', 'a', 'b')]))).toThrow(/road zzz-a starts at unknown hub "zzz"/);
    expect(() => buildBoard(isle([road('a', 'b', 'bxb')]))).toThrow(/road a-b has unknown kind letter "x"/);
    expect(() => buildBoard(isle([road('a', 'b', 'bb'), road('a', 'b', 'b')]))).toThrow(/duplicate space id "a-b-1"/);
    const twice = isle([]);
    twice.hubs.push({ ...twice.hubs[0]!, x: 500 });
    expect(() => buildBoard(twice)).toThrow(/duplicate space id "a"/);
    const odd = isle([]);
    odd.hubs[0] = { ...odd.hubs[0]!, kind: 'castle' as 'town' };
    expect(() => buildBoard(odd)).toThrow(/hub "a" has unknown kind "castle"/);
    expect(() => buildBoard(isle([], { start: 'nowhere' }))).toThrow(/start "nowhere" is not a hub/);
  });

  it('is deterministic: the same island gives the same board every time', () => {
    const island = isle([road('a', 'b', 'bbb', 50), road('b', 'd', 'eee', 30), road('d', 'c', 'ttt', 0), road('c', 'a', 'sss', -20)]);
    expect(buildBoard(island)).toEqual(buildBoard(island));
    expect(buildBoard(structuredClone(island))).toEqual(buildBoard(island));
  });
});
