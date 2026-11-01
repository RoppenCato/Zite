// The board drawn from kits (chapter 1, step 5): an area's ground as tiles, roads stroked along the links in the kit's
// colours, spot plates from the kit, props placed by hand on the hubs and in seeded clusters, sorted by the foot, the
// closed-area cover as a cloud tile. Mitch, AD's Cloverfield kit and NOTES (`assets/board_meadows/`) are the first; a
// theme with no kit keeps the board's shapes. Files are 2x, drawn at 0.5; sizes here are world pixels.

import Phaser from 'phaser';
import type { Area, Space, SpaceKind } from '../../rules/src/index.ts';
import bannerPng from '../../assets/board_meadows/area_banner.png';
import groundJson from '../../assets/board_meadows/board_ground.json?url';
import groundPng from '../../assets/board_meadows/board_ground.png';
import propsJson from '../../assets/board_meadows/board_props.json?url';
import propsPng from '../../assets/board_meadows/board_props.png';
import coverPng from '../../assets/board_meadows/cover.png';
import placementJson from '../../assets/board_meadows/placement_cloverfield.json';

export interface Placement {
  name: string;
  x: number;
  y: number;
  hub?: string;
}

interface Kit {
  ground: string;
  props: string;
  cover: string;
  banner: string;
  /** The ground tiles and their weights: mostly plain. */
  tiles: { frame: string; weight: number }[];
  tile: number;
  /** The road stroked in code (Mitch, AD's three lines): width, colour, alpha, outer first. */
  road: { width: number; color: number; alpha: number }[];
  /** Props drawn flat under the roads. */
  flat: Set<string>;
  /** The hand-laid props by area id. */
  placements: Record<string, Placement[]>;
}

const SCALE = 0.5;
export const KIT_DEPTH = { ground: 0, flat: 1, roads: 2, plates: 3, props: 5, names: 6, cover: 8 } as const;

const KITS: Record<string, Kit> = {
  meadow: {
    ground: 'board_ground',
    props: 'board_props',
    cover: 'board_cover',
    banner: 'board_banner',
    tiles: [
      { frame: 'ground_a', weight: 40 },
      { frame: 'ground_b', weight: 40 },
      { frame: 'ground_c', weight: 10 },
      { frame: 'ground_d', weight: 10 },
    ],
    tile: 128,
    road: [
      { width: 30, color: 0xb4935a, alpha: 1 },
      { width: 25, color: 0xd9bb7e, alpha: 1 },
      { width: 10, color: 0xecd49c, alpha: 0.8 },
    ],
    flat: new Set(['clover', 'worn', 'hill']),
    placements: { meadows: placementJson as Placement[] },
  },
};

const PLATES: Record<SpaceKind, string> = { normal: 'spot_wild', town: 'spot_town', shop: 'spot_shop', chest: 'spot_chest', potion: 'spot_spring', spell: 'spot_shrine', church: 'spot_shrine', boss: 'spot_gate' };

export function preloadBoardKits(scene: Phaser.Scene): void {
  const k = KITS.meadow!;
  if (!scene.textures.exists(k.ground)) scene.load.atlas(k.ground, groundPng, groundJson);
  if (!scene.textures.exists(k.props)) scene.load.atlas(k.props, propsPng, propsJson);
  if (!scene.textures.exists(k.cover)) scene.load.image(k.cover, coverPng);
  if (!scene.textures.exists(k.banner)) scene.load.image(k.banner, bannerPng);
}

/** The kit for a theme, when its atlases are loaded; null keeps the shapes. */
export function kitFor(scene: Phaser.Scene, theme: string): Kit | null {
  const k = KITS[theme];
  return k && scene.textures.exists(k.ground) && scene.textures.exists(k.props) ? k : null;
}

/** A small hash for a seeded choice per cell. */
function cellHash(seed: string, cx: number, cy: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= cx + 0x9e3779b9;
  h = Math.imul(h, 0x01000193);
  h ^= cy + 0x7f4a7c15;
  h = Math.imul(h, 0x01000193);
  return h >>> 0;
}

/** The depth of a thing that stands on the ground: by its foot, so what is lower is in front. */
export function standingDepth(footY: number): number {
  return KIT_DEPTH.props + footY * 0.0001;
}

