// The sensible fighter the sims play with: heals when low, keeps its buffs up, spends its meter, guards as its class wants. Not part of the game.
import { ABILITIES, holdsFor, stats, type Character } from '../rules/src/index.ts';

/** What a sensible player does this round. */
export function choose(c: Character): { move: unknown; guard: string } {
  const f = c.fight!;
  const s = stats(c);
  const e = f.enemy;
  const hpShare = c.hp / s.maxHp;
  const guardFor = (): string => {
    if (f.dance) return 'dodge';
    if (c.classId === 'rogue') return e.charged ? 'block' : 'dodge';
    if (c.classId === 'mage') return c.mana >= 8 ? 'block' : 'brace';
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
    return c.mana >= a.mana;
  });
  const rank = (id: string) => ABILITIES[id]!.ranks[Math.min(c.abilities[id]!, 3) - 1]!;
  // Heal when low.
  if (hpShare < 0.5) {
    const healer = usable.find((id) => rank(id).healShare || rank(id).regen || rank(id).healDealt);
    if (healer && !(rank(healer).regen && f.regen)) return { move: { kind: 'ability', ability: healer }, guard };
  }
  if (hpShare < 0.35 && potion) return { move: { kind: 'item', item: potion[0] }, guard };
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

