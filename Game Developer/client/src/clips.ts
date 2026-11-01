// The studios' atlas form, as the client reads it (Mitch, AD's pack.js): a Phaser 3 JSON hash with the pivot in every
// frame, and an `actions` block that names each clip's frames with their delays. `ensureClips` turns the block into
// Phaser animations keyed `<atlas>/<action>`, once per scene, so a sprite plays `chest/open` or `hero_tunic/move`.

import type Phaser from 'phaser';

export interface ActionFrame {
  name: string;
  delay: number;
  /** The alpha this frame starts and ends with, 0 to 255; a death's last frames fade. */
  a0?: number;
  a1?: number;
  /** The top of the figure this frame, from the pivot (for a bar or a marker over it). */
  head?: { x: number; y: number };
}

export interface ActionData {
  delay: number;
  loop: boolean;
  frames: ActionFrame[];
}

/** The animations of an atlas, made if they are not yet: `<atlasKey>/<action>` with each frame's own delay. */
export function ensureClips(scene: Phaser.Scene, atlasKey: string, actions: Record<string, ActionData>): void {
  for (const [action, a] of Object.entries(actions)) {
    const key = `${atlasKey}/${action}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: a.frames.map((f) => ({ key: atlasKey, frame: f.name, duration: f.delay })),
      repeat: a.loop ? -1 : 0,
    });
  }
}

/** How long a clip runs before its frame `index` (1-based) shows: the sum of the delays before it. */
export function msBefore(action: ActionData, index: number): number {
  return action.frames.slice(0, Math.max(0, index - 1)).reduce((n, f) => n + f.delay, 0);
}

/** The whole clip's length. */
export function clipMs(action: ActionData): number {
  return action.frames.reduce((n, f) => n + f.delay, 0);
}
