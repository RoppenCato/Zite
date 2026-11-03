// The Dream (Robin, 2026-11-03): the Ferry, the Isle, a run laid from a seed, its foes, Dreamdust, the three ends, the merchant.
import { describe, expect, it } from 'vitest';
import { apply, DREAM, dreamAreaId, dreamRank, dreamWares, layDream, makeRng, newGame, rollTrinket, stats, TRINKETS, type Character, type GameEvent, type GameState } from '../src/index.ts';
import { migrate } from '../src/save.ts';
import { baseNumbers } from '../src/skills.ts';

const P = 'p1';
const NOW = 1_000_000;
const me = (s: GameState): Character => s.characters[P]!;
const put = (s: GameState, patch: Partial<Character>): GameState => ({ ...s, characters: { ...s.characters, [P]: { ...me(s), ...patch } } });

/** A level-30 Warrior who has beaten the Hollow King, standing at the Dreamgate. */
function dreamer(seed = 'dream'): GameState {
  const s = newGame({ seed, player: P, name: 'Robin', classId: 'warrior' });
  const throne = Object.values(s.board.spaces).find((x) => x.boss === DREAM.needs)!;
  const c = { ...me(s), level: 30, ...baseNumbers('warrior', 30), bossKills: { [throne.id]: 1 }, opened: [...new Set([...me(s).opened, 'crownhaven', DREAM.isle.area])], space: DREAM.isle.gate };
  const full = stats(c);
  return put(s, { ...c, hp: full.maxHp, mana: full.maxMana, gold: 500 });
}

const enter = (s: GameState, depth = 1) => apply(s, { type: 'dream', id: 'd', player: P, op: 'enter', depth }, makeRng('enter'), NOW);

/** Step onto the next spot of the run from where you stand. */
function stepTo(s: GameState, to: string, seed = 'step') {
  return apply(put(s, { steps: 1 }), { type: 'move', id: 'm', player: P, path: [to] }, makeRng(seed), NOW);
}

/** Win the fight under way at once. */
function winFight(s: GameState) {
  const c = me(s);
  const fighting = put(s, { attack: 100_000, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 1 } } });
  return apply(fighting, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('win'), NOW);
}

