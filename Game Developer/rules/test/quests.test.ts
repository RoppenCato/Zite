// The hunting grounds, the quest board, the shops by kind, set potions and elixirs (Robin, 2026-11-02).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, groundAt, groundsOf, inTownWalls, placeAt, placeName, ITEMS, makeRng, migrate, newGame, plainGear, questLine, rollGear, shopOffer, startFight, stats } from '../src/index.ts';
import { pointsAlong } from '../src/world.ts';
import type { Action, Character, GameEvent, GameState, Quest } from '../src/types.ts';

const P = 'p1';
const NOW = 1_000_000;
const world = (): GameState => newGame({ seed: 'quests', player: P, name: 'R', classId: 'warrior' });
const me = (s: GameState): Character => s.characters[P]!;
const put = (s: GameState, patch: Partial<Character>): GameState => ({ ...s, characters: { ...s.characters, [P]: { ...me(s), ...patch } } });
const act = (s: GameState, a: Record<string, unknown>, seed: string | number = 'x') => apply(s, { id: 'a', player: P, ...a } as Action, makeRng(seed), NOW);
const has = (events: GameEvent[], type: string) => events.some((e) => e.type === type);

/** Walk one step onto a spot. */
function landOn(s: GameState, space: string, seed: string | number = 'x') {
  const here = s.board.spaces[space]!;
  return apply(put(s, { space: here.links[0]!, steps: 1, last: null } as Partial<Character>), { type: 'move', id: 'm', player: P, path: [space] } as Action, makeRng(seed), NOW);
}

const quest = (patch: Partial<Quest>): Quest => ({ id: 'q', kind: 'kill', town: 'crossroads', area: 'meadows', ground: 'jelly-shallows', target: 'slime', count: 2, done: 0, gold: 40, xp: 30, unique: 0, text: 'Beat 2.', ...patch });

const plainBoard = world().board;

describe('hunting grounds', () => {
  it('cut every hand-laid area into four, each with its own creature and a spot on the map', () => {
    const { board } = world();
    for (const areaId of ['meadows', 'thornwood', 'frostpeak']) {
      const grounds = groundsOf(board, areaId);
      expect(grounds).toHaveLength(4);
      expect(new Set(grounds.map((g) => g.mob)).size).toBe(4);
      for (const g of grounds) {
        expect(board.areas[areaId]!.mobs).toContain(g.mob);
        expect(board.spaces[g.hub]?.area).toBe(areaId);
      }
    }
  });

  it('put a spot in the ground whose named spot is nearest', () => {
    const { board } = world();
    expect(groundAt(board, board.spaces.saltmarsh!)?.mob).toBe('slime');
    expect(groundAt(board, board.spaces.cairn!)?.mob).toBe('bandit');
  });

  it('send you only the ground\'s own creature', () => {
    const s = world();
    const wild = Object.values(s.board.spaces).find((x) => x.kind === 'normal' && !x.name && !inTownWalls(s.board, x) && groundAt(s.board, x)?.mob === 'slime')!;
    let own = 0;
    let fights = 0;
    for (let seed = 0; seed < 300; seed++) {
      const fight = landOn(s, wild.id, seed).events.find((e) => e.type === 'fight');
      // A mini-boss may roam anywhere in the area; the common creatures stay home.
      if (fight?.type !== 'fight' || fight.enemy.role !== 'mob') continue;
      fights += 1;
      if (fight.enemy.id === 'slime') own += 1;
    }
    expect(fights).toBeGreaterThan(100);
    expect(own).toBe(fights);
  });
});

