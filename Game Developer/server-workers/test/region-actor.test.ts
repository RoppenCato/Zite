// The region actor as the worker runs it, over the Sql interface (server/test/region-actor.test.ts, adapted): the same
// checks as the Node server's, plus the import that takes over a Node server's row and its stored answers.

import { describe, expect, it } from 'vitest';
import { newGame, type Action } from '../../rules/src/index.ts';
import { ringBoard } from '../../rules/test/fixtures/ring.ts';
import { RegionActor, SCHEMA_VERSION, openRegionSchema, pruneResults, type RegionRow, type ResultRow } from '../src/region-actor.ts';
import { memorySql } from './memory-sql.ts';

const P = 'p1';
// The actor plays on the twelve-space ring here so the paths stay short; the world itself plays on the island.
const create = () => ({ seed: 'ashford', state: newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() }) });
const roll = (id: string): Action => ({ type: 'roll', id, player: P });
const move = (id: string, path: string[]): Action => ({ type: 'move', id, player: P, path });

function freshActor(id = 'r1') {
  const sql = memorySql();
  openRegionSchema(sql);
  let clock = 1000;
  const now = () => clock;
  const tick = (ms: number) => (clock += ms);
  return { sql, now, tick, actor: new RegionActor({ id, sql, now, create }) };
}

