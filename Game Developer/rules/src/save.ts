import { STATE_VERSION, type GameState } from './types.ts';

/**
 * Bring a stored state up to the current version. Version 1 is the first, so there is nothing to migrate yet;
 * when version 2 comes, this is where 1 becomes 2. Returns null for a thing that is not a state we know,
 * so the holder starts a fresh game instead of crashing on it.
 */
export function migrate(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { version?: unknown };
  if (candidate.version === STATE_VERSION) return raw as GameState;
  return null;
}