describe('the quest board', () => {
  it('stands on every hand-laid map and offers three different kinds', () => {
    const s = world();
    for (const area of ['meadows', 'thornwood', 'frostpeak']) expect(Object.values(s.board.spaces).filter((x) => x.area === area && x.kind === 'board')).toHaveLength(1);
    const offer = me(landOn(s, 'crossroads').state).offer;
    expect(offer?.kind).toBe('board');
    if (offer?.kind !== 'board') return;
    expect(offer.quests).toHaveLength(3);
    expect(new Set(offer.quests.map((q) => q.kind)).size).toBe(3);
    for (const q of offer.quests) expect(q.text).not.toContain('{');
  });

  it('gives one at a time: choose one, and the board only asks whether to drop it', () => {
    const offered = landOn(world(), 'crossroads').state;
    const offer = me(offered).offer;
    if (offer?.kind !== 'board') throw new Error('no offer');
    const taken = act(offered, { type: 'quest', accept: true, index: 1 });
    expect(me(taken.state).quests).toEqual([offer.quests[1]]);
    expect(me(taken.state).offer).toBeNull();
    const again = landOn(taken.state, 'crossroads').state;
    expect(me(again).offer).toMatchObject({ kind: 'board', quests: [] });
    const dropped = act(again, { type: 'quest', accept: false, drop: true });
    expect(me(dropped.state).quests).toEqual([]);
    expect(has(dropped.events, 'questDeclined')).toBe(true);
  });

  it('leaves the quest alone when you walk off', () => {
    const offered = landOn(put(world(), { quests: [quest({})] }), 'crossroads').state;
    expect(me(act(offered, { type: 'quest', accept: false }).state).quests).toHaveLength(1);
  });
});

describe('walking past the board', () => {
  /** A walk through the crossroads: two steps, the board first. */
  const through = () => {
    const s = world();
    const board = s.board.spaces.crossroads!;
    const before = board.links[0]!;
    const after = board.links.find((id) => id !== before)!;
    return { s: put(s, { space: before, steps: 2 }), path: ['crossroads', after], after };
  };

  it('stops there to choose, and the walk goes on after the answer, whichever it is', () => {
    const { s, path, after } = through();
    const stopped = apply(s, { type: 'move', id: 'm', player: P, path } as Action, makeRng('x'), NOW);
    expect(me(stopped.state)).toMatchObject({ space: 'crossroads', steps: 0, walking: [after], offer: { kind: 'board' } });
    const taken = apply(stopped.state, { type: 'quest', id: 'q', player: P, accept: true, index: 0 } as Action, makeRng('x'), NOW);
    expect(me(taken.state).space).toBe(after);
    expect(me(taken.state).quests).toHaveLength(1);
    expect(me(taken.state).walking).toBeUndefined();
    expect(has(taken.events, 'questTaken')).toBe(true);
    expect(has(taken.events, 'landed')).toBe(true);
    const left = apply(stopped.state, { type: 'quest', id: 'q', player: P, accept: false } as Action, makeRng('x'), NOW);
    expect(me(left.state).space).toBe(after);
    expect(me(left.state).quests).toHaveLength(0);
  });

  it('does not stop you with a quest under way', () => {
    const { s, path, after } = through();
    const r = apply(put(s, { quests: [quest({})] }), { type: 'move', id: 'm', player: P, path } as Action, makeRng('x'), NOW);
    expect(me(r.state).space).toBe(after);
    expect(me(r.state).offer?.kind).not.toBe('board');
  });
});

