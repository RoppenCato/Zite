// The sounds (chapter 1, step 3 began it with the die; step 7 finishes it with music). Nigel, SD delivers short sounds as
// audio sprites: one OGG and a spritemap in seconds (`assets/sound/<name>/<name>.ogg` and `.json`, the names inside like
// `ui/die-land-b-1`). The scenes ask for a sound by name, or by a family (`ui/die-land` picks one of `-1`, `-2`, `-3`
// at random, as Nigel, SD's variants are made for); a name no sprite holds yet is silent, so a hook can be written before
// its sound exists. The sound setting and `?mute=1` keep everything quiet.

import type Phaser from 'phaser';
import uiJson from '../../assets/sound/ui/ui.json?url';
import uiOgg from '../../assets/sound/ui/ui.ogg';
import fightJson from '../../assets/sound/fight/fight.json?url';
import fightOgg from '../../assets/sound/fight/fight.ogg';
import spotsJson from '../../assets/sound/ui-spots/ui-spots.json?url';
import spotsOgg from '../../assets/sound/ui-spots/ui-spots.ogg';
import meadowsBoardOgg from '../../assets/sound/music/meadows-board.ogg';
import creaturesMeadowsJson from '../../assets/sound/creatures-meadows/creatures-meadows.json?url';
import creaturesMeadowsOgg from '../../assets/sound/creatures-meadows/creatures-meadows.ogg';
import fightClassesJson from '../../assets/sound/fight-classes/fight-classes.json?url';
import fightClassesOgg from '../../assets/sound/fight-classes/fight-classes.ogg';
import creaturesForestJson from '../../assets/sound/creatures-forest/creatures-forest.json?url';
import creaturesForestOgg from '../../assets/sound/creatures-forest/creatures-forest.ogg';
import { settings } from './settings.ts';

interface SpriteFile {
  key: string;
  json: string;
  ogg: string;
  /** The gain of this sprite against the others (Nigel, SD: the UI bus a touch under the fight bus). */
  volume: number;
  /** Loaded only when asked for: the other classes' abilities, a later area's voices and steps. */
  lazy?: boolean;
}

