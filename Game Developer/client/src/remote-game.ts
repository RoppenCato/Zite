// Co-op play: the server holds the state (docs/state/protocol.md). This holder keeps a copy, sends each intent over the
// socket with an id, waits for the answer and folds in what the server says changed. The device keeps the account's
// token in localStorage; the save is the account. The scenes see it through GameHolder, the same as LocalGame.

import {
  PROTOCOL_VERSION,
  mergeDelta,
  type Action,
  type Character,
  type ClassId,
  type ClientMessage,
  type Delta,
  type GameEvent,
  type GameState,
  type ServerMessage,
} from '../../rules/src/index.ts';
import type { GameHolder, Intent, Link } from './game-holder.ts';
import { tips } from './tips.ts';

export const ACCOUNT_KEY = 'boardworld.account';
export const SERVER_KEY = 'boardworld.server';
/** A recovery code the settings screen leaves for the next load. */
export const RECOVER_KEY = 'boardworld.recover';
const PING_MS = 20_000;
const PONG_WAIT_MS = 10_000;
const RETRY_MS = [1_000, 2_000, 4_000, 8_000, 15_000];

interface Account {
  token: string;
  player: string;
  recovery: string;
}

/** How to join: the device's token, a new character, or a recovery code from another phone. */
export type Credentials = { token: string } | { name: string; classId: ClassId } | { recover: string };

export interface RemoteGameOptions {
  url: string;
  storage: Storage | null;
  credentials: Credentials;
  /** A line for the log. */
  note?: (line: string) => void;
}

type Snapshot = Extract<ServerMessage, { type: 'snapshot' }>;

/** The device's account for the server, if it has one. */
export function storedAccount(storage: Storage | null): Account | null {
  try {
    const raw = storage?.getItem(ACCOUNT_KEY);
    if (raw) {
      const a = JSON.parse(raw) as Partial<Account>;
      if (typeof a.token === 'string' && typeof a.player === 'string') return { token: a.token, player: a.player, recovery: a.recovery ?? '' };
    }
  } catch {
    // A broken value: no account.
  }
  return null;
}

/** The server the page should talk to: `?server=` in the address once, then remembered; none means solo play. */
export function serverUrl(storage: Storage | null, search: string): string | null {
  const given = new URLSearchParams(search).get('server');
  try {
    if (given !== null) {
      if (given === '' || given === 'off') storage?.removeItem(SERVER_KEY);
      else storage?.setItem(SERVER_KEY, given);
    }
    return storage?.getItem(SERVER_KEY) || null;
  } catch {
    return given || null;
  }
}

export class RemoteGame implements GameHolder {
  state!: GameState;
  player = '';
  onSpawns: (() => void) | null = null;
  onChange: GameHolder['onChange'] = null;
  private readonly url: string;
  private readonly storage: Storage | null;
  private readonly note: (line: string) => void;
  private credentials: Credentials;
  private account: Account | null = null;
  private ws: WebSocket | null = null;
  private version = -1;
  private online: string[] = [];
  private tries = 0;
  private reason = 'connecting';
  private closedForGood = false;
  /** The server's clock less ours, from the last message. */
  private skew = 0;
  /** The intent in flight, if any: resent with the same id after a reconnect. */
  private pending: { action: Action; resolve: (events: GameEvent[]) => void; reject: (e: Error) => void } | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private waitingForSnapshot: { resolve: (s: Snapshot) => void; reject: (e: Error) => void } | null = null;

  private constructor(o: RemoteGameOptions) {
    this.url = o.url;
    this.storage = o.storage;
    this.credentials = o.credentials;
    this.note = o.note ?? (() => undefined);
  }

  /**
   * Connect and join. Resolves once the first snapshot is in, so the scenes can start; rejects when the server refuses
   * the credentials (an unknown token or code), so the character screen can be shown instead.
   */
  static async connect(o: RemoteGameOptions): Promise<RemoteGame> {
    const game = new RemoteGame(o);
    const snapshot = await game.open();
    game.take(snapshot);
    game.watch();
    return game;
  }

  get me(): Character {
    return this.state.characters[this.player]!;
  }

  now(): number {
    return Date.now() + this.skew;
  }

