// A balance look at the rules, no screen: bots play from Ashford under a plain policy and the bosses are fought level
// by level in plain gear of the rank. Pure and seeded, so a run repeats. Run: node tools/simulate.ts [turns] [seeds]
//
// It prints, per class: turns to each level, deaths, gold and gear, the first win over the Thornwood Warden and the
// Briar King; then the wall: the share of fights won against each boss at each level with the area's plain gear.

import {
  ABILITIES,
  apply,
  ENEMIES,
  ITEMS,
  makeRng,
  newGame,
  plainGear,
  reachable,
  SLOTS,
  stats,
  type Action,
  type Character,
  type ClassId,
  type FightMove,
  type GameState,
  type Guard,
  type Rng,
  type Slot,
} from '../rules/src/index.ts';

const TURNS = Number(process.argv[2] ?? 400);
const SEEDS = Number(process.argv[3] ?? 24);
const CLASSES: ClassId[] = ['warrior', 'rogue', 'mage', 'ranger'];
const P = 'bot';
const TURN_MS = 20_000; // a turn is a third of a minute, so a five-minute boss is back after fifteen turns

interface Run {
  classId: ClassId;
  seed: string;
  levelAt: Record<number, number>; // level -> the turn it was reached
  deaths: number;
  deathsByTier: Record<number, number>;
  fights: number;
  fightsByTier: Record<number, number>;
  roundsByTier: Record<number, number>;
  wardenTries: number;
  wardenWinTurn: number | null;
  briarTries: number;
  briarWinTurn: number | null;
  matriarchWinTurn: number | null;
  finalLevel: number;
  finalGold: number;
  gearWorn: number;
  turns: number;
  /** The share of HP left after each fight won, by tier, summed; divide by the wins. */
  hpLeftByTier: Record<number, number>;
  winsByTier: Record<number, number>;
  rests: number;
  stranded: boolean;
}

let actionId = 0;
const act = (type: string, extra: object = {}): Action => ({ type, id: `a${actionId++}`, player: P, ...extra }) as Action;

/** The fight policy: a potion when low, a charge when the enemy is stunned, the strongest affordable ability, else attack;
 * block a wind-up, brace when mana is short, otherwise counter. */
function fightMove(me: Character): { move: FightMove; guard: Guard } {
  const f = me.fight!;
  const e = f.enemy;
  const s = stats(me);
  let move: FightMove = { kind: 'attack' };
  if (me.hp < s.maxHp * 0.35 && (me.items.potion ?? 0) > 0) move = { kind: 'item', item: 'potion' };
  else if (!f.charged && e.stunned > 0) move = { kind: 'charge' };
  else {
    let best: { id: string; value: number } | null = null;
    for (const [id, rank] of Object.entries(me.abilities)) {
      const a = ABILITIES[id];
      if (!a || me.mana < a.mana) continue;
      const r = a.ranks[Math.min(rank, a.ranks.length) - 1]!;
      const value = (r.power ?? 0) * (r.hits ?? 1) + (r.stun && e.role === 'mob' ? 1.2 : 0) + (r.poison ? 1.0 : 0) + (r.weaken && e.role !== 'mob' ? 0.8 : 0);
      if (value > 1.05 && (!best || value > best.value)) best = { id, value };
    }
    if (best) move = { kind: 'ability', ability: best.id };
  }
  const guard: Guard = e.charged ? 'block' : s.dodge >= 0.1 ? 'dodge' : me.mana < 6 ? 'brace' : me.hp < s.maxHp * 0.5 ? 'block' : 'counter';
  return { move, guard };
}

/** Wear the best piece for each slot from the bag, by its one number. */
function tidy(state: GameState, rng: Rng, now: number): GameState {
  let s = state;
  for (;;) {
    const me = s.characters[P]!;
    const upgrade = me.bag.find((g) => {
      const worn = me.equipment[g.slot];
      const value = Object.values(g.stats)[0] ?? 0;
      const wornValue = worn ? (Object.values(worn.stats)[0] ?? 0) : -1;
      return value > wornValue;
    });
    if (!upgrade) return s;
    s = apply(s, act('equip', { gear: upgrade.id }), rng, now).state;
  }
}

