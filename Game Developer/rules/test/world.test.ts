import { describe, expect, it } from 'vitest';
import { buildBoard, KIND_LETTERS, roadSpaceId, type World, type WorldArea, type WorldRoad } from '../src/world.ts';
import { SPACE_KINDS } from '../src/data.ts';

// A small test world: one square area round the centre (500, 500), and a second area to the east behind a boss.
function area(id: string, hubs: WorldArea['hubs'], roads: WorldRoad[], tier = 1): WorldArea {
  return { id, name: id, theme: 'meadow', tier, levels: [1, 4], mobs: ['slime'], miniBosses: [], hubs, roads };
}
const square = (roads: WorldRoad[]): WorldArea =>
  area(
    'one',
    [
      { id: 'a', kind: 'town', name: 'A', x: 100, y: 200 },
      { id: 'b', kind: 'spell', name: 'B', x: 900, y: 200 },
      { id: 'c', kind: 'normal', name: 'C', x: 100, y: 800 },
      { id: 'd', kind: 'normal', name: 'D', x: 900, y: 800 },
    ],
    roads,
  );
const road = (from: string, to: string, kinds: string, bow = 0, extra: Partial<WorldRoad> = {}): WorldRoad => ({ from, to, kinds, bow, ...extra });
const world = (areas: WorldArea[], roads: WorldRoad[] = [], extra: Partial<World> = {}): World => ({ name: 'Test', width: 2000, height: 1000, start: 'a', areas, roads, ...extra });

