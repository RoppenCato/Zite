// Levels and packs Robin's "fill the holes" (2026-11-03): five new land sprites, Grumblebark's surge into creatures-forest, six effects into fight,
// the quest board into ui-spots, five steps into ui; and the meadows' slime and King Goo deaths and the blood slash, re-rendered with their splat.
//   node sfx/lands2/_pack.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const run = (args) => execFileSync('node', args, { cwd: ROOT, encoding: 'utf8' });
const ANCHOR = ['--weighted', '--anchor', 'out/_archive/die-land-a-c-2026-11-03/die_land_a_1.wav:1.0'];
const sprite = (spec, out) => run(['tools/sprite.js', spec, out]).split('\n').find(l => /\.ogg [0-9]/.test(l));
const level = (dir, spec, only) => run(['tools/sfx-level.js', dir, spec, ...(only ? ['--only', only.join(',')] : []), ...ANCHOR]);
const say = (s) => console.log(s);

// 1. the five lands
for (const land of ['honeyhill', 'bogglemire', 'frostcrown', 'rootways', 'kingswood']) {
  level(`out/sfx/${land}`, `sfx/lands2/_levels-${land}.json`);
  const set = JSON.parse(fs.readFileSync(path.join(ROOT, `out/sfx/${land}/${land}.json`), 'utf8')).sounds;
  const names = JSON.parse(fs.readFileSync(path.join(__dirname, `_names-${land}.json`), 'utf8')).filter(n => set[n.src]);
  const sp = path.join(__dirname, `_sprite-creatures-${land}.json`);
  fs.writeFileSync(sp, JSON.stringify({ name: `creatures-${land}`, gap: 0.05, sounds: names.map(n => ({ name: n.name, file: `out/sfx/${land}/` + set[n.src].files[0], gain: set[n.src].gain, loop: false })) }, null, 1));
  say(`creatures-${land}: ${names.length} sounds, ` + sprite(sp, `out/sfx/${land}/game`));
}

// 2. Grumblebark's surge into the forest's set, and the forest sprite again
fs.copyFileSync(path.join(ROOT, 'out/sfx/forest/forest_grumblebark_surge_1.wav'), path.join(ROOT, 'out/sfx/forest/grumblebark_surge_1.wav'));
fs.unlinkSync(path.join(ROOT, 'out/sfx/forest/forest_grumblebark_surge_1.wav'));
const flv = JSON.parse(fs.readFileSync(path.join(ROOT, 'sfx/forest/_levels.json'), 'utf8'));
flv.grumblebark_surge = JSON.parse(fs.readFileSync(path.join(__dirname, '_levels-forest.json'), 'utf8')).forest_grumblebark_surge;
fs.writeFileSync(path.join(ROOT, 'sfx/forest/_levels.json'), JSON.stringify(flv, null, 2));
level('out/sfx/forest', 'sfx/forest/_levels.json', ['grumblebark_surge']);
run(['sfx/fight-classes/_sprite-spec.js']);
say('creatures-forest: ' + sprite('sfx/forest/_sprite-creatures-forest.json', 'out/sfx/forest/game'));

// 3. the effects into fight
level('out/sfx/fight', 'sfx/fight/_levels.json', ['effect_burn', 'effect_bleed', 'effect_sunder', 'effect_interrupt', 'effect_guardian', 'effect_clone']);
run(['sfx/fight/_sprite-spec.js']);
say('fight: ' + sprite('sfx/fight/_sprite-fight.json', 'out/sfx/fight/game'));

// 4. the board and the steps into the UI sprites
level('out/sfx/ui', 'sfx/ui/_levels.json', ['arrive_board', 'step_stone', 'step_wood', 'step_snow', 'step_mud', 'step_sand']);
run(['sfx/ui/_sprite-spec.js']);
say('ui: ' + sprite('sfx/ui/_sprite-ui.json', 'out/sfx/ui/game'));
say('ui-spots: ' + sprite('sfx/ui/_sprite-ui-spots.json', 'out/sfx/ui/game'));

// 5. the re-rendered splats: the meadows' slime and King Goo, the blood slash
level('out/sfx/creatures', 'sfx/creatures/_levels.json', ['slime_die', 'goo_die']);
run(['sfx/creatures/_sprite-spec.js']);
say('creatures-meadows: ' + sprite('sfx/creatures/_sprite-creatures-meadows.json', 'out/sfx/creatures/game'));
level('out/sfx/talents', 'sfx/talents/_levels.json', ['blood']);
run(['sfx/talents/_sprite-spec.js']);
say('fight-talents: ' + sprite('sfx/talents/_sprite-fight-talents.json', 'out/sfx/talents/game'));
