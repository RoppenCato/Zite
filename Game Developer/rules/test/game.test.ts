import { describe, expect, it } from 'vitest';
import { ABILITIES, ENEMIES, PROGRESSION } from '../src/data.ts';
import { startingGear } from '../src/index.ts';
import { apply, makeBoard, newGame } from '../src/game.ts';
import { legalPaths, reachable } from '../src/paths.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import type { Action, Character, GameState } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;

/** A game on the twelve-space ring, so the paths below stay short. The real game plays on the world. */
function fresh(seed = 'ashford'): GameState {
  return newGame({ seed, player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
}
/** The ring: s0 town, s1 wilds, s2 Tinker Cart (shop), s3 wilds, s4 wilds, s5 chest, s6 shrine, s7 wilds, s8 spring, s9 wilds, s10 boss, s11 wilds. */
function about(space: string, given: Partial<Character> = {}, steps = 1): GameState {
  const patch = { journal: { beaten: {}, places: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'], done: [] }, ...given };
  const s = fresh();
  return { ...s, characters: { [P]: { ...s.characters[P]!, space, steps, ...patch } }, die: { ...s.die, last: steps } };
}
const roll = (id = 'r1'): Action => ({ type: 'roll', id, player: P });
const move = (path: string[], id = 'm1'): Action => ({ type: 'move', id, player: P, path });
const me = (s: GameState): Character => s.characters[P]!;

describe('a new game', () => {
  it('plays on the world unless given a board: Zite, starting in the town Ashford in the meadows, the first area open', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' });
    expect(s.version).toBe(47);
    expect(s.board).toEqual(makeBoard());
    expect(s.board.start).toBe('ashford');
    expect(me(s)).toMatchObject({ space: 'ashford', steps: 0, opened: ['meadows'] });
    expect(s.spawns).toEqual({});
    expect(s.nextItem).toBe(1);
  });

  it('takes the small ring when a test asks: one warrior on the start, the kit known, a tin sword and a round shield held, an unrolled die', () => {
    const s = fresh();
    expect(s.version).toBe(47);
    expect(s.seed).toBe('ashford');
    expect(Object.keys(s.board.spaces)).toHaveLength(12);
    expect(me(s)).toEqual({
      id: P,
      name: 'Robin',
      classId: 'warrior',
      level: 1,
      xp: 0,
      gold: 50,
      hp: 120,
      mana: 20,
      maxHp: 120,
      maxMana: 20,
      attack: 12,
      defense: 8,
      space: 's0',
      steps: 0,
      fight: null,
      items: {},
      equipment: startingGear(P, 'warrior'),
      bag: [],
      abilities: { 'heavy-blow': 1, execute: 1 },
      opened: ['ring'],
      seen: ['ring'],
      cooldowns: {},
      bossKills: {},
      offer: null,
      quests: [],
      carried: ['heavy-blow', 'execute'],
      journal: { beaten: {}, places: [], done: [] },
      bonusPoints: 0,
      keys: {},
      ailments: {},
      questsDone: [],
    });
    expect(s.die).toEqual({ sides: 6, last: null });
  });

  it('gives each class its own numbers and kit from the data', () => {
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'mage' }).characters[P]).toMatchObject({ hp: 90, mana: 40, attack: 7, defense: 4, gold: 50, abilities: { 'arcane-bolt': 1, overflow: 1 } });
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'rogue' }).characters[P]).toMatchObject({ hp: 95, gold: 60, abilities: { backstab: 1, eviscerate: 1 } });
    expect(newGame({ seed: 'x', player: P, name: 'R', classId: 'ranger' }).characters[P]).toMatchObject({ hp: 100, attack: 10, abilities: { volley: 1, 'sure-shot': 1 } });
  });
});

