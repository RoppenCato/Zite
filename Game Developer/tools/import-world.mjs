#!/usr/bin/env node
// Brings the world from the Node server's database into the Cloudflare world, once (docs/state/server.md, "The world
// on Cloudflare"): each region's state, version and dice, its stored answers (so a phone that retries an old action
// still gets its answer), and the accounts with their tokens and codes. It reads a copy, never the live file: the three
// files SQLite keeps are copied to a temporary folder first. Stop the Node server before running it, so the copy is whole.
//
//   node tools/import-world.mjs --to http://localhost:8787 --secret <IMPORT_SECRET> [--db server/data/world.db] [--replace]
//
//   --to       the worker: http://localhost:8787 under wrangler dev; https://zite-world.<account>.workers.dev once deployed
//   --secret   the import's secret: IMPORT_SECRET in server-workers/.dev.vars, or what `wrangler secret put IMPORT_SECRET`
//              was given; the environment variable IMPORT_SECRET does as well
//   --db       the Node server's database; default server/data/world.db
//   --replace  replace a world the worker already holds (it refuses otherwise, so the import happens once)
//
// Exits 1 when the worker refuses or cannot be reached.
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Stored answers travel in batches of this many rows. */
const CHUNK = 1000;

const args = parse(process.argv.slice(2));
const to = (args.to ?? '').replace(/\/$/, '');
const secret = args.secret ?? process.env.IMPORT_SECRET ?? '';
const dbPath = resolve(ROOT, args.db ?? join('server', 'data', 'world.db'));
const replace = args.replace === true;
if (!to || !secret) {
  console.error('usage: node tools/import-world.mjs --to <worker url> --secret <IMPORT_SECRET> [--db server/data/world.db] [--replace]');
  process.exit(2);
}
if (!existsSync(dbPath)) {
  console.error(`no database at ${dbPath}`);
  process.exit(2);
}

// A copy, never the live file: the database, its write-ahead log and its index, as far as they exist.
const tmp = mkdtempSync(join(tmpdir(), 'zite-import-'));
for (const suffix of ['', '-wal', '-shm']) if (existsSync(dbPath + suffix)) copyFileSync(dbPath + suffix, join(tmp, basename(dbPath) + suffix));
const db = new Database(join(tmp, basename(dbPath)));
try {
  const regions = db.prepare('SELECT id, version, state, rng, updated_at FROM regions').all();
  const accounts = db.prepare('SELECT id, name, class_id, region_id, recovery, created_at, last_seen FROM accounts').all();
  const tokens = db.prepare('SELECT token, account_id, created_at FROM tokens').all();
  log(`${dbPath}: ${regions.length} region(s), ${accounts.length} account(s), ${tokens.length} token(s)`);
  for (const region of regions) {
    const results = db.prepare('SELECT action_id, result, created_at FROM results WHERE region_id = ?').all(region.id);
    log(`${region.id}: version ${region.version}, state ${(region.state.length / 1024).toFixed(0)} KB, ${results.length} stored answer(s)`);
    const made = await post(`/import/region?region=${encodeURIComponent(region.id)}`, { region: { ...region, state: JSON.parse(region.state) }, replace });
    const who = made.players.map((p) => `${p.name} the ${p.classId} (level ${p.level})`).join(', ') || 'nobody yet';
    log(`  the world is there at version ${made.version}: ${who}`);
    let total = 0;
    for (let i = 0; i < results.length; i += CHUNK) {
      const r = await post(`/import/results?region=${encodeURIComponent(region.id)}`, { results: results.slice(i, i + CHUNK) });
      total = r.results;
    }
    log(`  ${total} stored answer(s) there now`);
  }
  const acc = await post('/import/accounts', { accounts, tokens });
  log(`accounts there now: ${acc.accounts} (${acc.names.join(', ') || 'none'}), ${acc.tokens} token(s)`);
  log(`done; open ${to}/status to see the world`);
} catch (e) {
  console.error(`[import] ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
} finally {
  db.close();
  rmSync(tmp, { recursive: true, force: true });
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(to + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` }, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(`could not reach ${to}: ${e instanceof Error ? e.message : String(e)} (is the worker running? npm run world:dev)`);
  }
  const text = await res.text();
  if (res.status === 409) throw new Error(`${text}\n  Run again with --replace to replace what the worker holds.`);
  if (!res.ok) throw new Error(`${res.status} from ${path}: ${text}`);
  return JSON.parse(text);
}

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function log(line) {
  console.log(`[import] ${line}`);
}
