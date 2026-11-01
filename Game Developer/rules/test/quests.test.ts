// The towns' errands (mine, 2026-11-01, from Robin's list): offered in a town, taken or declined, moved along by what
// happens, paid back in town; the trainer in the same town; the bag's limit and the question it asks.
import { describe, expect, it } from 'vitest';
import { ABILITIES, GEAR, PROGRESSION, QUESTS } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { addLoot } from '../src/common.ts';
import { plainGear } from '../src/gear.ts';
import { hintFor } from '../src/hints.ts';
import { newQuest, questLine } from '../src/quests.ts';
import { makeRng } from '../src/rng.ts';
import type { Action, Character, GameEvent, GameState, Quest } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const me = (s: GameState): Character => s.characters[P]!;
const move = (path: string[], id = 'm1'): Action => ({ type: 'move', id, player: P, path });

/** On the ring: s0 is the town, s1 the wilds, s5 the chest, s10 the boss; a character a step away from `space`. */
function about(space: string, patch: Partial<Character> = {}, steps = 1): GameState {
  const s = newGame({ seed: 'errand', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
  return { ...s, characters: { [P]: { ...me(s), space, steps, ...patch } }, die: { ...s.die, last: steps } };
}
/** Into the town from s11, one step. */
const intoTown = (patch: Partial<Character> = {}, now = NOW, seed = 'errand') => apply(about('s11', patch), move(['s0']), makeRng(seed), now);

describe('an errand from the town', () => {
  it('is offered on landing in a town with none from there, as an offer the board waits on', () => {
    const r = intoTown();
    const offer = me(r.state).offer;
    expect(offer?.kind).toBe('quest');
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'offer', offer }));
    const q = (offer as { quest: Quest }).quest;
    expect(q).toMatchObject({ id: 's0', town: 's0', area: 'ring', done: 0 });
    expect(['cull', 'chests', 'hunt', 'boss']).toContain(q.kind);
    expect(q.count).toBeGreaterThanOrEqual(1);
    expect(q.gold).toBe(QUESTS.kinds[q.kind].gold * q.count); // the ring is tier 1
    expect(q.text.length).toBeGreaterThan(10);
    expect(apply(r.state, { type: 'roll', id: 'r', player: P }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'answer first' });
  });

  it('draws every kind the area can give, each with its target, from the stream', () => {
    const s = about('s11');
    const kinds = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const q = newQuest(s, me(s), s.board.spaces.s0!, makeRng(`q-${i}`))!;
      kinds.add(q.kind);
      if (q.kind === 'cull') expect(s.board.areas.ring!.mobs).toContain(q.target);
      if (q.kind === 'hunt') expect(s.board.areas.ring!.miniBosses).toContain(q.target);
      if (q.kind === 'boss') expect(q.target).toBe('thornwood-warden');
      if (q.kind === 'chests') expect(q.target).toBeNull();
      expect(q.text).not.toContain('{');
    }
    expect([...kinds].sort()).toEqual(['boss', 'chests', 'cull', 'hunt']);
  });

  it('taken, it is carried; declined, the town waits ten minutes before asking again; three at most are carried', () => {
    const offered = intoTown();
    const taken = apply(offered.state, { type: 'quest', id: 'q', player: P, accept: true }, makeRng('x'), NOW);
    expect(taken.events[0]).toMatchObject({ type: 'questTaken' });
    expect(me(taken.state).quests).toHaveLength(1);
    expect(me(taken.state).offer).toBeNull();
    // Back in the town with it unfinished: told how it stands, not offered another.
    const back = apply({ ...taken.state, characters: { [P]: { ...me(taken.state), space: 's11', steps: 1 } } }, move(['s0'], 'm2'), makeRng('x'), NOW);
    expect(back.events).toContainEqual(expect.objectContaining({ type: 'nothing', text: expect.stringContaining('Your errand here') }));
    expect(me(back.state).offer).toBeNull();
    const declined = apply(offered.state, { type: 'quest', id: 'q', player: P, accept: false }, makeRng('x'), NOW);
    expect(declined.events[0]).toMatchObject({ type: 'questDeclined' });
    expect(me(declined.state).cooldowns['quest:s0']).toBe(NOW + QUESTS.cooldownMs);
    const soon = apply({ ...declined.state, characters: { [P]: { ...me(declined.state), space: 's11', steps: 1 } } }, move(['s0'], 'm3'), makeRng('x'), NOW + 1000);
    expect(me(soon.state).offer).toBeNull();
    const later = apply({ ...declined.state, characters: { [P]: { ...me(declined.state), space: 's11', steps: 1 } } }, move(['s0'], 'm4'), makeRng('x'), NOW + QUESTS.cooldownMs + 1);
    expect(me(later.state).offer?.kind).toBe('quest');
    const full = { ...me(offered.state), offer: null, quests: [1, 2, 3].map((n) => ({ ...(me(offered.state).offer as { quest: Quest }).quest, id: `t${n}`, town: `t${n}` })) };
    const noRoom = apply({ ...offered.state, characters: { [P]: { ...full, space: 's11', steps: 1 } } }, move(['s0'], 'm5'), makeRng('x'), NOW);
    expect(me(noRoom.state).offer).toBeNull();
    expect(apply(offered.state, { type: 'gamble', id: 'g', player: P, choice: 'high' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
    expect(apply(taken.state, { type: 'quest', id: 'q2', player: P, accept: true }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
  });

  it('moves along when its creature falls or a chest of its area opens, and says so; a stranger\'s fall does nothing', () => {
    const cull: Quest = { id: 's0', kind: 'cull', town: 's0', area: 'ring', target: 'slime', count: 2, done: 0, gold: 24, xp: 16, unique: 0, text: 'Thin the Slimes: beat 2 of them.' };
    const chests: Quest = { id: 'tX', kind: 'chests', town: 'tX', area: 'ring', target: null, count: 1, done: 0, gold: 20, xp: 10, unique: 0, text: 'Open 1 chest in the ring.' };
    const s = about('s1', { quests: [cull, chests] });
    const fighting = { ...s, characters: { [P]: startFight({ ...me(s), steps: 0 }, 'slime', 's1', false) } };
    const nearly = { ...fighting, characters: { [P]: { ...me(fighting), fight: { ...me(fighting).fight!, enemy: { ...me(fighting).fight!.enemy, hp: 1 } } } } };
    const won = apply(nearly, { type: 'fight', id: 'f', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('x'), NOW);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'questProgress', quest: expect.objectContaining({ id: 's0', done: 1 }) }));
    expect(me(won.state).quests[0]!.done).toBe(1);
    expect(me(won.state).quests[1]!.done).toBe(0);
    const wolfState = { ...fighting, characters: { [P]: startFight({ ...me(s), steps: 0 }, 'wolf', 's1', false) } };
    const wolfDown = { ...wolfState, characters: { [P]: { ...me(wolfState), fight: { ...me(wolfState).fight!, enemy: { ...me(wolfState).fight!.enemy, hp: 1 } } } } };
    const stranger = apply(wolfDown, { type: 'fight', id: 'f2', player: P, move: { kind: 'attack' }, guard: 'none' }, makeRng('x'), NOW);
    expect(stranger.events.some((e) => e.type === 'questProgress')).toBe(false);
    const opened = apply(about('s4', { quests: [cull, chests] }), move(['s5']), makeRng('x'), NOW);
    expect(opened.events).toContainEqual(expect.objectContaining({ type: 'questProgress', quest: expect.objectContaining({ id: 'tX', done: 1 }) }));
    expect(questLine(me(opened.state).quests[1]!)).toContain('Done: back to town');
  });

  it('pays in its town when done: gold, xp, maybe a unique; then the town waits before asking again', () => {
    const boss: Quest = { id: 's0', kind: 'boss', town: 's0', area: 'ring', target: 'thornwood-warden', count: 1, done: 1, gold: 90, xp: 60, unique: 1, text: 'Bring down Thornwood Warden.' };
    const r = intoTown({ quests: [boss], gold: 10, xp: 0 });
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'questDone', quest: expect.objectContaining({ id: 's0' }) }));
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'gold', delta: 90, gold: 100 }));
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'levelled', level: 2 }));
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'loot', gear: expect.objectContaining({ rarity: 'unique' }) }));
    expect(me(r.state).quests).toEqual([]);
    expect(me(r.state).cooldowns['quest:s0']).toBe(NOW + QUESTS.cooldownMs);
    expect(me(r.state).offer).toBeNull();
  });

  it('shows in the town\'s hint', () => {
    const cull: Quest = { id: 's0', kind: 'cull', town: 's0', area: 'ring', target: 'slime', count: 2, done: 1, gold: 24, xp: 16, unique: 0, text: 'Thin the Slimes: beat 2 of them.' };
    expect(hintFor(about('s11'), 's0', P, NOW)).toContain('Someone here may have an errand.');
    expect(hintFor(about('s11', { quests: [cull] }), 's0', P, NOW)).toContain('Your errand: Thin the Slimes: beat 2 of them. 1 of 2.');
    expect(hintFor(about('s11', { cooldowns: { 'quest:s0': NOW + 1000 } }), 's0', P, NOW)).not.toContain('errand');
  });
});

