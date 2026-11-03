// Every pressed talent has a sound in Nigel, SD's map, and says which of them have not arrived in a sprite yet. Not part of the game.
//   node tools/check-sounds.ts

import { readdirSync, readFileSync } from 'node:fs';
import { ABILITIES } from '../rules/src/index.ts';

const map = JSON.parse(readFileSync('assets/sound/talents/talent-map.json', 'utf8')) as Record<string, string>;
const known = new Set<string>();
for (const dir of readdirSync('assets/sound')) {
  // Every sprite in the folder, whatever its name (the talents' is fight-talents.json).
  for (const file of (() => { try { return readdirSync(`assets/sound/${dir}`).filter((f) => f.endsWith('.json')); } catch { return []; } })()) {
    try {
      const sprite = JSON.parse(readFileSync(`assets/sound/${dir}/${file}`, 'utf8')) as { spritemap?: Record<string, unknown> };
      for (const name of Object.keys(sprite.spritemap ?? {})) known.add(name);
    } catch {
      // Not a sprite.
    }
  }
}
const pressed = Object.entries(ABILITIES).filter(([, a]) => !a.rule).map(([id]) => id);
console.log(`${pressed.length} pressed talents; not in the map: ${pressed.filter((id) => !map[id]).join(', ') || 'none'}`);
console.log(`Sounds still to come: ${[...new Set(pressed.map((id) => map[id]!).filter((name) => name && !known.has(name)))].join(', ') || 'none'}`);
