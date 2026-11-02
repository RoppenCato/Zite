// The hub: the sockets, who is joined as whom, and what each is owed. One hub in front of the region actor (the world is
// one region today). It reads every message, stamps the account's id on each intent, hands it to the actor, answers the
// sender, and bundles what everyone else should hear (docs/state/protocol.md). Nothing here decides a game outcome.

import { randomUUID } from 'node:crypto';
import { WebSocket, type RawData } from 'ws';
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
import type { Account, Accounts } from './accounts.ts';
import type { ActionResult, RegionActor } from './region-actor.ts';

/** The actions a client may send; the rest are the server's own. */
const WIRE_ACTIONS = new Set<string>(['travel', 'try', 'roll', 'move', 'fight', 'buy', 'skill', 'sell', 'equip', 'unequip', 'drop', 'use', 'gamble', 'quest', 'keep', 'trace']);
/** The events the others hear about: what shows on the board or is worth a line. A fight's blows stay with the fighter. */
const SHARED_EVENTS = new Set<GameEvent['type']>(['joined', 'moved', 'won', 'died', 'opened', 'bossDown', 'levelled', 'spawned', 'despawned', 'questDone', 'traced', 'worldBossDown', 'bossLeft']);

type JoinMessage = Extract<ClientMessage, { type: 'join' }>;
type IntentMessage = Extract<ClientMessage, { type: 'intent' }>;

interface Owed {
  version: number;
  events: GameEvent[];
  delta: Delta | null;
  online: string[] | null;
}

interface Conn {
  ws: WebSocket;
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
}

export interface HubOptions {
  region: RegionActor;
  accounts: Accounts;
  now?: () => number;
  batchMs?: number;
  log?: (line: string) => void;
}

export class Hub {
  private readonly region: RegionActor;
  private readonly accounts: Accounts;
  private readonly now: () => number;
  private readonly batchMs: number;
  private readonly log: (line: string) => void;
  private readonly conns = new Set<Conn>();
  private lastOnline = '';

  constructor(o: HubOptions) {
    this.region = o.region;
    this.accounts = o.accounts;
    this.now = o.now ?? (() => Date.now());
    this.batchMs = o.batchMs ?? BATCH_MS;
    this.log = o.log ?? (() => undefined);
  }

  /** Take a socket that just connected. */
  attach(ws: WebSocket): void {
    const conn: Conn = { ws, player: null, recent: [], strikes: 0, inflight: 0, cut: false, owed: null, timer: null };
    this.conns.add(conn);
    ws.on('message', (data, isBinary) => {
      void this.onMessage(conn, data, isBinary);
    });
    ws.on('close', () => this.drop(conn));
    ws.on('error', () => this.drop(conn));
  }

  /** The players with a socket right now, each once, sorted. */
  online(): string[] {
    const ids = new Set<string>();
    for (const c of this.conns) if (c.player) ids.add(c.player);
    return [...ids].sort();
  }

  /** The world moves on the server's clock; everyone connected hears what changed. */
  async tick(): Promise<ActionResult> {
    const r = await this.region.submit({ type: 'tick', id: randomUUID(), player: 'world' });
    if (r.delta) this.tell(null, r.version, r.events, r.delta);
    return r;
  }

  /** Close every socket: the server is stopping. */
  close(): void {
    for (const c of this.conns) {
      if (c.timer) clearTimeout(c.timer);
      c.ws.terminate();
    }
    this.conns.clear();
  }

  private async onMessage(conn: Conn, data: RawData, isBinary: boolean): Promise<void> {
    if (isBinary) return this.error(conn, 'not JSON');
    const text = Buffer.isBuffer(data) ? data.toString('utf8') : Array.isArray(data) ? Buffer.concat(data).toString('utf8') : Buffer.from(data).toString('utf8');
    if (Buffer.byteLength(text) > MAX_FRAME) return this.error(conn, 'too big');
    let msg: ClientMessage;
    try {
      msg = JSON.parse(text) as ClientMessage;
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
        conn.ws.close(1000, 'left');
        return;
      default:
        return this.error(conn, 'unknown message');
    }
  }

  private async join(conn: Conn, msg: JoinMessage): Promise<void> {
    if (conn.player) return this.error(conn, 'already joined');
    if (msg.protocol !== PROTOCOL_VERSION) return this.error(conn, `protocol ${PROTOCOL_VERSION} needed`);
    let account: Account | null = null;
    let token: string | undefined;
    if (typeof msg.token === 'string') {
      account = this.accounts.byToken(msg.token);
      if (!account) return this.error(conn, 'unknown account');
    } else if (typeof msg.recover === 'string') {
      account = this.accounts.byRecovery(msg.recover);
      if (!account) return this.error(conn, 'unknown code');
      token = this.accounts.newToken(account.id);
    } else {
      const name = typeof msg.name === 'string' ? msg.name.trim().slice(0, MAX_NAME) : '';
      const classId = msg.classId;
      if (!name || !isClassId(classId)) return this.error(conn, 'a name and a class are needed');
      const made = this.accounts.create({ name, classId, regionId: this.region.id });
      const r = await this.region.submit({ type: 'join', id: `join-${made.account.id}`, player: made.account.id, name, classId });
      const first = r.events[0];
      if (first?.type === 'rejected') return this.error(conn, `refused: ${first.reason}`);
      account = made.account;
      token = made.token;
      if (r.delta) this.tell(conn, r.version, r.events, r.delta);
      this.log(`new account ${account.id}: ${name} the ${classId}`);
    }
    if (!this.conns.has(conn)) return; // closed while the actor worked
    conn.player = account.id;
    this.accounts.touch(account.id);
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
    } finally {
      conn.inflight -= 1;
      if (conn.cut && conn.inflight === 0) conn.ws.close(1008, 'too fast');
    }
  }

  /**
   * A flooder is cut off: it is no longer in the world, the intents the actor already took are still answered (a phone
   * must never lose an answer to something that happened), and the socket closes once the last answer is out. The close
   * used to come at once, which dropped those answers whenever all the intents arrived in one chunk (Windows does that).
   */
  private cut(conn: Conn): void {
    if (conn.cut) return;
    conn.cut = true;
    this.drop(conn);
    if (conn.inflight === 0) conn.ws.close(1008, 'too fast');
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
    for (const c of this.conns) {
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
    for (const c of this.conns) {
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
    if (!this.conns.has(conn)) return;
    this.conns.delete(conn);
    if (conn.timer) {
      clearTimeout(conn.timer);
      conn.timer = null;
    }
    if (conn.player) {
      this.log(`${conn.player} left (${this.online().length} online)`);
      conn.player = null;
      this.tellOnline(null);
    }
  }

  private send(c: Conn, msg: ServerMessage): void {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(JSON.stringify(msg));
  }

  private error(c: Conn, reason: string, action?: string): void {
    this.send(c, { type: 'error', reason, ...(action ? { action } : {}) });
  }
}

function isClassId(x: unknown): x is ClassId {
  return typeof x === 'string' && (CLASS_IDS as readonly string[]).includes(x);
}
