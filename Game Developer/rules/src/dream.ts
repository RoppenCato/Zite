// The Dream (Robin, 2026-11-03: "Endgame after the last boss could be a small island ... At the shrine you could play
// dungeons, which essentially is randomly generated dungeons that fit to your level"): a run is an area laid for one
// dreamer from a seed, at a depth, with a land's look in a colour, that land's creatures measured from you, and a boss
// of a random element; it is taken off the board when the run ends. A fall loses the run's gold and keeps the gear and
// the Dreamdust; the boss falling opens the next depth. Numbers in `data/dream.json`, all mine. Pure.

import { ARENA, DREAM, PROGRESSION, type DreamPalette } from './data.ts';
import { stats } from './gear.ts';
import { makeRng, type Rng } from './rng.ts';
import { baseNumbers, traitsOf } from './skills.ts';
import { addArea, setBounds, type WorldArea, type WorldHub, type WorldRoad } from './world.ts';
import type { Action, Board, Character, DreamArea, DreamElement, DreamRun, Enemy, GameEvent, GameState, GearItem } from './types.ts';

/** The area a dreamer's run is laid as: one at a time. */
export const dreamAreaId = (player: string): string => `dream-${player}`;

/** The rank of what the Dream gives at a depth: Crownsteel at the first, one more every two depths, past Everbright. */
export function dreamRank(depth: number): number {
  return DREAM.loot.rankFrom + Math.floor((Math.max(1, depth) - 1) / DREAM.loot.depthsPerRank);
}

/** The deepest depth you may go in at: one past the deepest cleared. */
export function dreamDepthOpen(c: Character): number {
  return (c.dreamDepth ?? 0) + 1;
}

/** Whether the Ferry takes you: the Hollow King has fallen to you (Robin, 2026-11-03: "after the last boss"). */
export function bossBeaten(board: Board, c: Character, boss: string): boolean {
  return Object.values(board.spaces).some((s) => s.boss === boss && (c.bossKills[s.id] ?? 0) > 0);
}

export interface DreamLaid {
  area: WorldArea;
  theme: string;
  palette: DreamPalette;
  element: DreamElement;
}

const pick = <T>(rng: Rng, list: readonly T[]): T => list[rng.int(list.length) - 1]!;

/**
 * A run's board from its seed: the gate on the left, the boss on the right, a winding road of named spots between with
 * mini-bosses and springs at their places, side roads that leave and rejoin it, dead ends with a hoard, a chest or two
 * on the way. The look (land, colour, element, name) comes from the seed alone; the layout is tried again from the seed
 * until every spot sits clear of the others and every step is a step.
 */
export function layDream(seed: string, depth: number, player: string): DreamLaid {
  const rng = makeRng(`${seed}:look`);
  const themes = Object.keys(DREAM.themes);
  const theme = pick(rng, themes);
  const land = DREAM.themes[theme]!;
  const paletteId = pick(rng, land.palettes);
  const palette = DREAM.palettes.find((p) => p.id === paletteId)!;
  const element = pick(rng, Object.keys(DREAM.elements) as DreamElement[]);
  const name = `Depth ${depth}: the ${pick(rng, DREAM.words)} ${pick(rng, land.places)} of ${DREAM.elements[element].word}`;
  const boss = pick(rng, land.bosses);
  const minis = DREAM.layout.minis.map(() => pick(rng, land.minis));
  for (let attempt = 0; attempt < DREAM.layout.tries; attempt++) {
    const area = tryLay(makeRng(`${seed}:lay:${attempt}`), { depth, player, theme, name, boss, minis });
    if (area) return { area, theme, palette, element };
  }
  throw new Error(`the Dream could not be laid from seed ${seed}`);
}

interface Look {
  depth: number;
  player: string;
  theme: string;
  name: string;
  boss: string;
  minis: string[];
}

