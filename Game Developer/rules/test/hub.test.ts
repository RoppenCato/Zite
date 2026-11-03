import { describe, expect, it } from 'vitest';
import { CLASS_DATA, apply, boardQuests, hubOf, makeRng, makeUnique, newGame, plainGear, PROGRESSION, sealCount, sealsOf, SEALS_COMING, shopOffer, startFight, strollPath, type Board, type GameState } from '../src/index.ts';
import { migrate } from '../src/save.ts';
import { WORLD_DATA } from '../src/data.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;

/** A small city: gate g links out to s0; g, a, b inside the walls. */
function cityBoard(): Board {
  const b = ringBoard();
  const area = { ...Object.values(b.areas)[0]!, id: 'city', name: 'Town', city: true };
  const space = (id: string, links: string[], kind: 'normal' | 'shop' = 'normal') => ({ id, kind, name: kind === 'shop' ? 'Smith' : '', x: 0, y: 0, links, area: 'city' });
  const spaces = { ...b.spaces, g: space('g', ['a', 's0']), a: space('a', ['g', 'b']), b: space('b', ['a'], 'shop'), s0: { ...b.spaces.s0!, links: [...b.spaces.s0!.links, 'g'] } };
  return { ...b, spaces, areas: { ...b.areas, city: area } };
}
const at = (space: string): GameState => {
  const s = newGame({ seed: 'hub', player: P, name: 'Robin', classId: 'warrior', board: cityBoard() });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, opened: [...s.characters[P]!.opened, 'city'] } } };
};

