// The meadows' voices sprite, under the game's ids (rules/data/enemies.json: the ids are the first names and never show). Nigel, SD, 2026-11-01.
//   node sfx/creatures/_sprite-spec.js && node tools/sprite.js sfx/creatures/_sprite-creatures-meadows.json out/sfx/creatures/game
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const set = JSON.parse(fs.readFileSync(path.join(ROOT, 'out/sfx/creatures/creatures.json'), 'utf8')).sounds;
const IDS = { slime: 'slime', sprout: 'wolf', bandit: 'bandit', bee: 'wisp', muncher: 'wolf-alpha', goo: 'thornwood-warden' };
const sounds = Object.keys(set).map(k => { const [who, what] = k.split('_'); return { name: `creature/${IDS[who]}/${what}`, file: 'out/sfx/creatures/' + set[k].files[0], gain: set[k].gain, loop: false }; });
fs.writeFileSync(path.join(__dirname, '_sprite-creatures-meadows.json'), JSON.stringify({ name: 'creatures-meadows', gap: 0.05, sounds }, null, 1));
console.log(sounds.length + ' sounds');
