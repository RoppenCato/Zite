// The fight's backdrop (chapter 1, step 4): the Art Director's layers for an area, drawn as strips that tile sideways,
// behind a code sky, over a ground band and the soil under it. Mitch, AD's NOTES in `assets/meadow_fight/` give each
// strip's size, where it sits against the ground line and its scroll factor (the camera's shake moves the far strips
// less, so the scene has depth). An area with no backdrop yet gets the sky and a plain ground. The far strip drifts a
// little, so the clouds move.

import Phaser from 'phaser';
import cloudsPng from '../../assets/meadow_fight/clouds.png';
import farPng from '../../assets/meadow_fight/far.png';
import groundPng from '../../assets/meadow_fight/ground.png';
import midPng from '../../assets/meadow_fight/mid.png';
import nearPng from '../../assets/meadow_fight/near.png';
import forestFarPng from '../../assets/forest_fight/far.png';
import forestGroundPng from '../../assets/forest_fight/ground.png';
import forestMidPng from '../../assets/forest_fight/mid.png';
import forestMotesPng from '../../assets/forest_fight/motes.png';
import forestNearPng from '../../assets/forest_fight/near.png';
import harvestCloudsPng from '../../assets/harvest_fight/clouds.png';
import harvestFarPng from '../../assets/harvest_fight/far.png';
import harvestGroundPng from '../../assets/harvest_fight/ground.png';
import harvestMidPng from '../../assets/harvest_fight/mid.png';
import harvestNearPng from '../../assets/harvest_fight/near.png';
import { DESIGN_WIDTH, HUD_HEIGHT, SCREEN_WIDTH, HUD_PLANK } from './layout.ts';

interface Strip {
  key: string;
  png: string;
  /** Design pixels; the file is 2x. */
  w: number;
  h: number;
  /** Where the strip's bottom sits against the ground line (positive is below it). */
  bottom: number;
  scroll: number;
  /** Pixels a second the strip drifts sideways on its own. */
  drift: number;
  /** 1 for a soft strip kept at 1x in its file; the rest are 2x. */
  tileScale?: number;
}

interface BackdropFiles {
  sky: { top: number; bottom: number };
  soil: number;
  strips: Strip[];
  /** The fighters' feet stand this far below the ground strip's top. */
  feet: number;
}

/** By theme id (`rules/data/world.json`, `themes.json`). */
const BACKDROPS: Record<string, BackdropFiles> = {
  // Mitch, AD's second pass (Robin, 2026-11-02: "A, the road to the mill. Looks great! Apply the same idea to the others"): the fighters stand on the region's own road.
  meadow: {
    sky: { top: 0x55b2f2, bottom: 0xd4f0f6 },
    soil: 0x86cf5c,
    feet: 46,
    strips: [
      { key: 'meadow-clouds', png: cloudsPng, w: 512, h: 152, bottom: -190, scroll: 0.1, drift: 3, tileScale: 1 },
      { key: 'meadow-far', png: farPng, w: 512, h: 262, bottom: 10, scroll: 0.15, drift: 0, tileScale: 1 },
      { key: 'meadow-mid', png: midPng, w: 512, h: 227, bottom: 10, scroll: 0.45, drift: 0 },
      { key: 'meadow-near', png: nearPng, w: 512, h: 176, bottom: 10, scroll: 0.8, drift: 0 },
      { key: 'meadow-ground', png: groundPng, w: 512, h: 200, bottom: 150, scroll: 1, drift: 0 },
    ],
  },
  forest: {
    sky: { top: 0x8ed2b4, bottom: 0xf0f6c8 },
    soil: 0x6fb478,
    feet: 46,
    strips: [
      { key: 'forest-far', png: forestFarPng, w: 512, h: 400, bottom: 10, scroll: 0.15, drift: 0, tileScale: 1 },
      { key: 'forest-motes', png: forestMotesPng, w: 512, h: 272, bottom: -20, scroll: 0.3, drift: 3, tileScale: 1 },
      { key: 'forest-mid', png: forestMidPng, w: 512, h: 244, bottom: 10, scroll: 0.45, drift: 0 },
      { key: 'forest-near', png: forestNearPng, w: 512, h: 410, bottom: 10, scroll: 0.8, drift: 0 },
      { key: 'forest-ground', png: forestGroundPng, w: 512, h: 200, bottom: 150, scroll: 1, drift: 0 },
    ],
  },
  harvest: {
    sky: { top: 0x6fb8ec, bottom: 0xfbeec0 },
    soil: 0xc8cc6a,
    feet: 46,
    strips: [
      { key: 'harvest-clouds', png: harvestCloudsPng, w: 512, h: 157, bottom: -190, scroll: 0.1, drift: 3, tileScale: 1 },
      { key: 'harvest-far', png: harvestFarPng, w: 512, h: 254, bottom: 10, scroll: 0.15, drift: 0, tileScale: 1 },
      { key: 'harvest-mid', png: harvestMidPng, w: 512, h: 212, bottom: 10, scroll: 0.45, drift: 0 },
      { key: 'harvest-near', png: harvestNearPng, w: 512, h: 165, bottom: 10, scroll: 0.8, drift: 0 },
      { key: 'harvest-ground', png: harvestGroundPng, w: 512, h: 200, bottom: 150, scroll: 1, drift: 0 },
    ],
  },
};