/** At a shop or a town: plain gear for empty or outranked slots, a potion or two, and sell what is not worn. */
function shop(state: GameState, rng: Rng, now: number): GameState {
  let s = tidy(state, rng, now);
  const tier = s.board.areas[s.board.spaces[s.characters[P]!.space]!.area]!.tier;
  for (const slot of SLOTS) {
    const me = s.characters[P]!;
    const worn = me.equipment[slot];
    const price = plainGear('x', slot, tier).price;
    if ((!worn || worn.rank < tier) && me.gold >= price + 20) {
      s = apply(s, act('buy', { slot }), rng, now).state;
      s = tidy(s, rng, now);
    }
  }
  for (let i = 0; i < 2; i++) {
    const me = s.characters[P]!;
    if ((me.items.potion ?? 0) < 2 && me.gold >= ITEMS.potion!.price + 20) s = apply(s, act('buy', { item: 'potion' }), rng, now).state;
  }
  for (const g of [...s.characters[P]!.bag]) s = apply(s, act('sell', { gear: g.id }), rng, now).state;
  return s;
}

/** Where to walk: a boss when ready, a town when worn down, a shop when an upgrade is affordable, a giving spot, else the wilds of the right area. */
function choose(state: GameState, now: number): string[] {
  const me = state.characters[P]!;
  const s = stats(me);
  const options = reachable(state.board, me.space, me.steps, new Set(me.opened));
  const gearCount = SLOTS.filter((slot) => me.equipment[slot]).length;
  const bestTier = Math.max(...me.opened.map((a) => state.board.areas[a]!.tier));
  if (!options.length) return [];
  let best = options[0]!;
  let bestScore = -Infinity;
  for (const o of options) {
    const space = state.board.spaces[o.space]!;
    const area = state.board.areas[space.area]!;
    const cooling = (me.cooldowns[space.id] ?? 0) > now;
    let score = 0;
    switch (space.kind) {
      case 'boss': {
        const boss = ENEMIES[space.boss!]!;
        const ready = me.level >= boss.level && me.hp >= s.maxHp * 0.8 && gearCount >= 3;
        score = cooling ? -50 : ready ? 100 : -100;
        break;
      }
      case 'town':
        score = me.hp < s.maxHp * 0.5 || me.mana < s.maxMana * 0.4 ? 60 : 5;
        break;
      case 'shop': {
        const tier = area.tier;
        const wants = SLOTS.some((slot) => (!me.equipment[slot] || me.equipment[slot]!.rank < tier) && me.gold >= plainGear('x', slot, tier).price + 20);
        score = wants ? 50 : 0;
        break;
      }
      case 'chest':
      case 'potion':
        score = cooling ? 0 : 30;
        break;
      case 'spell':
        score = cooling ? 0 : 35;
        break;
      case 'normal':
        // The wilds of the highest open area the level is fit for; a higher one is a risk, a lower one a waste.
        score = 10 + (area.levels[0] <= me.level + 1 ? area.tier * 5 : -30) + (area.tier < bestTier && me.level > area.levels[1] + 1 ? -10 : 0);
        break;
    }
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best.path;
}

function simulate(classId: ClassId, seed: string, turns: number): Run {
  const rng = makeRng(seed);
  let state = newGame({ seed, player: P, name: 'Bot', classId });
  let now = 1_000_000;
  const run: Run = { classId, seed, levelAt: { 1: 0 }, deaths: 0, deathsByTier: {}, fights: 0, fightsByTier: {}, roundsByTier: {}, wardenTries: 0, wardenWinTurn: null, briarTries: 0, briarWinTurn: null, matriarchWinTurn: null, finalLevel: 1, finalGold: 0, gearWorn: 0, turns: 0, hpLeftByTier: {}, winsByTier: {}, rests: 0, stranded: false };
  let turn = 0;
  let fightTier = 1;
  for (let i = 0; i < turns * 30 && turn < turns; i++) {
    const me = state.characters[P]!;
    if (me.fight) {
      const { move, guard } = fightMove(me);
      const r = apply(state, act('fight', { move, guard }), rng, now);
      state = r.state;
      run.roundsByTier[fightTier] = (run.roundsByTier[fightTier] ?? 0) + 1;
      for (const e of r.events) {
        if (e.type === 'died') {
          run.deaths++;
          run.deathsByTier[fightTier] = (run.deathsByTier[fightTier] ?? 0) + 1;
        }
        if (e.type === 'won') {
          const after = r.state.characters[P]!;
          run.hpLeftByTier[fightTier] = (run.hpLeftByTier[fightTier] ?? 0) + after.hp / stats(after).maxHp;
          run.winsByTier[fightTier] = (run.winsByTier[fightTier] ?? 0) + 1;
          if (me.fight.enemy.id === 'thornwood-warden' && run.wardenWinTurn === null) run.wardenWinTurn = turn;
          if (me.fight.enemy.id === 'briar-king' && run.briarWinTurn === null) run.briarWinTurn = turn;
          if (me.fight.enemy.id === 'frost-matriarch' && run.matriarchWinTurn === null) run.matriarchWinTurn = turn;
        }
        if (e.type === 'levelled') run.levelAt[e.level] = turn;
      }
      continue;
    }
    if (me.offer) {
      state = apply(state, act('gamble', { choice: 'pass' }), rng, now).state;
      continue;
    }
    if (me.steps > 0) {
      const path = choose(state, now);
      if (!path.length) {
        run.stranded = true;
        break;
      }
      const r = apply(state, act('move', { path }), rng, now);
      state = r.state;
      if (r.events.some((e) => e.type === 'rested')) run.rests++;
      const fight = r.events.find((e) => e.type === 'fight');
      if (fight && fight.type === 'fight') {
        run.fights++;
        fightTier = state.board.areas[state.board.spaces[fight.space]!.area]!.tier;
        run.fightsByTier[fightTier] = (run.fightsByTier[fightTier] ?? 0) + 1;
        if (fight.enemy.id === 'thornwood-warden') run.wardenTries++;
        if (fight.enemy.id === 'briar-king') run.briarTries++;
      }
      continue;
    }
    // On the board, free: tidy the bag, shop if here, then roll.
    state = tidy(state, rng, now);
    const here = state.board.spaces[me.space]!;
    if (here.kind === 'shop' || here.kind === 'town') state = shop(state, rng, now);
    if (i % 3 === 0) state = apply(state, act('tick', { player: 'world' }), rng, now).state;
    state = apply(state, act('roll'), rng, now).state;
    turn++;
    now += TURN_MS;
  }
  const me = state.characters[P]!;
  run.finalLevel = me.level;
  run.finalGold = me.gold;
  run.gearWorn = SLOTS.filter((slot) => me.equipment[slot]).length;
  run.turns = turn;
  return run;
}

/** The wall: a fresh character of the level, in the plain gear of the rank, against the boss; the share of wins. */
function wall(classId: ClassId, boss: string, level: number, rank: number, seeds: number): { wins: number; rounds: number } {
  let wins = 0;
  let rounds = 0;
  for (let i = 0; i < seeds; i++) {
    const seed = `wall-${classId}-${boss}-${level}-${i}`;
    const rng = makeRng(seed);
    let state = newGame({ seed, player: P, name: 'Bot', classId });
    let me = state.characters[P]!;
    // Grow to the level by the class's growth, as levels would, and wear the plain gear.
    const growth = (await_import_classes(classId)).growth;
    me = { ...me, level, maxHp: me.maxHp + growth.hp * (level - 1), maxMana: me.maxMana + growth.mana * (level - 1), attack: me.attack + growth.attack * (level - 1), defense: me.defense + growth.defense * (level - 1) };
    const equipment = { ...me.equipment };
    if (rank > 0) for (const slot of SLOTS) equipment[slot] = plainGear(`w-${slot}`, slot, rank);
    me = { ...me, equipment, items: { potion: 2 } };
    const s = stats(me);
    me = { ...me, hp: s.maxHp, mana: s.maxMana };
    // Square up on the ring's boss spot by hand: the fight itself is what we measure.
    const enemyState = { ...state, characters: { [P]: { ...me, space: 'gate' } } };
    state = apply({ ...enemyState, characters: { [P]: { ...enemyState.characters[P]!, steps: 0 } } }, act('roll'), rng, 0).state; // spend nothing but keep the shape
    state = { ...state, characters: { [P]: { ...state.characters[P]!, steps: 0, fight: startFightOn(state, boss) } } };
    for (let r = 0; r < 60 && state.characters[P]!.fight; r++) {
      const { move, guard } = fightMove(state.characters[P]!);
      const res = apply(state, act('fight', { move, guard }), rng, 0);
      state = res.state;
      rounds++;
      if (res.events.some((e) => e.type === 'won')) wins++;
    }
  }
  return { wins, rounds };
}

// A tiny hand-made fight state, through the public surface: makeEnemy is exported; the Fight shape is public.
import { makeEnemy, CLASS_DATA } from '../rules/src/index.ts';
function startFightOn(state: GameState, boss: string) {
  return { enemy: makeEnemy(boss), round: 1, charged: false, attackUp: null, barrier: 0, evade: 0, space: 'gate', spawn: false };
}
function await_import_classes(classId: ClassId) {
  return CLASS_DATA[classId];
}

// ---- run ----------------------------------------------------------------------------------------------------------------

const median = (xs: number[]): number => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
};
const fmt = (n: number | null | undefined, w = 5): string => (n === null || n === undefined || Number.isNaN(n) ? '–' : String(Math.round(n))).padStart(w);

