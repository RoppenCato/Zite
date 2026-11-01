// The hero on screen, in layers (chapter 1, step 9; Mitch, AD's Knight body and Tin set, `assets/hero_gear/NOTES.md`):
// one texture per slot, every piece with the same 26 frames and the pivot at the feet, `clips.json` with the delays once.
// A hero is a container of up to fourteen sprites in Mitch, AD's order, each showing its piece's frame of the same clip,
// driven by one clock here (`update`), so the layers never drift apart. What a character wears decides the layers: a hat
// replaces the hair, gloves replace the hand, boots replace the bare boots, a coat is two layers. A piece of a rank that
// has no art yet shows the Tin piece. Files are 2x and face left; `face(true)` flips the whole hero to face right.

import Phaser from 'phaser';
import type { Character, ClassId, GearItem, Slot } from '../../rules/src/index.ts';
import tricksterBodyJson from '../../assets/hero_classes/trickster/body.json?url';
import tricksterBodyPng from '../../assets/hero_classes/trickster/body.png';
import tricksterWeaponJson from '../../assets/hero_classes/trickster/weapon.json?url';
import tricksterWeaponPng from '../../assets/hero_classes/trickster/weapon.png';
import tricksterIconsJson from '../../assets/hero_classes/trickster/icons.json?url';
import tricksterIconsPng from '../../assets/hero_classes/trickster/icons.png';
import wizardBodyJson from '../../assets/hero_classes/wizard/body.json?url';
import wizardBodyPng from '../../assets/hero_classes/wizard/body.png';
import wizardWeaponJson from '../../assets/hero_classes/wizard/weapon.json?url';
import wizardWeaponPng from '../../assets/hero_classes/wizard/weapon.png';
import wizardIconsJson from '../../assets/hero_classes/wizard/icons.json?url';
import wizardIconsPng from '../../assets/hero_classes/wizard/icons.png';
import archerBodyJson from '../../assets/hero_classes/archer/body.json?url';
import archerBodyPng from '../../assets/hero_classes/archer/body.png';
import archerWeaponJson from '../../assets/hero_classes/archer/weapon.json?url';
import archerWeaponPng from '../../assets/hero_classes/archer/weapon.png';
import archerIconsJson from '../../assets/hero_classes/archer/icons.json?url';
import archerIconsPng from '../../assets/hero_classes/archer/icons.png';
import bodyJson from '../../assets/hero_gear/body.json?url';
import bodyPng from '../../assets/hero_gear/body.png';
import bootsJson from '../../assets/hero_gear/boots.json?url';
import bootsPng from '../../assets/hero_gear/boots.png';
import capesJson from '../../assets/hero_gear/capes.json?url';
import capesPng from '../../assets/hero_gear/capes.png';
import charmsJson from '../../assets/hero_gear/charms.json?url';
import charmsPng from '../../assets/hero_gear/charms.png';
import clipsData from '../../assets/hero_gear/clips.json';
import coatsJson from '../../assets/hero_gear/coats.json?url';
import coatsPng from '../../assets/hero_gear/coats.png';
import glovesJson from '../../assets/hero_gear/gloves.json?url';
import glovesPng from '../../assets/hero_gear/gloves.png';
import hatsJson from '../../assets/hero_gear/hats.json?url';
import hatsPng from '../../assets/hero_gear/hats.png';
import iconsJson from '../../assets/hero_gear/icons.json?url';
import iconsPng from '../../assets/hero_gear/icons.png';
import shieldsJson from '../../assets/hero_gear/shields.json?url';
import shieldsPng from '../../assets/hero_gear/shields.png';
import swordsJson from '../../assets/hero_gear/swords.json?url';
import swordsPng from '../../assets/hero_gear/swords.png';

export type HeroAction = 'stand' | 'move' | 'attack1' | 'defend' | 'hit1' | 'die1';

interface ClipFrame {
  n: string;
  delay: number;
  /** The alpha this frame starts and ends with, 0 to 255; the fall's last frames fade. */
  a0?: number;
  a1?: number;
}
interface Clip {
  loop: boolean;
  hold: boolean;
  frames: ClipFrame[];
}
const CLIPS = clipsData as Record<HeroAction, Clip>;

