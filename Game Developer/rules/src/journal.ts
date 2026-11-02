// The journal (Robin, 2026-11-02: yes): each creature beaten and each place found, written down, with a small reward the first time, and a
// skill point for a region's page filled. The numbers are mine.

import { creature } from './fight.ts';
import { giveGold, gainXp } from './common.ts';
import { placeAt, placeName } from './grounds.ts';
import type { Action, Board, Character, GameEvent } from './types.ts';

const FIRST_BEAT_XP = 8;
const FIRST_PLACE_GOLD = 2;

/** What a region's page holds: its creatures, mini-bosses and boss. */
export function regionCreatures(board: Board, areaId: string): string[] {
  const area = board.areas[areaId];
  if (!area) return [];
  const boss = Object.values(board.spaces).find((s) => s.area === areaId && s.kind === 'boss')?.boss;
  return [...area.mobs, ...area.miniBosses, ...(boss ? [boss] : [])];
}

export function noteBeaten(c: Character, enemy: string, board: Board, areaId: string | undefined, action: Action, events: GameEvent[]): Character {
  const journal = c.journal ?? { beaten: {}, places: [], done: [] };
  const count = journal.beaten[enemy] ?? 0;
  let next: Character = { ...c, journal: { ...journal, beaten: { ...journal.beaten, [enemy]: count + 1 } } };
  if (count > 0) return next;
  const tier = (areaId ? board.areas[areaId]?.tier : 1) ?? 1;
  const name = creature(enemy, board.bestiary)?.name ?? enemy;
  events.push({ type: 'journal', action: action.id, player: action.player, text: `New in your journal: ${name}.` });
  next = gainXp(next, FIRST_BEAT_XP * tier, action, events);
  if (areaId && !journal.done.includes(areaId) && regionCreatures(board, areaId).every((id) => next.journal.beaten[id])) {
    next = { ...next, bonusPoints: (next.bonusPoints ?? 0) + 1, journal: { ...next.journal, done: [...next.journal.done, areaId] } };
    events.push({ type: 'journal', action: action.id, player: action.player, text: `${board.areas[areaId]?.name}'s page is full: a skill point.` });
    events.push({ type: 'skillPoints', action: action.id, player: action.player, gained: 1, free: 0 });
  }
  return next;
}

/** A place stood in for the first time: a hunting ground, a town's walls, a named spot. */
export function notePlace(c: Character, board: Board, action: Action, events: GameEvent[]): Character {
  const space = board.spaces[c.space];
  if (!space) return c;
  const key = placeAt(board, space) ?? (space.name ? space.id : null);
  const journal = c.journal ?? { beaten: {}, places: [], done: [] };
  if (!key || journal.places.includes(key)) return c;
  const tier = board.areas[space.area]?.tier ?? 1;
  const next: Character = { ...c, journal: { ...journal, places: [...journal.places, key] } };
  events.push({ type: 'journal', action: action.id, player: action.player, text: `Found: ${placeName(board, space) ?? space.name ?? 'a new place'}.` });
  return giveGold(next, FIRST_PLACE_GOLD * tier, action, events);
}
