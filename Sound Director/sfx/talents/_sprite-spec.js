// The fight-talents sprite: fifteen family sounds, fight/talent-<family>, one variation each. Loaded for every class. Nigel, SD, 2026-11-02.
//   node sfx/talents/_sprite-spec.js && node tools/sprite.js sfx/talents/_sprite-fight-talents.json out/sfx/talents/game
'use strict';
const fs = require('fs'), path = require('path');
const set = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../out/sfx/talents/talents.json'), 'utf8')).sounds;
const sounds = Object.keys(set).map(k => ({ name: 'fight/talent-' + k.replace(/_/g, '-'), file: 'out/sfx/talents/' + set[k].files[0], gain: set[k].gain, loop: false }));
fs.writeFileSync(path.join(__dirname, '_sprite-fight-talents.json'), JSON.stringify({ name: 'fight-talents', gap: 0.05, sounds }, null, 1));
console.log(sounds.length + ' sounds');
