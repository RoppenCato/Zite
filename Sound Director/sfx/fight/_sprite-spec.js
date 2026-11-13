// Builds sfx/fight/_sprite-fight.json from the levelled set out/sfx/fight/fight.json, under the names the game's FightScene calls (Miles, GD,
// 2026-11-01): three variations with -1..-3 for the swing, the hits, the miss and the enemy's blows, the plain name for the rest.
//   node sfx/fight/_sprite-spec.js && node tools/sprite.js sfx/fight/_sprite-fight.json out/sfx/fight/game
// Nigel, SD, 2026-11-01.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const set = JSON.parse(fs.readFileSync(path.join(ROOT, 'out/sfx/fight/fight.json'), 'utf8')).sounds;
const THREE = new Set(['swing', 'hit_light', 'hit_heavy', 'crit', 'miss', 'enemy_hit_light', 'enemy_hit_heavy', 'pet_wolf', 'pet_bear', 'pet_viper']);
const SPECIAL = { effect_attackup: 'fight/effect-attackUp', effect_surecrit: 'fight/effect-sureCrit', effect_valorup: 'fight/effect-valorUp', ability_heavy_blow: 'fight/ability-heavy-blow',
  ability_shield_bash: 'fight/ability-shield-bash', ability_war_cry: 'fight/ability-war-cry', ability_execute: 'fight/ability-execute',
  ability_rally: 'fight/ability-rally', ability_shield_wall: 'fight/ability-shield-wall' };
const sounds = [];
for (const key of Object.keys(set)) {
  const game = SPECIAL[key] || 'fight/' + key.replace(/_/g, '-');
  const three = THREE.has(key);
  set[key].files.slice(0, three ? 3 : 1).forEach((f, i) => sounds.push({ name: three ? game + '-' + (i + 1) : game, file: 'out/sfx/fight/' + f, gain: set[key].gain, loop: false }));
}
fs.writeFileSync(path.join(__dirname, '_sprite-fight.json'), JSON.stringify({ name: 'fight', gap: 0.05, sounds }, null, 1));
console.log(sounds.length + ' sounds in the spec');
