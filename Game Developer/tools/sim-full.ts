// The whole game, played to level 30 with the real rules (Robin, 2026-11-02: "Level up each class naturally all the way to 30. Try different specs and talents.
// Try fighting with different tactics. Kill all the bosses. Do quests, buy stuff etc etc. Try everything and see what needs fixing. Tune the balance after every playthrough").
// Each build plays one character: its trees, its tactic, every boss in level order, the quest boards, the shops and the smith's fine piece, the Arena on its days, the
// Rootways, rumours and hidden places, the coach, Home, a respec at 15. Every step is checked for broken state; every refused action is counted. Times are estimates from
// the seconds below, not measurements. Not part of the game.
//   node tools/sim-full.ts [runs a build] [class] [--tactics] [--json file]

import { writeFileSync } from 'node:fs';
import { ABILITIES, manaCost, apply, arenaFee, arenaOpen, arenaSpot, arenaTried, bossKnown, canLearn, groundsOf, carriedLimit, CLASS_DATA, dailyPiece, canReforge, reforged, ENEMIES, hubOf, ITEMS, makeRng, newGame, plainGear, pointsFree, reachable, shopOffer, SLOTS, stats, travelOptions, walkable, type Character, type ClassId, type GameEvent, type GameState, type GearItem, type GearLine, guardOf, PROGRESSION, holdsFor, gearKind, isNight, twoHanded, RARITIES } from '../rules/src/index.ts';
import { choose } from './sim-player.ts';

const args = process.argv.slice(2);
const RUNS = Number(args[0]) || 1;
const ONLY = args.find((a) => CLASSES_HAS(a));
// NIGHT=off: no stronger night, to measure what the night costs.
if (process.env.NIGHT === 'off') Object.assign(PROGRESSION.dayNight, { enemyMult: 1, rewardMult: 1 });
const TACTICS_TOO = args.includes('--tactics');
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const TO = args.includes('--to') ? Number(args[args.indexOf('--to') + 1]) : 30;
function CLASSES_HAS(a: string): boolean {
  return Object.keys(CLASS_DATA).includes(a);
}
const P = 'p';
const SEC = { roll: 7, round: 4, offer: 3, shop: 12, door: 2, stroll: 4 };
const LIMIT_HOURS = 40;
/** Seconds of play a day: then the clock jumps to the same time tomorrow. */
const SESSION = 5400;
const LINE: Record<string, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' };

export type Tactic = 'sensible' | 'brawler' | 'careful' | 'basic';
interface Build {
  classId: ClassId;
  main: string;
  second: string | null;
  tactic: Tactic;
}
interface BossLog {
  id: string;
  name: string;
  bossLevel: number;
  level: number;
  tries: number;
  deaths: number;
  rounds: number;
  flasks: number;
  minutes: number;
}
interface Band {
  fights: number;
  rounds: number;
  lost: number;
  deaths: number;
  seconds: number;
}
const bandOf = (level: number): string => (level <= 10 ? '1-10' : level <= 20 ? '11-20' : '21-30');
interface Result {
  build: Build;
  seed: string;
  level: number;
  hours: number;
  reached: Record<number, number>;
  bosses: BossLog[];
  bossesLeft: string[];
  bands: Record<string, Band>;
  deaths: number;
  fights: number;
  questsDone: number;
  questsTaken: number;
  arena: { runs: number; waves: number; wins: number };
  rumours: number;
  secrets: number;
  bought: number;
  fine: number;
  reforged: number;
  sold: number;
  travels: number;
  homes: number;
  gold: number;
  flasksEnd: number;
  flasksFound: number;
  goldEarned: number;
  stuck: string | null;
  used: Record<string, number>;
  learned: string[];
  gearRank: number;
  /** What was worn at the end, slot by slot: kind and rank (2026-11-03). */
  wornAtEnd?: string;
  bagAtEnd?: number;
  /** ENDSTATE=1: the character as it ended, for tools/sim-arena-end.ts (2026-11-03). */
  endState?: Character;
  rarities: Record<string, number>;
  landSeconds: Record<string, number>;
}

// Across all runs.
const refused = new Map<string, number>();
const broken = new Map<string, number>();
const thrown = new Map<string, number>();
const note = (map: Map<string, number>, key: string): void => void map.set(key, (map.get(key) ?? 0) + 1);
const wants = new Map<string, number>();
const loot = { sets: 0, uniques: 0, runs: 0, wornSets: 0, wornUniques: 0 };
const killers = new Map<string, number>();
const questTimes = new Map<string, number[]>();
let questsDropped = 0;
const samples = new Map<string, string>();
const goldFrom = new Map<string, number>();
const goldTo = new Map<string, number>();
let lastAction = '';

function check(state: GameState, where: string): void {
  const c = state.characters[P]!;
  const s = stats(c);
  const bad = (what: string): void => {
    const key = `${what} (${where})`;
    note(broken, key);
    if (!samples.has(key)) samples.set(key, `L${c.level} ${c.classId} hp ${c.hp}/${s.maxHp} mana ${c.mana}/${s.maxMana} at ${c.space}, elixirs ${JSON.stringify(c.elixirs ?? {})}, last ${lastAction}`);
  };
  for (const key of ['hp', 'mana', 'gold', 'xp', 'level', 'steps'] as const) {
    const v = c[key] as number;
    if (typeof v !== 'number' || !Number.isFinite(v)) bad(`${key} is ${v}`);
    else if (v < 0) bad(`${key} below zero`);
  }
  for (const key of ['maxHp', 'maxMana', 'attack', 'defense'] as const) if (!Number.isFinite(s[key])) bad(`stat ${key} is ${s[key]}`);
  if (c.hp > s.maxHp + 0.5) bad('hp over max');
  if (c.mana > s.maxMana + 0.5) bad('mana over max');
  if (!state.board.spaces[c.space]) bad('stands on no spot');
  if (pointsFree(c) < 0) bad('points below zero');
  if (c.carried.length > carriedLimit(c.level)) bad('carries too many');
  for (const id of c.carried) {
    if (!c.abilities[id]) bad(`carries ${id}, not learned`);
    if (ABILITIES[id]?.rule) bad(`carries a passive, ${id}`);
  }
  for (const [id, rank] of Object.entries(c.abilities)) if (rank > (ABILITIES[id]?.ranks.length ?? 0)) bad(`${id} over its top rank`);
  for (const [id, n] of Object.entries(c.items)) if (n < 0) bad(`${id} below zero`);
  if (c.fight) {
    const e = c.fight.enemy;
    if (!Number.isFinite(e.hp) || !Number.isFinite(e.attack)) bad(`enemy ${e.id} has a broken number`);
    if (c.fight.meter < 0) bad('meter below zero');
  }
}

