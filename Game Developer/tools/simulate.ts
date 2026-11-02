// A balance look at the rules, no screen: bots play from Puddlewick Village under a plain policy and the bosses are fought level
// by level in plain gear of the rank. Pure and seeded, so a run repeats. Run: node tools/simulate.ts [turns] [seeds]
//
// It prints, per class: turns to each level, deaths, gold and gear, the first win over the King Goo, the
// Grumblebark and the Queen Bumble, how far into the grown areas the bots get; then the wall: the share of fights won
// against each boss, hand-laid and grown, at each level with the area's plain gear.

import {
  ABILITIES,
  apply,
  creature,
  ENEMIES,
  generateArea,
  ITEMS,
  makeRng,
  newGame,
  plainGear,
  rankName,
  reachable,
  SLOTS,
  stats,
  type Action,
  type Character,
  type ClassId,
  type EnemyData,
  type FightMove,
  type GameState,
  type Guard,
  type Rng,
  type Slot,
} from '../rules/src/index.ts';

/** Which gear a bot of each class buys. */
const LINE_OF: Record<ClassId, 'heavy' | 'light' | 'magic'> = { warrior: 'heavy', rogue: 'light', mage: 'magic', ranger: 'light' };


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
  /** The highest tier opened, and the turn each grown area was opened. */
  topTier: number;
  openedAt: Record<string, number>;
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
  const flask = ['potion-3', 'potion-2', 'potion'].find((id) => (me.items[id] ?? 0) > 0);
  if (me.hp < s.maxHp * 0.35 && flask) move = { kind: 'item', item: flask };
  else if (!f.charged && e.stunned > 0) move = { kind: 'charge' };
  else {
    let best: { id: string; value: number } | null = null;
    for (const [id, rank] of Object.entries(me.abilities)) {
      const a = ABILITIES[id];
      if (!a || me.mana < a.mana) continue;
      if (a.meter && f.meter < a.meter) continue;
      if (a.meterAll && f.meter < 3) continue;
      if (a.oncePerFight && f.used.includes(id)) continue;
      if (f.windup) continue; // one spell in the air at a time is enough
      const r = a.ranks[Math.min(rank, a.ranks.length) - 1]!;
      const low = e.hp < e.maxHp * (r.executeBelow ?? 0);
      let value = (low && r.executePower ? r.executePower : (r.power ?? 0)) * (r.hits ?? 1) + (r.perMeter ?? 0) * f.meter;
      value += (r.stun && e.role === 'mob' ? 1.2 : 0) + (r.poison ? 1.0 : 0) + (r.weaken && e.role !== 'mob' ? 0.8 : 0) + (r.skip ? 1.5 : 0) + (r.mark && !f.mark ? 1.2 : 0) + (r.companion && !f.companion ? 1.4 : 0);
      value += r.healShare && me.hp < s.maxHp * 0.6 ? 2 : 0;
      value += (r.barrierShare || r.barrierPerMana) && me.hp < s.maxHp * 0.5 && !f.barrier ? 1.3 : 0;
      value += r.trap && !f.trap && e.role !== 'mob' ? 1.1 : 0;
      value += r.windup ? 0.6 : 0; // a meteor two rounds out is worth less than its power says
      value += r.steal ? 0.5 : 0;
      if (value > 1.05 && (!best || value > best.value)) best = { id, value };
    }
    if (best) move = { kind: 'ability', ability: best.id };
  }
  // The intent is shown a round ahead: block the heavy blow, step aside from a move that carries an effect, else as before.
  const guard: Guard = e.charged ? 'block' : e.next?.effect && e.next.power > 0 ? 'dodge' : s.dodge >= 0.1 ? 'dodge' : me.mana < 6 ? 'brace' : me.hp < s.maxHp * 0.5 ? 'block' : 'counter';
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
    const line = LINE_OF[me.classId];
    const price = plainGear('x', slot, tier, line, me.classId).price;
    if ((!worn || worn.rank < tier) && me.gold >= price + 20) {
      s = apply(s, act('buy', { slot, line }), rng, now).state;
      s = tidy(s, rng, now);
    }
  }
  for (let i = 0; i < 2; i++) {
    const me = s.characters[P]!;
    const potion = tier >= 3 ? 'potion-3' : tier === 2 ? 'potion-2' : 'potion';
    if ((me.items[potion] ?? 0) < 2 && me.gold >= ITEMS[potion]!.price + 20) s = apply(s, act('buy', { item: potion }), rng, now).state;
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
        const boss = creature(space.boss!, state.board.bestiary)!;
        const ready = me.level >= boss.level && me.hp >= s.maxHp * 0.8 && gearCount >= 3;
        score = cooling ? -50 : ready ? 100 : -100;
        break;
      }
      case 'town':
      case 'church':
        score = me.hp < s.maxHp * 0.5 || me.mana < s.maxMana * 0.4 ? 60 : 5;
        break;
      case 'shop': {
        const tier = area.tier;
        if ((space.stock ?? 'arms') !== (me.classId === 'mage' ? 'magic' : 'arms')) {
          score = 0;
          break;
        }
        const wants = SLOTS.some((slot) => (!me.equipment[slot] || me.equipment[slot]!.rank < tier) && me.gold >= plainGear('x', slot, tier).price + 20);
        score = wants ? 50 : 0;
        break;
      }
      case 'chest':
      case 'potion':
        score = cooling || (space.locked && !(me.keys[space.area] ?? 0)) ? 0 : 30;
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
  const run: Run = { classId, seed, levelAt: { 1: 0 }, deaths: 0, deathsByTier: {}, fights: 0, fightsByTier: {}, roundsByTier: {}, wardenTries: 0, wardenWinTurn: null, briarTries: 0, briarWinTurn: null, matriarchWinTurn: null, topTier: 1, openedAt: {}, finalLevel: 1, finalGold: 0, gearWorn: 0, turns: 0, hpLeftByTier: {}, winsByTier: {}, rests: 0, stranded: false };
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
        if (e.type === 'opened') {
          run.openedAt[e.area] = turn;
          run.topTier = Math.max(run.topTier, r.state.board.areas[e.area]?.tier ?? 0);
        }
        if (e.type === 'levelled') run.levelAt[e.level] = turn;
      }
      continue;
    }
    if (me.picks.length) {
      // A level's pick takes an ability not yet known first.
      const options = me.picks[0]!;
      state = apply(state, act('pick', { ability: options.find((a) => !me.abilities[a]) ?? options[0]! }), rng, now).state;
      continue;
    }
    if (me.offer) {
      // The gambler is waved on, an errand taken, a piece with no room in the bag sold.
      const answer: Action = me.offer.kind === 'roll' ? act('try') : me.offer.kind === 'gamble' ? act('gamble', { choice: 'pass' }) : me.offer.kind === 'board' ? act('quest', { accept: me.offer.quests.length > 0 }) : act('keep', { choice: 'sell' });
      state = apply(state, answer, rng, now).state;
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
function wall(classId: ClassId, boss: string, level: number, rank: number, seeds: number, bestiary: Record<string, EnemyData> = {}): { wins: number; rounds: number } {
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
    if (rank > 0) for (const slot of SLOTS) equipment[slot] = plainGear(`w-${slot}`, slot, rank, LINE_OF[classId], classId);
    // The kit a character of the level would have: every ability of the class, ranked by the level (picks and shrines).
    const kitRank = level >= 16 ? 3 : level >= 8 ? 2 : 1;
    const abilities = Object.fromEntries(Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === classId).map((a) => [a, kitRank]));
    me = { ...me, equipment, items: { [rank >= 3 ? "potion-3" : rank === 2 ? "potion-2" : "potion"]: 2 }, abilities };
    const s = stats(me);
    me = { ...me, hp: s.maxHp, mana: s.maxMana };
    // Square up on the ring's boss spot by hand: the fight itself is what we measure.
    const enemyState = { ...state, characters: { [P]: { ...me, space: 'gate' } } };
    state = apply({ ...enemyState, characters: { [P]: { ...enemyState.characters[P]!, steps: 0 } } }, act('roll'), rng, 0).state; // spend nothing but keep the shape
    state = { ...state, characters: { [P]: { ...state.characters[P]!, steps: 0, fight: startFightOn(boss, bestiary) } } };
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
import { makeEnemy, freshFight, CLASS_DATA } from '../rules/src/index.ts';
function startFightOn(boss: string, bestiary: Record<string, EnemyData>) {
  return freshFight(makeEnemy(boss, bestiary), 'gate', false);
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
const TIERS = [1, 2, 3, 4, 5, 6];
console.log('class    | turns to level 2   3   4   5   6   7   8  10  14  18 | deaths/100t  by tier 1..6 | fights/100t rests/100t | rounds per fight t1..t6 | HP left after a win t1..t6 | King Goo: tries  first win (turn)  beaten | Briar: tries  beaten | Queen Bumble beaten (turn) | top tier  gen-1  gen-2  gen-3 (turn) | lvl  gold  gear stranded');
for (const classId of CLASSES) {
  const runs: Run[] = [];
  for (let i = 0; i < SEEDS; i++) runs.push(simulate(classId, `sim-${classId}-${i}`, TURNS));
  const lv = (l: number) => fmt(median(runs.filter((r) => r.levelAt[l] !== undefined).map((r) => r.levelAt[l]!)), 3) + (runs.filter((r) => r.levelAt[l] !== undefined).length < runs.length / 2 ? '*' : ' ');
  const total = (f: (r: Run) => number) => runs.reduce((a, r) => a + f(r), 0);
  const turnsAll = total((r) => r.turns);
  const per100 = (n: number) => fmt((n / turnsAll) * 100, 4);
  const deathsTier = TIERS.map((t) => total((r) => r.deathsByTier[t] ?? 0));
  const rounds = TIERS.map((t) => { const f = total((r) => r.fightsByTier[t] ?? 0); return f ? (total((r) => r.roundsByTier[t] ?? 0) / f).toFixed(1) : '–'; });
  const hpLeft = TIERS.map((t) => { const w = total((r) => r.winsByTier[t] ?? 0); return w ? `${Math.round((total((r) => r.hpLeftByTier[t] ?? 0) / w) * 100)}%` : '–'; });
  const stranded = runs.filter((r) => r.stranded).length;
  const wardenBeaten = runs.filter((r) => r.wardenWinTurn !== null).length;
  const briarBeaten = runs.filter((r) => r.briarWinTurn !== null).length;
  const matriarchBeaten = runs.filter((r) => r.matriarchWinTurn !== null).length;
  const openedTurn = (area: string) => { const got = runs.filter((r) => r.openedAt[area] !== undefined); return `${String(got.length).padStart(2)}/${SEEDS}${got.length ? `@${fmt(median(got.map((r) => r.openedAt[area]!)), 1)}` : ''}`; };
  console.log(
    `${classId.padEnd(8)} | ${lv(2)} ${lv(3)} ${lv(4)} ${lv(5)} ${lv(6)} ${lv(7)} ${lv(8)} ${lv(10)} ${lv(14)} ${lv(18)} | ${per100(total((r) => r.deaths))}   ${deathsTier.join('/').padEnd(14)} | ${per100(total((r) => r.fights))}      ${per100(total((r) => r.rests))}    | ${rounds.join('/').padEnd(27)} | ${hpLeft.join('/').padEnd(29)} | ${fmt(total((r) => r.wardenTries), 5)}  ${fmt(median(runs.filter((r) => r.wardenWinTurn !== null).map((r) => r.wardenWinTurn!)), 8)}      ${String(wardenBeaten).padStart(2)}/${SEEDS} | ${fmt(total((r) => r.briarTries), 5)}  ${String(briarBeaten).padStart(2)}/${SEEDS} | ${String(matriarchBeaten).padStart(2)}/${SEEDS} ${fmt(median(runs.filter((r) => r.matriarchWinTurn !== null).map((r) => r.matriarchWinTurn!)), 6)} | ${fmt(median(runs.map((r) => r.topTier)), 4)}  ${openedTurn('gen-1').padEnd(10)} ${openedTurn('gen-2').padEnd(10)} ${openedTurn('gen-3').padEnd(10)} | ${fmt(median(runs.map((r) => r.finalLevel)), 3)} ${fmt(median(runs.map((r) => r.finalGold)), 5)} ${fmt(median(runs.map((r) => r.gearWorn)), 4)} ${String(stranded).padStart(4)}`,
  );
}
console.log('\n* fewer than half the bots got there.\n');

// The grown areas' creatures come from the generator, for the seed the bots play on; the first three are tiers 4 to 6.
const grownBestiary: Record<string, EnemyData> = {};
for (let n = 1; n <= 3; n++) Object.assign(grownBestiary, generateArea('sim', n).bestiary);
const WALLS: { boss: string; rank: number; levels: number[] }[] = [
  { boss: 'thornwood-warden', rank: 1, levels: [1, 2, 3, 4, 5, 6, 7, 8] },
  { boss: 'briar-king', rank: 2, levels: [5, 6, 7, 8, 9, 10, 11, 12] },
  { boss: 'frost-matriarch', rank: 3, levels: [9, 10, 11, 12, 13, 14, 15] },
  { boss: 'g1-boss', rank: 4, levels: [13, 14, 15, 16, 17, 18, 19, 20] },
  { boss: 'g2-boss', rank: 5, levels: [17, 18, 19, 20, 21, 22, 23, 24] },
  { boss: 'g3-boss', rank: 6, levels: [21, 22, 23, 24, 25, 26, 27, 28] },
];
const WALL_SEEDS = 60;
for (const w of WALLS) {
  const boss = creature(w.boss, grownBestiary)!;
  console.log(`The wall: ${boss.name} (level ${boss.level}, tier ${w.rank}) against each class in plain ${rankName(w.rank).toLowerCase()} gear with two potions. Wins in ${WALL_SEEDS} fights, by level:`);
  console.log(`class    | ${w.levels.map((l) => `L${l}`.padStart(5)).join(' ')}`);
  for (const classId of CLASSES) {
    const cells = w.levels.map((l) => { const r = wall(classId, w.boss, l, w.rank, WALL_SEEDS, grownBestiary); return `${Math.round((r.wins / WALL_SEEDS) * 100)}%`.padStart(5); });
    console.log(`${classId.padEnd(8)} | ${cells.join(' ')}`);
  }
  const bare = CLASSES.map((c) => `${c} ${Math.round((wall(c, w.boss, boss.level, 0, WALL_SEEDS, grownBestiary).wins / WALL_SEEDS) * 100)}%`).join(', ');
  console.log(`  at the boss's own level with no gear at all: ${bare}\n`);
}
