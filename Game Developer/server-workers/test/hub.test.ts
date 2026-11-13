// The hub as the worker runs it, over fake sockets (server/test/hub.test.ts, adapted): the same checks as the Node
// server's, plus what a Durable Object adds: the sweep for dead phones, the hooks the object hangs on the hub, and a
// hub built again over the same storage and the same sockets, as after a sleep.

import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, newWorld, type ClientMessage, type ServerMessage } from '../../rules/src/index.ts';
import { ringBoard } from '../../rules/test/fixtures/ring.ts';
import { Accounts, openAccountsSchema } from '../src/accounts.ts';
import { Hub, type HubOptions, type Socket } from '../src/hub.ts';
import { RegionActor, openRegionSchema } from '../src/region-actor.ts';
import { memorySql } from './memory-sql.ts';

const JOIN = { type: 'join', protocol: PROTOCOL_VERSION } as const;
const BATCH_MS = 5;
/** Long enough for the hub to flush what it owes. */
const settle = (ms = BATCH_MS * 4) => new Promise((r) => setTimeout(r, ms));

/** A socket as the hub sees it: what was sent to it, whether it was closed, the player it carries, when it was last alive. */
class FakeSocket implements Socket {
  readonly sent: ServerMessage[] = [];
  closed: { code: number; reason: string } | null = null;
  alive = 0;
  private joined: string | null = null;

  send(text: string): void {
    this.sent.push(JSON.parse(text) as ServerMessage);
  }

  close(code: number, reason: string): void {
    this.closed = { code, reason };
  }

  player(): string | null {
    return this.joined;
  }

  setPlayer(player: string | null): void {
    this.joined = player;
  }

  lastAlive(): number {
    return this.alive;
  }

  next(): ServerMessage {
    const m = this.sent.shift();
    if (!m) throw new Error('no message');
    return m;
  }

  /** The next message of a kind; others before it are dropped. */
  nextOf<T extends ServerMessage['type']>(type: T): Extract<ServerMessage, { type: T }> {
    for (;;) {
      const m = this.next();
      if (m.type === type) return m as Extract<ServerMessage, { type: T }>;
    }
  }

  quiet(): boolean {
    return this.sent.length === 0;
  }

  clear(): void {
    this.sent.length = 0;
  }
}

function world(hooks: Pick<HubOptions, 'beforeJoin' | 'onIntent'> = {}) {
  const sql = memorySql();
  openRegionSchema(sql);
  const asql = memorySql();
  openAccountsSchema(asql);
  let clock = 1_000_000;
  const now = () => clock;
  const tick = (ms: number) => (clock += ms);
  // The ring, so the paths stay short; the world itself plays on the island.
  const region = new RegionActor({ id: 'r', sql, now, create: () => ({ seed: 'ring', state: newWorld({ seed: 'ring', board: ringBoard() }) }) });
  const accounts = new Accounts(asql, now);
  const hub = new Hub({ region, accounts, batchMs: BATCH_MS, now, ...hooks });
  const send = (s: FakeSocket, m: ClientMessage | object) => hub.onMessage(s, JSON.stringify(m));
  const socket = () => {
    const s = new FakeSocket();
    s.alive = now();
    hub.attach(s);
    return s;
  };
  /** A socket joined as a new player. */
  const player = async (name: string, classId = 'warrior') => {
    const s = socket();
    await send(s, { ...JOIN, name, classId });
    return { s, snap: s.nextOf('snapshot') };
  };
  return { sql, asql, region, accounts, hub, now, tick, send, socket, player };
}