/** The area's ground: tiles over its bounds, chosen per cell from the seed. */
export function drawKitGround(scene: Phaser.Scene, kit: Kit, area: Area, seed: string, boardWidth: number, boardHeight: number): void {
  const b = area.bounds;
  const t = kit.tile;
  const total = kit.tiles.reduce((n, x) => n + x.weight, 0);
  const x0 = Math.floor(b.x / t) * t;
  const y0 = Math.floor(b.y / t) * t;
  for (let y = y0; y < Math.min(b.y + b.height, boardHeight); y += t) {
    for (let x = x0; x < Math.min(b.x + b.width, boardWidth); x += t) {
      let pick = cellHash(seed, x / t, y / t) % total;
      let frame = kit.tiles[0]!.frame;
      for (const tile of kit.tiles) {
        if (pick < tile.weight) {
          frame = tile.frame;
          break;
        }
        pick -= tile.weight;
      }
      // A touch over size, so the tiles overlap by a pixel or two and the camera's fractional zooms show no seam between them.
      scene.add.image(x + t / 2, y + t / 2, kit.ground, frame).setScale(SCALE * 1.02).setDepth(KIT_DEPTH.ground);
    }
  }
}

/** The area's name on the kit's banner at the top of its bounds. */
export function drawKitBanner(scene: Phaser.Scene, kit: Kit, area: Area, font: string): void {
  const b = area.bounds;
  const x = b.x + b.width / 2;
  const y = b.y + 40;
  scene.add.image(x, y, kit.banner).setScale(SCALE).setDepth(KIT_DEPTH.names).setAlpha(0.92);
  scene.add
    .text(x, y - 1, area.name, { fontFamily: font, fontSize: '22px', fontStyle: 'bold', color: '#fff8e6', stroke: '#4a3a22', strokeThickness: 3, resolution: 2 })
    .setOrigin(0.5)
    .setDepth(KIT_DEPTH.names);
}

/**
 * The roads between the given spots in the kit's colours: three strokes, outer first, each link as a line and each spot as
 * a round joint, so the curves the spots follow read as one road. A link to a spot drawn earlier is drawn once.
 */
export function drawKitRoads(scene: Phaser.Scene, kit: Kit, spaces: Space[], all: Record<string, Space>): void {
  const g = scene.add.graphics().setDepth(KIT_DEPTH.roads);
  const fresh = new Set(spaces.map((s) => s.id));
  for (const line of kit.road) {
    g.lineStyle(line.width, line.color, line.alpha);
    g.fillStyle(line.color, line.alpha);
    for (const space of spaces) {
      g.fillCircle(space.x, space.y, line.width / 2);
      for (const other of space.links) {
        if (!fresh.has(other) || space.id < other) {
          const b = all[other];
          if (b) g.lineBetween(space.x, space.y, b.x, b.y);
        }
      }
    }
  }
}

/** A spot's plate from the kit, at the spot's centre; its tap area is the plate's rectangle. */
export function drawKitPlate(scene: Phaser.Scene, kit: Kit, space: Space): Phaser.GameObjects.Image {
  const frame = PLATES[space.kind];
  const plate = scene.add.image(space.x, space.y, kit.props, frame).setScale(SCALE).setDepth(KIT_DEPTH.plates);
  plate.setInteractive();
  return plate;
}

/** The hand-laid props of an area, if the kit has them: the flat ones under the roads, the rest sorted by their foot. */
export function drawKitProps(scene: Phaser.Scene, kit: Kit, area: Area): number {
  const list = kit.placements[area.id];
  if (!list) return 0;
  for (const p of list) {
    if (!scene.textures.get(kit.props).has(p.name)) continue;
    const sprite = scene.add.image(p.x, p.y, kit.props, p.name).setScale(SCALE);
    sprite.setDepth(kit.flat.has(p.name) ? KIT_DEPTH.flat : standingDepth(p.y));
  }
  return list.length;
}

/** The cover over an area not yet open: the kit's cloud, tiled, with a little dark over it. */
export function drawKitCover(scene: Phaser.Scene, kit: Kit, area: Area): Phaser.GameObjects.Container {
  const b = area.bounds;
  const cloud = scene.add.tileSprite(0, 0, b.width, b.height, kit.cover).setTileScale(SCALE).setAlpha(0.96);
  const dark = scene.add.rectangle(0, 0, b.width, b.height, 0x0b0d14, 0.3);
  return scene.add.container(b.x + b.width / 2, b.y + b.height / 2, [cloud, dark]).setDepth(KIT_DEPTH.cover);
}

export type { Kit };