describe('the Ferry and the Dreaming Isle', () => {
  it('the Ferry waits for the Hollow King, then crosses to the Isle, walked like a city', () => {
    const s = newGame({ seed: 'ferry', player: P, name: 'Robin', classId: 'warrior' });
    const ferry = s.board.spaces['city-bank']!;
    expect(ferry).toMatchObject({ kind: 'door', name: 'The Ferry', needs: DREAM.needs, door: 'di-dock' });
    const waiting = put(s, { space: 'city-bank', opened: [...me(s).opened, 'crownhaven'] });
    expect(apply(waiting, { type: 'door', id: 'd', player: P }, makeRng('d'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    const throne = Object.values(s.board.spaces).find((x) => x.boss === DREAM.needs)!;
    const crossed = apply(put(waiting, { bossKills: { [throne.id]: 1 } }), { type: 'door', id: 'd', player: P }, makeRng('d'), NOW);
    expect(me(crossed.state).space).toBe('di-dock');
    expect(crossed.state.board.areas[DREAM.isle.area]).toMatchObject({ city: true, dungeon: true });
    expect(apply(crossed.state, { type: 'roll', id: 'r', player: P }, makeRng('r'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    expect(me(apply(crossed.state, { type: 'stroll', id: 's', player: P, to: DREAM.isle.gate }, makeRng('s'), NOW).state).space).toBe(DREAM.isle.gate);
  });
});

describe('a run laid from a seed (Robin, 2026-11-03: bigger than 18 spots)', () => {
  it('is the same from the same seed, about 45 spots, gate to boss, every spot clear of the others', () => {
    const a = layDream('seed-a', 3, P);
    expect(layDream('seed-a', 3, P)).toEqual(a);
    const count = a.area.hubs.length + a.area.roads.reduce((n, r) => n + r.kinds.length, 0);
    expect(count).toBeGreaterThanOrEqual(38);
    expect(count).toBeLessThanOrEqual(56);
    expect(a.area.hubs[0]).toMatchObject({ kind: 'dream', name: `${DREAM.gateName} 3` });
    expect(a.area.hubs.filter((h) => h.kind === 'boss')).toHaveLength(DREAM.layout.minis.length + 1);
    expect(a.area.hubs.filter((h) => h.kind === 'church')).toHaveLength(DREAM.layout.springs.length);
    expect(a.area.hubs.filter((h) => h.kind === 'chest')).toHaveLength(DREAM.layout.spurs);
    expect(a.area.name).toMatch(/^Depth 3: the /);
    expect(a.area.tier).toBe(dreamRank(3));
  });
  it("takes every land and every palette over many seeds, each palette only on a land it suits, and always lays", () => {
    const themes = new Set<string>();
    const tints = new Set<string>();
    for (let i = 0; i < 120; i++) {
      const laid = layDream(`many-${i}`, 1 + (i % 9), P);
      themes.add(laid.theme);
      tints.add(laid.palette.id);
      expect(DREAM.themes[laid.theme]!.palettes).toContain(laid.palette.id);
    }
    expect(themes).toEqual(new Set(Object.keys(DREAM.themes)));
    expect(tints.size).toBe(DREAM.palettes.length);
  });
  it('gear rank: Crownsteel at depth 1, a rank more every two depths, past Everbright', () => {
    expect([1, 2, 3, 4, 5, 9].map(dreamRank)).toEqual([9, 9, 10, 10, 11, 13]);
  });
});

describe('going in', () => {
  it('only at the Dreamgate, at a depth you have opened', () => {
    const s = dreamer();
    expect(enter(s, 2).events[0]).toMatchObject({ type: 'rejected', reason: 'bad value' });
    expect(enter(put(s, { space: 'di-camp' })).events[0]).toMatchObject({ type: 'rejected' });
    const r = enter(s);
    const id = dreamAreaId(P);
    expect(r.events[0]).toMatchObject({ type: 'dreamEntered', depth: 1, area: id });
    expect(me(r.state)).toMatchObject({ space: `${id}-h0`, dream: { depth: 1, gold: 500 } });
    expect(me(r.state).opened).toContain(id);
    expect(r.state.board.areas[id]).toMatchObject({ dungeon: true, dream: { player: P, depth: 1 } });
    expect(enter(r.state).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(r.state, { type: 'home', id: 'h', player: P }, makeRng('h'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
});

describe('inside a run', () => {
  const inside = (depth = 1): GameState => enter(put(dreamer(), { dreamDepth: depth - 1 }), depth).state;
  /** The first road spot past the gate, landed on until it is a fight. */
  function fightIn(s: GameState): ReturnType<typeof stepTo> {
    const next = s.board.spaces[me(s).space]!.links[0]!;
    for (let i = 0; i < 40; i++) {
      const r = stepTo(s, next, `f${i}`);
      if (me(r.state).fight) return r;
    }
    throw new Error('no fight');
  }
  it("a foe is measured from you and grows with the depth; a run's boss takes its element", () => {
    const one = me(fightIn(inside(1)).state).fight!.enemy;
    const five = me(fightIn(inside(5)).state).fight!.enemy;
    expect(one.level).toBe(DREAM.foes.level + 1);
    expect(one.defense).toBe(0);
    const s = inside(5);
    const area = s.board.areas[dreamAreaId(P)]!;
    expect(five.hp / five.maxHp).toBe(1);
    // A foe at depth 5 is about 28% stronger than at depth 1 (each a random creature of its land, measured the same way).
    expect(five.attack).toBeGreaterThan(one.attack);
    const boss = Object.values(s.board.spaces).find((x) => x.area === area.id && x.name === 'The Dreamer’s Throne')!;
    const met = apply(put(s, { space: boss.links[0]!, steps: 1 }), { type: 'move', id: 'm', player: P, path: [boss.id] }, makeRng('b'), NOW);
    const e = me(met.state).fight!.enemy;
    expect(e.name.startsWith(DREAM.elements[area.dream!.element].prefix)).toBe(true);
    expect(e.trick?.kind).toBe(DREAM.elements[area.dream!.element].trick.kind);
  });
  it('a win gives Dreamdust', () => {
    const won = winFight(fightIn(inside()).state);
    const dust = won.events.find((e): e is Extract<GameEvent, { type: 'dreamdust' }> => e.type === 'dreamdust');
    expect(dust?.delta).toBe(DREAM.foes.mob.dust);
    expect(me(won.state).dreamdust).toBe(DREAM.foes.mob.dust);
  });
  it("the run's boss falling clears the depth: back at the Dreamgate, the run's board gone, the next depth open", () => {
    const s = inside();
    const id = dreamAreaId(P);
    const boss = Object.values(s.board.spaces).find((x) => x.area === id && x.name === 'The Dreamer’s Throne')!;
    const met = apply(put(s, { space: boss.links[0]!, steps: 1 }), { type: 'move', id: 'm', player: P, path: [boss.id] }, makeRng('b'), NOW);
    const won = winFight(met.state);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'dreamEnded', how: 'cleared', depth: 1, to: DREAM.isle.gate }));
    // A boss always drops: what it gives is in the run's colour, worn or carried.
    const tint = s.board.areas[id]!.dream!.tint;
    const loot = won.events.filter((e): e is Extract<GameEvent, { type: 'loot' }> => e.type === 'loot');
    expect(loot.length).toBeGreaterThan(0);
    for (const e of loot) {
      expect(e.gear.dream).toBe(tint);
      expect([...me(won.state).bag, ...Object.values(me(won.state).equipment)].find((g) => g?.id === e.gear.id)?.dream).toBe(tint);
    }
    const c = me(won.state);
    expect(c).toMatchObject({ space: DREAM.isle.gate, dreamDepth: 1 });
    expect(c.dream).toBeUndefined();
    expect(c.opened).not.toContain(id);
    expect(won.state.board.areas[id]).toBeUndefined();
    expect(Object.values(won.state.board.spaces).some((x) => x.area === id)).toBe(false);
    expect(Object.keys(c.cooldowns).some((k) => k.startsWith(`${id}-`))).toBe(false);
    expect(enter(won.state, 2).events[0]).toMatchObject({ type: 'dreamEntered', depth: 2 });
  });
  it("a mini-boss beaten stays beaten for the run", () => {
    const s = inside();
    const id = dreamAreaId(P);
    const mini = Object.values(s.board.spaces).find((x) => x.area === id && x.kind === 'boss' && x.name !== 'The Dreamer’s Throne')!;
    const met = apply(put(s, { space: mini.links[0]!, steps: 1 }), { type: 'move', id: 'm', player: P, path: [mini.id] }, makeRng('b'), NOW);
    expect(me(met.state).fight!.enemy.role).toBe('mini');
    const won = winFight(met.state);
    expect(me(won.state).cooldowns[mini.id]).toBe(Number.MAX_SAFE_INTEGER);
    const again = apply(put(won.state, { space: mini.links[0]!, steps: 1 }), { type: 'move', id: 'm', player: P, path: [mini.id] }, makeRng('b2'), NOW);
    expect(me(again.state).fight).toBeNull();
  });
  it("a fall loses the run's gold and nothing else: at the camp, whole again, the Dreamdust kept", () => {
    const s = put(inside(), { gold: 900, dreamdust: 40 });
    const fight = fightIn(s).state;
    const c = me(fight);
    const doomed = put(fight, { hp: 1, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 1_000_000, maxHp: 1_000_000, attack: 1_000_000, evade: 0 } } });
    const fell = apply(doomed, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('fall'), NOW);
    expect(fell.events).toContainEqual(expect.objectContaining({ type: 'dreamEnded', how: 'fell', gold: 400, to: DREAM.isle.camp }));
    const after = me(fell.state);
    expect(after).toMatchObject({ space: DREAM.isle.camp, gold: 500, dreamdust: 40 });
    expect(after.hp).toBe(stats(after).maxHp);
    expect(after.dreamDepth ?? 0).toBe(0);
  });
  it("a Lucid Bead keeps half the run's gold through a fall", () => {
    const bead = { ...dreamWares().find((w) => w.id === 'lucid-bead')! };
    const s = inside();
    const worn = put(s, { gold: 900, equipment: { ...me(s).equipment, trinket: { id: 'b', slot: 'trinket', rank: 9, rarity: 'epic', name: 'Lucid Bead', base: 'lucid bead', stats: {}, affixes: [], trinket: bead.id, price: 1 } } });
    const fight = fightIn(worn).state;
    const c = me(fight);
    const doomed = put(fight, { hp: 1, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, hp: 1_000_000, maxHp: 1_000_000, attack: 1_000_000, evade: 0 } } });
    const fell = apply(doomed, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' } as never, makeRng('fall'), NOW);
    expect(me(fell.state).gold).toBe(700);
  });
  it('waking up keeps the gold and does not clear the depth', () => {
    const s = put(inside(), { gold: 900 });
    const woke = apply(s, { type: 'dream', id: 'w', player: P, op: 'wake' }, makeRng('w'), NOW);
    expect(woke.events[0]).toMatchObject({ type: 'dreamEnded', how: 'woke', gold: 400, to: DREAM.isle.gate });
    expect(me(woke.state)).toMatchObject({ space: DREAM.isle.gate, gold: 900 });
    expect(me(woke.state).dreamDepth ?? 0).toBe(0);
    expect(apply(dreamer(), { type: 'dream', id: 'w', player: P, op: 'wake' }, makeRng('w'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
  it('a run under way is laid again when an old save is loaded', () => {
    const s = inside();
    const id = dreamAreaId(P);
    const old = JSON.parse(JSON.stringify({ ...s, version: 43 }));
    const up = migrate(old)!;
    expect(up.board.areas[id]).toEqual(s.board.areas[id]);
    expect(me(up).space).toBe(me(s).space);
    expect(up.board.spaces[me(s).space]).toEqual(s.board.spaces[me(s).space]);
  });
});

describe("the camp's merchant", () => {
  const camp = (dust: number, depth = 0): GameState => put(dreamer(), { space: DREAM.isle.camp, dreamdust: dust, dreamDepth: depth, bag: [] });
  it('sells the best flasks and cards for gold', () => {
    const r = apply(camp(0), { type: 'buy', id: 'b', player: P, item: 'potion-5' }, makeRng('b'), NOW);
    expect(r.events[0]).toMatchObject({ type: 'bought', item: 'potion-5' });
    expect(apply(camp(0), { type: 'buy', id: 'b', player: P, item: 'potion' }, makeRng('b'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });
  it("sells the Dream's trinkets for Dreamdust, which are never found", () => {
    const ware = dreamWares()[0]!;
    expect(apply(camp(ware.price - 1), { type: 'dream', id: 'b', player: P, op: 'buy', item: ware.id }, makeRng('b'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough dust' });
    const r = apply(camp(ware.price + 5), { type: 'dream', id: 'b', player: P, op: 'buy', item: ware.id }, makeRng('b'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'dreamdust', delta: -ware.price, dust: 5 }));
    expect(me(r.state).bag[0]).toMatchObject({ trinket: ware.id, dream: DREAM.merchant.tint });
    for (let i = 0; i < 400; i++) expect(TRINKETS[rollTrinket(`t${i}`, 10, 'legendary', makeRng(`t${i}`)).trinket!]!.dream).toBeFalsy();
  });
  it('sells a legendary piece of your choice at the rank of your best depth', () => {
    const r = apply(camp(5000, 5), { type: 'dream', id: 'b', player: P, op: 'buy', slot: 'helm' }, makeRng('b'), NOW);
    const piece = me(r.state).bag[0]!;
    expect(piece).toMatchObject({ slot: 'helm', rarity: 'legendary', rank: dreamRank(5), dream: DREAM.merchant.tint });
    expect(me(r.state).dreamdust).toBe(5000 - (DREAM.merchant.piece + DREAM.merchant.piecePerRank * (dreamRank(5) - DREAM.loot.rankFrom)));
    expect(apply(put(dreamer(), { dreamdust: 5000 }), { type: 'dream', id: 'b', player: P, op: 'buy', slot: 'helm' }, makeRng('b'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not at a shop' });
  });
});
