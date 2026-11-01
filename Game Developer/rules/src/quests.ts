// The towns' errands (mine, 2026-11-01, from Robin's list: quests in towns give direction between bosses). A town offers
// one errand at a time to a character who stands in it with none from that town: thin a creature of the area, open
// chests in it, hunt its mini-boss, or bring down its boss. Progress is counted where it happens; the town pays when
// the character is back. Pure: the errand is drawn from the stream.

import { ENEMIES, QUESTS } from './data.ts';
import type { Rng } from './rng.ts';
import type { Action, Character, GameEvent, GameState, Quest, Space } from './types.ts';

/** The errand the town would give, or null when the area has nothing to ask for. */
export function newQuest(state: GameState, c: Character, town: Space, rng: Rng): Quest | null {
  const area = state.board.areas[town.area];
  if (!area) return null;
  const name = (id: string): string => (ENEMIES[id] ?? state.board.bestiary[id])?.name ?? id;
  const kinds = Object.entries(QUESTS.kinds) as [Quest['kind'], (typeof QUESTS.kinds)[keyof typeof QUESTS.kinds]][];
  const total = kinds.reduce((sum, [, k]) => sum + k.weight, 0);
  let pick = rng.next() * total;
  let kind: Quest['kind'] = 'cull';
  for (const [k, data] of kinds) {
    pick -= data.weight;
    if (pick < 0) {
      kind = k;
      break;
    }
  }
  const gate = Object.values(state.board.spaces).find((s) => s.area === area.id && s.kind === 'boss' && s.boss);
  // A kind the area cannot give falls back to culling its creatures.
  if (kind === 'hunt' && !area.miniBosses.length) kind = 'cull';
  if (kind === 'boss' && !gate) kind = 'cull';
  if (kind === 'cull' && !area.mobs.length) return null;
  const data = QUESTS.kinds[kind];
  const target = kind === 'cull' ? area.mobs[rng.int(area.mobs.length) - 1]! : kind === 'hunt' ? area.miniBosses[rng.int(area.miniBosses.length) - 1]! : kind === 'boss' ? gate!.boss! : null;
  const [lo, hi] = data.count;
  const count = lo + rng.int(hi - lo + 1) - 1;
  const text = data.text
    .replace('{target}', target ? name(target) + (kind === 'cull' ? 's' : '') : '')
    .replace('{count}', String(count))
    .replace('{area}', area.name);
  return { id: town.id, kind, town: town.id, area: area.id, target, count, done: 0, gold: data.gold * area.tier * count, xp: data.xp * area.tier * count, unique: data.unique, text };
}

/** A creature beaten, or a chest opened in an area: every errand it moves along moves, with an event each. */
export function questProgress(c: Character, what: { beat: string } | { chest: string }, action: Action, events: GameEvent[]): Character {
  let changed = false;
  const quests = c.quests.map((q) => {
    if (q.done >= q.count) return q;
    const hit = 'beat' in what ? q.target === what.beat : q.kind === 'chests' && q.area === what.chest;
    if (!hit) return q;
    changed = true;
    const next = { ...q, done: q.done + 1 };
    events.push({ type: 'questProgress', action: action.id, player: action.player, quest: next });
    return next;
  });
  return changed ? { ...c, quests } : c;
}

/** One line on how an errand stands, for the hints and the message line. */
export function questLine(q: Quest): string {
  return `${q.text} ${q.done >= q.count ? 'Done: back to town for the reward.' : `${q.done} of ${q.count}.`}`;
}
