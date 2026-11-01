// Small pieces shared by the board, the fight and the shop: refusing, replacing a character in the state, gold, healing,
// mana, xp and levels, the bag.

import { CLASS_DATA, GEAR, ITEMS, PROGRESSION } from './data.ts';
import { stats } from './gear.ts';
import type { Action, ApplyResult, Character, GameEvent, GameState, GearItem, RejectReason } from './types.ts';

export function reject(state: GameState, action: Action, reason: RejectReason): ApplyResult {
  return { state, events: [{ type: 'rejected', action: action.id, player: action.player, reason }] };
}

export function withCharacter(state: GameState, character: Character): GameState {
  return { ...state, characters: { ...state.characters, [character.id]: character } };
}

/** Gold never goes below 0: a loss takes what there is. */
export function giveGold(c: Character, delta: number, action: Action, events: GameEvent[]): Character {
  const gold = Math.max(0, c.gold + delta);
  events.push({ type: 'gold', action: action.id, player: action.player, delta: gold - c.gold, gold });
  return { ...c, gold };
}

/** HP never goes above the maximum (gear counted). */
export function heal(c: Character, amount: number, action: Action, events: GameEvent[]): Character {
  const hp = Math.min(stats(c).maxHp, c.hp + amount);
  events.push({ type: 'healed', action: action.id, player: action.player, amount: hp - c.hp, hp });
  return { ...c, hp };
}

/** Mana never goes above the maximum (gear counted); nothing is said when there is nothing to give. */
export function restoreMana(c: Character, amount: number, action: Action, events: GameEvent[]): Character {
  const mana = Math.min(stats(c).maxMana, c.mana + amount);
  if (mana === c.mana) return c;
  events.push({ type: 'mana', action: action.id, player: action.player, delta: mana - c.mana, mana });
  return { ...c, mana };
}

/** A consumable into the bag. */
export function giveItem(c: Character, item: string, count: number, action: Action, events: GameEvent[]): Character {
  if (!ITEMS[item]) return c;
  events.push({ type: 'found', action: action.id, player: action.player, item, count });
  return { ...c, items: { ...c.items, [item]: (c.items[item] ?? 0) + count } };
}

/** One fewer of the item; a count of 0 is dropped from the bag. */
export function spend(c: Character, item: string): Character {
  const items = { ...c.items, [item]: (c.items[item] ?? 0) - 1 };
  if (items[item]! <= 0) delete items[item];
  return { ...c, items };
}

/**
 * Gear found: put on at once when its slot is empty (Robin, 2026-11-01), else into the bag; a full bag (`bagLimit`) holds the
 * piece in `offer` to be sold or left (Robin, 2026-10-31: a bag limit with a sell-or-drop choice), or, when something else is
 * pending, sells it on the spot.
 */
export function addLoot(c: Character, gear: GearItem, action: Action, events: GameEvent[]): Character {
  events.push({ type: 'loot', action: action.id, player: action.player, gear });
  if (!c.equipment[gear.slot]) {
    events.push({ type: 'equipped', action: action.id, player: action.player, gear, replaced: null });
    return { ...c, equipment: { ...c.equipment, [gear.slot]: gear } };
  }
  if (c.bag.length < GEAR.bagLimit) return { ...c, bag: [...c.bag, gear] };
  if (!c.offer) {
    events.push({ type: 'bagFull', action: action.id, player: action.player, gear, sold: null });
    return { ...c, offer: { kind: 'loot', gear } };
  }
  const price = sellPrice(gear);
  events.push({ type: 'bagFull', action: action.id, player: action.player, gear, sold: price });
  return { ...c, gold: c.gold + price };
}

/** The level a total of `xp` gives, from the progression table: 1 at 0 xp, the table's length at most. */
export function levelFor(xp: number): number {
  const table = PROGRESSION.xpForLevel;
  let level = 1;
  for (let i = 1; i < table.length; i++) {
    if (xp >= table[i]!) level = i + 1;
  }
  return level;
}

/** Add xp, and every level the table gives: the class's growth, with the HP and mana gained healed. */
export function gainXp(c: Character, xp: number, action: Action, events: GameEvent[]): Character {
  let next: Character = { ...c, xp: c.xp + xp };
  const growth = CLASS_DATA[c.classId].growth;
  for (let level = c.level + 1; level <= levelFor(next.xp); level++) {
    next = {
      ...next,
      level,
      maxHp: next.maxHp + growth.hp,
      hp: next.hp + growth.hp,
      maxMana: next.maxMana + growth.mana,
      mana: next.mana + growth.mana,
      attack: next.attack + growth.attack,
      defense: next.defense + growth.defense,
    };
    events.push({ type: 'levelled', action: action.id, player: action.player, level, maxHp: next.maxHp, maxMana: next.maxMana, attack: next.attack, defense: next.defense });
  }
  return next;
}

/** A fresh gear id from the state's counter. */
export function nextGearId(state: GameState): { state: GameState; id: string } {
  return { state: { ...state, nextItem: state.nextItem + 1 }, id: `g${state.nextItem}` };
}

/** The sell price of a piece: a share of what it is worth. */
export function sellPrice(gear: GearItem): number {
  return Math.max(1, Math.round(gear.price * GEAR.sellShare));
}
