// The actors' `Sql` over better-sqlite3 in memory: what the Durable Object's storage gives them, for the tests in Node.
// So the region actor, the accounts and the hub are tested with the very code the worker runs; only this file differs.

import Database from 'better-sqlite3';
import type { Sql, SqlValue } from '../src/sql.ts';

export function memorySql(): Sql & { close(): void } {
  const db = new Database(':memory:');
  return {
    exec<T>(query: string, ...bindings: SqlValue[]): T[] {
      let stmt: Database.Statement;
      try {
        stmt = db.prepare(query);
      } catch (e) {
        // Several statements in one string (the schema): run them all; no rows come back.
        if (bindings.length === 0 && /more than one statement/i.test(String(e))) {
          db.exec(query);
          return [];
        }
        throw e;
      }
      if (stmt.reader) return stmt.all(...bindings) as T[];
      stmt.run(...bindings);
      return [];
    },
    transaction<T>(fn: () => T): T {
      return db.transaction(fn)();
    },
    close() {
      db.close();
    },
  };
}
