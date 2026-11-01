import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { PROTOCOL_VERSION, newWorld, type ClientMessage, type ServerMessage } from '../../rules/src/index.ts';
import { ringBoard } from '../../rules/test/fixtures/ring.ts';
import { Accounts, plainCode, showCode } from '../src/accounts.ts';
import { openDb } from '../src/db.ts';
import { Hub } from '../src/hub.ts';
import { RegionActor } from '../src/region-actor.ts';

const JOIN = { type: 'join', protocol: PROTOCOL_VERSION } as const;
type Snapshot = Extract<ServerMessage, { type: 'snapshot' }>;

/** A test client: sends messages, hands them back one at a time. */
class Client {
  private readonly ws: WebSocket;
  private readonly queue: ServerMessage[] = [];
  private waiting: ((m: ServerMessage) => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (d) => {
      const m = JSON.parse(String(d)) as ServerMessage;
      if (this.waiting) {
        const w = this.waiting;
        this.waiting = null;
        w(m);
      } else this.queue.push(m);
    });
    this.ws.on('close', () => {
      this.closed = true;
    });
  }

  async open(): Promise<this> {
    await once(this.ws, 'open');
    return this;
  }

  send(m: ClientMessage | object): void {
    this.ws.send(JSON.stringify(m));
  }

  raw(text: string): void {
    this.ws.send(text);
  }

  next(ms = 2000): Promise<ServerMessage> {
    if (this.queue.length) return Promise.resolve(this.queue.shift()!);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.waiting = null;
        reject(new Error(`no message within ${ms} ms`));
      }, ms);
      this.waiting = (m) => {
        clearTimeout(t);
        resolve(m);
      };
    });
  }

  /** The next message of a kind; others before it are dropped. */
  async nextOf<T extends ServerMessage['type']>(type: T, ms = 2000): Promise<Extract<ServerMessage, { type: T }>> {
    for (;;) {
      const m = await this.next(ms);
      if (m.type === type) return m as Extract<ServerMessage, { type: T }>;
    }
  }

  /** True when nothing arrives for a while. */
  async quiet(ms = 150): Promise<boolean> {
    try {
      await this.next(ms);
      return false;
    } catch {
      return true;
    }
  }

  /** Wait until nothing more arrives, dropping what did. */
  async drain(): Promise<void> {
    while (!(await this.quiet(80))) {
      // keep dropping
    }
  }

  async closedSoon(ms = 2000): Promise<boolean> {
    if (this.closed) return true;
    await Promise.race([once(this.ws, 'close'), new Promise((r) => setTimeout(r, ms))]);
    return this.closed;
  }

  close(): void {
    this.ws.close();
  }
}

async function server(batchMs = 5) {
  const db = openDb(':memory:');
  // The ring, so the paths stay short; the server itself plays on the world.
  const region = new RegionActor({ id: 'r', db, create: () => ({ seed: 'ring', state: newWorld({ seed: 'ring', board: ringBoard() }) }) });
  const accounts = new Accounts(db);
  const hub = new Hub({ region, accounts, batchMs });
  const wss = new WebSocketServer({ port: 0 });
  wss.on('connection', (ws) => hub.attach(ws));
  await once(wss, 'listening');
  const url = `ws://127.0.0.1:${(wss.address() as AddressInfo).port}`;
  const stop = () => {
    hub.close();
    wss.close();
    db.close();
  };
  const client = () => new Client(url).open();
  /** A client joined as a new player. */
  const player = async (name: string, classId = 'warrior'): Promise<{ c: Client; snap: Snapshot }> => {
    const c = await client();
    c.send({ ...JOIN, name, classId });
    return { c, snap: await c.nextOf('snapshot') };
  };
  return { db, region, accounts, hub, url, stop, client, player };
}

