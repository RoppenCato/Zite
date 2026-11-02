// The generator: the world grows as bosses fall (Robin, 2026-10-31: a forever game, big and generated, never finished;
// areas by tier with their own theme and creatures). A grown area is laid from the world's seed and its number alone,
// so every client and the server lay the same one, whenever it is reached. Its shape is one of the hand-laid areas',
// re-dressed: a theme, names, which hub is the way in and which the boss on the way out, creatures scaled to its tier,
// gear of its rank in its shop. The cells go east in a snake two cells tall; the board widens as they come.

import LAID_SHAPES from '../data/shapes-laid.json' with { type: 'json' };
import { SHAPES, THEMES, WORLD_DATA } from './data.ts';
import { hashSeed, makeRng, type Rng } from './rng.ts';
import type { Board, EnemyData, Space, SpaceKind } from './types.ts';
import { addArea, addRoad, areaCentre, roadPoints, setBounds, type WorldArea, type WorldHub, type WorldRoad } from './world.ts';

export const GROWN_PREFIX = 'gen-';
/** A passage spot every so many pixels, and how far every passage spot keeps from any other spot (the board tests' 55). */
const PASSAGE_STEP = 120;
const PASSAGE_CLEARANCE = 60;
const PASSAGE_BOWS = [0, 70, -70, 140, -140, 210, -210, 280, -280, 350, -350];

/** The number of a grown area from its id, or null for a hand-laid one. */
export function grownIndex(areaId: string): number | null {
  const m = /^gen-(\d+)$/.exec(areaId);
  return m ? Number(m[1]) : null;
}

export interface AreaPeek {
  id: string;
  name: string;
  theme: string;
  tier: number;
  levels: [number, number];
}

/** What the n-th grown area will be, without laying it: its name, theme, tier and levels. */
export function peekArea(seed: string, n: number): AreaPeek {
  const order = THEMES.order;
  const theme = order[(n - 1) % order.length]!;
  const names = THEMES.themes[theme]!.areas;
  const name = names[Math.floor((n - 1) / order.length) % names.length]!;
  const tier = 3 + n;
  return { id: `${GROWN_PREFIX}${n}`, name, theme, tier, levels: [4 * tier - 4, 4 * tier] };
}

/** The name of the hub an area is entered by: "<Area> Pass" (the only spot of an area so named). */
export function entryName(areaName: string): string {
  return `${areaName} Pass`;
}

type Side = 'west' | 'east' | 'north' | 'south';

/** Which cell the n-th grown area takes, which side it is entered from and which side its boss leaves by: a snake going east. */
export function cellFor(n: number): { col: number; row: number; enterFrom: Side; exitTo: Side } {
  const col = THEMES.cell.firstColumn + Math.floor((n - 1) / 2);
  const firstRow = col % 2 === 0 ? 0 : 1;
  const second = (n - 1) % 2 === 1;
  const row = second ? 1 - firstRow : firstRow;
  const enterFrom: Side = second ? (firstRow === 0 ? 'north' : 'south') : 'west';
  const exitTo: Side = second ? 'east' : firstRow === 0 ? 'south' : 'north';
  return { col, row, enterFrom, exitTo };
}

interface Template {
  hubs: WorldHub[];
  roads: WorldRoad[];
}

let templateCache: Template[] | null = null;

/** The hand-laid areas as shapes: positions inside their cell, kinds kept, a hub with one road dropped (no dead ends). */
function templates(): Template[] {
  if (templateCache) return templateCache;
  const { width, height } = THEMES.cell;
  // A painted area's shape is its own, too large and particular to repeat: grown areas keep the older shapes, the forest's and Honeyhill's among them, as they were laid in their cells.
  const laid: { hubs: WorldHub[]; roads: WorldRoad[] }[] = [...(LAID_SHAPES as unknown as { hubs: WorldHub[]; roads: WorldRoad[] }[]), ...SHAPES];
  templateCache = laid.map((a) => {
    const ox = Math.floor(Math.min(...a.hubs.map((h) => h.x)) / width) * width;
    const oy = Math.floor(Math.min(...a.hubs.map((h) => h.y)) / height) * height;
    const roadCount = new Map<string, number>();
    for (const r of a.roads) {
      roadCount.set(r.from, (roadCount.get(r.from) ?? 0) + 1);
      roadCount.set(r.to, (roadCount.get(r.to) ?? 0) + 1);
    }
    const hubs = a.hubs.filter((h) => (roadCount.get(h.id) ?? 0) >= 2).map((h) => ({ ...(h.stock ? { stock: h.stock } : {}), id: h.id, kind: h.kind === 'boss' ? ('normal' as SpaceKind) : h.kind, name: h.name, x: h.x - ox, y: h.y - oy, ...(h.locked ? { locked: true } : {}) }));
    const keep = new Set(hubs.map((h) => h.id));
    const roads = a.roads.filter((r) => keep.has(r.from) && keep.has(r.to)).map((r) => ({ from: r.from, to: r.to, kinds: r.kinds, bow: r.bow }));
    return { hubs, roads };
  });
  return templateCache;
}

