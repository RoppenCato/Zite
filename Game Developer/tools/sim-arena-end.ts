// The full sim's finished heroes through each of the Arena's ways at the Giants' Land, every Seal won: how far each gets and how
// many clear. Made to set Legend (Robin, 2026-11-03: a level 30 set for each land, won on the Arena's hardest way). First
//   ENDSTATE=1 node tools/sim-full.ts 2 warrior --to 30 --json end_warrior.json      (and the other classes)
// then
//   node tools/sim-arena-end.ts [tries] end_warrior.json end_rogue.json ...
// Each hero starts whole, with the flasks it ended with; it plays as tools/sim-player.ts does and always goes on.

import { readFileSync } from 'node:fs';
import { apply, ARENA, makeRng, newGame, sealsOf, stats, type Character, type GameState } from '../rules/src/index.ts';
import { choose } from './sim-player.ts';

const [triesArg, ...files] = process.argv.slice(2);
const TRIES = Number(triesArg) || 10;
const MONDAY = Date.UTC(2026, 10, 2, 12);
const base = newGame({ seed: 'sim', player: 'p', name: 'Sim', classId: 'warrior' });

/** Waves won in one run of this mode. */
function run(c: Character, mode: string, seed: string): number {
  const rng = makeRng(seed);
  const s = stats(c);
  const seals = Object.fromEntries(sealsOf(base.board, c).map((x) => [x.space, 1]));
  const hero: Character = { ...c, id: 'p', space: 'icering', steps: 0, fight: null, offer: null, arena: undefined, arenaTest: true, hp: s.maxHp, mana: s.maxMana, gold: 1e7, bossKills: { ...c.bossKills, ...seals } };
  let state: GameState = apply({ ...base, characters: { p: hero } }, { type: 'arena', id: 'e', player: 'p', op: 'enter', mode }, rng, MONDAY).state;
  let wave = 0;
  for (let i = 0; i < 800; i++) {
    const me = state.characters.p!;
    if (!me.arena) return wave;
    if (me.offer?.kind === 'arena') {
      wave = me.offer.wave;
      if (wave >= ARENA.waves.length) return wave;
      state = apply(state, { type: 'arena', id: `n${i}`, player: 'p', op: 'next' }, rng, MONDAY).state;
      continue;
    }
    if (!me.fight) return wave;
    const { move, guard } = choose(me);
    let r = apply(state, { type: 'fight', id: `r${i}`, player: 'p', move, guard } as never, rng, MONDAY);
    if (r.events.some((e) => e.type === 'rejected')) r = apply(state, { type: 'fight', id: `r${i}`, player: 'p', move: { kind: 'attack' }, guard } as never, rng, MONDAY);
    state = r.state;
  }
  return wave;
}

const modes = Object.keys(ARENA.modes);
console.log(`Each finished hero, ${TRIES} tries a way: the share who clear all ${ARENA.waves.length} (percent), then the waves won on average.`);
for (const file of files) {
  const results = (JSON.parse(readFileSync(file, 'utf8')) as { results: { build: { classId: string; main: string; second: string | null; tactic: string }; level: number; endState?: Character }[] }).results;
  for (const res of results) {
    const c = res.endState;
    if (!c || res.level < 30) continue;
    const line = modes.map((mode) => {
      let clears = 0;
      let waves = 0;
      for (let k = 0; k < TRIES; k++) {
        const w = run(c, mode, `${file}${res.build.main}${mode}${k}`);
        waves += w;
        if (w >= ARENA.waves.length) clears += 1;
      }
      return `${mode.slice(0, 5).padEnd(5)} ${String(Math.round((100 * clears) / TRIES)).padStart(3)}% ${(waves / TRIES).toFixed(1)}`;
    });
    const build = [res.build.main, res.build.second].filter(Boolean).join('+');
    console.log(`${res.build.classId.padEnd(8)} ${build.padEnd(22)} ${line.join('  |  ')}`);
  }
}
