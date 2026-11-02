// What touching a spot tells the player (Robin, 2026-10-31: hints on what you could meet, level range and loot, but
// not everything). Pure text from the state, so the server can send the same line later.

import { GEAR, SPACE_KIND_DATA, townKind } from './data.ts';
import { nextDay } from './calendar.ts';
import { arenaOpen } from './game.ts';
import { creature } from './fight.ts';
import { rankName } from './gear.ts';
import { grownIndex, peekArea } from './generate.ts';
import { groundAt } from './grounds.ts';
import { questLine } from './quests.ts';
import type { GameState } from './types.ts';

/** A rough age: "just now", "5 min ago", "2 h ago". */
function ago(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}

/** The notes left on a spot, newest first, or "" (mine, 2026-11-01). */
export function traceLine(state: GameState, spaceId: string, now: number): string {
  const notes = state.traces?.[spaceId] ?? [];
  if (!notes.length) return '';
  return `Notes here: ${notes.map((t) => `${t.name}: "${t.text}" (${ago(now - t.at)})`).join('; ')}.`;
}

/** A clock reading of ms left: "4:12". */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function hintFor(state: GameState, spaceId: string, player: string, now: number): string {
  const line = hintLine(state, spaceId, player, now);
  const notes = traceLine(state, spaceId, now);
  return notes ? `${line} ${notes}` : line;
}

function hintLine(state: GameState, spaceId: string, player: string, now: number): string {
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
      // The hunting ground: what mostly roams here and what it tends to drop.
      const ground = groundAt(state.board, space);
      const mobs = ground ? `${ground.name}: home of the ${creature(ground.mob, bestiary)?.name ?? ground.mob}, finds lean to ${ground.drops.join(' and ')}` : (area?.mobs ?? []).map((id) => creature(id, bestiary)?.name ?? id).join(', ');
      const prowl =
        spawn?.kind === 'worldboss' && spawn.enemy
          ? ` A world boss, ${creature(spawn.enemy, bestiary)?.name ?? spawn.enemy}, rages here: ${spawn.hp ?? '?'} of ${spawn.maxHp ?? '?'} HP left, gone in ${countdown(spawn.until - now)}. Everyone who lands here fights the same beast and shares the reward.`
          : spawn?.kind === 'wanderer' && spawn.enemy
            ? ` A Dread ${creature(spawn.enemy, bestiary)?.name ?? spawn.enemy}, level ${spawn.level ?? '?'}, walks here. Far too strong for this land, and rich if you can beat it.`
          : spawn?.kind === 'elite' && spawn.enemy
            ? ` An elite ${creature(spawn.enemy, bestiary)?.name ?? spawn.enemy} prowls here: hard, and worth it.`
            : spawn?.kind === 'miniboss' && spawn.enemy
            ? ` A ${creature(spawn.enemy, bestiary)?.name ?? spawn.enemy} prowls here!`
            : spawn?.kind === 'merchant'
              ? ' A wandering merchant has camped here.'
              : '';
      return `${where}, levels ${area?.levels[0]} to ${area?.levels[1]}: ${mobs}. Gold, xp, now and then ${rank} gear, and sometimes something else.${prowl}`;
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
    case 'gear': {
      const until = me?.cooldowns[spaceId] ?? 0;
      const wait = until > now ? ` Back in ${countdown(until - now)}.` : '';
      return `${where}: roll a 4 or better for ${space.kind === 'gear' ? 'a piece of basic gear' : 'a free potion'}. Try again after five minutes.${wait}`;
    }
    case 'spell':
      return `${where}: learn an ability of your class, or improve one you know.${again}`;
    case 'church':
      return `${where}: heals you fully and takes off poison and weakness. Always open, and free.`;
    case 'shop':
      return space.stock === 'magic' ? `${where}: robes, staves, mana potions and elixirs; it buys what you carry.` : `${where}: ${rank} and leather gear, health potions; it buys what you carry.`;
    case 'door': {
      const beyond = space.door ? state.board.spaces[space.door] : undefined;
      return area?.dungeon ? `${where}: the way back to daylight.` : `${where}: a way in, levels ${state.board.areas[beyond?.area ?? '']?.levels.join(' to ') ?? '?'}. Something waits at the far end.`;
    }
    case 'arena':
      return me && arenaOpen(me, now) ? `${where}: open today! Fights in a row, three ways to try them.` : `${where}: closed. Opens on ${nextDay('arena', now)}.`;
    case 'town':
      return `${where}: rest, HP and mana to full. ${townKind(space.id).line}`;
    case 'board': {
      const mine = me?.quests[0];
      return `${where}: walk onto or past it to pick a quest, one at a time. It pays the moment you finish it.${mine ? ` Yours: ${questLine(mine)}` : ''}`;
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