function tryLay(rng: Rng, look: Look): WorldArea | null {
  const L = DREAM.layout;
  const P = DREAM.place;
  const id = dreamAreaId(look.player);
  const hubId = (i: number): string => `${id}-h${i}`;
  const mid = P.y + P.height / 2;
  const last = L.hubs - 1;
  const names = [...DREAM.hubNames];
  const hubs: WorldHub[] = [];
  let y = mid;
  for (let i = 0; i <= last; i++) {
    if (i > 0) y = Math.min(mid + L.wiggle, Math.max(mid - L.wiggle, y + (rng.next() * 2 - 1) * L.wiggle));
    const x = P.x + 150 + i * L.step;
    const at = { id: hubId(i), x: Math.round(x), y: Math.round(y) };
    const mini = L.minis.indexOf(i);
    if (i === 0) hubs.push({ ...at, kind: 'dream', name: `${DREAM.gateName} ${look.depth}` });
    else if (i === last) hubs.push({ ...at, kind: 'boss', name: 'The Dreamer’s Throne', boss: look.boss });
    else if (mini >= 0) hubs.push({ ...at, kind: 'boss', name: 'A Restless Dream', boss: look.minis[mini]! });
    else if (L.springs.includes(i)) hubs.push({ ...at, kind: 'church', name: DREAM.springName });
    else hubs.push({ ...at, kind: 'normal', name: names.splice(rng.int(names.length) - 1, 1)[0] ?? 'A Turn in the Dream' });
  }
  const roads: WorldRoad[] = [];
  // The main road: a bend in each stretch, so it winds.
  for (let i = 0; i < last; i++) {
    const a = hubs[i]!;
    const b = hubs[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const bend = (rng.next() * 2 - 1) * 45;
    const via = [{ x: Math.round((a.x + b.x) / 2 - ((b.y - a.y) / length) * bend), y: Math.round((a.y + b.y) / 2 + ((b.x - a.x) / length) * bend) }];
    const spots = length > 300 ? L.roadSpots[1] : L.roadSpots[0];
    roads.push({ from: a.id, to: b.id, kinds: 'n'.repeat(spots), bow: 0, via });
  }
  // Chests on the way, never next to a boss.
  const chestRoads = roads.map((_, i) => i).filter((i) => hubs[i + 1]!.kind !== 'boss' && hubs[i]!.kind !== 'boss');
  for (let n = 0; n < L.chests && chestRoads.length; n++) {
    const i = chestRoads.splice(rng.int(chestRoads.length) - 1, 1)[0]!;
    const r = roads[i]!;
    const at = Math.floor(r.kinds.length / 2);
    roads[i] = { ...r, kinds: `${r.kinds.slice(0, at)}t${r.kinds.slice(at + 1)}` };
  }
  // Side roads round a plain hub or a spring, never round a boss: up or down, away from where the road bends.
  const sides = new Map<number, number>();
  const loopFrom = [...Array(last - 1).keys()].filter((i) => ['normal', 'church'].includes(hubs[i + 1]!.kind));
  for (let n = 0; n < L.loops && loopFrom.length; n++) {
    const i = loopFrom[rng.int(loopFrom.length) - 1]!;
    for (let k = loopFrom.length - 1; k >= 0; k--) if (Math.abs(loopFrom[k]! - i) < 3) loopFrom.splice(k, 1);
    const a = hubs[i]!;
    const b = hubs[i + 2]!;
    const side = hubs[i + 1]!.y > mid ? -1 : 1;
    for (const j of [i, i + 1, i + 2]) sides.set(j, side);
    const kinds = 'n'.repeat(L.loopSpots);
    roads.push({ from: a.id, to: b.id, kinds: `${kinds.slice(0, 2)}t${kinds.slice(3)}`, bow: 0, via: [{ x: a.x + 70, y: a.y + side * L.loopReach }, { x: b.x - 70, y: b.y + side * L.loopReach }] });
  }
  // Dead ends with a hoard, off plain hubs, on the side no side road takes.
  const spurFrom = hubs.map((h, i) => i).filter((i) => hubs[i]!.kind === 'normal');
  for (let n = 0; n < L.spurs && spurFrom.length; n++) {
    const i = spurFrom.splice(rng.int(spurFrom.length) - 1, 1)[0]!;
    const a = hubs[i]!;
    const side = sides.has(i) ? -sides.get(i)! : a.y > mid ? -1 : 1;
    const hoard: WorldHub = { id: `${id}-hoard${n + 1}`, kind: 'chest', name: DREAM.hoardName, x: a.x + 40, y: a.y + side * L.spurReach };
    hubs.push(hoard);
    roads.push({ from: a.id, to: hoard.id, kinds: 'n'.repeat(L.spurSpots), bow: 0 });
  }
  const area: WorldArea = { id, name: look.name, theme: look.theme, tier: dreamRank(look.depth), levels: [DREAM.foes.level, DREAM.foes.level], mobs: [...DREAM.themes[look.theme]!.mobs], miniBosses: [...DREAM.themes[look.theme]!.minis], hubs, roads };
  return laysWell(area) ? area : null;
}

/** Every spot inside the Dream's box, every two at least 60 apart, every step between 60 and 200 long. */
function laysWell(area: WorldArea): boolean {
  const P = DREAM.place;
  const board: Board = { start: '', width: P.x + P.width + 1, height: P.y + P.height + 1, spaces: {}, areas: {}, bestiary: {} };
  try {
    addArea(board, area);
  } catch {
    return false;
  }
  const spots = Object.values(board.spaces);
  for (const s of spots) {
    if (s.x < P.x || s.x > P.x + P.width || s.y < P.y || s.y > P.y + P.height) return false;
    for (const l of s.links) {
      const o = board.spaces[l]!;
      const d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d < 60 || d > 200) return false;
    }
  }
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      if (Math.hypot(spots[i]!.x - spots[j]!.x, spots[i]!.y - spots[j]!.y) < 60) return false;
    }
  }
  return true;
}

