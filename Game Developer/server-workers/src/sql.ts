// The little of SQL the world's actors need, as one small interface, so the very same actor runs on a Durable Object's
// storage (`ctx.storage.sql`, wrapped in index.ts) and, in the tests, on better-sqlite3 in Node (test/memory-sql.ts).

export type SqlValue = string | number | null;

export interface Sql {
  /** Run a statement with its bindings and give back the rows it returns (none for a write). Several statements in one string are allowed when there are no bindings (the schema). */
  exec<T = Record<string, SqlValue>>(query: string, ...bindings: SqlValue[]): T[];
  /** Run `fn` as one transaction: all of its writes land, or none. `fn` must not await. */
  transaction<T>(fn: () => T): T;
}
