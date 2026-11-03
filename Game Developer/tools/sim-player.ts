// The sensible fighter the sims play with: heals when low, keeps its buffs up, spends its meter, guards as its class wants. Not part of the game.
import { ABILITIES, ITEMS, manaCost, holdsFor, stats, type Character } from '../rules/src/index.ts';

/** What a sensible player does this round. */
export function choose(c: Character): { move: unknown; guard: string } {
  const f = c.fight!;
  const s = stats(c);
  const e = f.enemy;
  const hpShare = c.hp / s.maxHp;
  const guardFor = (): string => {
    if (f.dance) return 'dodge';
    if (c.classId === 'rogue') return e.charged ? 'block' : 'dodge';
    // The Ward costs nothing (2026-11-03).
    if (c.classId === 'mage') return 'block';
    if (c.classId === 'ranger') return e.charged ? 'block' : hpShare > 0.5 ? 'counter' : 'block';
    return 'block';
  };
  const guard = guardFor();
  const potion = Object.entries(c.items).find(([id, n]) => n > 0 && id.startsWith('potion'));
  const usable = c.carried.filter((id) => {
    const a = ABILITIES[id]!;
    if (a.oncePerFight && f.used.includes(id)) return false;
    if (a.meter && f.meter < a.meter) return false;
    if (a.meterAll && f.meter < 3) return false;
    // A skill tied to a weapon not in hand is not pressed (2026-11-03).
    if (!holdsFor(c, a.needs)) return false;
    return c.mana >= manaCost(c, id);
  });
  const rank = (id: string) => ABILITIES[id]!.ranks[Math.min(c.abilities[id]!, 3) - 1]!;
  // Heal when low.
  if (hpShare < 0.5) {
    const healer = usable.find((id) => rank(id).healShare || rank(id).regen || rank(id).healDealt);
    if (healer && !(rank(healer).regen && f.regen)) return { move: { kind: 'ability', ability: healer }, guard };
  }
  if (hpShare < 0.35 && potion) return { move: { kind: 'item', item: potion[0] }, guard };
  // Mana short for its spells, a mana potion (2026-11-03: a Wizard+Cleric fell 55 times with 24 in its bag): the biggest one it has.
  const spells = c.carried.filter((id) => ABILITIES[id]!.ranks[0]!.power && holdsFor(c, ABILITIES[id]!.needs));
  const short = spells.length > 0 && spells.every((id) => c.mana < manaCost(c, id)) && c.mana < s.maxMana * 0.3;
  const manaFlask = Object.entries(c.items).filter(([id, n]) => n > 0 && ITEMS[id]?.mana && !ITEMS[id]?.heal).sort((a, b) => (ITEMS[b[0]]!.mana ?? 0) - (ITEMS[a[0]]!.mana ?? 0))[0];
  if (c.classId === 'mage' && short && manaFlask && e.hp > e.maxHp * 0.25) return { move: { kind: 'item', item: manaFlask[0] }, guard };
  // A blow winding up is met first: a barrier, a step aside, an interrupt (2026-11-03: below the rotation they were never reached).
  if (e.charged) {
    for (const id of usable) {
      const r = rank(id);
      if (r.interrupt) return { move: { kind: 'ability', ability: id }, guard };
      if (r.barrierShare && f.barrier === 0) return { move: { kind: 'ability', ability: id }, guard };
      if ((r.evade || r.skip) && !f.evade && !f.skip) return { move: { kind: 'ability', ability: id }, guard };
    }
  }
  // A spell to wind up on a foe that will last: it lands on top of the next move.
  const bigWindup = e.role !== 'mob' && e.hp > e.maxHp * 0.3 && !f.windup ? usable.find((id) => rank(id).windup) : undefined;
  if (bigWindup) return { move: { kind: 'ability', ability: bigWindup }, guard };
  // Keep what lasts going.
  for (const id of usable) {
    const r = rank(id);
    if (r.attackUp && !f.attackUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.infuse && !f.infuse) return { move: { kind: 'ability', ability: id }, guard };
    if (r.coat && !f.coat) return { move: { kind: 'ability', ability: id }, guard };
    if (r.mark && !f.mark) return { move: { kind: 'ability', ability: id }, guard };
    if (r.thornsUp && !f.thornsUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.blockUp && !f.blockUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.counterUp && !r.power && !f.counterUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.spike && !f.spike) return { move: { kind: 'ability', ability: id }, guard };
    if (r.companion && !f.companion) return { move: { kind: 'ability', ability: id }, guard };
    if (r.dance && !f.dance && hpShare > 0.5) return { move: { kind: 'ability', ability: id }, guard };
    if (r.guardian && !f.guardian && hpShare < 0.6) return { move: { kind: 'ability', ability: id }, guard };
    if (r.clone && !f.clone) return { move: { kind: 'ability', ability: id }, guard };
    if (r.consume && (r.consume.kind === 'burn' ? e.burn : e.poison) && (r.consume.kind === 'burn' ? e.burn : e.poison)!.damage * (r.consume.kind === 'burn' ? e.burn : e.poison)!.rounds * r.consume.mult > s.attack * 2) return { move: { kind: 'ability', ability: id }, guard };
    if (r.interrupt && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    if (r.sunder && !e.sunder) return { move: { kind: 'ability', ability: id }, guard };
    if (r.burn && !e.burn) return { move: { kind: 'ability', ability: id }, guard };
    if (r.weaken && !e.weakened && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    if (r.barrierShare && f.barrier === 0 && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    if (r.trap && !f.trap && e.next?.charge) return { move: { kind: 'ability', ability: id }, guard };
    if (r.manaPerMeter && c.mana < s.maxMana * 0.5 && f.meter >= 3) return { move: { kind: 'ability', ability: id }, guard };
    if (r.meterGain && !f.attackUp && hpShare > 0.6) return { move: { kind: 'ability', ability: id }, guard };
    // When the situational ones pay (2026-11-03): a blow winding up is dodged or stopped, or met with a shot that hurts more for it;
    // a foe low is finished; a hero low hits back with what was lost; one who healed much turns it to light; a full meter makes spells stronger.
    if ((r.evade || r.skip) && (e.charged || e.next?.charge) && !f.evade && !f.skip) return { move: { kind: 'ability', ability: id }, guard };
    if (r.windupBonus && (e.charged || e.next?.charge)) return { move: { kind: 'ability', ability: id }, guard };
    if (r.executeBelow && e.hp < e.maxHp * r.executeBelow) return { move: { kind: 'ability', ability: id }, guard };
    if (r.missingPower && hpShare < 0.6) return { move: { kind: 'ability', ability: id }, guard };
    if (r.healedPower && f.healed > s.maxHp * 0.3) return { move: { kind: 'ability', ability: id }, guard };
    if (r.spellUp && !f.spellUp) return { move: { kind: 'ability', ability: id }, guard };
  }
  // The hardest hit there is.
  // A Spellsword fights with the blade; its only spells are what it infuses it with.
  const hitters = usable.filter((id) => rank(id).power && !rank(id).windup && (!c.abilities['spellsword-bond'] || rank(id).melee));
  const windup = usable.find((id) => rank(id).windup && !f.windup);
  if (windup) return { move: { kind: 'ability', ability: windup }, guard };
  hitters.sort((a, b) => (rank(b).power ?? 0) - (rank(a).power ?? 0));
  if (hitters[0] && (rank(hitters[0]).power ?? 0) * 1 > 1) return { move: { kind: 'ability', ability: hitters[0] }, guard };
  return { move: { kind: 'attack' }, guard };
}

