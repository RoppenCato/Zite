import { describe, expect, it } from 'vitest';
import { apply, DUNGEONS, makeRng, newGame, reachable, startFight, type GameState } from '../src/index.ts';
import { migrate } from '../src/save.ts';

const P = 'p1';
const NOW = 1_000_000;
const D = DUNGEONS.rootways!;
const at = (space: string, extra: object = {}): GameState => {
  const s = newGame({ seed: 'dungeon', player: P, name: 'Robin', classId: 'warrior' });
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, steps: 0, ...extra } } };
};
const through = (s: GameState) => apply(s, { type: 'door', id: 'd', player: P }, makeRng('d'), NOW);

describe('dungeons (Robin, 2026-11-02)', () => {
  it('a door leads in and opens the land beyond, and back out', () => {
    const r = through(at(D.outside.spot));
    const me = r.state.characters[P]!;
    expect(me.space).toBe(D.inside);
    expect(me.opened).toContain(D.area.id);
    expect(r.state.board.areas[D.area.id]!.dungeon).toBe(true);
    expect(through(r.state).state.characters[P]!.space).toBe(D.outside.spot);
  });
  it('no door here, or a roll pending: not now', () => {
    expect(through(at('ashford')).events[0]).toMatchObject({ type: 'rejected' });
    expect(through(at(D.outside.spot, { steps: 3 })).events[0]).toMatchObject({ type: 'rejected' });
  });
  it('a roll too big stops at the road\'s end, so a door can be reached', () => {
    const s = at(D.inside);
    const ends = reachable(s.board, 'rw-stash', 1, new Set(['meadows', 'rootways']));
    expect(ends.length).toBeGreaterThan(0);
    const out = s.board.spaces[D.outside.spot]!;
    const next = out.links[0]!;
    const hit = reachable(s.board, next, 6, new Set(['meadows']));
    expect(hit.some((r) => r.space === D.outside.spot)).toBe(true);
  });
  it('its boss cannot be walked straight to, and nothing spawns in it', () => {
    const boss = D.area.hubs.find((h) => h.kind === 'boss')!;
    const s = at(D.inside, { opened: ['meadows', D.area.id] });
    expect(apply(s, { type: 'challenge', id: 'c', player: P, space: boss.id }, makeRng('c'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    let w = s;
    const rng = makeRng('w');
    for (let i = 0; i < 300; i++) w = apply(w, { type: 'tick', id: 't' + i, player: 'world' }, rng, NOW + i).state;
    for (const id of Object.keys(w.spawns)) expect(w.board.spaces[id]!.area).not.toBe(D.area.id);
  });
  it('falling inside wakes in a town by its door, with the usual cost', () => {
    const entered = through(at(D.outside.spot, { gold: 100 })).state;
    const me = entered.characters[P]!;
    const s = startFight({ ...me, space: 'rw-fork', hp: 1, attack: 1 }, 'old-rootbeard', 'rw-fork', false, {}, makeRng('y'));
    let w: GameState = { ...entered, characters: { [P]: s } };
    for (let i = 0; i < 12 && w.characters[P]!.fight; i++) w = apply(w, { type: 'fight', id: 'f' + i, player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('f' + i), NOW).state;
    const after = w.characters[P]!;
    expect(after.fight).toBeNull();
    expect(w.board.spaces[after.space]!.kind).toBe('town');
    expect(w.board.spaces[after.space]!.area).toBe('meadows');
  });
  it('a save with the stand-in cave comes out at the door, and gains the real one', () => {
    const now = at('ashford');
    const areas = { ...now.board.areas, grotto: { ...now.board.areas.rootways!, id: 'grotto' } };
    delete (areas as Record<string, unknown>).rootways;
    const spaces = Object.fromEntries(Object.entries(now.board.spaces).filter(([, x]) => x.area !== 'rootways'));
    spaces['grotto-door'] = { ...spaces.ashford!, id: 'grotto-door', kind: 'door', area: 'grotto', links: [], door: 'lookout' };
    const me = now.characters[P]!;
    const old = { ...now, version: 25, characters: { [P]: { ...me, space: 'grotto-door', opened: ['meadows', 'grotto'] } }, board: { ...now.board, areas, spaces } };
    const up = migrate(JSON.parse(JSON.stringify(old)))!;
    expect(up.board.areas.grotto).toBeUndefined();
    expect(up.board.spaces['grotto-door']).toBeUndefined();
    expect(up.characters[P]!.space).toBe('lookout');
    expect(up.characters[P]!.opened).toEqual(['meadows']);
    expect(up.board.spaces.lookout).toMatchObject({ kind: 'door', door: 'rw-door', name: 'The Rootways' });
  });
  it('a save from before gains the dungeon and keeps its character', () => {
    const now = at('ashford', { gold: 321 });
    const spaces = Object.fromEntries(Object.entries(now.board.spaces).filter(([, x]) => x.area !== D.area.id));
    spaces[D.outside.spot] = { ...spaces[D.outside.spot]!, kind: 'normal', name: 'Lookout Stump' };
    const areas = Object.fromEntries(Object.entries(now.board.areas).filter(([id]) => id !== D.area.id));
    delete spaces[D.outside.spot]!.door;
    const up = migrate(JSON.parse(JSON.stringify({ ...now, version: 24, board: { ...now.board, spaces, areas } })))!;
    expect(up.version).toBe(29);
    expect(up.characters[P]!.gold).toBe(321);
    expect(up.board.spaces[D.outside.spot]).toMatchObject({ kind: 'door', door: D.inside });
    expect(up.board.spaces[D.inside]!.door).toBe(D.outside.spot);
  });
});
