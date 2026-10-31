// What touching a spot tells the player (Robin, 2026-10-31: hints on what you could meet, level range and loot, but
// not everything). Pure text from the state, so the server can send the same line later.

import { ENEMIES, GEAR, SPACE_KIND_DATA } from './data.ts';
import { rankName } from './gear.ts';
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
  if (area && me && !me.opened.includes(area.id)) {
    const gate = Object.values(state.board.spaces).find((s) => s.opens === area.id);
    const boss = gate?.boss ? ENEMIES[gate.boss] : undefined;
    return `${area.name} (tier ${area.tier}, levels ${area.levels[0]} to ${area.levels[1]}): closed. ${boss && gate ? `Beat ${boss.name} at ${gate.name} to open it.` : ''}`.trim();
  }
  const rank = rankName(area?.tier ?? 1);
  const left = me ? (me.cooldowns[spaceId] ?? 0) - now : 0;
  const again = left > 0 ? ` Again in ${countdown(left)}.` : '';
  const spawn = state.spawns[spaceId];
  switch (space.kind) {
    case 'normal': {
      const mobs = (area?.mobs ?? []).map((id) => ENEMIES[id]?.name ?? id).join(', ');
      const prowl = spawn?.kind === 'miniboss' && spawn.enemy ? ` A ${ENEMIES[spawn.enemy]?.name ?? spawn.enemy} prowls here!` : spawn?.kind === 'merchant' ? ' A wandering merchant has camped here.' : '';
      return `${where}, levels ${area?.levels[0]} to ${area?.levels[1]}: ${mobs} roam here. Gold, xp, now and then ${rank} gear, and sometimes something else.${prowl}`;
    }
    case 'chest':
      return `${where}: gold, and maybe ${rank} gear.${again}`;
    case 'potion':
      return `${where}: a potion to take along.${again}`;
    case 'spell':
      return `${where}: learn an ability of your class, or improve one you know.${again}`;
    case 'shop':
      return `${where}: ${rank} gear, potions and dice cards; it buys what you carry.`;
    case 'town':
      return `${where}: rest, HP and mana to full. A shop.`;
    case 'boss': {
      const boss = space.boss ? ENEMIES[space.boss] : undefined;
      const opens = space.opens ? state.board.areas[space.opens]?.name : null;
      const kills = me?.bossKills[spaceId] ?? 0;
      const back = left > 0 ? ` Beaten; back in ${countdown(left)}.` : '';
      return `${boss?.name ?? 'A boss'}, level ${boss?.level ?? '?'}, at ${space.name}. Land exactly here to fight it.${opens ? ` Beat it to open ${opens}.` : ' Nothing lies beyond yet.'}${back}${kills ? ` Beaten ${kills} ${kills === 1 ? 'time' : 'times'}.` : ''}`;
    }
  }
}

/** The names of the gear ranks, for the client's tables. */
export const RANK_NAMES = GEAR.ranks;
