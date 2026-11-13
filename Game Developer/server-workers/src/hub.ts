// The hub on Cloudflare: the protocol, over whatever carries the frames. The same job as the Node server's hub
// (server/src/hub.ts): read every frame, stamp the account's id on each intent, hand it to the region actor, answer the
// sender, and bundle what everyone else should hear (docs/state/protocol.md). It knows a connection only through the
// small `Socket` interface, so the Durable Object (index.ts) wraps its hibernating WebSockets and the tests
// (test/hub.test.ts) use fakes. Nothing here decides a game outcome.

import {
  BATCH_MS,
  CLASS_IDS,
  MAX_FRAME,
  MAX_NAME,
  PROTOCOL_VERSION,
  RATE,
  mergeDeltas,
  type Action,
  type ClassId,
  type ClientMessage,
  type Delta,
  type GameEvent,
  type ServerMessage,
  type WireAction,
} from '../../rules/src/index.ts';
import type { Account } from './accounts.ts';
import type { ActionResult, RegionActor } from './region-actor.ts';

/** The actions a client may send; the rest are the server's own. */
const WIRE_ACTIONS = new Set<string>(['sleep', 'link', 'travel', 'try', 'roll', 'move', 'fight', 'buy', 'skill', 'challenge', 'sell', 'equip', 'unequip', 'drop', 'use', 'gamble', 'arena', 'door', 'stroll', 'home', 'quest', 'keep', 'trace', 'dream']);
/** The events the others hear about: what shows on the board or is worth a line. A fight's blows stay with the fighter. */
const SHARED_EVENTS = new Set<GameEvent['type']>(['linked', 'joined', 'moved', 'won', 'died', 'opened', 'bossDown', 'levelled', 'spawned', 'despawned', 'questDone', 'traced', 'worldBossDown', 'bossLeft']);

type JoinMessage = Extract<ClientMessage, { type: 'join' }>;
type IntentMessage = Extract<ClientMessage, { type: 'intent' }>;
type MaybePromise<T> = T | Promise<T>;

/**
 * A connection as the hub sees it. A Durable Object forgets its memory when it hibernates and finds its sockets again
 * when it wakes, so the one fact that must survive, who is joined on the socket, is kept with the socket itself.
 */
export interface Socket {
  /** Send a text frame; nothing happens on a socket that is closed. */
  send(text: string): void;
  close(code: number, reason: string): void;
  /** The player joined on this socket, or null before the join. */
  player(): string | null;
  setPlayer(player: string | null): void;
  /** When the socket was last known alive without the hub hearing a frame: accepted, or its ping answered in its sleep. */
  lastAlive(): number;
}

/** The accounts, wherever they live: the `Accounts` class itself in the tests, the accounts object's stub in the worker. */
export interface AccountStore {
  byToken(token: string): MaybePromise<Account | null>;
  byRecovery(code: string): MaybePromise<Account | null>;
  create(o: { name: string; classId: ClassId; regionId: string }): MaybePromise<{ account: Account; token: string }>;
  newToken(accountId: string): MaybePromise<string>;
  touch(accountId: string): MaybePromise<void>;
}

interface Owed {
  version: number;
  events: GameEvent[];
  delta: Delta | null;
  online: string[] | null;
}

interface Conn {
  socket: Socket;
  player: string | null;
  /** When the last intents arrived, for the rate limit. */
  recent: number[];
  strikes: number;
  /** Intents handed to the actor and not yet answered. */
  inflight: number;
  /** True once a flooder is cut off: the answers still owed go out, then the socket closes. */
  cut: boolean;
  /** What this socket hears in its next `event`, gathered for `batchMs`. */
  owed: Owed | null;
  timer: ReturnType<typeof setTimeout> | null;
  /** When a frame last came in on this socket, in this object's memory (0 since it last woke). */
  seen: number;
}

export interface HubOptions {
  region: RegionActor;
  accounts: AccountStore;
  now?: () => number;
  batchMs?: number;
  log?: (line: string) => void;
  /** Runs before a joining player's snapshot is taken: the object brings the world up to date (a tick that is due). */
  beforeJoin?: () => MaybePromise<void>;
  /** Runs after each intent the actor took: the object keeps its alarm close while people play. */
  onIntent?: () => void;
}

export class Hub {
  private readonly region: RegionActor;
  private readonly accounts: AccountStore;
  private readonly now: () => number;
  private readonly batchMs: number;
  private readonly log: (line: string) => void;
  private readonly beforeJoin: (() => MaybePromise<void>) | null;
  private readonly onIntent: (() => void) | null;
  private readonly conns = new Map<Socket, Conn>();
  private lastOnline = '';