  link(): Link {
    if (this.ws?.readyState === WebSocket.OPEN && this.version >= 0) return { kind: 'online', online: this.online.length };
    return { kind: 'connecting', tries: this.tries, reason: this.reason };
  }

  recovery(): string | null {
    return this.account?.recovery ?? null;
  }

  onlinePlayers(): string[] {
    return this.online.filter((id) => id !== this.player);
  }

  act(intent: Intent): Promise<GameEvent[]> {
    if (this.pending) return Promise.reject(new Error('one thing at a time'));
    const action = { ...intent, id: newId(), player: this.player } as Action;
    return new Promise<GameEvent[]>((resolve, reject) => {
      this.pending = { action, resolve, reject };
      this.sendPending();
    });
  }

  /** The server ticks the world itself; the page's tick only makes sure the link is alive. */
  tick(): Promise<GameEvent[]> {
    this.checkLink();
    return Promise.resolve([]);
  }

  /** Forget this device's token (the account lives on; the code brings it back) and the tips; the next load asks again. */
  reset(): void {
    tips.clear();
    try {
      this.storage?.removeItem(ACCOUNT_KEY);
    } catch {
      // nothing to forget
    }
    this.closedForGood = true;
    this.send({ type: 'leave' });
    this.ws?.close();
  }

