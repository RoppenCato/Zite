// The Dream with the full sim's finished heroes (Robin, 2026-11-03, his endgame): how deep a level-30 hero gets, and how fast
// Dreamdust buys something. First
//   ENDSTATE=1 node tools/sim-full.ts 2 warrior --to 30 --json end_warrior.json      (and the other classes)
// then
//   node tools/sim-dream.ts [tries] end_warrior.json end_rogue.json ...
// Each hero starts whole at the Dreamgate with the flasks it ended with, its gear as it ended. It walks toward the run's boss
// (to a spring when under half its HP), fights as tools/sim-player.ts does, tries every find, and never wakes up early.
// Times are estimates from the seconds below, not measurements. Not part of the game.

import { readFileSync } from 'node:fs';
import { apply, DREAM, dreamAreaId, dreamPiece, dreamWares, legalPaths, makeRng, newGame, stats, walkable, type Character, type GameEvent, type GameState } from '../rules/src/index.ts';
import { choose } from './sim-player.ts';

const [triesArg, ...files] = process.argv.slice(2);
const TRIES = Number(triesArg) || 10;
const DEPTHS = (process.env.DEPTHS ?? '1,3,5,8,12').split(',').map(Number);
const SEC = { roll: 7, round: 4, offer: 3 };
const NOW = Date.UTC(2026, 10, 3, 12);
const base = newGame({ seed: 'dream-sim', player: 'p', name: 'Sim', classId: 'warrior' });
const throne = Object.values(base.board.spaces).find((s) => s.boss === DREAM.needs)!.id;

interface Run {
  how: 'cleared' | 'woke' | 'fell' | 'stuck';
  dust: number;
  gold: number;
  seconds: number;
}

/** Steps from every spot of the run to the nearest spot that is `goal`. */
function distances(state: GameState, area: string, goal: (id: string) => boolean): Map<string, number> {
  const spaces = state.board.spaces;
  const out = new Map<string, number>();
  let ring = Object.keys(spaces).filter((id) => spaces[id]!.area === area && goal(id));
  for (const id of ring) out.set(id, 0);
  for (let d = 1; ring.length; d++) {
    const next: string[] = [];
    for (const id of ring) {
      for (const l of spaces[id]!.links) {
        if (out.has(l) || spaces[l]?.area !== area) continue;
        out.set(l, d);
        next.push(l);
      }
    }
    ring = next;
  }
  return out;
}

