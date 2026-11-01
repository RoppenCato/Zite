// The accounts: the save is the account (CLAUDE.md). One row per character; a device holds a token, a player holds a
// recovery code for the next phone. Both are stored as they are on Robin's PC (docs/state/protocol.md, mine, 2026-11-01).

import { randomBytes, randomUUID } from 'node:crypto';
import type { ClassId } from '../../rules/src/index.ts';
import type { Db } from './db.ts';

export interface Account {
  /** The player id in the region's state. */
  id: string;
  name: string;
  classId: ClassId;
  regionId: string;
  /** The recovery code as shown: three groups of four. */
  recovery: string;
}

/** No 0, O, 1 or I: nothing to mistake when read off a screen. 32 letters, so a byte picks one evenly. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface AccountRow {
  id: string;
  name: string;
  class_id: string;
  region_id: string;
  recovery: string;
}

export class Accounts {
  private readonly db: Db;
  private readonly now: () => number;
  private readonly byTokenStmt;
  private readonly byRecoveryStmt;
  private readonly insertAccount;
  private readonly insertToken;
  private readonly touchStmt;

  constructor(db: Db, now: () => number = () => Date.now()) {
    this.db = db;
    this.now = now;
    this.byTokenStmt = db.prepare('SELECT a.id, a.name, a.class_id, a.region_id, a.recovery FROM tokens t JOIN accounts a ON a.id = t.account_id WHERE t.token = ?');
    this.byRecoveryStmt = db.prepare('SELECT id, name, class_id, region_id, recovery FROM accounts WHERE recovery = ?');
    this.insertAccount = db.prepare('INSERT INTO accounts (id, name, class_id, region_id, recovery, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)');
    this.insertToken = db.prepare('INSERT INTO tokens (token, account_id, created_at) VALUES (?, ?, ?)');
    this.touchStmt = db.prepare('UPDATE accounts SET last_seen = ? WHERE id = ?');
  }

  /** The account a device's token belongs to, or null. */
  byToken(token: string): Account | null {
    const row = this.byTokenStmt.get(token) as AccountRow | undefined;
    return row ? toAccount(row) : null;
  }

  /** The account a recovery code belongs to, however it was typed (case, dashes and spaces do not matter), or null. */
  byRecovery(code: string): Account | null {
    const row = this.byRecoveryStmt.get(plainCode(code)) as AccountRow | undefined;
    return row ? toAccount(row) : null;
  }

  /** A new account with its first token. */
  create(o: { name: string; classId: ClassId; regionId: string }): { account: Account; token: string } {
    const id = `p-${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const recovery = newCode();
    const token = randomUUID();
    const now = this.now();
    this.db.transaction(() => {
      this.insertAccount.run(id, o.name, o.classId, o.regionId, recovery, now, now);
      this.insertToken.run(token, id, now);
    })();
    return { account: { id, name: o.name, classId: o.classId, regionId: o.regionId, recovery: showCode(recovery) }, token };
  }

  /** Another token for the account: a new phone that typed the code. The old tokens stay good. */
  newToken(accountId: string): string {
    const token = randomUUID();
    this.insertToken.run(token, accountId, this.now());
    return token;
  }

  /** Seen now. */
  touch(accountId: string): void {
    this.touchStmt.run(this.now(), accountId);
  }

  count(): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM accounts').get() as { n: number }).n;
  }
}

function toAccount(row: AccountRow): Account {
  return { id: row.id, name: row.name, classId: row.class_id as ClassId, regionId: row.region_id, recovery: showCode(row.recovery) };
}

/** Twelve letters from the alphabet, stored plain. */
function newCode(): string {
  return [...randomBytes(12)].map((b) => ALPHABET[b % ALPHABET.length]!).join('');
}

/** As typed, to as stored: upper case, letters and digits only. */
export function plainCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** As stored, to as shown: `KPM4-R7QX-2HJD`. */
export function showCode(plain: string): string {
  return `${plain.slice(0, 4)}-${plain.slice(4, 8)}-${plain.slice(8, 12)}`;
}
