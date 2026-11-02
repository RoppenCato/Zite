// Uniques (Robin, 2026-10-31: loot with effects that change how you play; bosses give better loot): the pieces, their
// powers one by one, what bosses and minis drop, and the save coming up from version 6.
import { describe, expect, it } from 'vitest';
import { GEAR, PROGRESSION, UNIQUES, UNIQUE_IDS } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, makeBoard, newGame } from '../src/game.ts';
import { describeGear, makeUnique, rankPrice, rankStat, rollGear, rollUnique, stats, uniquePool } from '../src/gear.ts';
import { makeRng } from '../src/rng.ts';
import { migrate } from '../src/save.ts';
import { SLOTS, type Action, type Character, type ClassId, type Enemy, type EnemyMove, type FightMove, type GameEvent, type GameState, type Guard, type PowerKind } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const turn = (move: FightMove, guard: Guard = 'none', id = 'f1'): Action => ({ type: 'fight', id, player: P, move, guard });
const attack: FightMove = { kind: 'attack' };
const ability = (a: string): FightMove => ({ kind: 'ability', ability: a });
const me = (s: GameState): Character => s.characters[P]!;
const fight = (s: GameState) => me(s).fight!;
const hits = (events: GameEvent[], by: 'player' | 'enemy') => events.filter((e): e is Extract<GameEvent, { type: 'hit' }> => e.type === 'hit' && e.by === by);
const bite: EnemyMove = { name: 'Bite', power: 1, weight: 1 };
const NO_GEAR = { weapon: null, shield: null, helm: null, armour: null, gloves: null, boots: null, cape: null, trinket: null };

/** The unique worn alone, at rank 1, by a character of the class; the fight patched by hand. */
function wearing(uniqueId: string, classId: ClassId = 'warrior', patch: Partial<Character> = {}): Character {
  const s = newGame({ seed: 'u', player: P, name: 'Robin', classId, board: ringBoard() });
  const u = makeUnique('u1', uniqueId, 1, makeRng(uniqueId));
  return { ...me(s), equipment: { ...NO_GEAR, [u.slot]: u }, ...patch };
}
function versus(c: Character, enemy: string, enemyPatch: Partial<Enemy> = {}, fightPatch: object = {}): GameState {
  const s = newGame({ seed: 'u', player: P, name: 'Robin', classId: c.classId, board: ringBoard() });
  const fighting = startFight({ ...c, space: 's1' }, enemy, 's1', false);
  fighting.fight = { ...fighting.fight!, ...fightPatch, enemy: { ...fighting.fight!.enemy, ...enemyPatch } };
  return { ...s, characters: { [P]: fighting } };
}

const POWERS: PowerKind[] = ['twinStrike', 'quickdraw', 'frostbrand', 'venom', 'arcane', 'bloodthirst', 'thunder', 'sunblade', 'ward', 'mirror', 'bulwark', 'secondWind', 'scholar', 'ironbrow', 'strider', 'windstep', 'pathfinder', 'greed', 'regen', 'manaWell', 'lucky', 'phoenix', 'fury'];