describe('a quest finished', () => {
  const nearlyWon = (q: Quest, enemy: string) => {
    const s = put(world(), { quests: [q], gold: 0, xp: 0 });
    const fighting = startFight(me(s), enemy, 'saltmarsh', false);
    fighting.fight!.enemy.hp = 1;
    fighting.fight!.enemy.defense = 0;
    return put(s, fighting);
  };

  it('pays at once wherever you stand: xp, gold and a chest better than common', () => {
    const r = act(nearlyWon(quest({ done: 1 }), 'slime'), { type: 'fight', move: { kind: 'attack' }, guard: 'none' });
    expect(has(r.events, 'questProgress')).toBe(true);
    expect(has(r.events, 'questDone')).toBe(true);
    expect(me(r.state).quests).toEqual([]);
    expect(me(r.state).questsDone).toHaveLength(1);
    expect(me(r.state).gold).toBeGreaterThanOrEqual(40);
    const looted = r.events.filter((e) => e.type === 'loot');
    expect(looted.length).toBeGreaterThan(0);
    const chest = looted[looted.length - 1]!;
    if (chest.type === 'loot') expect(chest.gear.rarity).not.toBe('common');
  });

  it('a stranger\'s fall moves nothing', () => {
    const r = act(nearlyWon(quest({}), 'wolf'), { type: 'fight', move: { kind: 'attack' }, guard: 'none' });
    expect(has(r.events, 'questProgress')).toBe(false);
  });

  it('a trophy drops about half the time', () => {
    let got = 0;
    for (let seed = 0; seed < 200; seed++) {
      const r = act(nearlyWon(quest({ kind: 'loot', trophy: 'Jelly Blobs', count: 5 }), 'slime'), { type: 'fight', move: { kind: 'attack' }, guard: 'none' }, seed);
      if (has(r.events, 'questProgress')) got += 1;
    }
    expect(got).toBeGreaterThan(60);
    expect(got).toBeLessThan(140);
  });

  it('a person turns up only on their ground, by chance, and that finishes it', () => {
    const s = put(world(), { quests: [quest({ kind: 'find', count: 1, target: 'Old Bram' })] });
    const own = Object.values(s.board.spaces).find((x) => x.kind === 'normal' && !x.name && !inTownWalls(s.board, x) && groundAt(s.board, x)?.id === 'jelly-shallows')!;
    const other = Object.values(s.board.spaces).find((x) => x.kind === 'normal' && !x.name && !inTownWalls(s.board, x) && groundAt(s.board, x)?.id === 'bandit-thicket')!;
    let found = 0;
    for (let seed = 0; seed < 100; seed++) {
      const r = landOn(s, own.id, seed);
      if (has(r.events, 'personFound')) {
        found += 1;
        expect(has(r.events, 'questDone')).toBe(true);
      }
      expect(has(landOn(s, other.id, seed).events, 'personFound')).toBe(false);
    }
    expect(found).toBeGreaterThan(5);
    expect(found).toBeLessThan(60);
  });

  it('a mini-boss turns up more often while you hunt it', () => {
    const plain = world();
    const hunting = put(plain, { quests: [quest({ kind: 'mini', target: 'wolf-alpha', count: 1 })] });
    const wild = Object.values(plain.board.spaces).find((x) => x.kind === 'normal' && !x.name && x.area === 'meadows' && !inTownWalls(plainBoard, x))!;
    const met = (s: GameState) => {
      let n = 0;
      for (let seed = 0; seed < 300; seed++) {
        const f = landOn(s, wild.id, seed).events.find((e) => e.type === 'fight');
        if (f?.type === 'fight' && f.enemy.id === 'wolf-alpha') n += 1;
      }
      return n;
    };
    expect(met(hunting)).toBeGreaterThan(met(plain) + 25);
  });

  it('says how it stands', () => {
    expect(questLine(quest({ done: 1 }))).toContain('1 of 2');
  });
});

describe('the shops', () => {
  it('an arms shop has leather and tin, a magic shop cloth, a town neither', () => {
    const s = world();
    expect(shopOffer(put(s, { space: 'tinker' }), me(put(s, { space: 'tinker' })))?.lines).toEqual(['light', 'heavy']);
    expect(shopOffer(put(s, { space: 'windy' }), me(put(s, { space: 'windy' })))?.lines).toEqual(['magic']);
    expect(shopOffer(s, me(s))?.lines).toEqual([]);
  });

  it('sells each kind\'s flasks and elixirs, and only this tier\'s and the one before', () => {
    const s = world();
    const arms = shopOffer(put(s, { space: 'tinker' }), me(put(s, { space: 'tinker' })))!.items;
    const magic = shopOffer(put(s, { space: 'windy' }), me(put(s, { space: 'windy' })))!.items;
    expect(arms).toEqual(expect.arrayContaining(['potion', 'elixir-vigor']));
    expect(arms).not.toContain('mana-potion');
    expect(arms).not.toContain('potion-2');
    expect(magic).toEqual(expect.arrayContaining(['mana-potion', 'elixir-arcana', 'elixir-cure']));
    const forest = put(s, { space: 'mossy' });
    expect(shopOffer(forest, me(forest))!.items).toEqual(expect.arrayContaining(['potion', 'potion-2']));
  });

  it('refuses what it does not sell', () => {
    const atMagic = put(world(), { space: 'windy', gold: 500 });
    expect(act(atMagic, { type: 'buy', slot: 'helm', line: 'heavy' }).events[0]).toMatchObject({ type: 'rejected' });
    expect(act(atMagic, { type: 'buy', item: 'potion' }).events[0]).toMatchObject({ type: 'rejected' });
    expect(act(atMagic, { type: 'buy', slot: 'armour' }).events[0]).toMatchObject({ type: 'bought', gear: expect.objectContaining({ name: 'Cloth Robe' }) });
  });

  it('sells only common gear, while a find can be any colour of any kind', () => {
    const r = act(put(world(), { space: 'tinker', gold: 500 }), { type: 'buy', slot: 'helm', line: 'light' });
    const bought = r.events[0];
    if (bought?.type === 'bought') expect(bought.gear).toMatchObject({ name: 'Leather Cap', rarity: 'common', line: 'light' });
    const blue = rollGear('g', 'helm', 1, 2, makeRng('blue'), 'light');
    expect(blue.rarity).not.toBe('common');
    expect(blue.base).toBe('leather cap');
    expect(blue.affixes.some((a) => a.kind === 'crit')).toBe(true);
  });
});

