// Enemies that ask for the guard choice (Robin, 2026-10-31): the next move shown a round ahead, moves with effects
// (poison, drain, armour, evade, heal, weaken), and bosses with a second phase.
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/data.ts';
import { makeEnemy, startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { generateArea } from '../src/generate.ts';
import { makeUnique } from '../src/gear.ts';
import { makeRng } from '../src/rng.ts';
import type { Action, Character, ClassId, Enemy, EnemyMove, FightMove, GameEvent, GameState, Guard } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const turn = (move: FightMove, guard: Guard = 'none', id = 'f1'): Action => ({ type: 'fight', id, player: P, move, guard });
const attack: FightMove = { kind: 'attack' };
const me = (s: GameState): Character => s.characters[P]!;
const fight = (s: GameState) => me(s).fight!;
const hits = (events: GameEvent[], by: 'player' | 'enemy') => events.filter((e): e is Extract<GameEvent, { type: 'hit' }> => e.type === 'hit' && e.by === by);

function versus(classId: ClassId, enemy: string, patch: Partial<Character> = {}, enemyPatch: Partial<Enemy> = {}, fightPatch: object = {}): GameState {
  const s = newGame({ seed: 'foe', player: P, name: 'Robin', classId, board: ringBoard() });
  const c = startFight({ ...me(s), equipment: held(me(s)), space: 's1', ...patch }, enemy, 's1', false);
  c.fight = { ...c.fight!, ...fightPatch, enemy: { ...c.fight!.enemy, ...enemyPatch } };
  return { ...s, characters: { [P]: c } };
}
const mv = (name: string, power: number, effect?: EnemyMove['effect'], charge?: boolean): EnemyMove => ({ name, power, weight: 1, ...(effect ? { effect } : {}), ...(charge ? { charge } : {}) });

describe('the enemy tells its next move', () => {
  it('from the start of a fight on the board, and at the end of every round; the round after uses it', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
    const ready = { ...s, characters: { [P]: { ...me(s), steps: 1 } }, die: { ...s.die, last: 1 } };
    const began = apply(ready, { type: 'move', id: 'm', player: P, path: ['s1'] }, makeRng('ashford'), NOW);
    const fightEvent = began.events.findIndex((e) => e.type === 'fight');
    expect(began.events[fightEvent + 1]).toMatchObject({ type: 'intent', move: 'Splat', effect: null, charge: false });
    expect(fight(began.state).enemy.next).toEqual({ name: 'Splat', power: 1, weight: 1 });
    // A wolf with two moves: what the intent names is what lands next round.
    let state = versus('warrior', 'wolf', { hp: 1000, maxHp: 1000 }, { hp: 5000 });
    const rng = makeRng('wolf');
    for (let i = 0; i < 6; i++) {
      const r = apply(state, turn(attack, 'none', `f${i}`), rng, NOW);
      const intent = r.events.find((e) => e.type === 'intent');
      expect(intent).toBeDefined();
      const told = fight(r.state).enemy.next!.name;
      const next = apply(r.state, turn(attack, 'none', `g${i}`), rng, NOW);
      const landed = hits(next.events, 'enemy')[0];
      if (landed) expect(landed.move).toBe(told);
      state = next.state;
    }
  });

  it('a wind-up is told as one, and its landing as the heavy blow to block', () => {
    const alpha = versus('warrior', 'wolf-alpha', { hp: 1000, maxHp: 1000 }, { hp: 5000, next: mv('Howl', 2, undefined, true) });
    const wound = apply(alpha, turn(attack), makeRng('x'), NOW);
    expect(wound.events).toContainEqual(expect.objectContaining({ type: 'charged', by: 'enemy', move: 'Howl' }));
    const intent = wound.events.find((e) => e.type === 'intent');
    expect(intent).toMatchObject({ type: 'intent', move: 'Howl', charge: true });
    const landed = apply(wound.state, turn(attack, 'block', 'f2'), makeRng('x'), NOW);
    expect(hits(landed.events, 'enemy')[0]).toMatchObject({ move: 'Howl' });
  });
});

