// The hero on screen, in layers (chapter 1, step 9; Mitch, AD's Knight body and Tin set, `assets/hero_gear/NOTES.md`):
// one texture per slot, every piece with the same 26 frames and the pivot at the feet, `clips.json` with the delays once.
// A hero is a container of up to fourteen sprites in Mitch, AD's order, each showing its piece's frame of the same clip,
// driven by one clock here (`update`), so the layers never drift apart. What a character wears decides the layers: a hat
// replaces the hair, gloves replace the hand, boots replace the bare boots, a coat is two layers. A piece of a rank that
// has no art yet shows the Tin piece. Files are 2x and face left; `face(true)` flips the whole hero to face right.

import Phaser from 'phaser';
import { UNIQUES, type Character, type ClassId, type GearItem, type Slot, gearKind } from '../../rules/src/index.ts';
import legendIconsJson from '../../assets/legends/icons.json?url';
import legendIconsPng from '../../assets/legends/icons.png';
import legend2IconsJson from '../../assets/legends_2/icons.json?url';
import legend2IconsPng from '../../assets/legends_2/icons.png';
import archerOverJson from '../../assets/hero_classes/archer/gear_over.json?url';
import archerOverPng from '../../assets/hero_classes/archer/gear_over.png';
import clothArcherJson from '../../assets/gear_sets/cloth/cloth_archer.json?url';
import clothArcherPng from '../../assets/gear_sets/cloth/cloth_archer.png';
import leatherArcherJson from '../../assets/gear_sets/leather/leather_archer.json?url';
import leatherArcherPng from '../../assets/gear_sets/leather/leather_archer.png';
import clothJson from '../../assets/gear_sets/cloth/cloth.json?url';
import clothPng from '../../assets/gear_sets/cloth/cloth.png';
import setIconsJson from '../../assets/gear_sets/icons.json?url';
import setIconsPng from '../../assets/gear_sets/icons.png';
import leatherJson from '../../assets/gear_sets/leather/leather.json?url';
import leatherPng from '../../assets/gear_sets/leather/leather.png';
import woodenJson from '../../assets/gear_sets/wooden/wooden.json?url';
import woodenPng from '../../assets/gear_sets/wooden/wooden.png';
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
/** The other kinds of gear (Mitch, AD, 2026-11-02): loaded when a piece of one is worn, so only what is worn costs memory. */
const SETS: Record<string, Tex> = {
  leather: { key: 'set_leather', png: leatherPng, json: leatherJson },
  cloth: { key: 'set_cloth', png: clothPng, json: clothJson },
  wooden: { key: 'set_wooden', png: woodenPng, json: woodenJson },
};
/** The Archer's hands move their own way (Mitch, AD's corrected arm, 2026-11-02): these load only for an Archer. */
// The legendary weapons (Mitch, AD, 2026-11-02): an atlas each, loaded only while worn.
// The second set (Mitch, AD, 2026-11-03) names its frames by the weapon's kind: bonecrusher_great, clockwork_wand.
const LEGEND_FILES = import.meta.glob(['../../assets/legends/*/*.{png,json}', '../../assets/legends_2/*/*.{png,json}'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
for (const [path, url] of Object.entries(LEGEND_FILES)) {
  const m = /legends(?:_2)?\/(\w+)\/\w+\.(png|json)$/.exec(path);
  if (!m) continue;
  const tex = (SETS[m[1]!] ??= { key: `legend_${m[1]!}`, png: '', json: '' });
  if (m[2] === 'png') tex.png = url;
  else tex.json = url;
}
// Weapons and off-hands by kind (Mitch, AD, 2026-11-03, weapons_v2): an atlas each, loaded while worn. Three looks by rank.
const V2_FILES = import.meta.glob('../../assets/weapons_v2/*.{png,json}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const v2 = (name: string): Tex => ({ key: `v2_${name}`, png: V2_FILES[`../../assets/weapons_v2/${name}.png`] ?? '', json: V2_FILES[`../../assets/weapons_v2/${name}.json`] ?? '' });
const V2_ICONS = v2('icons');
const GREAT_ARM = v2('great_arm');
const HUNTER_BODY = v2('hunter_body');
const lookOf = (rank: number): string => (rank <= 3 ? 'plain' : rank <= 6 ? 'fine' : 'grand');

/** A weapon's or an off-hand's own drawing by its kind, or null where the class's own drawn ranks serve (a Warrior's sword, a Rogue's dagger, a Magician's staff, a Hunter's bow). */
function kindArt(g: GearItem, classId: ClassId): { tex: Tex; piece: string } | null {
  const kind = gearKind(g);
  if (!kind) return null;
  const look = lookOf(g.rank);
  if (g.slot === 'weapon') {
    if (kind === 'great') return { tex: v2(`${look}_great`), piece: `${look}_great` };
    if (kind === 'sword' && classId === 'rogue') return { tex: v2(`rogue_${look}_sword`), piece: `${look}_sword` };
    if (kind === 'wand') return { tex: v2('wands'), piece: `${look}_wand` };
    if (kind === 'dagger' && classId === 'ranger') return { tex: v2('hunter_daggers'), piece: g.rank === 1 ? 'tin_dagger' : g.rank === 2 ? 'copper_dagger' : `${look}_dagger` };
    return null;
  }
  if (g.slot === 'shield') return kind.endsWith('_orb') ? { tex: v2('orbs'), piece: kind } : { tex: v2(`shields_${kind}`), piece: `${look}_${kind}` };
  return null;
}

/** The kind atlases a character's hands call for: the pieces, a great weapon's arm, a Hunter's body for a dagger. */
function kindTextures(c: Character): Tex[] {
  const out: Tex[] = [];
  for (const g of [c.equipment.weapon, c.equipment.shield]) {
    const art = g ? kindArt(g, c.classId) : null;
    if (art) out.push(art.tex);
  }
  if (gearKind(c.equipment.weapon) === 'great') out.push(GREAT_ARM);
  if (c.classId === 'ranger' && !holdsBow(c)) out.push(HUNTER_BODY);
  return out;
}

const ARCHER_OVER: Tex = { key: 'hero_gear_over_archer', png: archerOverPng, json: archerOverJson };
const ARCHER_SETS: Record<string, Tex> = {
  set_leather: { key: 'set_leather_archer', png: leatherArcherPng, json: leatherArcherJson },
  set_cloth: { key: 'set_cloth_archer', png: clothArcherPng, json: clothArcherJson },
};
const SET_ICONS: Tex = { key: 'set_icons', png: setIconsPng, json: setIconsJson };
const LEGEND_ICONS: Tex = { key: 'legend_icons', png: legendIconsPng, json: legendIconsJson };
const LEGEND_ICONS_2: Tex = { key: 'legend_icons_2', png: legend2IconsPng, json: legend2IconsJson };
/** A later rank of a kind shows its first set until its own is drawn: Hide as Leather, Linen as Cloth. */
const LINE_SET: Record<string, string> = { light: 'leather', magic: 'cloth' };

/** The atlases every class shares: the gear and its icons. */
const SHARED: readonly Tex[] = [TEX.boots, TEX.capes, TEX.coats, TEX.gloves, TEX.charms, TEX.hats, TEX.shields, TEX.icons, SET_ICONS, LEGEND_ICONS, LEGEND_ICONS_2, V2_ICONS];

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
    if (id === 'ranger' && game.textures.exists(ARCHER_OVER.key)) game.textures.remove(ARCHER_OVER.key);
  }
}

/** Queue the shared gear and these classes' own atlases; call from a scene's preload. */
export function preloadHero(scene: Phaser.Scene, classes: readonly ClassId[]): void {
  const art = [...new Set(classes)].flatMap((c) => [CLASS_ART[c].body, CLASS_ART[c].weapon, CLASS_ART[c].icons, ...(c === 'ranger' ? [ARCHER_OVER] : [])]);
  for (const t of [...SHARED, ...art]) {
    if (!scene.textures.exists(t.key)) scene.load.atlas(t.key, t.png, t.json);
  }
}

export function heroReady(scene: Phaser.Scene, classId: ClassId): boolean {
  const art = CLASS_ART[classId];
  return [...SHARED, art.body, art.weapon, art.icons, ...(classId === 'ranger' ? [ARCHER_OVER] : [])].every((t) => scene.textures.exists(t.key));
}

function has(scene: Phaser.Scene, key: string, frame: string): boolean {
  return scene.textures.exists(key) && scene.textures.get(key).has(frame);
}

const partOf = (slot: Slot, classId: ClassId): string => (slot === 'weapon' ? CLASS_ART[classId].part : SLOT_PART[slot]);
const texOf = (slot: Slot, classId: ClassId): string => (slot === 'weapon' ? CLASS_ART[classId].weapon.key : TEX[SLOT_TEX[slot]].key);

/** The words a piece's art may go by, best first: its own, its kind's first set, its rank, Tin. */
function artWords(g: GearItem): string[] {
  const first = g.base.split(' ')[0]!;
  const legend = g.unique ? UNIQUES[g.unique]?.art : undefined;
  return [...(legend ? [legend] : []), first, ...(g.line && LINE_SET[g.line] ? [LINE_SET[g.line]!] : []), RANK_WORDS[g.rank - 1] ?? 'tin', 'tin'];
}

/** Wooden weapons are named by the item, one drawing for every class. */
const woodenPiece = (g: GearItem): string | null => (g.slot === 'weapon' && g.base === 'wooden stick' ? 'wooden_stick' : null);

/** The art of a piece worn: its atlas and name; null when the slot has no art at all. */
function pieceFor(scene: Phaser.Scene, g: GearItem, classId: ClassId): Layer | null {
  const wood = woodenPiece(g);
  if (wood && has(scene, SETS.wooden!.key, `${wood}/stand/0001`)) return { key: SETS.wooden!.key, piece: wood };
  const legend = g.unique ? UNIQUES[g.unique]?.art : undefined;
  const kind = legend ? null : kindArt(g, classId);
  if (kind && has(scene, kind.tex.key, `${kind.piece}/stand/0001`)) return { key: kind.tex.key, piece: kind.piece };
  const part = partOf(g.slot, classId);
  const own = legend && SETS[legend] ? `${legend}_${gearKind(g)}` : '';
  if (own && has(scene, SETS[legend!]!.key, `${own}/stand/0001`)) return { key: SETS[legend!]!.key, piece: own };
  for (const word of artWords(g)) {
    const key = SETS[word]?.key ?? texOf(g.slot, classId);
    // Gloves come as a near and a far piece; some atlases hold no plain one.
    if (has(scene, key, `${word}_${part}/stand/0001`) || has(scene, key, `${word}_${part}_near/stand/0001`)) return { key, piece: `${word}_${part}` };
  }
  return null;
}

/** An Archer with a bow, not a wooden weapon: their hands use their own frames. */
const holdsBow = (c: Character): boolean => c.classId === 'ranger' && !!c.equipment.weapon && !woodenPiece(c.equipment.weapon) && gearKind(c.equipment.weapon) === 'bow';

/** The sets this character wears that are not loaded yet. */
function missingSets(scene: Phaser.Scene, c: Character): Tex[] {
  const out = new Set<Tex>();
  for (const g of Object.values(c.equipment)) {
    if (!g) continue;
    const word = woodenPiece(g) ? 'wooden' : artWords(g).find((w) => SETS[w]);
    const set = word ? SETS[word] : undefined;
    if (set && !scene.textures.exists(set.key)) out.add(set);
    const own = set && holdsBow(c) ? ARCHER_SETS[set.key] : undefined;
    if (own && !scene.textures.exists(own.key)) out.add(own);
  }
  for (const k of kindTextures(c)) if (k.png && !scene.textures.exists(k.key)) out.add(k);
  return [...out];
}

/** The sets worn, for a scene's preload. */
export function preloadWornSets(scene: Phaser.Scene, characters: readonly Character[]): void {
  for (const c of characters) for (const t of missingSets(scene, c)) scene.load.atlas(t.key, t.png, t.json);
}

/** The icon of a piece, for the bag and the loot card, in this class's weapon: its own when drawn, else its rank's, else Tin's; null when none. */
export function gearIcon(scene: Phaser.Scene, g: GearItem, classId: ClassId): { texture: string; frame: string } | null {
  const wood = woodenPiece(g);
  if (wood && has(scene, SET_ICONS.key, wood)) return { texture: SET_ICONS.key, frame: wood };
  const part = partOf(g.slot, classId);
  const legend = g.unique ? UNIQUES[g.unique]?.art : undefined;
  for (const atlas of legend ? [LEGEND_ICONS, LEGEND_ICONS_2] : []) {
    for (const frame of [`${legend}_${gearKind(g)}`, `${legend}_${part}`]) if (has(scene, atlas.key, frame)) return { texture: atlas.key, frame };
  }
  // A piece of a new kind by its look (Mitch, AD's icons, 2026-11-03).
  const kind = gearKind(g);
  const iconName = kind?.endsWith('_orb') ? kind : kind ? `${lookOf(g.rank)}_${kind}` : '';
  if (!legend && kind && kindArt(g, classId) && has(scene, V2_ICONS.key, iconName)) return { texture: V2_ICONS.key, frame: iconName };
  for (const word of artWords(g)) {
    if (has(scene, SET_ICONS.key, `${word}_${part}`)) return { texture: SET_ICONS.key, frame: `${word}_${part}` };
    const key = g.slot === 'weapon' ? CLASS_ART[classId].icons.key : TEX.icons.key;
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
  const worn = (slot: Slot): Layer | null => (eq[slot] ? pieceFor(scene, eq[slot]!, c.classId) : null);
  const cape = worn('cape');
  const boots = worn('boots');
  const coat = worn('armour');
  const gloves = worn('gloves');
  const charm = worn('trinket');
  const hat = worn('helm');
  const sword = worn('weapon');
  const shield = worn('shield');
  // What is held decides the arms (Mitch, AD's corrected arm, 2026-11-02). An Archer's shield hangs on the bow arm, with no change.
  const archer = holdsBow(c);
  const great = gearKind(eq.weapon) === 'great' && scene.textures.exists(GREAT_ARM.key);
  const shielded = !!shield && !archer;
  const emptyHanded = !sword && !archer;
  const woodenBow = archer && !!eq.weapon && !!woodenPiece(eq.weapon);
  /** The first of these pieces the atlas has. */
  const first = (key: string, ...pieces: string[]): Layer => ({ key, piece: pieces.find((p) => has(scene, key, `${p}/stand/0001`)) ?? pieces[pieces.length - 1]! });
  const layers: (Layer | null)[] = [
    cape,
    shielded || great ? null : { key: body, piece: 'far_back' },
    { key: body, piece: 'body' },
    boots ?? { key: TEX.boots.key, piece: 'boots_base' },
    coat,
    great ? { key: GREAT_ARM.key, piece: 'far_front_great' } : shielded ? first(body, 'far_front_shield', 'far_front') : { key: body, piece: 'far_front' },
    gloves ? (great ? (has(scene, GREAT_ARM.key, `${gloves.piece}_far_great/stand/0001`) ? { key: GREAT_ARM.key, piece: `${gloves.piece}_far_great` } : null) : shielded ? first(gloves.key, `${gloves.piece}_far_shield`, `${gloves.piece}_far`) : { key: gloves.key, piece: `${gloves.piece}_far` }) : null,
    charm,
    { key: body, piece: 'head' },
    hat ?? { key: body, piece: 'hair' },
    { key: body, piece: 'arm' },
    coat ? { key: coat.key, piece: `${coat.piece}_near` } : null,
    sword,
    gloves
      ? emptyHanded
        ? first(gloves.key, `${gloves.piece}_near_open`, `${gloves.piece}_near`)
        : { key: gloves.key, piece: `${gloves.piece}_near` }
      : emptyHanded
        ? first(body, 'hand_open', 'hand')
        : woodenBow
          ? first(body, 'hand_grip', 'hand')
          : { key: body, piece: 'hand' },
    shield,
  ];
  // far_back and far_front are empty in many frames, so their atlas may have no standing frame: they stay, and are hidden where they have none.
  return layers.filter((l): l is Layer => !!l && (l.piece.startsWith('far_') || has(scene, l.key, `${l.piece}/stand/0001`)));
}

const OWN_ATTACK: Partial<Record<ClassId, string>> = { mage: 'attack1_wizard', ranger: 'attack1_archer' };

/** A hero in layers. `root` is a container whose x, y is where the feet stand; the scene calls `update(delta)` each frame. */
export class Hero {
  /** How fast the clip runs: a combo's swings run quick. */
  private speed = 1;
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly scale: number;
  private right = false;
  private layers: { sprite: Phaser.GameObjects.Sprite; key: string; piece: string }[] = [];
  /** This class's own atlas: a frame found there overrides the shared one (the Wizard's and Archer's hands move differently). */
  private bodyKey = '';
  private classId: ClassId = 'warrior';
  private bow = false;
  private character: Character | null = null;
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
    // A Hunter with no bow stands on the Warrior's moves (Mitch, AD's hunter_body, 2026-11-03).
    this.bodyKey = character.classId === 'ranger' && !holdsBow(character) && this.scene.textures.exists(HUNTER_BODY.key) ? HUNTER_BODY.key : CLASS_ART[character.classId].body.key;
    this.classId = character.classId;
    this.bow = holdsBow(character);
    this.character = character;
    const missing = missingSets(this.scene, character);
    if (missing.length) {
      // Tin shows for the moment it takes; then the real piece.
      for (const t of missing) this.scene.load.atlas(t.key, t.png, t.json);
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        if (this.root.active && this.character) this.wear(this.character);
      });
      this.scene.load.start();
    }
    const wanted = layersFor(this.scene, character);
    const same = wanted.length === this.layers.length && wanted.every((l, i) => l.piece === this.layers[i]!.piece && l.key === this.layers[i]!.key);
    if (same) return;
    for (const l of this.layers) l.sprite.destroy();
    this.layers = wanted.map((l) => ({ ...l, sprite: this.scene.add.sprite(0, 0, l.key, has(this.scene, l.key, `${l.piece}/stand/0001`) ? `${l.piece}/stand/0001` : undefined).setVisible(false) }));
    this.root.add(this.layers.map((l) => l.sprite));
    this.apply();
  }

  /** Files face left; true turns the hero to face right. */
  face(right: boolean): void {
    this.right = right;
    this.root.setScale(right ? -this.scale : this.scale, this.scale);
  }

  /** How far into attack1 the blow lands, in ms (the fourth frame, held): the hit's flash waits for it. */
  blowMs(speed = 1): number {
    return CLIPS.attack1.frames.slice(0, 3).reduce((n, f) => n + f.delay, 0) / speed;
  }

  /** Play a clip from its first frame; a one-shot clip goes back to `stand` when it ends unless `hold` is set (a guard holds). */
  play(action: HeroAction, hold = false, speed = 1): void {
    if (!CLIPS[action]) return;
    this.speed = speed;
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
    this.elapsed += delta * this.speed;
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

  /** Where a layer's frame comes from, best first: a class's own frames, then the piece's. */
  private frameFor(l: { key: string; piece: string }, plain: string, n: string): [string, string] {
    if (this.classId === 'ranger' && this.bow) {
      if (has(this.scene, ARCHER_OVER.key, plain)) return [ARCHER_OVER.key, plain];
      const set = ARCHER_SETS[l.key];
      const own = `${l.piece}/${this.clip}_archer/${n}`;
      if (this.bow && set && has(this.scene, set.key, own)) return [set.key, own];
    }
    const attack = this.clip === 'attack1' && OWN_ATTACK[this.classId] && (this.classId !== 'ranger' || this.bow) ? `${l.piece}/${OWN_ATTACK[this.classId]}/${n}` : '';
    if (attack && has(this.scene, l.key, attack)) return [l.key, attack];
    return [has(this.scene, this.bodyKey, plain) ? this.bodyKey : l.key, plain];
  }

  /** Every layer shows the current frame of its piece; the frame's fade, if any, is applied to the whole figure. */
  private apply(): void {
    const clip = CLIPS[this.clip];
    const frame = clip.frames[this.index]!;
    for (const l of this.layers) {
      const plain = `${l.piece}/${this.clip}/${frame.n}`;
      const [key, name] = this.frameFor(l, plain, frame.n);
      const ok = has(this.scene, key, name);
      l.sprite.setVisible(ok);
      if (ok && (l.sprite.frame.name !== name || l.sprite.texture.key !== key)) l.sprite.setTexture(key, name);
    }
    if (frame.a0 !== undefined && frame.a1 !== undefined) {
      const t = Math.min(1, this.elapsed / Math.max(1, frame.delay));
      this.root.setAlpha((frame.a0 + (frame.a1 - frame.a0) * t) / 255);
    }
  }
}