function run(c: Character, depth: number, seed: string): Run {
  const rng = makeRng(seed);
  const s = stats(c);
  const hero: Character = { ...c, id: 'p', space: DREAM.isle.gate, steps: 0, fight: null, offer: null, dream: undefined, dreamDepth: depth - 1, dreamdust: 0, hp: s.maxHp, mana: s.maxMana, gold: 1000, cooldowns: {}, bossKills: { ...c.bossKills, [throne]: 1 }, opened: [...new Set([...c.opened, DREAM.isle.area])] };
  let state = apply({ ...base, characters: { p: hero } }, { type: 'dream', id: 'e', player: 'p', op: 'enter', depth }, rng, NOW).state;
  const area = dreamAreaId('p');
  const toBoss = distances(state, area, (id) => state.board.spaces[id]!.name === 'The Dreamer’s Throne');
  const toSpring = distances(state, area, (id) => state.board.spaces[id]!.kind === 'church');
  let seconds = 0;
  const end = (events: GameEvent[]): Run | null => {
    const e = events.find((x) => x.type === 'dreamEnded');
    if (e?.type !== 'dreamEnded') return null;
    const me = state.characters.p!;
    return { how: e.how, dust: me.dreamdust ?? 0, gold: e.how === 'fell' ? 0 : e.gold, seconds };
  };
  for (let i = 0; i < 4000; i++) {
    const me = state.characters.p!;
    let r: ReturnType<typeof apply>;
    if (me.fight) {
      const { move, guard } = choose(me);
      r = apply(state, { type: 'fight', id: `f${i}`, player: 'p', move, guard } as never, rng, NOW);
      if (r.events.some((e) => e.type === 'rejected')) r = apply(state, { type: 'fight', id: `f${i}`, player: 'p', move: { kind: 'attack' }, guard } as never, rng, NOW);
      seconds += SEC.round;
    } else if (me.offer) {
      const o = me.offer;
      const action = o.kind === 'roll' ? { type: 'try' } : o.kind === 'loot' ? { type: 'keep', choice: 'sell' } : o.kind === 'gamble' ? { type: 'gamble', choice: 'pass' } : { type: 'quest', accept: false, index: 0 };
      r = apply(state, { ...action, id: `o${i}`, player: 'p' } as never, rng, NOW);
      seconds += SEC.offer;
    } else if (me.steps === 0) {
      r = apply(state, { type: 'roll', id: `r${i}`, player: 'p' }, rng, NOW);
      seconds += SEC.roll;
    } else {
      // Toward the boss, or a spring when under half HP; the path that ends nearest wins.
      const low = me.hp < stats(me).maxHp * 0.5 && toSpring.size > 0;
      const goal = low ? toSpring : toBoss;
      const paths = legalPaths(state.board, me.space, me.steps, walkable(me));
      if (!paths.length) return { how: 'stuck', dust: me.dreamdust ?? 0, gold: 0, seconds };
      const best = paths.reduce((a, b) => ((goal.get(b.at(-1)!) ?? 999) < (goal.get(a.at(-1)!) ?? 999) ? b : a));
      r = apply(state, { type: 'move', id: `m${i}`, player: 'p', path: best }, rng, NOW);
    }
    state = r.state;
    const done = end(r.events);
    if (done) return done;
    if (r.events[0]?.type === 'rejected' && !me.fight) return { how: 'stuck', dust: state.characters.p!.dreamdust ?? 0, gold: 0, seconds };
  }
  return { how: 'stuck', dust: state.characters.p!.dreamdust ?? 0, gold: 0, seconds };
}

const piece = dreamPiece({ dreamDepth: 1 } as Character).price;
const trinkets = dreamWares().map((w) => w.price);
console.log(`Each finished hero, ${TRIES} runs a depth: cleared (percent), fell (percent), Dreamdust and gold a run, minutes a run.`);
console.log(`Prices: a piece ${piece} dust and up, the trinkets ${Math.min(...trinkets)} to ${Math.max(...trinkets)}.`);
for (const file of files) {
  const results = (JSON.parse(readFileSync(file, 'utf8')) as { results: { build: { classId: string; main: string; second: string | null }; level: number; endState?: Character }[] }).results;
  for (const res of results) {
    const c = res.endState;
    if (!c || res.level < 30) continue;
    const build = [res.build.main, res.build.second].filter(Boolean).join('+');
    console.log(`${res.build.classId} ${build}`);
    for (const depth of DEPTHS) {
      const runs = Array.from({ length: TRIES }, (_, k) => run(c, depth, `${file}${build}${depth}:${k}`));
      const share = (how: Run['how']): number => Math.round((100 * runs.filter((x) => x.how === how).length) / TRIES);
      const mean = (f: (x: Run) => number): number => runs.reduce((n, x) => n + f(x), 0) / TRIES;
      const stuck = share('stuck');
      console.log(`  depth ${String(depth).padStart(2)}: cleared ${String(share('cleared')).padStart(3)}%  fell ${String(share('fell')).padStart(3)}%${stuck ? `  stuck ${stuck}%` : ''}  dust ${mean((x) => x.dust).toFixed(0).padStart(4)}  gold ${mean((x) => x.gold).toFixed(0).padStart(5)}  ${(mean((x) => x.seconds) / 60).toFixed(1)} min`);
    }
  }
}
