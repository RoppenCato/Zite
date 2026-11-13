// The accounts on Cloudflare: the save is the account (CLAUDE.md). The same rows and the same codes as the Node
// server's (server/src/accounts.ts), over the small `Sql` interface, with the browser's crypto instead of Node's. One
// row per character; a device holds a token, a player holds a recovery code for the next phone. Both are stored as they
// are, as on Robin's PC (docs/state/protocol.md, mine, 2026-11-01): hashing them is a step for a public server.

import type { ClassId } from '../../rules/src/index.ts';
import type { Sql } from './sql.ts';

export const ACCOUNTS_SCHEMA_VERSION = 2;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  class_id   TEXT NOT NULL,
  region_id  TEXT NOT NULL,
  recovery   TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tokens (
  token      TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  created_at INTEGER NOT NULL
);
`;

export interface Account {
  /** The player id in the region's state. */
  id: string;
  name: string;
  classId: ClassId;
  regionId: string;
  /** The recovery code as shown: three groups of four. */
  recovery: string;
}

/** An account's row as the Node server stores it, and as the import brings it. */
export interface AccountRow {
  id: string;
  name: string;
  class_id: string;
  region_id: string;
  recovery: string;
  created_at: number;
  last_seen: number;
}

/** A token's row as the Node server stores it. */
export interface TokenRow {
  token: string;
  account_id: string;
  created_at: number;
}

/** No 0, O, 1 or I: nothing to mistake when read off a screen. 32 letters, so a byte picks one evenly. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Make the tables and check the schema's version. */
export function openAccountsSchema(sql: Sql): void {
  sql.exec(SCHEMA);
  const row = sql.exec<{ value: string }>('SELECT value FROM meta WHERE key = ?', 'schema_version')[0];
  if (!row) sql.exec('INSERT INTO meta (key, value) VALUES (?, ?)', 'schema_version', String(ACCOUNTS_SCHEMA_VERSION));
  else if (Number(row.value) > ACCOUNTS_SCHEMA_VERSION) throw new Error(`storage is schema ${row.value}; this worker needs ${ACCOUNTS_SCHEMA_VERSION} and cannot go down`);
}

export class Accounts {
  private readonly sql: Sql;
  private readonly now: () => number;

  constructor(sql: Sql, now: () => number = () => Date.now()) {
    this.sql = sql;
    this.now = now;
  }

  /** The account a device's token belongs to, or null. */
  byToken(token: string): Account | null {
    const row = this.sql.exec<AccountRow>('SELECT a.id, a.name, a.class_id, a.region_id, a.recovery, a.created_at, a.last_seen FROM tokens t JOIN accounts a ON a.id = t.account_id WHERE t.token = ?', token)[0];
    return row ? toAccount(row) : null;
  }

  /** The account a recovery code belongs to, however it was typed (case, dashes and spaces do not matter), or null. */
  byRecovery(code: string): Account | null {
    const row = this.sql.exec<AccountRow>('SELECT id, name, class_id, region_id, recovery, created_at, last_seen FROM accounts WHERE recovery = ?', plainCode(code))[0];
    return row ? toAccount(row) : null;
  }

  /** A new account with its first token. */
  create(o: { name: string; classId: ClassId; regionId: string }): { account: Account; token: string } {
    const id = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const recovery = newCode();
    const token = crypto.randomUUID();
    const now = this.now();
    this.sql.transaction(() => {
      this.sql.exec('INSERT INTO accounts (id, name, class_id, region_id, recovery, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)', id, o.name, o.classId, o.regionId, recovery, now, now);
      this.sql.exec('INSERT INTO tokens (token, account_id, created_at) VALUES (?, ?, ?)', token, id, now);
    });
    return { account: { id, name: o.name, classId: o.classId, regionId: o.regionId, recovery: showCode(recovery) }, token };
  }

  /** Another token for the account: a new phone that typed the code. The old tokens stay good. */
  newToken(accountId: string): string {
    const token = crypto.randomUUID();
    this.sql.exec('INSERT INTO tokens (token, account_id, created_at) VALUES (?, ?, ?)', token, accountId, this.now());
    return token;
  }

  /** Seen now. */
  touch(accountId: string): void {
    this.sql.exec('UPDATE accounts SET last_seen = ? WHERE id = ?', this.now(), accountId);
  }

  count(): number {
    return this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM accounts')[0]?.n ?? 0;
  }

  /** The names of everyone, for the import's answer. */
  names(): string[] {
    return this.sql.exec<{ name: string }>('SELECT name FROM accounts ORDER BY created_at').map((r) => r.name);
  }

  /**
   * Accounts and tokens from another server (the import, tools/import-world.mjs). An account with the same id is
   * replaced; a token already here is kept. Running the import twice changes nothing.
   */
  importRows(accounts: AccountRow[], tokens: TokenRow[]): { accounts: number; tokens: number } {
    this.sql.transaction(() => {
      for (const a of accounts) this.sql.exec('INSERT OR REPLACE INTO accounts (id, name, class_id, region_id, recovery, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)', a.id, a.name, a.class_id, a.region_id, a.recovery, a.created_at, a.last_seen);
      for (const t of tokens) this.sql.exec('INSERT OR IGNORE INTO tokens (token, account_id, created_at) VALUES (?, ?, ?)', t.token, t.account_id, t.created_at);
    });
    return { accounts: this.count(), tokens: this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM tokens')[0]?.n ?? 0 };
  }
}

function toAccount(row: AccountRow): Account {
  return { id: row.id, name: row.name, classId: row.class_id as ClassId, regionId: row.region_id, recovery: showCode(row.recovery) };
}

/** Twelve letters from the alphabet, stored plain. */
function newCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(12))].map((b) => ALPHABET[b % ALPHABET.length]!).join('');
}

/** As typed, to as stored: upper case, letters and digits only. */
export function plainCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** As stored, to as shown: `KPM4-R7QX-2HJD`. */
export function showCode(plain: string): string {
  return `${plain.slice(0, 4)}-${plain.slice(4, 8)}-${plain.slice(8, 12)}`;
}