const score = (c: Character): number => {
  const s = stats(c);
  const might = c.classId === 'mage' ? (s.magic ?? 0) * 2.5 + s.attack * 0.5 : s.attack * 2;
  // Uniques and sets do more than their numbers say; about this much (mine).
  const worn = Object.values(c.equipment) as (GearItem | null)[];
  const special = 1 + worn.reduce((sum, g) => sum + (g?.unique ? 0.06 : 0) + (g?.set ? 0.04 : 0), 0);
  // NOGREAT=1: never a great weapon, to measure what it costs (2026-11-03).
  if (process.env.NOGREAT && gearKind(c.equipment.weapon) === 'great') return -1e9;
  // A great weapon is the Berserker's way (Robin, 2026-11-03): a player of another tree keeps the shield.
  if (gearKind(c.equipment.weapon) === 'great' && !c.abilities.reckless) return -1e9;
  // What the hands give the guards counts too: a shield is worth wearing (2026-11-03).
  const g = guardOf(c);
  // The skills it carries that the hands allow: a player keeps the weapon its tree wants.
  const allowed = c.carried.filter((id) => holdsFor(c, ABILITIES[id]?.needs)).length;
  // A trinket is worth its land and its rarity: a player wears the better one (2026-11-03).
  const trinket = c.equipment.trinket;
  const charm = trinket?.trinket ? 1 + 0.02 * trinket.rank + 0.03 * RARITIES.indexOf(trinket.rarity) : 1;
  return (might * special + s.defense * 2 + s.maxHp * 0.25 * (1 + g.block * 0.8 + g.dodge * 0.5)) * (1 + 0.15 * allowed) * charm;
};
// As the rules allow it: no off-hand beside a two-hander, and a two-hander puts the off-hand away (2026-11-03).
const wearing = (c: Character, g: GearItem): Character => {
  if (g.slot === 'shield' && twoHanded(c.equipment.weapon)) return { ...c, equipment: { ...c.equipment, shield: null }, carried: [] };
  return { ...c, equipment: { ...c.equipment, [g.slot]: g, ...(twoHanded(g) ? { shield: null } : {}) } };
};

const tried = new Set<string>();

/** What this tactic does this round. */
function tacticMove(c: Character, tactic: Tactic): { move: unknown; guard: string } {
  if (c.fight!.round <= 1) tried.clear();
  const f = c.fight!;
  const s = stats(c);
  const share = c.hp / s.maxHp;
  const hurts = (id: string): boolean => !!ABILITIES[id]!.ranks[0]!.selfHurt;
  const plan = choose(share < 0.35 ? { ...c, carried: c.carried.filter((id) => !hurts(id)) } : c);
  const flask = Object.entries(c.items).find(([id, n]) => n > 0 && ITEMS[id]?.heal);
  if (tactic === 'sensible') {
    // A talent it has never pressed this fight, while safe: the fall-through for abilities `choose` has no line for.
    const fresh = c.carried.find((id) => {
      const a = ABILITIES[id]!;
      return !tried.has(id) && !f.used.includes(id) && !a.oncePerFight && !hurts(id) && !a.ranks[0]!.flee && holdsFor(c, a.needs) && c.mana >= manaCost(c, id) && !(a.meter && f.meter < a.meter) && !(a.meterAll && f.meter < 3);
    });
    const big = c.carried.find((id) => {
      const a = ABILITIES[id]!;
      return a.oncePerFight && !a.ranks[0]!.flee && !f.used.includes(id) && holdsFor(c, a.needs) && c.mana >= manaCost(c, id) && !(a.meter && f.meter < a.meter) && !(a.meterAll && f.meter < 3);
    });
    if (big && (share < 0.6 || f.enemy.role !== 'mob')) return { move: { kind: 'ability', ability: big }, guard: plan.guard };
    if (fresh && share > 0.6 && (plan.move as { kind: string }).kind === 'attack') {
      tried.add(fresh);
      return { move: { kind: 'ability', ability: fresh }, guard: plan.guard };
    }
    return plan;
  }
  if (tactic === 'basic') {
    // Never opens Abilities: Attack, block, a flask when low.
    if (share < 0.35 && flask) return { move: { kind: 'item', item: flask[0] }, guard: 'block' };
    return { move: { kind: 'attack' }, guard: 'block' };
  }
  if (tactic === 'brawler') {
    // All in: no guard, the hardest hit, a flask only at the edge.
    if (share < 0.2 && flask) return { move: { kind: 'item', item: flask[0] }, guard: 'none' };
    const mv = plan.move as { kind: string; ability?: string };
    return { move: mv.kind === 'item' ? { kind: 'attack' } : mv, guard: 'none' };
  }
  // Careful: guards everything, drinks early.
  if (share < 0.55 && flask) return { move: { kind: 'item', item: flask[0] }, guard: 'block' };
  return { move: plan.move, guard: 'block' };
}