/** The textures: one per slot, the body with its hair, head, arms and hands, and the gear icons. */
const TEX = {
  body: { key: 'hero_body', png: bodyPng, json: bodyJson },
  boots: { key: 'hero_boots', png: bootsPng, json: bootsJson },
  capes: { key: 'hero_capes', png: capesPng, json: capesJson },
  coats: { key: 'hero_coats', png: coatsPng, json: coatsJson },
  gloves: { key: 'hero_gloves', png: glovesPng, json: glovesJson },
  charms: { key: 'hero_charms', png: charmsPng, json: charmsJson },
  hats: { key: 'hero_hats', png: hatsPng, json: hatsJson },
  swords: { key: 'hero_swords', png: swordsPng, json: swordsJson },
  shields: { key: 'hero_shields', png: shieldsPng, json: shieldsJson },
  icons: { key: 'hero_icons', png: iconsPng, json: iconsJson },
} as const;
type TexName = keyof typeof TEX;
interface Tex {
  key: string;
  png: string;
  json: string;
}
interface ClassArt {
  body: Tex;
  weapon: Tex;
  icons: Tex;
  /** The weapon slot's piece is `<rank>_<part>`. */
  part: string;
}

/** What each class has of its own (Mitch, AD, 2026-11-01); all four wear the same gear atlases, so one class counts once. */
const CLASS_ART: Record<ClassId, ClassArt> = {
  warrior: { body: TEX.body, weapon: TEX.swords, icons: TEX.icons, part: 'sword' },
  rogue: {
    body: { key: 'hero_body_trickster', png: tricksterBodyPng, json: tricksterBodyJson },
    weapon: { key: 'hero_weapon_trickster', png: tricksterWeaponPng, json: tricksterWeaponJson },
    icons: { key: 'hero_icons_trickster', png: tricksterIconsPng, json: tricksterIconsJson },
    part: 'dagger',
  },
  mage: {
    body: { key: 'hero_body_wizard', png: wizardBodyPng, json: wizardBodyJson },
    weapon: { key: 'hero_weapon_wizard', png: wizardWeaponPng, json: wizardWeaponJson },
    icons: { key: 'hero_icons_wizard', png: wizardIconsPng, json: wizardIconsJson },
    part: 'staff',
  },
  ranger: {
    body: { key: 'hero_body_archer', png: archerBodyPng, json: archerBodyJson },
    weapon: { key: 'hero_weapon_archer', png: archerWeaponPng, json: archerWeaponJson },
    icons: { key: 'hero_icons_archer', png: archerIconsPng, json: archerIconsJson },
    part: 'bow',
  },
};
/** The atlases every class shares: the gear and its icons. */
const SHARED: readonly Tex[] = [TEX.boots, TEX.capes, TEX.coats, TEX.gloves, TEX.charms, TEX.hats, TEX.shields, TEX.icons];

/** The files are 2x: 300 px in the file is 150 CSS px in a fight (Mitch, AD's number; Robin, 2026-11-01: "whatever works best", and the side view has the room). */
export const HERO_FIGHT_SCALE = 0.5;
/** On the board the hero stands at half the fight's size, 75 CSS px, against the kit's 56 px plates (mine, 2026-11-01; Robin named 44 to Mitch, AD; his to overrule). */
export const HERO_BOARD_SCALE = 0.25;

/** The rank words of `gear.json`, in rank order: a piece's art is `<rank>_<part>`. */
const RANK_WORDS = ['tin', 'copper', 'iron', 'silver', 'moonsilver', 'sunsteel', 'dragonscale', 'starglass', 'crownsteel', 'everbright'];
const SLOT_PART: Record<Slot, string> = { weapon: 'sword', shield: 'shield', helm: 'hat', armour: 'coat', gloves: 'gloves', boots: 'boots', cape: 'cape', trinket: 'charm' };
const SLOT_TEX: Record<Slot, TexName> = { weapon: 'swords', shield: 'shields', helm: 'hats', armour: 'coats', gloves: 'gloves', boots: 'boots', cape: 'capes', trinket: 'charms' };

