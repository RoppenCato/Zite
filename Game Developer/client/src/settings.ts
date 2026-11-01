// The settings (mine, 2026-11-01, from Robin's list and the brief's "fewer effects" switch): sound on or off (for the
// sound layer to come), fewer effects (no tweens: bars and cameras jump, blows do not flash), larger text. Kept in
// localStorage; read where they matter. Vibration (2026-11-01): the short buzz on a press, on phones that have it.

const KEY = 'boardworld.settings';

export interface Settings {
  sound: boolean;
  fewerEffects: boolean;
  largeText: boolean;
  vibration: boolean;
}

const DEFAULTS: Settings = { sound: true, fewerEffects: false, largeText: false, vibration: true };

function load(storage: Storage | null): Settings {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // A broken value: the defaults.
  }
  return { ...DEFAULTS };
}

class Store {
  private current: Settings;
  private readonly storage: Storage | null;

  constructor(storage: Storage | null) {
    this.storage = storage;
    this.current = load(storage);
  }

  get(): Settings {
    return this.current;
  }

  set(patch: Partial<Settings>): Settings {
    this.current = { ...this.current, ...patch };
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.current));
    } catch {
      // Storage full or blocked: the setting holds for this page only.
    }
    return this.current;
  }

  /** The time a tween or a camera glide takes: none with fewer effects. */
  ms(ms: number): number {
    return this.current.fewerEffects ? 0 : ms;
  }

  /** A font size, a couple of points larger with large text: "15px" → "17px". */
  font(px: number): string {
    return `${this.current.largeText ? px + 2 : px}px`;
  }
}

export const settings = new Store(typeof window === 'undefined' ? null : window.localStorage);
