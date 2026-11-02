// Plays the whole climb with the real rules, from a new character to Frostbeard's fall, and says how long each land takes and where it goes wrong
// (Robin, 2026-11-02: "Do the level 1 to 20 playthrough check"). The player is a sensible one, not a perfect one: it spends its points down one tree, wears
// what is better, buys when it can, drinks when low, hunts where its level fits, rests when hurt, and tries a boss when near its level. Times are estimates
// from the seconds below, not measurements. Not part of the game.
//   node tools/sim-journey.ts [runs for each build]

import { ABILITIES, apply, CLASS_DATA, ITEMS, makeRng, MAX_CARRIED, newGame, plainGear, pointsFree, reachable, shopOffer, SLOTS, stats, walkable, canLearn, groundsOf, type Character, type ClassId, type GameEvent, type GameState, type GearItem, type GearLine } from '../rules/src/index.ts';
import { choose } from './sim-player.ts';

const RUNS = Number(process.argv[2]) || 4;
// `walk`: a boss must be walked to, as if the tap to go straight there only worked after you had stood by it once. `quiet`: only the summary.
const WALK = process.argv.includes('walk');
const QUIET = process.argv.includes('quiet');
// Seconds a thing takes a player, by my own guess.
const SEC = { roll: 7, round: 4, offer: 3, shop: 12, door: 2 };
const LANDS = ['meadows', 'thornwood', 'frostpeak', 'bogglemire', 'frostcrown'] as const;
const LINE: Record<ClassId, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' } as Record<ClassId, GearLine>;
const P = 'p';

interface LandTally {
  seconds: number;
  rolls: number;
  fights: number;
  deaths: number;
  bossTries: number;
  levelIn: number;
  levelOut: number;
  goldOut: number;
  gearRank: number;
  gearRare: number;
  xpFromFights: number;
}
const blank = (): LandTally => ({ seconds: 0, rolls: 0, fights: 0, deaths: 0, bossTries: 0, levelIn: 0, levelOut: 0, goldOut: 0, gearRank: 0, gearRare: 0, xpFromFights: 0 });

function score(c: Character): number {
  const s = stats(c);
  const might = c.classId === 'mage' ? (s.magic ?? 0) * 2.5 + s.attack * 0.5 : s.attack * 2;
  return might + s.defense * 2 + s.maxHp * 0.25;
}
const wearing = (c: Character, g: GearItem): Character => ({ ...c, equipment: { ...c.equipment, [g.slot]: g } });

