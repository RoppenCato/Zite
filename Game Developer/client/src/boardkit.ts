// The board drawn from kits (chapter 1, step 5): an area's ground as tiles, roads stroked along the links in the kit's
// colours, spot plates from the kit, props placed by hand on the hubs and in seeded clusters, sorted by the foot, the
// closed-area cover as a cloud tile. Mitch, AD's Cloverfield kit and NOTES (`assets/board_meadows/`) are the first; a
// theme with no kit keeps the board's shapes. Files are 2x, drawn at 0.5; sizes here are world pixels.

import Phaser from 'phaser';
import secretPlacesJson from '../../assets/secrets/secrets_atlas.json?url';
import secretPlacesPng from '../../assets/secrets/secrets.png';
import buriedCrown from '../../assets/dungeon_crown/buried_crown.json';
import crownPlacement from '../../assets/dungeon_crown/placement.json';
import crownPlacesJson from '../../assets/dungeon_crown/crown_places.json?url';
import crownPlacesPng from '../../assets/dungeon_crown/crown_places.png';
import farSecretsJson from '../../assets/places_far/far_secrets_atlas.json?url';
import farSecretsPng from '../../assets/places_far/far_secrets.png';
import rootways from '../../assets/world_moved/rootways.json';
import rootwaysPlacement from '../../assets/world_moved/placement_rootways.json';
import rootwaysPlacesJson from '../../assets/dungeon_meadows/rootways_places.json?url';
import rootwaysPlacesPng from '../../assets/dungeon_meadows/rootways_places.png';
import { ARENA_CLEARED, preloadArena } from './arena.ts';
import type { Area, Space, SpaceKind } from '../../rules/src/index.ts';
import bannerPng from '../../assets/board_meadows/area_banner.png';
import groundJson from '../../assets/board_meadows/board_ground.json?url';
import groundPng from '../../assets/board_meadows/board_ground.png';
import propsJson from '../../assets/board_meadows/board_props.json?url';
import propsPng from '../../assets/board_meadows/board_props.png';
import coverPng from '../../assets/board_meadows/cover.png';
import placementJson from '../../assets/world_moved/placement_meadows.json';
import kingswoodPlacementJson from '../../assets/world_moved/placement_kingswood.json';
import kingswoodPlacesJson from '../../assets/world_moved/kingswood_places.json?url';
import kingswoodPlacesPng from '../../assets/world_moved/kingswood_places.png';
import placesJson from '../../assets/world_meadows/board_places.json?url';
import placesPng from '../../assets/world_meadows/board_places.png';
import forestGroundJson from '../../assets/board_forest/board_ground.json?url';
import forestGroundPng from '../../assets/board_forest/board_ground.png';
import forestPropsJson from '../../assets/board_forest/board_props.json?url';
import forestPropsPng from '../../assets/board_forest/board_props.png';
import forestPlacementJson from '../../assets/world_moved/placement_thornwood.json';
import giantsGroundJson from '../../assets/board_giants/board_ground.json?url';
import giantsGroundPng from '../../assets/board_giants/board_ground.png';
import giantsPropsJson from '../../assets/board_giants/board_props.json?url';
import giantsPropsPng from '../../assets/board_giants/board_props.png';
import giantsPlacementJson from '../../assets/world_giants/placement.json';
import giantsPlacesJson from '../../assets/world_giants/board_places.json?url';
import giantsPlacesPng from '../../assets/world_giants/board_places.png';
import piratesGroundJson from '../../assets/board_pirates/board_ground.json?url';
import piratesGroundPng from '../../assets/board_pirates/board_ground.png';
import piratesPropsJson from '../../assets/board_pirates/board_props.json?url';
import piratesPropsPng from '../../assets/board_pirates/board_props.png';
import piratesPlacementJson from '../../assets/world_pirates/placement.json';
import piratesPlacesJson from '../../assets/world_pirates/board_places.json?url';
import piratesPlacesPng from '../../assets/world_pirates/board_places.png';
import swampGroundJson from '../../assets/board_swamp/board_ground.json?url';
import swampGroundPng from '../../assets/board_swamp/board_ground.png';
import swampPropsJson from '../../assets/board_swamp/board_props.json?url';
import swampPropsPng from '../../assets/board_swamp/board_props.png';
import swampPlacementJson from '../../assets/world_moved/placement_bogglemire.json';
import swampPlacesJson from '../../assets/world_swamp/board_places.json?url';
import swampPlacesPng from '../../assets/world_swamp/board_places.png';
import frostGroundJson from '../../assets/board_frost/board_ground.json?url';
import frostGroundPng from '../../assets/board_frost/board_ground.png';
import frostPropsJson from '../../assets/board_frost/board_props.json?url';
import frostPropsPng from '../../assets/board_frost/board_props.png';
import frostPlacementJson from '../../assets/world_moved/placement_frostcrown.json';
import frostPlacesJson from '../../assets/world_frost/board_places.json?url';
import frostPlacesPng from '../../assets/world_frost/board_places.png';
import harvestGroundJson from '../../assets/board_harvest/board_ground.json?url';
import harvestGroundPng from '../../assets/board_harvest/board_ground.png';
import harvestPropsJson from '../../assets/board_harvest/board_props.json?url';
import harvestPropsPng from '../../assets/board_harvest/board_props.png';
import harvestPlacementJson from '../../assets/world_moved/placement_frostpeak.json';
import harvestPlacesJson from '../../assets/world_harvest/board_places.json?url';
import harvestPlacesPng from '../../assets/world_harvest/board_places.png';
import forestPlacesJson from '../../assets/world_forest/board_places.json?url';
import forestPlacesPng from '../../assets/world_forest/board_places.png';
import cityPlatesJson from '../../assets/land_marks/plates_city.json?url';
import cityPlatesPng from '../../assets/land_marks/plates_city.png';
import crownPlatesJson from '../../assets/land_marks/plates_crown.json?url';
import crownPlatesPng from '../../assets/land_marks/plates_crown.png';
import dungeonPlatesJson from '../../assets/land_marks/plates_dungeon.json?url';
import dungeonPlatesPng from '../../assets/land_marks/plates_dungeon.png';
import rootwaysBannerPng from '../../assets/land_marks/banner_rootways.png';
import crownBannerPng from '../../assets/land_marks/banner_buried-crown.png';

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
  /** The banner moved along from the area's middle, clear of a landmark. */
  bannerDx?: number;
  /** The kit's own spot plates (Mitch, AD's land marks), when its stone is not the Meadows'. */
  plates?: { key: string; png: string; json: string };
  files: { groundPng: string; groundJson: string; propsPng: string; propsJson: string };
}

