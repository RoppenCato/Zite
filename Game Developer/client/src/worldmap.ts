// The painted world (Robin, 2026-11-02: "yes keep the look, go with about 400 spots"; "isnt there a way we could load a map at a
// time"). Mitch, AD's ground is baked: one picture of the whole world for the zoomed-out map, and square chunks for close up.
// Only the chunks near the camera are in memory: they load as it comes near and are freed as it leaves. Zoomed out, none are.

import Phaser from 'phaser';
import { WORLD_DATA } from '../../rules/src/index.ts';
import worldChunks from '../../assets/world_moved/chunks.json';
import overviewsData from '../../assets/world_moved/overviews.json';
import overviewMiddleJpg from '../../assets/world_moved/overview_middle.jpg';
import overviewWestJpg from '../../assets/world_moved/overview_west.jpg';
import overviewEastJpg from '../../assets/world_moved/overview_east.jpg';
import rootwaysChunks from '../../assets/world_moved/rootways_chunks.json';
import rootways from '../../assets/world_moved/rootways.json';
import fogSwampJson from '../../assets/world_moved/fog_swamp.json';
import fogSwampPng from '../../assets/fog_east/fog_swamp.png';
import fogFrostJson from '../../assets/world_moved/fog_frost.json';
import fogFrostPng from '../../assets/fog_east/fog_frost.png';
import comingData from '../../assets/coming_lands/coming.json';
import comingOverviews from '../../assets/coming_lands/overviews_coming.json';
import overviewNorthwestJpg from '../../assets/coming_lands/overview_northwest.jpg';
import overviewSouthwestJpg from '../../assets/coming_lands/overview_southwest.jpg';
import fogFarPiecesJson from '../../assets/coming_lands/fog_far_pieces.json?url';
import fogFarPiecesPng from '../../assets/coming_lands/fog_far_pieces.png';
import fogGiantsJson from '../../assets/coming_lands/fog_giants.json';
import fogGiantsPng from '../../assets/coming_lands/fog_giants.png';
import fogPiratesJson from '../../assets/coming_lands/fog_pirates.json';
import fogPiratesPng from '../../assets/coming_lands/fog_pirates.png';
import fogHoneyhillJson from '../../assets/fog_hub/fog_honeyhill.json';
import fogHoneyhillPng from '../../assets/fog_hub/fog_honeyhill.png';
import fogKingswoodJson from '../../assets/fog_hub/fog_kingswood.json';
import fogKingswoodPng from '../../assets/fog_hub/fog_kingswood.png';
import fogWobblewoodJson from '../../assets/fog_hub/fog_wobblewood.json';
import fogWobblewoodPng from '../../assets/fog_hub/fog_wobblewood.png';
import fogPiecesJson from '../../assets/fog/fog_pieces.json?url';
import fogPiecesPng from '../../assets/fog/fog_pieces.png';
import fogEastPiecesJson from '../../assets/fog_east/fog_east_pieces.json?url';
import fogEastPiecesPng from '../../assets/fog_east/fog_east_pieces.png';

const FILES = import.meta.glob('../../assets/world_moved/{ground,rootways}_*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface Chunk {
  file: string;
  col: number;
  row: number;
  x: number;
  y: number;
}

/** A dungeon's painted floor: where the camera stays while inside, and the dark past it. */
export const DUNGEON_LAND: Record<string, { x: number; y: number; width: number; height: number; fill: number }> = {
  rootways: { ...rootways.bounds, fill: parseInt(rootways.fill.slice(1), 16) },
};

/** The land each area owns on the map (Robin, 2026-11-02: the hub world): round its spots. */
const LAND_MARGIN = 500;
export const PAINTED: Record<string, { x: number; y: number; width: number; height: number }> = Object.fromEntries(
  WORLD_DATA.areas.map((a) => {
    const xs = a.hubs.map((h) => h.x);
    const ys = a.hubs.map((h) => h.y);
    const x = Math.max(0, Math.min(...xs) - LAND_MARGIN);
    const y = Math.max(0, Math.min(...ys) - LAND_MARGIN);
    return [a.id, { x, y, width: Math.max(...xs) + LAND_MARGIN - x, height: Math.max(...ys) + LAND_MARGIN - y }];
  }),
);