/** The dreamer's run laid into the board, from what the character carries; already there, nothing changes. */
export function withRun(board: Board, player: string, run: DreamRun): Board {
  const id = dreamAreaId(player);
  if (board.areas[id]) return board;
  const laid = layDream(run.seed, run.depth, player);
  const out: Board = { ...board, spaces: { ...board.spaces }, areas: { ...board.areas } };
  addArea(out, laid.area);
  setBounds(out, id);
  out.areas[id] = { ...out.areas[id]!, dungeon: true, dream: { player, depth: run.depth, palette: laid.palette.id, tint: laid.palette.tint, element: laid.element } };
  return out;
}

/** The dreamer's run taken off the board. */
export function withoutRun(board: Board, player: string): Board {
  const id = dreamAreaId(player);
  if (!board.areas[id]) return board;
  const { [id]: _gone, ...areas } = board.areas;
  const spaces = Object.fromEntries(Object.entries(board.spaces).filter(([, s]) => s.area !== id));
  return { ...board, areas, spaces };
}

/**
 * A foe's numbers measured from the fighter, as in the Arena: mostly what is worn, some the class's bare numbers at the
 * level, grown with the level and slid by the class's handicap. It lasts about `rounds` of the fighter's Attacks and its
 * plain blow takes `hit` of the fighter's HP through their armour.
 */
export function measure(c: Character, rounds: number, hit: number): { hp: number; attack: number } {
  const bare = baseNumbers(c.classId, c.level);
  const worn = stats(c);
  const share = ARENA.wornShare;
  const blend = (b: number, n: number): number => b * (1 - share) + n * share;
  const attack = blend(bare.attack, worn.attack);
  const maxHp = blend(bare.maxHp, worn.maxHp);
  const defense = blend(bare.defense, worn.defense);
  const grown = 1 + Math.max(0, c.level - 4) * ARENA.levelStep;
  // A class's handicap slides from its early number to its number at level 30 (2026-11-03): talents change who is ahead.
  const cls = ARENA.classes[c.classId];
  // From level 10, where the early numbers were measured, to 30.
  const t = Math.min(1, Math.max(0, (c.level - 10) / 20));
  const slide = (early: number | undefined, top: number | undefined): number => (early ?? 1) + ((top ?? early ?? 1) - (early ?? 1)) * t;
  return {
    hp: Math.round(attack * rounds * grown * slide(cls?.hp, cls?.top?.hp)),
    attack: Math.round(maxHp * hit * grown * slide(cls?.hit, cls?.top?.hit) + defense / 2),
  };
}

const roleOf = (e: Enemy): 'mob' | 'mini' | 'boss' => (e.role === 'boss' ? 'boss' : e.role === 'mini' ? 'mini' : 'mob');

/** A creature of the Dream: measured from you, grown with the depth, paying from the depth; a boss takes the run's element. */
export function dreamFoe(c: Character, e: Enemy, d: DreamArea): Enemy {
  const role = roleOf(e);
  const f = DREAM.foes[role];
  const deeper = d.depth - 1;
  const grow = 1 + DREAM.foes.perDepth * deeper;
  const n = measure(c, f.rounds * grow, f.hit * grow);
  const bar = (PROGRESSION.xpForLevel[c.level] ?? PROGRESSION.xpForLevel.at(-1)!) - (PROGRESSION.xpForLevel[c.level - 1] ?? 0);
  const out: Enemy = { ...e, level: DREAM.foes.level + d.depth, hp: n.hp, maxHp: n.hp, attack: n.attack, defense: 0, xp: Math.max(1, Math.round(bar * f.xp)), gold: Math.round(f.gold * (1 + DREAM.foes.goldPerDepth * deeper)) };
  if (role !== 'boss') return out;
  const el = DREAM.elements[d.element];
  return { ...out, name: `${el.prefix} ${e.name}`, trick: { ...el.trick } };
}