describe('gear by kind', () => {
  it('first weapons are wood; heavy weapons follow the class', () => {
    expect(plainGear('g', 'weapon', 1, 'light').name).toBe('Wooden Stick');
    expect(plainGear('g', 'weapon', 1, 'magic').name).toBe('Wooden Staff');
    expect(plainGear('g', 'weapon', 1, 'heavy', 'rogue').name).toBe('Tin Dagger');
    expect(plainGear('g', 'weapon', 1, 'heavy', 'ranger').name).toBe('Tin Bow');
  });

  it('tin defends more, leather hits and crits more, cloth feeds magic', () => {
    const on = (line: 'heavy' | 'light' | 'magic') => {
      const c = { ...me(world()) };
      const equipment = { ...c.equipment };
      for (const slot of Object.keys(equipment) as (keyof typeof equipment)[]) equipment[slot] = plainGear(slot, slot, 1, line);
      return stats({ ...c, equipment });
    };
    expect(on('heavy').defense).toBeGreaterThan(on('light').defense);
    expect(on('heavy').maxHp).toBeGreaterThan(on('light').maxHp);
    expect(on('light').crit).toBeGreaterThan(on('heavy').crit);
    expect(on('magic').magic).toBeGreaterThan(5);
    expect(on('magic').maxMana).toBeGreaterThan(on('heavy').maxMana);
  });
});

describe('flasks and elixirs', () => {
  it('a potion heals a set amount and the names are plain', () => {
    expect(ITEMS.potion).toMatchObject({ name: 'Health Potion', heal: 50 });
    expect(ITEMS['mana-potion']).toMatchObject({ name: 'Mana Potion', mana: 25 });
    const s = put(world(), { hp: 10, items: { potion: 1 } });
    expect(me(act(s, { type: 'use', item: 'potion' }).state).hp).toBe(60);
  });

  it('an elixir lasts three fights, then is gone', () => {
    let s = put(world(), { items: { 'elixir-vigor': 1 } });
    const before = stats(me(s)).maxHp;
    s = act(s, { type: 'use', item: 'elixir-vigor' }).state;
    expect(stats(me(s)).maxHp).toBe(before + 30);
    const wild = Object.values(s.board.spaces).find((x) => x.kind === 'normal' && !x.name && x.area === 'meadows' && !inTownWalls(plainBoard, x))!;
    for (let fight = 0; fight < 4; fight++) {
      let seed = 0;
      let r = landOn(s, wild.id, seed);
      while (!has(r.events, 'fight')) r = landOn(s, wild.id, ++seed);
      s = put(r.state, { fight: null });
      if (fight < 3) expect(stats(me(s)).maxHp).toBe(before + 30);
    }
    expect(stats(me(s)).maxHp).toBe(before);
  });

  it('a cure elixir clears what you carry and is refused when there is nothing', () => {
    const clean = put(world(), { items: { 'elixir-cure': 1 }, ailments: {} });
    expect(act(clean, { type: 'use', item: 'elixir-cure' }).events[0]).toMatchObject({ type: 'rejected' });
    const sick = put(clean, { ailments: { poison: { rolls: 3, damage: 2 } } });
    expect(me(act(sick, { type: 'use', item: 'elixir-cure' }).state).ailments).toEqual({});
  });
});