describe("the enemies' effects", () => {
  it('poison bites the player at the end of each round for three rounds; Kettle Hat shrugs it off', () => {
    const bitten = apply(versus('warrior', 'spider', {}, { hp: 5000, next: mv('Venom Bite', 0.8, 'poison') }), turn(attack), makeRng('x'), NOW);
    expect(bitten.events).toContainEqual(expect.objectContaining({ type: 'effect', target: 'player', kind: 'poison', rounds: 3 }));
    expect(fight(bitten.state).poisoned).toEqual({ rounds: 2, damage: 6 });
    expect(bitten.events).toContainEqual(expect.objectContaining({ type: 'poisoned', target: 'player', damage: 6 }));
    const helmed = versus('warrior', 'spider', { equipment: { shield: null, gloves: null, cape: null, weapon: null, armour: null, helm: makeUnique('h', 'ironbrow', 1, makeRng('u')), boots: null, trinket: null } }, { hp: 5000, next: mv('Venom Bite', 0.8, 'poison') });
    const shrugged = apply(helmed, turn(attack), makeRng('x'), NOW);
    expect(shrugged.events).toContainEqual(expect.objectContaining({ type: 'resisted', kind: 'poison' }));
    expect(fight(shrugged.state).poisoned).toBeNull();
  });

  it('a drain takes mana; a weakening softens the next hits; a hardening thickens the hide; a fade makes the next hit miss; a heal mends', () => {
    const drained = apply(versus('mage', 'wisp', {}, { hp: 5000, next: mv('Siphon', 0.7, 'drain') }), turn(attack), makeRng('x'), NOW);
    expect(drained.events).toContainEqual(expect.objectContaining({ type: 'drained', mana: 6, left: 34 }));
    const weak = apply(versus('warrior', 'spider-queen', { attack: 60 }, { hp: 5000, next: mv('Web', 0, 'weaken') }), turn(attack), makeRng('x'), NOW);
    expect(weak.events).toContainEqual(expect.objectContaining({ type: 'effect', target: 'player', kind: 'weakened', rounds: 2 }));
    expect(hits(weak.events, 'enemy')).toHaveLength(0); // a move that is all effect strikes no blow
    expect(fight(weak.state).weak).toEqual({ rounds: 2, mult: 0.7 });
    const softer = hits(apply(weak.state, turn(attack, 'none', 'f2'), makeRng('y'), NOW).events, 'player')[0]!;
    expect(softer.damage).toBeLessThanOrEqual(Math.round(60 * 1.12 * 0.7) - 5 + 2);
    const hard = apply(versus('warrior', 'ice-golem', { attack: 60 }, { hp: 5000, next: mv('Harden', 0, 'armour') }), turn(attack), makeRng('x'), NOW);
    expect(fight(hard.state).enemy.armoured).toEqual({ rounds: 1, mult: 1.5 });
    const dented = hits(apply(hard.state, turn(attack, 'none', 'f2'), makeRng('y'), NOW).events, 'player')[0]!;
    if (!dented.crit) expect(dented.damage).toBeLessThanOrEqual(Math.round(60 * 1.12) - 13 + 2);
    const faded = apply(versus('warrior', 'wraith', {}, { hp: 5000, next: mv('Fade', 0, 'evade') }), turn(attack), makeRng('x'), NOW);
    expect(fight(faded.state).enemy.evade).toBe(1);
    const swing = apply(faded.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(swing.events[0]).toMatchObject({ type: 'missed', by: 'player' });
    const mended = apply(versus('warrior', 'treant', {}, { hp: 500, maxHp: 1000, next: mv('Regrow', 0, 'heal') }), turn(attack), makeRng('x'), NOW);
    expect(mended.events).toContainEqual(expect.objectContaining({ type: 'enemyHealed', amount: 100 }));
  });

  it('every hand-laid family has a move with something to read, and the grown shapes too', () => {
    const withEffect = Object.entries(ENEMIES).filter(([, e]) => e.moves.some((m) => m.effect || m.charge)).map(([id]) => id);
    expect(withEffect.length).toBeGreaterThanOrEqual(13);
    for (const [id, e] of Object.entries(ENEMIES)) for (const m of e.moves) if (m.effect) expect(['poison', 'drain', 'armour', 'evade', 'heal', 'weaken'], `${id} ${m.name}`).toContain(m.effect);
  });
});

describe('a boss\'s second phase', () => {
  it('begins under half HP with a line and new moves, once; the Briar King regrows, the Matriarch freezes over', () => {
    const warden = versus('warrior', 'thornwood-warden', { attack: 40 }, { hp: 251, next: mv('Club', 1) });
    const r = apply(warden, turn(attack), makeRng('x'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'phase', text: ENEMIES['thornwood-warden']!.phase2!.text }));
    const e = fight(r.state).enemy;
    expect(e.phase).toBe(2);
    expect(e.moves.map((m) => m.name)).toContain('Acid Splash');
    const again = apply(r.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(again.events.some((ev) => ev.type === 'phase')).toBe(false);
    expect(ENEMIES['briar-king']!.phase2!.moves.some((m) => m.effect === 'heal')).toBe(true);
    expect(ENEMIES['frost-matriarch']!.phase2!.moves.some((m) => m.effect === 'armour')).toBe(true);
    expect(makeEnemy('slime').phase2).toBeNull();
  });

  it('a grown boss rages in its theme\'s way', () => {
    const tyrant = generateArea('ashford', 1).bestiary['g1-boss']!;
    expect(tyrant.phase2).toMatchObject({ at: 0.5, text: 'Lord Ripplefin calls the lake to rise!' });
    expect(tyrant.phase2!.moves.map((m) => m.name)).toEqual(['Claw', 'Fury', 'Undertow']);
    const queen = generateArea('ashford', 6).bestiary['g6-boss']!; // the Thornhollow Wilds: the Briar Queen regrows
    expect(queen.phase2!.moves.some((m) => m.effect === 'heal')).toBe(true);
  });
});

describe("the bosses' tricks (Robin, 2026-11-02)", () => {
  const P = 'p1';
  const NOW2 = 1_000_000;
  const fightIn = (boss: string, rounds = 1): GameState => {
    const s = newGame({ seed: 'tricks', player: P, name: 'Robin', classId: 'warrior' });
    const c = startFight({ ...s.characters[P]!, attack: 1, hp: 90000, maxHp: 90000 }, boss, 'pass', false);
    return { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, round: rounds, enemy: { ...c.fight!.enemy, hp: Math.round(c.fight!.enemy.maxHp / 2) } } } } };
  };
  const go = (s: GameState) => apply(s, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'block' } as never, makeRng('t'), NOW2);
  it('every great boss has one and says so, King Goo and Old Rootbeard too since 2026-11-03', () => {
    for (const id of ['thornwood-warden', 'old-rootbeard', 'briar-king', 'frost-matriarch', 'mother-murk', 'frostbeard', 'bogsnapper', 'old-bighorn']) expect(makeEnemy(id).trick?.text, id).toBeTruthy();
    expect(makeEnemy('old-rootbeard').phase2).toBeTruthy();
  });
  it('Grumblebark regrows, unless it burns', () => {
    const r = go(fightIn('briar-king'));
    expect(r.events.some((e) => e.type === 'enemyHealed')).toBe(true);
    const s = fightIn('briar-king');
    const c = s.characters[P]!;
    const burning = { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, burn: { rounds: 5, damage: 1 } } } } } };
    expect(go(burning).events.some((e) => e.type === 'enemyHealed')).toBe(false);
  });
  it("Queen Bumble's stings grow with the rounds, up to a limit", () => {
    const base = makeEnemy('frost-matriarch').attack;
    expect(go(fightIn('frost-matriarch', 5)).state.characters[P]!.fight!.enemy.attack).toBeGreaterThan(base);
    expect(go(fightIn('frost-matriarch', 90)).state.characters[P]!.fight!.enemy.attack).toBeLessThanOrEqual(Math.round(base * 1.6));
  });
  it('Old Mother Murk poisons, and Bogsnapper weakens, on their rounds only', () => {
    expect(go(fightIn('mother-murk', 3)).state.characters[P]!.fight!.poisoned).toBeTruthy();
    expect(go(fightIn('mother-murk', 2)).events.some((e) => e.type === 'trick')).toBe(false);
    expect(go(fightIn('bogsnapper', 3)).state.characters[P]!.fight!.weak).toBeTruthy();
  });
  it('Frostbeard hardens on his round; Old Bighorn winds up on his', () => {
    expect(go(fightIn('frostbeard', 4)).state.characters[P]!.fight!.enemy.armoured).toBeTruthy();
    expect(go(fightIn('old-bighorn', 3)).state.characters[P]!.fight!.enemy.next?.charge).toBe(true);
  });
});

/** What the class holds at the start, its numbers taken off: the skills tied to a weapon work, the old sums still hold (2026-11-03). */
function held(c: Character): Character['equipment'] {
  return Object.fromEntries(Object.entries(c.equipment).map(([slot, g]) => [slot, g ? { ...g, stats: {}, affixes: [] } : null])) as Character['equipment'];
}