function journey(classId: ClassId, tree: string, seed: string): { lands: Record<string, LandTally>; finished: boolean; stuck: string | null } {
  const rng = makeRng(seed);
  let state: GameState = newGame({ seed, player: P, name: 'Sim', classId });
  let clock = Date.UTC(2026, 10, 3, 12);
  let lastTick = clock;
  let n = 0;
  const lands: Record<string, LandTally> = Object.fromEntries(LANDS.map((l) => [l, blank()]));
  lands.meadows!.levelIn = 1;
  let land: (typeof LANDS)[number] = 'meadows';
  const failed: Record<string, number> = {};
  let shopWait = 0;
  const act = (a: Record<string, unknown>): GameEvent[] => {
    n += 1;
    const r = apply(state, { ...a, id: `a${n}`, player: P } as never, rng, clock);
    state = r.state;
    return r.events;
  };
  const me = (): Character => state.characters[P]!;
  const spend = (seconds: number): void => {
    clock += seconds * 1000;
    lands[land]!.seconds += seconds;
    if (clock - lastTick > 60_000) {
      lastTick = clock;
      const r = apply(state, { type: 'tick', id: `t${n++}`, player: 'world' } as never, rng, clock);
      state = r.state;
    }
  };
  const nodes = CLASS_DATA[classId]!.trees[tree]!.nodes;
  const core = CLASS_DATA[classId]!.core;

  const housekeeping = (): void => {
    // Points down the tree, then the class's own.
    for (let guard = 0; guard < 20 && pointsFree(me()) > 0; guard++) {
      const c = me();
      const order = [...nodes, ...core, ...Object.keys(c.abilities)];
      const pick = order.find((id) => canLearn(c, id) && !c.abilities[id]) ?? order.find((id) => canLearn(c, id));
      if (!pick) break;
      act({ type: 'skill', op: 'learn', ability: pick });
      const after = me();
      const a = ABILITIES[pick];
      if (a && !a.rule && !after.carried.includes(pick)) {
        if (after.carried.length >= MAX_CARRIED) {
          const drop = after.carried.find((id) => !nodes.includes(id));
          if (drop) act({ type: 'skill', op: 'carry', ability: drop });
        }
        act({ type: 'skill', op: 'carry', ability: pick });
      }
    }
    // Wear what is better.
    for (const g of [...me().bag]) if (score(wearing(me(), g)) > score(me()) + 0.5) act({ type: 'equip', gear: g.id });
  };

  const shopping = (): void => {
    const c0 = me();
    const offer = shopOffer(state, c0);
    if (!offer) return;
    spend(SEC.shop);
    for (const g of [...c0.bag]) if (score(wearing(me(), g)) <= score(me())) act({ type: 'sell', gear: g.id });
    const line = offer.lines.includes(LINE[classId]) ? LINE[classId] : offer.lines[0];
    if (line) {
      for (const slot of SLOTS) {
        const c = me();
        const piece = plainGear('x', slot, offer.tier, line, classId);
        if (piece.price <= c.gold * 0.7 && score(wearing(c, piece)) > score(c) + 1) act({ type: 'buy', slot, line });
      }
    }
    const heal = offer.items.filter((id) => ITEMS[id]!.heal).sort((a, b) => (ITEMS[b]!.heal ?? 0) - (ITEMS[a]!.heal ?? 0))[0];
    const mana = offer.items.filter((id) => ITEMS[id]!.mana).sort((a, b) => (ITEMS[b]!.mana ?? 0) - (ITEMS[a]!.mana ?? 0))[0];
    for (const [id, want] of [[heal, 4], [mana, 2]] as const) {
      if (!id) continue;
      for (let i = 0; i < 6; i++) {
        const c = me();
        if ((c.items[id] ?? 0) >= want || offer.price(id) > c.gold * 0.5) break;
        act({ type: 'buy', item: id });
      }
    }
    housekeeping();
  };

  const flasks = (c: Character): number => Object.entries(c.items).filter(([id]) => ITEMS[id]?.heal).reduce((sum, [, k]) => sum + k, 0);

  for (let step = 0; step < 60000; step++) {
    const c = me();
    // Which land is the frontier.
    const top = [...LANDS].reverse().find((l) => c.opened.includes(l))!;
    if (top !== land && state.board.spaces[c.space]?.area === top) {
      lands[land]!.levelOut = c.level;
      lands[land]!.goldOut = c.gold;
      const worn = Object.values(c.equipment).filter((g): g is GearItem => !!g);
      lands[land]!.gearRank = worn.reduce((sum, g) => sum + g.rank, 0) / Math.max(1, worn.length);
      lands[land]!.gearRare = worn.filter((g) => g.rarity !== 'common' && g.rarity !== 'uncommon').length;
      land = top;
      lands[land]!.levelIn = c.level;
    }
    if (c.fight) {
      const { move, guard } = choose(c);
      let events = act({ type: 'fight', move, guard });
      if (events.some((e) => e.type === 'rejected')) events = act({ type: 'fight', move: { kind: 'attack' }, guard: 'block' });
      spend(SEC.round);
      for (const e of events) {
        if (e.type === 'died') {
          lands[land]!.deaths += 1;
          const boss = Object.values(state.board.spaces).find((s) => s.area === land && s.boss);
          failed[land] = (failed[land] ?? 0) + (c.fight.enemy.id === boss?.boss ? 1 : 0);
        }
        if (e.type === 'won') lands[land]!.fights += 1;
        if (e.type === 'bossDown' && (c.fight.enemy.id === 'frostbeard')) {
          lands[land]!.levelOut = me().level;
          lands[land]!.goldOut = me().gold;
          const worn = Object.values(me().equipment).filter((g): g is GearItem => !!g);
          lands[land]!.gearRank = worn.reduce((sum, g) => sum + g.rank, 0) / Math.max(1, worn.length);
          lands[land]!.gearRare = worn.filter((g) => g.rarity !== 'common' && g.rarity !== 'uncommon').length;
          return { lands, finished: true, stuck: null };
        }
      }
      continue;
    }
    if (c.offer) {
      spend(SEC.offer);
      const o = c.offer;
      if (o.kind === 'gamble') act({ type: 'gamble', choice: 'pass' });
      else if (o.kind === 'board') act({ type: 'quest', accept: o.quests.length > 0, index: 0 });
      else if (o.kind === 'roll') act({ type: 'try' });
      else if (o.kind === 'loot') act({ type: 'keep', choice: 'sell' });
      else act({ type: 'arena', op: 'take' });
      if (me().offer === c.offer) return { lands, finished: false, stuck: `an offer of ${o.kind} would not clear` };
      continue;
    }
    housekeeping();
    if (me().steps === 0) {
      if (clock > shopWait && shopOffer(state, me())) {
        shopping();
        shopWait = clock + 60_000;
      }
      // Ready for the land's boss, a player taps its spot and goes straight there (Robin, 2026-11-02).
      const c1 = me();
      const s1 = stats(c1);
      const top1 = [...LANDS].reverse().find((l) => c1.opened.includes(l))!;
      const boss1 = Object.values(state.board.spaces).find((sp) => sp.area === top1 && sp.boss && sp.kind === 'boss');
      const level1 = boss1?.boss ? enemyLevel(boss1.boss) : 99;
      if (!WALK && boss1 && c1.level >= level1 - 1 + (failed[top1] ?? 0) && c1.hp >= s1.maxHp * 0.7 && flasks(c1) >= 2 && (c1.cooldowns[boss1.id] ?? 0) <= clock) {
        const before = lands[land]!.bossTries;
        const events = act({ type: 'challenge', space: boss1.id });
        spend(SEC.offer);
        lands[land]!.bossTries = before + 1;
        if (!events.some((e) => e.type === 'rejected')) continue;
      }
      act({ type: 'roll' });
      spend(SEC.roll);
      lands[land]!.rolls += 1;
    }
    const after = me();
    if (after.steps === 0) continue;
    const open = walkable(after);
    const options = reachable(state.board, after.space, after.steps, open);
    if (!options.length) return { lands, finished: false, stuck: `no way to walk from ${after.space} on a ${after.steps}` };
    // Where it wants to go.
    const s = stats(after);
    const spaces = Object.values(state.board.spaces);
    const here = state.board.spaces[after.space]!;
    const inLand = (sp: { area: string }): boolean => sp.area === top;
    let goal: (id: string) => boolean;
    const bossSpot = spaces.find((sp) => sp.area === top && sp.boss && sp.kind === 'boss');
    const bossLevel = bossSpot?.boss ? (state.board.bestiary[bossSpot.boss]?.level ?? enemyLevel(bossSpot.boss)) : 99;
    const ready = WALK && bossSpot && after.level >= bossLevel - 1 + (failed[top] ?? 0) && after.hp >= s.maxHp * 0.7 && flasks(after) >= 2 && (after.cooldowns[bossSpot.id] ?? 0) <= clock;
    const worn = Object.values(after.equipment).filter((g): g is GearItem => !!g);
    const tier = state.board.areas[top]?.tier ?? 1;
    void worn;
    // A shop is worth the walk only if what it sells here is better and affordable, and not again straight away.
    const couldBuy = clock > shopWait && SLOTS.some((slot) => { const piece = plainGear('x', slot, tier, LINE[classId], classId); return piece.price <= after.gold * 0.7 && score(wearing(after, piece)) > score(after) + 3; });
    if (after.hp < s.maxHp * 0.4 || after.mana < s.maxMana * 0.15) goal = (id) => ['town', 'church', 'potion'].includes(state.board.spaces[id]!.kind);
    else if (here.area !== top) goal = (id) => inLand(state.board.spaces[id]!);
    else if (flasks(after) < 2 && after.gold > 60 * tier) goal = (id) => { const sp = state.board.spaces[id]!; return sp.area === top && sp.kind === 'town'; };
    else if (couldBuy) goal = (id) => { const sp = state.board.spaces[id]!; return sp.area === top && sp.kind === 'shop'; };
    else if (ready) goal = (id) => id === bossSpot!.id;
    else {
      // Hunt in the ground that fits the level.
      const grounds = groundsOf(state.board, top);
      const fit = grounds.find((g) => g.levels && after.level >= g.levels[0] && after.level <= g.levels[1]) ?? grounds[grounds.length - 1];
      const hub = fit?.hub;
      goal = hub ? (id) => Math.hypot(state.board.spaces[id]!.x - state.board.spaces[hub]!.x, state.board.spaces[id]!.y - state.board.spaces[hub]!.y) < 400 && state.board.spaces[id]!.kind === 'normal' : (id) => state.board.spaces[id]!.kind === 'normal' && inLand(state.board.spaces[id]!);
    }
    const dist = distances(state, open, goal);
    const scored = options.map((o) => ({ o, d: (dist.get(o.space) ?? 9999) + rng.next() * 0.5 }));
    scored.sort((a, b) => a.d - b.d);
    const choice = scored[0]!.o;
    act({ type: 'move', path: choice.path });
    if (clock - Date.UTC(2026, 10, 3, 12) > 60 * 3600_000) return { lands, finished: false, stuck: `still in ${top} after sixty hours, at level ${me().level}` };
  }
  return { lands, finished: false, stuck: `ran out of steps in ${land}, at level ${me().level}` };
}

