// The quest board (Robin, 2026-11-02): "a board on each map with quests you could choose, one at a time. You walk to that
// board spot to choose quest"; "you would complete the quest when you finish it, for exp, gold and a chest". Four kinds: beat so
// many of a creature, hunt the area's mini-boss (a chance it turns up), loot trophies from a creature, find a person (a chance
// they turn up on their ground). Pure: quests are drawn from the stream.

import { ENEMIES, GEAR, QUESTS } from './data.ts';
import { dropSlot, groundsOf, rollLine } from './grounds.ts';
import { rollGear, rollSetPiece, rollUnique } from './gear.ts';
import { addLoot, gainXp, giveGold, nextGearId } from './common.ts';
import type { Rng } from './rng.ts';
import type { Action, Area, Character, GameEvent, GameState, Ground, Quest, Space } from './types.ts';

type Kind = Quest['kind'];
const KINDS = Object.keys(QUESTS.kinds) as Kind[];

/** The land a board's errands lie in: its own; a city's streets have no creatures, so its board sends you to the land that suits you (Robin, 2026-11-02: the hub). */
function errandLand(state: GameState, board: Space, c?: Character): Area | undefined {
  const own = state.board.areas[board.area];
  if (!own?.city) return own;
  const lands = (c?.opened ?? []).map((id) => state.board.areas[id]).filter((a): a is Area => !!a && !a.dungeon && !a.city && groundsOf(state.board, a.id).length > 0);
  const level = c?.level ?? 1;
  const fit = lands.filter((a) => a.levels[0] <= level).sort((a, b) => b.levels[1] - a.levels[1]);
  return fit[0] ?? lands[0];
}

/** The quest of a kind on this area's board, or null when the area cannot give it. */
function makeQuest(state: GameState, board: Space, kind: Kind, rng: Rng, c?: Character): Quest | null {
  const area = errandLand(state, board, c);
  if (!area) return null;
  const grounds = groundsOf(state.board, area.id);
  const data = QUESTS.kinds[kind];
  const name = (id: string): string => (ENEMIES[id] ?? state.board.bestiary?.[id])?.name ?? id;
  const ground: Ground | null = grounds.length ? grounds[rng.int(grounds.length) - 1]! : null;
  if (kind === 'mini' && !area.miniBosses.length) return null;
  if (kind !== 'mini' && !ground) return null;
  const [lo, hi] = data.count;
  const count = lo + rng.int(hi - lo + 1) - 1;
  let target: string;
  let trophy: string | undefined;
  if (kind === 'mini') target = area.miniBosses[rng.int(area.miniBosses.length) - 1]!;
  else if (kind === 'find') target = QUESTS.people[rng.int(QUESTS.people.length) - 1]!;
  else target = ground!.mob;
  if (kind === 'loot') trophy = ground!.trophy;
  const text = data.text
    .replace('{target}', kind === 'find' ? target : name(target))
    .replace('{count}', String(count))
    .replace('{trophy}', trophy ?? '')
    .replace('{ground}', ground?.name ?? area.name)
    .replace('{area}', area.name);
  return {
    id: `${board.id}:${kind}`,
    kind,
    town: board.id,
    area: area.id,
    ...(ground ? { ground: ground.id } : {}),
    target,
    ...(trophy ? { trophy } : {}),
    count,
    done: 0,
    gold: data.gold * area.tier * count,
    xp: data.xp * area.tier * count,
    unique: data.unique,
    text,
  };
}

/** What the board offers: one of each of up to three kinds, drawn without repeats. */
export function boardQuests(state: GameState, board: Space, rng: Rng, c?: Character): Quest[] {
  const left = [...KINDS];
  const out: Quest[] = [];
  while (left.length && out.length < QUESTS.offered) {
    const total = left.reduce((sum, k) => sum + QUESTS.kinds[k].weight, 0);
    let pick = rng.next() * total;
    let index = left.length - 1;
    for (let i = 0; i < left.length; i++) {
      pick -= QUESTS.kinds[left[i]!].weight;
      if (pick < 0) {
        index = i;
        break;
      }
    }
    const quest = makeQuest(state, board, left.splice(index, 1)[0]!, rng, c);
    if (quest) out.push(quest);
  }
  return out;
}

/** A creature beaten: the quest it moves along moves, with an event. A loot quest needs the trophy to drop. */
export function questProgress(c: Character, what: { beat: string }, rng: Rng, action: Action, events: GameEvent[]): Character {
  const quests = c.quests.map((q) => {
    if (q.done >= q.count || q.target !== what.beat || q.kind === 'find') return q;
    if (q.kind === 'loot' && rng.next() >= QUESTS.kinds.loot.dropChance!) return q;
    const next = { ...q, done: q.done + 1 };
    events.push({ type: 'questProgress', action: action.id, player: action.player, quest: next });
    return next;
  });
  return { ...c, quests };
}

/** The person of a find quest met. */
export function questFound(c: Character, q: Quest, action: Action, events: GameEvent[]): Character {
  const next = { ...q, done: q.count };
  events.push({ type: 'personFound', action: action.id, player: action.player, person: q.target ?? '', quest: next });
  return { ...c, quests: c.quests.map((x) => (x === q ? next : x)) };
}

/**
 * A quest finished pays at once, wherever you stand: its xp, its gold and a chest, which always holds a piece better than
 * common, maybe a unique. The caller tells of any level's points afterwards.
 */
export function finishQuests(state: GameState, c: Character, action: Action, rng: Rng, events: GameEvent[]): { state: GameState; c: Character } {
  let s = state;
  let next = c;
  for (const q of c.quests) {
    if (q.done < q.count) continue;
    events.push({ type: 'questDone', action: action.id, player: action.player, quest: q });
    next = { ...next, quests: next.quests.filter((x) => x.id !== q.id), questsDone: [...(next.questsDone ?? []), q].slice(-QUESTS.remembered) };
    next = giveGold(next, q.gold, action, events);
    next = gainXp(next, q.xp, action, events);
    const tier = s.board.areas[q.area]?.tier ?? 1;
    const got = nextGearId(s);
    s = got.state;
    const unique = q.unique > 0 && rng.next() < q.unique ? rollUnique(got.id, tier, tier, rng) : null;
    const setPiece = !unique && rng.next() < GEAR.setChance.chest ? rollSetPiece(got.id, tier, tier, rng, c.classId) : null;
    const ground = groundsOf(s.board, q.area).find((g) => g.id === q.ground) ?? null;
    next = addLoot(next, unique ?? setPiece ?? rollGear(got.id, dropSlot(ground, rng), tier, QUESTS.chestBoost, rng, rollLine(rng), c.classId), action, events);
  }
  return { state: s, c: next };
}

/** One line on how a quest stands, for the hints and the message line. */
export function questLine(q: Quest): string {
  return `${q.text} ${q.kind === 'find' || q.kind === 'mini' ? 'Keep looking.' : `${q.done} of ${q.count}.`}`;
}
