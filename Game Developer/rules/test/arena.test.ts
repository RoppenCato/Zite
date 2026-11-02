import { describe, expect, it } from 'vitest';
import { migrate } from '../src/save.ts';
import { apply, ARENA, arenaFee, CALENDAR, isOn, makeRng, newGame, weekday, type GameState } from '../src/index.ts';

// 2026-11-02 at noon was a Monday; the 3rd a Tuesday.
const MONDAY = Date.UTC(2026, 10, 2, 12);
const TUESDAY = Date.UTC(2026, 10, 3, 12);
const P = 'p1';

function at(gold = 5000, hp = 100000): GameState {
  const s = newGame({ seed: 'arena', player: P, name: 'Robin', classId: 'warrior' });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space: 'farrows', steps: 0, gold, hp, attack: 100000 } } };
}
const act = (s: GameState, op: 'enter' | 'next' | 'take' | 'test', now = MONDAY, mode = 'normal') => apply(s, { type: 'arena', id: op + Math.random(), player: P, op, mode }, makeRng(op), now);
/** Strike until the fight is over. */
function fightOut(s: GameState): GameState {
  let at_ = s;
  for (let i = 0; i < 60 && at_.characters[P]!.fight; i++) {
    at_ = { ...at_, characters: { [P]: { ...at_.characters[P]!, fight: { ...at_.characters[P]!.fight!, enemy: { ...at_.characters[P]!.fight!.enemy, hp: 1 } } } } };
    at_ = apply(at_, { type: 'fight', id: 'f' + i, player: P, move: { kind: 'attack' }, guard: 'block' } as never, makeRng('f' + i), MONDAY).state;
  }
  return at_;
}

describe('the week (Robin, 2026-11-02)', () => {
  it('knows the day, and which days an event is on', () => {
    expect(weekday(MONDAY)).toBe(0);
    expect(weekday(TUESDAY)).toBe(1);
    expect(isOn('arena', MONDAY)).toBe(CALENDAR.events.arena!.days.includes(0));
    expect(isOn('arena', TUESDAY)).toBe(CALENDAR.events.arena!.days.includes(1));
  });
});

describe('the Arena (Robin, 2026-11-02)', () => {
  it('a save from before it keeps its character and gains the spot', () => {
    const now = at(777);
    const spaces = { ...now.board.spaces, farrows: { ...now.board.spaces.farrows!, kind: 'normal' as const, name: 'Far Rows' } };
    const old = { ...now, version: 23, board: { ...now.board, spaces } };
    const up = migrate(JSON.parse(JSON.stringify(old)));
    expect(up).not.toBeNull();
    expect(up!.version).toBe(36);
    expect(up!.characters[P]!.gold).toBe(777);
    expect(up!.board.spaces.farrows).toMatchObject({ kind: 'arena', name: 'The Arena' });
  });
  it('opens only on its days, only at its spot, for its fee', () => {
    expect(act(at(), 'enter', TUESDAY).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    const away = at();
    expect(act({ ...away, characters: { [P]: { ...away.characters[P]!, space: 'millford' } } }, 'enter').events[0]).toMatchObject({ type: 'rejected' });
    expect(act(at(1), 'enter').events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
    const s = at();
    const r = act(s, 'enter');
    const me = r.state.characters[P]!;
    expect(me.fight).toBeTruthy();
    expect(me.gold).toBe(5000 - arenaFee(s.board, 'meadows'));
    expect(me.arena).toEqual({ mode: 'normal', wave: 1, gold: 0, xp: 0, flasks: 0 });
  });
  it('each way is once a day, and is used by going in', () => {
    const s = act(at(), 'enter').state;
    const left: GameState = { ...s, characters: { [P]: { ...s.characters[P]!, fight: null, arena: undefined } } };
    expect(act(left, 'enter').events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    expect(act(left, 'enter', MONDAY, 'hard').state.characters[P]!.fight).toBeTruthy();
    const nextWeek = MONDAY + 7 * 86_400_000;
    expect(act(left, 'enter', nextWeek).state.characters[P]!.fight).toBeTruthy();
  });
  it('fights to the fighter: coming back strong does not make it easy, and harder ways hit harder', () => {
    const low = act(at(), 'enter').state.characters[P]!.fight!.enemy;
    const base = at();
    const strong: GameState = { ...base, characters: { [P]: { ...base.characters[P]!, level: 30 } } };
    const high = act(strong, 'enter').state.characters[P]!.fight!.enemy;
    expect(high.level).toBe(30);
    expect(high.attack).toBeGreaterThan(low.attack);
    const hard = act(at(), 'enter', MONDAY, 'nightmare').state.characters[P]!.fight!.enemy;
    expect(hard.attack).toBeGreaterThan(low.attack);
    expect(hard.maxHp).toBeGreaterThan(low.maxHp);
    expect(hard.gold).toBeGreaterThan(low.gold);
  });
  it('a win goes in the pot, nothing paid until it is taken', () => {
    const entered = act(at(), 'enter').state;
    const won = fightOut(entered);
    const me = won.characters[P]!;
    expect(me.gold).toBe(entered.characters[P]!.gold);
    expect(me.offer).toMatchObject({ kind: 'arena', wave: 1, total: ARENA.waves.length });
    expect(me.arena!.gold).toBeGreaterThan(0);
    const taken = act(won, 'take').state.characters[P]!;
    expect(taken.gold).toBe(me.gold + me.arena!.gold);
    expect(taken.arena).toBeUndefined();
    expect(taken.offer).toBeNull();
  });
  it('going on grows the wave; the last ends with a piece and no next', () => {
    let s = act(at(), 'enter').state;
    for (let w = 1; w <= ARENA.waves.length; w++) {
      s = fightOut(s);
      expect(s.characters[P]!.offer).toMatchObject({ kind: 'arena', wave: w, gear: w >= ARENA.gearFrom });
      if (w < ARENA.waves.length) s = act(s, 'next').state;
    }
    expect(s.characters[P]!.fight).toBeNull();
    expect(act(s, 'next').events[0]).toMatchObject({ type: 'rejected' });
    const r = act(s, 'take');
    expect(r.events.some((e) => e.type === 'loot' || e.type === 'offer')).toBe(true);
  });
  it('no more than its flasks in a run', () => {
    const s = act(at(), 'enter').state;
    const me = s.characters[P]!;
    const full: GameState = { ...s, characters: { [P]: { ...me, items: { potion: 9 }, arena: { ...me.arena!, flasks: ARENA.flasks } } } };
    const r = apply(full, { type: 'fight', id: 'f', player: P, move: { kind: 'item', item: 'potion' }, guard: 'block' } as never, makeRng('f'), MONDAY);
    expect(r.events[0]).toMatchObject({ type: 'rejected' });
  });
  it('a fall loses the pot and no other gold', () => {
    const entered = act(at(), 'enter').state;
    const me = entered.characters[P]!;
    const f = me.fight!;
    let s: GameState = { ...entered, characters: { [P]: { ...me, hp: 1, attack: 1, arena: { mode: 'normal', wave: 2, gold: 500, xp: 500, flasks: 0 }, fight: { ...f, enemy: { ...f.enemy, hp: 1e6, maxHp: 1e6, attack: 1e6 } } } } };
    for (let i = 0; i < 12 && s.characters[P]!.fight; i++) s = apply(s, { type: 'fight', id: 'g' + i, player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('g' + i), MONDAY).state;
    const after = s.characters[P]!;
    expect(after.fight).toBeNull();
    expect(after.arena).toBeUndefined();
    expect(after.gold).toBe(me.gold);
    expect(after.hp).toBeGreaterThan(1);
  });
});
