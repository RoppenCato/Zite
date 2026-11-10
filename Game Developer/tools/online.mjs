#!/usr/bin/env node
// Starts the world for play away from home (Robin, 2026-11-10): the game server and a Cloudflare quick tunnel in front
// of it, and prints the link a phone opens once. Run: npm run online. Ctrl+C stops both.
//
//   TUNNEL=quick    (default) cloudflared tunnel --url http://localhost:<port>; the address changes on every start
//   TUNNEL=none     the server alone (the LAN link, or another way in later)
//   CLOUDFLARED=…   the exe to run; else tools\bin\cloudflared.exe, else cloudflared on the PATH
//   SITE=…          the client's address in the link; default https://zite-game.pages.dev
//   PORT=…          the server's port; default 8787
//
// It writes server/data/online.json ({ url, link, since }) so another session can read the link and send it to Robin,
// starts the tunnel again if it drops (a new address, written again), and stops the server when it is stopped itself.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT ?? '8787';
const SITE = (process.env.SITE ?? 'https://zite-game.pages.dev').replace(/\/$/, '');
const MODE = process.env.TUNNEL ?? 'quick';
const STATE = join(ROOT, 'server', 'data', 'online.json');

let stopping = false;
let tunnel = null;
let drops = 0;

const server = spawn(process.execPath, ['server/src/index.ts'], { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, PORT } });
server.on('exit', (code) => {
  if (stopping) return;
  log(`the server stopped (${code ?? 'signal'}); stopping the tunnel too`);
  stopAll(code ?? 1);
});

if (MODE === 'quick') startTunnel();
else {
  log(`no tunnel (TUNNEL=${MODE}); the server listens on ws://localhost:${PORT}`);
  writeState(null);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function cloudflared() {
  if (process.env.CLOUDFLARED) return process.env.CLOUDFLARED;
  const local = join(ROOT, 'tools', 'bin', 'cloudflared.exe');
  return existsSync(local) ? local : 'cloudflared';
}

function startTunnel() {
  if (stopping) return;
  const exe = cloudflared();
  log(`tunnel: ${exe} tunnel --url http://localhost:${PORT}`);
  tunnel = spawn(exe, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let found = false;
  const look = (chunk) => {
    const text = chunk.toString();
    // cloudflared prints its logs on stderr; the address appears once, in a box, soon after the start.
    const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !found) {
      found = true;
      announce(m[0]);
    }
    for (const line of text.split(/\r?\n/)) if (/\bERR\b|error|failed/i.test(line)) log(`cloudflared: ${line.trim()}`);
  };
  tunnel.stdout.on('data', look);
  tunnel.stderr.on('data', look);
  tunnel.on('error', (e) => {
    log(`cloudflared could not start: ${e.message}`);
    log(`put cloudflared.exe in ${join(ROOT, 'tools', 'bin')} (docs/state/server.md says where it comes from), or set CLOUDFLARED=<path>`);
    if (!stopping) stopAll(1);
  });
  tunnel.on('exit', (code) => {
    if (stopping) return;
    drops += 1;
    const wait = Math.min(60, 5 * drops);
    log(`the tunnel dropped (${code ?? 'signal'}); again in ${wait} s`);
    writeState(null);
    setTimeout(startTunnel, wait * 1000);
  });
}

function announce(https) {
  drops = 0;
  const url = https.replace(/^https:/, 'wss:');
  const link = `${SITE}/?server=${url}`;
  writeState({ url, link });
  log(`the world is at ${url}`);
  log(`open on the phone, once: ${link}`);
}

function writeState(s) {
  mkdirSync(dirname(STATE), { recursive: true });
  const state = { url: s?.url ?? null, link: s?.link ?? null, site: SITE, port: Number(PORT), since: new Date().toISOString() };
  writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
}

function stopAll(code) {
  if (stopping) return;
  stopping = true;
  tunnel?.kill();
  server.kill();
  setTimeout(() => process.exit(code), 500);
}

function log(line) {
  console.log(`[online] ${new Date().toISOString().slice(11, 19)} ${line}`);
}
