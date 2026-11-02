// Plays the Arena with the real rules, each class at each level and gear, and says how far it gets: the way its modes are balanced
// (Robin, 2026-11-02: "not too easy and can be exploited"; three modes, one super hard). The player heals when low and takes nothing: it always goes on.
//   node tools/sim-arena.ts [fights]

import { ABILITIES, apply, ARENA, CLASS_DATA, ITEMS, makeRng, newGame, plainGear, stats, type ClassId, type GameState, type GearLine } from '../rules/src/index.ts';
import type { Character } from '../rules/src/index.ts';

const N = Number(process.argv[2]) || 200;
const LINE: Record<string, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' };
const MONDAY = Date.UTC(2026, 10, 2, 12);
const SETUPS = [
  { name: 'Meadows L4', level: 4, spot: 'farrows', rank: 1, slots: 4, potion: 'potion', flasks: 3 },
  { name: 'Meadows L4 geared', level: 4, spot: 'farrows', rank: 1, slots: 8, potion: 'potion', flasks: 3 },
  { name: 'Meadows L12 back', level: 12, spot: 'farrows', rank: 3, slots: 8, potion: 'potion-3', flasks: 3 },
  { name: 'Meadows L12 flasks', level: 12, spot: 'farrows', rank: 3, slots: 8, potion: 'potion-3', flasks: 10 },
];

function start(classId: ClassId, s: (typeof SETUPS)[number]): GameState {
  const state = newGame({ seed: 'sim', player: 'p', name: 'Sim', classId });
  const cls = CLASS_DATA[classId]!;
  const g = s.level - 1;
  const equipment = { ...state.characters.p!.equipment };
  (['weapon', 'armour', 'helm', 'boots', 'shield', 'gloves', 'cape', 'trinket'] as const).slice(0, s.slots).forEach((slot, i) => {
    equipment[slot] = plainGear('g' + i, slot, s.rank, LINE[classId]!, classId);
  });
  const c: Character = { ...state.characters.p!, level: s.level, space: s.spot, steps: 0, gold: 1e6, equipment, maxHp: cls.hp + cls.growth.hp * g, maxMana: cls.mana + cls.growth.mana * g, attack: cls.attack + cls.growth.attack * g, defense: cls.defense + cls.growth.defense * g, items: { [s.potion]: s.flasks } };
  const st = stats(c);
  return { ...state, characters: { p: { ...c, hp: st.maxHp, mana: st.maxMana } } };
}

function choose(c: Character, potion: string): { move: unknown; guard: string } {
  const s = stats(c);
  if (c.hp / s.maxHp < 0.4 && (c.items[potion] ?? 0) > 0) return { move: { kind: 'item', item: potion }, guard: 'block' };
  const f = c.fight!;
  const usable = Object.keys(c.abilities).filter((id) => {
    const a = ABILITIES[id];
    if (!a || a.rule) return false;
    const rk = a.ranks[Math.min(c.abilities[id]!, a.ranks.length) - 1]!;
    return !rk.flee && c.mana >= (a.mana ?? 0) && !f.used?.includes(id) && (a.meter ?? 0) <= (f.meter ?? 0);
  });
  const pick = usable.length && c.mana / s.maxMana > 0.25 ? usable[0] : null;
  return { move: pick ? { kind: 'ability', ability: pick } : { kind: 'attack' }, guard: 'block' };
}

function run(classId: ClassId, s: (typeof SETUPS)[number], mode: string, seed: string): number {
  const rng = makeRng(seed);
  let state = apply(start(classId, s), { type: 'arena', id: 'e', player: 'p', op: 'enter', mode }, rng, MONDAY).state;
  let wave = 0;
  for (let i = 0; i < 400; i++) {
    const me = state.characters.p!;
    if (!me.arena) return wave;
    if (me.offer?.kind === 'arena') {
      wave = me.offer.wave;
      if (wave >= ARENA.waves.length) return wave;
      state = apply(state, { type: 'arena', id: 'n' + i, player: 'p', op: 'next' }, rng, MONDAY).state;
      continue;
    }
    if (!me.fight) return wave;
    const { move, guard } = choose(me, s.potion);
    let r = apply(state, { type: 'fight', id: 'r' + i, player: 'p', move, guard } as never, rng, MONDAY);
    if (r.events.some((e) => e.type === 'rejected')) r = apply(state, { type: 'fight', id: 'r' + i, player: 'p', move: { kind: 'attack' }, guard } as never, rng, MONDAY);
    state = r.state;
  }
  return wave;
}

for (const s of SETUPS) {
  console.log('\n' + s.name + '   share (percent) to beat wave 1..5, then the share who clear');
  for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
    const row = (Object.keys(ARENA.modes)).map((mode) => {
      const reached = [0, 0, 0, 0, 0];
      for (let i = 0; i < N; i++) {
        const w = run(classId, s, mode, classId + mode + s.name + i);
        for (let k = 0; k < w; k++) reached[k]! += 1;
      }
      return mode.slice(0, 4) + ' ' + reached.map((x) => String(Math.round((100 * x) / N)).padStart(3)).join(' ');
    });
    console.log(classId.padEnd(8) + row.join('  |  '));
  }
}
void ITEMS;