/** The character screen loaded every class to show them: only the one played stays in memory. */
export function releaseClasses(game: Phaser.Game, keep: ClassId): void {
  for (const [id, art] of Object.entries(CLASS_ART)) {
    if (id === keep) continue;
    for (const t of [art.body, art.weapon]) if (game.textures.exists(t.key)) game.textures.remove(t.key);
    if (art.icons !== TEX.icons && game.textures.exists(art.icons.key)) game.textures.remove(art.icons.key);
  }
}

/** Queue the shared gear and these classes' own atlases; call from a scene's preload. */
export function preloadHero(scene: Phaser.Scene, classes: readonly ClassId[]): void {
  const art = [...new Set(classes)].flatMap((c) => [CLASS_ART[c].body, CLASS_ART[c].weapon, CLASS_ART[c].icons]);
  for (const t of [...SHARED, ...art]) {
    if (!scene.textures.exists(t.key)) scene.load.atlas(t.key, t.png, t.json);
  }
}

export function heroReady(scene: Phaser.Scene, classId: ClassId): boolean {
  const art = CLASS_ART[classId];
  return [...SHARED, art.body, art.weapon, art.icons].every((t) => scene.textures.exists(t.key));
}

function has(scene: Phaser.Scene, key: string, frame: string): boolean {
  return scene.textures.exists(key) && scene.textures.get(key).has(frame);
}

const partOf = (slot: Slot, classId: ClassId): string => (slot === 'weapon' ? CLASS_ART[classId].part : SLOT_PART[slot]);
const texOf = (slot: Slot, classId: ClassId): string => (slot === 'weapon' ? CLASS_ART[classId].weapon.key : TEX[SLOT_TEX[slot]].key);

/** The art of a piece worn: its rank's piece when drawn, else Tin's; null when the slot has no art at all. */
function pieceFor(scene: Phaser.Scene, g: GearItem, classId: ClassId): string | null {
  const part = partOf(g.slot, classId);
  const key = texOf(g.slot, classId);
  for (const word of [RANK_WORDS[g.rank - 1] ?? 'tin', 'tin']) {
    if (has(scene, key, `${word}_${part}/stand/0001`)) return `${word}_${part}`;
  }
  return null;
}

/** The icon of a piece, for the bag and the loot card, in this class's weapon: its rank's when drawn, else Tin's; null when none. */
export function gearIcon(scene: Phaser.Scene, g: GearItem, classId: ClassId): { texture: string; frame: string } | null {
  const part = partOf(g.slot, classId);
  const key = g.slot === 'weapon' ? CLASS_ART[classId].icons.key : TEX.icons.key;
  for (const word of [RANK_WORDS[g.rank - 1] ?? 'tin', 'tin']) {
    if (has(scene, key, `${word}_${part}`)) return { texture: key, frame: `${word}_${part}` };
  }
  return null;
}

interface Layer {
  key: string;
  piece: string;
}

/** The layers a character's wardrobe calls for, in Mitch, AD's draw order. */
function layersFor(scene: Phaser.Scene, c: Character): Layer[] {
  const eq = c.equipment;
  const art = CLASS_ART[c.classId];
  const body = art.body.key;
  const worn = (slot: Slot): string | null => (eq[slot] ? pieceFor(scene, eq[slot]!, c.classId) : null);
  const cape = worn('cape');
  const boots = worn('boots');
  const coat = worn('armour');
  const gloves = worn('gloves');
  const charm = worn('trinket');
  const hat = worn('helm');
  const sword = worn('weapon');
  const shield = worn('shield');
  const layers: (Layer | null)[] = [
    cape ? { key: TEX.capes.key, piece: cape } : null,
    { key: body, piece: 'body' },
    { key: TEX.boots.key, piece: boots ?? 'boots_base' },
    coat ? { key: TEX.coats.key, piece: coat } : null,
    { key: body, piece: 'far_front' },
    gloves ? { key: TEX.gloves.key, piece: `${gloves}_far` } : null,
    charm ? { key: TEX.charms.key, piece: charm } : null,
    { key: body, piece: 'head' },
    hat ? { key: TEX.hats.key, piece: hat } : { key: body, piece: 'hair' },
    { key: body, piece: 'arm' },
    coat ? { key: TEX.coats.key, piece: `${coat}_near` } : null,
    sword ? { key: art.weapon.key, piece: sword } : null,
    gloves ? { key: TEX.gloves.key, piece: `${gloves}_near` } : { key: body, piece: 'hand' },
    shield ? { key: TEX.shields.key, piece: shield } : null,
  ];
  return layers.filter((l): l is Layer => !!l && has(scene, l.key, `${l.piece}/stand/0001`));
}