const SCALE = 0.5;
/** The new pieces of the painted world. */
export const PLACES = 'board_places';
const FOREST_PLACES = 'forest_places';
const HARVEST_PLACES = 'harvest_places';
const SWAMP_PLACES = 'swamp_places';
const PIRATE_PLACES = 'pirate_places';
const GIANT_PLACES = 'giant_places';
const FROST_PLACES = 'frost_places';

/** The atlas of the painted world that holds a piece: its names are shared where a piece is shared, so a theme's own comes first. */
export function placesAtlas(scene: Phaser.Scene, name: string, theme?: string): string | null {
  const own = THEME_PLACES[theme ?? '']?.key ?? PLACES;
  const order = [own, PLACES, FOREST_PLACES, HARVEST_PLACES, SWAMP_PLACES, FROST_PLACES, PIRATE_PLACES, GIANT_PLACES, ROOTWAYS_PLACES, CROWN_PLACES, SECRET_PLACES, FAR_SECRETS, KINGSWOOD_PLACES];
  return order.find((key) => scene.textures.exists(key) && scene.textures.get(key).has(name)) ?? null;
}
/** A closed area's cloud stops this far into the open area under it, clear of its banner's top and its first spots. */
export const TOP_MARGIN = 20;
const ROOTWAYS_PLACES = 'rootways_places';
const FAR_SECRETS = 'far_secrets';
export const CROWN_PLACES = 'crown_places';
/** The door under Crownhaven: where it stands, barred or open. */
export const CROWN_DOOR = buriedCrown.door;
const KINGSWOOD_PLACES = 'kingswood_places';
export const SECRET_PLACES = 'secret_places';
/** The painted world's pieces that belong to one region. */
const THEME_PLACES: Record<string, { key: string; png: string; json: string }> = {
  forest: { key: FOREST_PLACES, png: forestPlacesPng, json: forestPlacesJson },
  harvest: { key: HARVEST_PLACES, png: harvestPlacesPng, json: harvestPlacesJson },
  swamp: { key: SWAMP_PLACES, png: swampPlacesPng, json: swampPlacesJson },
  mountain: { key: FROST_PLACES, png: frostPlacesPng, json: frostPlacesJson },
  pirates: { key: PIRATE_PLACES, png: piratesPlacesPng, json: piratesPlacesJson },
  giants: { key: GIANT_PLACES, png: giantsPlacesPng, json: giantsPlacesJson },
};
const ROOTWAYS_CLEARED = new Set(rootways.door.remove.map((p) => `${p.name}@${p.x},${p.y}`));
/** A road's line from a colour written #rrggbb or rgba(r,g,b,a). */
function roadLine(width: number, colour: string): { width: number; color: number; alpha: number } {
  const rgba = colour.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  if (rgba) return { width, color: (Number(rgba[1]) << 16) | (Number(rgba[2]) << 8) | Number(rgba[3]), alpha: Number(rgba[4]) };
  return { width, color: parseInt(colour.slice(1), 16), alpha: 1 };
}
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
    placements: { meadows: [...(placementJson as Placement[]), { name: rootways.door.frame, x: rootways.door.x, y: rootways.door.y }], kingswood: kingswoodPlacementJson as Placement[] },
    files: { groundPng, groundJson, propsPng, propsJson },
  },
  // Mitch, AD's Wobblewood (2026-11-01): the cover and the banner are the meadows'.
  forest: {
    ground: 'forest_ground',
    props: 'forest_props',
    cover: 'board_cover',
    banner: 'board_banner',
    tiles: [
      { frame: 'ground_a', weight: 40 },
      { frame: 'ground_b', weight: 40 },
      { frame: 'ground_c', weight: 20 },
    ],
    tile: 128,
    road: [
      { width: 30, color: 0x7f6240, alpha: 1 },
      { width: 25, color: 0xb58f5e, alpha: 1 },
      { width: 10, color: 0xd0b280, alpha: 0.8 },
    ],
    flat: new Set(['clover', 'worn']),
    bannerDx: -170,
    placements: { thornwood: forestPlacementJson as Placement[] },
    files: { groundPng: forestGroundPng, groundJson: forestGroundJson, propsPng: forestPropsPng, propsJson: forestPropsJson },
  },
  // Mitch, AD's Honeyhill Fields (2026-11-02): the cover and the banner are the meadows'.
  harvest: {
    ground: 'harvest_ground',
    props: 'harvest_props',
    cover: 'board_cover',
    banner: 'board_banner',
    tiles: [
      { frame: 'ground_a', weight: 40 },
      { frame: 'ground_b', weight: 40 },
      { frame: 'ground_c', weight: 20 },
    ],
    tile: 128,
    road: [
      { width: 30, color: 0xb4935a, alpha: 1 },
      { width: 25, color: 0xd9bb7e, alpha: 1 },
      { width: 10, color: 0xecd49c, alpha: 0.8 },
    ],
    flat: new Set(['clover', 'worn']),
    placements: { frostpeak: harvestPlacementJson as Placement[] },
    files: { groundPng: harvestGroundPng, groundJson: harvestGroundJson, propsPng: harvestPropsPng, propsJson: harvestPropsJson },
  },
};