describe('buildBoard', () => {
  it('lays a road as a chain of spaces from hub to hub, linked both ways, with ids numbered from 1 and the area of the hub it leaves', () => {
    const board = buildBoard(world([square([road('a', 'b', 'ntp')])]));
    expect(board).toMatchObject({ start: 'a', width: 2000, height: 1000 });
    expect(Object.keys(board.spaces)).toEqual(['a', 'b', 'c', 'd', 'a-b-1', 'a-b-2', 'a-b-3']);
    expect(roadSpaceId('a', 'b', 2)).toBe('a-b-2');
    expect(board.spaces.a!.links).toEqual(['a-b-1']);
    expect(board.spaces['a-b-1']).toEqual({ id: 'a-b-1', kind: 'normal', name: '', x: 300, y: 200, links: ['a', 'a-b-2'], area: 'one' });
    expect(board.spaces['a-b-2']).toMatchObject({ kind: 'chest', name: '', links: ['a-b-1', 'a-b-3'] });
    expect(board.spaces['a-b-3']).toMatchObject({ kind: 'potion', name: '', links: ['a-b-2', 'b'] });
    expect(board.spaces.b!.links).toEqual(['a-b-3']);
    expect(board.spaces.a).toMatchObject({ kind: 'town', name: 'A', x: 100, y: 200, area: 'one' });
    expect(board.areas.one).toMatchObject({ id: 'one', tier: 1, levels: [1, 4], mobs: ['slime'] });
  });

  it('gives a hub its links in road order, whichever end of the road it is', () => {
    const board = buildBoard(world([square([road('a', 'b', 'n'), road('c', 'a', 'nn'), road('a', 'd', '')])]));
    expect(board.spaces.a!.links).toEqual(['a-b-1', 'c-a-2', 'd']);
    expect(board.spaces.d!.links).toEqual(['a']); // a road with no spaces joins the hubs directly
    expect(board.spaces['c-a-1']!.links).toEqual(['c', 'c-a-2']);
  });

  it('lays a bow 0 road as a straight, evenly spaced line', () => {
    const board = buildBoard(world([square([road('a', 'b', 'nnn'), road('a', 'd', 'nnn')])]));
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

  it("bows a positive bow away from the area's centre, by exactly the bow at the middle; a negative bow bows inward", () => {
    const board = buildBoard(world([square([road('a', 'b', 'nnn', 50), road('c', 'd', 'nnn', 50), road('a', 'c', 'nnn', 50), road('b', 'd', 'nnn', 50)])]));
    expect(board.spaces['a-b-2']).toMatchObject({ x: 500, y: 150 });
    expect(board.spaces['c-d-2']).toMatchObject({ x: 500, y: 850 });
    expect(board.spaces['a-c-2']).toMatchObject({ x: 50, y: 500 });
    expect(board.spaces['b-d-2']).toMatchObject({ x: 950, y: 500 });
    const first = board.spaces['a-b-1']!;
    const third = board.spaces['a-b-3']!;
    expect(first.y).toBe(third.y);
    expect(first.y).toBeGreaterThan(150);
    expect(first.y).toBeLessThan(200);
    const backward = buildBoard(world([square([road('b', 'a', 'nnn', 50)])]));
    expect(backward.spaces['b-a-2']).toMatchObject({ x: 500, y: 150 });
    const inward = buildBoard(world([square([road('a', 'b', 'nnn', -50)])]));
    expect(inward.spaces['a-b-2']).toMatchObject({ x: 500, y: 250 });
  });

  it('reads one letter per kind of spot, bosses never on a road', () => {
    expect(KIND_LETTERS).toEqual({ n: 'normal', t: 'chest', p: 'potion', h: 'spell', s: 'shop', g: 'boss', w: 'town' });
    expect(new Set(Object.values(KIND_LETTERS))).toEqual(new Set(SPACE_KINDS));
    const board = buildBoard(world([square([road('a', 'b', 'ntphsw')])]));
    expect([1, 2, 3, 4, 5, 6].map((n) => board.spaces[`a-b-${n}`]!.kind)).toEqual(['normal', 'chest', 'potion', 'spell', 'shop', 'town']);
    expect(() => buildBoard(world([square([road('a', 'b', 'ngn')])]))).toThrow(/puts a boss on a road/);
  });

  it('lays a passage road from a boss hub into the next area, its spaces in that area, and sets the area bounds round its spots', () => {
    const two = area('two', [{ id: 'e', kind: 'town', name: 'E', x: 1500, y: 500 }, { id: 'f', kind: 'normal', name: 'F', x: 1900, y: 500 }], [road('e', 'f', 'nn'), road('f', 'e', 'nn', 40)], 2);
    const one = square([road('a', 'b', 'nnn'), road('b', 'd', 'nnn'), road('d', 'c', 'nnn'), road('c', 'a', 'nnn')]);
    one.hubs[3] = { id: 'd', kind: 'boss', name: 'D', x: 900, y: 800, boss: 'thornwood-warden', opens: 'two' };
    const board = buildBoard(world([one, two], [road('d', 'e', 'nn', 0, { area: 'two' })]));
    expect(board.spaces.d).toMatchObject({ kind: 'boss', boss: 'thornwood-warden', opens: 'two', area: 'one' });
    expect(board.spaces['d-e-1']).toMatchObject({ area: 'two' });
    expect(board.spaces['d-e-2']).toMatchObject({ area: 'two' });
    expect(board.spaces.d!.links).toEqual(['b-d-3', 'd-c-1', 'd-e-1']);
    expect(board.areas.one!.bounds).toEqual({ x: 40, y: 140, width: 920, height: 720 });
    expect(board.areas.two!.bounds.x).toBeLessThanOrEqual(1100);
    expect(board.areas.two!.bounds.x + board.areas.two!.bounds.width).toBe(1960);
  });

  it('refuses an unknown hub, an unknown kind letter, a duplicate id, an unknown hub kind, a boss spot without a boss, an unknown area and a start that is no hub', () => {
    expect(() => buildBoard(world([square([road('a', 'zzz', 'n')])]))).toThrow(/road a-zzz ends at unknown hub "zzz"/);
    expect(() => buildBoard(world([square([road('zzz', 'a', 'n')])]))).toThrow(/road zzz-a starts at unknown hub "zzz"/);
    expect(() => buildBoard(world([square([road('a', 'b', 'nxn')])]))).toThrow(/road a-b has unknown kind letter "x"/);
    expect(() => buildBoard(world([square([road('a', 'b', 'nn'), road('a', 'b', 'n')])]))).toThrow(/duplicate space id "a-b-1"/);
    const twice = square([]);
    twice.hubs.push({ ...twice.hubs[0]!, x: 500 });
    expect(() => buildBoard(world([twice]))).toThrow(/duplicate space id "a"/);
    const odd = square([]);
    odd.hubs[0] = { ...odd.hubs[0]!, kind: 'castle' as 'town' };
    expect(() => buildBoard(world([odd]))).toThrow(/hub "a" has unknown kind "castle"/);
    const noBoss = square([]);
    noBoss.hubs[1] = { id: 'b', kind: 'boss', name: 'B', x: 900, y: 200 };
    expect(() => buildBoard(world([noBoss]))).toThrow(/boss spot "b" names no boss/);
    const opensNowhere = square([]);
    opensNowhere.hubs[1] = { id: 'b', kind: 'boss', name: 'B', x: 900, y: 200, boss: 'thornwood-warden', opens: 'nowhere' };
    expect(() => buildBoard(world([opensNowhere]))).toThrow(/opens unknown area "nowhere"/);
    expect(() => buildBoard(world([square([road('a', 'b', 'n', 0, { area: 'nowhere' })])]))).toThrow(/lies in unknown area "nowhere"/);
    expect(() => buildBoard(world([square([])], [], { start: 'nowhere' }))).toThrow(/start "nowhere" is not a hub/);
    const twoAreas = world([square([]), square([])]);
    expect(() => buildBoard(twoAreas)).toThrow(/duplicate area id "one"/);
  });

  it('is deterministic: the same world gives the same board every time', () => {
    const w = world([square([road('a', 'b', 'nnn', 50), road('b', 'd', 'ttt', 30), road('d', 'c', 'ppp', 0), road('c', 'a', 'sss', -20)])]);
    expect(buildBoard(w)).toEqual(buildBoard(w));
    expect(buildBoard(structuredClone(w))).toEqual(buildBoard(w));
  });
});