function play(build: Build, seed: string): Result {
  const { classId, main, second, tactic } = build;
  const rng = makeRng(seed);
  let state: GameState = newGame({ seed, player: P, name: 'Sim', classId });
  const start = Date.UTC(2026, 10, 2, 12);
  let clock = start;
  let played = 0;
  let lastTick = clock;
  let n = 0;
  const r: Result = {
    build, seed, level: 1, hours: 0, reached: { 1: 0 }, bosses: [], bossesLeft: [], bands: {}, deaths: 0, fights: 0, questsDone: 0, questsTaken: 0, arena: { runs: 0, waves: 0, wins: 0 }, rumours: 0, secrets: 0,
    bought: 0, fine: 0, reforged: 0, sold: 0, travels: 0, homes: 0, gold: 0, flasksEnd: 0, flasksFound: 0, goldEarned: 0, stuck: null, used: {}, learned: [], gearRank: 0, rarities: {}, landSeconds: {},
  };
  const me = (): Character => state.characters[P]!;
  const spaces = (): GameState['board']['spaces'] => state.board.spaces;
  const areaOf = (id: string): string => spaces()[id]?.area ?? '';
  const act = (a: Record<string, unknown>): GameEvent[] => {
    n += 1;
    let res;
    try {
      res = apply(state, { ...a, id: `a${n}`, player: P } as never, rng, clock);
    } catch (err) {
      note(thrown, `${a.type}: ${(err as Error).message}`);
      return [{ type: 'rejected', action: `a${n}`, player: P, reason: 'threw' } as never];
    }
    state = res.state;
    for (const e of res.events) {
      if (e.type === 'rejected') {
        const key = `${a.type}${a.op ? `/${a.op}` : ''}: ${(e as unknown as { reason: string }).reason}`;
        note(refused, key);
        if (!samples.has(key)) samples.set(key, `${JSON.stringify(a).slice(0, 110)} at ${me().space} (${spaces()[me().space]?.kind}) L${me().level} ${classId}`);
      }
      if (e.type === 'gold' && (e as unknown as { delta: number }).delta > 0) r.goldEarned += (e as unknown as { delta: number }).delta;
      if (e.type === 'gold') {
        const d = (e as unknown as { delta: number }).delta;
        const m = d > 0 ? goldFrom : goldTo;
        m.set(String(a.type), (m.get(String(a.type)) ?? 0) + Math.abs(d));
      }
      if (e.type === 'sold') goldFrom.set('sold', (goldFrom.get('sold') ?? 0) + ((e as unknown as { price?: number }).price ?? 0));
      if (e.type === 'bought') goldTo.set('bought', (goldTo.get('bought') ?? 0) + ((e as unknown as { price?: number }).price ?? 0));
      if (e.type === 'rumourDone') r.rumours += 1;
      if (e.type === 'loot') {
        const g = (e as unknown as { gear: GearItem }).gear;
        if (g.set) loot.sets += 1;
        if (g.unique) loot.uniques += 1;
      }
      if (e.type === 'found' && ITEMS[(e as unknown as { item: string }).item]?.heal) r.flasksFound += (e as unknown as { count: number }).count;
      if (e.type === 'secretFound') r.secrets += 1;
      if (e.type === 'questTaken') r.questsTaken += 1;
      if (e.type === 'questDone') {
        r.questsDone += 1;
        const q = (e as unknown as { quest: { kind: string } }).quest;
        (questTimes.get(q.kind) ?? questTimes.set(q.kind, []).get(q.kind)!).push((played - questSincePlayed) / 60);
      }
      if (e.type === 'questDeclined') questsDropped += 1;
    }
    lastAction = JSON.stringify(a).slice(0, 90);
    check(state, String(a.type));
    return res.events;
  };
  let wanted = 'start';
  const spend = (seconds: number): void => {
    wants.set(wanted, (wants.get(wanted) ?? 0) + seconds);
    clock += seconds * 1000;
    if (Math.floor((played + seconds) / SESSION) !== Math.floor(played / SESSION)) clock += 24 * 3600_000 - SESSION * 1000;
    played += seconds;
    const c = me();
    const land = areaOf(c.space);
    r.landSeconds[land] = (r.landSeconds[land] ?? 0) + seconds;
    (r.bands[bandOf(c.level)] ??= { fights: 0, rounds: 0, lost: 0, deaths: 0, seconds: 0 }).seconds += seconds;
    if (clock - lastTick > 60_000) {
      lastTick = clock;
      try {
        state = apply(state, { type: 'tick', id: `t${n++}`, player: 'world' } as never, rng, clock).state;
      } catch (err) {
        note(thrown, `tick: ${(err as Error).message}`);
      }
    }
  };

  const cls = CLASS_DATA[classId]!;
  const treeNodes = (t: string): string[] => cls.trees[t]!.nodes;
  let respecced = false;

  const housekeeping = (): void => {
    let learnedAny = 0;
    for (let guard = 0; guard < 40 && pointsFree(me()) > 0; guard++) {
      const c = me();
      const spent = Object.entries(c.abilities).filter(([id]) => treeNodes(main).includes(id)).reduce((sum, [, rank]) => sum + rank, 0);
      const wantSecond = second && spent % 4 === 3 ? treeNodes(second) : [];
      const order = [...wantSecond, ...treeNodes(main), ...(second ? treeNodes(second) : []), ...cls.core, ...Object.keys(c.abilities), ...Object.values(cls.trees).flatMap((t) => t.nodes)];
      const pick = order.find((id) => canLearn(c, id) && !c.abilities[id]) ?? order.find((id) => canLearn(c, id));
      if (!pick) break;
      act({ type: 'skill', op: 'learn', ability: pick });
      learnedAny += 1;
    }
    // Carried: the newest actives down its trees first.
    if (learnedAny) {
      const c = me();
      const known = (t: string): string[] => treeNodes(t).filter((id) => c.abilities[id] && !ABILITIES[id]!.rule).reverse();
      const want = [...new Set([...known(main), ...(second ? known(second) : []), ...cls.core.filter((id) => c.abilities[id])])].slice(0, carriedLimit(c.level));
      // One slot for the best situational skill known, so the sims press them too (2026-11-03): a sensible player keeps one.
      const situational = (id: string): boolean => {
        const r = ABILITIES[id]!.ranks[0]!;
        return !!(r.evade || r.skip || r.windupBonus || r.executeBelow || r.missingPower || r.healedPower || r.spellUp || r.mark || r.barrierShare);
      };
      const spare = Object.keys(c.abilities).filter((id) => situational(id) && !ABILITIES[id]!.rule).sort((a, b) => ABILITIES[b]!.level - ABILITIES[a]!.level)[0];
      if (spare && want.length >= 3 && !want.some(situational)) want[want.length - 1] = spare;
      for (const id of [...c.carried]) if (!want.includes(id)) act({ type: 'skill', op: 'carry', ability: id });
      for (const id of want) if (!me().carried.includes(id)) act({ type: 'skill', op: 'carry', ability: id });
    }
    for (const g of [...me().bag]) {
      // A sensible Hunter keeps its bow: the Ranger's arrows need one (2026-11-03).
      if (classId === 'ranger' && g.slot === 'weapon' && g.rarity !== 'unique' && gearKind(g) !== 'bow') continue;
      if (score(wearing(me(), g)) > score(me()) + 0.5) act({ type: 'equip', gear: g.id });
    }
  };

  const shopping = (): void => {
    const c0 = me();
    const offer = shopOffer(state, c0);
    if (!offer) return;
    spend(SEC.shop);
    for (const g of [...c0.bag]) {
      if (score(wearing(me(), g)) <= score(me())) {
        act({ type: 'sell', gear: g.id });
        r.sold += 1;
      }
    }
    const line = offer.lines.includes(LINE[classId]!) ? LINE[classId]! : offer.lines[0];
    if (line) {
      for (const slot of SLOTS) {
        const c = me();
        const piece = plainGear('x', slot, offer.tier, line, classId);
        if (piece.price <= c.gold * 0.7 && score(wearing(c, piece)) > score(c) + 1) {
          if (!act({ type: 'buy', slot, line }).some((e) => e.type === 'rejected')) r.bought += 1;
        }
      }
    }
    const fine = dailyPiece(state, me(), clock);
    if (fine && fine.price * 2 <= me().gold * 0.6 && score(wearing(me(), fine)) > score(me()) + 1) {
      if (!act({ type: 'buy', daily: true }).some((e) => e.type === 'rejected')) r.fine += 1;
    }
    // At a master smith, the best of what it wears one rank up while gold is plenty (2026-11-03): a sensible player keeps a piece it loves.
    if (offer.town?.rank) {
      for (const slot of SLOTS) {
        const g = me().equipment[slot];
        if (!canReforge(g, offer.tier)) continue;
        if (reforged(g).price <= me().gold * 0.4 && !act({ type: 'buy', reforge: g.id }).some((e) => e.type === 'rejected')) r.reforged += 1;
      }
    }
    // The best flask it can afford.
    const best = (key: 'heal' | 'mana'): string | undefined => {
      const list = offer.items.filter((id) => ITEMS[id]![key]).sort((a, b) => (ITEMS[b]![key] ?? 0) - (ITEMS[a]![key] ?? 0));
      return list.find((id) => offer.price(id) <= me().gold * 0.5) ?? list[0];
    };
    for (const [id, want] of [[best('heal'), tactic === 'careful' ? 6 : 4], [best('mana'), 2]] as const) {
      if (!id) continue;
      for (let i = 0; i < 8; i++) {
        const c = me();
        if ((c.items[id] ?? 0) >= want || offer.price(id) > c.gold * 0.5) break;
        act({ type: 'buy', item: id });
        r.bought += 1;
      }
    }
    housekeeping();
  };

  const flasks = (c: Character): number => Object.entries(c.items).filter(([id]) => ITEMS[id]?.heal).reduce((sum, [, k]) => sum + k, 0);
  const enemyLevelOf = (id: string): number => state.board.bestiary[id]?.level ?? ENEMIES[id]?.level ?? 99;
  const allBosses = (): { id: string; boss: string; level: number; area: string }[] =>
    Object.values(spaces()).filter((s) => s.kind === 'boss' && s.boss).map((s) => ({ id: s.id, boss: s.boss!, level: enemyLevelOf(s.boss!), area: s.area })).sort((a, b) => a.level - b.level);
  const log = new Map<string, BossLog>();
  const failed: Record<string, number> = {};
  let shopWait = 0;
  let boardWait = 0;
  let flaskWait = 0;
  let questSince = 0;
  let traced = -9999;
  let questSincePlayed = 0;
  let fightStart = { hp: 0, flasks: 0, rounds: 0 };

  const questHub = (q: Character['quests'][number]): string | undefined => groundsOf(state.board, q.area).find((g) => g.id === q.ground)?.hub;

  const landToHunt = (c: Character): string => {
    const lands = c.opened.filter((id) => state.board.areas[id] && !state.board.areas[id]!.dungeon && !state.board.areas[id]!.city);
    const fit = lands.filter((id) => state.board.areas[id]!.levels[0] <= c.level).sort((a, b) => state.board.areas[b]!.levels[1] - state.board.areas[a]!.levels[1]);
    return fit[0] ?? lands[0] ?? 'meadows';
  };

  for (let step = 0; step < 600_000; step++) {
    const c = me();
    if (c.level > r.level) {
      for (let l = r.level + 1; l <= c.level; l++) r.reached[l] = played / 3600;
      r.level = c.level;
    }
    if (c.level >= TO && allBosses().every((b) => (c.bossKills[b.id] ?? 0) > 0)) break;
    if (played > LIMIT_HOURS * 3600) {
      r.stuck = `still going after ${LIMIT_HOURS} hours, at level ${c.level}`;
      break;
    }
    if (c.fight) {
      const e0 = c.fight.enemy;
      if (c.fight.round <= 1) fightStart = { hp: c.hp, flasks: flasks(c), rounds: 0 };
      if (fightStart.rounds > 120) {
        const key = `a fight past 120 rounds: ${classId} ${main}${second ? `+${second}` : ''} v ${e0.name}`;
        note(broken, key);
        if (!samples.has(key)) samples.set(key, `L${c.level} hp ${c.hp}/${stats(c).maxHp} mana ${c.mana} atk ${stats(c).attack} magic ${stats(c).magic} crit ${stats(c).crit}; enemy hp ${e0.hp}/${e0.maxHp} def ${e0.defense} level ${e0.level}; carried ${c.carried.join()}; last ${lastAction}; items ${JSON.stringify(c.items)}`);
        act({ type: 'fight', move: { kind: 'flee' }, guard: 'none' });
        spend(SEC.round);
        if (fightStart.rounds > 400) fightStart.rounds = 0;
        continue;
      }
      const { move, guard } = tacticMove(c, tactic);
      const mv = move as { kind: string; ability?: string };
      let events = act({ type: 'fight', move, guard });
      if (events.some((e) => e.type === 'rejected')) events = act({ type: 'fight', move: { kind: 'attack' }, guard: 'block' });
      else if (mv.kind === 'ability' && mv.ability) r.used[mv.ability] = (r.used[mv.ability] ?? 0) + 1;
      fightStart.rounds += 1;
      spend(SEC.round);
      const band = (r.bands[bandOf(c.level)] ??= { fights: 0, rounds: 0, lost: 0, deaths: 0, seconds: 0 });
      band.rounds += 1;
      const ended = events.find((e) => e.type === 'won' || e.type === 'died' || e.type === 'fled');
      if (ended) {
        band.fights += 1;
        band.lost += Math.max(0, fightStart.hp - me().hp) / stats(c).maxHp;
        if (ended.type === 'won') r.fights += 1;
        if (ended.type === 'died') {
          r.deaths += 1;
          band.deaths += 1;
          note(killers, `${classId}/${main}${second ? `+${second}` : ''} L${c.level} by ${e0.name} L${e0.level}${e0.wanderer ? ' (Dread)' : ''}`);
        }
        const spot = c.fight.space;
        if (spaces()[spot]?.kind === 'boss' && spaces()[spot]?.boss === e0.id) {
          const b = log.get(spot) ?? { id: spot, name: e0.name, bossLevel: e0.level, level: 0, tries: 0, deaths: 0, rounds: 0, flasks: 0, minutes: 0 };
          if (!b.level) b.tries += 1;
          if (ended.type === 'died') {
            b.deaths += 1;
            failed[spot] = (failed[spot] ?? 0) + 1;
          }
          if (ended.type === 'won' && !b.level) {
            b.level = c.level;
            b.rounds = fightStart.rounds;
            b.flasks = fightStart.flasks - flasks(me());
            b.minutes = played / 60;
          }
          log.set(spot, b);
        }
      }
      continue;
    }
    if (c.offer) {
      spend(SEC.offer);
      const o = c.offer;
      if (o.kind === 'gamble') act({ type: 'gamble', choice: tactic === 'brawler' && c.gold > o.stake * 2 ? 'high' : 'pass' });
      else if (o.kind === 'board') {
        // An errand that has dragged on is dropped; otherwise the first on the board, if the land still suits.
        const old = c.quests[0] && played - questSincePlayed > 2400;
        const take = o.quests.length > 0 && !c.quests.length;
        if (take) {
          questSince = clock;
          questSincePlayed = played;
        }
        act({ type: 'quest', accept: take, index: 0, drop: !!old });
      } else if (o.kind === 'roll') act({ type: 'try' });
      else if (o.kind === 'loot') act({ type: 'keep', choice: 'sell' });
      else if (o.kind === 'arena') {
        const safe = c.hp >= stats(c).maxHp * (tactic === 'careful' ? 0.7 : 0.45);
        r.arena.waves += 1;
        const last = o.wave >= o.total;
        if (last) r.arena.wins += 1;
        act({ type: 'arena', op: safe && !last ? 'next' : 'take' });
      } else act({ type: 'keep', choice: 'sell' });
      if (me().offer === c.offer) {
        r.stuck = `an offer of ${o.kind} would not clear`;
        break;
      }
      continue;
    }
    housekeeping();
    const here0 = spaces()[me().space]!;
    // A respec, once, at 15: every point back and spent again.
    if (!respecced && me().level >= 15 && (here0.kind === 'town' || here0.kind === 'church') && me().steps === 0) {
      respecced = true;
      act({ type: 'skill', op: 'reset' });
      housekeeping();
    }
    const c1 = me();
    const s1 = stats(c1);
    const bosses = allBosses();
    const undone = bosses.filter((b) => !(c1.bossKills[b.id] ?? 0));
    // The next boss worth trying: its land open, near its level, more levels after each fall.
    const next = undone.find((b) => c1.opened.includes(b.area) || state.board.areas[b.area]?.dungeon);
    const readyFor = (b: { id: string; level: number }): boolean => c1.level >= Math.min(TO, b.level - 1 + (failed[b.id] ?? 0)) && c1.hp >= s1.maxHp * 0.7 && flasks(c1) >= 2 && (c1.cooldowns[b.id] ?? 0) <= clock;
    // A sensible player sleeps through the night in a town (2026-11-03).
    if (c1.steps === 0 && isNight(c1) && state.board.spaces[c1.space]?.kind === 'town' && !c1.fight && !c1.offer) act({ type: 'sleep' });
    if (c1.steps === 0) {
      if (clock > shopWait && shopOffer(state, c1)) {
        shopping();
        shopWait = clock + 90_000;
        if (flasks(me()) < 2) flaskWait = clock + 600_000;
      }
      const c2 = me();
      // The Arena, on its days, if it stands here.
      if (here0.kind === 'arena' && arenaOpen(c2, clock)) {
        const mode = c2.level >= (state.board.areas[here0.area]?.levels[1] ?? 99) + 2 && !arenaTried(c2, 'hard', clock) ? 'hard' : 'normal';
        if (!arenaTried(c2, mode, clock) && c2.gold >= arenaFee(state.board, here0.area, mode as never) * 2 && c2.hp >= stats(c2).maxHp * 0.7) {
          const events = act({ type: 'arena', op: 'enter', mode });
          spend(SEC.offer);
          if (!events.some((e) => e.type === 'rejected')) {
            r.arena.runs += 1;
            continue;
          }
        }
      }
      // A door to take, in or out.
      if (here0.door && next && spaces()[here0.door]?.area === next.area && readyFor(next)) {
        act({ type: 'door' });
        spend(SEC.door);
        continue;
      }
      if (here0.door && state.board.areas[here0.area]?.dungeon && (!next || next.area !== here0.area || !readyFor(next))) {
        act({ type: 'door' });
        spend(SEC.door);
        continue;
      }
      // Tap a boss met before.
      if (next && bossKnown(c2, next.id) && readyFor(next) && !state.board.areas[next.area]?.dungeon) {
        const events = act({ type: 'challenge', space: next.id });
        spend(SEC.offer);
        if (!events.some((e) => e.type === 'rejected')) continue;
      }
      // Hurt, far from a bed, and Home is ready.
      if (c2.hp < stats(c2).maxHp * 0.3 && hubOf(state, c2) && hubOf(state, c2) !== c2.space && (c2.cooldowns.home ?? 0) <= clock) {
        const events = act({ type: 'home' });
        spend(SEC.door);
        if (!events.some((e) => e.type === 'rejected')) {
          r.homes += 1;
          continue;
        }
      }
    }
    const c3 = me();
    const here = spaces()[c3.space]!;
    const open = walkable(c3);
    const lowHp = c3.hp < stats(c3).maxHp * 0.4 || (classId === 'mage' && c3.mana < stats(c3).maxMana * 0.15);
    const hunt = landToHunt(c3);
    const tier = state.board.areas[hunt]?.tier ?? 1;
    const couldBuy = clock > shopWait && SLOTS.some((slot) => {
      const piece = plainGear('x', slot, tier, LINE[classId]!, classId);
      return piece.price <= c3.gold * 0.7 && score(wearing(c3, piece)) > score(c3) + 1;
    });
    const quest = c3.quests[0];
    const rumour = c3.rumours?.[0];
    const arenaHere = arenaOpen(c3, clock) && arenaSpot(state.board, hunt);
    const arenaWorth = arenaHere && !arenaTried(c3, 'normal', clock) && c3.gold >= arenaFee(state.board, hunt) * 3;
    const hidden = (c3.found ?? []).find((id) => spaces()[id]?.name && !spaces()[id]?.mob && !(c3.foundDone ?? []).includes(id));
    let goal: (id: string) => boolean;
    wanted = lowHp ? 'rest' : flasks(c3) < 2 && c3.gold > 40 * tier && clock > flaskWait ? 'flasks' : next && readyFor(next) ? 'boss' : state.board.areas[here.area]?.dungeon ? 'dungeon-out' : couldBuy ? 'shop' : rumour ? 'rumour' : hidden ? 'hidden' : arenaWorth ? 'arena' : !quest && clock > boardWait ? 'board' : quest ? 'quest' : 'hunt';
    if (lowHp) goal = (id) => ['town', 'church'].includes(spaces()[id]!.kind);
    else if (flasks(c3) < 2 && c3.gold > 40 * tier && clock > flaskWait) goal = (id) => spaces()[id]!.kind === 'town' || (spaces()[id]!.kind === 'shop' && spaces()[id]!.stock === 'town');
    else if (next && readyFor(next) && !bossKnown(c3, next.id) && !state.board.areas[next.area]?.dungeon) goal = (id) => id === next.id;
    else if (next && state.board.areas[next.area]?.dungeon && readyFor(next)) {
      const inside = areaOf(c3.space) === next.area;
      const door = Object.values(spaces()).find((s) => s.door && spaces()[s.door]?.area === next.area);
      goal = inside ? (id) => id === next.id : (id) => id === door?.id;
    } else if (state.board.areas[here.area]?.dungeon) {
      const out = Object.values(spaces()).find((s) => s.area === here.area && s.door);
      goal = (id) => id === out?.id;
    } else if (couldBuy) goal = (id) => spaces()[id]!.kind === 'shop' && (spaces()[id]!.stock ?? 'arms') !== 'town' && spaces()[id]!.area !== here.area + '!' && state.board.areas[spaces()[id]!.area]!.tier >= tier - 1;
    else if (rumour && spaces()[rumour.space]) goal = (id) => id === rumour.space;
    else if (hidden) goal = (id) => id === hidden;
    else if (arenaWorth) goal = (id) => id === arenaSpot(state.board, hunt);
    else if ((!quest && clock > boardWait) || (quest && played - questSincePlayed > 2400)) goal = (id) => spaces()[id]!.kind === 'board';
    else if (quest && questHub(quest)) {
      const hub = spaces()[questHub(quest)!]!;
      goal = (id) => Math.hypot(spaces()[id]!.x - hub.x, spaces()[id]!.y - hub.y) < 400 && spaces()[id]!.kind === 'normal' && spaces()[id]!.area === quest.area;
    } else if (quest) goal = (id) => spaces()[id]!.area === quest.area && spaces()[id]!.kind === 'normal' && !spaces()[id]!.hidden;
    else goal = (id) => spaces()[id]!.area === hunt && spaces()[id]!.kind === 'normal' && !spaces()[id]!.hidden;

    if (process.env.TRACE === seed && played - traced > 900) {
      traced = played;
      console.log(`  ${(played / 3600).toFixed(1)}h L${c3.level} xp ${c3.xp} ${c3.space} (${here.area}) wants ${wanted}; next ${next?.id} L${next?.level} ready ${next ? readyFor(next) : '-'} hp ${c3.hp}/${stats(c3).maxHp} flasks ${flasks(c3)} gold ${c3.gold} quest ${quest?.text ?? '-'} opened ${c3.opened.join()}`);
    }
    const dist = distances(state, open, goal);
    // The coach, when the way is long.
    if (c3.steps === 0 && here.kind === 'town' && (dist.get(c3.space) ?? 0) > 30) {
      const coach = travelOptions(state, c3).filter((o) => o.price * 3 <= c3.gold).map((o) => ({ o, d: dist.get(o.id) ?? 9999 })).sort((a, b) => a.d - b.d)[0];
      if (coach && coach.d < (dist.get(c3.space) ?? 0) - 15) {
        act({ type: 'travel', to: coach.o.id });
        spend(SEC.offer);
        r.travels += 1;
        continue;
      }
    }
    // In a city you walk on tap, and roll from a gate.
    if (state.board.areas[here.area]?.city && c3.steps === 0) {
      const inCity = Object.values(spaces()).filter((s) => s.area === here.area && s.id !== c3.space);
      const target = inCity.filter((s) => s.name).map((s) => ({ s, d: dist.get(s.id) ?? 9999, out: s.links.some((l) => areaOf(l) !== here.area) })).sort((a, b) => a.d - b.d)[0];
      const leadsOut = here.links.some((l) => areaOf(l) !== here.area);
      if (target && target.d < (dist.get(c3.space) ?? 9999) && !(leadsOut && !goal(target.s.id) && target.d >= (dist.get(c3.space) ?? 0) - 1)) {
        const events = act({ type: 'stroll', to: target.s.id });
        spend(SEC.stroll);
        if (!events.some((e) => e.type === 'rejected')) continue;
      }
      if (!leadsOut) {
        const exit = inCity.find((s) => s.links.some((l) => areaOf(l) !== here.area));
        const events = exit ? act({ type: 'stroll', to: exit.id }) : [];
        spend(SEC.stroll);
        if (!events.some((e) => e.type === 'rejected')) continue;
        r.stuck = `shut in the city at ${c3.space}`;
        break;
      }
    }
    if (me().steps === 0) {
      if (me().offer || me().fight) continue;
      act({ type: 'roll' });
      spend(SEC.roll);
    }
    const after = me();
    if (after.steps === 0) continue;
    const options = reachable(state.board, after.space, after.steps, walkable(after));
    if (!options.length) {
      r.stuck = `no way to walk from ${after.space} on a ${after.steps}`;
      break;
    }
    const d2 = distances(state, walkable(after), goal);
    // A player walks round what it is not ready for, when the die leaves a choice: a boss on the road, a marked creature far above it.
    const tooBig = (id: string): boolean => {
      const sp = spaces()[id]!;
      const spawn = state.spawns[id];
      const foe = sp.kind === 'boss' && sp.boss && !goal(id) ? sp.boss : spawn?.enemy && spawn.kind !== 'merchant' ? spawn.enemy : sp.mob;
      if (!foe) return false;
      const level = spawn?.level ?? enemyLevelOf(foe);
      return level > after.level + 1 || (sp.kind === 'boss' && !goal(id));
    };
    const scored = options.map((o) => ({ o, d: (d2.get(o.space) ?? 9999) + rng.next() * 0.5 + (tooBig(o.space) ? 500 : 0) })).sort((a, b) => a.d - b.d);
    const events = act({ type: 'move', path: scored[0]!.o.path });
    if (events.some((e) => e.type === 'landed' && (e as unknown as { kind: string }).kind === 'board')) boardWait = clock + 300_000;
  }

  const c = me();
  r.hours = played / 3600;
  r.gold = c.gold;
  loot.runs += 1;
  loot.wornSets += Object.values(c.equipment).filter((g) => g?.set).length;
  loot.wornUniques += Object.values(c.equipment).filter((g) => g?.unique).length;
  r.flasksEnd = flasks(c);
  r.bosses = [...log.values()].sort((a, b) => a.minutes - b.minutes);
  r.bossesLeft = allBosses().filter((b) => !(c.bossKills[b.id] ?? 0)).map((b) => b.id);
  r.learned = Object.keys(c.abilities);
  const worn = Object.values(c.equipment).filter((g): g is GearItem => !!g);
  r.gearRank = worn.reduce((sum, g) => sum + g.rank, 0) / Math.max(1, worn.length);
  for (const g of worn) r.rarities[g.rarity] = (r.rarities[g.rarity] ?? 0) + 1;
  r.wornAtEnd = Object.entries(c.equipment).map(([slot, g]) => `${slot}:${g ? `${gearKind(g) ?? ''}${g.rank}` : '-'}`).join(' ');
  r.bagAtEnd = c.bag.length;
  if (process.env.ENDSTATE) r.endState = c;
  return r;
}