function enemyLevel(id: string): number {
  return (ENEMY_LEVELS[id] ?? 99);
}
import enemiesJson from '../rules/data/enemies.json' with { type: 'json' };
const ENEMY_TABLE = ((enemiesJson as unknown as { enemies?: Record<string, { level: number }> }).enemies ?? enemiesJson) as unknown as Record<string, { level: number }>;
const ENEMY_LEVELS: Record<string, number> = Object.fromEntries(Object.entries(ENEMY_TABLE).map(([k, v]) => [k, v.level]));

function distances(state: GameState, open: ReadonlySet<string>, goal: (id: string) => boolean): Map<string, number> {
  const out = new Map<string, number>();
  let frontier: string[] = [];
  for (const sp of Object.values(state.board.spaces)) {
    if (!open.has(sp.area) || (sp.hidden && !open.has(sp.id))) continue;
    if (goal(sp.id)) {
      out.set(sp.id, 0);
      frontier.push(sp.id);
    }
  }
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      const d = out.get(id)!;
      for (const l of state.board.spaces[id]!.links) {
        const sp = state.board.spaces[l];
        if (!sp || out.has(l) || !open.has(sp.area) || (sp.hidden && !open.has(l))) continue;
        out.set(l, d + 1);
        next.push(l);
      }
    }
    frontier = next;
  }
  return out;
}