describe('roll', () => {
  it('rolls the die from the seed and leaves that many steps to walk', () => {
    const before = fresh();
    const snapshot = structuredClone(before);
    const { state, events } = apply(before, roll(), makeRng('ashford'), NOW);
    expect(events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 2 }]);
    expect(state.die.last).toBe(2);
    expect(me(state).steps).toBe(2);
    expect(me(state).space).toBe('s0');
    expect(before).toEqual(snapshot);
    expect(state).not.toBe(before);
  });

  it('replays the same roll from the same seed', () => {
    expect(apply(fresh(), roll(), makeRng('ashford'), NOW)).toEqual(apply(fresh(), roll(), makeRng('ashford'), NOW));
    expect(apply(fresh(), roll(), makeRng(12345), NOW).events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 6 }]);
  });

  it('is refused while a move is owed, in a fight, with a question open, or for a player not in the game', () => {
    const rng = makeRng('ashford');
    const first = apply(fresh(), roll('r1'), rng, NOW);
    const second = apply(first.state, roll('r2'), rng, NOW);
    expect(second.events).toEqual([{ type: 'rejected', action: 'r2', player: P, reason: 'finish your move first' }]);
    expect(second.state).toBe(first.state);
    const fighting = apply(about('s9'), move(['s10']), makeRng('x'), NOW).state;
    expect(apply(fighting, roll(), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
    const asked = about('s0', { offer: { kind: 'gamble', stake: 10 }, steps: 0 });
    expect(apply(asked, roll(), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'answer first' });
    const { state, events } = apply(fresh(), { type: 'roll', id: 'r1', player: 'nobody' }, makeRng('ashford'), NOW);
    expect(events).toEqual([{ type: 'rejected', action: 'r1', player: 'nobody', reason: 'unknown player' }]);
    expect(state.die.last).toBeNull();
  });
});

