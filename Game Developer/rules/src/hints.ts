// What touching a spot tells the player (Robin, 2026-10-31: hints on what you could meet, level range and loot, but
// not everything). Pure text from the state, so the server can send the same line later.

import { GEAR, SPACE_KIND_DATA } from './data.ts';
import { creature } from './fight.ts';
import { rankName } from './gear.ts';
import { grownIndex, peekArea } from './generate.ts';
import { questLine } from './quests.ts';
import type { GameState } from './types.ts';

/** A clock reading of ms left: "4:12". */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function hintFor(state: GameState, spaceId: string, player: string, now: number): string {
  const space = state.board.spaces[spaceId];
  if (!space) return '';
  const area = state.board.areas[space.area];
  const me = state.characters[player];
  const where = `${space.name || SPACE_KIND_DATA[space.kind].label} · ${area?.name ?? space.area}`;
  const bestiary = state.board.bestiary;
  if (area && me && !me.opened.includes(area.id)) {
    const gate = Object.values(state.board.spaces).find((s) => s.opens === area.id);
    const boss = gate?.boss ? creature(gate.boss, bestiary) : undefined;
    return `${area.name} (tier ${area.tier}, levels ${area.levels[0]} to ${area.levels[1]}): closed. ${boss && gate ? `Beat ${boss.name} at ${gate.name} to open it.` : ''}`.trim();
  }
  const rank = rankName(area?.tier ?? 1);
  const left = me ? (me.cooldowns[spaceId] ?? 0) - now : 0;
  const again = left > 0 ? ` Again in ${countdown(left)}.` : '';
  const spawn = state.spawns[spaceId];
  switch (space.kind) {
    case 'normal': {
      const mobs = (area?.mobs ?? []).map((id) => creature(id, bestiary)?.name ?? id).join(', ');
      const prowl = spawn?.kind === 'miniboss' && spawn.enemy ? ` A ${creature(spawn.enemy, bestiary)?.name ?? spawn.enemy} prowls here!` : spawn?.kind === 'merchant' ? ' A wandering merchant has camped here.' : '';
      return `${where}, levels ${area?.levels[0]} to ${area?.levels[1]}: ${mobs} roam here. Gold, xp, now and then ${rank} gear, and sometimes something else.${prowl}`;
    }
    case 'chest': {
      if (space.locked) {
        const mini = area?.miniBosses[0] ? creature(area.miniBosses[0], bestiary)?.name : null;
        const key = (me?.keys[space.area] ?? 0) > 0 ? ' You carry its key.' : mini ? ` The ${mini} prowling the wilds carries the key.` : '';
        return `${where}: a locked vault, three times the gold and gear worth the trouble.${key}${again}`;
      }
      return `${where}: gold, and maybe ${rank} gear.${again}`;
    }
    case 'potion':
      return `${where}: a potion to take along.${again}`;
    case 'spell':
      return `${where}: learn an ability of your class, or improve one you know.${again}`;
    case 'shop':
      return `${where}: ${rank} gear, potions and dice cards; it buys what you carry.`;
    case 'town': {
      const mine = me?.quests.find((q) => q.town === spaceId);
      const errand = mine ? ` Your errand: ${questLine(mine)}` : (me?.cooldowns[`quest:${spaceId}`] ?? 0) > now ? '' : ' Someone here may have an errand.';
      return `${where}: rest, HP and mana to full. A shop, a trainer.${errand}`;
    }
    case 'boss': {
      const boss = space.boss ? creature(space.boss, bestiary) : undefined;
      const grown = space.opens ? grownIndex(space.opens) : null;
      const opens = space.opens ? (state.board.areas[space.opens]?.name ?? (grown ? `${peekArea(state.seed, grown).name} (tier ${peekArea(state.seed, grown).tier})` : null)) : null;
      const kills = me?.bossKills[spaceId] ?? 0;
      const back = left > 0 ? ` Beaten; back in ${countdown(left)}.` : '';
      return `${boss?.name ?? 'A boss'}, level ${boss?.level ?? '?'}, at ${space.name}. Land exactly here to fight it.${opens ? ` Beat it to open ${opens}.` : ' Nothing lies beyond yet.'}${back}${kills ? ` Beaten ${kills} ${kills === 1 ? 'time' : 'times'}.` : ''}`;
    }
  }
}

/** The names of the gear ranks, for the client's tables. */
export const RANK_NAMES = GEAR.ranks;