function distances(state: GameState, open: ReadonlySet<string>, goal: (id: string) => boolean): Map<string, number> {
  const out = new Map<string, number>();
  let frontier: string[] = [];
  const spaces = state.board.spaces;
  const usable = (id: string): boolean => {
    const sp = spaces[id];
    return !!sp && (open.has(sp.area) || open.has(id)) && (!sp.hidden || open.has(id));
  };
  for (const id of Object.keys(spaces)) {
    if (usable(id) && goal(id)) {
      out.set(id, 0);
      frontier.push(id);
    }
  }
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      const d = out.get(id)!;
      for (const l of spaces[id]!.links) {
        if (out.has(l) || !usable(l)) continue;
        out.set(l, d + 1);
        next.push(l);
      }
    }
    frontier = next;
  }
  return out;
}

// ---- the builds ----
const builds: Build[] = [];
for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
  if (ONLY && ONLY !== classId) continue;
  const trees = Object.keys(CLASS_DATA[classId]!.trees);
  trees.forEach((main, i) => {
    builds.push({ classId, main, second: null, tactic: 'sensible' });
    builds.push({ classId, main, second: trees[(i + 1) % trees.length]!, tactic: 'sensible' });
  });
  if (TACTICS_TOO) for (const tactic of ['brawler', 'careful', 'basic'] as const) builds.push({ classId, main: trees[0]!, second: null, tactic });
}