console.log(`Bots: ${SEEDS} seeds per class, ${TURNS} turns each (a turn is one roll).\n`);
console.log('class    | turns to level 2   3   4   5   6   7   8 | deaths/100t  by tier 1/2/3 | fights/100t rests/100t | rounds per fight t1/t2/t3 | HP left after a win t1/t2/t3 | Warden: tries  first win (turn)  beaten | Briar: tries  beaten | lvl  gold  gear stranded');
for (const classId of CLASSES) {
  const runs: Run[] = [];
  for (let i = 0; i < SEEDS; i++) runs.push(simulate(classId, `sim-${classId}-${i}`, TURNS));
  const lv = (l: number) => fmt(median(runs.filter((r) => r.levelAt[l] !== undefined).map((r) => r.levelAt[l]!)), 3) + (runs.filter((r) => r.levelAt[l] !== undefined).length < runs.length / 2 ? '*' : ' ');
  const total = (f: (r: Run) => number) => runs.reduce((a, r) => a + f(r), 0);
  const turnsAll = total((r) => r.turns);
  const per100 = (n: number) => fmt((n / turnsAll) * 100, 4);
  const deathsTier = [1, 2, 3].map((t) => total((r) => r.deathsByTier[t] ?? 0));
  const rounds = [1, 2, 3].map((t) => { const f = total((r) => r.fightsByTier[t] ?? 0); return f ? (total((r) => r.roundsByTier[t] ?? 0) / f).toFixed(1) : '–'; });
  const hpLeft = [1, 2, 3].map((t) => { const w = total((r) => r.winsByTier[t] ?? 0); return w ? `${Math.round((total((r) => r.hpLeftByTier[t] ?? 0) / w) * 100)}%` : '–'; });
  const stranded = runs.filter((r) => r.stranded).length;
  const wardenBeaten = runs.filter((r) => r.wardenWinTurn !== null).length;
  const briarBeaten = runs.filter((r) => r.briarWinTurn !== null).length;
  console.log(
    `${classId.padEnd(8)} | ${lv(2)} ${lv(3)} ${lv(4)} ${lv(5)} ${lv(6)} ${lv(7)} ${lv(8)} | ${per100(total((r) => r.deaths))}   ${deathsTier.join('/').padEnd(10)} | ${per100(total((r) => r.fights))}      ${per100(total((r) => r.rests))}    | ${rounds.join(' / ').padEnd(21)} | ${hpLeft.join(' / ').padEnd(26)} | ${fmt(total((r) => r.wardenTries), 5)}  ${fmt(median(runs.filter((r) => r.wardenWinTurn !== null).map((r) => r.wardenWinTurn!)), 8)}      ${String(wardenBeaten).padStart(2)}/${SEEDS} | ${fmt(total((r) => r.briarTries), 5)}  ${String(briarBeaten).padStart(2)}/${SEEDS} | ${fmt(median(runs.map((r) => r.finalLevel)), 3)} ${fmt(median(runs.map((r) => r.finalGold)), 5)} ${fmt(median(runs.map((r) => r.gearWorn)), 4)} ${String(stranded).padStart(4)}`,
  );
}
console.log('\n* fewer than half the bots got there.\n');