describe('the uniques', () => {
  it('each have a slot, a tier, a power the rules know and a line of text; every power is some unique\'s', () => {
    expect(UNIQUE_IDS.length).toBeGreaterThanOrEqual(20);
    for (const id of UNIQUE_IDS) {
      const u = UNIQUES[id]!;
      expect(SLOTS, id).toContain(u.slot);
      expect(u.tier, id).toBeGreaterThanOrEqual(1);
      expect(u.power || u.traits, id).toBeTruthy();
      if (u.power) expect(POWERS, id).toContain(u.power);
      expect(u.text.length, id).toBeGreaterThan(10);
      expect(u.name.length, id).toBeGreaterThan(2);
    }
    for (const p of POWERS) expect(UNIQUE_IDS.some((id) => UNIQUES[id]!.power === p), p).toBe(true);
  });

  it('are made at a rank with a unique\'s number, one affix, their name and their text, never rolled by chance', () => {
    const g = makeUnique('x', 'twinfang', 3, makeRng('m'));
    expect(g).toMatchObject({ id: 'x', slot: 'weapon', rank: 3, rarity: 'unique', name: 'Twinstinger', base: 'iron sword', unique: 'twinfang', price: Math.round(rankPrice('weapon', 3) * GEAR.rarities.unique.priceMult) });
    expect(g.stats.attack).toBeGreaterThanOrEqual(Math.floor(rankStat('weapon', 3) * GEAR.rarities.unique.mult * (1 - GEAR.roll)));
    expect(g.stats.attack).toBeLessThanOrEqual(Math.ceil(rankStat('weapon', 3) * GEAR.rarities.unique.mult * (1 + GEAR.roll)));
    expect(g.affixes).toHaveLength(1);
    expect(describeGear(g)).toContain('Twinstinger, iron sword · unique');
    expect(describeGear(g)).toContain(UNIQUES.twinfang!.text);
    expect(() => makeUnique('x', 'excalibur', 1, makeRng('m'))).toThrow(/no such unique/);
    for (let i = 0; i < 500; i++) expect(rollGear(`r${i}`, 'weapon', 1, 0, makeRng(`r${i}`)).rarity).not.toBe('unique');
    expect(uniquePool(1).sort()).toEqual(UNIQUE_IDS.filter((id) => UNIQUES[id]!.tier <= 1).sort());
    expect(uniquePool(1)).toEqual(expect.arrayContaining(['misers-coin', 'twinfang']));
    expect(uniquePool(5).length).toBeGreaterThan(uniquePool(1).length);
    expect(rollUnique('y', 0, 1, makeRng('m'))).toBeNull();
  });

  it('a legendary carries two different affixes', () => {
    for (let i = 0; i < 30; i++) {
      const g = rollGear(`l${i}`, 'armour', 2, 99, makeRng(`l${i}`));
      expect(g.rarity).toBe('legendary');
      expect(g.affixes).toHaveLength(2);
      expect(g.affixes[0]!.kind).not.toBe(g.affixes[1]!.kind);
    }
  });
});

describe('what the fallen leave', () => {
  const dropsFrom = (enemy: string, seeds: number) => {
    const rarities: string[] = [];
    for (let i = 0; i < seeds; i++) {
      const s = versus(wearing('striders'), enemy, { hp: 1 });
      const r = apply(s, turn(attack), makeRng(`drop-${enemy}-${i}`), NOW);
      for (const e of r.events) if (e.type === 'loot') rarities.push(e.gear.rarity);
    }
    return rarities;
  };

  it('a boss always drops, a unique about one time in four and nothing under epic otherwise; a mini rare and up with a unique now and then; a mob no unique', () => {
    const boss = dropsFrom('thornwood-warden', 60);
    expect(boss).toHaveLength(60);
    const uniques = boss.filter((r) => r === 'unique').length;
    expect(uniques).toBeGreaterThan(5);
    expect(uniques).toBeLessThan(28);
    for (const r of boss) expect(['unique', 'epic', 'legendary']).toContain(r);
    const mini = dropsFrom('wolf-alpha', 80);
    for (const r of mini) expect(['unique', 'rare', 'epic', 'legendary']).toContain(r);
    expect(mini.some((r) => r === 'unique')).toBe(true);
    const mob = dropsFrom('slime', 200);
    expect(mob.length).toBeGreaterThan(5);
    expect(mob).not.toContain('unique');
  });
});

