// The classes and their paths (Robin, 2026-11-02): the meters, what makes each class play differently, the paths' rules, and the skill
// board's points. The balance is the simulator's, `tools/sim-classes.ts`; these say the rules do what the words say.
import { describe, expect, it } from 'vitest';
import { ABILITIES, CLASS_DATA, PROGRESSION } from '../src/data.ts';
import { startFight } from '../src/fight.ts';
import { apply, newGame } from '../src/game.ts';
import { stats } from '../src/gear.ts';
import { groundAt, inTownWalls, placeAt } from '../src/grounds.ts';
import { makeRng } from '../src/rng.ts';
import { carriedLimit, MAX_CARRIED, needsFor, pointsForLevel, pointsFree, specialization, traitsOf, withCore } from '../src/skills.ts';
import type { Action, Character, ClassId, Enemy, EnemyMove, FightMove, GameEvent, GameState, Guard } from '../src/types.ts';
import { ringBoard } from './fixtures/ring.ts';

const P = 'p1';
const NOW = 1_000_000;
const turn = (move: FightMove, guard: Guard = 'none', id = 'f1'): Action => ({ type: 'fight', id, player: P, move, guard });
const attack: FightMove = { kind: 'attack' };
const ability = (a: string): FightMove => ({ kind: 'ability', ability: a });
const me = (s: GameState): Character => s.characters[P]!;
const fight = (s: GameState) => me(s).fight!;
const hits = (events: GameEvent[], by: 'player' | 'enemy') => events.filter((e): e is Extract<GameEvent, { type: 'hit' }> => e.type === 'hit' && e.by === by);

/** A character of the class squared up to the enemy on the ring's wilds, with the fight and the enemy patched by hand. */
function versus(classId: ClassId, enemy: string, patch: Partial<Character> = {}, enemyPatch: Partial<Enemy> = {}, fightPatch: Partial<Character['fight'] & object> = {}): GameState {
  const s = newGame({ seed: 'kit', player: P, name: 'Robin', classId, board: ringBoard() });
  const c = startFight({ ...me(s), space: 's1', ...patch }, enemy, 's1', false);
  c.fight = { ...c.fight!, ...fightPatch, enemy: { ...c.fight!.enemy, ...enemyPatch } };
  return { ...s, characters: { [P]: c } };
}
const bite: EnemyMove = { name: 'Bite', power: 1, weight: 1 };
const tough = { hp: 5000, maxHp: 5000, next: bite };

