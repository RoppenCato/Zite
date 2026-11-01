// Drawing at the phone's own pixel density (Mitch, AD's catch, 2026-11-01: the canvas was 412 by 915 under a device
// pixel ratio of 2, so every sprite and all the text was drawn at half size and scaled up, soft). The game's canvas is
// now the design size times `DPR` (capped at 2 for the fill rate); every scene's main camera zooms by `DPR` and looks at
// the design rectangle, so scene code keeps its design coordinates; every text renders its canvas at `DPR`. The board
// scene multiplies its own zooms by `DPR` (it drives its camera itself). The 2x files now draw one to one at a ratio of 2.

import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, DPR } from './layout.ts';

export class HiResPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager, pluginKey: string) {
    super(scene, pluginManager, pluginKey);
  }

  override boot(): void {
    const scene = this.scene;
    if (!scene) return;
    const events = this.systems!.events;
    events.on(Phaser.Scenes.Events.START, () => {
      const cam = scene.cameras.main;
      cam.setZoom(DPR);
      cam.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    });
    // Every text of this scene renders at the density, unless its style says otherwise.
    const add = scene.add;
    const text = add.text.bind(add);
    add.text = ((x: number, y: number, content: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => text(x, y, content, { resolution: DPR, ...style })) as typeof add.text;
  }
}

/** The plugin's entry for the game config. */
export const HIRES_PLUGIN = { key: 'hires', plugin: HiResPlugin, mapping: 'hires', start: true };
