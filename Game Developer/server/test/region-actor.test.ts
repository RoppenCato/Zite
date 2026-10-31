import { describe, expect, it } from 'vitest';
import { newGame, type Action } from '../../rules/src/index.ts';
import { openDb, pruneResults } from '../src/db.ts';
import { RegionActor } from '../src/region-actor.ts';

const P = 'p1';
const create = () => ({ seed: 'ashford', state: newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' }) });
const roll = (id: string): Action => ({ type: 'roll', id, player: P });
const move = (id: string, path: string[]): Action => ({ type: 'move', id, player: P, path });

function freshActor(id = 'r1') {
  const db = openDb(':memory:');
  let clock = 1000;
  const now = () => clock;
  const tick = (ms: number) => (clock += ms);
  return { db, now, tick, actor: new RegionActor({ id, db, now, create }) };
}

describe('a region actor', () => {
  it('starts at version 0 with the state it was given, stored in SQLite', () => {
    const { actor, db } = freshActor();
    expect(actor.snapshot()).toEqual({ version: 0, state: create().state });
    const row = db.prepare('SELECT version, rng FROM regions WHERE id = ?').get('r1') as { version: number; rng: number };
    expect(row.version).toBe(0);
    expect(typeof row.rng).toBe('number');
  });

  it('applies a roll through the rules and bumps the version', async () => {
    const { actor } = freshActor();
    const result = await actor.submit(roll('a1'));
    expect(result).toEqual({ version: 1, events: [{ type: 'rolled', action: 'a1', player: P, value: 2 }], replayed: false });
    expect(actor.snapshot().version).toBe(1);
    expect(actor.snapshot().state.characters[P]).toMatchObject({ steps: 2, space: 's0' });
  });

  it('answers a repeated action id with the stored answer and does not roll again', async () => {
    const { actor } = freshActor();
    const first = await actor.submit(roll('a1'));
    const again = await actor.submit(roll('a1'));
    expect(again).toEqual({ ...first, replayed: true });
    expect(actor.snapshot().version).toBe(1);
    await actor.submit(move('a2', ['s1', 's2']));
    // The second roll of seed 'ashford' is a 1: the replay did not spend a roll.
    const next = await actor.submit(roll('a3'));
    expect(next.events).toEqual([{ type: 'rolled', action: 'a3', player: P, value: 1 }]);
  });

  it('applies actions one at a time, in the order they arrived', async () => {
    const { actor } = freshActor();
    const results = await Promise.all([
      actor.submit(roll('a1')), // 2
      actor.submit(move('a2', ['s1', 's2'])),
      actor.submit(roll('a3')), // 1
      actor.submit(move('a4', ['s3'])),
      actor.submit(roll('a5')), // 5
    ]);
    expect(results.map((r) => r.version)).toEqual([1, 2, 3, 4, 5]);
    expect(results.map((r) => r.events[0]?.type)).toEqual(['rolled', 'moved', 'rolled', 'moved', 'rolled']);
    expect(actor.snapshot().state.characters[P]).toMatchObject({ space: 's3', steps: 5 });
  });

  it('remembers a refused action without bumping the version', async () => {
    const { actor } = freshActor();
    const refused = await actor.submit(move('m1', ['s1']));
    expect(refused).toEqual({ version: 0, events: [{ type: 'rejected', action: 'm1', player: P, reason: 'roll first' }], replayed: false });
    expect(await actor.submit(move('m1', ['s1']))).toEqual({ ...refused, replayed: true });
    expect(actor.snapshot().version).toBe(0);
  });

  it('carries on from SQLite when a new actor opens the same region', async () => {
    const { actor, db, now } = freshActor();
    await actor.submit(roll('a1'));
    await actor.submit(move('a2', ['s1', 's2']));
    const reopened = new RegionActor({ id: 'r1', db, now, create });
    expect(reopened.snapshot()).toEqual(actor.snapshot());
    expect(reopened.snapshot().version).toBe(2);
    // The dice carry on too: the second roll of the seed, not the first again.
    const next = await reopened.submit(roll('a3'));
    expect(next.events).toEqual([{ type: 'rolled', action: 'a3', player: P, value: 1 }]);
    // And the old answers are still there.
    expect(await reopened.submit(roll('a1'))).toMatchObject({ version: 1, replayed: true });
  });

  it('keeps two regions on one database apart', async () => {
    const db = openDb(':memory:');
    const a = new RegionActor({ id: 'r1', db, create });
    const b = new RegionActor({ id: 'r2', db, create });
    await a.submit(roll('a1'));
    expect(a.snapshot().version).toBe(1);
    expect(b.snapshot().version).toBe(0);
    const bFirst = await b.submit(roll('a1'));
    expect(bFirst.replayed).toBe(false);
    expect(bFirst.version).toBe(1);
  });

  it('forgets old answers when asked, keeps recent ones', async () => {
    const { actor, db, now, tick } = freshActor();
    await actor.submit(roll('a1'));
    tick(10 * 24 * 3600 * 1000);
    await actor.submit(move('a2', ['s1', 's2']));
    expect(pruneResults(db, now(), 3 * 24 * 3600 * 1000)).toBe(1);
    expect((await actor.submit(roll('a1'))).replayed).toBe(false); // the old id is gone, so this is a new roll
    expect((await actor.submit(move('a2', ['s1', 's2']))).replayed).toBe(true);
  });
});
