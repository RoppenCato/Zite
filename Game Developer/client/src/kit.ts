// The UI kit (chapter 1, step 6): Mitch, AD's atlas of panels, buttons, chips, bars, the die, icons and marks
// (`assets/ui/`, his NOTES.md), drawn at 0.5 since the files are 2x. Every nine-slice frame carries its corner in the
// json (`nine`, in file pixels). The two soft gradients (the die's glow, the level-up burst) sit in `ui_soft`. A scene
// that runs before the kit is loaded (nothing, once the first scene preloads it) falls back to the shapes in ui.ts.

import Phaser from 'phaser';
import bigDieJson from '../../assets/big_die/big_die.json?url';
import bigDiePng from '../../assets/big_die/big_die.png';
import flasksJson from '../../assets/flasks/flasks.json?url';
import flasksPng from '../../assets/flasks/flasks.png';
import uiData from '../../assets/ui/ui.json';
import uiJson from '../../assets/ui/ui.json?url';
import uiPng from '../../assets/ui/ui.png';
import softJson from '../../assets/ui/ui_soft.json?url';
import softPng from '../../assets/ui/ui_soft.png';
import { DESIGN_WIDTH, HUD_HEIGHT, VIEW_HEIGHT, SCREEN_WIDTH, HUD_PLANK, PLANK_TOP, ROLL_TOP, ROLL_LEFT, ROLL_RIGHT } from './layout.ts';

export const KIT = 'ui';
export const KIT_SOFT = 'ui_soft';
const SCALE = 0.5;

/** Text colours of the kit (Mitch, AD): cream on wood and the coloured buttons, ink on parchment and cards. */
export const CREAM = '#f7efdc';
export const INK = '#2a2030';
export const INK_DIM = '#46393f';

type Frames = Record<string, { nine?: number }>;
const NINE: Record<string, number> = Object.fromEntries(
  Object.entries((uiData as { frames: Frames }).frames)
    .filter(([, f]) => typeof f.nine === 'number')
    .map(([name, f]) => [name, f.nine!]),
);

/** The flasks' and the big die's atlases (Mitch, AD, 2026-11-02). */
const FLASKS = 'flasks';
export const BIG_DIE = 'big_die';

export function preloadKit(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FLASKS)) scene.load.atlas(FLASKS, flasksPng, flasksJson);
  if (!scene.textures.exists(BIG_DIE)) scene.load.atlas(BIG_DIE, bigDiePng, bigDieJson);
  if (!scene.textures.exists(KIT)) scene.load.atlas(KIT, uiPng, uiJson);
  if (!scene.textures.exists(KIT_SOFT)) scene.load.atlas(KIT_SOFT, softPng, softJson);
}

export function kitReady(scene: Phaser.Scene): boolean {
  return scene.textures.exists(KIT);
}

/** A nine-slice plate of the kit at a design size, centred on x, y. */
export function plate(scene: Phaser.Scene, frame: string, x: number, y: number, w: number, h: number): Phaser.GameObjects.NineSlice {
  const c = NINE[frame] ?? 0;
  return scene.add.nineslice(x, y, KIT, frame, w / SCALE, h / SCALE, c, c, c, c).setScale(SCALE);
}

/** Resize a plate to a design size. */
export function resizePlate(p: Phaser.GameObjects.NineSlice, w: number, h: number): void {
  p.setSize(w / SCALE, h / SCALE);
}

/** An icon or mark of the kit at its design size. */
export function icon(scene: Phaser.Scene, frame: string, x: number, y: number): Phaser.GameObjects.Image {
  // A flask's icon lives in its own atlas, named by the item.
  if (scene.textures.exists(FLASKS) && scene.textures.get(FLASKS).has(frame)) return scene.add.image(x, y, FLASKS, frame).setScale(SCALE);
  return scene.add.image(x, y, KIT, frame).setScale(SCALE);
}