describe('move', () => {
  const rolled = () => apply(fresh(), roll(), makeRng('ashford'), NOW).state; // two steps owed from s0

  it('walks the path and lands on the last space', () => {
    const { state, events } = apply(rolled(), move(['s1', 's2']), makeRng('ashford'), NOW);
    expect(events.slice(0, 2)).toEqual([
      { type: 'moved', action: 'm1', player: P, from: 's0', path: ['s1', 's2'] },
      { type: 'landed', action: 'm1', player: P, space: 's2', kind: 'shop' },
    ]);
    expect(me(state)).toMatchObject({ space: 's2', steps: 0 });
    expect(state.die.last).toBe(2);
  });

  it('is refused before a roll, with the wrong count, off the links, turning back, to nowhere, and into a closed area', () => {
    expect(apply(fresh(), move(['s1']), makeRng('x'), NOW).events).toEqual([{ type: 'rejected', action: 'm1', player: P, reason: 'roll first' }]);
    expect(apply(rolled(), move(['s1']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'wrong number of steps' });
    expect(apply(rolled(), move([]), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'wrong number of steps' });
    expect(apply(rolled(), move(['s1', 's5']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not connected' });
    expect(apply(rolled(), move(['s1', 's0']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no turning back' });
    expect(apply(rolled(), move(['s1', 'nowhere']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such space' });
    // On the world, the road beyond the Copper Gate lies in the Kingswood, closed until the Warden falls.
    const world = newGame({ seed: 'x', player: P, name: 'R', classId: 'warrior' });
    const atGate = { ...world, characters: { [P]: { ...me(world), space: 'gate', steps: 1 } } };
    expect(apply(atGate, move(['gate-kw-se-1']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'that way is closed' });
    expect(apply(atGate, move(['moon-gate-5']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'moved' });
    const opened = { ...atGate, characters: { [P]: { ...me(atGate), opened: ['meadows', 'kingswood'] } } };
    expect(apply(opened, move(['gate-kw-se-1']), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'moved' });
    expect(reachable(world.board, 'gate', 1, new Set(['meadows'])).map((r) => r.space)).toEqual(['moon-gate-5', 'hermit-gate-3']);
    expect(reachable(world.board, 'gate', 1, new Set(['meadows', 'kingswood'])).map((r) => r.space)).toEqual(['moon-gate-5', 'hermit-gate-3', 'gate-kw-se-1']);
  });

  it('leaves the state alone when refused', () => {
    const s = rolled();
    const snapshot = structuredClone(s);
    const { state } = apply(s, move(['s1', 's0']), makeRng('x'), NOW);
    expect(state).toBe(s);
    expect(s).toEqual(snapshot);
  });
});

describe('landing', () => {
  it('in a town rests: HP and mana back to full', () => {
    const { state, events } = apply(about('s1', { hp: 50, mana: 5 }), move(['s0']), makeRng('ashford'), NOW);
    expect(events[2]).toEqual({ type: 'rested', action: 'm1', player: P, hp: 120, mana: 20, restored: true });
    expect(me(state)).toMatchObject({ hp: 120, mana: 20 });
  });

  it('on a shop does nothing by itself: the shop is open while you stand there', () => {
    const { events } = apply(about('s1'), move(['s2']), makeRng('ashford'), NOW);
    expect(events.map((e) => e.type).filter((t) => t !== 'journal' && t !== 'gold')).toEqual(['moved', 'landed']);
  });

  it('on a chest gives gold by the tier and maybe gear and a flask, then nothing for a while, then again', () => {
    const first = apply(about('s4'), move(['s5']), makeRng('ashford'), NOW);
    expect(first.events[2]).toEqual({ type: 'chest', action: 'm1', player: P });
    expect(first.events[3]).toMatchObject({ type: 'gold', action: 'm1', player: P });
    expect(me(first.state).cooldowns.s5).toBe(NOW + 600000);
    const goldAfter = me(first.state).gold;
    expect(goldAfter).toBeGreaterThan(50);
    const back = { ...first.state, characters: { [P]: { ...me(first.state), space: 's4', steps: 1 } } };
    const soon = apply(back, move(['s5'], 'm2'), makeRng('ashford'), NOW + 1000);
    expect(soon.events[2]).toEqual({ type: 'empty', action: 'm2', player: P, space: 's5', until: NOW + 600000 });
    expect(me(soon.state).gold).toBe(goldAfter);
    const later = apply(back, move(['s5'], 'm3'), makeRng('ashford'), NOW + 700000);
    expect(later.events[2]).toEqual({ type: 'chest', action: 'm3', player: P });
    expect(me(later.state).gold).toBeGreaterThan(goldAfter);
  });

  it('at a potion spot asks for a roll, once in a while', () => {
    const { state, events } = apply(about('s7'), move(['s8']), makeRng('x'), NOW);
    expect(events[2]).toMatchObject({ type: 'offer', offer: { kind: 'roll', what: 'flask' } });
    expect(me(state)).toMatchObject({ cooldowns: { s8: NOW + 300000 } });
  });

  it('at a shrine restores mana and some HP, then waits', () => {
    const first = apply(about('s5', { hp: 50, mana: 1 }), move(['s6']), makeRng('ashford'), NOW);
    expect(me(first.state).mana).toBe(20);
    expect(me(first.state).hp).toBeGreaterThan(50);
    expect(me(first.state).cooldowns.s6).toBe(NOW + 600000);
  });

  it('on a boss spot starts the boss fight, unless the boss is away for its five minutes', () => {
    const { state, events } = apply(about('s9'), move(['s10']), makeRng('x'), NOW);
    expect(events[2]).toMatchObject({ type: 'fight', space: 's10', enemy: expect.objectContaining({ id: 'thornwood-warden', role: 'boss', hp: 540 }) });
    expect(me(state).fight).toMatchObject({ space: 's10', spawn: false, round: 1 });
    const away = apply(about('s9', { cooldowns: { s10: NOW + 1000 } }), move(['s10']), makeRng('x'), NOW);
    expect(away.events[2]).toMatchObject({ type: 'nothing', text: expect.stringContaining('not back yet') });
    expect(me(away.state).fight).toBeNull();
  });

  it('in the wilds draws what turns up: mostly a fight with the area\'s creatures, else a chest, a merchant, a gamble', () => {
    const slime = apply(about('s0'), move(['s1']), makeRng('ashford'), NOW);
    expect(slime.events[2]).toMatchObject({ type: 'fight', enemy: expect.objectContaining({ id: 'slime', level: 1 }), space: 's1' });
    // The first seeds that give each thing (the weights move as the table does; the things do not).
    const firstSeed = (type: string) => Array.from({ length: 400 }, (_, i) => i).find((i) => apply(about('s0'), move(['s1']), makeRng(i), NOW).events[2]?.type === type)!;
    const chest = apply(about('s0'), move(['s1']), makeRng(firstSeed('chest')), NOW);
    expect(chest.events.slice(2, 4).map((e) => e.type)).toEqual(['chest', 'gold']);
    expect(me(chest.state).cooldowns).toEqual({}); // a chest found in the wilds is not a spot that empties
    const merchant = apply(about('s0'), move(['s1']), makeRng(firstSeed('merchant')), NOW);
    expect(merchant.events[2]).toEqual({ type: 'merchant', action: 'm1', player: P });
    // He camps on the spot, so what he opens counts as a shop and a purchase goes through (Robin found it refused, 2026-11-01).
    expect(merchant.state.spawns.s1).toMatchObject({ kind: 'merchant' });
    const bought = apply(merchant.state, { type: 'buy', player: P, id: 'b1', item: 'potion' } as Action, makeRng(1), NOW);
    expect(bought.events.some((e) => e.type === 'bought')).toBe(true);
    const event = apply(about('s0'), move(['s1']), makeRng(firstSeed('themeEvent')), NOW);
    expect(event.events[2]).toMatchObject({ type: 'themeEvent' });
    const counts: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      const r = apply(about('s0'), move(['s1']), makeRng(`wild-${i}`), NOW);
      const what = r.events[2]!.type;
      counts[what] = (counts[what] ?? 0) + 1;
      if (what === 'fight') {
        const e = r.events[2]!;
        if (e.type === 'fight') expect(['mob', 'mini']).toContain(e.enemy.role);
        if (e.type === 'fight' && e.enemy.role === 'mob') expect(['slime', 'wolf', 'bandit', 'wisp']).toContain(e.enemy.id);
      }
    }
    expect(counts.fight).toBeGreaterThan(160);
    expect(counts.chest).toBeGreaterThan(2);
    expect(counts.offer).toBeGreaterThan(5);
    expect(counts.merchant).toBeGreaterThan(5);
    expect(counts.themeEvent).toBeGreaterThan(5);
  });

  it('a gamble is answered high or low on a die for the stake, or passed; nothing else goes until it is', () => {
    const gambleSeed = Array.from({ length: 900 }, (_, i) => i).find((i) => { const e = apply(about('s0'), move(['s1']), makeRng(i), NOW).events[2]; return e?.type === 'offer' && e.offer.kind === 'gamble'; })!;
    const offered = apply(about('s0'), move(['s1']), makeRng(gambleSeed), NOW);
    expect(offered.events[2]).toEqual({ type: 'offer', action: 'm1', player: P, offer: { kind: 'gamble', stake: 20 } });
    expect(me(offered.state).offer).toEqual({ kind: 'gamble', stake: 20 });
    expect(apply(offered.state, roll(), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'answer first' });
    const won = apply(offered.state, { type: 'gamble', id: 'g1', player: P, choice: 'high' }, makeRng(104), NOW);
    expect(won.events).toEqual([{ type: 'gambled', action: 'g1', player: P, choice: 'high', roll: 6, won: true, delta: 20, gold: 70 }]);
    expect(me(won.state).offer).toBeNull();
    const lost = apply(offered.state, { type: 'gamble', id: 'g1', player: P, choice: 'low' }, makeRng(104), NOW);
    expect(lost.events[0]).toMatchObject({ type: 'gambled', choice: 'low', roll: 6, won: false, delta: -20, gold: 30 });
    const passed = apply(offered.state, { type: 'gamble', id: 'g1', player: P, choice: 'pass' }, makeRng('x'), NOW);
    expect(passed.events[0]).toMatchObject({ type: 'nothing' });
    expect(me(passed.state)).toMatchObject({ offer: null, gold: 50 });
    expect(apply(fresh(), { type: 'gamble', id: 'g1', player: P, choice: 'high' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
    // Broke: no gambler bothers you.
    const broke = apply(about('s0', { gold: 0 }), move(['s1']), makeRng(4), NOW);
    expect(broke.events[2]?.type).not.toBe('offer');
  });

  it('in the wilds, a wanderer is far above the land: its shown level, Dread, rich and tough (Robin, 2026-11-02)', () => {
    const w = PROGRESSION.wanderer;
    const met = { ...about('s0'), spawns: { s1: { kind: 'wanderer' as const, enemy: 'wolf', level: 9, until: NOW + 1000 } } };
    const e = me(apply(met, move(['s1']), makeRng('x'), NOW).state).fight!.enemy;
    const base = ENEMIES.wolf!;
    expect(e).toMatchObject({ name: `Dread ${base.name}`, level: 9, role: 'mini', wanderer: true, attack: Math.round(base.attack * w.attack), xp: Math.round(base.xp * w.xp) });
    expect(e.maxHp).toBeGreaterThanOrEqual(Math.round(base.hp * w.hp * 0.8));
  });

  it('in the wilds where something has spawned, meets it: a mini-boss to fight, or a merchant', () => {
    const base = about('s0');
    const prowling = { ...base, spawns: { s1: { kind: 'miniboss' as const, enemy: 'wolf-alpha', until: NOW + 1000 } } };
    const r = apply(prowling, move(['s1']), makeRng('x'), NOW);
    expect(r.events[2]).toMatchObject({ type: 'fight', enemy: expect.objectContaining({ id: 'wolf-alpha', role: 'mini' }) });
    expect(me(r.state).fight).toMatchObject({ spawn: true, space: 's1' });
    const camped = { ...base, spawns: { s1: { kind: 'merchant' as const, enemy: null, until: NOW + 1000 } } };
    expect(apply(camped, move(['s1']), makeRng('x'), NOW).events[2]).toEqual({ type: 'merchant', action: 'm1', player: P });
  });
});

describe('the world\'s tick', () => {
  const tick = (id: string): Action => ({ type: 'tick', id, player: 'world' });

  it('puts a mini-boss or a merchant on a free wild spot of an open area for a while, and takes it away when its time is up', () => {
    const world = newGame({ seed: 'w', player: P, name: 'R', classId: 'mage' });
    const first = apply(world, tick('t0'), makeRng(0), NOW);
    expect(first.events).toEqual([{ type: 'spawned', action: 't0', player: 'world', space: 'ashford-millford-1', spawn: { kind: 'miniboss', enemy: 'wolf-alpha', until: NOW + 600000 } }]);
    expect(first.state.spawns).toEqual({ 'ashford-millford-1': { kind: 'miniboss', enemy: 'wolf-alpha', until: NOW + 600000 } });
    expect(first.state.board.spaces['ashford-millford-1']!.area).toBe('meadows');
    const later = apply(first.state, tick('t9'), makeRng(9), NOW + 2_000_000);
    expect(later.events[0]).toEqual({ type: 'despawned', action: 't9', player: 'world', space: 'ashford-millford-1' });
    expect(later.events[1]).toMatchObject({ type: 'spawned' });
  });

  it('never spawns on a closed area, on a spot someone stands on, or past the cap, and gives the same state back when nothing happens', () => {
    const world = newGame({ seed: 'w', player: P, name: 'R', classId: 'mage' });
    for (let i = 0; i < 200; i++) {
      const r = apply(world, tick(`t${i}`), makeRng(`spawn-${i}`), NOW);
      for (const [space, spawn] of Object.entries(r.state.spawns)) {
        expect(world.board.spaces[space]!.area).toBe('meadows');
        expect(world.board.spaces[space]!.kind).toBe('normal');
        expect(space).not.toBe('ashford');
        if (spawn.kind === 'wanderer') {
          expect(spawn.until).toBe(NOW + PROGRESSION.wanderer.lifeMs);
          continue;
        } else if (spawn.kind === 'worldboss') {
          // Now and then the world boss: the meadows' own, Old Bristleback (Robin, 2026-11-04: not King Goo), for longer, on top of the cap (coop.test.ts has the rest).
          expect(spawn.until).toBe(NOW + PROGRESSION.worldBoss.lifeMs);
          expect(spawn.enemy).toBe('bristleback');
          continue;
        }
        expect(spawn.until).toBe(NOW + 600000);
        if (spawn.kind === 'miniboss') expect(spawn.enemy).toBe('wolf-alpha');
        else if (spawn.kind === 'merchant') expect(spawn.enemy).toBeNull();
      }
    }
    const full = { ...world, spawns: { 'ashford-millford-1': { kind: 'merchant' as const, enemy: null, until: NOW + 1000 }, 'ashford-millford-2': { kind: 'merchant' as const, enemy: null, until: NOW + 1000 }, 'ashford-millford-3': { kind: 'merchant' as const, enemy: null, until: NOW + 1000 } } };
    // Grown past the land, so no wanderer comes for this character either.
    const quiet = { ...full, characters: { [P]: { ...full.characters[P]!, level: 40 } } };
    const r = apply(quiet, tick('t'), makeRng('quiet'), NOW);
    expect(r.state).toBe(quiet);
    expect(r.events).toEqual([]);
  });
});

describe('the legal paths', () => {
  it('lists every walk of the rolled length, in link order, never turning back', () => {
    const { board } = fresh();
    expect(legalPaths(board, 's0', 1)).toEqual([['s11'], ['s1']]);
    expect(legalPaths(board, 's0', 2)).toEqual([['s11', 's10'], ['s1', 's2']]);
    expect(legalPaths(board, 's3', 1)).toEqual([['s2'], ['s4'], ['s9']]);
    expect(legalPaths(board, 's0', 4)).toHaveLength(4);
    expect(legalPaths(board, 's0', 0)).toEqual([]);
  });

  it('lists where a roll can end, each space once, with the first walk there', () => {
    const { board } = fresh();
    expect(reachable(board, 's0', 2)).toEqual([
      { space: 's10', path: ['s11', 's10'] },
      { space: 's2', path: ['s1', 's2'] },
    ]);
    const six = reachable(board, 's0', 6);
    expect(six.map((r) => r.space)).toEqual(['s6', 's1', 's5', 's7', 's11']);
    expect(reachable(board, 's0', 0)).toEqual([]);
  });

  it('agrees with move: every legal path is accepted', () => {
    const { state } = apply(fresh(), roll(), makeRng(12345), NOW); // a 6
    const paths = legalPaths(state.board, 's0', 6);
    expect(paths.length).toBeGreaterThan(2);
    for (const path of paths) {
      const result = apply(state, move(path), makeRng('x'), NOW);
      // A boss on the way stops the walk there (Robin, 2026-11-02).
      const boss = path.slice(0, 5).findIndex((id) => state.board.spaces[id]!.kind === 'boss');
      expect(result.events[1]).toMatchObject({ type: 'landed', space: boss >= 0 ? path[boss] : path[5] });
    }
  });
});

describe('a few turns from one seed', () => {
  it('always play out the same way, whatever turns up', () => {
    const play = () => {
      const rng = makeRng('ashford');
      let state = fresh();
      const log: string[] = [];
      let turns = 0;
      for (let i = 0; i < 160 && turns < 3; i++) {
        const c = me(state);
        let r;
        if (c.fight) r = apply(state, { type: 'fight', id: `f${i}`, player: P, move: { kind: 'attack' }, guard: 'block' }, rng, NOW);
        // Answer whatever is offered: a quest board is passed by as a gamble is.
        else if (c.offer?.kind === 'board') r = apply(state, { type: 'quest', id: `q${i}`, player: P, accept: false, index: 0 } as Action, rng, NOW);
        else if (c.offer) r = apply(state, { type: 'gamble', id: `g${i}`, player: P, choice: 'pass' }, rng, NOW);
        else if (c.steps > 0) r = apply(state, move(legalPaths(state.board, c.space, c.steps)[0]!, `m${i}`), rng, NOW);
        else {
          r = apply(state, roll(`r${i}`), rng, NOW);
          turns++;
        }
        state = r.state;
        log.push(r.events.map((e) => e.type).join('+'));
      }
      return { log, me: me(state) };
    };
    const a = play();
    expect(a.log.filter((l) => l.startsWith('rolled'))).toHaveLength(3);
    expect(play()).toEqual(a);
  });
});

describe('a stored state', () => {
  it('passes through at the current version and is refused when it is nothing we know', () => {
    const s = fresh();
    expect(migrate(structuredClone(s))).toEqual(s);
    expect(migrate(null)).toBeNull();
    expect(migrate('junk')).toBeNull();
    expect(migrate({ version: 99 })).toBeNull();
    expect(migrate({ version: 0 })).toBeNull();
    expect(migrate({})).toBeNull();
  });

  // Older states as the first builds saved them: the ring (1), the island (2), the fight (3), the bag (4).
  const older = (version: 1 | 2 | 3 | 4) => ({
    version,
    seed: 'old-seed',
    board: { start: 's0', spaces: {} },
    characters: {
      p1: { id: 'p1', name: 'Robin', classId: 'warrior', hp: 77, maxHp: 132, attack: 14, defense: 9, gold: 95, space: 's7', steps: 3, xp: 25, level: 2, fight: null, items: { potion: 2 } },
      p2: { id: 'p2', name: 'Ann', classId: 'mage', hp: 80, maxHp: 80, attack: 14, defense: 4, gold: 12, space: 's2', steps: 0 },
    },
    die: { sides: 6, last: 3 },
  });

  it.each([1, 2, 3, 4] as const)('brings a version-%i state up to date: the world, every character kept by name, class, level, xp, gold and bag, stood on Ashford rested, the first area open', (version) => {
    const s = migrate(structuredClone(older(version)));
    expect(s).not.toBeNull();
    expect(s!.version).toBe(47);
    expect(s!.seed).toBe('old-seed');
    expect(s!.board).toEqual(makeBoard());
    expect(s!.die).toEqual({ sides: 6, last: null });
    expect(s!.spawns).toEqual({});
    expect(s!.nextItem).toBe(1);
    expect(s!.characters.p1).toMatchObject({
      id: 'p1',
      name: 'Robin',
      classId: 'warrior',
      level: 2,
      xp: 25,
      gold: 95,
      items: { potion: 2 },
      hp: 132,
      maxHp: 132,
      mana: 22,
      maxMana: 22,
      attack: 14,
      defense: 9,
      space: 'ashford',
      steps: 0,
      fight: null,
      bag: [],
      abilities: { 'heavy-blow': 1, execute: 1 },
      opened: ['meadows'],
      cooldowns: {},
      bossKills: {},
      offer: null,
    });
    expect(s!.characters.p2).toMatchObject({ name: 'Ann', classId: 'mage', level: 1, xp: 0, gold: 12, mana: 40, items: {}, abilities: { 'arcane-bolt': 1, overflow: 1 } });
    // And it plays on: a roll from the start of the world.
    const { events } = apply(s!, roll(), makeRng('ashford'), NOW);
    expect(events).toEqual([{ type: 'rolled', action: 'r1', player: P, value: 2 }]);
  });

  it('brings a version-5 state up: the board rebuilt with the Summit leading on, a character kept where it stood in an open area, one on a closed or vanished spot sent to the start', () => {
    const today = newGame({ seed: 'old-seed', player: 'p1', name: 'Robin', classId: 'warrior' });
    const oldBoard = structuredClone(today.board) as unknown as Record<string, unknown>;
    delete oldBoard.bestiary;
    (oldBoard.spaces as Record<string, { opens?: string | null }>).summit!.opens = null;
    const p1 = { ...me(today), space: 'pass', steps: 2, gold: 300, opened: ['meadows', 'thornwood', 'frostpeak'], cooldowns: { summit: NOW + 1000 } };
    const p2 = { ...me(today), id: 'p2', name: 'Ann', space: 'gate-edge-1', steps: 1, opened: ['meadows'] };
    const p3 = { ...me(today), id: 'p3', name: 'Bo', space: 'nowhere', opened: ['meadows', 'gone'] };
    const v5 = { version: 5, seed: 'old-seed', board: oldBoard, characters: { p1, p2, p3 }, die: { sides: 6, last: 4 }, spawns: { 'briar-pass-1': { kind: 'merchant', enemy: null, until: NOW }, nowhere: { kind: 'merchant', enemy: null, until: NOW } }, nextItem: 9 };
    const s = migrate(structuredClone(v5));
    expect(s).not.toBeNull();
    expect(s!.version).toBe(47);
    expect(s!.board).toEqual(makeBoard());
    // Past the first boss: the ring and the city open with what it opened (the hub world).
    expect(s!.characters.p1).toEqual({ ...p1, bonusPoints: 4, opened: ['meadows', 'thornwood', 'frostpeak', 'kingswood', 'crownhaven'] });
    expect(s!.characters.p2).toEqual({ ...p2, space: 'ashford', steps: 0 });
    expect(s!.characters.p3).toEqual({ ...p3, space: 'ashford', steps: 0, opened: ['meadows'] });
    expect(s!.spawns).toEqual({ 'briar-pass-1': { kind: 'merchant', enemy: null, until: NOW } });
    expect(s!.die).toEqual({ sides: 6, last: 4 });
    expect(s!.nextItem).toBe(9);
  });

  it('refuses an older state it cannot carry over', () => {
    const noSeed = older(4) as Record<string, unknown>;
    delete noSeed.seed;
    expect(migrate(noSeed)).toBeNull();
    const oddClass = older(3);
    oddClass.characters.p2.classId = 'bard';
    expect(migrate(oddClass)).toBeNull();
    expect(migrate({ version: 1, seed: 'x', characters: 'none' })).toBeNull();
  });
});

describe('the enemies', () => {
  it('each have a level, a role, at least one move, and a wind-up only on minis and bosses or a heavy mob', () => {
    for (const [id, e] of Object.entries(ENEMIES)) {
      expect(e.level, id).toBeGreaterThan(0);
      expect(['mob', 'mini', 'boss']).toContain(e.role);
      expect(e.moves.length, id).toBeGreaterThan(0);
      for (const m of e.moves) expect(m.weight, `${id} ${m.name}`).toBeGreaterThan(0);
      if (e.role !== 'mob') expect(e.moves.some((m) => m.charge), `${id} winds up`).toBe(true);
    }
  });
});

describe('a version-10 state (the names before the Enchanted Kingdoms)', () => {
  it('comes up to 11 with the board laid again under the new names, the character kept where it stood', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' });
    const moved = { ...s, characters: { [P]: { ...s.characters[P]!, space: 'millford', gold: 77 } } };
    const old = structuredClone({ ...moved, version: 10 }) as unknown as { board: { spaces: Record<string, { name: string }> } };
    old.board.spaces.ashford!.name = 'Ashford';
    old.board.spaces.millford!.name = 'Millford';
    const up = migrate(old)!;
    expect(up.version).toBe(47);
    expect(up.board.spaces.ashford?.name).toBe('Puddlewick Village');
    expect(up.board.spaces.millford?.name).toBe('Old Mill');
    expect(up.board.areas.meadows?.name).toBe('Cloverfield Meadows');
    expect(up.characters[P]).toMatchObject({ space: 'millford', gold: 77 });
  });

  it('leaves a board that is not the world (a test ring) as it is', () => {
    const ring = structuredClone({ ...fresh(), version: 10 });
    const up = migrate(ring)!;
    expect(up.version).toBe(47);
    expect(up.board.spaces.s0?.name).toBe(fresh().board.spaces.s0?.name);
  });
});

describe('a version-11 state (five gear slots)', () => {
  it('comes up to 12 with shield, gloves and cape added empty, what was worn kept', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' });
    const sword = { id: 'g1', slot: 'weapon' as const, rank: 1, rarity: 'common' as const, name: 'Tin Sword', base: 'tin sword', stats: { attack: 4 }, affixes: [], price: 30 };
    const old = structuredClone({ ...s, version: 11, characters: { [P]: { ...s.characters[P]!, equipment: { weapon: sword, armour: null, helm: null, boots: null, trinket: null } } } });
    const up = migrate(old)!;
    expect(up.version).toBe(47);
    expect(Object.keys(up.characters[P]!.equipment).sort()).toEqual(['armour', 'boots', 'cape', 'gloves', 'helm', 'shield', 'trinket', 'weapon']);
    expect(up.characters[P]!.equipment.weapon).toEqual(sword);
    expect(up.characters[P]!.equipment.cape).toBeNull();
  });

  it('a new character holds its first weapon (a Warrior a shield too) and wears nothing else, in eight slots', () => {
    const s = newGame({ seed: 'ashford', player: P, name: 'Robin', classId: 'warrior' });
    expect(Object.values(s.characters[P]!.equipment).map((g) => g?.name ?? null)).toEqual(['Tin Sword', 'Tin Round Shield', null, null, null, null, null, null]);
    expect(Object.keys(s.characters[P]!.equipment)).toEqual(['weapon', 'shield', 'helm', 'armour', 'gloves', 'boots', 'cape', 'trinket']);
  });
});
