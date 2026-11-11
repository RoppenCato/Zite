// The shared world's own pieces (mine, 2026-11-01, from Robin's list: shared bosses and traces): the world boss everyone
// fights together, the notes left on spots, and the save coming up to version 10.
import { describe, expect, it } from 'vitest';
import { ENEMIES, PROGRESSION, TRACES } from '../src/data.ts';
import { diffState, mergeDelta } from '../src/delta.ts';
import { makeEnemy } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { hintFor } from '../src/hints.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import type { Action, Character, GameState, Spawn } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const NOW = 1_000_000;
const WB = PROGRESSION.worldBoss;
const join = (player: string, name: string, classId = 'mage', id = `j-${player}`): Action => ({ type: 'join', id, player, name, classId } as Action);
const tick = (id: string): Action => ({ type: 'tick', id, player: 'world' });
const attack = (player: string, id: string): Action => ({ type: 'fight', id, player, move: { kind: 'attack' }, guard: 'block' });

/** Two players on the ring, p1 a warrior and p2 a mage, both at the start. */
function two(): GameState {
  const s = newGame({ seed: 'coop', player: 'p1', name: 'Robin', classId: 'warrior', board: ringBoard() });
  return apply(s, join('p2', 'Sam'), makeRng('j'), NOW).state;
}
/** A world boss planted on s1: the Warden with `hp` left. */
function withBoss(s: GameState, hp: number, hitters: Record<string, number> = {}): GameState {
  const spawn: Spawn = { kind: 'worldboss', enemy: 'thornwood-warden', until: NOW + WB.lifeMs, hp, maxHp: 1375, hitters };
  return { ...s, spawns: { ...s.spawns, s1: spawn } };
}
/** The character a step from s1, strong enough to matter. */
function ready(s: GameState, player: string, patch: Partial<Character> = {}): GameState {
  const c = s.characters[player]!;
  return { ...s, characters: { ...s.characters, [player]: { ...c, space: 's0', steps: 1, attack: 60, hp: 400, maxHp: 400, ...patch } } };
}
const landOn = (s: GameState, player: string, id: string) => apply(s, { type: 'move', id, player, path: ['s1'] }, makeRng(id), NOW);