/** A dungeon's own banner (Mitch, AD, 2026-11-03). The lands on the painted map draw none: their names are words over the map. */
const AREA_BANNERS: Record<string, string> = { rootways: rootwaysBannerPng, 'buried-crown': crownBannerPng };
const bannerKey = (areaId: string): string => `banner_${areaId}`;

const PLATES: Record<SpaceKind, string> = { arena: 'spot_town', door: 'spot_door', board: 'spot_board', gear: 'spot_gear', normal: 'spot_wild', town: 'spot_town', shop: 'spot_shop', chest: 'spot_chest', potion: 'spot_spring', spell: 'spot_shrine', church: 'spot_church', boss: 'spot_gate' };

/** Queue the kits of these themes, and the cover and banner they share. The board is drawn whole, so an area's kit must be here before it opens. */
export function preloadBoardKits(scene: Phaser.Scene, themes: readonly string[]): void {
  const shared = KITS.meadow!;
  if (!scene.textures.exists(shared.cover)) scene.load.image(shared.cover, coverPng);
  if (!scene.textures.exists(shared.banner)) scene.load.image(shared.banner, bannerPng);
  if (!scene.textures.exists(PLACES)) scene.load.atlas(PLACES, placesPng, placesJson);
  preloadArena(scene);
  if (!scene.textures.exists(SECRET_PLACES)) scene.load.atlas(SECRET_PLACES, secretPlacesPng, secretPlacesJson);
  if (!scene.textures.exists(FAR_SECRETS)) scene.load.atlas(FAR_SECRETS, farSecretsPng, farSecretsJson);
  if (!scene.textures.exists(KINGSWOOD_PLACES)) scene.load.atlas(KINGSWOOD_PLACES, kingswoodPlacesPng, kingswoodPlacesJson);
  if (!scene.textures.exists(ROOTWAYS_PLACES)) scene.load.atlas(ROOTWAYS_PLACES, rootwaysPlacesPng, rootwaysPlacesJson);
  if (!scene.textures.exists(CROWN_PLACES)) scene.load.atlas(CROWN_PLACES, crownPlacesPng, crownPlacesJson);
  // The hub city's plates and the dungeons' are always held, as their pieces are.
  for (const [area, png] of Object.entries(AREA_BANNERS)) if (!scene.textures.exists(bannerKey(area))) scene.load.image(bannerKey(area), png);
  for (const theme of ['city', 'crown', 'dungeon']) {
    const plates = KITS[theme]?.plates;
    if (plates && !scene.textures.exists(plates.key)) scene.load.atlas(plates.key, plates.png, plates.json);
  }
  for (const theme of themes) {
    const places = THEME_PLACES[theme];
    if (places && !scene.textures.exists(places.key)) scene.load.atlas(places.key, places.png, places.json);
  }
  for (const theme of new Set(['meadow', ...themes])) {
    const k = KITS[theme];
    if (!k) continue;
    if (!scene.textures.exists(k.ground)) scene.load.atlas(k.ground, k.files.groundPng, k.files.groundJson);
    if (!scene.textures.exists(k.props)) scene.load.atlas(k.props, k.files.propsPng, k.files.propsJson);
  }
}

