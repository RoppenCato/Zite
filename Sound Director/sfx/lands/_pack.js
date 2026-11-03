// Levels and packs the three lands and the talents (2026-11-03). fight/storm-bite and fight/ending-sting go into the fight set, not the lands' (Miles, GD).
//   node sfx/lands/_pack.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const run = (args) => execFileSync('node', args, { cwd: ROOT, encoding: 'utf8' });
const ANCHOR = ['--weighted', '--anchor', 'out/_archive/die-land-a-c-2026-11-03/die_land_a_1.wav:1.0'];
const sprite = (spec, out) => { const r = run(['tools/sprite.js', spec, out]); return r.split('\n').find(l => /\.ogg [0-9]/.test(l)); };

// 1. the two fight moments
const moves = { storm_bite: ['giants', 'giants_storm_bite'], ending_sting: ['crown', 'crown_ending_sting'] };
const fightLv = JSON.parse(fs.readFileSync(path.join(ROOT, 'sfx/fight/_levels.json'), 'utf8'));
for (const [name, [land, src]] of Object.entries(moves)) {
  const lv = JSON.parse(fs.readFileSync(path.join(__dirname, `_levels-${land}.json`), 'utf8'))[src];
  fightLv[name] = lv;
  fs.copyFileSync(path.join(ROOT, `out/sfx/${land}/${src}_1.wav`), path.join(ROOT, `out/sfx/fight/${name}_1.wav`));
  fs.copyFileSync(path.join(__dirname, `${src}.rb`), path.join(ROOT, `out/sfx/fight/${name}.rb`));
  for (const f of [`${src}_1.wav`, `${src}.rb`]) { const p = path.join(ROOT, `out/sfx/${land}/${f}`); if (fs.existsSync(p)) fs.unlinkSync(p); }
}
fs.writeFileSync(path.join(ROOT, 'sfx/fight/_levels.json'), JSON.stringify(fightLv, null, 2));
console.log(run(['tools/sfx-level.js', 'out/sfx/fight', 'sfx/fight/_levels.json', '--only', 'storm_bite,ending_sting', ...ANCHOR]).split('\n').filter(l => /moved|storm_bite|ending_sting/.test(l)).join('\n'));
run(['sfx/fight/_sprite-spec.js']);
console.log('fight: ' + sprite('sfx/fight/_sprite-fight.json', 'out/sfx/fight/game'));

// 2. the lands
for (const land of ['pirates', 'giants', 'crown']) {
  const lv = JSON.parse(fs.readFileSync(path.join(__dirname, `_levels-${land}.json`), 'utf8'));
  for (const [, src] of Object.values(moves)) delete lv[src];
  const spec = path.join(__dirname, `_levels-${land}-pack.json`);
  fs.writeFileSync(spec, JSON.stringify(lv, null, 2));
  run(['tools/sfx-level.js', `out/sfx/${land}`, spec, ...ANCHOR]);
  const set = JSON.parse(fs.readFileSync(path.join(ROOT, `out/sfx/${land}/${land}.json`), 'utf8')).sounds;
  const names = JSON.parse(fs.readFileSync(path.join(__dirname, `_names-${land}.json`), 'utf8')).filter(n => set[n.src]);
  const sp = path.join(__dirname, `_sprite-creatures-${land}.json`);
  fs.writeFileSync(sp, JSON.stringify({ name: `creatures-${land}`, gap: 0.05, sounds: names.map(n => ({ name: n.name, file: `out/sfx/${land}/` + set[n.src].files[0], gain: set[n.src].gain, loop: false })) }, null, 1));
  console.log(`creatures-${land}: ` + sprite(sp, `out/sfx/${land}/game`));
}

// 3. the talents
fs.mkdirSync(path.join(ROOT, 'out/sfx/talents/game'), { recursive: true });
run(['tools/sfx-level.js', 'out/sfx/talents', 'sfx/talents/_levels.json', ...ANCHOR]);
run(['sfx/talents/_sprite-spec.js']);
console.log('fight-talents: ' + sprite('sfx/talents/_sprite-fight-talents.json', 'out/sfx/talents/game'));
