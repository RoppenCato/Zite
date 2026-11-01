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
import { settings } from './settings.ts';

interface SpriteFile {
  key: string;
  json: string;
  ogg: string;
  /** The gain of this sprite against the others (Nigel, SD: the UI bus a touch under the fight bus). */
  volume: number;
}

const SPRITES: SpriteFile[] = [
  { key: 'ui', json: uiJson, ogg: uiOgg, volume: 0.8 },
  { key: 'fight', json: fightJson, ogg: fightOgg, volume: 1 },
  { key: 'ui-spots', json: spotsJson, ogg: spotsOgg, volume: 0.8 },
];
/** Until Robin picks the die's landing, Nigel, SD's B plays (2026-11-01); the pick renames the winner `ui/die-land-n`. */
const ALIASES: Record<string, string> = { 'ui/die-land': 'ui/die-land-b' };

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

  /** Once, from the first scene: the game and the page's `?mute=1`. */
  init(game: Phaser.Game): void {
    if (this.game) return;
    this.game = game;
    this.muted = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mute') === '1';
  }

  /** Queue the sprites; call from a scene's preload. */
  preload(scene: Phaser.Scene): void {
    for (const s of SPRITES) {
      if (!scene.cache.json.exists(s.key)) scene.load.audioSprite(s.key, s.json, s.ogg);
    }
  }

  /** True when nothing should sound: the page muted, the setting off, or no game yet. */
  private get quiet(): boolean {
    return this.muted || !this.game || !settings.get().sound;
  }

  /** The sprite that holds `name`, and the name itself resolved from a family or an alias; null when none has it yet. */
  private find(name: string): { sprite: SpriteFile; name: string } | null {
    if (!this.game) return null;
    for (const s of SPRITES) {
      let map = this.maps.get(s.key);
      if (!map) {
        const json = this.game.cache.json.get(s.key) as { spritemap?: Spritemap } | undefined;
        if (!json?.spritemap) continue;
        map = json.spritemap;
        this.maps.set(s.key, map);
      }
      const base = ALIASES[name] ?? name;
      if (map[base]) return { sprite: s, name: base };
      const variants = [1, 2, 3, 4, 5].map((n) => `${base}-${n}`).filter((v) => map![v]);
      if (variants.length) return { sprite: s, name: variants[Math.floor(Math.random() * variants.length)]! };
    }
    return null;
  }

  /** A short sound once; silent if it does not exist yet. */
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