describe('the powers', () => {
  it("Twinstinger strikes twice; Hare's Edge crits first and the enemy holds back that round", () => {
    const twin = apply(versus(wearing('twinfang'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(hits(twin.events, 'player').map((h) => h.move)).toEqual(['Attack', 'Attack']);
    const quick = apply(versus(wearing('quickdraw'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(hits(quick.events, 'player')[0]!.crit).toBe(true);
    expect(hits(quick.events, 'enemy')).toHaveLength(0);
    expect(fight(quick.state).used).toContain('quickdraw');
    const second = apply(quick.state, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(hits(second.events, 'enemy')).toHaveLength(1);
  });

  it('Icicle chills every hit; Nettlefang poisons; the Crownbreaker hits bosses harder; Thunderclap crits every third hit', () => {
    const chilled = apply(versus(wearing('frostbrand'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(chilled.events).toContainEqual(expect.objectContaining({ type: 'effect', target: 'enemy', kind: 'weakened', rounds: 1 }));
    const venom = apply(versus(wearing('venomtooth'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(venom.events).toContainEqual(expect.objectContaining({ type: 'effect', target: 'enemy', kind: 'poison', rounds: 2 }));
    expect(venom.events).toContainEqual(expect.objectContaining({ type: 'poisoned', target: 'enemy' }));
    expect(fight(venom.state).enemy.poison).toMatchObject({ rounds: 1 }); // one bite taken this round
    const sun = wearing('sunblade', 'warrior', { attack: 50 });
    const onBoss = hits(apply(versus(sun, 'thornwood-warden', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW).events, 'player')[0]!;
    if (!onBoss.crit) expect(onBoss.damage).toBeGreaterThanOrEqual(Math.round((50 + sun.equipment.weapon!.stats.attack!) * 1.3) - 4 - 2);
    let s = versus(wearing('stormcaller'), 'slime', { hp: 5000, next: bite });
    const crits: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const r = apply(s, turn(attack, 'none', `f${i}`), makeRng('nocrit'), NOW);
      crits.push(hits(r.events, 'player')[0]!.crit);
      s = r.state;
    }
    expect(crits[2]).toBe(true);
    expect(fight(s).strikes).toBe(3);
  });

  it('Moonquill halves mana costs and softens abilities; Grudgeblade grows with the HP missing', () => {
    const shard = wearing('mindshard', 'mage', { abilities: { fireball: 1 } });
    const r = apply(versus(shard, 'slime', { hp: 5000, next: bite }), turn(ability('fireball')), makeRng('x'), NOW);
    expect(r.events[0]).toMatchObject({ type: 'mana', delta: -4 });
    const full = wearing('gorefang');
    const half = { ...full, hp: 60 };
    expect(stats(half).attack).toBe(Math.round(stats(full).attack * 1.3));
    expect(stats({ ...full, hp: 1 }).attack).toBeLessThanOrEqual(Math.round(stats(full).attack * 1.6));
  });

  it('Hedgehog Coat turns the first wound-up blow aside; Mirrorcoat throws back half of what is blocked; Bramblehide softens blows under half HP', () => {
    const ward = versus(wearing('wardweave'), 'wolf-alpha', { hp: 5000, charged: 'Howl', next: bite }, { round: 2 });
    const r = apply(ward, turn(attack, 'none'), makeRng('x'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'missed', by: 'enemy', move: 'Howl' }));
    expect(fight(r.state).used).toContain('ward');
    const again = apply({ ...r.state, characters: { [P]: { ...me(r.state), fight: { ...fight(r.state), enemy: { ...fight(r.state).enemy, charged: 'Howl', next: bite } } } } }, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(hits(again.events, 'enemy')[0]).toMatchObject({ move: 'Howl' });
    const mirror = apply(versus(wearing('mirrormail'), 'wolf-alpha', { hp: 5000, attack: 40, next: bite }, { round: 2 }), turn(attack, 'block'), makeRng('x'), NOW);
    const blow = hits(mirror.events, 'enemy')[0]!;
    const back = mirror.events.find((e) => e.type === 'countered');
    expect(back).toBeDefined();
    if (back?.type === 'countered') expect(back.damage).toBe(Math.max(1, Math.round((Math.ceil(blow.damage / 0.5) - blow.damage) * 0.5)));
    const hide = wearing('thornhide', 'warrior', { hp: 30 });
    const soft = hits(apply(versus(hide, 'wolf-alpha', { hp: 5000, attack: 40, next: bite }, { round: 2 }), turn(attack, 'none'), makeRng('x'), NOW).events, 'enemy')[0]!;
    const bare = hits(apply(versus({ ...hide, equipment: NO_GEAR }, 'wolf-alpha', { hp: 5000, attack: 40, next: bite }, { round: 2 }), turn(attack, 'none'), makeRng('x'), NOW).events, 'enemy')[0]!;
    expect(soft.damage).toBeLessThan(bare.damage);
  });

  it("the Rooster's Crest catches a fall under a quarter once a fight; the Phoenix Feather raises the fallen once every half hour", () => {
    const helm = versus(wearing('phoenix-helm', 'warrior', { hp: 40 }), 'wolf-alpha', { hp: 5000, attack: 400, next: bite }, { round: 2 });
    const r = apply(helm, turn(attack, 'none'), makeRng('x'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'revived', by: 'secondWind' }));
    expect(me(r.state).hp).toBeGreaterThan(0);
    expect(me(r.state).fight).not.toBeNull();
    const again = apply({ ...r.state, characters: { [P]: { ...me(r.state), fight: { ...fight(r.state), enemy: { ...fight(r.state).enemy, next: bite } } } } }, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(again.events.some((e) => e.type === 'died')).toBe(true);
    const feather = versus(wearing('phoenix-feather'), 'wolf-alpha', { hp: 5000, attack: 4000, next: bite }, { round: 2 });
    const rose = apply(feather, turn(attack, 'none'), makeRng('x'), NOW);
    expect(rose.events).toContainEqual(expect.objectContaining({ type: 'revived', by: 'phoenix' }));
    expect(me(rose.state).hp).toBe(Math.round(stats(me(rose.state)).maxHp * 0.5));
    expect(me(rose.state).cooldowns.phoenix).toBe(NOW + 1_800_000);
    const fell = apply({ ...rose.state, characters: { [P]: { ...me(rose.state), fight: { ...fight(rose.state), enemy: { ...fight(rose.state).enemy, next: bite } } } } }, turn(attack, 'none', 'f2'), makeRng('x'), NOW);
    expect(fell.events.some((e) => e.type === 'died')).toBe(true);
  });

  it("the Owl's Crown adds half the xp; the Dragon's Penny doubles the gold and halves the xp; Kettle Hat makes a crit a plain hit", () => {
    const sage = apply(versus(wearing('sages-crown'), 'slime', { hp: 1 }), turn(attack), makeRng('x'), NOW);
    expect(sage.events).toContainEqual(expect.objectContaining({ type: 'won', xp: 8, gold: 3 }));
    const miser = apply(versus(wearing('misers-coin'), 'slime', { hp: 1 }), turn(attack), makeRng('x'), NOW);
    expect(miser.events).toContainEqual(expect.objectContaining({ type: 'won', xp: 3, gold: 6 }));
    let resisted = 0;
    for (let i = 0; i < 120; i++) {
      const r = apply(versus(wearing('ironbrow'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng(`brow-${i}`), NOW);
      for (const h of hits(r.events, 'enemy')) expect(h.crit).toBe(false);
      if (r.events.some((e) => e.type === 'resisted' && e.kind === 'crit')) resisted++;
    }
    expect(resisted).toBeGreaterThan(3);
  });

  it("Seven-League Boots turn a one into two; Dancing Shoes starts a fight with a step aside; Wanderers halve a spot's wait; the Rabbit's Foot re-rolls once in a while", () => {
    const strider = newGame({ seed: 's', player: P, name: 'Robin', classId: 'warrior', board: ringBoard() });
    const shod = { ...strider, characters: { [P]: wearing('striders') } };
    let ones = 0;
    for (let i = 0; i < 60 && !ones; i++) {
      const r = apply(shod, { type: 'roll', id: 'r', player: P }, makeRng(`roll-${i}`), NOW);
      const rolled = r.events[0];
      if (rolled?.type === 'rolled' && rolled.value === 1) {
        ones++;
        expect(r.events[1]).toMatchObject({ type: 'steps', steps: 2 });
        expect(me(r.state).steps).toBe(2);
        expect(r.state.die.last).toBe(2);
      }
    }
    expect(ones).toBe(1);
    expect(startFight(wearing('windstep'), 'slime', 's1', false).fight!.evade).toBe(1);
    const walker = { ...strider, characters: { [P]: { ...wearing('pathfinders'), space: 's4', steps: 1 } }, die: { ...strider.die, last: 1 } };
    const chest = apply(walker, { type: 'move', id: 'm', player: P, path: ['s5'] }, makeRng('c'), NOW);
    expect(me(chest.state).cooldowns.s5).toBe(NOW + 300000);
    const charmed = { ...strider, characters: { [P]: { ...wearing('lucky-charm'), steps: 3 } } };
    const r = apply(charmed, { type: 'use', id: 'u', player: P, item: 'charm' }, makeRng('charm'), NOW);
    expect(r.events[0]).toMatchObject({ type: 'used', item: 'charm' });
    expect(r.events[1]).toMatchObject({ type: 'steps' });
    expect(me(r.state).cooldowns.charm).toBe(NOW + 300000);
    expect(apply(r.state, { type: 'use', id: 'u2', player: P, item: 'charm' }, makeRng('charm'), NOW + 1).events[0]).toMatchObject({ type: 'rejected', reason: 'not now' });
    expect(apply({ ...strider, characters: { [P]: { ...me(strider), steps: 3 } } }, { type: 'use', id: 'u3', player: P, item: 'charm' }, makeRng('charm'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'no such item' });
  });

  it('the Honeycomb Heart heals each round; the Moondrop gives three more mana; the Heartbeat Drum brings a second point now and then', () => {
    const heart = apply(versus(wearing('heartstone', 'warrior', { hp: 60 }), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(heart.events).toContainEqual(expect.objectContaining({ type: 'healed' }));
    const tear = apply(versus(wearing('sapphire-tear', 'mage', { mana: 10 }), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng('x'), NOW);
    expect(tear.events).toContainEqual(expect.objectContaining({ type: 'mana', delta: PROGRESSION.manaPerRound + 3 }));
    const gains = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const r = apply(versus(wearing('wolf-totem', 'rogue'), 'slime', { hp: 5000, next: bite }), turn(attack), makeRng(`fury-${i}`), NOW);
      const first = r.events.find((e) => e.type === 'meter');
      if (first?.type === 'meter') gains.add(first.value);
    }
    expect([...gains].sort()).toEqual([1, 2]);
  });
});

describe('a version-6 save', () => {
  it('comes up to date: one affix becomes the list, a fight in progress gains its new fields, the rest is kept', () => {
    const today = newGame({ seed: 'old', player: P, name: 'Robin', classId: 'rogue' });
    const oldSword = { id: 'g1', slot: 'weapon', rank: 2, rarity: 'rare', name: 'Copper Sword', base: 'copper sword', stats: { attack: 10 }, affix: { kind: 'crit', value: 0.1 }, price: 200 };
    const oldHelm = { id: 'g2', slot: 'helm', rank: 1, rarity: 'common', name: 'Tin Helm', base: 'tin hat', stats: { maxHp: 12 }, affix: null, price: 20 };
    const fighting = startFight(me(today), 'spider', 's1', false);
    const oldEnemy = { ...fighting.fight!.enemy } as Record<string, unknown>;
    for (const k of ['next', 'armoured', 'evade', 'phase', 'phase2']) delete oldEnemy[k];
    const oldFight = { enemy: oldEnemy, round: 3, charged: true, attackUp: null, barrier: 5, evade: 0, space: 's1', spawn: false };
    const v6 = { ...structuredClone(today), version: 6, characters: { [P]: { ...me(today), equipment: { ...NO_GEAR, weapon: oldSword }, bag: [oldHelm], fight: oldFight, gold: 77 } } };
    const s = migrate(structuredClone(v6));
    expect(s).not.toBeNull();
    expect(s!.version).toBe(34);
    expect(me(s!).quests).toEqual([]);
    expect(me(s!).keys).toEqual({});
    expect(me(s!).equipment.weapon).toEqual({ id: 'g1', slot: 'weapon', rank: 2, rarity: 'rare', name: 'Copper Sword', base: 'copper sword', stats: { attack: 10 }, affixes: [{ kind: 'crit', value: 0.1 }], price: 200 });
    expect(me(s!).bag[0]!.affixes).toEqual([]);
    expect(me(s!).bag[0]).not.toHaveProperty('affix');
    expect(me(s!).fight).toMatchObject({ round: 3, charged: true, barrier: 5, meter: 0, strikes: 0, sureCrit: 0, windup: null, companion: null, mark: null, trap: 0, skip: 0, poisoned: null, weak: null, used: [] });
    expect(me(s!).fight!.enemy).toMatchObject({ id: 'spider', next: null, armoured: null, evade: 0, phase: 1, phase2: null });
    expect(me(s!).gold).toBe(77);
    expect(s!.board).toEqual(makeBoard());
    // And the fight plays on.
    const r = apply(s!, turn(attack), makeRng('x'), NOW);
    expect(r.events[0]).toMatchObject({ type: 'hit', by: 'player' });
  });
});
