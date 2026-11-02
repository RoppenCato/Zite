// The Arena's building on the map (Robin, 2026-11-02: "a big 'Arena building'"; Mitch, AD's, assets/arena). Open: its flags fly. Closed: its doors are shut and the poles bare.
import Phaser from 'phaser';
import pngUrl from '../../assets/arena/arena.png';
import jsonUrl from '../../assets/arena/arena.json?url';
import places from '../../assets/world_moved/arena_places.json';
import eastPngUrl from '../../assets/arena_east/arena.png';
import eastJsonUrl from '../../assets/arena_east/arena.json?url';
import eastPlaces from '../../assets/world_moved/arena_east_places.json';
import farPngUrl from '../../assets/places_far/arena/arena.png';
import farJsonUrl from '../../assets/places_far/arena/arena.json?url';
import farPlaces from '../../assets/places_far/arena/arena_places.json';
import { standingDepth } from './boardkit.ts';

export const ARENA_ATLAS = 'arena_buildings';
const EAST_ATLAS = 'arena_buildings_east';
const FAR_ATLAS = 'arena_buildings_far';

interface Building {
  spot: string;
  x: number;
  y: number;
  frame: string;
  far: string;
  doors: string;
  flag: string;
  flags: { x: number; y: number }[];
  footY: number;
  remove?: { name: string; x: number; y: number }[];
}
const WEST = Object.values((places as unknown as { buildings: Record<string, Building> }).buildings);
const EAST = Object.values((eastPlaces as unknown as { buildings: Record<string, Building> }).buildings);
const FAR = Object.values((farPlaces as unknown as { buildings: Record<string, Building> }).buildings);
const BUILDINGS = [...WEST, ...EAST, ...FAR];
const atlasOf = (b: Building): string => (EAST.includes(b) ? EAST_ATLAS : FAR.includes(b) ? FAR_ATLAS : ARENA_ATLAS);
const SCALE = places.scale;
const FAR_SCALE = places.farScale;

export function preloadArena(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ARENA_ATLAS)) scene.load.atlas(ARENA_ATLAS, pngUrl, jsonUrl);
}

/** What stood where a building now stands, taken out of the map's props. */
export const ARENA_CLEARED = new Set(BUILDINGS.flatMap((b) => (b.remove ?? []).map((p) => `${p.name}@${p.x},${p.y}`)));

/** The building at a spot: its parts, and the far version for when the map is zoomed right out. */
export interface ArenaDrawn {
  near: Phaser.GameObjects.GameObject[];
  far: Phaser.GameObjects.Image;
  top: number;
  x: number;
}

/** Whether a spot's building still has to load: the east's atlas comes only once one of its Arenas is open to you. */
export function loadArenaFor(scene: Phaser.Scene, spot: string): boolean {
  const b = BUILDINGS.find((x) => x.spot === spot);
  if (!b || atlasOf(b) === ARENA_ATLAS || scene.textures.exists(atlasOf(b))) return false;
  if (atlasOf(b) === EAST_ATLAS) scene.load.atlas(EAST_ATLAS, eastPngUrl, eastJsonUrl);
  else scene.load.atlas(FAR_ATLAS, farPngUrl, farJsonUrl);
  return true;
}

export function drawArenaBuilding(scene: Phaser.Scene, spot: string, open: boolean): ArenaDrawn | null {
  const b = BUILDINGS.find((x) => x.spot === spot);
  const ARENA_ATLAS_B = b ? atlasOf(b) : '';
  if (!b || !scene.textures.exists(ARENA_ATLAS_B)) return null;
  const depth = standingDepth(b.footY);
  const body = scene.add.image(b.x, b.y, ARENA_ATLAS_B, b.frame).setScale(SCALE).setDepth(depth);
  const near: Phaser.GameObjects.GameObject[] = [body];
  if (open) {
    b.flags.forEach((f, i) => {
      const flag = scene.add.image(b.x + f.x, b.y + f.y, ARENA_ATLAS_B, b.flag).setScale(SCALE).setDepth(depth + 0.0001);
      scene.tweens.add({ targets: flag, scaleX: SCALE * 0.82, duration: 620 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      near.push(flag);
    });
  } else near.push(scene.add.image(b.x, b.y, ARENA_ATLAS_B, b.doors).setScale(SCALE).setDepth(depth + 0.0001));
  const far = scene.add.image(b.x, b.y, ARENA_ATLAS_B, b.far).setScale(FAR_SCALE).setDepth(depth).setVisible(false);
  return { near, far, top: b.y - 300, x: b.x };
}