  constructor(o: HubOptions) {
    this.region = o.region;
    this.accounts = o.accounts;
    this.now = o.now ?? (() => Date.now());
    this.batchMs = o.batchMs ?? BATCH_MS;
    this.log = o.log ?? (() => undefined);
    this.beforeJoin = o.beforeJoin ?? null;
    this.onIntent = o.onIntent ?? null;
  }

  /** Take a socket: one just accepted, or one found again after the object slept (its player comes with it). */
  attach(socket: Socket): void {
    if (this.conns.has(socket)) return;
    this.conns.set(socket, { socket, player: socket.player(), recent: [], strikes: 0, inflight: 0, cut: false, owed: null, timer: null, seen: 0 });
  }

  /** The players with a socket right now, each once, sorted. */
  online(): string[] {
    const ids = new Set<string>();
    for (const c of this.conns.values()) if (c.player) ids.add(c.player);
    return [...ids].sort();
  }

  /** A frame from a socket. */
  async onMessage(socket: Socket, data: string | ArrayBuffer): Promise<void> {
    this.attach(socket);
    const conn = this.conns.get(socket)!;
    conn.seen = this.now();
    if (typeof data !== 'string') return this.error(conn, 'not JSON');
    if (new TextEncoder().encode(data).length > MAX_FRAME) return this.error(conn, 'too big');
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data) as ClientMessage;
    } catch {
      return this.error(conn, 'not JSON');
    }
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return this.error(conn, 'unknown message');
    switch (msg.type) {
      case 'ping':
        return this.send(conn, { type: 'pong', serverTime: this.now() });
      case 'join':
        return this.join(conn, msg);
      case 'intent':
        return this.intent(conn, msg);
      case 'leave':
        this.drop(conn);
        conn.socket.close(1000, 'left');
        return;
      default:
        return this.error(conn, 'unknown message');
    }
  }

  /** The socket closed or broke: the player is off `online` and the others hear it. */
  onClose(socket: Socket): void {
    const conn = this.conns.get(socket);
    if (conn) this.drop(conn);
  }

  /** The world moves on the server's clock; everyone connected hears what changed. */
  async tick(): Promise<ActionResult> {
    const r = await this.region.submit({ type: 'tick', id: crypto.randomUUID(), player: 'world' });
    if (r.delta) this.tell(null, r.version, r.events, r.delta);
    return r;
  }

  /**
   * Drop the sockets that have shown no life for `idleMs`: a phone that died without a close frame (the client pings
   * every 20 s; the object answers in its sleep and remembers when). The players dropped, for the log.
   */
  sweep(idleMs: number): string[] {
    const now = this.now();
    const gone: string[] = [];
    for (const c of [...this.conns.values()]) {
      const alive = Math.max(c.seen, c.socket.lastAlive());
      if (now - alive <= idleMs) continue;
      if (c.player) gone.push(c.player);
      this.drop(c);
      c.socket.close(1001, 'gone');
    }
    return gone;
  }

  private async join(conn: Conn, msg: JoinMessage): Promise<void> {
    if (conn.player) return this.error(conn, 'already joined');
    if (msg.protocol !== PROTOCOL_VERSION) return this.error(conn, `protocol ${PROTOCOL_VERSION} needed`);
    let account: Account | null = null;
    let token: string | undefined;
    if (typeof msg.token === 'string') {
      account = await this.accounts.byToken(msg.token);
      if (!account) return this.error(conn, 'unknown account');
    } else if (typeof msg.recover === 'string') {
      account = await this.accounts.byRecovery(msg.recover);
      if (!account) return this.error(conn, 'unknown code');
      token = await this.accounts.newToken(account.id);
    } else {
      const name = typeof msg.name === 'string' ? msg.name.trim().slice(0, MAX_NAME) : '';
      const classId = msg.classId;
      if (!name || !isClassId(classId)) return this.error(conn, 'a name and a class are needed');
      const made = await this.accounts.create({ name, classId, regionId: this.region.id });
      const r = await this.region.submit({ type: 'join', id: `join-${made.account.id}`, player: made.account.id, name, classId });
      const first = r.events[0];
      if (first?.type === 'rejected') return this.error(conn, `refused: ${first.reason}`);
      account = made.account;
      token = made.token;
      if (r.delta) this.tell(conn, r.version, r.events, r.delta);
      this.log(`new account ${account.id}: ${name} the ${classId}`);
    }
    if (this.beforeJoin) await this.beforeJoin();
    if (!this.conns.has(conn.socket)) return; // closed while the actor worked
    conn.player = account.id;
    conn.socket.setPlayer(account.id);
    await this.accounts.touch(account.id);
    const snap = this.region.snapshot();
    this.send(conn, {
      type: 'snapshot',
      version: snap.version,
      serverTime: this.now(),
      player: account.id,
      ...(token ? { token } : {}),
      recovery: account.recovery,
      state: snap.state,
      online: this.online(),
    });
    this.log(`${account.id} joined (${this.online().length} online)`);
    this.tellOnline(conn);
  }

  private async intent(conn: Conn, msg: IntentMessage): Promise<void> {
    const player = conn.player;
    if (!player) return this.error(conn, 'join first');
    const a = msg.action as Partial<WireAction> | undefined;
    if (!a || typeof a !== 'object' || typeof a.id !== 'string' || typeof a.type !== 'string') return this.error(conn, 'an action needs an id and a type');
    if (a.type === 'tick' || a.type === 'join') return this.error(conn, 'not yours to send', a.id);
    if (!WIRE_ACTIONS.has(a.type)) return this.error(conn, 'unknown action', a.id);
    if (!this.allowed(conn)) {
      conn.strikes += 1;
      this.error(conn, 'too fast', a.id);
      if (conn.strikes > RATE.closeAfter) this.cut(conn);
      return;
    }
    conn.inflight += 1;
    try {
      let r: ActionResult;
      try {
        r = await this.region.submit({ ...(a as WireAction), player } as Action);
      } catch (e) {
        this.log(`action ${a.type} from ${player} broke the rules: ${String(e)}`);
        return this.error(conn, 'that could not be done', a.id);
      }
      this.send(conn, { type: 'result', action: a.id, version: r.version, serverTime: this.now(), events: r.events, replayed: r.replayed, ...(r.delta ? { delta: r.delta } : {}) });
      if (r.delta) this.tell(conn, r.version, r.events, r.delta);
      this.onIntent?.();
    } finally {
      conn.inflight -= 1;
      if (conn.cut && conn.inflight === 0) conn.socket.close(1008, 'too fast');
    }
  }

  /**
   * A flooder is cut off: it is no longer in the world, the intents the actor already took are still answered (a phone
   * must never lose an answer to something that happened), and the socket closes once the last answer is out.
   */
  private cut(conn: Conn): void {
    if (conn.cut) return;
    conn.cut = true;
    this.drop(conn);
    if (conn.inflight === 0) conn.socket.close(1008, 'too fast');
  }

  /** The rate limit: `RATE.intents` in any `RATE.windowMs`. */
  private allowed(conn: Conn): boolean {
    const now = this.now();
    conn.recent = conn.recent.filter((t) => now - t < RATE.windowMs);
    if (conn.recent.length >= RATE.intents) return false;
    conn.recent.push(now);
    return true;
  }

  /** Everyone joined but `except` hears what changed, bundled. */
  private tell(except: Conn | null, version: number, events: GameEvent[], delta: Delta): void {
    const shared = events.filter((e) => SHARED_EVENTS.has(e.type));
    for (const c of this.conns.values()) {
      if (c === except || !c.player) continue;
      this.owe(c, { version, events: shared, delta, online: null });
    }
  }

  /** Who is online changed: everyone joined but `except` hears the new list, if it is new. */
  private tellOnline(except: Conn | null): void {
    const online = this.online();
    const key = online.join(',');
    if (key === this.lastOnline) return;
    this.lastOnline = key;
    for (const c of this.conns.values()) {
      if (c === except || !c.player) continue;
      this.owe(c, { version: this.region.currentVersion, events: [], delta: null, online });
    }
  }

  private owe(c: Conn, part: Owed): void {
    if (!c.owed) c.owed = { version: part.version, events: [], delta: null, online: null };
    c.owed.version = Math.max(c.owed.version, part.version);
    c.owed.events.push(...part.events);
    if (part.delta) c.owed.delta = c.owed.delta ? mergeDeltas(c.owed.delta, part.delta) : part.delta;
    if (part.online) c.owed.online = part.online;
    if (!c.timer) c.timer = setTimeout(() => this.flush(c), this.batchMs);
  }

  private flush(c: Conn): void {
    c.timer = null;
    const owed = c.owed;
    c.owed = null;
    if (!owed) return;
    this.send(c, { type: 'event', version: owed.version, serverTime: this.now(), events: owed.events, ...(owed.delta ? { delta: owed.delta } : {}), ...(owed.online ? { online: owed.online } : {}) });
  }

  private drop(conn: Conn): void {
    if (!this.conns.has(conn.socket)) return;
    this.conns.delete(conn.socket);
    if (conn.timer) {
      clearTimeout(conn.timer);
      conn.timer = null;
    }
    if (conn.player) {
      this.log(`${conn.player} left (${this.online().length} online)`);
      conn.player = null;
      conn.socket.setPlayer(null);
      this.tellOnline(null);
    }
  }

  private send(c: Conn, msg: ServerMessage): void {
    c.socket.send(JSON.stringify(msg));
  }

  private error(c: Conn, reason: string, action?: string): void {
    this.send(c, { type: 'error', reason, ...(action ? { action } : {}) });
  }
}

function isClassId(x: unknown): x is ClassId {
  return typeof x === 'string' && (CLASS_IDS as readonly string[]).includes(x);
}
