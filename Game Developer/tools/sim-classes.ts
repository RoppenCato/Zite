// Plays every class and path through each region's creatures and bosses with the real rules, and says how it went: the way the
// classes are balanced (Robin, 2026-11-02: "You'll need to find a good way to balance it"). The player is a sensible one, not a perfect
// one: heals when low, keeps its buffs up, spends its meter, guards as its class wants. Not part of the game.
//   node tools/sim-classes.ts            the table
//   node tools/sim-classes.ts 100        with fewer fights a match

import { ABILITIES, apply, CLASS_DATA, makeRng, newGame, plainGear, PROGRESSION, startFight, stats, type ClassId, type GameState, type GearLine } from '../rules/src/index.ts';
import type { Character } from '../rules/src/index.ts';
import { pointsForLevel } from '../rules/src/skills.ts';
import { choose } from './sim-player.ts';

const N = Number(process.argv[2]) || 300;
const LINE: Record<ClassId, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' } as Record<ClassId, GearLine>;

interface Region {
  name: string;
  level: number;
  rank: number;
  mobs: string[];
  miniLevel: number;
  mini: string;
  bossLevel: number;
  boss: string;
  potions: number;
  potion: string;
}
const REGIONS: Region[] = [
  { name: 'Bogglemire', level: 14, rank: 4, mobs: ['bog-toad', 'mudling', 'lantern-wisp', 'reed-witch'], miniLevel: 16, mini: 'bogsnapper', bossLevel: 17, boss: 'mother-murk', potions: 3, potion: 'potion-3' },
  { name: 'Frostcrown', level: 18, rank: 5, mobs: ['snow-goat', 'crag-goblin', 'pebble-golem', 'frostling'], miniLevel: 20, mini: 'old-bighorn', bossLevel: 21, boss: 'frostbeard', potions: 3, potion: 'potion-3' },
  { name: 'Rootways', level: 5, rank: 1, mobs: ['wolf', 'glowcap'], miniLevel: 5, mini: 'wolf-alpha', bossLevel: 5, boss: 'old-rootbeard', potions: 3, potion: 'potion' },
  { name: 'Meadows', level: 3, rank: 1, mobs: ['slime', 'wolf', 'bandit', 'wisp'], miniLevel: 5, mini: 'wolf-alpha', bossLevel: 6, boss: 'thornwood-warden', potions: 2, potion: 'potion' },
  { name: 'Forest', level: 7, rank: 2, mobs: ['spider', 'treant', 'outlaw', 'wraith'], miniLevel: 8, mini: 'spider-queen', bossLevel: 9, boss: 'briar-king', potions: 2, potion: 'potion-2' },
  { name: 'Fields', level: 10, rank: 3, mobs: ['ice-wolf', 'yeti', 'frost-wisp', 'ice-golem'], miniLevel: 12, mini: 'yeti-elder', bossLevel: 13, boss: 'frost-matriarch', potions: 2, potion: 'potion-2' },
];

/** A character of this class and path at this level, with the region's gear and its points spent as a player would. */
function build(classId: ClassId, path: string | null, level: number, rank: number, potion: string, potions: number): { state: GameState; c: Character } {
  const state = newGame({ seed: 'sim', player: 'p', name: 'Sim', classId });
  let c = state.characters.p!;
  const cls = CLASS_DATA[classId]!;
  const grown = level - 1;
  c = {
    ...c,
    level,
    maxHp: cls.hp + cls.growth.hp * grown,
    maxMana: cls.mana + cls.growth.mana * grown,
    attack: cls.attack + cls.growth.attack * grown,
    defense: cls.defense + cls.growth.defense * grown,
    items: { [potion]: potions },
  };
  const equipment = { ...c.equipment };
  // Half the slots filled: what a player passing through has bought and found.
  (['weapon', 'armour', 'helm', 'boots'] as const).forEach((slot, i) => {
    equipment[slot] = plainGear(`g${i}`, slot, rank, LINE[classId], classId);
  });
  c = { ...c, equipment };
  // Points: down the chosen tree first (first ranks), then the class's own, then raising the tree's and the class's.
  let points = pointsForLevel(level);
  const abilities: Record<string, number> = { ...c.abilities };
  const nodes = path ? cls.trees[path]!.nodes : [];
  for (const id of nodes) {
    if (points > 0 && level >= ABILITIES[id]!.level) {
      abilities[id] = 1;
      points--;
    }
  }
  for (const id of cls.core) if (!abilities[id] && points > 0 && level >= ABILITIES[id]!.level) (abilities[id] = 1), points--;
  for (const id of [...nodes].reverse()) while (points > 0 && abilities[id] && abilities[id]! < ABILITIES[id]!.ranks.length) (abilities[id] = abilities[id]! + 1), points--;
  for (const id of cls.core) while (points > 0 && abilities[id] && abilities[id]! < 3) (abilities[id] = abilities[id]! + 1), points--;
  const actives = nodes.filter((id) => abilities[id] && !ABILITIES[id]!.rule && !ABILITIES[id]!.ranks[0]!.flee).reverse();
  const carried = [...new Set([...actives, ...cls.kit, ...cls.core.filter((id) => abilities[id])])].slice(0, 4);
  c = { ...c, abilities, carried };
  const s = stats(c);
  c = { ...c, hp: s.maxHp, mana: s.maxMana };
  return { state: { ...state, characters: { p: c } }, c };
}

