// Zite's world on Cloudflare Workers: the worker that routes, one Durable Object per region (`RegionObject`: the region
// actor, the hub with its hibernating WebSockets, the world's tick as its alarm) and one for the accounts
// (`AccountsObject`). The same protocol as the Node server (docs/state/protocol.md), so the client changes only its
// address: ?server=wss://<worker>.workers.dev. How it stands: docs/state/server.md, "The world on Cloudflare".

import { DurableObject } from 'cloudflare:workers';
import { newWorld, type ClassId } from '../../rules/src/index.ts';
import { Accounts, openAccountsSchema, type Account, type AccountRow, type TokenRow } from './accounts.ts';
import { Hub, type Socket } from './hub.ts';
import { RegionActor, openRegionSchema, pruneResults, type RegionRow, type ResultRow } from './region-actor.ts';
import type { Sql, SqlValue } from './sql.ts';

export interface Env {
  REGIONS: DurableObjectNamespace<RegionObject>;
  ACCOUNTS: DurableObjectNamespace<AccountsObject>;
  /** The secret the import must show (`wrangler secret put IMPORT_SECRET`; `.dev.vars` under wrangler dev). Unset: no import. */
  IMPORT_SECRET?: string;
  /** The client's address, for the front page's link. */
  SITE?: string;
}

/** The regions there are: the world is one region today (docs/state/server.md). A socket to any other path is refused. */
const REGION_IDS: readonly string[] = ['region-0'];
const ACCOUNTS_NAME = 'accounts';
/** The world moves once a minute while someone plays... */
const TICK_MS = 60_000;
/** ...and every ten minutes once nobody has acted for `ACTIVE_MS` (mine: each wake costs the free plan's duration). */
const IDLE_TICK_MS = 10 * 60_000;
const ACTIVE_MS = 10 * 60_000;
/** No frame and no ping for this long: the phone is gone (the client pings every 20 s; a backgrounded tab slows to one a minute). */
const DEAD_SOCKET_MS = 90_000;
/** Old answers are forgotten once an hour, after three days (shared-world rule 3). */
const PRUNE_EVERY_MS = 60 * 60_000;
const KEEP_RESULTS_MS = 3 * 24 * 60 * 60_000;
/** The client's ping, answered by the runtime without waking the object; so the pong carries no serverTime here. */
const PING = JSON.stringify({ type: 'ping' });
const PONG = JSON.stringify({ type: 'pong' });

/** What a socket keeps through the object's sleep (ws.serializeAttachment, at most 16 KB). */
interface Attachment {
  player: string | null;
  /** When the socket was accepted. */
  since: number;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const id = regionFor(url.pathname);
      if (!id) return text('no such region', 404);
      return regionStub(env, id).fetch(request);
    }
    if (request.method === 'GET' && url.pathname === '/') return page(url, env);
    if (request.method === 'GET' && url.pathname === '/status') return status(env);
    if (url.pathname.startsWith('/import/')) {
      if (request.method !== 'POST') return text('POST', 405);
      if (!authorized(request, env)) return text('the import needs its secret', 401);
      if (url.pathname === '/import/accounts') return accountsStub(env).fetch(request);
      const id = url.searchParams.get('region') ?? '';
      if (!REGION_IDS.includes(id)) return text(`no such region: ${id}`, 404);
      return regionStub(env, id).fetch(request);
    }
    return text('not found', 404);
  },
} satisfies ExportedHandler<Env>;

/** The region a socket's path means: the root is the one region there is; /region/<id> names one. */
function regionFor(pathname: string): string | null {
  if (pathname === '/' || pathname === '/ws') return REGION_IDS[0]!;
  const m = /^\/region\/([a-z0-9-]+)$/.exec(pathname);
  return m && REGION_IDS.includes(m[1]!) ? m[1]! : null;
}

function regionStub(env: Env, id: string): DurableObjectStub<RegionObject> {
  return env.REGIONS.get(env.REGIONS.idFromName(id));
}

function accountsStub(env: Env): DurableObjectStub<AccountsObject> {
  return env.ACCOUNTS.get(env.ACCOUNTS.idFromName(ACCOUNTS_NAME));
}

