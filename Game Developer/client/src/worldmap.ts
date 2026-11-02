// The painted world (Robin, 2026-11-02: "yes keep the look, go with about 400 spots"; "isnt there a way we could load a map at a
// time"). Mitch, AD's ground is baked: one picture of the whole world for the zoomed-out map, and square chunks for close up.
// Only the chunks near the camera are in memory: they load as it comes near and are freed as it leaves. Zoomed out, none are.

import Phaser from 'phaser';
import chunksData from '../../assets/world_meadows/chunks.json';
import overviewData from '../../assets/world_meadows/overview.json';
import overviewJpg from '../../assets/world_meadows/overview.jpg';

const FILES = import.meta.glob('../../assets/world_meadows/ground_*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface Chunk {
  file: string;
  col: number;
  row: number;
  x: number;
  y: number;
}

/** The areas painted so far, and the land each owns on the map. */
export const PAINTED: Record<string, { x: number; y: number; width: number; height: number }> = {
  meadows: { x: chunksData.x, y: chunksData.y, width: chunksData.width, height: chunksData.height },
};

/** The sea, behind everything. */
export const SEA = 0x2f7fc4;
const CHUNK_SIZE = chunksData.size;
/** Below this camera zoom, in canvas pixels, the overview does the work and no chunk is held. */
const CHUNK_ZOOM = 0.6;
/** How far past the view a chunk loads, and how far it may be before it is freed: apart, so walking a border does not churn. */
const LOAD_MARGIN = 256;
const FREE_MARGIN = 512;
const DEPTH = { overview: -3, chunk: -2 } as const;
const OVERVIEW_KEY = 'world_overview';

export function preloadWorldMap(scene: Phaser.Scene): void {
  if (!scene.textures.exists(OVERVIEW_KEY)) scene.load.image(OVERVIEW_KEY, overviewJpg);
}

const urlOf = (file: string): string | undefined => Object.entries(FILES).find(([path]) => path.endsWith(`/${file}`))?.[1];

export class PaintedGround {
  private readonly scene: Phaser.Scene;
  private readonly held = new Map<string, Phaser.GameObjects.Image>();
  private readonly loading = new Set<string>();
  /** The most chunks ever in memory at once, for the measure. */
  peak = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const land = PAINTED.meadows!;
    const scale = 1 / overviewData.filePxPerWorldPx;
    // Only what has been painted for real shows: the rest of the picture is still the concept, and its land is not the game's yet.
    scene.add
      .image(0, 0, OVERVIEW_KEY)
      .setOrigin(0, 0)
      .setScale(scale)
      .setCrop(land.x / scale, land.y / scale, land.width / scale, land.height / scale)
      .setDepth(DEPTH.overview);
  }

  /** From the camera's cull: load what is near, free what has gone far. */
  update(cam: Phaser.Cameras.Scene2D.Camera): void {
    const v = cam.worldView;
    const near = cam.zoom >= CHUNK_ZOOM;
    for (const c of chunksData.chunks as Chunk[]) {
      const key = `ground_${c.col}_${c.row}`;
      const box = (margin: number): boolean => c.x < v.right + margin && c.x + CHUNK_SIZE > v.x - margin && c.y < v.bottom + margin && c.y + CHUNK_SIZE > v.y - margin;
      if (near && box(LOAD_MARGIN)) this.want(key, c);
      else if (!near || !box(FREE_MARGIN)) this.free(key);
    }
    this.peak = Math.max(this.peak, this.held.size);
  }

  /** How many chunks are in memory now. */
  get count(): number {
    return this.held.size;
  }

  private want(key: string, c: Chunk): void {
    if (this.held.has(key) || this.loading.has(key)) return;
    if (this.scene.textures.exists(key)) {
      this.place(key, c);
      return;
    }
    const url = urlOf(c.file);
    if (!url) return;
    this.loading.add(key);
    this.scene.load.image(key, url);
    this.scene.load.once(`filecomplete-image-${key}`, () => {
      this.loading.delete(key);
      this.place(key, c);
    });
    this.scene.load.start();
  }

  private place(key: string, c: Chunk): void {
    if (this.held.has(key)) return;
    this.held.set(key, this.scene.add.image(c.x, c.y, key).setOrigin(0, 0).setDepth(DEPTH.chunk));
  }

  private free(key: string): void {
    const image = this.held.get(key);
    if (!image) return;
    image.destroy();
    this.held.delete(key);
    this.scene.textures.remove(key);
  }
}
