import { describe, expect, it } from 'vitest';
import { migrate } from '../src/save.ts';
import { apply, ARENA, arenaFee, arenaPrize, CALENDAR, gearKind, isOn, makeRng, newGame, rollLegend, sealsOf, UNIQUE_IDS, UNIQUES, weekday, type ClassId, type GameState } from '../src/index.ts';

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
    expect(up!.version).toBe(39);
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

describe('Legend, the Arena of one who holds every Seal (Robin, 2026-11-03)', () => {
  /** A fighter at the Meadows' Arena holding every Seal (or not). */
  const sealed = (classId: ClassId = 'warrior', seals = true): GameState => {
    const s = newGame({ seed: 'arena', player: P, name: 'Robin', classId });
    const bossKills = seals ? Object.fromEntries(sealsOf(s.board, s.characters[P]!).map((x) => [x.space, 1])) : {};
    return { ...s, characters: { [P]: { ...s.characters[P]!, space: 'farrows', steps: 0, gold: 50000, hp: 100000, attack: 100000, level: 30, bossKills } } };
  };
  it('opens only with every Seal, for the same fee in every land', () => {
    expect(act(sealed('warrior', false), 'enter', MONDAY, 'legend').events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    const r = act(sealed(), 'enter', MONDAY, 'legend');
    expect(r.state.characters[P]!.arena?.mode).toBe('legend');
    expect(arenaFee(r.state.board, 'meadows', 'legend')).toBe(arenaFee(r.state.board, 'giantsland', 'legend'));
  });
  it("a clear wins the land's piece for your class, then its off-hand, each once", () => {
    let s = act(sealed(), 'enter', MONDAY, 'legend').state;
    for (let w = 1; w <= ARENA.waves.length; w++) {
      s = fightOut(s);
      if (w < ARENA.waves.length) s = act(s, 'next', MONDAY, 'legend').state;
    }
    const r = act(s, 'take', MONDAY, 'legend');
    const me = r.state.characters[P]!;
    const won = [me.equipment.weapon, ...me.bag].find((g) => g?.unique === 'arena-millstone');
    expect(won?.rank).toBe(ARENA.legendRank);
    expect(me.arenaLegends).toEqual(['arena-millstone']);
    expect(arenaPrize(me, 'meadows')).toBe('arena-hedgerow');
    expect(arenaPrize({ ...me, arenaLegends: ['arena-millstone', 'arena-hedgerow'] }, 'meadows')).toBeNull();
  });
  it("a Magician's off-hand is an orb, and only two lands give one", () => {
    const mage = sealed('mage').characters[P]!;
    expect(arenaPrize(mage, 'bogglemire')).toBe('arena-witchs_reed');
    expect(arenaPrize({ ...mage, arenaLegends: ['arena-witchs_reed'] }, 'bogglemire')).toBe('arena-will_o_wisp');
    expect(arenaPrize({ ...mage, arenaLegends: ['arena-goo_sceptre'] }, 'meadows')).toBeNull();
  });
  it('thirty-five pieces, a weapon for each class and one off-hand in each of the seven lands, never dropped', () => {
    const all = UNIQUE_IDS.filter((id) => UNIQUES[id]!.arena);
    expect(all).toHaveLength(35);
    for (const land of Object.keys(ARENA.spots)) {
      const set = all.filter((id) => UNIQUES[id]!.arena === land);
      expect(set, land).toHaveLength(5);
      for (const cls of ['warrior', 'rogue', 'mage', 'ranger']) expect(set.filter((id) => UNIQUES[id]!.classId === cls && UNIQUES[id]!.slot === 'weapon'), `${land} ${cls}`).toHaveLength(1);
    }
    for (const id of all) {
      const u = UNIQUES[id]!;
      const kind = gearKind({ id, slot: u.slot, rank: 9, rarity: 'unique', name: u.name, base: u.kind!.toLowerCase(), stats: {}, affixes: [], price: 1 });
      expect(u.slot === 'shield' ? ['buckler', 'round', 'kite', 'tower', 'blink_orb', 'storm_orb'] : ['great', 'sword', 'dagger', 'staff', 'wand', 'bow'], id).toContain(kind);
    }
    for (let i = 0; i < 200; i++) expect(UNIQUES[rollLegend('g', 8, makeRng(`a${i}`), 'warrior')!.unique!]!.arena).toBeUndefined();
  });
});