describe('a save from before the board', () => {
  it('comes up with the board and the shops laid, errands done paid and the rest gone', () => {
    const s = world();
    const old = { ...put(s, { gold: 10, quests: [{ ...quest({ done: 2, gold: 40 }), kind: 'cull' as never }, { ...quest({}), kind: 'chests' as never }], offer: { kind: 'quest', quest: quest({}) } as never }), version: 14 };
    const up = migrate(JSON.parse(JSON.stringify(old)))!;
    expect(up.version).toBe(20);
    expect(me(up).quests).toEqual([]);
    expect(me(up).gold).toBe(50);
    expect(me(up).offer).toBeNull();
    expect(up.board.spaces.crossroads!.kind).toBe('board');
    expect(up.board.spaces.windy).toMatchObject({ kind: 'shop', stock: 'magic' });
  });
});

describe('a spot you roll for', () => {
  const spot = (s: GameState, kind: string) => Object.values(s.board.spaces).find((x) => x.kind === kind && x.area === 'meadows')!;

  it('asks for a roll, and the timer runs whether you win or lose', () => {
    const s = world();
    const potion = spot(s, 'potion');
    const landed = landOn(s, potion.id);
    expect(me(landed.state).offer).toMatchObject({ kind: 'roll', what: 'flask', need: 4 });
    expect(me(landed.state).cooldowns[potion.id]).toBe(NOW + 300000);
    let won = 0;
    for (let seed = 0; seed < 100; seed++) {
      const r = act(landed.state, { type: 'try' }, seed);
      const tried = r.events.find((e) => e.type === 'tried');
      if (tried?.type !== 'tried') throw new Error('no roll');
      expect(tried.won).toBe(tried.roll >= 4);
      expect(has(r.events, 'found')).toBe(tried.won);
      if (tried.won) won += 1;
      expect(me(r.state).offer).toBeNull();
    }
    expect(won).toBeGreaterThan(30);
    expect(won).toBeLessThan(70);
  });

  it('gives only plain gear worth little', () => {
    const s = world();
    const landed = landOn(s, spot(s, 'gear').id);
    expect(me(landed.state).offer).toMatchObject({ kind: 'roll', what: 'gear' });
    for (let seed = 0; seed < 40; seed++) {
      const r = act(landed.state, { type: 'try' }, seed);
      const loot = r.events.find((e) => e.type === 'loot');
      if (loot?.type !== 'loot') continue;
      expect(loot.gear.rarity).toBe('common');
      expect(loot.gear.price).toBeLessThan(15);
    }
  });

  it('stands on every hand-laid map', () => {
    const s = world();
    for (const area of ['meadows', 'thornwood', 'frostpeak']) expect(Object.values(s.board.spaces).some((x) => x.area === area && x.kind === 'gear')).toBe(true);
  });
});

