// The creatures on screen (chapter 1, step 4): the Art Director's atlases by enemy id, in the hero's form (`clips.ts`),
// and one small class that plays a figure's clips. A creature with no art yet is drawn as a circle by the fight scene.
// Files face left, toward the player; the enemy stands at the right, so it is not flipped.

import Phaser from 'phaser';
import slimeData from '../../assets/slime/slime.json';
import slimeJson from '../../assets/slime/slime.json?url';
import slimePng from '../../assets/slime/slime.png';
import { clipMs, ensureClips, msBefore, type ActionData } from './clips.ts';

export type FigureAction = 'stand' | 'move' | 'attack1' | 'hit1' | 'die1' | 'defend';

interface CreatureFiles {
  key: string;
  png: string;
  json: string;
  actions: Record<string, ActionData>;
  /** The files are 2x: 0.5 draws the creature at the Art Director's CSS size. */
  scale: number;
  /** The frame of `attack1` on which the blow lands (1-based), from the NOTES. */
  blowFrame: number;
}

/** By enemy id (`rules/data/enemies.json`). */
const CREATURES: Record<string, CreatureFiles> = {
  slime: { key: 'slime', png: slimePng, json: slimeJson, actions: (slimeData as { actions: Record<string, ActionData> }).actions, scale: 0.5, blowFrame: 7 },
};

/** Queue every creature's atlas; call from a scene's preload. */
export function preloadCreatures(scene: Phaser.Scene): void {
  for (const c of Object.values(CREATURES)) {
    if (!scene.textures.exists(c.key)) scene.load.atlas(c.key, c.png, c.json);
  }
}

export function creatureReady(scene: Phaser.Scene, enemyId: string): boolean {
  const c = CREATURES[enemyId];
  return !!c && scene.textures.exists(c.key);
}

/** A figure that plays an atlas's clips. The sprite's x, y is where the feet stand. */
export class Figure {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly files: CreatureFiles;
  private fade: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, enemyId: string, x: number, y: number) {
    this.scene = scene;
    this.files = CREATURES[enemyId]!;
    ensureClips(scene, this.files.key, this.files.actions);
    const first = this.files.actions.stand?.frames[0]?.name;
    this.sprite = scene.add.sprite(x, y, this.files.key, first).setScale(this.files.scale);
    this.sprite.play(`${this.files.key}/stand`);
  }

  /** Files face left; true turns the figure to face right. */
  face(right: boolean): void {
    this.sprite.setFlipX(right);
  }

  /** How far into `attack1` the blow lands, in ms: the hit's flash waits for it. */
  blowMs(): number {
    const a = this.files.actions.attack1;
    return a ? msBefore(a, this.files.blowFrame) : 0;
  }

  /** The height of the standing figure's top above its feet, in CSS px, for a bar or a marker over it. */
  headHeight(): number {
    const head = this.files.actions.stand?.frames[0]?.head;
    return head ? -head.y * this.files.scale : 60;
  }

  /** Play a clip; a one-shot clip goes back to `stand` when it ends unless `hold` is set. */
  play(action: FigureAction, hold = false): void {
    const key = `${this.files.key}/${action}`;
    if (!this.scene.anims.exists(key)) return;
    this.fade?.stop();
    this.fade = null;
    this.sprite.setAlpha(1);
    this.sprite.off('animationcomplete');
    this.sprite.play(key, false);
    if (action === 'die1') {
      // The last frames fade (a0, a1 in the actions block): a tween over their time; the figure stays down.
      const a = this.files.actions.die1;
      const frames = a?.frames ?? [];
      const fading = frames.filter((f) => f.a1 !== undefined && f.a1 < (f.a0 ?? 255)).length || 2;
      const before = a ? clipMs(a) - frames.slice(-fading).reduce((n, f) => n + f.delay, 0) : 0;
      const last = frames.slice(-fading).reduce((n, f) => n + f.delay, 0);
      this.fade = this.scene.tweens.add({ targets: this.sprite, alpha: 0, delay: before, duration: Math.max(1, last) });
      return;
    }
    if (!hold && action !== 'stand' && action !== 'move') {
      this.sprite.once('animationcomplete', () => {
        if (this.sprite.active) this.sprite.play(`${this.files.key}/stand`);
      });
    }
  }
}