const sidePoint = (side: Side): { x: number; y: number } => {
  const { width, height } = THEMES.cell;
  return side === 'west' ? { x: 0, y: height / 2 } : side === 'east' ? { x: width, y: height / 2 } : side === 'north' ? { x: width / 2, y: 0 } : { x: width / 2, y: height };
};

type Point = { x: number; y: number };

/** A template's spots, laid once by themselves, to judge approaches against. */
const spotCache = new Map<Template, Point[]>();
function templateSpots(template: Template): Point[] {
  let spots = spotCache.get(template);
  if (!spots) {
    const { width, height } = THEMES.cell;
    const scratch: Board = { start: '', width, height, spaces: {}, areas: {}, bestiary: {} };
    addArea(scratch, { id: 't', name: 't', theme: 't', tier: 1, levels: [1, 1], mobs: [], miniBosses: [], hubs: template.hubs, roads: template.roads }, 'template');
    spots = Object.values(scratch.spaces).map((s) => ({ x: s.x, y: s.y }));
    spotCache.set(template, spots);
  }
  return spots;
}

/** A point two steps outside the cell on `side`, level with `p`. */
function outside(side: Side, p: Point): Point {
  const { width, height } = THEMES.cell;
  const d = 2 * PASSAGE_STEP;
  return side === 'west' ? { x: -d, y: p.y } : side === 'east' ? { x: width + d, y: p.y } : side === 'north' ? { x: p.x, y: -d } : { x: p.x, y: height + d };
}

/**
 * The hub a passage should meet on `side`: of the four nearest that side, the first whose straight approach from `from`
 * (or from outside the cell, level with it) keeps clear of the area's other spots; a hub with a road looping round its
 * outer side would have the passage cut through that road. Failing all four, the clearest.
 */
function approachable(hubs: WorldHub[], spots: Point[], side: Side, from: Point | null): WorldHub {
  const target = sidePoint(side);
  const candidates = [...hubs].sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y)).slice(0, 4);
  let best: { hub: WorldHub; clearance: number } | null = null;
  for (const hub of candidates) {
    const start = from ?? outside(side, hub);
    const length = Math.hypot(hub.x - start.x, hub.y - start.y);
    let clearance = Infinity;
    for (let d = 0; d <= length - PASSAGE_STEP / 2; d += 30) {
      const p = { x: start.x + ((hub.x - start.x) * d) / length, y: start.y + ((hub.y - start.y) * d) / length };
      for (const s of spots) if (s.x !== hub.x || s.y !== hub.y) clearance = Math.min(clearance, Math.hypot(p.x - s.x, p.y - s.y));
    }
    if (clearance >= PASSAGE_CLEARANCE) return hub;
    if (!best || clearance > best.clearance) best = { hub, clearance };
  }
  return best!.hub;
}

interface Layout {
  template: Template;
  entry: WorldHub;
  exit: WorldHub;
  ox: number;
  oy: number;
}

const layoutCache = new Map<string, Layout>();

/**
 * The shape of the n-th grown area: its template (the first draw of its stream), its cell, the hub it is entered by (judged
 * against where its opener stands: the Summit, or the area before it's gate) and the hub its boss stands on. A pure function
 * of the seed and the number, so every board lays the same area; cached, since the area before is asked for each time.
 */