/** The kit for a theme, when its atlases are loaded; null keeps the shapes. */
/** Bogglemire and The Frostcrown (Mitch, AD, 2026-11-02): their roads are baked into the ground, so `road` is only for what is stroked from them. */
const landKit = (id: string, area: string, placement: Placement[], files: Kit['files']): Kit => ({ ...KITS.harvest!, ground: `${id}_ground`, props: `${id}_props`, placements: { [area]: placement }, flat: new Set<string>(), files });
KITS.swamp = landKit('swamp', 'bogglemire', swampPlacementJson as Placement[], { groundPng: swampGroundPng, groundJson: swampGroundJson, propsPng: swampPropsPng, propsJson: swampPropsJson });
KITS.mountain = landKit('mountain', 'frostcrown', frostPlacementJson as Placement[], { groundPng: frostGroundPng, groundJson: frostGroundJson, propsPng: frostPropsPng, propsJson: frostPropsJson });
KITS.giants = landKit('giants', 'giantsland', giantsPlacementJson as Placement[], { groundPng: giantsGroundPng, groundJson: giantsGroundJson, propsPng: giantsPropsPng, propsJson: giantsPropsJson });
KITS.pirates = landKit('pirates', 'pirateisles', piratesPlacementJson as Placement[], { groundPng: piratesGroundPng, groundJson: piratesGroundJson, propsPng: piratesPropsPng, propsJson: piratesPropsJson });

