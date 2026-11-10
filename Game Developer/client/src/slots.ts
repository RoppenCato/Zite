// Several characters on one phone (Robin, 2026-11-02: "would it be possible to get save slots? So i can save different characters?"). Solo: each character is a save of its own in the
// browser, the first under the old key so old saves simply appear. Shared world: each is an account on the server, and this phone keeps the list of their tokens, the current one under
// the old key. A switch sets the current one and loads the page again, so no scene has to clean up after another. Layout and numbers mine.

import { CLASS_IDS, type ClassId, type GameState } from '../../rules/src/index.ts';
import type { GameHolder } from './game-holder.ts';
import { SAVE_KEY } from './local-game.ts';
import { ACCOUNT_KEY, storedAccount } from './remote-game.ts';

export const MAX_SLOTS = 6;
const ACTIVE_KEY = 'boardworld.active';
const ACCOUNTS_KEY = 'boardworld.accounts';
/** This tab's way in: straight to the current character, the list, or the character screen. */
const FLOW_KEY = 'boardworld.flow';

export type Flow = 'picked' | 'choose' | 'new' | null;

export interface Slot {
  /** The save's key, or the account's token. */
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  land: string;
}

interface StoredAccount extends Partial<Slot> {
  token: string;
  player: string;
  recovery?: string;
}

export function flow(): Flow {
  try {
    return sessionStorage.getItem(FLOW_KEY) as Flow;
  } catch {
    return null;
  }
}

export function setFlow(next: Flow): void {
  try {
    if (next) sessionStorage.setItem(FLOW_KEY, next);
    else sessionStorage.removeItem(FLOW_KEY);
  } catch {
    // Blocked: the page falls back to its usual way in.
  }
}

/** Every solo save's key on this phone, in order. */
export function saveKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key === SAVE_KEY || key?.startsWith(`${SAVE_KEY}.`)) keys.push(key);
  }
  return keys.sort();
}

/** The solo characters on this phone. A save that will not read is left out, and left alone. */
export function localSlots(storage: Storage | null): Slot[] {
  if (!storage) return [];
  const out: Slot[] = [];
  try {
    for (const id of saveKeys(storage)) {
      try {
        const state = (JSON.parse(storage.getItem(id)!) as { state: GameState }).state;
        const c = Object.values(state.characters)[0];
        if (c && CLASS_IDS.includes(c.classId)) out.push({ id, name: c.name, classId: c.classId, level: c.level, land: state.board.areas[state.board.spaces[c.space]?.area ?? '']?.name ?? '' });
      } catch {
        // Not a save we can read.
      }
    }
  } catch {
    // Storage blocked.
  }
  return out;
}

/** The save to open: the one last played, or the first there is. */
export function activeSave(storage: Storage | null): string {
  try {
    const active = storage?.getItem(ACTIVE_KEY);
    if (active && storage?.getItem(active)) return active;
    if (storage) return saveKeys(storage)[0] ?? SAVE_KEY;
  } catch {
    // Storage blocked.
  }
  return SAVE_KEY;
}

export function setActiveSave(storage: Storage | null, key: string): void {
  try {
    storage?.setItem(ACTIVE_KEY, key);
  } catch {
    // Storage blocked: this page keeps playing it anyway.
  }
}

/** A key no save uses yet. */
export function freeSaveKey(storage: Storage | null): string {
  if (!storage) return SAVE_KEY;
  const used = new Set(saveKeys(storage));
  if (!used.has(SAVE_KEY)) return SAVE_KEY;
  for (let n = 2; ; n++) if (!used.has(`${SAVE_KEY}.${n}`)) return `${SAVE_KEY}.${n}`;
}

export function removeSave(storage: Storage | null, key: string): void {
  try {
    storage?.removeItem(key);
    if (storage?.getItem(ACTIVE_KEY) === key) storage.removeItem(ACTIVE_KEY);
  } catch {
    // Storage blocked.
  }
}

function accounts(storage: Storage | null): StoredAccount[] {
  try {
    const list = JSON.parse(storage?.getItem(ACCOUNTS_KEY) ?? '[]') as StoredAccount[];
    return Array.isArray(list) ? list.filter((a) => typeof a?.token === 'string' && typeof a?.player === 'string') : [];
  } catch {
    return [];
  }
}

function writeAccounts(storage: Storage | null, list: StoredAccount[]): void {
  try {
    storage?.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked.
  }
}

/** The shared world's characters on this phone: the list, and the current account if it is not on it yet. */
export function onlineSlots(storage: Storage | null): Slot[] {
  const list = accounts(storage);
  const current = storedAccount(storage);
  if (current && !list.some((a) => a.token === current.token)) list.unshift({ ...current });
  return list.map((a) => ({ id: a.token, name: a.name ?? 'Your character', classId: a.classId && CLASS_IDS.includes(a.classId) ? a.classId : 'warrior', level: a.level ?? 1, land: a.land ?? '' }));
}

/** Writes down the character now being played, so the list can show it when it is not connected. */
export function rememberAccount(storage: Storage | null, game: GameHolder): void {
  const current = storedAccount(storage);
  if (!current) return;
  const c = game.me;
  const entry: StoredAccount = { ...current, name: c.name, classId: c.classId, level: c.level, land: game.state.board.areas[game.state.board.spaces[c.space]?.area ?? '']?.name ?? '' };
  const list = accounts(storage);
  const at = list.findIndex((a) => a.token === current.token);
  if (at >= 0) list[at] = entry;
  else list.push(entry);
  writeAccounts(storage, list);
}

/** Makes this account the current one. */
export function useAccount(storage: Storage | null, token: string): void {
  const a = accounts(storage).find((x) => x.token === token);
  if (!a) return;
  try {
    storage?.setItem(ACCOUNT_KEY, JSON.stringify({ token: a.token, player: a.player, recovery: a.recovery }));
  } catch {
    // Storage blocked.
  }
}

/** Off this phone's list. The account lives on, on the server; its code brings it back. */
export function forgetAccount(storage: Storage | null, token: string): void {
  writeAccounts(storage, accounts(storage).filter((a) => a.token !== token));
  try {
    if (storedAccount(storage)?.token === token) storage?.removeItem(ACCOUNT_KEY);
  } catch {
    // Storage blocked.
  }
}

/** Before a new character on the server: the current one stays on the list, and the screen starts with no account. */
export function stepOutOfAccount(storage: Storage | null): void {
  const current = storedAccount(storage);
  if (current && !accounts(storage).some((a) => a.token === current.token)) writeAccounts(storage, [...accounts(storage), { ...current }]);
  try {
    storage?.removeItem(ACCOUNT_KEY);
  } catch {
    // Storage blocked.
  }
}
