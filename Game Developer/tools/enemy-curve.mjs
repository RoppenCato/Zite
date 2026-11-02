// Enemy strength by level, from the first numbers (Robin, 2026-11-02: "Tune the balance after every playthrough"). `tools/enemy-base.json` holds each creature as first set;
// this writes rules/data/enemies.json from it with the curve below, so a tuning pass is one edit here and every step stays comparable. Numbers mine; every creature below the
// `from` level stays as it was.
//   node tools/enemy-curve.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const CURVE = {
  from: 6,
  mob: { attack: 0.065, hp: 0.02 },
  mini: { attack: 0.05, hp: 0.03, hpFlat: 1.15 },
  boss: { attack: 0.04, hp: 0.04, attackFlat: 1.1 },
};

const base = JSON.parse(readFileSync('tools/enemy-base.json', 'utf8'));
const table = base.enemies ?? base;
for (const e of Object.values(table)) {
  if (typeof e !== 'object' || !e || !e.level || !CURVE[e.role]) continue;
  const over = Math.max(0, e.level - CURVE.from);
  if (!over) continue;
  const c = CURVE[e.role];
  e.attack = Math.round(e.attack * (1 + over * c.attack) * (c.attackFlat ?? 1));
  e.hp = Math.round(e.hp * (1 + over * c.hp) * (c.hpFlat ?? 1));
}
writeFileSync('rules/data/enemies.json', JSON.stringify(base, null, 2) + '\n');