/** Crownhaven is baked whole: it needs only plates, in cobble (Mitch, AD, 2026-11-03). */
KITS.city = { ...KITS.meadow!, placements: {}, plates: { key: 'plates_city', png: cityPlatesPng, json: cityPlatesJson } };

/** A dungeon has its own roads, pieces and plates: crypt stone under the Crown, root-worn earth in the Rootways and after. */
KITS.crown = { ...KITS.meadow!, road: buriedCrown.roadColours.map(([width, colour]) => roadLine(width as number, colour as string)), placements: { 'buried-crown': crownPlacement as Placement[] }, plates: { key: 'plates_crown', png: crownPlatesPng, json: crownPlatesJson } };
KITS.dungeon = { ...KITS.meadow!, road: rootways.roadColours.map(([width, colour]) => roadLine(width as number, colour as string)), placements: { rootways: rootwaysPlacement as Placement[] }, plates: { key: 'plates_dungeon', png: dungeonPlatesPng, json: dungeonPlatesJson } };

export function kitFor(scene: Phaser.Scene, theme: string): Kit | null {
  // A far region's own atlases may not be held (`preloadRegion`): its roads need none, and its plates borrow the Meadows' until they are.
  const shared = KITS.meadow!;
  const k = KITS[theme];
  return k && scene.textures.exists(shared.ground) && scene.textures.exists(shared.props) ? k : null;
}

/** Queue a region's own atlases, for when you come near it (Robin, 2026-11-02: more land must not hold more memory). */
export function preloadRegion(scene: Phaser.Scene, theme: string): void {
  preloadBoardKits(scene, [theme]);
}

/** The atlas keys of a region's own pieces. */
/** A gate of one region's own art: its frame names are shared with others, so only that atlas will do. */
export function themedPlaces(scene: Phaser.Scene, theme: string): string | null {
  const key = THEME_PLACES[theme]?.key;
  return key && scene.textures.exists(key) ? key : null;
}

export function regionPlaces(theme: string): string[] {
  const places = THEME_PLACES[theme];
  return places ? [places.key] : [];
}

/** Whether a region's atlases are held. */
export function regionHeld(scene: Phaser.Scene, theme: string): boolean {
  const k = KITS[theme];
  const places = THEME_PLACES[theme];
  return !!k && scene.textures.exists(k.ground) && scene.textures.exists(k.props) && (!places || scene.textures.exists(places.key));
}

/** Let go of a region's atlases. Nothing may be drawn from them by now (`clearKitProps`, `dressPlate`). */
export function freeRegion(scene: Phaser.Scene, theme: string): void {
  const k = KITS[theme];
  const keys = [k?.ground, k?.props, THEME_PLACES[theme]?.key].filter((key): key is string => !!key);
  for (const key of keys) if (scene.textures.exists(key)) scene.textures.remove(key);
}

/** A spot's plate in its region's own art if that is held, or the Meadows' until it is. */
export function dressPlate(scene: Phaser.Scene, kit: Kit, space: Space, plate: Phaser.GameObjects.Image): void {
  const { atlas, frame } = plateArt(scene, kit, space);
  plate.setTexture(atlas, frame);
}