describe('a region actor on the worker', () => {
  it('starts at version 0 with the state it was given, stored in SQLite under the Node server\'s schema', () => {
    const { actor, sql } = freshActor();
    expect(actor.snapshot()).toEqual({ version: 0, state: create().state });
    const row = sql.exec<{ version: number; rng: number }>('SELECT version, rng FROM regions WHERE id = ?', 'r1')[0]!;
    expect(row.version).toBe(0);
    expect(typeof row.rng).toBe('number');
    expect(sql.exec<{ value: string }>('SELECT value FROM meta WHERE key = ?', 'schema_version')[0]!.value).toBe(String(SCHEMA_VERSION));
    expect(actor.playerCount).toBe(1);
    expect(actor.people()).toEqual([{ id: P, name: 'Robin', classId: 'warrior', level: 1 }]);
  });

  it('applies a roll through the rules and bumps the version', async () => {
    const { actor } = freshActor();
    const result = await actor.submit(roll('a1'));
    expect(result).toMatchObject({ version: 1, events: [{ type: 'rolled', action: 'a1', player: P, value: 2 }], replayed: false });
    expect(Object.keys(result.delta!).sort()).toEqual(['characters', 'die']);
    expect(actor.snapshot().version).toBe(1);
    expect(actor.snapshot().state.characters[P]).toMatchObject({ steps: 2, space: 's0' });
  });

  it('answers a repeated action id with the stored answer and does not roll again', async () => {
    const { actor } = freshActor();
    const first = await actor.submit(roll('a1'));
    const again = await actor.submit(roll('a1'));
    expect(again).toEqual({ version: first.version, events: first.events, replayed: true });
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
      actor.submit(move('a2', ['s1', 's2'])), // Tinker Cart, the shop
      actor.submit({ type: 'buy', id: 'a3', player: P, item: 'potion' }),
      actor.submit(roll('a4')), // 1
      actor.submit(move('a5', ['s3'])), // Crossroads, the wilds: whatever turns up there
    ]);
    expect(results.map((r) => r.version)).toEqual([1, 2, 3, 4, 5]);
    expect(results.map((r) => r.events[0]?.type)).toEqual(['rolled', 'moved', 'bought', 'rolled', 'moved']);
    const me = actor.snapshot().state.characters[P]!;
    expect(me).toMatchObject({ space: 's3', steps: 0 });
    expect(me.items.potion).toBeGreaterThanOrEqual(1);
    expect(me.gold).toBeGreaterThanOrEqual(25);
  });

  it('remembers a refused action without bumping the version', async () => {
    const { actor } = freshActor();
    const refused = await actor.submit(move('m1', ['s1']));
    expect(refused).toEqual({ version: 0, events: [{ type: 'rejected', action: 'm1', player: P, reason: 'roll first' }], replayed: false, delta: null });
    expect(await actor.submit(move('m1', ['s1']))).toEqual({ version: 0, events: refused.events, replayed: true });
    expect(actor.snapshot().version).toBe(0);
  });

  it('carries on from SQLite when a new actor opens the same region: what a Durable Object does after a sleep', async () => {
    const { actor, sql, now } = freshActor();
    await actor.submit(roll('a1'));
    await actor.submit(move('a2', ['s1', 's2']));
    const reopened = new RegionActor({ id: 'r1', sql, now, create });
    expect(reopened.snapshot()).toEqual(actor.snapshot());
    expect(reopened.snapshot().version).toBe(2);
    // The dice carry on too: the second roll of the seed, not the first again.
    const next = await reopened.submit(roll('a3'));
    expect(next.events).toEqual([{ type: 'rolled', action: 'a3', player: P, value: 1 }]);
    // And the old answers are still there.
    expect(await reopened.submit(roll('a1'))).toMatchObject({ version: 1, replayed: true });
  });

  it('keeps two regions on one database apart', async () => {
    const sql = memorySql();
    openRegionSchema(sql);
    const a = new RegionActor({ id: 'r1', sql, create });
    const b = new RegionActor({ id: 'r2', sql, create });
    await a.submit(roll('a1'));
    expect(a.snapshot().version).toBe(1);
    expect(b.snapshot().version).toBe(0);
    const bFirst = await b.submit(roll('a1'));
    expect(bFirst.replayed).toBe(false);
    expect(bFirst.version).toBe(1);
  });

  it('ticks the world on its own clock: a spawn comes, the version moves; a quiet tick moves nothing; the spawn goes when its time is up', async () => {
    const { actor, tick } = freshActor();
    let spawnedAt: string | null = null;
    let version = 0;
    for (let i = 0; i < 40 && !spawnedAt; i++) {
      const r = await actor.submit({ type: 'tick', id: `t${i}`, player: 'world' });
      const spawned = r.events.find((e) => e.type === 'spawned');
      if (spawned?.type === 'spawned') {
        spawnedAt = spawned.space;
        expect(r.version).toBe(version + 1);
      } else {
        expect(r.events).toEqual([]);
        expect(r.version).toBe(version);
      }
      version = r.version;
    }
    expect(spawnedAt).not.toBeNull();
    expect(actor.snapshot().state.spawns[spawnedAt!]).toMatchObject({ until: 1000 + 600000 });
    tick(11 * 60 * 1000);
    const later = await actor.submit({ type: 'tick', id: 'late', player: 'world' });
    expect(later.events[0]).toEqual({ type: 'despawned', action: 'late', player: 'world', space: spawnedAt });
    expect(later.version).toBe(version + 1);
  });

  it('forgets old answers when asked, keeps recent ones', async () => {
    const { actor, sql, now, tick } = freshActor();
    await actor.submit(roll('a1'));
    tick(10 * 24 * 3600 * 1000);
    await actor.submit(move('a2', ['s1', 's2']));
    expect(pruneResults(sql, now(), 3 * 24 * 3600 * 1000)).toBe(1);
    expect(pruneResults(sql, now(), 3 * 24 * 3600 * 1000)).toBe(0);
    expect((await actor.submit(roll('a1'))).replayed).toBe(false); // the old id is gone, so this is a new roll
    expect((await actor.submit(move('a2', ['s1', 's2']))).replayed).toBe(true);
  });

  it('takes over a Node server\'s row and its stored answers (the import), and carries on from them, dice included', async () => {
    // A world played on one server...
    const source = freshActor('region-0');
    await source.actor.submit(roll('a1'));
    await source.actor.submit(move('a2', ['s1', 's2']));
    const row = source.sql.exec<RegionRow>('SELECT id, version, state, rng, updated_at FROM regions WHERE id = ?', 'region-0')[0]!;
    const results = source.sql.exec<ResultRow>('SELECT action_id, result, created_at FROM results WHERE region_id = ?', 'region-0');
    expect(row.version).toBe(2);
    expect(results.length).toBe(2);
    // ...comes to a fresh object with a world of its own, which is thrown away.
    const sql = memorySql();
    openRegionSchema(sql);
    const target = new RegionActor({ id: 'region-0', sql, now: source.now });
    expect(target.snapshot().version).toBe(0);
    expect(target.playerCount).toBe(0);
    target.replaceWith(row);
    expect(target.snapshot()).toEqual(source.actor.snapshot());
    expect(target.people()).toEqual([{ id: P, name: 'Robin', classId: 'warrior', level: 1 }]);
    expect(target.putResults(results)).toBe(2);
    expect(target.putResults(results)).toBe(2); // again changes nothing
    // The old answers answer; the dice go on where the source's would have.
    expect(await target.submit(roll('a1'))).toMatchObject({ version: 1, replayed: true });
    const [fromSource, fromTarget] = await Promise.all([source.actor.submit(roll('a3')), target.submit(roll('a3'))]);
    expect(fromTarget.events).toEqual(fromSource.events);
    // And a new actor over the same storage sees the imported world.
    expect(new RegionActor({ id: 'region-0', sql, now: source.now }).snapshot().version).toBe(3);
  });

  it('opens the schema twice without a step down, and refuses a newer one', () => {
    const sql = memorySql();
    openRegionSchema(sql);
    openRegionSchema(sql);
    expect(sql.exec<{ value: string }>('SELECT value FROM meta WHERE key = ?', 'schema_version')[0]!.value).toBe('2');
    sql.exec('UPDATE meta SET value = ? WHERE key = ?', '9', 'schema_version');
    expect(() => openRegionSchema(sql)).toThrow(/schema 9/);
  });
});