describe('the meters', () => {
  it('Valor builds only by blocking, two from a wound-up blow, up to the cap', () => {
    expect(fight(apply(versus('warrior', 'slime', {}, tough), turn(attack), makeRng('a'), NOW).state).meter).toBe(0);
    const blocked = apply(versus('warrior', 'slime', {}, tough), turn(attack, 'block'), makeRng('a'), NOW);
    expect(fight(blocked.state).meter).toBe(1);
    expect(blocked.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Valor', value: 1, max: PROGRESSION.meterMax });
    expect(fight(apply(versus('warrior', 'slime', {}, { ...tough, charged: 'Howl' }), turn(attack, 'block'), makeRng('a'), NOW).state).meter).toBe(2);
    expect(fight(apply(versus('warrior', 'slime', {}, tough, { meter: 5 }), turn(attack, 'block'), makeRng('a'), NOW).state).meter).toBe(5);
  });

  it('Mischief builds once an attack, not once a hit; Arcana a point a round; Aim from blows that miss and crits', () => {
    const rogue = apply(versus('rogue', 'slime', {}, tough), turn(attack), makeRng('a'), NOW);
    expect(hits(rogue.events, 'player')).toHaveLength(3);
    expect(fight(rogue.state).meter).toBe(1);
    expect(fight(apply(versus('mage', 'slime', {}, tough), turn(attack), makeRng('a'), NOW).state).meter).toBe(1);
    const dodged = apply(versus('ranger', 'slime', {}, tough, { evade: 1, round: 2 }), turn(attack), makeRng('a'), NOW);
    expect(dodged.events.find((e) => e.type === 'meter')).toMatchObject({ name: 'Aim', value: 1 });
  });
});

describe('every class starts with a way to spend its meter', () => {
  it.each(Object.keys(CLASS_DATA) as ClassId[])('%s', (classId) => {
    const kit = CLASS_DATA[classId]!.kit.map((id) => ABILITIES[id]!);
    expect(kit.some((a) => a.meter || a.meterAll)).toBe(true);
    expect(kit.every((a) => a.level === 1)).toBe(true);
  });

  it('every ability belongs to its class; every tree has eight tiers by rising level, a signature at its foot, and more to learn than points to spend', () => {
    for (const [classId, cls] of Object.entries(CLASS_DATA)) {
      expect(Object.keys(cls.trees)).toHaveLength(3);
      for (const id of cls.core) expect(ABILITIES[id]!.classId).toBe(classId);
      const ranks = Object.values(cls.trees).flatMap((t) => t.nodes).reduce((sum, id) => sum + ABILITIES[id]!.ranks.length, 0);
      expect(ranks).toBeGreaterThan(pointsForLevel(30) * 2);
      for (const tree of Object.values(cls.trees)) {
        expect(tree.tiers).toHaveLength(8);
        expect(tree.tiers[7]).toHaveLength(1);
        expect(tree.nodes).toEqual(tree.tiers.flat());
        const levels = tree.tiers.map((row) => ABILITIES[row[0]!]!.level);
        expect(levels).toEqual([...levels].sort((a, b) => a - b));
        expect(levels[7]).toBe(30);
        for (const id of tree.nodes) expect(ABILITIES[id]!.classId).toBe(classId);
      }
    }
  });
  it('every talent does something: an active a rank that moves, a passive a known rule', () => {
    for (const a of Object.values(ABILITIES)) {
      expect(a.ranks.length, a.name).toBeGreaterThan(0);
      if (a.rule) expect(Object.keys(a.rule).length, a.name).toBeGreaterThan(0);
      else expect(Object.keys(a.ranks[0]!).length, a.name).toBeGreaterThan(0);
    }
  });
});

describe('the Warrior', () => {
  it('Finishing Flourish spends 3 Valor, far harder on a foe under a third; short of Valor it is refused', () => {
    const short = versus('warrior', 'slime', {}, tough, { meter: 2 });
    expect(apply(short, turn(ability('execute')), makeRng('x'), NOW).events[0]).toMatchObject({ type: 'rejected', reason: 'not enough meter' });
    const full = apply(versus('warrior', 'slime', {}, tough, { meter: 3 }), turn(ability('execute')), makeRng('x'), NOW);
    const low = apply(versus('warrior', 'slime', {}, { ...tough, hp: 1000 }, { meter: 3 }), turn(ability('execute')), makeRng('x'), NOW);
    expect(hits(low.events, 'player')[0]!.damage).toBeGreaterThan(hits(full.events, 'player')[0]!.damage);
    expect(fight(full.state).meter).toBeLessThanOrEqual(1);
  });

  it('Paladin: a Block heals; Berserker: more dealt and more taken; Knight: more defense and blows go back', () => {
    const base = versus('warrior', 'slime', { hp: 50 }, tough);
    const paladin = versus('warrior', 'slime', { hp: 50, abilities: { 'paladin-oath': 1 } }, tough);
    expect(me(apply(paladin, turn(attack, 'block'), makeRng('a'), NOW).state).hp).toBeGreaterThan(me(apply(base, turn(attack, 'block'), makeRng('a'), NOW).state).hp);
    const plain = apply(versus('warrior', 'slime', {}, tough), turn(attack), makeRng('a'), NOW);
    const mad = apply(versus('warrior', 'slime', { abilities: { 'berserker-rage': 1 } }, tough), turn(attack), makeRng('a'), NOW);
    expect(hits(mad.events, 'player')[0]!.damage).toBeGreaterThan(hits(plain.events, 'player')[0]!.damage);
    expect(hits(mad.events, 'enemy')[0]!.damage).toBeGreaterThan(hits(plain.events, 'enemy')[0]!.damage);
    const knight = versus('warrior', 'slime', { abilities: { 'knight-oath': 1 } }, tough);
    expect(stats(me(knight)).defense).toBeGreaterThan(stats(me(base)).defense);
    expect(apply(knight, turn(attack), makeRng('a'), NOW).events.some((e) => e.type === 'countered')).toBe(true);
  });

  it('Blood Price trades HP for Valor; Bulwark makes a Block stop more', () => {
    const paid = apply(versus('warrior', 'slime', { abilities: { 'blood-price': 1 } }, { ...tough, stunned: 1 }), turn(ability('blood-price')), makeRng('a'), NOW);
    expect(fight(paid.state).meter).toBe(2);
    expect(fight(paid.state).attackUp).toBeTruthy();
    expect(me(paid.state).hp).toBeLessThan(120);
    const walled = versus('warrior', 'bandit', { abilities: { bulwark: 1, 'knight-oath': 1 } }, { ...tough, attack: 60 });
    const then = apply(walled, turn(ability('bulwark'), 'block'), makeRng('a'), NOW);
    const open = apply(versus('warrior', 'bandit', { abilities: { 'knight-oath': 1 }, mana: 0 }, { ...tough, attack: 60 }), turn(attack, 'block'), makeRng('a'), NOW);
    expect(hits(then.events, 'enemy')[0]!.damage).toBeLessThan(hits(open.events, 'enemy')[0]!.damage);
  });
});

describe('the Magician', () => {
  it('Block is a Mana Shield: half the blow is paid in mana; without mana it all lands', () => {
    const shield = apply(versus('mage', 'bandit', { mana: 40 }, { ...tough, attack: 40 }), turn(attack, 'block'), makeRng('a'), NOW);
    const none = apply(versus('mage', 'bandit', { mana: 40 }, { ...tough, attack: 40 }), turn(attack), makeRng('a'), NOW);
    const taken = hits(shield.events, 'enemy')[0]!.damage;
    const full = hits(none.events, 'enemy')[0]!.damage;
    expect(taken).toBeLessThanOrEqual(Math.ceil(full / 2) + 3);
    expect(shield.events.some((e) => e.type === 'mana' && e.delta < 0)).toBe(true);
    const dry = apply(versus('mage', 'bandit', { mana: 0 }, { ...tough, attack: 40 }), turn(attack, 'block'), makeRng('a'), NOW);
    expect(hits(dry.events, 'enemy')[0]!.damage).toBeGreaterThan(taken);
  });

  it('a staff is poor and a spell strong; Overflow turns Arcana into mana and the next spell harder', () => {
    const plain = apply(versus('mage', 'slime', {}, tough), turn(attack), makeRng('b'), NOW);
    const bolt = apply(versus('mage', 'slime', {}, tough), turn(ability('arcane-bolt')), makeRng('b'), NOW);
    expect(hits(bolt.events, 'player')[0]!.damage).toBeGreaterThan(hits(plain.events, 'player')[0]!.damage * 1.5);
    const flowed = apply(versus('mage', 'slime', { mana: 10 }, { ...tough, stunned: 1 }, { meter: 3 }), turn(ability('overflow')), makeRng('b'), NOW);
    expect(me(flowed.state).mana).toBeGreaterThan(20);
    expect(fight(flowed.state).nextSpell).toBeGreaterThan(1);
  });

  it('Wizard: Firework leaves it burning; Spellsword: Frost Blade weakens and its plain attacks use magic; Cleric: Mend heals more', () => {
    const fire = apply(versus('mage', 'slime', { abilities: { fireball: 1 } }, tough), turn(ability('fireball')), makeRng('a'), NOW);
    expect(fight(fire.state).enemy.burn).toBeTruthy();
    expect(fire.events.some((e) => e.type === 'poisoned' && e.burn)).toBe(true);
    const sword = versus('mage', 'slime', { abilities: { 'frost-blade': 1, 'spellsword-bond': 1 } }, tough);
    const infused = apply(sword, turn(ability('frost-blade')), makeRng('a'), NOW);
    const cut = apply(infused.state, turn(attack, 'none', 'f2'), makeRng('a'), NOW);
    expect(fight(cut.state).enemy.weakened).toBeTruthy();
    const staff = apply(versus('mage', 'slime', {}, tough), turn(attack), makeRng('a'), NOW);
    expect(hits(cut.events, 'player')[0]!.damage).toBeGreaterThan(hits(staff.events, 'player')[0]!.damage);
    const cleric = apply(versus('mage', 'slime', { hp: 10, abilities: { mend: 1, 'cleric-grace': 1 } }, { ...tough, stunned: 1 }), turn(ability('mend')), makeRng('a'), NOW);
    expect(me(cleric.state).hp).toBeGreaterThan(30);
  });
});

describe('the Rogue', () => {
  it('Attack strikes three times, sharing the damage; every hit raises the crit chance until a crit', () => {
    const r = apply(versus('rogue', 'slime', {}, tough), turn(attack), makeRng('a'), NOW);
    const three = hits(r.events, 'player');
    expect(three).toHaveLength(3);
    const crits = three.filter((h) => h.crit).length;
    if (!crits) expect(fight(r.state).streak).toBe(3);
    const sure = apply(versus('rogue', 'slime', {}, tough, { streak: 100 }), turn(attack), makeRng('a'), NOW);
    expect(hits(sure.events, 'player')[0]!.crit).toBe(true);
    expect(fight(sure.state).streak).toBeLessThan(100);
  });

  it('takes more damage than a Hunter of the same defense would', () => {
    const rogue = hits(apply(versus('rogue', 'bandit', { defense: 6 }, { ...tough }, { round: 2 }), turn(attack), makeRng('c'), NOW).events, 'enemy')[0]!;
    const hunter = hits(apply(versus('ranger', 'bandit', { defense: 6 }, { ...tough }, { round: 2 }), turn(attack), makeRng('c'), NOW).events, 'enemy')[0];
    if (hunter) expect(rogue.damage).toBeGreaterThanOrEqual(hunter.damage);
  });

  it('Ninja: Smoke Escape always gets away, even from a boss, and strikes first', () => {
    const away = apply(versus('rogue', 'thornwood-warden', { abilities: { 'smoke-escape': 1 } }), turn(ability('smoke-escape')), makeRng('a'), NOW);
    expect(me(away.state).fight).toBeNull();
    expect(away.events).toContainEqual(expect.objectContaining({ type: 'fled', ok: true }));
    const first = apply(versus('rogue', 'slime', { abilities: { 'ninja-step': 1 } }, tough), turn(attack), makeRng('a'), NOW);
    expect(hits(first.events, 'enemy')).toHaveLength(0);
  });

  it('Shadow Dance: this round the blow lands in full whatever the guard, then it almost never lands for two rounds', () => {
    let s = versus('rogue', 'bandit', { abilities: { 'shadow-dance': 1 } }, tough);
    const open = apply(s, turn(ability('shadow-dance'), 'block'), makeRng('a'), NOW);
    expect(hits(open.events, 'enemy')).toHaveLength(1);
    expect(open.events.some((e) => e.type === 'guarded')).toBe(true);
    s = open.state;
    let missed = 0;
    for (let i = 0; i < 2; i++) {
      const r = apply(s, turn(attack, 'none', `f${i + 2}`), makeRng('dance'), NOW);
      if (r.events.some((e) => e.type === 'missed' && e.by === 'enemy')) missed += 1;
      s = r.state;
    }
    expect(missed).toBeGreaterThanOrEqual(1);
    expect(fight(s).dance).toBeNull();
  });

  it('Alchemist: a coating poisons on each hit, and the poison grows', () => {
    const coated = apply(versus('rogue', 'slime', { abilities: { 'poison-coat': 1, 'alchemist-brew': 1 } }, tough), turn(ability('poison-coat')), makeRng('a'), NOW);
    const r = apply(coated.state, turn(attack, 'none', 'f2'), makeRng('a'), NOW);
    expect(fight(r.state).enemy.poison!.damage).toBeGreaterThanOrEqual(3);
    expect(fight(r.state).coat!.hits).toBe(3);
  });
});

describe('the signature abilities', () => {
  it('Mighty Swing grows with Valor held, and Arcane Bolt with mana held', () => {
    const none = apply(versus('warrior', 'slime', {}, tough), turn(ability('heavy-blow')), makeRng('z'), NOW);
    const full = apply(versus('warrior', 'slime', {}, tough, { meter: 5 }), turn(ability('heavy-blow')), makeRng('z'), NOW);
    expect(hits(full.events, 'player')[0]!.damage).toBeGreaterThan(hits(none.events, 'player')[0]!.damage);
    expect(fight(full.state).meter).toBeGreaterThanOrEqual(5);
    const rich = apply(versus('mage', 'slime', { mana: 40 }, tough), turn(ability('arcane-bolt')), makeRng('z'), NOW);
    const poor = apply(versus('mage', 'slime', { mana: 6 }, tough), turn(ability('arcane-bolt')), makeRng('z'), NOW);
    expect(hits(rich.events, 'player')[0]!.damage).toBeGreaterThan(hits(poor.events, 'player')[0]!.damage);
  });

  it('Shield Bonk breaks a wind-up, even a boss\'s', () => {
    const r = apply(versus('warrior', 'thornwood-warden', { abilities: { 'shield-bash': 1 } }, { ...tough, charged: 'Slam' }), turn(ability('shield-bash'), 'block'), makeRng('z'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'effect', kind: 'interrupt' }));
    expect(hits(r.events, 'enemy')[0]?.move).not.toBe('Slam');
  });

  it('Last Light stands you back up once; Bloodbath is harder the less HP is left', () => {
    const lit = versus('warrior', 'bandit', { hp: 1, abilities: { 'last-light': 1 } }, { ...tough, attack: 200 }, { meter: 3 });
    const r = apply(lit, turn(ability('last-light')), makeRng('z'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'revived', by: 'guardian' }));
    expect(me(r.state).fight).not.toBeNull();
    const healthy = apply(versus('warrior', 'slime', { abilities: { bloodbath: 1 } }, tough), turn(ability('bloodbath')), makeRng('z'), NOW);
    const hurt = apply(versus('warrior', 'slime', { hp: 12, abilities: { bloodbath: 1 } }, tough), turn(ability('bloodbath')), makeRng('z'), NOW);
    expect(hits(hurt.events, 'player')[0]!.damage).toBeGreaterThan(hits(healthy.events, 'player')[0]!.damage * 1.5);
  });

  it('Detonate and Bitter End land all of a burn or a poison at once', () => {
    const fire = versus('mage', 'slime', { abilities: { detonate: 1 } }, { ...tough, stunned: 1, burn: { rounds: 3, damage: 10 } });
    const blown = apply(fire, turn(ability('detonate')), makeRng('z'), NOW);
    expect(hits(blown.events, 'player')[0]!.damage).toBe(66);
    expect(fight(blown.state).enemy.burn).toBeNull();
    const venom = versus('rogue', 'slime', { abilities: { 'bitter-end': 1 } }, { ...tough, stunned: 1, poison: { rounds: 2, damage: 10 } });
    expect(hits(apply(venom, turn(ability('bitter-end')), makeRng('z'), NOW).events, 'player')[0]!.damage).toBe(40);
  });

  it('Judgement Day grows with what was healed; a Cleric\'s healing past full becomes a barrier', () => {
    const fresh = apply(versus('mage', 'slime', { abilities: { 'judgement-day': 1 } }, tough), turn(ability('judgement-day')), makeRng('z'), NOW);
    const healed = apply(versus('mage', 'slime', { abilities: { 'judgement-day': 1 } }, tough, { healed: 300 }), turn(ability('judgement-day')), makeRng('z'), NOW);
    expect(hits(healed.events, 'player')[0]!.damage).toBeGreaterThan(hits(fresh.events, 'player')[0]!.damage * 2);
    const mended = apply(versus('mage', 'slime', { abilities: { mend: 1, 'cleric-grace': 1 } }, { ...tough, stunned: 1 }), turn(ability('mend')), makeRng('z'), NOW);
    expect(fight(mended.state).barrier).toBeGreaterThan(0);
  });

  it('Shadow Clone strikes again; Bullseye is harder on a foe winding up; Great Owl strikes twice', () => {
    const cloned = apply(versus('rogue', 'slime', {}, tough, { clone: { rounds: 2, power: 0.6 } }), turn(attack), makeRng('z'), NOW);
    expect(hits(cloned.events, 'player')).toHaveLength(6);
    const calm = apply(versus('ranger', 'slime', { abilities: { 'aimed-shot': 1 } }, tough, { round: 2 }), turn(ability('aimed-shot')), makeRng('q'), NOW);
    const winding = apply(versus('ranger', 'slime', { abilities: { 'aimed-shot': 1 } }, { ...tough, charged: 'Slam' }, { round: 2 }), turn(ability('aimed-shot')), makeRng('q'), NOW);
    expect(hits(winding.events, 'player')[0]!.damage).toBeGreaterThan(hits(calm.events, 'player')[0]!.damage);
    const owl = apply(versus('ranger', 'slime', { abilities: { 'great-owl': 1 } }, tough, { meter: 3 }), turn(ability('great-owl')), makeRng('z'), NOW);
    expect(hits(owl.events, 'player').filter((h) => h.move === 'Great Owl')).toHaveLength(2);
  });
});