/** True when the kit has this frame (an item icon may be missing for a new item). */
/** The atlas that holds a frame: a flask's own, or the kit. */
export function frameTexture(scene: Phaser.Scene, frame: string): string {
  return scene.textures.exists(FLASKS) && scene.textures.get(FLASKS).has(frame) ? FLASKS : KIT;
}
export function hasFrame(scene: Phaser.Scene, frame: string): boolean {
  if (scene.textures.exists(FLASKS) && scene.textures.get(FLASKS).has(frame)) return true;
  return kitReady(scene) && scene.textures.get(KIT).has(frame);
}

/** The kit's item icon for an item id, if there is one. */
export function itemFrame(item: string): string {
  if (item.startsWith('potion') || item.startsWith('mana-potion') || item.startsWith('elixir-')) return item;
  return { reroll: 'item_do_over', 'plus-one': 'item_hop', 'minus-one': 'item_hold', exact: 'item_fairy_pick' }[item] ?? `item_${item.replace(/-/g, '_')}`;
}

/** A modal sheet over the world band (the shop, the bag, the atlas): the world dimmed, the kit's parchment in its wood frame. */
/** The dim over the map, from the top plank down to the bottom plank, around the top of Roll, which rises above it. The first piece is the big one. */
export function veil(scene: Phaser.Scene, color: number, alpha: number): Phaser.GameObjects.Rectangle[] {
  const left = (DESIGN_WIDTH - SCREEN_WIDTH) / 2;
  const right = left + SCREEN_WIDTH;
  const piece = (x0: number, y0: number, x1: number, y1: number) => scene.add.rectangle((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, color, alpha).setInteractive();
  return [piece(left, HUD_PLANK, right, ROLL_TOP), piece(left, ROLL_TOP, ROLL_LEFT + 16, PLANK_TOP), piece(ROLL_RIGHT - 16, ROLL_TOP, right, PLANK_TOP)];
}

export function sheet(scene: Phaser.Scene): void {
  const x = DESIGN_WIDTH / 2;
  const y = HUD_HEIGHT + VIEW_HEIGHT / 2;
  if (!kitReady(scene)) {
    scene.add.rectangle(x, y, SCREEN_WIDTH, VIEW_HEIGHT, 0x151826, 1).setInteractive();
    return;
  }
  veil(scene, 0x0b0d14, 0.55);
  plate(scene, 'panel_sheet', x, y, DESIGN_WIDTH - 20, VIEW_HEIGHT - 16);
}

/** The text colours of a sheet: ink on parchment with the kit, the old cream on dark without. */
export function sheetInk(scene: Phaser.Scene, fallback: { text: string; dim: string; gold: string }): { text: string; dim: string; gold: string } {
  return kitReady(scene) ? { text: INK, dim: INK_DIM, gold: '#7a5206' } : fallback;
}

/** A short clip of the kit (fx_tap, fx_spark, fx_ripple, fx_tick) played once at a point, tinted, then gone. */
export function fx(scene: Phaser.Scene, clip: 'fx_tap' | 'fx_spark' | 'fx_ripple' | 'fx_tick', x: number, y: number, tint = 0xffffff, depth = 50, scale = 1): void {
  if (!kitReady(scene)) return;
  const key = `${KIT}/${clip}`;
  if (!scene.anims.exists(key)) {
    const delays: Record<string, number> = { fx_tap: 40, fx_spark: 50, fx_ripple: 50, fx_tick: 60 };
    const frames = scene.textures.get(KIT).getFrameNames().filter((n) => n.startsWith(`${clip}/`)).sort();
    scene.anims.create({ key, frames: frames.map((f) => ({ key: KIT, frame: f })), frameRate: 1000 / (delays[clip] ?? 50), repeat: 0 });
  }
  const s = scene.add.sprite(x, y, KIT, `${clip}/0001`).setScale(SCALE * scale).setTint(tint).setDepth(depth);
  s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
  s.play(key);
}