/** Lands whose roads are baked into the ground (Mitch, AD): stroking them would cover the planks, the snow and the city's streets. */
export const BAKED_ROADS = new Set(['bogglemire', 'frostcrown', 'crownhaven']);

/** One set of chunks for the world; a dungeon's lie on squares of the same grid, and only one set is ever wanted. */
const CHUNKS = new Map<string, Chunk & { areas: string[] }>();
for (const c of worldChunks.chunks as Chunk[]) CHUNKS.set(`ground_${c.col}_${c.row}`, { ...c, areas: ['world'] });

/** The sea, behind everything. */
export const SEA = 0x2f7fc4;
const CHUNK_SIZE = worldChunks.size;
// A dungeon's chunks lie on grid squares the Forest's sea has too: they have their own keys, and only one set is ever wanted.
for (const c of rootwaysChunks.chunks as Chunk[]) CHUNKS.set(`rootways_${c.col}_${c.row}`, { ...c, file: `rootways_${c.col}_${c.row}.jpg`, areas: ['rootways'] });

/** Below this camera zoom, in canvas pixels, the overview does the work and no chunk is held. */
export const CHUNK_ZOOM = 0.6;
/** How far past the view a chunk loads, and how far it may be before it is freed: apart, so walking a border does not churn. */
const LOAD_MARGIN = 256;
const FREE_MARGIN = 512;
const DEPTH = { overview: -3, chunk: -2 } as const;
const OVERVIEW_KEY = 'world_overview';

/** The mist over a closed land (Mitch, AD), cut to its coast. */
const FOG: Record<string, { key: string; png: string; box: typeof fogSwampJson }> = {
  // The first lands past the Meadows darken too (Robin, 2026-11-02; Mitch, AD): the Kingswood's holds the city as well, and they open together.
  kingswood: { key: 'fog_kingswood', png: fogKingswoodPng, box: fogKingswoodJson },
  thornwood: { key: 'fog_wobblewood', png: fogWobblewoodPng, box: fogWobblewoodJson },
  frostpeak: { key: 'fog_honeyhill', png: fogHoneyhillPng, box: fogHoneyhillJson },
  bogglemire: { key: 'fog_swamp', png: fogSwampPng, box: fogSwampJson },
  frostcrown: { key: 'fog_frost', png: fogFrostPng, box: fogFrostJson },
  // Not in the world yet: they show closed until they are (Robin, 2026-11-02; Mitch, AD's first pass).
  giantsland: { key: 'fog_giants', png: fogGiantsPng, box: fogGiantsJson },
  pirateisles: { key: 'fog_pirates', png: fogPiratesPng, box: fogPiratesJson },
};
/** Silhouettes of bosses and the "?" of creatures not met. */
export const FOG_PIECES = 'fog_pieces';
export const FOG_EAST_PIECES = 'fog_east_pieces';
export const FOG_FAR_PIECES = 'fog_far_pieces';
/** The lands to come: what the map shows of them, from Mitch, AD's coming.json. */
export const COMING_LANDS = Object.values(comingData);
const OVERVIEWS: { key: string; jpg: string; box: typeof overviewsData.middle }[] = [
  { key: 'world_overview_west', jpg: overviewWestJpg, box: overviewsData.west },
  { key: 'world_overview_east', jpg: overviewEastJpg, box: overviewsData.east },
  { key: 'world_overview_northwest', jpg: overviewNorthwestJpg, box: comingOverviews.northwest },
  { key: 'world_overview_southwest', jpg: overviewSouthwestJpg, box: comingOverviews.southwest },
];

export function preloadWorldMap(scene: Phaser.Scene): void {
  if (!scene.textures.exists(OVERVIEW_KEY)) scene.load.image(OVERVIEW_KEY, overviewMiddleJpg);
  for (const fog of Object.values(FOG)) if (!scene.textures.exists(fog.key)) scene.load.image(fog.key, fog.png);
  if (!scene.textures.exists(FOG_PIECES)) scene.load.atlas(FOG_PIECES, fogPiecesPng, fogPiecesJson);
  if (!scene.textures.exists(FOG_EAST_PIECES)) scene.load.atlas(FOG_EAST_PIECES, fogEastPiecesPng, fogEastPiecesJson);
  if (!scene.textures.exists(FOG_FAR_PIECES)) scene.load.atlas(FOG_FAR_PIECES, fogFarPiecesPng, fogFarPiecesJson);
}