describe('the trainer in the town', () => {
  it('teaches an ability of the class for the tier\'s price, raises a rank for more, and refuses what it cannot', () => {
    const s = about('s0', { gold: 500 }, 0);
    const learn = apply(s, { type: 'buy', id: 'b', player: P, ability: 'war-cry' }, makeRng('x'), NOW);
    expect(learn.events[0]).toEqual({ type: 'trained', action: 'b', player: P, ability: 'war-cry', rank: 1, price: PROGRESSION.training.learn, gold: 500 - PROGRESSION.training.learn });
    expect(me(learn.state).abilities['war-cry']).toBe(1);
    const raise = apply(learn.state, { type: 'buy', id: 'b2', player: P, ability: 'war-cry' }, makeRng('x'), NOW);
    expect(raise.events[0]).toMatchObject({ type: 'trained', rank: 2, price: PROGRESSION.training.rank });
    const top = apply({ ...s, characters: { [P]: { ...me(s), abilities: { 'war-cry': 3 } } } }, { type: 'buy', id: 'b3', player: P, ability: 'war-cry' }, makeRng('x'), NOW);
    expect(top.events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    expect(apply(s, { type: 'buy', id: 'b4', player: P, ability: 'fireball' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such ability' });
    expect(apply(about('s0', { gold: 5 }, 0), { type: 'buy', id: 'b5', player: P, ability: 'war-cry' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
    expect(apply(about('s2', { gold: 500 }, 0), { type: 'buy', id: 'b6', player: P, ability: 'war-cry' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not in a town' });
    expect(Object.keys(ABILITIES).filter((a) => ABILITIES[a]!.classId === 'warrior')).toContain('war-cry');
  });
});

describe('the bag\'s limit', () => {
  const full = Array.from({ length: GEAR.bagLimit }, (_, i) => plainGear(`b${i}`, 'helm', 1));

  it('a piece with no room waits as an offer to be sold or left; buying gear is refused; a second piece is sold at once', () => {
    const s = about('s4', { bag: full });
    const chest = apply(s, move(['s5']), makeRng('ashford'), NOW); // the seed that drops gear from this chest
    const loot = chest.events.find((e) => e.type === 'loot');
    expect(loot).toBeDefined();
    expect(chest.events).toContainEqual(expect.objectContaining({ type: 'bagFull', sold: null }));
    expect(me(chest.state).bag).toHaveLength(GEAR.bagLimit);
    expect(me(chest.state).offer?.kind).toBe('loot');
    const gear = (me(chest.state).offer as { gear: { id: string; price: number } }).gear;
    const sold = apply(chest.state, { type: 'keep', id: 'k', player: P, choice: 'sell' }, makeRng('x'), NOW);
    expect(sold.events[0]).toMatchObject({ type: 'sold', gear: expect.objectContaining({ id: gear.id }), price: Math.max(1, Math.round(gear.price * GEAR.sellShare)) });
    expect(me(sold.state).offer).toBeNull();
    const dropped = apply(chest.state, { type: 'keep', id: 'k2', player: P, choice: 'drop' }, makeRng('x'), NOW);
    expect(dropped.events[0]).toMatchObject({ type: 'dropped', gear: expect.objectContaining({ id: gear.id }) });
    expect(me(dropped.state).gold).toBe(me(chest.state).gold);
    expect(apply(about('s0', { bag: full, gold: 500 }, 0), { type: 'buy', id: 'b', player: P, slot: 'weapon' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'bag full' });
    expect(apply(s, { type: 'keep', id: 'k3', player: P, choice: 'sell' }, makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'nothing to answer' });
    // With a question already pending, the piece is sold on the spot.
    const events: GameEvent[] = [];
    const busy = { ...me(s), offer: { kind: 'gamble' as const, stake: 10 } };
    const extra = plainGear('x', 'boots', 2);
    const after = addLoot(busy, extra, { type: 'roll', id: 'a', player: P }, events);
    expect(events).toEqual([expect.objectContaining({ type: 'loot', gear: extra }), expect.objectContaining({ type: 'bagFull', gear: extra, sold: Math.max(1, Math.round(extra.price * GEAR.sellShare)) })]);
    expect(after.gold).toBe(busy.gold + Math.max(1, Math.round(extra.price * GEAR.sellShare)));
    expect(after.bag).toHaveLength(GEAR.bagLimit);
    expect(after.offer?.kind).toBe('gamble');
  });
});

describe('the flasks', () => {
  it('a potion heals four tenths of max HP and a mana potion gives back half the mana; the spring gives one of each', () => {
    const s = about('s1', { hp: 10, mana: 2, items: { potion: 1, 'mana-potion': 1 } }, 0);
    const fighting = { ...s, characters: { [P]: startFight(me(s), 'slime', 's1', false) } };
    const drank = apply(fighting, { type: 'fight', id: 'f', player: P, move: { kind: 'item', item: 'potion' }, guard: 'block' }, makeRng('x'), NOW);
    expect(drank.events[1]).toMatchObject({ type: 'healed', amount: 48, hp: 58 });
    const sipped = apply(fighting, { type: 'fight', id: 'f2', player: P, move: { kind: 'item', item: 'mana-potion' }, guard: 'block' }, makeRng('x'), NOW);
    expect(sipped.events[1]).toMatchObject({ type: 'mana', delta: 10, mana: 12 });
    const spring = apply(about('s7'), move(['s8']), makeRng('x'), NOW);
    expect(spring.events).toContainEqual(expect.objectContaining({ type: 'found', item: 'potion', count: 1 }));
    expect(spring.events).toContainEqual(expect.objectContaining({ type: 'found', item: 'mana-potion', count: 1 }));
  });
});
