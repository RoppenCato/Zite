// The sprites for chapter 2, under Miles, GD's names (2026-11-01): fight-classes (abilities, pips, the star's landing) and creatures-forest (voices, steps).
//   node sfx/fight-classes/_sprite-spec.js
//   node tools/sprite.js sfx/fight-classes/_sprite-fight-classes.json out/sfx/fight-classes/game
//   node tools/sprite.js sfx/forest/_sprite-creatures-forest.json out/sfx/forest/game
// Run after sfx-level on both sets. Nigel, SD, 2026-11-01.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const load = (s) => JSON.parse(fs.readFileSync(path.join(ROOT, `out/sfx/${s}/${s}.json`), 'utf8')).sounds;

const cls = load('fight-classes'), a = [];
for (const k of Object.keys(cls)) {
  let name;
  if (k.startsWith('ability_')) name = 'fight/ability-' + k.slice(8).replace(/_/g, '-');
  else if (k.startsWith('pip_')) name = 'fight/meter-pip-' + k.slice(4);
  else if (k === 'meteor_land') name = 'fight/meteor-land';
  else throw new Error('unnamed: ' + k);
  a.push({ name, file: 'out/sfx/fight-classes/' + cls[k].files[0], gain: cls[k].gain, loop: false });
}
fs.writeFileSync(path.join(__dirname, '_sprite-fight-classes.json'), JSON.stringify({ name: 'fight-classes', gap: 0.05, sounds: a }, null, 1));

const IDS = { twigling: 'spider', goblin: 'treant', sporeling: 'outlaw', nutkin: 'wraith', owlbear: 'spider-queen', grumblebark: 'briar-king' };
const forest = load('forest'), b = [];
for (const k of Object.keys(forest)) {
  if (k === 'step_roots' || k === 'step_moss') {
    forest[k].files.slice(0, 3).forEach((f, i) => b.push({ name: `ui/step-${k.slice(5)}-${i + 1}`, file: 'out/sfx/forest/' + f, gain: forest[k].gain, loop: false }));
  } else {
    const [who, what] = k.split('_');
    if (!IDS[who]) throw new Error('unnamed: ' + k);
    b.push({ name: `creature/${IDS[who]}/${what}`, file: 'out/sfx/forest/' + forest[k].files[0], gain: forest[k].gain, loop: false });
  }
}
fs.writeFileSync(path.join(ROOT, 'sfx/forest/_sprite-creatures-forest.json'), JSON.stringify({ name: 'creatures-forest', gap: 0.05, sounds: b }, null, 1));
console.log(a.length + ' in fight-classes, ' + b.length + ' in creatures-forest');
