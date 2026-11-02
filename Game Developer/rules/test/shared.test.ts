import { describe, expect, it } from 'vitest';
import { diffState, mergeDelta, mergeDeltas } from '../src/delta.ts';
import { startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { reachable } from '../src/paths.ts';
import { makeRng, type Rng } from '../src/rng.ts';
import type { Action, GameState } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const NOW = 1_000_000;
const join = (player: string, name = 'Sam', classId = 'rogue', id = `j-${player}`): Action => ({ type: 'join', id, player, name, classId } as Action);
const roll = (player: string, id = `r-${player}`): Action => ({ type: 'roll', id, player });
const two = (): GameState => apply(newGame({ seed: 'two', player: 'p1', name: 'Robin', classId: 'warrior', board: ringBoard() }), join('p2'), makeRng('x'), NOW).state;

describe('joining a game', () => {
  it('puts a second character at the start with its class, the first untouched', () => {
    const s0 = newGame({ seed: 'two', player: 'p1', name: 'Robin', classId: 'warrior', board: ringBoard() });
    const { state, events } = apply(s0, join('p2'), makeRng('x'), NOW);
    expect(events).toEqual([{ type: 'joined', action: 'j-p2', player: 'p2', name: 'Sam', classId: 'rogue', space: s0.board.start }]);
    expect(state.characters.p2).toMatchObject({ id: 'p2', name: 'Sam', classId: 'rogue', level: 1, space: s0.board.start, steps: 0, fight: null, opened: [s0.board.spaces[s0.board.start]!.area] });
    expect(state.characters.p1).toBe(s0.characters.p1);
    expect(state.board).toBe(s0.board);
  });

  it('refuses a player already here, and leaves the state alone', () => {
    const s = two();
    const { state, events } = apply(s, join('p2', 'Again', 'mage', 'j2'), makeRng('x'), NOW);
    expect(state).toBe(s);
    expect(events).toEqual([{ type: 'rejected', action: 'j2', player: 'p2', reason: 'already here' }]);
  });

  it('trims a long name to twelve letters and refuses an empty one or an unknown class', () => {
    const s0 = newGame({ seed: 'two', player: 'p1', name: 'Robin', classId: 'warrior', board: ringBoard() });
    expect(apply(s0, join('p3', '  Bartholomew the Third  '), makeRng('x'), NOW).state.characters.p3?.name).toBe('Bartholomew ');
    expect(apply(s0, join('p4', '   '), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'bad value' });
    expect(apply(s0, join('p5', 'Sam', 'bard'), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'bad value' });
  });

  it('lets two players roll from one stream and move their own pieces', () => {
    const rng = makeRng('shared');
    let s = two();
    const first = apply(s, roll('p1'), rng, NOW);
    s = first.state;
    const second = apply(s, roll('p2'), rng, NOW);
    s = second.state;
    expect(first.events[0]).toMatchObject({ type: 'rolled', player: 'p1' });
    expect(second.events[0]).toMatchObject({ type: 'rolled', player: 'p2' });
    expect(s.characters.p1!.steps).toBeGreaterThan(0);
    expect(s.characters.p2!.steps).toBeGreaterThan(0);
    const way = reachable(s.board, s.characters.p1!.space, s.characters.p1!.steps, new Set(s.characters.p1!.opened))[0]!;
    const moved = apply(s, { type: 'move', id: 'm1', player: 'p1', path: way.path }, rng, NOW);
    expect(moved.state.characters.p1!.space).toBe(way.space);
    expect(moved.state.characters.p2).toBe(s.characters.p2);
  });
});

describe('the delta between two states', () => {
  it('is null when nothing changed: a refused action', () => {
    const s = two();
    const refused = apply(s, { type: 'move', id: 'm', player: 'p1', path: ['s1'] }, makeRng('x'), NOW);
    expect(refused.state).toBe(s);
    expect(diffState(s, refused.state)).toBeNull();
  });

  it('holds only the character that acted and the die after a roll, and folds back to the same state', () => {
    const s = two();
    const after = apply(s, roll('p1'), makeRng('x'), NOW).state;
    const delta = diffState(s, after)!;
    expect(Object.keys(delta).sort()).toEqual(['characters', 'die']);
    expect(Object.keys(delta.characters!)).toEqual(['p1']);
    expect(mergeDelta(s, delta)).toEqual(after);
  });

  it('holds the spawns after a tick that spawned something, and nothing after a quiet one', () => {
    const rng = makeRng('tick');
    let s = two();
    let spawned: ReturnType<typeof diffState> = null;
    for (let i = 0; i < 60 && !spawned; i++) {
      const r = apply(s, { type: 'tick', id: `t${i}`, player: 'world' }, rng, NOW + i);
      const delta = diffState(s, r.state);
      if (r.events.some((e) => e.type === 'spawned')) spawned = delta;
      else expect(delta).toBeNull();
      s = r.state;
    }
    expect(spawned).not.toBeNull();
    expect(Object.keys(spawned!)).toEqual(['spawns']);
  });

  it('holds the whole board when a boss lays a new area', () => {
    const s0 = newGame({ seed: 'grow', player: 'p1', name: 'Robin', classId: 'warrior' });
    const summit = Object.values(s0.board.spaces).find((sp) => sp.opens?.startsWith('gen-'))!;
    const c = startFight({ ...s0.characters.p1!, space: summit.id, attack: 500, opened: ['meadows', 'thornwood', 'frostpeak'] }, summit.boss!, summit.id, false, s0.board.bestiary);
    c.fight!.enemy = { ...c.fight!.enemy, hp: 1 };
    const s = { ...s0, characters: { p1: c } };
    const after = apply(s, { type: 'fight', id: 'f', player: 'p1', move: { kind: 'attack' }, guard: 'block' }, makeRng('x'), NOW).state;
    const delta = diffState(s, after)!;
    expect(delta.board).toBeDefined();
    expect(delta.board!.areas['gen-1']).toBeDefined();
    expect(delta.characters!.p1!.opened).toContain('gen-1');
    expect(mergeDelta(s, delta)).toEqual(after);
  });

  it('bundles two deltas with the later winning each part and characters kept by id', () => {
    const s = two();
    const a = diffState(s, apply(s, roll('p1', 'a'), makeRng('a'), NOW).state)!;
    const b = diffState(s, apply(s, roll('p2', 'b'), makeRng('b'), NOW).state)!;
    const both = mergeDeltas(a, b);
    expect(Object.keys(both.characters!).sort()).toEqual(['p1', 'p2']);
    expect(both.die).toBe(b.die);
    expect(mergeDeltas(a, { nextItem: 5 })).toEqual({ ...a, nextItem: 5 });
  });
});

/** A bot's next action: fight, answer, walk, or roll; it does not shop. */
function botAction(state: GameState, player: string, rng: Rng, id: string): Action {
  const me = state.characters[player]!;
  if (me.fight) return { type: 'fight', id, player, move: rng.next() < 0.25 && !me.fight.charged ? { kind: 'charge' } : { kind: 'attack' }, guard: rng.next() < 0.5 ? 'block' : 'counter' };
  if (me.offer?.kind === 'gamble') return { type: 'gamble', id, player, choice: 'high' };
  if (me.offer?.kind === 'board') return { type: 'quest', id, player, accept: me.offer.quests.length > 0 };
  if (me.offer?.kind === 'loot') return { type: 'keep', id, player, choice: 'sell' };
  if (me.picks.length) return { type: 'pick', id, player, ability: me.picks[0]![0]! };
  if (me.steps > 0) {
    const ways = reachable(state.board, me.space, me.steps, new Set(me.opened));
    if (ways.length) return { type: 'move', id, player, path: ways[rng.int(ways.length) - 1]!.path };
  }
  return { type: 'roll', id, player };
}

describe('a client folding deltas', () => {
  it('ends with exactly the server\'s state after two bots play six hundred actions on the world, ticks between', () => {
    const rng = makeRng('world');
    const choice = makeRng('choice');
    let server = apply(newGame({ seed: 'coop', player: 'p1', name: 'Robin', classId: 'warrior' }), join('p2', 'Sam', 'mage'), rng, NOW).state;
    let client = structuredClone(server);
    let now = NOW;
    let changes = 0;
    for (let i = 0; i < 600; i++) {
      const action = i % 20 === 19 ? ({ type: 'tick', id: `t${i}`, player: 'world' } as Action) : botAction(server, i % 2 ? 'p2' : 'p1', choice, `b${i}`);
      now += i % 20 === 19 ? 61_000 : 1_000;
      const r = apply(server, action, rng, now);
      const delta = diffState(server, r.state);
      if (delta) {
        changes++;
        // Only the acting player's character is in it: nothing the other player did not do changes their piece, unless a
        // world boss fell and paid everyone who hit it.
        if (action.type !== 'tick' && !r.events.some((e) => e.type === 'worldBossDown')) expect(Object.keys(delta.characters ?? {}).filter((id) => id !== action.player)).toEqual([]);
        client = mergeDelta(client, structuredClone(delta));
      } else {
        expect(r.state).toBe(server);
      }
      server = r.state;
      if (i % 100 === 99) expect(client).toEqual(server);
    }
    expect(client).toEqual(server);
    expect(changes).toBeGreaterThan(300);
    expect(server.characters.p1!.level + server.characters.p2!.level).toBeGreaterThan(3);
  });
});