/** A hero in layers. `root` is a container whose x, y is where the feet stand; the scene calls `update(delta)` each frame. */
export class Hero {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly scale: number;
  private right = false;
  private layers: { sprite: Phaser.GameObjects.Sprite; key: string; piece: string }[] = [];
  /** This class's own atlas: a frame found there overrides the shared one (the Wizard's and Archer's hands move differently). */
  private bodyKey = '';
  private clip: HeroAction = 'stand';
  private index = 0;
  private elapsed = 0;
  private hold = false;
  private done = false;

  constructor(scene: Phaser.Scene, character: Character, x: number, y: number, scale: number) {
    this.scene = scene;
    this.scale = scale;
    // The size is the standing figure's in file pixels, so the container's displayHeight is the hero's height on screen.
    this.root = scene.add.container(x, y).setSize(200, 300).setScale(scale);
    this.wear(character);
    this.play('stand');
  }

  /** The layers rebuilt from what the character wears; the clip goes on from the same frame. */
  wear(character: Character): void {
    this.bodyKey = CLASS_ART[character.classId].body.key;
    const wanted = layersFor(this.scene, character);
    const same = wanted.length === this.layers.length && wanted.every((l, i) => l.piece === this.layers[i]!.piece && l.key === this.layers[i]!.key);
    if (same) return;
    for (const l of this.layers) l.sprite.destroy();
    this.layers = wanted.map((l) => ({ ...l, sprite: this.scene.add.sprite(0, 0, l.key, `${l.piece}/stand/0001`) }));
    this.root.add(this.layers.map((l) => l.sprite));
    this.apply();
  }

  /** Files face left; true turns the hero to face right. */
  face(right: boolean): void {
    this.right = right;
    this.root.setScale(right ? -this.scale : this.scale, this.scale);
  }

  /** How far into attack1 the blow lands, in ms (the fourth frame, held): the hit's flash waits for it. */
  blowMs(): number {
    return CLIPS.attack1.frames.slice(0, 3).reduce((n, f) => n + f.delay, 0);
  }

  /** Play a clip from its first frame; a one-shot clip goes back to `stand` when it ends unless `hold` is set (a guard holds). */
  play(action: HeroAction, hold = false): void {
    if (!CLIPS[action]) return;
    this.clip = action;
    this.index = 0;
    this.elapsed = 0;
    this.hold = hold || CLIPS[action].hold;
    this.done = false;
    this.root.setAlpha(1);
    this.apply();
  }

  /** The clock: from the scene's update. */
  update(delta: number): void {
    if (this.done || !this.root.active) return;
    const clip = CLIPS[this.clip];
    this.elapsed += delta;
    let frame = clip.frames[this.index]!;
    while (this.elapsed >= frame.delay) {
      this.elapsed -= frame.delay;
      if (this.index + 1 < clip.frames.length) this.index += 1;
      else if (clip.loop) this.index = 0;
      else if (this.hold || this.clip === 'die1') {
        this.done = true;
        this.elapsed = frame.delay;
        break;
      } else {
        this.play('stand');
        return;
      }
      frame = clip.frames[this.index]!;
    }
    this.apply();
  }

  /** Every layer shows the current frame of its piece; the frame's fade, if any, is applied to the whole figure. */
  private apply(): void {
    const clip = CLIPS[this.clip];
    const frame = clip.frames[this.index]!;
    for (const l of this.layers) {
      const name = `${l.piece}/${this.clip}/${frame.n}`;
      const key = has(this.scene, this.bodyKey, name) ? this.bodyKey : l.key;
      const ok = key === this.bodyKey || has(this.scene, key, name);
      l.sprite.setVisible(ok);
      if (ok && (l.sprite.frame.name !== name || l.sprite.texture.key !== key)) l.sprite.setTexture(key, name);
    }
    if (frame.a0 !== undefined && frame.a1 !== undefined) {
      const t = Math.min(1, this.elapsed / Math.max(1, frame.delay));
      this.root.setAlpha((frame.a0 + (frame.a1 - frame.a0) * t) / 255);
    }
  }
}