  /** Called by the page on visibilitychange and pageshow: a socket the phone killed is replaced at once. */
  checkLink(): void {
    if (this.closedForGood) return;
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.reconnect(0);
    } else if (this.ws.readyState === WebSocket.OPEN) {
      this.ping();
    }
  }

  // ---- the socket ---------------------------------------------------------------------------------------------------

  /** One socket: open it, join, and resolve with the snapshot. */
  private open(): Promise<Snapshot> {
    return new Promise<Snapshot>((resolve, reject) => {
      this.waitingForSnapshot = { resolve, reject };
      let ws: WebSocket;
      try {
        ws = new WebSocket(this.url);
      } catch (e) {
        this.waitingForSnapshot = null;
        reject(e instanceof Error ? e : new Error(String(e)));
        return;
      }
      this.ws = ws;
      ws.onopen = () => {
        const join: ClientMessage = { type: 'join', protocol: PROTOCOL_VERSION, ...this.credentials };
        ws.send(JSON.stringify(join));
      };
      ws.onmessage = (ev) => this.onMessage(String(ev.data));
      ws.onclose = (ev) => this.onClose(ev.code, ev.reason);
      ws.onerror = () => undefined; // onclose follows
    });
  }

  private onMessage(text: string): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(text) as ServerMessage;
    } catch {
      return;
    }
    if ('serverTime' in msg && typeof msg.serverTime === 'number') this.skew = msg.serverTime - Date.now();
    switch (msg.type) {
      case 'snapshot':
        if (this.waitingForSnapshot) {
          const w = this.waitingForSnapshot;
          this.waitingForSnapshot = null;
          w.resolve(msg);
        } else {
          this.take(msg);
        }
        return;
      case 'result':
        this.onResult(msg);
        return;
      case 'event':
        if (msg.version < this.version) return; // older than what we hold
        this.version = msg.version;
        this.fold(msg.delta, msg.online ?? null, false, msg.events);
        return;
      case 'pong':
        if (this.pongTimer) {
          clearTimeout(this.pongTimer);
          this.pongTimer = null;
        }
        return;
      case 'error':
        this.onError(msg.reason, msg.action);
        return;
      default:
        return;
    }
  }

  /** A fresh snapshot: the whole state, who we are, who is online. Replaces everything held. */
  private take(snap: Snapshot): void {
    const before = this.state as GameState | undefined;
    this.state = snap.state;
    this.version = snap.version;
    this.player = snap.player;
    this.online = snap.online;
    this.tries = 0;
    this.reason = '';
    if (snap.token || !this.account) {
      this.account = { token: snap.token ?? (this.account?.token ?? ('token' in this.credentials ? this.credentials.token : '')), player: snap.player, recovery: snap.recovery };
      this.credentials = { token: this.account.token };
      try {
        this.storage?.setItem(ACCOUNT_KEY, JSON.stringify(this.account));
      } catch {
        // Storage blocked: the token lives for this page only.
      }
    }
    this.note(`snapshot v${snap.version}: ${snap.player}, ${snap.online.length} online`);
    if (before) {
      this.onSpawns?.();
      this.onChange?.({ others: true, me: true, board: before.board !== snap.state.board, link: true, events: [] });
    }
    // An intent that was in flight when the socket went: the same id again; the server answers from its store if it had it.
    if (this.pending) this.sendPending();
  }

  private onResult(msg: Extract<ServerMessage, { type: 'result' }>): void {
    const p = this.pending;
    if (!p || p.action.id !== msg.action) return;
    this.pending = null;
    if (msg.version > this.version) this.version = msg.version;
    if (msg.delta) this.fold(msg.delta, null, true);
    p.resolve(msg.events);
  }

  /** What the server says changed: into the state, and the scenes told. `mine` when it answers our own action. */
  private fold(delta: Delta | undefined, online: string[] | null, mine = false, events: GameEvent[] = []): void {
    let others = false;
    let me = false;
    let board = false;
    if (delta) {
      const before = this.state;
      this.state = mergeDelta(this.state, delta);
      if (delta.characters) {
        for (const id of Object.keys(delta.characters)) {
          if (id === this.player) me = true;
          else others = true;
        }
      }
      board = !!delta.board;
      if (delta.spawns && delta.spawns !== before.spawns) this.onSpawns?.();
    }
    let link = false;
    if (online) {
      link = online.join(',') !== this.online.join(',');
      this.online = online;
      others = others || link;
    }
    if (!mine && (others || me || board || link || events.length)) this.onChange?.({ others, me, board, link, events });
  }

  private onError(reason: string, action?: string): void {
    this.note(`server: ${reason}${action ? ` (${action})` : ''}`);
    if (this.waitingForSnapshot) {
      const w = this.waitingForSnapshot;
      this.waitingForSnapshot = null;
      this.reason = reason;
      w.reject(new Error(reason));
      return;
    }
    if (action && this.pending?.action.id === action) {
      const p = this.pending;
      this.pending = null;
      p.resolve([{ type: 'rejected', action, player: this.player, reason: 'not now' }]);
    }
  }

  private onClose(code: number, reason: string): void {
    this.stopTimers();
    this.note(`socket closed (${code}${reason ? ` ${reason}` : ''})`);
    if (this.waitingForSnapshot) {
      const w = this.waitingForSnapshot;
      this.waitingForSnapshot = null;
      this.reason = reason || 'no connection';
      w.reject(new Error(this.reason));
      return;
    }
    if (this.closedForGood) return;
    this.onChange?.({ others: false, me: false, board: false, link: true, events: [] });
    this.reconnect(RETRY_MS[Math.min(this.tries, RETRY_MS.length - 1)]!);
  }

  /** A new socket after a wait, then join with the token; the snapshot replaces what we hold. Never gives up. */
  private reconnect(afterMs: number): void {
    if (this.retryTimer || this.closedForGood) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.tries += 1;
      this.reason = 'reconnecting';
      this.onChange?.({ others: false, me: false, board: false, link: true, events: [] });
      this.open()
        .then((snap) => {
          this.take(snap);
          this.watch();
        })
        .catch((e: unknown) => {
          const why = e instanceof Error ? e.message : String(e);
          this.reason = why;
          // An unknown account cannot be retried into existence; anything else is tried again.
          if (why === 'unknown account') {
            this.closedForGood = true;
            this.onChange?.({ others: false, me: false, board: false, link: true, events: [] });
            return;
          }
          this.reconnect(RETRY_MS[Math.min(this.tries, RETRY_MS.length - 1)]!);
        });
    }, afterMs);
  }

  /** Ping every so often; no pong in time and the socket is dropped, which brings a new one. */
  private watch(): void {
    this.stopTimers();
    this.pingTimer = setInterval(() => this.ping(), PING_MS);
  }

  private ping(): void {
    if (this.ws?.readyState !== WebSocket.OPEN || this.pongTimer) return;
    this.send({ type: 'ping' });
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      this.note('no pong: dropping the socket');
      this.ws?.close();
    }, PONG_WAIT_MS);
  }

  private stopTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = null;
    this.pongTimer = null;
  }

  private sendPending(): void {
    if (!this.pending || this.ws?.readyState !== WebSocket.OPEN || this.version < 0) return;
    const { player: _player, ...wire } = this.pending.action;
    this.send({ type: 'intent', action: wire });
  }

  private send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}

function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
