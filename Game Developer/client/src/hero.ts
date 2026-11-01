// The hero on screen: the worn sets' atlases (the Art Director's form: frames `hero_<set>/<action>/0001`, the pivot at
// the feet in every frame, an `actions` block with each frame's delay), their clips as Phaser animations, and one small
// class that plays them on a sprite. The files face left; `face(true)` flips to face right.
//
// A set is one whole figure with its worn pieces, rendered by the studio (Mitch, AD, 2026-11-01); which set a character
// shows is decided here from what it wears. One atlas per part, layered, comes later (docs/art-demands.md, wave 2).

import Phaser from 'phaser';
import type { Character } from '../../rules/src/index.ts';
import { ensureClips, type ActionData } from './clips.ts';
import plateData from '../../assets/hero/plate/hero_plate.json';
import plateJson from '../../assets/hero/plate/hero_plate.json?url';
import platePng from '../../assets/hero/plate/hero_plate.png';
import tunicData from '../../assets/hero/tunic/hero_tunic.json';
import tunicJson from '../../assets/hero/tunic/hero_tunic.json?url';
import tunicPng from '../../assets/hero/tunic/hero_tunic.png';

export type HeroSet = 'tunic' | 'plate';
export type HeroAction = 'stand' | 'move' | 'attack1' | 'defend' | 'hit1' | 'die1';

interface SetFiles {
  key: string;
  png: string;
  json: string;
  actions: Record<string, ActionData>;
}

const SETS: Record<HeroSet, SetFiles> = {
  tunic: { key: 'hero_tunic', png: tunicPng, json: tunicJson, actions: (tunicData as { actions: Record<string, ActionData> }).actions },
  plate: { key: 'hero_plate', png: platePng, json: plateJson, actions: (plateData as { actions: Record<string, ActionData> }).actions },
};

/** The files are 2x: 300 px in the file is 150 CSS px in a fight (Mitch, AD's number); 0.45 fits today's fight layout (mine). */
export const HERO_FIGHT_SCALE = 0.45;
/** On the board the hero stands at 0.3 of the fight's size (Mitch, AD's number for the test). */
export const HERO_BOARD_SCALE = 0.15;

/** Queue the sets' atlases; call from a scene's preload. */
export function preloadHero(scene: Phaser.Scene): void {
  for (const s of Object.values(SETS)) {
    if (!scene.textures.exists(s.key)) scene.load.atlas(s.key, s.png, s.json);
  }
}

export function heroReady(scene: Phaser.Scene, set: HeroSet): boolean {
  return scene.textures.exists(SETS[set].key);
}

/** Which set a character shows (mine, for the test: a coat worn shows the plate set, otherwise the tunic). */
export function heroSetFor(c: Character): HeroSet {
  return c.equipment.armour ? 'plate' : 'tunic';
}

function ensureAnims(scene: Phaser.Scene, set: HeroSet): void {
  ensureClips(scene, SETS[set].key, SETS[set].actions);
}

/** A hero sprite that plays the set's clips. The sprite's x, y is where the feet stand. */
export class Hero {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private set: HeroSet;
  private fade: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, set: HeroSet, x: number, y: number, scale: number) {
    this.scene = scene;
    ensureAnims(scene, set);
    this.set = set;
    const first = SETS[set].actions.stand?.frames[0]?.name;
    this.sprite = scene.add.sprite(x, y, SETS[set].key, first).setScale(scale);
    this.sprite.play(`${SETS[set].key}/stand`);
  }

  /** Files face left; true turns the hero to face right. */
  face(right: boolean): void {
    this.sprite.setFlipX(right);
  }

  /** Play a clip; a one-shot clip goes back to `stand` when it ends unless `hold` is set (a guard holds its pose). */
  play(action: HeroAction, hold = false): void {
    const s = SETS[this.set];
    const key = `${s.key}/${action}`;
    if (!this.scene.anims.exists(key)) return;
    this.fade?.stop();
    this.fade = null;
    this.sprite.setAlpha(1);
    this.sprite.off('animationcomplete');
    this.sprite.play(key, false);
    if (action === 'die1') {
      // The last two frames fade (a0, a1 in the actions block): a tween over their time.
      const frames = s.actions.die1?.frames ?? [];
      const before = frames.slice(0, -2).reduce((n, f) => n + f.delay, 0);
      const last = frames.slice(-2).reduce((n, f) => n + f.delay, 0);
      this.fade = this.scene.tweens.add({ targets: this.sprite, alpha: 0, delay: before, duration: Math.max(1, last) });
      return;
    }
    if (!hold && action !== 'stand' && action !== 'move') {
      this.sprite.once('animationcomplete', () => {
        if (this.sprite.active) this.sprite.play(`${s.key}/stand`);
      });
    }
  }

  /** Show another set (the character changed what it wears). */
  show(set: HeroSet): void {
    if (set === this.set || !this.scene.textures.exists(SETS[set].key)) return;
    this.set = set;
    ensureAnims(this.scene, set);
    this.sprite.setAlpha(1);
    this.sprite.play(`${SETS[set].key}/stand`);
  }
}