/** Queue a theme's strips; the fight's preload calls it. */
export function preloadBackdrop(scene: Phaser.Scene, theme: string): void {
  for (const s of BACKDROPS[theme]?.strips ?? []) if (!scene.textures.exists(s.key)) scene.load.image(s.key, s.png);
}

/** Let go of every theme's strips but this one's. */
export function releaseBackdrops(game: Phaser.Game, keep: string): void {
  for (const [theme, b] of Object.entries(BACKDROPS)) {
    if (theme === keep) continue;
    for (const s of b.strips) if (game.textures.exists(s.key)) game.textures.remove(s.key);
  }
}

/** The backdrop drawn into a scene: the sky from the band's top to the ground line, the strips, the soil to `bottom`. */
export class Backdrop {
  /** Where the fighters' feet stand. */
  readonly feetY: number;
  private readonly drifting: { sprite: Phaser.GameObjects.TileSprite; drift: number }[] = [];

  constructor(scene: Phaser.Scene, theme: string, groundY: number, bottom: number) {
    const b = BACKDROPS[theme];
    const sky = scene.add.graphics();
    const top = b?.sky.top ?? 0x3a4a6a;
    const low = b?.sky.bottom ?? 0x8aa0b8;
    sky.fillGradientStyle(top, top, low, low, 1);
    sky.fillRect((DESIGN_WIDTH - SCREEN_WIDTH) / 2, HUD_PLANK, SCREEN_WIDTH, groundY - HUD_PLANK);
    scene.add.rectangle(DESIGN_WIDTH / 2, (groundY + bottom) / 2, SCREEN_WIDTH, bottom - groundY, b?.soil ?? 0x3a3024, 1);
    if (!b) {
      this.feetY = groundY;
      return;
    }
    for (const s of b.strips) {
      if (!scene.textures.exists(s.key)) continue;
      // A strip taller than the band is cut at the HUD; its bottom stays where it belongs (Wobblewood's leaves reach the top).
      const lowest = groundY + s.bottom;
      const shown = Math.min(s.h, lowest - HUD_HEIGHT);
      const scale = s.tileScale ?? 0.5;
      // The camera holds a scroll for the screen's density; a strip that scrolls slower must start that much further along, or its right side falls short.
      const along = (s.scroll - 1) * scene.cameras.main.scrollX;
      const sprite = scene.add.tileSprite(DESIGN_WIDTH / 2 + along, lowest - shown / 2, SCREEN_WIDTH, shown, s.key).setTileScale(scale).setScrollFactor(s.scroll, 1);
      sprite.tilePositionY = (s.h - shown) / scale;
      // The strip is composed for the column: a wider screen shows more of it to each side, the column where it was.
      sprite.tilePositionX = (DESIGN_WIDTH - SCREEN_WIDTH) / 2 / scale;
      if (s.drift) this.drifting.push({ sprite, drift: s.drift });
    }
    this.feetY = groundY + b.feet;
  }

  /** From the scene's update: the clouds drift. */
  update(deltaMs: number): void {
    for (const d of this.drifting) d.sprite.tilePositionX += (d.drift * deltaMs) / 1000;
  }
}
