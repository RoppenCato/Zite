// The look of a run of the Dream (Mitch, AD, 2026-11-03, his out/dream_looks): a colour matrix over the run's board, and
// over the fight's backdrop and foe (never the hero), in the run's palette; a soft vignette and drifting motes on top,
// tinted. Gear the Dream gave wears the palette's tint. With fewer effects, none of it.

import Phaser from 'phaser';
import { DREAM } from '../../rules/src/index.ts';
import dreamdustPng from '../../assets/dream_isle/dreamdust.png';
import dreamdustSmallPng from '../../assets/dream_isle/dreamdust_small.png';
import vignettePng from '../../assets/dream_looks/dream_vignette.png';
import motesJson from '../../assets/dream_looks/dream_motes.json?url';
import motesPng from '../../assets/dream_looks/dream_motes.png';
import { settings } from './settings.ts';

export const DREAM_VIGNETTE = 'dream_vignette';
export const DREAM_MOTES = 'dream_motes';
/** Dreamdust's icon: 80 px for 40 on the hero sheet and in the shop, 32 for 16 in pop-ups. */
export const DREAMDUST = 'dreamdust';
export const DREAMDUST_SMALL = 'dreamdust_small';

/** Small, so always held. */
export function preloadDreamLook(scene: Phaser.Scene): void {
  if (!scene.textures.exists(DREAM_VIGNETTE)) scene.load.image(DREAM_VIGNETTE, vignettePng);
  if (!scene.textures.exists(DREAM_MOTES)) scene.load.atlas(DREAM_MOTES, motesPng, motesJson);
  if (!scene.textures.exists(DREAMDUST)) scene.load.image(DREAMDUST, dreamdustPng);
  if (!scene.textures.exists(DREAMDUST_SMALL)) scene.load.image(DREAMDUST_SMALL, dreamdustSmallPng);
}

export type DreamPalette = (typeof DREAM.palettes)[number];

/** What grows in each land's dream: its kit's trees, rocks and flowers, never its buildings (mine, from the kits' atlases). */
export const DREAM_PROPS: Record<string, string[]> = {
  meadow: ['gnarled_oak', 'poplar_a', 'poplar_b', 'oak_a', 'oak_b', 'oak_c', 'pine_a', 'pine_b', 'apple_a', 'apple_b', 'bush_a', 'bush_b', 'rock_a', 'rock_b', 'rock_c', 'flowers_a', 'flowers_b', 'mushrooms', 'tuft_a', 'tuft_b'],
  forest: ['tumbletree', 'upside_tree', 'owl_tree', 'tall_a', 'wobble_a', 'wobble_b', 'fir_a', 'big_mush_a', 'big_mush_b', 'big_mush_c', 'hollow_log', 'fern_a', 'fern_b', 'bush_a', 'bush_b', 'stump', 'rock_a', 'mushrooms', 'bells', 'flowers_a'],
  harvest: ['gold_oak_a', 'gold_oak_b', 'oak_a', 'poplar_a', 'corn_a', 'corn_b', 'apple_a', 'apple_b', 'sunflower_a', 'sunflower_b', 'wheat_a', 'wheat_b', 'bush_a', 'bush_b', 'pumpkin', 'bale', 'rock_a', 'flowers_a', 'flowers_b', 'hive_small'],
  swamp: ['cypress_a', 'cypress_b', 'snag', 'reeds_a', 'reeds_b', 'mud_a', 'mud_b', 'log', 'rock_a', 'tuft_a', 'lantern'],
  mountain: ['pine_a', 'pine_b', 'snow_pine_a', 'snow_pine_b', 'ice_a', 'ice_b', 'boulder_a', 'boulder_b', 'boulder_s', 'cairn', 'tuft_a'],
  pirates: ['palm_a', 'palm_b', 'palm_c', 'bush', 'rock', 'tuft', 'shell', 'flowers', 'crate', 'barrel'],
  giants: ['ice_spire', 'ice_spire_b', 'pine_a', 'pine_b', 'snow_pine_a', 'snow_pine_b', 'ice_a', 'ice_b', 'boulder_a', 'boulder_b', 'boulder_s', 'cairn', 'tuft_a'],
};

/** A run's palette, unless effects are turned down. */
export function dreamPalette(id: string | undefined): DreamPalette | null {
  if (!id || settings.get().fewerEffects) return null;
  return DREAM.palettes.find((p) => p.id === id) ?? null;
}

/** Mitch, AD's order: hue, then saturate, then brightness. */
export function applyPalette(cm: Phaser.Display.ColorMatrix, p: DreamPalette): void {
  cm.reset();
  cm.hue(p.hue);
  cm.saturate(p.sat, true);
  cm.brightness(p.bright, true);
}

export const tintOf = (hex: string): number => parseInt(hex.slice(1), 16);

/**
 * The overlay over a box of the screen: the vignette stretched over it at 0.55, and motes drifting up 10 to 20 px a
 * second with a slight sway, respawning at the bottom (Mitch, AD's numbers). Returns what it made, to be destroyed.
 */
export function dreamOverlay(scene: Phaser.Scene, box: { x: number; y: number; width: number; height: number }, tint: number, depth: number, motes = 16): Phaser.GameObjects.GameObject[] {
  const made: Phaser.GameObjects.GameObject[] = [];
  if (scene.textures.exists(DREAM_VIGNETTE)) {
    made.push(scene.add.image(box.x + box.width / 2, box.y + box.height / 2, DREAM_VIGNETTE).setDisplaySize(box.width, box.height).setTint(tint).setAlpha(0.55).setDepth(depth));
  }
  if (!scene.textures.exists(DREAM_MOTES)) return made;
  const frames = scene.textures.get(DREAM_MOTES).getFrameNames();
  for (let i = 0; i < motes; i++) {
    const x = box.x + Math.random() * box.width;
    const y = box.y + Math.random() * box.height;
    const mote = scene.add.image(x, y, DREAM_MOTES, frames[i % frames.length]).setScale(0.5 + Math.random() * 0.5).setAlpha(0.5 + Math.random() * 0.4).setTint(i % 3 === 0 ? 0xfff6c8 : tint).setDepth(depth + 0.01);
    const speed = 10 + Math.random() * 10;
    const rise = (from: number): void => {
      scene.tweens.add({
        targets: mote,
        y: box.y - 20,
        duration: ((from - (box.y - 20)) / speed) * 1000,
        onComplete: () => {
          // Gone with its overlay: never start again (a destroyed mote's tween ends at once, and would loop for ever).
          if (!mote.active) return;
          // Back in at the bottom; its own sway carries it side to side.
          mote.y = box.y + box.height + 10;
          rise(mote.y);
        },
      });
    };
    mote.once(Phaser.GameObjects.Events.DESTROY, () => scene.tweens.killTweensOf(mote));
    rise(y);
    scene.tweens.add({ targets: mote, x: x + 8 + Math.random() * 10, duration: 1800 + Math.random() * 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    made.push(mote);
  }
  return made;
}
