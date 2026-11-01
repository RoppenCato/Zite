// The chest and the loot reveal's pieces (Mitch, AD, 2026-11-01, `assets/loot/NOTES.md`): the chest atlas with its
// `open` clip, one white glow to tint, the loot card as a nine-slice with a white rim to tint, and two white particle
// sheets, the sparkle and the petal. The files are 2x. This file loads them and says what a reveal shows: the prizes
// read from the events of a landing or a fight, and the words on a card.

import type Phaser from 'phaser';
import { gearPowers, ITEMS, RARITIES, type GameEvent, type GearItem, type Rarity, type Slot } from '../../rules/src/index.ts';
import cardPng from '../../assets/loot/card.png';
import chestData from '../../assets/loot/chest/chest.json';
import chestJson from '../../assets/loot/chest/chest.json?url';
import chestPng from '../../assets/loot/chest/chest.png';
import glowPng from '../../assets/loot/glow.png';
import petalData from '../../assets/loot/petal/petal.json';
import petalJson from '../../assets/loot/petal/petal.json?url';
import petalPng from '../../assets/loot/petal/petal.png';
import sparkleData from '../../assets/loot/sparkle/sparkle.json';
import sparkleJson from '../../assets/loot/sparkle/sparkle.json?url';
import sparklePng from '../../assets/loot/sparkle/sparkle.png';
import { ensureClips, type ActionData } from './clips.ts';

type Actions = Record<string, ActionData>;

export const LOOT_KEYS = { chest: 'chest', sparkle: 'sparkle', petal: 'petal', glow: 'loot-glow', card: 'loot-card' } as const;
export const LOOT_ACTIONS = {
  chest: (chestData as { actions: Actions }).actions,
  sparkle: (sparkleData as { actions: Actions }).actions,
  petal: (petalData as { actions: Actions }).actions,
};
/** The files are 2x: the chest is 160 CSS px wide at this scale. */
export const LOOT_SCALE = 0.5;
/** The card's design size and where its parts sit (Mitch, AD): a 16 px corner for the nine-slice, the icon square, the text. */
export const CARD = { w: 300, h: 120, corner: 16, rim: 11, square: { x: 20, y: 32, size: 56 }, textX: 92, nameY: 30, powerY: 48 } as const;

/** Queue the pieces; call from a scene's preload. */
export function preloadLoot(scene: Phaser.Scene): void {
  const { load, textures } = scene;
  if (!textures.exists(LOOT_KEYS.chest)) load.atlas(LOOT_KEYS.chest, chestPng, chestJson);
  if (!textures.exists(LOOT_KEYS.sparkle)) load.atlas(LOOT_KEYS.sparkle, sparklePng, sparkleJson);
  if (!textures.exists(LOOT_KEYS.petal)) load.atlas(LOOT_KEYS.petal, petalPng, petalJson);
  if (!textures.exists(LOOT_KEYS.glow)) load.image(LOOT_KEYS.glow, glowPng);
  if (!textures.exists(LOOT_KEYS.card)) load.image(LOOT_KEYS.card, cardPng);
}

export function lootReady(scene: Phaser.Scene): boolean {
  return Object.values(LOOT_KEYS).every((k) => scene.textures.exists(k));
}

/** The clips as animations: `chest/open`, `sparkle/play`, `petal/play`. */
export function ensureLootClips(scene: Phaser.Scene): void {
  ensureClips(scene, LOOT_KEYS.chest, LOOT_ACTIONS.chest);
  ensureClips(scene, LOOT_KEYS.sparkle, LOOT_ACTIONS.sparkle);
  ensureClips(scene, LOOT_KEYS.petal, LOOT_ACTIONS.petal);
}

// ---- what a reveal shows --------------------------------------------------------------------------------------------

/** One card of the reveal: a piece of gear (sold at once when the bag was full and something else was pending), gold, or an item. */
export type Prize = { kind: 'gear'; gear: GearItem; sold: number | null; worn?: boolean } | { kind: 'gold'; amount: number } | { kind: 'item'; item: string; count: number };

/** The colour a reveal glows in: the rarity of its best piece, or gold when the chest held only coins and items. */
export type Tier = Rarity | 'gold';

export interface RevealRequest {
  /** The line over the chest: "A chest!", "The vault opens!", "Dropped by King Goo". */
  title: string;
  prizes: Prize[];
  onDone: () => void;
}

/**
 * The prizes in a landing's events: with a chest, everything it held (its gold, its gear, its flask or card) in order;
 * without one, only gear, which the wilds and errands can give. Gold and items from anything but a chest are told in
 * the message line, not on a card.
 */
export function prizesIn(events: GameEvent[]): Prize[] {
  const chest = events.some((e) => e.type === 'chest');
  const prizes: Prize[] = [];
  for (const e of events) {
    if (e.type === 'loot') prizes.push({ kind: 'gear', gear: e.gear, sold: null });
    else if (e.type === 'bagFull') {
      const last = prizes[prizes.length - 1];
      if (last?.kind === 'gear' && last.gear.id === e.gear.id) last.sold = e.sold;
    } else if (e.type === 'equipped') {
      const last = prizes[prizes.length - 1];
      if (last?.kind === 'gear' && last.gear.id === e.gear.id) last.worn = true;
    } else if (chest && e.type === 'gold' && e.delta > 0) prizes.push({ kind: 'gold', amount: e.delta });
    else if (chest && e.type === 'found') prizes.push({ kind: 'item', item: e.item, count: e.count });
  }
  return prizes;
}

/** Only the gear in a fight's events: a drop is the fight's prize; its xp and gold are the fight's own words. */
export function gearIn(events: GameEvent[]): Prize[] {
  return prizesIn(events.filter((e) => e.type === 'loot' || e.type === 'bagFull' || e.type === 'equipped'));
}

export function tierOf(prizes: Prize[]): Tier {
  let best = -1;
  for (const p of prizes) if (p.kind === 'gear') best = Math.max(best, RARITIES.indexOf(p.gear.rarity));
  return best >= 0 ? RARITIES[best]! : 'gold';
}

const SLOT_WORDS: Record<Slot, string> = { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', armour: 'Coat', gloves: 'Gloves', boots: 'Boots', cape: 'Cape', trinket: 'Charm' };

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The words on a card: the name, the line of its power under it, the word in the icon's square until the gear icons come, its tier. */
export function cardWords(p: Prize): { name: string; power: string; square: string; tier: Tier } {
  switch (p.kind) {
    case 'gear': {
      const g = p.gear;
      const kind = g.name.toLowerCase() === g.base.toLowerCase() ? capitalise(g.rarity) : g.unique ? `Unique ${SLOT_WORDS[g.slot].toLowerCase()}` : `${capitalise(g.rarity)} ${g.base}`;
      const parts = [kind, ...gearPowers(g)];
      if (p.worn) parts.push('put on');
      if (p.sold !== null) parts.push(`no room: sold for ${p.sold} gold`);
      return { name: g.name, power: parts.join(' · '), square: SLOT_WORDS[g.slot], tier: g.rarity };
    }
    case 'gold':
      return { name: `${p.amount} gold`, power: 'Coins for the shop, the trainer and the gambler.', square: 'Gold', tier: 'gold' };
    case 'item': {
      const item = ITEMS[p.item];
      const name = item?.name ?? p.item;
      return { name: p.count > 1 ? `${p.count} ${name}` : name, power: item?.text ?? '', square: item?.dice ? 'Card' : 'Flask', tier: 'gold' };
    }
  }
}