function layoutOf(seed: string, n: number): Layout {
  const key = `${seed}:${n}`;
  const cached = layoutCache.get(key);
  if (cached) return cached;
  const rng = makeRng(hashSeed(`${seed}:area:${n}`));
  const cell = cellFor(n);
  const ox = cell.col * THEMES.cell.width;
  const oy = cell.row * THEMES.cell.height;
  const template = pick(rng, templates());
  const spots = templateSpots(template);
  const opener = openerOf(seed, n);
  const entry = approachable(template.hubs, spots, cell.enterFrom, opener ? { x: opener.x - ox, y: opener.y - oy } : null);
  const exit = approachable(template.hubs.filter((h) => h.id !== entry.id), spots, cell.exitTo, null);
  const layout = { template, entry, exit, ox, oy };
  layoutCache.set(key, layout);
  return layout;
}

/** Where the boss that opens the n-th grown area stands: a hand-laid hub for the first, the gate of the area before otherwise. */
function openerOf(seed: string, n: number): Point | null {
  if (n === 1) {
    for (const area of WORLD_DATA.areas) for (const hub of area.hubs) if (hub.opens === `${GROWN_PREFIX}1`) return { x: hub.x, y: hub.y };
    return null;
  }
  const before = layoutOf(seed, n - 1);
  return { x: before.exit.x + before.ox, y: before.exit.y + before.oy };
}
const pick = <T>(rng: Rng, list: readonly T[]): T => list[rng.int(list.length) - 1]!;

export interface GrownArea {
  area: WorldArea;
  /** The id of the hub the area is entered by: where the passage from the boss that opens it arrives. */
  entry: string;
  bestiary: Record<string, EnemyData>;
}