const SPRITES: SpriteFile[] = [
  { key: 'ui-sounds', json: uiJson, ogg: uiOgg, volume: 0.8 },
  { key: 'fight', json: fightJson, ogg: fightOgg, volume: 1 },
  { key: 'ui-spots', json: spotsJson, ogg: spotsOgg, volume: 0.8 },
  // The meadows' creature voices; an area's voices belong with its load once areas load their own (Nigel, SD).
  { key: 'creatures-meadows', json: creaturesMeadowsJson, ogg: creaturesMeadowsOgg, volume: 1 },
  { key: 'fight-classes', json: fightClassesJson, ogg: fightClassesOgg, volume: 1, lazy: true },
  { key: 'creatures-forest', json: creaturesForestJson, ogg: creaturesForestOgg, volume: 1, lazy: true },
];
// The far lands' voices (Nigel, SD): a sprite in the folder is a sprite in the game, until then silence.
const FAR_VOICES = import.meta.glob('../../assets/sound/creatures-{pirates,giants,crown}/*.{json,ogg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
for (const key of ['creatures-pirates', 'creatures-giants', 'creatures-crown']) {
  const json = FAR_VOICES[`../../assets/sound/${key}/${key}.json`];
  const ogg = FAR_VOICES[`../../assets/sound/${key}/${key}.ogg`];
  if (json && ogg) SPRITES.push({ key, json, ogg, volume: 1, lazy: true });
}

/** Until Robin picks the die's landing, Nigel, SD's B plays (2026-11-01); the pick renames the winner `ui/die-land-n`. */
// A borrowed sound steps aside by itself the day its own name is in a sprite (the church's bell, Nigel, SD's next cut).
const ALIASES: Record<string, string> = {
  'ui/die-land': 'ui/die-land-b',
  'ui/arrive-church': 'ui/arrive-shrine',
  // Chapter 2's names (Nigel, SD), silent or borrowed until his drops land.
  'ui/board-open': 'ui/sheet-open',
  'ui/quest-done': 'ui/errand-done',
  'ui/person-found': 'ui/errand-done',
  'ui/log-open': 'ui/sheet-open',
  'fight/dodge': 'fight/miss',
  'fight/meter-pip-trickster': 'fight/meter-pip',
  'fight/meter-pip-wizard': 'fight/meter-pip',
  'fight/meter-pip-archer': 'fight/meter-pip',
  'ui/step-roots-1': 'ui/step-grass',
  'ui/step-roots-2': 'ui/step-grass',
  'ui/step-roots-3': 'ui/step-grass',
  'ui/step-moss-1': 'ui/step-grass',
  'ui/step-moss-2': 'ui/step-grass',
  'ui/step-moss-3': 'ui/step-grass',
};

/** The music, one file per piece, streamed through an audio element and looped whole (Nigel, SD's board theme, 2026-11-01). */
const MUSIC: Record<string, string> = { 'music/meadows-board': meadowsBoardOgg };
const MUSIC_VOLUME = 0.7;
const CROSSFADE_MS = 2000;

export interface PlayOptions {
  /** The playback rate: 1 is as recorded; the die's landing moves a little with the face. */
  rate?: number;
  volume?: number;
}

export interface LoopHandle {
  stop(): void;
}

type Spritemap = Record<string, { start: number; end: number; loop: boolean }>;

class Audio {
  private game: Phaser.Game | null = null;
  private muted = false;
  /** The spritemaps once loaded, by sprite key. */
  private maps = new Map<string, Spritemap>();
  /** The piece playing now and the one fading out. */
  private track: { name: string; el: HTMLAudioElement } | null = null;
  private fading: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  /** The piece asked for before the first tap unlocked audio, played on that tap. */
  private pendingMusic: string | null = null;
  private unlockHooked = false;
  private readonly fetching = new Set<string>();

  /** Once, from the first scene: the game and the page's `?mute=1`. */
  init(game: Phaser.Game): void {
    if (this.game) return;
    this.game = game;
    this.muted = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mute') === '1';
  }

  /** Queue the sprites; call from a scene's preload. */
  preload(scene: Phaser.Scene, extra: readonly string[] = []): void {
    for (const s of SPRITES) {
      if ((!s.lazy || extra.includes(s.key)) && !scene.cache.json.exists(s.key)) scene.load.audioSprite(s.key, s.json, s.ogg);
    }
  }

  /** A lazy sprite fetched during play, when it first matters: walking into its area. */
  ensure(scene: Phaser.Scene, key: string): void {
    const s = SPRITES.find((x) => x.key === key);
    if (!s || scene.cache.json.exists(key) || this.fetching.has(key)) return;
    this.fetching.add(key);
    scene.load.audioSprite(s.key, s.json, s.ogg);
    scene.load.start();
  }

  /** True when nothing should sound: the page muted, the setting off, or no game yet. */
  private get quiet(): boolean {
    return this.muted || !this.game || !settings.get().sound;
  }

  /** The sprite that holds `name`, and the name itself resolved from a family or an alias; null when none has it yet. */
  private find(name: string): { sprite: SpriteFile; name: string } | null {
    if (!this.game) return null;
    return this.findExact(name) ?? (ALIASES[name] ? this.findExact(ALIASES[name]!) : null);
  }

  private findExact(base: string): { sprite: SpriteFile; name: string } | null {
    if (!this.game) return null;
    for (const s of SPRITES) {
      let map = this.maps.get(s.key);
      if (!map) {
        const json = this.game.cache.json.get(s.key) as { spritemap?: Spritemap } | undefined;
        if (!json?.spritemap) continue;
        map = json.spritemap;
        this.maps.set(s.key, map);
      }
      if (map[base]) return { sprite: s, name: base };
      const variants = [1, 2, 3, 4, 5].map((n) => `${base}-${n}`).filter((v) => map![v]);
      if (variants.length) return { sprite: s, name: variants[Math.floor(Math.random() * variants.length)]! };
    }
    return null;
  }

  /**
   * The music for a place or a moment: fades the piece playing out over two seconds while the new one fades in. A name
   * with no file yet changes nothing (the board theme goes on under a fight until the fight theme comes); null stops.
   * Browsers allow audio only after a tap: a piece asked for before that waits for the first tap.
   */
  music(name: string | null): void {
    if (name !== null && !MUSIC[name]) return;
    if (this.track?.name === name) return;
    if (this.quiet) {
      this.pendingMusic = name;
      this.hookUnlock();
      return;
    }
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    if (this.fading) {
      this.fading.pause();
      this.fading = null;
    }
    this.fading = this.track?.el ?? null;
    this.track = null;
    if (name) {
      // Not `new Audio`: this class is named Audio too.
      const el = document.createElement('audio');
      el.src = MUSIC[name]!;
      el.loop = true;
      el.volume = 0;
      el.preload = 'auto';
      this.track = { name, el };
      const started: Promise<void> | undefined = el.play();
      started?.catch(() => {
        // Not unlocked yet: play it on the first tap.
        this.pendingMusic = name;
        this.track = null;
        this.hookUnlock();
      });
    }
    const out = this.fading;
    const start = Date.now();
    this.fadeTimer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / CROSSFADE_MS);
      if (out) out.volume = MUSIC_VOLUME * (1 - t);
      if (this.track) this.track.el.volume = MUSIC_VOLUME * t;
      if (t >= 1) {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        if (out) out.pause();
        if (this.fading === out) this.fading = null;
      }
    }, 50);
  }

  /** The sound setting turned off: the music stops; turned on: the last piece comes back. */
  applySettings(): void {
    if (this.quiet) {
      if (this.track) {
        this.pendingMusic = this.track.name;
        this.track.el.pause();
        this.track = null;
      }
      return;
    }
    if (this.pendingMusic && !this.track) {
      const name = this.pendingMusic;
      this.pendingMusic = null;
      this.music(name);
    }
  }

  private hookUnlock(): void {
    if (this.unlockHooked || typeof window === 'undefined') return;
    this.unlockHooked = true;
    const once = () => {
      window.removeEventListener('pointerdown', once);
      this.unlockHooked = false;
      this.applySettings();
    };
    window.addEventListener('pointerdown', once);
  }

  /** A short sound once; silent if it does not exist yet. */
  /** Whether a sound of this name is known yet. */
  has(name: string): boolean {
    return !!this.find(name);
  }

  play(name: string, options: PlayOptions = {}): void {
    if (this.quiet) return;
    const found = this.find(name);
    if (!found) return;
    try {
      this.game!.sound.playAudioSprite(found.sprite.key, found.name, { rate: options.rate ?? 1, volume: (options.volume ?? 1) * found.sprite.volume });
    } catch {
      // The browser has not unlocked audio yet, or the sprite failed to decode: silence is fine.
    }
  }

  /** A looping sound until `stop()`: the die's tumble. */
  loop(name: string, options: PlayOptions = {}): LoopHandle {
    const none: LoopHandle = { stop: () => {} };
    if (this.quiet) return none;
    const found = this.find(name);
    if (!found) return none;
    try {
      const sound = this.game!.sound.addAudioSprite(found.sprite.key);
      sound.play(found.name, { loop: true, rate: options.rate ?? 1, volume: (options.volume ?? 1) * found.sprite.volume });
      return {
        stop: () => {
          sound.stop();
          sound.destroy();
        },
      };
    } catch {
      return none;
    }
  }
}

export const audio = new Audio();
