// The Node server on Robin's PC. Today it opens the database, wakes one region actor and answers pings over a
// WebSocket. The client is not wired to it yet: that is MVP step 2, and the protocol is written in
// docs/state/protocol.md before any intent travels. Run: npm run server (ws://localhost:8787).

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { newGame } from '../../rules/src/index.ts';
import { openDb } from './db.ts';
import { RegionActor } from './region-actor.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.DB_PATH ?? join(import.meta.dirname, '..', 'data', 'world.db');
const HEARTBEAT_MS = 25_000; // the Cloudflare proxy closes idle sockets; keep them warm

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = openDb(DB_PATH);
const region = new RegionActor({
  id: 'region-0',
  db,
  create: () => ({ seed: 'region-0', state: newGame({ seed: 'region-0', player: 'robin', name: 'Robin', classId: 'warrior' }) }),
});
console.log(`[server] ${DB_PATH}: region ${region.id} at version ${region.snapshot().version}`);

const alive = new WeakSet<WebSocket>();
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
  alive.add(ws);
  console.log(`[server] connection from ${req.socket.remoteAddress ?? '?'}`);
  ws.on('pong', () => alive.add(ws));
  ws.on('message', (data) => {
    let msg: { type?: unknown } = {};
    try {
      msg = JSON.parse(String(data)) as { type?: unknown };
    } catch {
      ws.send(JSON.stringify({ type: 'error', reason: 'not JSON' }));
      return;
    }
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', serverTime: Date.now() }));
      return;
    }
    ws.send(JSON.stringify({ type: 'error', reason: 'the protocol is not written yet (docs/state/protocol.md, MVP step 2)' }));
  });
});

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
  wss.close();
  for (const ws of wss.clients) ws.terminate();
  db.close();
  console.log('[server] stopped');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
