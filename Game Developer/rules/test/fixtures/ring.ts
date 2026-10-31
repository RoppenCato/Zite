// The twelve-space ring: the first board (2026-10-31), kept as a test fixture. The game tests and the server test play on
// it so their s0/s1/… expectations stay short; the real game plays on the island in rules/data/board.json.
import type { Board, Space } from '../../src/types.ts';
import ringJson from './ring.json' with { type: 'json' };

interface RingData {
  start: string;
  width: number;
  height: number;
  spaces: Space[];
}

const RING = ringJson as RingData;

/** A fresh copy of the ring each time, so a test may scribble on its links without touching the next test. */
export function ringBoard(): Board {
  const spaces: Board['spaces'] = {};
  for (const s of RING.spaces) spaces[s.id] = { ...s, links: [...s.links] };
  return { start: RING.start, width: RING.width, height: RING.height, spaces };
}
