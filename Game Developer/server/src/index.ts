// The Node server on Robin's PC: the database, the accounts, one region actor for the world, and the hub that speaks the
// protocol over a WebSocket (docs/state/protocol.md). Run: npm run server (ws://localhost:8787); phones reach it through
// the Cloudflare Tunnel (npm run tunnel) and the client is pointed at it with ?server=wss://... once.

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { newWorld } from '../../rules/src/index.ts';
import { Accounts } from './accounts.ts';
import { openDb, pruneResults } from './db.ts';
import { Hub } from './hub.ts';
import { RegionActor } from './region-actor.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.DB_PATH ?? join(import.meta.dirname, '..', 'data', 'world.db');
const HEARTBEAT_MS = 25_000; // the Cloudflare proxy closes idle sockets; keep them warm
const TICK_MS = 60_000; // the world moves once a minute: spawns come and go
const PRUNE_EVERY_MS = 60 * 60_000; // old answers are forgotten once an hour...
const KEEP_RESULTS_MS = 3 * 24 * 60 * 60_000; // ...after three days (shared-world rule 3)

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = openDb(DB_PATH);
const region = new RegionActor({ id: 'region-0', db, create: () => ({ seed: 'region-0', state: newWorld({ seed: 'region-0' }) }) });
const accounts = new Accounts(db);
const hub = new Hub({ region, accounts, log: (line) => console.log(`[server] ${line}`) });
console.log(`[server] ${DB_PATH}: region ${region.id} at version ${region.currentVersion}, ${accounts.count()} accounts`);

const alive = new WeakSet<WebSocket>();
const wss = new WebSocketServer({ port: PORT, maxPayload: 1024 * 1024 });

wss.on('connection', (ws, req) => {
  alive.add(ws);
  console.log(`[server] connection from ${req.socket.remoteAddress ?? '?'}`);
  ws.on('pong', () => alive.add(ws));
  hub.attach(ws);
});

// The region's world ticks on the server's clock, whoever is connected (shared-world rule 4: the world keeps moving).
const ticker = setInterval(() => {
  void hub.tick().then((r) => {
    for (const e of r.events) console.log(`[server] ${e.type === 'spawned' ? `${e.spawn.kind} spawned at ${e.space}` : e.type === 'despawned' ? `despawned at ${e.space}` : e.type}`);
  });
}, TICK_MS);

const pruner = setInterval(() => {
  const gone = pruneResults(db, Date.now(), KEEP_RESULTS_MS);
  if (gone) console.log(`[server] forgot ${gone} old answers`);
}, PRUNE_EVERY_MS);

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.has(ws)) {
      ws.terminate();
      continue;
    }
    alive.delete(ws);
    ws.ping();
  }
}, HEARTBEAT_MS);

wss.on('listening', () => console.log(`[server] listening on ws://localhost:${PORT}`));

function shutdown(): void {
  clearInterval(heartbeat);
  clearInterval(ticker);
  clearInterval(pruner);
  hub.close();
  wss.close();
  db.close();
  console.log('[server] stopped');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