describe('the world boss', () => {
  it('is each land\'s own: a boss met nowhere else, as strong as the land\'s gate boss (Robin, 2026-11-04)', () => {
    const s = newGame({ seed: 'wb', player: 'p1', name: 'Robin', classId: 'warrior' });
    const gates = new Set(Object.values(s.board.spaces).map((x) => x.boss).filter(Boolean));
    const met = new Set(Object.values(s.board.areas).flatMap((a) => [...a.mobs, ...a.miniBosses]));
    for (const [land, id] of Object.entries(WB.lands)) {
      expect(s.board.areas[land], land).toBeDefined();
      expect(ENEMIES[id]?.role, id).toBe('boss');
      expect(gates.has(id), id).toBe(false);
      expect(met.has(id), id).toBe(false);
      const gate = Object.values(s.board.spaces).find((x) => x.area === land && x.kind === 'boss' && x.boss && ENEMIES[x.boss]?.role === 'boss')!;
      expect(ENEMIES[id]!.hp, id).toBe(ENEMIES[gate.boss!]!.hp);
    }
    expect(Object.keys(WB.lands)).toHaveLength(7);
  });

  it('comes with a tick now and then, when none is about: the world boss of the furthest land anyone has opened, on a wild spot there, with HP for a crowd, for a while', () => {
    let s = newGame({ seed: 'wb', player: 'p1', name: 'Robin', classId: 'warrior' });
    s = { ...s, characters: { p1: { ...s.characters.p1!, opened: ['meadows', 'thornwood'] } } };
    const rng = makeRng('ticks');
    let found: { space: string; spawn: Spawn } | null = null;
    let now = NOW;
    for (let i = 0; i < 600 && !found; i++) {
      now += 60_000;
      const r = apply(s, tick(`t${i}`), rng, now);
      s = r.state;
      const e = r.events.find((x) => x.type === 'spawned' && x.spawn.kind === 'worldboss');
      if (e?.type === 'spawned') found = { space: e.space, spawn: e.spawn };
    }
    expect(found).not.toBeNull();
    const space = s.board.spaces[found!.space]!;
    expect(space.kind).toBe('normal');
    expect(space.area).toBe('thornwood');
    // The land's own, never its gate boss (Robin, 2026-11-04).
    const gate = Object.values(s.board.spaces).find((x) => x.area === 'thornwood' && x.kind === 'boss')!;
    expect(found!.spawn.enemy).toBe('mother-owlbear');
    expect(found!.spawn.enemy).not.toBe(gate.boss);
    const hp = Math.round(makeEnemy(gate.boss!).maxHp * WB.hpMult);
    expect(found!.spawn).toMatchObject({ kind: 'worldboss', hp, maxHp: hp, hitters: {}, until: now + WB.lifeMs });
    // Only one at a time.
    for (let i = 0; i < 50; i++) {
      now += 60_000;
      const r = apply(s, tick(`u${i}`), rng, now);
      s = r.state;
      expect(r.events.filter((x) => x.type === 'spawned' && x.spawn.kind === 'worldboss')).toEqual([]);
      if (!Object.values(s.spawns).some((x) => x.kind === 'worldboss')) break;
    }
  });

  it('is fought together: the second to land finds the HP the first left, and each player\'s damage is tallied on the spawn', () => {
    let s = ready(ready(withBoss(two(), 1375), 'p1'), 'p2');
    const first = landOn(s, 'p1', 'm1');
    s = first.state;
    expect(first.events.find((e) => e.type === 'fight')).toMatchObject({ enemy: { id: 'thornwood-warden', hp: 1375, maxHp: 1375 }, space: 's1' });
    expect(s.characters.p1!.fight).toMatchObject({ shared: true, spawn: true, space: 's1' });
    const hit = apply(s, attack('p1', 'a1'), makeRng('a1'), NOW);
    s = hit.state;
    const dealt = 1375 - s.characters.p1!.fight!.enemy.hp;
    expect(dealt).toBeGreaterThan(0);
    expect(s.spawns.s1).toMatchObject({ hp: 1375 - dealt, hitters: { p1: dealt } });
    const second = landOn(s, 'p2', 'm2');
    s = second.state;
    expect(s.characters.p2!.fight).toMatchObject({ shared: true, enemy: { hp: 1375 - dealt, maxHp: 1375 } });
    const hit2 = apply(s, attack('p2', 'a2'), makeRng('a2'), NOW);
    s = hit2.state;
    const dealt2 = 1375 - dealt - s.characters.p2!.fight!.enemy.hp;
    expect(dealt2).toBeGreaterThan(0);
    expect(s.spawns.s1).toMatchObject({ hp: 1375 - dealt - dealt2, hitters: { p1: dealt, p2: dealt2 } });
    // The first's next round starts from the HP the second left.
    const hit3 = apply(s, attack('p1', 'a3'), makeRng('a3'), NOW);
    const firstHit = hit3.events.find((e) => e.type === 'hit' && e.by === 'player');
    expect(firstHit?.type === 'hit' ? firstHit.hp : -1).toBeLessThan(1375 - dealt - dealt2);
  });

  it('pays everyone who hit it when it falls, by their share and never under the floor, ends their fights and leaves the spot', () => {
    let s = ready(ready(withBoss(two(), 1375), 'p1'), 'p2');
    s = landOn(s, 'p1', 'm1').state;
    s = landOn(s, 'p2', 'm2').state;
    // p2 did most of the work; p1 lands the last blow on a sliver of HP.
    s = { ...s, spawns: { s1: { ...s.spawns.s1!, hp: 5, hitters: { p1: 100, p2: 1270 } } } };
    const goldBefore = { p1: s.characters.p1!.gold, p2: s.characters.p2!.gold };
    const r = apply(s, attack('p1', 'kill'), makeRng('kill'), NOW);
    const down = r.events.find((e) => e.type === 'worldBossDown');
    expect(down?.type).toBe('worldBossDown');
    if (down?.type !== 'worldBossDown') return;
    expect(down.space).toBe('s1');
    expect(down.enemy).toBe('thornwood-warden');
    const warden = ENEMIES['thornwood-warden']!;
    const p1 = down.shares.find((x) => x.player === 'p1')!;
    const p2 = down.shares.find((x) => x.player === 'p2')!;
    expect(p1.damage).toBe(105);
    expect(p2.damage).toBe(1270);
    expect(p1.xp).toBe(Math.round(warden.xp * WB.minShare)); // the floor
    expect(p2.xp).toBe(Math.round(warden.xp * (1270 / 1375)));
    expect(p1.gold).toBe(Math.round(warden.gold * WB.minShare));
    expect(p2.gold).toBe(Math.round(warden.gold * (1270 / 1375)));
    expect(r.events.find((e) => e.type === 'won')).toMatchObject({ player: 'p1', xp: p1.xp, gold: p1.gold });
    expect(r.events.find((e) => e.type === 'despawned')).toMatchObject({ space: 's1' });
    expect(r.state.spawns.s1).toBeUndefined();
    expect(r.state.characters.p1!.fight).toBeNull();
    expect(r.state.characters.p2!.fight).toBeNull();
    expect(r.state.characters.p1!.gold).toBeGreaterThanOrEqual(goldBefore.p1 + p1.gold);
    expect(r.state.characters.p2!.gold).toBeGreaterThanOrEqual(goldBefore.p2 + p2.gold);
    expect(r.state.characters.p2!.xp).toBe(p2.xp);
    // Both changed in one action: the delta carries both pieces.
    expect(Object.keys(diffState(s, r.state)!.characters!).sort()).toEqual(['p1', 'p2']);
  });

  it('leaves when its time is up, and whoever was still fighting it is let go', () => {
    let s = ready(withBoss(two(), 1375), 'p1');
    s = landOn(s, 'p1', 'm1').state;
    s = { ...s, spawns: { s1: { ...s.spawns.s1!, until: NOW + 1 } } };
    const r = apply(s, tick('late'), makeRng('late'), NOW + 2);
    expect(r.events[0]).toEqual({ type: 'bossLeft', action: 'late', player: 'world', space: 's1', enemy: 'thornwood-warden', players: ['p1'] });
    expect(r.events[1]).toMatchObject({ type: 'despawned', space: 's1' });
    expect(r.state.characters.p1!.fight).toBeNull();
    expect(r.state.spawns.s1).toBeUndefined();
  });

  it('a round against a beast that is already gone ends the fight with nothing to show', () => {
    let s = ready(withBoss(two(), 1375), 'p1');
    s = landOn(s, 'p1', 'm1').state;
    s = { ...s, spawns: {} };
    const r = apply(s, attack('p1', 'late'), makeRng('late'), NOW);
    expect(r.events).toEqual([{ type: 'nothing', action: 'late', player: 'p1', text: 'The beast is gone.' }]);
    expect(r.state.characters.p1!.fight).toBeNull();
  });

  it('is told of on a tap, with its HP and its time', () => {
    const s = withBoss(two(), 900);
    expect(hintFor(s, 's1', 'p1', NOW)).toMatch(/A world boss, King Goo, rages here: 900 of 1375 HP left, gone in 30:00\. Everyone who lands here fights the same beast/);
  });
});