describe('the coach between towns', () => {
  const at = (space: string, gold: number, visited: string[]) => put(world(), { space, gold, visited, steps: 0 });

  it('goes to a town you have stood in, for a fare, and you land there rested', () => {
    const r = act(at('ashford', 100, ['ashford', 'millford']), { type: 'travel', to: 'millford' });
    expect(r.events[0]).toMatchObject({ type: 'traveled', from: 'ashford', to: 'millford', price: 15, gold: 85 });
    expect(me(r.state)).toMatchObject({ space: 'millford', gold: 85 });
    expect(has(r.events, 'rested')).toBe(true);
  });

  it('charges by the tier of where you are going', () => {
    const r = act(at('ashford', 100, ['ashford', 'brambleford']), { type: 'travel', to: 'brambleford' });
    expect(r.events[0]).toMatchObject({ type: 'traveled', price: 30 });
  });

  it('refuses a town not yet seen, away from a town, or with too little gold', () => {
    expect(act(at('ashford', 100, ['ashford']), { type: 'travel', to: 'millford' }).events[0]).toMatchObject({ type: 'rejected' });
    expect(act(at('tinker', 100, ['ashford', 'millford']), { type: 'travel', to: 'millford' }).events[0]).toMatchObject({ type: 'rejected' });
    expect(act(at('ashford', 5, ['ashford', 'millford']), { type: 'travel', to: 'millford' }).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough gold' });
  });
});

describe('a road that wanders', () => {
  it('spaces its spots evenly along the points it passes through', () => {
    expect(pointsAlong([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 3)).toEqual([{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]);
  });
});

describe('Cloverfield Meadows on the painted land', () => {
  it('holds the spots Mitch, AD laid, where he laid them', () => {
    const data = JSON.parse(readFileSync('assets/world_meadows/meadows.json', 'utf8')) as { spots: { x: number; y: number }[] };
    const own = Object.values(world().board.spaces).filter((s) => s.area === 'meadows');
    expect(own).toHaveLength(data.spots.length);
    for (const s of own) expect(data.spots.some((p) => Math.hypot(p.x - s.x, p.y - s.y) <= 3), s.id).toBe(true);
  });

  it('has a small moment and no fights on a town street, and hunting grounds keep to their creature', () => {
    const s = world();
    const inTown = Object.values(s.board.spaces).find((x) => x.kind === 'normal' && !x.name && inTownWalls(s.board, x))!;
    for (let seed = 0; seed < 30; seed++) {
      const r = landOn(s, inTown.id, seed);
      expect(has(r.events, 'fight')).toBe(false);
      expect(has(r.events, 'themeEvent')).toBe(true);
    }
    expect(placeAt(s.board, s.board.spaces.saltmarsh!)).toBe('jelly-shallows');
  });
});

describe('Wobblewood on the painted land', () => {
  const data = JSON.parse(readFileSync('assets/world_forest/wobblewood.json', 'utf8')) as { spots: { x: number; y: number; hub?: string }[] };
  const own = Object.values(world().board.spaces).filter((s) => s.area === 'thornwood');

  it('holds the spots Mitch, AD laid, where they laid them', () => {
    for (const p of data.spots) expect(own.some((s) => Math.hypot(p.x - s.x, p.y - s.y) <= 3), `${p.x},${p.y}`).toBe(true);
    // The entry road's first two stand on the Meadows' side of the river, outside the forest's list.
    for (const s of own.filter((x) => !['gate-edge-1', 'gate-edge-2'].includes(x.id))) expect(data.spots.some((p) => Math.hypot(p.x - s.x, p.y - s.y) <= 3), s.id).toBe(true);
  });

  it('hunts in Owl Hollow, and not on a town street', () => {
    const s = world();
    const owl = own.find((x) => x.kind === 'normal' && !x.name && placeAt(s.board, x) === 'owl-hollow')!;
    expect(inTownWalls(s.board, owl)).toBe(false);
    expect(placeName(s.board, owl)).toBe('Owl Hollow');
    expect(groundAt(s.board, owl)).not.toBeNull();
    const street = own.find((x) => x.kind === 'normal' && !x.name && placeAt(s.board, x) === 'oakshade')!;
    expect(inTownWalls(s.board, street)).toBe(true);
    expect(placeName(s.board, street)).toBe('Oakshade');
  });
});

describe('Honeyhill on the painted land', () => {
  const data = JSON.parse(readFileSync('assets/world_harvest/honeyhill.json', 'utf8')) as { spots: { x: number; y: number }[] };
  const own = Object.values(world().board.spaces).filter((s) => s.area === 'frostpeak');

  it('holds the spots Mitch, AD laid, where they laid them', () => {
    for (const p of data.spots) expect(own.some((s) => Math.hypot(p.x - s.x, p.y - s.y) <= 3), `${p.x},${p.y}`).toBe(true);
    // The entry road's first spots stand on the forest's side of y 3072, outside this list.
    for (const s of own.filter((x) => x.y < 3072)) expect(data.spots.some((p) => Math.hypot(p.x - s.x, p.y - s.y) <= 3), s.id).toBe(true);
  });

  it('hunts in Scarecrow Rows, and not on a town street', () => {
    const s = world();
    const rows = own.find((x) => x.kind === 'normal' && !x.name && placeAt(s.board, x) === 'scarecrow-rows')!;
    expect(inTownWalls(s.board, rows)).toBe(false);
    expect(placeName(s.board, rows)).toBe('Scarecrow Rows');
    const street = own.find((x) => x.kind === 'normal' && !x.name && placeAt(s.board, x) === 'honeybell')!;
    expect(inTownWalls(s.board, street)).toBe(true);
  });
});