describe('the hub', () => {
  let stop: (() => void) | null = null;
  afterEach(() => {
    stop?.();
    stop = null;
  });

  it('makes an account for a name and a class and answers with a snapshot: the character at the start, a token, a code, who is online', async () => {
    const s = await server();
    stop = s.stop;
    const { snap } = await s.player('Robin');
    expect(snap.version).toBe(1);
    expect(snap.player).toMatch(/^p-[0-9a-f]{10}$/);
    expect(snap.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(snap.recovery).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(snap.recovery).not.toMatch(/[01OI]/);
    expect(snap.online).toEqual([snap.player]);
    expect(typeof snap.serverTime).toBe('number');
    expect(snap.state.characters[snap.player]).toMatchObject({ id: snap.player, name: 'Robin', classId: 'warrior', space: 's0', level: 1 });
    expect(s.accounts.byToken(snap.token!)?.id).toBe(snap.player);
    expect(s.accounts.byRecovery(snap.recovery.toLowerCase().replace(/-/g, ' '))?.id).toBe(snap.player);
    expect(s.accounts.count()).toBe(1);
  });

  it('a second player joins: both characters in the snapshot; the first hears the newcomer and the new online list in one event', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    const b = await s.player('Sam', 'mage');
    expect(Object.keys(b.snap.state.characters).sort()).toEqual([a.snap.player, b.snap.player].sort());
    expect(b.snap.online).toEqual([a.snap.player, b.snap.player].sort());
    const ev = await a.c.nextOf('event');
    expect(ev.version).toBe(2);
    expect(ev.events).toEqual([{ type: 'joined', action: `join-${b.snap.player}`, player: b.snap.player, name: 'Sam', classId: 'mage', space: 's0' }]);
    expect(ev.delta?.characters?.[b.snap.player]).toMatchObject({ name: 'Sam', classId: 'mage' });
    expect(ev.online).toEqual([a.snap.player, b.snap.player].sort());
    expect(await a.c.quiet()).toBe(true);
  });

  it('answers an intent to its sender with the delta, tells the others in one bundled event, and answers the same id from the store', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    const b = await s.player('Sam');
    await a.c.nextOf('event');
    a.c.send({ type: 'intent', action: { type: 'roll', id: 'r1' } });
    const res = await a.c.nextOf('result');
    expect(res).toMatchObject({ action: 'r1', version: 3, replayed: false, events: [{ type: 'rolled', action: 'r1', player: a.snap.player }] });
    expect(Object.keys(res.delta!).sort()).toEqual(['characters', 'die']);
    expect(res.delta!.characters![a.snap.player]!.steps).toBeGreaterThan(0);
    const ev = await b.c.nextOf('event');
    expect(ev.version).toBe(3);
    expect(ev.events).toEqual([]); // a roll is the roller's business; the delta carries the piece
    expect(ev.delta?.characters?.[a.snap.player]?.steps).toBe(res.delta!.characters![a.snap.player]!.steps);
    expect(ev.delta?.characters?.[b.snap.player]).toBeUndefined();
    a.c.send({ type: 'intent', action: { type: 'roll', id: 'r1' } });
    const again = await a.c.nextOf('result');
    expect(again).toMatchObject({ action: 'r1', version: 3, replayed: true, events: res.events });
    expect(again.delta).toBeUndefined();
    expect(await b.c.quiet()).toBe(true);
    // Two moves of the world in one breath reach the other as one event.
    const steps = res.delta!.characters![a.snap.player]!.steps;
    a.c.send({ type: 'intent', action: { type: 'move', id: 'm1', path: Array.from({ length: steps }, (_, i) => `s${i + 1}`) } });
    const moved = await a.c.nextOf('result');
    expect(moved.events[0]).toMatchObject({ type: 'moved', player: a.snap.player });
    const heard = await b.c.nextOf('event');
    expect(heard.events[0]).toMatchObject({ type: 'moved', player: a.snap.player });
    expect(heard.delta?.characters?.[a.snap.player]?.space).toBe(`s${steps}`);
  });

  it('stamps the account on the action whatever the client wrote, and refuses a tick, a join and an unknown action', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    a.c.send({ type: 'intent', action: { type: 'roll', id: 'x', player: 'someone-else' } });
    expect((await a.c.nextOf('result')).events[0]).toMatchObject({ type: 'rolled', player: a.snap.player });
    a.c.send({ type: 'intent', action: { type: 'tick', id: 't' } });
    expect(await a.c.next()).toEqual({ type: 'error', reason: 'not yours to send', action: 't' });
    a.c.send({ type: 'intent', action: { type: 'join', id: 'j', name: 'X', classId: 'mage' } });
    expect(await a.c.next()).toEqual({ type: 'error', reason: 'not yours to send', action: 'j' });
    a.c.send({ type: 'intent', action: { type: 'dance', id: 'd' } });
    expect(await a.c.next()).toEqual({ type: 'error', reason: 'unknown action', action: 'd' });
    a.c.send({ type: 'intent', action: { type: 'roll' } });
    expect(await a.c.next()).toEqual({ type: 'error', reason: 'an action needs an id and a type' });
    expect(s.region.currentVersion).toBe(2);
  });

  it('refuses what comes before a join, a frame that is not JSON, the wrong protocol, an unknown token or code, a second join', async () => {
    const s = await server();
    stop = s.stop;
    const c = await s.client();
    c.send({ type: 'ping' });
    expect(await c.next()).toMatchObject({ type: 'pong' });
    c.send({ type: 'intent', action: { type: 'roll', id: 'r' } });
    expect(await c.next()).toEqual({ type: 'error', reason: 'join first' });
    c.raw('{nope');
    expect(await c.next()).toEqual({ type: 'error', reason: 'not JSON' });
    c.send({ type: 'what' });
    expect(await c.next()).toEqual({ type: 'error', reason: 'unknown message' });
    c.send({ type: 'join', protocol: 99, name: 'R', classId: 'warrior' });
    expect(await c.next()).toEqual({ type: 'error', reason: `protocol ${PROTOCOL_VERSION} needed` });
    c.send({ ...JOIN, token: 'no-such-token' });
    expect(await c.next()).toEqual({ type: 'error', reason: 'unknown account' });
    c.send({ ...JOIN, recover: 'AAAA-AAAA-AAAA' });
    expect(await c.next()).toEqual({ type: 'error', reason: 'unknown code' });
    c.send({ ...JOIN, name: '   ', classId: 'warrior' });
    expect(await c.next()).toEqual({ type: 'error', reason: 'a name and a class are needed' });
    c.send({ ...JOIN, name: 'R', classId: 'bard' });
    expect(await c.next()).toEqual({ type: 'error', reason: 'a name and a class are needed' });
    expect(s.accounts.count()).toBe(0);
    c.send({ ...JOIN, name: 'R', classId: 'warrior' });
    const snap = await c.nextOf('snapshot');
    c.send({ ...JOIN, token: snap.token });
    expect(await c.next()).toEqual({ type: 'error', reason: 'already joined' });
  });

  it('a new socket with the token gets a fresh snapshot at the latest version; the code gives a new token for a new phone, same character', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    a.c.send({ type: 'intent', action: { type: 'roll', id: 'r1' } });
    const rolled = await a.c.nextOf('result');
    a.c.close();
    await a.c.closedSoon();
    const b = await s.client();
    b.send({ ...JOIN, token: a.snap.token });
    const back = await b.nextOf('snapshot');
    expect(back.player).toBe(a.snap.player);
    expect(back.version).toBe(rolled.version);
    expect(back.token).toBeUndefined();
    expect(back.recovery).toBe(a.snap.recovery);
    expect(back.state.characters[a.snap.player]!.steps).toBeGreaterThan(0);
    expect(back.online).toEqual([a.snap.player]);
    const phone = await s.client();
    phone.send({ ...JOIN, recover: a.snap.recovery });
    const recovered = await phone.nextOf('snapshot');
    expect(recovered.player).toBe(a.snap.player);
    expect(recovered.token).toBeDefined();
    expect(recovered.token).not.toBe(a.snap.token);
    expect(recovered.online).toEqual([a.snap.player]); // one player, two phones
    expect(s.accounts.byToken(recovered.token!)?.id).toBe(a.snap.player);
    expect(s.accounts.byToken(a.snap.token!)?.id).toBe(a.snap.player); // the first phone still works
    expect(await b.quiet()).toBe(true); // nothing new to tell: the same player came again
  });

  it('refuses a flood and then cuts the socket off', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    for (let i = 0; i < 45; i++) a.c.send({ type: 'intent', action: { type: 'roll', id: `f${i}` } });
    const seen: ServerMessage[] = [];
    while (seen.length < 45) {
      try {
        seen.push(await a.c.next(500));
      } catch {
        break;
      }
    }
    // Thirty are taken; the rest are refused, and the socket is cut while the first answers are still on their way.
    const results = seen.filter((m) => m.type === 'result').length;
    expect(results).toBeGreaterThan(0);
    expect(results).toBeLessThanOrEqual(30);
    expect(seen.filter((m) => m.type === 'error' && m.reason === 'too fast').length).toBeGreaterThanOrEqual(1);
    expect(await a.c.closedSoon()).toBe(true);
    expect(s.hub.online()).toEqual([]);
  });

  it('leave closes the socket and the others see the player go; a dropped socket does the same', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    const b = await s.player('Sam');
    const c = await s.player('Kim');
    await a.c.drain(); // the two newcomers, in one event or two
    await b.c.drain();
    b.c.send({ type: 'leave' });
    expect(await b.c.closedSoon()).toBe(true);
    expect((await a.c.nextOf('event')).online).toEqual([a.snap.player, c.snap.player].sort());
    c.c.close();
    expect((await a.c.nextOf('event')).online).toEqual([a.snap.player]);
    expect(s.hub.online()).toEqual([a.snap.player]);
  });

  it('the world tick reaches everyone as an event with the spawns', async () => {
    const s = await server();
    stop = s.stop;
    const a = await s.player('Robin');
    let spawned = false;
    for (let i = 0; i < 80 && !spawned; i++) {
      const r = await s.hub.tick();
      spawned = r.events.some((e) => e.type === 'spawned');
    }
    expect(spawned).toBe(true);
    const ev = await a.c.nextOf('event');
    expect(ev.events[0]).toMatchObject({ type: 'spawned' });
    expect(Object.keys(ev.delta!)).toEqual(['spawns']);
    expect(Object.keys(ev.delta!.spawns!).length).toBe(1);
  });
});

describe('recovery codes', () => {
  it('read the same however they are typed', () => {
    expect(plainCode(' kpm4-r7qx 2hjd ')).toBe('KPM4R7QX2HJD');
    expect(showCode('KPM4R7QX2HJD')).toBe('KPM4-R7QX-2HJD');
  });

  it('open the database twice without a step down, and the accounts table is there', () => {
    const db = openDb(':memory:');
    expect((db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as { value: string }).value).toBe('2');
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('accounts', 'tokens')").all().length).toBe(2);
    db.close();
  });
});