describe('the Hunter', () => {
  it('often shoots back when struck, and strikes first', () => {
    let countered = 0;
    for (let i = 0; i < 60; i++) {
      const r = apply(versus('ranger', 'slime', {}, tough, { round: 2 }), turn(attack), makeRng(`h${i}`), NOW);
      if (r.events.some((e) => e.type === 'countered')) countered += 1;
    }
    expect(countered).toBeGreaterThan(5);
    expect(countered).toBeLessThan(35);
    expect(hits(apply(versus('ranger', 'slime', {}, tough), turn(attack), makeRng('a'), NOW).events, 'enemy')).toHaveLength(0);
  });

  it('Ranger: every counter is two arrows; a Counter guard always shoots back', () => {
    const r = apply(versus('ranger', 'slime', { abilities: { 'ranger-eye': 1 } }, tough, { round: 2 }), turn(attack, 'counter'), makeRng('a'), NOW);
    expect(r.events.filter((e) => e.type === 'countered')).toHaveLength(2);
  });

  it('Beastmaster: the owl strikes every round; Trapper: a tripped wind-up hurts it', () => {
    const owl = apply(versus('ranger', 'slime', { abilities: { hawk: 1 } }, tough, { meter: 2 }), turn(ability('hawk')), makeRng('a'), NOW);
    expect(hits(owl.events, 'player').some((h) => h.move === 'Owl Friend')).toBe(true);
    const trap = versus('ranger', 'bandit', { abilities: { trap: 1, 'trapper-craft': 1 } }, { ...tough, next: { name: 'Lunge', power: 2, weight: 1, charge: true } }, { round: 2 });
    const r = apply(trap, turn(ability('trap')), makeRng('a'), NOW);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'skipped', reason: 'trapped' }));
    expect(r.events.some((e) => e.type === 'countered')).toBe(true);
  });

  it('wears bows only', () => {
    const s = newGame({ seed: 'kit', player: P, name: 'Robin', classId: 'ranger', board: ringBoard() });
    const sword = { id: 'x', slot: 'weapon', rank: 1, rarity: 'common', name: 'Old Sword', base: 'old sword', stats: { attack: 3 }, price: 5 };
    const bow = { ...sword, id: 'y', name: 'Tin Bow', base: 'tin bow' };
    const held = { ...s, characters: { [P]: { ...me(s), bag: [sword, bow] } } } as unknown as GameState;
    expect(apply(held, { type: 'equip', id: 'e', player: P, gear: 'x' }, makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    expect(apply(held, { type: 'equip', id: 'e', player: P, gear: 'y' }, makeRng('a'), NOW).events[0]).toMatchObject({ type: 'equipped' });
  });
});