interface Tally {
  wins: number;
  rounds: number;
  lost: number;
  dmg: number;
}

function play(classId: ClassId, path: string | null, level: number, rank: number, enemy: string, potion: string, potions: number, n: number): Tally {
  const t: Tally = { wins: 0, rounds: 0, lost: 0, dmg: 0 };
  for (let i = 0; i < n; i++) {
    const rng = makeRng(`${classId}${path}${enemy}${i}`);
    const { state: fresh, c } = build(classId, path, level, rank, potion, potions);
    const start = startFight(c, enemy, c.space, false, {}, rng);
    let state: GameState = { ...fresh, characters: { p: start } };
    const maxHp = stats(start).maxHp;
    let round = 0;
    const startHp = start.fight!.enemy.maxHp;
    for (; round < 60; round++) {
      const me = state.characters.p!;
      if (!me.fight) break;
      const { move, guard } = choose(me);
      const r = apply(state, { type: 'fight', id: `r${round}`, player: 'p', move, guard } as never, rng, 1e9);
      if (r.events.some((e) => e.type === 'rejected')) throw new Error(`rejected: ${JSON.stringify(move)} ${JSON.stringify(r.events[0])}`);
      state = r.state;
      if (r.events.some((e) => e.type === 'died')) {
        t.rounds += round + 1;
        t.lost += 1;
        round = -1;
        break;
      }
    }
    if (round >= 0) {
      const me = state.characters.p!;
      t.wins += 1;
      t.rounds += round;
      t.lost += 1 - me.hp / maxHp;
      t.dmg += startHp / Math.max(1, round);
    }
  }
  return { wins: t.wins / n, rounds: t.rounds / n, lost: t.lost / n, dmg: t.dmg / Math.max(1, t.wins) };
}

const pct = (x: number) => `${Math.round(x * 100)}`.padStart(3);
const num = (x: number) => x.toFixed(1).padStart(4);

for (const region of REGIONS) {
  console.log(`\n${region.name}: level ${region.level} with rank ${region.rank} gear. Mobs: win% rounds hp-lost%. Mini at ${region.miniLevel}, boss at ${region.bossLevel}: win% rounds.`);
  console.log(`${'build'.padEnd(20)} ${region.mobs.map((m) => m.slice(0, 9).padEnd(15)).join('')}${region.mini.slice(0, 12).padEnd(14)}${region.boss.slice(0, 12).padEnd(14)}`);
  const sums: string[] = [];
  for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
    for (const path of Object.keys(CLASS_DATA[classId]!.trees)) {
      const cells = region.mobs.map((m) => {
        const t = play(classId, path, region.level, region.rank, m, region.potion, 0, N);
        return `${pct(t.wins)}${num(t.rounds)}${pct(t.lost)}   `.padEnd(15);
      });
      const mini = play(classId, path, region.miniLevel, region.rank, region.mini, region.potion, region.potions, N);
      const boss = play(classId, path, region.bossLevel, region.rank, region.boss, region.potion, region.potions, N);
      console.log(`${`${CLASS_DATA[classId]!.name}/${path ?? '-'}`.padEnd(20)} ${cells.join('')}${pct(mini.wins)}${num(mini.rounds)}     ${pct(boss.wins)}${num(boss.rounds)}`);
      sums.push('');
    }
  }
}
void PROGRESSION;
