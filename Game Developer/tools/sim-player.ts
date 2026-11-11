// The sensible fighter the sims play with: heals when low, keeps its buffs up, spends its meter, guards as its class wants. Not part of the game.
import { ABILITIES, ITEMS, manaCost, holdsFor, stats, inDark, bloodMax, type Character } from '../rules/src/index.ts';

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
    // Battle Rhythm: a Berserker keeps its shield down while it can afford to, or the streak ends (2026-11-10).
    if (c.abilities['ber-fury'] && !e.charged && hpShare > 0.45) return 'brace';
    return 'block';
  };
  const guard = guardFor();
  const potion = Object.entries(c.items).find(([id, n]) => n > 0 && id.startsWith('potion'));
  const usable = c.carried.filter((id) => {
    const a = ABILITIES[id]!;
    if (a.oncePerFight && f.used.includes(id)) return false;
    if (a.meter && f.meter < a.meter && !(a.darkFree && inDark(f))) return false;
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
  // The Rogue (2026-11-11). In the dark: the free Assassinate, the kill under half, the Ambush. Out of it, with something to
  // use there, a Night Cut to get in. Blood is held until the blade is full (or the foe nearly down), then spent.
  const dark = inDark(f);
  const payoff = usable.filter((id) => ABILITIES[id]!.darkFree || rank(id).darkBonus || rank(id).darkExecute);
  if (dark) {
    const kill = payoff.find((id) => rank(id).darkExecute && e.hp < e.maxHp * rank(id).darkExecute!);
    const best = kill ?? payoff.find((id) => ABILITIES[id]!.darkFree) ?? payoff.find((id) => rank(id).darkBonus);
    if (best) return { move: { kind: 'ability', ability: best }, guard };
  } else if (payoff.length > 0 && e.hp > e.maxHp * 0.2) {
    const way = usable.find((id) => rank(id).dark && rank(id).power);
    if (way) return { move: { kind: 'ability', ability: way }, guard };
  }
  const blood = f.blood ?? 0;
  const cup = bloodMax(c);
  if (cup > 0 && blood >= cup) {
    const spend = usable.filter((id) => rank(id).spendBlood);
    const cut = spend.find((id) => rank(id).bleed && !e.bleed && e.role !== 'mob') ?? spend.find((id) => rank(id).perBlood) ?? spend[0];
    if (cut) return { move: { kind: 'ability', ability: cut }, guard };
  }
  // A spell to wind up on a foe that will last: it lands on top of the next move.
  // Two can be in the air (2026-11-11): the Falling Star first, the Firestorm a round later, and they land together.
  const inAir = [f.windup?.name, ...(f.air ?? []).map((w) => w.name)];
  const callable = (id: string): boolean => !!rank(id).windup && !inAir.includes(ABILITIES[id]!.name);
  const bigWindup = e.role !== 'mob' && e.hp > e.maxHp * 0.3 ? usable.filter(callable).sort((a, b) => (rank(b).windup ?? 0) - (rank(a).windup ?? 0))[0] : undefined;
  if (bigWindup) return { move: { kind: 'ability', ability: bigWindup }, guard };
  // Keep what lasts going.
  for (const id of usable) {
    const r = rank(id);
    // A banner where the fight will last, or at once when it costs no turn; the one for the foe (2026-11-10).
    if (r.banner && !f.banner && (e.role !== 'mob' || c.abilities['war-tactics'] || e.hp > e.maxHp * 0.8)) {
      const want = e.role === 'mob' ? ['war-dread', 'war-valor', 'war-war'] : ['war-war', 'war-dread', 'war-valor'];
      const best = want.find((b) => usable.includes(b)) ?? id;
      return { move: { kind: 'ability', ability: best }, guard };
    }
    if (r.allBanners && e.role !== 'mob') return { move: { kind: 'ability', ability: id }, guard };
    if (r.valorUp && !f.valorUp && e.role !== 'mob') return { move: { kind: 'ability', ability: id }, guard };
    if (r.attackUp && !f.attackUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.infuse && !f.infuse && !f.both) return { move: { kind: 'ability', ability: id }, guard };
    // The Magician (2026-11-11): both blades for a foe that lasts; the storm let go, or frost broken on a wind-up; a fresh fire fed.
    if (r.bothBlades && e.role !== 'mob') return { move: { kind: 'ability', ability: id }, guard };
    if (r.shift && f.infuse && (f.infuse.kind === 'storm' || e.charged || e.role === 'mob')) return { move: { kind: 'ability', ability: id }, guard };
    if (r.combust && e.burn && e.burn.rounds >= 3 && e.hp > e.maxHp * 0.4) return { move: { kind: 'ability', ability: id }, guard };
    if (r.regen && !f.regen && e.role !== 'mob' && hpShare < 0.85) return { move: { kind: 'ability', ability: id }, guard };
    if (r.coat && !f.coat) return { move: { kind: 'ability', ability: id }, guard };
    if (r.mark && !f.mark) return { move: { kind: 'ability', ability: id }, guard };
    // A wall against a creature that barely scratches is a round lost (2026-11-10: the Knight bot spent most rounds on them).
    if (r.thornsUp && !f.thornsUp && (e.role !== 'mob' || hpShare < 0.7)) return { move: { kind: 'ability', ability: id }, guard };
    if (r.blockUp && !f.blockUp && (e.role !== 'mob' || hpShare < 0.7)) return { move: { kind: 'ability', ability: id }, guard };
    if (r.counterUp && !r.power && !f.counterUp) return { move: { kind: 'ability', ability: id }, guard };
    if (r.spike && !f.spike) return { move: { kind: 'ability', ability: id }, guard };
    if (r.companion && !f.companion) return { move: { kind: 'ability', ability: id }, guard };
    if (r.dance && !f.dance && hpShare > 0.5) return { move: { kind: 'ability', ability: id }, guard };
    if (r.guardian && !f.guardian && hpShare < 0.6) return { move: { kind: 'ability', ability: id }, guard };
    if (r.clone && !f.clone) return { move: { kind: 'ability', ability: id }, guard };
    if (r.consume && (r.consume.kind === 'burn' ? e.burn : e.poison) && (r.consume.kind === 'burn' ? e.burn : e.poison)!.damage * (r.consume.kind === 'burn' ? e.burn : e.poison)!.rounds * r.consume.mult > s.attack * 2) return { move: { kind: 'ability', ability: id }, guard };
    if (r.interrupt && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    // A cloud on a foe that will last: fresh poison, or a Caustic about to run out kept going.
    if (r.flask && r.poison && e.role !== 'mob' && (!e.poison || (e.sunder && e.sunder.rounds <= 1))) return { move: { kind: 'ability', ability: id }, guard };
    if (r.sunder && !e.sunder) return { move: { kind: 'ability', ability: id }, guard };
    if (r.burn && !e.burn) return { move: { kind: 'ability', ability: id }, guard };
    if (r.weaken && !e.weakened && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    if (r.barrierShare && f.barrier === 0 && e.charged) return { move: { kind: 'ability', ability: id }, guard };
    if (r.trap && !f.trap && e.next?.charge) return { move: { kind: 'ability', ability: id }, guard };
    if (r.manaPerMeter && c.mana < s.maxMana * 0.5 && f.meter >= 3) return { move: { kind: 'ability', ability: id }, guard };
    if (r.meterGain && !r.banner && !f.attackUp && hpShare > 0.6) return { move: { kind: 'ability', ability: id }, guard };
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
  // A cut that spends blood waits for a full blade; a way into the dark is not a plain hit.
  const hitters = usable.filter((id) => rank(id).power && !rank(id).windup && (!c.abilities['spellsword-bond'] || rank(id).melee) && !(rank(id).spendBlood && cup > 0 && blood < cup && e.hp > e.maxHp * 0.15));
  const windup = usable.find(callable);
  if (windup) return { move: { kind: 'ability', ability: windup }, guard };
  hitters.sort((a, b) => (rank(b).power ?? 0) - (rank(a).power ?? 0));
  if (hitters[0] && (rank(hitters[0]).power ?? 0) * 1 > 1) return { move: { kind: 'ability', ability: hitters[0] }, guard };
  return { move: { kind: 'attack' }, guard };
}