/** The n-th grown area, laid from the seed: the same every time, whatever else is on the board. */
export function generateArea(seed: string, n: number): GrownArea {
  const rng = makeRng(hashSeed(`${seed}:area:${n}`));
  const peek = peekArea(seed, n);
  const theme = THEMES.themes[peek.theme]!;
  const { template, entry, exit, ox, oy } = layoutOf(seed, n);
  rng.next(); // the template's draw, taken in layoutOf
  const tag = `g${n}`;
  const adjectives = [...theme.adjectives];
  const adjective = (): string => (adjectives.length > 1 ? adjectives.splice(rng.int(adjectives.length) - 1, 1)[0]! : adjectives[0]!);

  // Kinds: the template's, but the way in is wilds and the way out the boss; then every area keeps a town, a shop, a shrine,
  // two chests and two springs.
  const kinds = new Map<string, SpaceKind>(template.hubs.map((h) => [h.id, h.kind]));
  kinds.set(entry.id, 'normal');
  kinds.set(exit.id, 'boss');
  const letters = new Map<string, string>(template.roads.map((r) => [`${r.from}-${r.to}`, r.kinds]));
  const count = (kind: SpaceKind): number => [...kinds.values()].filter((k) => k === kind).length + [...letters.values()].join('').split('').filter((l) => ({ t: 'chest', p: 'potion', s: 'shop', h: 'spell', w: 'town', c: 'church' } as Record<string, string>)[l] === kind).length;
  const need: [SpaceKind, number, string][] = [['town', 1, 'w'], ['shop', 1, 's'], ['spell', 1, 'h'], ['church', 1, 'c'], ['chest', 2, 't'], ['potion', 2, 'p']];
  for (const [kind, min, letter] of need) {
    while (count(kind) < min) {
      const spare = template.hubs.filter((h) => kinds.get(h.id) === 'normal' && h.id !== entry.id && h.id !== exit.id);
      if (spare.length) {
        kinds.set(pick(rng, spare).id, kind);
        continue;
      }
      const roads = template.roads.filter((r) => letters.get(`${r.from}-${r.to}`)!.includes('n'));
      if (!roads.length) break;
      const r = pick(rng, roads);
      const key = `${r.from}-${r.to}`;
      letters.set(key, letters.get(key)!.replace('n', letter));
    }
  }

  const bossId = `${tag}-boss`;
  const placeName = (kind: SpaceKind): string => `${adjective()} ${pick(rng, THEMES.places[kind] ?? THEMES.places.normal!)}`;
  const hubs: WorldHub[] = template.hubs.map((h) => {
    const kind = kinds.get(h.id)!;
    const id = `${tag}-${h.id}`;
    const base = { id, kind, x: h.x + ox, y: h.y + oy };
    if (h.id === entry.id) return { ...base, name: entryName(peek.name) };
    if (h.locked && kind === 'chest') return { ...base, name: `${adjective()} Vault`, locked: true };
    if (h.id === exit.id) return { ...base, name: `${adjective()} Gate`, boss: bossId, opens: `${GROWN_PREFIX}${n + 1}` };
    return { ...base, name: placeName(kind), ...(h.stock ? { stock: h.stock } : {}) };
  });
  // Every map has its quest board and both shops (Robin, 2026-11-02), whichever hubs its shape kept.
  const spare = (): WorldHub | undefined => hubs.find((h) => h.kind === 'normal' && h.id !== `${tag}-${entry.id}` && h.id !== `${tag}-${exit.id}`);
  if (!hubs.some((h) => h.kind === 'board')) {
    const h = spare();
    if (h) Object.assign(h, { kind: 'board', name: placeName('board') });
  }
  if (!hubs.some((h) => h.kind === 'shop' && h.stock === 'magic')) {
    const h = spare();
    if (h) Object.assign(h, { kind: 'shop', stock: 'magic', name: placeName('shop') });
  }
  const roads: WorldRoad[] = template.roads.map((r) => {
    const bow = Math.abs(r.bow) >= 20 ? r.bow + (rng.int(21) - 11) : r.bow;
    return { from: `${tag}-${r.from}`, to: `${tag}-${r.to}`, kinds: letters.get(`${r.from}-${r.to}`)!, bow };
  });

  // The creatures: four of the theme's at the area's levels, shaped by the archetypes and scaled to the tier; a mini-boss
  // and the boss above them.
  const scale = (base: number, growth: number, round = true): number => {
    const v = base * Math.pow(growth, peek.tier - 3);
    return round ? Math.round(v) : v;
  };
  const bestiary: Record<string, EnemyData> = {};
  const mobs: string[] = [];
  theme.mobs.forEach((name, i) => {
    const arch = THEMES.archetypes[i % THEMES.archetypes.length]!;
    const id = `${tag}-mob-${i + 1}`;
    bestiary[id] = {
      name,
      level: peek.levels[0] + i,
      role: 'mob',
      hp: Math.round(scale(THEMES.base.mob.hp, THEMES.perTier.hp, false) * arch.hp),
      attack: Math.round(scale(THEMES.base.mob.attack, THEMES.perTier.attack, false) * arch.attack),
      defense: Math.round(scale(THEMES.base.mob.defense, THEMES.perTier.defense, false) * arch.defense),
      xp: scale(THEMES.base.mob.xp, THEMES.perTier.reward),
      gold: scale(THEMES.base.mob.gold, THEMES.perTier.reward),
      moves: arch.moves.map((m) => ({ ...m })),
    };
    mobs.push(id);
  });
  const miniId = `${tag}-mini`;
  bestiary[miniId] = {
    name: theme.mini,
    level: peek.levels[1] + 1,
    role: 'mini',
    hp: scale(THEMES.base.mini.hp, THEMES.perTier.hp),
    attack: scale(THEMES.base.mini.attack, THEMES.perTier.attack),
    defense: scale(THEMES.base.mini.defense, THEMES.perTier.defense),
    xp: scale(THEMES.base.mini.xp, THEMES.perTier.reward),
    gold: scale(THEMES.base.mini.gold, THEMES.perTier.reward),
    moves: [
      { name: 'Swipe', power: 1, weight: 2 },
      { name: 'Roar', power: 2, weight: 1, charge: true },
    ],
  };
  const bossMoves = [
    { name: 'Claw', power: 1, weight: 2 },
    { name: 'Fury', power: 2, weight: 1, charge: true },
  ];
  const rage = THEMES.rage[peek.theme];
  bestiary[bossId] = {
    name: theme.boss,
    level: peek.levels[1] + 2,
    role: 'boss',
    hp: scale(THEMES.base.boss.hp, THEMES.perTier.hp),
    attack: scale(THEMES.base.boss.attack, THEMES.perTier.attack),
    defense: scale(THEMES.base.boss.defense, THEMES.perTier.defense),
    xp: scale(THEMES.base.boss.xp, THEMES.perTier.reward),
    gold: scale(THEMES.base.boss.gold, THEMES.perTier.reward),
    moves: bossMoves.map((m) => ({ ...m })),
    // Under half its HP a grown boss rages in its theme's way: one more move, with a line.
    ...(rage ? { phase2: { at: 0.5, text: rage.text.replace('{boss}', theme.boss), moves: [...bossMoves.map((m) => ({ ...m })), { ...rage.move }] } } : {}),
  };

  const area: WorldArea = { id: peek.id, name: peek.name, theme: peek.theme, ...(theme.kingdom ? { kingdom: theme.kingdom } : {}), tier: peek.tier, levels: peek.levels, mobs, miniBosses: [miniId], hubs, roads };
  return { area, entry: `${tag}-${entry.id}`, bestiary };
}