const results: Result[] = [];
for (const b of builds) for (let i = 0; i < RUNS; i++) {
  const res = play(b, `${b.classId}-${b.main}-${b.second ?? 'x'}-${b.tactic}-${i}`);
  results.push(res);
  const when = (l: number): string => (res.reached[l] === undefined ? '  - ' : res.reached[l]!.toFixed(1).padStart(4));
  console.log(`${CLASS_DATA[b.classId]!.name.padEnd(9)} ${(b.main + (b.second ? `+${b.second}` : '')).padEnd(24)} ${b.tactic.padEnd(8)} L${String(res.level).padStart(2)} h ${when(5)} ${when(10)} ${when(15)} ${when(20)} ${when(25)} ${when(30)} deaths ${String(res.deaths).padStart(3)} fights ${String(res.fights).padStart(4)} bosses ${String(res.bosses.filter((x) => x.level).length).padStart(2)} left ${res.bossesLeft.length} quests ${String(res.questsDone).padStart(3)} arena ${res.arena.runs}/${res.arena.wins} gold ${String(res.gold).padStart(6)} rank ${res.gearRank.toFixed(1)} flasks ${res.flasksEnd}/${res.flasksFound} reforged ${res.reforged}${res.stuck ? ` STUCK ${res.stuck}` : ''}`);
}
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ results, refused: [...refused], broken: [...broken], thrown: [...thrown] }));

