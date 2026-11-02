// Which spots lie near a point, or near a spot: for laying a road clear of them. Not part of the game.
//   node tools/spots-near.ts <spot id | x y> [radius]

import { makeBoard } from '../rules/src/index.ts';

const board = makeBoard();
const [a, b, c] = process.argv.slice(2);
const at = board.spaces[a!];
const x = at ? at.x : Number(a);
const y = at ? at.y : Number(b);
const radius = Number(at ? b : c) || 300;
for (const s of Object.values(board.spaces)) {
  const d = Math.hypot(s.x - x, s.y - y);
  if (d < radius) console.log(`${Math.round(d)}`.padStart(5), `${s.id} @ ${Math.round(s.x)},${Math.round(s.y)} ${s.kind}`);
}