/** The Dreamdust a thing gives at a depth, with a Dreamcatcher's share. */
export function dustFor(c: Character, base: number, depth: number): number {
  return Math.max(1, Math.round(base * (1 + DREAM.foes.dustPerDepth * (depth - 1)) * (traitsOf(c).dreamDust ?? 1)));
}

/** What a fight won in the Dream gives in Dreamdust. */
export function foeDust(c: Character, e: Enemy, depth: number): number {
  return dustFor(c, DREAM.foes[roleOf(e)].dust, depth);
}

export function giveDust(c: Character, amount: number, action: Action, events: GameEvent[]): Character {
  if (amount === 0) return c;
  const dust = Math.max(0, (c.dreamdust ?? 0) + amount);
  events.push({ type: 'dreamdust', action: action.id, player: action.player, delta: amount, dust });
  return { ...c, dreamdust: dust };
}

/** The pieces found since `from` in these events carry the Dream's colour, in the bag, the hand and the events alike. */
export function touchLoot(c: Character, events: GameEvent[], from: number, tint: string): Character {
  const ids = new Set<string>();
  for (let i = from; i < events.length; i++) {
    const e = events[i]!;
    if (e.type === 'loot' || e.type === 'bagFull' || (e.type === 'equipped' && !e.replaced)) {
      ids.add(e.gear.id);
      events[i] = { ...e, gear: { ...e.gear, dream: tint } };
    }
  }
  if (!ids.size) return c;
  const touch = (g: GearItem | null): GearItem | null => (g && ids.has(g.id) ? { ...g, dream: tint } : g);
  const equipment = Object.fromEntries(Object.entries(c.equipment).map(([slot, g]) => [slot, touch(g)])) as Character['equipment'];
  const offer = c.offer?.kind === 'loot' ? { ...c.offer, gear: touch(c.offer.gear)! } : c.offer;
  return { ...c, equipment, bag: c.bag.map((g) => touch(g)!), offer };
}

/**
 * A run over: its board taken away, its spots' waits forgotten. The boss fell (`cleared`: the next depth opens, back at
 * the Dreamgate), you woke up (back at the Dreamgate, the run's gold kept), or you fell (at the camp, the run's gold
 * lost but a Lucid Bead's share; HP and mana are the caller's).
 */
export function endDream(state: GameState, c: Character, how: 'cleared' | 'woke' | 'fell', action: Action, events: GameEvent[]): GameState {
  const run = c.dream;
  if (!run) return { ...state, characters: { ...state.characters, [c.id]: c } };
  const id = dreamAreaId(c.id);
  const won = Math.max(0, c.gold - run.gold);
  const lost = how === 'fell' ? Math.round(won * (1 - Math.min(1, traitsOf(c).lucid ?? 0))) : 0;
  const to = how === 'fell' ? DREAM.isle.camp : DREAM.isle.gate;
  const ours = (key: string): boolean => key.startsWith(`${id}-`);
  const { dream: _run, ...rest } = c;
  const next: Character = {
    ...rest,
    gold: c.gold - lost,
    space: to,
    steps: 0,
    walking: undefined,
    opened: c.opened.filter((a) => a !== id),
    ...(c.seen ? { seen: c.seen.filter((a) => a !== id) } : {}),
    ...(c.bossMet ? { bossMet: c.bossMet.filter((s) => !ours(s)) } : {}),
    cooldowns: Object.fromEntries(Object.entries(c.cooldowns).filter(([k]) => !ours(k))),
    ...(how === 'cleared' ? { dreamDepth: Math.max(c.dreamDepth ?? 0, run.depth) } : {}),
  };
  events.push({ type: 'dreamEnded', action: action.id, player: action.player, how, depth: run.depth, gold: how === 'fell' ? lost : won, to });
  return { ...state, board: withoutRun(state.board, c.id), characters: { ...state.characters, [c.id]: next } };
}