function plateArt(scene: Phaser.Scene, kit: Kit, space: Space): { atlas: string; frame: string } {
  const wanted = space.hidden && space.name ? 'spot_secret' : space.kind === 'shop' && space.stock === 'magic' ? 'spot_shop_magic' : PLATES[space.kind];
  // A kind the kit's own plates lack (a door, a secret) stays as it was.
  if (kit.plates && scene.textures.exists(kit.plates.key) && scene.textures.get(kit.plates.key).has(wanted)) return { atlas: kit.plates.key, frame: wanted };
  const props = scene.textures.exists(kit.props) ? kit.props : KITS.meadow!.props;
  if (scene.textures.get(props).has(wanted)) return { atlas: props, frame: wanted };
  const elsewhere = placesAtlas(scene, wanted);
  return elsewhere ? { atlas: elsewhere, frame: wanted } : { atlas: props, frame: PLATES.normal };
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

/** An earlier area's ground lies over a later one's where their bounds meet. */
export function groundDepth(tier: number): number {
  return KIT_DEPTH.ground + 0.5 - tier * 0.001;
}

/** The area's ground: tiles over its bounds, chosen per cell from the seed. */
export function drawKitGround(scene: Phaser.Scene, kit: Kit, area: Area, seed: string, boardWidth: number, boardHeight: number, avoid: { x: number; y: number; width: number; height: number }[] = []): void {
  const b = area.bounds;
  const t = kit.tile;
  const total = kit.tiles.reduce((n, x) => n + x.weight, 0);
  const x0 = Math.floor(b.x / t) * t;
  const y0 = Math.floor(b.y / t) * t;
  for (let y = y0; y < Math.min(b.y + b.height, boardHeight); y += t) {
    for (let x = x0; x < Math.min(b.x + b.width, boardWidth); x += t) {
      // Never over painted land: a road of this area may start on it.
      if (avoid.some((p) => x < p.x + p.width && x + t > p.x && y < p.y + p.height && y + t > p.y)) continue;
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
      scene.add.image(x + t / 2, y + t / 2, kit.ground, frame).setScale(SCALE * 1.02).setDepth(groundDepth(area.tier));
    }
  }
}

/** The area's name on the kit's banner at the top of its bounds. */
export function drawKitBanner(scene: Phaser.Scene, kit: Kit, area: Area, font: string): void {
  const b = area.bounds;
  const x = b.x + b.width / 2 + (kit.bannerDx ?? 0);
  const y = b.y + 40;
  const banner = scene.textures.exists(bannerKey(area.id)) ? bannerKey(area.id) : kit.banner;
  scene.add.image(x, y, banner).setScale(SCALE).setDepth(KIT_DEPTH.names).setAlpha(0.92);
  scene.add
    .text(x, y - 1, area.name, { fontFamily: font, fontSize: '22px', fontStyle: 'bold', color: '#fff8e6', stroke: '#4a3a22', strokeThickness: 3, resolution: 2 })
    .setOrigin(0.5)
    .setDepth(KIT_DEPTH.names);
}

/**
 * The roads between the given spots in the kit's colours: three strokes, outer first, each link as a line and each spot as
 * a round joint, so the curves the spots follow read as one road. A link to a spot drawn earlier is drawn once.
 */
export function drawKitRoads(scene: Phaser.Scene, kit: Kit, spaces: Space[], all: Record<string, Space>, skip?: (a: Space, b: Space) => boolean): Phaser.GameObjects.Graphics {
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
          if (b && !skip?.(space, b)) g.lineBetween(space.x, space.y, b.x, b.y);
        }
      }
    }
  }
  return g;
}

/** A spot's plate from the kit, at the spot's centre; its tap area is the plate's rectangle. */
export function drawKitPlate(scene: Phaser.Scene, kit: Kit, space: Space): Phaser.GameObjects.Image {
  // A spot with no plate of its own yet takes the wilds' (the quest board's, until Mitch, AD's comes).
  // A magic shop is a shop in the rules, with its own plate on the map.
  const { atlas, frame } = plateArt(scene, kit, space);
  const plate = scene.add.image(space.x, space.y, atlas, frame).setScale(SCALE).setDepth(KIT_DEPTH.plates);
  // A thumb is wider than a plate: the tap area reaches well past it, as it did round the old circles.
  const { width, height } = plate;
  plate.setInteractive(new Phaser.Geom.Rectangle(-30, -50, width + 60, height + 100), Phaser.Geom.Rectangle.Contains);
  return plate;
}