const mins = (s: number): string => `${Math.round(s / 60)}`.padStart(4);
const avg = (list: number[]): number => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);

const all: Record<string, LandTally[]> = Object.fromEntries(LANDS.map((l) => [l, []]));
const classTotals: Record<string, number[]> = {};
let unfinished = 0;
for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
  for (const tree of Object.keys(CLASS_DATA[classId]!.trees)) {
    const runs = Array.from({ length: RUNS }, (_, i) => journey(classId, tree, `${classId}${tree}${i}`));
    unfinished += runs.filter((r) => !r.finished).length;
    if (!QUIET) console.log(`\n${CLASS_DATA[classId]!.name}/${tree}: ${runs.filter((r) => r.finished).length} of ${RUNS} finished${runs.find((r) => r.stuck)?.stuck ? ` (${runs.find((r) => r.stuck)!.stuck})` : ''}`);
    const total = avg(runs.map((r) => LANDS.reduce((sum, l) => sum + r.lands[l]!.seconds, 0)));
    (classTotals[CLASS_DATA[classId]!.name] ??= []).push(total);
    for (const land of LANDS) all[land]!.push(...runs.map((r) => r.lands[land]!).filter((x) => x.seconds > 0));
    if (!QUIET) console.log(`  total ${(total / 3600).toFixed(1)} hours`);
  }
}
console.log(`\n${WALK ? 'Bosses walked to' : 'Bosses tapped from anywhere'}. ${RUNS} runs a build, ${unfinished} unfinished.`);
console.log('land          minutes  rolls fights deaths boss tries  level in-out      gold  rank rare+');
let grand = 0;
for (const land of LANDS) {
  const t2 = all[land]!;
  const m = avg(t2.map((x) => x.seconds));
  grand += m;
  console.log(`${land.padEnd(12)} ${mins(m)}    ${String(Math.round(avg(t2.map((x) => x.rolls)))).padStart(5)} ${String(Math.round(avg(t2.map((x) => x.fights)))).padStart(5)} ${avg(t2.map((x) => x.deaths)).toFixed(1).padStart(6)} ${avg(t2.map((x) => x.bossTries)).toFixed(1).padStart(8)}     L${avg(t2.map((x) => x.levelIn)).toFixed(1).padStart(4)}-${avg(t2.map((x) => x.levelOut)).toFixed(1).padStart(4)} ${String(Math.round(avg(t2.map((x) => x.goldOut)))).padStart(9)}  ${avg(t2.map((x) => x.gearRank)).toFixed(1)}  ${avg(t2.map((x) => x.gearRare)).toFixed(1)}`);
}
console.log(`Whole climb: ${(grand / 3600).toFixed(1)} hours`);
for (const [name, list] of Object.entries(classTotals)) console.log(`  ${name.padEnd(10)} ${(avg(list) / 3600).toFixed(1)} hours`);
