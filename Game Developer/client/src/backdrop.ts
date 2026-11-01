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
import forestFarPng from '../../assets/forest_fight/far.png';
import forestGroundPng from '../../assets/forest_fight/ground.png';
import forestMidPng from '../../assets/forest_fight/mid.png';
import forestNearPng from '../../assets/forest_fight/near.png';
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
  // Mitch, AD's Wobblewood (2026-11-01): far and mid are 1x in their files, which saves about 9.5 MB decoded.
  forest: {
    sky: { top: 0x8ed2b4, bottom: 0xf0f6c8 },
    soil: 0x3a3a34,
    feet: 14,
    strips: [
      { key: 'forest-far', png: forestFarPng, w: 1024, h: 300, bottom: 40, scroll: 0.15, drift: 2, tileScale: 1 },
      { key: 'forest-mid', png: forestMidPng, w: 1024, h: 470, bottom: 24, scroll: 0.45, drift: 0, tileScale: 1 },
      { key: 'forest-near', png: forestNearPng, w: 1024, h: 140, bottom: 8, scroll: 0.8, drift: 0 },
      { key: 'forest-ground', png: forestGroundPng, w: 512, h: 120, bottom: 120, scroll: 1, drift: 0 },
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
    sky.fillRect(0, HUD_HEIGHT, DESIGN_WIDTH, groundY - HUD_HEIGHT);
    scene.add.rectangle(DESIGN_WIDTH / 2, (groundY + bottom) / 2, DESIGN_WIDTH, bottom - groundY, b?.soil ?? 0x3a3024, 1);
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
      const sprite = scene.add.tileSprite(DESIGN_WIDTH / 2 + along, lowest - shown / 2, DESIGN_WIDTH, shown, s.key).setTileScale(scale).setScrollFactor(s.scroll, 1);
      sprite.tilePositionY = (s.h - shown) / scale;
      if (s.drift) this.drifting.push({ sprite, drift: s.drift });
    }
    this.feetY = groundY + b.feet;
  }

  /** From the scene's update: the clouds drift. */
  update(deltaMs: number): void {
    for (const d of this.drifting) d.sprite.tilePositionX += (d.drift * deltaMs) / 1000;
  }
}