/** The hand-laid props of an area, if the kit has them: the flat ones under the roads, the rest sorted by their foot. */
export function drawKitProps(scene: Phaser.Scene, kit: Kit, area: Area): number {
  const list = kit.placements[area.id];
  if (!list || !scene.textures.exists(kit.props)) return 0;
  for (const p of list) {
    if (ARENA_CLEARED.has(`${p.name}@${p.x},${p.y}`) || ROOTWAYS_CLEARED.has(`${p.name}@${p.x},${p.y}`)) continue;
    const atlas = scene.textures.get(kit.props).has(p.name) ? kit.props : placesAtlas(scene, p.name, area.theme);
    if (!atlas) continue;
    const sprite = scene.add.image(p.x, p.y, atlas, p.name).setScale(SCALE);
    allProps.push(sprite);
    propArea.set(sprite, area.id);
    sprite.setDepth(kit.flat.has(p.name) ? KIT_DEPTH.flat : standingDepth(p.y));
    if (sprite.getBounds().top < area.bounds.y + TOP_MARGIN) tall.set(area.id, [...(tall.get(area.id) ?? []), sprite]);
  }
  return list.length;
}

/** The door under Crownhaven: drawn once, then barred or open as the Seals say. */
export function drawCrownDoor(scene: Phaser.Scene, door: Phaser.GameObjects.Image | null, open: boolean): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(CROWN_PLACES)) return null;
  const frame = open ? CROWN_DOOR.open : CROWN_DOOR.barred;
  if (door?.active) return door.setFrame(frame);
  const sprite = scene.add.image(CROWN_DOOR.x, CROWN_DOOR.y, CROWN_PLACES, frame).setScale(SCALE).setDepth(standingDepth(CROWN_DOOR.y));
  allProps.push(sprite);
  propArea.set(sprite, 'crownhaven');
  return sprite;
}

/** The cover over an area not yet open: the kit's cloud, tiled, with a little dark over it. */
export function drawKitCover(scene: Phaser.Scene, kit: Kit, area: Area, bottom = area.bounds.y + area.bounds.height): Phaser.GameObjects.Container {
  const b = area.bounds;
  const height = bottom - b.y;
  const cloud = scene.add.tileSprite(0, 0, b.width, height, kit.cover).setTileScale(SCALE).setAlpha(0.96);
  const dark = scene.add.rectangle(0, 0, b.width, height, 0x0b0d14, 0.3);
  return scene.add.container(b.x + b.width / 2, b.y + height / 2, [cloud, dark]).setDepth(KIT_DEPTH.cover);
}

/** The area a prop stands in, for the cull: a closed land's pieces show only on land already open. */
export const propArea = new Map<Phaser.GameObjects.Image, string>();

/** Every prop on the map, for the camera's cull. */
export const allProps: Phaser.GameObjects.Image[] = [];

/** Props that rise past their area's top, by area: once the area is open they stand over the next area's cloud (the glade's gate does). */
const tall = new Map<string, Phaser.GameObjects.Image[]>();

/** An area's props gone, before its atlases are freed. */
export function clearKitProps(areaId: string): void {
  for (let i = allProps.length - 1; i >= 0; i--) {
    const sprite = allProps[i]!;
    if (propArea.get(sprite) !== areaId) continue;
    propArea.delete(sprite);
    allProps.splice(i, 1);
    sprite.destroy();
  }
  tall.delete(areaId);
}

export function raiseTallProps(areaId: string): void {
  for (const sprite of tall.get(areaId) ?? []) sprite.setDepth(KIT_DEPTH.cover + 0.5);
}

export type { Kit };
