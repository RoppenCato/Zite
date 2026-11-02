// Taps everything in no sensible order (Robin, 2026-11-02: "Try everything and see what needs fixing"): random actions, legal or not, for every class, with the same checks as the
// full playthrough. A refusal is fine; a thrown error or a broken number is not. Not part of the game.
//   node tools/sim-monkey.ts [steps a class]

import { ABILITIES, apply, canLearn, carriedLimit, CLASS_DATA, ITEMS, makeRng, migrate, newGame, pointsFree, reachable, SLOTS, stats, walkable, type ClassId, type GameState } from '../rules/src/index.ts';

const STEPS = Number(process.argv[2]) || 30000;
const P = 'p';
const problems = new Map<string, string>();
const count = new Map<string, number>();
const say = (key: string, sample: string): void => {
  count.set(key, (count.get(key) ?? 0) + 1);
  if (!problems.has(key)) problems.set(key, sample);
};

function check(s: GameState, last: string): void {
  const c = s.characters[P]!;
  const st = stats(c);
  for (const k of ['hp', 'mana', 'gold', 'xp', 'level', 'steps'] as const) if (!Number.isFinite(c[k] as number) || (c[k] as number) < 0) say(`${k} broken`, `${c[k]} after ${last}`);
  if (c.hp > st.maxHp + 0.5) say('hp over max', `${c.hp}/${st.maxHp} after ${last}`);
  if (c.mana > st.maxMana + 0.5) say('mana over max', `${c.mana}/${st.maxMana} after ${last}`);
  if (!s.board.spaces[c.space]) say('on no spot', `${c.space} after ${last}`);
  if (pointsFree(c) < 0) say('points below zero', last);
  if (c.carried.length > carriedLimit(c.level)) say('carries too many', `${c.carried.length} at L${c.level} after ${last}`);
  for (const id of c.carried) if (!c.abilities[id]) say('carries unlearned', `${id} after ${last}`);
  for (const [id, n] of Object.entries(c.items)) if (n < 0) say('item below zero', `${id} after ${last}`);
  if (c.fight && (!Number.isFinite(c.fight.enemy.hp) || !Number.isFinite(c.fight.enemy.attack))) say('enemy broken', `${c.fight.enemy.id} after ${last}`);
  if (c.bag.length > 40) say('bag overflow', `${c.bag.length} after ${last}`);
}

const refused = new Map<string, number>();
for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
  for (const seed of ['one', 'two']) {
    const rng = makeRng(`${classId}-${seed}`);
    const act = makeRng(`act-${classId}-${seed}`);
    let s: GameState = newGame({ seed, player: P, name: 'Monkey', classId });
    let clock = Date.UTC(2026, 10, 2, 12);
    const pick = <T>(list: readonly T[]): T | undefined => list[act.int(list.length) - 1];
    for (let i = 0; i < STEPS; i++) {
      clock += 5000 + act.int(60000);
      const c = s.characters[P]!;
      const ids = Object.keys(ABILITIES);
      const sp = Object.keys(s.board.spaces);
      const options: (() => Record<string, unknown>)[] = [
        () => ({ type: 'roll' }),
        () => {
          const o = c.steps ? reachable(s.board, c.space, c.steps, walkable(c)) : [];
          return { type: 'move', path: pick(o)?.path ?? [c.space] };
        },
        () => ({ type: 'fight', move: pick([{ kind: 'attack' }, { kind: 'charge' }, { kind: 'flee' }, { kind: 'ability', ability: pick(c.carried) ?? 'x' }, { kind: 'item', item: pick(Object.keys(c.items)) ?? 'potion' }]), guard: pick(['none', 'block', 'dodge', 'brace', 'counter']) }),
        () => ({ type: 'fight', move: { kind: 'attack' }, guard: 'block' }),
        () => ({ type: 'fight', move: { kind: 'ability', ability: pick(c.carried) ?? 'x' }, guard: 'none' }),
        () => ({ type: 'skill', op: 'learn', ability: pick(ids.filter((id) => canLearn(c, id))) ?? pick(ids) }),
        () => ({ type: 'skill', op: 'carry', ability: pick(Object.keys(c.abilities)) ?? 'x' }),
        () => ({ type: 'skill', op: 'reset' }),
        () => ({ type: 'equip', gear: pick(c.bag)?.id ?? 'x' }),
        () => ({ type: 'unequip', slot: pick(SLOTS) }),
        () => ({ type: 'sell', gear: pick(c.bag)?.id ?? 'x' }),
        () => ({ type: 'drop', gear: pick(c.bag)?.id ?? 'x' }),
        () => ({ type: 'buy', slot: pick(SLOTS), line: pick(['heavy', 'light', 'magic']) }),
        () => ({ type: 'buy', item: pick(Object.keys(ITEMS)) }),
        () => ({ type: 'buy', daily: true }),
        () => ({ type: 'use', item: pick(Object.keys(c.items)) ?? 'potion', value: act.int(6) }),
        () => ({ type: 'gamble', choice: pick(['high', 'low', 'pass']) }),
        () => ({ type: 'stroll', to: pick(sp) }),
        () => ({ type: 'home' }),
        () => ({ type: 'door' }),
        () => ({ type: 'arena', op: pick(['enter', 'next', 'take']), mode: pick(['normal', 'hard', 'nightmare']) }),
        () => ({ type: 'quest', accept: act.int(2) === 1, index: act.int(3) - 1, drop: act.int(4) === 1 }),
        () => ({ type: 'try' }),
        () => ({ type: 'travel', to: pick(c.visited ?? []) ?? 'x' }),
        () => ({ type: 'keep', choice: pick(['sell', 'drop']) }),
        () => ({ type: 'challenge', space: pick(Object.values(s.board.spaces).filter((x) => x.kind === 'boss').map((x) => x.id)) }),
        () => ({ type: 'tick', player: 'world' }),
      ];
      const a = { player: P, id: `m${i}`, ...pick(options)!() } as Record<string, unknown>;
      const label = JSON.stringify(a).slice(0, 120);
      try {
        const r = apply(s, a as never, rng, clock);
        s = r.state;
        for (const e of r.events) if (e.type === 'rejected') refused.set(String(a.type), (refused.get(String(a.type)) ?? 0) + 1);
        check(s, label);
      } catch (err) {
        say(`THREW on ${String(a.type)}: ${(err as Error).message}`, label);
      }
      // Now and then, a little help so it sees the later game; and a save and load.
      if (i % 400 === 0) {
        const now = s.characters[P]!;
        s = { ...s, characters: { [P]: { ...now, gold: now.gold + 500, xp: now.xp + 200 + i / 10, level: Math.min(30, now.level + (i % 2000 === 0 ? 1 : 0)) } } };
      }
      if (i % 3000 === 0) {
        const back = migrate(JSON.parse(JSON.stringify(s)));
        if (!back) say('save would not load', `at step ${i}`);
        else s = back;
      }
    }
  }
}
console.log(`Refused (fine): ${[...refused].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(problems.size ? 'PROBLEMS:' : 'No problems.');
for (const [k, v] of problems) console.log(`  ${String(count.get(k)).padStart(6)}  ${k}   e.g. ${v}`);
