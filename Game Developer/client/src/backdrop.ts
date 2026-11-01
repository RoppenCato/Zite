// The fight's backdrop (chapter 1, step 4): the Art Director's layers for an area, drawn as strips that tile sideways,
// behind a code sky, over a ground band and the soil under it. Mitch, AD's NOTES in `assets/meadow_fight/` give each
// strip's size, where it sits against the ground line and its scroll factor (the camera's shake moves the far strips
// less, so the scene has depth). An area with no backdrop yet gets the sky and a plain ground. The far strip drifts a
// little, so the clouds move.

import Phaser from 'phaser';
import farPng from '../../assets/meadow_fight/far.png';
import groundPng from '../../assets/meadow_fight/ground.png';
import midPng from '../../assets/meadow_fight/mid.png';
import nearPng from '../../assets/meadow_fight/near.png';
import { DESIGN_WIDTH, HUD_HEIGHT } from './layout.ts';

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
  meadow: {
    sky: { top: 0x5fb0ec, bottom: 0xcdebfb },
    soil: 0x5c4a30,
    feet: 14,
    strips: [
      { key: 'meadow-far', png: farPng, w: 1024, h: 300, bottom: 40, scroll: 0.15, drift: 2 },
      { key: 'meadow-mid', png: midPng, w: 1024, h: 300, bottom: 24, scroll: 0.45, drift: 0 },
      { key: 'meadow-near', png: nearPng, w: 1024, h: 140, bottom: 8, scroll: 0.8, drift: 0 },
      { key: 'meadow-ground', png: groundPng, w: 512, h: 120, bottom: 120, scroll: 1, drift: 0 },
    ],
  },
};

export function preloadBackdrops(scene: Phaser.Scene): void {
  for (const b of Object.values(BACKDROPS)) {
    for (const s of b.strips) if (!scene.textures.exists(s.key)) scene.load.image(s.key, s.png);
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
    sky.fillRect(0, HUD_HEIGHT, DESIGN_WIDTH, groundY - HUD_HEIGHT);
    scene.add.rectangle(DESIGN_WIDTH / 2, (groundY + bottom) / 2, DESIGN_WIDTH, bottom - groundY, b?.soil ?? 0x3a3024, 1);
    if (!b) {
      this.feetY = groundY;
      return;
    }
    for (const s of b.strips) {
      if (!scene.textures.exists(s.key)) continue;
      const sprite = scene.add.tileSprite(DESIGN_WIDTH / 2, groundY + s.bottom - s.h / 2, DESIGN_WIDTH, s.h, s.key).setTileScale(0.5).setScrollFactor(s.scroll, 1);
      if (s.drift) this.drifting.push({ sprite, drift: s.drift });
    }
    this.feetY = groundY + b.feet;
  }

  /** From the scene's update: the clouds drift. */
  update(deltaMs: number): void {
    for (const d of this.drifting) d.sprite.tilePositionX += (d.drift * deltaMs) / 1000;
  }
}