describe('notes on spots', () => {
  const note = (player: string, text: string, id: string): Action => ({ type: 'trace', id, player, text });

  it('are left where you stand, newest first, one a player, a few a spot, and fade after a day', () => {
    let s = two();
    const first = apply(s, note('p1', 'Danger!', 'n1'), makeRng('n'), NOW);
    s = first.state;
    expect(first.events).toEqual([{ type: 'traced', action: 'n1', player: 'p1', space: 's0', trace: { player: 'p1', name: 'Robin', text: 'Danger!', at: NOW } }]);
    expect(s.traces.s0).toEqual([{ player: 'p1', name: 'Robin', text: 'Danger!', at: NOW }]);
    s = apply(s, note('p1', 'Loot here', 'n2'), makeRng('n'), NOW + 1).state;
    expect(s.traces.s0!.map((t) => t.text)).toEqual(['Loot here']); // one a player: the new one replaces the old
    s = apply(s, note('p2', 'Boss near', 'n3'), makeRng('n'), NOW + 2).state;
    expect(s.traces.s0!.map((t) => [t.name, t.text])).toEqual([['Sam', 'Boss near'], ['Robin', 'Loot here']]);
    // Three at most: planted notes from others push the oldest out.
    s = { ...s, traces: { s0: [{ player: 'x', name: 'Kim', text: 'Danger!', at: NOW + 3 }, ...s.traces.s0!] } };
    s = apply(s, note('p1', 'Help!', 'n4'), makeRng('n'), NOW + 4).state;
    expect(s.traces.s0!.map((t) => t.name)).toEqual(['Robin', 'Kim', 'Sam']);
    expect(s.traces.s0!.length).toBe(PROGRESSION.traces.perSpace);
    // A day on, they are gone with the tick.
    const faded = apply(s, tick('day'), makeRng('d'), NOW + PROGRESSION.traces.lifeMs + 5);
    expect(faded.state.traces).toEqual({});
    expect(faded.state).not.toBe(s);
  });

  it('are refused in a fight or with a line that is not one of the set', () => {
    const s = two();
    expect(apply(s, note('p1', 'anything I like', 'bad'), makeRng('n'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'bad value' });
    const fighting = landOn(ready(withBoss(s, 1375), 'p1'), 'p1', 'm1').state;
    expect(apply(fighting, note('p1', TRACES[0]!, 'busy'), makeRng('n'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'finish the fight first' });
  });

  it('are read on a tap and travel in the delta', () => {
    const s = two();
    const r = apply(s, note('p2', 'Loot here', 'n'), makeRng('n'), NOW);
    expect(hintFor(r.state, 's0', 'p1', NOW + 120_000)).toMatch(/Notes here: Sam: "Loot here" \(2 min ago\)\.$/);
    const delta = diffState(s, r.state)!;
    expect(Object.keys(delta)).toEqual(['traces']);
    expect(mergeDelta(s, delta)).toEqual(r.state);
  });
});

describe('a version-9 save', () => {
  it('comes up to 10 with no notes yet', () => {
    const s = two();
    const { traces: _t, ...v9 } = { ...s, version: 9 as const };
    const up = migrate(v9);
    expect(up).not.toBeNull();
    expect(up!.version).toBe(48);
    expect(up!.traces).toEqual({});
    expect(up!.characters).toEqual(s.characters);
  });
});