/** How far apart the spots stand on the long road along the north shore (mine). */
const EXIT_STEP = 190;

/**
 * The passage from a boss hub into the next area's entry hub: a road of wilds spots a step apart, in the next area, bowed
 * as little as it can be while every spot keeps clear of every other spot on the board (a straight line would cut through
 * the roads round the entry now and then). No luck in the search is decided here, so every board lays the same passage.
 */
function layPassage(board: Board, from: Space, to: Space, areaId: string): void {
  // Out of the painted world, along the shore Mitch, AD left for it.
  const exit = (WORLD_DATA as unknown as { exit?: { hub: string; path: { x: number; y: number }[] } }).exit;
  if (exit?.hub === from.id) {
    const path = [from, ...exit.path, to];
    const length = path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i]!.x, p.y - path[i]!.y), 0);
    addRoad(board, { from: from.id, to: to.id, kinds: 'n'.repeat(Math.ceil(length / EXIT_STEP)), bow: 0, area: areaId, via: exit.path }, areaId, 'grown');
    return;
  }
  const centre = areaCentre(board, areaId);
  const others = Object.values(board.spaces);
  let best: { bow: number; spots: number; clearance: number } | null = null;
  for (const bow of PASSAGE_BOWS) {
    const sample = roadPoints(from, to, 24, bow, centre);
    let length = 0;
    let last: { x: number; y: number } = from;
    for (const p of [...sample, to]) {
      length += Math.hypot(p.x - last.x, p.y - last.y);
      last = p;
    }
    const spots = Math.max(1, Math.round(length / PASSAGE_STEP) - 1);
    const points = roadPoints(from, to, spots, bow, centre);
    let clearance = Infinity;
    for (const p of points) for (const s of others) clearance = Math.min(clearance, Math.hypot(p.x - s.x, p.y - s.y));
    if (clearance >= PASSAGE_CLEARANCE) {
      best = { bow, spots, clearance };
      break;
    }
    if (!best || clearance > best.clearance) best = { bow, spots, clearance };
  }
  addRoad(board, { from: from.id, to: to.id, kinds: 'n'.repeat(best!.spots), bow: best!.bow, area: areaId }, areaId, 'grown');
}

/** The board with the grown area `areaId` laid into it (a new board; the old one is untouched). An area already there, or
 * an id that is not a grown one, gives the board back as it was. The passage from the boss that opens the area is laid
 * when that boss is on the board, and the passage on from the area's own boss when the area after it already is. */
export function growBoard(board: Board, seed: string, areaId: string): Board {
  const n = grownIndex(areaId);
  if (n === null || board.areas[areaId]) return board;
  const grown = generateArea(seed, n);
  const cell = cellFor(n);
  const next: Board = {
    ...board,
    width: Math.max(board.width, (cell.col + 1) * THEMES.cell.width),
    height: Math.max(board.height, (cell.row + 1) * THEMES.cell.height),
    spaces: { ...board.spaces },
    areas: { ...board.areas },
    bestiary: { ...board.bestiary, ...grown.bestiary },
  };
  addArea(next, grown.area, 'grown');
  const opener = Object.values(next.spaces).find((s) => s.opens === areaId);
  if (opener) layPassage(next, opener, next.spaces[grown.entry]!, areaId);
  setBounds(next, areaId);
  const afterId = `${GROWN_PREFIX}${n + 1}`;
  const after = next.areas[afterId];
  if (after) {
    const gate = Object.values(next.spaces).find((s) => s.opens === afterId)!;
    const entry = Object.values(next.spaces).find((s) => s.area === afterId && s.name === entryName(after.name))!;
    layPassage(next, gate, entry, afterId);
    next.areas[afterId] = { ...after };
    setBounds(next, afterId);
  }
  return next;
}