const avg = (l: number[]): number => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
console.log('\nBosses (average over runs that beat them):');
const byBoss = new Map<string, BossLog[]>();
for (const res of results) for (const b of res.bosses) (byBoss.get(b.id) ?? byBoss.set(b.id, []).get(b.id)!).push(b);
for (const [id, list] of [...byBoss].sort((a, b) => a[1][0]!.bossLevel - b[1][0]!.bossLevel)) {
  const won = list.filter((b) => b.level);
  console.log(`  ${list[0]!.name.padEnd(20)} L${String(list[0]!.bossLevel).padStart(2)} beaten at L${avg(won.map((b) => b.level)).toFixed(1).padStart(4)} tries ${avg(list.map((b) => b.tries)).toFixed(1)} deaths ${avg(list.map((b) => b.deaths)).toFixed(2)} rounds ${avg(won.map((b) => b.rounds)).toFixed(0).padStart(3)} flasks ${avg(won.map((b) => b.flasks)).toFixed(1)} at ${avg(won.map((b) => b.minutes / 60)).toFixed(1)}h (${id})`);
}
console.log('\nBy level band (fights, rounds a fight, HP lost a fight, deaths per 100 fights, hours):');
for (const band of ['1-10', '11-20', '21-30']) {
  for (const cid of Object.keys(CLASS_DATA)) {
    const list = results.filter((x) => x.build.classId === cid).map((x) => x.bands[band]).filter((b): b is Band => !!b);
    if (!list.length) continue;
    const f = avg(list.map((b) => b.fights));
    console.log(`  ${band.padEnd(6)} ${cid.padEnd(8)} fights ${f.toFixed(0).padStart(4)} rounds ${(avg(list.map((b) => b.rounds)) / Math.max(1, f)).toFixed(1).padStart(4)} lost ${((avg(list.map((b) => b.lost)) / Math.max(1, f)) * 100).toFixed(0).padStart(3)}% deaths/100 ${((avg(list.map((b) => b.deaths)) / Math.max(1, f)) * 100).toFixed(1).padStart(4)} hours ${(avg(list.map((b) => b.seconds)) / 3600).toFixed(1)}`);
  }
}
console.log('\nHours spent by land:');
const lands = new Set(results.flatMap((x) => Object.keys(x.landSeconds)));
console.log('  ' + [...lands].map((l) => `${l} ${(avg(results.map((x) => x.landSeconds[l] ?? 0)) / 3600).toFixed(1)}`).join(', '));
const learned = new Map<string, number>();
const used = new Map<string, number>();
for (const res of results) {
  for (const id of res.learned) learned.set(id, (learned.get(id) ?? 0) + 1);
  for (const [id, k] of Object.entries(res.used)) used.set(id, (used.get(id) ?? 0) + k);
}
const neverPressed = [...learned.keys()].filter((id) => !ABILITIES[id]!.rule && !used.get(id));
console.log(`\nLearned at least once: ${learned.size} of ${Object.keys(ABILITIES).length}. Actives learned but never pressed: ${neverPressed.join(', ') || 'none'}`);
console.log(`Most pressed: ${[...used].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, k]) => `${id} ${k}`).join(', ')}`);
console.log('\nHours by what it wanted (all builds, each):');
console.log('  ' + [...wants].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / 3600 / results.length).toFixed(1)}`).join(', '));
console.log(`\nGold a run, in: ${[...goldFrom].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v / results.length)}`).join(', ')}; out: ${[...goldTo].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v / results.length)}`).join(', ')}`);
console.log(`\nLoot a run: ${(loot.sets / loot.runs).toFixed(1)} set pieces, ${(loot.uniques / loot.runs).toFixed(1)} uniques; worn at the end ${(loot.wornSets / loot.runs).toFixed(1)} and ${(loot.wornUniques / loot.runs).toFixed(1)}`);
console.log('\nRefused actions:');
for (const [k, v] of [...refused].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(7)}  ${k}   e.g. ${samples.get(k)}`);
console.log(`\nBroken state: ${broken.size ? '' : 'none'}`);
for (const [k, v] of [...broken].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${String(v).padStart(7)}  ${k}   e.g. ${samples.get(k) ?? ''}`);
console.log(`\nThrown errors: ${thrown.size ? '' : 'none'}`);
for (const [k, v] of thrown) console.log(`  ${String(v).padStart(7)}  ${k}`);
console.log(`\nErrands, minutes each: ${[...questTimes].map(([k, v]) => `${k} ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(0)} (${v.length} done)`).join(', ')}; given up ${questsDropped}`);
console.log('\nWho kills whom, most often:');
for (const [k, v] of [...killers].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`\nStuck: ${results.filter((x) => x.stuck).length} of ${results.length}`);