describe('a city (Robin, 2026-11-02)', () => {
  it('is walked with no die and no fights', () => {
    const r = apply(at('g'), { type: 'stroll', id: 's', player: P, to: 'b' }, makeRng('s'), NOW);
    const me = r.state.characters[P]!;
    expect(me.space).toBe('b');
    expect(me.fight).toBeNull();
    expect(r.events.some((e) => e.type === 'moved')).toBe(true);
    const street = apply(at('b'), { type: 'stroll', id: 's', player: P, to: 'a' }, makeRng('s'), NOW);
    expect(street.state.characters[P]!.fight).toBeNull();
    expect(street.events.some((e) => e.type === 'fight')).toBe(false);
  });
  it('finds its way by its own streets, and only there', () => {
    const s = at('g');
    expect(strollPath(s, 'g', 'b')).toEqual(['a', 'b']);
    expect(strollPath(s, 'g', 's1')).toBeNull();
    expect(strollPath(s, 's1', 'g')).toBeNull();
    expect(apply(s, { type: 'stroll', id: 's', player: P, to: 's1' }, makeRng('s'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
  it('takes the die only at a way out', () => {
    expect(apply(at('a'), { type: 'roll', id: 'r', player: P }, makeRng('r'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(at('g'), { type: 'roll', id: 'r', player: P }, makeRng('r'), NOW).events[0]).toMatchObject({ type: 'rolled' });
  });
});

describe('the real hub world (Mitch, AD; Robin, 2026-11-02)', () => {
  const made = () => newGame({ seed: 'real', player: P, name: 'Robin', classId: 'warrior' });
  it('every spot can be reached on foot from the start, with everything open', () => {
    const s = made();
    const seen = new Set([s.board.start]);
    let ring = [s.board.start];
    while (ring.length) {
      ring = ring.flatMap((id) => s.board.spaces[id]!.links).filter((id) => !seen.has(id) && !!seen.add(id));
    }
    const missing = Object.values(s.board.spaces).filter((x) => !seen.has(x.id) && !s.board.areas[x.area]!.dungeon).map((x) => x.id);
    expect(missing).toEqual([]);
  });
  it("King Goo's fall opens the ring, the city and the lands with no gate, and not the gated ones", () => {
    const s = made();
    const c = startFight({ ...s.characters[P]!, space: 'gate', attack: 5000 }, 'thornwood-warden', 'gate', false);
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    const r = apply({ ...s, characters: { [P]: c } }, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('w'), NOW);
    const opened = r.state.characters[P]!.opened;
    for (const id of ['kingswood', 'crownhaven', 'thornwood', 'frostpeak']) expect(opened).toContain(id);
    for (const id of ['bogglemire', 'frostcrown']) expect(opened).not.toContain(id);
  });
  it('a mini-boss at a gate opens its land', () => {
    const s = made();
    const c = startFight({ ...s.characters[P]!, space: 'gate-bogsnapper', opened: ['meadows', 'kingswood'], attack: 5000 }, 'bogsnapper', 'gate-bogsnapper', false);
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    const r = apply({ ...s, characters: { [P]: c } }, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('w'), NOW);
    expect(r.state.characters[P]!.opened).toContain('bogglemire');
  });
  it('a save from before keeps its character, and stands on a real spot, its lands open', () => {
    const s = made();
    const me = s.characters[P]!;
    const old = { ...s, version: 30, characters: { [P]: { ...me, gold: 123, level: 7, space: 'shoreend', opened: ['meadows', 'thornwood'], bossKills: { gate: 1 } } } };
    const spaces = { ...s.board.spaces, shoreend: { ...s.board.spaces.summit!, id: 'shoreend', kind: 'normal' as const, boss: undefined, area: 'thornwood' } };
    const up = migrate(JSON.parse(JSON.stringify({ ...old, board: { ...s.board, spaces } })))!;
    const c = up.characters[P]!;
    expect(up.version).toBe(37);
    expect(c.gold).toBe(123);
    expect(up.board.spaces[c.space]).toBeTruthy();
    expect(c.opened).toEqual(expect.arrayContaining(['kingswood', 'crownhaven', 'thornwood', 'frostpeak']));
  });
  it('nothing wanders into the city: no creature, merchant or Dread appears there', () => {
    let s = made();
    s = { ...s, characters: { [P]: { ...s.characters[P]!, opened: ['meadows', 'kingswood', 'crownhaven'], space: 'city-square' } } };
    const rng = makeRng('quiet');
    let now = NOW;
    for (let i = 0; i < 400; i++) {
      now += 60_000;
      s = apply(s, { type: 'tick', id: `t${i}`, player: P } as never, rng, now).state;
      for (const id of Object.keys(s.spawns)) expect(s.board.areas[s.board.spaces[id]!.area]!.city ?? false, id).toBe(false);
    }
  });
  it("the city's board sends you out: its errands lie in a land you have open, never in its streets", () => {
    const s = made();
    const c = { ...s.characters[P]!, level: 9, opened: ['meadows', 'kingswood', 'crownhaven', 'thornwood', 'frostpeak'], space: 'city-square' };
    const quests = boardQuests({ ...s, characters: { [P]: c } }, s.board.spaces['city-quests']!, makeRng('city'), c);
    expect(quests.length).toBeGreaterThan(0);
    for (const q of quests) expect(q.area).toBe('frostpeak');
  });
  it('a Hunter can wield a rare bow, whose name has no "bow" in it, a unique, and since 2026-11-03 a sword too', () => {
    const s = made();
    const hunter = newGame({ seed: 'bow', player: P, name: 'Robin', classId: 'ranger' });
    void s;
    const me = hunter.characters[P]!;
    const rare = { ...plainGear('g1', 'weapon', 2, 'light', 'ranger'), rarity: 'rare' as const, name: 'Fierce Thistledown of the Hunter' };
    const sword = { ...plainGear('g2', 'weapon', 2, 'heavy', 'warrior'), rarity: 'common' as const };
    const unique = makeUnique('g3', 'twinfang', 2, makeRng('u'));
    const st = { ...hunter, characters: { [P]: { ...me, bag: [rare, sword, unique] } } };
    const wear = (gear: string) => apply(st, { type: 'equip', id: 'e', player: P, gear }, makeRng('e'), NOW).events[0]!.type;
    expect(wear('g1')).toBe('equipped');
    expect(wear('g3')).toBe('equipped');
    expect(wear('g2')).toBe('equipped');
  });
  it("the hub's shops keep up: the stock of the furthest land you have opened", () => {
    const s = made();
    const at = (opened: string[]) => {
      const c = { ...s.characters[P]!, opened, space: 'city-armoury' };
      return shopOffer({ ...s, characters: { [P]: c } }, c)!.tier;
    };
    expect(at(['meadows', 'kingswood', 'crownhaven'])).toBe(2);
    expect(at(['meadows', 'kingswood', 'crownhaven', 'bogglemire', 'frostcrown'])).toBe(5);
  });
  it('going home works on the real world', () => {
    const s = made();
    const open: GameState = { ...s, characters: { [P]: { ...s.characters[P]!, opened: ['meadows', 'kingswood', 'crownhaven'], space: 'gate' } } };
    expect(apply(open, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW).state.characters[P]!.space).toBe('city-square');
  });
});

describe('the Seals (Robin, 2026-11-02)', () => {
  const made = () => newGame({ seed: 'seals', player: P, name: 'Robin', classId: 'warrior' });
  const beat = (s: GameState, space: string, boss: string): ReturnType<typeof apply> => {
    const c = startFight({ ...s.characters[P]!, space, attack: 5000, opened: Object.keys(s.board.areas) }, boss, space, false);
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    return apply({ ...s, characters: { [P]: c } }, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('s'), NOW);
  };
  it("one for each land's greatest boss: no gate's mini-boss, no dungeon, no city", () => {
    const s = made();
    expect(sealsOf(s.board, s.characters[P]!).map((x) => x.space)).toEqual(['gate', 'briar', 'summit', 'murkpool', 'frostseat', 'flagship', 'yeticrown']);
  });
  it('is won the first time the boss falls, and only then', () => {
    const first = beat(made(), 'summit', 'frost-matriarch');
    expect(first.events).toContainEqual(expect.objectContaining({ type: 'sealWon', land: 'frostpeak', won: 1, total: 7 + SEALS_COMING.length }));
    expect(sealCount(first.state.board, first.state.characters[P]!).won).toBe(1);
    const again = beat(first.state, 'summit', 'frost-matriarch');
    expect(again.events.some((e) => e.type === 'sealWon')).toBe(false);
  });
  it("a gate's mini-boss gives none", () => {
    expect(beat(made(), 'gate-bogsnapper', 'bogsnapper').events.some((e) => e.type === 'sealWon')).toBe(false);
  });
  it('a character who beat the bosses before Seals existed already holds them', () => {
    const s = made();
    const c = { ...s.characters[P]!, bossKills: { gate: 3, frostseat: 1, 'gate-bighorn': 2 } };
    expect(sealCount(s.board, c).won).toBe(2);
  });
});

describe('going home (Robin, 2026-11-02)', () => {
  const data = WORLD_DATA as unknown as { hub?: string };
  it('takes you to the hub from anywhere, with a wait, not in a fight', () => {
    const old = data.hub;
    data.hub = 'b';
    try {
      const s = at('s1');
      expect(hubOf(s, s.characters[P]!)).toBe('b');
      const r = apply(s, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW);
      const me = r.state.characters[P]!;
      expect(me.space).toBe('b');
      expect(me.cooldowns.home).toBe(NOW + PROGRESSION.homeWaitMs);
      const back: GameState = { ...r.state, characters: { [P]: { ...me, space: 's1' } } };
      expect(apply(back, { type: 'home', id: 'i', player: P }, makeRng('i'), NOW + 1000).events[0]).toMatchObject({ type: 'rejected' });
      expect(apply(back, { type: 'home', id: 'j', player: P }, makeRng('j'), NOW + PROGRESSION.homeWaitMs + 1).state.characters[P]!.space).toBe('b');
      const closed: GameState = { ...s, characters: { [P]: { ...s.characters[P]!, opened: ['meadows'] } } };
      expect(apply(closed, { type: 'home', id: 'k', player: P }, makeRng('k'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    } finally {
      if (old === undefined) delete data.hub;
      else data.hub = old;
    }
  });
  it('is not there on a world with no hub', () => {
    const old = data.hub;
    delete data.hub;
    try {
      const s = at('s1');
      expect(apply(s, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    } finally {
      if (old !== undefined) data.hub = old;
    }
  });
});

describe('the Buried Crown (Robin, 2026-11-02)', () => {
  const at = (bossKills: Record<string, number>) => {
    const s = newGame({ seed: 'crown', player: P, name: 'Robin', classId: 'warrior' });
    const c = s.characters[P]!;
    return { ...s, characters: { ...s.characters, [P]: { ...c, space: 'city-castle', steps: 0, bossKills } } };
  };
  it('its door stays shut until every Seal is won, then opens', () => {
    const shut = apply(at({}), { type: 'door', id: 'a', player: P }, makeRng('x'), 0);
    expect(shut.events[0]).toMatchObject({ type: 'rejected' });
    const kills = Object.fromEntries(sealsOf(at({}).board, at({}).characters[P]!).map((x) => [x.space, 1]));
    const open = apply(at(kills), { type: 'door', id: 'a', player: P }, makeRng('x'), 0);
    expect(open.state.characters[P]!.space).toBe('bc-stair');
    expect(open.state.characters[P]!.opened).toContain('buried-crown');
  });
});

describe('a Magician with no spells (mine, 2026-11-02)', () => {
  it('its plain Attack still uses most of its magic', () => {
    expect(CLASS_DATA.mage!.traits?.attackMagic).toBe(0.8);
  });
});

describe('the far lands have all the others have (Mitch, AD, 2026-11-02)', () => {
  it('an Arena each, and every hidden trail joined to the road', () => {
    const board = newGame({ seed: 'far', player: P, name: 'Robin', classId: 'warrior' }).board;
    expect(board.spaces.cutlassring).toMatchObject({ kind: 'arena', area: 'pirateisles' });
    expect(board.spaces.icering).toMatchObject({ kind: 'arena', area: 'giantsland' });
    for (const id of ['sec-pirateisles-1', 'sec-pirateisles-2', 'sec-pirateisles-3', 'sec-giantsland-1', 'sec-giantsland-2', 'sec-giantsland-3']) {
      expect(board.spaces[`${id}-1`], id).toBeTruthy();
    }
  });
});

describe('linking two players (the brief: Proximity)', () => {
  const two = () => {
    const a = newGame({ seed: 'link', player: P, name: 'Robin', classId: 'warrior' });
    return apply(a, { type: 'join', id: 'j', player: 'p2', name: 'Friend', classId: 'mage' }, makeRng('j'), 0).state;
  };
  it('one shows a code, the other types it, and the link runs out', () => {
    const shown = apply(two(), { type: 'link', id: 'o', player: P, op: 'offer' }, makeRng('o'), 1000);
    const code = (shown.events[0] as { code: string }).code;
    expect(code).toMatch(/^[A-Z]{6}$/);
    const done = apply(shown.state, { type: 'link', id: 'a', player: 'p2', op: 'accept', code: code.toLowerCase() }, makeRng('a'), 2000);
    expect(done.state.characters.p2!.link?.with).toBe(P);
    expect(done.state.characters[P]!.link?.with).toBe('p2');
    expect(done.state.characters[P]!.linkCode).toBeUndefined();
  });
  it('a code works for a minute, and never for yourself', () => {
    const shown = apply(two(), { type: 'link', id: 'o', player: P, op: 'offer' }, makeRng('o'), 1000);
    const code = (shown.events[0] as { code: string }).code;
    expect(apply(shown.state, { type: 'link', id: 'a', player: 'p2', op: 'accept', code }, makeRng('a'), 62_000).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(shown.state, { type: 'link', id: 'a', player: P, op: 'accept', code }, makeRng('a'), 2000).events[0]).toMatchObject({ type: 'rejected' });
  });
  it('a linked friend joins a world boss from anywhere, and only while linked', () => {
    let s = two();
    const spawn = { kind: 'worldboss', enemy: 'old-rootbeard', hp: 900, maxHp: 900, until: 9e12 };
    const space = s.characters[P]!.space;
    s = { ...s, spawns: { [space]: spawn } } as typeof s;
    const f = startFight(s.characters[P]!, 'old-rootbeard', space, true);
    s = { ...s, characters: { ...s.characters, [P]: { ...f, fight: { ...f.fight!, shared: true } } } };
    expect(apply(s, { type: 'link', id: 'n', player: 'p2', op: 'join' }, makeRng('n'), 1000).events[0]).toMatchObject({ type: 'rejected' });
    s = { ...s, characters: { ...s.characters, p2: { ...s.characters.p2!, link: { with: P, until: 5000 } } } };
    const joined = apply(s, { type: 'link', id: 'y', player: 'p2', op: 'join' }, makeRng('y'), 1000);
    expect(joined.state.characters.p2!.fight?.shared).toBe(true);
    expect(joined.state.characters.p2!.fight?.enemy.hp).toBe(900);
    expect(apply(s, { type: 'link', id: 'z', player: 'p2', op: 'join' }, makeRng('z'), 6000).events[0]).toMatchObject({ type: 'rejected' });
  });
});

describe('the Yeti King\'s storm (mine, 2026-11-02)', () => {
  it('bites 8% of your HP every third round through a block, and never lands the last blow', () => {
    let s = newGame({ seed: 'storm', player: P, name: 'Robin', classId: 'warrior' });
    let c = startFight({ ...s.characters[P]!, level: 28, maxHp: 900, hp: 900 }, 'yeti-king', 'yeticrown', false, {}, makeRng('s'));
    s = { ...s, characters: { [P]: c } };
    const bites: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const r = apply(s, { type: 'fight', id: `f${i}`, player: P, move: { kind: 'attack' }, guard: 'block' }, makeRng(`r${i}`), 1000 + i);
      s = r.state;
      for (const e of r.events) if (e.type === 'trick') bites.push(i);
    }
    expect(bites).toEqual([3]);
    c = { ...s.characters[P]!, hp: 5 };
    s = { ...s, characters: { [P]: { ...c, fight: { ...c.fight!, round: 6, enemy: { ...c.fight!.enemy, moves: [{ name: 'Pause', power: 0, weight: 1 }], next: { name: 'Pause', power: 0, weight: 1 } } } } } };
    const last = apply(s, { type: 'fight', id: 'f9', player: P, move: { kind: 'attack' }, guard: 'block' }, makeRng('r9'), 2000);
    expect(last.events.some((e) => e.type === 'trick')).toBe(true);
    expect(last.state.characters[P]!.hp).toBeGreaterThanOrEqual(1);
  });
});

describe('a land stays veiled until you stand in it (Robin, 2026-11-03)', () => {
  it('King Goo shows the Kingswood and the city; the lands beside it wait until you walk in', () => {
    let s = newGame({ seed: 'veil', player: P, name: 'Robin', classId: 'warrior' });
    const gate = s.board.spaces.gate!;
    let c = startFight({ ...s.characters[P]!, space: 'gate', level: 8 }, gate.boss!, 'gate', false);
    c = { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 1 } } };
    s = { ...s, characters: { [P]: c } };
    const won = apply(s, { type: 'fight', id: 'w', player: P, move: { kind: 'attack' }, guard: 'block' }, makeRng('w'), 1000).state;
    const me = won.characters[P]!;
    expect(me.opened).toEqual(expect.arrayContaining(['kingswood', 'thornwood', 'frostpeak', 'crownhaven']));
    expect(me.seen).toEqual(expect.arrayContaining(['meadows', 'kingswood', 'crownhaven']));
    expect(me.seen).not.toContain('thornwood');
    const town = Object.values(won.board.spaces).find((x) => x.area === 'thornwood' && x.kind === 'town')!;
    const there = apply(won, { type: 'skill', id: 't', player: P, op: 'testLand', to: town.id } as never, makeRng('t'), 2000).state;
    expect(there.characters[P]!.seen).toContain('thornwood');
  });
  it('a level heals you whole', () => {
    const s = newGame({ seed: 'lvl', player: P, name: 'Robin', classId: 'rogue' });
    const c = { ...s.characters[P]!, hp: 5, mana: 1 };
    const up = apply({ ...s, characters: { [P]: c } }, { type: 'skill', id: 'l', player: P, op: 'testLevel' } as never, makeRng('l'), 0).state.characters[P]!;
    expect(up.level).toBe(2);
    expect(up.hp).toBe(up.maxHp);
  });
});