const WALLS: { boss: string; rank: number; levels: number[] }[] = [
  { boss: 'thornwood-warden', rank: 1, levels: [1, 2, 3, 4, 5, 6, 7, 8] },
  { boss: 'briar-king', rank: 2, levels: [5, 6, 7, 8, 9, 10, 11, 12] },
  { boss: 'frost-matriarch', rank: 3, levels: [9, 10, 11, 12, 13, 14, 15] },
];
const WALL_SEEDS = 60;
for (const w of WALLS) {
  const boss = ENEMIES[w.boss]!;
  console.log(`The wall: ${boss.name} (level ${boss.level}) against each class in plain ${['copper', 'iron', 'steel'][w.rank - 1]} gear with two potions. Wins in ${WALL_SEEDS} fights, by level:`);
  console.log(`class    | ${w.levels.map((l) => `L${l}`.padStart(5)).join(' ')}`);
  for (const classId of CLASSES) {
    const cells = w.levels.map((l) => { const r = wall(classId, w.boss, l, w.rank, WALL_SEEDS); return `${Math.round((r.wins / WALL_SEEDS) * 100)}%`.padStart(5); });
    console.log(`${classId.padEnd(8)} | ${cells.join(' ')}`);
  }
  const bare = CLASSES.map((c) => `${c} ${Math.round((wall(c, w.boss, boss.level, 0, WALL_SEEDS).wins / WALL_SEEDS) * 100)}%`).join(', ');
  console.log(`  at the boss's own level with no gear at all: ${bare}\n`);
}
