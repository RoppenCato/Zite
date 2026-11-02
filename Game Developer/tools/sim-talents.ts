// Does every talent do something, and how much? (Robin, 2026-11-02: "Try different specs and talents".) Each talent is taken away from a character who has its whole tree, and the
// same seeded fights are played with and without it. A talent whose fights come out exactly the same does nothing; the difference shows the ones too strong or too weak. Not part of the game.
//   node tools/sim-talents.ts [fights]

import { ABILITIES, apply, CLASS_DATA, makeRng, newGame, plainGear, startFight, stats, type Character, type ClassId, type GameState, type GearLine } from '../rules/src/index.ts';
import { baseNumbers } from '../rules/src/skills.ts';

const FIGHTS = Number(process.argv[2]) || 60;
const LINE: Record<string, GearLine> = { warrior: 'heavy', mage: 'magic', rogue: 'light', ranger: 'light' };
const LEVEL = 30;
const P = 'p';

function character(classId: ClassId, abilities: Record<string, number>): { state: GameState; c: Character } {
  const state = newGame({ seed: 'talents', player: P, name: 'Sim', classId });
  let c: Character = { ...state.characters[P]!, level: LEVEL, ...baseNumbers(classId, LEVEL), items: { potion: 2 } };
  const equipment = { ...c.equipment };
  (['weapon', 'armour', 'helm', 'boots', 'gloves', 'shield'] as const).forEach((slot, i) => {
    if (slot === 'shield' && classId !== 'warrior') return;
    equipment[slot] = plainGear(`g${i}`, slot, 5, LINE[classId]!, classId);
  });
  c = { ...c, equipment, abilities };
  return { state, c };
}

interface Tally {
  dealt: number;
  lost: number;
  rounds: number;
  wins: number;
  mana: number;
  stat: string;
}

/** Fights with these talents: every active takes its turn, every guard too, and half start hurt so what wakes at low HP wakes. */
function fights(classId: ClassId, abilities: Record<string, number>, actives: string[], seed: string): Tally {
  const out: Tally = { dealt: 0, lost: 0, rounds: 0, wins: 0, mana: 0, stat: '' };
  const GUARDS = ['block', 'dodge', 'counter', 'brace', 'none'];
  for (let i = 0; i < FIGHTS; i++) {
    const { state, c: base } = character(classId, abilities);
    const s0 = stats(base);
    out.stat = JSON.stringify(s0);
    const hurt = i % 2 === 1;
    const c0: Character = { ...base, hp: hurt ? Math.round(s0.maxHp * 0.3) : s0.maxHp, mana: s0.maxMana, carried: actives };
    const rng = makeRng(`${seed}-${i}`);
    let c = startFight(c0, 'frostbeard', c0.space, false);
    c = { ...c, fight: { ...c.fight!, enemy: { ...c.fight!.enemy, level: 25, hp: 2500, maxHp: 2500, attack: 40 + (i % 3) * 20, defense: 30 } } };
    let st: GameState = { ...state, characters: { [P]: c } };
    let n = 0;
    for (let round = 0; round < 18; round++) {
      const me = st.characters[P]!;
      if (!me.fight) break;
      const id = actives.length ? actives[(round + i) % actives.length]! : null;
      const move = id ? { kind: 'ability', ability: id } : { kind: 'attack' };
      const guard = GUARDS[(round + i) % GUARDS.length]!;
      const before = me.fight.enemy.hp;
      let r = apply(st, { type: 'fight', id: `f${n++}`, player: P, move, guard } as never, rng, 1_000_000);
      if (r.events[0]?.type === 'rejected') r = apply(st, { type: 'fight', id: `f${n++}`, player: P, move: { kind: 'attack' }, guard } as never, rng, 1_000_000);
      st = r.state;
      const after = st.characters[P]!;
      out.rounds += 1;
      out.dealt += before - (after.fight?.enemy.hp ?? 0);
      if (!after.fight) {
        if (r.events.some((e) => e.type === 'won')) out.wins += 1;
        // Whatever a win or a fall gives back counts too.
        out.lost += me.hp - after.hp;
        break;
      }
      out.lost += me.hp - after.hp;
      out.mana += me.mana - after.mana;
    }
  }
  return out;
}

const dead: string[] = [];
const rows: { id: string; cls: string; tree: string; dealt: number; lost: number; kind: string }[] = [];
for (const classId of Object.keys(CLASS_DATA) as ClassId[]) {
  const cls = CLASS_DATA[classId]!;
  for (const [treeId, tree] of Object.entries(cls.trees)) {
    const full: Record<string, number> = Object.fromEntries(cls.core.map((id) => [id, 3] as const));
    for (const id of tree.nodes) full[id] = ABILITIES[id]!.ranks.length;
    const actives = tree.nodes.filter((id) => !ABILITIES[id]!.rule && !ABILITIES[id]!.ranks[0]!.flee);
    const base = fights(classId, full, actives, treeId);
    for (const id of tree.nodes) {
      const { [id]: _gone, ...without } = full;
      const fewer = actives.filter((x) => x !== id);
      const t = fights(classId, without, fewer, treeId);
      const same = t.dealt === base.dealt && t.lost === base.lost && t.rounds === base.rounds && t.mana === base.mana && t.stat === base.stat;
      if (same) dead.push(`${id} (${treeId}${ABILITIES[id]!.rule ? ', passive' : ''})`);
      rows.push({ id, cls: classId, tree: treeId, dealt: base.dealt / base.rounds / (t.dealt / t.rounds) - 1, lost: base.lost / base.rounds / Math.max(1, t.lost / t.rounds) - 1, kind: ABILITIES[id]!.rule ? 'passive' : 'active' });
    }
  }
}
console.log(`Does nothing in ${FIGHTS} fights: ${dead.length ? '' : 'none'}`);
for (const d of dead) console.log(`  ${d}`);
const pct = (x: number): string => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(0)}%`;
console.log('\nStrongest passives by damage:');
for (const r of rows.filter((x) => x.kind === 'passive').sort((a, b) => b.dealt - a.dealt).slice(0, 10)) console.log(`  ${r.id.padEnd(18)} ${r.tree.padEnd(14)} damage ${pct(r.dealt)} taken ${pct(r.lost)}`);
console.log('Weakest passives (damage and taken both near nothing):');
for (const r of rows.filter((x) => x.kind === 'passive').sort((a, b) => Math.abs(a.dealt) + Math.abs(a.lost) - Math.abs(b.dealt) - Math.abs(b.lost)).slice(0, 10)) console.log(`  ${r.id.padEnd(18)} ${r.tree.padEnd(14)} damage ${pct(r.dealt)} taken ${pct(r.lost)}`);