const urlOf = (file: string): string | undefined => Object.entries(FILES).find(([path]) => path.endsWith(`/${file}`))?.[1];

export class PaintedGround {
  private readonly scene: Phaser.Scene;
  private readonly held = new Map<string, Phaser.GameObjects.Image>();
  private readonly loading = new Set<string>();
  private readonly veils = new Map<string, Phaser.GameObjects.Image>();
  private readonly wanted = new Set<string>();
  private sides = false;
  /** The most chunks ever in memory at once, for the measure. */
  peak = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const box = overviewsData.middle;
    scene.add.image(box.worldX, box.worldY, OVERVIEW_KEY).setOrigin(0, 0).setScale(1 / box.filePxPerWorldPx).setDepth(DEPTH.overview);
    for (const [area, fog] of Object.entries(FOG)) {
      if (!scene.textures.exists(fog.key)) continue;
      const veil = scene.add.image(fog.box.worldX, fog.box.worldY, fog.key).setOrigin(0, 0).setDisplaySize(fog.box.worldW, fog.box.worldH).setDepth(DEPTH.overview + 0.5);
      this.veils.set(area, veil);
    }
  }

  /** The west's and east's overviews, about 11 MB, only once the map is first zoomed out. */
  private showSides(): void {
    if (this.sides) return;
    this.sides = true;
    for (const o of OVERVIEWS) {
      const place = (): void => void this.scene.add.image(o.box.worldX, o.box.worldY, o.key).setOrigin(0, 0).setScale(1 / o.box.filePxPerWorldPx).setDepth(DEPTH.overview);
      if (this.scene.textures.exists(o.key)) place();
      else {
        this.scene.load.image(o.key, o.jpg);
        this.scene.load.once(`filecomplete-image-${o.key}`, place);
      }
    }
    this.scene.load.start();
  }

  /** From the camera's cull: load what is near on open land, free what has gone far. */
  update(cam: Phaser.Cameras.Scene2D.Camera, opened: ReadonlySet<string>): void {
    // Closed land shows under its mist (Robin, 2026-11-02: what is ahead, not empty sea); the mist lifts when it opens.
    for (const [area, veil] of this.veils) {
      if (!opened.has(area)) continue;
      this.veils.delete(area);
      this.scene.tweens.add({ targets: veil, alpha: 0, duration: 1200, onComplete: () => veil.destroy() });
    }
    // From the scroll and zoom as they are now: worldView lags a frame, and jumping from the map to close up would load every chunk it had in view.
    const midX = cam.scrollX + cam.width / 2;
    const midY = cam.scrollY + cam.height / 2;
    const halfW = cam.width / 2 / cam.zoom;
    const halfH = cam.height / 2 / cam.zoom;
    const near = cam.zoom >= CHUNK_ZOOM;
    if (!near) this.showSides();
    const inDungeon = Object.keys(DUNGEON_LAND).some((id) => opened.has(id));
    for (const [key, c] of CHUNKS) {
      const box = (margin: number): boolean => c.x < midX + halfW + margin && c.x + CHUNK_SIZE > midX - halfW - margin && c.y < midY + halfH + margin && c.y + CHUNK_SIZE > midY - halfH - margin;
      const open = c.areas[0] === 'world' ? !inDungeon : c.areas.some((a) => opened.has(a));
      if (near && open && box(LOAD_MARGIN)) {
        this.wanted.add(key);
        this.want(key, c);
      } else if (!near || !open || !box(FREE_MARGIN)) {
        this.wanted.delete(key);
        this.free(key);
      }
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
    // Zoomed out or walked away while it loaded: it is not wanted any more.
    if (this.held.has(key) || !this.wanted.has(key)) return;
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
