// Reads the text of several sim-full runs and prints one short table: per build, then per class, then the bosses. Not part of the game.
//   node tools/sim-summary.mjs <file> [<file> ...]

import { readFileSync } from 'node:fs';

const rows = [];
const bosses = new Map();
const bands = [];
let other = [];
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const cls = /r\d+-(\w+)\.txt/.exec(file)?.[1] ?? file;
  for (const line of text.split('\n')) {
    const m = /^(\w+)\s+(\S+)\s+(\w+)\s+L\s*(\d+) h\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+deaths\s+(\d+) fights\s+(\d+) bosses\s+(\d+) left (\d+) quests\s+(\d+) arena (\d+)\/(\d+) gold\s+(\d+) rank ([\d.]+)(.*)$/.exec(line);
    if (m) rows.push({ cls: m[1], build: m[2], tactic: m[3], level: +m[4], h10: m[6], h20: m[8], h30: m[10], deaths: +m[11], fights: +m[12], left: +m[14], quests: +m[15], gold: +m[18], rank: m[19], stuck: m[20].trim() });
    const b = /^  (.+?)\s+L\s*(\d+) beaten at L\s*([\d.]+) tries ([\d.]+) deaths ([\d.]+) rounds\s+(\d+) flasks (-?[\d.]+) at ([\d.]+)h/.exec(line);
    if (b) (bosses.get(b[1]) ?? bosses.set(b[1], []).get(b[1])).push({ cls, L: +b[2], at: +b[3], tries: +b[4], deaths: +b[5], rounds: +b[6], flasks: +b[7], h: +b[8] });
    if (/^  (1-10|11-20|21-30) /.test(line)) bands.push(line.trim().replace(/\s+/g, ' '));
    if (/^Gold a run|^  +\d+  (hp|mana|carries|a Hunter|stat|enemy|points|stands)|^Stuck|^Actives|^Learned/.test(line)) other.push(`${cls}: ${line.trim().slice(0, 190)}`);
  }
}
console.log('build                         tactic   L  h10  h20  h30 die  fights left quests gold rank');
for (const r of rows) console.log(`${r.cls.slice(0, 4)} ${r.build.padEnd(24)} ${r.tactic.padEnd(8)} ${String(r.level).padStart(2)} ${r.h10.padStart(4)} ${r.h20.padStart(4)} ${r.h30.padStart(4)} ${String(r.deaths).padStart(3)} ${String(r.fights).padStart(6)} ${String(r.left).padStart(3)} ${String(r.quests).padStart(5)} ${String(r.gold).padStart(6)} ${r.rank}${r.stuck ? ' ' + r.stuck.slice(0, 40) : ''}`);
console.log('\nboss (per class: tries/deaths/rounds/flasks)');
for (const [name, list] of [...bosses].sort((a, b) => a[1][0].L - b[1][0].L)) console.log(`${name.padEnd(18)} L${String(list[0].L).padStart(2)} ` + list.map((b) => `${b.cls.slice(0, 3)} ${b.tries}/${b.deaths}/${b.rounds}/${b.flasks}`).join('  '));
console.log('');
for (const b of bands) if (!/fights 0 /.test(b)) console.log(b);
console.log('');
for (const o of other) console.log(o);
