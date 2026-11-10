// Moving the characters from the home link to the online app (Robin, 2026-11-10: "1 now, 3 later": play away from home
// now, the shared world in the cloud later). A solo save lives in the browser's storage of the page it was played on, so
// the characters played on the home link (http://192.168.0.43:5173) are invisible to the public site. The move packs every
// solo save on this phone (gzip, base64) into the address of the public site, which unpacks them into its own storage
// before the game starts (boot.ts). One tap, no server, same phone. A full save is about 46 KB packed; six fit in one address.

import { migrate } from '../../rules/src/index.ts';
import { SAVE_KEY, SAVE_VERSION } from './local-game.ts';
import { saveKeys, setActiveSave, setFlow } from './slots.ts';

/** Where the online app lives; `?site=` in the address overrides it (for a test between two local origins). */
export const PUBLIC_SITE = 'https://zite-game.pages.dev';
/** The hash the public site watches for. */
const MARK = '#move=';
/** How many were moved on this page load, for the list's one-time line. */
const MOVED_KEY = 'boardworld.moved';

export function moveTarget(search: string): string {
  const site = new URLSearchParams(search).get('site');
  return (site || PUBLIC_SITE).replace(/\/$/, '');
}

/** True when this page is not the online app itself: the move button shows here. */
export function canMoveFrom(origin: string, search: string): boolean {
  return origin !== moveTarget(search);
}

/** Pack every solo save on this phone into the online app's address, and go there. */
export async function moveAll(storage: Storage, search: string): Promise<void> {
  const saves: unknown[] = [];
  for (const key of saveKeys(storage)) {
    try {
      saves.push(JSON.parse(storage.getItem(key)!));
    } catch {
      // A save that will not read stays behind.
    }
  }
  if (!saves.length) return;
  const packed = await pack(JSON.stringify(saves));
  // ?mute=1 travels along, so a test in the browser pane stays silent.
  const quiet = new URLSearchParams(search).get("mute") ? "?mute=1" : "";
  location.assign(`${moveTarget(search)}/${quiet}${MARK}${packed}`);
}

/** True when the address carries moved saves. */
export function hasMove(hash: string): boolean {
  return hash.startsWith(MARK);
}

/**
 * Unpack the saves from the address into this page's storage: one that reads (through `migrate`, so an older save comes
 * up to date) goes under a free key; a character already here with the same name and world is replaced, not doubled.
 * The last one becomes the active save, and the list opens next with a line saying how many came.
 */
export async function receiveMove(storage: Storage, hash: string): Promise<number> {
  const raw = JSON.parse(await unpack(hash.slice(MARK.length))) as unknown;
  const list = Array.isArray(raw) ? raw : [raw];
  let moved = 0;
  let last: string | null = null;
  for (const save of list) {
    // A save is { version, state, rng }: the state comes up to date through migrate; a save that will not read is skipped.
    const state = migrate((save as { state?: unknown })?.state);
    if (!state) continue;
    const me = Object.values(state.characters)[0];
    if (!me) continue;
    const key = sameCharacter(storage, state.seed, me.name) ?? freeKey(storage);
    const rng = typeof (save as { rng?: unknown }).rng === 'number' ? (save as { rng: number }).rng : 0;
    storage.setItem(key, JSON.stringify({ version: SAVE_VERSION, state, rng }));
    moved += 1;
    last = key;
  }
  if (last) {
    setActiveSave(storage, last);
    setFlow('choose');
    try {
      sessionStorage.setItem(MOVED_KEY, String(moved));
    } catch {
      // No line, then.
    }
  }
  return moved;
}

/** The one-time line for the list, read once. */
export function takeMovedLine(): string | null {
  try {
    const n = sessionStorage.getItem(MOVED_KEY);
    if (!n) return null;
    sessionStorage.removeItem(MOVED_KEY);
    return n === '1' ? 'One character moved here from the home link.' : `${n} characters moved here from the home link.`;
  } catch {
    return null;
  }
}

function sameCharacter(storage: Storage, seed: string, name: string): string | null {
  for (const key of saveKeys(storage)) {
    try {
      const s = (JSON.parse(storage.getItem(key)!) as { state: { seed: string; characters: Record<string, { name: string }> } }).state;
      if (s.seed === seed && Object.values(s.characters)[0]?.name === name) return key;
    } catch {
      // Not a save we can read.
    }
  }
  return null;
}

function freeKey(storage: Storage): string {
  const used = new Set(saveKeys(storage));
  if (!used.has(SAVE_KEY)) return SAVE_KEY;
  for (let n = 2; ; n++) if (!used.has(`${SAVE_KEY}.${n}`)) return `${SAVE_KEY}.${n}`;
}

// ---- gzip + base64url, in the browser's own streams (Chrome 80 and on) -----------------------------------------------

async function pack(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const gz = await pipe(bytes, new CompressionStream('gzip'));
  return toBase64Url(gz);
}

async function unpack(packed: string): Promise<string> {
  const gz = fromBase64Url(packed);
  const bytes = await pipe(gz, new DecompressionStream('gzip'));
  return new TextDecoder().decode(bytes);
}

async function pipe(bytes: Uint8Array, through: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(through);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