describe('the hub on the worker', () => {
  it('makes an account for a name and a class and answers with a snapshot: the character at the start, a token, a code, who is online', async () => {
    const w = world();
    const { s, snap } = await w.player('Robin');
    expect(snap.version).toBe(1);
    expect(snap.player).toMatch(/^p-[0-9a-f]{10}$/);
    expect(snap.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(snap.recovery).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(snap.online).toEqual([snap.player]);
    expect(snap.serverTime).toBe(w.now());
    expect(snap.state.characters[snap.player]).toMatchObject({ id: snap.player, name: 'Robin', classId: 'warrior', space: 's0', level: 1 });
    expect(w.accounts.byToken(snap.token!)?.id).toBe(snap.player);
    expect(w.accounts.count()).toBe(1);
    expect(s.player()).toBe(snap.player); // kept with the socket, for after a sleep
    expect(w.hub.online()).toEqual([snap.player]);
  });

  it('a second player joins: both characters in the snapshot; the first hears the newcomer and the new online list in one event', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam', 'mage');
    expect(Object.keys(b.snap.state.characters).sort()).toEqual([a.snap.player, b.snap.player].sort());
    expect(b.snap.online).toEqual([a.snap.player, b.snap.player].sort());
    await settle();
    const ev = a.s.nextOf('event');
    expect(ev.version).toBe(2);
    expect(ev.events).toEqual([{ type: 'joined', action: `join-${b.snap.player}`, player: b.snap.player, name: 'Sam', classId: 'mage', space: 's0' }]);
    expect(ev.delta?.characters?.[b.snap.player]).toMatchObject({ name: 'Sam', classId: 'mage' });
    expect(ev.online).toEqual([a.snap.player, b.snap.player].sort());
    expect(a.s.quiet()).toBe(true);
  });

  it('answers an intent to its sender with the delta, tells the others in one bundled event, and answers the same id from the store', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam');
    await settle();
    a.s.clear();
    await w.send(a.s, { type: 'intent', action: { type: 'roll', id: 'r1' } });
    const res = a.s.nextOf('result');
    expect(res).toMatchObject({ action: 'r1', version: 3, replayed: false, events: [{ type: 'rolled', action: 'r1', player: a.snap.player }] });
    expect(Object.keys(res.delta!).sort()).toEqual(['characters', 'die']);
    const steps = res.delta!.characters![a.snap.player]!.steps;
    expect(steps).toBeGreaterThan(0);
    await settle();
    const ev = b.s.nextOf('event');
    expect(ev.version).toBe(3);
    expect(ev.events).toEqual([]); // a roll is the roller's business; the delta carries the piece
    expect(ev.delta?.characters?.[a.snap.player]?.steps).toBe(steps);
    expect(ev.delta?.characters?.[b.snap.player]).toBeUndefined();
    await w.send(a.s, { type: 'intent', action: { type: 'roll', id: 'r1' } });
    const again = a.s.nextOf('result');
    expect(again).toMatchObject({ action: 'r1', version: 3, replayed: true, events: res.events });
    expect(again.delta).toBeUndefined();
    await settle();
    expect(b.s.quiet()).toBe(true);
    await w.send(a.s, { type: 'intent', action: { type: 'move', id: 'm1', path: Array.from({ length: steps }, (_, i) => `s${i + 1}`) } });
    expect(a.s.nextOf('result').events[0]).toMatchObject({ type: 'moved', player: a.snap.player });
    await settle();
    const heard = b.s.nextOf('event');
    expect(heard.events[0]).toMatchObject({ type: 'moved', player: a.snap.player });
    expect(heard.delta?.characters?.[a.snap.player]?.space).toBe(`s${steps}`);
  });

  it('stamps the account on the action whatever the client wrote, and refuses a tick, a join and an unknown action', async () => {
    const w = world();
    const a = await w.player('Robin');
    await w.send(a.s, { type: 'intent', action: { type: 'roll', id: 'x', player: 'someone-else' } });
    expect(a.s.nextOf('result').events[0]).toMatchObject({ type: 'rolled', player: a.snap.player });
    await w.send(a.s, { type: 'intent', action: { type: 'tick', id: 't' } });
    expect(a.s.next()).toEqual({ type: 'error', reason: 'not yours to send', action: 't' });
    await w.send(a.s, { type: 'intent', action: { type: 'join', id: 'j', name: 'X', classId: 'mage' } });
    expect(a.s.next()).toEqual({ type: 'error', reason: 'not yours to send', action: 'j' });
    await w.send(a.s, { type: 'intent', action: { type: 'dance', id: 'd' } });
    expect(a.s.next()).toEqual({ type: 'error', reason: 'unknown action', action: 'd' });
    await w.send(a.s, { type: 'intent', action: { type: 'roll' } });
    expect(a.s.next()).toEqual({ type: 'error', reason: 'an action needs an id and a type' });
    expect(w.region.currentVersion).toBe(2);
  });

  it('refuses what comes before a join, a frame that is not JSON, a binary frame, the wrong protocol, an unknown token or code, a second join', async () => {
    const w = world();
    const s = w.socket();
    await w.send(s, { type: 'ping' });
    expect(s.next()).toEqual({ type: 'pong', serverTime: w.now() }); // awake, the hub answers; asleep, the runtime does, without the time
    await w.send(s, { type: 'intent', action: { type: 'roll', id: 'r' } });
    expect(s.next()).toEqual({ type: 'error', reason: 'join first' });
    await w.hub.onMessage(s, '{nope');
    expect(s.next()).toEqual({ type: 'error', reason: 'not JSON' });
    await w.hub.onMessage(s, new ArrayBuffer(4));
    expect(s.next()).toEqual({ type: 'error', reason: 'not JSON' });
    await w.hub.onMessage(s, JSON.stringify({ type: 'ping', pad: 'x'.repeat(17 * 1024) }));
    expect(s.next()).toEqual({ type: 'error', reason: 'too big' });
    await w.send(s, { type: 'what' });
    expect(s.next()).toEqual({ type: 'error', reason: 'unknown message' });
    await w.send(s, { type: 'join', protocol: 99, name: 'R', classId: 'warrior' });
    expect(s.next()).toEqual({ type: 'error', reason: `protocol ${PROTOCOL_VERSION} needed` });
    await w.send(s, { ...JOIN, token: 'no-such-token' });
    expect(s.next()).toEqual({ type: 'error', reason: 'unknown account' });
    await w.send(s, { ...JOIN, recover: 'AAAA-AAAA-AAAA' });
    expect(s.next()).toEqual({ type: 'error', reason: 'unknown code' });
    await w.send(s, { ...JOIN, name: '   ', classId: 'warrior' });
    expect(s.next()).toEqual({ type: 'error', reason: 'a name and a class are needed' });
    await w.send(s, { ...JOIN, name: 'R', classId: 'bard' });
    expect(s.next()).toEqual({ type: 'error', reason: 'a name and a class are needed' });
    expect(w.accounts.count()).toBe(0);
    await w.send(s, { ...JOIN, name: 'R', classId: 'warrior' });
    const snap = s.nextOf('snapshot');
    await w.send(s, { ...JOIN, token: snap.token });
    expect(s.next()).toEqual({ type: 'error', reason: 'already joined' });
  });

  it('a new socket with the token gets a fresh snapshot at the latest version; the code gives a new token for a new phone, same character', async () => {
    const w = world();
    const a = await w.player('Robin');
    await w.send(a.s, { type: 'intent', action: { type: 'roll', id: 'r1' } });
    const rolled = a.s.nextOf('result');
    w.hub.onClose(a.s);
    expect(w.hub.online()).toEqual([]);
    const b = w.socket();
    await w.send(b, { ...JOIN, token: a.snap.token });
    const back = b.nextOf('snapshot');
    expect(back.player).toBe(a.snap.player);
    expect(back.version).toBe(rolled.version);
    expect(back.token).toBeUndefined();
    expect(back.recovery).toBe(a.snap.recovery);
    expect(back.state.characters[a.snap.player]!.steps).toBeGreaterThan(0);
    expect(back.online).toEqual([a.snap.player]);
    const phone = w.socket();
    await w.send(phone, { ...JOIN, recover: a.snap.recovery });
    const recovered = phone.nextOf('snapshot');
    expect(recovered.player).toBe(a.snap.player);
    expect(recovered.token).toBeDefined();
    expect(recovered.token).not.toBe(a.snap.token);
    expect(recovered.online).toEqual([a.snap.player]); // one player, two phones
    expect(w.accounts.byToken(recovered.token!)?.id).toBe(a.snap.player);
    expect(w.accounts.byToken(a.snap.token!)?.id).toBe(a.snap.player); // the first phone still works
    await settle();
    expect(b.quiet()).toBe(true); // nothing new to tell: the same player came again
  });

  it('links two phones: the server rolls the code, the friend types it, and the first phone hears', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam', 'mage');
    await settle();
    a.s.clear();
    await w.send(a.s, { type: 'intent', action: { type: 'link', id: 'l1', op: 'offer' } });
    const offered = a.s.nextOf('result').events.find((e) => e.type === 'linkOffered');
    const code = offered?.type === 'linkOffered' ? offered.code : '';
    expect(code).toMatch(/^[A-Z]{6}$/);
    await w.send(b.s, { type: 'intent', action: { type: 'link', id: 'l2', op: 'accept', code } });
    expect(b.s.nextOf('result').events[0]).toMatchObject({ type: 'linked', player: b.snap.player, with: a.snap.player });
    await settle();
    const heard = a.s.nextOf('event');
    expect(heard.events[0]).toMatchObject({ type: 'linked', with: a.snap.player });
    expect(heard.delta?.characters?.[a.snap.player]?.link?.with).toBe(b.snap.player);
  });

  it('refuses a flood and then cuts the socket off, after the answers it is owed', async () => {
    const w = world();
    const a = await w.player('Robin');
    await Promise.all(Array.from({ length: 45 }, (_, i) => w.send(a.s, { type: 'intent', action: { type: 'roll', id: `f${i}` } })));
    const results = a.s.sent.filter((m) => m.type === 'result').length;
    expect(results).toBe(30);
    // Thirty are taken; the eleventh refusal cuts the socket off, and what still comes finds nobody joined on it.
    expect(a.s.sent.filter((m) => m.type === 'error' && m.reason === 'too fast').length).toBe(11);
    expect(a.s.sent.filter((m) => m.type === 'error' && m.reason === 'join first').length).toBe(4);
    expect(a.s.closed).toEqual({ code: 1008, reason: 'too fast' });
    expect(w.hub.online()).toEqual([]);
    expect(a.s.player()).toBeNull();
  });

  it('leave closes the socket and the others see the player go; a dropped socket does the same', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam');
    const c = await w.player('Kim');
    await settle();
    a.s.clear();
    await w.send(b.s, { type: 'leave' });
    expect(b.s.closed).toEqual({ code: 1000, reason: 'left' });
    await settle();
    expect(a.s.nextOf('event').online).toEqual([a.snap.player, c.snap.player].sort());
    w.hub.onClose(c.s);
    await settle();
    expect(a.s.nextOf('event').online).toEqual([a.snap.player]);
    expect(w.hub.online()).toEqual([a.snap.player]);
  });

  it('the world tick reaches everyone as an event with the spawns', async () => {
    const w = world();
    const a = await w.player('Robin');
    let spawned = false;
    for (let i = 0; i < 80 && !spawned; i++) {
      const r = await w.hub.tick();
      spawned = r.events.some((e) => e.type === 'spawned');
    }
    expect(spawned).toBe(true);
    await settle();
    const ev = a.s.nextOf('event');
    expect(ev.events[0]).toMatchObject({ type: 'spawned' });
    expect(Object.keys(ev.delta!)).toEqual(['spawns']);
    expect(Object.keys(ev.delta!.spawns!).length).toBe(1);
  });

  it('sweeps a socket that has shown no life, and the others hear the player go; a socket whose ping was answered stays', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam');
    await settle();
    a.s.clear();
    b.s.clear();
    w.tick(100_000);
    b.s.alive = w.now() - 30_000; // its pings were answered in the object's sleep
    expect(w.hub.sweep(90_000)).toEqual([a.snap.player]);
    expect(a.s.closed).toEqual({ code: 1001, reason: 'gone' });
    expect(b.s.closed).toBeNull();
    expect(w.hub.online()).toEqual([b.snap.player]);
    await settle();
    expect(b.s.nextOf('event').online).toEqual([b.snap.player]);
    // A frame counts as life too.
    w.tick(100_000);
    await w.send(b.s, { type: 'ping' });
    expect(w.hub.sweep(90_000)).toEqual([]);
  });

  it('finds its players again after a sleep: a new hub over the same storage and the same sockets', async () => {
    const w = world();
    const a = await w.player('Robin');
    const b = await w.player('Sam');
    await settle();
    // The object slept and woke: a fresh hub, the sockets found again with their players.
    const woken = new Hub({ region: new RegionActor({ id: 'r', sql: w.sql, now: w.now }), accounts: new Accounts(w.asql, w.now), batchMs: BATCH_MS, now: w.now });
    woken.attach(a.s);
    woken.attach(b.s);
    expect(woken.online()).toEqual([a.snap.player, b.snap.player].sort());
    a.s.clear();
    b.s.clear();
    await woken.onMessage(a.s, JSON.stringify({ type: 'intent', action: { type: 'roll', id: 'after-sleep' } }));
    expect(a.s.nextOf('result')).toMatchObject({ action: 'after-sleep', version: 3, replayed: false });
    await settle();
    expect(b.s.nextOf('event').delta?.characters?.[a.snap.player]).toBeDefined();
  });

  it('runs the object\'s hooks: beforeJoin before the snapshot is taken, onIntent after each intent the actor took', async () => {
    const calls: string[] = [];
    let w: ReturnType<typeof world>;
    w = world({
      beforeJoin: async () => {
        calls.push('beforeJoin');
        await w.hub.tick(); // what the object does: the world brought up to date
      },
      onIntent: () => calls.push('onIntent'),
    });
    const a = await w.player('Robin');
    expect(calls).toEqual(['beforeJoin']);
    expect(a.snap.version).toBeGreaterThanOrEqual(1); // the tick ran before the snapshot was taken
    await w.send(a.s, { type: 'intent', action: { type: 'roll', id: 'r1' } });
    await w.send(a.s, { type: 'intent', action: { type: 'dance', id: 'd' } });
    expect(calls).toEqual(['beforeJoin', 'onIntent']);
  });
});