/** The import's secret, compared in full however early it differs. */
function authorized(request: Request, env: Env): boolean {
  const secret = env.IMPORT_SECRET;
  if (!secret) return false;
  const given = request.headers.get('Authorization') ?? '';
  const want = `Bearer ${secret}`;
  if (given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

/** The front page: the link a phone opens once, with this worker as the world. */
function page(url: URL, env: Env): Response {
  const site = (env.SITE ?? 'https://zite-game.pages.dev').replace(/\/$/, '');
  const world = `${url.protocol === 'https:' ? 'wss' : 'ws'}://${url.host}`;
  const link = `${site}/?server=${world}`;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Zite's world</title>
<style>body{font-family:system-ui,sans-serif;max-width:32em;margin:3em auto;padding:0 1em;line-height:1.5;color:#2b2118;background:#f6efe2}a{word-break:break-all}</style>
<h1>Zite's world</h1><p>The shared world runs here, always on.</p><p>Open the game once at<br><a href="${link}">${link}</a></p>
<p>The phone remembers the address and connects on its own from then on. <code>?server=off</code> goes back to solo play.</p>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/** A look at the world: each region's version and who is there, and how many accounts. */
async function status(env: Env): Promise<Response> {
  const regions = await Promise.all(REGION_IDS.map(async (id) => (await regionStub(env, id).fetch('https://zite.world/status')).json()));
  const accounts = await accountsStub(env).count();
  return json({ regions, accounts });
}

// ---- the region --------------------------------------------------------------------------------------------------------

export class RegionObject extends DurableObject<Env> {
  private readonly sql: Sql;
  private readonly region: RegionActor;
  private readonly hub: Hub;
  private readonly wrapped = new WeakMap<WebSocket, Socket>();
  /** When an intent last came in, in this object's memory. */
  private lastIntent = 0;
  /** When the alarm is set for, as far as this object knows. */
  private alarmAt: number | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = storageSql(ctx.storage);
    openRegionSchema(this.sql);
    const id = ctx.id.name ?? this.meta('region_id') ?? REGION_IDS[0]!;
    this.region = new RegionActor({ id, sql: this.sql, create: () => ({ seed: id, state: newWorld({ seed: id }) }) });
    const accounts = accountsStub(env);
    this.hub = new Hub({
      region: this.region,
      accounts: {
        byToken: async (token) => (await accounts.byToken(token)) as Account | null,
        byRecovery: async (code) => (await accounts.byRecovery(code)) as Account | null,
        create: async (o) => (await accounts.create(o)) as { account: Account; token: string },
        newToken: async (accountId) => (await accounts.newToken(accountId)) as string,
        touch: async (accountId) => {
          await accounts.touch(accountId);
        },
      },
      log: (line) => console.log(`[${id}] ${line}`),
      beforeJoin: () => this.catchUp(),
      onIntent: () => this.wakeAlarm(),
    });
    // Back from a sleep: the sockets are still there, each with its player.
    for (const ws of ctx.getWebSockets()) this.hub.attach(this.wrap(ws));
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
    void this.ensureAlarm();
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      if (!this.meta('region_id')) this.setMeta('region_id', this.region.id);
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ player: null, since: Date.now() } satisfies Attachment);
      this.hub.attach(this.wrap(server));
      return new Response(null, { status: 101, webSocket: client });
    }
    switch (url.pathname) {
      case '/status':
        return json({ id: this.region.id, version: this.region.currentVersion, players: this.region.playerCount, online: this.hub.online().length, lastTick: this.metaNumber('last_tick') || null });
      case '/import/region':
        return this.importRegion(request);
      case '/import/results':
        return this.importResults(request);
      default:
        return text('not found', 404);
    }
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.hub.onMessage(this.wrap(ws), message);
  }

  override webSocketClose(ws: WebSocket): void {
    this.hub.onClose(this.wrap(ws));
  }

  override webSocketError(ws: WebSocket): void {
    this.hub.onClose(this.wrap(ws));
  }

  /** The world's clock: a tick, the sweep for dead phones, the hourly forgetting of old answers; then the next alarm. */
  override async alarm(): Promise<void> {
    const now = Date.now();
    try {
      await this.tick();
      const gone = this.hub.sweep(DEAD_SOCKET_MS);
      if (gone.length) console.log(`[${this.region.id}] swept ${gone.join(', ')}: no life for ${DEAD_SOCKET_MS / 1000} s`);
      if (now - this.metaNumber('last_prune') > PRUNE_EVERY_MS) {
        const forgot = pruneResults(this.sql, now, KEEP_RESULTS_MS);
        this.setMeta('last_prune', String(now));
        if (forgot) console.log(`[${this.region.id}] forgot ${forgot} old answers`);
      }
    } catch (e) {
      console.error(`[${this.region.id}] the alarm failed: ${String(e)}`);
    } finally {
      const active = this.hub.online().length > 0 && now - this.lastIntent < ACTIVE_MS;
      await this.schedule(active ? TICK_MS : IDLE_TICK_MS);
    }
  }

  /** The world's state, version and dice from the Node server's database (tools/import-world.mjs). */
  private async importRegion(request: Request): Promise<Response> {
    const body = (await request.json()) as { region?: RegionRow; replace?: boolean };
    if (!body.region || body.region.id !== this.region.id) return text(`this object is ${this.region.id}; the row is ${body.region?.id ?? 'missing'}`, 400);
    if (this.region.currentVersion > 0 && !body.replace) return text(`${this.region.id} already holds a world at version ${this.region.currentVersion}; the import runs once (send replace to replace it)`, 409);
    this.region.replaceWith(body.region);
    this.setMeta('region_id', this.region.id);
    console.log(`[${this.region.id}] imported a world at version ${this.region.currentVersion} with ${this.region.playerCount} characters`);
    return json({ id: this.region.id, version: this.region.currentVersion, players: this.region.people() });
  }

  private async importResults(request: Request): Promise<Response> {
    const body = (await request.json()) as { results?: ResultRow[] };
    if (!Array.isArray(body.results)) return text('results: [] needed', 400);
    const total = this.region.putResults(body.results);
    return json({ id: this.region.id, results: total });
  }

  /** A player joins: a tick first when the last was more than a minute ago, so the world they see is today's. */
  private async catchUp(): Promise<void> {
    if (Date.now() - this.metaNumber('last_tick') >= TICK_MS) await this.tick();
  }

  private async tick(): Promise<void> {
    const r = await this.hub.tick();
    this.setMeta('last_tick', String(Date.now()));
    for (const e of r.events) console.log(`[${this.region.id}] ${e.type === 'spawned' ? `${e.spawn.kind} spawned at ${e.space}` : e.type === 'despawned' ? `despawned at ${e.space}` : e.type}`);
  }

  /** The alarm is set once and then always, from inside itself; a fresh object sets the first one. */
  private async ensureAlarm(): Promise<void> {
    try {
      const at = await this.ctx.storage.getAlarm();
      if (at === null) await this.schedule(TICK_MS);
      else this.alarmAt = at;
    } catch (e) {
      console.error(`[${this.region.id}] could not set the alarm: ${String(e)}`);
    }
  }

  private async schedule(inMs: number): Promise<void> {
    this.alarmAt = Date.now() + inMs;
    await this.ctx.storage.setAlarm(this.alarmAt);
  }

  /** Someone acted: the world should tick by the minute again if the alarm had drifted out to the idle spacing. */
  private wakeAlarm(): void {
    this.lastIntent = Date.now();
    if (this.alarmAt !== null && this.alarmAt - this.lastIntent <= TICK_MS) return;
    void this.schedule(TICK_MS);
  }

  private wrap(ws: WebSocket): Socket {
    let s = this.wrapped.get(ws);
    if (s) return s;
    const ctx = this.ctx;
    const attachment = (): Attachment => (ws.deserializeAttachment() as Attachment | null) ?? { player: null, since: 0 };
    s = {
      send: (frame) => {
        try {
          ws.send(frame);
        } catch {
          // closed under us; the close event follows
        }
      },
      close: (code, reason) => {
        try {
          ws.close(code, reason);
        } catch {
          // already closed
        }
      },
      player: () => attachment().player,
      setPlayer: (player) => ws.serializeAttachment({ ...attachment(), player } satisfies Attachment),
      lastAlive: () => Math.max(attachment().since, ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0),
    };
    this.wrapped.set(ws, s);
    return s;
  }

  private meta(key: string): string | null {
    return this.sql.exec<{ value: string }>('SELECT value FROM meta WHERE key = ?', key)[0]?.value ?? null;
  }

  private metaNumber(key: string): number {
    return Number(this.meta(key) ?? 0);
  }

  private setMeta(key: string, value: string): void {
    this.sql.exec('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  }
}

// ---- the accounts ------------------------------------------------------------------------------------------------------

/** One object for every account: the region objects ask it who a token or a code belongs to. */
export class AccountsObject extends DurableObject<Env> {
  private readonly accounts: Accounts;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sql = storageSql(ctx.storage);
    openAccountsSchema(sql);
    this.accounts = new Accounts(sql);
  }

  byToken(token: string): Account | null {
    return this.accounts.byToken(token);
  }

  byRecovery(code: string): Account | null {
    return this.accounts.byRecovery(code);
  }

  create(o: { name: string; classId: ClassId; regionId: string }): { account: Account; token: string } {
    return this.accounts.create(o);
  }

  newToken(accountId: string): string {
    return this.accounts.newToken(accountId);
  }

  touch(accountId: string): void {
    this.accounts.touch(accountId);
  }

  count(): number {
    return this.accounts.count();
  }

  /** The import: the accounts and tokens from the Node server's database. */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/import/accounts') return text('not found', 404);
    const body = (await request.json()) as { accounts?: AccountRow[]; tokens?: TokenRow[] };
    if (!Array.isArray(body.accounts) || !Array.isArray(body.tokens)) return text('accounts: [] and tokens: [] needed', 400);
    const counts = this.accounts.importRows(body.accounts, body.tokens);
    console.log(`[accounts] imported: ${counts.accounts} accounts, ${counts.tokens} tokens`);
    return json({ ...counts, names: this.accounts.names() });
  }
}

// ---- small things ------------------------------------------------------------------------------------------------------

/** The object's SQLite as the actors' `Sql`. */
function storageSql(storage: DurableObjectStorage): Sql {
  return {
    exec: <T>(query: string, ...bindings: SqlValue[]): T[] => storage.sql.exec(query, ...bindings).toArray() as unknown as T[],
    transaction: <T>(fn: () => T): T => storage.transactionSync(fn),
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
