// Builds the sprite specs (the input of tools/sprite.js) from the levelled set out/sfx/ui/ui.json: every sound under the game's name
// (Miles, GD's names, docs/game-notes.md), its gain, whether it loops, its fixed length, how many variations the game gets and which
// sprite holds it. Miles, GD, 2026-11-01: one variation for anything heard less than once a minute (the banners, the bursts, the
// arrivals, the shop and bag, the character screen), three for what is heard every turn (taps, steps, the die, hits); a second sprite
// `ui-spots` for the arrivals and the spots, a third `ui-chrome` if `ui` still presses 60 s. A sound with one variation carries the
// plain name (`ui/boss-down`), with three the suffix (`ui/tap-1`); the game finds a name in whichever sprite holds it.
//   node sfx/ui/_sprite-spec.js && for s in ui ui-spots; do node tools/sprite.js sfx/ui/_sprite-$s.json out/sfx/ui/game; done
// Nigel, SD, 2026-11-01.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const set = JSON.parse(fs.readFileSync(path.join(ROOT, 'out/sfx/ui/ui.json'), 'utf8')).sounds;
// studio name -> { game name, variations (1 or 3), sprite, loop, length }
const N = (name, vars = 3, sprite = 'ui', extra = {}) => ({ name, vars, sprite, ...extra });
const NAMES = {
  die_shake: N('ui/die-shake'), die_tumble: N('ui/die-tumble', 3, 'ui', { loop: true, length: 0.6 }),
  die_land_b: N('ui/die-land'),                          // Robin's pick, 2026-11-03 (A and C archived)
  tap: N('ui/tap'), tap_denied: N('ui/tap-denied'), choice: N('ui/choice'), step_grass: N('ui/step-grass'),
  chest_shimmer: N('ui/chest-shimmer', 1), chest_card: N('ui/chest-card'), chest_ding: N('ui/chest-ding', 1),
  chest_burst_common: N('ui/chest-burst-common', 1), chest_burst_uncommon: N('ui/chest-burst-uncommon', 1), chest_burst_rare: N('ui/chest-burst-rare', 1),
  chest_burst_epic: N('ui/chest-burst-epic', 1), chest_burst_legendary: N('ui/chest-burst-legendary', 1), chest_burst_unique: N('ui/chest-burst-unique', 1),
  arrive_town: N('ui/arrive-town', 1, 'ui-spots'), arrive_shop: N('ui/arrive-shop', 1, 'ui-spots'), arrive_spring: N('ui/arrive-spring', 1, 'ui-spots'), arrive_shrine: N('ui/arrive-shrine', 1, 'ui-spots'), arrive_chest: N('ui/arrive-chest', 1, 'ui-spots'), arrive_wild: N('ui/arrive-wild', 1, 'ui-spots'), arrive_boss: N('ui/arrive-boss', 1, 'ui-spots'), spring_fill: N('ui/spring-fill', 1, 'ui-spots'), shrine_teach: N('ui/shrine-teach', 1, 'ui-spots'), spot_empty: N('ui/spot-empty', 1, 'ui-spots'),
  gold_gain: N('ui/gold-gain', 1), gold_small: N('ui/gold-small', 1), gold_lost: N('ui/gold-lost', 1), pick_appear: N('ui/pick-appear', 1), chip: N('ui/chip', 1), errand_take: N('ui/errand-take', 1), errand_done: N('ui/errand-done', 1), trainer: N('ui/trainer', 1), buy: N('ui/buy', 1), sell: N('ui/sell', 1), wear: N('ui/wear', 1), take_off: N('ui/take-off', 1), drop_item: N('ui/drop-item', 1), online_join: N('ui/online-join', 1), online_leave: N('ui/online-leave', 1), online_reconnect: N('ui/online-reconnect', 1), online_note: N('ui/online-note', 1), card: N('ui/card', 1), card_knight: N('ui/card-knight', 1), card_trickster: N('ui/card-trickster', 1), card_wizard: N('ui/card-wizard', 1), card_archer: N('ui/card-archer', 1), begin: N('ui/begin', 1), hint: N('ui/hint', 1), message_tick: N('ui/message-tick', 1), sheet_open: N('ui/sheet-open', 1), sheet_close: N('ui/sheet-close', 1),
  arrive_church: N('ui/arrive-church', 1, 'ui-spots'), stung: N('ui/stung', 1),
  board_open: N('ui/board-open', 1), quest_done: N('ui/quest-done', 1), person_found: N('ui/person-found', 1), log_open: N('ui/log-open', 1),
  night_falls: N('ui/night-falls', 1), morning: N('ui/morning', 1), sleep: N('ui/sleep', 1),
  arrive_board: N('ui/arrive-board', 1, 'ui-spots'),
  step_stone: N('ui/step-stone'), step_wood: N('ui/step-wood'), step_snow: N('ui/step-snow'), step_mud: N('ui/step-mud'), step_sand: N('ui/step-sand'),   // Robin's "fill the holes", 2026-11-03
  dream_ferry: N('ui/ferry', 1, 'ui-spots'), dream_dreamgate: N('ui/dreamgate', 1, 'ui-spots'), dream_wake: N('ui/wake', 1, 'ui-spots'), dream_dreamdust: N('ui/dreamdust', 1, 'ui-spots'), dream_dreamdust_buy: N('ui/dreamdust-buy', 1, 'ui-spots'),   // the Dream, 2026-11-03
  level_up: N('ui/level-up', 1), boss_down: N('ui/boss-down', 1), area_opened: N('ui/area-opened', 1),
};
const specs = {};
for (const key of Object.keys(NAMES)) {
  if (!set[key]) { console.warn('not in the set yet: ' + key); continue; }
  const { name, vars, sprite, loop, length } = NAMES[key];
  const files = set[key].files.slice(0, vars);
  files.forEach((f, i) => (specs[sprite] = specs[sprite] || []).push({ name: vars === 1 ? name : name + '-' + (i + 1), file: 'out/sfx/ui/' + f, gain: set[key].gain, loop: !!loop, ...(length ? { length } : {}) }));
}
for (const key of Object.keys(set)) if (!NAMES[key]) console.warn('in the set but unnamed for the game: ' + key);
for (const sprite of Object.keys(specs)) {
  fs.writeFileSync(path.join(__dirname, '_sprite-' + sprite + '.json'), JSON.stringify({ name: sprite, gap: 0.05, sounds: specs[sprite] }, null, 1));
  console.log(sprite + ': ' + specs[sprite].length + ' sounds in the spec');
}