describe('the skill board', () => {
  const skill = (op: Record<string, string>): Action => ({ type: 'skill', id: 's', player: P, ...op }) as Action;
  const at = (patch: Partial<Character>, classId: ClassId = 'warrior'): GameState => {
    const s = newGame({ seed: 'kit', player: P, name: 'Robin', classId, board: ringBoard() });
    return { ...s, characters: { [P]: { ...me(s), ...patch } } };
  };

  it('a point every level', () => {
    expect([1, 2, 5, 10, 11, 12, 30].map(pointsForLevel)).toEqual([0, 1, 4, 9, 10, 11, 29]);
  });

  it('the class\'s own four come free with the level, and a point raises them', () => {
    const two = at({ level: 1 });
    expect(me(two).abilities).toEqual({ 'heavy-blow': 1, execute: 1 });
    expect(apply(two, skill({ op: 'learn', ability: 'heavy-blow' }), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    const grown = withCore(me(at({ level: 3 })));
    expect(grown.abilities).toMatchObject({ 'shield-bash': 1, 'shield-wall': 1 });
    expect(grown.carried).toHaveLength(4);
    expect(pointsFree(grown)).toBe(2);
    const raised = apply(at({ level: 2 }), skill({ op: 'learn', ability: 'heavy-blow' }), makeRng('a'), NOW);
    expect(me(raised.state).abilities['heavy-blow']).toBe(2);
    expect(pointsFree(me(raised.state))).toBe(0);
  });

  it('a tier asks for its level and for points already in that tree; several trees can be climbed; a passive has ranks', () => {
    expect(apply(at({ level: 1 }), skill({ op: 'learn', ability: 'shield-slam' }), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    let s = at({ level: 9 });
    const learn = (ability: string) => {
      const r = apply(s, skill({ op: 'learn', ability }), makeRng('a'), NOW);
      s = r.state;
      return r.events[0];
    };
    expect(learn('knight-oath')).toMatchObject({ type: 'rejected' });
    expect(learn('shield-slam')).toMatchObject({ type: 'learned' });
    expect(learn('kni-plate')).toMatchObject({ type: 'learned' });
    expect(learn('kni-plate')).toMatchObject({ type: 'learned' });
    expect(needsFor(me(s), 'knight-oath')).toEqual({ level: 0, points: 0 });
    expect(learn('knight-oath')).toMatchObject({ type: 'learned' });
    expect(me(s).carried).not.toContain('knight-oath');
    expect(apply(s, skill({ op: 'carry', ability: 'knight-oath' }), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    expect(needsFor(me(s), 'iron-retort')).toEqual({ level: 0, points: 2 });
    expect(learn('iron-retort')).toMatchObject({ type: 'rejected' });
    expect(learn('holy-strike')).toMatchObject({ type: 'learned' });
    expect(specialization(me(s))).toBe('Knight');
    expect(traitsOf(me(s)).defenseMult).toBeCloseTo(1.04 * 1.04 * 1.2);
  });

  it('a passive does what it says: a win heals, a low fighter hits harder, a fight starts with a barrier', () => {
    const c = me(at({ level: 20, abilities: { 'kni-bastion': 2 } }));
    const started = startFight(c, 'slime', c.space, false);
    expect(started.fight!.barrier).toBe(Math.round(stats(c).maxHp * 0.12));
    expect(traitsOf({ ...c, abilities: { 'ber-wounds': 2 } }).lowHpDamage).toBeCloseTo(1.06 * 1.06);
  });

  it('for testing, another class at the same level, or a level more', () => {
    const s = at({ level: 6 });
    const r = apply(s, skill({ op: 'testClass', classId: 'ranger' }), makeRng('a'), NOW);
    expect(me(r.state)).toMatchObject({ classId: 'ranger', level: 6, abilities: { volley: 1, 'sure-shot': 1 } });
    const up = apply(s, skill({ op: 'testLevel' }), makeRng('a'), NOW);
    expect(me(up.state).level).toBe(7);
    expect(me(up.state).attack).toBe(24);
  });

  it('four are carried, five from level 15; what is not carried cannot be used in a fight once they are full', () => {
    const abilities = { 'heavy-blow': 1, execute: 1, 'shield-bash': 1, 'shield-wall': 1, reckless: 1 };
    const full = at({ level: 10, abilities, carried: ['heavy-blow', 'execute', 'shield-bash', 'shield-wall'] });
    expect(me(full).carried).toHaveLength(carriedLimit(10));
    expect(carriedLimit(15)).toBe(MAX_CARRIED);
    expect(apply(full, skill({ op: 'carry', ability: 'reckless' }), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    const left = apply(full, skill({ op: 'carry', ability: 'heavy-blow' }), makeRng('a'), NOW);
    expect(me(left.state).carried).not.toContain('heavy-blow');
    const back = apply(left.state, skill({ op: 'carry', ability: 'reckless' }), makeRng('a'), NOW);
    expect(me(back.state).carried).toContain('reckless');
    const inFight = versus('warrior', 'slime', { abilities, carried: ['execute', 'shield-bash', 'shield-wall', 'reckless'] }, tough);
    expect(apply(inFight, turn(ability('heavy-blow')), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
  });

  it('a reset gives every point back, only in a town or a church', () => {
    const spent = at({ level: 8, abilities: { 'heavy-blow': 3, execute: 1, 'holy-strike': 2 }, carried: ['heavy-blow', 'execute', 'holy-strike'] });
    const start = me(spent).space;
    expect(apply({ ...spent, characters: { [P]: { ...me(spent), space: 's1' } } }, skill({ op: 'reset' }), makeRng('a'), NOW).events[0]).toMatchObject({ type: 'rejected' });
    const reset = apply({ ...spent, characters: { [P]: { ...me(spent), space: start } } }, skill({ op: 'reset' }), makeRng('a'), NOW);
    expect(me(reset.state)).toMatchObject({ abilities: { 'heavy-blow': 1, execute: 1, 'shield-bash': 1, 'shield-wall': 1 }, carried: ['heavy-blow', 'execute', 'shield-bash', 'shield-wall'] });
    expect(pointsFree(me(reset.state))).toBe(pointsForLevel(8));
  });
});

describe('what a spot can hold', () => {
  const near = (classId: ClassId = 'warrior'): GameState => {
    const s = newGame({ seed: 'spot', player: P, name: 'Robin', classId });
    const wild = Object.values(s.board.spaces).find((x) => x.area === 'meadows' && x.kind === 'normal' && !x.name && !inTownWalls(s.board, x) && groundAt(s.board, x))!;
    return { ...s, characters: { [P]: { ...me(s), space: wild.links[0]!, steps: 1 } }, die: { ...s.die, last: 1 } };
  };
  const wildOf = (s: GameState) => Object.values(s.board.spaces).find((x) => x.area === 'meadows' && x.kind === 'normal' && !x.name && !inTownWalls(s.board, x) && groundAt(s.board, x))!.id;
  const land = (s: GameState, seed: number) => apply(s, { type: 'move', id: 'm', player: P, path: [wildOf(s)] }, makeRng(seed), NOW);

  it('is a fight about seven times in ten', () => {
    const s = near();
    let fights = 0;
    for (let i = 0; i < 400; i++) if (land(s, i).events.some((e) => e.type === 'fight')) fights++;
    expect(fights).toBeGreaterThan(230);
    expect(fights).toBeLessThan(320);
  });

  it('now and then a find worth a roll: a piece one rarity up at least, in the slot it spoke of; a stranger with a quest', () => {
    const s = near();
    let find: GameState | null = null;
    let stranger: GameState | null = null;
    for (let i = 0; i < 900 && !(find && stranger); i++) {
      const r = land(s, i);
      const offer = me(r.state).offer;
      if (offer?.kind === 'roll' && offer.what === 'find') find = r.state;
      if (offer?.kind === 'board' && offer.from) stranger = r.state;
    }
    expect(find).not.toBeNull();
    expect(stranger).not.toBeNull();
    const offer = me(find!).offer as Extract<Character['offer'], { kind: 'roll' }>;
    expect(offer.text!.length).toBeGreaterThan(10);
    let won = false;
    for (let i = 0; i < 80 && !won; i++) {
      const r = apply(find!, { type: 'try', id: 't', player: P }, makeRng(i), NOW);
      const tried = r.events.find((e) => e.type === 'tried');
      if (tried?.type === 'tried' && tried.won) {
        won = true;
        const got = me(r.state).bag[0] ?? Object.values(me(r.state).equipment).find(Boolean);
        expect(got?.slot).toBe(offer.slot);
        expect(got?.rarity).not.toBe('common');
      }
    }
    expect(won).toBe(true);
    expect((me(stranger!).offer as Extract<Character['offer'], { kind: 'board' }>).quests).toHaveLength(1);
  });

  it('an elite is the place\'s creature, far tougher, worth a mini-boss\'s drop', () => {
    const s = near();
    const wild = wildOf(s);
    const elite = { ...s, spawns: { [wild]: { kind: 'elite' as const, enemy: 'slime', until: NOW + 1000 } } };
    const r = land(elite, 1);
    expect(fight(r.state).enemy).toMatchObject({ id: 'slime', role: 'mini', name: 'Elite Jelly Slime', hp: 100 });
  });

  it('a boss can be challenged from anywhere in land you have opened, not closed land, not while it is away', () => {
    const s = near();
    const go = (state: GameState, space: string) => apply(state, { type: 'challenge', id: 'c', player: P, space }, makeRng(1), NOW);
    // The first visit is on foot (Robin, 2026-11-02).
    expect(go({ ...s, characters: { [P]: { ...me(s), steps: 0 } } }, 'gate').events[0]).toMatchObject({ type: 'rejected' });
    const ready = { ...s, characters: { [P]: { ...me(s), steps: 0, bossMet: ['gate'] } } };
    const r = go(ready, 'gate');
    expect(me(r.state)).toMatchObject({ space: 'gate' });
    expect(fight(r.state).enemy.id).toBe('thornwood-warden');
    expect(go(ready, 'briar').events[0]).toMatchObject({ type: 'rejected' });
    expect(go({ ...ready, characters: { [P]: { ...me(ready), cooldowns: { gate: NOW + 5 } } } }, 'gate').events[0]).toMatchObject({ type: 'rejected' });
  });

  it('the journal: a creature\'s first defeat pays, a place\'s first visit pays, and a full region page is a skill point', () => {
    const won = apply(versus('warrior', 'slime', {}, { hp: 1 }), turn(attack), makeRng('x'), NOW);
    expect(me(won.state).journal.beaten.slime).toBe(1);
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'journal' }));
    expect(me(won.state).xp).toBeGreaterThan(5);
    const again = apply(versus('warrior', 'slime', { journal: me(won.state).journal }, { hp: 1 }), turn(attack), makeRng('x'), NOW);
    expect(again.events.some((e) => e.type === 'journal')).toBe(false);
    const s = near();
    const named = Object.values(s.board.spaces).find((x) => x.area === 'meadows' && placeAt(s.board, x) && x.links.length)!;
    const landed = apply({ ...s, characters: { [P]: { ...me(s), space: named.links[0]!, steps: 1 } } }, { type: 'move', id: 'm', player: P, path: [named.id] }, makeRng(7), NOW);
    expect(me(landed.state).journal.places.length).toBe(1);
  });
});
